use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

use crate::auth::jwt;
use crate::config::Config;
use crate::error::AppError;
use crate::models::user::User;

#[derive(Debug, serde::Serialize)]
pub struct TokenResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub needs_profile_setup: Option<bool>,
}

pub async fn determine_active_role(
    user_id: &str,
    db: &SqlitePool,
) -> Result<Option<String>, AppError> {
    let has_individual = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM individual_profiles WHERE user_id = ?)",
    )
    .bind(user_id)
    .fetch_one(db)
    .await?;

    let has_organization = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM organization_profiles WHERE user_id = ?)",
    )
    .bind(user_id)
    .fetch_one(db)
    .await?;

    if has_individual {
        Ok(Some("individual".into()))
    } else if has_organization {
        Ok(Some("organization".into()))
    } else {
        Ok(None)
    }
}

pub async fn switch_role(
    user_id: &str,
    target_role: &str,
    read_db: &SqlitePool,
    write_db: &SqlitePool,
    config: &Config,
) -> Result<TokenResponse, AppError> {
    if !["individual", "organization"].contains(&target_role) {
        return Err(AppError::BadRequest("Invalid role".into()));
    }

    let table = if target_role == "individual" {
        "individual_profiles"
    } else {
        "organization_profiles"
    };
    let exists = sqlx::query_scalar::<_, bool>(&format!(
        "SELECT EXISTS(SELECT 1 FROM {} WHERE user_id = ?)",
        table
    ))
    .bind(user_id)
    .fetch_one(read_db)
    .await?;

    if !exists {
        return Err(AppError::BadRequest(format!(
            "Create a {} profile first",
            target_role
        )));
    }

    let user_uuid =
        Uuid::parse_str(user_id).map_err(|_| AppError::Internal("Invalid user ID".into()))?;
    let family_id = Uuid::new_v4();

    let access_token = jwt::encode_access_token(&user_uuid, target_role, config)?;
    let refresh_token = jwt::encode_refresh_token(&user_uuid, &family_id, config)?;
    let refresh_hash = jwt::hash_token(&refresh_token);

    let id = Uuid::new_v4().to_string();
    let family_str = family_id.to_string();
    let expires_at = Utc::now()
        .checked_add_signed(chrono::Duration::seconds(
            config.jwt_refresh_expiry_secs as i64,
        ))
        .unwrap()
        .to_rfc3339();

    sqlx::query(
        "INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(user_id)
    .bind(&refresh_hash)
    .bind(&family_str)
    .bind(&expires_at)
    .execute(write_db)
    .await?;

    Ok(TokenResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".into(),
        expires_in: config.jwt_access_expiry_secs,
        needs_profile_setup: None,
    })
}

