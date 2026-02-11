# FounderFlow Security Documentation

**Document Version**: 1.0  
**Last Updated**: February 11, 2026  
**Classification**: Internal

---

## Table of Contents

1. [Security Overview](#1-security-overview)
2. [Authentication Security](#2-authentication-security)
3. [Authorization Model](#3-authorization-model)
4. [Data Security](#4-data-security)
5. [AI Security](#5-ai-security)
6. [Network Security](#6-network-security)
7. [Known Limitations](#7-known-limitations)
8. [Security Checklist](#8-security-checklist)

---

## 1. Security Overview

### **1.1 Security Principles**

FounderFlow follows these core security principles:

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Users have minimum necessary permissions
3. **Secure by Default**: Security enabled out of the box
4. **Data Isolation**: Strict multi-tenancy enforcement
5. **Audit Everything**: Comprehensive logging of sensitive operations

### **1.2 Threat Model**

| Threat | Mitigation |
|--------|------------|
| **Unauthorized Access** | Firebase Auth + Firestore Rules + RLS |
| **Data Leakage** | Hard project_id filters, RLS policies |
| **Prompt Injection** | Input sanitization, output validation |
| **XSS Attacks** | React auto-escaping, CSP headers |
| **SQL Injection** | Parameterized queries, ORM usage |
| **CSRF** | SameSite cookies, CSRF tokens |
| **DDoS** | Rate limiting, Vercel protection |

---

## 2. Authentication Security

### **2.1 Firebase Authentication**

**Provider**: Firebase Auth  
**Methods**: Google OAuth, Email/Password

#### **Security Features**

- **Password Requirements**:
  - Minimum 6 characters (Firebase default)
  - Recommend: 12+ characters with complexity
- **Account Lockout**: Automatic after multiple failed attempts
- **Session Management**: JWT tokens with 1-hour expiry
- **Token Refresh**: Automatic refresh before expiry

#### **OAuth Security**

```typescript
// Google OAuth configuration
const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account' // Force account selection
});
```

### **2.2 Admin Authentication**

**Method**: Cookie-based session authentication

#### **Implementation**

```typescript
// Admin login creates signed cookie
const session = sign(
  { username, timestamp: Date.now() },
  process.env.ADMIN_SESSION_SECRET
);

// Cookie configuration
res.setHeader('Set-Cookie', serialize('founderflow_admin_session', session, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 // 24 hours
  path: '/admin'
}));
```

#### **Security Considerations**

- **Secrets**: Admin credentials stored in environment variables
- **Session Secret**: Minimum 32 characters, cryptographically random
- **Cookie Flags**: `httpOnly`, `secure`, `sameSite=strict`
- **Path Restriction**: Cookies only sent to `/admin/*` routes

### **2.3 Session Security**

| Feature | Implementation |
|---------|----------------|
| **Token Storage** | Firebase SDK (memory + localStorage) |
| **Token Expiry** | 1 hour (Firebase default) |
| **Refresh Mechanism** | Automatic via Firebase SDK |
| **Logout** | `signOut()` + clear local storage |

---

## 3. Authorization Model

### **3.1 Role-Based Access Control (RBAC)**

| Role | Permissions | Routes |
|------|-------------|--------|
| **Founder** | Manage own startups, tasks, profile | `/founder/*` |
| **Investor** | View startups, manage deals (future) | `/investor/*` |
| **Admin** | Platform management, user oversight | `/admin/*` |

### **3.2 Firestore Security Rules**

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
    
    function isOwnerOrCofounder(startupId) {
      let membership = get(/databases/$(database)/documents/startup_members/$(request.auth.uid + '_' + startupId));
      return membership.data.role in ['owner', 'cofounder'];
    }
    
    // Users: Can only read/write own data
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow write: if isOwner(userId);
    }
    
    // Startups: Team members can read, owners can write
    match /startups/{startupId} {
      allow read: if isAuthenticated() && isTeamMember(startupId);
      allow create: if isAuthenticated();
      allow update, delete: if isAuthenticated() && isOwnerOrCofounder(startupId);
    }
    
    // Tasks: Team members can read/write
    match /tasks/{taskId} {
      allow read, write: if isAuthenticated() && isTeamMember(resource.data.startupId);
    }
    
    // Startup Memory: Team members can read, owners can write
    match /startupMemory/{memoryId} {
      allow read: if isAuthenticated() && isTeamMember(resource.data.startupId);
      allow write: if isAuthenticated() && isOwnerOrCofounder(resource.data.startupId);
    }
    
    // Deny all by default
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### **3.3 PostgreSQL Row-Level Security (RLS)**

```sql
-- Enable RLS on project_memory table
ALTER TABLE project_memory ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own project data
CREATE POLICY project_isolation ON project_memory
    FOR ALL
    USING (project_id = current_setting('app.current_project_id', true));

-- Set project_id for each session
SET app.current_project_id = 'user_project_id';
```

### **3.4 API Route Authorization**

```typescript
// Example: Validate startup ownership before processing
export async function POST(request: NextRequest) {
  const user = auth.currentUser;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { startupId } = await request.json();
  
  // Verify user is a team member
  const membership = await getDoc(
    doc(db, "startup_members", `${user.uid}_${startupId}`)
  );
  
  if (!membership.exists()) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Proceed with authorized operation
  // ...
}
```

---

## 4. Data Security

### **4.1 Data Encryption**

| Layer | Encryption |
|-------|------------|
| **In Transit** | TLS 1.2+ (HTTPS enforced) |
| **At Rest** | Firebase/PostgreSQL default encryption |
| **Backups** | Encrypted by cloud provider |

### **4.2 Data Isolation**

#### **Firestore Isolation**

- **Hard Filters**: All queries include `where("startupId", "==", userStartupId)`
- **Security Rules**: Enforce project-level access control
- **No Cross-Project Queries**: Users cannot query other projects' data

#### **PostgreSQL Isolation**

- **Row-Level Security**: Enforces `project_id` filter at database level
- **Connection Pooling**: Separate connections per project (future)
- **Audit Logging**: All queries logged with project_id

### **4.3 Sensitive Data Handling**

| Data Type | Storage | Access Control |
|-----------|---------|----------------|
| **Passwords** | Firebase Auth (hashed) | Never stored in Firestore |
| **API Keys** | Environment variables | Server-side only |
| **Session Tokens** | HTTP-only cookies | Not accessible via JavaScript |
| **User PII** | Firestore (encrypted at rest) | Firestore Rules |
| **Embeddings** | PostgreSQL (encrypted at rest) | RLS policies |

### **4.4 Data Retention**

- **User Data**: Retained until account deletion
- **Audit Logs**: 90 days retention
- **Deleted Data**: Soft delete with 30-day recovery window
- **Backups**: 7-day point-in-time recovery (Firestore)

---

## 5. AI Security

### **5.1 Prompt Injection Protection**

#### **Input Sanitization**

```typescript
// Sanitize user input before sending to LLM
function sanitizeInput(input: string): string {
  // Remove common injection patterns
  const patterns = [
    /ignore\s+previous\s+instructions/gi,
    /disregard\s+all\s+prior/gi,
    /you\s+are\s+now\s+in\s+developer\s+mode/gi,
    /DAN\s+mode/gi,
    /jailbreak/gi
  ];
  
  let sanitized = input;
  patterns.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  });
  
  return sanitized;
}
```

#### **Output Validation**

```typescript
// Validate LLM output before storing
function validateOutput(output: string): boolean {
  // Check for suspicious patterns
  if (output.includes('<script>')) return false;
  if (output.includes('eval(')) return false;
  
  // Validate JSON structure if expected
  try {
    JSON.parse(output);
    return true;
  } catch {
    return false;
  }
}
```

### **5.2 Rate Limiting**

#### **Token Bucket Implementation**

```typescript
// Rate limit: 60 requests per minute per user
const RATE_LIMIT = {
  maxRequests: 60,
  windowMs: 60 * 1000
};

const userRequests = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const requests = userRequests.get(userId) || [];
  
  // Remove old requests outside window
  const validRequests = requests.filter(
    timestamp => now - timestamp < RATE_LIMIT.windowMs
  );
  
  if (validRequests.length >= RATE_LIMIT.maxRequests) {
    return false; // Rate limit exceeded
  }
  
  validRequests.push(now);
  userRequests.set(userId, validRequests);
  return true;
}
```

### **5.3 Context Isolation**

- **Project Scoping**: RAG queries filtered by `project_id`
- **No Cross-Project Context**: Memories from other projects never retrieved
- **Confidence Gating**: Low-confidence retrievals rejected (<0.5)

### **5.4 AI Audit Logging**

```typescript
// Log all AI agent runs
await addDoc(collection(db, "agentRuns"), {
  agentType: "validator",
  userId: user.uid,
  startupId: startupId,
  input: sanitizedInput,
  output: validatedOutput,
  timestamp: serverTimestamp(),
  model: "gemini-2.0-flash",
  tokensUsed: 1234
});
```

---

## 6. Network Security

### **6.1 HTTPS Enforcement**

- **Vercel**: Automatic HTTPS with Let's Encrypt
- **Redirects**: All HTTP traffic redirected to HTTPS
- **HSTS**: Strict-Transport-Security header enabled

### **6.2 CORS Configuration**

```typescript
// API routes use same-origin by default
// Firebase SDK handles cross-origin for Firestore/Auth

// If custom CORS needed:
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGINS || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
```

### **6.3 Content Security Policy (CSP)**

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.gstatic.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' data:;
      connect-src 'self' https://*.googleapis.com https://*.firebaseio.com;
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

### **6.4 DDoS Protection**

- **Vercel**: Built-in DDoS protection
- **Rate Limiting**: API-level rate limiting (see AI Security)
- **Firebase**: Automatic scaling and protection

---

## 7. Known Limitations

### **7.1 Security Gaps**

| Issue | Severity | Status | Mitigation |
|-------|----------|--------|------------|
| **No rate limiting on auth routes** | Medium | Documented | Firebase has built-in protection |
| **Admin auth uses simple credentials** | Medium | Documented | Move to Firebase custom claims (future) |
| **No 2FA support** | Low | Planned | Firebase supports 2FA (future) |
| **No IP whitelisting** | Low | Not planned | Not critical for current use case |

### **7.2 Compliance Status**

| Regulation | Status | Notes |
|------------|--------|-------|
| **GDPR** | Partial | Data export available, deletion supported |
| **CCPA** | Partial | Same as GDPR |
| **SOC 2** | Not certified | Firebase/Vercel are certified |
| **HIPAA** | Not applicable | No health data |

---

## 8. Security Checklist

### **8.1 Pre-Deployment**

- [ ] All secrets in environment variables (not hardcoded)
- [ ] Firestore security rules deployed
- [ ] PostgreSQL RLS policies enabled
- [ ] HTTPS enforced in production
- [ ] Admin credentials are strong and unique
- [ ] Rate limiting configured
- [ ] CSP headers configured
- [ ] CORS properly restricted

### **8.2 Post-Deployment**

- [ ] Verify auth flow works correctly
- [ ] Test unauthorized access (should be blocked)
- [ ] Check Firestore rules in Firebase Console
- [ ] Verify PostgreSQL RLS is active
- [ ] Monitor for suspicious activity
- [ ] Review audit logs regularly

### **8.3 Ongoing Maintenance**

- [ ] Rotate API keys quarterly
- [ ] Review and update security rules monthly
- [ ] Monitor Firebase/Vercel security advisories
- [ ] Update dependencies for security patches
- [ ] Conduct security audits annually

---

## Incident Response

### **Procedure**

1. **Detect**: Monitor logs, user reports, automated alerts
2. **Assess**: Determine severity and scope
3. **Contain**: Disable affected features, revoke compromised credentials
4. **Eradicate**: Fix vulnerability, deploy patch
5. **Recover**: Restore normal operations
6. **Document**: Post-mortem report, update security docs

### **Contact**

For security issues:
- **Email**: security@founderflow.com
- **PGP Key**: [Link to public key]
- **Response Time**: 24 hours for critical issues

---

**Document Maintained By**: Security Team  
**Review Frequency**: Quarterly or after security incidents
