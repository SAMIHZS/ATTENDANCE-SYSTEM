# Attendance Management System — Product Design Document

## Document Control
- **Product:** Attendance Management System (Phase 1 MVP)
- **Document Type:** Product Design Document / System Design Doc
- **Version:** 1.0
- **Status:** Draft for implementation
- **Prepared For:** MVP product planning, UI design in Stitch, and engineering handoff
- **Architecture Direction:** React frontend, Node.js/Express backend, Supabase PostgreSQL, mobile-first web app [web:12]

## Executive Overview
The Attendance Management System is a mobile-first web application for recording, managing, and reviewing attendance at the granularity of **class + subject + date + time slot**. This structure aligns with the stated requirement that attendance must be tied to a specific instructional session rather than only a day-level class record.

The product is designed to solve a high-frequency operational workflow: teachers need to open the app, identify the current live class, mark attendance in seconds, and submit a locked record with minimal friction. Existing attendance UX examples emphasize that the fastest flow mirrors the real-world practice of marking only absentees while defaulting the class to present, which directly supports the “mark all present, deselect absentees” model in this product [cite:7].

The MVP intentionally keeps infrastructure light while preserving a scalable domain model. Research-oriented SRS examples for attendance systems consistently center the product around user authentication, teacher-led attendance marking, student self-view, role-based access, reporting, and web accessibility, which validates the chosen feature scope for Phase 1 [cite:6][cite:9][cite:12].

## Product Vision
Build a simple, fast, and reliable attendance platform for colleges and training institutions where:
- Teachers can complete attendance in under 60 seconds for a class of up to 100 students.
- Admins can manage academic structure and correct mistakes without touching raw database records.
- Students can independently track attendance percentage and history.
- The system remains extensible for later additions such as NFC, analytics, notifications, audit trails, and multi-institution support.

## Objectives
### Primary Goals
- Reduce time and confusion in attendance marking workflows.
- Ensure each attendance submission is tied to a valid session context.
- Enforce strict role-based visibility and edit controls.
- Support mobile-first usage, especially for teachers during live classroom operation.
- Maintain clean data structures for reporting, export, and future analytics.

### Success Metrics
- Teacher can start attendance within 1–2 taps from dashboard.
- Attendance can be submitted in under 60 seconds for typical classes.
- No duplicate active session is created for the same class and time slot.
- Students only see their own records.
- Admin corrections are auditable at the application layer in future releases.

## Product Scope
### In Scope — Phase 1 MVP
- Authentication with role-based routing
- Admin management of users, classes, subjects, teacher assignment, and timetable
- Teacher live-class detection from timetable
- Session creation from scheduled timetable slot
- Subject override before attendance marking
- Teacher attendance marking with bulk present flow
- Locked attendance after submission
- Student attendance dashboard with overall and subject-wise percentage
- Admin attendance review, edit, and export
- PDF and Excel exports by class, subject, and date range

### Out of Scope — Phase 1
The MVP excludes NFC attendance, voice attendance, notifications, audit logs, multi-tenant support, offline mode, and advanced analytics. Similar SRS references often include notifications or analytics in later stages, which supports treating these as post-MVP rather than launch-critical features [cite:6][cite:12].

## User Roles
| Role | Primary Purpose | Core Permissions | Restrictions |
|---|---|---|---|
| Admin | System governance and academic structure management | Full CRUD for students, teachers, classes, subjects, timetable; view/edit all attendance; export data | None within MVP scope |
| Teacher | Operational attendance capture | View assigned/live classes; start session; override subject before start; mark attendance; view own history | Cannot edit after final submission |
| Student | Personal attendance visibility | View own attendance percentage, subject-wise breakdown, and history | Cannot mark or edit attendance |

This role model matches common attendance-system web application structures that separate administrative management, teacher attendance entry, and student self-service views [cite:6][cite:9][cite:12].

