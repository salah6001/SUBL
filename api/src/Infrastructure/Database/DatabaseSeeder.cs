using Application.Abstractions.Data;
using Domain.Accounts;
using Domain.AuditLogs;
using Domain.Common;
using Domain.Notifications;
using Domain.Permissions;
using Domain.Subscriptions;
using Domain.Users;
using Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Database;

/// <summary>
/// Seeds the database with initial data for development and testing.
/// </summary>
public sealed class DatabaseSeeder
{
    private readonly IApplicationDbContext _context;
    private readonly UserManager<ApplicationIdentityUser> _userManager;
    private readonly ILogger<DatabaseSeeder> _logger;

    private static readonly Guid AdminUserId = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid ManagerUserId = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid StaffUserId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid EndUserId = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid Employee2Id = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid Employee3Id = Guid.Parse("66666666-6666-6666-6666-666666666666");

    private static readonly Guid AdminRoleId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static readonly Guid ManagerRoleId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static readonly Guid StaffRoleId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");

    private static readonly Guid Account1Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static readonly Guid Account2Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");

    public DatabaseSeeder(
        IApplicationDbContext context,
        UserManager<ApplicationIdentityUser> userManager,
        ILogger<DatabaseSeeder> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        _logger.LogInformation("Starting database seeding...");

        await SeedPermissionsAsync();
        await SeedRolesAsync();
        await SeedUsersAsync();
        await SeedAccountsAsync();
        await SeedPlansAsync();
        await SeedAuditLogsAsync();
        await SeedNotificationTypesAsync();
        await SeedArticlesAsync();

        _logger.LogInformation("Database seeding completed successfully!");
    }

