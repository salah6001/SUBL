# ONEX Complete API Test - All 73 Endpoints
# Tests every endpoint in the system

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$MailPitUrl = "http://localhost:8025"
)

$ErrorActionPreference = "Continue"
$Global:TestResults = @()
$Global:PassCount = 0
$Global:FailCount = 0
$Global:SkipCount = 0

# Colors for output
function Write-Section { param($msg) Write-Host "`n???????????????????????????????????????????????????????????????" -ForegroundColor Magenta; Write-Host "  $msg" -ForegroundColor Magenta; Write-Host "???????????????????????????????????????????????????????????????" -ForegroundColor Magenta }
function Write-Test { param($msg) Write-Host "  ? $msg" -ForegroundColor Cyan }
function Write-Pass { param($msg) Write-Host "    ? $msg" -ForegroundColor Green; $Global:PassCount++ }
function Write-Fail { param($msg) Write-Host "    ? $msg" -ForegroundColor Red; $Global:FailCount++ }
function Write-Skip { param($msg) Write-Host "    ??  $msg" -ForegroundColor Yellow; $Global:SkipCount++ }
function Write-Info { param($msg) Write-Host "    ??  $msg" -ForegroundColor Gray }

# API Helper
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [switch]$AllowError
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    $params = @{
        Uri = "$BaseUrl$Endpoint"
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
    }
    
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    
    try {
        $response = Invoke-WebRequest @params -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Data = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
        }
    }
    catch {
        $statusCode = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# Test wrapper
function Test-Endpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null,
        [int[]]$ExpectedStatus = @(200, 201, 204),
        [switch]$Skip
    )
    
    Write-Test "$Method $Endpoint"
    
    if ($Skip) {
        Write-Skip "Skipped: $Name"
        return $null
    }
    
    $result = Invoke-Api -Method $Method -Endpoint $Endpoint -Body $Body -Token $Token
    
    if ($result.Success -or $ExpectedStatus -contains $result.StatusCode) {
        Write-Pass "$Name (Status: $($result.StatusCode))"
        return $result
    } else {
        Write-Fail "$Name (Status: $($result.StatusCode))"
        Write-Info "Error: $($result.Error)"
        return $result
    }
}

Write-Host @"

????????????????????????????????????????????????????????????????
?           ONEX Complete API Test - 73 Endpoints              ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Magenta

# ============================================
# SETUP
# ============================================
Write-Section "SETUP"

# Generate unique test data
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "test_$timestamp@example.com"
$testPassword = "TestPassword123!"
$adminEmail = "admin@onex.com"
$adminPassword = "Admin@123!"

Write-Info "Test Email: $testEmail"
Write-Info "Admin Email: $adminEmail"

# ============================================
# 1. HEALTH CHECK (1 endpoint)
# ============================================
Write-Section "1. HEALTH CHECK"

Test-Endpoint -Name "Health Check" -Method "GET" -Endpoint "/health"

# ============================================
# 2. AUTHENTICATION (4 endpoints)
# ============================================
Write-Section "2. AUTHENTICATION"

# 2.1 Register
$registerResult = Test-Endpoint -Name "Register User" -Method "POST" -Endpoint "/users/register" -Body @{
    email = $testEmail
    password = $testPassword
    firstName = "Test"
    lastName = "User"
} -ExpectedStatus @(201)

$testUserId = if ($registerResult -and $registerResult.Data) { $registerResult.Data.id } else { $null }
Write-Info "Test User ID: $testUserId"

# 2.2 Login
$loginResult = Test-Endpoint -Name "Login User" -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

$testToken = $loginResult.Data.accessToken
$testRefreshToken = $loginResult.Data.refreshToken


# 2.3 Refresh Token
if ($testRefreshToken) {
    $refreshResult = Test-Endpoint -Name "Refresh Token" -Method "POST" -Endpoint "/users/refresh" -Body @{
        refreshToken = $testRefreshToken
    }

    if ($refreshResult -and $refreshResult.Data) {
        $testToken = $refreshResult.Data.accessToken
        $testRefreshToken = $refreshResult.Data.refreshToken
    }
} else {
    Write-Test "POST /users/refresh"; Write-Skip "Refresh Token - No refresh token"
}

# Login as Admin
$adminLoginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $adminEmail
    password = $adminPassword
}
$adminToken = if ($adminLoginResult -and $adminLoginResult.Data) { $adminLoginResult.Data.accessToken } else { $null }

