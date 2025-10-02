# GDPR Testing Guide

## 🧪 Complete Testing Checklist

This guide provides step-by-step instructions for testing all GDPR features in VoyageSmart.

---

## 🚀 Prerequisites

1. **Development Server Running**
   ```bash
   npm run dev
   ```

2. **Test User Account**
   - Create a test account for testing
   - Use a real email you can access (for email verification)

3. **Browser Tools**
   - Chrome DevTools (or equivalent)
   - Incognito/Private mode for fresh sessions

---

## 1️⃣ Cookie Consent Banner

### Test 1.1: First Visit
**Steps:**
1. Open app in incognito mode
2. Navigate to `http://localhost:3002`

**Expected Results:**
- ✅ Cookie consent banner appears at bottom of screen
- ✅ Banner shows "Cookie & Privacy Settings" title
- ✅ Banner has "Accept All" and "Reject Non-Essential" buttons
- ✅ Banner has "Customize Settings" link

### Test 1.2: Accept All
**Steps:**
1. Click "Accept All" button

**Expected Results:**
- ✅ Banner disappears
- ✅ Check localStorage:
  - `cookie-consent-given` = "true"
  - `consent-analytics` = "true"
  - `consent-marketing` = "true"
  - `consent-ai` = "true"

### Test 1.3: Reject Non-Essential
**Steps:**
1. Refresh page in incognito mode
2. Click "Reject Non-Essential" button

**Expected Results:**
- ✅ Banner disappears
- ✅ Check localStorage:
  - `cookie-consent-given` = "true"
  - `consent-analytics` = "false"
  - `consent-marketing` = "false"
  - `consent-ai` = "false"

### Test 1.4: Customize Settings
**Steps:**
1. Refresh page in incognito mode
2. Click "Customize Settings"
3. Toggle individual options
4. Click "Save Preferences"

**Expected Results:**
- ✅ Detailed settings view appears
- ✅ All toggle switches work
- ✅ "Necessary" is always active (cannot be disabled)
- ✅ Preferences are saved to localStorage
- ✅ Banner disappears after saving

### Test 1.5: Persistence
**Steps:**
1. Accept cookies
2. Close browser
3. Reopen and navigate to app

**Expected Results:**
- ✅ Cookie banner does NOT appear again
- ✅ Preferences are still in localStorage

---

## 2️⃣ Privacy Policy Page

### Test 2.1: Access Page
**Steps:**
1. Navigate to `http://localhost:3002/privacy-policy`

**Expected Results:**
- ✅ Page loads successfully
- ✅ "Privacy Policy" title is visible
- ✅ Last updated date is shown
- ✅ "Back to Home" link works
- ✅ All sections are visible and readable

### Test 2.2: Content Verification
**Check that page includes:**
- ✅ Introduction
- ✅ Information we collect
- ✅ How we use information
- ✅ Third-party services (with links)
- ✅ User rights (GDPR)
- ✅ Data security
- ✅ Data retention
- ✅ Contact information

### Test 2.3: Links
**Steps:**
1. Click all external links (third-party privacy policies)

**Expected Results:**
- ✅ All links open in new tab
- ✅ Links point to correct privacy policies:
  - Stripe: https://stripe.com/privacy
  - Mapbox: https://www.mapbox.com/legal/privacy
  - Supabase: https://supabase.com/privacy

### Test 2.4: Mobile Responsiveness
**Steps:**
1. Open DevTools
2. Toggle device toolbar
3. Test on different screen sizes

**Expected Results:**
- ✅ Page is readable on mobile
- ✅ No horizontal scrolling
- ✅ Text is properly sized
- ✅ Sections are well-organized

---

## 3️⃣ Terms of Service Page

### Test 3.1: Access Page
**Steps:**
1. Navigate to `http://localhost:3002/terms-of-service`

**Expected Results:**
- ✅ Page loads successfully
- ✅ "Terms of Service" title is visible
- ✅ Last updated date is shown
- ✅ All sections are visible

### Test 3.2: Content Verification
**Check that page includes:**
- ✅ Acceptance of terms
- ✅ Service description
- ✅ User accounts
- ✅ Subscription plans
- ✅ Payment and refunds
- ✅ User content
- ✅ AI features
- ✅ Privacy reference
- ✅ Limitation of liability
- ✅ Contact information

---

## 4️⃣ Cookie Policy Page

### Test 4.1: Access Page
**Steps:**
1. Navigate to `http://localhost:3002/cookie-policy`

**Expected Results:**
- ✅ Page loads successfully
- ✅ "Cookie Policy" title is visible
- ✅ Cookie types are clearly explained

