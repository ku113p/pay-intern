use std::collections::HashSet;

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::listing::*;

pub async fn create_listing(
    author_id: &Uuid,
    author_role: &str,
    req: &CreateListingRequest,
    write_db: &SqlitePool,
) -> Result<Listing, AppError> {
    if !["individual", "organization"].contains(&author_role) {
        return Err(AppError::BadRequest("Invalid role".into()));
    }

    if !["remote", "onsite", "hybrid"].contains(&req.format.as_str()) {
        return Err(AppError::BadRequest("Invalid format".into()));
    }

    // If outcome_criteria provided, validate at least 3 items
    if let Some(criteria) = &req.outcome_criteria {
        if criteria.len() < 3 {
            return Err(AppError::BadRequest(
                "Outcome criteria require at least 3 items".into(),
            ));
        }
    }

    if let Some(price) = req.price_usd {
        if price < 0.0 {
            return Err(AppError::BadRequest("Price must be non-negative".into()));
        }
    }

    let payment_direction = req
        .payment_direction
        .as_deref()
        .unwrap_or("organization_pays");
    if ![
        "organization_pays",
        "individual_pays",
        "negotiable",
        "unpaid",
    ]
    .contains(&payment_direction)
    {
        return Err(AppError::BadRequest("Invalid payment_direction".into()));
    }

    let id = Uuid::new_v4().to_string();
    let skills = serde_json::to_string(&req.skills).unwrap_or_default();
    let outcome_criteria = req
        .outcome_criteria
        .as_ref()
        .map(|c| serde_json::to_string(c).unwrap_or_default());
    let visibility = req.visibility.as_deref().unwrap_or("public");

    if !["public", "authenticated", "private"].contains(&visibility) {
        return Err(AppError::BadRequest("Invalid visibility".into()));
    }

    let experience_level = req.experience_level.as_deref().unwrap_or("any");
    if !["entry", "mid", "senior", "expert", "any"].contains(&experience_level) {
        return Err(AppError::BadRequest(
            "experience_level must be entry, mid, senior, expert, or any".into(),
        ));
    }

    let category = req.category.as_deref().unwrap_or("other");
    super::user::validate_category(category)?;

    sqlx::query(
        "INSERT INTO listings (id, author_id, author_role, title, description, category, skills, duration_weeks, price_usd, payment_direction, format, outcome_criteria, visibility, experience_level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')"
    )
    .bind(&id)
    .bind(author_id.to_string())
    .bind(author_role)
    .bind(&req.title)
    .bind(&req.description)
    .bind(category)
    .bind(&skills)
    .bind(req.duration_weeks)
    .bind(req.price_usd)
    .bind(payment_direction)
    .bind(&req.format)
    .bind(&outcome_criteria)
    .bind(visibility)
    .bind(experience_level)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(&id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}

pub async fn get_listing(
    id: &str,
    viewer_id: Option<&Uuid>,
    read_db: &SqlitePool,
) -> Result<ListingWithAuthor, AppError> {
    let listing = sqlx::query_as::<_, ListingWithAuthor>(
        "SELECT l.id, l.author_id, l.author_role, l.title, l.description, l.category, l.skills, \
         l.duration_weeks, l.price_usd, l.payment_direction, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         op.organization_name AS organization_name, \
         ip.experience_level AS individual_level, \
         SUBSTR(u.email, INSTR(u.email, '@') + 1) AS author_email_domain \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN organization_profiles op ON op.user_id = l.author_id \
         LEFT JOIN individual_profiles ip ON ip.user_id = l.author_id \
         WHERE l.id = ?",
    )
    .bind(id)
    .fetch_one(read_db)
    .await?;

    // Visibility check
    match listing.visibility.as_str() {
        "public" => Ok(listing),
        "authenticated" => {
            if viewer_id.is_some() {
                Ok(listing)
            } else {
                Err(AppError::Unauthorized("Authentication required".into()))
            }
        }
        "private" => {
            if viewer_id.map(|v| v.to_string()) == Some(listing.author_id.clone()) {
                Ok(listing)
            } else {
                Err(AppError::NotFound("Listing not found".into()))
            }
        }
        _ => Ok(listing),
    }
}

pub async fn update_listing(
    id: &str,
    owner_id: &Uuid,
    req: &UpdateListingRequest,
    write_db: &SqlitePool,
) -> Result<Listing, AppError> {
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(id)
        .fetch_one(write_db)
        .await?;

    if listing.author_id != owner_id.to_string() {
        return Err(AppError::Forbidden("Not the listing owner".into()));
    }

    if listing.status == "closed" {
        return Err(AppError::BadRequest("Cannot edit a closed listing".into()));
    }

    let title = req.title.as_deref().unwrap_or(&listing.title);
    let description = req.description.as_deref().unwrap_or(&listing.description);
    let category = req.category.as_deref().unwrap_or(&listing.category);
    super::user::validate_category(category)?;
    let skills = req
        .skills
        .as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default())
        .unwrap_or(listing.skills);
    let duration_weeks = req.duration_weeks.unwrap_or(listing.duration_weeks);
    let price_usd = req.price_usd.or(listing.price_usd);
    let payment_direction = req
        .payment_direction
        .as_deref()
        .unwrap_or(&listing.payment_direction);
    if ![
        "organization_pays",
        "individual_pays",
        "negotiable",
        "unpaid",
    ]
    .contains(&payment_direction)
    {
        return Err(AppError::BadRequest("Invalid payment_direction".into()));
    }
    let format = req.format.as_deref().unwrap_or(&listing.format);
    // If outcome_criteria provided in the update, validate at least 3 items
    if let Some(criteria) = &req.outcome_criteria {
        if criteria.len() < 3 {
            return Err(AppError::BadRequest(
                "Outcome criteria require at least 3 items".into(),
            ));
        }
    }
    let outcome_criteria = req
        .outcome_criteria
        .as_ref()
        .map(|c| serde_json::to_string(c).unwrap_or_default())
        .or(listing.outcome_criteria);
    let visibility = req.visibility.as_deref().unwrap_or(&listing.visibility);
    let status = req.status.as_deref().unwrap_or(&listing.status);
    if !["active", "closed", "paused", "draft"].contains(&status) {
        return Err(AppError::BadRequest("Invalid status".into()));
    }
    let experience_level = req
        .experience_level
        .as_deref()
        .unwrap_or(&listing.experience_level);

    sqlx::query(
        "UPDATE listings SET title = ?, description = ?, category = ?, skills = ?, duration_weeks = ?, price_usd = ?, payment_direction = ?, format = ?, outcome_criteria = ?, visibility = ?, status = ?, experience_level = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(title)
    .bind(description)
    .bind(category)
    .bind(&skills)
    .bind(duration_weeks)
    .bind(price_usd)
    .bind(payment_direction)
    .bind(format)
    .bind(&outcome_criteria)
    .bind(visibility)
    .bind(status)
    .bind(experience_level)
    .bind(id)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}

pub async fn delete_listing(
    id: &str,
    owner_id: &Uuid,
    write_db: &SqlitePool,
) -> Result<(), AppError> {
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(id)
        .fetch_one(write_db)
        .await?;

    if listing.author_id != owner_id.to_string() {
        return Err(AppError::Forbidden("Not the listing owner".into()));
    }

    sqlx::query("UPDATE listings SET status = 'closed', updated_at = datetime('now') WHERE id = ?")
        .bind(id)
        .execute(write_db)
        .await?;

    Ok(())
}

pub async fn get_feed(
    query: &ListingFeedQuery,
    viewer_id: Option<&Uuid>,
    viewer_role: Option<&str>,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let mut where_clauses = vec!["l.status = 'active'".to_string()];
    let mut bind_values: Vec<String> = vec![];

    // Auto-scope feed to opposite role based on viewer's active_role from token
    if let Some(role) = viewer_role {
        where_clauses.push("l.author_role = ?".to_string());
        bind_values.push(crate::models::opposite_role(role).to_string());
    }

    // Validate enum filter values
    if let Some(format) = &query.format {
        if !["remote", "onsite", "hybrid"].contains(&format.as_str()) {
            return Err(AppError::BadRequest("Invalid format filter".into()));
        }
    }
    if let Some(level) = &query.experience_level {
        if !["entry", "mid", "senior", "expert", "any"].contains(&level.as_str()) {
            return Err(AppError::BadRequest(
                "Invalid experience_level filter".into(),
            ));
        }
    }
    if let Some(sort) = &query.sort {
        if !["newest", "price_asc", "price_desc"].contains(&sort.as_str()) {
            return Err(AppError::BadRequest("Invalid sort value".into()));
        }
    }
    if let Some(pd) = &query.payment_direction {
        if ![
            "organization_pays",
            "individual_pays",
            "negotiable",
            "unpaid",
        ]
        .contains(&pd.as_str())
        {
            return Err(AppError::BadRequest(
                "Invalid payment_direction filter".into(),
            ));
        }
        where_clauses.push("l.payment_direction = ?".to_string());
        bind_values.push(pd.clone());
    }

    // Category filter
    if let Some(category) = &query.category {
        where_clauses.push("l.category = ?".to_string());
        bind_values.push(category.clone());
    }

    // Visibility filter
    match viewer_id {
        Some(_) => {
            where_clauses.push("l.visibility IN ('public', 'authenticated')".to_string());
        }
        None => {
            where_clauses.push("l.visibility = 'public'".to_string());
        }
    }

    if let Some(format) = &query.format {
        where_clauses.push("l.format = ?".to_string());
        bind_values.push(format.clone());
    }

    if let Some(min_weeks) = query.min_weeks {
        where_clauses.push("l.duration_weeks >= ?".to_string());
        bind_values.push(min_weeks.to_string());
    }
    if let Some(max_weeks) = query.max_weeks {
        where_clauses.push("l.duration_weeks <= ?".to_string());
        bind_values.push(max_weeks.to_string());
    }
    if let Some(min_price) = query.min_price {
        where_clauses.push("l.price_usd >= ?".to_string());
        bind_values.push(min_price.to_string());
    }
    if let Some(max_price) = query.max_price {
        where_clauses.push("l.price_usd <= ?".to_string());
        bind_values.push(max_price.to_string());
    }

    if let Some(level) = &query.experience_level {
        if level != "any" {
            where_clauses
                .push("(l.experience_level = ? OR l.experience_level = 'any')".to_string());
            bind_values.push(level.clone());
        }
    }

    if let Some(skills_filter) = &query.skills {
        let skills: Vec<&str> = skills_filter
            .split(',')
            .map(|t| t.trim())
            .filter(|t| !t.is_empty())
            .collect();
        if !skills.is_empty() {
            let like_clauses: Vec<String> = skills
                .iter()
                .map(|_| "LOWER(je.value) LIKE ?".to_string())
                .collect();
            where_clauses.push(format!(
                "l.skills IS NOT NULL AND l.skills != '' AND json_valid(l.skills) AND EXISTS (SELECT 1 FROM json_each(l.skills) je WHERE {})",
                like_clauses.join(" OR ")
            ));
            for skill in &skills {
                let escaped = skill.to_lowercase().replace('%', "\\%").replace('_', "\\_");
                bind_values.push(format!("%{}%", escaped));
            }
        }
    }

    if let Some(search) = &query.search {
        let term = search.trim();
        if !term.is_empty() {
            let escaped = term.replace('%', "\\%").replace('_', "\\_");
            where_clauses.push(
                "(l.title LIKE ? ESCAPE '\\' OR l.description LIKE ? ESCAPE '\\')".to_string(),
            );
            let pattern = format!("%{}%", escaped);
            bind_values.push(pattern.clone());
            bind_values.push(pattern);
        }
    }

    let where_sql = where_clauses.join(" AND ");

    let order_by = match query.sort.as_deref() {
        Some("price_asc") => "l.price_usd ASC NULLS LAST",
        Some("price_desc") => "l.price_usd DESC NULLS LAST",
        _ => "l.created_at DESC",
    };

    // Count total
    let count_sql = format!("SELECT COUNT(*) as count FROM listings l WHERE {where_sql}");
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    for val in &bind_values {
        count_query = count_query.bind(val);
    }
    let total = count_query.fetch_one(read_db).await? as u32;

    // Fetch page with author info via JOINs
    let select_sql = format!(
        "SELECT l.id, l.author_id, l.author_role, l.title, l.description, l.category, l.skills, \
         l.duration_weeks, l.price_usd, l.payment_direction, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         op.organization_name AS organization_name, \
         ip.experience_level AS individual_level, \
         SUBSTR(u.email, INSTR(u.email, '@') + 1) AS author_email_domain \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN organization_profiles op ON op.user_id = l.author_id \
         LEFT JOIN individual_profiles ip ON ip.user_id = l.author_id \
         WHERE {where_sql} ORDER BY {order_by} LIMIT ? OFFSET ?"
    );
    let mut select_query = sqlx::query_as::<_, ListingWithAuthor>(&select_sql);
    for val in &bind_values {
        select_query = select_query.bind(val);
    }
    select_query = select_query.bind(query.per_page() as i64);
    select_query = select_query.bind(query.offset() as i64);

    let listings = select_query.fetch_all(read_db).await?;
    let mut results: Vec<ListingResponse> = listings.into_iter().map(Into::into).collect();

    // Batch-load saved/interested state for the viewer
    if let Some(uid) = viewer_id {
        let uid_str = uid.to_string();
        let listing_ids: Vec<&str> = results.iter().map(|r| r.id.as_str()).collect();
        if !listing_ids.is_empty() {
            let placeholders = listing_ids
                .iter()
                .map(|_| "?")
                .collect::<Vec<_>>()
                .join(",");

            let saved_sql =
                format!("SELECT listing_id FROM saved_listings WHERE user_id = ? AND listing_id IN ({placeholders})");
            let mut saved_query = sqlx::query_scalar::<_, String>(&saved_sql).bind(&uid_str);
            for id in &listing_ids {
                saved_query = saved_query.bind(*id);
            }
            let saved_ids: HashSet<String> =
                saved_query.fetch_all(read_db).await?.into_iter().collect();

            let interest_sql =
                format!("SELECT listing_id FROM interests WHERE user_id = ? AND listing_id IN ({placeholders})");
            let mut interest_query = sqlx::query_scalar::<_, String>(&interest_sql).bind(&uid_str);
            for id in &listing_ids {
                interest_query = interest_query.bind(*id);
            }
            let interested_ids: HashSet<String> = interest_query
                .fetch_all(read_db)
                .await?
                .into_iter()
                .collect();

            for r in &mut results {
                r.is_saved = saved_ids.contains(&r.id);
                r.is_interested = interested_ids.contains(&r.id);
            }
        }
    }

    let per_page = query.per_page();
    let total_pages = total.div_ceil(per_page).max(1);

    Ok(PaginatedResponse {
        data: results,
        pagination: PaginationMeta {
            page: query.page(),
            per_page,
            total,
            total_pages,
        },
    })
}

pub async fn get_user_listings(
    user_id: &Uuid,
    active_role: &str,
    query: &PaginationQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM listings WHERE author_id = ? AND author_role = ?",
    )
    .bind(user_id.to_string())
    .bind(active_role)
    .fetch_one(read_db)
    .await? as u32;

    let listings = sqlx::query_as::<_, ListingWithAuthor>(
        "SELECT l.id, l.author_id, l.author_role, l.title, l.description, l.category, l.skills, \
         l.duration_weeks, l.price_usd, l.payment_direction, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         op.organization_name AS organization_name, \
         ip.experience_level AS individual_level, \
         SUBSTR(u.email, INSTR(u.email, '@') + 1) AS author_email_domain \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN organization_profiles op ON op.user_id = l.author_id \
         LEFT JOIN individual_profiles ip ON ip.user_id = l.author_id \
         WHERE l.author_id = ? AND l.author_role = ? \
         ORDER BY l.created_at DESC \
         LIMIT ? OFFSET ?",
    )
    .bind(user_id.to_string())
    .bind(active_role)
    .bind(query.per_page() as i64)
    .bind(query.offset() as i64)
    .fetch_all(read_db)
    .await?;

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

pub async fn get_similar_listings(
    listing_id: &str,
    read_db: &SqlitePool,
) -> Result<Vec<ListingResponse>, AppError> {
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(listing_id)
        .fetch_one(read_db)
        .await?;

    // Find similar listings: same author_role, active, not same author, not same listing
    // Rank by skills overlap using json_each
    let results = sqlx::query_as::<_, ListingWithAuthor>(
        "SELECT l.id, l.author_id, l.author_role, l.title, l.description, l.category, l.skills, \
         l.duration_weeks, l.price_usd, l.payment_direction, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         op.organization_name AS organization_name, \
         ip.experience_level AS individual_level, \
         SUBSTR(u.email, INSTR(u.email, '@') + 1) AS author_email_domain \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN organization_profiles op ON op.user_id = l.author_id \
         LEFT JOIN individual_profiles ip ON ip.user_id = l.author_id \
         WHERE l.id != ? AND l.author_role = ? AND l.status = 'active' AND l.visibility = 'public' \
           AND l.author_id != ? \
         ORDER BY \
           CASE WHEN json_valid(l.skills) AND json_valid(?) THEN \
             (SELECT COUNT(*) FROM json_each(l.skills) je \
              WHERE je.value IN (SELECT value FROM json_each(?))) \
           ELSE 0 END DESC, \
           ABS(l.duration_weeks - ?) ASC \
         LIMIT 4",
    )
    .bind(listing_id)
    .bind(&listing.author_role)
    .bind(&listing.author_id)
    .bind(&listing.skills)
    .bind(&listing.skills)
    .bind(listing.duration_weeks)
    .fetch_all(read_db)
    .await?;

    Ok(results.into_iter().map(Into::into).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::listing::{ListingFeedQuery, PaginationQuery};
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};

    async fn setup_test_db() -> SqlitePool {
        let db_path = format!("/tmp/test_listing_{}.db", Uuid::new_v4());
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

    fn empty_feed_query() -> ListingFeedQuery {
        ListingFeedQuery {
            page: None,
            per_page: None,
            skills: None,
            category: None,
            payment_direction: None,
            format: None,
            min_weeks: None,
            max_weeks: None,
            min_price: None,
            max_price: None,
            sort: None,
            experience_level: None,
            search: None,
        }
    }

    #[tokio::test]
    async fn test_feed_individual_viewer_sees_org_listings() {
        let db = setup_test_db().await;
        let ind_user = Uuid::new_v4().to_string();
        let org_user = Uuid::new_v4().to_string();
        insert_user(&db, &ind_user, "ind@test.com").await;
        insert_user(&db, &org_user, "org@test.com").await;

        let ind_listing = Uuid::new_v4().to_string();
        let org_listing = Uuid::new_v4().to_string();
        insert_listing(&db, &ind_listing, &ind_user, "individual").await;
        insert_listing(&db, &org_listing, &org_user, "organization").await;

        let viewer_id = Uuid::parse_str(&ind_user).unwrap();
        let result = get_feed(
            &empty_feed_query(),
            Some(&viewer_id),
            Some("individual"),
            &db,
        )
        .await
        .unwrap();

        assert_eq!(result.data.len(), 1);
        assert_eq!(result.data[0].author_role, "organization");
    }

    #[tokio::test]
    async fn test_feed_org_viewer_sees_individual_listings() {
        let db = setup_test_db().await;
        let ind_user = Uuid::new_v4().to_string();
        let org_user = Uuid::new_v4().to_string();
        insert_user(&db, &ind_user, "ind@test.com").await;
        insert_user(&db, &org_user, "org@test.com").await;

        let ind_listing = Uuid::new_v4().to_string();
        let org_listing = Uuid::new_v4().to_string();
        insert_listing(&db, &ind_listing, &ind_user, "individual").await;
        insert_listing(&db, &org_listing, &org_user, "organization").await;

        let viewer_id = Uuid::parse_str(&org_user).unwrap();
        let result = get_feed(
            &empty_feed_query(),
            Some(&viewer_id),
            Some("organization"),
            &db,
        )
        .await
        .unwrap();

        assert_eq!(result.data.len(), 1);
        assert_eq!(result.data[0].author_role, "individual");
    }

    #[tokio::test]
    async fn test_feed_unauthenticated_sees_all() {
        let db = setup_test_db().await;
        let ind_user = Uuid::new_v4().to_string();
        let org_user = Uuid::new_v4().to_string();
        insert_user(&db, &ind_user, "ind@test.com").await;
        insert_user(&db, &org_user, "org@test.com").await;

        insert_listing(&db, &Uuid::new_v4().to_string(), &ind_user, "individual").await;
        insert_listing(&db, &Uuid::new_v4().to_string(), &org_user, "organization").await;

        let result = get_feed(&empty_feed_query(), None, None, &db)
            .await
            .unwrap();
        assert_eq!(result.data.len(), 2);
    }

    #[tokio::test]
    async fn test_user_listings_scoped_by_role() {
        let db = setup_test_db().await;
        let user_id = Uuid::new_v4();
        let uid = user_id.to_string();
        insert_user(&db, &uid, "both@test.com").await;

        insert_listing(&db, &Uuid::new_v4().to_string(), &uid, "individual").await;
        insert_listing(&db, &Uuid::new_v4().to_string(), &uid, "individual").await;
        insert_listing(&db, &Uuid::new_v4().to_string(), &uid, "organization").await;

        let query = PaginationQuery {
            page: None,
            per_page: None,
        };

        let ind_result = get_user_listings(&user_id, "individual", &query, &db)
            .await
            .unwrap();
        assert_eq!(ind_result.pagination.total, 2);

        let org_result = get_user_listings(&user_id, "organization", &query, &db)
            .await
            .unwrap();
        assert_eq!(org_result.pagination.total, 1);
    }
}
