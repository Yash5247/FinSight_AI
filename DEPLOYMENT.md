# FinSight AI — Deployment Checklist

Follow these steps **in order** to make your live Vercel site fully functional.

---

## Why things may not work yet

| Issue | Cause |
|-------|--------|
| Upload/Chat fails | Backend is not deployed or not reachable |
| "Failed to fetch" | `VITE_API_URL` not set on Vercel |
| CORS error | Backend `CORS_ORIGINS` missing your Vercel URL |
| Backend crashes on Render | Missing `OPENAI_API_KEY` or `PINECONE_API_KEY` |

The **frontend on Vercel is only the UI**. Upload and Chat require the **FastAPI backend on Render** with valid API keys.

---

## Step 1 — Get API Keys (5 min)

### OpenAI
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new secret key
3. Copy it (starts with `sk-`)

### Pinecone
1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Create a free account
3. Copy your API key from the dashboard
4. Note your region (e.g. `us-east-1`)

---

## Step 2 — Deploy Backend on Render (10 min)

1. Go to [render.com](https://render.com) and sign in with GitHub
2. Click **New → Web Service**
3. Connect repository: **Yash5247/FinSight_AI**
4. Configure:
   | Setting | Value |
   |---------|-------|
   | **Name** | `finsight-ai-backend` |
   | **Root Directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `python run.py` |
   | **Plan** | Free |

5. Add **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `OPENAI_API_KEY` | your OpenAI key |
   | `PINECONE_API_KEY` | your Pinecone key |
   | `PINECONE_INDEX_NAME` | `finsight-reports` |
   | `PINECONE_CLOUD` | `aws` |
   | `PINECONE_REGION` | `us-east-1` |
   | `ENVIRONMENT` | `production` |
   | `CORS_ORIGINS` | your Vercel URL (see below) |
   | `LOG_LEVEL` | `INFO` |

   **CORS_ORIGINS example:**
   ```
   https://finsight-ai.vercel.app,https://your-project-name.vercel.app
   ```
   Use your exact Vercel URL (no trailing slash).

6. Click **Create Web Service** and wait for deploy (~3–5 min)
7. Copy your backend URL, e.g. `https://finsight-ai-backend.onrender.com`
8. Test: open `https://YOUR-BACKEND.onrender.com/health` — should return `{"status":"ok",...}`

> **Note:** Render free tier sleeps after 15 min idle. First request may take ~30 seconds to wake up.

---

## Step 3 — Configure Vercel Frontend (3 min)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → your FinSight project
2. **Settings → Environment Variables**
3. Add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://YOUR-BACKEND.onrender.com` |

   ⚠️ **No trailing slash.** Example: `https://finsight-ai-backend.onrender.com`

4. Apply to **Production**, **Preview**, and **Development**
5. Go to **Deployments** → click **⋯** on latest → **Redeploy**

> **Important:** `VITE_*` variables are baked in at **build time**. You must redeploy after adding or changing them.

---

## Step 4 — Verify Everything Works

1. Open your Vercel site
2. Header should show **API Online** (green pill)
3. Go to **Upload** → upload a PDF annual report
4. Go to **Chat** → ask: *What was the total revenue?*
5. You should get an answer with **source citations**

---

## Troubleshooting

### Header shows "API Offline"
- Check Render backend logs for errors
- Verify `/health` works in browser
- Confirm `VITE_API_URL` is set and you redeployed Vercel

### CORS error in browser console
- Add your exact Vercel URL to `CORS_ORIGINS` on Render
- Redeploy Render (Vercel `*.vercel.app` domains are also allowed automatically)

### "Invalid or corrupted PDF"
- Use a text-based PDF (not scanned images)
- File must be under 25 MB

### Pinecone / OpenAI errors
- Verify API keys are correct on Render
- Ensure OpenAI account has billing/credits
- Pinecone index is created automatically on first upload

### Render crash: `You haven't specified an Api-Key`
- **Cause:** `PINECONE_API_KEY` is not set on Render
- **Fix:** Render → your service → **Environment** → add:
  - `PINECONE_API_KEY` = your key from [app.pinecone.io](https://app.pinecone.io)
  - `OPENAI_API_KEY` = your key from [platform.openai.com](https://platform.openai.com)
- Click **Save Changes** then **Manual Deploy**

### Render: `No open ports detected`
- Usually means the app **crashed on startup** (often missing API keys above)
- After adding keys, redeploy — the server must stay running to bind to PORT

### Render build fails
- Confirm Root Directory is `backend`
- Python version: 3.11

---

## Quick Reference

| Service | Platform | Root Directory |
|---------|----------|----------------|
| Frontend | Vercel | `frontend` |
| Backend | Render | `backend` |

| Frontend Env (Vercel) | Backend Env (Render) |
|-----------------------|----------------------|
| `VITE_API_URL` | `OPENAI_API_KEY` |
| | `PINECONE_API_KEY` |
| | `CORS_ORIGINS` |

---

## After Setup

Share in your portfolio:
- **Live Demo:** your Vercel URL
- **GitHub:** [github.com/Yash5247/FinSight_AI](https://github.com/Yash5247/FinSight_AI)
- **API Docs:** `https://YOUR-BACKEND.onrender.com/docs`
