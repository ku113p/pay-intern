use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Notification {
    pub id: String,
    pub user_id: String,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub link: String,
    pub is_read: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct NotificationResponse {
    pub id: String,
    pub kind: String,
    pub title: String,
    pub body: String,
    pub link: String,
    pub is_read: bool,
    pub created_at: String,
}

impl From<Notification> for NotificationResponse {
    fn from(n: Notification) -> Self {
        Self {
            id: n.id,
            kind: n.kind,
            title: n.title,
            body: n.body,
            link: n.link,
            is_read: n.is_read,
            created_at: n.created_at,
        }
    }
}

#[derive(Debug, Serialize)]
pub struct UnreadCountResponse {
    pub count: i64,
}

#[derive(Debug, Deserialize)]
pub struct NotificationQuery {
    pub unread_only: Option<bool>,
    pub page: Option<u32>,
    pub per_page: Option<u32>,
}

impl NotificationQuery {
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

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct NotificationPreferences {
    pub user_id: String,
    pub email_enabled: bool,
    pub email_application_received: bool,
    pub email_application_accepted: bool,
    pub email_application_rejected: bool,
    pub email_review_created: bool,
    pub email_review_consented: bool,
}

#[derive(Debug, Deserialize)]
pub struct UpdateNotificationPreferencesRequest {
    pub email_enabled: Option<bool>,
    pub email_application_received: Option<bool>,
    pub email_application_accepted: Option<bool>,
    pub email_application_rejected: Option<bool>,
    pub email_review_created: Option<bool>,
    pub email_review_consented: Option<bool>,
}
