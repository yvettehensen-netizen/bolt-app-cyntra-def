# Pre-Launch Checklist - Quantia Platform

## 🎯 Doel
Volledige verificatie dat alle systemen operationeel zijn voordat je live gaat.

---

## ✅ 1. Secrets Configuration

### **A. Frontend Secrets (Bolt → Project Settings → Secrets)**

**REQUIRED:**
```bash
✓ VITE_SUPABASE_URL=https://ynqdybfppcwkuxalsidt.supabase.co
✓ VITE_SUPABASE_ANON_KEY=eyJhbGci...
✓ VITE_BILLING_PROVIDER=stripe
✓ VITE_STRIPE_PUBLISHABLE_KEY=pk_test_... (of pk_live_ voor prod)
```

**OPTIONAL:**
```bash
□ VITE_OPENAI_API_KEY=sk-proj-... (voor AI-analyse)
□ VITE_RESEND_API_KEY=re_... (voor email via Resend)
□ VITE_EMAIL_FROM=noreply@yourdomain.com
```

**Verificatie:**
- Open Bolt → Project Settings → Secrets
- Check dat alle VITE_ variabelen zichtbaar zijn
- Klik "Save" na elke wijziging
- Herstart Preview

---

### **B. Edge Function Secrets (Supabase Dashboard)**

Ga naar: **Supabase Dashboard → Edge Functions → Settings → Environment Variables**

**REQUIRED voor Billing:**
```bash
✓ STRIPE_SECRET_KEY=sk_test_... (backend secret key)
✓ STRIPE_PRICE_REPORT=price_... (Single Report product)
✓ STRIPE_PRICE_CONSULTANT=price_... (Consultant subscription)
✓ STRIPE_WEBHOOK_SECRET=whsec_... (webhook signing)
✓ APP_BASE_URL=https://your-app.bolt.new (of prod URL)
✓ FREE_MONTHLY_LIMIT=3
✓ ONEOFF_REPORT_CREDITS=1
```

**AUTO-CONFIGURED:**
```bash
✓ SUPABASE_URL (auto)
✓ SUPABASE_SERVICE_ROLE_KEY (auto)
✓ SUPABASE_ANON_KEY (auto)
```

**OPTIONAL:**
```bash
□ RESEND_API_KEY=re_... (voor edge function emails)
□ OPENAI_API_KEY=sk-proj-... (voor server-side AI)
```

**Verificatie:**
```bash
# Check dat secrets aanwezig zijn
# Supabase Dashboard → Edge Functions → Settings → Env Variables
# Na wijziging: geen herstart nodig, direct actief
```

---

## ✅ 2. Stripe Test Mode Setup

### **A. Products & Prices aanmaken**

**Ga naar Stripe Dashboard → Products:**

**Product 1: Single Report**
```
Naam: Single Report
Beschrijving: Eenmalig quickscan rapport
Prijs: €49.00
Type: One-time payment
```

**Stappen:**
1. Klik "Create product"
2. Naam: "Single Report"
3. Add pricing → €49.00 → One-time
4. Create product
5. **Kopieer Price ID** (begint met `price_`)
6. Plak in: `STRIPE_PRICE_REPORT`

**Product 2: Consultant Subscription**
```
Naam: Consultant Subscription
Beschrijving: Maandelijks abonnement met onbeperkte quickscans
Prijs: €199.00/maand
Type: Recurring (monthly)
```

**Stappen:**
1. Klik "Create product"
2. Naam: "Consultant Subscription"
3. Add pricing → €199.00 → Recurring (monthly)
4. Create product
5. **Kopieer Price ID** (begint met `price_`)
6. Plak in: `STRIPE_PRICE_CONSULTANT`

---

### **B. API Keys ophalen**

**Ga naar Stripe Dashboard → Developers → API Keys:**

1. **Publishable key** (voor frontend)
   ```
   pk_test_51... (test mode)
   pk_live_51... (production mode)
   ```
   → Plak in: `VITE_STRIPE_PUBLISHABLE_KEY`

