use governor::middleware::NoOpMiddleware;
use tower_governor::key_extractor::KeyExtractor;
use tower_governor::GovernorLayer;

#[derive(Clone, Debug)]
pub struct UserIpKeyExtractor;

impl KeyExtractor for UserIpKeyExtractor {
    type Key = String;

    fn extract<T>(
        &self,
        req: &axum::http::Request<T>,
    ) -> Result<Self::Key, tower_governor::GovernorError> {
        if let Some(auth) = req.headers().get("Authorization") {
            if let Ok(auth_str) = auth.to_str() {
                if let Some(token) = auth_str.strip_prefix("Bearer ") {
                    let key = &token[..token.len().min(32)];
                    return Ok(key.to_string());
                }
            }
        }

        if let Some(forwarded) = req.headers().get("X-Forwarded-For") {
            if let Ok(ip) = forwarded.to_str() {
                if let Some(first_ip) = ip.split(',').next() {
                    return Ok(first_ip.trim().to_string());
                }
            }
        }

        Ok("unknown".to_string())
    }
}

pub fn global_rate_limiter(
) -> GovernorLayer<UserIpKeyExtractor, NoOpMiddleware<governor::clock::QuantaInstant>> {
    let config = tower_governor::governor::GovernorConfigBuilder::default()
        .per_second(2)
        .burst_size(20)
        .key_extractor(UserIpKeyExtractor)
        .finish()
        .unwrap();

    GovernorLayer {
        config: std::sync::Arc::new(config),
    }
}
