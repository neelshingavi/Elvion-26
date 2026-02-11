# FounderFlow Deployment Guide

**Document Version**: 2.0  
**Last Updated**: February 11, 2026  
**Target Audience**: DevOps Engineers, Developers

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Local Development Setup](#2-local-development-setup)
3. [Database Configuration](#3-database-configuration)
4. [Firebase Setup](#4-firebase-setup)
5. [Environment Variables](#5-environment-variables)
6. [Production Deployment](#6-production-deployment)
7. [Post-Deployment Validation](#7-post-deployment-validation)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### **1.1 Required Software**

- **Node.js**: v18.0.0+ ([Download](https://nodejs.org/))
- **npm**: v9+ (or Yarn/pnpm)
- **Git**: Latest version
- **PostgreSQL**: v15+ with `pgvector` extension (for RAG system)

### **1.2 Required Accounts**

- **Firebase Account**: For Auth, Firestore, and Storage
- **Google AI Studio Account**: For Gemini API access
- **Vercel Account** (Production): For hosting
- **Supabase/Neon Account** (Production): For PostgreSQL hosting

---

## 2. Local Development Setup

### **2.1 Clone Repository**

```bash
# Clone the repository
git clone https://github.com/neelshingavi/Founders-Flow.git
cd Founders-Flow

# Install dependencies
npm install
```

### **2.2 Environment Configuration**

Create a `.env.local` file in the root directory:

```env
# ==========================================
# FIREBASE (Authentication & App Data)
# ==========================================
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-bucket.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:123456789:web:abcdef"

# ==========================================
# GEMINI AI (Agent Intelligence)
# ==========================================
GEMINI_API_KEY="AIzaSy..."

# ==========================================
# POSTGRESQL (RAG Memory System)
# ==========================================
# Option 1: Direct PostgreSQL connection
DATABASE_URL="postgresql://user:password@localhost:5432/founderflow?sslmode=prefer"

# Option 2: Supabase (recommended for production)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# ==========================================
# ADMIN CREDENTIALS (Internal Portal)
# ==========================================
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="secure_password_here"
ADMIN_SESSION_SECRET="long_random_string_min_32_chars"

# ==========================================
# RAG CONFIGURATION (Optional Overrides)
# ==========================================
RAG_MIN_SIMILARITY=0.65
RAG_MIN_CONFIDENCE=0.5
RAG_DEFAULT_LIMIT=8
RAG_CHUNK_SIZE=800
RAG_CHUNK_OVERLAP=80
RAG_VECTOR_WEIGHT=0.7
RAG_KEYWORD_WEIGHT=0.3
RAG_AGE_DECAY_DAYS=90
RAG_ENABLE_COMPRESSION=true
RAG_BATCH_SIZE=5
```

### **2.3 Run Development Server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 3. Database Configuration

### **3.1 PostgreSQL Setup**

#### **Option A: Local PostgreSQL**

```bash
# Install PostgreSQL 15+
# macOS (Homebrew)
brew install postgresql@15

# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb founderflow

# Connect to database
psql founderflow
```

#### **Option B: Supabase (Recommended)**

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Create a new project
3. Wait for database provisioning (~2 minutes)
4. Copy connection string from Settings → Database

### **3.2 Enable pgvector Extension**

```sql
-- Connect to your database and run:
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### **3.3 Create RAG Schema**

Run the following SQL to create the RAG memory system tables:

```sql
-- ==========================================
-- MEMORY CHUNKS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS project_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    content TEXT NOT NULL,
    content_hash VARCHAR(64) NOT NULL,
    embedding vector(768),
    source_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(255) NOT NULL,
    source_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    CONSTRAINT unique_content_per_project UNIQUE (project_id, content_hash)
);

-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
-- HNSW index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_memory_embedding 
    ON project_memory USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Composite index for project-scoped queries
CREATE INDEX IF NOT EXISTS idx_memory_project_active 
    ON project_memory (project_id, is_active, created_at DESC);

-- GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_memory_metadata 
    ON project_memory USING gin (metadata);

-- ==========================================
-- AUDIT LOGS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    project_id TEXT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id VARCHAR(255) NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_project_time 
    ON audit_logs (project_id, timestamp DESC);

-- ==========================================
-- INGESTION JOBS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS ingestion_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    request JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    chunks_created INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status 
    ON ingestion_jobs (status, created_at DESC);

-- ==========================================
-- ROW-LEVEL SECURITY (Optional but Recommended)
-- ==========================================
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY project_isolation ON project_memory
    FOR ALL
    USING (project_id = current_setting('app.current_project_id', true));
```

### **3.4 Verify Database Setup**

```sql
-- Check pgvector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables
\dt

-- Check indexes
\di
```

---

## 4. Firebase Setup

### **4.1 Create Firebase Project**

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., `founderflow-prod`)
4. Disable Google Analytics (optional)
5. Click "Create project"

### **4.2 Enable Authentication**

1. Go to **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Enable **Google** (see Google Auth Setup below)

### **4.3 Google OAuth Setup**

#### **Step 1: Google Cloud Console**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
5. Configure OAuth consent screen if prompted:
   - User Type: **External**
   - App Name: **FounderFlow**
   - User Support Email: Your email
   - Developer Contact: Your email
6. For Application type, select **Web application**
7. Add Authorized JavaScript origins:
   ```
   http://localhost:3000
   https://your-domain.com
   ```
8. Add Authorized redirect URIs:
   ```
   https://your-project.firebaseapp.com/__/auth/handler
   ```
9. Click **Create** and copy the **Client ID** and **Client Secret**

#### **Step 2: Firebase Console**

1. Go back to Firebase Console → **Authentication** → **Sign-in method**
2. Click on **Google** provider
3. Enable it
4. Paste the **Web client ID** and **Web client secret** from Google Cloud Console
5. Click **Save**

### **4.4 Create Firestore Database**

1. Go to **Firestore Database**
2. Click "Create database"
3. Select **Production mode**
4. Choose location: **asia-south1 (Mumbai)** for India users
5. Click "Enable"

### **4.5 Deploy Firestore Security Rules**

Create `firestore.rules` in your project root:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isTeamMember(startupId) {
      return exists(/databases/$(database)/documents/startup_members/$(request.auth.uid + '_' + startupId));
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Startups collection
    match /startups/{startupId} {
      allow read: if isAuthenticated() && isTeamMember(startupId);
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && isTeamMember(startupId);
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated() && isTeamMember(resource.data.startupId);
    }
    
    // Startup memory
    match /startupMemory/{memoryId} {
      allow read, write: if isAuthenticated() && isTeamMember(resource.data.startupId);
    }
    
    // Other collections follow similar patterns
    match /{document=**} {
      allow read, write: if false; // Deny by default
    }
  }
}
```

Deploy rules:

```bash
firebase deploy --only firestore:rules
```

### **4.6 Enable Firebase Storage**

1. Go to **Storage**
2. Click "Get started"
3. Use default security rules for now
4. Choose location: **asia-south1**

---

## 5. Environment Variables

### **5.1 Required Variables**

| Variable | Service | Secret? | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Web | No | Firebase client API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Web | No | Firebase auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Web | No | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Web | No | Firebase storage bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Web | No | FCM sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Web | No | Firebase app ID |
| `GEMINI_API_KEY` | Web | **Yes** | Google Gemini API key |
| `DATABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL` | Web | **Yes** | PostgreSQL connection |
| `ADMIN_USERNAME` | Web | **Yes** | Admin portal username |
| `ADMIN_PASSWORD` | Web | **Yes** | Admin portal password |
| `ADMIN_SESSION_SECRET` | Web | **Yes** | Session signing secret (32+ chars) |

### **5.2 Getting Firebase Credentials**

1. Go to Firebase Console → Project Settings
2. Scroll to "Your apps"
3. Click on your web app or create one
4. Copy all the config values to `.env.local`

### **5.3 Getting Gemini API Key**

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy the key to `.env.local`

---

## 6. Production Deployment

### **6.1 Vercel Deployment**

#### **Step 1: Connect Repository**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your Git repository
4. Select the repository

#### **Step 2: Configure Build Settings**

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Root Directory**: `./`

#### **Step 3: Add Environment Variables**

Add all variables from `.env.local` to Vercel:

1. Go to Project Settings → Environment Variables
2. Add each variable
3. Mark sensitive variables as "Secret"
4. Set environment: Production, Preview, Development

#### **Step 4: Deploy**

1. Click "Deploy"
2. Wait for build to complete (~3-5 minutes)
3. Vercel will provide a production URL

### **6.2 Custom Domain Setup**

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning (~5 minutes)

### **6.3 Environment-Specific Deployments**

| Environment | Branch | Auto-Deploy | URL |
|-------------|--------|-------------|-----|
| **Production** | `main` | ✅ Yes | `founderflow.com` |
| **Staging** | `staging` | ✅ Yes | `staging.founderflow.com` |
| **Preview** | PR branches | ✅ Yes | Auto-generated |

---

## 7. Post-Deployment Validation

### **7.1 Health Check**

```bash
# Check API health
curl https://your-domain.com/api/health

# Expected response:
# {"status":"healthy","timestamp":"2026-02-11T...","version":"..."}
```

### **7.2 Smoke Tests**

| Test | URL | Expected Result |
|------|-----|-----------------|
| Home page | `/` | Renders without error |
| Login page | `/login` | Form loads |
| Auth flow | `/login` → Login | Redirects to dashboard |
| Dashboard | `/founder/dashboard` | Requires auth, loads data |
| API endpoint | `/api/validate-idea` | Returns 401 (unauthorized) |

### **7.3 Database Connectivity**

```bash
# Test Firestore connection
# Should see user data in Firebase Console after signup

# Test PostgreSQL connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM project_memory;"
```

### **7.4 Monitoring Setup**

1. **Vercel Analytics**: Automatically enabled
2. **Firebase Console**: Monitor auth and database usage
3. **Supabase Dashboard**: Monitor PostgreSQL queries
4. **Error Tracking**: Consider adding Sentry (optional)

---

## 8. Troubleshooting

### **8.1 Build Errors**

#### **Error: Module not found**

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

#### **Error: TypeScript compilation failed**

```bash
# Check for type errors
npm run type-check

# Fix errors and rebuild
npm run build
```

### **8.2 Authentication Issues**

#### **Error: auth/invalid-credential**

- **Cause**: User doesn't exist in Firebase Auth
- **Solution**: Sign up first, then login

#### **Error: auth/popup-blocked**

- **Cause**: Browser blocked Google OAuth popup
- **Solution**: Allow popups for your domain

#### **Error: auth/unauthorized-domain**

- **Cause**: Domain not authorized in Firebase
- **Solution**: Add domain to Firebase Console → Authentication → Settings → Authorized domains

### **8.3 Database Issues**

#### **Error: column "embedding" does not exist**

- **Cause**: pgvector extension not enabled
- **Solution**: Run `CREATE EXTENSION vector;`

#### **Error: permission denied for table project_memory**

- **Cause**: Database user lacks permissions
- **Solution**: Grant permissions:
  ```sql
  GRANT ALL ON project_memory TO your_user;
  ```

#### **Error: Firestore permission denied**

- **Cause**: Security rules blocking access
- **Solution**: Check and update `firestore.rules`

### **8.4 RAG System Issues**

#### **No results from RAG queries**

1. Check if embeddings exist:
   ```sql
   SELECT COUNT(*) FROM project_memory WHERE embedding IS NOT NULL;
   ```
2. Lower similarity threshold in `.env.local`:
   ```env
   RAG_MIN_SIMILARITY=0.5
   ```

#### **Slow RAG queries**

1. Verify HNSW index exists:
   ```sql
   \d project_memory
   ```
2. Rebuild index if needed:
   ```sql
   REINDEX INDEX idx_memory_embedding;
   ```

### **8.5 Deployment Issues**

#### **Vercel build timeout**

- **Cause**: Build taking >15 minutes
- **Solution**: Optimize dependencies, remove unused packages

#### **Environment variables not working**

- **Cause**: Variables not set in Vercel dashboard
- **Solution**: Double-check all variables are added

#### **Cold start latency**

- **Cause**: Serverless function cold starts
- **Solution**: Upgrade to Vercel Pro for always-warm functions

---

## Appendix: Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server
npm run lint                   # Run linter
npm run type-check             # Check TypeScript types

# Database
psql $DATABASE_URL             # Connect to PostgreSQL
firebase deploy --only firestore:rules  # Deploy Firestore rules

# Deployment
git push origin main           # Deploy to production (Vercel)
git push origin staging        # Deploy to staging
vercel --prod                  # Manual Vercel deployment

# Debugging
vercel logs                    # View deployment logs
firebase emulators:start       # Run Firebase emulators locally
```

---

## Support

For deployment issues:
1. Check this guide first
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) for system design
3. Open an issue on GitHub
4. Contact the development team

---

**Document Maintained By**: DevOps Team  
**Review Frequency**: After major infrastructure changes
