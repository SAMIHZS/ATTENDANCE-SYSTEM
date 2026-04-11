# Seed BCA4 Demo Data

This directory contains `seed-bca4.ts`, a custom seeder script built specifically from your BCA4 Final Attendance data dump.

## What This Does
- **Class**: Creates `BCA 4th Semester`.
- **Subjects**: Dynamically creates all 18 columns (Python, Python Lab, OS, etc.) and wires them to the `BCA 4th Semester` class via the `class_subjects` mapping using a dummy teacher.
- **Sessions**: Uses chronological back-stepping to generate precisely 408 historically submitted DB `sessions` spread across the last 90 days.
- **Students & Attendance**: Imports all 65 students (e.g. `ANDLURI RUKMINI`). For each student, the script iterates through their actual real-world class count for each subject, and executes exact `present`/`absent` attendance log insertions into the `attendance` table mapping precisely to the synthetic sessions.
- **Totals**: You will ultimately end up with ≈26,520 exact attendance transaction rows making your live Dashboards flawless.

## Requirement
Because injecting 26,000 bypassing standard endpoint routing requires Admin access to the database, this script executes using the Supabase Service Role Key.

Before running, **you must add your `SUPABASE_SERVICE_ROLE_KEY` to your `backend/.env` file**:
1. Open Supabase Dashboard
2. Project Settings → API
3. Copy the `service_role` secret
4. Paste into `backend/.env` under `SUPABASE_SERVICE_ROLE_KEY`

## How To Run

Open your terminal and run:

```bash
cd backend
npm run seed:bca4
```

You will see output logs step-by-step constructing your metrics.

## How to Explore the Seeded Data

### As an Admin / Teacher
Your admin dashboard graphs and class-overview aggregates will pull this heavy historical dataset, highlighting accurate 80%+ graphs vs shortage drops precisely mapping to the 65 students.
Since the dummy students don't have authenticated profiles, no extra spam accounts will crowd your Google Auth directory. Teachers running Roll-Call endpoints for future classes under `BCA 4th Semester` will fetch these students dynamically!
