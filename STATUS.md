# Sandyland Status Audit (2026-02-20)

## Canonical Runtime
- **Release entrypoint:** `index.html`
- **Release game runtime:** `simple-game.js`
- **Non-canonical reference runtime:** `game.js` (kept for development/reference only)

## Phase A/B Baseline (already completed)
- Runtime path unified to `index.html` → `simple-game.js`.
- Alternate HTML entrypoints isolated in `archive/`.
- Deployment docs aligned to canonical runtime.

## Phase C Completed (feature completion + progression integrity)

### 1) World progression and win-path tightened (`simple-game.js`)
- Added explicit world cap: `totalWorlds = 3`.
- Fixed progression so World 3 completion ends in **`WIN`** state (no silent loop back to World 1).
- Moved level-advance trigger out of rendering path and into key-driven gameplay flow.
- Added terminal state restart controls: `R`, `Enter`, or `Space` from `GAME_OVER` / `WIN`.

### 2) Coherent gameplay state flow (restart/checkpoint/lose-win)
- `update()` now only simulates gameplay while `gameState === 'PLAYING'`.
  - Prevents enemy/player updates during `PAUSED`, `GAME_OVER`, and `WIN`.
- Removed duplicate game-loop risk by stopping `resumeGame()` from calling `gameLoop()` again.
- Added structured overlays for:
  - `PAUSED`
  - `GAME_OVER`
  - `WIN`
- Added world-start checkpoint model:
  - `checkpoint` set at each world initialization.
  - On non-lethal hit, Papa Sandy respawns at checkpoint with reduced health.
- Added explicit `restartGame()` reset path (world, score, health, level flags, keys).

### 3) Story/world-intro continuity
- Added `handleStorySkip()` so skipping story behaves correctly:
  - Intro splash starts a fresh run.
  - Mid-run world intro splash resumes current run without resetting back to World 1.

### 4) Tire/system consistency fix
- `initializeWorld()` now always calls `initializeTires()` so world tire mechanics are present as intended.

### 5) Minimal non-flaky scripted sanity checks
- Added `scripts/phase-c-sanity.js` (Node VM harness with lightweight DOM/canvas stubs).
- Script verifies key progression/flow invariants:
  - Intro → World 1 start
  - World 1 → World 2 intro
  - World 2 → World 3 intro
  - World 3 completion → `WIN` (no world loop)
  - Restart from terminal state
  - Checkpoint respawn on non-lethal enemy hit

## Validation Run (Phase C)
- `node scripts/phase-c-sanity.js` ✅
- `node --check simple-game.js` ✅
- `node --check game.js` ✅
- `node --check performance-monitor.js` ✅
- `node --check levels/level1-1.js` ✅

## Remaining Phase D Polish Items
1. Add an in-game explicit “Play Again” / “Main Menu” button UI for touch-first flows (currently keyboard restart shortcuts only).
2. Tighten HUD readability (health/stars text overlap at y=90).
3. Optional: unify story pacing/prompts between intro and world transitions.
4. Optional: add CI hook to run `scripts/phase-c-sanity.js` + syntax checks on PRs.
5. Optional: decide long-term fate of `game.js` to reduce maintenance split.
