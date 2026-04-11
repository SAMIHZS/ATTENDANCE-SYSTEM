# Attendance Management System — Architecture Document

## Document Control
- **Product:** Attendance Management System (Phase 1 MVP)
- **Document Type:** Solution Architecture Document
- **Version:** 1.0
- **Status:** Draft
- **Purpose:** Define the technical architecture, component boundaries, data flow, security model, and deployment structure for implementation

## Architecture Overview
The system should use a modular client-server architecture with a mobile-first React frontend, a Node.js/Express application layer, and Supabase PostgreSQL as the system of record. This structure fits the product’s need for relational data integrity, transactional attendance submission, and role-based restrictions across admin, teacher, and student personas [web:22][web:29].

A relational backend is especially appropriate because attendance management depends on strong relationships between users, students, teachers, classes, subjects, timetable slots, sessions, and attendance facts. Supabase’s PostgreSQL foundation is well suited for applications with structured data, foreign keys, joins, and transactional consistency, which directly matches this use case [web:22].

## Architecture Goals
The architecture is designed to satisfy five core goals:
- Fast teacher attendance flow on mobile devices
- Strong consistency for session and attendance records
- Strict RBAC and scoped data access
- Low operational complexity for MVP launch
- Clean extensibility for future analytics, NFC, notifications, and multi-tenant support

Implementation guidance for attendance systems consistently recommends defining clear requirements early and planning for growth, which supports an architecture that is simple for Phase 1 but scalable in structure [web:17].

## High-Level Topology
```text
[ Browser / Mobile Web App ]
          |
          v
[ React Frontend / PWA-ready UI ]
          |
          v
[ Express API Layer ]
   |              \
   |               \__ [ Export Service ]
   v
[ Supabase Auth ]
   |
   v
[ Supabase PostgreSQL ]
```

The frontend should remain responsible for presentation, local interaction state, and role-based screen rendering, while the backend should own session logic, attendance submission, authorization checks, and reporting logic. Backend-first separation is considered a strong pattern for secure mobile-oriented products because it keeps the client and server independent while preserving clear API boundaries [web:29].

## Architectural Style
### Selected Style
Use a **modular monolith** for Phase 1:
- One React application for all user roles
- One Express backend codebase
- One PostgreSQL database
- Feature modules inside the backend rather than separate microservices

This approach keeps infrastructure lightweight while avoiding premature distribution complexity. It also supports future extraction of services such as exports, notifications, analytics, or audit processing if usage grows.

### Why Not Microservices Yet
The app currently has one main domain and one primary operational workflow: timetable-driven session attendance. A modular monolith is the right tradeoff because it simplifies deployment, debugging, transactions, and developer velocity for an MVP while still preserving internal module boundaries for later separation [web:17][web:29].

## Core Components
### Frontend
**Technology:** React, mobile-first, optionally PWA-ready

**Responsibilities:**
- Login and role-based routing
- Teacher dashboard with live class display
- Attendance marking UI
- Admin management screens
- Student attendance summary screens
- Client-side form validation
- API consumption and token handling

### Backend API
**Technology:** Node.js with Express

**Responsibilities:**
- Authentication verification
- Role and scope enforcement
- Live class resolution
- Session creation and duplicate prevention
- Attendance submission transaction handling
- Attendance percentage calculations
- Export generation orchestration
- Admin correction workflows

### Auth Layer
**Technology Option A:** Supabase Auth  
**Technology Option B:** JWT with custom auth table

For this application, Supabase Auth is a strong fit because it reduces infrastructure work for identity and pairs naturally with PostgreSQL-backed policy enforcement patterns [web:25][web:31].

### Database
**Technology:** Supabase PostgreSQL

**Responsibilities:**
- Store academic master data
- Store timetable structure
- Store session facts
- Store attendance facts
- Support joins for reporting and dashboard summaries
- Enforce constraints and indexes

