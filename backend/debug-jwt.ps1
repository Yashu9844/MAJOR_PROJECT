# PowerShell JWT / Clerk Debug Helper
param(
    [string]$Token = $env:TOKEN
)

# ====== CONFIG ======
$ENV_FILE = ".\.env"
$TOKEN_FILE = ".\token.txt"

# If no token provided, try to read from token file
if (-not $Token -and (Test-Path $TOKEN_FILE)) {
    $Token = Get-Content $TOKEN_FILE -Raw
    $Token = $Token.Trim()
}

$ISSUER_EXPECTED = "https://mint-turkey-12.clerk.accounts.dev"
$JWKS_URL = "$ISSUER_EXPECTED/.well-known/jwks.json"

Write-Host ""
Write-Host "=== JWT / Clerk Debug Helper ===" -ForegroundColor Green
Write-Host ""

# 1) Show Clerk-related env vars (mask values)
Write-Host "1) Checking .env file & Clerk env vars..." -ForegroundColor Yellow

if (Test-Path $ENV_FILE) {
    Write-Host " - .env found at $ENV_FILE" -ForegroundColor Green
} else {
    Write-Host " - ERROR: .env not found at $ENV_FILE; please run this from backend root" -ForegroundColor Red
    exit 1
}

# Print Clerk vars (masked)
Write-Host ""
Write-Host "CLERK environment variables (masked):" -ForegroundColor Cyan

$clerkVars = @('CLERK_PUBLISHABLE_KEY', 'CLERK_SECRET_KEY', 'CLERK_JWT_ISSUER', 'CLERK_JWT_ISSUER_DOMAIN', 'CLERK_JWT_KEY')
$envContent = Get-Content $ENV_FILE

foreach ($var in $clerkVars) {
    $line = $envContent | Where-Object { $_ -match "^$var=" } | Select-Object -First 1
    if ($line) {
        $value = $line -replace "^$var=", ""
        $maskedValue = if ($value.Length -gt 8) { $value.Substring(0, 8) + "..." } else { $value }
        Write-Host " - $var = $maskedValue (len $($value.Length))"
    } else {
        Write-Host " - $var = (not set)" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "If CLERK_JWT_ISSUER is commented/not set you must set it to your project's issuer."
Write-Host "Expected issuer (token preview showed): $ISSUER_EXPECTED" -ForegroundColor Yellow
Write-Host ""

# 2) Ensure we have a token
if (-not $Token) {
    Write-Host "ERROR: No JWT token provided. Create token.txt with your JWT or set TOKEN env var." -ForegroundColor Red
    Write-Host "Example: 'eyJhbGciOi...' | Out-File -FilePath token.txt -Encoding utf8"
    exit 2
}

Write-Host "2) Token loaded (length $($Token.Length)). Decoding header & payload..." -ForegroundColor Yellow

# 3) Decode header & payload (base64url)
function ConvertFrom-Base64Url {
    param([string]$Input)
    $Input = $Input.Replace('-', '+').Replace('_', '/')
    # Add padding if needed
    $padding = 4 - ($Input.Length % 4)
    if ($padding -ne 4) {
        $Input += '=' * $padding
    }
    return [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Input))
}

try {
    $tokenParts = $Token.Split('.')
    if ($tokenParts.Length -ne 3) {
        throw "Not a valid JWT"
    }

    $headerJson = ConvertFrom-Base64Url $tokenParts[0]
    $payloadJson = ConvertFrom-Base64Url $tokenParts[1]
    
    $header = $headerJson | ConvertFrom-Json
    $payload = $payloadJson | ConvertFrom-Json

    Write-Host "HEADER:" -ForegroundColor Cyan
    Write-Host ($header | ConvertTo-Json -Depth 10)
    
    Write-Host "PAYLOAD (preview):" -ForegroundColor Cyan
    $payloadPreview = @{
        iss = $payload.iss
        sub = $payload.sub
        aud = if ($payload.aud) { $payload.aud } else { $null }
        exp = $payload.exp
        iat = $payload.iat
        nbf = $payload.nbf
        custom_claims = if ($payload.custom_claims) { $payload.custom_claims } else { $null }
    }
    Write-Host ($payloadPreview | ConvertTo-Json -Depth 10)
    
    $now = [int64]((Get-Date).ToUniversalTime().Subtract((Get-Date "1970-01-01")).TotalSeconds)
    Write-Host "Now (epoch): $now"
    $expired = if ($payload.exp) { $now -gt $payload.exp } else { "no exp claim" }
    Write-Host "Expired?: $expired"

    $KID = if ($header.kid) { $header.kid } else { "" }
    $ISS = if ($payload.iss) { $payload.iss } else { "" }

} catch {
    Write-Host "ERROR decoding JWT: $_" -ForegroundColor Red
    exit 3
}

Write-Host ""
Write-Host "3) Token header kid: $KID" -ForegroundColor Yellow
Write-Host "   Token issuer (iss): $ISS"

Write-Host ""
Write-Host "4) Fetching JWKS from token issuer JWKS endpoint: $JWKS_URL" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri $JWKS_URL -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host " - JWKS fetched OK" -ForegroundColor Green
        
        $jwks = $response.Content | ConvertFrom-Json
        $foundKey = $jwks.keys | Where-Object { $_.kid -eq $KID } | Select-Object -First 1
        
        if ($foundKey) {
            Write-Host " - Found matching JWK for kid: $($foundKey.kid)" -ForegroundColor Green
        } else {
            Write-Host " - WARNING: JWK for kid ($KID) NOT found in JWKS!" -ForegroundColor Red
            Write-Host "   List of keys present:"
            $jwks.keys | ForEach-Object { Write-Host "     $($_.kid)" }
        }
    }
} catch {
    Write-Host " - ERROR: JWKS fetch failed: $_" -ForegroundColor Red
    Write-Host "   Try opening $JWKS_URL in browser or check network/firewall."
}

