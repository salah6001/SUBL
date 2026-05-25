# ONEX — Features Reference

> Complete list of implemented features in the platform.
>
> Each feature includes: what it does, which endpoint exposes it, and the permission required.

---

## Table of Contents

- [1. Authentication](#1-authentication)
- [2. User Management](#2-user-management)
- [3. User Profiles](#3-user-profiles)
- [4. Session Management](#4-session-management)
- [5. Role Management](#5-role-management)
- [6. Permission System](#6-permission-system)
- [7. Organization Management](#7-organization-management)
- [8. Employee Management](#8-employee-management)
- [9. Contact Permissions](#9-contact-permissions)
- [10. Invitation System](#10-invitation-system)
- [11. Subscription Plans](#11-subscription-plans)
- [12. Subscriptions & Invoices](#12-subscriptions--invoices)
- [13. Notifications](#13-notifications)
- [14. Push Notifications](#14-push-notifications)
- [15. Notification Preferences](#15-notification-preferences)
- [16. Audit Logs](#16-audit-logs)
- [17. Data Masking](#17-data-masking)
- [18. Security Features](#18-security-features)
- [19. Infrastructure](#19-infrastructure)

---

## 1. Authentication

Everything related to user login, registration, and token management.

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|:------:|:----:|-------------|
| Register | `users/register` | POST | Anonymous | Create new account with email + password. Sends confirmation email. |
| Confirm Email | `users/confirm-email` | POST | Anonymous | Verify email with token from confirmation link. |
| Resend Confirmation | `users/resend-confirmation` | POST | Anonymous | Resend the email confirmation link. |
| Login | `users/login` | POST | Anonymous | Authenticate with email + password. Returns JWT + refresh token. |
| Login with 2FA | `users/login-2fa` | POST | Anonymous | Second step login when 2FA is enabled. Requires TOTP code. |
| Refresh Token | `users/refresh` | POST | Anonymous | Get new JWT using a valid refresh token. |
| Logout | `users/logout` | POST | Authenticated | Invalidate current session. |
| Forgot Password | `users/forgot-password` | POST | Anonymous | Send password reset email. |
| Reset Password | `users/reset-password` | POST | Anonymous | Set new password using reset token. |
| Change Password | `users/change-password` | POST | Authenticated | Change password (requires current password). |

**Rate limited**: All auth endpoints use the `Authentication` rate limit policy.

---

## 2. User Management

CRUD operations on users. Staff-only features.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get All Users | `users` | GET | `USERS:READ` | Paginated list with sorting, searching, filtering. |
| Get User by ID | `users/{id}` | GET | `USERS:READ` | Full user details. |
| Get User by Email | `users/by-email/{email}` | GET | `USERS:READ` | Lookup by email. |
| Get Current User | `users/me` | GET | Authenticated | Get your own info. |
| Update User | `users/{id}` | PUT | `USERS:UPDATE` | Update name, email, account type. |
| Update Current User | `users/me` | PUT | Authenticated | Update your own name/email. |
| Delete User | `users/{id}` | DELETE | `USERS:DELETE` | Permanently remove user. |
| Activate User | `users/{id}/activate` | POST | `USERS:ACTIVATE` | Re-enable a deactivated/suspended user. |
| Deactivate User | `users/{id}/deactivate` | POST | `USERS:DEACTIVATE` | Disable user — revokes all sessions. |
| Suspend User | `users/{id}/suspend` | POST | `USERS:DEACTIVATE` | Temporarily suspend. |
| Assign Role | `users/{id}/roles` | POST | `ROLES:ASSIGNUSERS` | Give a role to a user. |
| Remove Role | `users/{id}/roles/{roleId}` | DELETE | `ROLES:ASSIGNUSERS` | Take a role from a user. |
| Get User Roles | `users/{id}/roles` | GET | `USERS:READ` | List roles for a user. |

**Search fields**: Email, FirstName, LastName
**Sort fields**: Email, FirstName, LastName, CreatedAt, LastLoginAt, Status

---

## 3. User Profiles

Extended profile info for staff members.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get User Profile | `users/{id}/profile` | GET | `USERS:READ` | View staff profile (department, job title, etc.). |
| Get Current Profile | `users/me/profile` | GET | Authenticated | View your own profile. |
| Update User Profile | `users/{id}/profile` | PUT | `USERS:UPDATE` | Edit any staff profile. |
| Update Current Profile | `users/me/profile` | PUT | Authenticated | Edit your own profile. |

**Profile fields**: Department, DisplayJobTitle, InternalJobTitle, HourlyCost (admin-only), PhoneNumber, HireDate, AvatarUrl

---

## 4. Session Management

Track and control active login sessions.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get User Sessions | `users/{id}/sessions` | GET | `USERS:READ` | List all sessions for a user (with IP, device, last activity). |
| Get My Sessions | `users/me/sessions` | GET | Authenticated | List your own active sessions. |
| Revoke Session | `users/{id}/sessions/{sessionId}` | DELETE | `USERS:UPDATE` | Force-logout a specific session. |
| Revoke All Sessions | `users/{id}/sessions` | DELETE | `USERS:UPDATE` | Force-logout all sessions for a user. |

---

## 5. Role Management

Create, edit, and manage roles.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get All Roles | `roles` | GET | `ROLES:READ` | Paginated list with search/sort. |
| Get Role by ID | `roles/{id}` | GET | `ROLES:READ` | Role details with permission count. |
| Create Role | `roles` | POST | `ROLES:CREATE` | New custom role with name + description. |
| Update Role | `roles/{id}` | PUT | `ROLES:UPDATE` | Edit role name, description, sensitive data flag. |
| Delete Role | `roles/{id}` | DELETE | `ROLES:DELETE` | Remove non-system role. |
| Activate Role | `roles/{id}/activate` | POST | `ROLES:UPDATE` | Re-enable a deactivated role. |
| Deactivate Role | `roles/{id}/deactivate` | POST | `ROLES:UPDATE` | Disable role (users keep it but it stops working). |
| Get Role Permissions | `roles/{id}/permissions` | GET | `ROLES:READ` | List all permissions assigned to a role. |
| Update Role Permissions | `roles/{id}/permissions` | PUT | `ROLES:ASSIGNPERMISSIONS` | Set the full permission list for a role. |

**Seeded roles**: Administrator (system, all perms), Manager (no delete), Staff (read only)

---

## 6. Permission System

View and understand the permission matrix.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get All Permissions | `permissions` | GET | `ROLES:READ` | Full permission catalog grouped by module. |
| Get My Permissions | `users/me/permissions` | GET | Authenticated | List your effective permissions. |

**Permission format**: `MODULE:ACTION` — example: `USERS:CREATE`, `STRESSDATA:READ`

**10 modules × 4 actions = 40 auto-generated permissions** plus extended constants (VIEWSENSITIVE, DEACTIVATE, RUN, EXPORT, CANCEL, etc.)

### Authorization Flow

```
Request comes in
  ├── 1. Not authenticated?                → 401 Unauthorized
  ├── 2. Permission found in JWT claims?   → Allowed (fast path, no DB)
  ├── 3. User is Super Admin?              → Allowed (bypass all checks)
  ├── 4. Permission found in DB?           → Allowed (fallback)
  └── 5. None of the above                 → 403 Forbidden
```

---

## 7. Organization Management

Manage client companies/organizations.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get All Organizations | `accounts` | GET | `ACCOUNTS:READ` | Paginated with search, sort, filter. |
| Get Organization by ID | `accounts/{id}` | GET | `ACCOUNTS:READ` | Full details including employee count. |
| Create Organization | `accounts` | POST | `ACCOUNTS:CREATE` | Register a new company (name, industry, address, tax number). |
| Update Organization | `accounts/{id}` | PUT | `ACCOUNTS:UPDATE` | Edit company info. |
| Delete Organization | `accounts/{id}` | DELETE | `ACCOUNTS:DELETE` | Remove company permanently. |
| Activate Organization | `accounts/{id}/activate` | POST | `ACCOUNTS:UPDATE` | Re-enable a deactivated org. |
| Deactivate Organization | `accounts/{id}/deactivate` | POST | `ACCOUNTS:DEACTIVATE` | Disable org — employees lose access. |

**Search fields**: Name, Industry, Phone, Address
**Sort fields**: Name, Industry, CreatedAt, IsActive

---

## 8. Employee Management

Add and manage employees within an organization.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get Employees | `accounts/{id}/contacts` | GET | `ACCOUNTS:READ` | List all employees for an org with their roles and status. |
| Add Employee | `accounts/{id}/contacts` | POST | `ACCOUNTS:MANAGECONTACTS` | Directly add a user as employee (no invite needed). |
| Update Employee | `accounts/{id}/contacts/{contactId}` | PUT | `ACCOUNTS:MANAGECONTACTS` | Update role, decision-maker flag, primary contact flag. |
| Remove Employee | `accounts/{id}/contacts/{contactId}` | DELETE | `ACCOUNTS:MANAGECONTACTS` | Remove employee from the organization. |

---

## 9. Contact Permissions

Fine-grained control over what each employee can see and do.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Update Contact Permissions | `accounts/{id}/contacts/{contactId}/permissions` | PUT | `ACCOUNTS:MANAGECONTACTS` | Set specific permissions for one employee. |

### Available Contact Permissions

| Permission | What it controls |
|-----------|------------------|
| `CanCreateTickets` | Create support tickets |
| `CanViewAllTickets` | See all org tickets (not just own) |
| `CanViewStressData` | View keyboard stress data and readings |
| `CanViewReports` | Access stress analysis reports |
| `CanViewAnalytics` | Access analytics dashboards and trends |
| `CanExportData` | Export stress data and reports |
| `CanManageContacts` | Add/remove other employees |
| `CanManageSuggestions` | Manage stress relief suggestions |
| `CanDownloadFiles` | Download report files |
| `ReceiveNotifications` | Receive email/push notifications |

### Permission Templates

| Template | Use case | Key permissions |
|----------|----------|----------------|
| **Minimal** | New/restricted employee | Notifications only |
| **Default** | Regular employee | Tickets + stress data + downloads |
| **Full** | Primary contact / manager | Everything enabled |

---

## 10. Invitation System

Invite users to join an organization via email.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Invite Contact | `accounts/{id}/invitations` | POST | `ACCOUNTS:MANAGECONTACTS` | Send email invitation with a secure token. |
| Accept Invitation | `accounts/invitations/accept` | POST | Anonymous | Accept an invite using the token. |
| Cancel Invitation | `accounts/{id}/invitations/{contactId}` | DELETE | `ACCOUNTS:MANAGECONTACTS` | Revoke a pending invitation. |
| Resend Invitation | `accounts/{id}/invitations/{contactId}/resend` | POST | `ACCOUNTS:MANAGECONTACTS` | Resend the invitation email. |
| Get Pending Invitations | `accounts/{id}/invitations` | GET | `ACCOUNTS:READ` | List all pending invites for an org. |

### Invitation Flow

```
Admin sends invite
  → Email with secure token sent to user
    → User clicks link and accepts
      → AccountContact created, permissions set
        → User can now access org data based on permissions
```

Invitations respect `AccountSettings`:
- `AllowEmployeeSelfInvite` — can employees invite others?
- `RequireInviteApproval` — does admin need to approve?
- `InviteExpirationDays` — how long is the invite valid?

---

## 11. Subscription Plans

Available plans for organizations (read from database, managed by admin).

| Plan | Price/mo | Price/yr | Max Users | Data Retention | Alerts | Reports | Export |
|------|:--------:|:--------:|:---------:|:--------------:|:------:|:-------:|:------:|
| **Free** | $0 | $0 | 1 | 7 days | — | — | — |
| **Basic** | $9.99 | $99.99 | 5 | 30 days | ✓ | — | — |
| **Pro** | $29.99 | $299.99 | 25 | 90 days | ✓ | ✓ | ✓ |
| **Enterprise** | $99.99 | $999.99 | 999 | 365 days | ✓ | ✓ | ✓ |

**Permissions**: `PLANS:CREATE`, `PLANS:READ`, `PLANS:UPDATE`, `PLANS:DELETE`

---

## 12. Subscriptions & Invoices

Manage active subscriptions and billing.

**Subscription statuses**: Active → PastDue → Cancelled / Expired

**Subscription actions** (domain methods):
- `Create` — start new subscription with plan + billing cycle
- `Cancel` — mark as cancelled
- `MarkPastDue` — payment overdue
- `Renew` — extend to next period
- `ChangePlan` — switch to different plan
- `ChangeBillingCycle` — switch monthly ↔ yearly

**Invoice statuses**: Draft → Issued → Paid / Overdue / Cancelled

**Invoice actions** (domain methods):
- `Create` — generate new invoice for a billing period
- `MarkAsPaid` — record payment
- `MarkAsOverdue` — flag as late
- `Cancel` — void the invoice

**Permissions**: `SUBSCRIPTIONS:CREATE`, `SUBSCRIPTIONS:READ`, `SUBSCRIPTIONS:UPDATE`, `SUBSCRIPTIONS:CANCEL`, `INVOICES:CREATE`, `INVOICES:READ`, `INVOICES:UPDATE`

---

## 13. Notifications

Full notification system with templates, multi-channel delivery, and tracking.

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|:------:|:----:|-------------|
| Get Notifications | `notifications` | GET | Authenticated | Paginated list of your notifications. |
| Get Notification by ID | `notifications/{id}` | GET | Authenticated | Full notification details. |
| Mark as Read | `notifications/{id}/read` | POST | Authenticated | Mark one notification as read. |
| Mark as Unread | `notifications/{id}/unread` | POST | Authenticated | Undo read. |
| Mark All as Read | `notifications/read-all` | POST | Authenticated | Bulk mark all as read. |
| Dismiss | `notifications/{id}/dismiss` | POST | Authenticated | Hide notification. |
| Archive All | `notifications/archive-all` | POST | Authenticated | Archive all notifications. |
| Get Archived | `notifications/archived` | GET | Authenticated | List archived notifications. |
| Get Unread Count | `notifications/unread-count` | GET | Authenticated | Badge counter. |
| Get Notification Types | `notifications/types` | GET | Authenticated | All available notification types. |
| Test Notification | `notifications/test` | POST | Authenticated | Send a test notification to yourself (dev only). |

### Notification Categories

| Category | Examples |
|----------|---------|
| **System** | Welcome, maintenance, account changes |
| **StressAnalysis** | High stress detected, weekly summary, trend alerts |
| **Billing** | Invoice issued, payment received, plan expiring |
| **Security** | New login, password changed, 2FA enabled |
| **General** | Announcements, updates |

### Delivery Channels

| Channel | Technology | Description |
|---------|-----------|-------------|
| **InApp** | SignalR WebSocket | Real-time in-app via `/hubs/notifications` |
| **Email** | SMTP | Email delivery |
| **Push** | FCM / APNs | Mobile and web push |
| **SMS** | Provider API | Text messages |

### Domain Events → Notifications

Notifications are triggered automatically by domain events:

```
AccountCreated     → "Welcome to ONEX"
UserDeactivated    → "Your account has been deactivated"
High Stress        → "High stress level detected for {user}"
Invoice Issued     → "New invoice #{number} for {amount}"
```

---

## 14. Push Notifications

Manage device tokens for push notifications.

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|:------:|:----:|-------------|
| Register Token | `notifications/push-tokens` | POST | Authenticated | Register a device for push (Web, iOS, Android). |
| Get My Tokens | `notifications/push-tokens` | GET | Authenticated | List your registered devices. |
| Delete Token | `notifications/push-tokens/{id}` | DELETE | Authenticated | Unregister a device. |

---

## 15. Notification Preferences

Users control how and when they receive notifications.

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|:------:|:----:|-------------|
| Get Preferences | `notifications/preferences` | GET | Authenticated | Get your global notification settings. |
| Update Preferences | `notifications/preferences` | PUT | Authenticated | Update channels, digest, quiet hours. |
| Update Type Settings | `notifications/type-settings` | PUT | Authenticated | Enable/disable specific notification types. |

### Configurable Settings

| Setting | Default | Description |
|---------|---------|-------------|
| InApp enabled | ✓ | Show in-app notifications |
| Email enabled | ✓ | Send email notifications |
| Push enabled | ✓ | Send push notifications |
| SMS enabled | — | Send SMS (disabled by default) |
| Email digest | — | Batch emails into daily/weekly digest |
| Digest time | — | Preferred delivery time |
| Quiet hours | — | No notifications during these hours |

---

## 16. Audit Logs

Immutable record of everything that happens in the system.

| Feature | Endpoint | Method | Permission | Description |
|---------|----------|:------:|:----------:|-------------|
| Get Audit Logs | `audit-logs` | GET | `AUDITLOGS:VIEW` | Paginated with filtering by action, user, date range. |
| Get Audit Log by ID | `audit-logs/{id}` | GET | `AUDITLOGS:VIEW` | Full details including before/after JSON. |
| Get User Audit Logs | `audit-logs/users/{userId}` | GET | `AUDITLOGS:VIEW` | All actions for a specific user. |
| Get My Audit Logs | `audit-logs/me` | GET | Authenticated | Your own activity history. |

### Tracked Actions

| Group | Actions |
|-------|---------|
| **Authentication** | Login, Logout, LoginFailed, PasswordChanged, PasswordReset, TwoFactorEnabled/Disabled, SessionRevoked |
| **User Management** | UserCreated, Updated, Deleted, Activated, Deactivated, Suspended, RoleAssigned/Removed, ProfileUpdated |
| **Role Management** | RoleCreated, Updated, Deleted, Activated, Deactivated, PermissionsUpdated |
| **Organization** | AccountCreated, Updated, Deleted, Activated, Deactivated, ContactAdded/Updated/Removed |
| **Data Access** | SensitiveDataViewed, DataExported, ReportGenerated |
| **System** | SettingsChanged, SystemError |

Each log entry stores: timestamp, user email, IP address, user agent, correlation ID, before/after values (JSON).

---

## 17. Data Masking

Automatic hiding of sensitive fields based on role configuration.

### How It Works

```
User with CanViewSensitiveData = false
  → Phone numbers show as "******"
  → Emails show as "Private Info"
  → Revenue/costs show as "Confidential"
```

### Maskable Fields

| Field | Mask Value | Where Used |
|-------|-----------|------------|
| Phone numbers | `******` | User profiles, accounts |
| Email addresses | `Private Info` | User listings |
| Revenue / subscription values | `Confidential` | Billing, accounts |
| Stress data details | `Confidential` | Raw keyboard metrics |
| Hourly cost | `Confidential` | Staff profiles |
| Addresses | `******` | Accounts |
| Tax numbers | `******` | Accounts |

Roles with `CanViewSensitiveData = true` see real values.

---

## 18. Security Features

### Two-Factor Authentication (2FA)

| Feature | Endpoint | Method | Auth | Description |
|---------|----------|:------:|:----:|-------------|
| Enable 2FA | `users/me/2fa/enable` | POST | Authenticated | Get QR code + secret for authenticator app setup. |
| Verify 2FA | `users/me/2fa/verify` | POST | Authenticated | Confirm setup with a TOTP code. |
| Disable 2FA | `users/me/2fa/disable` | POST | Authenticated | Turn off 2FA. |

### Other Security Features

| Feature | Description |
|---------|-------------|
| **JWT + Refresh Tokens** | Short-lived access tokens with long-lived refresh tokens |
| **BCrypt Password Hashing** | Industry standard password storage |
| **Rate Limiting** | Per-endpoint rate limits on auth endpoints |
| **CORS Configuration** | Permissive in dev, strict whitelist in production |
| **HTTPS + HSTS** | Enforced in production |
| **Secure Offboarding** | Deactivating a user revokes all sessions immediately |
| **Invitation Token Security** | Tokens are hashed — plain text never stored |
| **Production Startup Validation** | App refuses to start if JWT secret or other settings are misconfigured |

---

## 19. Infrastructure

### Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | .NET 10 |
| Architecture | Clean Architecture (Domain / Application / Infrastructure / Web.Api / SharedKernel) |
| Database | PostgreSQL via EF Core |
| Auth | ASP.NET Identity + JWT Bearer |
| CQRS | Custom ICommand / IQuery + Handlers |
| Validation | FluentValidation via pipeline decorator |
| Logging | Serilog with structured logging |
| Real-time | SignalR hub at `/hubs/notifications` |
| API Style | Minimal APIs with `IEndpoint` pattern |
| Health Checks | `/health` endpoint with UI response |
| Testing | xUnit architecture tests (6 layer dependency tests) |

### API Conventions

| Convention | Detail |
|-----------|--------|
| Pagination | `?page=1&pageSize=10` |
| Sorting | `?sortBy=CreatedAt&sortDescending=true` |
| Searching | `?search=keyword` |
| Auth header | `Authorization: Bearer {jwt}` |
| Error format | RFC 7807 Problem Details |
| Rate limit headers | `X-RateLimit-Limit`, `X-RateLimit-Remaining` |

### Middleware Pipeline

```
Request
  → Request Context Logging (correlation ID)
    → Serilog Request Logging
      → Global Exception Handler (→ Problem Details)
        → Rate Limiter
          → CORS
            → Authentication (JWT)
              → Authorization (Permission check)
                → Endpoint Handler
```

### Seeded Test Data

| Entity | Count | Examples |
|--------|:-----:|---------|
| Users | 6 | admin@onex.com, manager@onex.com, staff@onex.com, user@company.com, ahmed@stressless.com, sara@mindwell.com |
| Roles | 3 | Administrator, Manager, Staff |
| Organizations | 2 | StressLess Corp (Tech), MindWell Agency (Healthcare) |
| Plans | 4 | Free, Basic, Pro, Enterprise |
| Subscriptions | 2 | StressLess → Pro Monthly, MindWell → Basic Yearly |
| Invoices | 2 | INV-2025-0001, INV-2025-0002 (both paid) |
| Notification Types | 8+ | Stress alerts, security events, billing, system |
| Audit Logs | 5 | Sample login/create actions |

**All test passwords follow pattern**: `Admin@123!`, `Manager@123!`, `Staff@123!`, `User@123!`, `Employee@123!`

---

## Endpoint Count Summary

| Module | Endpoints |
|--------|:---------:|
| Authentication | 10 |
| User Management | 13 |
| User Profiles | 4 |
| Session Management | 4 |
| Role Management | 9 |
| Permissions | 2 |
| Organizations | 7 |
| Employees | 4 |
| Contact Permissions | 1 |
| Invitations | 5 |
| Notifications | 11 |
| Push Tokens | 3 |
| Notification Preferences | 3 |
| Audit Logs | 4 |
| Health Check | 1 |
| **Total** | **~81** |
