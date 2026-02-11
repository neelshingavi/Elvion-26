# FounderFlow Deployment Plan for Render

## Table of Contents
1. [Deployment Overview](#1-deployment-overview)
2. [Architecture on Render](#2-architecture-on-render)
3. [Service Breakdown](#3-service-breakdown)
4. [Environment Variables & Secrets](#4-environment-variables--secrets)
5. [Database Strategy](#5-database-strategy)
6. [Networking & Security](#6-networking--security)
7. [Scaling Strategy](#7-scaling-strategy)
8. [Logging & Monitoring](#8-logging--monitoring)
9. [CI/CD Flow](#9-cicd-flow)
10. [Failure & Recovery Scenarios](#10-failure--recovery-scenarios)
11. [Pre-Deployment Checklist](#11-pre-deployment-checklist)
12. [Post-Deployment Validation](#12-post-deployment-validation)

---

## 1. Deployment Overview

### 1.1 Why Render

Render is selected for FounderFlow deployment due to:

| Factor | Benefit |
|--------|---------|
| **Next.js Native Support** | First-class support for SSR/SSG with automatic optimization |
| **Zero DevOps Overhead** | Managed infrastructure eliminates server maintenance |
| **Git-Based Deploys** | Push-to-deploy workflow accelerates iteration |
| **Generous Free Tier** | Suitable for MVP/staging; easy upgrade path |
| **India Region Availability** | Singapore region provides low latency for India users |

### 1.2 Deployment Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                           DEPLOYMENT FLOW                            │
│                                                                      │
│   Git Push ─────▶ Render Build ─────▶ Health Check ─────▶ Live     │
│      │                 │                    │                        │
│      │                 │                    │                        │
│      ▼                 ▼                    ▼                        │
│   main branch     npm run build      GET /api/health               │
│   preview PR      Static + SSR       status === 200                 │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.3 Environments

| Environment | Branch | URL Pattern | Purpose |
|-------------|--------|-------------|---------|
| **Production** | `main` | `founderflow.onrender.com` | Live user traffic |
| **Staging** | `staging` | `founderflow-staging.onrender.com` | Pre-release testing |
| **Preview** | PR branches | Auto-generated | PR review |

---

## 2. Architecture on Render

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           RENDER PLATFORM                            │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Web Service: founderflow                  │   │
│  │                                                              │   │
│  │  ┌──────────────────────────────────────────────────────┐   │   │
│  │  │              Next.js 16 Application                   │   │   │
│  │  │                                                       │   │   │
│  │  │  ┌───────────┐  ┌───────────┐  ┌───────────────────┐│   │   │
│  │  │  │  Static   │  │   SSR     │  │    API Routes     ││   │   │
│  │  │  │  Pages    │  │   Pages   │  │ /api/validate-idea││   │   │
│  │  │  │           │  │           │  │ /api/execute-task ││   │   │
│  │  │  └───────────┘  └───────────┘  └───────────────────┘│   │   │
│  │  └──────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                    │                                 │
└────────────────────────────────────┼─────────────────────────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
                     ▼               ▼               ▼
              ┌──────────┐   ┌──────────────┐  ┌──────────────┐
              │ Firebase │   │  Firebase    │  │  Google      │
              │Firestore │   │  Auth        │  │  Gemini AI   │
              │(Database)│   │(Authentication│  │(LLM API)    │
              └──────────┘   └──────────────┘  └──────────────┘
```

### 2.2 External Dependencies

| Service | Provider | Purpose | Region |
|---------|----------|---------|--------|
| Database | Firebase Firestore | Document store | `asia-south1` (Mumbai) |
| Auth | Firebase Auth | User authentication | Global |
| AI | Google Gemini | LLM for agents | Global |
| Storage | Firebase Storage | File uploads | `asia-south1` |

---

## 3. Service Breakdown

### 3.1 Primary Web Service

| Property | Value |
|----------|-------|
| **Service Name** | `founderflow` |
| **Service Type** | Web Service |
| **Runtime** | Node 20 |
| **Build Command** | `npm ci && npm run build` |
| **Start Command** | `npm run start` |
| **Port** | 3000 (auto-detected) |
| **Region** | Singapore (`singapore`) |
| **Instance Type** | Starter → Standard (production) |
| **Auto-Deploy** | Yes (on push to main) |

### 3.2 Health Check Configuration

```yaml
# Render health check settings
healthCheckPath: /api/health
healthCheckInterval: 30  # seconds
healthCheckTimeout: 10   # seconds
healthCheckPasses: 2     # consecutive passes required
healthCheckFails: 3      # consecutive fails before unhealthy
```

### 3.3 Health Check Endpoint

Create `/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({ 
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.RENDER_GIT_COMMIT || "unknown"
    });
}
```

---

## 4. Environment Variables & Secrets

### 4.1 Required Variables

| Variable | Service | Secret? | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web | No | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web | No | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web | No | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Web | No | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web | No | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web | No | Firebase app ID |
| `GEMINI_API_KEY` | Web | **Yes** | Google Gemini API key |
| `NEXT_PUBLIC_ADMIN_USERNAME` | Web | **Yes** | Admin portal username |
| `NEXT_PUBLIC_ADMIN_PASSWORD` | Web | **Yes** | Admin portal password |
| `NODE_ENV` | Web | No | `production` |

### 4.2 Render Auto-Injected Variables

| Variable | Description |
|----------|-------------|
| `RENDER` | Always `true` on Render |
| `RENDER_EXTERNAL_URL` | Public URL of service |
| `RENDER_GIT_COMMIT` | Git commit SHA |
| `RENDER_GIT_BRANCH` | Git branch name |

### 4.3 Environment Separation

```
Production:   Render Dashboard → founderflow → Environment
Staging:      Render Dashboard → founderflow-staging → Environment  
Development:  Local .env.local file (never committed)
```

### 4.4 Secret Handling Best Practices

1. **Never commit secrets** to version control
2. **Use Render's secret files** for multi-line secrets
3. **Rotate API keys** quarterly
4. **Separate service accounts** per environment
5. **Audit access** via Render team permissions

---

## 5. Database Strategy

### 5.1 Database Provisioning

FounderFlow uses **Firebase Firestore** (external to Render):

| Property | Value |
|----------|-------|
| Provider | Google Cloud Firestore |
| Type | NoSQL Document Database |
| Region | `asia-south1` (Mumbai) |
| Mode | Native mode |
| Provisioning | Firebase Console |

### 5.2 Connection Strategy

```typescript
// Firebase is initialized client-side with SDK
// No connection pooling needed (SDK manages connections)
// Each API route initializes Firebase on cold start

import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const app = getApps().length === 0 
    ? initializeApp(firebaseConfig) 
    : getApps()[0];

export const db = getFirestore(app);
```

### 5.3 Migration Strategy

Firestore is schema-less; migrations are handled via:

1. **Backward-Compatible Changes**: New optional fields only
2. **Migration Scripts**: One-time Cloud Functions for data transformation
3. **Version Fields**: Document `version` field for gradual migration

### 5.4 Backup & Recovery

| Component | Strategy |
|-----------|----------|
| **Automated Backups** | Firestore automatic daily backups (Firebase) |
| **Point-in-Time Recovery** | Firestore PITR (last 7 days) |
| **Manual Exports** | `gcloud firestore export gs://bucket` |
| **Recovery Time** | < 1 hour for full restore |

---

## 6. Networking & Security

### 6.1 HTTPS Configuration

Render provides **automatic HTTPS** via Let's Encrypt:

- All traffic redirected to HTTPS
- TLS 1.2+ enforced
- Certificates auto-renewed 30 days before expiry

### 6.2 CORS Strategy

Currently configured for Firebase services:

```typescript
// CORS handled by Next.js API routes (same-origin by default)
// Firebase SDK handles cross-origin for Firestore/Auth
```

For future API expansion:

```typescript
// In API routes if needed:
const headers = {
    "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
```

### 6.3 Firestore Security Rules

Ensure production rules are deployed:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Startups: owner and team members only
    match /startups/{startupId} {
      allow read: if isTeamMember(startupId);
      allow write: if isOwnerOrCofounder(startupId);
    }
    
    // Add more rules per collection...
  }
}
```

### 6.4 Rate Limiting

Currently no rate limiting (rely on Gemini API limits). For future:

```typescript
// Consider: upstash/ratelimit for Redis-based limiting
// Or: Render's built-in DDoS protection
```

---

## 7. Scaling Strategy

### 7.1 Horizontal Scaling

| Tier | Instances | Use Case |
|------|-----------|----------|
| **Starter** | 1 | Development, staging |
| **Standard** | 1–10 | Production (auto-scale) |
| **Pro** | 1–25 | High traffic |

Render auto-scales based on:
- CPU utilization > 80%
- Memory utilization > 90%
- Response time > 1s

### 7.2 When to Scale

| Metric | Threshold | Action |
|--------|-----------|--------|
| Concurrent Users | > 100 | Upgrade to Standard |
| API Response Time | > 2s p95 | Add instance |
| Memory Usage | > 512MB | Upgrade instance type |
| AI Calls/min | > 60 | Consider background jobs |

### 7.3 Cost vs Performance Tradeoffs

| Decision | Trade-off |
|----------|-----------|
| **Starter tier** | $7/mo; limited to 512MB RAM, cold starts |
| **Standard tier** | ~$25/mo; 1GB RAM, no cold starts |
| **Multiple instances** | Higher cost, better availability |
| **Edge caching** | Faster static content, stale data risk |

### 7.4 Current Recommendation

Start with:
- **Staging**: Starter tier ($7/mo)
- **Production**: Standard tier ($25/mo), 1 instance, auto-scale to 2

---

## 8. Logging & Monitoring

### 8.1 Log Aggregation

Render provides built-in log streaming:

| Feature | Availability |
|---------|--------------|
| Real-time Logs | Dashboard + CLI |
| Log Retention | 7 days (Starter), 30 days (Standard+) |
| Log Search | Full-text search |
| Log Download | Via API |

Access logs:
```bash
render logs --tail --service founderflow
```

### 8.2 Recommended Logging Pattern

```typescript
// Structured logging for production
const log = (level: string, message: string, meta?: object) => {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta,
        service: "founderflow",
        commit: process.env.RENDER_GIT_COMMIT
    }));
};

// Usage in API routes:
log("info", "Task executed", { taskId, userId, duration: 1234 });
log("error", "Gemini call failed", { error: error.message, model });
```

### 8.3 Error Tracking (Future)

For production error tracking, integrate Sentry:

```typescript
// Add to next.config.ts
import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
    org: "founderflow",
    project: "web",
});
```

### 8.4 Health Monitoring

| Check | Frequency | Alert Threshold |
|-------|-----------|-----------------|
| Health endpoint | 30s | 3 consecutive failures |
| Response time | 30s | p95 > 3s |
| Memory usage | 60s | > 90% |
| Deploy status | On deploy | Failed deployment |

### 8.5 Alerting Strategy

Configure Render notifications:

1. **Slack Integration**: Deploy success/failure
2. **Email Alerts**: Service unhealthy
3. **Custom Webhooks**: For PagerDuty/Opsgenie

---

## 9. CI/CD Flow

### 9.1 Git Branch Strategy

```
main ──────────────────────────────────────▶ Production
  │
  └── staging ─────────────────────────────▶ Staging
        │
        └── feature/* ─────────────────────▶ Preview (PR)
```

### 9.2 Auto-Deploy Configuration

| Branch | Environment | Auto-Deploy |
|--------|-------------|-------------|
| `main` | Production | ✅ Yes |
| `staging` | Staging | ✅ Yes |
| `feature/*` | Preview | ✅ Yes (on PR) |
| `hotfix/*` | Production | Manual trigger |

### 9.3 Build Pipeline

```
┌────────────┐    ┌────────────┐    ┌────────────┐    ┌────────────┐
│  git push  │───▶│ npm ci     │───▶│ npm build  │───▶│ Deploy     │
│            │    │            │    │            │    │            │
└────────────┘    └────────────┘    └────────────┘    └────────────┘
                       │                  │                  │
                       ▼                  ▼                  ▼
                  Install deps      TypeScript       Health check
                  Cache modules     Build SSR        Route traffic
```

### 9.4 Rollback Strategy

| Scenario | Action |
|----------|--------|
| **Failed deploy** | Automatic rollback to previous version |
| **Post-deploy bug** | Manual rollback via Render dashboard |
| **Critical hotfix** | Deploy from hotfix branch, then merge to main |

To rollback manually:
1. Open Render Dashboard → Service → Deploys
2. Find last successful deploy
3. Click "Rollback to this deploy"

### 9.5 Safe Deployment Practices

1. **Deploy to staging first**
2. **Run smoke tests on staging**
3. **Merge to main for production**
4. **Monitor for 15 minutes post-deploy**
5. **Be ready to rollback**

---

## 10. Failure & Recovery Scenarios

### 10.1 Backend Crashes

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| 500 errors | Health check fails | Auto-restart container |
| Memory OOM | Process killed | Auto-restart + alert |
| Infinite loop | CPU spike | Manual restart |

**Manual recovery:**
```bash
render restart --service founderflow
```

### 10.2 Database Unavailable

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| Firestore timeout | API errors | Wait for Firebase recovery |
| Auth blocked | Login fails | Check Firebase status dashboard |
| Quota exceeded | Writes fail | Upgrade Firebase plan |

**Graceful degradation:**
- Show cached data where possible
- Display "Service temporarily unavailable" for writes
- Log incidents for post-mortem

### 10.3 AI Service Failure

| Symptom | Detection | Recovery |
|---------|-----------|----------|
| Gemini 429 | Rate limit | Model fallback chain |
| Gemini 500 | API error | Retry with backoff |
| All models fail | Final fallback | Return error, log incident |

Current fallback chain:
```
gemini-2.0-flash-lite-preview-02-05
    └─▶ gemini-2.0-flash-exp
           └─▶ gemini-2.0-flash
                  └─▶ gemini-flash-latest
                         └─▶ Error: "AI service unavailable"
```

### 10.4 Recovery Runbook

```markdown
## Incident Response

1. **Detect**: Alert received or user report
2. **Assess**: Check Render logs, Firebase console
3. **Isolate**: Identify affected component
4. **Mitigate**: 
   - If code issue: Rollback
   - If external service: Enable degraded mode
   - If infrastructure: Restart or scale
5. **Resolve**: Fix root cause
6. **Document**: Update post-mortem doc
```

---

## 11. Pre-Deployment Checklist

### 11.1 Environment Verification

- [ ] All environment variables set in Render
- [ ] Secrets properly marked as secret (hidden)
- [ ] Correct Firebase project ID for environment
- [ ] Admin credentials are strong and unique per environment

### 11.2 Security Checks

- [ ] No secrets in source code (run `git secrets --scan`)
- [ ] Firestore security rules deployed to production
- [ ] Admin auth uses environment variables (not hardcoded)
- [ ] HTTPS enforced (automatic on Render)

### 11.3 Performance Sanity

- [ ] `npm run build` completes successfully
- [ ] Build time < 5 minutes
- [ ] Bundle size reasonable (check `.next/analyze`)
- [ ] No console errors in production build

### 11.4 Code Quality

- [ ] All TypeScript errors resolved
- [ ] Linting passes (`npm run lint`)
- [ ] All tests pass (if applicable)
- [ ] Critical paths manually tested

### 11.5 Final Verification

- [ ] Git working directory clean
- [ ] Main branch up to date
- [ ] CHANGELOG updated
- [ ] Team notified of deployment

---

## 12. Post-Deployment Validation

### 12.1 Smoke Tests

Immediately after deployment, verify:

| Test | URL | Expected |
|------|-----|----------|
| Health check | `/api/health` | `{"status":"healthy"}` |
| Home page | `/` | Renders without error |
| Login | `/login` | Form loads, auth works |
| Founder dashboard | `/founder/dashboard` | Requires auth, loads data |
| Investor dashboard | `/investor/dashboard` | Requires auth, loads data |

### 12.2 Core Flow Verification

| Flow | Steps | Verification |
|------|-------|--------------|
| **Login** | Enter credentials → Login | Redirects to dashboard |
| **Create Project** | New project form → Submit | Project appears in list |
| **AI Validation** | Submit idea → Execute | AI response rendered |
| **Messaging** | Open chat → Send message | Message appears |

### 12.3 Monitoring Confirmation

- [ ] Render health checks passing
- [ ] No error spikes in logs
- [ ] Response times normal (< 1s for pages)
- [ ] Firebase usage within quotas

### 12.4 Rollback Criteria

Rollback immediately if:
- Health check fails for > 2 minutes
- Error rate > 5% of requests
- Critical user flow broken
- Security vulnerability discovered

### 12.5 Sign-Off

```markdown
## Deployment Verification

- Deployed by: _______________
- Deploy time: _______________
- Commit SHA: _______________
- Smoke tests: [ ] PASS / [ ] FAIL
- Monitoring: [ ] Confirmed
- Status: [ ] LIVE / [ ] ROLLED BACK
```

---

## Appendix: Quick Commands

```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin main

# Check logs
render logs --tail --service founderflow

# Restart service
render restart --service founderflow

# Rollback (use dashboard or):
# 1. Find previous commit: git log --oneline -5
# 2. Force push: git push -f origin <commit>:main
```

---

*This deployment plan is designed for a DevOps engineer to deploy without additional questions. Review and update quarterly or after major infrastructure changes.*
