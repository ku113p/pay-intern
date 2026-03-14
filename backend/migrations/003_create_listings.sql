CREATE TABLE listings (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK(type IN ('developer', 'company')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    tech_stack TEXT NOT NULL DEFAULT '[]',
    duration_weeks INTEGER NOT NULL,
    price_usd REAL,
    format TEXT NOT NULL CHECK(format IN ('remote', 'onsite', 'hybrid')),
    outcome_criteria TEXT,
    visibility TEXT NOT NULL DEFAULT 'public' CHECK(visibility IN ('public', 'authenticated', 'private')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'closed')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_listings_author ON listings(author_id);
CREATE INDEX idx_listings_type_status ON listings(type, status);
