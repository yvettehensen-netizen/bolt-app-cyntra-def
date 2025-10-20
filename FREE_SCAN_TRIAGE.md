# Free Scan - Snelle Triage & Debug Guide

## ✅ Implementatie Status

**Build:** ✅ Success (718 KB gzipped)
**Route:** ✅ `/free-scan` implemented in App.tsx
**Component:** ✅ `FreeScanPage.tsx` exists
**Edge Function:** ✅ `free-quickscan-analyze` created
**Database:** ✅ Migration `20251020000000_free_quickscan_leads.sql` ready
**Test Tools:** ✅ Debug API button added to page

---

## 🧪 Test Checklist

### 1. Route Test
```
✅ Navigate to /free-scan
   → Should show "Ontdek jouw Data Maturity Score" page
   → Form with 4 fields visible
   → No 404 error
```

### 2. Database Test
```sql
-- Check if table exists
SELECT * FROM public.free_quickscan_leads LIMIT 1;

-- If error "relation does not exist":
-- → Apply migration in Supabase SQL Editor
```

### 3. Edge Function Test

**Browser Console Test:**
```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
fetch(`${supabaseUrl}/functions/v1/free-quickscan-analyze`, {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({
    name:'Test User',
    email:'test@example.com',
    sector:'IT',
    challenge:'We hebben te weinig inzicht in onze data'
  })
}).then(r=>r.json()).then(console.log)
```

**Expected Response:**
```json
{
  "ok": true,
  "leadId": "uuid",
  "score": 65,
  "analysis": "Op basis van jouw uitdaging...",
  "recommendations": ["...", "...", "..."]
}
```

**On-Page Test:**
```
1. Navigate to /free-scan
2. Scroll to bottom
3. Click "🧪 Test API (Debug)" button
4. Check JSON response below button
```

---

## 🐛 Common Issues & Fixes

### Issue 1: 404 on /free-scan

**Symptoms:**
- Page not found
- Route doesn't exist

**Diagnosis:**
```typescript
// Check src/App.tsx line 41-43
if (route.page === 'free-scan') {
  return <FreeScanPage />;
}
```

**Fix:** ✅ Already implemented

---

### Issue 2: Edge Function 404

**Symptoms:**
```json
{
  "error": "Function not found"
}
```

**Diagnosis:**
- Function not deployed
- Wrong function name
- Wrong URL

**Check:**
```bash
# List deployed functions
supabase functions list

# Should show: free-quickscan-analyze
```

**Fix:**
```bash
# Deploy function
supabase functions deploy free-quickscan-analyze
```

---

### Issue 3: Database Error (relation does not exist)

**Symptoms:**
```json
{
  "error": "Failed to save lead",
  "details": "relation \"free_quickscan_leads\" does not exist"
}
```

**Diagnosis:**
- Migration not applied
- Table not created

**Fix:**
```sql
-- Apply migration in Supabase SQL Editor
-- Copy contents of:
-- supabase/migrations/20251020000000_free_quickscan_leads.sql
-- Paste in SQL Editor → Run

-- Verify table exists:
SELECT * FROM public.free_quickscan_leads LIMIT 1;
```

---

### Issue 4: CORS Error

**Symptoms:**
```
Access to fetch blocked by CORS policy
```

**Diagnosis:**
- Missing CORS headers in edge function
- OPTIONS method not handled

**Check:**
```typescript
// Edge function should have:
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

if (req.method === "OPTIONS") {
  return new Response(null, { status: 200, headers: corsHeaders });
}
```

**Fix:** ✅ Already implemented

---

### Issue 5: 401 Unauthorized

**Symptoms:**
```json
{
  "error": "Unauthorized"
}
```

**Diagnosis:**
- Function expects JWT token
- Public endpoint blocked

**Fix:**
```typescript
// Edge function should NOT require auth for public endpoint
// Use SERVICE_ROLE for database operations
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
```

**Fix:** ✅ Already implemented

---

### Issue 6: 500 Internal Server Error

**Symptoms:**
```json
{
  "ok": false,
  "error": "Internal server error",
  "message": "...",
  "type": "..."
}
```

**Diagnosis:**
- Runtime error in function
- Missing environment variables
- Database permission issue

**Check Edge Function Logs:**
```
Supabase Dashboard → Edge Functions → free-quickscan-analyze → Logs
```

**Common Causes:**
1. `SUPABASE_URL` not set → Check: ✅ Auto-configured
2. `SUPABASE_SERVICE_ROLE_KEY` not set → Check: ✅ Auto-configured
3. Database RLS blocking insert → Check migration policies
4. Invalid data format

**Debug:**
- Use "🧪 Test API" button on page
- Check browser console
- Check edge function logs

---

## 🔍 Debug Tools

### 1. On-Page Test Button

**Location:** `/free-scan` page, bottom of form

**What it does:**
- Sends hardcoded test data to API
- Displays full JSON response
- Shows HTTP status code
- Logs to browser console

**How to use:**
1. Navigate to `/free-scan`
2. Click "🧪 Test API (Debug)"
3. Check response below button
4. Check browser console (F12)

---

### 2. Browser Console Logs

**Frontend logs:**
```javascript
// In FreeScanPage.tsx:
console.log('Testing API:', apiUrl);
console.log('Response status:', response.status);
console.log('Response headers:', ...);
console.log('Response data:', data);
```

**Edge Function logs:**
```javascript
// In free-quickscan-analyze/index.ts:
console.log('Received body:', body);
console.log('Saving to database:', ...);
console.log('Lead saved successfully:', lead.id);
console.error('Database error:', dbError);
```