### Export Module
**Responsibilities:**
- Generate PDF reports
- Generate Excel exports
- Support filterable export requests by class, subject, and date range

This can live inside the backend in Phase 1, and later be extracted into an asynchronous job worker if report size or export traffic increases.

## Logical Architecture
### Presentation Layer
The presentation layer contains all role-specific user interfaces:
- Admin UI
- Teacher UI
- Student UI

The UI should not directly contain business truth. Its role is to request, display, and submit information. Validation for convenience can happen on the client, but authorization and final validation must remain server-side.

### Application Layer
The application layer contains use-case orchestration:
- Determine live class
- Start session
- Apply subject override
- Submit attendance
- Calculate attendance summary
- Edit attendance as admin
- Export report data

### Data Layer
The data layer contains:
- PostgreSQL schema
- relational constraints
- indexes
- optional row-level security policies
- views or query helpers for reporting

Supabase and PostgreSQL are particularly valuable here because the product relies on relational joins and strict integrity between normalized entities rather than flexible document storage [web:22].

## Module Decomposition
### Auth Module
Handles:
- Login
- Session validation
- Role resolution
- Auth context for API requests

### User Module
Handles:
- User profile lookup
- Role mapping
- Teacher/student profile resolution

### Academic Structure Module
Handles:
- Classes
- Subjects
- Teachers
- Students
- Class-subject assignment

### Timetable Module
Handles:
- Timetable CRUD
- Slot validation
- Day/time conflict detection
- Lookup for live and upcoming classes

### Session Module
Handles:
- Create session from timetable slot
- Preserve scheduled subject and teacher
- Store actual subject and teacher
- Prevent duplicate session creation
- Track status transitions such as draft and submitted

### Attendance Module
Handles:
- Build attendance roster for session
- Store present/absent facts
- Lock teacher submissions
- Admin edit path
- Student and subject attendance summaries

### Export Module
Handles:
- Filter attendance records
- Format printable and structured outputs
- Generate PDFs and spreadsheets

## Key Domain Decision
### Session-First Data Model
The most important architecture decision is to model attendance through a `session` entity and store student attendance as child facts of that session. This preserves the exact instructional occurrence and avoids ambiguity when timetable, actual subject, and teacher identity differ.

**Why it matters:**
- Reporting stays accurate when subject override is used
- Duplicate prevention becomes easier
- Teacher submission lock is easier to manage
- Admin edits can target a single session record
- Future analytics can operate on real classroom events

## Request Flow Design
### Login Flow
```text
User -> Frontend Login Form -> Auth Service -> Token Issued
     -> Frontend stores in memory/session-safe layer
     -> Frontend requests /auth/me -> role-based routing
```

### Teacher Start Attendance Flow
```text
Teacher opens dashboard
-> Frontend requests /teacher/live-class
-> Backend resolves current timetable slot
-> Backend returns current class context
-> Teacher taps Start Attendance
-> Backend creates or reuses session
-> Backend returns session + student roster
-> Frontend opens attendance screen
```

### Attendance Submission Flow
```text
Teacher marks attendance
-> Frontend submits payload to /teacher/sessions/:id/attendance-submit
-> Backend validates teacher scope and session state
-> Backend performs transactional write
-> Session status becomes submitted
-> Response returns success summary
```

### Student Dashboard Flow
```text
Student opens dashboard
-> Frontend requests attendance summary API
-> Backend resolves student identity from auth token
-> Backend calculates overall and subject-wise percentages
-> Frontend renders dashboard cards and history
```

## API Architecture
### API Style
Use REST for Phase 1 because the product domain is structured, role-based, and CRUD-heavy. REST is easier to secure, easier to document, and more straightforward for Stitch-generated UI integration than introducing GraphQL at MVP stage.

### API Versioning
Use versioned routes from the beginning:
- `/api/v1/auth/*`
- `/api/v1/admin/*`
- `/api/v1/teacher/*`
- `/api/v1/student/*`

This keeps future changes manageable without breaking clients.

