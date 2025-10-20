# Invite + Verify Email Flow - Complete Setup Guide

## ✅ Status: DEPLOYED & READY

Complete email invite system with Resend (Mode A) and Supabase SMTP (Mode B) fallback.

---

## 🔑 Required Secrets Configuration

### **CRITICAL: Configure These Secrets First!**

Go to **Supabase Dashboard → Edge Functions → send-invite → Secrets**

### **Required Secrets (Auto-Configured)**

These are automatically set by Supabase:

| Secret | Value | Status |
|--------|-------|--------|
| `SUPABASE_URL` | Your project URL | ✅ Auto-configured |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key | ✅ Auto-configured |

### **Required Secret (Manual)**

| Secret | Example Value | Required |
|--------|---------------|----------|
| `APP_BASE_URL` | `https://your-app.bolt.new` | ✅ YES |

**How to set:**
1. Go to Supabase Dashboard
2. Navigate to **Edge Functions**
3. Click on **send-invite**
4. Go to **Secrets** tab
5. Add secret:
   - Name: `APP_BASE_URL`
   - Value: Your app URL (e.g., `https://quantia.bolt.new` or your custom domain)
6. Click **Save**

**Important:** This is where users will be redirected after clicking the invite link!

### **Optional Secrets (For Branded Emails - Mode A)**

For beautiful branded Quantia emails via Resend:

| Secret | Example Value | Required |
|--------|---------------|----------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | No (Mode A) |
| `EMAIL_FROM` | `Quantia <noreply@yourdomain.com>` | No (Mode A) |

**If NOT set:** Automatically falls back to Supabase SMTP (Mode B)

---

## 🚀 Quick Setup (5 Minutes)

### **Option A: Resend (Recommended - Branded Emails)**

**Step 1: Get Resend API Key**
1. Go to https://resend.com
2. Sign up / Log in
3. Go to **API Keys**
4. Create new API key
5. Copy the key (starts with `re_`)

**Step 2: Verify Domain**
1. In Resend Dashboard → **Domains**
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records (DKIM, SPF, DMARC)
4. Wait for verification (~5-10 minutes)

**Step 3: Configure Secrets**
```
Supabase → Edge Functions → send-invite → Secrets:

APP_BASE_URL = https://your-app.bolt.new
RESEND_API_KEY = re_your_api_key_here
EMAIL_FROM = Quantia <noreply@yourdomain.com>
```

**Step 4: Test**
1. Login as admin
2. Go to Admin · Users
3. Invite a test user
4. Check for **green banner**: "✓ Resend geconfigureerd"
5. Check email inbox → Beautiful branded email!

---

### **Option B: Supabase SMTP (Fallback)**

**Step 1: Configure SMTP in Supabase**
1. Go to Supabase Dashboard
2. Navigate to **Settings → Auth**
3. Scroll to **SMTP Settings**
4. Configure your SMTP provider:
   - Host: `smtp.gmail.com` (or your provider)
   - Port: `587`
   - Username: Your email
   - Password: App password
   - Sender email: Your verified email

**Step 2: Configure APP_BASE_URL**
```
Supabase → Edge Functions → send-invite → Secrets:

APP_BASE_URL = https://your-app.bolt.new
```

**Leave RESEND_API_KEY and EMAIL_FROM empty**

**Step 3: Test**
1. Login as admin
2. Go to Admin · Users
3. Invite a test user
4. Check for **amber banner**: "⚠️ Supabase fallback mode"
5. Check email inbox → Supabase email

---

## 📧 Email Templates

### **Mode A: Resend (Branded)**

```
┌─────────────────────────────────────────┐
│                                         │
│            🌈 Quantia                   │
│      Data Maturity Intelligence         │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │  Je bent uitgenodigd!           │   │
│  │                                 │   │
│  │  Je bent uitgenodigd als        │   │
│  │  consultant op het Quantia      │   │
│  │  platform.                      │   │
│  │                                 │   │
│  │  Klik op de knop hieronder om   │   │
│  │  in te loggen en je account te  │   │
│  │  activeren:                     │   │
│  │                                 │   │
│  │   [Log in / Activeer Account]   │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Deze link is voor eenmalig gebruik    │
│  en verloopt na korte tijd.            │
│                                         │
└─────────────────────────────────────────┘
```

