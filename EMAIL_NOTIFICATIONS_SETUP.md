# Email Notifications Setup Guide

This guide explains how to set up automated email notifications for deadline reminders using Firebase Cloud Functions and SendGrid.

## Overview

The notification system allows users to:
- Toggle email notifications on/off
- Set how many days in advance to be notified
- Choose which deadline priorities to receive notifications for
- Set preferred notification time

## Architecture

```
User Preferences (Firestore) → Cloud Function (Daily Trigger) → SendGrid API → User Email
```

## Prerequisites

1. **Firebase Blaze Plan** (Pay-as-you-go) - Required for Cloud Functions
2. **SendGrid Account** - Free tier allows 100 emails/day
3. **Node.js** installed locally
4. **Firebase CLI** installed: `npm install -g firebase-tools`

## Step 1: Firestore Security Rules

Update your Firestore security rules to include user preferences:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Calculation Sessions
    match /calculationSessions/{sessionId} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow update: if request.auth != null && request.auth.uid == resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }

    // User Preferences (NEW)
    match /userPreferences/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 2: Set Up SendGrid

1. **Create SendGrid Account**
   - Go to https://sendgrid.com/
   - Sign up for free account (100 emails/day)

2. **Create API Key**
   - Go to Settings → API Keys
   - Click "Create API Key"
   - Name: "FAR/BAR Deadline Tracker"
   - Permissions: "Full Access"
   - Copy the API key (starts with `SG.`)

3. **Verify Sender Email**
   - Go to Settings → Sender Authentication
   - Verify your email address or domain
   - This is the "from" email for notifications

## Step 3: Initialize Firebase Functions

```bash
# Navigate to your project
cd florida-deadline-calculator

# Initialize Firebase Functions
firebase init functions

# Select options:
# - JavaScript or TypeScript (JavaScript recommended)
# - Install dependencies? Yes
```

This creates a `functions/` directory with:
```
functions/
├── index.js          # Cloud Functions code
├── package.json
└── .gitignore
```

## Step 4: Install Dependencies

```bash
cd functions
npm install @sendgrid/mail
npm install date-fns
```

## Step 5: Create Cloud Function

Edit `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const { format, differenceInDays } = require('date-fns');

admin.initializeApp();

// Set SendGrid API Key
sgMail.setApiKey(functions.config().sendgrid.key);

/**
 * Scheduled function to send daily deadline notifications
 * Runs every day at the time specified in user preferences
 */
exports.sendDailyDeadlineNotifications = functions.pubsub
  .schedule('every day 09:00')
  .timeZone('America/New_York')
  .onRun(async (context) => {
    console.log('Starting daily deadline notification job');

    const db = admin.firestore();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    try {
      // Get all users with email notifications enabled
      const preferencesSnapshot = await db.collection('userPreferences')
        .where('emailNotifications', '==', true)
        .get();

      console.log(`Found ${preferencesSnapshot.size} users with notifications enabled`);

      for (const prefDoc of preferencesSnapshot.docs) {
        const userId = prefDoc.id;
        const preferences = prefDoc.data();

        // Get user's calculation sessions
        const sessionsSnapshot = await db.collection('calculationSessions')
          .where('userId', '==', userId)
          .get();

        // Get user info
        const userRecord = await admin.auth().getUser(userId);
        const userEmail = userRecord.email;

        // Collect upcoming deadlines
        const upcomingDeadlines = [];

        sessionsSnapshot.forEach((sessionDoc) => {
          const session = sessionDoc.data();
          const deadlines = session.result?.deadlines || [];

          deadlines.forEach((deadline) => {
            const dueDate = new Date(deadline.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            const daysRemaining = differenceInDays(dueDate, today);

            // Check if deadline is within notification window
            if (daysRemaining >= 0 && daysRemaining <= preferences.notifyDaysBefore) {
              // Determine priority
              let priority = 'info';
              if (daysRemaining === 0) priority = 'critical';
              else if (daysRemaining <= 1) priority = 'urgent';
              else if (daysRemaining <= 3) priority = 'warning';

              // Check if user wants notifications for this priority
              if (preferences.deadlineTypes[priority]) {
                upcomingDeadlines.push({
                  ...deadline,
                  daysRemaining,
                  priority,
                  propertyAddress: session.propertyAddress
                });
              }
            }
          });
        });

        // Send email if there are upcoming deadlines
        if (upcomingDeadlines.length > 0) {
          await sendDeadlineEmail(userEmail, upcomingDeadlines, userRecord.displayName);
          console.log(`Sent notification to ${userEmail} for ${upcomingDeadlines.length} deadlines`);
        }
      }

      console.log('Daily notification job completed');
      return null;
    } catch (error) {
      console.error('Error in notification job:', error);
      throw error;
    }
  });

/**
 * Send deadline notification email
 */
async function sendDeadlineEmail(to, deadlines, userName) {
  // Sort by days remaining (most urgent first)
  const sortedDeadlines = deadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

  // Build email HTML
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%); color: white; padding: 2rem; border-bottom: 3px solid #c4a574; }
        .header h1 { margin: 0; font-size: 1.5rem; }
        .content { padding: 2rem; }
        .deadline-card { background: #fafafa; border-left: 4px solid #c4a574; padding: 1rem; margin-bottom: 1rem; border-radius: 8px; }
        .deadline-card.critical { border-left-color: #dc2626; }
        .deadline-card.urgent { border-left-color: #fb923c; }
        .deadline-card.warning { border-left-color: #d97706; }
        .deadline-title { font-weight: 700; font-size: 1rem; color: #2c3e50; margin-bottom: 0.5rem; }
        .deadline-info { font-size: 0.875rem; color: #6c757d; margin: 0.25rem 0; }
        .priority-badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; }
        .priority-badge.critical { background: #dc2626; color: white; }
        .priority-badge.urgent { background: #fb923c; color: white; }
        .priority-badge.warning { background: #d97706; color: white; }
        .footer { background: #f8f9fa; padding: 1.5rem; text-align: center; color: #6c757d; font-size: 0.875rem; border-top: 1px solid #dee2e6; }
        .cta-button { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background: linear-gradient(135deg, #c4a574, #b8935f); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📋 Deadline Reminder - FAR/BAR Tracker</h1>
        </div>
        <div class="content">
          <p>Hi ${userName || 'there'},</p>
          <p>You have <strong>${sortedDeadlines.length}</strong> upcoming deadline${sortedDeadlines.length > 1 ? 's' : ''} that need your attention:</p>

          ${sortedDeadlines.map(deadline => `
            <div class="deadline-card ${deadline.priority}">
              <div class="deadline-title">${deadline.name}</div>
              <div class="deadline-info">📍 ${deadline.propertyAddress || 'Property'}</div>
              <div class="deadline-info">📅 Due: ${format(new Date(deadline.dueDate), 'EEEE, MMMM d, yyyy')}</div>
              <div class="deadline-info">
                <span class="priority-badge ${deadline.priority}">
                  ${deadline.daysRemaining === 0 ? 'DUE TODAY' : `${deadline.daysRemaining} day${deadline.daysRemaining > 1 ? 's' : ''} remaining`}
                </span>
              </div>
            </div>
          `).join('')}

          <a href="https://your-app-url.com" class="cta-button">View All Deadlines →</a>
        </div>
        <div class="footer">
          <p>You're receiving this email because you enabled deadline notifications in your account settings.</p>
          <p>FAR/BAR Contract Deadline Tracker | Professional Edition</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const msg = {
    to,
    from: 'noreply@yourdomain.com', // Use your verified sender email
    subject: `⚠️ ${sortedDeadlines.length} Deadline${sortedDeadlines.length > 1 ? 's' : ''} Approaching`,
    html: emailHtml,
  };

  await sgMail.send(msg);
}
```

