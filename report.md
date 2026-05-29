# Admin Panel — UI Design Report

**Purpose:** This document tells a UI designer/developer exactly what admin pages to build, what data each page shows, what actions each page supports, and which API endpoints power everything. All endpoints are live and tested on `http://localhost:5000`.

---

## How to Log In as Admin

The database is already seeded with these accounts. Use them to test every admin page:

| Role | Email | Password |
|---|---|---|
| **Administrator** (full access) | `admin@onex.com` | `Admin@123!` |
| **Manager** (no delete) | `manager@onex.com` | `Manager@123!` |
| **Staff** (read-only) | `staff@onex.com` | `Staff@123!` |
| End User (not admin) | `user@company.com` | `User@123!` |

Call `POST /users/login` with `{ "email": "...", "password": "..." }` → get `accessToken` → put it in `Authorization: Bearer <token>` header on every other request.

---

## Pages Overview

The admin panel has **7 main pages**:

| # | Page | Route (suggested) | Core purpose |
|---|---|---|---|
| 1 | Users | `/admin/users` | Manage all user accounts |
| 2 | Roles | `/admin/roles` | Manage roles and their permissions |
| 3 | Accounts | `/admin/accounts` | Manage client/organization accounts |
| 4 | Stress Data | `/admin/stress` | Monitor stress sessions and readings |
| 5 | Audit Logs | `/admin/audit-logs` | Full activity history of the system |
| 6 | Devices | `/admin/devices` | Desktop agent devices |
| 7 | Permissions Matrix | `/admin/permissions` | View all system permissions |

---

---

## Page 1 — Users

### What it looks like
A full data table of all registered users with search, filters, and per-row action buttons.

### API: Fetch the list
```
GET /users?pageNumber=1&pageSize=20&searchTerm=&status=&accountType=&sortBy=CreatedAt&sortDirection=desc
```

**Query parameters (all optional):**
| Param | Type | Values | What it does |
|---|---|---|---|
| `pageNumber` | int | default 1 | Page to show |
| `pageSize` | int | max 100, default 10 | Rows per page |
| `searchTerm` | string | any text | Searches email, first name, last name |
| `status` | int | 1=Active, 2=Inactive, 3=Suspended | Filter by account status |
| `accountType` | int | 1=Staff, 2=EndUser | Filter by type |
| `sortBy` | string | `Email`, `FirstName`, `LastName`, `CreatedAt`, `LastLoginAt`, `Status` | Column to sort by |
| `sortDirection` | string | `asc`, `desc` | Sort direction |

**Response shape** (one row in the table):
```json
{
  "id": "guid",
  "email": "admin@onex.com",
  "firstName": "Admin",
  "lastName": "User",
  "fullName": "Admin User",
  "accountType": 1,
  "status": 1,
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "lastLoginAt": "2026-05-25T10:00:00Z"
}
```

The response is wrapped in a pagination envelope:
```json
{
  "items": [...],
  "pageNumber": 1,
  "pageSize": 20,
  "totalCount": 150,
  "totalPages": 8,
  "hasPreviousPage": false,
  "hasNextPage": true
}
```

### Table columns to show
| Column | Field | Notes |
|---|---|---|
| Name | `fullName` | Show avatar initials beside it |
| Email | `email` | |
| Type | `accountType` | Show as badge: `Staff` (blue) / `End User` (grey) |
| Status | `status` | Show as colored badge (see status colors below) |
| Joined | `createdAt` | Format as date |
| Last Login | `lastLoginAt` | Format as relative time ("3 days ago") or "Never" |
| Actions | — | Dropdown menu per row |

**Status badge colors:**
- `Active` (1) → green
- `Inactive` (2) → grey
- `Suspended` (3) → orange/amber

### Filters bar (above the table)
- Search input (searches email + name)
- Status dropdown: All / Active / Inactive / Suspended
- Account Type dropdown: All / Staff / End User

