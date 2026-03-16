use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use validator::Validate;

#[derive(Debug, FromRow)]
pub struct Message {
    pub id: String,
    pub application_id: String,
    pub sender_id: String,
    pub body: String,
    pub read_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub id: String,
    pub application_id: String,
    pub sender_id: String,
    pub sender_name: String,
    pub body: String,
    pub is_read: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct SendMessageRequest {
    #[validate(length(min = 1, max = 2000))]
    pub body: String,
}

#[derive(Debug, Serialize, FromRow)]
pub struct ConversationSummary {
    pub application_id: String,
    pub listing_title: String,
    pub other_party_id: String,
    pub other_party_name: String,
    pub other_party_role: String,
    pub last_message_body: String,
    pub last_message_at: String,
    pub unread_count: i64,
}

#[derive(Debug, Serialize)]
pub struct ConversationsUnreadCount {
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl MessageQuery {
    pub fn page(&self) -> u32 {
        self.page.unwrap_or(1).max(1)
    }
    pub fn per_page(&self) -> u32 {
        self.per_page.unwrap_or(50).min(100)
    }
    pub fn offset(&self) -> u32 {
        (self.page() - 1) * self.per_page()
    }
}
