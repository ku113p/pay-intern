use tower_governor::key_extractor::SmartIpKeyExtractor;
use tower_governor::GovernorLayer;

pub fn global_rate_limiter(
) -> GovernorLayer<SmartIpKeyExtractor, governor::middleware::NoOpMiddleware, axum::body::Body> {
    let config = tower_governor::governor::GovernorConfigBuilder::default()
        .per_second(2)
        .burst_size(20)
        .key_extractor(SmartIpKeyExtractor)
        .finish()
        .unwrap();

    GovernorLayer::new(config)
}
