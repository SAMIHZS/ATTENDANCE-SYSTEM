# Database Reset Guide

## Overview

The `reset-db.ts` script provides a **safe, non-destructive** way to reset your Attendance Management System database to a clean state while preserving the core schema, migrations, and RPCs.

## What Gets Deleted

- ✂️ **attendance** — All attendance records
- ✂️ **sessions** — All session records
- ✂️ **timetable** — All timetable entries
- ✂️ **class_subjects** — All class-subject-teacher mappings
- ✂️ **students** — All student records (except binding data)
- ✂️ **teachers** — All teacher records
- ✂️ **profiles** — All user profiles EXCEPT admin and test teacher
- ✂️ **auth.users** — All auth users EXCEPT admin and test teacher (if service role allows)

## What Gets Preserved

- ✓ **Database schema** — Tables, columns, constraints
- ✓ **Migrations** — All migration history
- ✓ **RPCs** — All stored procedures and functions
- ✓ **classes** — Generic class listings (BCA1, BCA2, MCA1, etc.)
- ✓ **subjects** — Generic subject listings
- ✓ **Admin profile** — `admin@example.com` with role `admin`
- ✓ **Test teacher profile** — `test@teacher.example.com` with role `teacher`

---

## Prerequisites

1. Ensure you have **Supabase Service Role Key** set in `backend/.env`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

2. Ensure Node.js and dependencies are installed:
   ```bash
   cd backend
   npm install
   ```

---

## How to Run

### Dry Run (See what will happen - no changes)
```bash
cd backend
npx ts-node scripts/reset-db.ts
```

This displays a confirmation message without making changes.

### Actual Reset
```bash
cd backend
npx ts-node scripts/reset-db.ts --confirm
```

This performs the actual deletion and reset. **This action is permanent.**

---

## Step-by-Step Process

The script performs the following steps (in order to respect foreign key constraints):

1. **Delete attendance records** — Lowest-level data dependency
2. **Delete sessions** — Used by attendance
3. **Delete timetable** — References classes/teachers
4. **Delete class_subjects** — References classes/teachers/subjects
5. **Delete students** — References classes and profiles
6. **Delete teachers** — References profiles
7. **Identify admin & test teacher** — Query their IDs
8. **Delete non-admin profiles** — Remove all other users (keeps admin + test teacher)
9. **Verify admin role** — Ensure admin profile has `role = 'admin'`
10. **Verify test teacher role** — Ensure test teacher has `role = 'teacher'`
11. **Keep classes & subjects** — They are generic reference data

---

## After Reset: Creating Fresh Data

Once reset is complete, you can populate fresh data:

### Option A: Import Students via Admin Endpoint
```bash
POST /api/v1/admin/students/import
Content-Type: application/json

{
  "data": [
    {
      "class_id": "class-uuid-1",
      "roll_number": "2024-2502001",
      "full_name": "John Doe",
      "college_email": "2024-2502001@gvpcdpgc.edu.in",
      "is_active": true
    },
    ...
  ]
}
```

### Option B: Use Seed Scripts
```bash
npx ts-node scripts/seed-live.ts
```

---

## Test Accounts After Reset

| Role | Email | Password | Status |
|------|-------|----------|--------|
| **Admin** | `admin@example.com` | (set via Supabase Dashboard) | Ready to use |
| **Test Teacher** | `test@teacher.example.com` | (set via Supabase Dashboard) | Ready to use |

### Setting Passwords for Test Accounts

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Find `admin@example.com` and `test@teacher.example.com`
3. Click **Reset password** and set a new password
4. Or use the dashboard to reset passwords directly

---

## Safety Notes

- ⚠️ **This is permanent.** Always have a backup before running.
- ⚠️ **Run in development first.** Test on a dev Supabase project before production.
- ⚠️ **Service role required.** This script uses the Supabase service role key, which has elevated privileges.
- ⚠️ **No data recovery.** Once deleted, data cannot be recovered (though your Supabase backup may help).

---

## Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
- Check your `backend/.env` file
- Ensure both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set

### "Admin profile not found"
- The script tries to find `admin@example.com`
- If it doesn't exist, create it manually via Supabase Dashboard
- Set its role to `admin` in the profiles table

### "Test teacher profile not found"
- Similarly, create `test@teacher.example.com` manually
- Set its role to `teacher` in the profiles table
- Create a `teachers` row linked to its profile (optional, depends on app flow)

### Script hangs or times out
- Large databases may take a few minutes
- Check network connectivity to Supabase
- Try running in smaller batches if needed

---

## Restoring from Backup

If you made a mistake, restore from Supabase backup:
1. Go to **Supabase Dashboard** → **Backups**
2. Select a backup before the reset
3. Click **Restore**
4. Confirm and wait for restoration to complete

---

## Example Workflow

```bash
# 1. Preview (dry run)
npx ts-node scripts/reset-db.ts

# 2. Confirm and execute
npx ts-node scripts/reset-db.ts --confirm

# 3. Verify in Supabase Dashboard
# Go to Database → Tables and confirm attendance, sessions empty

# 4. Create new admin password (Supabase Dashboard)
# Auth → Users → admin@example.com → Reset password

# 5. Import fresh student data
# POST /api/v1/admin/students/import (from admin account)

# 6. Done! Ready for fresh start
```

---

## Questions?

For more information, see:
- [RUNBOOK.md](../RUNBOOK.md)
- [IDENTITY_AND_EXPORTS_NOTES.md](./IDENTITY_AND_EXPORTS_NOTES.md) (coming soon)
