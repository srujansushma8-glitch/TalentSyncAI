# MASTER BUILD PROMPT — TALENTSYNC AI
## Build a Complete, Functional, Hackathon-Ready Workforce Intelligence Platform

### 1. YOUR ROLE AND MISSION

Act as a senior full-stack software engineer, AI/algorithm engineer, database architect, UI/UX designer, QA engineer, and hackathon product strategist.

Build **TalentSync AI — Intelligent Workforce Planning & Talent Optimization Platform**, a polished, responsive, end-to-end web application that helps organizations assign the right people to the right projects, identify skill gaps, balance workloads, optimize team composition, and make explainable workforce decisions.

**This is an implementation task, not a planning-only task.**

Work directly in the currently opened repository. Inspect the existing project before modifying it. Preserve working code, reuse existing components where appropriate, and improve the project incrementally.

Do not stop after creating a plan, writing documentation, generating mockups, or building a static dashboard. Implement the frontend, backend, database, algorithms, integrations, and tests required for the application to work.

Do not ask unnecessary questions. Make sensible engineering decisions, record important assumptions, and keep working until the application is runnable and the main workflows have been verified.

### 2. CORE PRODUCT OBJECTIVE

TalentSync AI must help four types of users:

- **Administrator:** Manage users, permissions, system configuration, and organization-wide data.
- **HR Manager:** Manage employee profiles, skills, training, capacity, and workforce analytics.
- **Project Manager:** Create projects, discover suitable employees, optimize teams, simulate changes, and approve assignments.
- **Employee:** View personal skills, availability, assignments, and training recommendations.

The core value proposition is:

> Turn workforce data into explainable staffing decisions by combining skill intelligence, employee availability, experience, proficiency, team optimization, and workload balancing.

Build a realistic enterprise SaaS product suitable for a live college hackathon demonstration.

### 3. FIRST: INSPECT THE EXISTING PROJECT

Before writing code:

1. Inspect the repository structure, dependencies, environment files, existing routes, components, API clients, database models, and tests.
2. Determine what already works, what is incomplete, and what is broken.
3. Identify whether the project already has a frontend, backend, or database configuration.
4. Write a short implementation checklist, then immediately begin executing it.
5. Do not delete or recreate working code without a clear technical reason.
6. Do not leave duplicate implementations, conflicting dependencies, or unused placeholder pages.
7. Keep the application in a runnable state as changes are made.

Use the existing stack if a functional equivalent is already present. Otherwise, follow the technology stack below.

### 4. REQUIRED TECHNOLOGY STACK

**Frontend**
- React with TypeScript
- Vite
- Tailwind CSS
- shadcn/ui where useful
- Lucide icons
- React Router
- Recharts for charts
- React Hook Form and Zod for forms and validation
- A centralized API client and consistent loading/error handling

**Backend**
- Python and FastAPI
- Pydantic for request/response validation
- SQLAlchemy ORM
- Alembic database migrations
- Documented REST APIs and Swagger/OpenAPI

**Database**
- PostgreSQL as the preferred database
- SQLite as a practical local fallback
- Database configuration through environment variables
- The same business logic must work with either supported database

**Optimization**
- Google OR-Tools CP-SAT where practical
- A deterministic Python fallback if OR-Tools is unavailable

**Testing**
- Pytest for backend and algorithm tests
- Frontend tests using the testing framework appropriate to the existing project
- API integration tests and end-to-end workflow verification where practical

Do not add unnecessary dependencies. If a dependency cannot be installed, use a documented fallback rather than leaving the application broken.

### 5. PREMIUM, RESPONSIVE UI/UX

Create a distinctive, polished enterprise interface.

Design direction:
- Deep navy or charcoal sidebar
- White and light-neutral content surfaces
- Electric blue primary accent
- Restrained teal, amber, and red status indicators
- Consistent typography, spacing, borders, shadows, and component styles
- Clear data visualizations
- Professional tables, forms, dialogs, filters, and detail panels
- Responsive layouts for desktop, tablet, and mobile
- Keyboard accessibility and readable contrast
- Helpful empty states, loading indicators, success messages, and error states

Use a consistent application shell with sidebar navigation, page headers, breadcrumbs where useful, and clear primary actions.

Avoid excessive gradients, excessive glassmorphism, emoji as primary icons, cluttered layouts, and generic unfinished templates.

**Functional UI requirement:** Every visible primary button, form, filter, tab, navigation item, modal action, chart interaction, and dropdown must perform its advertised action. Remove decorative controls that do not work.