## Step 6: Set Environment Variables

```bash
# Set SendGrid API Key
firebase functions:config:set sendgrid.key="YOUR_SENDGRID_API_KEY"

# View current config
firebase functions:config:get
```

## Step 7: Deploy Functions

```bash
# Deploy all functions
firebase deploy --only functions

# Or deploy specific function
firebase deploy --only functions:sendDailyDeadlineNotifications
```

## Step 8: Test the Function

```bash
# Test locally (requires Firebase Emulator Suite)
firebase emulators:start

# Or test in console
# Go to Firebase Console → Functions → sendDailyDeadlineNotifications → Logs
```

## Customization Options

### Change Schedule Time

Edit the cron schedule in `functions/index.js`:

```javascript
.schedule('every day 09:00')  // 9 AM
.schedule('every day 08:00')  // 8 AM
.schedule('0 9 * * *')         // Cron syntax: 9 AM daily
```

### Change Timezone

```javascript
.timeZone('America/New_York')      // Eastern Time
.timeZone('America/Chicago')       // Central Time
.timeZone('America/Los_Angeles')   // Pacific Time
```

### Custom Email Template

Modify the `emailHtml` in the `sendDeadlineEmail` function to match your branding.

## Monitoring

1. **View Logs**
   ```bash
   firebase functions:log
   ```

2. **Firebase Console**
   - Go to Firebase Console → Functions
   - View execution count, errors, and logs

3. **SendGrid Dashboard**
   - Check email delivery status
   - View bounce/spam reports

## Cost Estimation

### Firebase

- **Cloud Functions**: ~$0.40 per million invocations
- **Daily job**: 1 execution/day = ~$0.012/month
- **Additional invocations**: Based on user count

### SendGrid

- **Free tier**: 100 emails/day
- **Essentials**: $19.95/month for 50,000 emails
- **Pro**: $89.95/month for 100,000 emails

## Troubleshooting

### Function Not Running

1. Check Firebase plan is Blaze (not Spark)
2. Verify schedule syntax
3. Check logs for errors: `firebase functions:log`

### Emails Not Sending

1. Verify SendGrid API key is set correctly
2. Check sender email is verified in SendGrid
3. Review SendGrid activity logs
4. Check spam folder

### Permission Errors

1. Ensure Firestore rules allow reading userPreferences
2. Verify service account has permissions
3. Check function deployment logs

## Security Best Practices

1. **Never commit API keys** - Use Firebase config
2. **Verify sender domain** - Prevents spoofing
3. **Rate limiting** - Implement in production
4. **User consent** - GDPR/CAN-SPAM compliance
5. **Unsubscribe option** - Required by law

## Additional Features (Optional)

### Instant Notifications

Create a triggered function for immediate notifications when deadlines are created:

```javascript
exports.onDeadlineCreated = functions.firestore
  .document('calculationSessions/{sessionId}')
  .onCreate(async (snap, context) => {
    // Send immediate notification
  });
```

### SMS Notifications

Use Twilio instead of SendGrid for SMS alerts.

### Slack Integration

Send notifications to a Slack channel instead of email.

## Support

For issues or questions:
1. Check Firebase documentation: https://firebase.google.com/docs/functions
2. SendGrid docs: https://docs.sendgrid.com/
3. Open an issue in the project repository

---

**Last Updated**: February 2026
**Version**: 1.0