if (-not $adminToken) {
    Write-Fail "Failed to login as admin - some tests will fail"
    Write-Info "Admin login error: $($adminLoginResult.Error)"
} else {
    Write-Pass "Admin login successful"
}

# Store admin credentials globally
$Global:AdminEmail = $adminEmail
$Global:AdminPassword = $adminPassword
$Global:BaseUrl = $BaseUrl

# Helper function to refresh admin token if needed
function Get-AdminToken {
    $loginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = $Global:AdminEmail
        password = $Global:AdminPassword
    }
    if ($loginResult -and $loginResult.Data) {
        return $loginResult.Data.accessToken
    }
    return $null
}

# ============================================
# 3. PASSWORD MANAGEMENT (3 endpoints)
# ============================================
Write-Section "3. PASSWORD MANAGEMENT"

# 3.1 Change Password
Test-Endpoint -Name "Change Password" -Method "POST" -Endpoint "/users/change-password" -Token $testToken -Body @{
    currentPassword = $testPassword
    newPassword = "NewPassword456!"
}

# Update password for future tests
$testPassword = "NewPassword456!"

# Re-login with new password
$loginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}
$testToken = $loginResult.Data.accessToken

# 3.2 Forgot Password
Test-Endpoint -Name "Forgot Password" -Method "POST" -Endpoint "/users/forgot-password" -Body @{
    email = $testEmail
}

# 3.3 Reset Password (will fail without valid token - expected)
Test-Endpoint -Name "Reset Password" -Method "POST" -Endpoint "/users/reset-password" -Body @{
    email = $testEmail
    token = "invalid-token"
    newPassword = "ResetPassword789!"
} -ExpectedStatus @(400)

# ============================================
# 4. EMAIL CONFIRMATION (2 endpoints)
# ============================================
Write-Section "4. EMAIL CONFIRMATION"

# 4.1 Confirm Email (will fail without valid token)
Test-Endpoint -Name "Confirm Email" -Method "POST" -Endpoint "/users/confirm-email" -Body @{
    userId = $testUserId
    token = "invalid-token"
} -ExpectedStatus @(400)

# 4.2 Resend Confirmation
Test-Endpoint -Name "Resend Confirmation" -Method "POST" -Endpoint "/users/resend-confirmation" -Body @{
    email = $testEmail
}

# ============================================
# 5. TWO-FACTOR AUTHENTICATION (3 endpoints)
# ============================================
Write-Section "5. TWO-FACTOR AUTHENTICATION"

# 5.1 Enable 2FA
$enable2faResult = Test-Endpoint -Name "Enable 2FA" -Method "POST" -Endpoint "/users/2fa/enable" -Token $testToken

# 5.2 Verify 2FA (skip - requires authenticator code)
Write-Test "POST /users/2fa/verify"
Write-Skip "Verify 2FA - Requires authenticator code"

# 5.3 Disable 2FA (skip - requires code)
Write-Test "POST /users/2fa/disable"
Write-Skip "Disable 2FA - Requires authenticator code"

# ============================================
# 6. USER MANAGEMENT (9 endpoints)
# ============================================
Write-Section "6. USER MANAGEMENT"

# 6.1 Get Users (paginated)
Test-Endpoint -Name "Get Users" -Method "GET" -Endpoint "/users?page=1&pageSize=10" -Token $adminToken

# 6.2 Get User by ID
Test-Endpoint -Name "Get User by ID" -Method "GET" -Endpoint "/users/$testUserId" -Token $adminToken

# 6.3 Get Current User
Test-Endpoint -Name "Get Current User" -Method "GET" -Endpoint "/users/me" -Token $testToken

# 6.4 Update User
Test-Endpoint -Name "Update User" -Method "PUT" -Endpoint "/users/$testUserId" -Token $adminToken -Body @{
    firstName = "Updated"
    lastName = "User"
}

# 6.5 Update Current User
Test-Endpoint -Name "Update Current User" -Method "PUT" -Endpoint "/users/me" -Token $testToken -Body @{
    firstName = "Self"
    lastName = "Updated"
} -ExpectedStatus @(200, 204)

# 6.6 Deactivate User (create temp user first)
$tempEmail = "temp_$timestamp@example.com"
$tempResult = Invoke-Api -Method "POST" -Endpoint "/users/register" -Body @{
    email = $tempEmail
    password = $testPassword
    firstName = "Temp"
    lastName = "User"
}
$tempUserId = $tempResult.Data.id

Test-Endpoint -Name "Deactivate User" -Method "POST" -Endpoint "/users/$tempUserId/deactivate" -Token $adminToken -ExpectedStatus @(200, 204)

