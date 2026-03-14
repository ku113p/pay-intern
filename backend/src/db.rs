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

        let write_opts = SqliteConnectOptions::from_str(database_url)?
            .journal_mode(SqliteJournalMode::Wal)
            .foreign_keys(true)
            .busy_timeout(Duration::from_secs(5))
            .create_if_missing(true);

        let write = SqlitePoolOptions::new()
            .max_connections(1)
            .connect_with(write_opts)
            .await?;

        sqlx::migrate!().run(&write).await?;

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
