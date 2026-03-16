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
