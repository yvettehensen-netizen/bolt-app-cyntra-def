# Admin User Management - Complete Implementation

## ✅ Status: READY TO USE

Complete admin interface for inviting users and managing roles.

---

## 🎯 What's Been Built

### **1. Admin Assign Role Edge Function** ✅
**Deployed:** `supabase/functions/admin-assign-role`

**Features:**
- ✅ Admin-only access (checks memberships)
- ✅ Invites new users via email
- ✅ Assigns/updates roles (admin/consultant/client)
- ✅ Creates/links organizations
- ✅ Auto-creates consultant records
- ✅ Idempotent (safe to run multiple times)

**Endpoint:** `POST /functions/v1/admin-assign-role`

**Payload:**
```json
{
  "email": "user@example.com",
  "role": "consultant",
  "orgSlug": "quantia"
}
```

**Response:**
```json
{
  "ok": true,
  "email": "user@example.com",
  "role": "consultant",
  "orgSlug": "quantia",
  "userExists": true,
  "userId": "uuid",
  "invited": false
}
```

---

### **2. Admin List Users Edge Function** ✅
**Deployed:** `supabase/functions/admin-list-users`

**Features:**
- ✅ Admin-only access
- ✅ Lists all auth.users
- ✅ Enriches with memberships
- ✅ Enriches with consultant info
- ✅ Search/filter by email
- ✅ Sorted by creation date

**Endpoint:** `GET /functions/v1/admin-list-users?q=search`

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "2025-10-18T10:00:00Z",
      "last_sign_in_at": "2025-10-18T10:00:00Z",
      "confirmed_at": "2025-10-18T10:00:00Z",
      "memberships": [
        {
          "role": "admin",
          "org_id": "uuid",
          "user_id": "uuid"
        }
      ],
      "consultant": {
        "id": "uuid",
        "name": "John Doe",
        "user_id": "uuid"
      }
    }
  ],
  "count": 1
}
```

---

### **3. Admin Service** ✅
**File:** `src/services/adminService.ts`

**Functions:**
```typescript
// Assign role to user (invite if new)
adminAssignRole({
  email: 'user@example.com',
  role: 'consultant',
  orgSlug: 'quantia'
})

// List users with search
listUsersLike('john@')

// Get memberships for user
listMembershipsByUser('user-id')

// List all consultants
listConsultants()

// List all organizations
listOrganizations()
```

---

### **4. Admin Users Page** ✅
**File:** `src/pages/AdminUsersPage.tsx`
**Route:** `/admin/users`

**Features:**

#### **Left Panel: User Search**
- 🔍 Search bar (filter by email)
- 📊 User list with:
  - Email
  - Roles (admin/consultant/client)
  - Creation date
  - Last login
  - Consultant badge
- 👆 Click user → Load details
- 📋 Selected user info:
  - Email
  - User ID
  - Memberships list

#### **Right Panel: Invite/Assign**
- ✉️ Email input (required)
- 🎭 Role selector (admin/consultant/client)
- 🏢 Organization slug (optional)
- 🚀 Submit button
- ℹ️ Help text explaining behavior

#### **Features:**
- ✅ Real-time search
- ✅ Loading states
- ✅ Success/error toasts
- ✅ Dark mode support
- ✅ Responsive design
- ✅ Role badges (color-coded)
- ✅ Automatic refresh after assign

---

### **5. Route Protection** ✅
**File:** `src/App.tsx`

**Protected Route:**
```tsx
{route.page === 'admin-users' && (
  <AdminGuard>
    <AdminUsersPage onNavigate={navigate} />
  </AdminGuard>
)}
```

Only admin users can access `/admin/users`

---

### **6. Navbar Link** ✅
**File:** `src/components/Navbar.tsx`

**Admin-only link:**
```tsx
{isAdmin && (
  <button onClick={() => onNavigate('admin-users')}>
    <Users className="w-4 h-4" />
    <span>Admin · Users</span>
  </button>
)}
```

Link only visible to admins

---

## 🚀 How to Use

### **Step 1: Login as Admin**

1. Ensure you've run the admin seed script
2. Login with your admin email
3. Check navbar → You should see "Admin · Users"

### **Step 2: Open Admin Users Page**

Click **"Admin · Users"** in navbar

You'll see:
- Left: Search & user list
- Right: Invite/assign form

### **Step 3: Search for Users**

1. Type email in search box (e.g., "john@")
2. Click **"Zoek"** or press Enter
3. Results appear below
4. Click any user to see details

### **Step 4: Invite New User**

1. **Right panel** → Enter email
2. Select role:
   - **Admin** - Full access
   - **Consultant** - Can manage quickscans
   - **Client** - Standard user
3. Enter org slug (e.g., "quantia")
4. Click **"Invite / Role Instellen"**
5. ✅ Success! User receives invite email

### **Step 5: Update Existing User**

1. Search for user
2. Click user to select
3. **Right panel** → Enter same email
4. Change role as needed
5. Click **"Invite / Role Instellen"**
6. ✅ Role updated instantly

---

## 📊 User Roles Explained

### **Admin**
- Full system access
- Can manage users
- Can access all admin pages
- Can manage consultants
- Can view health & environment

**Grants access to:**
- Dashboard ✅
- Quickscan ✅
- Reports ✅
- Consultants ✅
- Admin · Users ✅
- Health ✅
- Environment ✅

### **Consultant**
- Can manage quickscans
- Can view consultant portal
- Can be assigned to clients

**Grants access to:**
- Dashboard ✅
- Quickscan ✅
- Reports ✅
- Consultants ✅
- Admin · Users ❌
- Health ❌
- Environment ❌

### **Client**
- Standard user
- Can do quickscans
- Can view own reports

**Grants access to:**
- Dashboard ✅
- Quickscan ✅
- Reports ✅
- Consultants ❌
- Admin · Users ❌
- Health ❌
- Environment ❌

---

## 🔐 Security Features

### **Backend (Edge Functions)**

✅ **Admin verification:**
```typescript
const { data: memberships } = await server
  .from('memberships')
  .select('role')
  .eq('user_id', currentUser.id);