### 6. AUTHENTICATION AND AUTHORIZATION

Implement:
- Login and logout
- Secure password hashing
- Registration or administrator-created users
- Token or session-based authentication
- Protected routes
- Backend-enforced role-based access control
- Safe validation and error handling
- Demo accounts created through seed data

Permissions:
- Administrators can manage users and organization-wide records.
- HR managers can manage workforce skills, employee information, training, and capacity.
- Project managers can manage permitted projects, generate recommendations, and approve assignments.
- Employees can access permitted personal records and update only allowed information.

Never rely solely on hiding buttons in the frontend for security.

Never hardcode production credentials or expose secrets in frontend code. Document seeded development/demo credentials in the README.

### 7. DATABASE AND DATA MODEL

Create normalized models and migrations for:

- Users and roles
- Employees
- Skills
- EmployeeSkills, including proficiency
- Projects
- ProjectRequiredSkills
- Assignments
- Workload records or allocation details
- Training resources
- Training recommendations and progress
- Notifications
- Assignment history and audit logs

Include appropriate primary keys, foreign keys, unique constraints, indexes, timestamps, validation, and relationships.

Store employee skills relationally, not only as comma-separated text.

Use transactions for assignment approvals and workload updates. Prevent duplicate assignments, invalid relationships, and accidental changes to existing commitments.

Create a reliable seed process that can initialize or reset demo data in development mode without unexpectedly destroying user data in normal operation.

### 8. EMPLOYEE MANAGEMENT

Implement a complete employee directory and employee detail pages.

Employee data should include:
- Employee ID, name, and email
- Department and job title
- Years of experience
- Skills and proficiency levels
- Weekly working hours
- Existing committed hours
- Remaining capacity
- Availability status
- Learning interests
- Project history and current assignments

Proficiency scale:
- 1 — Beginner
- 2 — Intermediate
- 3 — Advanced
- 4 — Expert

Implement:
- Create, view, edit, and deactivate employee profiles
- Search and filtering by name, department, skill, proficiency, experience, and availability
- Skill badges and capacity indicators
- Form validation
- CSV import/export where practical
- Clear feedback for successful and failed actions

Changes must persist to the database and appear in the UI after refresh.

### 9. PROJECT MANAGEMENT

Implement project creation, viewing, editing, and archiving.

Project fields:
- Name, description, department, and project manager
- Required skills and minimum proficiency per skill
- Required team size
- Estimated weekly project hours
- Start date and deadline
- Priority and status
- Minimum experience requirements where applicable

Managers must be able to:
- Create and edit projects
- Define mandatory and optional skills
- Configure team size and workload requirements
- View staffing progress
- Generate and compare team recommendations
- Inspect missing skills and capacity problems
- Approve a proposed allocation

Validate project inputs and explain why a team cannot be formed when constraints cannot be satisfied.

### 10. EMPLOYEE MATCHING ENGINE — EXACT SCORING MODEL

Implement a real, deterministic employee-to-project matching algorithm using database data.

Use these default weights exactly:

- Skill compatibility: **40%**
- Relevant experience: **20%**
- Availability: **25%**
- Proficiency compatibility: **15%**

Formula:

`match_score = 0.40 × skill_score + 0.20 × experience_score + 0.25 × availability_score + 0.15 × proficiency_score`

Each component must be normalized to a score from 0 to 100. Keep the weights configurable, validate that they are valid and sum to 100%, and document the calculation.

Define clear, tested methods for calculating each component:

- **Skill compatibility:** Measure how many applicable project-required skills the employee possesses, with appropriate handling for mandatory and optional skills.
- **Experience:** Compare relevant experience against the project's stated requirements. Avoid arbitrary scoring that cannot be explained.
- **Availability:** Calculate actual remaining capacity against the proposed allocation and respect employee availability status.
- **Proficiency:** Compare each relevant employee proficiency level with the project's minimum required proficiency.

Do not present the score as a probability of success.

For each recommendation, display:
- Overall match score
- Four component scores
- Matched skills
- Missing skills
- Proficiency mismatches
- Relevant experience
- Weekly capacity and expected allocation
- Constraints or warnings
- A plain-language explanation of the recommendation

**Hard constraints override ranking:** An unavailable employee, a capacity violation, or another mandatory constraint must not be ignored because the employee has a high score.

A missing skill must not be treated as an explicitly recorded low proficiency. Represent unknown, missing, and insufficient skills distinctly.

