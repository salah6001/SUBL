# ONEX 2FA (Two-Factor Authentication) Complete Flow Test
# Tests the entire 2FA lifecycle: Enable -> Verify -> Login with 2FA -> Disable

param(
    [string]$BaseUrl = "http://localhost:5000"
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Section { param($msg) Write-Host "`n???????????????????????????????????????????????????????????????" -ForegroundColor Magenta; Write-Host "  $msg" -ForegroundColor Magenta; Write-Host "???????????????????????????????????????????????????????????????" -ForegroundColor Magenta }
function Write-Step { param($msg) Write-Host "`n? $msg" -ForegroundColor Cyan }
function Write-Pass { param($msg) Write-Host "  ? $msg" -ForegroundColor Green }
function Write-Fail { param($msg) Write-Host "  ? $msg" -ForegroundColor Red }
function Write-Info { param($msg) Write-Host "  ??  $msg" -ForegroundColor Gray }
function Write-Warning { param($msg) Write-Host "  ??  $msg" -ForegroundColor Yellow }

# API Helper
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = $null
    )
    
    $headers = @{}
    if ($Token) { $headers["Authorization"] = "Bearer $Token" }
    
    $params = @{
        Uri = "$BaseUrl$Endpoint"
        Method = $Method
        ContentType = "application/json"
    }
    
    if ($headers.Count -gt 0) { $params["Headers"] = $headers }
    if ($Body) { $params["Body"] = ($Body | ConvertTo-Json -Depth 10) }
    
    try {
        $response = Invoke-RestMethod @params -ErrorAction Stop
        return @{
            Success = $true
            StatusCode = 200
            Data = $response
        }
    }
    catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
        }
    }
}

# TOTP Code Generator (Pure PowerShell implementation)
function Get-TOTPCode {
    param(
        [string]$Secret
    )
    
    # Base32 decode
    $base32Chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"
    $secret = $Secret.ToUpper().Replace(" ", "").TrimEnd("=")
    
    $bits = ""
    foreach ($char in $secret.ToCharArray()) {
        $index = $base32Chars.IndexOf($char)
        if ($index -lt 0) { continue }
        $bits += [Convert]::ToString($index, 2).PadLeft(5, '0')
    }
    
    # Convert bits to bytes
    $keyBytes = New-Object byte[] ([Math]::Floor($bits.Length / 8))
    for ($i = 0; $i -lt $keyBytes.Length; $i++) {
        $keyBytes[$i] = [Convert]::ToByte($bits.Substring($i * 8, 8), 2)
    }
    
    # Get time counter (30-second intervals since Unix epoch)
    $epoch = [DateTime]::new(1970, 1, 1, 0, 0, 0, [DateTimeKind]::Utc)
    $timeCounter = [Math]::Floor(([DateTime]::UtcNow - $epoch).TotalSeconds / 30)
    
    # Convert counter to 8-byte big-endian
    $counterBytes = [BitConverter]::GetBytes([long]$timeCounter)
    if ([BitConverter]::IsLittleEndian) {
        [Array]::Reverse($counterBytes)
    }
    
    # HMAC-SHA1
    $hmac = New-Object System.Security.Cryptography.HMACSHA1
    $hmac.Key = $keyBytes
    $hash = $hmac.ComputeHash($counterBytes)
    
    # Dynamic truncation
    $offset = $hash[$hash.Length - 1] -band 0x0F
    $binaryCode = (($hash[$offset] -band 0x7F) -shl 24) -bor
                  (($hash[$offset + 1] -band 0xFF) -shl 16) -bor
                  (($hash[$offset + 2] -band 0xFF) -shl 8) -bor
                  ($hash[$offset + 3] -band 0xFF)
    
    # Get 6-digit code
    $code = ($binaryCode % 1000000).ToString("000000")
    
    return $code
}

Write-Host @"

????????????????????????????????????????????????????????????????
?         ONEX 2FA (Two-Factor Authentication) Test            ?
?                                                              ?
?  Flow: Enable -> Verify -> Login with 2FA -> Disable         ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Magenta

# ============================================
# SETUP
# ============================================
Write-Section "SETUP"

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testEmail = "2fa_test_$timestamp@example.com"
$testPassword = "Test2FA@123!"

Write-Info "Test Email: $testEmail"
Write-Info "Test Password: $testPassword"

# ============================================
# STEP 1: Register a new user
# ============================================
Write-Step "STEP 1: Register a new user"

$registerResult = Invoke-Api -Method "POST" -Endpoint "/users/register" -Body @{
    email = $testEmail
    password = $testPassword
    firstName = "2FA"
    lastName = "Test"
}