### Test 4.2: Content Verification
**Check that page includes:**
- ✅ What are cookies
- ✅ Types of cookies (Necessary, Analytics, Functional, Marketing)
- ✅ Third-party cookies
- ✅ How to manage cookies
- ✅ Browser settings instructions

---

## 5️⃣ Privacy Settings Dashboard

### Test 5.1: Access Page
**Steps:**
1. Log in to the app
2. Navigate to `http://localhost:3002/profile/privacy`

**Expected Results:**
- ✅ Page loads successfully
- ✅ "Privacy & Data Settings" title is visible
- ✅ All sections are displayed

### Test 5.2: Consent Management
**Steps:**
1. Toggle each consent option
2. Check localStorage after each toggle

**Expected Results:**
- ✅ "Necessary" is always active (cannot be toggled)
- ✅ Analytics toggle works
- ✅ Marketing toggle works
- ✅ AI Processing toggle works
- ✅ Changes are saved immediately
- ✅ Toast notification appears on change
- ✅ localStorage is updated

### Test 5.3: Third-Party Services
**Steps:**
1. Scroll to "Third-Party Data Sharing" section

**Expected Results:**
- ✅ All services are listed:
  - Stripe
  - Google Gemini AI
  - OpenAI
  - Mapbox
  - Resend
  - Supabase
- ✅ Each service shows purpose
- ✅ Privacy policy links work

---

## 6️⃣ Data Export

### Test 6.1: Export Data
**Steps:**
1. Go to `/profile/privacy`
2. Click "Export My Data" button
3. Wait for download

**Expected Results:**
- ✅ Button shows "Exporting..." during process
- ✅ JSON file downloads automatically
- ✅ Filename format: `voyagesmart-data-[timestamp].json`
- ✅ Success toast appears

### Test 6.2: Verify Export Content
**Steps:**
1. Open downloaded JSON file
2. Verify structure

**Expected Results:**
- ✅ File is valid JSON
- ✅ Contains `exportDate`
- ✅ Contains `user` object with:
  - id, email, full_name, avatar_url, preferences, created_at, last_login
- ✅ Contains `trips` array
- ✅ Contains `expenses` array
- ✅ Contains `accommodations` array
- ✅ Contains `transportation` array
- ✅ Contains `activities` array
- ✅ Contains `subscriptions` array
- ✅ Contains `aiPreferences` array
- ✅ Contains `processingPurposes` array
- ✅ Contains `dataRetentionPeriod`
- ✅ Contains `thirdPartySharing` array

### Test 6.3: CSV Export (Optional)
**Steps:**
1. Modify URL to include `?format=csv`
2. Navigate to `/api/gdpr/export-data?format=csv`

**Expected Results:**
- ✅ CSV file downloads
- ✅ File is readable in Excel/Google Sheets
- ✅ Contains user data in tabular format

---

## 7️⃣ Account Deletion

### Test 7.1: Open Delete Dialog
**Steps:**
1. Go to `/profile/privacy`
2. Scroll to "Delete Account" section
3. Click "Delete My Account" button

**Expected Results:**
- ✅ Alert dialog appears
- ✅ Warning message is clear
- ✅ Lists what will be deleted
- ✅ Shows confirmation input
- ✅ Shows password input

### Test 7.2: Invalid Confirmation
**Steps:**
1. Type incorrect text in confirmation field
2. Enter password
3. Click "Delete Account"

**Expected Results:**
- ✅ Error toast appears
- ✅ Account is NOT deleted
- ✅ Dialog remains open

### Test 7.3: Invalid Password
**Steps:**
1. Type "DELETE MY ACCOUNT" correctly
2. Enter wrong password
3. Click "Delete Account"

**Expected Results:**
- ✅ Error toast appears: "Invalid password"
- ✅ Account is NOT deleted

### Test 7.4: Successful Deletion
**Steps:**
1. Type "DELETE MY ACCOUNT" correctly
2. Enter correct password
3. Click "Delete Account"
4. Wait for process to complete

**Expected Results:**
- ✅ Button shows "Deleting..." during process
- ✅ Success toast appears
- ✅ User is logged out
- ✅ Redirected to homepage
- ✅ Cannot log in with deleted account
- ✅ All user data is removed from database

**⚠️ Warning:** This is destructive! Use a test account.

---

## 8️⃣ Registration Consent Flow

### Test 8.1: Registration Page
**Steps:**
1. Navigate to `/register`
2. Scroll to consent checkboxes

**Expected Results:**
- ✅ Three checkboxes are visible:
  1. Terms of Service (required)
  2. Privacy Policy (required)
  3. Marketing consent (optional)
