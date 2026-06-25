using System.Net;
using Application.Abstractions.Email;
using Application.Abstractions.Notifications;
using Domain.Notifications;
using Infrastructure.Database;
using Infrastructure.Email;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Infrastructure.Notifications.Channels;

/// <summary>
/// Email notification channel — renders the notification as an HTML email and
/// sends it through the shared <see cref="IEmailService"/> (SMTP / MailPit).
/// </summary>
internal sealed class EmailNotificationChannel : INotificationChannel
{
    private readonly IEmailService _emailService;
    private readonly ApplicationDbContext _context;
    private readonly EmailSettings _settings;
    private readonly ILogger<EmailNotificationChannel> _logger;

    public EmailNotificationChannel(
        IEmailService emailService,
        ApplicationDbContext context,
        IOptions<EmailSettings> settings,
        ILogger<EmailNotificationChannel> logger)
    {
        _emailService = emailService;
        _context = context;
        _settings = settings.Value;
        _logger = logger;
    }

    public NotificationChannel Channel => NotificationChannel.Email;

    // Available whenever email sending is configured. When disabled the
    // dispatcher skips this channel entirely (no failed delivery rows).
    public bool IsAvailable => _settings.EnableSending;

    public async Task<bool> DeliverAsync(Notification notification, CancellationToken cancellationToken = default)
    {
        string? toEmail = notification.User?.Email;

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            toEmail = await _context.Users
                .Where(u => u.Id == notification.UserId)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (string.IsNullOrWhiteSpace(toEmail))
        {
            _logger.LogWarning(
                "Cannot send email notification {NotificationId}: no email for user {UserId}",
                notification.Id,
                notification.UserId);
            return false;
        }

        await _emailService.SendEmailAsync(
            toEmail,
            notification.Title,
            BuildHtmlBody(notification),
            cancellationToken);

        _logger.LogDebug(
            "Delivered email notification {NotificationId} to {Email}",
            notification.Id,
            toEmail);

        return true;
    }

    private string BuildHtmlBody(Notification notification)
    {
        string title = WebUtility.HtmlEncode(notification.Title);
        string message = WebUtility.HtmlEncode(notification.Message);

        string actionButton = string.Empty;
        if (!string.IsNullOrWhiteSpace(notification.ActionUrl))
        {
            string href = $"{_settings.AppBaseUrl.TrimEnd('/')}{notification.ActionUrl}";
            string label = WebUtility.HtmlEncode(
                string.IsNullOrWhiteSpace(notification.ActionText) ? "Open Subl" : notification.ActionText);
            actionButton = $@"
            <p style='text-align: center;'>
                <a href='{WebUtility.HtmlEncode(href)}' class='button'>{label}</a>
            </p>";
        }

        return $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: white; padding: 28px; text-align: center; border-radius: 10px 10px 0 0; }}
        .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #888; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>{title}</h1>
        </div>
        <div class='content'>
            <p>{message}</p>
            {actionButton}
        </div>
        <div class='footer'>
            <p>You are receiving this because email notifications are enabled in your Subl settings.</p>
            <p>&copy; Subl. Automated message — please do not reply.</p>
        </div>
    </div>
</body>
</html>";
    }
}