## Design Principles
### Product Principles
- **Fast over feature-heavy:** the primary workflow is attendance submission, so the app should privilege speed over dashboard ornamentation.
- **Mobile-first:** many attendance systems are used on phones in real classrooms, and UX case-study evidence supports subtle, simple layouts over visually dense interfaces [cite:7].
- **Safe by default:** submission locks the record for teachers.
- **Structured for reporting:** every attendance record must map back to a session.
- **Extensible architecture:** domain objects should support future modules without major redesign.

### UX Principles
- One obvious CTA on the teacher dashboard: **Start Attendance**.
- Default to all-present workflow and allow fast absent toggling; this mirrors real-world teacher behavior documented in attendance UX work [cite:7].
- Keep navigation shallow and role-specific.
- Show context before action: class, subject, time, date, teacher.
- Prefer list density and tap efficiency over decorative cards on teacher flows.

## Personas
### Admin Persona
A department coordinator or academic operations admin who manages class structures, subject assignments, timetable, corrections, and exports. This user values control, search, filters, bulk management, and clean reports.

### Teacher Persona
A faculty member who may be in a classroom, corridor, or lab and wants to mark attendance with one hand on a phone. Attendance UX examples suggest older or mixed-skill faculty benefit from subtle colors, simple patterns, and familiar list-based interactions rather than flashy multi-step flows [cite:7].

### Student Persona
A student who checks whether attendance is safe, tracks shortages by subject, and reviews class history. Student-side designs in attendance UX references prioritize dashboard clarity and simple touch interactions for history and subject-level summaries [cite:7].

## Problem Statement
Manual attendance is slow, error-prone, and difficult to reconcile later. Spreadsheet-based or loosely structured systems often fail to represent who taught what, when the scheduled subject changed, and whether duplicate or conflicting records exist.

The critical design problem is not just “mark present or absent,” but preserving **session truth**: what class occurred, what subject was scheduled, what subject actually happened, which teacher was scheduled, and which teacher actually submitted the record. SRS examples for attendance systems consistently treat role-based access, attendance reporting, and session-linked data as foundational product capabilities, reinforcing this design direction [cite:9][cite:12].

## Core Domain Model
### Critical Attendance Unit
Every attendance record is tied to:
- Class
- Subject
- Date
- Time Slot

This is implemented through a **session-first model**:
- A `session` represents a real class occurrence for a class, date, and time slot.
- `attendance` rows belong to a session and a student.
- Scheduled and actual subject/teacher are both preserved in the session.

### Session Semantics
Each session contains:
- `class_id`
- `date`
- `start_time`
- `end_time`
- `scheduled_subject_id`
- `actual_subject_id`
- `scheduled_teacher_id`
- `actual_teacher_id`
- `created_at`

This design prevents reporting errors when a scheduled OS class becomes an AI session in practice. The separation of scheduled versus actual teaching context is essential for timetable reliability and long-term analytics correctness.

## Functional Requirements
### Authentication
#### Requirements
- Login by email or institution ID plus password
- Secure session management via JWT or Supabase Auth
- Role resolved at login and used for route gating
- Logout from all role dashboards
- Password reset may be deferred if institution-admin-managed credentials are used in MVP

#### Acceptance Criteria
- A valid user lands only on permitted screens.
- An invalid credential attempt shows a safe generic error.
- Unauthorized route access redirects to role home or access denied.

### Admin Module
#### Capabilities
- Manage users and role assignment
- Create and edit classes
- Create and edit student records and roll numbers
- Create and edit teacher records
- Create and edit subjects
- Map subjects to class and teacher
- Create and edit timetable slots
- View all sessions and attendance
- Edit submitted attendance
- Export attendance in PDF and Excel

#### Important Admin Behaviors
- Admin can manually correct wrong attendance after submission.
- Admin sees both scheduled and actual subject/teacher values.
- Admin can filter attendance by class, subject, teacher, and date range.

### Teacher Module
#### Dashboard Requirements
Show:
- Current Live Class
- Upcoming Classes
- Past attendance for own classes
- Start Attendance CTA
- Change Subject / Override action before marking begins