2. **Secret key** (voor backend)
   ```
   sk_test_51... (test mode)
   sk_live_51... (production mode)
   ```
   → Plak in: `STRIPE_SECRET_KEY` (Supabase Edge Functions)

---

### **C. Webhook Endpoint configureren**

**Ga naar Stripe Dashboard → Developers → Webhooks:**

**Stap 1: Add endpoint**
```
URL: https://ynqdybfppcwkuxalsidt.supabase.co/functions/v1/billing-webhook
```

**Stap 2: Select events**
```
✓ checkout.session.completed
✓ customer.subscription.updated
✓ customer.subscription.deleted
✓ invoice.payment_failed
✓ charge.refunded
```

**Stap 3: Kopieer Signing Secret**
```
whsec_...
```
→ Plak in: `STRIPE_WEBHOOK_SECRET` (Supabase Edge Functions)

**Verificatie:**
```bash
# Test webhook
curl -X POST https://ynqdybfppcwkuxalsidt.supabase.co/functions/v1/billing-webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 400 (no signature) - dit is OK!
# Betekent endpoint is bereikbaar
```

---

## ✅ 3. Database Sanity Check

### **A. Tables verificatie**

**Ga naar Supabase Dashboard → Table Editor:**

**Core Tables:**
```sql
✓ users (via auth.users)
✓ organizations
✓ memberships
✓ consultants
✓ quickscan_responses
✓ pending_invites
```

**Billing Tables:**
```sql
✓ purchases
✓ subscriptions
✓ usage_credits
✓ report_usage_log
```

**Views:**
```sql
✓ v_entitlements
```

**Test query:**
```sql
-- Check if tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

### **B. RLS Policies Check**

**Ga naar Supabase Dashboard → Authentication → Policies:**

**Verify RLS is enabled voor:**
```sql
✓ organizations (RLS ON)
✓ memberships (RLS ON)
✓ consultants (RLS ON)
✓ quickscan_responses (RLS ON)
✓ purchases (RLS ON)
✓ subscriptions (RLS ON)
✓ usage_credits (RLS ON)
✓ report_usage_log (RLS ON)
✓ pending_invites (RLS ON)
```

**Test RLS:**
```sql
-- Als authenticated user
SELECT * FROM purchases; -- Should only show own purchases
SELECT * FROM subscriptions; -- Should only show own subscriptions
SELECT * FROM usage_credits; -- Should only show own credits
```

---

### **C. Functions Check**

**Verify functions exist:**
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';
```

**Expected:**
```sql
✓ reset_monthly_free_usage()
✓ init_usage_credits(uuid)
```

---

## ✅ 4. Edge Functions Deployment Check

**Ga naar Supabase Dashboard → Edge Functions:**

**Verify all functions deployed:**
```
✓ admin-assign-role
✓ admin-list-users
✓ billing-checkout
✓ billing-claim-usage
✓ billing-entitlement
✓ billing-webhook
✓ consultants-manage
✓ me
✓ post-signup
✓ quickscan-analyze
✓ quickscan-submit
✓ send-invite
✓ send-report-email
```

**Test critical functions:**

1. **Test /me:**
```bash
curl https://ynqdybfppcwkuxalsidt.supabase.co/functions/v1/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: { "role": "admin" | "consultant" | "client" }
```

2. **Test billing-entitlement:**
```bash
curl https://ynqdybfppcwkuxalsidt.supabase.co/functions/v1/billing-entitlement \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected: { "canCreate": true/false, "entitlements": {...} }
```

---

## ✅ 5. Frontend Environment Check

**Open app → Navigate to `/env` page**

**Check status indicators:**

**GREEN (OK):**
```
✓ Supabase URL configured
✓ Supabase Anon Key configured
✓ Stripe Publishable Key configured
✓ Billing Provider set to 'stripe'
```

**YELLOW (Optional - OK if not needed):**
```
~ OpenAI API Key (falls back to mock analysis)
~ Resend API Key (falls back to Supabase email)
```

