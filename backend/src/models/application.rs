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
    pub listing_author_role: String,
    pub applicant_name: String,
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
    pub listing_author_role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub applicant_name: Option<String>,
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
            listing_author_role: None,
            applicant_name: None,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct ContactInfoResponse {
    pub user_id: String,
    pub display_name: String,
    pub email: String,
    pub links: Vec<crate::models::user::ProfileLinkResponse>,
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
            listing_author_role: Some(a.listing_author_role),
            applicant_name: Some(a.applicant_name),
        }
    }
}
