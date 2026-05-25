# ONEX Full API Integration Test
# Tests complete user journeys: Register -> Login -> Use APIs -> Logout

$baseUrl = "http://localhost:5000"
$testEmail = "testuser_$(Get-Random)@test.com"
$testPassword = "TestPass@123!"
$global:accessToken = ""
$global:refreshToken = ""
$global:testUserId = ""
$global:testRoleId = ""
$global:testAccountId = ""

function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$UseAuth = $false
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($UseAuth -and $global:accessToken) {
        $headers["Authorization"] = "Bearer $($global:accessToken)"
    }
    
    $params = @{
        Uri = "$baseUrl$Endpoint"
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
    }
    
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    
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

function Test-Step {
    param([string]$Name, [scriptblock]$Action)
    
    Write-Host "`n? $Name" -ForegroundColor Cyan
    try {
        $result = & $Action
        if ($result.Success) {
            Write-Host "  ? SUCCESS (Status: $($result.StatusCode))" -ForegroundColor Green
            return $result
        } else {
            Write-Host "  ? FAILED (Status: $($result.StatusCode)) - $($result.Error)" -ForegroundColor Red
            return $result
        }
    }
    catch {
        Write-Host "  ? ERROR: $($_.Exception.Message)" -ForegroundColor Red
        return @{ Success = $false }
    }
}

Write-Host @"

????????????????????????????????????????????????????????????????
?           ONEX Full API Integration Test Suite               ?
?                                                              ?
?  Testing complete user journeys with real API calls          ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Magenta

# ============================================
# PHASE 1: REGISTRATION & AUTHENTICATION
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 1: REGISTRATION & AUTHENTICATION" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 1. Health Check
Test-Step "Health Check" {
    Invoke-Api -Method "GET" -Endpoint "/health"
}

# 2. Register New User
$registerResult = Test-Step "Register New User ($testEmail)" {
    Invoke-Api -Method "POST" -Endpoint "/users/register" -Body @{
        email = $testEmail
        firstName = "Test"
        lastName = "User"
        password = $testPassword
    }
}

if ($registerResult.Success -and $registerResult.Data) {
    $global:testUserId = $registerResult.Data
    Write-Host "  ?? User ID: $($global:testUserId)" -ForegroundColor Gray
}

# 3. Login with New User
$loginResult = Test-Step "Login with New User" {
    Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = $testEmail
        password = $testPassword
    }
}

if ($loginResult.Success -and $loginResult.Data) {
    $global:accessToken = $loginResult.Data.accessToken
    $global:refreshToken = $loginResult.Data.refreshToken
    Write-Host "  ?? Access Token: $($global:accessToken.Substring(0, 50))..." -ForegroundColor Gray
}

# 4. Login with Wrong Password
Test-Step "Login with Wrong Password (should fail)" {
    $result = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = $testEmail
        password = "WrongPassword123!"
    }
    # Expecting failure (400)
    if ($result.StatusCode -eq 400) {
        return @{ Success = $true; StatusCode = 400 }
    }
    return $result
}

# 5. Refresh Token
$refreshResult = Test-Step "Refresh Token" {
    Invoke-Api -Method "POST" -Endpoint "/users/refresh" -Body @{
        refreshToken = $global:refreshToken
    }
}

if ($refreshResult.Success -and $refreshResult.Data) {
    $global:accessToken = $refreshResult.Data.accessToken
    $global:refreshToken = $refreshResult.Data.refreshToken
    Write-Host "  ?? Token refreshed successfully" -ForegroundColor Gray
}

# ============================================
# PHASE 2: USER OPERATIONS
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 2: USER OPERATIONS" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 6. Get Current User
$currentUser = Test-Step "Get Current User (me)" {
    Invoke-Api -Method "GET" -Endpoint "/users/me" -UseAuth $true
}

if ($currentUser.Success -and $currentUser.Data) {
    Write-Host "  ?? User: $($currentUser.Data.firstName) $($currentUser.Data.lastName)" -ForegroundColor Gray
}

# 7. Update Current User
Test-Step "Update Current User" {
    Invoke-Api -Method "PUT" -Endpoint "/users/me" -UseAuth $true -Body @{
        firstName = "Updated"
        lastName = "TestUser"
    }
}

# 8. Get Current User Profile
Test-Step "Get Current User Profile" {
    Invoke-Api -Method "GET" -Endpoint "/users/me/profile" -UseAuth $true
}

# 9. Update Current User Profile
Test-Step "Update Current User Profile" {
    Invoke-Api -Method "PUT" -Endpoint "/users/me/profile" -UseAuth $true -Body @{
        bio = "This is a test bio"
        phone = "+1234567890"
        department = "Engineering"
    }
}

