use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParametersBuilder};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use uuid::Uuid;

use crate::config::Config;
use crate::error::AppError;

pub async fn send_magic_link_email(
    to_email: &str,
    magic_link: &str,
    config: &Config,
) -> Result<(), AppError> {
    let domain = config
        .smtp_from
        .rsplit_once('@')
        .map(|(_, d)| d.trim_end_matches('>'))
        .unwrap_or("localhost");
    let message_id = format!("<{}@{}>", Uuid::new_v4(), domain);

    let email = Message::builder()
        .message_id(Some(message_id))
        .from(
            config
                .smtp_from
                .parse()
                .map_err(|e| AppError::Internal(format!("Invalid SMTP_FROM: {e}")))?,
        )
        .to(to_email
            .parse()
            .map_err(|e| AppError::Internal(format!("Invalid recipient email: {e}")))?)
        .subject("DevStage — Your login link")
        .header(ContentType::TEXT_HTML)
        .body(format!(
            r#"<h2>Log in to DevStage</h2>
<p>Click the link below to log in. This link expires in 15 minutes.</p>
<p><a href="{magic_link}">Log in to DevStage</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>"#
        ))
        .map_err(|e| AppError::Internal(format!("Failed to build email: {e}")))?;

    let mailer = if config.smtp_user.is_empty() {
        // No auth — plain unencrypted connection (local dev / mailhog)
        AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&config.smtp_host)
            .port(config.smtp_port)
            .build()
    } else {
        let creds = Credentials::new(config.smtp_user.clone(), config.smtp_pass.clone());
        let tls_params = TlsParametersBuilder::new(config.smtp_host.clone())
            .dangerous_accept_invalid_certs(config.smtp_tls_insecure)
            .build()
            .map_err(|e| AppError::Internal(format!("TLS params error: {e}")))?;

        if config.smtp_port == 465 {
            // Port 465: implicit TLS (SMTPS)
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&config.smtp_host)
                .port(465)
                .tls(Tls::Wrapper(tls_params))
                .credentials(creds)
                .build()
        } else {
            // Port 587 (or other): STARTTLS
            AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&config.smtp_host)
                .port(config.smtp_port)
                .tls(Tls::Required(tls_params))
                .credentials(creds)
                .build()
        }
    };

    mailer
        .send(email)
        .await
        .map_err(|e| AppError::Internal(format!("Failed to send email: {e}")))?;

    Ok(())
}