Write-Host ""
Write-Host "5) Attempt to verify token via Clerk backend library (requires @clerk/backend)." -ForegroundColor Yellow
Write-Host "   If not installed, this step will attempt to install it locally (npm i @clerk/backend)."

$proceed = Read-Host "Proceed with verifyToken attempt? [y/N]"
if ($proceed -ne "y" -and $proceed -ne "Y") {
    Write-Host "Skipping automatic verify attempt. Next recommended steps printed below." -ForegroundColor Yellow
    exit 0
}

# Check if @clerk/backend is installed
try {
    $null = node -e "require.resolve('@clerk/backend')" 2>$null
} catch {
    Write-Host "Installing @clerk/backend (dev). This may take a moment..." -ForegroundColor Yellow
    npm i @clerk/backend --no-audit --no-fund
}

# Create temporary verifier script
$verifierScript = @"
const { verifyToken } = require('@clerk/backend');
const token = process.env.TOKEN;
const issuer = process.env.CLERK_JWT_ISSUER || process.env.CLERK_JWT_ISSUER_DOMAIN || '';
(async ()=>{
  try{
    console.log("Running verifyToken with issuer:", issuer || "(none)");
    const res = await verifyToken(token, {
      issuer: issuer || undefined
      // omit audience to avoid strict aud mismatch for development
    });
    console.log("✅ verifyToken result:", res);
  }catch(e){
    console.error("❌ verifyToken threw error:");
    console.error(e && e.stack ? e.stack : e);
    process.exitCode = 2;
  }
})();
"@

$verifierScript | Out-File -FilePath "tmp_verify_clerk.js" -Encoding utf8

# Get CLERK_JWT_ISSUER from .env
$clerkIssuerLine = $envContent | Where-Object { $_ -match "^CLERK_JWT_ISSUER=" } | Select-Object -First 1
$clerkIssuer = if ($clerkIssuerLine) { $clerkIssuerLine -replace "^CLERK_JWT_ISSUER=", "" } else { "" }

$env:CLERK_JWT_ISSUER = $clerkIssuer
$env:TOKEN = $Token

try {
    node "tmp_verify_clerk.js"
} catch {
    Write-Host "Verification failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "6) If verification failed with 'Failed to resolve JWK', possible immediate fixes:" -ForegroundColor Cyan
Write-Host "   • Ensure CLERK_JWT_ISSUER in .env exactly matches token 'iss' (no trailing slash)."
Write-Host "     Example: CLERK_JWT_ISSUER=$ISS" -ForegroundColor Yellow
Write-Host "   • Check that $JWKS_URL is reachable from this machine."
Write-Host "   • If JWKS fetch fails or you are offline, set CLERK_JWT_KEY to your instance signing key (from Clerk Dashboard → API Keys / Instance keys)."
Write-Host "     Add to .env: CLERK_JWT_KEY=`"-----BEGIN PUBLIC KEY-----...`""
Write-Host "   • Ensure NODE process is restarted after editing .env"

Write-Host ""
Write-Host "7) Quick fix for .env (set correct issuer):" -ForegroundColor Cyan
Write-Host "   # Backup first"
Write-Host "   Copy-Item $ENV_FILE ${ENV_FILE}.bak"
Write-Host "   # Update CLERK_JWT_ISSUER"
Write-Host "   `$content = Get-Content $ENV_FILE"
Write-Host "   `$content = `$content -replace '^#?CLERK_JWT_ISSUER=.*', 'CLERK_JWT_ISSUER=$ISS'"
Write-Host "   `$content | Out-File -FilePath $ENV_FILE -Encoding utf8"
Write-Host "   Write-Host 'Updated .env; restart your server after this.'"

Write-Host ""
Write-Host "8) If JWKS doesn't contain the kid, the token is from a different Clerk project/environment." -ForegroundColor Yellow
Write-Host "   In that case: generate a new token from the frontend of the correct Clerk project."

Write-Host ""
Write-Host "9) Final manual tests after fixes:" -ForegroundColor Green
Write-Host "   # Generate fresh token in frontend, save to token.txt"
Write-Host "   `$token = Get-Content token.txt -Raw"
Write-Host "   Invoke-WebRequest -Uri 'http://localhost:5000/api/debug-token' -Headers @{'Authorization'='Bearer ' + `$token.Trim()}"

Write-Host ""
Write-Host "=== End of automated checks. Inspect above output and follow suggested fixes. ===" -ForegroundColor Green

# Cleanup
if (Test-Path "tmp_verify_clerk.js") {
    Remove-Item "tmp_verify_clerk.js"
}
