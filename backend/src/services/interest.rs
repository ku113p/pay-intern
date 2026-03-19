use std::collections::HashSet;

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::application::ContactInfoResponse;
use crate::models::interest::*;
use crate::models::listing::{
    Listing, ListingResponse, ListingWithAuthor, PaginatedResponse, PaginationMeta,
};
use crate::models::user::{ProfileLink, User};
use crate::services::notification as notif_service;

pub async fn save_listing(
    user_id: &Uuid,
    listing_id: &str,
    write_db: &SqlitePool,
) -> Result<SaveToggleResponse, AppError> {
    // Verify listing exists
    sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(listing_id)
        .fetch_optional(write_db)
        .await?
        .ok_or_else(|| AppError::NotFound("Listing not found".into()))?;

    let id = Uuid::new_v4().to_string();
    sqlx::query("INSERT OR IGNORE INTO saved_listings (id, user_id, listing_id) VALUES (?, ?, ?)")
        .bind(&id)
        .bind(user_id.to_string())
        .bind(listing_id)
        .execute(write_db)
        .await?;

    Ok(SaveToggleResponse { saved: true })
}

pub async fn unsave_listing(
    user_id: &Uuid,
    listing_id: &str,
    write_db: &SqlitePool,
) -> Result<SaveToggleResponse, AppError> {
    sqlx::query("DELETE FROM saved_listings WHERE user_id = ? AND listing_id = ?")
        .bind(user_id.to_string())
        .bind(listing_id)
        .execute(write_db)
        .await?;

    Ok(SaveToggleResponse { saved: false })
}

pub async fn get_saved_listings(
    user_id: &Uuid,
    active_role: &str,
    query: &SavedListingsQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let user_str = user_id.to_string();

    let type_filter = " AND l.author_role = ?".to_string();
    let bind_values: Vec<String> = vec![
        user_str.clone(),
        crate::models::opposite_role(active_role).to_string(),
    ];

    let count_sql = format!(
        "SELECT COUNT(*) FROM saved_listings sl JOIN listings l ON l.id = sl.listing_id WHERE sl.user_id = ?{type_filter}"
    );
    let mut count_q = sqlx::query_scalar::<_, i64>(&count_sql);
    for v in &bind_values {
        count_q = count_q.bind(v);
    }
    let total = count_q.fetch_one(read_db).await? as u32;

    let select_sql = format!(
        "SELECT l.id, l.author_id, l.author_role, l.title, l.description, l.category, l.skills, \
         l.duration_weeks, l.price_usd, l.payment_direction, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         op.organization_name AS organization_name, \
         ip.experience_level AS individual_level, \
         SUBSTR(u.email, INSTR(u.email, '@') + 1) AS author_email_domain \
         FROM saved_listings sl \
         JOIN listings l ON l.id = sl.listing_id \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN organization_profiles op ON op.user_id = l.author_id \
         LEFT JOIN individual_profiles ip ON ip.user_id = l.author_id \
         WHERE sl.user_id = ?{type_filter} \
         ORDER BY sl.created_at DESC LIMIT ? OFFSET ?"
    );
    let mut select_q = sqlx::query_as::<_, ListingWithAuthor>(&select_sql);
    for v in &bind_values {
        select_q = select_q.bind(v);
    }
    select_q = select_q.bind(query.per_page() as i64);
    select_q = select_q.bind(query.offset() as i64);
    let listings = select_q.fetch_all(read_db).await?;

    let mut data: Vec<ListingResponse> = listings.into_iter().map(Into::into).collect();

    // Batch-load is_interested state
    // Dynamic placeholders needed because SQLx doesn't support binding a list
    let listing_ids: Vec<&str> = data.iter().map(|r| r.id.as_str()).collect();
    let interested_ids: HashSet<String> = if !listing_ids.is_empty() {
        let placeholders = listing_ids
            .iter()
            .map(|_| "?")
            .collect::<Vec<_>>()
            .join(",");
        let sql = format!(
            "SELECT listing_id FROM interests WHERE user_id = ? AND listing_id IN ({placeholders})"
        );
        let mut q = sqlx::query_scalar::<_, String>(&sql).bind(&user_str);
        for id in &listing_ids {
            q = q.bind(*id);
        }
        q.fetch_all(read_db).await?.into_iter().collect()
    } else {
        HashSet::new()
    };

    for r in &mut data {
        r.is_saved = true;
        r.is_interested = interested_ids.contains(&r.id);
    }

    let per_page = query.per_page();
    let total_pages = total.div_ceil(per_page).max(1);

    Ok(PaginatedResponse {
        data,
        pagination: PaginationMeta {
            page: query.page(),
            per_page,
            total,
            total_pages,
        },
    })
}

