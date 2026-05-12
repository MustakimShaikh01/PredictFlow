# 🚀 TeamAI — AI-Powered Task & Team Intelligence Platform

A full-stack SaaS application for team management with AI-powered predictions, Kanban boards, analytics, and smart recommendations.

## Architecture

```
Frontend (React + Vite)          → Port 3000
Backend  (Node.js + Express + TS) → Port 5000
AI Service (Python + FastAPI)     → Port 8000
Database (MongoDB)                → Port 27017
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Zustand, Lucide Icons |
| Backend | Node.js, Express, TypeScript, Mongoose |
| Auth | JWT (Access + Refresh Tokens), bcrypt |
| Database | MongoDB |
| Email | Nodemailer + Gmail SMTP |
| AI Service | FastAPI, scikit-learn, NumPy |
| Security | Helmet, CORS, Rate Limiting, RBAC |
| Testing | Jest, Supertest |
| CI/CD | GitHub Actions |

## Features

- ✅ JWT Authentication (Register/Login/Refresh/Logout)
- ✅ Role-Based Access Control (Admin, Manager, Employee)
- ✅ Team Management with member assignment
- ✅ Project Management with progress tracking
- ✅ Task Management with full CRUD
- ✅ Kanban Board with drag-and-drop
- ✅ Performance Analytics & Charts
- ✅ AI Completion Prediction
- ✅ Smart Team Recommendation Engine
- ✅ Promotion/Bonus Recommendations
- ✅ Email Notifications (Welcome, Task Assignment, Password Reset)
- ✅ CI/CD Pipeline (GitHub Actions)

## Quick Start

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # Edit with your values
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. AI Service
```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 4. MongoDB
Make sure MongoDB is running on `localhost:27017`

## API Endpoints

### Auth
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh token
- `POST /api/auth/logout` — Logout

### Users
- `GET /api/users/me` — Current user
- `GET /api/users` — All users (admin/manager)
- `GET /api/users/:id/stats` — User statistics

### Tasks
- `POST /api/tasks` — Create task
- `GET /api/tasks` — List tasks
- `PUT /api/tasks/:id` — Update task
- `DELETE /api/tasks/:id` — Delete task
- `POST /api/tasks/:id/comments` — Add comment

### Projects
- `POST /api/projects` — Create project
- `GET /api/projects` — List projects
- `PUT /api/projects/:id` — Update project
- `DELETE /api/projects/:id` — Delete project

### Teams
- `POST /api/teams` — Create team
- `GET /api/teams` — List teams
- `POST /api/teams/:id/members` — Add member
- `DELETE /api/teams/:id/members` — Remove member

### Analytics
- `GET /api/analytics/dashboard` — Dashboard stats
- `GET /api/analytics/team-performance` — Team performance
- `GET /api/analytics/project-progress` — Project progress

### AI
- `POST /api/ai/predict/completion` — Predict task completion
- `POST /api/ai/recommend/team` — Smart team recommendation
- `GET /api/ai/analyze/performance` — Promotion analysis

## Testing
```bash
cd backend
npm test
```

## Deployment
- **Frontend** → Vercel
- **Backend** → Render / Railway
- **AI Service** → Render
- **Database** → MongoDB Atlas

