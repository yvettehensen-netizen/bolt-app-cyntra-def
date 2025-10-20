# Post-Signup Hook - Automatic Role & Consultant Linking

## ✅ Status: DEPLOYED & READY

Automatically links pending invites to user accounts on first login.

---

## 🎯 What It Does

When a user logs in for the first time (via invite/magic link), the system automatically:

1. ✅ Finds pending invite by email
2. ✅ Creates membership (org_id + role)
3. ✅ Creates consultant record (if role = consultant)
4. ✅ Cleans up pending_invites record
5. ✅ Returns success (idempotent & safe)

---

## 🔄 Complete Flow

### **Step 1: Admin Invites User**

```
Admin → Admin Users Page
  → Fill form:
     Email: newuser@company.com
     Role: consultant
     Org: quantia
  → Click "Invite"
```

### **Step 2: System Creates Pending Invite**

```
send-invite function:
  ✓ Generates magic/invite link
  ✓ Stores in pending_invites table:
    - email: newuser@company.com
    - role: consultant
    - org_slug: quantia
  ✓ Sends branded email
```

### **Step 3: User Clicks Link**

```
User receives email
  → Clicks magic/invite link
  → Redirects to APP_BASE_URL/dashboard
  → Auto-login triggered
```

### **Step 4: Post-Signup Hook Runs**

```
AuthContext detects SIGNED_IN event
  → Calls /functions/v1/post-signup
  → Hook processes:
    ✓ Finds pending_invites by email
    ✓ Gets/creates organization
    ✓ Creates membership (user_id, org_id, role)
    ✓ Creates consultant record (if applicable)
    ✓ Deletes pending_invites record
  → Returns { ok: true, linked: true, role: "consultant" }
```

### **Step 5: User Ready**

```
✓ Membership applied
✓ Consultant record created
✓ Role-based routes visible
✓ RLS rules enforced
✓ Ready to use!
```

---

## 📦 What Was Built

### **1. Post-Signup Edge Function** ✅

**File:** `supabase/functions/post-signup/index.ts`

