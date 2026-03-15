use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::transport::smtp::client::{Tls, TlsParametersBuilder};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use uuid::Uuid;

use crate::config::Config;
use crate::error::AppError;

fn magic_link_html(magic_link: &str) -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;width:100%;">

<tr><td style="background-color:#4F46E5;padding:24px;text-align:center;">
<span style="color:#ffffff;font-size:24px;font-weight:700;text-decoration:none;">DevStage</span>
</td></tr>

<tr><td style="padding:32px;">
<h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#111827;">Log in to DevStage</h2>
<p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#374151;">Click the button below to log in. This link expires in 15 minutes.</p>
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:8px 0 24px;">
<a href="{magic_link}" style="display:inline-block;padding:12px 32px;background-color:#4F46E5;color:#ffffff;text-decoration:none;border-radius:6px;font-size:16px;font-weight:600;">Log in to DevStage</a>
</td></tr></table>
<p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;word-break:break-all;">Or copy this link: {magic_link}</p>
</td></tr>

<tr><td style="padding:16px 32px;border-top:1px solid #e5e7eb;">
<p style="margin:0;font-size:13px;line-height:1.5;color:#9ca3af;">If you didn't request this, you can safely ignore this email.</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>"#
    )
}

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
        .body(magic_link_html(magic_link))
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
