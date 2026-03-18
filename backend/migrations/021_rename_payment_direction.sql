-- Migration 021: Rename payment_direction values
-- poster_pays -> organization_pays, applicant_pays -> individual_pays

CREATE TABLE listings_new (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    author_role TEXT NOT NULL CHECK(author_role IN ('individual', 'organization')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'other'
        CHECK(category IN ('technology','design','marketing','finance',
            'legal','education','healthcare','engineering','creative',
            'business','trades','other')),
    skills TEXT NOT NULL DEFAULT '[]',
    duration_weeks INTEGER NOT NULL,
    price_usd REAL,
    payment_direction TEXT NOT NULL DEFAULT 'organization_pays'
        CHECK(payment_direction IN ('organization_pays', 'individual_pays', 'negotiable', 'unpaid')),
    format TEXT NOT NULL CHECK(format IN ('remote', 'onsite', 'hybrid')),
    outcome_criteria TEXT,
    visibility TEXT NOT NULL DEFAULT 'public'
        CHECK(visibility IN ('public', 'authenticated', 'private')),
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK(status IN ('draft', 'active', 'closed')),
    experience_level TEXT NOT NULL DEFAULT 'any'
        CHECK(experience_level IN ('entry', 'mid', 'senior', 'expert', 'any')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO listings_new (id, author_id, author_role, title, description, category,
    skills, duration_weeks, price_usd, payment_direction, format,
    outcome_criteria, visibility, status, experience_level, created_at, updated_at)
SELECT id, author_id, author_role, title, description, category,
    skills, duration_weeks, price_usd,
    CASE
        WHEN payment_direction = 'poster_pays' THEN 'organization_pays'
        WHEN payment_direction = 'applicant_pays' THEN 'individual_pays'
        ELSE payment_direction
    END,
    format, outcome_criteria, visibility, status, experience_level, created_at, updated_at
FROM listings;

DROP TABLE listings;
ALTER TABLE listings_new RENAME TO listings;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_listings_author ON listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
