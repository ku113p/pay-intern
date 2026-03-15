use axum::extract::{Path, Query, State};
use axum::Json;
use validator::Validate;

use crate::auth::middleware::{AuthUser, OptionalAuthUser};
use crate::error::AppError;
use crate::models::listing::*;
use crate::services::listing as listing_service;
use crate::AppState;

pub async fn create_listing(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateListingRequest>,
) -> Result<Json<ListingResponse>, AppError> {
    req.validate()?;
    let listing =
        listing_service::create_listing(&auth.user_id, &auth.role, &req, &state.write_db).await?;
    Ok(Json(listing.into()))
}

pub async fn get_listing(
    State(state): State<AppState>,
    auth: OptionalAuthUser,
    Path(id): Path<String>,
) -> Result<Json<ListingResponse>, AppError> {
    let viewer_id = auth.0.as_ref().map(|a| &a.user_id);
    let listing = listing_service::get_listing(&id, viewer_id, &state.read_db).await?;
    Ok(Json(listing.into()))
}

pub async fn update_listing(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(req): Json<UpdateListingRequest>,
) -> Result<Json<ListingResponse>, AppError> {
    req.validate()?;
    let listing =
        listing_service::update_listing(&id, &auth.user_id, &req, &state.write_db).await?;
    Ok(Json(listing.into()))
}

pub async fn delete_listing(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, AppError> {
    listing_service::delete_listing(&id, &auth.user_id, &state.write_db).await?;
    Ok(Json(serde_json::json!({"message": "Listing closed"})))
}

pub async fn developer_feed(
    State(state): State<AppState>,
    auth: OptionalAuthUser,
    Query(query): Query<ListingFeedQuery>,
) -> Result<Json<PaginatedResponse<ListingResponse>>, AppError> {
    let viewer_id = auth.0.as_ref().map(|a| &a.user_id);
    let feed = listing_service::get_feed("developer", &query, viewer_id, &state.read_db).await?;
    Ok(Json(feed))
}

pub async fn company_feed(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<ListingFeedQuery>,
) -> Result<Json<PaginatedResponse<ListingResponse>>, AppError> {
    let feed = listing_service::get_feed(
        "company",
        &query,
        Some(&auth.user_id),
        &state.read_db,
    )
    .await?;
    Ok(Json(feed))
}

pub async fn my_listings(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<Vec<ListingResponse>>, AppError> {
    let listings = listing_service::get_user_listings(&auth.user_id, &state.read_db).await?;
    Ok(Json(listings))
}
