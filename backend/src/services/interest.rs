use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::interest::*;
use crate::models::listing::{
    Listing, ListingResponse, ListingWithAuthor, PaginatedResponse, PaginationMeta,
};

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
    query: &SavedListingsQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let user_str = user_id.to_string();

    let mut type_filter = String::new();
    let mut bind_values: Vec<String> = vec![user_str.clone()];

    if let Some(ar) = &query.author_role {
        type_filter = " AND l.author_role = ?".to_string();
        bind_values.push(ar.clone());
    }

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

    let per_page = query.per_page();
    let total_pages = total.div_ceil(per_page).max(1);

    Ok(PaginatedResponse {
        data: listings.into_iter().map(Into::into).collect(),
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
    read_db: &SqlitePool,
) -> Result<Vec<ReceivedInterest>, AppError> {
    let rows = sqlx::query_as::<_, ReceivedInterest>(
        "SELECT i.id, u.display_name AS user_name, \
         l.title AS listing_title, i.created_at \
         FROM interests i \
         JOIN listings l ON l.id = i.listing_id \
         JOIN users u ON u.id = i.user_id \
         WHERE l.author_id = ? \
         ORDER BY i.created_at DESC",
    )
    .bind(user_id.to_string())
    .fetch_all(read_db)
    .await?;

    Ok(rows)
}

pub async fn get_matches(
    user_id: &Uuid,
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
         WHERE i1.user_id = ?",
    )
    .bind(user_id.to_string())
    .bind(user_id.to_string())
    .fetch_all(read_db)
    .await?;

    Ok(matches)
}
