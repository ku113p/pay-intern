use axum::extract::{Path, State};
use axum::Json;
use validator::Validate;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::outcome_review::*;
use crate::services::outcome_review as review_service;
use crate::AppState;

pub async fn create_review(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateOutcomeReviewRequest>,
) -> Result<Json<OutcomeReviewResponse>, AppError> {
    req.validate()?;
    let review = review_service::create_review(&auth.user_id, &req, &state.write_db, &state.config).await?;
    Ok(Json(review.into()))
}

pub async fn get_review(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<OutcomeReviewResponse>, AppError> {
    let review = review_service::get_review(&id, &auth.user_id, &state.read_db).await?;
    Ok(Json(review.into()))
}

pub async fn consent_review(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(req): Json<ConsentReviewRequest>,
) -> Result<Json<OutcomeReviewResponse>, AppError> {
    let review =
        review_service::consent_review(&id, &auth.user_id, &req, &state.write_db).await?;
    Ok(Json(review.into()))
}
