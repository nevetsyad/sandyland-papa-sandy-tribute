# Sandyland Release Verification Checklist

Run after local checks and after each GitHub Pages deploy.

## 0) Pre-Deploy Local Gate
- [ ] Run syntax checks: `node --check simple-game.js game.js performance-monitor.js levels/level1-1.js`
- [ ] Confirm local `index.html` loads without blocking errors.

## 1) Post-Deploy URL + Build Verification
- [ ] Capture deployed URL from the GitHub Actions deploy job output:
  - `https://<username>.github.io/` (or repo Pages URL)
- [ ] Open the deployed URL and hard-refresh once.
- [ ] Confirm runtime is `simple-game.js` (Network tab or page source).

## 2) Console Sanity
- [ ] Open browser DevTools Console on deployed URL.
- [ ] Confirm there are no blocking runtime errors.
- [ ] Ignore harmless browser-extension noise not originating from game files.

## 3) Core Gameplay Smoke
- [ ] Move left/right with arrow keys.
- [ ] Jump with Space (and Up/W alternate if expected).
- [ ] Roll tire with `B`.
- [ ] Confirm at least one collision/interaction behaves correctly.

## 4) Game Loop Integrity
- [ ] Lose/restart path works without freeze.
- [ ] Win/progress path triggers correctly (or reaches current completion state).
- [ ] Refresh page; game reinitializes cleanly.

## 5) Rollback Note (If Verification Fails)
- [ ] Roll back by reverting the offending commit on `main` and re-running Pages deploy.
- [ ] Include in rollback PR/commit message:
  - failing URL + timestamp
  - observed console/runtime failure
  - commit hash being reverted
- [ ] Re-run this checklist against the new deployed URL.
