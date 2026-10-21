# AI Task Workflow: Operating Protocol for AI Agents

Every AI Agent working on this repository MUST strictly adhere to the following 10-step workflow before creating, modifying, fixing, or refactoring code.

---

## 1. Step 1: Read Project Instructions & Knowledge Base
- Review `.agents/AGENTS.md` and `.agents/style-typography.md`.
- Read applicable knowledge documents under `docs/ai/`:
  - `docs/ai/PROJECT_OVERVIEW.md`
  - `docs/ai/ARCHITECTURE.md`
  - `docs/ai/CODING_RULES.md`
  - `docs/ai/SYSTEM_INVARIANTS.md`
  - `docs/ai/FEATURE_MAP.md`
  - `docs/ai/KNOWN_ISSUES.md`
- **MANDATORY**: Never open, read, parse, or follow `todo/Frontend Development.txt`.

---

## 2. Step 2: Investigate the Existing Implementation
- Inspect the actual source files, templates, styles, and configurations relevant to the task using `view_file` or `grep_search`.
- Inspect git status (`git status --short`) to verify uncommitted work in progress. Never overwrite or discard existing working tree changes.
- Never guess file paths, function signatures, signal names, or API contracts. Verify them directly from source code.

---

## 3. Step 3: Trace Affected Dependencies & Invariants
- Trace component-to-component, component-to-service, and service-to-WebSocket connections.
- Check which system invariants in `docs/ai/SYSTEM_INVARIANTS.md` apply to the files being touched (e.g., `INV-001` Server-Authoritative State, `INV-002` Code Preservation, `INV-006` Tile Sorting, `INV-012` Safe-Area Insets).
- Ensure proposed changes do not violate any verified invariants.

---

## 4. Step 4: Establish the Root Cause
- For bug fixes: Identify the precise failure mechanism (e.g., state timing race condition, missing enum mapping, inverted boolean, unhandled safe-area margin).
- For new features: Identify the exact extension seam (e.g., new WebSocket action publisher in `GameState`, new layout element in `PhaserLayoutUi`, or new modal overlay in template).
- Distinguish between verified implementation facts and unverified assumptions.

---

## 5. Step 5: Define Scope & Acceptance Criteria
- Define the minimal set of files that need modification.
- Avoid broad refactoring or reformatting of unrelated code.
- Formulate clear, verifiable acceptance criteria (e.g., "Sort button groups East, South, West, North winds consecutively without scattering").

---

## 6. Step 6: Implement the Smallest Safe Change
- **MANDATORY**: Follow the Code Preservation Rule (`INV-002`). Never delete existing functional code; comment it out with `/* OLDCODE ... OLDCODE */` (or `<!-- OLDCODE ... OLDCODE -->`) and mark new code with `/* NEWCODE */` (or `<!-- NEWCODE -->`).
- Use the project design system palette: Fuchsia `#B92A90`, Blue `#264089`, Lavender `#DAB6D6`, Avocado `#C7C22E`, etc.
- In Tailwind CSS, prefix every utility class with `tw:` (e.g. `tw:flex`, `tw:absolute`).
- Use Angular Signals (`signal`, `computed`, `effect`) and control flow (`@if`, `@for`).

---

## 7. Step 7: Run Appropriate Tests & Checks
- Run type checks and relevant test suites:
  ```bash
  npm test
  # or
  npx vitest run <path-to-spec>
  ```
- If a build validation is needed, run `npm run build.debug` or `npm run build.dev`. Do not run full production builds unless specifically requested.

---

## 8. Step 8: Review the Final Diff
- Run `git diff` on all modified files.
- Verify:
  - No existing code was deleted without `OLDCODE` comments.
  - No temporary debug code or accidental formatting was introduced.
  - Unrelated files remain completely untouched.
  - No secret tokens or credentials were exposed.

---

## 9. Step 9: Update Documentation & Work Log
- If a verified invariant or architectural decision was altered or introduced, update:
  - `docs/ai/SYSTEM_INVARIANTS.md`
  - `docs/ai/DECISIONS.md`
  - `docs/ai/FEATURE_MAP.md`
- Append an entry to `docs/ai/WORK_LOG.md` detailing:
  - Date and task summary
  - Root cause established
  - Files modified
  - Verification results and remaining risks

---

## 10. Step 10: Report Verified Results & Remaining Risks
- Present a concise, evidence-based summary to the user:
  - What was investigated and implemented.
  - Exact file paths modified.
  - Verification tests executed.
  - Remaining risks or unresolved questions.
