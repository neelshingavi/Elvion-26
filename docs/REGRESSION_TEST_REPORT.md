# REGRESSION TEST REPORT - FounderFlow
**Date**: 2026-02-11  
**Auditor**: Principal QA Architect  
**Status**: IN PROGRESS

---

## CRITICAL BUGS FOUND

### 🔴 CRITICAL - Auth Flow

#### BUG-001: Orphan User Creation on Signup Failure
**Severity**: CRITICAL  
**Location**: `src/app/login/page.tsx:106-148`  
**Issue**: If Firestore write fails after successful Firebase Auth user creation, orphan auth account is created  
**Impact**: Users can't login (auth exists but no DB record), data inconsistency  
**Status**: ✅ FIXED  
**Fix**: Added rollback logic to delete auth user if DB write fails (line 156-167)

---

### 🔴 CRITICAL - RAG System

#### BUG-002: Deduplication Check Crashes on Empty Result
**Severity**: CRITICAL  
**Location**: `src/lib/rag/database.ts:36-41`  
**Issue**: `.single()` throws error when no matching row exists, breaking entire ingestion pipeline  
**Impact**: RAG indexing fails completely, no memories can be stored  
**Status**: ✅ FIXED  
**Fix**: Changed to `.maybeSingle()` with error handling (line 40-51)

---

### 🟡 MAJOR - Onboarding Flow

#### BUG-003: Onboarding Repeats on Every Login
**Severity**: MAJOR  
**Location**: `src/app/onboarding/page.tsx:166-170`  
**Issue**: Redirect logic checks `isOnboardingCompleted` but allows step='complete' to bypass  
**Impact**: Users might see onboarding again if they refresh during completion  
**Status**: ⚠️ NEEDS VERIFICATION  
**Notes**: Logic appears correct but needs edge case testing

#### BUG-004: Race Condition in Role Initialization
**Severity**: MAJOR  
**Location**: `src/app/onboarding/page.tsx:173-212`  
**Issue**: `setDoc` with `merge: true` runs on every mount, potential race with onboarding completion  
**Impact**: Could overwrite `isOnboardingCompleted` if timing is wrong  
**Status**: 🔍 INVESTIGATING

---

### 🟡 MAJOR - Profile System

#### BUG-005: Concurrent Edit Conflict
**Severity**: MAJOR  
**Location**: `src/components/profile/ProfileEditor.tsx:75-86`  
**Issue**: Real-time listener overwrites local edits during typing  
**Impact**: User edits can be lost if remote update happens while editing  
**Status**: 🔍 INVESTIGATING  
**Notes**: Comment on line 79-81 acknowledges this issue

---

### 🟢 MINOR - UI/UX

#### BUG-006: AuthContext Blocks Render Until Load
**Severity**: MINOR  
**Location**: `src/context/AuthContext.tsx:73`  
**Issue**: `{!loading && children}` causes blank screen during auth check  
**Impact**: Poor UX, no loading indicator shown to user  
**Status**: 🔍 NEEDS IMPROVEMENT  
**Recommendation**: Show loading skeleton instead of blocking

---

## PERFORMANCE ISSUES

### PERF-001: N+1 Query in Deduplication
**Location**: `src/lib/rag/database.ts:32-48`  
**Issue**: Each chunk triggers individual DB query for hash check  
**Impact**: Slow ingestion for large documents (100 chunks = 100 queries)  
**Status**: 🔍 OPTIMIZATION NEEDED  
**Recommendation**: Batch hash lookups into single query

### PERF-002: Serial Embedding Generation
**Location**: `src/lib/rag/ingestion.ts:73-96`  
**Issue**: Batch processing still awaits each batch serially  
**Impact**: Slow ingestion (5 chunks/batch × 2s = 40s for 100 chunks)  
**Status**: ✅ ACCEPTABLE (Rate limit protection)

---

## SECURITY ISSUES

### SEC-001: No Rate Limiting on Auth Routes
**Location**: `src/app/login/page.tsx`  
**Issue**: No protection against brute force attacks  
**Status**: 🔍 NEEDS IMPLEMENTATION

### SEC-002: Unvalidated User Input in RAG
**Location**: `src/lib/rag/ingestion.ts:14-24`  
**Issue**: Sanitization only checks patterns, doesn't validate length/encoding  
**Status**: ⚠️ PARTIAL (Sanitization exists but incomplete)

---

## DATABASE INTEGRITY

### DB-001: Missing Composite Index
**Location**: Firestore `weekly_reviews` collection  
**Issue**: Query on line 65-70 of `weekly-review/page.tsx` needs composite index  
**Status**: ⚠️ WARNING LOGGED  
**Impact**: Query fails gracefully but history doesn't load

### DB-002: No Foreign Key Validation
**Location**: Multiple locations (startupId references)  
**Issue**: No validation that referenced startups exist  
**Status**: 🔍 BY DESIGN (NoSQL pattern)

---

## EDGE CASES

### EDGE-001: Empty RAG Context Handling
**Location**: `src/lib/rag/index.ts:75-77`  
**Issue**: Returns generic message, but what if confidence is exactly 0.5?  
**Status**: ✅ HANDLED (Threshold is `< 0.5`)

### EDGE-002: Concurrent Onboarding Completion
**Location**: `src/app/onboarding/page.tsx:367-458`  
**Issue**: No optimistic locking, double-submit could create duplicate startups  
**Status**: 🔍 NEEDS TESTING

---

## TESTING CHECKLIST

### Authentication
- [x] Fresh signup flow - PASS
- [x] Login flow - PASS  
- [x] Logout flow - NOT TESTED
- [ ] Token expiration - NOT TESTED
- [ ] Multiple device login - NOT TESTED
- [x] Orphan user cleanup - FIXED

### Onboarding
- [ ] First-time flow - NOT TESTED
- [ ] Resume from draft - NOT TESTED
- [ ] Duplicate prevention - NOT TESTED
- [ ] Redirect after completion - NOT TESTED

### Profile
- [ ] View profile - NOT TESTED
- [ ] Edit profile - NOT TESTED
- [ ] Image upload - NOT TESTED
- [ ] Concurrent edits - ISSUE IDENTIFIED

### RAG System
- [x] Document ingestion - FIXED
- [ ] Similarity search - NOT TESTED
- [ ] Empty results - HANDLED
- [ ] Large queries - NOT TESTED
- [x] Deduplication - FIXED

### Weekly Review
- [ ] Create new review - NOT TESTED
- [ ] Save draft - NOT TESTED
- [ ] Complete review - NOT TESTED
- [ ] View history - INDEX MISSING

---

## NEXT ACTIONS

1. ✅ Fix critical RAG deduplication bug
2. ✅ Fix critical auth rollback bug  
3. 🔄 Test onboarding flow end-to-end
4. 🔄 Add composite index for weekly reviews
5. 🔄 Implement rate limiting
6. 🔄 Add optimistic locking to onboarding
7. 🔄 Fix profile concurrent edit issue
8. 🔄 Batch RAG deduplication queries

---

**OVERALL STATUS**: 2 Critical bugs fixed, 4 Major issues identified, Testing 30% complete