### Row actions (dropdown per row)
| Action | What it does | API call |
|---|---|---|
| View / Edit | Open a side panel or modal with editable fields | `GET /users/{id}` then `PUT /users/{id}` |
| View Profile | Show extended profile | `GET /users/{id}/profile` |
| View Roles | Show assigned roles with remove button | `GET /users/{id}/roles` |
| Assign Role | Dropdown to pick a role → assign | `POST /users/{id}/roles` with `{ "roleId": "..." }` |
| View Sessions | Show active login sessions | `GET /users/{id}/sessions` |
| Revoke All Sessions | Instantly log out user everywhere | `DELETE /users/{id}/sessions` |
| Suspend | Show a reason text box → submit | `POST /users/{id}/suspend` with `{ "reason": "..." }` |
| Activate | Re-enable a suspended/inactive user | `POST /users/{id}/activate` |
| Deactivate | Offboard a user | `POST /users/{id}/deactivate` |
| Delete | Permanent delete with confirm dialog | `DELETE /users/{id}` |

### Edit User modal/side panel
Fields:
- First Name (required)
- Last Name (required)
- Email (required)

```
PUT /users/{id}
Body: { "firstName": "...", "lastName": "...", "email": "..." }
```

### Edit User Profile modal (admin-only fields)
Fields:
- Department (dropdown: Development, DataScience, Operations, Management)
- Display Job Title
- Internal Job Title *(sensitive — only admins should see this)*
- Hourly Cost *(sensitive number — only admins)*
- Phone Number
- Hire Date (date picker)
- Avatar URL
- Bio
- Skills (tag input, comma-separated list)

```
PUT /users/{id}/profile
Body: {
  "department": 1,
  "displayJobTitle": "...",
  "internalJobTitle": "...",
  "hourlyCost": 50.00,
  "phoneNumber": "...",
  "hireDate": "2024-01-15",
  "avatarUrl": "...",
  "bio": "...",
  "skills": ["React", "TypeScript"]
}
```

### Sessions sub-view (when "View Sessions" is clicked)
Show a small table:
| Column | Field |
|---|---|
| Device | `userAgent` (shorten it) |
| IP Address | `ipAddress` |
| Started | `createdAt` |
| Last Active | `lastActivityAt` |
| Expires | `expiresAt` |
| Current? | `isCurrent` — show "(current)" label |
| Action | Revoke button → `DELETE /users/{id}/sessions/{sessionId}` |

---

---

## Page 2 — Roles

### What it looks like
A table of roles with an expandable drawer that shows the permissions assigned to each role. Includes a "Create Role" button.

### API: Fetch the list
```
GET /roles?pageNumber=1&pageSize=20&searchTerm=&isActive=&sortBy=Name&sortDirection=asc
```

**Response shape** (one row):
```json
{
  "id": "guid",
  "name": "Administrator",
  "description": "Full system access",
  "isSystemRole": true,
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "userCount": 3
}
```

### Table columns
| Column | Field | Notes |
|---|---|---|
| Name | `name` | |
| Description | `description` | |
| Type | `isSystemRole` | Badge: "System" (locked icon) or "Custom" |
| Status | `isActive` | Active (green) / Inactive (grey) |
| Users | `userCount` | Number of users assigned |
| Created | `createdAt` | |
| Actions | — | |

### Row actions
| Action | API call |
|---|---|
| Edit | `GET /roles/{id}` → `PUT /roles/{id}` |
| Manage Permissions | Open permissions matrix drawer |
| Activate | `POST /roles/{id}/activate` |
| Deactivate | `POST /roles/{id}/deactivate` |
| Delete | `DELETE /roles/{id}` *(disabled for system roles)* |

> **Note:** System roles (`isSystemRole: true`) cannot be modified or deleted. Show all action buttons as disabled/greyed out for those rows.

### Create Role modal
Fields:
- Name (required)
- Description
- Can View Sensitive Data (toggle/checkbox — enables access to hourly cost, internal job titles)

