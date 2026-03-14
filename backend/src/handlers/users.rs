use axum::extract::State;
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
    let user = user_service::get_user_by_id(&auth.user_id, &state.read_db).await?;
    Ok(Json(user.into()))
}

pub async fn update_me(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateUserRequest>,
) -> Result<Json<UserResponse>, AppError> {
    req.validate()?;
    let user = user_service::update_user(&auth.user_id, &req, &state.write_db).await?;
    Ok(Json(user.into()))
}
