use axum::http::header::{AUTHORIZATION, CONTENT_TYPE};
use axum::http::{HeaderValue, Method};
use axum::routing::{delete, get, post, put};
use axum::Router;
use tower_http::cors::CorsLayer;
use tower_http::limit::RequestBodyLimitLayer;
use tower_http::trace::TraceLayer;

use crate::handlers;
use crate::middleware::rate_limit::global_rate_limiter;
use crate::AppState;

pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(
            state
                .config
                .cors_origin
                .parse::<HeaderValue>()
                .expect("Invalid CORS_ORIGIN value"),
        )
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers([AUTHORIZATION, CONTENT_TYPE]);

    let auth_routes = Router::new()
        .route("/google", post(handlers::auth::google_auth))
        .route(
            "/magic-link/request",
            post(handlers::auth::request_magic_link),
        )
        .route(
            "/magic-link/login",
            post(handlers::auth::request_magic_link_login),
        )
        .route(
            "/magic-link/verify",
            post(handlers::auth::verify_magic_link),
        )
        .route("/refresh", post(handlers::auth::refresh))
        .route("/logout", post(handlers::auth::logout))
        .route("/switch-role", post(handlers::auth::switch_role));

    let user_routes = Router::new()
        .route("/me", get(handlers::users::get_me))
        .route("/me", put(handlers::users::update_me))
        .route("/me", delete(handlers::users::delete_me));

    let profile_routes = Router::new()
        .route(
            "/individual",
            get(handlers::profiles::get_my_individual_profile),
        )
        .route(
            "/individual",
            put(handlers::profiles::upsert_my_individual_profile),
        )
        .route(
            "/individual",
            delete(handlers::profiles::delete_my_individual_profile),
        )
        .route(
            "/organization",
            get(handlers::profiles::get_my_organization_profile),
        )
        .route(
            "/organization",
            put(handlers::profiles::upsert_my_organization_profile),
        )
        .route(
            "/organization",
            delete(handlers::profiles::delete_my_organization_profile),
        )
        .route(
            "/{profile_type}/links",
            get(handlers::profiles::get_my_profile_links),
        )
        .route(
            "/{profile_type}/links",
            put(handlers::profiles::replace_my_profile_links),
        )
        .route(
            "/individual/{id}",
            get(handlers::profiles::get_public_individual_profile),
        )
        .route(
            "/organization/{id}",
            get(handlers::profiles::get_public_organization_profile),
        )
        .route(
            "/preview/{id}",
            get(handlers::profiles::get_profile_preview),
        );

    let listing_routes = Router::new()
        .route("/", post(handlers::listings::create_listing))
        .route("/mine", get(handlers::listings::my_listings))
        .route("/saved", get(handlers::interests::get_saved_listings))
        .route("/{id}", get(handlers::listings::get_listing))
        .route("/{id}", put(handlers::listings::update_listing))
        .route("/{id}", delete(handlers::listings::delete_listing))
        .route("/{id}/similar", get(handlers::listings::similar_listings))
        .route("/{id}/save", post(handlers::interests::save_listing))
        .route("/{id}/save", delete(handlers::interests::unsave_listing))
        .route("/{id}/interest", post(handlers::interests::add_interest))
        .route(
            "/{id}/interest",
            delete(handlers::interests::remove_interest),
        )
        .route(
            "/feed",
            get(handlers::listings::feed),
        );

    let application_routes = Router::new()
        .route("/", post(handlers::applications::create_application))
        .route("/", get(handlers::applications::get_applications))
        .route(
            "/{id}/status",
            put(handlers::applications::update_application_status),
        )
        .route(
            "/{id}/contact",
            get(handlers::applications::get_contact_info),
        );

    let review_routes = Router::new()
        .route("/", post(handlers::outcome_reviews::create_review))
        .route("/{id}", get(handlers::outcome_reviews::get_review))
        .route(
            "/{id}/consent",
            put(handlers::outcome_reviews::consent_review),
        );

    let interest_routes = Router::new()
        .route("/received", get(handlers::interests::get_received_interests))
        .route("/matches", get(handlers::interests::get_matches));

    let notification_routes = Router::new()
        .route("/", get(handlers::notifications::get_notifications))
        .route("/unread-count", get(handlers::notifications::get_unread_count))
        .route("/{id}/read", put(handlers::notifications::mark_read))
        .route("/read-all", put(handlers::notifications::mark_all_read))
        .route("/preferences", get(handlers::notifications::get_preferences))
        .route(
            "/preferences",
            put(handlers::notifications::update_preferences),
        );

    let message_routes = Router::new()
        .route("/conversations", get(handlers::messages::get_conversations))
        .route(
            "/conversations/unread-count",
            get(handlers::messages::get_conversations_unread_count),
        )
        .route("/{application_id}", get(handlers::messages::get_messages))
        .route("/{application_id}", post(handlers::messages::send_message))
        .route(
            "/{application_id}/read",
            put(handlers::messages::mark_read),
        );

    Router::new()
        .route("/health", get(health))
        .nest("/auth", auth_routes)
        .nest("/users", user_routes)
        .nest("/profiles", profile_routes)
        .nest("/listings", listing_routes)
        .nest("/applications", application_routes)
        .nest("/outcome-reviews", review_routes)
        .nest("/notifications", notification_routes)
        .nest("/interests", interest_routes)
        .nest("/messages", message_routes)
        .layer(RequestBodyLimitLayer::new(1024 * 1024)) // 1MB
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .layer(global_rate_limiter())
        .with_state(state)
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({"status": "ok"}))
}
