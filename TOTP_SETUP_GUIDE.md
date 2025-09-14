# 🔐 TOTP (Two-Factor Authentication) Setup Guide

## Issue Resolution

The error you encountered (`Invalid TOTP code`) was happening because you were trying to verify a TOTP code before completing the setup process. Here's the correct flow:

## ✅ Correct TOTP Setup Flow

### Step 1: Generate TOTP Secret
```bash
POST /api/v1/auth/security/totp/setup
```

**Response:**
```json
{
  "success": true,
  "data": {
    "secret": "JBSWY3DPEHPK3PXP",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "backupCodes": ["ABC12345", "DEF67890", ...]
  }
}
```

### Step 2: Scan QR Code
- Open Google Authenticator app
- Scan the QR code from the response
- The app will start generating 6-digit codes

### Step 3: Verify Setup
```bash
POST /api/v1/auth/security/totp/verify
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Two-Factor Authentication enabled successfully"
}
```

## 🔍 Check TOTP Status

Before attempting verification, you can check the status:

```bash
GET /api/v1/auth/security/totp/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "hasSecret": true,
    "isEnabled": false,
    "isSetupReady": true,
    "status": "setup_ready"
  }
}
```

**Status Values:**
- `not_setup`: No TOTP secret generated
- `setup_ready`: Secret generated, ready for verification
- `enabled`: TOTP is active and working

## 🚨 Common Issues & Solutions

### Issue 1: "TOTP secret not found"
**Cause:** Trying to verify before completing setup
**Solution:** Generate a new TOTP secret first

### Issue 2: "Invalid TOTP code"
**Causes:**
- Wrong code entered
- Clock sync issues between device and server
- Code expired (30-second window)

**Solutions:**
- Double-check the 6-digit code from Google Authenticator
- Ensure device time is synchronized
- Try the next code (wait for it to refresh)

### Issue 3: Time Synchronization
**Cause:** Device clock is off
**Solution:** 
- Enable automatic time sync on your device
- Use network time servers
- Restart Google Authenticator app

## 🛠️ Enhanced Error Handling

The system now provides better error messages:

### Setup Required
```json
{
  "success": false,
  "message": "Please complete TOTP setup first. Generate a QR code in Security settings before verifying.",
  "requiresSetup": true
}
```

### Invalid Code
```json
{
  "success": false,
  "message": "Invalid TOTP code"
}
```

### Setup Not Ready
```json
{
  "success": false,
  "message": "Please complete TOTP setup first. Go to Security settings and generate a new QR code."
}
```

## 📱 Testing TOTP Setup

### 1. Check Current Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://transactlab-backend.onrender.com/api/v1/auth/security/totp/status
```

### 2. Generate New Setup (if needed)
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://transactlab-backend.onrender.com/api/v1/auth/security/totp/setup
```

### 3. Verify with Code
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"code":"123456"}' \
  https://transactlab-backend.onrender.com/api/v1/auth/security/totp/verify
```

## 🔧 Debug Information

The system now logs detailed information for debugging:

```
[info]: Verifying TOTP code { userId: "...", code: "123456", secretLength: 32, totpEnabled: false }
[info]: TOTP verification result { userId: "...", verified: true }
[info]: TOTP enabled for user { userId: "..." }
```

## 🎯 Next Steps

1. **Check your current TOTP status** using the status endpoint
2. **Generate a new TOTP setup** if needed
3. **Scan the QR code** with Google Authenticator
4. **Verify with a fresh 6-digit code** from the app
5. **Test login** with TOTP enabled

## 💡 Tips

- **Use fresh codes**: TOTP codes change every 30 seconds
- **Check device time**: Ensure your phone/device time is accurate
- **Save backup codes**: Store them in a secure location
- **Test immediately**: Verify TOTP right after setup

The enhanced error handling will now guide you through the correct setup process! 🚀
