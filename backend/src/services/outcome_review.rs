use sqlx::SqlitePool;
use uuid::Uuid;

use crate::error::AppError;
use crate::models::application::Application;
use crate::models::listing::Listing;
use crate::models::outcome_review::*;

pub async fn create_review(
    reviewer_id: &Uuid,
    req: &CreateOutcomeReviewRequest,
    write_db: &SqlitePool,
) -> Result<OutcomeReview, AppError> {
    // Validate recommendation
    if !["ready_to_hire", "needs_practice", "not_recommended"]
        .contains(&req.overall_recommendation.as_str())
    {
        return Err(AppError::BadRequest("Invalid recommendation value".into()));
    }

    // Validate criteria results
    for cr in &req.criteria_results {
        if !["pass", "partial", "fail"].contains(&cr.result.as_str()) {
            return Err(AppError::BadRequest(
                format!("Invalid result '{}' for criterion '{}'", cr.result, cr.criterion),
            ));
        }
    }

    // Check application exists and is accepted
    let app = sqlx::query_as::<_, Application>(
        "SELECT * FROM applications WHERE id = ? AND status = 'accepted'",
    )
    .bind(&req.application_id)
    .fetch_optional(write_db)
    .await?
    .ok_or_else(|| AppError::NotFound("Accepted application not found".into()))?;

    // Verify reviewer is the listing owner
    let listing = sqlx::query_as::<_, Listing>("SELECT * FROM listings WHERE id = ?")
        .bind(&app.listing_id)
        .fetch_one(write_db)
        .await?;

    if listing.author_id != reviewer_id.to_string() {
        return Err(AppError::Forbidden("Only the listing owner can create reviews".into()));
    }

    let id = Uuid::new_v4().to_string();
    let criteria_json = serde_json::to_string(&req.criteria_results).unwrap_or_default();
    let comment = req.comment.as_deref().unwrap_or("");

    sqlx::query(
        "INSERT INTO outcome_reviews (id, application_id, reviewer_id, criteria_results, overall_recommendation, comment) VALUES (?, ?, ?, ?, ?, ?)"
    )
    .bind(&id)
    .bind(&req.application_id)
    .bind(reviewer_id.to_string())
    .bind(&criteria_json)
    .bind(&req.overall_recommendation)
    .bind(comment)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, OutcomeReview>("SELECT * FROM outcome_reviews WHERE id = ?")
        .bind(&id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}

pub async fn get_review(
    review_id: &str,
    viewer_id: &Uuid,
    read_db: &SqlitePool,
) -> Result<OutcomeReview, AppError> {
    let review = sqlx::query_as::<_, OutcomeReview>("SELECT * FROM outcome_reviews WHERE id = ?")
        .bind(review_id)
        .fetch_one(read_db)
        .await?;

    // Check visibility: reviewer or reviewed party
    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(&review.application_id)
        .fetch_one(read_db)
        .await?;

    let viewer_str = viewer_id.to_string();
    if review.reviewer_id != viewer_str && app.applicant_id != viewer_str {
        if review.visible_in_profile {
            // Public review — anyone can see
            return Ok(review);
        }
        return Err(AppError::Forbidden("Not authorized to view this review".into()));
    }

    Ok(review)
}

pub async fn consent_review(
    review_id: &str,
    developer_id: &Uuid,
    req: &ConsentReviewRequest,
    write_db: &SqlitePool,
) -> Result<OutcomeReview, AppError> {
    let review = sqlx::query_as::<_, OutcomeReview>("SELECT * FROM outcome_reviews WHERE id = ?")
        .bind(review_id)
        .fetch_one(write_db)
        .await?;

    // Verify the caller is the reviewed developer
    let app = sqlx::query_as::<_, Application>("SELECT * FROM applications WHERE id = ?")
        .bind(&review.application_id)
        .fetch_one(write_db)
        .await?;

    if app.applicant_id != developer_id.to_string() {
        return Err(AppError::Forbidden("Only the reviewed party can consent".into()));
    }

    sqlx::query(
        "UPDATE outcome_reviews SET visible_in_profile = ?, developer_response = ? WHERE id = ?"
    )
    .bind(req.visible_in_profile)
    .bind(&req.developer_response)
    .bind(review_id)
    .execute(write_db)
    .await?;

    sqlx::query_as::<_, OutcomeReview>("SELECT * FROM outcome_reviews WHERE id = ?")
        .bind(review_id)
        .fetch_one(write_db)
        .await
        .map_err(Into::into)
}
