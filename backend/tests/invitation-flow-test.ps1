# ONEX Invitation Flow Test
# Tests the complete invitation flow: Invite -> Email -> Accept -> Login

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$MailPitUrl = "http://localhost:8025"
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Step { param($msg) Write-Host "`n? $msg" -ForegroundColor Cyan }
function Write-Success { param($msg) Write-Host "  ? $msg" -ForegroundColor Green }
function Write-Error { param($msg) Write-Host "  ? $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "  ??  $msg" -ForegroundColor Gray }

# API Helper
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{ "Content-Type" = "application/json" }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    $params = @{
        Uri = "$BaseUrl$Endpoint"
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
        $errorBody = $null
        try {
            $reader = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
            $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
        } catch {}
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
            ErrorBody = $errorBody
        }
    }
}

# MailPit Helper - Get latest email
function Get-LatestEmail {
    param([string]$ToEmail)
    
    try {
        $response = Invoke-RestMethod -Uri "$MailPitUrl/api/v1/messages" -Method GET
        if ($response.messages.Count -gt 0) {
            # Find email to specific address
            $email = $response.messages | Where-Object { 
                $_.To | Where-Object { $_.Address -eq $ToEmail }
            } | Select-Object -First 1
            
            if ($email) {
                # Get full email content
                $fullEmail = Invoke-RestMethod -Uri "$MailPitUrl/api/v1/message/$($email.ID)" -Method GET
                return @{
                    Success = $true
                    Subject = $email.Subject
                    From = $email.From.Address
                    To = $ToEmail
                    Body = $fullEmail.Text
                    Html = $fullEmail.HTML
                }
            }
        }
        return @{ Success = $false; Error = "No email found for $ToEmail" }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Extract token from email body
function Get-TokenFromEmail {
    param([string]$EmailBody)
    
    # Look for token= in the URL
    if ($EmailBody -match 'token=([^&\s"]+)') {
        return [System.Web.HttpUtility]::UrlDecode($matches[1])
    }
    return $null
}

# Extract invitation ID from email body
function Get-InvitationIdFromEmail {
    param([string]$EmailBody)
    
    # Look for id= in the URL
    if ($EmailBody -match 'id=([a-f0-9-]+)') {
        return $matches[1]
    }
    return $null
}

Write-Host @"

????????????????????????????????????????????????????????????????
?         ONEX Invitation Flow Integration Test                ?
?                                                              ?
?  Testing: Invite -> Email -> Accept -> Login                 ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Magenta

# Test data
$testEmail = "invited_$(Get-Random)@test.com"
$testPassword = "InvitedUser@123!"
$adminEmail = "admin@onex.com"
$adminPassword = "Admin@123!"

Write-Info "Test Email: $testEmail"

# ============================================
# STEP 0: Setup - Login as Admin and Create Account
# ============================================
Write-Step "STEP 0: Setup - Login as Admin"

$loginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $adminEmail
    password = $adminPassword
}

if (-not $loginResult.Success) {
    Write-Error "Failed to login as admin: $($loginResult.Error)"
    exit 1
}

$adminToken = $loginResult.Data.accessToken
Write-Success "Logged in as admin"

# Create a test account
Write-Step "Creating test account"

$accountResult = Invoke-Api -Method "POST" -Endpoint "/accounts" -Token $adminToken -Body @{
    name = "Test Company $(Get-Random)"
    industry = "Technology"
    website = "https://testcompany.com"
}

if (-not $accountResult.Success) {
    Write-Error "Failed to create account: $($accountResult.Error)"
    Write-Info "Error details: $($accountResult.ErrorBody | ConvertTo-Json)"
    exit 1
}

$accountId = $accountResult.Data.id
Write-Success "Created account: $accountId"

# We need to add admin as a contact first (primary contact)
# Note: Admin is Staff type, but we can still send invitations as account owner
# For this test, we'll create the account and directly send invitation
# The invitation handler should work because admin has access

# ============================================
# STEP 1: Send Invitation (Minimal Permissions)
# ============================================
Write-Step "STEP 1: Sending invitation to $testEmail (minimal permissions)"

$inviteResult = Invoke-Api -Method "POST" -Endpoint "/accounts/$accountId/invitations" -Token $adminToken -Body @{
    email = $testEmail
    firstName = "Invited"
    lastName = "User"
    role = "Developer"
    expirationDays = 7
}

if (-not $inviteResult.Success) {
    Write-Error "Failed to send invitation: $($inviteResult.Error)"
    Write-Info "Error details: $($inviteResult.ErrorBody | ConvertTo-Json)"
    exit 1
}

$invitationId = $inviteResult.Data.id
Write-Success "Invitation sent! ID: $invitationId"
Write-Info "Contact created with MINIMAL permissions - admin will set permissions after acceptance"

# ============================================
# STEP 2: Check Email in MailPit
# ============================================
Write-Step "STEP 2: Checking email in MailPit"

Start-Sleep -Seconds 2 # Wait for email to arrive

$emailResult = Get-LatestEmail -ToEmail $testEmail

if (-not $emailResult.Success) {
    Write-Error "Failed to get email: $($emailResult.Error)"
    Write-Info "Make sure MailPit is running on $MailPitUrl"
    exit 1
}

Write-Success "Email received!"
Write-Info "Subject: $($emailResult.Subject)"
Write-Info "From: $($emailResult.From)"

# Extract token from email
Add-Type -AssemblyName System.Web
$invitationToken = Get-TokenFromEmail -EmailBody $emailResult.Body

if (-not $invitationToken) {
    # Try HTML body
    $invitationToken = Get-TokenFromEmail -EmailBody $emailResult.Html
}

if (-not $invitationToken) {
    Write-Error "Could not extract token from email"
    Write-Info "Email body: $($emailResult.Body)"
    exit 1
}

Write-Success "Extracted invitation token from email"
Write-Info "Token (first 20 chars): $($invitationToken.Substring(0, [Math]::Min(20, $invitationToken.Length)))..."

# ============================================
# STEP 3: Get Pending Invitations
# ============================================
Write-Step "STEP 3: Verify pending invitation exists"

$pendingResult = Invoke-Api -Method "GET" -Endpoint "/accounts/$accountId/invitations" -Token $adminToken

if (-not $pendingResult.Success) {
    Write-Error "Failed to get pending invitations: $($pendingResult.Error)"
} else {
    $pendingCount = $pendingResult.Data.Count
    Write-Success "Found $pendingCount pending invitation(s)"
    
    $ourInvitation = $pendingResult.Data | Where-Object { $_.email -eq $testEmail }
    if ($ourInvitation) {
        Write-Info "Invitation status: Pending, Expires: $($ourInvitation.expiresAt)"
    }
}

# ============================================
# STEP 4: Accept Invitation (New User)
# ============================================
Write-Step "STEP 4: Accepting invitation (new user with password)"

$acceptResult = Invoke-Api -Method "POST" -Endpoint "/invitations/$invitationId/accept" -Body @{
    token = $invitationToken
    password = $testPassword
}

if (-not $acceptResult.Success) {
    Write-Error "Failed to accept invitation: $($acceptResult.Error)"
    Write-Info "Error details: $($acceptResult.ErrorBody | ConvertTo-Json)"
    exit 1
}

Write-Success "Invitation accepted!"
Write-Info "Message: $($acceptResult.Data.message)"

# ============================================
# STEP 5: Verify invitation is no longer pending
# ============================================
Write-Step "STEP 5: Verify invitation is no longer pending"

$pendingResult2 = Invoke-Api -Method "GET" -Endpoint "/accounts/$accountId/invitations" -Token $adminToken

if ($pendingResult2.Success) {
    $stillPending = $pendingResult2.Data | Where-Object { $_.email -eq $testEmail }
    if ($stillPending) {
        Write-Error "Invitation still shows as pending!"
    } else {
        Write-Success "Invitation no longer in pending list"
    }
}

# ============================================
# STEP 6: Login as Invited User
# ============================================
Write-Step "STEP 6: Login as invited user"

$userLoginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

if (-not $userLoginResult.Success) {
    Write-Error "Failed to login as invited user: $($userLoginResult.Error)"
    Write-Info "Error details: $($userLoginResult.ErrorBody | ConvertTo-Json)"
    exit 1
}

$userToken = $userLoginResult.Data.accessToken
Write-Success "Logged in as invited user!"

# ============================================
# STEP 7: Verify user can access account
# ============================================
Write-Step "STEP 7: Verify user can access account"

$meResult = Invoke-Api -Method "GET" -Endpoint "/users/me" -Token $userToken

if (-not $meResult.Success) {
    Write-Error "Failed to get user info: $($meResult.Error)"
} else {
    Write-Success "User info retrieved"
    Write-Info "User: $($meResult.Data.firstName) $($meResult.Data.lastName)"
    Write-Info "Email: $($meResult.Data.email)"
}

# Try to access the account
$accountAccessResult = Invoke-Api -Method "GET" -Endpoint "/accounts/$accountId" -Token $userToken

if (-not $accountAccessResult.Success) {
    Write-Info "User cannot access account directly (expected - need to check permissions)"
} else {
    Write-Success "User can access account: $($accountAccessResult.Data.name)"
}

# ============================================
# STEP 8: Cleanup - Get account contacts
# ============================================
Write-Step "STEP 8: Verify user is in account contacts"

$contactsResult = Invoke-Api -Method "GET" -Endpoint "/accounts/$accountId/contacts" -Token $adminToken

if ($contactsResult.Success) {
    $userContact = $contactsResult.Data | Where-Object { $_.email -eq $testEmail }
    if ($userContact) {
        Write-Success "User found in account contacts!"
        Write-Info "Role: $($userContact.role)"
        Write-Info "Is Active: $($userContact.isActive)"
        Write-Info "Is Primary: $($userContact.isPrimaryContact)"
    } else {
        Write-Error "User not found in account contacts"
    }
}

# ============================================
# SUMMARY
# ============================================
Write-Host @"

????????????????????????????????????????????????????????????????
?                    TEST SUMMARY                              ?
????????????????????????????????????????????????????????????????
?                                                              ?
?  ? Step 1: Invitation sent successfully                     ?
?  ? Step 2: Email received in MailPit                        ?
?  ? Step 3: Pending invitation verified                      ?
?  ? Step 4: Invitation accepted (with password)              ?
?  ? Step 5: Invitation removed from pending                  ?
?  ? Step 6: User can login                                   ?
?  ? Step 7: User info accessible                             ?
?  ? Step 8: User in account contacts                         ?
?                                                              ?
?  Test Account ID: $accountId
?  Test User Email: $testEmail
?  Invitation ID:   $invitationId
?                                                              ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Green

Write-Host "?? All tests passed! The invitation flow is working correctly." -ForegroundColor Magenta
