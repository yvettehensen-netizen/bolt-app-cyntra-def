# Billing & Stripe - Test Guide & Validation

## 🎯 Complete Test Flow

### Prerequisites

**1. Secrets Configured:**
```bash
✅ APP_BASE_URL = https://your-app.bolt.new (exact URL)
✅ STRIPE_PUBLISHABLE_KEY = pk_test_...
✅ STRIPE_SECRET_KEY = sk_test_...
✅ WEBHOOK_SECRET_STRIPE = whsec_...
✅ FREE_MONTHLY_LIMIT = 1 (for testing)
```

**2. Stripe Webhook Setup:**
```
Endpoint: https://your-app.bolt.new/functions/v1/billing-webhook

Events:
✅ checkout.session.completed
✅ customer.subscription.updated
✅ invoice.paid
✅ invoice.payment_failed
✅ charge.refunded

Status: Active
```

---

## 🧪 Test 1: Free Limit & Paywall

### Step 1: Fresh Start
```sql
-- Clear test data (if needed)
DELETE FROM report_usage_log WHERE user_id = '<your_user_id>';
DELETE FROM usage_credits WHERE user_id = '<your_user_id>';
DELETE FROM purchases WHERE user_id = '<your_user_id>';
DELETE FROM subscriptions WHERE user_id = '<your_user_id>';
```

### Step 2: First Free Quickscan
```
1. Log in with test account
2. Navigate to /quickscan
3. Fill form and submit
4. ✅ Should work (1/1 free used)
```

**Validate:**
```sql
-- Check usage
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: free_used = 1, free_limit = 1

SELECT * FROM report_usage_log
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected: source = 'free'
```

### Step 3: Second Quickscan → Paywall
```
1. Navigate to /quickscan
2. Try to submit
3. ✅ Paywall modal should appear
4. Message: "Je hebt je gratis limiet bereikt"
```

**Validate:**
```sql
-- Check entitlement
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: can_create_report = false
```

---

## 🧪 Test 2: Single Report Purchase

### Step 1: Start Checkout
```
1. On paywall modal, click "Koop 1 rapport (€9.99)"
   OR
   Go to /billing, click "Koop 1 rapport"
2. ✅ Redirects to Stripe Checkout
3. URL should be: checkout.stripe.com/...
```

### Step 2: Complete Payment
```
Test Card: 4242 4242 4242 4242
Expiry: 12/34
CVC: 123
Name: Test User

1. Fill payment details
2. Click "Pay"
3. ✅ Redirects to /billing/return?success=true
4. Success message appears
```

### Step 3: Webhook Processing
```
⏱️ Wait 2-5 seconds for webhook

Check Stripe Dashboard:
- Webhooks → Recent Events
- Should see: checkout.session.completed
- Status: 200 OK
```

**Validate:**
```sql
-- Check credits
SELECT * FROM usage_credits
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC;
-- Expected: 1 row, credits_remaining = 1

-- Check purchase
SELECT * FROM purchases
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected: product_type = 'single', stripe_session_id = 'cs_test_...'

-- Check entitlement
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: paid_credits = 1, can_create_report = true
```

### Step 4: Use Credit
```
1. Navigate to /quickscan
2. Fill form and submit
3. ✅ Should work (using paid credit)
4. No paywall shown
```

**Validate:**
```sql
-- Check usage
SELECT * FROM report_usage_log
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected: source = 'paid'

-- Check credits
SELECT * FROM usage_credits
WHERE user_id = '<your_user_id>';
-- Expected: credits_remaining = 0

-- Check entitlement
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: paid_credits = 0, can_create_report = false
```

---

## 🧪 Test 3: Subscription

### Step 1: Start Subscription Checkout
```
1. Go to /billing
2. Click "Start abonnement (€29.99/maand)"
3. ✅ Redirects to Stripe Checkout
4. Shows subscription details
```

### Step 2: Complete Payment
```
Test Card: 4242 4242 4242 4242

1. Fill payment details
2. Click "Subscribe"
3. ✅ Redirects to /billing/return?success=true
```

### Step 3: Webhook Processing
```
⏱️ Wait 2-5 seconds

Events to watch:
1. checkout.session.completed
2. customer.subscription.updated
3. invoice.paid
```

**Validate:**
```sql
-- Check subscription
SELECT * FROM subscriptions
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected:
--   status = 'active'
--   stripe_subscription_id = 'sub_...'
--   current_period_end > now()

-- Check entitlement
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected:
--   has_subscription = true
--   can_create_report = true
```

### Step 4: Unlimited Access
```
1. Navigate to /quickscan
2. Create multiple reports (3-5)
3. ✅ No paywall should appear
4. All reports work
```

**Validate:**
```sql
-- Check usage
SELECT source, COUNT(*) as count
FROM report_usage_log
WHERE user_id = '<your_user_id>'
GROUP BY source;
-- Expected: source = 'subscription', count > 1

-- Subscription still active
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: has_subscription = true, can_create_report = true
```

---

## 🧪 Test 4: Subscription Management