const isAdmin = memberships?.some(m => m.role === 'admin');
if (!isAdmin) {
  return 403 Forbidden;
}
```

✅ **Service role only in backend:**
- Frontend never touches service role key
- All admin operations via edge functions
- RLS bypassed safely server-side only

✅ **JWT verification:**
- Every request requires valid Bearer token
- Token verified before admin check
- Invalid tokens → 401 Unauthorized

### **Frontend (UI)**

✅ **Route protection:**
```tsx
<AdminGuard>
  <AdminUsersPage />
</AdminGuard>
```

✅ **Link hiding:**
```tsx
{isAdmin && <Link to="/admin/users">Admin · Users</Link>}
```

✅ **Loading states:**
- Prevents race conditions
- Shows proper UI feedback
- Handles errors gracefully

---

## 🧪 Test Scenarios

### **✅ Admin Can Invite New User**

1. Login as admin
2. Go to Admin · Users
3. Enter new email: `newuser@test.com`
4. Select role: `consultant`
5. Org: `quantia`
6. Submit
7. **Expected:**
   - ✅ Success toast
   - ✅ User receives invite email
   - ✅ User appears in list
   - ✅ Has consultant role

### **✅ Admin Can Update Existing Role**

1. Search for existing user
2. Enter their email
3. Change role to `admin`
4. Submit
5. **Expected:**
   - ✅ Success toast
   - ✅ Role updated in DB
   - ✅ User can now access admin features

### **✅ Non-Admin Cannot Access**

1. Login as consultant/client
2. Try `/admin/users` directly
3. **Expected:**
   - ✅ "Access Denied" screen
   - ✅ Cannot see "Admin · Users" link

### **✅ Search Works**

1. Type partial email: `john`
2. Click search
3. **Expected:**
   - ✅ Only matching users shown
   - ✅ Results sorted by creation date
   - ✅ Shows role badges

### **✅ Consultant Record Auto-Created**

1. Assign role `consultant`
2. Check database
3. **Expected:**
   - ✅ Membership created
   - ✅ Consultant record created
   - ✅ Can be assigned to quickscans

---

## 🎨 UI Features

### **Role Badges**

```
Admin      → Amber background
Consultant → Sky blue background
Client     → Gray background
```

### **User Cards**

```
┌─────────────────────────────────┐
│ user@example.com       [Consultant]
│ Rollen: admin, consultant
│ Aangemaakt: 18-10-2025
│ Laatste login: 18-10-2025
│                    [Details →]
└─────────────────────────────────┘
```

### **Success Toast**

```
┌─────────────────────────────────┐
│ ✓ Rol ingesteld: consultant voor
│   user@example.com (uitnodiging
│   verstuurd)
└─────────────────────────────────┘
```

### **Error Toast**

```
┌─────────────────────────────────┐
│ ✗ Forbidden: Admin access required
└─────────────────────────────────┘
```

---

## 📝 API Reference

### **POST /functions/v1/admin-assign-role**

**Headers:**
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "role": "consultant",
  "orgSlug": "quantia"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "email": "user@example.com",
  "role": "consultant",
  "orgSlug": "quantia",
  "userExists": true,
  "userId": "uuid",
  "invited": false
}
```