pub async fn issue_tokens(
    user: &User,
    write_db: &SqlitePool,
    config: &Config,
) -> Result<TokenResponse, AppError> {
    let user_id =
        Uuid::parse_str(&user.id).map_err(|_| AppError::Internal("Invalid user ID".into()))?;
    let family_id = Uuid::new_v4();

    let active_role = determine_active_role(&user.id, write_db).await?;
    let needs_profile_setup = active_role.is_none();
    let role_for_token = active_role.unwrap_or_else(|| "individual".into());

    let access_token = jwt::encode_access_token(&user_id, &role_for_token, config)?;
    let refresh_token = jwt::encode_refresh_token(&user_id, &family_id, config)?;
    let refresh_hash = jwt::hash_token(&refresh_token);

    let id = Uuid::new_v4().to_string();
    let family_str = family_id.to_string();
    let expires_at = Utc::now()
        .checked_add_signed(chrono::Duration::seconds(
            config.jwt_refresh_expiry_secs as i64,
        ))
        .unwrap()
        .to_rfc3339();

    sqlx::query(
        "INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at) VALUES (?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&user.id)
    .bind(&refresh_hash)
    .bind(&family_str)
    .bind(&expires_at)
    .execute(write_db)
    .await?;

    Ok(TokenResponse {
        access_token,
        refresh_token,
        token_type: "Bearer".into(),
        expires_in: config.jwt_access_expiry_secs,
        needs_profile_setup: if needs_profile_setup {
            Some(true)
        } else {
            None
        },
    })
}

pub async fn refresh_tokens(
    refresh_token: &str,
    requested_role: Option<&str>,
    write_db: &SqlitePool,
    config: &Config,
) -> Result<TokenResponse, AppError> {
    // Clean up expired refresh tokens
    sqlx::query("DELETE FROM refresh_tokens WHERE expires_at < datetime('now')")
        .execute(write_db)
        .await?;

    let claims = jwt::decode_refresh_token(refresh_token, config)?;
    let token_hash = jwt::hash_token(refresh_token);

    let mut tx = write_db.begin().await?;

    // Look up the refresh token
    let row = sqlx::query_as::<_, (String, String, String)>(
        "SELECT id, user_id, family_id FROM refresh_tokens WHERE token_hash = ? AND expires_at > datetime('now')"
    )
    .bind(&token_hash)
    .fetch_optional(&mut *tx)
    .await?;

    match row {
        Some((token_id, user_id, family_id)) => {
            // Delete the used token
            sqlx::query("DELETE FROM refresh_tokens WHERE id = ?")
                .bind(&token_id)
                .execute(&mut *tx)
                .await?;

            // Determine active role from profiles (inline to use transaction)
            let has_individual = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM individual_profiles WHERE user_id = ?)",
            )
            .bind(&user_id)
            .fetch_one(&mut *tx)
            .await?;

            let has_organization = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM organization_profiles WHERE user_id = ?)",
            )
            .bind(&user_id)
            .fetch_one(&mut *tx)
            .await?;

            let role_for_token = match requested_role {
                Some("organization") if has_organization => "organization".to_string(),
                Some("individual") if has_individual => "individual".to_string(),
                _ if has_individual => "individual".to_string(),
                _ if has_organization => "organization".to_string(),
                _ => "individual".to_string(),
            };

            // Issue new tokens with same family
            let uid = Uuid::parse_str(&user_id)
                .map_err(|_| AppError::Internal("Invalid user ID".into()))?;
            let fid = Uuid::parse_str(&family_id)
                .map_err(|_| AppError::Internal("Invalid family ID".into()))?;

            let new_access = jwt::encode_access_token(&uid, &role_for_token, config)?;
            let new_refresh = jwt::encode_refresh_token(&uid, &fid, config)?;
            let new_hash = jwt::hash_token(&new_refresh);

            let new_id = Uuid::new_v4().to_string();
            let expires_at = Utc::now()
                .checked_add_signed(chrono::Duration::seconds(
                    config.jwt_refresh_expiry_secs as i64,
                ))
                .unwrap()
                .to_rfc3339();

            sqlx::query(
                "INSERT INTO refresh_tokens (id, user_id, token_hash, family_id, expires_at) VALUES (?, ?, ?, ?, ?)"
            )
            .bind(&new_id)
            .bind(&user_id)
            .bind(&new_hash)
            .bind(&family_id)
            .bind(&expires_at)
            .execute(&mut *tx)
            .await?;

            tx.commit().await?;

            Ok(TokenResponse {
                access_token: new_access,
                refresh_token: new_refresh,
                token_type: "Bearer".into(),
                expires_in: config.jwt_access_expiry_secs,
                needs_profile_setup: None,
            })
        }
        None => {
            // Token not found — possible theft. Revoke all tokens in this family.
            sqlx::query("DELETE FROM refresh_tokens WHERE family_id = ?")
                .bind(&claims.family_id)
                .execute(&mut *tx)
                .await?;

            tx.commit().await?;

            Err(AppError::Unauthorized(
                "Refresh token invalid or reused — all sessions revoked".into(),
            ))
        }
    }
}

pub async fn logout(user_id: &str, write_db: &SqlitePool) -> Result<(), AppError> {
    sqlx::query("DELETE FROM refresh_tokens WHERE user_id = ?")
        .bind(user_id)
        .execute(write_db)
        .await?;
    Ok(())
}

// Magic link

