# Database Audit & Cleanup Report

## 1. Discovery & Baseline

### Technology Stack
- **Database**: Google Cloud Firestore (NoSQL)
- **SDK**: Firebase JS SDK (Modular) + Firebase Admin

### Collections Identified
| Collection Name | Status | Purpose |
|-----------------|--------|---------|
| `users` | **CORE** | Stores user profiles and auth metadata. |
| `startups` | **CORE** | Stores startup projects, stages, and core info. |
| `startup_members`| **CORE** | Junction table for User-Startup relationships (Ownership/Team). |
| `startupMemory` | **CORE** | Stores AI context, user inputs, and decisions for startups. |
| `tasks` | **CORE** | Task management for startups. |
| `agentRuns` | **CORE** | Logs of AI agent executions/runs. |
| `connections` | **CORE** | Graph of social connections between founders. |
| `connection_requests`| **CORE** | Pending/Accepted/Rejected connection requests. |
| `chat_rooms` | **CORE** | Metadata for chat conversations. |
| `chats/{id}/messages`| **CORE** | Sub-collection for actual chat messages. |
| `dealflow` | **UNUSED** | Redundant (likely legacy Investor logic). |
| `project_connections`| **UNUSED** | Redundant (likely legacy name for connections). |
| `deal_ai_analysis` | **UNUSED** | Redundant (likely legacy Investor logic). |

## 2. Schema Validation

### Critical Findings
- **Unused Indexes**: The current `firestore.indexes.json` contains indexes ONLY for the unused collections (`dealflow`, etc.).
- **Missing Indexes**: Critical queries in `startup-service.ts` and `connection-service.ts` are missing composite indexes, which may cause run-time failures or performance issues.
- **Redundant Data**: `dealflow`, `project_connections`, `deal_ai_analysis` are NOT referenced in the codebase (`src/`).

## 3. Execution Log

### Cleanup Executed
- [x] Removed `dealflow`, `project_connections`, `deal_ai_analysis` from `firestore.indexes.json`.
- [x] Codebase audited: No references found for unused collections.

### Optimization Implemented
The following Composite Indexes have been defined in `firestore.indexes.json`:
1. **startups**: `stage` (ASC) + `createdAt` (DESC)
2. **startupMemory**: `startupId` (ASC) + `timestamp` (DESC)
3. **tasks**: `startupId` (ASC) + `createdAt` (DESC)
4. **agentRuns**: `startupId` (ASC) + `createdAt` (DESC)
5. **connection_requests**: `to` (ASC) + `status` (ASC) + `createdAt` (DESC)

### Code Improvements
- **Startup Service**: Added strict type definitions (`Timestamp`) and input validation for Startup creation.
- **Admin Service**: Implemented Cascade Delete. Deleting a User now correctly deletes their owned Startups to prevent orphaned data.

### Next Steps (Data Reset)
A script has been created at `scripts/wipe-db.ts` to perform the final data wipe as requested.
Run command: `npx tsx scripts/wipe-db.ts` (Requires `FIREBASE_PRIVATE_KEY` in `.env.local`).

