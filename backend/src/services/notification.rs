use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::listing::PaginatedResponse;
use crate::models::listing::PaginationMeta;
use crate::models::notification::*;

pub async fn create_notification(
    user_id: &str,
    kind: &str,
    title: &str,
    body: &str,
    link: &str,
    write_db: &SqlitePool,
) -> Result<(), AppError> {
    let id = Uuid::new_v4().to_string();
    sqlx::query(
        "INSERT INTO notifications (id, user_id, kind, title, body, link) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(user_id)
    .bind(kind)
    .bind(title)
    .bind(body)
    .bind(link)
    .execute(write_db)
    .await?;
    Ok(())
}

pub async fn get_notifications(
    user_id: &Uuid,
    query: &NotificationQuery,
    read_db: &SqlitePool,
) -> Result<PaginatedResponse<NotificationResponse>, AppError> {
    let user_str = user_id.to_string();
    let unread_filter = if query.unread_only.unwrap_or(false) {
        " AND is_read = 0"
    } else {
        ""
    };

    let count_sql = format!("SELECT COUNT(*) FROM notifications WHERE user_id = ?{unread_filter}");
    let total = sqlx::query_scalar::<_, i64>(&count_sql)
        .bind(&user_str)
        .fetch_one(read_db)
        .await? as u32;

    let select_sql = format!(
        "SELECT * FROM notifications WHERE user_id = ?{unread_filter} ORDER BY created_at DESC LIMIT ? OFFSET ?"
    );
    let notifications = sqlx::query_as::<_, Notification>(&select_sql)
        .bind(&user_str)
        .bind(query.per_page() as i64)
        .bind(query.offset() as i64)
        .fetch_all(read_db)
        .await?;

    let per_page = query.per_page();
    let total_pages = total.div_ceil(per_page).max(1);

    Ok(PaginatedResponse {
        data: notifications.into_iter().map(Into::into).collect(),
        pagination: PaginationMeta {
            page: query.page(),
            per_page,
            total,
            total_pages,
        },
    })
}

pub async fn get_unread_count(user_id: &Uuid, read_db: &SqlitePool) -> Result<i64, AppError> {
    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0",
    )
    .bind(user_id.to_string())
    .fetch_one(read_db)
    .await?;
    Ok(count)
}

pub async fn mark_read(
    notification_id: &str,
    user_id: &Uuid,
    write_db: &SqlitePool,
) -> Result<(), AppError> {
    let result = sqlx::query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?")
        .bind(notification_id)
        .bind(user_id.to_string())
        .execute(write_db)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Notification not found".into()));
    }
    Ok(())
}

pub async fn mark_all_read(user_id: &Uuid, write_db: &SqlitePool) -> Result<(), AppError> {
    sqlx::query("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0")
        .bind(user_id.to_string())
        .execute(write_db)
        .await?;
    Ok(())
}

pub async fn get_preferences(
    user_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<NotificationPreferences, AppError> {
    let prefs = sqlx::query_as::<_, NotificationPreferences>(
        "SELECT * FROM notification_preferences WHERE user_id = ?",
    )
    .bind(user_id.to_string())
    .fetch_optional(read_db)
    .await?;

    Ok(prefs.unwrap_or(NotificationPreferences {
        user_id: user_id.to_string(),
        email_enabled: true,
        email_application_received: true,
        email_application_accepted: true,
        email_application_rejected: true,
        email_review_created: true,
        email_review_consented: true,
    }))
}

pub async fn update_preferences(
    user_id: &Uuid,
    req: &UpdateNotificationPreferencesRequest,
    write_db: &SqlitePool,
) -> Result<NotificationPreferences, AppError> {
    let current = get_preferences(user_id, write_db).await?;

    let email_enabled = req.email_enabled.unwrap_or(current.email_enabled);
    let email_application_received = req
        .email_application_received
        .unwrap_or(current.email_application_received);
    let email_application_accepted = req
        .email_application_accepted
        .unwrap_or(current.email_application_accepted);
    let email_application_rejected = req
        .email_application_rejected
        .unwrap_or(current.email_application_rejected);
    let email_review_created = req
        .email_review_created
        .unwrap_or(current.email_review_created);
    let email_review_consented = req
        .email_review_consented
        .unwrap_or(current.email_review_consented);

    sqlx::query(
        "INSERT INTO notification_preferences (user_id, email_enabled, email_application_received, email_application_accepted, email_application_rejected, email_review_created, email_review_consented) \
         VALUES (?, ?, ?, ?, ?, ?, ?) \
         ON CONFLICT(user_id) DO UPDATE SET \
         email_enabled = excluded.email_enabled, \
         email_application_received = excluded.email_application_received, \
         email_application_accepted = excluded.email_application_accepted, \
         email_application_rejected = excluded.email_application_rejected, \
         email_review_created = excluded.email_review_created, \
         email_review_consented = excluded.email_review_consented"
    )
    .bind(user_id.to_string())
    .bind(email_enabled)
    .bind(email_application_received)
    .bind(email_application_accepted)
    .bind(email_application_rejected)
    .bind(email_review_created)
    .bind(email_review_consented)
    .execute(write_db)
    .await?;

    Ok(NotificationPreferences {
        user_id: user_id.to_string(),
        email_enabled,
        email_application_received,
        email_application_accepted,
        email_application_rejected,
        email_review_created,
        email_review_consented,
    })
}