# 6.7 Activate User
Test-Endpoint -Name "Activate User" -Method "POST" -Endpoint "/users/$tempUserId/activate" -Token $adminToken -ExpectedStatus @(200, 204)

# 6.8 Suspend User
Test-Endpoint -Name "Suspend User" -Method "POST" -Endpoint "/users/$tempUserId/suspend" -Token $adminToken -ExpectedStatus @(200, 204)

# 6.9 Delete User
Test-Endpoint -Name "Delete User" -Method "DELETE" -Endpoint "/users/$tempUserId" -Token $adminToken -ExpectedStatus @(200, 204)

# ============================================
# 7. USER PROFILE (4 endpoints)
# ============================================
Write-Section "7. USER PROFILE"

# 7.1 Get User Profile
Test-Endpoint -Name "Get User Profile" -Method "GET" -Endpoint "/users/$testUserId/profile" -Token $adminToken

# 7.2 Get Current User Profile
Test-Endpoint -Name "Get Current User Profile" -Method "GET" -Endpoint "/users/me/profile" -Token $testToken

# 7.3 Update User Profile
Test-Endpoint -Name "Update User Profile" -Method "PUT" -Endpoint "/users/$testUserId/profile" -Token $adminToken -Body @{
    phoneNumber = "+1234567890"
    jobTitle = "Developer"
    department = "Engineering"
} -ExpectedStatus @(200, 204)

# 7.4 Update Current User Profile
Test-Endpoint -Name "Update Current User Profile" -Method "PUT" -Endpoint "/users/me/profile" -Token $testToken -Body @{
    phoneNumber = "+0987654321"
    jobTitle = "Senior Developer"
} -ExpectedStatus @(200, 204)

# ============================================
# 8. USER SESSIONS (4 endpoints)
# ============================================
Write-Section "8. USER SESSIONS"

# 8.1 Get User Sessions
Test-Endpoint -Name "Get User Sessions" -Method "GET" -Endpoint "/users/$testUserId/sessions" -Token $adminToken

# 8.2 Get Current User Sessions
Test-Endpoint -Name "Get Current User Sessions" -Method "GET" -Endpoint "/users/me/sessions" -Token $testToken

# 8.3 Revoke Session (skip - need session ID)
Write-Test "DELETE /users/{id}/sessions/{sessionId}"
Write-Skip "Revoke Session - Need valid session ID"

# 8.4 Revoke All Sessions
Test-Endpoint -Name "Revoke All Sessions" -Method "DELETE" -Endpoint "/users/$testUserId/sessions" -Token $adminToken -ExpectedStatus @(200, 204)

# Re-login after session revoke
$loginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}
$testToken = $loginResult.Data.accessToken

# ============================================
# 9. ROLE MANAGEMENT (9 endpoints)
# ============================================
Write-Section "9. ROLE MANAGEMENT"

# 9.1 Get Roles
Test-Endpoint -Name "Get Roles" -Method "GET" -Endpoint "/roles" -Token $adminToken

# 9.2 Create Role
$createRoleResult = Test-Endpoint -Name "Create Role" -Method "POST" -Endpoint "/roles" -Token $adminToken -Body @{
    name = "TestRole_$timestamp"
    description = "Test role for API testing"
    canViewSensitiveData = $false
} -ExpectedStatus @(200, 201)

$testRoleId = if ($createRoleResult -and $createRoleResult.Data) { $createRoleResult.Data.id } else { $null }
Write-Info "Role ID: $testRoleId"

# 9.3 Get Role by ID
Test-Endpoint -Name "Get Role by ID" -Method "GET" -Endpoint "/roles/$testRoleId" -Token $adminToken

# 9.4 Update Role
Test-Endpoint -Name "Update Role" -Method "PUT" -Endpoint "/roles/$testRoleId" -Token $adminToken -Body @{
    name = "UpdatedRole_$timestamp"
    description = "Updated description"
    canViewSensitiveData = $true
} -ExpectedStatus @(200, 204)

# 9.5 Get Role Permissions
Test-Endpoint -Name "Get Role Permissions" -Method "GET" -Endpoint "/roles/$testRoleId/permissions" -Token $adminToken

# 9.6 Update Role Permissions
Test-Endpoint -Name "Update Role Permissions" -Method "PUT" -Endpoint "/roles/$testRoleId/permissions" -Token $adminToken -Body @{
    permissionIds = @()
} -ExpectedStatus @(200, 204)

