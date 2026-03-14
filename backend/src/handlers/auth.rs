use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use crate::auth::middleware::AuthUser;
use crate::error::AppError;
use crate::services::auth as auth_service;
use crate::services::email as email_service;
use crate::AppState;

#[derive(Deserialize)]
pub struct GoogleAuthRequest {
    pub code: String,
    pub role: String,
}

#[derive(Deserialize)]
pub struct MagicLinkRequest {
    pub email: String,
    pub role: String,
}

#[derive(Deserialize)]
pub struct MagicLinkVerifyRequest {
    pub email: String,
    pub token: String,
}

#[derive(Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

pub async fn google_auth(
    State(state): State<AppState>,
    Json(req): Json<GoogleAuthRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    if !["developer", "company"].contains(&req.role.as_str()) {
        return Err(AppError::BadRequest("Role must be 'developer' or 'company'".into()));
    }

    let user =
        auth_service::exchange_google_code(&req.code, &req.role, &state.write_db, &state.config)
            .await?;
    let tokens = auth_service::issue_tokens(&user, &state.write_db, &state.config).await?;
    Ok(Json(tokens))
}

pub async fn request_magic_link(
    State(state): State<AppState>,
    Json(req): Json<MagicLinkRequest>,
) -> Result<Json<serde_json::Value>, AppError> {
    if !["developer", "company"].contains(&req.role.as_str()) {
        return Err(AppError::BadRequest("Role must be 'developer' or 'company'".into()));
    }

    let raw_token =
        auth_service::create_magic_link_token(&req.email, &req.role, &state.write_db).await?;

    let magic_link = format!(
        "{}?token={}&email={}",
        state.config.magic_link_base_url, raw_token, req.email
    );

    email_service::send_magic_link_email(&req.email, &magic_link, &state.config).await?;

    Ok(Json(serde_json::json!({
        "message": "Magic link sent to your email"
    })))
}

pub async fn verify_magic_link(
    State(state): State<AppState>,
    Json(req): Json<MagicLinkVerifyRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let user =
        auth_service::verify_magic_link_token(&req.email, &req.token, &state.write_db).await?;
    let tokens = auth_service::issue_tokens(&user, &state.write_db, &state.config).await?;
    Ok(Json(tokens))
}

pub async fn refresh(
    State(state): State<AppState>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<auth_service::TokenResponse>, AppError> {
    let tokens =
        auth_service::refresh_tokens(&req.refresh_token, &state.write_db, &state.config).await?;
    Ok(Json(tokens))
}

pub async fn logout(
    State(state): State<AppState>,
    auth: AuthUser,
) -> Result<Json<serde_json::Value>, AppError> {
    auth_service::logout(&auth.user_id.to_string(), &state.write_db).await?;
    Ok(Json(serde_json::json!({"message": "Logged out"})))
}
