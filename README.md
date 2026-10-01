# Trim & Twisted — Luxury Unisex Salon Platform

A luxury unisex salon web application featuring real-time appointment booking, 3D interactive salon suite, Twilio Comms email verification and transactional notifications, Twilio SMS alerts, dynamic pricing, and an admin CRM.

---

## 🌟 Key Features

- **3D Luxury Interactive Salon**: Three.js WebGL spatial showroom experience.
- **Smart Appointment Booking**: Dual-pool capacity management (`Haircut` vs `Salon Care`), zero-advance confirmation, instant calendar slot validation, waitlists, and promotional coupons.
- **Twilio Comms Email Verification & Alerts**:
  - Email verification OTP codes.
  - New login detected security alerts.
  - Instant order and booking confirmation receipts.
  - Scheduled appointment reminders.
  - Customer preference toggles in Profile.
- **Twilio SMS Notifications**: Automated booking confirmation & reminder SMS alerts with delivery status tracking.
- **Patron Portal & Dashboard**: View upcoming appointments, 1-tap reschedule/cancel, PDF appointment passes, loyalty points, and referral perks.
- **Comprehensive Admin CRM**: Calendar timeline, spreadsheet table view, walk-in appointment creator, staff salary register, service menu manager, and live Twilio gateway diagnostics.
- **Cloud Database**: Persistent multi-collection Firestore database with attribute-based security rules.

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and fill in your credentials:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | Local dev server port (default: `3000`) |
| `TWILIO_EMAIL_ACCOUNT_SID` | Twilio Account SID for Comms Emails API |
| `TWILIO_EMAIL_AUTH_TOKEN` | Twilio Auth Token for Comms Emails API |
| `TWILIO_EMAIL_FROM_ADDRESS` | Twilio verified sender address |
| `TWILIO_EMAIL_TRIAL_RECIPIENT` | Verified recipient for trial mode |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID for Programmable SMS |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token for Programmable SMS |
| `TWILIO_PHONE_NUMBER` | Twilio registered phone number |
| `TWILIO_TRIAL_MODE` | Set to `true` or `false` |

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 📦 Pushing to GitHub

To push this repository to your GitHub account:

```bash
# 1. Create a new empty repository on GitHub (e.g. trim-and-twisted)
# 2. Add your GitHub remote:
git remote add origin https://github.com/<your-username>/<your-repo-name>.git

# 3. Ensure branch is main:
git branch -M main

# 4. Push all code:
git push -u origin main
```

---

## 🔒 Security Best Practices

- **Never commit `.env`**: Actual secrets, passwords, and tokens are stored in `.env`, which is strictly ignored by `.gitignore`.
- **Environment Variables**: For production deployments (e.g. Vercel, Railway, Render), configure the environment variables in your hosting provider's dashboard settings.
