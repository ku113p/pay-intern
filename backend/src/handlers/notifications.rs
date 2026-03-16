use axum::extract::{Path, Query, State};
use axum::Json;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::listing::PaginatedResponse;
use crate::models::notification::*;
use crate::services::notification as notif_service;
use crate::AppState;

pub async fn get_notifications(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<NotificationQuery>,
) -> Result<Json<PaginatedResponse<NotificationResponse>>, AppError> {
    let result = notif_service::get_notifications(&auth.user_id, &query, &state.read_db).await?;
    Ok(Json(result))
}

pub async fn get_unread_count(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<UnreadCountResponse>, AppError> {
    let count = notif_service::get_unread_count(&auth.user_id, &state.read_db).await?;
    Ok(Json(UnreadCountResponse { count }))
}

pub async fn mark_read(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    notif_service::mark_read(&id, &auth.user_id, &state.write_db).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}

pub async fn mark_all_read(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    notif_service::mark_all_read(&auth.user_id, &state.write_db).await?;
    Ok(Json(serde_json::json!({"ok": true})))
}

pub async fn get_preferences(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<NotificationPreferences>, AppError> {
    let prefs = notif_service::get_preferences(&auth.user_id, &state.read_db).await?;
    Ok(Json(prefs))
}

pub async fn update_preferences(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateNotificationPreferencesRequest>,
) -> Result<Json<NotificationPreferences>, AppError> {
    let prefs = notif_service::update_preferences(&auth.user_id, &req, &state.write_db).await?;
    Ok(Json(prefs))
}
