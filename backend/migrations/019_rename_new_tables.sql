-- Migration 019: Rename _new tables to final names.
ALTER TABLE users_new RENAME TO users;
ALTER TABLE listings_new RENAME TO listings;
ALTER TABLE magic_link_tokens_new RENAME TO magic_link_tokens;
