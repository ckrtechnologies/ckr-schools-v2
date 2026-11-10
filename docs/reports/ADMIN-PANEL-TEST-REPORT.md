# 🧪 Vision Admin Panel & Multi-Tenant API Test Report

**Project:** CKR Schools v2 — Multi-Tenant Architecture  
**Surface:** Admin Web Panel (`web/school_portal` & `web/admin_panel`)  
**Backend Port:** `5006` (`http://localhost:5006/api`)  
**Frontend Port:** `5174` (`http://localhost:5174/dashboard`)  
**Audit Timestamp:** 08 Nov 2026, 08:08 PM IST  
**Status:** **100% PASSED (44 / 44 Operations Verified)**

---

## 1. Executive Summary

Following the user's issue inspection from the Chrome DevTools Network screenshots and database auditing, we diagnosed and eliminated the root causes:
1. **Student Avatar Persistence & Tenant Upload Isolation:**
   - *Cause:* `UsersRepository.updateUser` and `createUser` lacked the `avatar_url` column in their column lists, so uploaded avatars were stored on disk but never persisted into `public."user"`.
   - *Fix:* Added `avatar_url` to `createUser` and `updatableCols` in `updateUser`.
   - *Multi-Tenant Upload Isolation:* Upload destinations now namespace by `${tenant.slug}-${tenant.id}` (e.g. `vision-2000305b-a518-4b3b-aad3-ff8a56e585fb`) to prevent cross-tenant collision for schools sharing the same slug name.
   - *Verification:* Performed test write operation for student `s1@gmail.com` with `insta_Profile_pic.jpg`, verified database record, API return, and HTTP 200 delivery.
2. **`POST /api/admin_panel/class/createClass` (Operation Failed 500 Error):**
   - *Cause:* The modal sent `{ data: { className: "8", section: "A", teachers: [], students: [] } }`. The backend validator previously looked for unwrapped `name` rather than `className`, causing a validation error `INTERNAL_SERVER_ERROR`.
   - *Fix:* Unwrapped `req.body.data || req.body`, enhanced `createClassSchema` to accept `className` or `name`, added duplicate checking (409 status), and automatically synced `class_teachers` and `class_students`.
3. **`GET /api/user/getTopper` (Previously 500 Error):**
   - *Cause:* Route was caught by wildcard parameter `GET /:id` in `usersRouter`. Passing `"getTopper"` into the UUID-typed PostgreSQL parameter caused Postgres `routine: 'string_to_uuid'` fatal exception.
   - *Fix:* Dedicated handler `GET /api/user/getTopper` registered prior to `/:id` with dynamic top-performer scoring from `grades` and `user` tables.
4. **`GET /api/admin/student-of-week` (Previously 404 Error):**
   - *Cause:* Router was mounted under `/api` and `/api/admin_panel` rather than `/api/admin/student-of-week`.
   - *Fix:* Mounted dedicated `studentOfWeekRouter` handling `/api/admin/student-of-week` and `/api/shared/student-of-week` with SQL relational joins (`student_of_the_week`, `user`, `class`).
5. **`GET /api/spotlight/today` & `/api/spotlight` (Previously 404 / 304):**
   - *Cause:* Missing dedicated mount paths for `/api/spotlight` and `/api/thoughts`, and missing `PUT` and `DELETE` handlers for single items.
   - *Fix:* Mounted `/api/spotlight` and `/api/thoughts` directly in `app.js` and added full CRUD support.

---

## 2. Automated Test Results

### Suite A: All Admin Panel Query Endpoints (32 / 32 Passed)

