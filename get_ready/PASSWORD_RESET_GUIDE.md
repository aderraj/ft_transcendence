# 🔐 Password Reset Feature - Complete Guide

## ✅ What's Been Implemented

### Backend (NestJS)
1. **Database Schema Updates**
   - Added `resetPasswordToken` field to User model
   - Added `resetPasswordExpires` field to User model
   - Migration created and applied

2. **Email Service**
   - Created `EmailService` using Nodemailer
   - Beautiful HTML email template with gradient styling
   - Sends password reset links to users
   - 1-hour token expiration

3. **Auth Service Methods**
   - `forgotPassword(email)` - Generates reset token and sends email
   - `resetPassword(token, newPassword)` - Validates token and updates password
   - Security: OAuth users cannot reset password
   - Security: Doesn't reveal if email exists

4. **API Endpoints**
   - `POST /api/auth/forgot-password` - Request password reset
   - `POST /api/auth/reset-password` - Reset password with token

### Frontend (React)
1. **ForgotPassword Page** (`/forgot-password`)
   - Email input form
   - Success/error messages
   - Link back to login

2. **ResetPassword Page** (`/reset-password?token=xxx`)
   - New password and confirmation inputs
   - Token validation
   - Auto-redirect to login after success

3. **Login Page Updates**
   - Added "Forgot Password?" link below password field

## 📧 Gmail SMTP Setup

### Step 1: Enable 2FA on Your Gmail Account
1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification**

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Name it "Transcendence"
4. Copy the 16-character password

### Step 3: Update `.env` File
```bash
# Replace these values in your .env file:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com        # Your Gmail address
SMTP_PASS=xxxx xxxx xxxx xxxx         # Your App Password (16 chars)
EMAIL_FROM=your-email@gmail.com       # Your Gmail address
```

### Step 4: Restart Backend
```bash
sudo docker-compose restart backend
```

## 🧪 How to Test

### Test Forgot Password Flow

1. **Go to Login Page**
   - Visit http://10.14.57.32:3000

2. **Click "Forgot Password?" Link**
   - Below the password field

3. **Enter Email**
   - Use: `reda@transcendence.ma` (or any test user email)
   - Click "Send Reset Link"

4. **Check Your Email**
   - Check the inbox of the email you configured in SMTP_USER
   - You should receive a beautiful email with "Reset Password" button

5. **Click Reset Link**
   - Click the button in email OR
   - Copy/paste the link in browser
   - Format: `http://10.14.57.32:3000/reset-password?token=xxxxx`

6. **Enter New Password**
   - Enter new password (min 6 characters)
   - Confirm password
   - Click "Reset Password"

7. **Login with New Password**
   - Auto-redirected to login page
   - Login with username and NEW password

## 📝 Test Users

You can test with these existing users:

| Username | Email | Current Password |
|----------|-------|-----------------|
| reda | reda@transcendence.ma | password1 |
| samir | samir@transcendence.ma | password2 |
| aymen | aymen@transcendence.ma | password3 |
| karim | karim@transcendence.ma | password4 |
| user5 | user5@transcendence.ma | password5 |

**Note:** OAuth users (logged in with 42) cannot reset password.

## 🔒 Security Features

1. **Token Expiration**
   - Reset tokens expire after 1 hour
   - Tokens are single-use only

2. **Privacy Protection**
   - Doesn't reveal if email exists in database
   - Same message for existing and non-existing emails

3. **OAuth Protection**
   - OAuth users (42 login) cannot use password reset
   - They must use their OAuth provider

4. **Password Requirements**
   - Minimum 6 characters
   - Hashed with bcrypt before storage

5. **Token Security**
   - Cryptographically secure random tokens (32 bytes)
   - Stored securely in database
   - Cleared after successful reset

## 📧 Email Preview

The password reset email includes:
- 🏓 Transcendence branding with gradient
- Clear "Reset Password" button
- Plain text link (if button doesn't work)
- Security warnings:
  - ⚠️ Link expires in 1 hour
  - ⚠️ Ignore if you didn't request this
  - ⚠️ Never share the link

## 🐛 Troubleshooting

### Email Not Sending
```bash
# Check backend logs
sudo docker-compose logs backend | grep -i "email\|smtp"

# Common issues:
# 1. Wrong SMTP credentials
# 2. App Password not generated
# 3. 2FA not enabled on Gmail
# 4. Firewall blocking port 587
```

### "Invalid or expired reset token"
- Token expired (1 hour limit)
- Token already used
- Request a new reset link

### OAuth User Error
- User logged in with 42 OAuth
- Cannot reset password
- Must use 42 login

## 🚀 Next Steps

### Optional Enhancements
1. **Rate Limiting**
   - Limit password reset requests (e.g., 3 per hour per email)

2. **Email Templates**
   - Add more email types (welcome email, verification, etc.)

3. **Password Strength Meter**
   - Add visual password strength indicator

4. **2FA Integration**
   - Require 2FA code for password reset (if enabled)

5. **Notification Email**
   - Send confirmation email after password change

## 📊 API Documentation

### POST /api/auth/forgot-password
```json
// Request
{
  "email": "user@transcendence.ma"
}

// Response (200)
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

### POST /api/auth/reset-password
```json
// Request
{
  "token": "generated-reset-token",
  "newPassword": "newPassword123"
}

// Response (200)
{
  "message": "Password has been reset successfully"
}

// Error (400)
{
  "statusCode": 400,
  "message": "Invalid or expired reset token"
}
```

## ✅ Checklist

- [x] Database schema updated
- [x] Email service created
- [x] Auth service methods implemented
- [x] API endpoints added
- [x] Frontend pages created
- [x] Routes configured
- [x] Login page link added
- [ ] **Configure Gmail SMTP** (YOU NEED TO DO THIS)
- [ ] Test forgot password flow
- [ ] Test reset password flow

## 🎯 Current Status

**Backend:** ✅ Ready
**Frontend:** ✅ Ready
**Database:** ✅ Migrated
**Email:** ⚠️ **Needs Gmail SMTP configuration**

**Next Action:** Update your `.env` file with Gmail SMTP credentials and restart backend.