The “live class” concept should be timetable-driven, which aligns with web attendance system patterns where teachers access currently opened lessons or active class sessions through the web app [cite:9].

#### Attendance Marking Requirements
- Teacher opens live class
- Student list appears in roll-number order
- Default state should optimize for fast completion
- Teacher can mark all present
- Teacher can toggle absentees with one tap each
- Teacher can review a summary before submit
- Final submit locks teacher editing rights

Attendance UX case-study evidence specifically supports designing around the conventional behavior of selecting only absent students, because that is faster and cognitively closer to classroom practice [cite:7].

#### Restrictions
- Teacher can only view classes assigned to them or sessions they created
- Teacher cannot edit attendance after submission
- Teacher cannot access admin management screens

### Student Module
#### Dashboard Requirements
- Overall attendance percentage
- Subject-wise attendance percentage
- Attendance history by session/date
- Simple personal-only filters

#### Restrictions
- Student can only see own records
- Student cannot alter attendance or session data

## Detailed User Flows
### Teacher Live Attendance Flow
1. Teacher logs in.
2. Dashboard highlights current live class if a timetable slot matches current day/time.
3. Teacher taps **Start Attendance**.
4. System creates or reuses the session for that class/date/time slot.
5. Teacher optionally taps **Change Subject** if scheduled subject differs from actual class taught.
6. Student list loads in roll-number order.
7. System defaults students to present or provides **Mark All Present**.
8. Teacher taps absent students.
9. Teacher submits final attendance.
10. Record is locked for teacher and visible in history.

### Admin Correction Flow
1. Admin opens attendance explorer.
2. Filters by class / date / subject.
3. Opens a session.
4. Reviews scheduled vs actual context.
5. Edits student statuses if correction is needed.
6. Saves updated record.

### Student Review Flow
1. Student logs in.
2. Dashboard shows current overall percentage.
3. Student opens subject breakdown.
4. Student reviews recent attendance history.

## Live Class Detection Logic
### Rules
A live class should be shown when:
- Current day matches timetable `day_of_week`
- Current time falls between timetable `start_time` and `end_time`
- Teacher is the assigned or relevant teacher for that class-subject mapping

### Edge Cases
- No timetable match → show “No live class now” and upcoming classes.
- Overlapping slots should be blocked at timetable creation time.
- Multiple matches for one teacher at same time should be treated as a configuration error and flagged to admin.

This requirement reflects a common attendance-system dependency on timetable-linked lesson access, where lessons are opened and reported through the web app rather than as free-form records [cite:9].

## Subject Override Logic
### Why It Exists
Teachers may teach a different subject than planned. If the system only stores the scheduled subject, reports become inaccurate.

### Required Design
- Session always stores both scheduled and actual subject.
- UI must clearly display both when different.
- Exports and reports should use actual subject for attendance calculations, while optionally preserving scheduled subject in detailed admin reports.

### UX Copy Example
- Scheduled: Operating Systems
- Actual: Artificial Intelligence

## Attendance Marking UI Design Spec
### Teacher Attendance Screen
#### Top Bar
- Back button
- Class name
- Time slot
- Date

#### Context Card
- Scheduled Subject
- Actual Subject
- Scheduled Teacher
- Marked By
- Optional override indicator badge

#### Primary Actions
- Mark All Present
- Reset
- Submit Attendance

#### Student List Item
Each row shows:
- Roll number
- Student name
- Single status toggle state
- Large touch target

### UX Behavior
- Roll number ascending by default
- Sticky action bar on mobile
- Color should support quick scanning but not be the only status signal
- Submission should require a short confirmation, not a long modal chain

Fast, list-oriented attendance marking with minimal color noise aligns with existing attendance UX guidance that emphasizes conventional, quick classroom interaction and subtle visual treatment [cite:7].

## Dashboard Design Spec
### Teacher Dashboard
#### Sections
- Greeting and current date
- Current live class card
- Upcoming classes list
- Recent submissions
- Quick link to past attendance