```
POST /roles
Body: { "name": "...", "description": "...", "canViewSensitiveData": false }
```

### Permissions Drawer (open when "Manage Permissions" is clicked)

1. Fetch the current permissions for this role:
   ```
   GET /roles/{id}/permissions
   ```
   Returns a list of `PermissionResponse`:
   ```json
   [{ "id": "guid", "code": "USERS:CREATE", "name": "Create Users", "module": "Users", "action": "Create" }]
   ```

2. Fetch all available permissions:
   ```
   GET /permissions
   ```

3. Display as a **matrix table** — rows = Modules, columns = Actions (Create / Read / Update / Delete). Each cell is a checkbox. Pre-check the ones already assigned.

   | Module | Create | Read | Update | Delete |
   |---|---|---|---|---|
   | Users | ✅ | ✅ | ✅ | ✅ |
   | Roles | ✅ | ✅ | ✅ | ❌ |
   | Accounts | ✅ | ✅ | ✅ | ❌ |
   | StressData | ❌ | ✅ | ❌ | ❌ |
   | StressAnalysis | ❌ | ✅ | ❌ | ❌ |
   | Plans | ❌ | ✅ | ❌ | ❌ |
   | Subscriptions | ❌ | ✅ | ❌ | ❌ |
   | Invoices | ❌ | ✅ | ❌ | ❌ |
   | Dashboard | ❌ | ✅ | ❌ | ❌ |
   | Reports | ❌ | ✅ | ❌ | ❌ |

4. When saving, send the full list of checked permission IDs:
   ```
   PUT /roles/{id}/permissions
   Body: { "permissionIds": ["guid1", "guid2", ...] }
   ```

---

---

## Page 3 — Accounts

Accounts are organizations/companies that own EndUsers. Think of them as client companies whose employees use the desktop agent.

### API: Fetch the list
```
GET /accounts?pageNumber=1&pageSize=20&searchTerm=&isActive=&industry=&sortBy=Name&sortDirection=asc
```

**Response shape** (one row):
```json
{
  "id": "guid",
  "name": "StressLess Corp",
  "industry": "Technology",
  "website": "https://stressless.com",
  "isActive": true,
  "createdAt": "2026-01-01T00:00:00Z",
  "contactCount": 2
}
```

### Table columns
| Column | Field |
|---|---|
| Name | `name` |
| Industry | `industry` |
| Website | `website` (clickable link) |
| Contacts | `contactCount` |
| Status | `isActive` badge |
| Created | `createdAt` |
| Actions | |

### Row actions
| Action | API call |
|---|---|
| View Details | `GET /accounts/{id}` |
| Edit | `PUT /accounts/{id}` |
| View Contacts | `GET /accounts/{id}/contacts` |
| Add Contact | `POST /accounts/{id}/contacts` |
| Invite Contact | `POST /accounts/{id}/invitations` |
| View Invitations | `GET /accounts/{id}/invitations` |
| Activate | `POST /accounts/{id}/activate` |
| Deactivate | `POST /accounts/{id}/deactivate` |
| Delete | `DELETE /accounts/{id}` |

### Create/Edit Account modal
Fields:
- Name (required)
- Industry
- Website
- Phone
- Address
- Tax Number

```
POST /accounts   or   PUT /accounts/{id}
Body: { "name": "...", "industry": "...", "website": "...", "phone": "...", "address": "...", "taxNumber": "..." }
```

### Contacts sub-view
Show when "View Contacts" is clicked. Fetch:
```
GET /accounts/{id}/contacts
```
Returns `AccountContactResponse[]`:
```json
[{
  "id": "guid",
  "userId": "guid",
  "email": "ahmed@stressless.com",
  "firstName": "Ahmed",
  "lastName": "Hassan",
  "fullName": "Ahmed Hassan",
  "role": "Developer",
  "isPrimaryContact": true,
  "isDecisionMaker": false,
  "isActive": true,
  "isInviteAccepted": true,
  "createdAt": "..."
}]
```

