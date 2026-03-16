CREATE TABLE messages (
    id TEXT PRIMARY KEY NOT NULL,
    application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    read_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_application ON messages(application_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(application_id, read_at) WHERE read_at IS NULL;
