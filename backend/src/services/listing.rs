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
    let listing_type = match author_role {
        "developer" => "developer",
        "company" => "company",
        _ => return Err(AppError::BadRequest("Invalid role".into())),
    };

    if !["remote", "onsite", "hybrid"].contains(&req.format.as_str()) {
        return Err(AppError::BadRequest("Invalid format".into()));
    }

    // Company listings must have outcome_criteria with at least 3 items
    if listing_type == "company" {
        match &req.outcome_criteria {
            Some(criteria) if criteria.len() >= 3 => {}
            _ => {
                return Err(AppError::BadRequest(
                    "Company listings require at least 3 outcome criteria".into(),
                ));
            }
        }
    }

    if let Some(price) = req.price_usd {
        if price < 0.0 {
            return Err(AppError::BadRequest("Price must be non-negative".into()));
        }
    }

    let id = Uuid::new_v4().to_string();
    let tech_stack = serde_json::to_string(&req.tech_stack).unwrap_or_default();
    let outcome_criteria = req
        .outcome_criteria
        .as_ref()
        .map(|c| serde_json::to_string(c).unwrap_or_default());
    let visibility = req.visibility.as_deref().unwrap_or("public");

    if !["public", "authenticated", "private"].contains(&visibility) {
        return Err(AppError::BadRequest("Invalid visibility".into()));
    }

    let experience_level = req.experience_level.as_deref().unwrap_or("any");
    if !["junior", "mid", "senior", "any"].contains(&experience_level) {
        return Err(AppError::BadRequest("experience_level must be junior, mid, senior, or any".into()));
    }

    sqlx::query(
        "INSERT INTO listings (id, author_id, type, title, description, tech_stack, duration_weeks, price_usd, format, outcome_criteria, visibility, experience_level, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')"
    )
    .bind(&id)
    .bind(author_id.to_string())
    .bind(listing_type)
    .bind(&req.title)
    .bind(&req.description)
    .bind(&tech_stack)
    .bind(req.duration_weeks)
    .bind(req.price_usd)
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
) -> Result<Listing, AppError> {
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
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
    let tech_stack = req
        .tech_stack
        .as_ref()
        .map(|ts| serde_json::to_string(ts).unwrap_or_default())
        .unwrap_or(listing.tech_stack);
    let duration_weeks = req.duration_weeks.unwrap_or(listing.duration_weeks);
    let price_usd = req.price_usd.or(listing.price_usd);
    let format = req.format.as_deref().unwrap_or(&listing.format);
    let outcome_criteria = req
        .outcome_criteria
        .as_ref()
        .map(|c| serde_json::to_string(c).unwrap_or_default())
        .or(listing.outcome_criteria);
    let visibility = req.visibility.as_deref().unwrap_or(&listing.visibility);
    let status = req.status.as_deref().unwrap_or(&listing.status);
    let experience_level = req.experience_level.as_deref().unwrap_or(&listing.experience_level);

    sqlx::query(
        "UPDATE listings SET title = ?, description = ?, tech_stack = ?, duration_weeks = ?, price_usd = ?, format = ?, outcome_criteria = ?, visibility = ?, status = ?, experience_level = ?, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(title)
    .bind(description)
    .bind(&tech_stack)
    .bind(duration_weeks)
    .bind(price_usd)
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
    listing_type: &str,
    query: &ListingFeedQuery,
    viewer_id: Option<&Uuid>,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let mut where_clauses = vec![
        "l.type = ?".to_string(),
        "l.status = 'active'".to_string(),
    ];
    let mut bind_values: Vec<String> = vec![listing_type.to_string()];

    // Validate enum filter values
    if let Some(format) = &query.format {
        if !["remote", "onsite", "hybrid"].contains(&format.as_str()) {
            return Err(AppError::BadRequest("Invalid format filter".into()));
        }
    }
    if let Some(level) = &query.experience_level {
        if !["junior", "mid", "senior", "any"].contains(&level.as_str()) {
            return Err(AppError::BadRequest("Invalid experience_level filter".into()));
        }
    }
    if let Some(sort) = &query.sort {
        if !["newest", "price_asc", "price_desc"].contains(&sort.as_str()) {
            return Err(AppError::BadRequest("Invalid sort value".into()));
        }
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
            where_clauses.push("(l.experience_level = ? OR l.experience_level = 'any')".to_string());
            bind_values.push(level.clone());
        }
    }

    if let Some(tech_filter) = &query.tech {
        let techs: Vec<&str> = tech_filter.split(',').map(|t| t.trim()).filter(|t| !t.is_empty()).collect();
        if !techs.is_empty() {
            let like_clauses: Vec<String> = techs
                .iter()
                .map(|_| "LOWER(je.value) LIKE ?".to_string())
                .collect();
            where_clauses.push(format!(
                "EXISTS (SELECT 1 FROM json_each(l.tech_stack) je WHERE {})",
                like_clauses.join(" OR ")
            ));
            for tech in &techs {
                let escaped = tech.to_lowercase().replace('%', "\\%").replace('_', "\\_");
                bind_values.push(format!("%{}%", escaped));
            }
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
        "SELECT l.id, l.author_id, l.type, l.title, l.description, l.tech_stack, \
         l.duration_weeks, l.price_usd, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         cp.company_name AS company_name, \
         cp.website AS company_website, \
         dp.level AS developer_level \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN company_profiles cp ON cp.user_id = l.author_id \
         LEFT JOIN developer_profiles dp ON dp.user_id = l.author_id \
         WHERE {where_sql} ORDER BY {order_by} LIMIT ? OFFSET ?"
    );
    let mut select_query = sqlx::query_as::<_, ListingWithAuthor>(&select_sql);
    for val in &bind_values {
        select_query = select_query.bind(val);
    }
    select_query = select_query.bind(query.per_page() as i64);
    select_query = select_query.bind(query.offset() as i64);

    let listings = select_query.fetch_all(read_db).await?;
    let results: Vec<ListingResponse> = listings.into_iter().map(Into::into).collect();

    let per_page = query.per_page();
    let total_pages = if total == 0 { 1 } else { (total + per_page - 1) / per_page };

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
    query: &PaginationQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ListingResponse>, AppError> {
    let total = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM listings WHERE author_id = ?"
    )
    .bind(user_id)
    .fetch_one(read_db)
    .await? as u32;

    let listings = sqlx::query_as::<_, ListingWithAuthor>(
        "SELECT l.id, l.author_id, l.type, l.title, l.description, l.tech_stack, \
         l.duration_weeks, l.price_usd, l.format, l.outcome_criteria, \
         l.visibility, l.status, l.experience_level, l.created_at, l.updated_at, \
         u.display_name AS author_display_name, \
         cp.company_name AS company_name, \
         cp.website AS company_website, \
         dp.level AS developer_level \
         FROM listings l \
         JOIN users u ON u.id = l.author_id \
         LEFT JOIN company_profiles cp ON cp.user_id = l.author_id \
         LEFT JOIN developer_profiles dp ON dp.user_id = l.author_id \
         WHERE l.author_id = ? \
         ORDER BY l.created_at DESC \
         LIMIT ? OFFSET ?",
    )
    .bind(user_id)
    .bind(query.per_page() as i64)
    .bind(query.offset() as i64)
    .fetch_all(read_db)
    .await?;

    let per_page = query.per_page();
    let total_pages = if total == 0 { 1 } else { (total + per_page - 1) / per_page };

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
