# Sandyland Status Audit (2026-02-20)

## Current Runtime Status (Unified)
- **Canonical release runtime:** `index.html` → `simple-game.js`
- **Alternate runtime:** `game.js` remains in-repo for development/reference only (non-canonical)
- **Deployment clarity:** backup/test entrypoints moved to `archive/` to avoid production confusion

## Phase A Completed
1. **Runtime path unified**
   - Confirmed and enforced `index.html` loading `simple-game.js`
   - Added explicit canonical runtime note in `index.html` and docs

2. **Docs aligned with runtime decision**
   - Updated `README.md` and `github-deployment-guide.md`
   - Replaced release guidance that implied `game.js` is the main runtime

3. **Backup/test files isolated (non-destructive)**
   - Moved to `archive/`: `index-backup.html`, `simple-index.html`, `minimal-index.html`, `game.html`, `test-game.html`, `test-debug.html`, `simple-game-backup.js`, `test-syntax.js`
   - Added `archive/README.md` to prevent accidental deployment usage

4. **Release smoke checklist added**
   - Added `RELEASE_SMOKE_TEST.md`

## Syntax Checks (Active JS)
- `node --check simple-game.js` ✅
- `node --check game.js` ✅
- `node --check performance-monitor.js` ✅
- `node --check levels/level1-1.js` ✅

## Next Recommended Steps
- Decide whether `game.js` should eventually replace `simple-game.js` or remain a long-term alternate branch.
- Add CI script to run `node --check` automatically on active runtime files.
- Run the smoke checklist against GitHub Pages after each deploy.
