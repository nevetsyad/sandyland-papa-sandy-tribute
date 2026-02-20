const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

function buildContext() {
  const ctx2d = {
    imageSmoothingEnabled: false,
    fillStyle: '#000',
    strokeStyle: '#000',
    font: '12px monospace',
    textAlign: 'left',
    fillRect() {},
    beginPath() {},
    arc() {},
    fill() {},
    strokeRect() {},
    fillText() {}
  };

  const canvas = {
    width: 800,
    height: 600,
    getContext: () => ctx2d
  };

  const document = {
    body: { appendChild() {} },
    getElementById: () => canvas,
    addEventListener() {},
    createElement: () => ({ style: {}, addEventListener() {}, appendChild() {} })
  };

  const sandbox = {
    console,
    document,
    window: {
      addEventListener() {},
      AudioContext: function MockAudioContext() {
        this.currentTime = 0;
        this.destination = {};
        this.createOscillator = () => ({
          type: 'triangle',
          frequency: { setValueAtTime() {} },
          connect() {},
          start() {},
          stop() {}
        });
        this.createGain = () => ({
          gain: { setValueAtTime() {}, linearRampToValueAtTime() {} },
          connect() {}
        });
        this.createBiquadFilter = () => ({
          type: 'lowpass',
          frequency: { setValueAtTime() {} },
          Q: { setValueAtTime() {} },
          connect() {}
        });
      },
      webkitAudioContext: undefined
    },
    requestAnimationFrame() {},
    setTimeout() {},
    clearTimeout() {},
  };
  sandbox.global = sandbox;
  return sandbox;
}

const code = fs.readFileSync('simple-game.js', 'utf8');
const sandbox = buildContext();
vm.createContext(sandbox);
vm.runInContext(`${code}\nthis.SandylandGame = SandylandGame;`, sandbox);

const game = new sandbox.SandylandGame();

assert.equal(game.gameState, 'SPLASH', 'Game should start in splash mode');

game.startGame();
assert.equal(game.gameState, 'PLAYING', 'startGame should enter PLAYING');
assert.equal(game.currentWorld, 1, 'startGame should reset to world 1');

// Force complete world 1, then advance.
game.levelCompleted = true;
game.nextLevel();
assert.equal(game.currentWorld, 2, 'nextLevel should advance to world 2');
assert.equal(game.gameState, 'SPLASH', 'advancing world should show world intro splash');

game.handleStorySkip();
assert.equal(game.gameState, 'PLAYING', 'handleStorySkip should resume from world intro');

// Force complete world 2, then advance to world 3.
game.levelCompleted = true;
game.nextLevel();
assert.equal(game.currentWorld, 3, 'nextLevel should advance to world 3');
game.handleStorySkip();

// Final world should end in WIN instead of looping to world 1.
game.levelCompleted = true;
game.nextLevel();
assert.equal(game.gameState, 'WIN', 'final world completion should end in WIN state');
assert.equal(game.currentWorld, 3, 'WIN should retain final world context');

game.restartGame();
assert.equal(game.gameState, 'PLAYING', 'restartGame should restore playable state');
assert.equal(game.currentWorld, 1, 'restartGame should reset world to 1');
assert.equal(game.papaSandy.health, 3, 'restartGame should reset health');

// Checkpoint respawn sanity: hit once should consume health and respawn.
game.checkpoint = { x: 100, y: game.groundY - game.papaSandy.height, world: game.currentWorld };
game.papaSandy.x = 300;
game.papaSandy.y = game.groundY - game.papaSandy.height;
game.papaSandy.health = 3;
game.papaSandy.invulnerable = false;
game.enemies = [{
  type: 'crab', x: 300, y: game.groundY - 30, width: 28, height: 24,
  velocityX: 0, direction: 1, patrolStart: 250, patrolEnd: 350, alive: true
}];
game.update();
assert.equal(game.papaSandy.health, 2, 'enemy hit should reduce health by one');
assert.equal(game.papaSandy.x, game.checkpoint.x, 'enemy hit should respawn at checkpoint x');
assert.equal(game.papaSandy.y, game.checkpoint.y, 'enemy hit should respawn at checkpoint y');

console.log('Phase C sanity checks passed.');
