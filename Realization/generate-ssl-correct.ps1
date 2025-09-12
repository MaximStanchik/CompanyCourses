Write-Host "Generating proper SSL certificates for localhost..." -ForegroundColor Green

# Create ssl directory if it doesn't exist
if (!(Test-Path "backend/ssl")) {
    New-Item -ItemType Directory -Name "ssl" -Path "backend" -Force
}

# Generate private key
Write-Host "Generating private key..." -ForegroundColor Yellow
openssl genrsa -out backend/ssl/localhost.key 2048

# Create configuration file for certificate
$opensslConfig = @"
[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
C = RU
ST = Moscow
L = Moscow
O = CompanyCourses
OU = Development
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
IP.1 = 127.0.0.1
IP.2 = ::1
"@

$opensslConfig | Out-File -FilePath "backend/ssl/openssl.conf" -Encoding ASCII

# Generate certificate
Write-Host "Generating certificate..." -ForegroundColor Yellow
openssl req -new -x509 -key backend/ssl/localhost.key -out backend/ssl/localhost.crt -days 3650 -config backend/ssl/openssl.conf

# Remove temporary config
Remove-Item "backend/ssl/openssl.conf"

# Copy to backend root for compatibility
Copy-Item "backend/ssl/localhost.crt" "backend/LAB.crt" -Force
Copy-Item "backend/ssl/localhost.key" "backend/LAB.key" -Force

Write-Host "SSL certificates generated successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "   - backend/ssl/localhost.key (private key)" -ForegroundColor Cyan
Write-Host "   - backend/ssl/localhost.crt (certificate)" -ForegroundColor Cyan
Write-Host "   - backend/LAB.crt (copied for compatibility)" -ForegroundColor Cyan
Write-Host "   - backend/LAB.key (copied for compatibility)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Now you can run:" -ForegroundColor Green
Write-Host "cd frontend" -ForegroundColor White
Write-Host "npm start" -ForegroundColor White

Read-Host "Press Enter to continue" 