### Cancel Subscription
```
Stripe Dashboard:
1. Customers → Find test customer
2. Subscriptions → Click active subscription
3. Click "Cancel subscription"
4. Choose: "Cancel immediately"

⏱️ Wait 2-5 seconds for webhook
```

**Validate:**
```sql
-- Check subscription status
SELECT * FROM subscriptions
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = 'canceled', canceled_at IS NOT NULL

-- Check entitlement
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: has_subscription = false, can_create_report = false
```

### Pause Subscription
```
Stripe Dashboard:
1. Subscriptions → Click active subscription
2. Actions → Pause subscription
3. Set pause date

⏱️ Wait for webhook
```

**Validate:**
```sql
-- Status should update
SELECT status FROM subscriptions
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
-- Expected: status = 'paused'
```

---

## 📊 Essential Validation Queries

### 1. User Entitlements Overview
```sql
SELECT
  user_id,
  free_limit,
  free_used,
  paid_credits,
  has_subscription,
  can_create_report,
  total_reports_created
FROM v_entitlements
WHERE user_id = '<your_user_id>';
```

**Expected after full test:**
```
free_limit: 1
free_used: 1
paid_credits: 0 (used the 1 credit)
has_subscription: true (or false if canceled)
can_create_report: true (if sub active) or false
total_reports_created: 5-10
```

---

### 2. Credits History
```sql
SELECT
  credits_granted,
  credits_remaining,
  source,
  stripe_session_id,
  created_at
FROM usage_credits
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC;
```

**Expected:**
```
Row 1: credits_granted = 1, credits_remaining = 0, source = 'single'
```

---

### 3. Usage Log
```sql
SELECT
  source,
  COUNT(*) as count,
  MIN(created_at) as first_use,
  MAX(created_at) as last_use
FROM report_usage_log
WHERE user_id = '<your_user_id>'
GROUP BY source
ORDER BY count DESC;
```

**Expected:**
```
free: 1 (first quickscan)
paid: 1 (after single purchase)
subscription: 3-5 (multiple reports)
```

---

### 4. Purchases History
```sql
SELECT
  product_type,
  amount_cents,
  stripe_session_id,
  created_at
FROM purchases
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC;
```

**Expected:**
```
Row 1: product_type = 'subscription', amount_cents = 2999
Row 2: product_type = 'single', amount_cents = 999
```

---

### 5. Subscription Status
```sql
SELECT
  stripe_subscription_id,
  status,
  current_period_start,
  current_period_end,
  canceled_at,
  created_at
FROM subscriptions
WHERE user_id = '<your_user_id>'
ORDER BY created_at DESC LIMIT 1;
```

**Expected (if active):**
```
status: 'active'
current_period_end: future date
canceled_at: NULL
```

---

## 🐛 Common Issues & Fixes

### Issue 1: No Credits After Payment

**Symptoms:**
- Payment successful in Stripe
- No credits in database
- `can_create_report = false`

**Diagnosis:**
```
Stripe Dashboard → Webhooks → Recent Events:
- Check: checkout.session.completed
- Status: Should be 200
- If 400/500: Check response body
```

**Check Edge Function Logs:**
```
Supabase Dashboard → Edge Functions → billing-webhook → Logs
```

**Common Causes:**
1. Webhook URL incorrect
2. `WEBHOOK_SECRET_STRIPE` mismatch
3. Database insert failed

**Fix:**
```sql
-- Manual credit grant (emergency)
INSERT INTO usage_credits (user_id, credits_granted, credits_remaining, source, stripe_session_id)
VALUES ('<your_user_id>', 1, 1, 'single', 'manual_fix')
RETURNING *;
```

---

### Issue 2: Paywall Shows Despite Subscription

**Symptoms:**
- Active subscription in Stripe
- Paywall still appears
- `has_subscription = false`

**Diagnosis:**
```sql
-- Check subscription table
SELECT * FROM subscriptions WHERE user_id = '<your_user_id>';
-- If empty or status != 'active': webhook not processed
```

**Check Webhook:**
```
Stripe Dashboard → Events:
- customer.subscription.updated
- Status: Should be 200
```

**Fix:**
```sql
-- Verify subscription exists
SELECT * FROM subscriptions WHERE stripe_subscription_id = 'sub_...';

-- If missing, check stripe_customers linkage
SELECT * FROM stripe_customers WHERE user_id = '<your_user_id>';
```

---

### Issue 3: Checkout Redirect Fails

**Symptoms:**
- Click checkout button
- No redirect
- Console error

**Diagnosis:**
```javascript
// Browser console
console.log('APP_BASE_URL:', import.meta.env.VITE_APP_BASE_URL);
```

**Check:**
1. `APP_BASE_URL` is set in secrets
2. URL is correct (no trailing slash)
3. Not localhost in production

**Fix:**
```
Project Settings → Secrets:
APP_BASE_URL = https://your-app.bolt.new
(exact URL from browser)

Restart preview/deploy
```

---

### Issue 4: Webhook 401/403 Error

**Symptoms:**
```
Stripe webhook logs show:
Status: 401 Unauthorized
or
Status: 403 Forbidden
```

**Diagnosis:**
- Signature verification failed
- Wrong secret

