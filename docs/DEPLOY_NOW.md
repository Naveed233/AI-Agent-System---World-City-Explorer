# 🚀 Quick Deployment Guide - City Travel Demo

## Deploy Backend (Mastra API) - Railway (Recommended)

### Option 1: Railway CLI (Fastest)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize and deploy
cd /home/maqbool/City-Information-Assistant
railway init
railway up

# Add environment variables
railway variables set OPENAI_API_KEY="your_key_here"

# Get your deployed URL
railway open
```

### Option 2: Railway Web UI

1. Go to https://railway.app/
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select `City-Information-Assistant`
5. Add environment variable: `OPENAI_API_KEY`
6. Railway will auto-deploy!
7. Copy your deployment URL (e.g., `https://your-app.up.railway.app`)

---

## Deploy Frontend (Mobile Web App) - Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd /home/maqbool/City-Travel-App
vercel --prod
```

### Option 2: Vercel Web UI

1. Go to https://vercel.com/
2. Sign in with GitHub
3. Click "Add New" → "Project"
4. Select `City-Travel-App`
5. Framework Preset: **Expo (Web)**
6. Build Command: `npx expo export:web`
7. Output Directory: `web-build`
8. Click "Deploy"!

---

## Update API Connection

After deploying backend, update the frontend:

```typescript
// /home/maqbool/City-Travel-App/src/services/api.ts
const API_URL = 'https://your-backend.up.railway.app';  // Your Railway URL
```

Then redeploy frontend!

---

## Test Your Live Demo

1. Backend API: `https://your-backend.up.railway.app`
2. Frontend App: `https://your-app.vercel.app`
3. Test chat features and city information queries

---

**Need help? The deployment should take ~5 minutes total!**

