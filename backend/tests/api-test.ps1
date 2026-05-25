# ONEX API Testing Script
# This script tests all API endpoints

$baseUrl = "http://localhost:5000"
$global:accessToken = ""
$global:refreshToken = ""
$global:testResults = @()

function Write-TestResult {
    param(
        [string]$TestName,
        [bool]$Success,
        [string]$Message = "",
        [int]$StatusCode = 0
    )
    
    $status = if ($Success) { "? PASS" } else { "? FAIL" }
    $color = if ($Success) { "Green" } else { "Red" }
    
    Write-Host "$status - $TestName" -ForegroundColor $color
    if ($Message) { Write-Host "   $Message" -ForegroundColor Gray }
    
    $global:testResults += [PSCustomObject]@{
        Test = $TestName
        Status = if ($Success) { "PASS" } else { "FAIL" }
        StatusCode = $StatusCode
        Message = $Message
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [bool]$UseAuth = $false,
        [int[]]$ExpectedStatus = @(200, 201, 204)
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($UseAuth -and $global:accessToken) {
        $headers["Authorization"] = "Bearer $($global:accessToken)"
    }
    
    $params = @{
        Uri = "$baseUrl$Endpoint"
        Method = $Method
        Headers = $headers
        UseBasicParsing = $true
        ErrorAction = "Stop"
    }
    
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json -Depth 10)
    }
    
    try {
        $response = Invoke-WebRequest @params
        return @{
            Success = $ExpectedStatus -contains $response.StatusCode
            StatusCode = $response.StatusCode
            Content = if ($response.Content) { $response.Content | ConvertFrom-Json } else { $null }
            Error = $null
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return @{
            Success = $ExpectedStatus -contains $statusCode
            StatusCode = $statusCode
            Content = $null
            Error = $_.Exception.Message
        }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "       ONEX API Testing Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# ============================================
# 1. HEALTH CHECK
# ============================================
Write-Host "`n--- HEALTH CHECK ---" -ForegroundColor Yellow

$result = Invoke-ApiRequest -Method "GET" -Endpoint "/health"
Write-TestResult -TestName "Health Check" -Success $result.Success -StatusCode $result.StatusCode

# ============================================
# 2. AUTHENTICATION
# ============================================
Write-Host "`n--- AUTHENTICATION ---" -ForegroundColor Yellow

# Login as Admin
$loginBody = @{
    email = "admin@onex.com"
    password = "Admin@123!"
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/users/login" -Body $loginBody
if ($result.Success -and $result.Content) {
    $global:accessToken = $result.Content.accessToken
    $global:refreshToken = $result.Content.refreshToken
    Write-TestResult -TestName "Login (Admin)" -Success $true -StatusCode $result.StatusCode -Message "Token received"
} else {
    Write-TestResult -TestName "Login (Admin)" -Success $false -StatusCode $result.StatusCode -Message $result.Error
}

# Login with wrong password
$wrongLoginBody = @{
    email = "admin@onex.com"
    password = "WrongPassword123!"
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/users/login" -Body $wrongLoginBody -ExpectedStatus @(400, 401)
Write-TestResult -TestName "Login (Wrong Password)" -Success $result.Success -StatusCode $result.StatusCode -Message "Should return 400/401"

# Refresh Token
if ($global:refreshToken) {
    $refreshBody = @{ refreshToken = $global:refreshToken }
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/users/refresh" -Body $refreshBody
    if ($result.Success -and $result.Content) {
        $global:accessToken = $result.Content.accessToken
        $global:refreshToken = $result.Content.refreshToken
        Write-TestResult -TestName "Refresh Token" -Success $true -StatusCode $result.StatusCode -Message "New token received"
    } else {
        Write-TestResult -TestName "Refresh Token" -Success $false -StatusCode $result.StatusCode
    }
}

# ============================================
# 3. USER ENDPOINTS
# ============================================
Write-Host "`n--- USER ENDPOINTS ---" -ForegroundColor Yellow

# Get Current User
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/me" -UseAuth $true
Write-TestResult -TestName "Get Current User" -Success $result.Success -StatusCode $result.StatusCode

# Get Users (Paginated)
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users" -UseAuth $true
$itemsCount = if ($result.Content.Items) { $result.Content.Items.Count } elseif ($result.Content.items) { $result.Content.items.Count } else { 0 }
$totalCount = if ($result.Content.TotalCount) { $result.Content.TotalCount } elseif ($result.Content.totalCount) { $result.Content.totalCount } else { 0 }
Write-TestResult -TestName "Get Users (Paginated)" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $itemsCount, Total: $totalCount"

# Get User by ID
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/11111111-1111-1111-1111-111111111111" -UseAuth $true
Write-TestResult -TestName "Get User by ID" -Success $result.Success -StatusCode $result.StatusCode

# Update Current User
$updateBody = @{
    firstName = "Admin"
    lastName = "User Updated"
}
$result = Invoke-ApiRequest -Method "PUT" -Endpoint "/users/me" -Body $updateBody -UseAuth $true
Write-TestResult -TestName "Update Current User" -Success $result.Success -StatusCode $result.StatusCode

# Get Current User Profile
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/me/profile" -UseAuth $true
Write-TestResult -TestName "Get Current User Profile" -Success $result.Success -StatusCode $result.StatusCode

# Get User Sessions
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/me/sessions" -UseAuth $true
Write-TestResult -TestName "Get Current User Sessions" -Success $result.Success -StatusCode $result.StatusCode

# Get User Roles
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/11111111-1111-1111-1111-111111111111/roles" -UseAuth $true
Write-TestResult -TestName "Get User Roles" -Success $result.Success -StatusCode $result.StatusCode

# ============================================
# 4. ROLE ENDPOINTS
# ============================================
Write-Host "`n--- ROLE ENDPOINTS ---" -ForegroundColor Yellow

# Get Roles (Paginated)
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/roles" -UseAuth $true
Write-TestResult -TestName "Get Roles (Paginated)" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $($result.Content.items.Count), Total: $($result.Content.totalCount)"

# Get Role by ID
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/roles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" -UseAuth $true
Write-TestResult -TestName "Get Role by ID (Administrator)" -Success $result.Success -StatusCode $result.StatusCode

# Create Role
$createRoleBody = @{
    name = "Test Role $(Get-Random)"
    description = "Test role created by API test"
    canViewSensitiveData = $false
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/roles" -Body $createRoleBody -UseAuth $true -ExpectedStatus @(200, 201)
$testRoleId = $null
if ($result.Success -and $result.Content.id) {
    $testRoleId = $result.Content.id
    Write-TestResult -TestName "Create Role" -Success $true -StatusCode $result.StatusCode -Message "Role ID: $testRoleId"
} else {
    Write-TestResult -TestName "Create Role" -Success $false -StatusCode $result.StatusCode -Message $result.Error
}

# Get Role Permissions
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/roles/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/permissions" -UseAuth $true
Write-TestResult -TestName "Get Role Permissions" -Success $result.Success -StatusCode $result.StatusCode -Message "Permissions count: $($result.Content.Count)"

# Delete Test Role (if created)
if ($testRoleId) {
    $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/roles/$testRoleId" -UseAuth $true -ExpectedStatus @(200, 204)
    Write-TestResult -TestName "Delete Role" -Success $result.Success -StatusCode $result.StatusCode
}

# ============================================
# 5. PERMISSION ENDPOINTS
# ============================================
Write-Host "`n--- PERMISSION ENDPOINTS ---" -ForegroundColor Yellow

# Get All Permissions
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/permissions" -UseAuth $true
Write-TestResult -TestName "Get All Permissions" -Success $result.Success -StatusCode $result.StatusCode -Message "Permissions: $($result.Content.Count)"

# ============================================
# 6. ACCOUNT ENDPOINTS
# ============================================
Write-Host "`n--- ACCOUNT ENDPOINTS ---" -ForegroundColor Yellow

# Get Accounts (Paginated)
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/accounts" -UseAuth $true
Write-TestResult -TestName "Get Accounts (Paginated)" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $($result.Content.items.Count), Total: $($result.Content.totalCount)"

# Get Account by ID
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/accounts/dddddddd-dddd-dddd-dddd-dddddddddddd" -UseAuth $true
Write-TestResult -TestName "Get Account by ID" -Success $result.Success -StatusCode $result.StatusCode

# Create Account
$createAccountBody = @{
    name = "Test Company $(Get-Random)"
    email = "test$(Get-Random)@company.com"
    phone = "+1234567890"
    industry = "Technology"
}
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/accounts" -Body $createAccountBody -UseAuth $true -ExpectedStatus @(200, 201)
$testAccountId = $null
if ($result.Success -and $result.Content.id) {
    $testAccountId = $result.Content.id
    Write-TestResult -TestName "Create Account" -Success $true -StatusCode $result.StatusCode -Message "Account ID: $testAccountId"
} else {
    Write-TestResult -TestName "Create Account" -Success $false -StatusCode $result.StatusCode -Message $result.Error
}

# Get Account Contacts
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/accounts/dddddddd-dddd-dddd-dddd-dddddddddddd/contacts" -UseAuth $true
Write-TestResult -TestName "Get Account Contacts" -Success $result.Success -StatusCode $result.StatusCode

# Delete Test Account (if created)
if ($testAccountId) {
    $result = Invoke-ApiRequest -Method "DELETE" -Endpoint "/accounts/$testAccountId" -UseAuth $true -ExpectedStatus @(200, 204)
    Write-TestResult -TestName "Delete Account" -Success $result.Success -StatusCode $result.StatusCode
}

# ============================================
# 7. AUDIT LOG ENDPOINTS
# ============================================
Write-Host "`n--- AUDIT LOG ENDPOINTS ---" -ForegroundColor Yellow

# Get Audit Logs (Paginated)
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/audit-logs" -UseAuth $true
Write-TestResult -TestName "Get Audit Logs (Paginated)" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $($result.Content.items.Count), Total: $($result.Content.totalCount)"

# Get Current User Audit Logs
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/audit-logs/my" -UseAuth $true
Write-TestResult -TestName "Get Current User Audit Logs" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $($result.Content.items.Count), Total: $($result.Content.totalCount)"

# Get User Audit Logs
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users/11111111-1111-1111-1111-111111111111/audit-logs" -UseAuth $true
Write-TestResult -TestName "Get User Audit Logs" -Success $result.Success -StatusCode $result.StatusCode -Message "Items: $($result.Content.items.Count), Total: $($result.Content.totalCount)"

# ============================================
# 8. PASSWORD MANAGEMENT (Non-destructive)
# ============================================
Write-Host "`n--- PASSWORD MANAGEMENT ---" -ForegroundColor Yellow

# Forgot Password (always returns success for security)
$forgotBody = @{ email = "nonexistent@test.com" }
$result = Invoke-ApiRequest -Method "POST" -Endpoint "/users/forgot-password" -Body $forgotBody
Write-TestResult -TestName "Forgot Password" -Success $result.Success -StatusCode $result.StatusCode -Message "Should always return success"

# ============================================
# 9. RATE LIMITING TEST
# ============================================
Write-Host "`n--- RATE LIMITING ---" -ForegroundColor Yellow

$rateLimitHit = $false
$loginBody = @{ email = "test@test.com"; password = "test" }
for ($i = 1; $i -le 7; $i++) {
    $result = Invoke-ApiRequest -Method "POST" -Endpoint "/users/login" -Body $loginBody -ExpectedStatus @(400, 401, 429, 500)
    if ($result.StatusCode -eq 429) {
        $rateLimitHit = $true
        break
    }
}
Write-TestResult -TestName "Rate Limiting" -Success $rateLimitHit -Message "Rate limit triggered at request $i"

# ============================================
# 10. UNAUTHORIZED ACCESS TEST
# ============================================
Write-Host "`n--- AUTHORIZATION ---" -ForegroundColor Yellow

# Access without token
$result = Invoke-ApiRequest -Method "GET" -Endpoint "/users" -UseAuth $false -ExpectedStatus @(401)
Write-TestResult -TestName "Access Without Token" -Success $result.Success -StatusCode $result.StatusCode -Message "Should return 401"

# ============================================
# SUMMARY
# ============================================
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "           TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$passed = ($global:testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($global:testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$total = $global:testResults.Count

Write-Host "`nTotal Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "Success Rate: $([math]::Round(($passed / $total) * 100, 1))%" -ForegroundColor $(if ($failed -gt 0) { "Yellow" } else { "Green" })

if ($failed -gt 0) {
    Write-Host "`nFailed Tests:" -ForegroundColor Red
    $global:testResults | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "  - $($_.Test): $($_.Message)" -ForegroundColor Red
    }
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