Contact table columns: Full Name, Email, Role, Primary?, Decision Maker?, Invite Status, Active?, Actions (Edit, Remove).

Edit contact:
```
PUT /accounts/{id}/contacts/{contactId}
Body: { "role": "...", "isPrimaryContact": true, "isDecisionMaker": false }
```

Update contact permissions:
```
PUT /accounts/{id}/contacts/{contactId}/permissions
Body: { "isPrimaryContact": true, "isDecisionMaker": false }
```

Remove contact:
```
DELETE /accounts/{id}/contacts/{contactId}
```

### Invite Contact flow
When you want to invite a new person to join an account:
1. Admin fills a form: Email, Role
2. `POST /accounts/{id}/invitations` with `{ "email": "...", "role": "..." }`
3. Backend sends invite email. Show pending in `GET /accounts/{id}/invitations`.
4. Admin can resend: `POST /accounts/{id}/invitations/{invitationId}/resend`
5. Admin can cancel: `DELETE /accounts/{id}/invitations/{invitationId}`

---

---

## Page 4 — Stress Data

This page lets admins see all stress monitoring activity. There is no admin-level `GET /stress/sessions/all` — the stress endpoints return data for **the currently logged in user**. The practical approach is to navigate stress data **per user** (from the Users page → drill into a user → see their sessions).

### How to access stress data for a specific user
From the Users page, add a "View Stress Data" action per row. Open a drawer/modal that shows:

#### 4a — Session History
```
GET /stress-sessions?page=1&pageSize=20&from=ISO_DATE&to=ISO_DATE
```
(Returns sessions for the **authenticated** user — so the admin must log in as that user, OR the backend needs a `userId` filter added in the future.)

**Session card fields:**
| Field | Description |
|---|---|
| `status` | Active / Paused / Ended |
| `startedAt` | When monitoring started |
| `endedAt` | When it ended (null if still running) |
| `durationSeconds` | Total duration |
| `averageStressScore` | 0–100 average score |
| `peakStressScore` | Highest score in session |
| `readingsCount` | How many data points |
| `deviceName` | Which machine ran the agent |
| `notes` / `endReason` | Optional notes |

#### 4b — Session Detail (click a session)
```
GET /stress-sessions/{sessionId}
```
Returns everything in 4a PLUS a `readings[]` array — the full time-series of stress readings.

Show a line chart: X = `createdAt`, Y = `score`. Color the line by `level` (Normal/Medium/High).

#### 4c — Stress Readings (raw data table)
```
GET /stress/readings?page=1&pageSize=50&from=ISO_DATE&to=ISO_DATE&sessionId=GUID
```

Reading fields:
| Field | Notes |
|---|---|
| `score` | 0–100 stress score |
| `level` | "Normal" / "Medium" / "High" |
| `confidence` | 0–1 model confidence |
| `modelVersion` | e.g., "1.0.0" |
| `createdAt` | Timestamp |

#### 4d — Trend Chart
```
GET /stress/trends?from=ISO_DATE&to=ISO_DATE&granularity=Hour|Day|Week
```

Returns `StressTrendPoint[]`:
```json
[{
  "bucketStart": "2026-05-25T08:00:00Z",
  "averageScore": 45.2,
  "peakScore": 78.0,
  "readingsCount": 12
}]
```
Plot as a bar or area chart. Show `averageScore` as the main line and `peakScore` as a lighter overlay.

#### 4e — Current Stress Snapshot
```
GET /stress/current
```
```json
{
  "hasData": true,
  "score": 62.5,
  "level": "Medium",
  "at": "2026-05-25T10:30:00Z",
  "sessionId": "guid"
}
```
Display as a stat card at the top.

---

---

## Page 5 — Audit Logs

A read-only log of everything that happened in the system. Very important for security and compliance.