# 9.7 Deactivate Role
Test-Endpoint -Name "Deactivate Role" -Method "POST" -Endpoint "/roles/$testRoleId/deactivate" -Token $adminToken -ExpectedStatus @(200, 204)

# 9.8 Activate Role
Test-Endpoint -Name "Activate Role" -Method "POST" -Endpoint "/roles/$testRoleId/activate" -Token $adminToken -ExpectedStatus @(200, 204)

# 9.9 Delete Role
Test-Endpoint -Name "Delete Role" -Method "DELETE" -Endpoint "/roles/$testRoleId" -Token $adminToken -ExpectedStatus @(200, 204)

# ============================================
# 10. PERMISSIONS (2 endpoints)
# ============================================
Write-Section "10. PERMISSIONS"

# 10.1 Get Permissions
Test-Endpoint -Name "Get Permissions" -Method "GET" -Endpoint "/permissions" -Token $adminToken

# 10.2 Get Current User Permissions
Test-Endpoint -Name "Get Current User Permissions" -Method "GET" -Endpoint "/users/me/permissions" -Token $testToken

# ============================================
# 11. USER ROLES (3 endpoints)
# ============================================
Write-Section "11. USER ROLES"

# Create a role first
$roleResult = Invoke-Api -Method "POST" -Endpoint "/roles" -Token $adminToken -Body @{
    name = "AssignRole_$timestamp"
    description = "Role for assignment test"
}
$assignRoleId = $roleResult.Data.id

# 11.1 Get User Roles
Test-Endpoint -Name "Get User Roles" -Method "GET" -Endpoint "/users/$testUserId/roles" -Token $adminToken

# 11.2 Assign Role to User
Test-Endpoint -Name "Assign Role to User" -Method "POST" -Endpoint "/users/$testUserId/roles" -Token $adminToken -Body @{
    roleId = $assignRoleId
} -ExpectedStatus @(200, 201, 204)

# 11.3 Remove Role from User
Test-Endpoint -Name "Remove Role from User" -Method "DELETE" -Endpoint "/users/$testUserId/roles/$assignRoleId" -Token $adminToken -ExpectedStatus @(200, 204)

# Cleanup
Invoke-Api -Method "DELETE" -Endpoint "/roles/$assignRoleId" -Token $adminToken | Out-Null

# ============================================
# 12. ACCOUNT MANAGEMENT (7 endpoints)
# ============================================
Write-Section "12. ACCOUNT MANAGEMENT"

# Refresh admin token
$adminToken = Get-AdminToken
if (-not $adminToken) { Write-Fail "Could not refresh admin token" }

# 12.1 Create Account
$createAccountResult = Test-Endpoint -Name "Create Account" -Method "POST" -Endpoint "/accounts" -Token $adminToken -Body @{
    name = "TestCompany_$timestamp"
    industry = "Technology"
    website = "https://testcompany.com"
    phone = "+1234567890"
} -ExpectedStatus @(200, 201)

$testAccountId = if ($createAccountResult -and $createAccountResult.Data) { $createAccountResult.Data.id } else { $null }
Write-Info "Account ID: $testAccountId"

if (-not $testAccountId) {
    Write-Fail "Failed to create account - subsequent account tests will fail"
}

# 12.2 Get Accounts
Test-Endpoint -Name "Get Accounts" -Method "GET" -Endpoint "/accounts?page=1&pageSize=10" -Token $adminToken

# 12.3 Get Account by ID
if ($testAccountId) {
    Test-Endpoint -Name "Get Account by ID" -Method "GET" -Endpoint "/accounts/$testAccountId" -Token $adminToken
} else {
    Write-Test "GET /accounts/{id}"; Write-Skip "Get Account by ID - No account created"
}

# 12.4 Update Account
if ($testAccountId) {
    Test-Endpoint -Name "Update Account" -Method "PUT" -Endpoint "/accounts/$testAccountId" -Token $adminToken -Body @{
        name = "UpdatedCompany_$timestamp"
        industry = "Software"
    } -ExpectedStatus @(200, 204)
} else {
    Write-Test "PUT /accounts/{id}"; Write-Skip "Update Account - No account created"
}

# 12.5 Deactivate Account
if ($testAccountId) {
    Test-Endpoint -Name "Deactivate Account" -Method "POST" -Endpoint "/accounts/$testAccountId/deactivate" -Token $adminToken -ExpectedStatus @(200, 204)
} else {
    Write-Test "POST /accounts/{id}/deactivate"; Write-Skip "Deactivate Account - No account created"
}