| # | HTTP Method | Endpoint | Domain / Purpose | Status |
|---|---|---|---|:---:|
| 1 | `GET` | `/admin_panel/users` | School Users Directory | **200 OK** |
| 2 | `GET` | `/admin_panel/class/getClass` | Classes, Sections & Roster | **200 OK** |
| 3 | `GET` | `/admission_panel/getAllNewUser` | Admission Leads Pipeline | **200 OK** |
| 4 | `GET` | `/finance_panel/dashboardStats` | Financial Dues & Fee Totals | **200 OK** |
| 5 | `GET` | `/admin_panel/planner` | Annual Events & Holidays Calendar | **200 OK** |
| 6 | `GET` | `/attendance?startDate=...&endDate=...` | Daily Attendance Summary | **200 OK** |
| 7 | `GET` | `/rooms/getRooms` | Campus Rooms & Capacities | **200 OK** |
| 8 | `GET` | `/admin_panel/consents/admin` | Parental Consent Forms Master | **200 OK** |
| 9 | `GET` | `/course` | Active Coursework & Notes | **200 OK** |
| 10 | `GET` | `/admin_panel/exams` | Scheduled Exams & DateSheets | **200 OK** |
| 11 | `GET` | `/circulars` | Notices & Official Circulars | **200 OK** |
| 12 | `GET` | `/gallery` | Campus Media Gallery | **200 OK** |
| 13 | `GET` | `/user/getTopper` | **Top Performer of the Month** | **200 OK** |
| 14 | `GET` | `/admin/student-of-week` | **Students of the Week (Admin)** | **200 OK** |
| 15 | `GET` | `/spotlight/today` | **Spotlight of Today** | **200 OK** |
| 16 | `GET` | `/thoughts` | Thought of the Day Feed | **200 OK** |
| 17 | `GET` | `/spotlight` | All School Highlights / Spotlights | **200 OK** |
| 18 | `GET` | `/admin_panel/roles` | Staff Responsibilities & Roles | **200 OK** |
| 19 | `GET` | `/fees/getFees` | Fee Heads Master Structure | **200 OK** |
| 20 | `GET` | `/finance_panel/getFees` | Fee Heads (Finance Panel view) | **200 OK** |
| 21 | `GET` | `/admin_panel/grading-scales` | Scholastic Grading Scales Master | **200 OK** |
| 22 | `GET` | `/admin_panel/subjects/getSubjects` | Academic Subjects Catalog | **200 OK** |
| 23 | `GET` | `/admin_panel/timeTable/getTimeTable` | Master Weekly Timetable | **200 OK** |
| 24 | `GET` | `/admin_panel/events/getAllEvents` | Annual Planner Calendar Events | **200 OK** |
| 25 | `GET` | `/admin_panel/subjectTeachers` | 2D Subject-Teachers Matrix | **200 OK** |
| 26 | `GET` | `/admin_panel/notifications` | School Notification Stream | **200 OK** |
| 27 | `GET` | `/admin_panel/complaints` | Parent & Staff Grievances | **200 OK** |
| 28 | `GET` | `/academic_manager/meta` | Academic Manager Meta Matrix | **200 OK** |
| 29 | `GET` | `/academic_manager/distributions` | Subject Marks Distribution | **200 OK** |
| 30 | `GET` | `/academic_manager/grading-tracker` | Teacher Grading Completion Matrix | **200 OK** |
| 31 | `GET` | `/admin_panel/info/getAll` | School Master Information & Settings | **200 OK** |
| 32 | `GET` | `/admin_panel/results` | Aggregated Multi-Term Student Results | **200 OK** |

---

### Suite B: CRUD Mutations (12 / 12 Passed)

| Action | Target Endpoint | Payload / Test Scope | Status |
|---|---|---|:---:|
| **CREATE** | `POST /rooms/createRoom` | Robotics Lab 101, Capacity 35 | **201 Created** |
| **UPDATE** | `PUT /rooms/updateRoom/:id` | Renamed to AI & Robotics Lab 101, Capacity 40 | **200 OK** |
| **DELETE** | `DELETE /rooms/deleteRoom/:id` | Clean purge from database | **200 OK** |
| **CREATE** | `POST /spotlight` | National Science Olympiad Winners | **201 Created** |
| **UPDATE** | `PUT /spotlight/:id` | Updated headline & description | **200 OK** |
| **DELETE** | `DELETE /spotlight/:id` | Purged record | **200 OK** |
| **CREATE** | `POST /thoughts` | Education quote of the day | **201 Created** |
| **UPDATE** | `PUT /thoughts/:id` | Author and quote wording update | **200 OK** |
| **DELETE** | `DELETE /thoughts/:id` | Purged record | **200 OK** |
| **CREATE** | `POST /admin_panel/roles` | Assigned "Exam Superintendent" to Staff User | **201 Created** |
| **UPDATE** | `PUT /admin_panel/roles/:id` | Promoted to "Chief Exam Superintendent" | **200 OK** |
| **DELETE** | `DELETE /admin_panel/roles/:id` | Revoked staff responsibility | **200 OK** |

---

## 3. UI Look & Feel Parity

- **Token & Component Parity:** The frontend codebase remains 100% byte-for-byte identical in UI appearance, tokens, fonts, styles, and layouts to the board-approved Vision School application.
- **Single `.env` Requirement:** Confirmed only `VITE_API_URL=http://localhost:5006/api` is used.
- **Network Tab Verification:** Dashboard load no longer triggers red 500 or 404 network entries. All tiles ("Student of the Week", "Topper of the Month", "Spotlight of the Day", "People & Attendance", "Financials") render smoothly.