pub async fn create_magic_link_token(
    email: &str,
    write_db: &SqlitePool,
) -> Result<String, AppError> {
    // Clean up expired magic link tokens
    sqlx::query("DELETE FROM magic_link_tokens WHERE expires_at < datetime('now')")
        .execute(write_db)
        .await?;

    let raw_token = jwt::generate_raw_token();
    let token_hash = jwt::hash_token(&raw_token);
    let id = Uuid::new_v4().to_string();
    let expires_at = Utc::now()
        .checked_add_signed(chrono::Duration::minutes(15))
        .unwrap()
        .to_rfc3339();

    sqlx::query(
        "INSERT INTO magic_link_tokens (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(email)
    .bind(&token_hash)
    .bind(&expires_at)
    .execute(write_db)
    .await?;

    Ok(raw_token)
}

pub async fn verify_magic_link_token(
    email: &str,
    token: &str,
    write_db: &SqlitePool,
) -> Result<User, AppError> {
    let token_hash = jwt::hash_token(token);

    let mut tx = write_db.begin().await?;

    let row = sqlx::query_as::<_, (String,)>(
        "SELECT id FROM magic_link_tokens WHERE email = ? AND token_hash = ? AND used = 0 AND expires_at > datetime('now')"
    )
    .bind(email)
    .bind(&token_hash)
    .fetch_optional(&mut *tx)
    .await?;

    let (token_id,) =
        row.ok_or_else(|| AppError::Unauthorized("Invalid or expired magic link".into()))?;

    // Mark as used
    sqlx::query("UPDATE magic_link_tokens SET used = 1 WHERE id = ?")
        .bind(&token_id)
        .execute(&mut *tx)
        .await?;

    // Find or create user
    let user = find_or_create_email_user_tx(email, &mut tx).await?;

    tx.commit().await?;

    Ok(user)
}

async fn find_or_create_email_user_tx(
    email: &str,
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
) -> Result<User, AppError> {
    if let Some(user) = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(email)
        .fetch_optional(&mut **tx)
        .await?
    {
        return Ok(user);
    }

    let id = Uuid::new_v4().to_string();
    let display_name = email.split('@').next().unwrap_or("User").to_string();

    sqlx::query(
        "INSERT INTO users (id, email, display_name, auth_provider) VALUES (?, ?, ?, 'email')",
    )
    .bind(&id)
    .bind(email)
    .bind(&display_name)
    .execute(&mut **tx)
    .await?;

    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(&mut **tx)
        .await
        .map_err(Into::into)
}

// Google OAuth

#[derive(Debug, serde::Deserialize)]
struct GoogleTokenResponse {
    id_token: String,
}

#[derive(Debug, serde::Deserialize)]
struct GoogleIdTokenPayload {
    sub: String,
    email: String,
    name: Option<String>,
}

pub async fn exchange_google_code(
    code: &str,
    write_db: &SqlitePool,
    config: &Config,
) -> Result<User, AppError> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", code),
            ("client_id", &config.google_client_id),
            ("client_secret", &config.google_client_secret),
            ("redirect_uri", &config.google_redirect_uri),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| AppError::Internal(format!("Google token exchange failed: {e}")))?;

    if !res.status().is_success() {
        let body = res.text().await.unwrap_or_default();
        tracing::error!("Google OAuth error response: {body}");
        return Err(AppError::BadRequest(
            "Google OAuth authentication failed".into(),
        ));
    }

    let token_res: GoogleTokenResponse = res
        .json()
        .await
        .map_err(|e| AppError::Internal(format!("Failed to parse Google response: {e}")))?;

    // Decode the ID token payload (without verification — Google already verified it)
    let parts: Vec<&str> = token_res.id_token.split('.').collect();
    if parts.len() != 3 {
        return Err(AppError::Internal("Invalid Google ID token".into()));
    }

    use base64::Engine;
    let payload_bytes = base64::engine::general_purpose::URL_SAFE_NO_PAD
        .decode(parts[1])
        .map_err(|_| AppError::Internal("Failed to decode Google ID token".into()))?;

    let payload: GoogleIdTokenPayload = serde_json::from_slice(&payload_bytes)
        .map_err(|_| AppError::Internal("Failed to parse Google ID token payload".into()))?;

    // Find or create user
    if let Some(user) = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE auth_provider = 'google' AND auth_provider_id = ?",
    )
    .bind(&payload.sub)
    .fetch_optional(write_db)
    .await?
    {
        return Ok(user);
    }

    // Check if email exists from magic link
    if let Some(user) = sqlx::query_as::<_, User>("SELECT * FROM users WHERE email = ?")
        .bind(&payload.email)
        .fetch_optional(write_db)
        .await?
    {
        // Link Google account
        sqlx::query("UPDATE users SET auth_provider = 'google', auth_provider_id = ? WHERE id = ?")
            .bind(&payload.sub)
            .bind(&user.id)
            .execute(write_db)
            .await?;
        return sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
            .bind(&user.id)
            .fetch_one(write_db)
            .await
            .map_err(Into::into);
    }

    // Create new user
    let id = Uuid::new_v4().to_string();
    let display_name = payload.name.unwrap_or_else(|| {
        payload
            .email
            .split('@')
            .next()
            .unwrap_or("User")
            .to_string()
    });

    sqlx::query(
        "INSERT INTO users (id, email, display_name, auth_provider, auth_provider_id) VALUES (?, ?, ?, 'google', ?)"
    )
    .bind(&id)
    .bind(&payload.email)
    .bind(&display_name)
    .bind(&payload.sub)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}