# 10. Get All Users
$usersResult = Test-Step "Get All Users (paginated)" {
    Invoke-Api -Method "GET" -Endpoint "/users" -UseAuth $true
}

if ($usersResult.Success -and $usersResult.Data) {
    Write-Host "  ?? Total Users: $($usersResult.Data.totalCount)" -ForegroundColor Gray
}

# 11. Get User Sessions
Test-Step "Get Current User Sessions" {
    Invoke-Api -Method "GET" -Endpoint "/users/me/sessions" -UseAuth $true
}

# ============================================
# PHASE 3: ROLE & PERMISSION OPERATIONS
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 3: ROLE & PERMISSION OPERATIONS" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# Login as Admin for role operations
$adminLogin = Test-Step "Login as Admin" {
    Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = "admin@onex.com"
        password = "Admin@123!"
    }
}

if ($adminLogin.Success -and $adminLogin.Data) {
    $global:accessToken = $adminLogin.Data.accessToken
}

# 12. Get All Roles
$rolesResult = Test-Step "Get All Roles" {
    Invoke-Api -Method "GET" -Endpoint "/roles" -UseAuth $true
}

if ($rolesResult.Success -and $rolesResult.Data) {
    Write-Host "  ?? Total Roles: $($rolesResult.Data.totalCount)" -ForegroundColor Gray
}

# 13. Create New Role
$createRoleResult = Test-Step "Create New Role" {
    Invoke-Api -Method "POST" -Endpoint "/roles" -UseAuth $true -Body @{
        name = "TestRole_$(Get-Random)"
        description = "Test role for integration testing"
        canViewSensitiveData = $false
    }
}

if ($createRoleResult.Success -and $createRoleResult.Data) {
    $global:testRoleId = $createRoleResult.Data.id
    Write-Host "  ?? Role ID: $($global:testRoleId)" -ForegroundColor Gray
}

# 14. Get Role by ID
if ($global:testRoleId) {
    Test-Step "Get Role by ID" {
        Invoke-Api -Method "GET" -Endpoint "/roles/$($global:testRoleId)" -UseAuth $true
    }
}

# 15. Update Role
if ($global:testRoleId) {
    Test-Step "Update Role" {
        Invoke-Api -Method "PUT" -Endpoint "/roles/$($global:testRoleId)" -UseAuth $true -Body @{
            name = "UpdatedTestRole_$(Get-Random)"
            description = "Updated description"
            canViewSensitiveData = $true
        }
    }
}

# 16. Get All Permissions
$permissionsResult = Test-Step "Get All Permissions" {
    Invoke-Api -Method "GET" -Endpoint "/permissions" -UseAuth $true
}

if ($permissionsResult.Success -and $permissionsResult.Data) {
    Write-Host "  ?? Total Permissions: $($permissionsResult.Data.Count)" -ForegroundColor Gray
}

# 17. Delete Test Role
if ($global:testRoleId) {
    Test-Step "Delete Test Role" {
        Invoke-Api -Method "DELETE" -Endpoint "/roles/$($global:testRoleId)" -UseAuth $true
    }
}

# ============================================
# PHASE 4: ACCOUNT OPERATIONS
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 4: ACCOUNT OPERATIONS" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 18. Get All Accounts
$accountsResult = Test-Step "Get All Accounts" {
    Invoke-Api -Method "GET" -Endpoint "/accounts" -UseAuth $true
}

if ($accountsResult.Success -and $accountsResult.Data) {
    Write-Host "  ?? Total Accounts: $($accountsResult.Data.totalCount)" -ForegroundColor Gray
}

# 19. Create New Account
$createAccountResult = Test-Step "Create New Account" {
    Invoke-Api -Method "POST" -Endpoint "/accounts" -UseAuth $true -Body @{
        name = "Test Company $(Get-Random)"
        industry = "Technology"
        website = "https://testcompany.com"
        phone = "+1234567890"
        email = "contact@testcompany.com"
    }
}

if ($createAccountResult.Success -and $createAccountResult.Data) {
    $global:testAccountId = $createAccountResult.Data.id
    Write-Host "  ?? Account ID: $($global:testAccountId)" -ForegroundColor Gray
}

# 20. Get Account by ID
if ($global:testAccountId) {
    Test-Step "Get Account by ID" {
        Invoke-Api -Method "GET" -Endpoint "/accounts/$($global:testAccountId)" -UseAuth $true
    }
}

# 21. Update Account
if ($global:testAccountId) {
    Test-Step "Update Account" {
        Invoke-Api -Method "PUT" -Endpoint "/accounts/$($global:testAccountId)" -UseAuth $true -Body @{
            name = "Updated Test Company"
            industry = "Finance"
            website = "https://updated-testcompany.com"
        }
    }
}

