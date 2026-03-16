CREATE TABLE applications_new (
    id TEXT PRIMARY KEY NOT NULL,
    listing_id TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    applicant_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(listing_id, applicant_id)
);
INSERT INTO applications_new SELECT * FROM applications;
DROP TABLE applications;
ALTER TABLE applications_new RENAME TO applications;
CREATE INDEX idx_applications_listing ON applications(listing_id);
CREATE INDEX idx_applications_applicant ON applications(applicant_id);
