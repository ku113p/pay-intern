use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_access_secret: String,
    pub jwt_refresh_secret: String,
    pub jwt_access_expiry_secs: u64,
    pub jwt_refresh_expiry_secs: u64,
    pub google_client_id: String,
    pub google_client_secret: String,
    pub google_redirect_uri: String,
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_pass: String,
    pub smtp_from: String,
    pub smtp_tls_insecure: bool,
    pub magic_link_base_url: String,
    pub server_port: u16,
    pub cors_origin: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            database_url: required("DATABASE_URL"),
            jwt_access_secret: required("JWT_ACCESS_SECRET"),
            jwt_refresh_secret: required("JWT_REFRESH_SECRET"),
            jwt_access_expiry_secs: optional_parse("JWT_ACCESS_EXPIRY_SECS", 900),
            jwt_refresh_expiry_secs: optional_parse("JWT_REFRESH_EXPIRY_SECS", 604800),
            google_client_id: optional("GOOGLE_CLIENT_ID"),
            google_client_secret: optional("GOOGLE_CLIENT_SECRET"),
            google_redirect_uri: optional("GOOGLE_REDIRECT_URI"),
            smtp_host: optional_default("SMTP_HOST", "localhost"),
            smtp_port: optional_parse("SMTP_PORT", 1025),
            smtp_user: optional("SMTP_USER"),
            smtp_pass: optional("SMTP_PASS"),
            smtp_from: optional_default("SMTP_FROM", "noreply@devstage.local"),
            smtp_tls_insecure: optional_parse("SMTP_TLS_INSECURE", false),
            magic_link_base_url: optional_default(
                "MAGIC_LINK_BASE_URL",
                "http://localhost:5173/auth/verify",
            ),
            server_port: optional_parse("SERVER_PORT", 3000),
            cors_origin: optional_default("CORS_ORIGIN", "http://localhost:5173"),
        }
    }
}

fn required(key: &str) -> String {
    env::var(key).unwrap_or_else(|_| panic!("Missing required env var: {key}"))
}

fn optional(key: &str) -> String {
    env::var(key).unwrap_or_default()
}

fn optional_default(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_string())
}

fn optional_parse<T: std::str::FromStr>(key: &str, default: T) -> T {
    env::var(key)
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(default)
}