**RED (BLOCKER):**
```
✗ Supabase URL missing → ADD NOW!
✗ Supabase Anon Key missing → ADD NOW!
✗ Stripe key missing → ADD NOW!
```

---

## ✅ 6. Admin Setup Verification

### **A. Admin user exists**

```sql
-- Check admin user
SELECT
  u.email,
  m.role,
  o.slug
FROM auth.users u
LEFT JOIN memberships m ON m.user_id = u.id
LEFT JOIN organizations o ON o.id = m.org_id
WHERE m.role = 'admin';
```

**Expected:**
- At least 1 admin user
- Role = 'admin'
- org_slug = 'quantia' (or your org)

**If no admin:**
```sql
-- Run admin seed migration again
-- File: supabase/migrations/20251018120000_seed_admin_with_do_block.sql
```

---

### **B. Test admin access**

1. Login as admin user
2. Navigate to `/admin-users`
3. Should see "Admin Users" page
4. Should NOT see "Access Denied"

---

## ✅ 7. Complete User Flow Test

### **Test A: Admin Invite Flow**

**Steps:**
1. Login as admin
2. Go to `/admin-users`
3. Fill invite form:
   ```
   Email: test@example.com
   Role: consultant
   Org: quantia
   ```
4. Click "Invite"

**Expected:**
- ✓ Success toast
- ✓ Email sent (check inbox or Resend/Supabase logs)
- ✓ Check database:
  ```sql
  SELECT * FROM pending_invites WHERE email = 'test@example.com';
  ```

5. Click magic link in email
6. Auto-login
7. Post-signup hook runs

**Verify:**
```sql
-- Membership created
SELECT * FROM memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');

-- Consultant record created
SELECT * FROM consultants WHERE email = 'test@example.com';

-- Pending invite removed
SELECT * FROM pending_invites WHERE email = 'test@example.com';
-- Should be empty!
```

---

### **Test B: Quickscan & Paywall Flow**

**Setup:**
```sql
-- Set low limit for testing
-- In Edge Function secrets: FREE_MONTHLY_LIMIT=1
```

**Steps:**

1. **Make first quickscan (free):**
   - Go to `/quickscan`
   - Fill form
   - Submit
   - ✓ Should work (uses free tier)

2. **Try second quickscan:**
   - Go to `/quickscan`
   - Fill form
   - Submit
   - ✓ Paywall Modal should appear
   - ✓ Shows "Je hebt je 1 gratis quickscans gebruikt"

3. **Purchase single report:**
   - Click "Koop nu" (€49)
   - Redirects to Stripe Checkout
   - Use test card:
     ```
     Card: 4242 4242 4242 4242
     Exp: 12/34
     CVC: 123
     Postcode: 1234 AB
     ```
   - Click "Pay"
   - Redirects to `/billing/return?success=true`
   - ✓ Shows success message

4. **Verify credit added:**
   ```sql
   SELECT * FROM usage_credits
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   -- Should have oneoff_credits = 1
   ```

5. **Make quickscan with credit:**
   - Go to `/quickscan`
   - Fill form
   - Submit
   - ✓ Should work (uses credit)
   - After generation:
     ```sql
     SELECT * FROM usage_credits WHERE user_id = '...';
     -- Should have oneoff_credits = 0

     SELECT * FROM report_usage_log WHERE user_id = '...';
     -- Should have entry with source='oneoff'
     ```

---

### **Test C: Subscription Flow**

**Steps:**

1. **Start subscription:**
   - Go to `/billing`
   - Click "Start abonnement" (€199/m)
   - Redirects to Stripe Checkout
   - Use test card: 4242...
   - Pay
   - Redirects to `/billing/return?success=true`

2. **Verify subscription:**
   ```sql
   SELECT * FROM subscriptions
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   -- Should have status='active'
   ```

3. **Check entitlement:**
   ```sql
   SELECT * FROM v_entitlements
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com');
   -- Should have has_subscription=true
   ```

4. **Make unlimited quickscans:**
   - Make 10+ quickscans
   - ✓ No paywall
   - ✓ All succeed

