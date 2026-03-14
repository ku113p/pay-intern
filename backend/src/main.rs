use std::sync::Arc;

use sqlx::SqlitePool;
use tokio::net::TcpListener;
use tracing_subscriber::EnvFilter;

mod auth;
mod config;
mod db;
mod error;
mod handlers;
mod middleware;
mod models;
mod routes;
mod services;

#[derive(Clone)]
pub struct AppState {
    pub read_db: SqlitePool,
    pub write_db: SqlitePool,
    pub config: Arc<config::Config>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .init();

    let cfg = config::Config::from_env();
    let pools = db::DbPools::init(&cfg.database_url)
        .await
        .expect("Failed to initialize database");

    let port = cfg.server_port;
    let state = AppState {
        read_db: pools.read,
        write_db: pools.write,
        config: Arc::new(cfg),
    };

    let app = routes::build_router(state);
    let addr = format!("0.0.0.0:{port}");
    let listener = TcpListener::bind(&addr).await.expect("Failed to bind");

    tracing::info!("DevStage API running on {addr}");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("Server error");
}

async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("Failed to listen for ctrl+c");
    tracing::info!("Shutting down...");
}
