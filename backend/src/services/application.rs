use std::sync::Arc;

use sqlx::SqlitePool;
use uuid::Uuid;

use crate::config::Config;
use crate::error::AppError;
use crate::models::application::*;
use crate::models::listing::{Listing, PaginatedResponse, PaginationMeta};
use crate::models::user::User;
use crate::services::email as email_service;
use crate::services::notification as notif_service;

pub async fn create_application(
    applicant_id: &Uuid,
    req: &CreateApplicationRequest,
    write_db: &SqlitePool,
    config: &Arc<Config>,
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

    let application = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(&id)
        .fetch_one(write_db)
        .await?;

    // Notify listing owner
    let applicant_name = sqlx::query_scalar::<_, String>(
        "SELECT display_name FROM users WHERE id = ?",
    )
    .bind(applicant_id.to_string())
    .fetch_optional(write_db)
    .await?
    .unwrap_or_else(|| "Someone".into());

    let _ = notif_service::create_notification(
        &listing.author_id,
        "application_received",
        &format!("New application from {applicant_name}"),
        &format!("Applied to \"{}\"", listing.title),
        "/applications",
        write_db,
    )
    .await;

    // Fire-and-forget email to listing owner
    let owner_email = sqlx::query_scalar::<_, String>(
        "SELECT u.email FROM users u WHERE u.id = ?",
    )
    .bind(&listing.author_id)
    .fetch_optional(write_db)
    .await?;

    if let Some(email) = owner_email {
        // Check notification preferences before sending email
        let prefs = sqlx::query_as::<_, crate::models::notification::NotificationPreferences>(
            "SELECT * FROM notification_preferences WHERE user_id = ?",
        )
        .bind(&listing.author_id)
        .fetch_optional(write_db)
        .await?;

        let should_send = prefs
            .map(|p| p.email_enabled && p.email_application_received)
            .unwrap_or(true);

        if should_send {
            let title = listing.title.clone();
            let applicant_name_for_email = applicant_name;
            let config = Arc::clone(config);
            tokio::spawn(async move {
                if let Err(e) =
                    email_service::send_new_application_email(&email, &title, &applicant_name_for_email, &config)
                        .await
                {
                    tracing::warn!("Failed to send new application email: {e}");
                }
            });
        }
    }

    Ok(application)
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

    let mut extra_where = String::new();
    let mut bind_values: Vec<String> = vec![bind_user];

    if let Some(status) = &query.status {
        extra_where.push_str(" AND a.status = ?");
        bind_values.push(status.clone());
    }

    let count_sql = format!(
        "SELECT COUNT(*) FROM applications a WHERE {where_sql}{extra_where}"
    );
    let mut count_query = sqlx::query_scalar::<_, i64>(&count_sql);
    for val in &bind_values {
        count_query = count_query.bind(val);
    }
    let total = count_query.fetch_one(read_db).await? as u32;

    let select_sql = format!(
        "SELECT a.id, a.listing_id, a.applicant_id, a.message, a.status, \
         a.created_at, a.updated_at, \
         l.title AS listing_title, \
         l.author_role AS listing_author_role, \
         u.display_name AS applicant_name \
         FROM applications a \
         JOIN listings l ON l.id = a.listing_id \
         JOIN users u ON u.id = a.applicant_id \
         WHERE {where_sql}{extra_where} ORDER BY a.created_at DESC LIMIT ? OFFSET ?"
    );
    let mut select_query = sqlx::query_as::<_, ApplicationWithDetails>(&select_sql);
    for val in &bind_values {
        select_query = select_query.bind(val);
    }
    select_query = select_query.bind(query.per_page() as i64);
    select_query = select_query.bind(query.offset() as i64);
    let applications = select_query.fetch_all(read_db).await?;

    let per_page = query.per_page();
    let total_pages = total.div_ceil(per_page).max(1);

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
    caller_id: &Uuid,
    new_status: &str,
    write_db: &SqlitePool,
    config: &Arc<Config>,
) -> Result<Application, AppError> {
    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_one(write_db)
        .await?;

    let mut listing_title_for_email: Option<String> = None;

    if new_status == "withdrawn" {
        // Applicant withdraws their own pending application
        if app.applicant_id != caller_id.to_string() {
            return Err(AppError::Forbidden("Not the applicant".into()));
        }
        if app.status != "pending" {
            return Err(AppError::BadRequest(
                "Can only withdraw pending applications".into(),
            ));
        }
    } else if new_status == "accepted" || new_status == "rejected" {
        // Listing owner accepts/rejects
        if app.status != "pending" {
            return Err(AppError::BadRequest(
                "Can only accept/reject pending applications".into(),
            ));
        }
        let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
            .bind(&app.listing_id)
            .fetch_one(write_db)
            .await?;
        if listing.author_id != caller_id.to_string() {
            return Err(AppError::Forbidden("Not the listing owner".into()));
        }
        listing_title_for_email = Some(listing.title);
    } else {
        return Err(AppError::BadRequest(
            "Status must be 'accepted', 'rejected', or 'withdrawn'".into(),
        ));
    }

    sqlx::query("UPDATE applications SET status = ?, updated_at = datetime('now') WHERE id = ?")
        .bind(new_status)
        .bind(application_id)
        .execute(write_db)
        .await?;

    let updated = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_one(write_db)
        .await?;

    // Notify applicant on accept/reject
    if new_status == "accepted" || new_status == "rejected" {
        if let Some(ref title) = listing_title_for_email {
            let kind = if new_status == "accepted" {
                "application_accepted"
            } else {
                "application_rejected"
            };
            let notif_title = if new_status == "accepted" {
                format!("Application accepted: {title}")
            } else {
                format!("Application update: {title}")
            };
            let body = if new_status == "accepted" {
                format!("Your application to \"{title}\" was accepted!")
            } else {
                format!("Your application to \"{title}\" was not selected")
            };
            let _ = notif_service::create_notification(
                &app.applicant_id,
                kind,
                &notif_title,
                &body,
                "/applications",
                write_db,
            )
            .await;
        }
    }

    // Fire-and-forget email to applicant on accept/reject
    if let Some(title) = listing_title_for_email {
        let applicant_email = sqlx::query_scalar::<_, String>(
            "SELECT email FROM users WHERE id = ?",
        )
        .bind(&app.applicant_id)
        .fetch_optional(write_db)
        .await?;

        if let Some(email) = applicant_email {
            // Check notification preferences before sending email
            let prefs = sqlx::query_as::<_, crate::models::notification::NotificationPreferences>(
                "SELECT * FROM notification_preferences WHERE user_id = ?",
            )
            .bind(&app.applicant_id)
            .fetch_optional(write_db)
            .await?;

            let pref_field = if new_status == "accepted" {
                prefs.as_ref().map(|p| p.email_application_accepted).unwrap_or(true)
            } else {
                prefs.as_ref().map(|p| p.email_application_rejected).unwrap_or(true)
            };
            let should_send = prefs
                .as_ref()
                .map(|p| p.email_enabled)
                .unwrap_or(true) && pref_field;

            if should_send {
                let status = new_status.to_string();
                let config = Arc::clone(config);
                tokio::spawn(async move {
                    if let Err(e) =
                        email_service::send_application_status_email(&email, &title, &status, &config)
                            .await
                    {
                        tracing::warn!("Failed to send application status email: {e}");
                    }
                });
            }
        }
    }

    Ok(updated)
}