5. **Check usage logs:**
   ```sql
   SELECT source, COUNT(*)
   FROM report_usage_log
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'test@example.com')
   GROUP BY source;
   -- Should show many 'subscription' entries
   ```

---

### **Test D: Webhook Processing**

**Setup: Use Stripe CLI (optional)**
```bash
stripe listen --forward-to https://ynqdybfppcwkuxalsidt.supabase.co/functions/v1/billing-webhook
```

**Test events:**
```bash
# Test successful payment
stripe trigger checkout.session.completed

# Test subscription update
stripe trigger customer.subscription.updated

# Test failed payment
stripe trigger invoice.payment_failed

# Test refund
stripe trigger charge.refunded
```

**Verify in logs:**
- Supabase → Edge Functions → billing-webhook → Logs
- Check processing messages

---

## ✅ 8. Performance & Monitoring

### **A. Build Check**

```bash
npm run build

# Expected output:
✓ 2667 modules transformed
✓ built in ~15s
dist/index.js: 2,266.90 kB (gzip: 716.26 kB)
```

**Status:** ✅ Build succeeds

---

### **B. Database Monitoring**

**Setup monitoring queries:**

```sql
-- Active subscriptions
SELECT COUNT(*) as active_subs
FROM subscriptions
WHERE status = 'active';

-- Total revenue (test mode)
SELECT SUM(amount_cents) / 100.0 as total_eur
FROM purchases
WHERE status = 'paid';

-- Usage by source
SELECT source, COUNT(*) as count
FROM report_usage_log
GROUP BY source;

-- Free tier usage
SELECT
  COUNT(*) as users,
  AVG(free_monthly_used) as avg_used,
  MAX(free_monthly_used) as max_used
FROM usage_credits;
```

---

### **C. Error Monitoring**

**Check for errors:**

1. **Supabase Logs:**
   - Dashboard → Logs → Edge Functions
   - Look for 5xx errors
   - Look for "Error:" messages

2. **Browser Console:**
   - Open DevTools → Console
   - Look for red errors
   - Verify no CORS issues

3. **Network Tab:**
   - Check failed requests
   - Verify 2xx responses on API calls

---

## ✅ 9. Security Audit

### **Checklist:**

**Authentication:**
```
✓ JWT tokens required for protected endpoints
✓ RLS enabled on all user data tables
✓ Service role only in edge functions
✓ No secrets exposed in client code
✓ CORS properly configured
```

**Billing:**
```
✓ Webhook signature verification
✓ Stripe secret key only in edge functions
✓ Publishable key safe to expose
✓ No price tampering possible (server-side)
✓ User can only see own purchases/subscriptions
```

**Data Access:**
```
✓ Users can only see own data (RLS)
✓ Admin role verified via edge function
✓ Consultant isolation working
✓ No leaked PII in logs
```

---

## ✅ 10. Documentation Check

**Verify docs exist:**
```
✓ README.md - Project overview
✓ ENV_SETUP.md - Environment setup
✓ DATABASE_SETUP.md - Database details
✓ ADMIN_SETUP_COMPLETE.md - Admin setup
✓ ADMIN_USER_MANAGEMENT.md - User management
✓ INVITE_EMAIL_SETUP.md - Email invites
✓ POST_SIGNUP_HOOK.md - Auto role linking
✓ BILLING_MONETIZATION.md - Complete billing guide
✓ PRE_LAUNCH_CHECKLIST.md - This checklist
✓ .env.example - All required variables
```

---

## ✅ 11. Final Pre-Launch Steps

### **Before going live:**

1. **Switch to Production Stripe:**
   ```bash
   # Replace test keys with live keys
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...

   # Keep same price IDs (or create new live prices)
   ```

2. **Set Production URL:**
   ```bash
   APP_BASE_URL=https://yourdomain.com
   ```

3. **Configure Custom Domain:**
   - Point domain to Bolt app
   - Update Stripe webhook URL
   - Update APP_BASE_URL

4. **Enable Production Mode:**
   ```bash
   # Remove test mode notices from UI
   # Update .env: TEST_MODE_ENABLED=false
   ```