**Features:**
- ✅ JWT-authenticated (user must be logged in)
- ✅ Idempotent (safe to run multiple times)
- ✅ Non-blocking (failures don't break login)
- ✅ Auto-creates organizations
- ✅ Creates memberships
- ✅ Creates consultant records
- ✅ Cleans up pending invites

**Endpoint:** `POST /functions/v1/post-signup`

**Response:**
```json
{
  "ok": true,
  "linked": true,
  "role": "consultant",
  "orgSlug": "quantia",
  "message": "Successfully linked account with role: consultant"
}
```

**No Pending Invite:**
```json
{
  "ok": true,
  "linked": false,
  "reason": "no_pending_invite"
}
```

### **2. Post-Signup Service** ✅

**File:** `src/services/postSignupService.ts`

**Function:**
```typescript
await callPostSignupOnce()
```

**Features:**
- ✅ Gets current session token
- ✅ Calls post-signup edge function
- ✅ Returns result or null
- ✅ Non-blocking (catches errors)
- ✅ Logs warnings (not errors)

### **3. AuthContext Integration** ✅

**File:** `src/contexts/AuthContext.tsx`

**Integration:**
```typescript
onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
    const result = await callPostSignupOnce();
    if (result?.linked) {
      console.log(`Account linked with role: ${result.role}`);
    }
  }
});
```

**Triggers:**
- ✅ `SIGNED_IN` - First login via magic/invite link
- ✅ `USER_UPDATED` - Profile updates (rare)

---

## 🔐 Security

### **JWT Required**

```typescript
const authHeader = req.headers.get("authorization");
// Must have valid Bearer token
// Only logged-in users can call this
```

### **Service Role for Writes**

```typescript
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  global: { headers: { Authorization: authHeader } }
});
// Service role bypasses RLS for writing
// But JWT ensures user identity
```

### **Idempotent Operations**

```typescript
// Safe to run multiple times
.upsert({ org_id, user_id, role }, { onConflict: 'org_id,user_id' })
```

### **Non-Blocking**

```typescript
// Failures don't break login flow
try {
  await callPostSignupOnce();
} catch (error) {
  console.warn('post-signup failed (non-blocking)', error);
}
```

---

## 🧪 Testing

### **Test New User Invite**

1. **Admin invites new user:**
   ```
   Email: testuser@example.com
   Role: consultant
   Org: quantia
   ```

2. **Check pending_invites:**
   ```sql
   SELECT * FROM pending_invites
   WHERE email = 'testuser@example.com';
   ```
   Expected: 1 row

3. **User clicks invite link:**
   - Email received
   - Click link
   - Redirects to dashboard
   - Auto-login

4. **Check membership created:**
   ```sql
   SELECT m.*, o.slug
   FROM memberships m
   JOIN organizations o ON o.id = m.org_id
   WHERE m.user_id = (
     SELECT id FROM auth.users
     WHERE email = 'testuser@example.com'
   );
   ```
   Expected: role = 'consultant', slug = 'quantia'

5. **Check consultant record:**
   ```sql
   SELECT * FROM consultants
   WHERE email = 'testuser@example.com';
   ```
   Expected: 1 row with user_id

6. **Check pending_invites cleaned up:**
   ```sql
   SELECT * FROM pending_invites
   WHERE email = 'testuser@example.com';
   ```
   Expected: 0 rows

7. **Check UI access:**
   - Consultant sees "Consultants" link
   - Can access consultant portal
   - RLS enforced

### **Test Existing User (No Pending Invite)**

1. **User logs in normally:**
   - No pending invite
   - Post-signup runs
   - Returns `{ linked: false, reason: "no_pending_invite" }`

2. **Check logs:**
   ```
   Browser console: (no errors)
   Edge function logs: "no_pending_invite"
   ```

3. **User flow:**
   - Login successful
   - Existing roles preserved
   - No changes to memberships

### **Test Idempotency**

1. **User logs in twice:**
   - First login: membership created
   - Second login: membership unchanged
   - No duplicate records

2. **Check memberships:**
   ```sql
   SELECT COUNT(*) FROM memberships
   WHERE user_id = 'test-user-id';
   ```
   Expected: 1 (not 2)

---

## 🐛 Troubleshooting

### **Problem: Role not applied after login**

**Check:**
1. Pending invite existed before login?
   ```sql
   SELECT * FROM pending_invites WHERE email = 'user@example.com';
   ```

2. Post-signup was called?
   ```
   Browser console → Look for:
   "Account linked with role: consultant"
   ```

3. Edge function logs:
   ```
   Supabase → Edge Functions → post-signup → Logs
   ```

4. Membership created?
   ```sql
   SELECT * FROM memberships WHERE user_id = 'user-id';
   ```

**Solution:**
- Manually call post-signup again (logout/login)
- Or manually create membership in SQL
- Check RLS policies on memberships table

### **Problem: Consultant record not created**

**Check:**
1. Role was 'consultant'?
2. Edge function logs for errors
3. Consultants table has correct constraints

**Solution:**
```sql
-- Manually create if needed
INSERT INTO consultants (user_id, email, name)
VALUES ('user-id', 'user@example.com', 'Name')
ON CONFLICT (user_id) DO NOTHING;
```

### **Problem: "Unauthorized" error**

**Check:**
1. User is logged in (has session)
2. Token is valid (not expired)
3. Authorization header sent

**Solution:**
- Logout and login again
- Check browser console for errors
- Verify session in Supabase Dashboard

### **Problem: Multiple memberships created**

**Check:**
1. Upsert conflict clause correct?
   ```typescript
   .upsert(..., { onConflict: 'org_id,user_id' })
   ```

2. Unique constraint exists?
   ```sql
   SELECT constraint_name
   FROM information_schema.table_constraints
   WHERE table_name = 'memberships'
   AND constraint_type = 'UNIQUE';
   ```

**Solution:**
```sql
-- Remove duplicates
DELETE FROM memberships
WHERE id NOT IN (
  SELECT MIN(id) FROM memberships
  GROUP BY org_id, user_id
);
```

---

## 📊 Database Queries

### **Check Pending Invites**

```sql
SELECT * FROM pending_invites
ORDER BY created_at DESC;
```

### **Check Recent Memberships**

```sql
SELECT
  m.id,
  m.role,
  u.email,
  o.slug as org,
  m.created_at
FROM memberships m
JOIN auth.users u ON u.id = m.user_id
JOIN organizations o ON o.id = m.org_id
ORDER BY m.created_at DESC
LIMIT 10;
```

### **Check Consultants**

```sql
SELECT
  c.id,
  c.email,
  c.name,
  u.email as auth_email,
  c.created_at
FROM consultants c
JOIN auth.users u ON u.id = c.user_id
ORDER BY c.created_at DESC
LIMIT 10;
```

### **Check User's Complete Profile**

```sql
WITH user_info AS (
  SELECT id, email FROM auth.users WHERE email = 'user@example.com'
)
SELECT
  'Auth' as source,
  u.email,
  NULL as role,
  NULL as org
FROM user_info u
UNION ALL
SELECT
  'Membership' as source,
  u.email,
  m.role,
  o.slug as org
FROM user_info u
JOIN memberships m ON m.user_id = u.id
JOIN organizations o ON o.id = m.org_id
UNION ALL
SELECT
  'Consultant' as source,
  u.email,
  'consultant' as role,
  NULL as org
FROM user_info u
JOIN consultants c ON c.user_id = u.id;
```

---

## 🚀 Build Status

```bash
✓ 2663 modules transformed
✓ built in 9.19s

Production Bundle:
  index.html:    0.47 kB (gzip: 0.31 kB)
  index.css:    36.35 kB (gzip: 6.58 kB)
  index.js:  2,250.43 kB (gzip: 713.50 kB)
```

**Status:** ✅ Production Ready

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `supabase/functions/post-signup/index.ts` | Edge function |
| `src/services/postSignupService.ts` | Helper service |
| `src/contexts/AuthContext.tsx` | Integration point |
| `POST_SIGNUP_HOOK.md` | This guide |

---

## 🎯 Feature Matrix

| Feature | Status | Description |
|---------|--------|-------------|
| **Auto Role Linking** | ✅ | Membership auto-created |
| **Auto Consultant** | ✅ | Consultant record auto-created |
| **Pending Cleanup** | ✅ | Pending invites removed |
| **Idempotent** | ✅ | Safe to run multiple times |
| **Non-Blocking** | ✅ | Failures don't break login |
| **JWT Auth** | ✅ | Only logged-in users |
| **Service Role** | ✅ | Bypasses RLS safely |
| **CORS Enabled** | ✅ | All origins allowed |
| **Error Logging** | ✅ | Console + edge logs |
| **Organization** | ✅ | Auto-creates if needed |

---

## 🎊 Summary

**Post-signup hook is fully operational! 🚀**

**What happens now:**

1. ✅ Admin invites user
2. ✅ pending_invites record created
3. ✅ User receives email
4. ✅ User clicks link → Auto-login
5. ✅ post-signup hook triggers
6. ✅ Membership created
7. ✅ Consultant record created (if applicable)
8. ✅ pending_invites cleaned up
9. ✅ User has correct role
10. ✅ Role-based UI shows

**Complete invite-to-login flow:**
Invite → Email → Click → Login → Auto-link → Ready! ✨

**No manual steps required!**

The entire flow is automated from invite to first login.

---

## 📖 Related Documentation

- **This Guide:** `POST_SIGNUP_HOOK.md` - Post-signup automation
- **Invite Setup:** `INVITE_EMAIL_SETUP.md` - Email configuration
- **Admin Management:** `ADMIN_USER_MANAGEMENT.md` - User management
- **Admin Setup:** `ADMIN_SETUP_COMPLETE.md` - Initial setup

---

**Everything is automated! 🎉**

Invite users → They click → Auto-linked → Ready to use!
