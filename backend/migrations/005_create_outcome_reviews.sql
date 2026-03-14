CREATE TABLE outcome_reviews (
    id TEXT PRIMARY KEY NOT NULL,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    reviewer_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    criteria_results TEXT NOT NULL DEFAULT '[]',
    overall_recommendation TEXT NOT NULL CHECK(overall_recommendation IN ('ready_to_hire', 'needs_practice', 'not_recommended')),
    comment TEXT NOT NULL DEFAULT '',
    visible_in_profile INTEGER NOT NULL DEFAULT 0,
    developer_response TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(application_id)
);
