use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::application::Application;
use crate::models::listing::Listing;
use crate::models::message::*;
use crate::services::notification as notif_service;

/// Verify caller is a party to an accepted application. Returns (application, listing).
async fn verify_messaging_access(
    application_id: &str,
    caller_id: &Uuid,
    db: &SqlitePool,
) -> Result<(Application, Listing), AppError> {
    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(application_id)
        .fetch_optional(db)
        .await?
        .ok_or_else(|| AppError::NotFound("Application not found".into()))?;

    if app.status != "accepted" {
        return Err(AppError::BadRequest(
            "Messaging is only available for accepted applications".into(),
        ));
    }

    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(&app.listing_id)
        .fetch_one(db)
        .await?;

    let caller_str = caller_id.to_string();
    if app.applicant_id != caller_str && listing.author_id != caller_str {
        return Err(AppError::Forbidden(
            "Only the applicant or listing owner can message".into(),
        ));
    }

    Ok((app, listing))
}

pub async fn send_message(
    application_id: &str,
    sender_id: &Uuid,
    req: &SendMessageRequest,
    read_db: &SqlitePool,
    write_db: &SqlitePool,
) -> Result<MessageResponse, AppError> {
    let (app, listing) = verify_messaging_access(application_id, sender_id, read_db).await?;

    let id = Uuid::new_v4().to_string();
    let sender_str = sender_id.to_string();

    sqlx::query(
        "INSERT INTO messages (id, application_id, sender_id, body) VALUES (?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(application_id)
    .bind(&sender_str)
    .bind(&req.body)
    .execute(write_db)
    .await?;

    let sender_name = sqlx::query_scalar::<_, String>("SELECT display_name FROM users WHERE id = ?")
        .bind(&sender_str)
        .fetch_optional(read_db)
        .await?
        .unwrap_or_else(|| "Someone".into());

    // Notify the other party
    let recipient_id = if app.applicant_id == sender_str {
        &listing.author_id
    } else {
        &app.applicant_id
    };

    let link = format!("/messages/{application_id}");
    let recent = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM notifications \
         WHERE user_id = ? AND kind = 'new_message' AND link = ? \
         AND created_at > datetime('now', '-5 minutes')",
    )
    .bind(recipient_id)
    .bind(&link)
    .fetch_one(write_db)
    .await
    .unwrap_or(0);

    if recent == 0 {
        let _ = notif_service::create_notification(
            recipient_id,
            "new_message",
            &format!("New message from {sender_name}"),
            &truncate_body(&req.body, 80),
            &link,
            write_db,
        )
        .await;
    }

    Ok(MessageResponse {
        id,
        application_id: application_id.to_string(),
        sender_id: sender_str,
        sender_name,
        body: req.body.clone(),
        is_read: true, // sender always "read" their own message
        created_at: chrono::Utc::now().format("%Y-%m-%d %H:%M:%S").to_string(),
    })
}

pub async fn get_messages(
    application_id: &str,
    caller_id: &Uuid,
    query: &MessageQuery,
    read_db: &SqlitePool,
) -> Result<Vec<MessageResponse>, AppError> {
    verify_messaging_access(application_id, caller_id, read_db).await?;

    let caller_str = caller_id.to_string();

    let rows = sqlx::query_as::<_, (String, String, String, String, Option<String>, String, String)>(
        "SELECT m.id, m.application_id, m.sender_id, m.body, m.read_at, m.created_at, \
         u.display_name \
         FROM messages m JOIN users u ON u.id = m.sender_id \
         WHERE m.application_id = ? \
         ORDER BY m.created_at ASC \
         LIMIT ? OFFSET ?",
    )
    .bind(application_id)
    .bind(query.per_page() as i64)
    .bind(query.offset() as i64)
    .fetch_all(read_db)
    .await?;

    Ok(rows
        .into_iter()
        .map(|(id, app_id, sid, body, read_at, created_at, name)| MessageResponse {
            id,
            application_id: app_id,
            is_read: sid == caller_str || read_at.is_some(),
            sender_id: sid,
            sender_name: name,
            body,
            created_at,
        })
        .collect())
}