**Error Responses:**
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (not admin)
- `400` - Bad request (missing email/role)
- `500` - Internal server error

---

### **GET /functions/v1/admin-list-users**

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Query Parameters:**
- `q` (optional) - Search query (filters by email)

**Success Response (200):**
```json
{
  "users": [...],
  "count": 10
}
```

**Error Responses:**
- `401` - Unauthorized (no/invalid token)
- `403` - Forbidden (not admin)
- `500` - Internal server error

---

## 🐛 Troubleshooting

### **Problem: "Forbidden: Admin access required"**

**Solution:**
1. Verify you're admin:
   ```sql
   SELECT * FROM memberships
   WHERE user_id = 'YOUR_USER_ID';
   ```
2. Should have `role = 'admin'`
3. If not, run admin seed script
4. Logout and login again

### **Problem: Link not visible in navbar**

**Solution:**
1. Check role is loading:
   - Open React DevTools
   - Find Navbar component
   - Check `isAdmin` prop
2. Hard refresh: `Ctrl+Shift+R`
3. Clear localStorage: `localStorage.clear()`

### **Problem: User invited but not showing**

**Solution:**
1. Wait 30 seconds (invite processing)
2. Click search again
3. Check Supabase logs:
   - Dashboard → Edge Functions → admin-assign-role → Logs

### **Problem: Cannot update role**

**Solution:**
1. Ensure email is exact match
2. Check edge function logs for errors
3. Verify org exists: `SELECT * FROM organizations WHERE slug = 'quantia'`

---

## 📚 File Structure

```
project/
├── supabase/
│   └── functions/
│       ├── admin-assign-role/
│       │   └── index.ts           ✅ Role assignment
│       └── admin-list-users/
│           └── index.ts           ✅ User listing
│
├── src/
│   ├── pages/
│   │   └── AdminUsersPage.tsx    ✅ Admin UI
│   │
│   ├── services/
│   │   ├── adminService.ts       ✅ API helpers
│   │   └── roleService.ts        ✅ Role checks
│   │
│   ├── components/
│   │   ├── Guard.tsx             ✅ Route protection
│   │   └── Navbar.tsx            ✅ Admin link
│   │
│   └── App.tsx                   ✅ Route config
│
└── ADMIN_USER_MANAGEMENT.md      📖 This file
```

---

## 🎉 Build Status

```bash
✓ 2662 modules transformed
✓ built in 13.40s

Bundle Sizes:
  dist/index.html:        0.47 kB
  dist/assets/index.css: 36.15 kB (gzip: 6.54 kB)
  dist/assets/index.js:  2,248.68 kB (gzip: 713.09 kB)
```

**Status:** ✅ Production Ready

---

## 🚀 Complete Feature List

| Feature | Status | Description |
|---------|--------|-------------|
| **Invite New Users** | ✅ | Email invites via Supabase Auth |
| **Assign Roles** | ✅ | admin/consultant/client |
| **Update Roles** | ✅ | Change existing user roles |
| **Search Users** | ✅ | Filter by email |
| **List Users** | ✅ | All auth.users with enrichment |
| **View Memberships** | ✅ | See user's roles per org |
| **View Consultants** | ✅ | Badge for consultant users |
| **Admin-Only Access** | ✅ | Backend + frontend guards |
| **Dark Mode** | ✅ | Full theme support |
| **Loading States** | ✅ | Proper UX feedback |
| **Error Handling** | ✅ | Toast notifications |
| **Auto-Create Consultants** | ✅ | For consultant role |
| **Multi-Tenant Support** | ✅ | Org slug parameter |
| **CORS Enabled** | ✅ | All endpoints |
| **Type-Safe** | ✅ | Full TypeScript |
| **Deployed** | ✅ | Edge functions live |
| **Documented** | ✅ | This file |

---

## 📖 Related Documentation

- **This Guide:** `ADMIN_USER_MANAGEMENT.md`
- **Admin Setup:** `ADMIN_SETUP_COMPLETE.md`
- **Fase 4 Guide:** `FASE_4_SETUP.md`
- **Edge Functions:** `EDGE_FUNCTIONS_SECRETS.md`

---

## 🎯 Summary

**You now have:**

✨ Complete admin user management interface
👥 Invite users via email
🎭 Assign/update roles (admin/consultant/client)
🏢 Multi-tenant organization support
🔐 Secure backend + frontend guards
🎨 Beautiful dark mode UI
📱 Responsive design
🚀 Production ready
📖 Complete documentation

**Ready to use immediately!**

Login as admin → Click "Admin · Users" → Start managing users!