- ✅ Required checkboxes have red asterisk
- ✅ Links to legal pages work

### Test 8.2: Missing Required Consent
**Steps:**
1. Fill in registration form
2. Leave Terms checkbox unchecked
3. Try to submit

**Expected Results:**
- ✅ Error message: "You must accept the Terms of Service"
- ✅ Form does not submit

### Test 8.3: Successful Registration
**Steps:**
1. Fill in all fields
2. Check Terms and Privacy checkboxes
3. Optionally check Marketing checkbox
4. Submit form

**Expected Results:**
- ✅ Registration succeeds
- ✅ If marketing checked, `consent-marketing` is set in localStorage
- ✅ Redirected to login page

---

## 9️⃣ Footer Links

### Test 9.1: Footer Visibility
**Steps:**
1. Navigate to any page
2. Scroll to bottom

**Expected Results:**
- ✅ Footer is visible
- ✅ Contains four sections:
  - VoyageSmart
  - Legal
  - Your Privacy
  - Contact

### Test 9.2: Legal Links
**Steps:**
1. Click each link in "Legal" section

**Expected Results:**
- ✅ Privacy Policy link works
- ✅ Terms of Service link works
- ✅ Cookie Policy link works

### Test 9.3: Privacy Links
**Steps:**
1. Click "Privacy Settings" link
2. Click "Manage Cookies" button
3. Click "Export My Data" link

**Expected Results:**
- ✅ Privacy Settings opens `/profile/privacy`
- ✅ Manage Cookies clears consent and reloads page
- ✅ Cookie banner appears again after reload
- ✅ Export My Data opens `/profile/privacy`

### Test 9.4: Contact Links
**Steps:**
1. Click email links

**Expected Results:**
- ✅ Opens email client with correct address
- ✅ support@voyage-smart.app
- ✅ privacy@voyage-smart.app

---

## 🔟 API Endpoints

### Test 10.1: Export Data API
**Steps:**
```bash
# While logged in, get auth token from browser
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3002/api/gdpr/export-data
```

**Expected Results:**
- ✅ Returns 200 OK
- ✅ Returns JSON with user data
- ✅ Returns 401 if not authenticated

### Test 10.2: Delete Account API
**Steps:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"confirmation":"DELETE MY ACCOUNT","password":"test123"}' \
  http://localhost:3002/api/gdpr/delete-account
```

**Expected Results:**
- ✅ Returns 200 OK on success
- ✅ Returns 400 if confirmation is wrong
- ✅ Returns 401 if password is wrong
- ✅ Returns 401 if not authenticated

---

## ✅ Final Checklist

### Functionality
- [ ] Cookie consent banner works
- [ ] Privacy Policy page loads
- [ ] Terms of Service page loads
- [ ] Cookie Policy page loads
- [ ] Privacy Settings page works
- [ ] Data export downloads file
- [ ] Account deletion works
- [ ] Registration consent flow works
- [ ] Footer links work

### Content
- [ ] All legal pages have correct content
- [ ] Third-party services are listed
- [ ] Contact emails are correct
- [ ] Dates are current

### UX/UI
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Toast notifications work
- [ ] Loading states work
- [ ] Error messages are clear

### Security
- [ ] Password verification works
- [ ] Confirmation text required
- [ ] Authentication required for protected routes
- [ ] Data export only shows user's own data

---

## 🐛 Common Issues

### Issue: Cookie banner doesn't appear
**Solution:** Clear localStorage and refresh

### Issue: Data export fails
**Solution:** Check that user is logged in and has data

### Issue: Account deletion fails
**Solution:** Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Issue: Links don't work
**Solution:** Check that pages exist and routes are correct

---

## 📝 Test Report Template

```markdown
# GDPR Testing Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Development/Staging/Production]

## Test Results

### Cookie Consent: ✅ / ❌
- First visit: ✅ / ❌
- Accept all: ✅ / ❌
- Reject non-essential: ✅ / ❌
- Customize settings: ✅ / ❌

### Legal Pages: ✅ / ❌
- Privacy Policy: ✅ / ❌
- Terms of Service: ✅ / ❌
- Cookie Policy: ✅ / ❌

### Privacy Settings: ✅ / ❌
- Consent toggles: ✅ / ❌
- Third-party list: ✅ / ❌
- Data export: ✅ / ❌
- Account deletion: ✅ / ❌

### Issues Found:
1. [Issue description]
2. [Issue description]

### Overall Status: ✅ PASS / ❌ FAIL
```

---

**Happy Testing! 🧪**

