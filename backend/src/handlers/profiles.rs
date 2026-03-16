use axum::extract::{Path, State};
use axum::Json;
use validator::Validate;

use crate::auth::middleware::{AuthUser, OptionalAuthUser};
use crate::error::AppError;
use crate::models::user::*;
use crate::services::user as user_service;
use crate::AppState;

pub async fn get_my_developer_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<DeveloperProfileResponse>, AppError> {
    if auth.role != "developer" {
        return Err(AppError::Forbidden("Only developers can access this".into()));
    }
    let profile =
        user_service::get_developer_profile(&auth.user_id.to_string(), &state.read_db).await?;
    Ok(Json(profile.into()))
}

pub async fn update_my_developer_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateDeveloperProfileRequest>,
) -> Result<Json<DeveloperProfileResponse>, AppError> {
    if auth.role != "developer" {
        return Err(AppError::Forbidden("Only developers can access this".into()));
    }
    req.validate()?;
    let profile =
        user_service::update_developer_profile(&auth.user_id.to_string(), &req, &state.write_db)
            .await?;
    Ok(Json(profile.into()))
}

pub async fn get_my_company_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<CompanyProfileResponse>, AppError> {
    if auth.role != "company" {
        return Err(AppError::Forbidden("Only companies can access this".into()));
    }
    let profile =
        user_service::get_company_profile(&auth.user_id.to_string(), &state.read_db).await?;
    Ok(Json(profile.into()))
}

pub async fn update_my_company_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateCompanyProfileRequest>,
) -> Result<Json<CompanyProfileResponse>, AppError> {
    if auth.role != "company" {
        return Err(AppError::Forbidden("Only companies can access this".into()));
    }
    req.validate()?;
    let profile =
        user_service::update_company_profile(&auth.user_id.to_string(), &req, &state.write_db)
            .await?;
    Ok(Json(profile.into()))
}

pub async fn get_public_developer_profile(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<DeveloperProfileResponse>, AppError> {
    let profile = user_service::get_developer_profile(&user_id, &state.read_db).await?;
    Ok(Json(profile.into()))
}

pub async fn get_public_company_profile(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<CompanyProfileResponse>, AppError> {
    let profile = user_service::get_company_profile(&user_id, &state.read_db).await?;
    Ok(Json(profile.into()))
}

pub async fn get_profile_preview(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<ProfilePreviewResponse>, AppError> {
    let preview = user_service::get_profile_preview(&user_id, &state.read_db).await?;
    Ok(Json(preview.into()))
}