pub async fn add_interest(
    user_id: &Uuid,
    listing_id: &str,
    write_db: &SqlitePool,
) -> Result<InterestToggleResponse, AppError> {
    let listing =
        sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ? AND status = 'active'")
            .bind(listing_id)
            .fetch_optional(write_db)
            .await?
            .ok_or_else(|| AppError::NotFound("Listing not found or not active".into()))?;

    // Cannot interest own listing
    if listing.author_id == user_id.to_string() {
        return Err(AppError::BadRequest(
            "Cannot signal interest on your own listing".into(),
        ));
    }

    let id = Uuid::new_v4().to_string();
    let insert_result =
        sqlx::query("INSERT OR IGNORE INTO interests (id, user_id, listing_id) VALUES (?, ?, ?)")
            .bind(&id)
            .bind(user_id.to_string())
            .bind(listing_id)
            .execute(write_db)
            .await?;

    // Check for mutual match
    let matched = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM interests i \
         JOIN listings l ON l.id = i.listing_id \
         WHERE i.user_id = ? AND l.author_id = ?",
    )
    .bind(&listing.author_id)
    .bind(user_id.to_string())
    .fetch_one(write_db)
    .await?
        > 0;

    // Only notify on a newly inserted interest (rows_affected == 0 means it already existed)
    if insert_result.rows_affected() > 0 {
        let user_display_name =
            sqlx::query_scalar::<_, String>("SELECT display_name FROM users WHERE id = ?")
                .bind(user_id.to_string())
                .fetch_optional(write_db)
                .await?
                .unwrap_or_else(|| "Someone".to_string());

        if matched {
            let author_display_name =
                sqlx::query_scalar::<_, String>("SELECT display_name FROM users WHERE id = ?")
                    .bind(&listing.author_id)
                    .fetch_optional(write_db)
                    .await?
                    .unwrap_or_else(|| "Someone".to_string());

            let _ = notif_service::create_notification(
                &user_id.to_string(),
                "mutual_match",
                "It's a Match!",
                &format!("You matched with {}!", author_display_name),
                "/matches",
                write_db,
            )
            .await;
            let _ = notif_service::create_notification(
                &listing.author_id,
                "mutual_match",
                "It's a Match!",
                &format!("You matched with {}!", user_display_name),
                "/matches",
                write_db,
            )
            .await;
        } else {
            let _ = notif_service::create_notification(
                &listing.author_id,
                "interest_received",
                "New Interest in Your Listing",
                &format!(
                    "{} is interested in \"{}\"",
                    user_display_name, listing.title
                ),
                "/matches",
                write_db,
            )
            .await;
        }
    }

    Ok(InterestToggleResponse {
        interested: true,
        matched,
    })
}

pub async fn remove_interest(
    user_id: &Uuid,
    listing_id: &str,
    write_db: &SqlitePool,
) -> Result<InterestToggleResponse, AppError> {
    sqlx::query("DELETE FROM interests WHERE user_id = ? AND listing_id = ?")
        .bind(user_id.to_string())
        .bind(listing_id)
        .execute(write_db)
        .await?;

    Ok(InterestToggleResponse {
        interested: false,
        matched: false,
    })
}

