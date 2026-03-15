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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ApplicationWithDetails {
    pub id: String,
    pub listing_id: String,
    pub applicant_id: String,
    pub message: String,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub listing_title: String,
    pub listing_type: String,
    pub applicant_name: String,
    pub applicant_role: String,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub listing_title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub listing_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub applicant_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub applicant_role: Option<String>,
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
            listing_title: None,
            listing_type: None,
            applicant_name: None,
            applicant_role: None,
        }
    }
}

impl From<ApplicationWithDetails> for ApplicationResponse {
    fn from(a: ApplicationWithDetails) -> Self {
        Self {
            id: a.id,
            listing_id: a.listing_id,
            applicant_id: a.applicant_id,
            message: a.message,
            status: a.status,
            created_at: a.created_at,
            updated_at: a.updated_at,
            listing_title: Some(a.listing_title),
            listing_type: Some(a.listing_type),
            applicant_name: Some(a.applicant_name),
            applicant_role: Some(a.applicant_role),
        }
    }
}
