use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::application::*;
use crate::models::listing::{Listing, PaginatedResponse, PaginationMeta};

pub async fn create_application(
    applicant_id: &Uuid,
    applicant_role: &str,
    req: &CreateApplicationRequest,
    write_db: &SqlitePool,
) -> Result<Application, AppError> {
    // Check listing exists and is active
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ? AND status = 'active'")
        .bind(&req.listing_id)
        .fetch_optional(write_db)
        .await?
        .ok_or_else(|| AppError::NotFound("Listing not found or not active".into()))?;

    // Cannot apply to own listing
    if listing.author_id == applicant_id.to_string() {
        return Err(AppError::BadRequest("Cannot apply to your own listing".into()));
    }

    // Cross-role check
    let valid = match (applicant_role, listing.listing_type.as_str()) {
        ("developer", "company") => true,
        ("company", "developer") => true,
        _ => false,
    };
    if !valid {
        return Err(AppError::BadRequest(
            "Developers apply to company listings, companies apply to developer listings".into(),
        ));
    }

    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO applications (id, listing_id, applicant_id, message) VALUES (?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&req.listing_id)
    .bind(applicant_id.to_string())
    .bind(&req.message)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(&id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}

pub async fn get_applications(
    user_id: &Uuid,
    query: &ApplicationQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<ApplicationResponse>, AppError> {
    let user_str = user_id.to_string();

    let (where_sql, bind_user) = if query.r#as.as_deref() == Some("listing_owner") {
        (
            "a.listing_id IN (SELECT id FROM listings WHERE author_id = ?)".to_string(),
            user_str.clone(),
        )
    } else {
        ("a.applicant_id = ?".to_string(), user_str.clone())
    };

    let status_filter = if let Some(status) = &query.status {
        format!(" AND a.status = '{}'", status.replace('\'', ""))
    } else {
        String::new()
    };

    let count_sql = format!(
        "SELECT COUNT(*) FROM applications a WHERE {where_sql}{status_filter}"
    );
    let total = sqlx::query_scalar::<_, i64>(&count_sql)
        .bind(&bind_user)
        .fetch_one(read_db)
        .await? as u32;

    let select_sql = format!(
        "SELECT a.* FROM applications a WHERE {where_sql}{status_filter} ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
    );
    let applications = sqlx::query_as::<_, Application>(&select_sql)
        .bind(&bind_user)
        .bind(query.per_page() as i64)
        .bind(query.offset() as i64)
        .fetch_all(read_db)
        .await?;

    let per_page = query.per_page();
    let total_pages = if total == 0 { 1 } else { (total + per_page - 1) / per_page };

    Ok(PaginatedResponse {
        data: applications.into_iter().map(Into::into).collect(),
        pagination: PaginationMeta {
            page: query.page(),
            per_page,
            total,
            total_pages,
        },
    })
}

pub async fn update_application_status(
    application_id: &str,
    owner_id: &Uuid,
    new_status: &str,
    write_db: &SqlitePool,
) -> Result<Application, AppError> {
    if !["accepted", "rejected"].contains(&new_status) {
        return Err(AppError::BadRequest("Status must be 'accepted' or 'rejected'".into()));
    }

    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_one(write_db)
        .await?;

    // Verify the caller owns the listing
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(&app.listing_id)
        .fetch_one(write_db)
        .await?;

    if listing.author_id != owner_id.to_string() {
        return Err(AppError::Forbidden("Not the listing owner".into()));
    }

    sqlx::query("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(new_status)
        .bind(application_id)
        .execute(write_db)
        .await?;

    sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}