pub async fn get_received_interests(
    user_id: &Uuid,
    active_role: &str,
    read_db: &SqlitePool,
) -> Result<Vec<ReceivedInterest>, AppError> {
    let rows = sqlx::query_as::<_, ReceivedInterest>(
        "SELECT i.id, u.display_name AS user_name, \
         l.title AS listing_title, i.created_at \
         FROM interests i \
         JOIN listings l ON l.id = i.listing_id \
         JOIN users u ON u.id = i.user_id \
         WHERE l.author_id = ? AND l.author_role = ? \
         ORDER BY i.created_at DESC",
    )
    .bind(user_id.to_string())
    .bind(active_role)
    .fetch_all(read_db)
    .await?;

    Ok(rows)
}

pub async fn get_matches(
    user_id: &Uuid,
    active_role: &str,
    read_db: &SqlitePool,
) -> Result<Vec<MatchResponse>, AppError> {
    let matches = sqlx::query_as::<_, MatchResponse>(
        "SELECT DISTINCT \
         other_user.id AS matched_user_id, \
         other_user.display_name AS matched_user_name, \
         my_listing.id AS my_listing_id, \
         my_listing.title AS my_listing_title, \
         their_listing.id AS their_listing_id, \
         their_listing.title AS their_listing_title \
         FROM interests i1 \
         JOIN listings their_listing ON their_listing.id = i1.listing_id \
         JOIN users other_user ON other_user.id = their_listing.author_id \
         JOIN interests i2 ON i2.user_id = other_user.id \
         JOIN listings my_listing ON my_listing.id = i2.listing_id AND my_listing.author_id = ? \
         WHERE i1.user_id = ? AND my_listing.author_role = ?",
    )
    .bind(user_id.to_string())
    .bind(user_id.to_string())
    .bind(active_role)
    .fetch_all(read_db)
    .await?;

    Ok(matches)
}

