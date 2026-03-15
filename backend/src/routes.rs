use axum::routing::{delete, get, post, put};
use axum::Router;
use tower_http::cors::{Any, CorsLayer};
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::TraceLayer;

use crate::handlers;
use crate::AppState;

pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let auth_routes = Router::new()
        .route("/google", post(handlers::auth::google_auth))
        .route(
            "/magic-link/request",
            post(handlers::auth::request_magic_link),
        )
        .route(
            "/magic-link/verify",
            post(handlers::auth::verify_magic_link),
        )
        .route("/refresh", post(handlers::auth::refresh))
        .route("/logout", post(handlers::auth::logout));

    let user_routes = Router::new()
        .route("/me", get(handlers::users::get_me))
        .route("/me", put(handlers::users::update_me));

    let profile_routes = Router::new()
        .route("/developer", get(handlers::profiles::get_my_developer_profile))
        .route("/developer", put(handlers::profiles::update_my_developer_profile))
        .route("/company", get(handlers::profiles::get_my_company_profile))
        .route("/company", put(handlers::profiles::update_my_company_profile))
        .route(
            "/developer/{id}",
            get(handlers::profiles::get_public_developer_profile),
        )
        .route(
            "/company/{id}",
            get(handlers::profiles::get_public_company_profile),
        );

    let listing_routes = Router::new()
        .route("/", post(handlers::listings::create_listing))
        .route("/mine", get(handlers::listings::my_listings))
        .route("/{id}", get(handlers::listings::get_listing))
        .route("/{id}", put(handlers::listings::update_listing))
        .route("/{id}", delete(handlers::listings::delete_listing))
        .route(
            "/feed/developers",
            get(handlers::listings::developer_feed),
        )
        .route(
            "/feed/companies",
            get(handlers::listings::company_feed),
        );

    let application_routes = Router::new()
        .route("/", post(handlers::applications::create_application))
        .route("/", get(handlers::applications::get_applications))
        .route(
            "/{id}/status",
            put(handlers::applications::update_application_status),
        );

    let review_routes = Router::new()
        .route("/", post(handlers::outcome_reviews::create_review))
        .route("/{id}", get(handlers::outcome_reviews::get_review))
        .route(
            "/{id}/consent",
            put(handlers::outcome_reviews::consent_review),
        );

    Router::new()
        .route("/health", get(health))
        .nest("/auth", auth_routes)
        .nest("/users", user_routes)
        .nest("/profiles", profile_routes)
        .nest("/listings", listing_routes)
        .nest("/applications", application_routes)
        .nest("/outcome-reviews", review_routes)
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({"status": "ok"}))
}