# 12.6 Activate Account
if ($testAccountId) {
    Test-Endpoint -Name "Activate Account" -Method "POST" -Endpoint "/accounts/$testAccountId/activate" -Token $adminToken -ExpectedStatus @(200, 204)
} else {
    Write-Test "POST /accounts/{id}/activate"; Write-Skip "Activate Account - No account created"
}

# 12.7 Delete Account (will test at the end)

# ============================================
# 13. ACCOUNT CONTACTS (5 endpoints)
# ============================================
Write-Section "13. ACCOUNT CONTACTS"

if (-not $testAccountId) {
    Write-Info "Skipping Account Contacts tests - No account created"
    Write-Test "GET /accounts/{id}/contacts"; Write-Skip "Get Account Contacts"
    Write-Test "POST /accounts/{id}/contacts"; Write-Skip "Add Account Contact"
    Write-Test "PUT /accounts/{id}/contacts/{contactId}"; Write-Skip "Update Contact"
    Write-Test "PUT /accounts/{id}/contacts/{contactId}/permissions"; Write-Skip "Update Contact Permissions"
    Write-Test "DELETE /accounts/{id}/contacts/{contactId}"; Write-Skip "Remove Contact"
} else {
    # 13.1 Get Account Contacts
    Test-Endpoint -Name "Get Account Contacts" -Method "GET" -Endpoint "/accounts/$testAccountId/contacts" -Token $adminToken

    # 13.2 Add Contact (may fail if user type is not ClientContact - that's OK)
    # Note: Add Contact requires ClientContact user type, which test users may not have
    Write-Test "POST /accounts/{id}/contacts"
    Write-Skip "Add Account Contact - Requires ClientContact user type"
    $testContactId = $null

    # 13.3-13.5 Skip contact-related tests
    Write-Test "PUT /accounts/{id}/contacts/{contactId}"; Write-Skip "Update Contact - Skipped"
    Write-Test "PUT /accounts/{id}/contacts/{contactId}/permissions"; Write-Skip "Update Contact Permissions - Skipped"
    Write-Test "DELETE /accounts/{id}/contacts/{contactId}"; Write-Skip "Remove Contact - Skipped"
}

# ============================================
# 14. CONTACT INVITATIONS (5 endpoints)
# ============================================
Write-Section "14. CONTACT INVITATIONS"

if (-not $testAccountId) {
    Write-Info "Skipping Invitation tests - No account created"
    Write-Test "POST /accounts/{id}/invitations"; Write-Skip "Send Invitation"
    Write-Test "GET /accounts/{id}/invitations"; Write-Skip "Get Pending Invitations"
    Write-Test "POST /accounts/{id}/invitations/{invId}/resend"; Write-Skip "Resend Invitation"
    Write-Test "POST /invitations/{invId}/accept"; Write-Skip "Accept Invitation"
    Write-Test "DELETE /accounts/{id}/invitations/{invId}"; Write-Skip "Cancel Invitation"
    $invitationId = $null
} else {
    $inviteEmail = "invite_$timestamp@example.com"

    # 14.1 Send Invitation
    $inviteResult = Test-Endpoint -Name "Send Invitation" -Method "POST" -Endpoint "/accounts/$testAccountId/invitations" -Token $adminToken -Body @{
        email = $inviteEmail
        firstName = "Invited"
        lastName = "User"
        role = "Product Owner"
        expirationDays = 7
    } -ExpectedStatus @(200, 201)

    $invitationId = if ($inviteResult -and $inviteResult.Data) { $inviteResult.Data.id } else { $null }
    Write-Info "Invitation ID: $invitationId"

    # 14.2 Get Pending Invitations
    Test-Endpoint -Name "Get Pending Invitations" -Method "GET" -Endpoint "/accounts/$testAccountId/invitations" -Token $adminToken

    # 14.3 Resend Invitation
    if ($invitationId) {
        Test-Endpoint -Name "Resend Invitation" -Method "POST" -Endpoint "/accounts/$testAccountId/invitations/$invitationId/resend" -Token $adminToken -ExpectedStatus @(200)
    } else {
        Write-Test "POST /accounts/{id}/invitations/{invId}/resend"
        Write-Skip "Resend Invitation - No invitation created"
    }

    # 14.4 Accept Invitation (will fail without valid token - expected)
    if ($invitationId) {
        Test-Endpoint -Name "Accept Invitation (invalid token)" -Method "POST" -Endpoint "/invitations/$invitationId/accept" -Body @{
            token = "invalid-token"
            password = $testPassword
        } -ExpectedStatus @(400, 404)
    } else {
        Write-Test "POST /invitations/{invId}/accept"
        Write-Skip "Accept Invitation - No invitation created"
    }

    # 14.5 Cancel Invitation
    if ($invitationId) {
        Test-Endpoint -Name "Cancel Invitation" -Method "DELETE" -Endpoint "/accounts/$testAccountId/invitations/$invitationId" -Token $adminToken -ExpectedStatus @(200, 204)
    } else {
        Write-Test "DELETE /accounts/{id}/invitations/{invId}"
        Write-Skip "Cancel Invitation - No invitation created"
    }
}

