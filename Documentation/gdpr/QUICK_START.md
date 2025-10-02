# GDPR Quick Start Guide

## 🚀 For Developers

### What's Been Implemented

VoyageSmart now has full GDPR compliance with the following features:

1. **Cookie Consent Banner** - Appears on first visit
2. **Privacy Policy** - `/privacy-policy`
3. **Terms of Service** - `/terms-of-service`
4. **Cookie Policy** - `/cookie-policy`
5. **Privacy Settings** - `/profile/privacy`
6. **Data Export API** - `/api/gdpr/export-data`
7. **Account Deletion API** - `/api/gdpr/delete-account`

---

## 📦 New Dependencies

```json
{
  "react-cookie-consent": "^9.0.0",
  "json2csv": "^6.0.0",
  "jszip": "^3.10.1"
}
```

Already installed! ✅

---

## 🎯 Key Files

### Components
- `src/components/gdpr/CookieConsent.tsx` - Cookie consent banner
- `src/components/layout/Footer.tsx` - Footer with legal links

### Pages
- `src/app/privacy-policy/page.tsx` - Privacy policy
- `src/app/terms-of-service/page.tsx` - Terms of service
- `src/app/cookie-policy/page.tsx` - Cookie policy
- `src/app/profile/privacy/page.tsx` - Privacy settings dashboard

### Services
- `src/lib/services/gdprService.ts` - Core GDPR functionality

### API Routes
- `src/app/api/gdpr/export-data/route.ts` - Data export
- `src/app/api/gdpr/delete-account/route.ts` - Account deletion

---

## 🔧 How to Use

### Check User Consent

```typescript
import { hasConsent } from '@/lib/services/gdprService';

// Before using analytics
if (hasConsent('analytics')) {
  // Track analytics
}

// Before using AI features
if (hasConsent('aiProcessing')) {
  // Use AI features
}
```

### Update Consent Settings

```typescript
import { updateConsentSettings } from '@/lib/services/gdprService';

updateConsentSettings({
  analytics: true,
  marketing: false,
  aiProcessing: true,
});
```

### Export User Data

```typescript
// User clicks "Export Data" button
const response = await fetch('/api/gdpr/export-data');
const blob = await response.blob();
// Download file...
```

### Delete User Account

```typescript
const response = await fetch('/api/gdpr/delete-account', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    confirmation: 'DELETE MY ACCOUNT',
    password: userPassword,
  }),
});
```

---

## 🧪 Testing

### Test Cookie Consent
1. Open app in incognito mode
2. Cookie banner should appear
3. Try "Accept All" and "Reject Non-Essential"
4. Check localStorage for consent values

### Test Data Export
1. Log in as a user
2. Go to `/profile/privacy`
3. Click "Export My Data"
4. Verify JSON file downloads with all user data

### Test Account Deletion
1. Log in as a test user
2. Go to `/profile/privacy`
3. Click "Delete My Account"
4. Type "DELETE MY ACCOUNT" and enter password
5. Verify account is deleted and user is logged out

---

## 📝 Customization

### Update Privacy Policy

Edit `src/app/privacy-policy/page.tsx` to update:
- Company information
- Contact details
- Data processing purposes
- Third-party services

### Update Cookie Policy

Edit `src/app/cookie-policy/page.tsx` to update:
- Cookie types
- Cookie purposes
- Third-party cookies

### Add New Consent Type

1. Update `ConsentSettings` interface in `gdprService.ts`
2. Add new localStorage key
3. Update `CookieConsent.tsx` component
4. Update Privacy Settings page

---

## 🔒 Security Notes

### Account Deletion
- Requires password verification
- Requires explicit confirmation text
- Uses admin API for deletion
- Cascades to all related data

### Data Export
- Requires authentication
- Only exports user's own data
- Includes all related records
- Provides third-party disclosure

---

## 🌍 Localization

Currently in English. To add translations:

1. Create translation files for legal pages
2. Update `CookieConsent.tsx` with i18n
3. Update Privacy Settings page
4. Update Footer component

---

## 📞 Support

For GDPR-related questions:
- **Primary Contact:** info@voyage-smart.app
- **Support Page:** `/support`
- **Privacy:** privacy@voyage-smart.app (forwards to info@)
- **DPO:** dpo@voyage-smart.app (forwards to info@)
- **Support:** support@voyage-smart.app (forwards to info@)

---

## ✅ Pre-Launch Checklist

Before going live:

- [ ] Review and customize Privacy Policy
- [ ] Review and customize Terms of Service
- [ ] Review and customize Cookie Policy
- [ ] Test cookie consent flow
- [ ] Test data export
- [ ] Test account deletion
- [ ] Update contact emails
- [ ] Add DPO contact (if required)
- [ ] Review third-party services list
- [ ] Test on mobile devices
- [ ] Test in different browsers
- [ ] Verify all links work
- [ ] Check GDPR compliance with legal advisor

---

## 🚨 Important Notes

1. **Service Role Key Required:** Account deletion uses `supabase.auth.admin.deleteUser()` which requires the service role key. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables.

2. **Cascading Deletes:** Ensure all database tables have proper foreign key constraints with `ON DELETE CASCADE` to automatically delete related data.

3. **Data Retention:** Financial records (Stripe) are retained for 7 years as required by law, even after account deletion.

4. **Cookie Consent:** The banner appears only once. To test again, clear localStorage or use incognito mode.

5. **Email Verification:** Users must verify their email before full account access (Supabase default).

---

## 🔄 Next Steps

### Optional Enhancements

1. **Email Notifications:**
   - Send confirmation email after data export
   - Send confirmation email after account deletion
   - Notify user of privacy policy updates

2. **Audit Logging:**
   - Log all GDPR-related actions
   - Track consent changes
   - Monitor data access requests

3. **Advanced Features:**
   - Data anonymization (instead of deletion)
   - Automated data retention cleanup
   - GDPR request tracking system
   - Privacy impact assessments

4. **Compliance Tools:**
   - Cookie scanner integration
   - Privacy policy generator
   - Consent management platform
   - Data mapping tools

---

**Ready to go! 🎉**

All GDPR features are implemented and ready for production use.