if (-not $registerResult.Success) {
    Write-Fail "Failed to register user: $($registerResult.Error)"
    exit 1
}

$testUserId = $registerResult.Data.id
Write-Pass "User registered: $testUserId"

# ============================================
# STEP 2: Login (without 2FA)
# ============================================
Write-Step "STEP 2: Login (without 2FA - should succeed)"

$loginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

if (-not $loginResult.Success) {
    Write-Fail "Failed to login: $($loginResult.Error)"
    exit 1
}

$testToken = $loginResult.Data.accessToken
Write-Pass "Login successful (no 2FA required)"

# ============================================
# STEP 3: Enable 2FA
# ============================================
Write-Step "STEP 3: Enable 2FA"

$enable2faResult = Invoke-Api -Method "POST" -Endpoint "/users/enable-2fa" -Token $testToken

if (-not $enable2faResult.Success) {
    Write-Fail "Failed to enable 2FA: $($enable2faResult.Error)"
    Write-Info "Error details: $($enable2faResult.ErrorBody | ConvertTo-Json)"
    exit 1
}

$sharedSecret = $enable2faResult.Data.sharedSecret
$qrCodeUri = $enable2faResult.Data.qrCodeUri

Write-Pass "2FA enabled!"
Write-Info "Shared Secret: $sharedSecret"
Write-Info "QR Code URI: $($qrCodeUri.Substring(0, [Math]::Min(50, $qrCodeUri.Length)))..."

# ============================================
# STEP 4: Generate TOTP code and verify 2FA setup
# ============================================
Write-Step "STEP 4: Verify 2FA setup with TOTP code"

$totpCode = Get-TOTPCode -Secret $sharedSecret
Write-Info "Generated TOTP code: $totpCode"

$verify2faResult = Invoke-Api -Method "POST" -Endpoint "/users/verify-2fa" -Token $testToken -Body @{
    code = $totpCode
}

if (-not $verify2faResult.Success) {
    Write-Fail "Failed to verify 2FA: $($verify2faResult.Error)"
    Write-Info "Error details: $($verify2faResult.ErrorBody | ConvertTo-Json)"
    Write-Warning "TOTP code may have expired. Retrying with new code..."
    
    Start-Sleep -Seconds 2
    $totpCode = Get-TOTPCode -Secret $sharedSecret
    Write-Info "New TOTP code: $totpCode"
    
    $verify2faResult = Invoke-Api -Method "POST" -Endpoint "/users/verify-2fa" -Token $testToken -Body @{
        code = $totpCode
    }
    
    if (-not $verify2faResult.Success) {
        Write-Fail "Failed to verify 2FA on retry: $($verify2faResult.Error)"
        exit 1
    }
}

Write-Pass "2FA verified and activated!"

# ============================================
# STEP 5: Logout
# ============================================
Write-Step "STEP 5: Logout"

$logoutResult = Invoke-Api -Method "POST" -Endpoint "/users/logout" -Token $testToken

if ($logoutResult.Success -or $logoutResult.StatusCode -eq 204) {
    Write-Pass "Logged out successfully"
} else {
    Write-Warning "Logout returned: $($logoutResult.StatusCode)"
}

# ============================================
# STEP 6: Login with 2FA enabled (should require 2FA)
# ============================================
Write-Step "STEP 6: Login (with 2FA enabled - should require 2FA code)"

$loginWith2faResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

if ($loginWith2faResult.Success) {
    Write-Fail "Login succeeded without 2FA - this should not happen!"
    exit 1
}

if ($loginWith2faResult.ErrorBody.title -eq "Identity.TwoFactorRequired" -or 
    $loginWith2faResult.ErrorBody.detail -like "*two-factor*" -or
    $loginWith2faResult.StatusCode -eq 401) {
    Write-Pass "Login correctly requires 2FA (Status: $($loginWith2faResult.StatusCode))"
    Write-Info "Error: $($loginWith2faResult.ErrorBody.title)"
} else {
    Write-Fail "Unexpected error: $($loginWith2faResult.ErrorBody.title)"
    exit 1
}

# ============================================
# STEP 7: Complete login with 2FA code
# ============================================
Write-Step "STEP 7: Complete login with 2FA code"

# Wait a bit to ensure we're in a new TOTP window
Start-Sleep -Seconds 2

$totpCode = Get-TOTPCode -Secret $sharedSecret
Write-Info "Generated TOTP code: $totpCode"

