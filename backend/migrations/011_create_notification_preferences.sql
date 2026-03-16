CREATE TABLE notification_preferences (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email_enabled INTEGER NOT NULL DEFAULT 1,
    email_application_received INTEGER NOT NULL DEFAULT 1,
    email_application_accepted INTEGER NOT NULL DEFAULT 1,
    email_application_rejected INTEGER NOT NULL DEFAULT 1,
    email_review_created INTEGER NOT NULL DEFAULT 1,
    email_review_consented INTEGER NOT NULL DEFAULT 1
);
