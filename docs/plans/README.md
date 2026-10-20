# AudioBulk plans

Every phase or change starts here, before any code changes.

## The rule
1. **Write the plan** in this folder: `YYYY-MM-DD-<short-name>.md`, using the template below.
2. **Build** only what the plan says.
3. **Verify** with the scripts in `tests/verify/` (real files in the repo, not one-off scripts), covering the edge cases listed in the plan.
4. **Record the results** at the bottom of the plan. Mark it Done only when every check passes.

## Template
```
# <Title>
Status: Planned | In progress | Done (commit)

## Goal
What "done" looks like, in plain words.

## Why
The problem or request that started this.

## Steps
1. …
2. …

## Files touched
- …

## Verification
- [ ] Automated: `node tests/verify/<script>.mjs` → expected result
- [ ] Edge cases: long/large/4K input, many results, no sound, phone width (390 px), no sideways scroll
- [ ] `npm run lint`, `npm run build`, `npx playwright test` all pass

## Results
(filled in after verifying)
```

## Plans
| Date | Plan | Status |
|---|---|---|
| 2026-10-18 | Full redesign, phases 0–8 (master plan, summarised in [`2026-10-18-redesign-master.md`](2026-10-18-redesign-master.md)) | Phases 0–6 done; 7–8 left |
| 2026-10-19 | [Fix: many results overflow the file row](2026-10-19-fix-many-results.md) | Done |
| 2026-10-20 | [Rebuild the remaining 52 tools (phases 4–6)](2026-10-20-remaining-52-tools.md) | Done |
| 2026-10-20 | [AI tools that never give generic slop + a faster GIF engine](2026-10-20-ai-quality-and-gif-engine.md) | Done |
| 2026-10-20 | [Competitor research: mid-job test + what users want](2026-10-20-competitor-research.md) | Done |
| 2026-10-20 | [Roadmap checklist (A1 → D2)](2026-10-20-roadmap-checklist.md) | Approved |
| 2026-10-21 | [A1: Jobs keep running when you switch tools](2026-10-21-A1-jobs-keep-running.md) | Done |