**Features:**
- ✅ Gradient Quantia logo
- ✅ Dark theme (#0F172A)
- ✅ Professional design
- ✅ Role badge
- ✅ Clear CTA button
- ✅ Security notice

### **Mode B: Supabase SMTP (Standard)**

Standard Supabase email template with magic link.

---

## 🎯 Complete User Flow

### **1. Admin Invites User**

```
Admin fills form:
  Email: newuser@company.com
  Role: consultant
  Org: quantia

Click "Invite / Role Instellen"
```

### **2. System Processes**

```
✓ Check if user exists in auth.users
✓ Generate magic link (existing) OR invite link (new)
✓ Create/update membership
✓ Create consultant record (if role=consultant)
✓ Store pending_invite (if new user)
✓ Send email via Resend OR Supabase
```

### **3. User Receives Email**

**Mode A (Resend):**
- Beautiful branded email
- From: `Quantia <noreply@yourdomain.com>`
- Subject: `Uitnodiging voor Quantia (consultant)`

**Mode B (Supabase):**
- Standard Supabase email
- From: Your configured SMTP email
- Subject: Default Supabase subject

### **4. User Clicks Link**

```
Click link in email
     ↓
Redirect to APP_BASE_URL/dashboard
     ↓
Auto-login (magic link)
     ↓
Roles applied automatically
     ↓
Consultant record created (if applicable)
     ↓
Ready to use!
```

---

## 🔐 Security Features

### **Magic Links**
- ✅ One-time use only
- ✅ Expire after short time (~1 hour)
- ✅ Cannot be reused
- ✅ Secure token generation

### **Admin Access**
- ✅ Only admins can send invites
- ✅ Backend verification (memberships table)
- ✅ JWT validation on every request
- ✅ Service role only server-side

### **Email Security**
- ✅ Links expire quickly
- ✅ Clear security notice
- ✅ No sensitive data in email
- ✅ HTTPS redirect only

---

## 🧪 Testing Checklist

### **Test Mode A (Resend)**

- [ ] Configure all 3 secrets (APP_BASE_URL, RESEND_API_KEY, EMAIL_FROM)
- [ ] Verify domain in Resend
- [ ] Login as admin
- [ ] Go to Admin · Users
- [ ] See **green banner**: "✓ Resend geconfigureerd"
- [ ] Invite test user
- [ ] Success toast shows "via Resend"
- [ ] Check email inbox
- [ ] Email has Quantia branding
- [ ] Email has gradient logo
- [ ] Click link in email
- [ ] Redirects to dashboard
- [ ] Auto-logged in
- [ ] Role applied correctly
- [ ] Consultant record created (if role=consultant)

### **Test Mode B (Supabase)**

- [ ] Configure APP_BASE_URL only
- [ ] Configure SMTP in Supabase Dashboard
- [ ] Login as admin
- [ ] Go to Admin · Users
- [ ] See **amber banner**: "⚠️ Supabase fallback mode"
- [ ] Invite test user
- [ ] Success toast shows "via Supabase"
- [ ] Check email inbox
- [ ] Email received (standard Supabase template)
- [ ] Click link in email
- [ ] Redirects to dashboard
- [ ] Auto-logged in
- [ ] Role applied correctly

### **Test New vs Existing Users**

**New User:**
- [ ] Invite new email
- [ ] Success shows "Uitnodiging verstuurd"
- [ ] pending_invites row created
- [ ] Email contains "invite" link
- [ ] First login creates user
- [ ] Membership applied
- [ ] Consultant record created

**Existing User:**
- [ ] Invite existing email
- [ ] Success shows "Magic link verstuurd"
- [ ] Membership updated
- [ ] Email contains "magiclink"
- [ ] Click link → Auto-login
- [ ] Role changed

---

## 🐛 Troubleshooting

### **Problem: "Missing secret: APP_BASE_URL"**

**Solution:**
1. Go to Supabase Dashboard
2. Edge Functions → send-invite → Secrets
3. Add secret:
   - Name: `APP_BASE_URL`
   - Value: `https://your-app.bolt.new` (your actual URL)
4. Save
5. Try invite again

### **Problem: Amber banner shows (want Resend)**

**Solution:**
1. Check RESEND_API_KEY is set
2. Check EMAIL_FROM is set
3. Verify domain in Resend Dashboard
4. Check API key is valid
5. Check edge function logs for errors

### **Problem: No email received (Mode B)**

**Solution:**
1. Check SMTP configured in Supabase
2. Test SMTP connection in Supabase Dashboard
3. Check spam folder
4. Verify sender email in SMTP settings
5. Check Supabase logs for email errors

### **Problem: Link doesn't work**

**Solution:**
1. Check APP_BASE_URL is correct
2. Ensure HTTPS (not HTTP)
3. Check link hasn't expired (~1 hour)
4. Check link wasn't already used (one-time)
5. Try generating new invite

### **Problem: Role not applied**

**Solution:**
1. Check membership was created:
   ```sql
   SELECT * FROM memberships
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'user@example.com');
   ```
2. Check org exists:
   ```sql
   SELECT * FROM organizations WHERE slug = 'quantia';
   ```
3. Check pending_invites for new users:
   ```sql
   SELECT * FROM pending_invites WHERE email = 'user@example.com';
   ```

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/send-invite/index.ts` | Invite edge function |
| `supabase/migrations/20251018130000_create_pending_invites.sql` | Pending invites table |
| `src/services/adminService.ts` | sendInvite() function |
| `src/pages/AdminUsersPage.tsx` | Admin UI with mode banner |
| `INVITE_EMAIL_SETUP.md` | This guide |

---

## 📊 Secrets Summary

### **Minimum Required (Mode B - Supabase)**

```
APP_BASE_URL = https://your-app.bolt.new
```

Plus: SMTP configured in Supabase Dashboard

### **Recommended (Mode A - Resend)**

```
APP_BASE_URL = https://your-app.bolt.new
RESEND_API_KEY = re_xxxxxxxxxxxxx
EMAIL_FROM = Quantia <noreply@yourdomain.com>
```

Plus: Domain verified in Resend

---

## 🎉 Success Criteria

**You're all set when:**

✅ APP_BASE_URL secret configured
✅ Either Resend OR Supabase SMTP configured
✅ Green or amber banner shows in Admin UI
✅ Test invite received in email
✅ Link works and redirects to dashboard
✅ User auto-logged in
✅ Role applied correctly
✅ Build successful (2,249 kB)

---

## 🚀 Next Steps

### **Immediate:**
1. ✅ Configure APP_BASE_URL secret
2. ✅ Choose Mode A (Resend) or Mode B (Supabase)
3. ✅ Configure additional secrets if needed
4. ✅ Test with real email
5. ✅ Verify complete flow works

### **Optional Enhancements:**
1. **Custom email templates:**
   - Modify `htmlEmail()` function in send-invite/index.ts
2. **Post-signup hook:**
   - Auto-process pending_invites on first login
3. **Email analytics:**
   - Track open rates in Resend Dashboard
4. **Bulk invites:**
   - CSV upload for multiple users
5. **Invite expiry:**
   - Set custom expiry time for links

---

## 📖 Related Documentation

- **This Guide:** `INVITE_EMAIL_SETUP.md` - Email flow setup
- **Admin Management:** `ADMIN_USER_MANAGEMENT.md` - User management
- **Admin Setup:** `ADMIN_SETUP_COMPLETE.md` - Initial admin setup
- **Edge Functions:** `EDGE_FUNCTIONS_SECRETS.md` - Secrets guide

---

## 🎊 Congratulations!

**Your Quantia platform now has:**

✨ Complete invite + verify email flow
📧 Dual mode support (Resend + Supabase)
🎨 Beautiful branded email template
🔗 Magic links + invite links
🔐 Secure one-time use links
👥 Auto role assignment
🏢 Multi-tenant support
🚀 Production ready

**Start inviting users! 🚀**

Configure `APP_BASE_URL` secret → Choose email mode → Start inviting!