    private async Task SeedArticlesAsync()
    {
        if (await _context.Articles.AnyAsync())
        {
            _logger.LogInformation("Articles already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding wellness articles...");

        var articles = new List<Domain.Articles.Article>
        {
            Domain.Articles.Article.Create(
                "Box Breathing: A 5-Minute Reset for Acute Stress",
                "Dr. Lena Hartmann", "Clinical Psychologist", "5 min read",
                Domain.Articles.ArticleCategory.StressManagement,
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?fit=max&fm=jpg&q=80&w=800",
                "A simple, evidence-backed breathing pattern you can use at your desk to calm the nervous system in minutes.",
                "Box breathing — also called square breathing — is a technique used by everyone from athletes to emergency responders to regain composure under pressure.\n\n**How to do it**\n- Inhale through your nose for 4 seconds.\n- Hold your breath for 4 seconds.\n- Exhale slowly through your mouth for 4 seconds.\n- Hold empty for 4 seconds.\n- Repeat for 5 cycles.\n\n**Why it works**\nDeliberate, slow breathing activates the parasympathetic nervous system, lowering heart rate and blood pressure. Extending the exhale signals safety to the brain, reducing the fight-or-flight response that drives acute stress.\n\nTry it the next time you notice your typing speeding up or your shoulders tensing — those are early physical markers of rising stress.",
                isPublished: true),

            Domain.Articles.Article.Create(
                "How Keystroke Dynamics Reveal Hidden Stress",
                "James Park", "AI Research Lead", "7 min read",
                Domain.Articles.ArticleCategory.Technology,
                "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?fit=max&fm=jpg&q=80&w=800",
                "The rhythm of how you type carries a surprisingly accurate signal of cognitive load and emotional state.",
                "Every person has a typing signature: the time between keystrokes, how long keys are held, how often the backspace is used. Researchers call these *keystroke dynamics*.\n\n**The science**\nUnder stress, fine motor control changes subtly. Inter-key intervals become more variable, error and correction rates climb, and typing rhythm loses its usual smoothness. These shifts often appear before a person consciously registers feeling stressed — which is why we call it *hidden stress*.\n\n**Privacy by design**\nSubl analyzes *timing patterns*, not the content of what you type. No words, passwords, or messages are ever recorded — only anonymized rhythm features that feed the stress model.\n\nThe goal isn't surveillance; it's giving you an early, private signal so you can act before stress compounds.",
                isPublished: true),

            Domain.Articles.Article.Create(
                "The 20-20-20 Rule and Why Micro-Breaks Matter",
                "Sofia Alvarez", "Workplace Wellbeing Coach", "4 min read",
                Domain.Articles.ArticleCategory.Productivity,
                "https://images.unsplash.com/photo-1497250681960-ef046c08a56e?fit=max&fm=jpg&q=80&w=800",
                "Short, frequent breaks beat long, rare ones for sustaining focus and reducing strain.",
                "Knowledge work rewards long stretches of concentration — but the brain and body pay a price for unbroken screen time.\n\n**The 20-20-20 rule**\nEvery 20 minutes, look at something 20 feet away for 20 seconds. It relaxes the eye muscles and interrupts the postural lock that builds tension in the neck and shoulders.\n\n**Stack a micro-break on top**\n- Stand up and roll your shoulders.\n- Take three slow breaths.\n- Unclench your jaw and hands.\n\nResearch on 'microbreaks' consistently shows they reduce fatigue and maintain performance across the day, with no net loss in productivity. The key is frequency: many tiny pauses outperform one long one.",
                isPublished: true),

            Domain.Articles.Article.Create(
                "Eat for a Steadier Mood: Nutrition and Stress",
                "Dr. Omar Farouk", "Nutrition Scientist", "6 min read",
                Domain.Articles.ArticleCategory.Nutrition,
                "https://images.unsplash.com/photo-1490645935967-10de6ba17061?fit=max&fm=jpg&q=80&w=800",
                "What and when you eat shapes how resilient you are to daily stressors.",
                "Stress and nutrition form a feedback loop: stress changes how we eat, and what we eat changes how we handle stress.\n\n**Stabilize blood sugar**\nLarge swings in blood glucose amplify irritability and anxiety. Favor slow-release carbohydrates (oats, legumes, whole grains) paired with protein to flatten the curve.\n\n**Hydration first**\nEven mild dehydration raises cortisol and degrades concentration. Keep water within reach and sip regularly.\n\n**Helpful nutrients**\n- Magnesium (leafy greens, nuts) supports nervous-system regulation.\n- Omega-3s (oily fish, walnuts) are linked to lower inflammatory stress responses.\n\nYou don't need a perfect diet — small, consistent choices compound into steadier energy and mood.",
                isPublished: true),

            Domain.Articles.Article.Create(
                "Protect Your Sleep to Protect Your Stress Baseline",
                "Dr. Mei Tanaka", "Sleep Researcher", "6 min read",
                Domain.Articles.ArticleCategory.Recovery,
                "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?fit=max&fm=jpg&q=80&w=800",
                "Sleep is the foundation of stress resilience — here's how to defend it.",
                "When sleep suffers, the brain's emotional alarm system (the amygdala) becomes more reactive and the prefrontal cortex less able to regulate it. The result: the same stressors hit harder.\n\n**A simple wind-down protocol**\n- Dim lights and stop screens 60 minutes before bed.\n- Keep the room cool (around 18–20°C / 65–68°F).\n- Keep a consistent sleep and wake time, even on weekends.\n\n**If your mind races**\nWrite tomorrow's worries down on paper. Externalizing open loops reduces the cognitive arousal that keeps you awake.\n\nAim for 7–9 hours. Consistency matters more than any single perfect night — a stable sleep schedule keeps your stress baseline low and your recovery high.",
                isPublished: true),
        };

        _context.Articles.AddRange(articles);
        await _context.SaveChangesAsync(default);
        _logger.LogInformation("Seeded {Count} articles.", articles.Count);
    }

    private async Task SeedPermissionsAsync()
    {
        if (await _context.Permissions.AnyAsync())
        {
            _logger.LogInformation("Permissions already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding permissions...");

        var permissions = new List<Permission>();

        foreach (SystemModule module in Enum.GetValues<SystemModule>())
        {
            foreach (PermissionAction action in Enum.GetValues<PermissionAction>())
            {
                permissions.Add(Permission.Create(module, action, $"{action} {module}", $"Permission to {action} {module}"));
            }
        }

        _context.Permissions.AddRange(permissions);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded {Count} permissions", permissions.Count);
    }

    private async Task SeedRolesAsync()
    {
        if (await _context.Roles.AnyAsync())
        {
            _logger.LogInformation("Roles already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding roles...");

        var adminRole = Role.Create("Administrator", "Full system access", canViewSensitiveData: true, isSystemRole: true);
        SetPrivateId(adminRole, AdminRoleId);

        var managerRole = Role.Create("Manager", "Department management and reporting", canViewSensitiveData: true, isSystemRole: false);
        SetPrivateId(managerRole, ManagerRoleId);

        var staffRole = Role.Create("Staff", "Basic staff access", canViewSensitiveData: false, isSystemRole: false);
        SetPrivateId(staffRole, StaffRoleId);

        _context.Roles.AddRange(adminRole, managerRole, staffRole);
        await _context.SaveChangesAsync();

        List<Permission> allPermissions = await _context.Permissions.ToListAsync();
        foreach (Permission permission in allPermissions)
        {
            _context.RolePermissions.Add(RolePermission.Create(adminRole.Id, permission.Id));
        }

        foreach (Permission permission in allPermissions.Where(p => p.Action != PermissionAction.Delete))
        {
            _context.RolePermissions.Add(RolePermission.Create(managerRole.Id, permission.Id));
        }

        foreach (Permission permission in allPermissions.Where(p => p.Action == PermissionAction.Read))
        {
            _context.RolePermissions.Add(RolePermission.Create(staffRole.Id, permission.Id));
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded 3 roles with permissions");
    }

    private async Task SeedUsersAsync()
    {
        if (await _context.Users.AnyAsync())
        {
            _logger.LogInformation("Users already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding users...");

        // Helper to create and confirm identity user
        async Task CreateConfirmedIdentityUserAsync(Guid domainUserId, string email, string password)
        {
            var identityUser = ApplicationIdentityUser.Create(domainUserId, email);
            await _userManager.CreateAsync(identityUser, password);
            // Confirm email for seeded users so they can login immediately
            string token = await _userManager.GenerateEmailConfirmationTokenAsync(identityUser);
            await _userManager.ConfirmEmailAsync(identityUser, token);
        }

        var adminUser = User.Create("admin@onex.com", "Admin", "User", "PLACEHOLDER_HASH", AccountType.Staff);
        SetPrivateId(adminUser, AdminUserId);
        _context.Users.Add(adminUser);
        await CreateConfirmedIdentityUserAsync(AdminUserId, "admin@onex.com", "Admin@123!");

        var managerUser = User.Create("manager@onex.com", "Manager", "User", "PLACEHOLDER_HASH", AccountType.Staff);
        SetPrivateId(managerUser, ManagerUserId);
        _context.Users.Add(managerUser);
        await CreateConfirmedIdentityUserAsync(ManagerUserId, "manager@onex.com", "Manager@123!");

        var staffUser = User.Create("staff@onex.com", "Staff", "User", "PLACEHOLDER_HASH", AccountType.Staff);
        SetPrivateId(staffUser, StaffUserId);
        _context.Users.Add(staffUser);
        await CreateConfirmedIdentityUserAsync(StaffUserId, "staff@onex.com", "Staff@123!");

        var endUser = User.Create("user@company.com", "End", "User", "PLACEHOLDER_HASH", AccountType.EndUser);
        SetPrivateId(endUser, EndUserId);
        _context.Users.Add(endUser);
        await CreateConfirmedIdentityUserAsync(EndUserId, "user@company.com", "User@123!");

        var employee2 = User.Create("ahmed@stressless.com", "Ahmed", "Hassan", "PLACEHOLDER_HASH", AccountType.EndUser);
        SetPrivateId(employee2, Employee2Id);
        _context.Users.Add(employee2);
        await CreateConfirmedIdentityUserAsync(Employee2Id, "ahmed@stressless.com", "Employee@123!");

        var employee3 = User.Create("sara@mindwell.com", "Sara", "Ali", "PLACEHOLDER_HASH", AccountType.EndUser);
        SetPrivateId(employee3, Employee3Id);
        _context.Users.Add(employee3);
        await CreateConfirmedIdentityUserAsync(Employee3Id, "sara@mindwell.com", "Employee@123!");

        await _context.SaveChangesAsync();

        _context.UserRoles.Add(UserRole.Create(AdminUserId, AdminRoleId));
        _context.UserRoles.Add(UserRole.Create(ManagerUserId, ManagerRoleId));
        _context.UserRoles.Add(UserRole.Create(StaffUserId, StaffRoleId));

        await _context.SaveChangesAsync();

        _context.UserProfiles.Add(UserProfile.Create(AdminUserId, Department.Management, "System Administrator", "Chief Technology Officer", 150m));
        _context.UserProfiles.Add(UserProfile.Create(ManagerUserId, Department.DataScience, "Data Science Lead", "Senior Data Scientist", 100m));
        _context.UserProfiles.Add(UserProfile.Create(StaffUserId, Department.Operations, "Support Agent", "Junior Analyst", 50m));

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded 6 users with profiles and roles");
    }

    private async Task SeedAccountsAsync()
    {
        if (await _context.Accounts.AnyAsync())
        {
            _logger.LogInformation("Accounts already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding organizations...");

        // Organization 1: StressLess Corp - Tech company with 2 employees
        var account1 = Account.Create("StressLess Corp", "Technology", "https://stressless.com", "+1-555-0100", "123 Tech Street, Silicon Valley, CA 94000", "US-12345678");
        SetPrivateId(account1, Account1Id);

        // Organization 2: MindWell Agency - Healthcare with 1 employee
        var account2 = Account.Create("MindWell Agency", "Healthcare", "https://mindwell.com", "+1-555-0200", "456 Wellness Ave, New York, NY 10001", "US-87654321");
        SetPrivateId(account2, Account2Id);

        _context.Accounts.Add(account1);
        _context.Accounts.Add(account2);
        await _context.SaveChangesAsync();

        // StressLess Corp employees
        _context.AccountContacts.Add(AccountContact.CreateDirect(Account1Id, EndUserId, isPrimaryContact: true, role: "Team Lead", isDecisionMaker: true));
        _context.AccountContacts.Add(AccountContact.CreateDirect(Account1Id, Employee2Id, isPrimaryContact: false, role: "Software Engineer", isDecisionMaker: false));

        // MindWell Agency employees
        _context.AccountContacts.Add(AccountContact.CreateDirect(Account2Id, Employee3Id, isPrimaryContact: true, role: "HR Manager", isDecisionMaker: true));

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded 2 organizations with 3 employees");
    }

    private async Task SeedPlansAsync()
    {
        if (await _context.Plans.AnyAsync())
        {
            _logger.LogInformation("Plans already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding subscription plans...");

        var freePlan = Plan.Create(
            "Free", 0m, 0m, "USD",
            maxUsers: 1, dataRetentionDays: 7,
            hasRealtimeAlerts: false, hasWeeklyReports: false, hasExport: false,
            sortOrder: 1, description: "Basic stress monitoring for individuals");

        var basicPlan = Plan.Create(
            "Basic", 9.99m, 99.99m, "USD",
            maxUsers: 5, dataRetentionDays: 30,
            hasRealtimeAlerts: true, hasWeeklyReports: false, hasExport: false,
            sortOrder: 2, description: "Real-time alerts and 30-day history");

        var proPlan = Plan.Create(
            "Pro", 29.99m, 299.99m, "USD",
            maxUsers: 25, dataRetentionDays: 90,
            hasRealtimeAlerts: true, hasWeeklyReports: true, hasExport: true,
            sortOrder: 3, description: "Full analytics, weekly reports, and data export");

        var enterprisePlan = Plan.Create(
            "Enterprise", 99.99m, 999.99m, "USD",
            maxUsers: 999, dataRetentionDays: 365,
            hasRealtimeAlerts: true, hasWeeklyReports: true, hasExport: true,
            sortOrder: 4, description: "Unlimited monitoring with full data retention");

        _context.Plans.AddRange(freePlan, basicPlan, proPlan, enterprisePlan);
        await _context.SaveChangesAsync();

        // Subscribe StressLess Corp to Pro plan (monthly)
        var sub1 = Subscription.Create(Account1Id, proPlan.Id, BillingCycle.Monthly);
        _context.Subscriptions.Add(sub1);

        // Subscribe MindWell Agency to Basic plan (yearly)
        var sub2 = Subscription.Create(Account2Id, basicPlan.Id, BillingCycle.Yearly);
        _context.Subscriptions.Add(sub2);

        await _context.SaveChangesAsync();

        // Create invoices for the subscriptions
        var invoice1 = Invoice.Create(
            sub1.Id, Account1Id, "INV-2025-0001",
            29.99m, "USD", "Pro Plan - Monthly",
            sub1.StartDate, sub1.CurrentPeriodEnd,
            sub1.StartDate.AddDays(30));
        invoice1.MarkAsPaid();

        var invoice2 = Invoice.Create(
            sub2.Id, Account2Id, "INV-2025-0002",
            99.99m, "USD", "Basic Plan - Yearly",
            sub2.StartDate, sub2.CurrentPeriodEnd,
            sub2.StartDate.AddDays(30));
        invoice2.MarkAsPaid();

        _context.Invoices.AddRange(invoice1, invoice2);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded 4 plans, 2 subscriptions, and 2 invoices");
    }

    private async Task SeedAuditLogsAsync()
    {
        if (await _context.AuditLogs.AnyAsync())
        {
            _logger.LogInformation("Audit logs already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding sample audit logs...");

        _context.AuditLogs.Add(AuditLog.Create(AdminUserId, "admin@onex.com", AuditAction.Login, "User", AdminUserId.ToString(), "Admin User", description: "User logged in successfully", ipAddress: "192.168.1.100"));
        _context.AuditLogs.Add(AuditLog.Create(AdminUserId, "admin@onex.com", AuditAction.UserCreated, "User", ManagerUserId.ToString(), "Manager User", description: "Created new manager user", ipAddress: "192.168.1.100"));
        _context.AuditLogs.Add(AuditLog.Create(AdminUserId, "admin@onex.com", AuditAction.RoleCreated, "Role", ManagerRoleId.ToString(), "Manager", description: "Created Manager role", ipAddress: "192.168.1.100"));
        _context.AuditLogs.Add(AuditLog.Create(AdminUserId, "admin@onex.com", AuditAction.AccountCreated, "Account", Account1Id.ToString(), "TechCorp Solutions", description: "Created new client account", ipAddress: "192.168.1.100"));
        _context.AuditLogs.Add(AuditLog.Create(ManagerUserId, "manager@onex.com", AuditAction.Login, "User", ManagerUserId.ToString(), "Manager User", description: "User logged in successfully", ipAddress: "192.168.1.101"));
        _context.AuditLogs.Add(AuditLog.Create(StaffUserId, "staff@onex.com", AuditAction.Login, "User", StaffUserId.ToString(), "Staff User", description: "User logged in successfully", ipAddress: "192.168.1.102"));
        _context.AuditLogs.Add(AuditLog.Create(StaffUserId, "staff@onex.com", AuditAction.PasswordChanged, "User", StaffUserId.ToString(), "Staff User", description: "User changed their password", ipAddress: "192.168.1.102"));
        _context.AuditLogs.Add(AuditLog.Create(null, null, AuditAction.LoginFailed, "User", null, "unknown@test.com", description: "Failed login attempt - invalid credentials", ipAddress: "192.168.1.200"));

        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded 8 audit logs");
    }

    private async Task SeedNotificationTypesAsync()
    {
        if (await _context.NotificationTypes.AnyAsync())
        {
            _logger.LogInformation("Notification types already seeded, skipping...");
            return;
        }

        _logger.LogInformation("Seeding notification types...");

        var notificationTypes = new List<NotificationType>
        {
            // Stress Detection Notifications
            NotificationType.Create("stress.high_detected", "High Stress Detected", NotificationCategory.StressAnalysis,
                "⚠️ High Stress Detected", "Your keyboard patterns indicate elevated stress levels. Consider taking a break.",
                NotificationPriority.Urgent, NotificationChannel.InApp | NotificationChannel.Email | NotificationChannel.Push | NotificationChannel.Slack,
                iconName: "alert-triangle", colorHex: "#e74c3c"),

            // Fired on the first stress reading of a monitoring session — a handy
            // way to verify every channel (in-app/email/push/slack) is delivering.
            NotificationType.Create("session.started", "Monitoring Session Started", NotificationCategory.StressAnalysis,
                "🟢 Monitoring started", "Subl is now analysing your typing for this session. We'll alert you if your stress rises.",
                NotificationPriority.Normal, NotificationChannel.InApp | NotificationChannel.Email | NotificationChannel.Push | NotificationChannel.Slack,
                iconName: "play-circle", colorHex: "#2563eb"),

            NotificationType.Create("stress.moderate_detected", "Moderate Stress Detected", NotificationCategory.StressAnalysis,
                "Moderate Stress Detected", "Your typing patterns suggest moderate stress. Try a short breathing exercise.",
                NotificationPriority.High, NotificationChannel.InApp,
                iconName: "activity", colorHex: "#f39c12"),

            NotificationType.Create("stress.analysis_complete", "Analysis Complete", NotificationCategory.StressAnalysis,
                "Analysis Complete", "Your keyboard data analysis is complete. View your stress report.",
                NotificationPriority.Normal, NotificationChannel.InApp,
                iconName: "check-circle", colorHex: "#27ae60"),

            NotificationType.Create("stress.weekly_summary", "Weekly Stress Summary", NotificationCategory.StressAnalysis,
                "📊 Weekly Stress Summary", "Your weekly stress analysis summary is ready. View your trends.",
                NotificationPriority.Normal, NotificationChannel.InApp | NotificationChannel.Email,
                iconName: "bar-chart", colorHex: "#3498db"),

            NotificationType.Create("stress.suggestion", "Stress Relief Suggestion", NotificationCategory.StressAnalysis,
                "💡 Suggestion: {Suggestion}", "Based on your current stress level, we suggest: {Details}.",
                NotificationPriority.Normal, NotificationChannel.InApp,
                iconName: "heart", colorHex: "#9b59b6"),

            NotificationType.Create("stress.level_improved", "Stress Level Improved", NotificationCategory.StressAnalysis,
                "✅ Stress Reduced", "Great job! Your stress level has decreased compared to earlier.",
                NotificationPriority.Normal, NotificationChannel.InApp,
                iconName: "trending-down", colorHex: "#27ae60"),

            NotificationType.Create("stress.data_received", "Keyboard Data Received", NotificationCategory.StressAnalysis,
                "Data Received", "New keyboard data batch received from your desktop agent.",
                NotificationPriority.Low, NotificationChannel.InApp,
                iconName: "upload", colorHex: "#95a5a6"),

            // System Notifications
            NotificationType.Create("security.login_new_device", "New Device Login", NotificationCategory.Security,
                "New Login Detected", "Your account was accessed from a new device: {DeviceName}.",
                NotificationPriority.Urgent, NotificationChannel.InApp | NotificationChannel.Email,
                iconName: "shield", colorHex: "#e74c3c", isSystemType: true),

            NotificationType.Create("security.password_changed", "Password Changed", NotificationCategory.Security,
                "Password Changed", "Your password was changed successfully.",
                NotificationPriority.High, NotificationChannel.InApp | NotificationChannel.Email,
                iconName: "lock", colorHex: "#27ae60", isSystemType: true),

            // General Notifications
            NotificationType.Create("mention.user", "You Were Mentioned", NotificationCategory.General,
                "Mentioned by {MentionedBy}", "{MentionedBy} mentioned you in {Context}.",
                NotificationPriority.High, NotificationChannel.InApp,
                iconName: "at-sign", colorHex: "#3498db"),

            // Test notification — used by POST /api/notifications/test to verify
            // delivery across in-app + email channels.
            NotificationType.Create("system.test", "Test Notification", NotificationCategory.System,
                "🔔 Test Notification", "{Message}",
                NotificationPriority.High, NotificationChannel.InApp | NotificationChannel.Email | NotificationChannel.Push | NotificationChannel.Slack,
                iconName: "bell", colorHex: "#2563eb", isSystemType: true),
        };

        _context.NotificationTypes.AddRange(notificationTypes);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded {Count} notification types", notificationTypes.Count);
    }

    private static void SetPrivateId<T>(T entity, Guid id) where T : class
    {
        typeof(T).GetProperty("Id")?.SetValue(entity, id);
    }
}
