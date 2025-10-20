# Fase 4 - Admin Setup & Testing Guide

## 🎯 Goal

Complete the Quantia setup by:
1. Seeding your admin user & organization
2. Configuring Edge Function secrets
3. Activating frontend auth guards
4. Running sanity tests

**⏱️ Estimated Time:** 10 minutes

---

## ✅ Step 1: Seed Admin & Organization (3 min)

### **Run SQL Seed Script**

1. Open **Supabase Dashboard** → **SQL Editor**

2. **IMPORTANT:** Open the seed script and replace the email!
   ```
   File: supabase/migrations/20251018_seed_admin.sql
   ```

3. **Find and replace** all instances of `'your-email@domain.com'` with **your actual email**
   - This should be the email you use to login to Quantia
   - Example: `'john@quantia.com'`

4. Copy the entire SQL script

5. Paste into Supabase SQL Editor

6. Click **Run** ▶️

### **What This Does:**

```sql
-- Creates organization
INSERT INTO organizations (name, slug)
VALUES ('Quantia', 'quantia');

-- Makes you admin
INSERT INTO memberships (org_id, user_id, role)
SELECT o.id, u.id, 'admin'
FROM organizations o, auth.users u
WHERE o.slug='quantia' AND u.email='YOUR-EMAIL';

-- Creates consultant profile
INSERT INTO consultants (user_id, name, email)
SELECT u.id, 'Lead Consultant', u.email
FROM auth.users u
WHERE u.email='YOUR-EMAIL';
```

### **Verification:**

Run these queries in SQL Editor:

```sql
-- Check your membership
SELECT m.role, o.name as org_name, u.email
FROM memberships m
JOIN organizations o ON m.org_id = o.id
JOIN auth.users u ON m.user_id = u.id
WHERE u.email = 'YOUR-EMAIL';

-- Expected result:
-- role: 'admin'
-- org_name: 'Quantia'
-- email: your email
```

✅ **Success:** You should see your email with role='admin'

---

## 🔐 Step 2: Configure Edge Function Secrets (2 min)

### **Built-in Secrets** (Already Configured ✅)

These are **automatically available** in all Edge Functions:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

**You don't need to set these manually!**

### **Optional Secrets** (Configure if Needed)

#### **A) OpenAI API Key** (for GPT-4 Analysis)

**Function:** `quickscan-analyze`

**How to configure:**
1. Get API key: https://platform.openai.com/api-keys
2. Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `OPENAI_API_KEY`
5. Value: `sk-proj-xxxxxxxxxxxxx`
6. Save

#### **B) Resend API Key** (for Email Reports)

**Function:** `send-report-email`

**How to configure:**
1. Get API key: https://resend.com/api-keys
2. Supabase Dashboard → **Settings** → **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `RESEND_API_KEY`
5. Value: `re_xxxxxxxxxxxxx`
6. Save

**Note:** If you skip these, the related features will be disabled:
- Without OpenAI: Quickscans submit but no GPT-4 analysis
- Without Resend: Reports generate but no email delivery

---

## 🛡️ Step 3: Frontend Auth Guards (Already Implemented ✅)

The following routes are now protected:

### **Protected Routes:**

| Route | Access Level | Guard |
|-------|-------------|-------|
| `/consultants` | Admin + Consultant | `useRequireConsultant()` |
| `/consultant/:id` | Admin + Consultant | `useRequireConsultant()` |
| `/env` | Admin only | `useRequireAdmin()` |
| `/health` | Admin only | `useRequireAdmin()` |

### **How It Works:**

```typescript
// In ConsultantsPage.tsx
const { hasAccess, loading } = useRequireConsultant();

if (!hasAccess) {
  return <AccessDenied />; // Shows error screen
}

// Render page content...
```

### **Access Denied Screen:**

If a user without permission tries to access:
```
┌──────────────────────────────┐
│      🛡️ Access Denied        │
│                              │
│  You don't have permission   │
│  to access the Consultant    │
│  Portal. This area is        │
│  restricted to admin users   │
│  and consultants only.       │
│                              │
│    [Back to Dashboard]       │
└──────────────────────────────┘
```

---

## 🧪 Step 4: Quick Sanity Test (5 min)

### **Test 1: Admin Access** ✅

1. **Login** with your admin account
2. Check **Navbar** → Should see "Consultants" link
3. Click **Consultants**
4. **Expected:** Consultant Portal page loads
5. **Verify:** Can see KPIs, consultant list, add button

### **Test 2: Consultant Portal Features** ✅

1. Click **"Consultant toevoegen"** button
2. Fill in:
   - Email: test-consultant@quantia.com
   - Name: Test Consultant
3. Click **Opslaan**
4. **Expected:** Consultant appears in list
5. **Verify:** Can view consultant detail page

### **Test 3: Quickscan with Consultant ID** ✅

