use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Application {
    pub id: String,
    pub listing_id: String,
    pub applicant_id: String,
    pub message: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateApplicationRequest {
    pub listing_id: String,
    #[validate(length(min = 10, max = 2000))]
    pub message: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateApplicationStatusRequest {
    pub status: String,
}

#[derive(Debug, Deserialize)]
pub struct ApplicationQuery {
    pub r#as: Option<String>,
    pub status: Option<String>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl ApplicationQuery {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn per_page(&self) -> u32 {
        self.per_page.unwrap_or(20).min(100).max(1)
    }

    pub fn offset(&self) -> u32 {
        (self.page() - 1) * self.per_page()
    }
}

#[derive(Debug, Serialize)]
pub struct ApplicationResponse {
    pub id: String,
    pub listing_id: String,
    pub applicant_id: String,
    pub message: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<Application> for ApplicationResponse {
    fn from(a: Application) -> Self {
        Self {
            id: a.id,
            listing_id: a.listing_id,
            applicant_id: a.applicant_id,
            message: a.message,
            status: a.status,
            created_at: a.created_at,
            updated_at: a.updated_at,
        }
    }
}