### API: Fetch logs
```
GET /audit-logs?pageNumber=1&pageSize=20&userId=&action=&entityType=&fromDate=ISO&toDate=ISO&sortBy=Timestamp&sortDirection=desc
```

**Filter parameters:**
| Param | Type | Notes |
|---|---|---|
| `userId` | GUID | Filter logs for one specific user |
| `action` | int (AuditAction enum) | See full list below |
| `entityType` | string | e.g., "User", "Role", "Account" |
| `fromDate` | ISO datetime | Start of date range |
| `toDate` | ISO datetime | End of date range |

**Response shape** (one row):
```json
{
  "id": "guid",
  "userId": "guid",
  "userEmail": "admin@onex.com",
  "actionName": "UserCreated",
  "entityType": "User",
  "entityName": "Ahmed Hassan",
  "description": "Created new manager user",
  "timestamp": "2026-05-25T10:30:00Z"
}
```

### Table columns
| Column | Field | Notes |
|---|---|---|
| Timestamp | `timestamp` | Sort descending by default |
| Who | `userEmail` | Clickable — navigate to that user |
| Action | `actionName` | Color-coded badge (see below) |
| On | `entityType` + `entityName` | e.g., "User · Ahmed Hassan" |
| Description | `description` | Short summary |
| Details | — | Click to open detail view |

### Action badge colors
| Category | Actions | Color |
|---|---|---|
| Auth | Login, Logout, LoginFailed, PasswordChanged, PasswordReset | Blue / Red for failed |
| User Management | UserCreated, UserUpdated, UserDeleted, UserActivated, UserDeactivated, UserSuspended | Green/Orange/Red |
| Roles | RoleCreated, RoleUpdated, RoleDeleted, RolePermissionsUpdated | Purple |
| Accounts | AccountCreated, AccountUpdated, AccountDeleted | Teal |
| Data Access | SensitiveDataViewed, DataExported, ReportGenerated | Yellow |
| System | SettingsChanged, SystemError | Grey / Red |

### Filters bar
- Date range picker (from / to)
- User email search
- Action dropdown (all values from `AuditAction` enum above)
- Entity Type text input

### Detail view (click "Details" on a row)
```
GET /audit-logs/{id}
```
Shows extra fields not in the list:
```json
{
  "oldValues": "{ \"status\": \"Active\" }",
  "newValues": "{ \"status\": \"Suspended\" }",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0 ...",
  "correlationId": "request-trace-id"
}
```
Show `oldValues` and `newValues` as a diff view (two columns: Before / After) if the JSON is parseable.

### Per-user audit log view
You can also fetch logs for just one user (e.g., from the Users page):
```
GET /users/{userId}/audit-logs?pageNumber=1&pageSize=20&action=&fromDate=&toDate=
```

---

---

## Page 6 — Devices

Desktop agent devices that have been registered by end users.

### API: Fetch devices
```
GET /devices
```
Returns `DeviceResponse[]`:
```json
[{
  "id": "guid",
  "deviceName": "Ahmed-MacBook-Pro",
  "platform": "macOS",
  "osVersion": "14.4",
  "agentVersion": "1.2.0",
  "isActive": true,
  "lastSeenAt": "2026-05-25T10:00:00Z",
  "createdAt": "2026-01-10T00:00:00Z",
  "revokedAt": null
}]
```

### Table columns
| Column | Field |
|---|---|
| Device Name | `deviceName` |
| Platform | `platform` |
| OS Version | `osVersion` |
| Agent Version | `agentVersion` |
| Last Seen | `lastSeenAt` (relative: "2 hours ago") |
| Status | `isActive` badge — Active / Revoked |
| Registered | `createdAt` |
| Actions | Revoke button |

### Revoke a device
```
DELETE /devices/{id}
```
Show a confirm dialog before revoking. Once revoked, `revokedAt` will be set.

### Register device (info only)
The registration happens from the desktop agent itself:
```
POST /devices
```
Admins don't do this manually — it's shown for completeness.

---

---