1. Navigate to **Quickscan** page
2. Fill out and submit a quickscan
3. Open **Supabase Dashboard** → **Table Editor** → `quickscan_responses`
4. Find your latest scan
5. **Verify:** `consultant_id` column is populated (not NULL)
6. **Expected:** consultant_id = your consultant.id

### **Test 4: Non-Admin User** ✅

1. Create a second test user account (or logout)
2. Register/Login with test account (no membership)
3. Try to access `/consultants` (type in URL manually)
4. **Expected:** "Access Denied" screen appears
5. **Verify:** Cannot see Consultants link in navbar

### **Test 5: Theme Toggle** ✅

1. Click **theme toggle** in navbar (Sun/Moon icon)
2. **Expected:** Instant switch between light/dark
3. Refresh page
4. **Verify:** Theme persisted (localStorage)
5. Navigate between pages
6. **Verify:** Theme consistent everywhere

### **Test 6: Landing Page** ✅

1. Navigate to `/landing`
2. **Expected:** Futuristic dark landing page
3. **Verify:**
   - Gradient Quantia logo
   - 3 feature cards
   - CTA buttons work
   - Responsive on mobile

---

## 📊 Verification Checklist

Run through this checklist to confirm everything is working:

- [ ] **Admin seeded:** Email appears in memberships table with role='admin'
- [ ] **Consultant created:** Your user has consultant record
- [ ] **Consultants page loads:** Can access /consultants route
- [ ] **Can add consultants:** Modal works, new consultants save
- [ ] **Can assign scans:** "Scans toewijzen" button works
- [ ] **Quickscans have consultant_id:** New scans link to consultant
- [ ] **Non-admin blocked:** Test user sees "Access Denied"
- [ ] **Theme toggle works:** Light ↔ Dark switching
- [ ] **Landing page live:** /landing route accessible
- [ ] **Navbar updated:** Shows Quantia branding

---

## 🐛 Troubleshooting

### **Problem:** Can't access Consultants page

**Solution:**
1. Check memberships table: `SELECT * FROM memberships WHERE user_id = 'YOUR_USER_ID'`
2. Verify role is 'admin' or you have consultant record
3. Clear browser cache and re-login

### **Problem:** consultant_id is NULL on new quickscans

**Solution:**
1. Check consultants table: `SELECT * FROM consultants WHERE user_id = 'YOUR_USER_ID'`
2. If no record, run seed script again
3. Verify trigger is active: `SELECT * FROM pg_trigger WHERE tgname = 'set_consultant_id_trigger'`

### **Problem:** "Access Denied" for admin user

**Solution:**
1. Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check browser console for errors
3. Verify `useRole()` hook is fetching correctly
4. Re-run seed script

### **Problem:** Edge Functions failing

**Solution:**
1. Check function logs: Supabase Dashboard → Edge Functions → Logs
2. Verify secrets are set: Settings → Edge Functions → Secrets
3. Redeploy function if needed
4. Check CORS headers in function response

---

## 🎉 Success Criteria

**You're all set when:**

✅ Login as admin → see Consultants link
✅ Can access /consultants route
✅ Can add new consultants
✅ Can assign quickscans to consultants
✅ New quickscans have consultant_id populated
✅ Test user (no membership) sees "Access Denied"
✅ Theme toggle works everywhere
✅ Landing page looks beautiful

---

## 📈 Next Steps

Now that Fase 4 is complete, you can:

1. **Add more consultants:**
   - Use the "Consultant toevoegen" button
   - Or run SQL INSERT for bulk import

2. **Test real quickscan flow:**
   - Submit quickscan as admin
   - Assign to consultant
   - Consultant logs in → sees their scans

3. **Configure optional features:**
   - Set OPENAI_API_KEY for GPT-4 analysis
   - Set RESEND_API_KEY for email reports

4. **Customize branding:**
   - Update `src/lib/brand.ts` colors
   - Modify landing page copy
   - Add your logo

5. **Deploy to production:**
   - Build: `npm run build`
   - Deploy to Vercel/Netlify
   - Point domain to deployment

---

## 📚 Related Documentation

- **Seed Script:** `supabase/migrations/20251018_seed_admin.sql`
- **Edge Functions Secrets:** `EDGE_FUNCTIONS_SECRETS.md`
- **Auth Guards:** `src/hooks/useRole.ts`
- **Theme System:** `README.md` (Theme System section)
- **Landing Page:** `src/pages/LandingPage.tsx`

---

## 🚀 Quantia is Ready!

**Congratulations!** Your Quantia platform is now:

- ✨ Fully branded
- 🌓 Theme-switchable
- 👥 Multi-tenant ready
- 🛡️ Access-controlled
- 📊 Admin-managed
- 🎨 Production-ready

**Enjoy building with Quantia! 🎉**
