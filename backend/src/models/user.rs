use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct User {
    pub id: String,
    pub email: String,
    pub display_name: String,
    pub auth_provider: String,
    pub auth_provider_id: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct IndividualProfile {
    pub user_id: String,
    pub bio: String,
    pub headline: String,
    pub profession: String,
    pub skills: String, // JSON array stored as TEXT
    pub experience_level: String,
    pub contact_email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OrganizationProfile {
    pub user_id: String,
    pub organization_name: String,
    pub description: String,
    pub industry: String,
    pub size: String,
    pub skills_sought: String, // JSON array stored as TEXT
    pub contact_email: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct ProfileLink {
    pub id: String,
    pub user_id: String,
    pub profile_type: String,
    pub link_type: String,
    pub label: String,
    pub url: String,
    pub display_order: i32,
    pub created_at: String,
}

// DTOs

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateUserRequest {
    #[validate(length(min = 1, max = 100))]
    pub display_name: String,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateIndividualProfileRequest {
    #[validate(length(max = 2000))]
    pub bio: Option<String>,
    #[validate(length(max = 200))]
    pub headline: Option<String>,
    pub profession: Option<String>,
    pub skills: Option<Vec<String>>,
    pub experience_level: Option<String>,
    pub contact_email: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateOrganizationProfileRequest {
    #[validate(length(min = 1, max = 200))]
    pub organization_name: Option<String>,
    #[validate(length(max = 2000))]
    pub description: Option<String>,
    pub industry: Option<String>,
    pub size: Option<String>,
    pub skills_sought: Option<Vec<String>>,
    pub contact_email: Option<String>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct UpdateProfileLinksRequest {
    #[validate(nested)]
    pub links: Vec<ProfileLinkInput>,
}

#[derive(Debug, Deserialize, Validate)]
pub struct ProfileLinkInput {
    pub link_type: String,
    pub label: String,
    #[validate(url)]
    pub url: String,
    pub display_order: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: String,
    pub email: String,
    pub display_name: String,
    pub has_individual_profile: bool,
    pub has_organization_profile: bool,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct IndividualProfileResponse {
    pub user_id: String,
    pub bio: String,
    pub headline: String,
    pub profession: String,
    pub skills: Vec<String>,
    pub experience_level: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact_email: Option<String>,
    pub links: Vec<ProfileLinkResponse>,
}

#[derive(Debug, Serialize)]
pub struct OrganizationProfileResponse {
    pub user_id: String,
    pub organization_name: String,
    pub description: String,
    pub industry: String,
    pub size: String,
    pub skills_sought: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contact_email: Option<String>,
    pub links: Vec<ProfileLinkResponse>,
}

#[derive(Debug, Clone, Serialize)]
pub struct ProfileLinkResponse {
    pub id: String,
    pub link_type: String,
    pub label: String,
    pub url: String,
    pub display_order: i32,
}

impl From<ProfileLink> for ProfileLinkResponse {
    fn from(l: ProfileLink) -> Self {
        Self {
            id: l.id,
            link_type: l.link_type,
            label: l.label,
            url: l.url,
            display_order: l.display_order,
        }
    }
}

impl IndividualProfile {
    pub fn to_response(&self, links: Vec<ProfileLinkResponse>) -> IndividualProfileResponse {
        let skills: Vec<String> = serde_json::from_str(&self.skills).unwrap_or_default();
        IndividualProfileResponse {
            user_id: self.user_id.clone(),
            bio: self.bio.clone(),
            headline: self.headline.clone(),
            profession: self.profession.clone(),
            skills,
            experience_level: self.experience_level.clone(),
            contact_email: self.contact_email.clone(),
            links,
        }
    }
}

impl OrganizationProfile {
    pub fn to_response(&self, links: Vec<ProfileLinkResponse>) -> OrganizationProfileResponse {
        let skills_sought: Vec<String> =
            serde_json::from_str(&self.skills_sought).unwrap_or_default();
        OrganizationProfileResponse {
            user_id: self.user_id.clone(),
            organization_name: self.organization_name.clone(),
            description: self.description.clone(),
            industry: self.industry.clone(),
            size: self.size.clone(),
            skills_sought,
            contact_email: self.contact_email.clone(),
            links,
        }
    }
}

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct ProfilePreview {
    pub user_id: String,
    pub display_name: String,
    pub bio_excerpt: String,
    pub skills: String,
    pub level_or_size: String,
    pub active_listing_count: i64,
    pub has_individual_profile: bool,
    pub has_organization_profile: bool,
}

#[derive(Debug, Serialize)]
pub struct ProfilePreviewResponse {
    pub user_id: String,
    pub display_name: String,
    pub bio_excerpt: String,
    pub skills: Vec<String>,
    pub level_or_size: String,
    pub active_listing_count: i64,
    pub has_individual_profile: bool,
    pub has_organization_profile: bool,
}

impl From<ProfilePreview> for ProfilePreviewResponse {
    fn from(p: ProfilePreview) -> Self {
        let skills: Vec<String> = serde_json::from_str(&p.skills).unwrap_or_default();
        Self {
            user_id: p.user_id,
            display_name: p.display_name,
            bio_excerpt: p.bio_excerpt,
            skills,
            level_or_size: p.level_or_size,
            active_listing_count: p.active_listing_count,
            has_individual_profile: p.has_individual_profile,
            has_organization_profile: p.has_organization_profile,
        }
    }
}
