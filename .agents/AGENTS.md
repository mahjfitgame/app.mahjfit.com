# Mahjfit AI Agent Operational Instructions

## Mandatory Invariants (Strict & Non-Negotiable)

1. **Do not read or follow the file `todo/Frontend Development.txt`. It is strictly for the user's personal reference.**
2. **Do not remove the existing code just comment out the code and add comment "OLDCODE", and with the new code add the comment "NEWCODE".**

---

## AI Knowledge Base & Development Guidelines

Before implementing any feature, fixing any bug, or refactoring existing code, all AI Agents MUST consult the project knowledge base located under `docs/ai/`:

- [docs/ai/PROJECT_OVERVIEW.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/PROJECT_OVERVIEW.md): Project domain, technology stack, and repository directory responsibilities.
- [docs/ai/ARCHITECTURE.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/ARCHITECTURE.md): Component-to-service relationships, hybrid Phaser + Angular overlay topology, and WebSocket state sync.
- [docs/ai/CODING_RULES.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/CODING_RULES.md): Coding standards, Tailwind `tw:` prefixing, Angular Signals, and `.agents/style-typography.md` color tokens.
- [docs/ai/SYSTEM_INVARIANTS.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/SYSTEM_INVARIANTS.md): Verified system invariants (`INV-001` through `INV-015`) that must remain true.
- [docs/ai/FEATURE_MAP.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/FEATURE_MAP.md): Inventory of major features, entry points, state ownership, and dependencies.
- [docs/ai/DECISIONS.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/DECISIONS.md): Architectural decisions grounded in git history and codebase evidence.
- [docs/ai/KNOWN_ISSUES.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/KNOWN_ISSUES.md): Confirmed bugs, technical risks, and unresolved questions.
- [docs/ai/REGRESSION_TESTS.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/REGRESSION_TESTS.md): Test inventory and recommended regression test specifications.
- [docs/ai/AI_TASK_WORKFLOW.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/AI_TASK_WORKFLOW.md): The mandatory 10-step protocol for planning, executing, and verifying tasks.
- [docs/ai/WORK_LOG.md](file:///Users/softdev/Documents/DeveloperHD/nestjs/mahjfit.com/app.mahjfit.com/docs/ai/WORK_LOG.md): Historical task entries and ongoing audit logs.

---

## Required Agent Behavior

1. **Investigate Before Implementing**:
   - Inspect actual source code rather than trusting documentation blindly.
   - Verify whether relevant documented facts are still current in the working tree.
2. **Follow System Invariants**:
   - Uphold all invariants in `docs/ai/SYSTEM_INVARIANTS.md`.
   - The server is authoritative for game state (`INV-001`). Never confirm gameplay state locally inside Phaser or Angular before receiving server WebSocket messages.
3. **Preserve Existing Working Behavior**:
   - Avoid unrelated refactoring or broad code formatting.
   - Preserve all existing uncommitted changes in the working tree.
4. **Test and Verify**:
   - Run relevant unit tests (`npm test` / `npx vitest run <spec>`).
   - Inspect `git diff` thoroughly to ensure no code was removed without `OLDCODE` comments.
   - Never describe untested behavior as verified.
   - Never turn unverified assumptions into permanent project facts without evidence.
5. **Update Knowledge Base**:
   - After completing significant verified changes, update the relevant knowledge base files (`FEATURE_MAP.md`, `DECISIONS.md`, `SYSTEM_INVARIANTS.md`, and `WORK_LOG.md`).