#### Primary CTA Hierarchy
- If live class exists: **Start Attendance** is dominant
- If no live class: upcoming class cards become dominant

### Admin Dashboard
#### Sections
- Summary cards: total students, teachers, classes, today’s sessions
- Quick actions: add student, assign teacher, manage timetable
- Attendance explorer table
- Export panel

### Student Dashboard
#### Sections
- Attendance percentage hero card
- Subject-wise percentage list
- Recent attendance history
- Warning indicator if attendance below threshold

Attendance dashboards in existing design examples emphasize concise mobile cards, dashboard summaries, and interaction clarity for reports and tab changes, which supports this role-specific dashboard approach [cite:10][cite:13].

## Information Architecture
### Global Navigation by Role
#### Admin
- Dashboard
- Users
- Classes
- Subjects
- Timetable
- Attendance
- Exports

#### Teacher
- Dashboard
- Attendance History
- Profile

#### Student
- Dashboard
- Attendance History
- Profile

### Route Strategy
- `/login`
- `/admin/*`
- `/teacher/*`
- `/student/*`

### Access Strategy
All routes must be protected and resolved server-side or through trusted auth claims. Frontend route hiding alone is insufficient for RBAC enforcement.

## Non-Functional Requirements
### Performance
- Dashboard should load quickly on average mobile networks.
- Attendance list for 60–100 students should render smoothly.
- Marking interaction latency should feel instant.

### Reliability
- Prevent duplicate sessions for same class + date + time slot.
- Prevent unauthorized access to attendance records.
- Ensure each submission is atomic.

### Security
Role-based access control is mandatory because attendance systems expose personal academic records and operational permissions. Attendance SRS sources consistently include authentication, role-based authorization, and report access as core system requirements [cite:6][cite:12].

#### Security Requirements
- JWT/Supabase Auth-based authenticated sessions
- Role checks on every protected API
- Row-level or query-level restriction for student-specific data
- Teacher scope restriction by assignment and ownership
- Admin-only correction rights
- Secure password hashing if using custom auth storage
- Avoid exposing foreign users’ identifiers in APIs

### Scalability
- Support at least 50–100 students per class in MVP
- Support many sessions over time without reporting degradation
- Preserve database structure for later analytics and multi-tenant expansion

### Usability
- 1–2 taps to start attendance
- 1 tap per absent/present change maximum
- Minimal screens for teacher workflow
- Mobile-first layouts with sticky action zones

## Technical Architecture
### Recommended Stack
- **Frontend:** React, PWA-ready
- **Backend:** Node.js with Express
- **Database/Auth:** Supabase PostgreSQL and optionally Supabase Auth
- **Hosting:** Vercel for frontend; managed Node backend hosting for API

### High-Level Architecture
```text
React Web App
  -> Auth Layer (Supabase Auth or JWT)
  -> Express API / BFF
  -> PostgreSQL (Supabase)
```

### Suggested Responsibility Split
#### Frontend
- Role-based dashboards
- Timetable-aware teacher UI
- Attendance marking experience
- Student analytics views
- Admin forms and tables

#### Backend
- Auth validation
- Session generation logic
- Live class resolution
- Attendance submission transaction
- Reporting/export endpoints
- RBAC enforcement

#### Database
- Canonical academic structure
- Session records
- Attendance facts
- Query base for exports and analytics

## Backend Module Design
### Core Services
- `AuthService`
- `UserService`
- `ClassService`
- `SubjectService`
- `TimetableService`
- `SessionService`
- `AttendanceService`
- `ExportService`

### Important Service Responsibilities
#### SessionService
- Detect live class from timetable
- Create session if one does not exist
- Prevent duplicates
- Store scheduled and actual values

#### AttendanceService
- Generate attendance rows for session
- Bulk submit attendance
- Lock record after teacher submission
- Allow admin correction path
- Calculate percentages

