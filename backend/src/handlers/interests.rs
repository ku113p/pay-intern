use axum::extract::{Path, Query, State};
use axum::Json;
use uuid::Uuid;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::application::ContactInfoResponse;
use crate::models::interest::*;
use crate::models::listing::{ListingResponse, PaginatedResponse};
use crate::services::interest as interest_service;
use crate::AppState;

pub async fn save_listing(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<SaveToggleResponse>, AppError> {
    let result = interest_service::save_listing(&auth.user_id, &id, &state.write_db).await?;
    Ok(Json(result))
}

pub async fn unsave_listing(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<SaveToggleResponse>, AppError> {
    let result = interest_service::unsave_listing(&auth.user_id, &id, &state.write_db).await?;
    Ok(Json(result))
}

pub async fn get_saved_listings(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<SavedListingsQuery>,
) -> Result<Json<PaginatedResponse<ListingResponse>>, AppError> {
    let result =
        interest_service::get_saved_listings(&auth.user_id, &query, &state.read_db).await?;
    Ok(Json(result))
}

pub async fn add_interest(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<InterestToggleResponse>, AppError> {
    let result = interest_service::add_interest(&auth.user_id, &id, &state.write_db).await?;
    Ok(Json(result))
}

pub async fn remove_interest(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<InterestToggleResponse>, AppError> {
    let result = interest_service::remove_interest(&auth.user_id, &id, &state.write_db).await?;
    Ok(Json(result))
}

pub async fn get_received_interests(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<ReceivedInterest>>, AppError> {
    let result = interest_service::get_received_interests(&auth.user_id, &state.read_db).await?;
    Ok(Json(result))
}

pub async fn get_matches(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<MatchResponse>>, AppError> {
    let result = interest_service::get_matches(&auth.user_id, &state.read_db).await?;
    Ok(Json(result))
}

pub async fn get_match_contact_info(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
) -> Result<Json<ContactInfoResponse>, AppError> {
    let contact =
        interest_service::get_match_contact_info(&auth.user_id, &user_id, &state.read_db).await?;
    Ok(Json(contact))
}
