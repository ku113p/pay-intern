use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ReceivedInterest {
    pub id: String,
    pub user_name: String,
    pub listing_title: String,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct SavedListing {
    pub id: String,
    pub user_id: String,
    pub listing_id: String,
    pub created_at: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Interest {
    pub id: String,
    pub user_id: String,
    pub listing_id: String,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct SaveToggleResponse {
    pub saved: bool,
}

#[derive(Debug, Serialize)]
pub struct InterestToggleResponse {
    pub interested: bool,
    pub matched: bool,
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct MatchResponse {
    pub matched_user_id: String,
    pub matched_user_name: String,
    pub my_listing_id: String,
    pub my_listing_title: String,
    pub their_listing_id: String,
    pub their_listing_title: String,
}

#[derive(Debug, Deserialize)]
pub struct SavedListingsQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
    pub author_role: Option<String>,
}

impl SavedListingsQuery {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }

    pub fn per_page(&self) -> u32 {
        self.per_page.unwrap_or(20).clamp(1, 100)
    }

    pub fn offset(&self) -> u32 {
        (self.page() - 1) * self.per_page()
    }
}
