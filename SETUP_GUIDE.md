# FinSight AI — Copy-Paste Setup Guide (No Mistakes)

Your backend `/health` shows `"configured": true` — **your API keys on Render are correct.**

If the website still does not work, the problem is almost always **Step 3 below (Vercel)**, not Pinecone cloud settings.

---

## What you DO and DO NOT need from Pinecone website

| In Pinecone website | Do you need it? |
|---------------------|-----------------|
| **API Key** | YES — copy this only |
| "Cloud" / "AWS" / "Region" in Pinecone UI | **NO** — you will NOT find these as settings to copy |
| Create index manually | Optional — the app creates it automatically |

**PINECONE_CLOUD** and **PINECONE_REGION** are NOT copied from Pinecone. They are plain text you type into **Render Environment Variables**. Use the defaults below.

---

## STEP 1 — OpenAI key (one time)

1. Open [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Click **Create new secret key**
3. Copy the full key (starts with `sk-`)
4. Keep it somewhere safe — you cannot see it again

---

## STEP 2 — Pinecone key (one time)

1. Open [app.pinecone.io](https://app.pinecone.io)
2. Sign up / log in (free tier is fine)
3. Go to **API Keys** (left sidebar)
4. Click **Create API Key**
5. Copy the key (long string — **not** the index name)

You do **not** need to create an index in Pinecone. The app creates `finsight-reports` automatically on first PDF upload.

---

## STEP 3 — Render backend env vars (copy exactly)

1. Open [dashboard.render.com](https://dashboard.render.com)
2. Click your **FinSight backend** service
3. Click **Environment** in the left menu
4. Add or update **each row exactly** (Key = left column, Value = right column):

```
OPENAI_API_KEY          = sk-paste-your-openai-key-here
PINECONE_API_KEY        = paste-your-pinecone-key-here
PINECONE_INDEX_NAME     = finsight-reports
PINECONE_CLOUD          = aws
PINECONE_REGION         = us-east-1
ENVIRONMENT             = production
CORS_ORIGINS            = https://YOUR-VERCEL-URL.vercel.app
LOG_LEVEL               = INFO
```

### Replace only these two placeholders:
- `sk-paste-your-openai-key-here` → your real OpenAI key
- `paste-your-pinecone-key-here` → your real Pinecone key
- `https://YOUR-VERCEL-URL.vercel.app` → your actual Vercel site URL

### Rules (common mistakes):
- No spaces before or after the `=`
- No quotes around values
- No trailing `/` at end of URLs
- `PINECONE_CLOUD` is literally the word `aws` (lowercase)
- `PINECONE_REGION` is literally `us-east-1`

5. Click **Save Changes**
6. Render will ask to redeploy — click **Yes / Deploy**

### Test Render (wait until deploy finishes ~3 min):

Open in browser:
```
https://YOUR-BACKEND-NAME.onrender.com/health
```

You should see:
```json
{"status":"ok","configured":true,"missing_env":[]}
```

If you see this — **Render is done. Backend is working.**

---

## STEP 4 — Vercel frontend (THIS is what most people miss)

Your Vercel site is only HTML/JS. It must know your Render backend URL.

1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your **FinSight** project
3. **Settings** → **Environment Variables**
4. Click **Add New**

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://YOUR-BACKEND-NAME.onrender.com` |

Example: if Render URL is `https://finsight-ai-backend.onrender.com`, use exactly that.

5. Enable for: **Production**, **Preview**, **Development** (all three)
6. Click **Save**
7. Go to **Deployments** tab
8. Click **⋯** on the latest deployment → **Redeploy**
9. Wait for build to finish (~1–2 min)

### Test Vercel:

1. Open your Vercel website
2. Top right should say **API Online** (green)
3. If it says **API Offline** or **Keys Missing** → `VITE_API_URL` is wrong or you forgot to redeploy

---

## STEP 5 — Test upload and chat

1. On your Vercel site → **Upload**
2. Upload any PDF annual report (under 25 MB)
3. Wait for "Document indexed successfully"
4. Go to **Chat**
5. Ask: `What was the total revenue?`

First upload may take 30–60 seconds (Render free tier wakes up + creates Pinecone index).

---

## Troubleshooting

### `/health` is OK but website shows API Offline
→ Fix **Step 4**. Set `VITE_API_URL` and **Redeploy Vercel**.

### Upload fails with Pinecone error
→ On Render, confirm:
```
PINECONE_CLOUD=aws
PINECONE_REGION=us-east-1
```
Then redeploy Render and try upload again.

### Upload fails with OpenAI error
→ OpenAI account needs billing/credits at [platform.openai.com/account/billing](https://platform.openai.com/account/billing)

### CORS error in browser (F12 → Console)
→ On Render, set `CORS_ORIGINS` to your **exact** Vercel URL (no trailing slash)

### Render slow on first request
→ Free tier sleeps after 15 min. Wait 30–60 seconds and retry.

---

## Checklist — tick each box

- [ ] OpenAI key created
- [ ] Pinecone key created (from API Keys page only)
- [ ] All 8 Render env vars set (including `aws` and `us-east-1`)
- [ ] Render redeployed after saving env vars
- [ ] `/health` shows `"configured": true`
- [ ] `VITE_API_URL` set on Vercel to Render URL (no trailing slash)
- [ ] Vercel redeployed after adding env var
- [ ] Website header shows **API Online**
- [ ] PDF upload works
- [ ] Chat returns an answer

---

## Your current status

You already have:
```json
{"status":"ok","configured":true,"missing_env":[]}
```

So **Steps 1–3 are done.** Focus on **Step 4 (Vercel `VITE_API_URL` + Redeploy)**, then **Step 5 (test upload/chat).**