### Endpoint Grouping
| Area | Example Endpoints |
|---|---|
| Auth | `/auth/login`, `/auth/me`, `/auth/logout` |
| Admin | `/admin/classes`, `/admin/timetable`, `/admin/attendance/:sessionId` |
| Teacher | `/teacher/dashboard`, `/teacher/live-class`, `/teacher/sessions/start` |
| Student | `/student/dashboard`, `/student/attendance/history` |
| Export | `/admin/exports/attendance` |

## Data Architecture
### Main Entities
The architecture depends on these primary entities:
- `users`
- `students`
- `teachers`
- `classes`
- `subjects`
- `class_subjects`
- `timetable`
- `sessions`
- `attendance`

These entities model the academic structure, scheduled teaching plan, actual class occurrence, and student attendance fact set.

### Entity Relationship Summary
```text
users -> students -> classes
users -> teachers
classes <-> subjects through class_subjects
classes + timetable -> sessions
sessions -> attendance -> students
```

### Database Rationale
A relational schema is required because attendance queries will routinely answer questions like:
- Which students in BCA2 were absent in today’s 10:00–11:00 session?
- What is a student’s subject-wise attendance for AI?
- Which sessions were taught as override subjects?
- Which teacher marked attendance for a given slot?

That kind of reporting depends on joins and referential integrity, which is a direct strength of PostgreSQL and Supabase [web:22].

## Database Constraints
### Recommended Constraints
- Unique student roll number per class
- Unique session by class + date + start + end time
- Foreign keys across all reference fields
- Check constraint for attendance status enum values
- Check constraint for role enum values

### Recommended Indexes
- `timetable(class_id, day_of_week, start_time)`
- `sessions(class_id, date)`
- `sessions(actual_teacher_id, date)`
- `attendance(session_id)`
- `attendance(student_id)`

These indexes support live-class lookup, date-based attendance history, and student dashboard performance.

## Transaction Design
### Critical Transaction: Submit Attendance
Attendance submission must be atomic. Either the whole session attendance is stored successfully, or none of it is committed.

A single transaction should:
1. Validate teacher authorization
2. Confirm session is not already locked
3. Validate student list belongs to session class
4. Upsert or insert attendance rows
5. Mark session as submitted
6. Commit

If any step fails, the transaction should roll back. Transactional consistency is one of the reasons PostgreSQL is an appropriate fit for this system [web:22].

## Duplicate Prevention Strategy
### Problem
A teacher might tap start multiple times, refresh, or retry after a slow network response.

### Solution
Use an idempotent session-creation strategy:
- Check if a session already exists for the same class, date, start time, and end time
- If found, return that session instead of creating a new one
- If not found, create it within a transaction

This is one of the key controls needed for attendance systems where the same real-world class must never be counted twice.

## RBAC Architecture
### Role Model
The system has three application roles:
- Admin
- Teacher
- Student

RBAC is valuable in applications with sensitive data and layered operational responsibility because it organizes access around roles rather than individual users and scales more cleanly as the system grows [web:25][web:31].

### Enforcement Layers
RBAC should exist in three places:
1. **Frontend routing** — for UX and navigation control
2. **Backend authorization middleware** — for API access control
3. **Database query or RLS policy layer** — for data-level protection

### Recommended Policy Direction
If you adopt deeper Supabase-native protection, enable Row Level Security and use role-linked access policies so users only access rows they are entitled to see. Supabase-focused RBAC and RLS guidance strongly recommends pairing authentication with database-level policy controls for sensitive application data [web:25][web:28].

### Scope Rules
- Admin: full access
- Teacher: only assigned/live-class and owned session scope
- Student: only own attendance data

## Security Architecture
### Security Objectives
- Prevent data leakage across users
- Prevent unauthorized attendance edits
- Prevent forged submissions
- Protect academic records and credentials

