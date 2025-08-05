# Gmail SMTP Setup Instructions

To enable email functionality in your AgencyCRM app, you need to set up Gmail SMTP credentials:

## Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication if not already enabled

## Step 2: Generate App Password
1. Go to Google Account → Security → 2-Step Verification
2. Scroll down to "App passwords"
3. Select "Generate app password"
4. Choose "Mail" and your device
5. Copy the 16-character password (no spaces)

## Step 3: Set Environment Variables
Add these to your .env file:

```
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password
```

## Testing Email Service
1. Navigate to Dashboard → Settings → Email tab
2. Click "Advanced Settings" to open email settings page
3. Send a test email to verify the configuration

## Features Available
- Welcome emails for new users
- Lead notifications
- Project updates
- Password reset emails
- Task assignment notifications
- Client credential emails

## Troubleshooting
- Make sure 2FA is enabled on your Gmail account
- Use app password, not your regular Gmail password
- Check that GMAIL_USER and GMAIL_APP_PASSWORD are set correctly
- Restart the application after setting environment variables
