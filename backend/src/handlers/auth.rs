use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::services::auth as auth_service;
use crate::services::email as email_service;
use crate::AppState;

#[derive(Deserialize)]
pub struct GoogleAuthRequest {
    pub code: String,
}

#[derive(Deserialize)]
pub struct MagicLinkRequest {
    pub email: String,
}

#[derive(Deserialize)]
pub struct MagicLinkLoginRequest {
    pub email: String,
}

#[derive(Deserialize)]
pub struct MagicLinkVerifyRequest {
    pub email: String,
    pub token: String,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
    pub active_role: Option<String>,
}

pub async fn google_auth(
    State(state): State<AppState>,
    Json(req): Json<GoogleAuthRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let user =
        auth_service::exchange_google_code(&req.code, &state.write_db, &state.config).await?;
    let tokens = auth_service::issue_tokens(&user, &state.write_db, &state.config).await?;
    Ok(Json(tokens))
}

pub async fn request_magic_link(
    State(state): State<AppState>,
    Json(req): Json<MagicLinkRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    create_and_send_magic_link(&req.email, &state).await
}

pub async fn request_magic_link_login(
    State(state): State<AppState>,
    Json(req): Json<MagicLinkLoginRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    let user: Option<crate::models::user::User> =
        sqlx::query_as("SELECT * FROM users WHERE email = ?")
            .bind(&req.email)
            .fetch_optional(&state.read_db)
            .await?;

    if user.is_some() {
        // Only actually send the magic link if the account exists
        let _ = create_and_send_magic_link(&req.email, &state).await;
    }

    Ok(Json(serde_json::json!({
        "message": "If an account exists, a magic link has been sent"
    })))
}

async fn create_and_send_magic_link(
    email: &str,
    state: &AppState,
) -> Result<Json<serde_json::Value>, AppError> {
    let raw_token = auth_service::create_magic_link_token(email, &state.write_db).await?;

    let magic_link = format!(
        "{}?token={}&email={}",
        state.config.magic_link_base_url,
        raw_token,
        urlencoding::encode(email)
    );

    email_service::send_magic_link_email(email, &magic_link, &state.config).await?;

    Ok(Json(serde_json::json!({
        "message": "Magic link sent to your email"
    })))
}

pub async fn verify_magic_link(
    State(state): State<AppState>,
    Json(req): Json<MagicLinkVerifyRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let user =
        auth_service::verify_magic_link_token(&req.email, &req.token, &state.write_db).await?;
    let tokens = auth_service::issue_tokens(&user, &state.write_db, &state.config).await?;
    Ok(Json(tokens))
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let tokens = auth_service::refresh_tokens(
        &req.refresh_token,
        req.active_role.as_deref(),
        &state.write_db,
        &state.config,
    )
    .await?;
    Ok(Json(tokens))
}

#[derive(Deserialize)]
pub struct SwitchRoleRequest {
    pub role: String,
}

pub async fn switch_role(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<SwitchRoleRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let tokens = auth_service::switch_role(
        &auth.user_id.to_string(),
        &req.role,
        &state.read_db,
        &state.write_db,
        &state.config,
    )
    .await?;
    Ok(Json(tokens))
}

pub async fn logout(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    auth_service::logout(&auth.user_id.to_string(), &state.write_db).await?;
    Ok(Json(serde_json::json!({"message": "Logged out"})))
}
