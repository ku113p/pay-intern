use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use validator::Validate;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::user::{UpdateUserRequest, UserResponse};
use crate::services::user as user_service;
use crate::AppState;

pub async fn get_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<UserResponse>, AppError> {
    let uid = auth.user_id.to_string();
    let response = user_service::get_user_response(&uid, &state.read_db).await?;
    Ok(Json(response))
}

pub async fn update_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    req.validate()?;
    let uid = auth.user_id.to_string();
    user_service::update_user(&auth.user_id, &req, &state.write_db).await?;
    let response = user_service::get_user_response(&uid, &state.write_db).await?;
    Ok(Json(response))
}

pub async fn delete_me(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<StatusCode, AppError> {
    user_service::delete_account(&auth.user_id, &state.write_db).await?;
    Ok(StatusCode::NO_CONTENT)
}