Add unit tests for the scoring formula, weight validation, missing data, unavailable employees, and capacity violations.

### 11. TEAM OPTIMIZATION ENGINE

Build a team optimizer that considers the combined capabilities of the team rather than simply selecting the highest individual scores.

Optimize for:
- Mandatory skill coverage
- Required proficiency coverage
- Requested team size
- Employee availability
- Weekly capacity limits
- Relevant experience
- Complementary skills
- Workload fairness
- Minimal uncovered critical requirements
- Avoiding unnecessary team members

Use explicit hard constraints and a documented objective function. Use OR-Tools CP-SAT when available, with a deterministic fallback algorithm.

The optimizer must:
1. Evaluate eligible candidates.
2. Find feasible team combinations.
3. Check combined skill and proficiency coverage.
4. Allocate project hours without exceeding capacity.
5. Compare team quality and workload.
6. Explain why the chosen team is recommended.
7. Offer alternatives when practical.

Display:
- Recommended team and team-fit score
- Skill coverage and proficiency coverage
- Expected project hours per employee
- Remaining capacity
- Workload distribution
- Missing skills and infeasible constraints
- Alternative team comparisons
- A clear explanation of trade-offs

If no fully feasible team exists, say so explicitly. Show which requirements cannot be met, which candidates are closest, and whether training, hiring, reduced scope, or an adjusted team size could help.

Never falsely label an infeasible team as fully qualified.

### 12. SKILL GAP ANALYSIS

Implement project-level and organization-wide skill gap analysis.

For each project requirement:
- Compare required skills with selected team capabilities
- Compare minimum required proficiency with actual proficiency
- Detect completely missing skills
- Detect insufficient proficiency
- Identify mandatory versus optional gaps
- Explain which employees could improve the gap through training
- Suggest when adding a qualified employee or hiring may be more appropriate

Display the skill, required proficiency, current coverage, gap severity, affected project, and recommended action.

All results must be derived from employee and project records and traceable to the underlying data.

### 13. TRAINING RECOMMENDATIONS

Create a curated, editable learning-resource dataset with:
- Skill
- Course or resource title
- Provider
- Verified URL
- Level
- Estimated duration
- Description

Recommend resources based on skill gaps, employee proficiency, and learning interests.

Include:
- Recommended courses
- Why each course is recommended
- Suggested learning sequence
- Gap priority
- Estimated learning effort
- Training status tracking

Do not invent course URLs or claim that course completion automatically verifies proficiency. If a resource is sample data, label it clearly.

When an employee's recorded skill level changes, recalculate relevant skill gaps and recommendations.

### 14. WORKLOAD BALANCING

Implement real capacity calculations.

`available_hours = weekly_working_hours - existing_committed_hours`

`remaining_capacity = weekly_working_hours - existing_committed_hours - proposed_project_hours`

`utilization_percent = (total_committed_hours / weekly_working_hours) × 100`

Handle zero working hours safely and define the behavior for missing availability information.

Detect:
- Overloaded employees
- Underutilized employees
- Insufficient capacity
- Conflicting assignments
- Potential workload redistribution opportunities

Recommend alternative allocations while preserving critical skill requirements. Do not make utilization artificially equal at the expense of project needs.

Prevent over-capacity allocations by default. Any authorized override must be explicit, flagged, and recorded in the audit history.

Display before-and-after workload comparisons and require manager review before committing proposed changes.

### 15. WHAT-IF SIMULATOR

Build an interactive simulator that allows users to adjust:
- Team size
- Required skills
- Project hours
- Candidate employees
- Employee availability
- Proposed allocations
- Deadline or other supported project constraints

Recalculate team recommendations, skill coverage, and workloads without changing live assignments.

Show:
- Original versus proposed team
- Original versus proposed utilization
- Skill coverage changes
- New or resolved skill gaps
- Capacity violations
- Team-fit score changes
- Trade-offs and explanatory notes

Provide a reset action and a clear comparison view.

**Simulations must be isolated from live data until an authorized manager explicitly approves the proposed allocation.**

### 16. DATA-DRIVEN ANALYTICS DASHBOARD

Build an overview dashboard with:
- Total employees
- Active projects
- Employees available for assignments
- Projects with staffing gaps
- Overloaded employees
- Underutilized employees
- Average workforce utilization
- Overall skill coverage

Include charts for:
- Workforce utilization
- Employee workload distribution
- Skill distribution
- Project staffing progress
- Skill gap severity
- Department capacity
- Team skill coverage
- Before-and-after workload optimization