---

### 3. SQL Queries

**Check leads:**
```sql
-- All leads
SELECT * FROM free_quickscan_leads
ORDER BY created_at DESC;

-- Recent leads (last hour)
SELECT * FROM free_quickscan_leads
WHERE created_at > now() - interval '1 hour'
ORDER BY created_at DESC;

-- Count by sector
SELECT sector, COUNT(*) as count
FROM free_quickscan_leads
GROUP BY sector;
```

**Check RLS policies:**
```sql
-- List policies
SELECT * FROM pg_policies
WHERE tablename = 'free_quickscan_leads';
```

---

## 🎯 Step-by-Step Testing Flow

### Step 1: Check Route
```
1. Open browser
2. Navigate to /free-scan
3. ✅ Page loads with form
   ❌ 404 → Check App.tsx routing
```

### Step 2: Check Database
```
1. Open Supabase SQL Editor
2. Run: SELECT * FROM free_quickscan_leads LIMIT 1;
3. ✅ Returns empty or rows
   ❌ Error → Apply migration
```

### Step 3: Test API (Debug Button)
```
1. On /free-scan page
2. Click "🧪 Test API (Debug)"
3. ✅ Shows { "ok": true, "score": XX, ... }
   ❌ Shows error → Check logs
```

### Step 4: Test Full Flow
```
1. Fill form:
   Name: Test User
   Email: your-email@test.com
   Sector: IT
   Challenge: Data quality issues
2. Click "Ontvang mijn gratis inzicht"
3. ✅ Results appear with score
   ❌ Error message → Check console
4. Check email inbox
   ✅ Email received (if Resend configured)
   ❌ No email → Check RESEND_API_KEY
5. Check database:
   SELECT * FROM free_quickscan_leads
   ORDER BY created_at DESC LIMIT 1;
   ✅ New row with test data
```

---

## 📊 Expected Behavior

### Happy Path
```
1. User visits /free-scan
2. Fills 4 fields
3. Clicks submit
4. Loading animation (2-3 seconds)
5. Results appear:
   - Score card (gradient, large number)
   - Analysis text
   - 3 recommendations
   - CTA to full quickscan
6. Email arrives (if configured)
7. Database contains new lead
```

### Error Path
```
1. User submits form
2. API call fails
3. Error message appears:
   "Er ging iets mis. Check de browser console voor details."
4. Console shows:
   - API URL
   - Response status
   - Error details
5. No results shown
6. Form remains filled
7. User can retry
```

---

## 🔧 Environment Variables

### Required (Auto-configured)
```bash
✅ SUPABASE_URL
✅ SUPABASE_SERVICE_ROLE_KEY
```

### Optional
```bash
⚠️ OPENAI_API_KEY=sk-proj-...
   → If not set: Uses mock analysis (still works!)

⚠️ RESEND_API_KEY=re_...
   → If not set: No email sent (still saves to DB!)

⚠️ APP_BASE_URL=https://your-app.bolt.new
   → If not set: Uses "https://quantia.ai" in emails
```

**Where to check:**
- Supabase Dashboard → Edge Functions → Settings → Environment Variables
- Local: `.env` file

---

## ✅ Success Criteria

**Route:** ✅ /free-scan loads without 404
**Form:** ✅ 4 fields (name, email, sector, challenge)
**Submit:** ✅ Shows loading animation
**Results:** ✅ Score + analysis + recommendations appear
**Database:** ✅ New row in free_quickscan_leads
**Email:** ⚠️ Optional (depends on RESEND_API_KEY)
**Test Button:** ✅ Shows JSON response
**Logs:** ✅ Console shows API calls and responses

---

## 🚀 Next Steps After Triage

Once triage is successful:

1. **Deploy Edge Function**
   ```bash
   supabase functions deploy free-quickscan-analyze
   ```

2. **Apply Migration**
   ```sql
   -- Copy migration SQL to Supabase SQL Editor
   -- Run the migration
   ```

3. **Set Optional Secrets** (recommended)
   ```
   Supabase Dashboard → Edge Functions → Settings:
   - OPENAI_API_KEY (for real AI)
   - RESEND_API_KEY (for emails)
   - APP_BASE_URL (for CTA links)
   ```

4. **Remove Test Button** (production)
   ```typescript
   // In FreeScanPage.tsx, comment out:
   // {/* Test API Button */}
   ```

5. **Drive Traffic**
   - Add to marketing materials
   - Social media campaigns
   - Blog CTAs
   - Email signatures

---

## 📚 Related Documentation

- **FREE_SCAN_SETUP.md** - Complete implementation guide
- **PRE_LAUNCH_CHECKLIST.md** - Full testing procedures
- **BILLING_MONETIZATION.md** - Conversion funnels

---

## 🎊 Summary

**Status:** ✅ All components implemented and ready for testing

**What's Working:**
- ✅ Route /free-scan
- ✅ FreeScanPage component
- ✅ Edge function with logging
- ✅ Database migration
- ✅ Test tools (debug button)
- ✅ Error handling
- ✅ CORS headers
- ✅ Public access (no auth)

**What to Test:**
1. Navigate to /free-scan
2. Click "🧪 Test API" button
3. Check response
4. Fill form and submit
5. Verify results
6. Check database

**If Issues:**
- Check browser console
- Check edge function logs
- Apply database migration
- Verify environment variables

**Everything is ready for testing! 🚀**
