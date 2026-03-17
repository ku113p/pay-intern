use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Listing {
    pub id: String,
    pub author_id: String,
    pub author_role: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub skills: String,
    pub duration_weeks: i32,
    pub price_usd: Option<f64>,
    pub payment_direction: String,
    pub format: String,
    pub outcome_criteria: Option<String>,
    pub visibility: String,
    pub status: String,
    pub experience_level: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, sqlx::FromRow)]
pub struct ListingWithAuthor {
    pub id: String,
    pub author_id: String,
    pub author_role: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub skills: String,
    pub duration_weeks: i32,
    pub price_usd: Option<f64>,
    pub payment_direction: String,
    pub format: String,
    pub outcome_criteria: Option<String>,
    pub visibility: String,
    pub status: String,
    pub experience_level: String,
    pub created_at: String,
    pub updated_at: String,
    pub author_display_name: Option<String>,
    pub organization_name: Option<String>,
    pub individual_level: Option<String>,
    pub author_email_domain: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateListingRequest {
    #[validate(length(min = 3, max = 200))]
    pub title: String,
    #[validate(length(min = 10, max = 5000))]
    pub description: String,
    pub category: Option<String>,
    pub skills: Vec<String>,
    #[validate(range(min = 1, max = 52))]
    pub duration_weeks: i32,
    pub price_usd: Option<f64>,
    pub payment_direction: Option<String>,
    pub format: String,
    pub outcome_criteria: Option<Vec<String>>,
    pub visibility: Option<String>,
    pub experience_level: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateListingRequest {
    #[validate(length(min = 3, max = 200))]
    pub title: Option<String>,
    #[validate(length(min = 10, max = 5000))]
    pub description: Option<String>,
    pub category: Option<String>,
    pub skills: Option<Vec<String>>,
    #[validate(range(min = 1, max = 52))]
    pub duration_weeks: Option<i32>,
    pub price_usd: Option<f64>,
    pub payment_direction: Option<String>,
    pub format: Option<String>,
    pub outcome_criteria: Option<Vec<String>>,
    pub visibility: Option<String>,
    pub status: Option<String>,
    pub experience_level: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ListingFeedQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub skills: Option<String>,
    pub category: Option<String>,
    pub author_role: Option<String>,
    pub payment_direction: Option<String>,
    pub format: Option<String>,
    pub min_weeks: Option<i32>,
    pub max_weeks: Option<i32>,
    pub min_price: Option<f64>,
    pub max_price: Option<f64>,
    pub sort: Option<String>,
    pub experience_level: Option<String>,
    pub search: Option<String>,
}

impl ListingFeedQuery {
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
pub struct ListingResponse {
    pub id: String,
    pub author_id: String,
    pub author_role: String,
    pub title: String,
    pub description: String,
    pub category: String,
    pub skills: Vec<String>,
    pub duration_weeks: i32,
    pub price_usd: Option<f64>,
    pub payment_direction: String,
    pub format: String,
    pub outcome_criteria: Option<Vec<String>>,
    pub visibility: String,
    pub status: String,
    pub experience_level: String,
    pub created_at: String,
    pub updated_at: String,
    pub author_display_name: Option<String>,
    pub organization_name: Option<String>,
    pub individual_level: Option<String>,
    pub author_email_domain: Option<String>,
}

impl From<Listing> for ListingResponse {
    fn from(l: Listing) -> Self {
        let skills: Vec<String> = serde_json::from_str(&l.skills).unwrap_or_default();
        let outcome_criteria: Option<Vec<String>> = l
            .outcome_criteria
            .as_ref()
            .and_then(|c| serde_json::from_str(c).ok());
        Self {
            id: l.id,
            author_id: l.author_id,
            author_role: l.author_role,
            title: l.title,
            description: l.description,
            category: l.category,
            skills,
            duration_weeks: l.duration_weeks,
            price_usd: l.price_usd,
            payment_direction: l.payment_direction,
            format: l.format,
            outcome_criteria,
            visibility: l.visibility,
            status: l.status,
            experience_level: l.experience_level,
            created_at: l.created_at,
            updated_at: l.updated_at,
            author_display_name: None,
            organization_name: None,
            individual_level: None,
            author_email_domain: None,
        }
    }
}

impl From<ListingWithAuthor> for ListingResponse {
    fn from(l: ListingWithAuthor) -> Self {
        let skills: Vec<String> = serde_json::from_str(&l.skills).unwrap_or_default();
        let outcome_criteria: Option<Vec<String>> = l
            .outcome_criteria
            .as_ref()
            .and_then(|c| serde_json::from_str(c).ok());
        Self {
            id: l.id,
            author_id: l.author_id,
            author_role: l.author_role,
            title: l.title,
            description: l.description,
            category: l.category,
            skills,
            duration_weeks: l.duration_weeks,
            price_usd: l.price_usd,
            payment_direction: l.payment_direction,
            format: l.format,
            outcome_criteria,
            visibility: l.visibility,
            status: l.status,
            experience_level: l.experience_level,
            created_at: l.created_at,
            updated_at: l.updated_at,
            author_display_name: l.author_display_name,
            organization_name: l.organization_name,
            individual_level: l.individual_level,
            author_email_domain: l.author_email_domain,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct PaginationQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl PaginationQuery {
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
pub struct PaginatedResponse<T: Serialize> {
    pub data: Vec<T>,
    pub pagination: PaginationMeta,
}

#[derive(Debug, Serialize)]
pub struct PaginationMeta {
    pub page: u32,
    pub per_page: u32,
    pub total: u32,
    pub total_pages: u32,
}
