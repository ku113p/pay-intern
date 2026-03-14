use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub role: String,
    pub display_name: String,
    pub auth_provider: String,
    pub auth_provider_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct DeveloperProfile {
    pub user_id: String,
    pub bio: String,
    pub tech_stack: String, // JSON array stored as TEXT
    pub github_url: Option<String>,
    pub linkedin_url: Option<String>,
    pub level: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct CompanyProfile {
    pub user_id: String,
    pub company_name: String,
    pub description: String,
    pub website: Option<String>,
    pub size: String,
    pub tech_stack: String, // JSON array stored as TEXT
}

// DTOs

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100))]
    pub display_name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateDeveloperProfileRequest {
    #[validate(length(max = 2000))]
    pub bio: Option<String>,
    pub tech_stack: Option<Vec<String>>,
    pub github_url: Option<String>,
    pub linkedin_url: Option<String>,
    pub level: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateCompanyProfileRequest {
    #[validate(length(min = 1, max = 200))]
    pub company_name: Option<String>,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub website: Option<String>,
    pub size: Option<String>,
    pub tech_stack: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub role: String,
    pub display_name: String,
    pub created_at: String,
}

impl From<User> for UserResponse {
    fn from(u: User) -> Self {
        Self {
            id: u.id,
            email: u.email,
            role: u.role,
            display_name: u.display_name,
            created_at: u.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct DeveloperProfileResponse {
    pub user_id: String,
    pub bio: String,
    pub tech_stack: Vec<String>,
    pub github_url: Option<String>,
    pub linkedin_url: Option<String>,
    pub level: String,
}

impl From<DeveloperProfile> for DeveloperProfileResponse {
    fn from(p: DeveloperProfile) -> Self {
        let tech_stack: Vec<String> =
            serde_json::from_str(&p.tech_stack).unwrap_or_default();
        Self {
            user_id: p.user_id,
            bio: p.bio,
            tech_stack,
            github_url: p.github_url,
            linkedin_url: p.linkedin_url,
            level: p.level,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct CompanyProfileResponse {
    pub user_id: String,
    pub company_name: String,
    pub description: String,
    pub website: Option<String>,
    pub size: String,
    pub tech_stack: Vec<String>,
}

impl From<CompanyProfile> for CompanyProfileResponse {
    fn from(p: CompanyProfile) -> Self {
        let tech_stack: Vec<String> =
            serde_json::from_str(&p.tech_stack).unwrap_or_default();
        Self {
            user_id: p.user_id,
            company_name: p.company_name,
            description: p.description,
            website: p.website,
            size: p.size,
            tech_stack,
        }
    }
}