### Security Controls
- HTTPS everywhere
- Short-lived access tokens and secure refresh strategy
- Password hashing when using custom auth
- Backend-side ownership checks on every protected endpoint
- Database constraints for integrity
- Audit-ready status model for future edit tracking

### Sensitive Data Exposure Rules
- Never expose other students’ records to students
- Never trust teacher-submitted student IDs without session/class validation
- Never expose admin-only management data to teacher endpoints

Applications with role-sensitive business data benefit from layered RBAC rather than frontend-only access controls, because backend and database enforcement are what actually protect records [web:25][web:31].

## Live Class Resolution Architecture
### Inputs
- Current date
- Current time
- Teacher identity
- Timetable table

### Resolution Logic
1. Resolve teacher profile from authenticated user
2. Find timetable rows where current weekday matches
3. Filter slots where current time is between `start_time` and `end_time`
4. Filter for teacher assignment relevance
5. Return the active class context

### Fallback Behavior
- No match -> return empty live-class state
- One match -> return active class
- More than one match -> flag configuration conflict and log for admin review

## Subject Override Architecture
### Design Requirement
The system must preserve both scheduled and actual teaching context so attendance reports remain trustworthy even when the class topic changes.

### Data Rule
- `scheduled_subject_id` comes from timetable
- `actual_subject_id` defaults to scheduled subject unless overridden
- Reports should primarily use actual subject for student attendance computation

This design prevents timetable truth from overwriting classroom truth.

## Frontend Architecture
### UI Structure
Use route groups or role shells:
- `AdminLayout`
- `TeacherLayout`
- `StudentLayout`

### Recommended Frontend Layers
- `pages/` or routes
- `components/`
- `features/attendance/`
- `features/timetable/`
- `features/dashboard/`
- `services/api/`
- `auth/`
- `hooks/`
- `types/`

### State Strategy
Use lightweight state management for Phase 1:
- Auth state
- Current user role
- Current live class data
- Attendance form state
- Simple cache for dashboard data

Because the product is mostly server-driven, avoid heavy global client state until complexity justifies it.

### Mobile-First Considerations
Mobile-first design guidance emphasizes simplified navigation and thumb-friendly patterns, which is especially important for teacher attendance use on phones [web:26].

Recommended UI architecture choices:
- Teacher flow optimized for single-hand interaction
- Sticky bottom action bar on attendance screen
- Minimal route depth for daily tasks
- Compact but readable list rows

## Backend Architecture
### Express Layering
Recommended structure:
- `routes/`
- `controllers/`
- `services/`
- `repositories/`
- `middleware/`
- `validators/`
- `utils/`

### Layer Responsibilities
- **Routes:** endpoint registration
- **Controllers:** request-response orchestration
- **Services:** business rules and workflows
- **Repositories:** database query logic
- **Middleware:** auth, RBAC, validation hooks
- **Validators:** request schema checks

This keeps business logic away from transport details and makes testing easier.

## Integration Architecture
### Frontend to Backend
- HTTPS JSON APIs
- Bearer token auth
- Standard response envelopes for consistency

### Backend to Database
- Supabase client or PostgreSQL access layer
- Parameterized queries / ORM / query builder
- Transaction-aware attendance write operations

### Backend to Export Engine
- Internal service invocation in Phase 1
- Optional async job queue in future

## Observability Architecture
### Phase 1 Minimum
- Structured backend logs
- Error logging for failed submissions and auth denials
- Request IDs for traceability
- Basic uptime and API error monitoring

### Important Events to Log
- Login success/failure
- Session creation
- Attendance submission
- Admin attendance edit
- Timetable conflict detection
- Export requests

These logs are especially helpful because duplicate sessions, wrong teacher scope, and live-class mismatches are among the main operational risks.

## Performance Architecture
### Main Performance Risks
- Rendering large student lists
- Recomputing attendance summaries on demand
- Admin report filters over growing attendance data

