# Attendance Management System - Runbook & Setup Guide

This document provides everything needed to set up, run, and demo the Attendance Management System.

## Project Architecture
- **Frontend**: React (Vite) + Tailwind CSS + TanStack Query.
- **Backend**: Node.js (Express) + TypeScript.
- **Database**: Supabase (PostgreSQL) + Row Level Security (RLS).
- **Authentication**: Supabase Auth (JWT).

---

## Prerequisites
- **Node.js**: v18 or later.
- **Supabase Account**: A project with the following extensions enabled: `uuid-ossp`.
- **Environment Variables**: See `backend/.env` and `frontend/.env`.

---

## Setup Instructions

### 1. Backend Configuration
1. Navigate to `backend/`.
2. Install dependencies: `npm install`.
3. Create a `.env` file:
   ```env
   PORT=3000
   SUPABASE_URL=your_project_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 2. Frontend Configuration
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Create a `.env` file:
   ```env
   VITE_SUPABASE_URL=your_project_url
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_API_URL=http://localhost:3000/api/v1
   ```

### 3. Database & Seeding
The system includes a realistic student dataset (BCA 4th Semester).
1. Run SQL migrations found in `db/migrations/` (or contact admin for the schema dump).
2. Seed the data:
   - Run `npx ts-node seed-bca4.ts` from the backend directory.
   - **Warning**: Do not run multiple times on the same DB to avoid duplicate student profiles.

---

## Running the Application

### Development Mode
- **Backend**: `npm run dev` (starts on port 3000).
- **Frontend**: `npm run dev` (starts on port 5173).

### Production Build
- **Backend**: `npm run build` followed by `npm start`.
- **Frontend**: `npm run build` (outputs to `dist/`).

---

## Demo Accounts & Personas

| Role | Email | Password | What to Demo |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@example.com` | `password123` | Dashboard metrics, CSV Exports, Attendance Overrides. |
| **Teacher** | `teacher@example.com` | `password123` | Live Roll Call, Attendance History, Submit Ledger. |
| **Student** | `student@example.com` | `password123` | Personal Attendance Dashboard, Progress Bars, Subject History. |

---

## Known Limitations & Roadmap
1. **Exports**: Currently supports CSV/Excel-ready formats. PDF generation is a planned future phase.
2. **Offline Support**: The system requires a live connection to Supabase.
3. **Multi-Tenancy**: Designed for a single institution. Multi-tenant logic would require a `tenant_id` at the RLS layer.
4. **Notifications**: Push notifications for attendance shortage are currently manual (via dashboard alerts).
