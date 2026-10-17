# TalentSync AI — Intelligent Workforce Planning & Talent Optimization

TalentSync AI is an enterprise workforce intelligence platform designed to help organizations assign the right people to the right projects, identify skill gaps, balance workloads, optimize team compositions, and make explainable talent decisions.

---

## 🌟 Key Features

- **Role-Based Experience**: Tailored workflows for Administrator, HR Manager, Project Manager, and Employee.
- **Smart Project-Talent Matching**: Multi-criteria matching scoring candidates by skill overlap, proficiency, domain experience, and availability.
- **Constraint-Based Team Optimization**: Optimizes multi-member staffing compositions while adhering to experience and availability constraints.
- **Workload & Capacity Management**: Real-time visualization of weekly hours, utilization tiers, and department-level bandwidth.
- **Skill Gap & Training Engine**: Identifies organizational skill deficits and recommends targeted upskilling courses.
- **What-If Workforce Simulator**: Simulates staffing reassignments and project deadlines before committing changes.
- **AI Talent Assistant**: Context-aware workforce copilot for natural language queries and talent recommendations.
- **Executive Analytics Dashboard**: High-level KPIs, department capacity charts, and utilization distribution breakdowns.

---

## 🏗️ Architecture & Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Routing**: React Router v7
- **HTTP Client**: Axios with JWT interceptors

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic v2
- **Authentication**: JWT (JSON Web Tokens) with passlib / bcrypt
- **Testing**: Pytest with HTTP test client

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive API Docs (Swagger): `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
- Web Application: `http://localhost:5173`

---

## 🔑 Demo Accounts

Use any of these pre-seeded demo accounts to test role-based access:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Administrator** | `admin@talentsync.ai` | `Admin@123` |
| **HR Manager** | `hr@talentsync.ai` | `HrManager@123` |
| **Project Manager** | `pm@talentsync.ai` | `ProjectManager@123` |
| **Employee** | `employee@talentsync.ai` | `Employee@123` |

---

## 🧪 Testing

```bash
# Run backend test suite
pytest backend/tests

# Run frontend build check
cd frontend
npm run build
```
