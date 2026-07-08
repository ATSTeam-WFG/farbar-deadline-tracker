# 🔥 Firebase Setup Guide

Complete guide to setting up Firebase for the FAR/BAR Contract Deadline Tracker.

## 📋 Prerequisites

- A Google account
- The project running locally (`npm run dev`)
- 10 minutes of your time

---

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or **"Create a project"**
3. Enter a project name: `farbar-deadline-tracker` (or your choice)
4. Click **Continue**
5. **Disable Google Analytics** (or configure it - optional)
6. Click **Create project**
7. Wait for project creation (~30 seconds)
8. Click **Continue**

---

## Step 2: Register Your Web App

1. In your Firebase project dashboard, click the **Web icon** (`</>`)
2. Enter an app nickname: `Deadline Calculator Web`
3. **Do NOT** check "Firebase Hosting" (we'll do that later)
4. Click **Register app**

5. **IMPORTANT:** Copy the `firebaseConfig` object that appears:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:XXXXXXXXXXXX"
};
```

6. Click **Continue to console**

---

## Step 3: Enable Google Authentication

1. In the left sidebar, click **Build** → **Authentication**
2. Click **Get started**
3. Click the **Sign-in method** tab
4. Find **Google** in the list and click it
5. Toggle the **Enable** switch to ON
6. Enter a **Project support email** (your email address)
7. Click **Save**

✅ **Google Sign-In is now enabled!**

---

## Step 4: Create Firestore Database

1. In the left sidebar, click **Build** → **Firestore Database**
2. Click **Create database**

3. **Choose production mode:**
   - Select **Start in production mode**
   - Click **Next**

4. **Select location:**
   - Choose a location closest to your users
   - Recommended for US: `us-east1` (Virginia) or `us-central1` (Iowa)
   - ⚠️ **This cannot be changed later!**
   - Click **Enable**

5. Wait for database creation (~30-60 seconds)

---

## Step 5: Configure Security Rules

Once Firestore is created:

1. Click the **Rules** tab
2. **Replace** the existing rules with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow users to read/write only their own calculation sessions
    match /calculationSessions/{sessionId} {
      // Allow read if user owns the session
      allow read: if request.auth != null
                  && request.auth.uid == resource.data.userId;

      // Allow create if user is authenticated and setting their own userId
      allow create: if request.auth != null
                    && request.auth.uid == request.resource.data.userId;

      // Allow update if user owns the session
      allow update: if request.auth != null
                    && request.auth.uid == resource.data.userId;

      // Allow delete if user owns the session
      allow delete: if request.auth != null
                    && request.auth.uid == resource.data.userId;
    }

    // Allow users to read/write only their own notification preferences
    match /userPreferences/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

✅ **Security rules are now active!**

---

## Step 6: Configure Your App

Now let's connect your app to Firebase:

1. Open the file: `src/firebase/config.js`

2. **Replace the placeholder config** with your actual Firebase config from Step 2:

```javascript
// BEFORE (placeholder):
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  // ...
};

// AFTER (your actual values):
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "farbar-deadline-tracker.firebaseapp.com",
  projectId: "farbar-deadline-tracker",
  storageBucket: "farbar-deadline-tracker.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:XXXXXXXXXXXX"
};
```

3. **Save the file**

---

## Step 7: Test the Integration 🧪

### Start the App

```bash
npm run dev
```

### Test Authentication

1. Open your browser to `http://localhost:5174`
2. Click **"Sign in with Google"** in the header
3. Choose your Google account
4. Grant permissions
5. ✅ You should see your profile picture and name in the header!

### Test Saving a Calculation

1. Fill out the contract form:
   - Property Address: `123 Test St, Miami, FL`
   - Effective Date: Today's date
   - Transaction Type: Financed
   - Click **Calculate Deadlines**

2. In the results page, click **Save** button
3. ✅ You should see: "Calculation saved successfully!"

### Test Loading Calculations

1. Click **"My Calculations"** in the header
2. ✅ You should see your saved calculation!
3. Click on it to load it
4. ✅ The calculation should restore

### Test PDF Export

1. With a calculation displayed, click **Export PDF**
2. ✅ A PDF should download with all deadlines

---

## Step 8: Verify in Firebase Console

Let's confirm data is being saved:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database**
4. You should see:
   - Collection: `calculationSessions`
   - Documents: Your saved calculations

