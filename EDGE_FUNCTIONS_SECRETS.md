# Edge Functions Secrets Configuration

## Required Environment Variables

All Supabase Edge Functions automatically have access to these environment variables:

### **Pre-configured by Supabase** ✅

These are **automatically available** in all Edge Functions:

```bash
SUPABASE_URL           # Your project URL (auto-configured)
SUPABASE_ANON_KEY      # Public anon key (auto-configured)
SUPABASE_SERVICE_ROLE_KEY  # Service role key (auto-configured)
SUPABASE_DB_URL        # Database connection URL (auto-configured)
```

**You do NOT need to manually configure these!** They are injected by Supabase automatically.

---

## Edge Functions Overview

| Function | Purpose | Secrets Needed |
|----------|---------|----------------|
| `quickscan-submit` | Submit quickscan responses | ✅ Auto (SUPABASE_*) |
| `quickscan-analyze` | GPT-4 analysis | ⚠️ OPENAI_API_KEY |
| `send-report-email` | Email reports | ⚠️ RESEND_API_KEY |
| `consultants-manage` | Manage consultants | ✅ Auto (SUPABASE_*) |
| `paywall-config` | Get paywall config | ✅ Auto (SUPABASE_*) |
| `paywall-mark-paid` | Mark scan as paid | ✅ Auto (SUPABASE_*) |

---

## Additional Secrets to Configure

### **1. OpenAI API Key** (for GPT-4 Analysis)

**Function:** `quickscan-analyze`

```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
```

**How to set:**
```bash
# Via Supabase CLI
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Or via Supabase Dashboard
# Settings → Edge Functions → Secrets → Add Secret
```

**Get your key:** https://platform.openai.com/api-keys

---

### **2. Resend API Key** (for Email Reports)

**Function:** `send-report-email`

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

**How to set:**
```bash
# Via Supabase CLI
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Or via Supabase Dashboard
# Settings → Edge Functions → Secrets → Add Secret
```

**Get your key:** https://resend.com/api-keys

---

## How to Configure Secrets

### **Method 1: Supabase Dashboard** (Recommended)

1. Open **Supabase Dashboard**
2. Go to **Settings** → **Edge Functions**
3. Click **Secrets** tab
4. Click **Add Secret**
5. Enter:
   - Name: `OPENAI_API_KEY`
   - Value: `sk-proj-xxxxxxxxxxxxx`
6. Click **Save**
7. Repeat for `RESEND_API_KEY`

### **Method 2: Supabase CLI**

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Set secrets
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx

# Verify
supabase secrets list
```

---

## Accessing Secrets in Edge Functions

### **Example: Using OpenAI API Key**

```typescript
// supabase/functions/quickscan-analyze/index.ts

Deno.serve(async (req: Request) => {
  // Access secret via environment variable
  const openaiKey = Deno.env.get('OPENAI_API_KEY');

  if (!openaiKey) {
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_KEY not configured' }),
      { status: 500 }
    );
  }

  // Use the key
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello!' }],
    }),
  });

  // ...
});
```

### **Example: Using Supabase Service Role**

```typescript
// supabase/functions/consultants-manage/index.ts
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  // These are automatically available!
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Create admin client (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Perform admin operations
  const { data } = await supabase
    .from('consultants')
    .select('*');

  // ...
});
```

---

## Security Best Practices

### ✅ **DO:**

- Store API keys as secrets (never hardcode)
- Use `SUPABASE_SERVICE_ROLE_KEY` only in Edge Functions (server-side)
- Rotate keys periodically
- Use environment-specific keys (dev/staging/prod)
- Validate secrets exist before using them

### ❌ **DON'T:**

- Commit secrets to Git
- Expose `SUPABASE_SERVICE_ROLE_KEY` in frontend code
- Share secrets in plain text (use secret managers)
- Use production keys in development

---

## Troubleshooting

### **"OPENAI_API_KEY not configured" Error**

**Solution:**
1. Set the secret via Dashboard or CLI
2. Redeploy the function: `supabase functions deploy quickscan-analyze`
3. Test again

### **"SUPABASE_SERVICE_ROLE_KEY not found" Error**

**This should NEVER happen** as it's auto-configured. If it does:
1. Check Supabase project status
2. Verify function is deployed to correct project
3. Contact Supabase support

### **Secrets Not Updating**

After changing secrets:
1. **Redeploy functions** that use those secrets
2. Wait 30-60 seconds for propagation
3. Test with fresh request

---

## Verification

### **Test Secrets are Working**

```bash
# Test quickscan-analyze (needs OPENAI_API_KEY)
curl -X POST https://your-project.supabase.co/functions/v1/quickscan-analyze \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scan_id": "test-id"}'

# Test send-report-email (needs RESEND_API_KEY)
curl -X POST https://your-project.supabase.co/functions/v1/send-report-email \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"scan_id": "test-id", "email": "test@example.com"}'
```

### **Check Function Logs**

1. Supabase Dashboard → **Edge Functions**
2. Select function → **Logs** tab
3. Look for secret-related errors

---

## Summary Checklist

- [ ] SUPABASE_URL (auto-configured ✅)
- [ ] SUPABASE_ANON_KEY (auto-configured ✅)
- [ ] SUPABASE_SERVICE_ROLE_KEY (auto-configured ✅)
- [ ] OPENAI_API_KEY (manually configure for GPT-4)
- [ ] RESEND_API_KEY (manually configure for emails)
- [ ] All functions redeployed after secret changes
- [ ] Secrets verified via test requests

---

## Next Steps

1. **Get API Keys:**
   - OpenAI: https://platform.openai.com/api-keys
   - Resend: https://resend.com/api-keys

2. **Configure Secrets:**
   - Use Supabase Dashboard → Settings → Edge Functions → Secrets

3. **Redeploy Functions:**
   ```bash
   supabase functions deploy quickscan-analyze
   supabase functions deploy send-report-email
   ```

4. **Test:**
   - Submit a quickscan
   - Verify GPT-4 analysis runs
   - Check email delivery

**Your Edge Functions are now configured! 🚀**