pub async fn mark_messages_read(
    application_id: &str,
    caller_id: &Uuid,
    read_db: &SqlitePool,
    write_db: &SqlitePool,
) -> Result<(), AppError> {
    verify_messaging_access(application_id, caller_id, read_db).await?;

    let caller_str = caller_id.to_string();

    sqlx::query(
        "UPDATE messages SET read_at = datetime('now') \
         WHERE application_id = ? AND sender_id != ? AND read_at IS NULL",
    )
    .bind(application_id)
    .bind(&caller_str)
    .execute(write_db)
    .await?;

    Ok(())
}

pub async fn get_conversations(
    user_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<Vec<ConversationSummary>, AppError> {
    let user_str = user_id.to_string();

    let rows = sqlx::query_as::<_, ConversationSummary>(
        "SELECT \
           a.id AS application_id, \
           l.title AS listing_title, \
           CASE WHEN a.applicant_id = ? THEN l.author_id ELSE a.applicant_id END AS other_party_id, \
           CASE WHEN a.applicant_id = ? THEN ou.display_name ELSE au.display_name END AS other_party_name, \
           latest_msg.body AS last_message_body, \
           latest_msg.created_at AS last_message_at, \
           COALESCE(unread.cnt, 0) AS unread_count \
         FROM applications a \
         JOIN listings l ON l.id = a.listing_id \
         JOIN users au ON au.id = a.applicant_id \
         JOIN users ou ON ou.id = l.author_id \
         JOIN ( \
           SELECT application_id, body, created_at, \
                  ROW_NUMBER() OVER (PARTITION BY application_id ORDER BY created_at DESC) AS rn \
           FROM messages \
           WHERE application_id IN ( \
             SELECT a2.id FROM applications a2 \
             JOIN listings l2 ON l2.id = a2.listing_id \
             WHERE a2.status = 'accepted' AND (a2.applicant_id = ? OR l2.author_id = ?) \
           ) \
         ) latest_msg ON latest_msg.application_id = a.id AND latest_msg.rn = 1 \
         LEFT JOIN ( \
           SELECT application_id, COUNT(*) AS cnt \
           FROM messages \
           WHERE sender_id != ? AND read_at IS NULL \
           GROUP BY application_id \
         ) unread ON unread.application_id = a.id \
         WHERE a.status = 'accepted' \
           AND (a.applicant_id = ? OR l.author_id = ?) \
         ORDER BY latest_msg.created_at DESC",
    )
    .bind(&user_str) // other_party_id CASE
    .bind(&user_str) // other_party_name CASE
    .bind(&user_str) // subquery applicant_id
    .bind(&user_str) // subquery author_id
    .bind(&user_str) // unread sender_id !=
    .bind(&user_str) // WHERE applicant_id
    .bind(&user_str) // WHERE author_id
    .fetch_all(read_db)
    .await?;

    Ok(rows)
}

pub async fn get_conversations_unread_count(
    user_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<i64, AppError> {
    let user_str = user_id.to_string();

    let count = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM messages m \
         JOIN applications a ON a.id = m.application_id \
         JOIN listings l ON l.id = a.listing_id \
         WHERE m.sender_id != ? AND m.read_at IS NULL \
           AND a.status = 'accepted' \
           AND (a.applicant_id = ? OR l.author_id = ?)",
    )
    .bind(&user_str)
    .bind(&user_str)
    .bind(&user_str)
    .fetch_one(read_db)
    .await?;

    Ok(count)
}

fn truncate_body(s: &str, max: usize) -> String {
    if s.chars().count() <= max {
        s.to_string()
    } else {
        let end = s.char_indices().nth(max).map(|(i, _)| i).unwrap_or(s.len());
        format!("{}...", &s[..end])
    }
}