#### ExportService
- Class-wise export
- Subject-wise export
- Date-range export
- PDF and Excel variants

## Data Model Design
### Proposed Tables
#### `users`
- `id`
- `name`
- `email`
- `password_hash` (if not using managed auth)
- `role` (`admin`, `teacher`, `student`)
- `created_at`
- `updated_at`

#### `classes`
- `id`
- `name`
- `created_at`

#### `students`
- `id`
- `user_id`
- `class_id`
- `roll_number`
- `status` (optional active/inactive)

#### `teachers`
- `id`
- `user_id`
- `status` (optional)

#### `subjects`
- `id`
- `name`
- `code` (recommended)

#### `class_subjects`
- `id`
- `class_id`
- `subject_id`
- `teacher_id`
- `is_active`

#### `timetable`
- `id`
- `class_id`
- `subject_id`
- `teacher_id`
- `day_of_week`
- `start_time`
- `end_time`

#### `sessions`
- `id`
- `class_id`
- `date`
- `start_time`
- `end_time`
- `scheduled_subject_id`
- `actual_subject_id`
- `scheduled_teacher_id`
- `actual_teacher_id`
- `status` (recommended: `draft`, `submitted`, `edited`)
- `created_at`
- `submitted_at` (recommended)

#### `attendance`
- `id`
- `session_id`
- `student_id`
- `status` (`present`, `absent`)
- `marked_at` (recommended)

### Recommended Additional Constraints
- Unique constraint on `students(class_id, roll_number)`
- Unique functional guard on `sessions(class_id, date, start_time, end_time)`
- Index on `attendance(session_id)`
- Index on `sessions(class_id, date)`
- Index on `timetable(class_id, day_of_week, start_time, end_time)`

## Relational Notes
- `users` is the auth identity root.
- `students` and `teachers` extend `users` by role.
- `class_subjects` defines which teacher teaches which subject to which class.
- `timetable` defines schedule.
- `sessions` captures real occurrences.
- `attendance` stores per-student status for that session.

## API Design
### Auth APIs
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

### Admin APIs
- `GET /admin/users`
- `POST /admin/users`
- `PUT /admin/users/:id`
- `GET /admin/classes`
- `POST /admin/classes`
- `GET /admin/subjects`
- `POST /admin/subjects`
- `GET /admin/timetable`
- `POST /admin/timetable`
- `PUT /admin/attendance/:sessionId`
- `GET /admin/exports/attendance`

### Teacher APIs
- `GET /teacher/dashboard`
- `GET /teacher/live-class`
- `POST /teacher/sessions/start`
- `PUT /teacher/sessions/:id/override-subject`
- `POST /teacher/sessions/:id/attendance-submit`
- `GET /teacher/attendance/history`

### Student APIs
- `GET /student/dashboard`
- `GET /student/attendance/history`
- `GET /student/attendance/summary`

## Attendance Calculation Rules
### Formula
Attendance percentage is calculated as:
\[
\text{Attendance \%} = \left(\frac{\text{Classes Attended}}{\text{Total Classes}}\right) \times 100
\]

### Calculation Policies
- **Overall:** present sessions across all valid counted sessions / total valid counted sessions
- **Subject-wise:** present sessions for that subject / total sessions for that subject
- Exclude canceled or invalid sessions if such a status is added later
- Use `actual_subject_id` for subject-wise computation when available

Attendance-system references regularly include attendance reports, statistics, and filtered reporting interfaces, which supports surfacing both overall and subject-level percentages in the MVP student and admin experiences [cite:12].

## Export Design
### Export Formats
- PDF for print-friendly formatted reports
- Excel for raw and structured analysis

### Export Filters
- Class-wise
- Subject-wise
- Date range
- Optional teacher-wise filter for admin use

### Export Content Requirements
#### PDF
- Institution/app title
- Class
- Subject
- Date range
- Student attendance totals and percentages
- Submission-friendly printable layout

#### Excel
- Structured tabular data
- Session details included
- Student-wise attendance facts
- Percentage summaries

