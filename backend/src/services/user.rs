use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::user::*;

pub async fn get_user_by_id(user_id: &Uuid, read_db: &SqlitePool) -> Result<User, AppError> {
    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id.to_string())
        .fetch_one(read_db)
        .await
        .map_err(Into::into)
}

pub async fn update_user(
    user_id: &Uuid,
    req: &UpdateUserRequest,
    write_db: &SqlitePool,
) -> Result<User, AppError> {
    sqlx::query("UPDATE users SET display_name = ? WHERE id = ?")
        .bind(&req.display_name)
        .bind(user_id.to_string())
        .execute(write_db)
        .await?;

    sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id.to_string())
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}

pub async fn get_developer_profile(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<DeveloperProfile, AppError> {
    sqlx::query_as::<_, DeveloperProfile>(
        "SELECT * FROM developer_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await
    .map_err(Into::into)
}

pub async fn update_developer_profile(
    user_id: &str,
    req: &UpdateDeveloperProfileRequest,
    write_db: &SqlitePool,
) -> Result<DeveloperProfile, AppError> {
    let current = sqlx::query_as::<_, DeveloperProfile>(
        "SELECT * FROM developer_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await?;

    let bio = req.bio.as_deref().unwrap_or(&current.bio);
    let tech_stack = req
        .tech_stack
        .as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default())
        .unwrap_or(current.tech_stack);
    let github_url = req.github_url.as_deref().or(current.github_url.as_deref());
    let linkedin_url = req.linkedin_url.as_deref().or(current.linkedin_url.as_deref());
    let level = req.level.as_deref().unwrap_or(&current.level);
    let contact_email = req.contact_email.as_deref().or(current.contact_email.as_deref());

    if let Some(lvl) = &req.level {
        if !["junior", "mid", "senior"].contains(&lvl.as_str()) {
            return Err(AppError::BadRequest("Invalid level".into()));
        }
    }

    sqlx::query(
        "UPDATE developer_profiles SET bio = ?, tech_stack = ?, github_url = ?, linkedin_url = ?, level = ?, contact_email = ? WHERE user_id = ?"
    )
    .bind(bio)
    .bind(&tech_stack)
    .bind(github_url)
    .bind(linkedin_url)
    .bind(level)
    .bind(contact_email)
    .bind(user_id)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, DeveloperProfile>(
        "SELECT * FROM developer_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await
    .map_err(Into::into)
}

pub async fn get_profile_preview(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<ProfilePreview, AppError> {
    sqlx::query_as::<_, ProfilePreview>(
        "SELECT u.id AS user_id, u.display_name, u.role, \
         CASE WHEN u.role = 'developer' \
           THEN COALESCE(SUBSTR(dp.bio, 1, 150), '') \
           ELSE COALESCE(SUBSTR(cp.description, 1, 150), '') \
         END AS bio_excerpt, \
         CASE WHEN u.role = 'developer' \
           THEN COALESCE(dp.tech_stack, '[]') \
           ELSE COALESCE(cp.tech_stack, '[]') \
         END AS tech_stack, \
         CASE WHEN u.role = 'developer' \
           THEN COALESCE(dp.level, '') \
           ELSE COALESCE(cp.size, '') \
         END AS level_or_size, \
         (SELECT COUNT(*) FROM listings WHERE author_id = u.id AND status = 'active') AS active_listing_count \
         FROM users u \
         LEFT JOIN developer_profiles dp ON dp.user_id = u.id \
         LEFT JOIN company_profiles cp ON cp.user_id = u.id \
         WHERE u.id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await
    .map_err(Into::into)
}

pub async fn get_company_profile(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<CompanyProfile, AppError> {
    sqlx::query_as::<_, CompanyProfile>(
        "SELECT * FROM company_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await
    .map_err(Into::into)
}

pub async fn update_company_profile(
    user_id: &str,
    req: &UpdateCompanyProfileRequest,
    write_db: &SqlitePool,
) -> Result<CompanyProfile, AppError> {
    let current = sqlx::query_as::<_, CompanyProfile>(
        "SELECT * FROM company_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await?;

    let company_name = req.company_name.as_deref().unwrap_or(&current.company_name);
    let description = req.description.as_deref().unwrap_or(&current.description);
    let website = req.website.as_deref().or(current.website.as_deref());
    let size = req.size.as_deref().unwrap_or(&current.size);
    let tech_stack = req
        .tech_stack
        .as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default())
        .unwrap_or(current.tech_stack);
    let contact_email = req.contact_email.as_deref().or(current.contact_email.as_deref());

    if let Some(s) = &req.size {
        if !["startup", "small", "medium", "large"].contains(&s.as_str()) {
            return Err(AppError::BadRequest("Invalid company size".into()));
        }
    }

    sqlx::query(
        "UPDATE company_profiles SET company_name = ?, description = ?, website = ?, size = ?, tech_stack = ?, contact_email = ? WHERE user_id = ?"
    )
    .bind(company_name)
    .bind(description)
    .bind(website)
    .bind(size)
    .bind(&tech_stack)
    .bind(contact_email)
    .bind(user_id)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, CompanyProfile>(
        "SELECT * FROM company_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await
    .map_err(Into::into)
}

pub async fn delete_account(user_id: &Uuid, write_db: &SqlitePool) -> Result<(), AppError> {
    let uid = user_id.to_string();
    let mut tx = write_db.begin().await?;

    // Close active listings
    sqlx::query("UPDATE listings SET status = 'closed' WHERE author_id = ? AND status = 'active'")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Withdraw pending applications
    sqlx::query("UPDATE applications SET status = 'withdrawn' WHERE applicant_id = ? AND status = 'pending'")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Clear review comments authored by user
    sqlx::query("UPDATE outcome_reviews SET comment = '' WHERE reviewer_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Anonymize developer profile
    sqlx::query(
        "UPDATE developer_profiles SET bio = '', tech_stack = '[]', github_url = NULL, linkedin_url = NULL, contact_email = NULL WHERE user_id = ?",
    )
    .bind(&uid)
    .execute(&mut *tx)
    .await?;

    // Anonymize company profile
    sqlx::query(
        "UPDATE company_profiles SET company_name = '[Deleted]', description = '', website = NULL, tech_stack = '[]', contact_email = NULL WHERE user_id = ?",
    )
    .bind(&uid)
    .execute(&mut *tx)
    .await?;

    // Delete auth tokens
    sqlx::query("DELETE FROM refresh_tokens WHERE user_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    sqlx::query("DELETE FROM magic_link_tokens WHERE email = (SELECT email FROM users WHERE id = ?)")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Delete notifications & preferences
    sqlx::query("DELETE FROM notifications WHERE user_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    sqlx::query("DELETE FROM notification_preferences WHERE user_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Delete saved listings & interests
    sqlx::query("DELETE FROM saved_listings WHERE user_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    sqlx::query("DELETE FROM interests WHERE user_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Delete messages sent by user
    sqlx::query("DELETE FROM messages WHERE sender_id = ?")
        .bind(&uid)
        .execute(&mut *tx)
        .await?;

    // Anonymize user record
    let deleted_email = format!("deleted_{}@deleted.local", uid);
    sqlx::query(
        "UPDATE users SET email = ?, display_name = '[Deleted User]', auth_provider_id = NULL, deleted_at = datetime('now') WHERE id = ?",
    )
    .bind(&deleted_email)
    .bind(&uid)
    .execute(&mut *tx)
    .await?;

    tx.commit().await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    async fn setup_test_db() -> SqlitePool {
        let pool = SqlitePoolOptions::new()
            .connect_with(
                SqliteConnectOptions::new()
                    .filename(format!("/tmp/test_delete_{}.db", Uuid::new_v4()))
                    .create_if_missing(true)
                    .foreign_keys(true),
            )
            .await
            .unwrap();
        sqlx::migrate!().run(&pool).await.unwrap();
        pool
    }

    #[tokio::test]
    async fn test_delete_account_anonymizes_user() {
        let db = setup_test_db().await;
        let user_id = Uuid::new_v4();
        let uid = user_id.to_string();

        // Insert user
        sqlx::query(
            "INSERT INTO users (id, email, role, display_name, auth_provider) VALUES (?, ?, 'developer', 'Test User', 'email')",
        )
        .bind(&uid)
        .bind("test@example.com")
        .execute(&db)
        .await
        .unwrap();

        // Insert developer profile
        sqlx::query(
            "INSERT INTO developer_profiles (user_id, bio, tech_stack, level) VALUES (?, 'My bio', '[\"rust\"]', 'mid')",
        )
        .bind(&uid)
        .execute(&db)
        .await
        .unwrap();

        // Insert listing
        let listing_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO listings (id, author_id, title, description, type, format, duration_weeks, tech_stack, status, visibility) \
             VALUES (?, ?, 'Test', 'Desc', 'developer', 'remote', 4, '[\"rust\"]', 'active', 'public')",
        )
        .bind(&listing_id)
        .bind(&uid)
        .execute(&db)
        .await
        .unwrap();

        // Insert notification
        sqlx::query(
            "INSERT INTO notifications (id, user_id, kind, title, body, link) VALUES (?, ?, 'new_message', 'Title', 'Body', '/test')",
        )
        .bind(Uuid::new_v4().to_string())
        .bind(&uid)
        .execute(&db)
        .await
        .unwrap();

        // Delete account
        delete_account(&user_id, &db).await.unwrap();

        // Verify user anonymized
        let (email, name, deleted): (String, String, Option<String>) =
            sqlx::query_as("SELECT email, display_name, deleted_at FROM users WHERE id = ?")
                .bind(&uid)
                .fetch_one(&db)
                .await
                .unwrap();
        assert!(email.starts_with("deleted_"));
        assert_eq!(name, "[Deleted User]");
        assert!(deleted.is_some());

        // Verify listing closed
        let status: String =
            sqlx::query_scalar("SELECT status FROM listings WHERE id = ?")
                .bind(&listing_id)
                .fetch_one(&db)
                .await
                .unwrap();
        assert_eq!(status, "closed");

        // Verify profile anonymized
        let bio: String =
            sqlx::query_scalar("SELECT bio FROM developer_profiles WHERE user_id = ?")
                .bind(&uid)
                .fetch_one(&db)
                .await
                .unwrap();
        assert_eq!(bio, "");

        // Verify notifications deleted
        let count: i64 =
            sqlx::query_scalar("SELECT COUNT(*) FROM notifications WHERE user_id = ?")
                .bind(&uid)
                .fetch_one(&db)
                .await
                .unwrap();
        assert_eq!(count, 0);
    }
}