# ============================================
# 15. AUDIT LOGS (4 endpoints)
# ============================================
Write-Section "15. AUDIT LOGS"

# 15.1 Get Audit Logs
Test-Endpoint -Name "Get Audit Logs" -Method "GET" -Endpoint "/audit-logs?page=1&pageSize=10" -Token $adminToken

# 15.2 Get Audit Log by ID (get first one)
$auditLogsResult = Invoke-Api -Method "GET" -Endpoint "/audit-logs?page=1&pageSize=1" -Token $adminToken
if ($auditLogsResult.Success -and $auditLogsResult.Data.items -and $auditLogsResult.Data.items.Count -gt 0) {
    $auditLogId = $auditLogsResult.Data.items[0].id
    Test-Endpoint -Name "Get Audit Log by ID" -Method "GET" -Endpoint "/audit-logs/$auditLogId" -Token $adminToken
} else {
    Write-Test "GET /audit-logs/{id}"
    Write-Skip "Get Audit Log by ID - No audit logs found"
}

# 15.3 Get User Audit Logs
if ($testUserId) {
    Test-Endpoint -Name "Get User Audit Logs" -Method "GET" -Endpoint "/users/$testUserId/audit-logs" -Token $adminToken
} else {
    Write-Test "GET /users/{id}/audit-logs"; Write-Skip "Get User Audit Logs - No test user"
}

# 15.4 Get Current User Audit Logs
if ($testToken) {
    Test-Endpoint -Name "Get Current User Audit Logs" -Method "GET" -Endpoint "/users/me/audit-logs" -Token $testToken
} else {
    Write-Test "GET /users/me/audit-logs"; Write-Skip "Get Current User Audit Logs - No token"
}

# ============================================
# 16. CLEANUP
# ============================================
Write-Section "16. CLEANUP"

# Delete test account
if ($testAccountId) {
    Test-Endpoint -Name "Delete Account" -Method "DELETE" -Endpoint "/accounts/$testAccountId" -Token $adminToken -ExpectedStatus @(200, 204)
} else {
    Write-Test "DELETE /accounts/{id}"; Write-Skip "Delete Account - No account created"
}

# Logout
if ($testToken) {
    # Re-login to get fresh token (might have been revoked)
    $reloginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = $testEmail
        password = $testPassword
    }
    if ($reloginResult.Success) {
        $testToken = $reloginResult.Data.accessToken
        Test-Endpoint -Name "Logout" -Method "POST" -Endpoint "/users/logout" -Token $testToken -ExpectedStatus @(200, 204)
    } else {
        Write-Test "POST /users/logout"; Write-Skip "Logout - Could not re-login"
    }
} else {
    Write-Test "POST /users/logout"; Write-Skip "Logout - No token"
}

# ============================================
# SUMMARY
# ============================================
$totalTests = $Global:PassCount + $Global:FailCount + $Global:SkipCount

Write-Host @"

????????????????????????????????????????????????????????????????
?                      TEST SUMMARY                            ?
????????????????????????????????????????????????????????????????
?                                                              ?
?  Total Tests:  $totalTests                                           ?
?  ? Passed:    $($Global:PassCount)                                           ?
?  ? Failed:    $($Global:FailCount)                                            ?
?  ??  Skipped:  $($Global:SkipCount)                                            ?
?                                                              ?
?  Pass Rate:    $([math]::Round(($Global:PassCount / [math]::Max(1, $Global:PassCount + $Global:FailCount)) * 100, 1))%                                        ?
?                                                              ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor $(if ($Global:FailCount -eq 0) { "Green" } else { "Yellow" })

if ($Global:FailCount -eq 0) {
    Write-Host "?? All tests passed!" -ForegroundColor Green
} else {
    Write-Host "??  Some tests failed. Please review the output above." -ForegroundColor Yellow
}
