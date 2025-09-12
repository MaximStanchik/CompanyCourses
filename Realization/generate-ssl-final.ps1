Write-Host "Generating final SSL certificate with correct key usage..." -ForegroundColor Green

# Create ssl directory if it doesn't exist
if (!(Test-Path "backend/ssl")) {
    New-Item -ItemType Directory -Name "ssl" -Path "backend" -Force
}

# Generate private key
Write-Host "Generating private key..." -ForegroundColor Yellow
openssl genrsa -out backend/ssl/localhost.key 2048

# Create configuration file for certificate with correct extensions
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
basicConstraints = CA:FALSE
keyUsage = digitalSignature, keyEncipherment
extendedKeyUsage = serverAuth, clientAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = *.localhost
DNS.3 = localhost.localdomain
IP.1 = 127.0.0.1
IP.2 = ::1
IP.3 = 0.0.0.0
"@

$opensslConfig | Out-File -FilePath "backend/ssl/openssl.conf" -Encoding ASCII

# Generate certificate with correct extensions
Write-Host "Generating certificate with correct extensions..." -ForegroundColor Yellow
openssl req -new -x509 -key backend/ssl/localhost.key -out backend/ssl/localhost.crt -days 3650 -config backend/ssl/openssl.conf -extensions v3_req

# Remove temporary config
Remove-Item "backend/ssl/openssl.conf"

# Copy to backend root for compatibility
Copy-Item "backend/ssl/localhost.crt" "backend/LAB.crt" -Force
Copy-Item "backend/ssl/localhost.key" "backend/LAB.key" -Force

Write-Host "Final SSL certificate generated successfully!" -ForegroundColor Green
Write-Host "Files created:" -ForegroundColor Cyan
Write-Host "   - backend/ssl/localhost.key (private key)" -ForegroundColor Cyan
Write-Host "   - backend/ssl/localhost.crt (certificate with correct extensions)" -ForegroundColor Cyan
Write-Host "   - backend/LAB.crt (copied for compatibility)" -ForegroundColor Cyan
Write-Host "   - backend/LAB.key (copied for compatibility)" -ForegroundColor Cyan

Write-Host ""
Write-Host "Certificate details:" -ForegroundColor Green
openssl x509 -in backend/LAB.crt -text -noout | Select-String "Subject:"
openssl x509 -in backend/LAB.crt -text -noout | Select-String "X509v3 Subject Alternative Name"

Write-Host ""
Write-Host "Now restart your backend and frontend:" -ForegroundColor Green
Write-Host "1. Stop backend (Ctrl+C)" -ForegroundColor White
Write-Host "2. Restart backend: node index.js" -ForegroundColor White
Write-Host "3. Restart frontend: npm start" -ForegroundColor White

Read-Host "Press Enter to continue" 