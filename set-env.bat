@echo off
echo 🔐 Setting up TransactLab environment variables...

REM Server Configuration
set NODE_ENV=development
set PORT=5000
set API_VERSION=v1
set BASE_URL=http://localhost:5000

REM Database Configuration
set MONGODB_URI=mongodb://localhost:27017/transactlab
set REDIS_URL=redis://localhost:6379

REM JWT Configuration (SECURE)
set JWT_SECRET=350107c936ee207bb8b7aa671d747930cf20c60b417f92e5499f199c4712828d2629665d571dd4d7708502f661554ef40e0e451be05061d1c2ba78b52d4e7168
set JWT_EXPIRES_IN=7d
set JWT_REFRESH_SECRET=f0c422d1abf5ea63f4bb0cbbe950fc97658128d5fae7e761ddb17b83fba8d292695e92a1690cd4aa44d3ea207d5437680766e2e302f7c1a05f9bf822dfc7a620
set JWT_REFRESH_EXPIRES_IN=30d

REM Security Secrets (SECURE)
set SESSION_SECRET=c08d37e8607475a7aa15d67bec97c81759bcadb2b09c13945059da4a5ac9889677d2d4735a3bb853019890d6e923075bf8c0453790e6c32cf8808615bf0714ba
set API_KEY_SECRET=7434fedd47bdd48a86563f1dd9bfb6eee7a1744eb84d1a403420424e66a73dde
set WEBHOOK_SECRET=bc0b5e010198cef095629b7ef2ea9f2c2aebc79a6b8417a09dba17b10f55c5a4
set ENCRYPTION_KEY=7c27e3efa5978c37d9f35b96cf36ecbd734ef6986f913cc293e0036429b95092

REM Email Configuration
set SMTP_HOST=smtp.gmail.com
set SMTP_PORT=587
set SMTP_USER=your-email@gmail.com
set SMTP_PASS=your-app-password
set EMAIL_FROM=noreply@transactlab.com

REM Redis Configuration
set REDIS_HOST=localhost
set REDIS_PORT=6379
set REDIS_PASSWORD=

REM Rate Limiting
set RATE_LIMIT_WINDOW_MS=900000
set RATE_LIMIT_MAX_REQUESTS=100

REM File Upload
set MAX_FILE_SIZE=5242880
set UPLOAD_PATH=./uploads

REM Webhook Configuration
set WEBHOOK_TIMEOUT=10000
set WEBHOOK_MAX_RETRIES=3

REM Analytics
set ANALYTICS_ENABLED=true
set FRAUD_DETECTION_ENABLED=true

REM Security
set TRUSTED_IPS=
set CORS_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:5173

REM Logging
set LOG_LEVEL=info
set LOG_FILE_PATH=./logs

echo ✅ Environment variables set successfully!
echo Now you can run: npm run dev
pause 