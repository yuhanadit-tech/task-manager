# PRD — Task Manager MVP

## Project Scope

The Task Manager MVP is a team-based web application for task management. The initial target is small teams (2–15 people) who need work visibility and lightweight collaboration without the overhead of enterprise tools like Jira.

**In Scope (MVP):**
- Project and task management
- Kanban board view
- Task assignment to team members
- Comments and basic collaboration
- Email notifications
- Authentication (email + Google OAuth)

**Out of Scope (Post-MVP):**
- Time tracking
- Gantt chart / timeline view
- Slack / GitHub integrations
- Billing and subscription
- Advanced reporting and analytics
- Custom workflow automation
- Public API

---

## Goals

### Business Goals
1. Validate product-market fit for the small team segment (startups, freelancers, agencies)
2. Reach 100 registered users within the first 3 months
3. Generate usage data to inform future feature decisions

### User Goals
1. **Project Manager:** Get full visibility over all task progress in one place
2. **Developer / Contributor:** Know exactly what to work on today without needing a meeting
3. **Team Lead:** Assign and track team tasks without friction

### Product Goals
1. Time-to-value < 5 minutes (from registration to creating the first task)
2. Core workflow usable without documentation or onboarding
3. Page performance < 3 seconds on a 4G connection

---

## MVP Feature Set

### P0 — Must Have (Launch blocker)

| # | Feature | Description |
|---|---|---|
| 1 | User Registration & Login | Email/password + Google OAuth |
| 2 | Create & Manage Projects | Project CRUD, project color/icon |
| 3 | Invite Team Members | Invite via email, Owner/Member roles |
| 4 | Create & Manage Tasks | Task CRUD with title, description, assignee, due date, priority |
| 5 | Kanban Board | Drag-and-drop tasks between status columns |
| 6 | Task Status | Backlog → Todo → In Progress → In Review → Done |
| 7 | Task Priority | Urgent / High / Medium / Low / None |
| 8 | Assign Members to Task | Select from project members |
| 9 | Due Date | Date picker, visual overdue indicator |
| 10 | My Tasks View | List of all tasks assigned to the current user |

### P1 — Should Have (MVP target but can defer 1 sprint)

| # | Feature | Description |
|---|---|---|
| 11 | Comments | Comments per task, @user mentions |
| 12 | Labels / Tags | Custom colored labels per project |
| 13 | Subtasks | Checklist items inside a task |
| 14 | Filter & Search | Filter board by assignee, priority, label, due date |
| 15 | Activity Log | History of changes on each task |
| 16 | Email Notifications | Notify on task assignment, mention, due date approaching |

### P2 — Nice to Have (Post-MVP backlog)

| # | Feature | Description |
|---|---|---|
| 17 | List View (besides Board) | Alternative view alongside Kanban |
| 18 | File Attachments | Upload files/images to a task |
| 19 | Recurring Tasks | Tasks that automatically repeat |
| 20 | Dashboard Analytics | Project progress chart per sprint |
| 21 | Dark Mode | Toggle light/dark theme |

---

## User Stories

### Authentication
- As a new user, I want to register with my email so I can start using the app
- As a user, I want to log in with Google so I don't need to remember a new password
- As a user, I want to reset my password via email if I forget it

### Project
- As an owner, I want to create a new project with a name and color
- As an owner, I want to invite people via email to my project
- As an owner, I want to change a member's role or remove them from the project

### Task
- As a member, I want to create a new task in a project so work is documented
- As a member, I want to drag a task to the "In Progress" column to update its status
- As a member, I want to see all tasks assigned to me on the My Tasks page
- As a member, I want to leave a comment on a task for contextual discussion

### Notification
- As a user, I want to receive an email when I am assigned to a new task
- As a user, I want to receive a notification when there is a comment on my task

---

## Technical Requirements

### Functional
- The API must return responses in the standard JSON format `{ data, error, meta }`
- All write operations must pass Zod validation before touching the database
- Every task change must be logged in the `activity_logs` table
- Invite links must have a 7-day expiry and be single-use
- Passwords must be hashed with bcrypt (cost factor ≥ 12)

### Non-Functional
- **Performance:** LCP < 2.5s, FID < 100ms (Core Web Vitals "Good")
- **Availability:** 99.5% uptime (MVP target, hosted on Vercel)
- **Security:** HTTPS only, CSRF protection, input sanitization, rate limiting on auth endpoints
- **Scalability:** Database queries must use appropriate indexes, ready for 10,000 tasks per project
- **Accessibility:** WCAG 2.1 Level AA for all main pages

### Security Requirements
- All environment variables stored in platform secrets (never committed to git)
- Row-level access: users can only access data from projects they are members of
- Rate limiting: max 10 login attempts per IP per 15 minutes
- Session timeout: 30 days (remember me), 1 day (default)
- Audit log for sensitive actions (invite, remove member, delete project)

---

## Success Metrics

### Acquisition
| Metric | Target (Month 3) |
|---|---|
| Registered Users | ≥ 100 |
| Projects Created | ≥ 200 |
| Activation Rate (user creates ≥1 task) | ≥ 60% |

### Engagement
| Metric | Target |
|---|---|
| DAU/MAU Ratio | ≥ 20% |
| Avg Tasks per Active User/Week | ≥ 5 |
| 7-Day Retention | ≥ 30% |
| 30-Day Retention | ≥ 15% |

### Quality
| Metric | Target |
|---|---|
| Error Rate (5xx) | < 0.1% |
| P95 API Response Time | < 500ms |
| Lighthouse Performance Score | ≥ 85 |
| NPS (from user survey) | ≥ 30 |

### Business
| Metric | Target (Month 6) |
|---|---|
| Paid Conversion (if a paid tier exists) | ≥ 5% |
| Churn Rate (monthly) | < 10% |

---

## Timeline (Estimate)

| Sprint | Duration | Deliverable |
|---|---|---|
| Sprint 1 | 2 weeks | Auth, Project CRUD, Database schema, CI/CD setup |
| Sprint 2 | 2 weeks | Task CRUD, Kanban Board, Drag & Drop |
| Sprint 3 | 2 weeks | My Tasks, Comments, Activity Log, Labels |
| Sprint 4 | 1 week | Email Notifications, Filter/Search, UI polish |
| Sprint 5 | 1 week | Testing, Bug fixes, Performance optimization, Soft launch |

**Total estimate: 8 weeks (2 months)**
