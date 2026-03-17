-- Migration: Dual profiles + platform generalization
-- Removes immutable role from users, renames developer/company to individual/organization,
-- extracts URLs into profile_links table, generalizes listings with categories and flexible payment.
--
-- IMPORTANT: Back up the database before running this migration.

PRAGMA foreign_keys = OFF;

-- ============================================================
-- 1. Recreate users table (remove role column)
-- ============================================================
CREATE TABLE users_new (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    auth_provider TEXT NOT NULL DEFAULT 'email'
        CHECK(auth_provider IN ('email', 'google')),
    auth_provider_id TEXT,
    deleted_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO users_new (id, email, display_name, auth_provider,
    auth_provider_id, deleted_at, created_at)
SELECT id, email, display_name, auth_provider, auth_provider_id,
    deleted_at, created_at
FROM users;

-- ============================================================
-- 2. Recreate profile tables (rename + generalize, remove URLs)
-- ============================================================
CREATE TABLE individual_profiles (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users_new(id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    profession TEXT NOT NULL DEFAULT 'other'
        CHECK(profession IN ('technology','design','marketing','finance',
            'legal','education','healthcare','engineering','creative',
            'business','trades','other')),
    skills TEXT NOT NULL DEFAULT '[]',
    experience_level TEXT NOT NULL DEFAULT 'entry'
        CHECK(experience_level IN ('entry', 'mid', 'senior', 'expert')),
    contact_email TEXT
);

INSERT INTO individual_profiles (user_id, bio, skills, experience_level, contact_email)
SELECT user_id, bio, tech_stack,
    CASE WHEN level = 'junior' THEN 'entry' ELSE level END,
    contact_email
FROM developer_profiles;

CREATE TABLE organization_profiles (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users_new(id) ON DELETE CASCADE,
    organization_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    industry TEXT NOT NULL DEFAULT 'other'
        CHECK(industry IN ('technology','design','marketing','finance',
            'legal','education','healthcare','engineering','creative',
            'business','trades','other')),
    size TEXT NOT NULL DEFAULT 'startup'
        CHECK(size IN ('solo', 'startup', 'small', 'medium', 'large', 'enterprise')),
    skills_sought TEXT NOT NULL DEFAULT '[]',
    contact_email TEXT
);

INSERT INTO organization_profiles (user_id, organization_name, description,
    size, skills_sought, contact_email)
SELECT user_id, company_name, description, size, tech_stack, contact_email
FROM company_profiles;

-- ============================================================
-- 3. Create profile_links table and migrate existing URLs
-- ============================================================
CREATE TABLE profile_links (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL REFERENCES users_new(id) ON DELETE CASCADE,
    profile_type TEXT NOT NULL CHECK(profile_type IN ('individual', 'organization')),
    link_type TEXT NOT NULL DEFAULT 'other'
        CHECK(link_type IN ('github','linkedin','portfolio','website',
            'twitter','dribbble','behance','stackoverflow','other')),
    label TEXT NOT NULL DEFAULT '',
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_profile_links_user ON profile_links(user_id, profile_type);

-- Migrate developer github_url
INSERT INTO profile_links (id, user_id, profile_type, link_type, label, url, display_order)
SELECT hex(randomblob(16)), user_id, 'individual', 'github', 'GitHub', github_url, 0
FROM developer_profiles WHERE github_url IS NOT NULL AND github_url != '';

-- Migrate developer linkedin_url
INSERT INTO profile_links (id, user_id, profile_type, link_type, label, url, display_order)
SELECT hex(randomblob(16)), user_id, 'individual', 'linkedin', 'LinkedIn', linkedin_url, 1
FROM developer_profiles WHERE linkedin_url IS NOT NULL AND linkedin_url != '';

-- Migrate company website
INSERT INTO profile_links (id, user_id, profile_type, link_type, label, url, display_order)
SELECT hex(randomblob(16)), user_id, 'organization', 'website', 'Website', website, 0
FROM company_profiles WHERE website IS NOT NULL AND website != '';

-- ============================================================
-- 4. Recreate listings table (generalize types and payment)
-- ============================================================
CREATE TABLE listings_new (
    id TEXT PRIMARY KEY NOT NULL,
    author_id TEXT NOT NULL REFERENCES users_new(id) ON DELETE CASCADE,
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
    payment_direction TEXT NOT NULL DEFAULT 'poster_pays'
        CHECK(payment_direction IN ('poster_pays', 'applicant_pays', 'negotiable', 'unpaid')),
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

INSERT INTO listings_new (id, author_id, author_role, title, description,
    skills, duration_weeks, price_usd, payment_direction, format,
    outcome_criteria, visibility, status, experience_level, created_at, updated_at)
SELECT id, author_id,
    CASE WHEN type = 'developer' THEN 'individual' ELSE 'organization' END,
    title, description, tech_stack, duration_weeks, price_usd,
    CASE
        WHEN type = 'company' AND payment_direction = 'company_pays_developer' THEN 'poster_pays'
        WHEN type = 'company' AND payment_direction = 'developer_pays_company' THEN 'applicant_pays'
        WHEN type = 'developer' AND payment_direction = 'developer_pays_company' THEN 'poster_pays'
        WHEN type = 'developer' AND payment_direction = 'company_pays_developer' THEN 'applicant_pays'
    END,
    format, outcome_criteria, visibility, status, experience_level, created_at, updated_at
FROM listings;

-- ============================================================
-- 5. Recreate magic_link_tokens (remove role column)
-- ============================================================
CREATE TABLE magic_link_tokens_new (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO magic_link_tokens_new (id, email, token_hash, expires_at, used, created_at)
SELECT id, email, token_hash, expires_at, used, created_at
FROM magic_link_tokens;

-- ============================================================
-- 6. Drop old tables and rename new ones
-- ============================================================
DROP TABLE IF EXISTS magic_link_tokens;
DROP TABLE IF EXISTS developer_profiles;
DROP TABLE IF EXISTS company_profiles;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS users;

ALTER TABLE users_new RENAME TO users;
ALTER TABLE listings_new RENAME TO listings;
ALTER TABLE magic_link_tokens_new RENAME TO magic_link_tokens;

-- ============================================================
-- 7. Recreate indexes
-- ============================================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_listings_author ON listings(author_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);
CREATE INDEX IF NOT EXISTS idx_magic_link_tokens_email ON magic_link_tokens(email);

-- ============================================================
-- 8. Verify foreign key integrity
-- ============================================================
PRAGMA foreign_key_check;

PRAGMA foreign_keys = ON;
