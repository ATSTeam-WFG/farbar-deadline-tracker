# FAR/BAR Contract Deadline Tracker

A professional deadline tracking application for Florida title professionals handling FAR/BAR Standard Residential Contracts.

---

## 🎯 Features

### Core Functionality
- **Accurate Deadline Calculation** - Based on FAR/BAR Standard Residential Contract (Rev.12/24)
- **Business Day Adjustments** - Automatic weekend/holiday handling per STANDARD F
- **Two Input Methods** - Manual entry or PDF upload (contract parsing)
- **Comprehensive Coverage** - All critical deadlines from effective date to closing

### Authentication & User Management
- **Google Sign-In** - Secure authentication via Firebase
- **User Profiles** - Display user avatar and name
- **Session Management** - Automatic sign-in persistence

### Data Management
- **Save Calculations** - Store unlimited calculation sessions to cloud
- **Calculation History** - View all past calculations in dashboard
- **Quick Load** - One-click reload of previous calculations
- **Search & Filter** - Find calculations by property address

### Notifications
- **In-App Alerts** - Real-time notifications for urgent deadlines
- **Smart Filtering** - Shows only deadlines within next 7 days
- **Visual Indicators** - Color-coded urgency levels (critical, urgent, warning)

### Export & Sharing
- **PDF Export** - Professional branded PDF reports
- **Print-Optimized** - Clean print layout for physical copies
- **Email-Ready** - Shareable calculation results

---

## 🏗️ Tech Stack

- **Frontend:** React 19.2 + Vite 7.2
- **Authentication:** Firebase Auth (Google Sign-In)
- **Database:** Cloud Firestore (NoSQL)
- **PDF Generation:** jsPDF + jsPDF-AutoTable
- **Date Handling:** date-fns
- **Styling:** Custom CSS with CSS Variables

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- Google account (for Firebase)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up Firebase:**
   - Follow the detailed guide in `FIREBASE_SETUP.md`
   - Create a Firebase project
   - Enable Google Authentication
   - Create Firestore database
   - Update `src/firebase/config.js` with your credentials

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   - Navigate to http://localhost:5174
   - Sign in with Google
   - Start calculating deadlines!

---

## 📖 Usage Guide

### Manual Entry
1. Click "Manual Entry" tab
2. Fill in contract details
3. Click "Calculate Deadlines"
4. Save, Export PDF, or Print

### Managing Saved Calculations
1. Click "My Calculations" in header
2. View all saved sessions
3. Click any calculation to reload it
4. Delete unwanted calculations

---

## 🎨 Branding

### Color Palette
- **Gold Accent:** #c4a574
- **Dark:** #1a1a1a
- **Typography:** Montserrat

---

## 🔒 Security

Users can only access their own calculation sessions via Firestore security rules.

---

## 🚢 Deployment

See `FIREBASE_SETUP.md` for Firebase Hosting deployment instructions.

---

**Built with ❤️ for Florida Title Professionals**

**Version:** 1.0.0
