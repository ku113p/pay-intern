pub mod application;
pub mod interest;
pub mod listing;
pub mod message;
pub mod notification;
pub mod outcome_review;
pub mod user;

pub fn opposite_role(role: &str) -> &'static str {
    if role == "individual" {
        "organization"
    } else {
        "individual"
    }
}
