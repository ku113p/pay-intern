use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use validator::Validate;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::message::*;
use crate::services::message as message_service;
use crate::AppState;

pub async fn get_conversations(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<ConversationSummary>>, AppError> {
    let conversations = message_service::get_conversations(&auth.user_id, &state.read_db).await?;
    Ok(Json(conversations))
}

pub async fn get_conversations_unread_count(
    auth: AuthUser,
    State(state): State<AppState>,
) -> Result<Json<ConversationsUnreadCount>, AppError> {
    let count = message_service::get_conversations_unread_count(&auth.user_id, &state.read_db).await?;
    Ok(Json(ConversationsUnreadCount { count }))
}

pub async fn get_messages(
    auth: AuthUser,
    Path(application_id): Path<String>,
    Query(query): Query<MessageQuery>,
    State(state): State<AppState>,
) -> Result<Json<Vec<MessageResponse>>, AppError> {
    let messages =
        message_service::get_messages(&application_id, &auth.user_id, &query, &state.read_db).await?;
    Ok(Json(messages))
}

pub async fn send_message(
    auth: AuthUser,
    Path(application_id): Path<String>,
    State(state): State<AppState>,
    Json(req): Json<SendMessageRequest>,
) -> Result<(StatusCode, Json<MessageResponse>), AppError> {
    req.validate()?;
    let message =
        message_service::send_message(&application_id, &auth.user_id, &req, &state.read_db, &state.write_db).await?;
    Ok((StatusCode::CREATED, Json(message)))
}

pub async fn mark_read(
    auth: AuthUser,
    Path(application_id): Path<String>,
    State(state): State<AppState>,
) -> Result<Json<serde_json::Value>, AppError> {
    message_service::mark_messages_read(&application_id, &auth.user_id, &state.read_db, &state.write_db).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}