pub async fn get_contact_info(
    application_id: &str,
    caller_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<ContactInfoResponse, AppError> {
    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_optional(read_db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".into()))?;

    if app.status != "accepted" {
        return Err(AppError::BadRequest(
            "Contact info is only available for accepted applications".into(),
        ));
    }

    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(&app.listing_id)
        .fetch_one(read_db)
        .await?;

    let caller_str = caller_id.to_string();
    let is_applicant = app.applicant_id == caller_str;
    let is_owner = listing.author_id == caller_str;

    if !is_applicant && !is_owner {
        return Err(AppError::Forbidden(
            "Only the applicant or listing owner can view contact info".into(),
        ));
    }

    // Determine the other party
    let other_user_id = if is_applicant {
        &listing.author_id
    } else {
        &app.applicant_id
    };

    let other_user = sqlx::query_as::<_, User>("SELECT * FROM users WHERE id = ?")
        .bind(other_user_id)
        .fetch_one(read_db)
        .await?;

    // Get contact email from either profile
    let contact_email: Option<String> = sqlx::query_scalar(
        "SELECT contact_email FROM individual_profiles WHERE user_id = ? AND contact_email IS NOT NULL \
         UNION ALL \
         SELECT contact_email FROM organization_profiles WHERE user_id = ? AND contact_email IS NOT NULL \
         LIMIT 1"
    )
    .bind(other_user_id)
    .bind(other_user_id)
    .fetch_optional(read_db)
    .await?;

    // Get all links for the other user
    let links = sqlx::query_as::<_, crate::models::user::ProfileLink>(
        "SELECT * FROM profile_links WHERE user_id = ? ORDER BY display_order"
    )
    .bind(other_user_id)
    .fetch_all(read_db)
    .await?;

    let email = contact_email.unwrap_or(other_user.email);

    Ok(ContactInfoResponse {
        user_id: other_user.id,
        display_name: other_user.display_name,
        email,
        links: links.into_iter().map(Into::into).collect(),
    })
}
