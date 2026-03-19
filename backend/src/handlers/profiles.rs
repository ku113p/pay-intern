use axum::extract::{Path, State};
use axum::Json;
use validator::Validate;

use crate::auth::middleware::{AuthUser, OptionalAuthUser};
use crate::error::AppError;
use crate::models::user::*;
use crate::services::user as user_service;
use crate::AppState;

pub async fn get_my_individual_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<IndividualProfileResponse>, AppError> {
    let uid = auth.user_id.to_string();
    let profile = user_service::get_individual_profile(&uid, &state.read_db).await?;
    let links = user_service::get_profile_links(&uid, "individual", &state.read_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(profile.to_response(link_responses)))
}

pub async fn upsert_my_individual_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateIndividualProfileRequest>,
) -> Result<Json<IndividualProfileResponse>, AppError> {
    req.validate()?;
    let uid = auth.user_id.to_string();
    let profile = user_service::upsert_individual_profile(&uid, &req, &state.write_db).await?;
    let links = user_service::get_profile_links(&uid, "individual", &state.write_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(profile.to_response(link_responses)))
}

pub async fn delete_my_individual_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let uid = auth.user_id.to_string();
    user_service::delete_profile(&uid, "individual", &state.write_db).await?;
    Ok(Json(
        serde_json::json!({"message": "Individual profile deleted"}),
    ))
}

pub async fn get_my_organization_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<OrganizationProfileResponse>, AppError> {
    let uid = auth.user_id.to_string();
    let profile = user_service::get_organization_profile(&uid, &state.read_db).await?;
    let links = user_service::get_profile_links(&uid, "organization", &state.read_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(profile.to_response(link_responses)))
}

pub async fn upsert_my_organization_profile(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(req): Json<UpdateOrganizationProfileRequest>,
) -> Result<Json<OrganizationProfileResponse>, AppError> {
    req.validate()?;
    let uid = auth.user_id.to_string();
    let profile = user_service::upsert_organization_profile(&uid, &req, &state.write_db).await?;
    let links = user_service::get_profile_links(&uid, "organization", &state.write_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(profile.to_response(link_responses)))
}

pub async fn delete_my_organization_profile(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    let uid = auth.user_id.to_string();
    user_service::delete_profile(&uid, "organization", &state.write_db).await?;
    Ok(Json(
        serde_json::json!({"message": "Organization profile deleted"}),
    ))
}

pub async fn get_my_profile_links(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(profile_type): Path<String>,
) -> Result<Json<Vec<ProfileLinkResponse>>, AppError> {
    if !["individual", "organization"].contains(&profile_type.as_str()) {
        return Err(AppError::BadRequest("Invalid profile type".into()));
    }
    let uid = auth.user_id.to_string();
    let links = user_service::get_profile_links(&uid, &profile_type, &state.read_db).await?;
    let responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(responses))
}

pub async fn replace_my_profile_links(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(profile_type): Path<String>,
    Json(req): Json<UpdateProfileLinksRequest>,
) -> Result<Json<Vec<ProfileLinkResponse>>, AppError> {
    req.validate()?;
    if !["individual", "organization"].contains(&profile_type.as_str()) {
        return Err(AppError::BadRequest("Invalid profile type".into()));
    }
    let uid = auth.user_id.to_string();
    let links =
        user_service::replace_profile_links(&uid, &profile_type, &req.links, &state.write_db)
            .await?;
    let responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    Ok(Json(responses))
}

pub async fn get_public_individual_profile(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<IndividualProfileResponse>, AppError> {
    let profile = user_service::get_individual_profile(&user_id, &state.read_db).await?;
    let links = user_service::get_profile_links(&user_id, "individual", &state.read_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    let mut response = profile.to_response(link_responses);
    response.contact_email = None;
    Ok(Json(response))
}

pub async fn get_public_organization_profile(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<OrganizationProfileResponse>, AppError> {
    let profile = user_service::get_organization_profile(&user_id, &state.read_db).await?;
    let links = user_service::get_profile_links(&user_id, "organization", &state.read_db).await?;
    let link_responses: Vec<ProfileLinkResponse> = links.into_iter().map(Into::into).collect();
    let mut response = profile.to_response(link_responses);
    response.contact_email = None;
    Ok(Json(response))
}

pub async fn get_profile_preview(
    State(state): State<AppState>,
    _auth: OptionalAuthUser,
    Path(user_id): Path<String>,
) -> Result<Json<ProfilePreviewResponse>, AppError> {
    let preview = user_service::get_profile_preview(&user_id, &state.read_db).await?;
    Ok(Json(preview.into()))
}
