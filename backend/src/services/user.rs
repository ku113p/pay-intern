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

pub async fn get_user_response(user_id: &str, db: &SqlitePool) -> Result<UserResponse, AppError> {
    let user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(user_id)
        .fetch_one(db)
        .await?;

    let has_individual = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM individual_profiles WHERE user_id = ?)",
    )
    .bind(user_id)
    .fetch_one(db)
    .await
    .unwrap_or(false);

    let has_organization = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(SELECT 1 FROM organization_profiles WHERE user_id = ?)",
    )
    .bind(user_id)
    .fetch_one(db)
    .await
    .unwrap_or(false);

    Ok(UserResponse {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        has_individual_profile: has_individual,
        has_organization_profile: has_organization,
        created_at: user.created_at,
    })
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

pub async fn get_individual_profile(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<IndividualProfile, AppError> {
    sqlx::query_as::<_, IndividualProfile>(
        "SELECT * FROM individual_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await
    .map_err(Into::into)
}

pub async fn upsert_individual_profile(
    user_id: &str,
    req: &UpdateIndividualProfileRequest,
    write_db: &SqlitePool,
) -> Result<IndividualProfile, AppError> {
    let existing = sqlx::query_as::<_, IndividualProfile>(
        "SELECT * FROM individual_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_optional(write_db)
    .await?;

    if let Some(ref current) = existing {
        let bio = req.bio.as_deref().unwrap_or(&current.bio);
        let headline = req.headline.as_deref().unwrap_or(&current.headline);
        let profession = req.profession.as_deref().unwrap_or(&current.profession);
        let skills = req
            .skills
            .as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_default())
            .unwrap_or_else(|| current.skills.clone());
        let experience_level = req.experience_level.as_deref().unwrap_or(&current.experience_level);
        let contact_email = req.contact_email.as_deref().or(current.contact_email.as_deref());

        if let Some(p) = &req.profession {
            validate_category(p)?;
        }
        if let Some(lvl) = &req.experience_level {
            if !["entry", "mid", "senior", "expert"].contains(&lvl.as_str()) {
                return Err(AppError::BadRequest("Invalid experience_level".into()));
            }
        }

        sqlx::query(
            "UPDATE individual_profiles SET bio = ?, headline = ?, profession = ?, skills = ?, experience_level = ?, contact_email = ? WHERE user_id = ?"
        )
        .bind(bio)
        .bind(headline)
        .bind(profession)
        .bind(&skills)
        .bind(experience_level)
        .bind(contact_email)
        .bind(user_id)
        .execute(write_db)
        .await?;
    } else {
        let bio = req.bio.as_deref().unwrap_or("");
        let headline = req.headline.as_deref().unwrap_or("");
        let profession = req.profession.as_deref().unwrap_or("other");
        let skills = req
            .skills
            .as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_default())
            .unwrap_or_else(|| "[]".into());
        let experience_level = req.experience_level.as_deref().unwrap_or("entry");
        let contact_email = req.contact_email.as_deref();

        if let Some(p) = &req.profession {
            validate_category(p)?;
        }

        sqlx::query(
            "INSERT INTO individual_profiles (user_id, bio, headline, profession, skills, experience_level, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(user_id)
        .bind(bio)
        .bind(headline)
        .bind(profession)
        .bind(&skills)
        .bind(experience_level)
        .bind(contact_email)
        .execute(write_db)
        .await?;
    }

    sqlx::query_as::<_, IndividualProfile>(
        "SELECT * FROM individual_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await
    .map_err(Into::into)
}

pub async fn get_organization_profile(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<OrganizationProfile, AppError> {
    sqlx::query_as::<_, OrganizationProfile>(
        "SELECT * FROM organization_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await
    .map_err(Into::into)
}

pub async fn upsert_organization_profile(
    user_id: &str,
    req: &UpdateOrganizationProfileRequest,
    write_db: &SqlitePool,
) -> Result<OrganizationProfile, AppError> {
    let existing = sqlx::query_as::<_, OrganizationProfile>(
        "SELECT * FROM organization_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_optional(write_db)
    .await?;

    if let Some(ref current) = existing {
        let organization_name = req.organization_name.as_deref().unwrap_or(&current.organization_name);
        let description = req.description.as_deref().unwrap_or(&current.description);
        let industry = req.industry.as_deref().unwrap_or(&current.industry);
        let size = req.size.as_deref().unwrap_or(&current.size);
        let skills_sought = req
            .skills_sought
            .as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_default())
            .unwrap_or_else(|| current.skills_sought.clone());
        let contact_email = req.contact_email.as_deref().or(current.contact_email.as_deref());

        if let Some(i) = &req.industry {
            validate_category(i)?;
        }
        if let Some(s) = &req.size {
            if !["solo", "startup", "small", "medium", "large", "enterprise"].contains(&s.as_str()) {
                return Err(AppError::BadRequest("Invalid size".into()));
            }
        }

        sqlx::query(
            "UPDATE organization_profiles SET organization_name = ?, description = ?, industry = ?, size = ?, skills_sought = ?, contact_email = ? WHERE user_id = ?"
        )
        .bind(organization_name)
        .bind(description)
        .bind(industry)
        .bind(size)
        .bind(&skills_sought)
        .bind(contact_email)
        .bind(user_id)
        .execute(write_db)
        .await?;
    } else {
        let organization_name = req.organization_name.as_deref().unwrap_or("My Organization");
        let description = req.description.as_deref().unwrap_or("");
        let industry = req.industry.as_deref().unwrap_or("other");
        let size = req.size.as_deref().unwrap_or("startup");
        let skills_sought = req
            .skills_sought
            .as_ref()
            .map(|s| serde_json::to_string(s).unwrap_or_default())
            .unwrap_or_else(|| "[]".into());
        let contact_email = req.contact_email.as_deref();

        if let Some(i) = &req.industry {
            validate_category(i)?;
        }

        sqlx::query(
            "INSERT INTO organization_profiles (user_id, organization_name, description, industry, size, skills_sought, contact_email) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(user_id)
        .bind(organization_name)
        .bind(description)
        .bind(industry)
        .bind(size)
        .bind(&skills_sought)
        .bind(contact_email)
        .execute(write_db)
        .await?;
    }

    sqlx::query_as::<_, OrganizationProfile>(
        "SELECT * FROM organization_profiles WHERE user_id = ?",
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await
    .map_err(Into::into)
}

pub async fn get_profile_links(
    user_id: &str,
    profile_type: &str,
    read_db: &SqlitePool,
) -> Result<Vec<ProfileLink>, AppError> {
    sqlx::query_as::<_, ProfileLink>(
        "SELECT * FROM profile_links WHERE user_id = ? AND profile_type = ? ORDER BY display_order",
    )
    .bind(user_id)
    .bind(profile_type)
    .fetch_all(read_db)
    .await
    .map_err(Into::into)
}

pub async fn replace_profile_links(
    user_id: &str,
    profile_type: &str,
    links: &[ProfileLinkInput],
    write_db: &SqlitePool,
) -> Result<Vec<ProfileLink>, AppError> {
    // Delete existing links
    sqlx::query("DELETE FROM profile_links WHERE user_id = ? AND profile_type = ?")
        .bind(user_id)
        .bind(profile_type)
        .execute(write_db)
        .await?;

    // Insert new links
    for (i, link) in links.iter().enumerate() {
        let valid_types = ["github", "linkedin", "portfolio", "website", "twitter", "dribbble", "behance", "stackoverflow", "other"];
        if !valid_types.contains(&link.link_type.as_str()) {
            return Err(AppError::BadRequest(format!("Invalid link_type: {}", link.link_type)));
        }

        let id = Uuid::new_v4().to_string();
        let order = link.display_order.unwrap_or(i as i32);
        sqlx::query(
            "INSERT INTO profile_links (id, user_id, profile_type, link_type, label, url, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(&id)
        .bind(user_id)
        .bind(profile_type)
        .bind(&link.link_type)
        .bind(&link.label)
        .bind(&link.url)
        .bind(order)
        .execute(write_db)
        .await?;
    }

    get_profile_links(user_id, profile_type, write_db).await
}

pub async fn delete_profile(
    user_id: &str,
    profile_type: &str,
    write_db: &SqlitePool,
) -> Result<(), AppError> {
    // Check the user has the other profile
    let other_table = if profile_type == "individual" {
        "organization_profiles"
    } else {
        "individual_profiles"
    };
    let has_other = sqlx::query_scalar::<_, bool>(
        &format!("SELECT EXISTS(SELECT 1 FROM {} WHERE user_id = ?)", other_table)
    )
    .bind(user_id)
    .fetch_one(write_db)
    .await?;

    if !has_other {
        return Err(AppError::BadRequest("Cannot delete your only profile".into()));
    }

    let table = if profile_type == "individual" {
        "individual_profiles"
    } else {
        "organization_profiles"
    };
    sqlx::query(&format!("DELETE FROM {} WHERE user_id = ?", table))
        .bind(user_id)
        .execute(write_db)
        .await?;

    // Delete associated links
    sqlx::query("DELETE FROM profile_links WHERE user_id = ? AND profile_type = ?")
        .bind(user_id)
        .bind(profile_type)
        .execute(write_db)
        .await?;

    Ok(())
}

pub async fn get_profile_preview(
    user_id: &str,
    read_db: &SqlitePool,
) -> Result<ProfilePreview, AppError> {
    sqlx::query_as::<_, ProfilePreview>(
        "SELECT u.id AS user_id, u.display_name, \
         COALESCE(SUBSTR(ip.bio, 1, 150), SUBSTR(op.description, 1, 150), '') AS bio_excerpt, \
         COALESCE(ip.skills, op.skills_sought, '[]') AS skills, \
         COALESCE(ip.experience_level, op.size, '') AS level_or_size, \
         (SELECT COUNT(*) FROM listings WHERE author_id = u.id AND status = 'active') AS active_listing_count, \
         (ip.user_id IS NOT NULL) AS has_individual_profile, \
         (op.user_id IS NOT NULL) AS has_organization_profile \
         FROM users u \
         LEFT JOIN individual_profiles ip ON ip.user_id = u.id \
         LEFT JOIN organization_profiles op ON op.user_id = u.id \
         WHERE u.id = ?",
    )
    .bind(user_id)
    .fetch_one(read_db)
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

    // Anonymize individual profile (no-op if doesn't exist)
    sqlx::query(
        "UPDATE individual_profiles SET bio = '', headline = '', skills = '[]', contact_email = NULL WHERE user_id = ?",
    )
    .bind(&uid)
    .execute(&mut *tx)
    .await?;

    // Anonymize organization profile (no-op if doesn't exist)
    sqlx::query(
        "UPDATE organization_profiles SET organization_name = '[Deleted]', description = '', skills_sought = '[]', contact_email = NULL WHERE user_id = ?",
    )
    .bind(&uid)
    .execute(&mut *tx)
    .await?;

    // Delete profile links
    sqlx::query("DELETE FROM profile_links WHERE user_id = ?")
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

fn validate_category(cat: &str) -> Result<(), AppError> {
    let valid = ["technology", "design", "marketing", "finance", "legal", "education", "healthcare", "engineering", "creative", "business", "trades", "other"];
    if !valid.contains(&cat) {
        return Err(AppError::BadRequest(format!("Invalid category: {}", cat)));
    }
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

        // Insert user (no role column)
        sqlx::query(
            "INSERT INTO users (id, email, display_name, auth_provider) VALUES (?, ?, 'Test User', 'email')",
        )
        .bind(&uid)
        .bind("test@example.com")
        .execute(&db)
        .await
        .unwrap();

        // Insert individual profile
        sqlx::query(
            "INSERT INTO individual_profiles (user_id, bio, skills, experience_level) VALUES (?, 'My bio', '[\"rust\"]', 'mid')",
        )
        .bind(&uid)
        .execute(&db)
        .await
        .unwrap();

        // Insert listing
        let listing_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO listings (id, author_id, title, description, author_role, format, duration_weeks, skills, status, visibility, category) \
             VALUES (?, ?, 'Test', 'Desc', 'individual', 'remote', 4, '[\"rust\"]', 'active', 'public', 'technology')",
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
            sqlx::query_scalar("SELECT bio FROM individual_profiles WHERE user_id = ?")
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