pub async fn get_match_contact_info(
    caller_id: &Uuid,
    matched_user_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<ContactInfoResponse, AppError> {
    let caller_str = caller_id.to_string();
    let matched_str = matched_user_id.to_string();

    // Verify mutual match: caller interested in matched_user's listing AND vice versa
    let is_matched = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM interests i1 \
         JOIN listings l1 ON l1.id = i1.listing_id AND l1.author_id = ? \
         WHERE i1.user_id = ? \
         AND EXISTS ( \
             SELECT 1 FROM interests i2 \
             JOIN listings l2 ON l2.id = i2.listing_id AND l2.author_id = ? \
             WHERE i2.user_id = ? \
         )",
    )
    .bind(&matched_str)
    .bind(&caller_str)
    .bind(&caller_str)
    .bind(&matched_str)
    .fetch_one(read_db)
    .await?;

    if is_matched == 0 {
        return Err(AppError::Forbidden(
            "Contact info is only available for mutual matches".into(),
        ));
    }

    let other_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(&matched_str)
        .fetch_optional(read_db)
        .await?
        .ok_or_else(|| AppError::NotFound("User not found".into()))?;

    // Try individual profile first, then organization profile
    let contact_email: Option<String> = sqlx::query_scalar(
        "SELECT contact_email FROM individual_profiles WHERE user_id = ? AND contact_email IS NOT NULL",
    )
    .bind(&matched_str)
    .fetch_optional(read_db)
    .await?;

    let contact_email = match contact_email {
        Some(email) => Some(email),
        None => {
            sqlx::query_scalar(
                "SELECT contact_email FROM organization_profiles WHERE user_id = ? AND contact_email IS NOT NULL",
            )
            .bind(&matched_str)
            .fetch_optional(read_db)
            .await?
        }
    };

    let links = sqlx::query_as::<_, ProfileLink>(
        "SELECT * FROM profile_links WHERE user_id = ? ORDER BY display_order",
    )
    .bind(&matched_str)
    .fetch_all(read_db)
    .await?;

    // Fall back to auth email if no contact_email is set on either profile
    let email = contact_email.unwrap_or(other_user.email);

    Ok(ContactInfoResponse {
        user_id: other_user.id,
        display_name: other_user.display_name,
        email,
        links: links.into_iter().map(Into::into).collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::interest::SavedListingsQuery;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    async fn setup_test_db() -> SqlitePool {
        let db_path = format!("/tmp/test_interest_{}.db", Uuid::new_v4());
        let migrate_pool = SqlitePoolOptions::new()
            .connect_with(
                SqliteConnectOptions::new()
                    .filename(&db_path)
                    .create_if_missing(true)
                    .foreign_keys(false),
            )
            .await
            .unwrap();
        sqlx::migrate!().run(&migrate_pool).await.unwrap();
        migrate_pool.close().await;
        SqlitePoolOptions::new()
            .connect_with(
                SqliteConnectOptions::new()
                    .filename(&db_path)
                    .foreign_keys(true),
            )
            .await
            .unwrap()
    }

    async fn insert_user(db: &SqlitePool, id: &str, email: &str) {
        sqlx::query(
            "INSERT INTO users (id, email, display_name, auth_provider) VALUES (?, ?, 'Test', 'email')",
        )
        .bind(id)
        .bind(email)
        .execute(db)
        .await
        .unwrap();
    }

    async fn insert_listing(db: &SqlitePool, id: &str, author_id: &str, author_role: &str) {
        sqlx::query(
            "INSERT INTO listings (id, author_id, title, description, author_role, format, duration_weeks, skills, status, visibility, category) \
             VALUES (?, ?, 'Test', 'Desc', ?, 'remote', 4, '[\"rust\"]', 'active', 'public', 'technology')",
        )
        .bind(id)
        .bind(author_id)
        .bind(author_role)
        .execute(db)
        .await
        .unwrap();
    }

    #[tokio::test]
    async fn test_saved_listings_scoped_to_opposite_role() {
        let db = setup_test_db().await;
        let user_id = Uuid::new_v4();
        let uid = user_id.to_string();
        insert_user(&db, &uid, "saver@test.com").await;

        let other_ind = Uuid::new_v4().to_string();
        let other_org = Uuid::new_v4().to_string();
        insert_user(&db, &other_ind, "ind@test.com").await;
        insert_user(&db, &other_org, "org@test.com").await;

        let ind_listing = Uuid::new_v4().to_string();
        let org_listing = Uuid::new_v4().to_string();
        insert_listing(&db, &ind_listing, &other_ind, "individual").await;
        insert_listing(&db, &org_listing, &other_org, "organization").await;

        // Save both listings
        for lid in [&ind_listing, &org_listing] {
            sqlx::query("INSERT INTO saved_listings (id, user_id, listing_id) VALUES (?, ?, ?)")
                .bind(Uuid::new_v4().to_string())
                .bind(&uid)
                .bind(lid)
                .execute(&db)
                .await
                .unwrap();
        }

        let query = SavedListingsQuery {
            page: None,
            per_page: None,
        };

        // Individual user should see org saved listings
        let result = get_saved_listings(&user_id, "individual", &query, &db)
            .await
            .unwrap();
        assert_eq!(result.data.len(), 1);
        assert_eq!(result.data[0].author_role, "organization");

        // Org user should see individual saved listings
        let result = get_saved_listings(&user_id, "organization", &query, &db)
            .await
            .unwrap();
        assert_eq!(result.data.len(), 1);
        assert_eq!(result.data[0].author_role, "individual");
    }

    #[tokio::test]
    async fn test_received_interests_scoped_by_role() {
        let db = setup_test_db().await;
        let owner_id = Uuid::new_v4();
        let owner = owner_id.to_string();
        let other = Uuid::new_v4().to_string();
        insert_user(&db, &owner, "owner@test.com").await;
        insert_user(&db, &other, "other@test.com").await;

        let ind_listing = Uuid::new_v4().to_string();
        insert_listing(&db, &ind_listing, &owner, "individual").await;

        // Other user expresses interest in owner's individual listing
        sqlx::query("INSERT INTO interests (id, user_id, listing_id) VALUES (?, ?, ?)")
            .bind(Uuid::new_v4().to_string())
            .bind(&other)
            .bind(&ind_listing)
            .execute(&db)
            .await
            .unwrap();

        // Owner in individual mode sees the interest
        let result = get_received_interests(&owner_id, "individual", &db)
            .await
            .unwrap();
        assert_eq!(result.len(), 1);

        // Owner in org mode sees nothing
        let result = get_received_interests(&owner_id, "organization", &db)
            .await
            .unwrap();
        assert_eq!(result.len(), 0);
    }
}