Attendance-system references commonly treat report generation and exportable attendance reporting as central requirements, including filtering and multiple time periods, which supports making exports a core admin capability rather than a later enhancement [cite:12].

## Error Handling Design
### Teacher-Facing Errors
- No live class found
- Attendance already submitted
- Session conflict detected
- Network issue during submit

### Admin-Facing Errors
- Timetable slot overlap
- Duplicate roll number in class
- Subject-teacher mapping missing
- Export filter returns no data

### Student-Facing Errors
- No attendance records yet
- Data temporarily unavailable

## Empty States
### Teacher
- “No live class right now” with upcoming classes list
- “No past attendance yet” in history page

### Student
- “Attendance will appear after your classes are recorded”

### Admin
- “No timetable created yet” with CTA to add slot

Well-designed attendance interfaces use simple, explanatory empty states and actionable next steps rather than blank tables, especially in dashboard-style products [cite:7][cite:13].

## Validation Rules
### Timetable Validation
- No overlapping slot for same class/day
- No overlapping slot for same teacher/day if institution disallows conflicts
- Start time must be before end time

### Session Validation
- One session per class/date/time slot
- Override subject must belong to class-approved subject set unless admin allows exception

### Attendance Validation
- One attendance row per student per session
- Student must belong to session class
- Teacher can submit only for authorized session
- Submitted teacher record cannot be modified by teacher

## State Model
### Session Statuses
Recommended:
- `draft` — session created, attendance being marked
- `submitted` — teacher submitted and locked
- `edited` — admin changed after submission

This status model is not mandatory in the initial schema, but it is strongly recommended because it simplifies locking logic, admin correction visibility, and future audit enhancements.

## Reporting Logic
### Recommended Reporting Hierarchy
- Session-level detail for accuracy
- Student-level aggregates for dashboards
- Subject-level aggregates for academic review
- Class-level summaries for admin export

### Reporting Data Source of Truth
- Session context from `sessions`
- Status facts from `attendance`
- Student mapping from `students`
- Subject semantics from `actual_subject_id` when present

## Security and RBAC Design
### Access Matrix
| Feature | Admin | Teacher | Student |
|---|---|---|---|
| Manage users | Yes | No | No |
| Manage classes | Yes | No | No |
| Manage timetable | Yes | No | No |
| View all attendance | Yes | No | No |
| Edit attendance | Yes | No | No |
| Mark attendance | No | Yes | No |
| View own class history | No | Yes | No |
| View own attendance | No | No | Yes |
| Export attendance | Yes | No | No |

### Enforcement Approach
- Check auth token on every API request
- Resolve user role and associated teacher/student scope
- Restrict SQL queries by actor identity
- Never trust frontend-only filters for privacy

## UI System Guidance for Stitch
### Visual Direction
Because you plan to create the UI in Stitch, the UI should use a restrained, high-clarity product style rather than bright academic-template styling. Attendance UX references indicate that subtle colors, white or neutral surfaces, and familiar interaction patterns help teachers complete tasks faster and with less confusion [cite:7].

### Recommended Design Tokens
- Neutral background with one strong accent color
- Green/red only for status semantics, not large decorative areas
- Dense but readable list rows
- 16px+ base body text on mobile
- Sticky bottom CTA for submit on teacher screens

### Screen Priority for Stitch
1. Login
2. Teacher dashboard
3. Attendance marking screen
4. Subject override sheet/modal
5. Student dashboard
6. Admin dashboard
7. Admin timetable manager
8. Attendance explorer and export screen

### Mobile-First Stitch Notes
- Teacher dashboard should surface live class above all else.
- Attendance list rows should be large enough for one-tap selection.
- Admin desktop view can be denser, but mobile admin should still be usable.
- Student dashboard should prioritize percentage cards and recent history.

