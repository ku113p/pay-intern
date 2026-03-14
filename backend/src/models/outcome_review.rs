use serde::{Deserialize, Serialize};
use validator::Validate;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct OutcomeReview {
    pub id: String,
    pub application_id: String,
    pub reviewer_id: String,
    pub criteria_results: String,
    pub overall_recommendation: String,
    pub comment: String,
    pub visible_in_profile: bool,
    pub developer_response: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CriterionResult {
    pub criterion: String,
    pub result: String, // pass | partial | fail
}

#[derive(Debug, Deserialize, Validate)]
pub struct CreateOutcomeReviewRequest {
    pub application_id: String,
    pub criteria_results: Vec<CriterionResult>,
    pub overall_recommendation: String,
    #[validate(length(max = 5000))]
    pub comment: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct ConsentReviewRequest {
    pub visible_in_profile: bool,
    #[serde(default)]
    pub developer_response: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct OutcomeReviewResponse {
    pub id: String,
    pub application_id: String,
    pub reviewer_id: String,
    pub criteria_results: Vec<CriterionResult>,
    pub overall_recommendation: String,
    pub comment: String,
    pub visible_in_profile: bool,
    pub developer_response: Option<String>,
    pub created_at: String,
}

impl From<OutcomeReview> for OutcomeReviewResponse {
    fn from(r: OutcomeReview) -> Self {
        let criteria_results: Vec<CriterionResult> =
            serde_json::from_str(&r.criteria_results).unwrap_or_default();
        Self {
            id: r.id,
            application_id: r.application_id,
            reviewer_id: r.reviewer_id,
            criteria_results,
            overall_recommendation: r.overall_recommendation,
            comment: r.comment,
            visible_in_profile: r.visible_in_profile,
            developer_response: r.developer_response,
            created_at: r.created_at,
        }
    }
}