5. **Final Security Review:**
   - Rotate any exposed keys
   - Review RLS policies
   - Check audit logs
   - Verify backups enabled

6. **Communication:**
   - Update terms of service
   - Privacy policy updated
   - Support email configured
   - Status page ready

---

## 🚨 Common Issues & Fixes

### **Issue: "No credits added after payment"**

**Check:**
```sql
SELECT * FROM purchases WHERE status = 'created';
-- If stuck in 'created': webhook didn't fire
```

**Fix:**
1. Check webhook logs in Stripe
2. Verify STRIPE_WEBHOOK_SECRET matches
3. Manually trigger webhook in Stripe Dashboard
4. Or manually add credits:
   ```sql
   UPDATE usage_credits
   SET oneoff_credits = oneoff_credits + 1
   WHERE user_id = 'user-id';
   ```

---

### **Issue: "Paywall not showing"**

**Check:**
```sql
SELECT * FROM usage_credits WHERE user_id = 'user-id';
```

**Fix:**
- Verify FREE_MONTHLY_LIMIT is set
- Check billing-entitlement response in DevTools
- Reset free usage:
  ```sql
  UPDATE usage_credits SET free_monthly_used = 3 WHERE user_id = 'user-id';
  ```

---

### **Issue: "Admin access denied"**

**Check:**
```sql
SELECT * FROM memberships WHERE user_id = 'user-id';
```

**Fix:**
```sql
-- Manually set admin role
UPDATE memberships
SET role = 'admin'
WHERE user_id = 'user-id';
```

---

### **Issue: "Invite email not received"**

**Check:**
1. Resend logs (if using Resend)
2. Supabase Auth logs
3. pending_invites table

**Fix:**
- Check RESEND_API_KEY or use Supabase fallback
- Verify email address correct
- Check spam folder
- Manual invite:
  ```sql
  INSERT INTO pending_invites (email, role, org_slug)
  VALUES ('user@example.com', 'consultant', 'quantia');
  ```

---

## 🎯 Launch Readiness Score

Calculate your readiness:

**Required (Must be 100%):**
- [ ] Supabase connected & tables exist
- [ ] All edge functions deployed
- [ ] Stripe test mode working
- [ ] Admin user exists & can login
- [ ] Invite flow works end-to-end
- [ ] Quickscan flow works
- [ ] Paywall triggers correctly
- [ ] Single purchase works
- [ ] Subscription works
- [ ] Webhook processes payments
- [ ] Credits added automatically
- [ ] Usage tracked correctly
- [ ] RLS policies enforced
- [ ] No console errors
- [ ] Build succeeds

**Score: ___/15 Required**

**Optional (Nice to have):**
- [ ] OpenAI API configured
- [ ] Resend email configured
- [ ] Custom domain
- [ ] Production Stripe keys
- [ ] Monitoring setup
- [ ] Backup strategy
- [ ] Support email

**Score: ___/7 Optional**

---

## ✅ Ready to Launch?

**Minimum requirements:**
- ✅ 15/15 Required items
- ✅ At least 1 successful end-to-end test
- ✅ No blocking errors in logs
- ✅ Documentation complete

**You're ready when:**
1. All tests pass
2. Admin can invite users
3. Users can make quickscans
4. Paywall works
5. Payments process correctly
6. Credits/subscriptions work

**Final check:**
```bash
# Run build
npm run build

# Should succeed without errors
✓ built in ~15s
```

---

## 🎊 Post-Launch Monitoring

**First 24 hours:**
- Monitor Stripe Dashboard for payments
- Check Supabase logs for errors
- Watch usage_credits table
- Verify webhooks processing
- Check user feedback
- Monitor performance

**First week:**
- Review conversion rates
- Check quota limits adequate
- Monitor support requests
- Verify billing accuracy
- Check for edge cases
- Update docs based on feedback

---

**STATUS:** ✅ Platform ready for testing

**NEXT STEP:** Complete this checklist systematically

**SUPPORT:** Check individual docs for detailed troubleshooting

**Good luck! 🚀**
