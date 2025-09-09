# 🔐 TransactLab Environment Variables Setup Script
# Run this script before starting your application

Write-Host "Setting up TransactLab environment variables..." -ForegroundColor Green

# Server Configuration
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:API_VERSION = "v1"
$env:BASE_URL = "http://localhost:5000"
$env:FRONTEND_URL = "http://localhost:8081"

# Database Configuration
$env:MONGODB_URI = "mongodb://localhost:27017/transactlab"
$env:REDIS_URL = "redis://localhost:6379"

# JWT Configuration (SECURE)
$env:JWT_SECRET = "350107c936ee207bb8b7aa671d747930cf20c60b417f92e5499f199c4712828d2629665d571dd4d7708502f661554ef40e0e451be05061d1c2ba78b52d4e7168"
$env:JWT_EXPIRES_IN = "7d"
$env:JWT_REFRESH_SECRET = "f0c422d1abf5ea63f4bb0cbbe950fc97658128d5fae7e761ddb17b83fba8d292695e92a1690cd4aa44d3ea207d5437680766e2e302f7c1a05f9bf822dfc7a620"
$env:JWT_REFRESH_EXPIRES_IN = "30d"

# Security Secrets (SECURE)
$env:BCRYPT_ROUNDS = "12"
$env:SESSION_SECRET = "c08d37e8607475a7aa15d67bec97c81759bcadb2b09c13945059da4a5ac9889677d2d4735a3bb853019890d6e923075bf8c0453790e6c32cf8808615bf0714ba"
$env:API_KEY_SECRET = "7434fedd47bdd48a86563f1dd9bfb6eee7a1744eb84d1a403420424e66a73dde"
$env:WEBHOOK_SECRET = "bc0b5e010198cef095629b7ef2ea9f2c2aebc79a6b8417a09dba17b10f55c5a4"
$env:ENCRYPTION_KEY = "7c27e3efa5978c37d9f35b96cf36ecbd734ef6986f913cc293e0036429b95092"

# Email Configuration
$env:SMTP_HOST = "smtp.gmail.com"
$env:SMTP_PORT = "587"
$env:SMTP_USER = "nzehdivine49@gmail.com"
$env:SMTP_PASS = "gtqy bkhl hpoy sywy "
$env:EMAIL_FROM = "noreply@transactlab.com"

# Redis Configuration
$env:REDIS_HOST = "localhost"
$env:REDIS_PORT = "6379"
$env:REDIS_PASSWORD = ""

# Rate Limiting
$env:RATE_LIMIT_WINDOW_MS = "900000"
$env:RATE_LIMIT_MAX_REQUESTS = "100"

# File Upload
$env:MAX_FILE_SIZE = "5242880"
$env:UPLOAD_PATH = "./uploads"

# Webhook Configuration
$env:WEBHOOK_TIMEOUT = "10000"
$env:WEBHOOK_MAX_RETRIES = "3"

# Analytics
$env:ANALYTICS_ENABLED = "true"
$env:FRAUD_DETECTION_ENABLED = "true"

# Security
$env:TRUSTED_IPS = ""
$env:CORS_ORIGINS = "http://localhost:3000,http://localhost:3001,http://localhost:8081"
$env:CORS_ORIGIN = "http://localhost:3000"

# Logging
$env:LOG_LEVEL = "info"
$env:LOG_FILE_PATH = "./logs"

# Payment Provider API Keys (for testing)
$env:PAYSTACK_SECRET_KEY = "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
$env:FLUTTERWAVE_SECRET_KEY = "FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

Write-Host "✅ Environment variables set successfully!" -ForegroundColor Green
Write-Host "Now you can run: npm run dev" -ForegroundColor Yellow 