**Check:**
```bash
# In Stripe Dashboard
Webhooks → Your endpoint → Signing secret

# Should match
WEBHOOK_SECRET_STRIPE in your secrets
```

**Fix:**
```
1. Copy correct signing secret from Stripe
2. Update WEBHOOK_SECRET_STRIPE in secrets
3. Redeploy edge function
```

---

## 🎯 Success Checklist

After completing all tests, verify:

**Free Tier:**
- [ ] First quickscan works (free)
- [ ] Second quickscan shows paywall
- [ ] Usage tracked correctly

**Single Purchase:**
- [ ] Checkout redirects to Stripe
- [ ] Payment completes
- [ ] Webhook processes (200 OK)
- [ ] Credits granted (+1)
- [ ] Quickscan works with credit
- [ ] Credit decremented after use
- [ ] Paywall returns when credit = 0

**Subscription:**
- [ ] Checkout redirects to Stripe
- [ ] Subscription starts
- [ ] Webhooks process (3 events)
- [ ] Unlimited quickscans work
- [ ] No paywall shown
- [ ] Usage tracked as 'subscription'

**Management:**
- [ ] Cancel subscription works
- [ ] Entitlements update correctly
- [ ] Pause subscription works
- [ ] Status reflects in database

**Queries:**
- [ ] v_entitlements accurate
- [ ] usage_credits correct
- [ ] report_usage_log complete
- [ ] purchases recorded
- [ ] subscriptions tracked

---

## 📈 KPI Queries for Dashboard

### Monthly Revenue
```sql
SELECT
  DATE_TRUNC('month', created_at) as month,
  product_type,
  COUNT(*) as sales,
  SUM(amount_cents) / 100.0 as revenue_eur
FROM purchases
GROUP BY month, product_type
ORDER BY month DESC, product_type;
```

### Active Subscriptions
```sql
SELECT COUNT(*) as active_subs
FROM subscriptions
WHERE status = 'active'
AND current_period_end > now();
```

### Conversion Rate
```sql
SELECT
  COUNT(DISTINCT user_id) as total_users,
  COUNT(DISTINCT CASE WHEN free_used > 0 THEN user_id END) as tried_free,
  COUNT(DISTINCT CASE WHEN paid_credits > 0 OR has_subscription THEN user_id END) as converted,
  ROUND(100.0 * COUNT(DISTINCT CASE WHEN paid_credits > 0 OR has_subscription THEN user_id END) /
    NULLIF(COUNT(DISTINCT CASE WHEN free_used > 0 THEN user_id END), 0), 2) as conversion_rate
FROM v_entitlements;
```

### Churn Rate (Monthly)
```sql
SELECT
  DATE_TRUNC('month', canceled_at) as month,
  COUNT(*) as cancellations
FROM subscriptions
WHERE canceled_at IS NOT NULL
GROUP BY month
ORDER BY month DESC;
```

---

## 🔄 Reset Test Data

To start fresh:

```sql
-- WARNING: This deletes ALL test data for a user

BEGIN;

DELETE FROM report_usage_log WHERE user_id = '<your_user_id>';
DELETE FROM usage_credits WHERE user_id = '<your_user_id>';
DELETE FROM purchases WHERE user_id = '<your_user_id>';
DELETE FROM subscriptions WHERE user_id = '<your_user_id>';

-- Verify clean state
SELECT * FROM v_entitlements WHERE user_id = '<your_user_id>';
-- Expected: free_used = 0, paid_credits = 0, has_subscription = false

COMMIT;
```

---

## 📝 Test Notes Template

Use this template when testing:

```
Date: 2025-10-18
Tester: [Your Name]
App URL: https://...

Test 1 - Free Limit:
✅ First quickscan worked
✅ Paywall appeared on second
Notes:

Test 2 - Single Purchase:
✅ Checkout redirect OK
✅ Payment completed
✅ Webhook 200 OK
✅ Credit granted
✅ Quickscan with credit OK
✅ Credit decremented
Notes:

Test 3 - Subscription:
✅ Checkout redirect OK
✅ Payment completed
✅ Webhooks processed
✅ Unlimited access works
Notes:

Test 4 - Management:
✅ Cancel worked
✅ Entitlements updated
Notes:

Issues Found:
- None

Overall: ✅ All tests passed
```

---

## 🚀 Production Readiness

Before going live:

1. **Switch to Live Mode:**
   ```
   STRIPE_PUBLISHABLE_KEY = pk_live_...
   STRIPE_SECRET_KEY = sk_live_...
   ```

2. **Update Webhook:**
   ```
   Live Mode webhook endpoint
   Copy new WEBHOOK_SECRET_STRIPE
   ```

3. **Set Real Limits:**
   ```
   FREE_MONTHLY_LIMIT = 3 (or desired value)
   ```

4. **Test with Real Card:**
   - Use real payment method
   - Verify full flow
   - Test refund process

5. **Monitor:**
   - Stripe Dashboard
   - Edge Function logs
   - Database queries
   - User reports

---

**Status:** ✅ Complete Test Guide Ready

**Next:** Run tests with Stripe test mode → Validate all flows → Go live
