# Email Setup Guide for TransactLab

## Problem
Emails are not being sent because SMTP is not configured. The app will continue to work without emails, but you won't receive verification emails, password reset emails, etc.

## Solution Options

### Option 1: Gmail SMTP (Recommended for Development)

Gmail is free and easy to set up. Follow these steps:

1. **Enable 2-Factor Authentication** on your Gmail account
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "TransactLab" as the name
   - Click "Generate"
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

3. **Update your `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

4. **Restart your server**:
   ```powershell
   npm run dev
   ```

### Option 2: Resend (Recommended for Production - No Domain Needed)

Resend is a modern email service that doesn't require a domain for testing:

1. **Sign up** at: https://resend.com
2. **Get your API key** from the dashboard
3. **Update your `.env` file**:
   ```env
   
   ```
4. **Note**: You'll need to update the email service to use Resend instead of SMTP

### Option 3: SendGrid (Free Tier Available)

1. **Sign up** at: https://sendgrid.com
2. **Create an API key** in the dashboard
3. **Update your `.env` file**:
   ```env
   SENDGRID_API_KEY=SG.your_api_key_here
   ```
4. **Note**: You'll need to update the email service to use SendGrid

### Option 4: Mailgun (Free Tier Available)

1. **Sign up** at: https://www.mailgun.com
2. **Get your SMTP credentials** from the dashboard
3. **Update your `.env` file**:
   ```env
   SMTP_HOST=smtp.mailgun.org
   SMTP_PORT=587
   SMTP_USER=postmaster@your-domain.mailgun.org
   SMTP_PASS=your-mailgun-password
   EMAIL_FROM=noreply@your-domain.com
   ```

## Current Status

- ✅ **Login works without email verification** (disabled for development)
- ⚠️ **Emails are logged but not sent** (SMTP not configured)
- ✅ **Registration works** (but verification emails won't be sent)
- ✅ **Password reset works** (but reset emails won't be sent)

## Testing Email Configuration

After setting up SMTP, test it by:
1. Registering a new user
2. Check the server logs for "SMTP connection established successfully"
3. Check your email inbox for the verification email

## Troubleshooting

### Gmail Issues:
- **"Less secure app access" error**: You MUST use App Passwords, not your regular Gmail password
- **"Authentication failed"**: Make sure you copied the App Password correctly (remove spaces)
- **"Connection timeout"**: Check your firewall/antivirus isn't blocking port 587

### General Issues:
- **"Failed to create SMTP transporter"**: Check your SMTP_HOST, SMTP_USER, and SMTP_PASS are correct
- **Emails not arriving**: Check spam folder, verify EMAIL_FROM matches your SMTP_USER
- **Connection refused**: Make sure SMTP_PORT is correct (587 for TLS, 465 for SSL)

## Development Mode

For development, you can continue without email. The app will:
- Log email attempts instead of sending
- Allow login without email verification
- Continue functioning normally

To enable emails later, just configure SMTP and restart the server.