Click on a document to see the structure:
```
calculationSessions/
  ├── abc123 (document)
      ├── userId: "google-oauth-id"
      ├── propertyAddress: "123 Test St, Miami, FL"
      ├── contractData: { ... }
      ├── result: { deadlines: [...] }
      ├── createdAt: timestamp
      └── updatedAt: timestamp
```

---

## 🎉 Success Checklist

- ✅ Firebase project created
- ✅ Web app registered
- ✅ Google authentication enabled
- ✅ Firestore database created
- ✅ Security rules configured
- ✅ App config updated
- ✅ Sign-in worksget thi
- ✅ Save calculation works
- ✅ Load calculation works
- ✅ PDF export works

---

## 🐛 Troubleshooting

### Error: "Missing or insufficient permissions"

**Cause:** Firestore security rules not set correctly

**Fix:**
1. Go to Firestore → Rules tab
2. Verify rules match Step 5 exactly
3. Click **Publish**
4. Wait 30 seconds for rules to propagate

---

### Error: "Auth domain not authorized"

**Cause:** Your localhost isn't in authorized domains

**Fix:**
1. Firebase Console → Authentication → Settings → Authorized domains
2. Verify `localhost` is in the list (should be there by default)
3. If missing, add it manually

---

### Sign-in popup gets blocked

**Cause:** Browser blocking popups

**Fix:**
1. Allow popups for `localhost` in your browser
2. Or use this Chrome setting: `chrome://settings/content/popups`

---

### Error: "Cannot read property 'uid' of null"

**Cause:** Trying to use Firebase before auth state is ready

**Fix:**
- Already handled in code (AuthContext waits for auth to initialize)
- Make sure you wrapped App in `<AuthProvider>` (already done in `main.jsx`)

---

### Can't see saved calculations in Dashboard

**Cause 1:** Not signed in
**Fix:** Sign in first

**Cause 2:** Firestore rules rejecting reads
**Fix:**
1. Open browser console (F12)
2. Look for Firestore permission errors
3. Verify security rules (Step 5)

**Cause 3:** No calculations saved yet
**Fix:** Save at least one calculation first

---

### Notification center shows no notifications

**Cause:** This is normal if no deadlines are urgent (next 7 days)

**Fix:**
- Create a calculation with closing date within 10 days
- Deadlines within 7 days will show as notifications

---

## 🔐 Security Best Practices

### 1. Protect Your Config File

**For Public Repositories:**
```bash
# Add to .gitignore:
src/firebase/config.js

# Create a template file:
cp src/firebase/config.js src/firebase/config.example.js
# Then remove real values from the example
```

### 2. Use Environment Variables (Production)

For production deployment, use environment variables:

```javascript
// vite.config.js
export default {
  define: {
    'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    // ... other config
  }
}

// .env.production
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
// ...
```

### 3. Review Security Rules Regularly

Test rules in Firebase Console:
1. Firestore → Rules → Rules Playground
2. Simulate read/write operations
3. Ensure only authorized users can access their data

---

## 📊 Monitoring & Analytics

### Enable Firebase Analytics (Optional)

1. Firebase Console → Project Settings → Integrations
2. Click **Google Analytics** → Link account
3. Automatic tracking of:
   - User sign-ins
   - Page views
   - Custom events

### Monitor Usage

1. Firebase Console → Usage and billing
2. Track:
   - Firestore reads/writes
   - Storage usage
   - Authentication users

**Free tier limits:**
- 50K reads/day
- 20K writes/day
- 1GB storage
- 10GB/month bandwidth

---

## 🚀 Next Steps

### Phase 2 Features (Optional)

1. **Email Notifications**
   - Set up Firebase Cloud Functions
   - Send reminder emails for upcoming deadlines
   - [Guide](https://firebase.google.com/docs/functions)

2. **Deploy to Production**
   ```bash
   npm run build
   firebase init hosting
   firebase deploy
   ```

3. **Enable App Check** (security)
   - Prevents abuse of Firebase resources
   - Firebase Console → Build → App Check

4. **Add Custom Domain**
   - Firebase Hosting → Add custom domain
   - Point DNS to Firebase

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Pricing](https://firebase.google.com/pricing)

---

## ✅ You're All Set!

Your FAR/BAR Deadline Calculator is now powered by Firebase with:
- ✅ Secure Google authentication
- ✅ Cloud database for saving calculations
- ✅ Real-time notifications
- ✅ PDF export functionality
- ✅ User dashboard

**Happy calculating! 🎉**
