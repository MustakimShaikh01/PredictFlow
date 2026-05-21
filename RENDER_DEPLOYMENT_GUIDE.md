# 🚀 Render Deployment Guide - Full Stack Deployment

## Overview
Deploy all 3 services (Frontend, Backend, AI) to Render simultaneously.

---

## 📋 Prerequisites

1. **Render Account** → [render.com](https://render.com)
2. **GitHub Repository** → Push your code to GitHub
3. **MongoDB Atlas Account** → Free tier available at [mongodb.com/cloud](https://mongodb.com/cloud)
4. **Environment Variables Ready**

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Create a free tier cluster on [MongoDB Atlas](https://mongodb.com/cloud)
2. Get your connection string: `mongodb+srv://username:password@cluster.mongodb.net/dbname`
3. Save this for backend environment variables

---

## Step 2: Deploy Frontend (React + Vite)

### Option A: Deploy as Static Site (Recommended - Free)

1. **Connect to GitHub**
   - Go to Render Dashboard → New → Static Site
   - Select your GitHub repository
   - Branch: `main`

2. **Build Settings**
   - Build Command: `cd frontend && npm install && npm run build`
   - Publish Directory: `frontend/dist`

3. **Environment Variables**
   - None required (frontend is static)

4. **Deploy!**
   - Render will automatically build and serve your React app

### Option B: Deploy as Web Service (if needed for backend routing)

1. Go to Render Dashboard → New → Web Service
2. Select GitHub repository
3. **Settings:**
   - Name: `ai-team-frontend`
   - Environment: `Node`
   - Build Command: `cd frontend && npm install && npm run build`
   - Start Command: `cd frontend && npm run preview`
   - Port: `3000`

---

## Step 3: Deploy Backend (Node.js + Express)

1. **Create Web Service**
   - Render Dashboard → New → Web Service
   - Select GitHub repository

2. **Service Configuration**
   - Name: `ai-team-backend`
   - Environment: `Node`
   - Build Command: `cd backend && npm install && npm run build`
   - Start Command: `cd backend && npm start`
   - Port: `5000`

3. **Environment Variables**
   ```
   NODE_ENV=production
   PORT=5000
   
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teamai
   
   JWT_SECRET=your_jwt_secret_here_make_it_long
   JWT_REFRESH_SECRET=your_refresh_secret_here
   JWT_EXPIRE=7d
   JWT_REFRESH_EXPIRE=30d
   
   CLIENT_URL=https://your-frontend-url.onrender.com
   
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   
   AI_SERVICE_URL=https://your-ai-service-url.onrender.com
   
   ADMIN_EMAIL=admin@example.com
   ```

4. **Deploy!**

---

## Step 4: Deploy AI Service (Python + FastAPI)

1. **Create Web Service**
   - Render Dashboard → New → Web Service
   - Select GitHub repository

2. **Service Configuration**
   - Name: `ai-team-service`
   - Environment: `Python 3.11`
   - Build Command: `pip install -r ai-service/requirements.txt`
   - Start Command: `cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000`
   - Port: `8000`

3. **Environment Variables**
   ```
   PYTHON_VERSION=3.11
   ```

4. **Deploy!**

---

## Step 5: Update Frontend API Configuration

After deploying backend, update frontend API base URL:

**File:** `frontend/src/lib/api.ts`

```typescript
const API_BASE_URL = process.env.VITE_API_URL || 'https://your-backend-url.onrender.com/api';
const AI_SERVICE_URL = process.env.VITE_AI_URL || 'https://your-ai-service-url.onrender.com';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

**Create:** `frontend/.env.production`

```
VITE_API_URL=https://your-backend-url.onrender.com/api
VITE_AI_URL=https://your-ai-service-url.onrender.com
```

---

## Step 6: Update Backend CORS Configuration

**File:** `backend/src/server.ts`

Make sure CORS allows your Render frontend:

```typescript
app.use(cors({ 
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.onrender.com'
  ], 
  credentials: true 
}));
```

---

## 📝 Typical Render URLs

After deployment, your services will be at:

```
Frontend:  https://ai-team-frontend.onrender.com
Backend:   https://ai-team-backend.onrender.com
AI Service: https://ai-team-service.onrender.com
```

---

## ⚠️ Important Notes

### Free Tier Limitations (Render)
- **Cold starts** - Services spin down after 15 minutes of inactivity (restart takes ~30 seconds)
- **Shared resources** - Limited CPU/RAM on free tier
- **Paid tier** - Recommended for production

### Upgrade to Paid (Optional)
- **Starter Plan** - $7/month per service
- Removes cold starts
- Better performance

---

## 🔄 Deployment Workflow

### Deploy All at Once:

1. Push code to GitHub
2. Each Render service redeploys automatically on push
3. **Total deployment time:** ~5-10 minutes
4. Test: Visit `https://your-frontend-url.onrender.com`

### Redeploy on Changes:
- Git push → GitHub Actions trigger → Render auto-redeploy

---

## 🧪 Testing the Deployment

```bash
# Test backend
curl https://your-backend-url.onrender.com/health

# Test AI service
curl https://your-ai-service-url.onrender.com/health

# Test frontend
# Visit https://your-frontend-url.onrender.com in browser
```

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Update `CLIENT_URL` in backend env vars |
| **API requests fail** | Check `API_BASE_URL` in frontend config |
| **Database connection fails** | Verify MongoDB Atlas IP whitelist & connection string |
| **Cold start delays** | Upgrade to Paid plan or use health check pings |
| **Missing dependencies** | Ensure `package.json` & `requirements.txt` are complete |

---

## 📚 Quick Links

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas](https://mongodb.com/cloud)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)
- [Node.js Production Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Create 3 Render services (follow steps above)
3. ✅ Configure environment variables
4. ✅ Deploy and test
5. ✅ Monitor logs in Render dashboard

**You're ready to go live! 🚀**
