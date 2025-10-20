# Stripe Webhook Setup - Complete Guide

## 🎯 Quick Setup Checklist

**Before You Start:**
- ✅ APP_BASE_URL set in secrets (https://your-app.bolt.new)
- ✅ Stripe account in Test Mode
- ✅ Edge function `billing-webhook` deployed

---

## 🔧 Step-by-Step Setup

### Step 1: Get Your Webhook URL

**Format:**
```
https://[YOUR_APP_URL]/functions/v1/billing-webhook
```

**Example:**
```
https://sb1-ndocvrpk.bolt.new/functions/v1/billing-webhook
```

**How to find YOUR_APP_URL:**
1. Open your app in browser
2. Copy the full URL from address bar
3. Should look like: `https://[subdomain].bolt.new`
4. Do NOT add trailing slash

---

### Step 2: Create Webhook in Stripe

**Navigate to:**
```
Stripe Dashboard → Developers → Webhooks
```

**Click:** "Add endpoint"

**Enter:**
1. **Endpoint URL:** `https://your-app.bolt.new/functions/v1/billing-webhook`
2. **Description:** "Quantia Billing Webhook (Test)"
3. **Events to send:** (Click "Select events")

---

### Step 3: Select Events

**Required Events (6 total):**

#### Checkout Events
- ✅ `checkout.session.completed`
  - Triggered when payment completes
  - Grants credits or starts subscription

#### Subscription Events
- ✅ `customer.subscription.updated`
  - Triggered when subscription changes
  - Updates status (active, paused, canceled)

#### Invoice Events
- ✅ `invoice.paid`
  - Triggered on successful recurring payment
  - Confirms subscription renewal

- ✅ `invoice.payment_failed`
  - Triggered when payment fails
  - Allows handling of failed payments

#### Charge Events
- ✅ `charge.refunded`
  - Triggered when refund is issued
  - Allows credit reversal (optional handling)

**Optional (Recommended):**
- `customer.subscription.deleted`
- `customer.subscription.paused`
- `invoice.payment_action_required`

---

### Step 4: Save & Get Signing Secret

**After clicking "Add endpoint":**

1. Stripe shows your new webhook
2. Click "Reveal" under "Signing secret"
3. Copy the secret (format: `whsec_...`)
4. Save it securely

**Example:**
```
whsec_1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnop
```

---

### Step 5: Add Secret to Your App

**In Bolt/Supabase:**
```
Project Settings → Secrets → Add new secret:

Key: WEBHOOK_SECRET_STRIPE
Value: whsec_... (paste your secret)
```

**Save and redeploy edge functions.**

---

### Step 6: Test Webhook

**Method 1: Send Test Event (Stripe Dashboard)**

```
Stripe Dashboard → Developers → Webhooks
→ Click your endpoint
→ "Send test webhook"
→ Select: "checkout.session.completed"
→ Click "Send test webhook"
```

**Expected Response:**
- Status: `200 OK`
- Body: `{"received":true}`

**If you see 400/500:**
- Check edge function logs
- Verify WEBHOOK_SECRET_STRIPE matches
- Verify endpoint URL is correct

---

**Method 2: Real Test (Recommended)**

```
1. Go to /billing in your app
2. Click "Koop 1 rapport"
3. Use test card: 4242 4242 4242 4242
4. Complete payment
5. Check webhook received in Stripe Dashboard
```

---

## 🔍 Verify Webhook is Working

### Check 1: Stripe Dashboard

```
Stripe Dashboard → Developers → Webhooks → Your endpoint

Recent Events:
✅ checkout.session.completed - 200 OK
✅ customer.subscription.updated - 200 OK
✅ invoice.paid - 200 OK
```

### Check 2: Edge Function Logs

```
Supabase Dashboard → Edge Functions → billing-webhook → Logs

Should see:
✅ "Webhook received: checkout.session.completed"
✅ "Processing single purchase"
✅ "Credits granted successfully"
```

### Check 3: Database

```sql
-- After test payment
SELECT * FROM purchases
WHERE stripe_session_id LIKE 'cs_test_%'
ORDER BY created_at DESC LIMIT 1;

-- Should show recent purchase

SELECT * FROM usage_credits
ORDER BY created_at DESC LIMIT 1;

-- Should show granted credits
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Webhook Returns 401 Unauthorized

**Symptoms:**
```
Stripe shows:
Response: 401 Unauthorized
```

**Cause:**
- Signing secret mismatch
- Wrong WEBHOOK_SECRET_STRIPE

**Fix:**
```
1. Go to Stripe → Webhooks → Your endpoint
2. Reveal signing secret
3. Copy FULL secret (starts with whsec_)
4. Update WEBHOOK_SECRET_STRIPE in secrets
5. Redeploy edge functions
6. Test again
```

---

### Issue 2: Webhook Returns 404 Not Found

**Symptoms:**
```
Stripe shows:
Response: 404 Not Found
```

**Cause:**
- Wrong endpoint URL
- Edge function not deployed

**Fix:**
```
1. Verify endpoint URL:
   https://your-app.bolt.new/functions/v1/billing-webhook

2. Check edge function deployed:
   supabase functions list
   → Should show: billing-webhook

3. If missing, deploy:
   supabase functions deploy billing-webhook
```

---

### Issue 3: Webhook Returns 500 Internal Server Error

**Symptoms:**
```
Stripe shows:
Response: 500 Internal Server Error
```

**Cause:**
- Runtime error in edge function
- Missing environment variables
- Database error

**Fix:**
```
1. Check edge function logs:
   Supabase → Edge Functions → billing-webhook → Logs

2. Look for error messages

3. Common causes:
   - SUPABASE_URL missing (should be auto-set)
   - SUPABASE_SERVICE_ROLE_KEY missing (should be auto-set)
   - Database table doesn't exist

4. Test database access:
   SELECT * FROM purchases LIMIT 1;
```

---

### Issue 4: Webhook Received but No Credits

**Symptoms:**
- Webhook shows 200 OK
- Payment successful
- No credits in database

**Cause:**
- Processing logic error
- Database insert failed
- Wrong user_id mapping

**Debug:**
```sql
-- Check if purchase recorded
SELECT * FROM purchases
WHERE stripe_session_id = 'cs_test_...'
ORDER BY created_at DESC;

-- Check if credits granted
SELECT * FROM usage_credits
WHERE user_id = '<user_id>'
ORDER BY created_at DESC;

-- Check stripe_customers mapping
SELECT * FROM stripe_customers
WHERE stripe_customer_id = 'cus_...';
```

**Fix:**
```
1. Check edge function logs for errors
2. Verify user_id mapping exists
3. Check RLS policies allow insert
4. Manual credit grant if needed (see BILLING_TEST_GUIDE.md)
```

---

## 📋 Webhook Payload Examples

### checkout.session.completed (Single Purchase)

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer": "cus_...",
      "payment_status": "paid",
      "amount_total": 999,
      "metadata": {
        "product_type": "single",
        "user_id": "uuid"
      }
    }
  }
}
```

**Expected Behavior:**
- Create purchase record
- Grant 1 credit
- Link customer if new

---

### checkout.session.completed (Subscription)

```json
{
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "payment_status": "paid",
      "amount_total": 2999,
      "metadata": {
        "product_type": "subscription",
        "user_id": "uuid"
      }
    }
  }
}
```

**Expected Behavior:**
- Create purchase record
- Create subscription record (status: active)
- Link customer if new

---

### customer.subscription.updated

```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "id": "sub_...",
      "customer": "cus_...",
      "status": "active",
      "current_period_start": 1234567890,
      "current_period_end": 1234567890,
      "cancel_at_period_end": false
    }
  }
}
```

**Expected Behavior:**
- Update subscription status
- Update period dates
- Set cancel flag

---

### invoice.paid

```json
{
  "type": "invoice.paid",
  "data": {
    "object": {
      "id": "in_...",
      "customer": "cus_...",
      "subscription": "sub_...",
      "amount_paid": 2999,
      "billing_reason": "subscription_cycle"
    }
  }
}
```

**Expected Behavior:**
- Confirm subscription active
- Log renewal (optional)

---

## 🔄 Testing Different Scenarios

### Test 1: Single Purchase
```
1. /billing → "Koop 1 rapport"
2. Pay with: 4242 4242 4242 4242
3. Watch webhooks: checkout.session.completed
4. Verify: 1 credit granted
```

### Test 2: Subscription Start
```
1. /billing → "Start abonnement"
2. Pay with: 4242 4242 4242 4242
3. Watch webhooks:
   - checkout.session.completed
   - customer.subscription.updated
   - invoice.paid
4. Verify: subscription active
```

### Test 3: Subscription Cancel
```
1. Stripe → Customers → Find customer
2. Cancel subscription
3. Watch webhook: customer.subscription.updated
4. Verify: status = 'canceled'
```

### Test 4: Payment Failure
```
1. Use card: 4000 0000 0000 0341 (declined)
2. Watch webhook: invoice.payment_failed
3. Verify: subscription status unchanged
```

### Test 5: Refund
```
1. Stripe → Payments → Find payment
2. Issue full refund
3. Watch webhook: charge.refunded
4. Verify: (optional) credit reversal
```

---

## 📊 Webhook Health Check

**Daily Check:**
```
Stripe Dashboard → Webhooks → Your endpoint

Success rate: Should be > 95%
Average response time: < 1 second
Failed events: Investigate if > 5%
```

**Weekly Check:**
```sql
-- Check processed purchases
SELECT
  DATE(created_at) as date,
  product_type,
  COUNT(*) as purchases
FROM purchases
WHERE created_at > now() - interval '7 days'
GROUP BY date, product_type
ORDER BY date DESC;

-- Should match Stripe payment count
```

---

## 🚀 Production Setup

### Switch to Live Mode

**Step 1: Create Live Webhook**
```
Stripe → Switch to Live Mode
Webhooks → Add endpoint
URL: https://your-production-url.com/functions/v1/billing-webhook
Events: Same 6 events as test mode
```

**Step 2: Update Secrets**
```
WEBHOOK_SECRET_STRIPE = whsec_live_... (new live secret)
STRIPE_SECRET_KEY = sk_live_...
STRIPE_PUBLISHABLE_KEY = pk_live_...
```

**Step 3: Test with Real Payment**
```
1. Use real card (small amount)
2. Complete purchase
3. Verify webhook 200 OK
4. Verify credits granted
5. Test refund flow
```

**Step 4: Monitor**
```
Set up alerts:
- Webhook failure rate > 5%
- Response time > 2s
- 500 errors
```

---

## 🔐 Security Best Practices

### 1. Always Verify Signature
```typescript
// Edge function already implements this
const signature = req.headers.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, signature, secret);
// ✅ Only processes if signature valid
```

### 2. Use Idempotency
```typescript
// Check if already processed
const existing = await supabase
  .from('purchases')
  .select()
  .eq('stripe_session_id', sessionId)
  .single();

if (existing.data) {
  return { received: true }; // Already processed
}
```

### 3. Handle Retries
```
Stripe retries failed webhooks:
- Immediately
- After 1 hour
- After 3 hours
- After 6 hours
- After 12 hours

Make sure your handler is idempotent!
```

### 4. Secure Endpoint
```
✅ HTTPS only (enforced by Supabase)
✅ Signature verification (implemented)
✅ No authentication required (webhook endpoint)
✅ Rate limiting (Supabase handles)
```

---

## 📝 Webhook Event Reference

| Event | When Triggered | Action Required |
|-------|---------------|-----------------|
| `checkout.session.completed` | Payment complete | Grant credits or start subscription |
| `customer.subscription.updated` | Sub status changes | Update subscription record |
| `invoice.paid` | Recurring payment success | Confirm subscription active |
| `invoice.payment_failed` | Payment fails | Notify user, handle grace period |
| `charge.refunded` | Refund issued | Optional: Reverse credits |
| `customer.subscription.deleted` | Sub deleted | Mark as deleted |

---

## ✅ Setup Complete Checklist

- [ ] Webhook endpoint created in Stripe
- [ ] All 6 events selected
- [ ] Signing secret copied
- [ ] WEBHOOK_SECRET_STRIPE set in secrets
- [ ] Edge function deployed
- [ ] Test webhook sent (200 OK)
- [ ] Real test payment completed
- [ ] Credits granted correctly
- [ ] Database records created
- [ ] Logs show successful processing
- [ ] Error handling tested

---

## 🎯 Quick Reference

**Webhook URL:**
```
https://[YOUR_APP]/functions/v1/billing-webhook
```

**Test Endpoint:**
```
Stripe Dashboard → Webhooks → Send test webhook
```

**View Logs:**
```
Supabase → Edge Functions → billing-webhook → Logs
```

**Check Database:**
```sql
SELECT * FROM purchases ORDER BY created_at DESC LIMIT 5;
SELECT * FROM usage_credits ORDER BY created_at DESC LIMIT 5;
SELECT * FROM subscriptions WHERE status = 'active';
```

**Test Cards:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Auth Required: 4000 0025 0000 3155
```

---

**Status:** ✅ Complete Webhook Setup Guide

**Next:** Configure webhook → Test flows → Go live
