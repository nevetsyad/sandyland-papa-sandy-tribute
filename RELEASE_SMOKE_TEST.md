# Sandyland Release Smoke Test (Concise)

Run after local build and after GitHub Pages deploy.

## Runtime/Load
- [ ] Open `index.html` (or deployed URL) and confirm no load error screen.
- [ ] Confirm console has no blocking errors.
- [ ] Confirm runtime is `simple-game.js` (Network tab or page source).

## Core Gameplay
- [ ] Move left/right with arrow keys.
- [ ] Jump with Space (and Up/W alternate if expected).
- [ ] Roll tire with `B`.
- [ ] Confirm at least one collision/interaction behaves correctly.

## Game Loop Integrity
- [ ] Lose/restart path works without freeze.
- [ ] Win/progress path triggers correctly (or reaches current completion state).
- [ ] Refresh page; game reinitializes cleanly.

## Release Sanity
- [ ] Verify repository root does not rely on files in `archive/` for runtime.
- [ ] Re-run syntax checks: `node --check simple-game.js game.js performance-monitor.js levels/level1-1.js`
