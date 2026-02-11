# Architecture Simplification: Founder-Only Model

## Rationale
The decision to refactor FounderFlow into a purely founder-only platform was driven by the need to strict focus and simplifying the codebase. By removing the two-sided marketplace complexity (Investors vs. Founders), we can:

1.  **Reduce Code Complexity**: Eliminating role-based access control (RBAC) intricacies for shared resources (like Deals and Chat) significantly reduces bug surface area.
2.  **Focus on Value**: The core value proposition is **agentic startup building**. Investors were a secondary feature that diluted the primary mission of helping founders build better companies.
3.  **Streamline Data Model**: The database schema is now optimized for a single primary entity (the Startup/Founder) rather than managing complex relationships between Portfolios and Startups.

## Key Changes

### Authentication & Onboarding
- **Unified Flow**: No role selection. New signups are immediately provisioned as Founders and guided to Project Creation.
- **Simplified Auth Context**: The `useStartup` hook no longer needs to check for "Investor" view permissions.

### Networking
- **Peer-to-Peer**: Networking is now strictly Founder-to-Founder.
- **Service Change**: `connection-service.ts` now handles symmetric `founderId` connections rather than asymmetric `investorId -> founderId` deals.

### Agents
- **Orchestration**: The `matching` agent which previously looked for investors has been repurposed/replaced with `networking` agents that help founders find co-founders or peers.

## Benefit Analysis
| Metric | Before (Marketplace) | After (Founder Tool) |
|--------|----------------------|---------------------|
| User Roles | ~5 (Founder, Investor, etc.) | 2 (Founder, Admin) |
| Onboarding Steps | 4+ | 2 |
| Core Services | High Coupling | Loosely Coupled |
| Maintenance Load | High | Low |

This architecture sets the stage for a robust, scalable tool that does one thing extremely well: **Building Startups.**
