-- Migration 018: Drop old tables (data already copied to new tables in 017).
DROP TABLE IF EXISTS magic_link_tokens;
DROP TABLE IF EXISTS developer_profiles;
DROP TABLE IF EXISTS company_profiles;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS users;