# 22. Add Contact to Account
if ($global:testAccountId) {
    Test-Step "Add Contact to Account" {
        Invoke-Api -Method "POST" -Endpoint "/accounts/$($global:testAccountId)/contacts" -UseAuth $true -Body @{
            firstName = "John"
            lastName = "Doe"
            email = "john.doe@testcompany.com"
            phone = "+1987654321"
            title = "CEO"
            isPrimary = $true
        }
    }
}

# 23. Get Account Contacts
if ($global:testAccountId) {
    Test-Step "Get Account Contacts" {
        Invoke-Api -Method "GET" -Endpoint "/accounts/$($global:testAccountId)/contacts" -UseAuth $true
    }
}

# 24. Delete Test Account
if ($global:testAccountId) {
    Test-Step "Delete Test Account" {
        Invoke-Api -Method "DELETE" -Endpoint "/accounts/$($global:testAccountId)" -UseAuth $true
    }
}

# ============================================
# PHASE 5: AUDIT LOGS
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 5: AUDIT LOGS" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 25. Get All Audit Logs
$auditLogsResult = Test-Step "Get All Audit Logs" {
    Invoke-Api -Method "GET" -Endpoint "/audit-logs" -UseAuth $true
}

if ($auditLogsResult.Success -and $auditLogsResult.Data) {
    Write-Host "  ?? Total Audit Logs: $($auditLogsResult.Data.totalCount)" -ForegroundColor Gray
}

# 26. Get Current User Audit Logs
Test-Step "Get Current User Audit Logs" {
    Invoke-Api -Method "GET" -Endpoint "/audit-logs/my" -UseAuth $true
}

# ============================================
# PHASE 6: PASSWORD MANAGEMENT
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 6: PASSWORD MANAGEMENT" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 27. Forgot Password (should always return success)
Test-Step "Forgot Password Request" {
    Invoke-Api -Method "POST" -Endpoint "/users/forgot-password" -Body @{
        email = $testEmail
    }
}

# 28. Change Password (for test user)
# First login as test user
$testUserLogin = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

if ($testUserLogin.Success) {
    $global:accessToken = $testUserLogin.Data.accessToken
    
    Test-Step "Change Password" {
        Invoke-Api -Method "POST" -Endpoint "/users/change-password" -UseAuth $true -Body @{
            currentPassword = $testPassword
            newPassword = "NewTestPass@456!"
        }
    }
}

# ============================================
# PHASE 7: SECURITY FEATURES
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 7: SECURITY FEATURES" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# 29. Rate Limiting Test
Write-Host "`n? Testing Rate Limiting" -ForegroundColor Cyan
$rateLimitHit = $false
for ($i = 1; $i -le 7; $i++) {
    $result = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
        email = "ratelimit@test.com"
        password = "test"
    }
    if ($result.StatusCode -eq 429) {
        Write-Host "  ? Rate limit triggered at request $i (429 Too Many Requests)" -ForegroundColor Green
        $rateLimitHit = $true
        break
    }
}
if (-not $rateLimitHit) {
    Write-Host "  ?? Rate limit not triggered after 7 requests" -ForegroundColor Yellow
}

# 30. Unauthorized Access Test
Test-Step "Unauthorized Access (should fail with 401)" {
    $result = Invoke-Api -Method "GET" -Endpoint "/users" -UseAuth $false
    if ($result.StatusCode -eq 401) {
        return @{ Success = $true; StatusCode = 401 }
    }
    return @{ Success = $false; StatusCode = $result.StatusCode }
}

# ============================================
# PHASE 8: CLEANUP & LOGOUT
# ============================================
Write-Host "`n???????????????????????????????????????" -ForegroundColor Yellow
Write-Host "  PHASE 8: CLEANUP & LOGOUT" -ForegroundColor Yellow
Write-Host "???????????????????????????????????????" -ForegroundColor Yellow

# Login with new password
$finalLogin = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = "NewTestPass@456!"
}

if ($finalLogin.Success) {
    $global:accessToken = $finalLogin.Data.accessToken
    
    # 31. Logout
    Test-Step "Logout" {
        Invoke-Api -Method "POST" -Endpoint "/users/logout" -UseAuth $true
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host @"

????????????????????????????????????????????????????????????????
?                    TEST SUMMARY                              ?
????????????????????????????????????????????????????????????????
?  Test User Email: $testEmail
?  Test User ID:    $($global:testUserId)
?                                                              ?
?  All integration tests completed!                            ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Magenta
