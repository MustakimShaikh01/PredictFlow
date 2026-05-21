# 🏗️ Deployment Architecture - All 3 Services on Render

## Visual Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           INTERNET USER                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
    ┌──────────────────┐      ┌──────────────────┐
    │  Frontend (React) │      │  Browser Cache   │
    │ onrender.com     │      │  Local Storage   │
    │   (Static)       │      │  JWT Tokens      │
    └────────┬─────────┘      └────────┬─────────┘
             │                         │
             └─────────────┬───────────┘
                           │ HTTP Requests
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼                                   ▼
    ┌──────────────────┐          ┌──────────────────┐
    │  Backend (Node) │          │  AI Service      │
    │  Express API    │          │  FastAPI         │
    │ onrender.com    │          │ onrender.com     │
    │  (Port 5000)    │          │  (Port 8000)     │
    └────────┬────────┘          └────────┬─────────┘
             │                           │
             │                           │
             └──────────────┬────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
      ┌──────────────┐              ┌──────────────────┐
      │ MongoDB      │              │ External APIs    │
      │ Atlas        │              │ (Email, etc)     │
      │ (Cloud)      │              └──────────────────┘
      └──────────────┘
```

## 🚀 Deployment Summary

### What Gets Deployed?

| Service | Technology | Render Type | Build | Start | URL |
|---------|-----------|------------|-------|-------|-----|
| **Frontend** | React + Vite | Static Site | `npm run build` | Auto | `frontend.onrender.com` |
| **Backend** | Node + Express | Web Service | `npm run build` | `npm start` | `backend.onrender.com` |
| **AI Service** | Python + FastAPI | Web Service | `pip install -r` | `uvicorn main:app` | `ai-team.onrender.com` |

### How They Communicate

```
User Browser
     ↓
[Frontend] ← fetches index.html, JS, CSS
     ↓
Sends API requests to:
     ├→ [Backend] ← REST API calls
     │  ├→ [MongoDB] ← Data queries
     │  └→ [AI Service] ← ML predictions
     │
     └→ [AI Service] ← Direct ML requests (if needed)
```

### Environment Variables Flow

```
Frontend (.env.production)
  ↓
  VITE_API_URL → Points to Backend
  VITE_AI_URL → Points to AI Service

Backend (.env in Render)
  ↓
  MONGODB_URI → MongoDB Atlas
  CLIENT_URL → CORS allow Frontend
  AI_SERVICE_URL → Calls AI Service
  SMTP_* → Gmail SMTP for emails
```

---

## 📊 Render Pricing (Free vs Paid)

### Free Tier ⭐
- **Cost:** $0/month
- **CPU:** Shared
- **RAM:** 512 MB
- **Cold Starts:** Yes (30 seconds after 15 min inactivity)
- **Bandwidth:** 100 GB/month
- **Good For:** Development, prototyping, low-traffic projects

### Starter Plan 💰
- **Cost:** $7/month per service × 3 = $21/month
- **CPU:** Dedicated 0.5 vCPU
- **RAM:** 512 MB
- **Cold Starts:** No
- **Auto-scaling:** Yes
- **Good For:** Production, growing projects

---

## 📈 Deployment Timeline

```
T+0min:  Push code to GitHub
T+5min:  Frontend deployed (Static Site)
T+8min:  AI Service deployed (Python)
T+12min: Backend deployed (Node)
T+15min: All 3 services LIVE ✅

Total Time: ~15 minutes for first deployment
Subsequent Deployments: ~10 minutes
```

---

## 🔄 Continuous Deployment

### Auto-Redeploy on Git Push

```
You: git push to GitHub
     ↓
GitHub: Detects push
     ↓
Render: Triggers auto-redeploy on all 3 services
     ↓
Frontend: Rebuild React app
Backend: Rebuild & restart Node
AI Service: Reinstall & restart Python
     ↓
✅ All services updated automatically
```

**No manual deployment needed!**

---

## 🔐 Security Considerations

### What's Protected?
- ✅ JWT Tokens in headers
- ✅ Passwords hashed with bcrypt
- ✅ CORS enabled for your domain only
- ✅ Rate limiting on API
- ✅ Helmet.js security headers

### What You Need to Do?
- ✅ Use strong JWT secrets (32+ chars)
- ✅ Keep MONGODB_URI secret (Render env vars)
- ✅ Use app-specific Gmail password (not main password)
- ✅ Enable MongoDB IP whitelist
- ✅ Rotate secrets regularly

---

## 📞 Support & Monitoring

### Monitoring on Render
- **Logs:** Real-time logs for each service
- **Metrics:** CPU, Memory, Network usage
- **Health:** Service health status
- **Alerts:** (Paid tier)

### Where to Check Logs?
1. Go to Render Dashboard
2. Select service
3. Click "Logs" tab
4. See real-time output

---

## 🎯 Next Steps After Deployment

1. **Test Everything**
   - Register account
   - Create projects/tasks
   - Test AI predictions

2. **Set Up Monitoring**
   - Monitor Render logs daily
   - Check MongoDB usage
   - Monitor Render billing

3. **Optimize (Optional)**
   - Consider Paid tier if free cold starts are annoying
   - Enable caching
   - Optimize database queries

4. **Iterate**
   - Make code changes locally
   - Push to GitHub
   - Render auto-deploys all 3 services

---

## 📚 Quick Reference Links

| Resource | Link |
|----------|------|
| Render Dashboard | https://dashboard.render.com |
| MongoDB Atlas | https://cloud.mongodb.com |
| Project README | ./README.md |
| Deployment Guide | ./RENDER_DEPLOYMENT_GUIDE.md |
| Checklist | ./DEPLOYMENT_CHECKLIST.md |

---

## ✅ Deployment Status

- [x] Architecture documented
- [x] All 3 services ready
- [x] Deployment guides created
- [x] Environment templates prepared
- [ ] GitHub push
- [ ] Render setup
- [ ] Test deployment
- [ ] Go live!

**Ready to deploy? Follow the DEPLOYMENT_CHECKLIST.md! 🚀**