Provide useful filters, labels, legends, drill-down navigation, loading states, and empty states.

**Never hardcode dashboard KPIs or chart datasets.** Retrieve metrics from the backend and calculate them from database records. After data changes, refresh or invalidate the relevant queries so the dashboard stays accurate.

If no records exist, show an appropriate empty state rather than fabricated metrics.

### 17. EXPLAINABLE WORKFORCE ASSISTANT

Implement a workforce assistant that can answer questions such as:
- Which employees best match a Python project?
- Why was this team selected?
- Which projects have the most critical skill gaps?
- Who has available capacity?
- How could we reduce workload imbalance?
- Which training resources could help close a cloud skills gap?

The assistant must use actual backend data and existing business logic.

It must:
- Respect user permissions
- Explain numerical recommendations using the actual calculation results
- Distinguish facts from suggestions
- Never invent employees, scores, projects, or assignments
- Ask for clarification within the interface when a request is ambiguous
- Never silently change assignments

If no LLM API key is configured, provide a deterministic assistant for common questions using structured queries and existing algorithms. The core product must not depend on a paid external AI service.

If optional LLM integration is added, use server-side environment variables and never expose secrets to the browser.

### 18. NOTIFICATIONS, AUDIT HISTORY, AND REPORTS

Implement in-app notifications for:
- Staffing gaps
- Overloaded employees
- Pending approvals
- Assignment changes
- Upcoming deadlines
- Relevant training recommendations

Support read/unread status and a notification center.

Record important assignment changes in an audit history, including who approved a change and when.

Implement downloadable CSV reports for:
- Employee skills inventory
- Team recommendations
- Skill gap analysis
- Workload distribution
- Training recommendations
- Optimization comparisons

PDF export is desirable if practical. Reports must use real data and include generation date, relevant project details, metrics, and explanations.

### 19. REQUIRED APPLICATION PAGES

Build and connect these pages:

1. Login
2. Overview dashboard
3. Employee directory
4. Employee profile and skill editor
5. Projects directory
6. Create/edit project
7. Smart employee matching
8. Team optimization results
9. Skill gap analysis
10. Training recommendations
11. Workload balancing
12. What-if simulator
13. Notifications
14. Reports
15. Settings and user management

Every page must have real navigation, meaningful content, and functional interactions. Reuse consistent layouts and components. Protect restricted pages according to user roles.

### 20. REST API REQUIREMENTS

Implement documented endpoints for:
- Authentication and current user
- Employee CRUD and skills
- Project CRUD and requirements
- Candidate matching
- Team optimization
- Skill gap analysis
- Training resources and recommendations
- Workload analysis and optimization
- What-if simulation
- Assignment approval
- Notifications
- Dashboard analytics
- Report export

Use Pydantic request and response schemas, appropriate HTTP status codes, pagination where useful, server-side validation, safe errors, and configured CORS.

Connect the frontend to these APIs through a centralized API layer.

Do not create frontend-only copies of business logic that disagree with the backend. The backend must be the source of truth for scoring, optimization, capacity, and persistent changes.

### 21. DEMO DATA

Seed at least **20 synthetic employees** across multiple departments with varied skills, experience, proficiency, availability, and workload.

Seed at least **five projects**:
1. Python and AI analytics platform
2. Cloud migration project
3. Web application development
4. Data analytics project
5. Cybersecurity assessment

Include scenarios demonstrating:
- A feasible team
- A missing-skill scenario
- A proficiency mismatch
- An overloaded employee
- A project with no fully feasible team
- An optimization that improves workload allocation

Use deterministic demo data so the demonstration is repeatable.

Provide a development-only demo-data reset action that clearly warns before resetting data. Do not include real employee personal information.

### 22. SECURITY AND RELIABILITY

Implement:
- Password hashing
- Backend role checks
- Input validation
- Safe database access through ORM queries
- Environment-based secrets
- Safe error messages
- Configured CORS
- Audit logs for allocation changes
- Transactional assignment approval
- Duplicate assignment prevention
- Sensible API error handling

Never commit real secrets. Add `.env.example` with placeholder values and document configuration.

Do not claim that the application is production-secure without the corresponding review and controls.

### 23. AUTOMATED TESTS AND EDGE CASES

Write and run tests covering:
- Employee and project CRUD
- Match score calculations and weights
- Missing skills and proficiency mismatches
- Availability and capacity constraints
- Team skill coverage
- Team optimization and fallback behavior
- Infeasible team handling
- Workload calculations
- Simulation isolation
- Assignment approval and audit history
- Role-based authorization
- API validation
- Dashboard metrics
- Report generation

