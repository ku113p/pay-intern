use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use validator::Validate;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::models::application::*;
use crate::models::listing::PaginatedResponse;
use crate::services::application as app_service;
use crate::AppState;

pub async fn get_contact_info(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<ContactInfoResponse>, AppError> {
    let contact = app_service::get_contact_info(&id, &auth.user_id, &state.read_db).await?;
    Ok(Json(contact))
}

pub async fn create_application(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<CreateApplicationRequest>,
) -> Result<(StatusCode, Json<ApplicationResponse>), AppError> {
    req.validate()?;
    let application =
        app_service::create_application(&auth.user_id, &req, &state.write_db, &state.config)
            .await?;
    Ok((StatusCode::CREATED, Json(application.into())))
}

pub async fn get_applications(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(query): Query<ApplicationQuery>,
) -> Result<Json<PaginatedResponse<ApplicationResponse>>, AppError> {
    let result =
        app_service::get_applications(&auth.user_id, &auth.active_role, &query, &state.read_db)
            .await?;
    Ok(Json(result))
}

pub async fn update_application_status(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<String>,
    Json(req): Json<UpdateApplicationStatusRequest>,
) -> Result<Json<ApplicationResponse>, AppError> {
    let application = app_service::update_application_status(
        &id,
        &auth.user_id,
        &req.status,
        &state.write_db,
        &state.config,
    )
    .await?;
    Ok(Json(application.into()))
}