## Suggested Screen Inventory
| Screen | Role | Purpose |
|---|---|---|
| Login | All | Authentication |
| Teacher Dashboard | Teacher | Show live class and quick actions |
| Attendance Session | Teacher | Mark attendance fast |
| Override Subject Modal | Teacher | Change actual subject before submit |
| Teacher History | Teacher | Review submitted sessions |
| Student Dashboard | Student | View attendance summary |
| Student History | Student | View attendance sessions |
| Admin Dashboard | Admin | Overview and quick actions |
| User Management | Admin | Manage students/teachers |
| Class & Subject Management | Admin | Academic structure |
| Timetable Manager | Admin | Schedule slots |
| Attendance Explorer | Admin | Review and edit records |
| Export Center | Admin | PDF/Excel exports |

## Risks and Mitigations
| Risk | Why It Matters | Mitigation |
|---|---|---|
| Timetable sync errors | Wrong live class shown to teacher | Strict timetable validation; visible session context card |
| Subject override misuse | Reporting inconsistency | Force explicit override before submit and preserve both scheduled/actual subject |
| Large class performance | Marking slows down for 60+ students | Virtualized or optimized list rendering; default present flow |
| Duplicate sessions | Double counting attendance | Unique session constraints and idempotent start-session API |
| Unauthorized access | Privacy and compliance issue | Strong RBAC checks, scoped queries, protected routes |
| Admin correction ambiguity | Trust loss in attendance data | Add edited status and store correction metadata in future iteration |

## MVP Delivery Plan
### Recommended Build Sequence
1. Authentication and role routing
2. Core data setup: users, classes, students, teachers, subjects
3. Timetable and class-subject assignment
4. Teacher dashboard with live class detection
5. Session creation and attendance marking
6. Student dashboard and percentage calculation
7. Admin attendance explorer and edit tools
8. Export module

### Why This Sequence Works
This order ships the core operational loop first, then exposes read/reporting surfaces afterward. Attendance-system references generally organize functionality around authentication, attendance entry, and reporting in that order, which makes this sequence implementation-friendly and product-valid [cite:6][cite:12].

## Future-Ready Extensions
The MVP data model is compatible with several later additions:
- NFC tap attendance by attaching device/event sources to sessions or attendance facts
- Voice roll call as an alternate marking input method
- Notifications for shortage or missed classes
- Audit log table for corrections and actor events
- Multi-tenant institution isolation via `institution_id`
- Offline sync with local queue and conflict resolution
- Analytics dashboard with attendance trends and alerts

## Engineering Notes
### Recommended Technical Decisions
- Use Supabase Row Level Security if auth and direct DB access patterns are adopted.
- Keep attendance submission transactional.
- Consider server-generated session IDs for idempotency.
- Return compact payloads to mobile clients.
- Use pagination or filtered history views for admin screens.

### Recommended Additional Tables for Later
- `attendance_audit_logs`
- `institutions`
- `notification_rules`
- `devices`
- `attendance_events`

## Acceptance Criteria Summary
### Teacher
- Can see live class from timetable
- Can start attendance in 1–2 taps
- Can override subject before marking
- Can mark a class quickly with bulk-present flow
- Cannot edit after submission

### Admin
- Can manage academic and user entities
- Can review all attendance
- Can edit submitted attendance
- Can export filtered reports

### Student
- Can see own overall percentage
- Can see subject-wise percentage
- Can view own attendance history

### System
- Prevents duplicate sessions
- Enforces RBAC
- Performs reliably for 50–100 students per class
- Preserves scheduled and actual teaching context

## Product Recommendation
For implementation quality, the single most important decision is to treat **session** as the source of truth and **attendance** as child facts. That gives you a clean foundation for teacher speed, admin correction, student reporting, and future analytics without rewriting the data model later.

For UI creation in Stitch, prioritize the teacher flow before anything else. The product will feel successful if the teacher dashboard and attendance marking screen are exceptionally fast and obvious, because attendance UX research shows that simplicity, conventional interaction patterns, and minimal visual distraction are what make these systems usable in real classrooms [cite:7].
