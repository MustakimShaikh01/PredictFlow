# ✅ Render Deployment Checklist

## Pre-Deployment Setup

### 1. GitHub Repository
- [ ] Push all code to GitHub (including `.env.render` files)
- [ ] Ensure no sensitive data in repository
- [ ] All 3 folders exist: `backend/`, `frontend/`, `ai-service/`

### 2. Database Setup
- [ ] Create MongoDB Atlas account
- [ ] Create a free tier cluster
- [ ] Create a database user with credentials
- [ ] Get MongoDB connection string
- [ ] Add IP 0.0.0.0/0 to network access (for Render)

### 3. Email Setup (Optional for Email Notifications)
- [ ] Create Gmail app-specific password
- [ ] Save Gmail credentials

### 4. Secrets & Keys
- [ ] Generate JWT_SECRET (use: `openssl rand -base64 32`)
- [ ] Generate JWT_REFRESH_SECRET (use: `openssl rand -base64 32`)
- [ ] Prepare all environment variables

---

## Render Dashboard Setup

### Service 1: Deploy AI Service First

- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub account
- [ ] Select repository
- [ ] Service Settings:
  - [ ] Name: `ai-team-service`
  - [ ] Environment: Python 3.11
  - [ ] Build Command: `pip install -r ai-service/requirements.txt`
  - [ ] Start Command: `cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000`
  - [ ] Port: 8000
- [ ] Environment Variables: None required initially
- [ ] Click Deploy
- [ ] Wait for deployment (3-5 minutes)
- [ ] Copy the Render URL: `https://ai-team-service.onrender.com`
- [ ] Test health endpoint: Visit `https://ai-team-service.onrender.com/health`

### Service 2: Deploy Backend

- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub
- [ ] Select repository
- [ ] Service Settings:
  - [ ] Name: `ai-team-backend`
  - [ ] Environment: Node
  - [ ] Build Command: `cd backend && npm install && npm run build`
  - [ ] Start Command: `cd backend && npm start`
  - [ ] Port: 5000
- [ ] Environment Variables (copy from `.env.render`):
  ```
  MONGODB_URI=mongodb+srv://...
  JWT_SECRET=...
  JWT_REFRESH_SECRET=...
  CLIENT_URL=https://ai-team-frontend.onrender.com
  AI_SERVICE_URL=https://ai-team-service.onrender.com
  ADMIN_EMAIL=...
  NODE_ENV=production
  ```
- [ ] Click Deploy
- [ ] Wait for deployment (5-10 minutes)
- [ ] Copy the Render URL: `https://ai-team-backend.onrender.com`
- [ ] Test health endpoint: Visit `https://ai-team-backend.onrender.com/health`

### Service 3: Deploy Frontend

#### Option A: Static Site Deployment (Recommended)

- [ ] Render Dashboard → New → Static Site
- [ ] Connect GitHub
- [ ] Select repository
- [ ] Settings:
  - [ ] Name: `ai-team-frontend`
  - [ ] Build Command: `cd frontend && npm install && npm run build`
  - [ ] Publish Directory: `frontend/dist`
- [ ] Environment Variables:
  ```
  VITE_API_URL=https://ai-team-backend.onrender.com/api
  VITE_AI_URL=https://ai-team-service.onrender.com
  ```
- [ ] Click Deploy
- [ ] Wait for deployment (3-5 minutes)
- [ ] Copy the Render URL: `https://ai-team-frontend.onrender.com`

#### Option B: Web Service Deployment

- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub
- [ ] Select repository
- [ ] Settings:
  - [ ] Name: `ai-team-frontend`
  - [ ] Environment: Node
  - [ ] Build Command: `cd frontend && npm install && npm run build`
  - [ ] Start Command: `cd frontend && npm install -g serve && serve -s dist -l 3000`
  - [ ] Port: 3000
- [ ] Environment Variables:
  ```
  VITE_API_URL=https://ai-team-backend.onrender.com/api
  VITE_AI_URL=https://ai-team-service.onrender.com
  ```
- [ ] Click Deploy

---

## Post-Deployment Testing

### Frontend Testing
- [ ] Visit `https://ai-team-frontend.onrender.com`
- [ ] Check browser console for errors
- [ ] Try to register a new account
- [ ] Try to login

### Backend Testing
- [ ] Health check: `curl https://ai-team-backend.onrender.com/health`
- [ ] Check logs in Render dashboard for errors
- [ ] Verify database connection

### AI Service Testing
- [ ] Health check: `curl https://ai-team-service.onrender.com/health`
- [ ] Check logs in Render dashboard

### End-to-End Testing
- [ ] [ ] Register a user through frontend
- [ ] [ ] Verify email is sent (check logs)
- [ ] [ ] Login with registered account
- [ ] [ ] Create a project
- [ ] [ ] Create a task
- [ ] [ ] Test AI predictions (if available)
- [ ] [ ] Check analytics/dashboard

---

## Monitoring & Maintenance

### Regular Checks
- [ ] Check Render dashboard for service health
- [ ] Review error logs weekly
- [ ] Monitor database usage on MongoDB Atlas

### Upgrades (Optional)
- [ ] Consider upgrading to Paid tier if cold starts are problematic
- [ ] Scale resources if performance issues occur

---

## Troubleshooting

### Frontend won't load
- [ ] Check: VITE_API_URL is correct
- [ ] Check: Frontend build was successful
- [ ] Check: Browser console for CORS errors

### API calls failing
- [ ] Check: Backend logs in Render dashboard
- [ ] Check: Database connection string is correct
- [ ] Check: MongoDB IP whitelist includes 0.0.0.0/0

### Database connection errors
- [ ] Check: MongoDB connection string
- [ ] Check: User credentials are correct
- [ ] Check: IP whitelist in MongoDB Atlas

### Cold start issues
- [ ] Normal on free tier (wait 30 seconds)
- [ ] Upgrade to Paid plan to eliminate cold starts

---

## Deployment Complete! 🎉

All 3 services are now live on Render. Share your app URL:
`https://ai-team-frontend.onrender.com`
