use chrono::Utc;
use jsonwebtoken::{decode, encode, Algorithm, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::config::Config;
use crate::error::AppError;

#[derive(Debug, Serialize, Deserialize)]
pub struct AccessClaims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RefreshClaims {
    pub sub: String,
    pub family_id: String,
    pub exp: usize,
}

pub fn encode_access_token(
    user_id: &Uuid,
    role: &str,
    config: &Config,
) -> Result<String, AppError> {
    let exp = (Utc::now().timestamp() as u64 + config.jwt_access_expiry_secs) as usize;
    let claims = AccessClaims {
        sub: user_id.to_string(),
        role: role.to_string(),
        exp,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(config.jwt_access_secret.as_bytes()),
    )?;
    Ok(token)
}

pub fn decode_access_token(token: &str, config: &Config) -> Result<AccessClaims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.algorithms = vec![Algorithm::HS256];

    let data = decode::<AccessClaims>(
        token,
        &DecodingKey::from_secret(config.jwt_access_secret.as_bytes()),
        &validation,
    )?;
    Ok(data.claims)
}

pub fn encode_refresh_token(
    user_id: &Uuid,
    family_id: &Uuid,
    config: &Config,
) -> Result<String, AppError> {
    let exp = (Utc::now().timestamp() as u64 + config.jwt_refresh_expiry_secs) as usize;
    let claims = RefreshClaims {
        sub: user_id.to_string(),
        family_id: family_id.to_string(),
        exp,
    };
    let token = encode(
        &Header::new(Algorithm::HS256),
        &claims,
        &EncodingKey::from_secret(config.jwt_refresh_secret.as_bytes()),
    )?;
    Ok(token)
}

pub fn decode_refresh_token(token: &str, config: &Config) -> Result<RefreshClaims, AppError> {
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;
    validation.algorithms = vec![Algorithm::HS256];

    let data = decode::<RefreshClaims>(
        token,
        &DecodingKey::from_secret(config.jwt_refresh_secret.as_bytes()),
        &validation,
    )?;
    Ok(data.claims)
}

pub fn generate_raw_token() -> String {
    use rand::RngCore;
    let mut rng = rand::thread_rng();
    let mut bytes = [0u8; 64];
    rng.fill_bytes(&mut bytes);
    hex::encode(bytes)
}

pub fn hash_token(raw: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    format!("{:x}", hasher.finalize())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_config() -> Config {
        Config {
            database_url: String::new(),
            jwt_access_secret: "test-access-secret-key-min-32-bytes!!".into(),
            jwt_refresh_secret: "test-refresh-secret-key-min-32-bytes!".into(),
            jwt_access_expiry_secs: 900,
            jwt_refresh_expiry_secs: 604800,
            google_client_id: String::new(),
            google_client_secret: String::new(),
            google_redirect_uri: String::new(),
            smtp_host: String::new(),
            smtp_port: 1025,
            smtp_user: String::new(),
            smtp_pass: String::new(),
            smtp_from: String::new(),
            magic_link_base_url: String::new(),
            server_port: 3000,
        }
    }

    #[test]
    fn test_access_token_roundtrip() {
        let config = test_config();
        let user_id = Uuid::new_v4();
        let token = encode_access_token(&user_id, "developer", &config).unwrap();
        let claims = decode_access_token(&token, &config).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.role, "developer");
    }

    #[test]
    fn test_refresh_token_roundtrip() {
        let config = test_config();
        let user_id = Uuid::new_v4();
        let family_id = Uuid::new_v4();
        let token = encode_refresh_token(&user_id, &family_id, &config).unwrap();
        let claims = decode_refresh_token(&token, &config).unwrap();
        assert_eq!(claims.sub, user_id.to_string());
        assert_eq!(claims.family_id, family_id.to_string());
    }

    #[test]
    fn test_wrong_secret_fails() {
        let config = test_config();
        let user_id = Uuid::new_v4();
        let token = encode_access_token(&user_id, "developer", &config).unwrap();

        let mut bad_config = test_config();
        bad_config.jwt_access_secret = "wrong-secret-key-that-is-different!!!!".into();
        assert!(decode_access_token(&token, &bad_config).is_err());
    }

    #[test]
    fn test_hash_token_consistency() {
        let raw = "test-token-value";
        let hash1 = hash_token(raw);
        let hash2 = hash_token(raw);
        assert_eq!(hash1, hash2);
        assert_ne!(hash1, hash_token("different-token"));
    }
}