### Phase 1 Performance Strategy
- Add indexes for common lookups
- Use server-side filtering and pagination where needed
- Keep teacher dashboard queries narrow
- Cache or precompute only if real load proves necessary
- Optimize attendance payload shapes

### Large Class Handling
The product target is 50–100 students per class, so the attendance screen should avoid heavy nested components and expensive re-renders. Teacher interaction should stay close to one tap per student status change.

## Availability and Reliability
### Reliability Priorities
- Session creation must be idempotent
- Attendance submission must be transactional
- Role enforcement must never fail open
- Exports should not block attendance operations

### Failure Modes
| Failure | Impact | Handling |
|---|---|---|
| Auth failure | User blocked | Return 401 and redirect to login |
| DB write failure | Attendance not saved | Rollback transaction and show retry state |
| Duplicate session attempt | Data inconsistency risk | Return existing session |
| Timetable conflict | Wrong live class | Flag config error and stop automatic selection |
| Export timeout | Admin reporting delay | Retry or move to async job later |

## Deployment Architecture
### Recommended Deployment
- **Frontend:** Vercel
- **Backend:** Render, Railway, Fly.io, or similar Node hosting
- **Database/Auth:** Supabase

This keeps deployment operationally light while separating frontend delivery from backend logic.

### Environment Separation
Use at least:
- Development
- Staging
- Production

### Environment Variables
- Supabase URL
- Supabase anon/service keys as appropriate
- JWT secret if custom auth is used
- Export storage settings
- App base URLs

## Scalability Path
### Phase 1
- Single backend instance is acceptable
- Single database primary is acceptable
- Inline export generation is acceptable for moderate volumes

### Phase 2+
Potential evolution:
- Async export worker
- Read replicas for heavy reporting workloads
- Notification service
- Audit event stream
- Multi-tenant institution partitioning

Supabase’s PostgreSQL base can scale with stronger compute and read replicas when application load grows, which makes it a reasonable launch platform with headroom for future expansion [web:22].

## Multi-Tenancy Readiness
Multi-institution support is out of scope for Phase 1, but the architecture should avoid blocking it later. The cleanest future extension is to add `institution_id` to all core academic and attendance entities and enforce tenant-aware filtering at both API and database layers.

## Suggested Folder Structure
```text
frontend/
  src/
    auth/
    components/
    features/
      attendance/
      dashboard/
      timetable/
      users/
    pages/
    routes/
    services/
    types/

backend/
  src/
    routes/
    controllers/
    services/
    repositories/
    middleware/
    validators/
    db/
    utils/
```

## Architecture Decision Summary
| Area | Decision | Why |
|---|---|---|
| App style | Modular monolith | Lowest complexity for MVP |
| Frontend | React | Good fit for Stitch-led UI and role-based screens |
| Backend | Express | Clear API layer for business logic |
| Database | Supabase PostgreSQL | Strong relational model and transactional integrity [web:22] |
| Auth | Prefer Supabase Auth | Lower auth infrastructure burden [web:25] |
| Access control | RBAC + optional RLS | Better protection for sensitive role-scoped data [web:25][web:31] |
| Reporting | In backend service | Simpler MVP delivery |
| Export | Inline first, async later | Good enough for early scale |

## Recommended Implementation Priorities
1. Authentication and role identity resolution
2. Academic structure and timetable module
3. Live class resolution API
4. Session creation with duplicate prevention
5. Attendance submission transaction
6. Student attendance summary APIs
7. Admin edit and export module
8. Observability and hardening

## Final Recommendation
The clearest architecture for this product is a **React + Express + Supabase modular monolith** centered on a **session-first attendance model**. That combination gives you strong data integrity, low MVP infrastructure complexity, clean mobile-friendly API design, and a secure foundation for role-scoped access and future expansion [web:22][web:25][web:29].

For build quality, the two most important non-negotiables are **transactional attendance submission** and **layered RBAC enforcement**. Those two decisions do the most to protect data accuracy, privacy, and operational trust in a real college attendance workflow [web:22][web:25][web:31].