$login2faResult = Invoke-Api -Method "POST" -Endpoint "/users/login-2fa" -Body @{
    email = $testEmail
    code = $totpCode
}

if (-not $login2faResult.Success) {
    Write-Fail "Failed to complete 2FA login: $($login2faResult.Error)"
    Write-Info "Error details: $($login2faResult.ErrorBody | ConvertTo-Json)"
    
    # Retry with new code
    Write-Warning "Retrying with new code..."
    Start-Sleep -Seconds 2
    $totpCode = Get-TOTPCode -Secret $sharedSecret
    Write-Info "New TOTP code: $totpCode"
    
    $login2faResult = Invoke-Api -Method "POST" -Endpoint "/users/login-2fa" -Body @{
        email = $testEmail
        code = $totpCode
    }
    
    if (-not $login2faResult.Success) {
        Write-Fail "Failed to complete 2FA login on retry: $($login2faResult.Error)"
        exit 1
    }
}

$testToken = $login2faResult.Data.accessToken
Write-Pass "2FA login successful!"
Write-Info "Got new access token"

# ============================================
# STEP 8: Verify we're logged in
# ============================================
Write-Step "STEP 8: Verify we're logged in (get current user)"

$meResult = Invoke-Api -Method "GET" -Endpoint "/users/me" -Token $testToken

if (-not $meResult.Success) {
    Write-Fail "Failed to get current user: $($meResult.Error)"
    exit 1
}

Write-Pass "Verified logged in as: $($meResult.Data.email)"

# ============================================
# STEP 9: Disable 2FA
# ============================================
Write-Step "STEP 9: Disable 2FA"

# Wait a bit to ensure we're in a new TOTP window
Start-Sleep -Seconds 2

$totpCode = Get-TOTPCode -Secret $sharedSecret
Write-Info "Generated TOTP code for disable: $totpCode"

$disable2faResult = Invoke-Api -Method "POST" -Endpoint "/users/disable-2fa" -Token $testToken -Body @{
    code = $totpCode
}

if (-not $disable2faResult.Success) {
    Write-Fail "Failed to disable 2FA: $($disable2faResult.Error)"
    Write-Info "Error details: $($disable2faResult.ErrorBody | ConvertTo-Json)"
    
    # Retry with new code
    Write-Warning "Retrying with new code..."
    Start-Sleep -Seconds 2
    $totpCode = Get-TOTPCode -Secret $sharedSecret
    Write-Info "New TOTP code: $totpCode"
    
    $disable2faResult = Invoke-Api -Method "POST" -Endpoint "/users/disable-2fa" -Token $testToken -Body @{
        code = $totpCode
    }
    
    if (-not $disable2faResult.Success) {
        Write-Fail "Failed to disable 2FA on retry: $($disable2faResult.Error)"
        exit 1
    }
}

Write-Pass "2FA disabled successfully!"

# ============================================
# STEP 10: Login without 2FA (should work now)
# ============================================
Write-Step "STEP 10: Login without 2FA (should work now)"

# Logout first
Invoke-Api -Method "POST" -Endpoint "/users/logout" -Token $testToken | Out-Null

$finalLoginResult = Invoke-Api -Method "POST" -Endpoint "/users/login" -Body @{
    email = $testEmail
    password = $testPassword
}

if (-not $finalLoginResult.Success) {
    Write-Fail "Failed to login after disabling 2FA: $($finalLoginResult.Error)"
    exit 1
}

Write-Pass "Login successful without 2FA!"

# ============================================
# SUMMARY
# ============================================
Write-Host @"

????????????????????????????????????????????????????????????????
?                    2FA TEST SUMMARY                          ?
????????????????????????????????????????????????????????????????
?                                                              ?
?  ? Step 1:  User registration                               ?
?  ? Step 2:  Login without 2FA                               ?
?  ? Step 3:  Enable 2FA                                      ?
?  ? Step 4:  Verify 2FA setup with TOTP code                 ?
?  ? Step 5:  Logout                                          ?
?  ? Step 6:  Login requires 2FA                              ?
?  ? Step 7:  Complete login with 2FA code                    ?
?  ? Step 8:  Verify logged in                                ?
?  ? Step 9:  Disable 2FA                                     ?
?  ? Step 10: Login without 2FA works again                   ?
?                                                              ?
?  Test User: $testEmail
?  Shared Secret: $sharedSecret
?                                                              ?
????????????????????????????????????????????????????????????????

"@ -ForegroundColor Green

Write-Host "?? All 2FA tests passed! The flow is working correctly." -ForegroundColor Magenta
