CREATE TABLE notifications (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK(kind IN (
        'application_received',
        'application_accepted',
        'application_rejected',
        'review_created',
        'review_consented',
        'new_message',
        'interest_received',
        'mutual_match'
    )),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    link TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
