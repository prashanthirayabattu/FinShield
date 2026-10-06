# Deployment Documentation — Build Secure 24

## Overview

FinShield is configured for unified full-stack production deployment on **Vercel** with a single public domain and **Neon PostgreSQL** as the cloud database.

The deployment operates as a unified application:
- **Frontend (`https://<domain>/`):** React 19 + Vite single-page application served via Vercel's global CDN edge network from `src/dist`.
- **Backend API (`https://<domain>/api/...`):** Express 5 + TypeScript serverless functions executed via Vercel's Node.js runtime (`api/index.ts`).
- **Database:** Serverless PostgreSQL on Neon with connection pooling and schema migrations managed by Prisma ORM.

Because both the frontend and backend share the exact same domain origin, all browser authentication cookies (`finshield_auth`) are set as HttpOnly `SameSite=Strict` and `Secure=true`, completely eliminating cross-site request forgery (CSRF) vectors and third-party cookie blocking issues.

---

## Live Deployment Reference

- **Live Application URL:** `https://finshield-secure.vercel.app` (or your team's assigned Vercel URL)
- **Hosting Platform:** Vercel (Edge CDN + Node.js Serverless Functions) & Neon (PostgreSQL)
- **Database Engine:** PostgreSQL 16 (Neon Serverless)
- **Access Credentials for Hackathon Evaluators:**
  - **Standard User Account:**
    - Role: `USER`
    - Email: `demo.user@finshield.local`
    - Password: `Password123!` (or register any new account live in the UI)
  - **Security Administrator Account:**
    - Role: `ADMIN`
    - Email: `admin@finshield.local`
    - Password: `AdminPassword123!`

---

## Required Environment Variables

Set the following environment variables in the **Vercel Project Dashboard** under **Settings > Environment Variables**:

| Variable Name | Description | Required (Yes/No) | Example / Format |
|---|---|---|---|
| `DATABASE_URL` | Live Neon PostgreSQL connection string (with SSL mode) | **Yes** | `postgresql://finshield_owner:***@ep-***.ap-southeast-1.aws.neon.tech/finshield?sslmode=require` |
| `JWT_SECRET` | 32+ character high-entropy key for signing HMAC SHA-256 session cookies | **Yes** | `finshield_prod_sec_jwt_key_9f82a17bc04e67d2_min32chars` |
| `NODE_ENV` | Runtime environment mode; enables secure cookies and strict error masking | **Yes** | `production` |
| `FRONTEND_URL` | Canonical public deployment URL | **Yes** | `https://finshield-secure.vercel.app` |
| `AI_PROVIDER` | Optional LLM provider (`gemini`, `openai`, or rule-based security fallback) | No | `gemini` |
| `GEMINI_API_KEY` | Google Gemini API key for frontier conversational financial intelligence | No | `AIzaSy...` |
| `OPENAI_API_KEY` | OpenAI API key for alternative model routing | No | `sk-...` |

---

## Build & Deployment Instructions

### Method 1: Vercel Dashboard (Recommended)

1. **Commit and Push:**
   Ensure all changes are pushed to your GitHub repository:
   ```bash
   git push origin main
   ```

2. **Import Project in Vercel:**
   - Navigate to [vercel.com/new](https://vercel.com/new).
   - Select your GitHub repository: `prashanthirayabattu/FinShield`.
   - Leave **Root Directory** as default (`.` repository root).

3. **Verify Build Settings:**
   `vercel.json` automatically configures:
   - **Build Command:** `cd src && npm install && npx prisma generate && npm run build`
   - **Output Directory:** `src/dist`
   - **Rewrites:**
     - `/api/(.*)` &rarr; `/api` (invokes `api/index.ts`)
     - `/(.*)` &rarr; `/index.html` (SPA routing)

4. **Configure Environment Variables:**
   Add `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`, and `FRONTEND_URL`.

5. **Deploy:**
   Click **Deploy**. Vercel will build the Vite frontend, generate the Prisma engine binaries (`rhel-openssl-3.0.x`), and bundle the Express API.

### Method 2: Vercel CLI

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Link and deploy to production
vercel --prod
```

---

## Post-Deployment Verification Checklist

Once deployed, verify the following health and security endpoints:

1. **API Health Check:**
   ```bash
   curl -I https://<your-domain>.vercel.app/api/health
   # Expected: HTTP/2 200 OK
   # Headers: Strict-Transport-Security, X-Content-Type-Options: nosniff
   ```

2. **Static SPA Root:**
   ```bash
   curl -I https://<your-domain>.vercel.app/
   # Expected: HTTP/2 200 OK (Content-Type: text/html)
   ```

3. **Authentication & Cookies:**
   - Register a new account via `https://<your-domain>.vercel.app/register`.
   - Confirm `set-cookie: finshield_auth=...; HttpOnly; Secure; SameSite=Strict; Path=/`.
   - Navigate to `/dashboard` and verify user transactions, budgets, ScamShield, and Voice Mode operate in real-time.
