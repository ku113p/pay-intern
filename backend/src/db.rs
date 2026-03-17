use sqlx::sqlite::{SqliteConnectOptions, SqliteJournalMode, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;
use std::time::Duration;

pub struct DbPools {
    pub read: SqlitePool,
    pub write: SqlitePool,
}

impl DbPools {
    pub async fn init(database_url: &str) -> Result<Self, sqlx::Error> {
        // Ensure parent directory exists for the db file
        if let Some(path) = database_url.strip_prefix("sqlite://") {
            if let Some(parent) = std::path::Path::new(path).parent() {
                std::fs::create_dir_all(parent).ok();
            }
        }

        // Run migrations on a connection without foreign keys enabled.
        // PRAGMA foreign_keys is a no-op inside transactions, and sqlx wraps
        // each migration in a transaction, so table-recreation migrations
        // (which need FK off to avoid cascading DELETEs) must run on a
        // connection that never enabled FK in the first place.
        let migrate_opts = SqliteConnectOptions::from_str(database_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .foreign_keys(false)
            .busy_timeout(Duration::from_secs(5))
            .create_if_missing(true);

        let migrate_pool = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(migrate_opts)
            .await?;

        sqlx::migrate!().run(&migrate_pool).await?;
        migrate_pool.close().await;

        let write_opts = SqliteConnectOptions::from_str(database_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .foreign_keys(true)
            .busy_timeout(Duration::from_secs(5))
            .create_if_missing(true);

        let write = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(write_opts)
            .await?;

        let read_opts = SqliteConnectOptions::from_str(database_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .foreign_keys(true)
            .read_only(true);

        let read = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(read_opts)
            .await?;

        Ok(Self { read, write })
    }
}
