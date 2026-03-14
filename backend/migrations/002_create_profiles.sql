CREATE TABLE developer_profiles (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bio TEXT NOT NULL DEFAULT '',
    tech_stack TEXT NOT NULL DEFAULT '[]',
    github_url TEXT,
    linkedin_url TEXT,
    level TEXT NOT NULL DEFAULT 'junior' CHECK(level IN ('junior', 'mid', 'senior'))
);

CREATE TABLE company_profiles (
    user_id TEXT PRIMARY KEY NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    website TEXT,
    size TEXT NOT NULL DEFAULT 'startup' CHECK(size IN ('startup', 'small', 'medium', 'large')),
    tech_stack TEXT NOT NULL DEFAULT '[]'
);