## Page 7 — Permissions Matrix (Reference Page)

A simple read-only page showing all permissions in the system, organized by module and action. Useful for understanding what each role can do.

### API
```
GET /permissions
```
Returns `PermissionResponse[]`:
```json
[{
  "id": "guid",
  "code": "USERS:CREATE",
  "name": "Create Users",
  "description": "Permission to Create Users",
  "module": "Users",
  "action": "Create"
}]
```

### Display as a matrix table
Group by `module`. Columns = Create, Read, Update, Delete.

| Module | Create | Read | Update | Delete |
|---|---|---|---|---|
| **Users** | USERS:CREATE | USERS:READ | USERS:UPDATE | USERS:DELETE |
| **Roles** | ROLES:CREATE | ROLES:READ | ROLES:UPDATE | ROLES:DELETE |
| **Accounts** | ACCOUNTS:CREATE | ACCOUNTS:READ | ACCOUNTS:UPDATE | ACCOUNTS:DELETE |
| **StressData** | STRESSDATA:CREATE | STRESSDATA:READ | STRESSDATA:UPDATE | STRESSDATA:DELETE |
| **StressAnalysis** | STRESSANALYSIS:CREATE | STRESSANALYSIS:READ | STRESSANALYSIS:UPDATE | STRESSANALYSIS:DELETE |
| **Plans** | PLANS:CREATE | PLANS:READ | PLANS:UPDATE | PLANS:DELETE |
| **Subscriptions** | SUBSCRIPTIONS:CREATE | SUBSCRIPTIONS:READ | SUBSCRIPTIONS:UPDATE | SUBSCRIPTIONS:DELETE |
| **Invoices** | INVOICES:CREATE | INVOICES:READ | INVOICES:UPDATE | INVOICES:DELETE |
| **Dashboard** | DASHBOARD:CREATE | DASHBOARD:READ | DASHBOARD:UPDATE | DASHBOARD:DELETE |
| **Reports** | REPORTS:CREATE | REPORTS:READ | REPORTS:UPDATE | REPORTS:DELETE |

Each cell shows the permission `code`. Clicking it could show the `description`.

---

---

## Shared Components Needed

### 1 — Pagination Component
All list pages use the same `PagedResult<T>` envelope. Build one reusable component:
- Previous / Next buttons
- Page number input
- "Showing X–Y of Z results" label
- Page size selector (10 / 20 / 50)

### 2 — Status Badge
- `Active` → green pill
- `Inactive` → grey pill
- `Suspended` → amber pill
- `Pending` (invitations) → blue pill
- `Revoked` → red pill

### 3 — Confirm Danger Dialog
Used for: Delete User, Revoke Sessions, Delete Role, Deactivate Account.
- Title (e.g., "Delete this user?")
- Description ("This action is permanent and cannot be undone.")
- Red "Confirm" button, Cancel button

### 4 — Reason Input Dialog
Used for: Suspend User (reason is optional but good UX).
- Textarea for reason
- Submit / Cancel

### 5 — Empty State
For tables with no results. Show icon + "No results found" + "Clear filters" button.

### 6 — Toast Notifications
On success: green toast ("User suspended successfully.")
On failure: red toast with the error message from the API (`body.message` or the problem details title).

---

## Error Handling Reference

The backend returns RFC 7807 Problem Details on errors:
```json
{
  "type": "https://...",
  "title": "User not found.",
  "status": 404,
  "errors": { "field": ["error message"] }
}
```

| Status Code | What happened | What to show |
|---|---|---|
| 400 | Validation error | Show field-level errors from `errors` object |
| 401 | Not logged in | Redirect to login |
| 403 | Not authorized | "You don't have permission to do this" |
| 404 | Not found | "Not found" toast or empty state |
| 409 | Conflict (duplicate) | Show `title` in a toast ("A role with this name already exists.") |
| 429 | Rate limited | "Too many requests, please wait" |
| 500 | Server error | "Something went wrong, please try again" |