Test edge cases:
- Empty database
- No required skills
- Duplicate skills
- Zero working hours
- Unknown availability
- Fully booked employees
- Insufficient team capacity
- Conflicting assignments
- Invalid inputs
- Past deadlines
- No feasible team

Fix failures and rerun the relevant tests. Do not report tests as passed unless they were actually executed.

### 24. IMPLEMENTATION AND EXECUTION RULES

Work in this order, adapting to the repository as needed:

**Phase A — Repository and foundation**
- Inspect the project.
- Establish a working frontend/backend connection.
- Configure environment variables and database.
- Create migrations and seed scripts.
- Verify that both applications start.

**Phase B — Core data**
- Implement authentication and roles.
- Implement employee and project CRUD.
- Add skills and relational data.
- Verify persistence through the API and UI.

**Phase C — Intelligence**
- Implement and test the exact matching formula.
- Implement constrained team optimization.
- Implement skill gap and training recommendations.
- Implement workload calculations and balancing.

**Phase D — Complete experience**
- Build the dashboard and analytics.
- Implement the what-if simulator.
- Add notifications, reporting, and assistant fallback.
- Connect every page and action to real data.

**Phase E — Verification**
- Run backend and frontend tests.
- Start both applications.
- Verify API connectivity and database persistence.
- Fix runtime errors, console errors, failed requests, broken routes, and form issues.
- Repeat tests after fixes.
- Verify the complete demo workflow.

Do not stop after any individual phase if further requirements remain. Continue to the next phase.

If time or environment limitations prevent completion of everything, prioritize a working end-to-end core before optional enhancements. Clearly identify incomplete features instead of faking them.

### 25. REQUIRED END-TO-END DEMONSTRATION

Verify this exact user journey:

1. Log in with a seeded demo account.
2. Open the dashboard and verify that the displayed metrics come from seeded database records.
3. Open the employee directory and inspect employee skills and availability.
4. Create or open a project with required skills and proficiency levels.
5. Generate employee match scores and inspect their breakdowns.
6. Generate a recommended team and inspect skill coverage and constraints.
7. Identify a missing skill or proficiency gap.
8. View relevant training recommendations.
9. Run workload optimization and compare before-and-after utilization.
10. Simulate an employee becoming unavailable.
11. Recalculate the proposed team and workload.
12. Confirm that the simulation has not changed live assignments.
13. Approve a proposed allocation as an authorized manager.
14. Verify that the assignment is persisted, workloads update, and the audit history records the change.
15. Refresh the application and confirm that saved data remains correct.
16. Export at least one real-data report.

If any step fails, fix it and rerun that part of the workflow.

### 26. DEFINITION OF DONE

The project is not complete merely because the pages render.

Before finishing, verify that:
- The frontend starts successfully.
- The backend starts successfully.
- Database initialization and seeding work.
- Authentication and role restrictions work.
- CRUD changes persist.
- Matching scores use the exact 40/20/25/15 formula.
- Team optimization respects hard constraints.
- Skill gaps and workloads are calculated from real records.
- Simulations do not alter live assignments before approval.
- Approved assignments persist correctly.
- Dashboard metrics are data-driven.
- Primary buttons and forms work.
- The main tests pass.
- The end-to-end demo workflow has been tested.

### 27. FINAL OUTPUT REQUIRED FROM YOU

When implementation and verification are complete, provide:

1. A concise summary of what was actually implemented.
2. The final project folder structure.
3. The exact Windows PowerShell commands to install dependencies, initialize/seed the database, and start the frontend and backend.
4. The frontend and backend local URLs.
5. Demo usernames, roles, and development credentials created by the seed process.
6. Required environment variables and setup instructions.
7. Commands to run tests.
8. Actual test results, including failures or tests not run.
9. Known limitations and any unfinished features.
10. A short, timed hackathon demonstration sequence showing the product's strongest capabilities.

Do not invent successful test results, credentials, endpoints, or features. Only report what exists and has been verified.

## FINAL INSTRUCTION

Start by inspecting the current repository, then build the actual application. Do not stop at a plan. Do not replace functioning code unnecessarily. Do not create fake functionality to make the interface look complete. Implement, connect, run, test, fix, and verify the product end to end. Continue working through the remaining requirements until the definition of done is met or a genuine environment limitation prevents further progress. 
create an md file for the agent in antigravity and a generete a prompt to create the project refering this md file