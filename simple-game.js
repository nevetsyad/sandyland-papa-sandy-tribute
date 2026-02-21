class SandylandGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Game state management
        this.keys = {};
        this.gravity = 0.8;
        this.friction = 0.8;
        this.groundY = 500;
        
        // Game states
        this.gameState = 'SPLASH'; // SPLASH, PLAYING, PAUSED, GAME_OVER, WIN
        this.menuState = 'CLOSED'; // CLOSED, PAUSED, MAIN
        this.reducedEffects = false;
        
        // Background music system
        this.audioContext = null;
        this.backgroundMusic = null;
        this.musicVolume = 0.1; // Soft background volume
        this.musicMuted = false;
        this.currentMusicTrack = 0;
        
        // Story system
        this.storyMode = 'INTRO'; // INTRO, LEGEND, WORLD_1, WORLD_2, WORLD_3, VICTORY
        this.storyText = '';
        this.storyTimer = 0;
        this.storySpeed = 0.62;
        this.storyScrollY = 0;
        this.storyMaxScroll = 0;
        this.storyAutoScroll = true;
        this.splashSkipLocked = false;
        
        // Story content as scrolling text
        this.stories = {
            INTRO: `PAPA SANDY VS. DR.VETTE

Papa Sandy finally retired in peace...
until his ex-wife, Dr.vette, stole his white Corvette
and hid it behind her minions and traps.

Your mission:
Rescue the Corvette and find your missing gold bullion
by clearing all 3 worlds and defeating Dr.vette.

How to win each world:
🪙 Collect 2 gold bullions to unlock the next area
🛞 Use tires: E to push or throw (auto-picks best)
🐴 Use E for action: throw tire, mount/dismount horse, and nearby interact
🦀 Enemies (crab/minion/coconut): avoid, stomp, or hit with tires

Goal:
Reach World 3, beat Dr.vette, and drive the Corvette home.

Press SPACE to continue!`,

            LEGEND: `SPRITE KEY

Papa Sandy: You
🪙 Gold bullion: collect 2 to clear worlds
🛞 Tire: E to push or throw (auto-picks best)
🐴 Horse/Gates: E to mount/dismount/interact (World 2)
Crab/Minion/Coconut: avoid or defeat
Power-ups: bullions boost score
White Corvette + Dr.vette: final boss cue

Controls:
Move: Arrow keys / A,D
Jump/Stomp: Space / W / Up
Action/Interact: E

Press SPACE / ENTER / TAP to start!`,

            WORLD_1: `Papa Sandy arrives at the sunny beaches where
he once sold tires to tourists.

The crabs here are angry about beach pollution,
and Dr.vette's minions guard the shoreline.

Roll tires over the crabs to clear your path!
Collect 2 stars to unlock the next area.

Press SPACE to continue!`,

            WORLD_2: `The journey takes Papa Sandy to the wild west,
where tumbleweeds roll across the desert.

Dr.vette's coconut bombs drop from above,
and her loyal minions patrol the dusty plains.

Use your tire-rolling skills strategically!
Mount your horse with E and ride through the horse gate.

Press SPACE to continue!`,

            WORLD_3: `Deep in the jungle awaits Dr.vette's fortress!
Monkey minions swing from the trees above.

This is the final challenge before facing
Dr.vette herself and rescuing the Corvette.

Use all your skills wisely!
The fate of the Corvette hangs in the balance.

Press SPACE for the final showdown!`,

            VICTORY: `VICTORY!

Papa Sandy has rescued his Corvette!
Dr.vette has been defeated and driven away.

The beaches are safe once again,
and Papa Sandy can enjoy his retirement in peace.

Thanks for playing Sandyland!
A tribute to Papa Sandy's legacy.`
        };
        
        // Score tracking
        this.score = 0;
        
        // World management
        this.currentWorld = 1; // 1: Beach Paradise, 2: Cowboy Country, 3: Tropical Jungle
        this.totalWorlds = 3;
        this.worldNames = {
            1: "Beach Paradise",
            2: "Cowboy Country", 
            3: "Tropical Jungle"
        };
        this.worldColors = {
            1: { sky: '#87CEEB', ground: '#8B4513', grass: '#228B22' },
            2: { sky: '#FFE4B5', ground: '#D2691E', grass: '#32CD32' },
            3: { sky: '#98FB98', ground: '#8B4513', grass: '#228B22' }
        };
        
        // Papa Sandy character
        this.papaSandy = {
            x: 100,
            y: this.groundY,
            width: 32,
            height: 48,
            velocityX: 0,
            velocityY: 0,
            speed: 4,
            jumpPower: 15,
            mountedSpeedMultiplier: 1.6,
            mountedJumpMultiplier: 1.25,
            onGround: true,
            direction: 1,
            health: 3,
            invulnerable: false,
            invulnerableTimer: 0,
            animationTimer: 0,
            animationState: 'idle'
        };
        
        // World-specific enemies and objects
        this.enemies = [];
        this.powerUps = [];
        this.tires = [];
        this.horses = [];
        this.worldGates = [];
        this.backgroundElements = [];

        this.mountRideHeight = 14;
        this.mountedHorseId = null;
        
        this.initializeWorld(this.currentWorld);
        
        // Level completion flag
        this.levelCompleted = false;
        this.levelCompletionThreshold = 2; // Need to collect 2 stars
        this.checkpoint = { x: 100, y: this.groundY - this.papaSandy.height, world: 1 };

        // Finale boss phase
        this.bossBattle = null;
        this.bossObjectiveText = 'BOSS: Defeat Dr.vette! STOMP or hit with pushed/thrown tires.';
        this.winCelebrationStart = 0;
        
        this.setupEventListeners();
        this.initializeAudio();
        this.gameLoop();
    }
    
    // Background Music System
    initializeAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initializeBackgroundMusic();
        } catch (error) {
            console.warn('Audio context initialization failed:', error);
        }
    }
    
    initializeBackgroundMusic() {
        if (!this.audioContext || this.musicMuted) return;

        if (this.gameState === 'SPLASH') {
            this.createIntroMusicLoop();
        } else if (this.gameState === 'PLAYING') {
            this.createCountryMusicLoop();
        }
    }
    
    playMelodyLoop(notes, durations, options = {}) {
        if (!this.audioContext || this.musicMuted) return;

        const {
            type = 'triangle',
            volumeScale = 1,
            lowpass = 1000,
            q = 10,
            shouldContinue = () => true,
            loopMs = 4000
        } = options;

        let currentTime = this.audioContext.currentTime;

        notes.forEach((note, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.type = type;
            oscillator.frequency.setValueAtTime(note, currentTime);

            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.3 * volumeScale, currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.2 * volumeScale, currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[index]);

            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(lowpass, currentTime);
            filter.Q.setValueAtTime(q, currentTime);

            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start(currentTime);
            oscillator.stop(currentTime + durations[index]);

            currentTime += durations[index];
        });

        setTimeout(() => {
            if (!this.musicMuted && shouldContinue()) {
                this.playMelodyLoop(notes, durations, options);
            }
        }, loopMs);
    }

    createCountryMusicLoop() {
        // Main gameplay music
        const notes = [196, 196, 220, 196, 262, 220]; // G3, G3, A3, G3, C4, A3
        const durations = [0.4, 0.4, 0.8, 0.4, 0.8, 0.8];

        this.playMelodyLoop(notes, durations, {
            type: 'triangle',
            volumeScale: 1,
            lowpass: 1000,
            q: 10,
            shouldContinue: () => this.gameState === 'PLAYING',
            loopMs: 4000
        });
    }

    createIntroMusicLoop() {
        // Softer intro/story music while scrolling text is up
        const notes = [262, 294, 330, 294, 262, 220]; // C4, D4, E4, D4, C4, A3
        const durations = [0.6, 0.5, 0.8, 0.5, 0.8, 1.0];

        this.playMelodyLoop(notes, durations, {
            type: 'sine',
            volumeScale: 0.7,
            lowpass: 850,
            q: 8,
            shouldContinue: () => this.gameState === 'SPLASH',
            loopMs: 4200
        });
    }
    
    toggleMute() {
        this.musicMuted = !this.musicMuted;
        if (!this.musicMuted && this.gameState === 'PLAYING') {
            this.createCountryMusicLoop();
        }
        return this.musicMuted;
    }

    cycleMusicMode() {
        if (this.musicMuted) {
            this.musicMuted = false;
            this.setMusicVolume(0.1);
        } else if (this.musicVolume > 0.075) {
            this.setMusicVolume(0.04); // low
        } else {
            this.musicMuted = true;
        }

        if (!this.musicMuted && this.gameState === 'PLAYING') {
            this.createCountryMusicLoop();
        }

        return this.getMusicLabel();
    }

    getMusicLabel() {
        if (this.musicMuted) return 'MUSIC: OFF';
        return this.musicVolume > 0.075 ? 'MUSIC: ON' : 'MUSIC: LOW';
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        // Volume changes will take effect on next music loop
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic = null;
        }
    }
    
    playBackgroundMusic() {
        if (!this.musicMuted && this.gameState === 'PLAYING') {
            this.createCountryMusicLoop();
        }
    }
    
    initializeWorld(worldNumber) {
        this.enemies = [];
        this.powerUps = [];
        this.backgroundElements = [];
        this.horses = [];
        this.worldGates = [];
        this.mountedHorseId = null;
        
        switch(worldNumber) {
            case 1: // Beach Paradise
                this.enemies = [
                    {
                        type: 'crab',
                        x: 150,
                        y: this.groundY - 30,
                        width: 28,
                        height: 24,
                        velocityX: 1,
                        direction: 1,
                        patrolStart: 100,
                        patrolEnd: 250,
                        alive: true,
                        color: '#FF6347'
                    },
                    {
                        type: 'crab',
                        x: 400,
                        y: this.groundY - 30,
                        width: 28,
                        height: 24,
                        velocityX: 1,
                        direction: -1,
                        patrolStart: 350,
                        patrolEnd: 500,
                        alive: true,
                        color: '#FF6347'
                    }
                ];
                
                this.powerUps = [
                    {
                        type: 'bullion',
                        x: 300,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'bullion',
                        x: 500,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    }
                ];
                
                this.backgroundElements = [
                    { x: 50, y: 300, scale: 0.8, type: 'palm' },
                    { x: 700, y: 280, scale: 1.0, type: 'palm' }
                ];
                break;
                
            case 2: // Cowboy Country
                this.enemies = [
                    {
                        type: 'coconut',
                        x: 200,
                        y: this.groundY - 50,
                        width: 24,
                        height: 24,
                        velocityX: 0,
                        direction: 1,
                        patrolStart: 150,
                        patrolEnd: 350,
                        alive: true,
                        color: '#8B4513',
                        falling: false,
                        fallTimer: 0
                    },
                    {
                        type: 'minion',
                        x: 450,
                        y: this.groundY - 30,
                        width: 32,
                        height: 32,
                        velocityX: 1.5,
                        direction: 1,
                        patrolStart: 400,
                        patrolEnd: 600,
                        alive: true,
                        color: '#4B0082'
                    }
                ];
                
                this.powerUps = [
                    {
                        type: 'bullion',
                        x: 250,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'bullion',
                        x: 550,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    }
                ];
                
                this.backgroundElements = [
                    { x: 80, y: 320, scale: 0.6, type: 'cactus' },
                    { x: 650, y: 310, scale: 0.8, type: 'cactus' },
                    { x: 350, y: 300, scale: 1.2, type: 'cactus' }
                ];

                this.horses = [
                    {
                        id: 'cowboy-horse-1',
                        x: 120,
                        y: this.groundY - 30,
                        width: 56,
                        height: 30,
                        color: '#8B5A2B',
                        facing: 1,
                        mounted: false
                    }
                ];

                this.worldGates = [
                    {
                        id: 'world2-horse-gate',
                        x: 390,
                        y: this.groundY - 220,
                        width: 28,
                        height: 220,
                        requiresHorse: true,
                        opened: false,
                        color: '#6D4C41'
                    }
                ];
                break;
                
            case 3: // Tropical Jungle
                this.enemies = [
                    {
                        type: 'crab',
                        x: 180,
                        y: this.groundY - 30,
                        width: 28,
                        height: 24,
                        velocityX: 1.2,
                        direction: 1,
                        patrolStart: 100,
                        patrolEnd: 300,
                        alive: true,
                        color: '#FF4500'
                    },
                    {
                        type: 'minion',
                        x: 380,
                        y: this.groundY - 30,
                        width: 32,
                        height: 32,
                        velocityX: 1.8,
                        direction: -1,
                        patrolStart: 300,
                        patrolEnd: 500,
                        alive: true,
                        color: '#228B22'
                    },
                    {
                        type: 'coconut',
                        x: 550,
                        y: this.groundY - 60,
                        width: 24,
                        height: 24,
                        velocityX: 0,
                        direction: 1,
                        patrolStart: 500,
                        patrolEnd: 650,
                        alive: true,
                        color: '#8B4513',
                        falling: false,
                        fallTimer: 0
                    }
                ];
                
                this.powerUps = [
                    {
                        type: 'bullion',
                        x: 300,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'bullion',
                        x: 500,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    }
                ];
                
                this.backgroundElements = [
                    { x: 40, y: 290, scale: 1.0, type: 'jungle' },
                    { x: 600, y: 285, scale: 1.1, type: 'jungle' },
                    { x: 320, y: 295, scale: 0.9, type: 'jungle' }
                ];
                break;
        }

        this.initializeTires();
        this.checkpoint = { x: 100, y: this.groundY - this.papaSandy.height, world: this.currentWorld };
    }
    
    setupEventListeners() {
        // Keyboard controls for desktop
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Skip story mode with any key
            if (this.gameState === 'SPLASH') {
                this.handleStorySkip();
                return;
            }

            // Restart flow from terminal states
            if (this.gameState === 'GAME_OVER' || this.gameState === 'WIN') {
                if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyR') {
                    this.restartGame();
                }
                return;
            }

            // Advance flow after level completion
            if (this.gameState === 'PLAYING' && this.levelCompleted && (e.code === 'Space' || e.code === 'Enter')) {
                this.nextLevel();
                return;
            }
            
            // Handle jumping
            if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && this.papaSandy.onGround && this.gameState === 'PLAYING') {
                this.papaSandy.velocityY = -this.getCurrentJumpPower();
                this.papaSandy.onGround = false;
            }
            
            // Handle menu toggle
            if (e.code === 'Escape' && (this.gameState === 'PLAYING' || this.gameState === 'PAUSED')) {
                this.toggleMenu();
            }

            // Low-clutter accessibility toggle
            if (e.code === 'KeyV') {
                this.toggleReducedEffects();
            }

            // Sound controls
            if (e.code === 'KeyM') {
                this.toggleMute();
            }
            if (e.code === 'BracketLeft') {
                this.setMusicVolume(this.musicVolume - 0.02);
                this.musicMuted = false;
            }
            if (e.code === 'BracketRight') {
                this.setMusicVolume(this.musicVolume + 0.02);
                this.musicMuted = false;
            }
            
            // Universal action / interaction
            if (e.code === 'KeyE' && this.gameState === 'PLAYING') {
                this.handleActionPress();
            }

            // Keep legacy controls functional
            if (e.code === 'KeyE' && this.gameState === 'PLAYING') {
                this.handleUniversalAction();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Touch controls for mobile
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        // Skip story on any tap
        document.addEventListener('touchstart', (e) => {
            if (this.gameState === 'SPLASH') {
                e.preventDefault();
                this.handleStorySkip();
            }
        });
        
        // Create control buttons for mobile
        if ('ontouchstart' in window) {
            this.createMobileControls();
        }
    }
    
    createMobileControls() {
        const createButton = (label, bg = '#2c3e50', minWidth = '64px') => {
            const btn = document.createElement('button');
            btn.textContent = label;
            btn.style.minWidth = minWidth;
            btn.style.height = '56px';
            btn.style.padding = '0 14px';
            btn.style.fontSize = '20px';
            btn.style.fontWeight = 'bold';
            btn.style.border = '2px solid rgba(255,255,255,0.85)';
            btn.style.borderRadius = '12px';
            btn.style.background = bg;
            btn.style.color = 'white';
            btn.style.cursor = 'pointer';
            btn.style.touchAction = 'manipulation';
            btn.style.opacity = '0.95';
            return btn;
        };

        const controlPanel = document.createElement('div');
        controlPanel.style.position = 'fixed';
        controlPanel.style.bottom = '18px';
        controlPanel.style.left = '50%';
        controlPanel.style.transform = 'translateX(-50%)';
        controlPanel.style.display = 'flex';
        controlPanel.style.gap = '8px';
        controlPanel.style.zIndex = '1000';

        const actionPanel = document.createElement('div');
        actionPanel.style.position = 'fixed';
        actionPanel.style.top = '14px';
        actionPanel.style.right = '14px';
        actionPanel.style.display = 'flex';
        actionPanel.style.flexDirection = 'column';
        actionPanel.style.gap = '8px';
        actionPanel.style.zIndex = '1001';

        const leftBtn = createButton('←', '#388e3c');
        const jumpBtn = createButton('↑', '#1976d2');
        const throwBtn = createButton('E', '#ef6c00');
        const rightBtn = createButton('→', '#388e3c');

        const menuBtn = createButton('MENU', '#6a1b9a', '78px');
        const resumeBtn = createButton('RESUME', '#00796b', '92px');
        const restartBtn = createButton('PLAY AGAIN', '#1565c0', '118px');
        const mainMenuBtn = createButton('MAIN MENU', '#424242', '118px');
        const fxBtn = createButton('FX: ON', '#455a64', '92px');
        const musicBtn = createButton(this.getMusicLabel(), '#00695c', '118px');

        const setKey = (code, value) => {
            this.keys[code] = value;
        };

        const bindHold = (btn, code) => {
            btn.addEventListener('touchstart', (e) => { e.preventDefault(); setKey(code, true); });
            btn.addEventListener('touchend', (e) => { e.preventDefault(); setKey(code, false); });
            btn.addEventListener('touchcancel', (e) => { e.preventDefault(); setKey(code, false); });
            btn.addEventListener('mousedown', () => setKey(code, true));
            btn.addEventListener('mouseup', () => setKey(code, false));
            btn.addEventListener('mouseleave', () => setKey(code, false));
        };

        bindHold(leftBtn, 'ArrowLeft');
        bindHold(rightBtn, 'ArrowRight');

        const jumpAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PLAYING' && this.papaSandy.onGround) {
                this.papaSandy.velocityY = -this.getCurrentJumpPower();
                this.papaSandy.onGround = false;
            }
        };
        jumpBtn.addEventListener('touchstart', jumpAction);
        jumpBtn.addEventListener('mousedown', jumpAction);

        const tireAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PLAYING') this.pushNearestTire();
        };
        const throwAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PLAYING') this.handleUniversalAction();
        };
        throwBtn.addEventListener('touchstart', throwAction);
        throwBtn.addEventListener('mousedown', throwAction);

        const activateMenu = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PLAYING' || this.gameState === 'PAUSED') this.toggleMenu();
        };
        menuBtn.addEventListener('touchstart', activateMenu);
        menuBtn.addEventListener('mousedown', activateMenu);

        const resumeAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PAUSED') this.toggleMenu();
        };
        resumeBtn.addEventListener('touchstart', resumeAction);
        resumeBtn.addEventListener('mousedown', resumeAction);

        const restartAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PAUSED' || this.gameState === 'GAME_OVER' || this.gameState === 'WIN') this.restartGame();
        };
        restartBtn.addEventListener('touchstart', restartAction);
        restartBtn.addEventListener('mousedown', restartAction);

        const mainMenuAction = (e) => {
            if (e) e.preventDefault();
            if (this.gameState === 'PAUSED' || this.gameState === 'GAME_OVER' || this.gameState === 'WIN') this.goToMainMenu();
        };
        mainMenuBtn.addEventListener('touchstart', mainMenuAction);
        mainMenuBtn.addEventListener('mousedown', mainMenuAction);

        const toggleFxAction = (e) => {
            if (e) e.preventDefault();
            this.toggleReducedEffects();
            fxBtn.textContent = this.reducedEffects ? 'FX: LOW' : 'FX: ON';
        };
        fxBtn.addEventListener('touchstart', toggleFxAction);
        fxBtn.addEventListener('mousedown', toggleFxAction);

        const toggleMusicAction = (e) => {
            if (e) e.preventDefault();
            musicBtn.textContent = this.cycleMusicMode();
        };
        musicBtn.addEventListener('touchstart', toggleMusicAction);
        musicBtn.addEventListener('mousedown', toggleMusicAction);

        controlPanel.appendChild(leftBtn);
        controlPanel.appendChild(jumpBtn);
        controlPanel.appendChild(throwBtn);
        controlPanel.appendChild(rightBtn);

        actionPanel.appendChild(menuBtn);
        actionPanel.appendChild(resumeBtn);
        actionPanel.appendChild(restartBtn);
        actionPanel.appendChild(mainMenuBtn);
        actionPanel.appendChild(fxBtn);
        actionPanel.appendChild(musicBtn);

        document.body.appendChild(controlPanel);
        document.body.appendChild(actionPanel);

        this.mobileControls = {
            panel: controlPanel,
            actionPanel,
            left: leftBtn,
            right: rightBtn,
            jump: jumpBtn,
            throw: throwBtn,
            menu: menuBtn,
            resume: resumeBtn,
            restart: restartBtn,
            mainMenu: mainMenuBtn,
            fx: fxBtn,
            music: musicBtn
        };

        this.updateMobileControlsVisibility();
    }
    
    update() {
        // Update story system
        this.updateStory();
        
        // Don't update game logic if in story mode
        if (this.gameState === 'SPLASH') return;
        if (this.gameState !== 'PLAYING') return;
        if (this.levelCompleted && !(this.bossBattle && this.bossBattle.active)) return;
        
        // Handle horizontal movement
        const currentSpeed = this.getCurrentMoveSpeed();
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.papaSandy.velocityX = -currentSpeed;
            this.papaSandy.direction = -1;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.papaSandy.velocityX = currentSpeed;
            this.papaSandy.direction = 1;
        } else {
            this.papaSandy.velocityX *= this.friction;
        }
        
        // Handle jumping
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && this.papaSandy.onGround) {
            this.papaSandy.velocityY = -this.getCurrentJumpPower();
            this.papaSandy.onGround = false;
        }
        
        // Apply gravity
        if (!this.papaSandy.onGround) {
            this.papaSandy.velocityY += this.gravity;
        }
        
        // Update position
        this.papaSandy.x += this.papaSandy.velocityX;
        this.papaSandy.y += this.papaSandy.velocityY;
        
        // Keep Papa Sandy within bounds
        if (this.papaSandy.x < 0) this.papaSandy.x = 0;
        if (this.papaSandy.x + this.papaSandy.width > this.canvas.width) {
            this.papaSandy.x = this.canvas.width - this.papaSandy.width;
        }
        
        // Ground collision (mounted player sits slightly higher)
        const groundLevel = this.groundY - (this.isMounted() ? this.mountRideHeight : 0);
        if (this.papaSandy.y + this.papaSandy.height > groundLevel) {
            this.papaSandy.y = groundLevel - this.papaSandy.height;
            this.papaSandy.velocityY = 0;
            this.papaSandy.onGround = true;
        }

        this.updateHorseState();
        this.updateGateCollisions();
        
        // Update enemies
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.type === 'coconut' && !enemy.falling) {
                // Coconut falling behavior
                enemy.fallTimer++;
                if (enemy.fallTimer > 180) { // Fall after 3 seconds
                    enemy.falling = true;
                    enemy.velocityY = 0;
                }
            }
            
            if (enemy.falling) {
                // Falling coconut physics
                enemy.velocityY += this.gravity;
                enemy.y += enemy.velocityY;
                
                // Stop at ground
                if (enemy.y + enemy.height >= this.groundY) {
                    enemy.y = this.groundY - enemy.height;
                    enemy.falling = false;
                    enemy.fallTimer = 0;
                    enemy.velocityY = 0;
                }
            } else {
                // Normal movement for non-falling enemies
                enemy.x += enemy.velocityX * enemy.direction;
                
                // Reverse direction at patrol boundaries
                if (enemy.x <= enemy.patrolStart || enemy.x >= enemy.patrolEnd) {
                    enemy.direction *= -1;
                }
                
                // Keep enemies within bounds
                if (enemy.x < 0) {
                    enemy.x = 0;
                    enemy.direction = 1;
                }
                if (enemy.x + enemy.width > this.canvas.width) {
                    enemy.x = this.canvas.width - enemy.width;
                    enemy.direction = -1;
                }
            }
        }

        // Finale boss phase update
        if (this.bossBattle && this.bossBattle.active) {
            this.updateBossBattle();
        }
        
        // Check power-up collection
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                // Simple collision detection
                if (this.papaSandy.x < powerUp.x + powerUp.width &&
                    this.papaSandy.x + this.papaSandy.width > powerUp.x &&
                    this.papaSandy.y < powerUp.y + powerUp.height &&
                    this.papaSandy.y + this.papaSandy.height > powerUp.y) {
                    
                    powerUp.collected = true;
                    this.score += 100;
                    
                    // Check if level is completed
                    const collectedCount = this.powerUps.filter(p => p.collected).length;
                    if (collectedCount >= this.levelCompletionThreshold) {
                        if (this.currentWorld === this.totalWorlds) {
                            this.startBossBattle();
                        } else {
                            this.levelCompleted = true;
                        }
                    }
                }
            }
        }
        
        // Check enemy collisions and damage
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;

            const overlaps = (
                this.papaSandy.x < enemy.x + enemy.width &&
                this.papaSandy.x + this.papaSandy.width > enemy.x &&
                this.papaSandy.y < enemy.y + enemy.height &&
                this.papaSandy.y + this.papaSandy.height > enemy.y
            );

            if (!overlaps) continue;

            // Prioritize stomps before contact damage so jump-attacks feel correct
            const previousBottom = (this.papaSandy.y - this.papaSandy.velocityY) + this.papaSandy.height;
            const stompedFromAbove = (
                this.papaSandy.velocityY > 0 &&
                previousBottom <= enemy.y + 6
            );

            if (stompedFromAbove) {
                enemy.alive = false;
                this.papaSandy.velocityY = -this.papaSandy.jumpPower * 0.7; // Small bounce
                this.papaSandy.onGround = false;
                this.score += 150;
                continue;
            }

            if (!this.papaSandy.invulnerable) {
                // Enemy damages Papa Sandy
                this.papaSandy.health--;
                this.papaSandy.invulnerable = true;
                this.papaSandy.invulnerableTimer = 120; // 2 seconds of invulnerability

                // Check if Papa Sandy died
                if (this.papaSandy.health <= 0) {
                    this.gameState = 'GAME_OVER';
                    this.stopBackgroundMusic();
                } else {
                    this.respawnAtCheckpoint();
                }
            }
        }
        
        if (this.bossBattle && this.bossBattle.active) {
            this.checkBossCollisions();
        }

        // Update animation state
        this.papaSandy.animationTimer++;
        if (!this.papaSandy.onGround) {
            this.papaSandy.animationState = 'jump';
        } else if (Math.abs(this.papaSandy.velocityX) > 0.5) {
            this.papaSandy.animationState = 'run';
        } else {
            this.papaSandy.animationState = 'idle';
        }

        // Update invulnerability timer
        if (this.papaSandy.invulnerable) {
            this.papaSandy.invulnerableTimer--;
            if (this.papaSandy.invulnerableTimer <= 0) {
                this.papaSandy.invulnerable = false;
            }
        }
        
        // Update tires
        this.updateTires();
    }
    
    updateTires() {
        for (let tire of this.tires) {
            if (tire.pushed) {
                // Update thrown tire physics
                tire.x += tire.velocityX;
                tire.velocityY += this.gravity;
                tire.y += tire.velocityY;

                // Tire impact on enemies
                for (let enemy of this.enemies) {
                    if (!enemy.alive) continue;
                    if (tire.x < enemy.x + enemy.width &&
                        tire.x + tire.width > enemy.x &&
                        tire.y < enemy.y + enemy.height &&
                        tire.y + tire.height > enemy.y) {
                        enemy.alive = false;
                        this.score += tire.thrown ? 150 : 150; // Always high damage for thrown tires
                    }
                }

                // Stop tire after hitting wall or landing
                if (tire.x <= 0 || tire.x + tire.width >= this.canvas.width || tire.y + tire.height >= this.groundY) {
                    tire.pushed = false;
                    tire.thrown = false;
                    tire.velocityX = 0;
                    tire.velocityY = 0;
                    tire.pushTime = 0;
                    if (tire.y + tire.height >= this.groundY) {
                        tire.y = this.groundY - tire.height;
                    }
                }
            }

            // Keep tires within bounds
            if (tire.x < 0) tire.x = 0;
            if (tire.x + tire.width > this.canvas.width) {
                tire.x = this.canvas.width - tire.width;
                tire.pushed = false;
                tire.thrown = false;
                tire.velocityX = 0;
                tire.velocityY = 0;
                tire.pushTime = 0;
                tire.y = this.groundY - tire.height;
            }
        }
    }

    getPapaSandySpriteFrame() {
        const idleFrame = [
            '....HHHH....',
            '...HHHHHH...',
            '..HHHHHHHH..',
            '..BBBBBBBB..',
            '...SSSSSS...',
            '..SSEESSSS..',
            '..SSSSSSSS..',
            '...WWWWWW...',
            '..WWWWWWWW..',
            '..WWWWWWWW..',
            '...CCCCCC...',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCPPPCC..',
            '..CCCPPPCC..',
            '...PP..PP...',
            '...PP..PP...',
            '...KK..KK...',
            '..KKK..KKK..'
        ];

        const runFrameA = [
            '....HHHH....',
            '...HHHHHH...',
            '..HHHHHHHH..',
            '..BBBBBBBB..',
            '...SSSSSS...',
            '..SSEESSSS..',
            '..SSSSSSSS..',
            '...WWWWWW...',
            '..WWWWWWWW..',
            '..WWWWWWWW..',
            '...CCCCCC...',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCPPPCC..',
            '..CCCPPPCC..',
            '..PPP..PP...',
            '...PP...PP..',
            '..KKK...KK..',
            '.KKK.....KK.'
        ];

        const runFrameB = [
            '....HHHH....',
            '...HHHHHH...',
            '..HHHHHHHH..',
            '..BBBBBBBB..',
            '...SSSSSS...',
            '..SSEESSSS..',
            '..SSSSSSSS..',
            '...WWWWWW...',
            '..WWWWWWWW..',
            '..WWWWWWWW..',
            '...CCCCCC...',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCPPPCC..',
            '..CCCPPPCC..',
            '...PP..PPP..',
            '..PP...PP...',
            '..KK...KKK..',
            '.KK.....KKK.'
        ];

        const jumpFrame = [
            '....HHHH....',
            '...HHHHHH...',
            '..HHHHHHHH..',
            '..BBBBBBBB..',
            '...SSSSSS...',
            '..SSEESSSS..',
            '..SSSSSSSS..',
            '...WWWWWW...',
            '..WWWWWWWW..',
            '..WWWWWWWW..',
            '...CCCCCC...',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCCCCCC..',
            '..CCCPPPCC..',
            '..CCCPPPCC..',
            '...PPPPPP...',
            '..PPPPPPPP..',
            '...KK..KK...',
            '..KKK..KKK..'
        ];

        if (this.papaSandy.animationState === 'jump') {
            return jumpFrame;
        }

        if (this.papaSandy.animationState === 'run') {
            const runIndex = Math.floor(this.papaSandy.animationTimer / 7) % 2;
            return runIndex === 0 ? runFrameA : runFrameB;
        }

        return idleFrame;
    }

    drawPapaSandy() {
        const palette = {
            H: '#9AA0A6',
            B: '#9C6B3F',
            S: '#E2B58F',
            E: '#1B1B1B',
            W: '#F2F2F2',
            C: '#3E6FB8',
            P: '#4F6480',
            K: '#1F1F1F'
        };

        const sprite = this.getPapaSandySpriteFrame();
        const pixelSize = 2;
        const spriteWidth = sprite[0].length * pixelSize;
        const spriteHeight = sprite.length * pixelSize;
        const drawX = Math.floor((this.papaSandy.width - spriteWidth) / 2);
        const idleBob = this.papaSandy.animationState === 'idle'
            ? Math.floor(this.papaSandy.animationTimer / 30) % 2
            : 0;
        const drawY = this.papaSandy.y + (this.papaSandy.height - spriteHeight) + idleBob;

        this.ctx.save();
        this.ctx.translate(this.papaSandy.x, 0);

        // Sprite source art faces left by default, so mirror when moving right.
        if (this.papaSandy.direction === 1) {
            this.ctx.translate(this.papaSandy.width, 0);
            this.ctx.scale(-1, 1);
        }

        for (let y = 0; y < sprite.length; y++) {
            const row = sprite[y];
            for (let x = 0; x < row.length; x++) {
                const pixel = row[x];
                if (pixel === '.') continue;
                this.ctx.fillStyle = palette[pixel];
                this.ctx.fillRect(drawX + x * pixelSize, drawY + y * pixelSize, pixelSize, pixelSize);
            }
        }

        if (this.papaSandy.invulnerable && Math.floor(this.papaSandy.invulnerableTimer / 10) % 2) {
            this.ctx.fillStyle = 'rgba(255, 105, 180, 0.35)';
            this.ctx.fillRect(drawX, drawY, spriteWidth, spriteHeight);
        }

        this.ctx.restore();
    }
    
    draw() {
        // Draw story mode first
        this.drawStory();
        
        // Don't draw game if in story mode
        if (this.gameState === 'SPLASH') {
            this.updateMobileControlsVisibility();
            return;
        }

        this.updateMobileControlsVisibility();

        // Get world-specific colors
        const worldColors = this.worldColors[this.currentWorld];
        
        // Clear canvas with world-specific sky color
        this.ctx.fillStyle = worldColors.sky;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = worldColors.ground;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Draw grass
        this.ctx.fillStyle = worldColors.grass;
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 10);
        
        // Draw background elements (optional reduced-clutter mode)
        if (!this.reducedEffects) {
            for (let element of this.backgroundElements) {
                if (element.type === 'palm') {
                    this.ctx.fillStyle = '#8B4513';
                    this.ctx.fillRect(element.x, element.y, 8, 40);
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.beginPath();
                    this.ctx.arc(element.x + 4, element.y - 10, 20 * element.scale, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.fillStyle = '#8B4513';
                } else if (element.type === 'cactus') {
                    this.ctx.fillStyle = '#228B22';
                    this.ctx.fillRect(element.x, element.y, 12, 30 * element.scale);
                    this.ctx.fillRect(element.x - 6, element.y + 10, 24, 8 * element.scale);
                } else if (element.type === 'jungle') {
                    this.ctx.fillStyle = '#006400';
                    this.ctx.fillRect(element.x, element.y, 16, 50 * element.scale);
                    this.ctx.fillStyle = '#32CD32';
                    for (let i = 0; i < 3; i++) {
                        this.ctx.beginPath();
                        this.ctx.arc(element.x + 8, element.y - 20 + i * 15, 15 * element.scale, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                }
            }
        }

        // Draw finale set dressing and boss
        if (this.bossBattle && this.bossBattle.active) {
            this.drawBossScene();
        }
        
        // Draw horse-required gates/obstacles
        for (const gate of this.worldGates) {
            if (gate.opened) continue;
            this.ctx.fillStyle = gate.color || '#6D4C41';
            this.ctx.fillRect(gate.x, gate.y, gate.width, gate.height);
            this.ctx.fillStyle = '#3E2723';
            this.ctx.fillRect(gate.x - 6, gate.y + 8, 6, gate.height - 8);
            this.ctx.fillRect(gate.x + gate.width, gate.y + 8, 6, gate.height - 8);
            this.ctx.fillStyle = '#FFF3E0';
            this.ctx.font = '12px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('HORSE', gate.x + gate.width / 2, gate.y - 6);
        }

        // Draw horses
        for (const horse of this.horses) {
            if (horse.mounted && this.mountedHorseId !== horse.id) continue;
            this.ctx.fillStyle = horse.color || '#8B5A2B';
            this.ctx.fillRect(horse.x, horse.y + 8, horse.width, horse.height - 8);
            this.ctx.fillRect(horse.x + (horse.facing === 1 ? horse.width - 12 : 0), horse.y + 2, 12, 12);
            this.ctx.fillRect(horse.x + 6, horse.y + horse.height - 2, 7, 10);
            this.ctx.fillRect(horse.x + horse.width - 13, horse.y + horse.height - 2, 7, 10);
            this.ctx.fillStyle = '#2E1A0F';
            this.ctx.fillRect(horse.x + 3, horse.y + 10, 6, 4);
            this.ctx.fillRect(horse.x + horse.width - 9, horse.y + 10, 6, 4);
        }

        // Draw Papa Sandy (pixel-art sprite with simple animation states)
        this.drawPapaSandy();

        if (this.bossBattle && this.bossBattle.active) {
            this.drawDrVette();
        }
        
        // Draw enemies (animated)
        const animTick = this.papaSandy.animationTimer;
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;

            if (enemy.type === 'crab') {
                const clawFrame = Math.floor(animTick / 10) % 2;
                const legFrame = Math.floor(animTick / 8) % 2;
                const crabY = enemy.y + (legFrame ? 1 : 0);

                // body
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x + 2, crabY + 4, enemy.width - 4, enemy.height - 6);
                // claws
                this.ctx.fillRect(enemy.x - 2, crabY + (clawFrame ? 2 : 6), 6, 4);
                this.ctx.fillRect(enemy.x + enemy.width - 4, crabY + (clawFrame ? 2 : 6), 6, 4);
                // eyes
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 6, crabY, 4, 4);
                this.ctx.fillRect(enemy.x + enemy.width - 10, crabY, 4, 4);
            } else if (enemy.type === 'coconut') {
                const wobble = enemy.falling ? 0 : Math.sin(animTick / 10) * 1.5;
                const cx = enemy.x + enemy.width / 2 + wobble;
                const cy = enemy.y + enemy.height / 2;
                const r = enemy.width / 2;

                this.ctx.beginPath();
                this.ctx.fillStyle = enemy.color;
                this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
                this.ctx.fill();

                // shell texture lines
                this.ctx.strokeStyle = '#654321';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, r - 4, 0.3, Math.PI - 0.3);
                this.ctx.stroke();
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, r - 7, Math.PI + 0.3, (Math.PI * 2) - 0.3);
                this.ctx.stroke();
            } else if (enemy.type === 'minion') {
                const floatY = Math.sin(animTick / 12 + enemy.x * 0.02) * 2;
                const blink = Math.floor(animTick / 24) % 7 === 0;
                const my = enemy.y + floatY;

                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x, my, enemy.width, enemy.height);
                // outline aura
                this.ctx.strokeStyle = '#8a5cff';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(enemy.x - 1, my - 1, enemy.width + 2, enemy.height + 2);

                // face
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 5, my + 5, 7, blink ? 2 : 7);
                this.ctx.fillRect(enemy.x + 20, my + 5, 7, blink ? 2 : 7);
                this.ctx.fillStyle = '#000000';
                if (!blink) {
                    this.ctx.fillRect(enemy.x + 7, my + 7, 3, 3);
                    this.ctx.fillRect(enemy.x + 22, my + 7, 3, 3);
                }
            }
        }
        
        // Draw tires (rounded, black, easier to identify)
        for (let tire of this.tires) {
            const cx = tire.x + tire.width / 2;
            const cy = tire.y + tire.height / 2;
            const outerR = Math.min(tire.width, tire.height) / 2;
            const innerR = outerR * 0.45;

            // Outer tire
            this.ctx.beginPath();
            this.ctx.fillStyle = '#111111';
            this.ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
            this.ctx.fill();

            // Inner rim
            this.ctx.beginPath();
            this.ctx.fillStyle = '#9E9E9E';
            this.ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
            this.ctx.fill();

            // Tread accents
            this.ctx.strokeStyle = tire.pushed ? '#7A7A7A' : '#555555';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, outerR - 2, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // Draw power-ups (gold bullions)
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                // Remove background box - just draw the gold bullion emoji
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '20px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🪙', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height + 4);
            }
        }
        
        // Draw HUD background panels for readability
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fillRect(8, 8, 360, 132);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        this.ctx.fillRect(8, 8, 360, 2);

        const drawHudText = (text, x, y, color = '#FFFFFF', size = 20) => {
            this.ctx.font = `${size}px Courier New`;
            this.ctx.textAlign = 'left';
            this.ctx.lineWidth = 4;
            this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.75)';
            this.ctx.strokeText(text, x, y);
            this.ctx.fillStyle = color;
            this.ctx.fillText(text, x, y);
        };

        drawHudText('World: ' + this.worldNames[this.currentWorld], 14, 34, '#FFFFFF', 20);
        drawHudText('Score: ' + this.score, 14, 64, '#FFFFFF', 20);

        drawHudText('Health:', 14, 94, '#FFB3B3', 18);
        for (let i = 0; i < this.papaSandy.health; i++) {
            this.ctx.fillStyle = '#E53935';
            this.ctx.fillRect(108 + i * 24, 80, 18, 14);
            this.ctx.strokeStyle = '#7F0000';
            this.ctx.strokeRect(108 + i * 24, 80, 18, 14);
        }

        const collectedCount = this.powerUps.filter(p => p.collected).length;
        drawHudText('Bullions: ' + collectedCount + '/' + this.levelCompletionThreshold, 14, 122, '#FFE082', 18);

        if (this.bossBattle && this.bossBattle.active) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(380, 8, 412, 72);
            drawHudText(this.bossObjectiveText, 390, 34, '#FFECB3', 15);
            drawHudText('Dr.vette HP: ' + this.bossBattle.health + '/' + this.bossBattle.maxHealth, 390, 62, '#FF8A80', 18);
        }

        // Draw controls info
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        this.ctx.fillRect(8, this.canvas.height - 30, this.canvas.width - 16, 22);
        this.ctx.font = '12px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.85)';
        const controlsText = this.reducedEffects
            ? 'Controls: Arrows/A,D Move | Space/W Jump | E Action/Interact | M Music | [/] Vol | V FX ON/OFF'
            : 'Controls: Arrows/A,D Move | Space/W Jump | E Action/Interact | ESC Pause | M Music | [/] Vol | V FX LOW';
        this.ctx.strokeText(controlsText, 12, this.canvas.height - 14);
        this.ctx.fillStyle = '#E0E0E0';
        this.ctx.fillText(controlsText, 12, this.canvas.height - 14);
        
        // Draw level completion message
        if (this.levelCompleted) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '32px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '16px Courier New';
            if (this.currentWorld < this.totalWorlds) {
                this.ctx.fillText('Press SPACE to advance to ' + this.worldNames[this.currentWorld + 1], this.canvas.width/2, this.canvas.height/2 + 40);
            } else {
                this.ctx.fillText('Press SPACE to challenge Dr.vette!', this.canvas.width/2, this.canvas.height/2 + 40);
            }
        }

        // Draw paused, lose, and win overlays
        if (this.gameState === 'PAUSED') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '32px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Press ESC to resume (or use RESUME button)', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.gameState === 'GAME_OVER') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#FF4D4D';
            this.ctx.font = '36px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Press R / ENTER / SPACE or tap PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 40);
        } else if (this.gameState === 'WIN') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const t = Date.now() / 1000;
            const elapsed = this.winCelebrationStart ? (Date.now() - this.winCelebrationStart) : 0;

            // Celebration confetti + star burst
            const confettiColors = ['#FFD700', '#FF6F61', '#4DD0E1', '#81C784', '#BA68C8'];
            for (let i = 0; i < 48; i++) {
                const x = (i * 47 + (t * 95)) % (this.canvas.width + 40) - 20;
                const y = ((i * 83 + (t * 150)) % (this.canvas.height + 60)) - 30;
                const w = 6 + (i % 4);
                const h = 10 + (i % 3);
                const angle = (t * 4 + i) % (Math.PI * 2);
                this.ctx.save();
                this.ctx.translate(x, y);
                this.ctx.rotate(angle);
                this.ctx.fillStyle = confettiColors[i % confettiColors.length];
                this.ctx.fillRect(-w / 2, -h / 2, w, h);
                this.ctx.restore();
            }

            for (let i = 0; i < 10; i++) {
                const sx = 80 + i * 75 + Math.sin(t + i) * 8;
                const sy = 90 + Math.cos(t * 1.5 + i) * 10;
                this.ctx.fillStyle = '#FFE082';
                this.ctx.fillText('★', sx, sy);
            }

            // Show Corvette prominently on victory
            const carX = this.canvas.width / 2 - 90;
            const carY = this.canvas.height / 2 + 20;
            this.ctx.fillStyle = '#FDFDFD';
            this.ctx.fillRect(carX, carY + 16, 180, 30);
            this.ctx.fillRect(carX + 40, carY, 80, 20);
            this.ctx.fillStyle = '#B0C4DE';
            this.ctx.fillRect(carX + 48, carY + 4, 64, 13);
            this.ctx.fillStyle = '#1E1E1E';
            this.ctx.fillRect(carX + 26, carY + 38, 28, 20);
            this.ctx.fillRect(carX + 126, carY + 38, 28, 20);

            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 44px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('VICTORY!', this.canvas.width / 2, this.canvas.height / 2 - 40);
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.font = '20px Courier New';
            this.ctx.fillText('Papa Sandy rescued his Corvette!', this.canvas.width / 2, this.canvas.height / 2 - 8);

            this.ctx.font = '16px Courier New';
            if (elapsed < 3000) {
                this.ctx.fillStyle = '#CFE8FF';
                this.ctx.fillText('Celebrating...', this.canvas.width / 2, this.canvas.height / 2 + 78);
            } else {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText('Press R / ENTER / SPACE or tap PLAY AGAIN', this.canvas.width / 2, this.canvas.height / 2 + 78);
            }
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    nextLevel() {
        if (!this.levelCompleted || this.gameState !== 'PLAYING') return;

        // Add bonus points for world completion
        this.score += 100;

        // Final world transitions into boss battle, not direct win
        if (this.currentWorld >= this.totalWorlds) {
            this.levelCompleted = false;
            this.startBossBattle();
            return;
        }

        // Advance to next world
        this.currentWorld += 1;
        this.levelCompleted = false;
        this.initializeWorld(this.currentWorld);
        this.bossBattle = null;
        this.resetPlayerForWorldStart();
    }
    
    // Add method to initialize tires for each world
    initializeTires() {
        this.tires = [];
        
        switch(this.currentWorld) {
            case 1: // Beach Paradise
                this.tires = [
                    {
                        type: 'tire',
                        x: 200,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    },
                    {
                        type: 'tire',
                        x: 400,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    }
                ];
                break;
            case 2: // Cowboy Country
                this.tires = [
                    {
                        type: 'tire',
                        x: 150,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    },
                    {
                        type: 'tire',
                        x: 350,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    },
                    {
                        type: 'tire',
                        x: 550,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    }
                ];
                break;
            case 3: // Tropical Jungle
                this.tires = [
                    {
                        type: 'tire',
                        x: 180,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    },
                    {
                        type: 'tire',
                        x: 450,
                        y: this.groundY - 24,
                        width: 32,
                        height: 32,
                        pushed: false,
                        velocityX: 0,
                        pushTime: 0,
                        color: '#111111'
                    }
                ];
                break;
        }

        // Ensure tire action fields exist across all worlds
        this.tires.forEach((tire) => {
            tire.thrown = false;
            tire.velocityY = 0;
        });
    }
    
    resetPlayerForWorldStart() {
        this.papaSandy.x = 100;
        this.papaSandy.y = this.groundY - this.papaSandy.height;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
        this.papaSandy.onGround = true;
        this.papaSandy.invulnerable = false;
        this.papaSandy.invulnerableTimer = 0;
        this.papaSandy.animationTimer = 0;
        this.papaSandy.animationState = 'idle';
        this.mountedHorseId = null;
        this.horses.forEach((horse) => { horse.mounted = false; });
        this.checkpoint = {
            x: this.papaSandy.x,
            y: this.papaSandy.y,
            world: this.currentWorld
        };
    }

    respawnAtCheckpoint() {
        // Always respawn safely on the left-side ground start for the current world
        this.papaSandy.x = 100;
        this.papaSandy.y = this.groundY - this.papaSandy.height;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
        this.papaSandy.onGround = true;
        this.papaSandy.animationState = 'idle';
        this.mountedHorseId = null;
        this.horses.forEach((horse) => { horse.mounted = false; });

        this.checkpoint = {
            x: this.papaSandy.x,
            y: this.papaSandy.y,
            world: this.currentWorld
        };
    }

    restartGame() {
        this.currentWorld = 1;
        this.score = 0;
        this.levelCompleted = false;
        this.gameState = 'PLAYING';
        this.menuState = 'CLOSED';
        this.keys = {};
        this.papaSandy.health = 3;
        this.initializeWorld(this.currentWorld);
        this.winCelebrationStart = 0;
        this.resetPlayerForWorldStart();
        this.playBackgroundMusic();
        this.updateMobileControlsVisibility();
    }

    goToMainMenu() {
        this.stopBackgroundMusic();
        this.menuState = 'CLOSED';
        this.keys = {};
        this.currentWorld = 1;
        this.levelCompleted = false;
        this.papaSandy.health = 3;
        this.winCelebrationStart = 0;
        this.startStory('LEGEND');
        this.updateMobileControlsVisibility();
    }

    toggleReducedEffects() {
        this.reducedEffects = !this.reducedEffects;
    }

    updateMobileControlsVisibility() {
        if (!this.mobileControls) return;

        const isTerminal = this.gameState === 'GAME_OVER' || this.gameState === 'WIN';
        const isPaused = this.gameState === 'PAUSED';
        const canMove = this.gameState === 'PLAYING' && !this.levelCompleted;

        this.mobileControls.panel.style.display = canMove ? 'flex' : 'none';
        this.mobileControls.menu.style.display = (this.gameState === 'PLAYING' || isPaused) ? 'block' : 'none';
        this.mobileControls.resume.style.display = isPaused ? 'block' : 'none';
        this.mobileControls.restart.style.display = (isPaused || isTerminal) ? 'block' : 'none';
        this.mobileControls.mainMenu.style.display = (isPaused || isTerminal) ? 'block' : 'none';
        this.mobileControls.fx.style.display = (this.gameState !== 'SPLASH') ? 'block' : 'none';
        this.mobileControls.music.style.display = (this.gameState !== 'SPLASH') ? 'block' : 'none';
        this.mobileControls.music.textContent = this.getMusicLabel();
    }

    toggleMenu() {
        if (this.menuState === 'CLOSED') {
            this.menuState = 'PAUSED';
            this.pauseGame();
        } else if (this.menuState === 'PAUSED') {
            this.menuState = 'CLOSED';
            this.resumeGame();
        }
    }
    
    pauseGame() {
        this.gameState = 'PAUSED';
    }
    
    resumeGame() {
        this.gameState = 'PLAYING';
    }
    
    isMounted() {
        return !!this.mountedHorseId;
    }

    getCurrentMoveSpeed() {
        return this.papaSandy.speed * (this.isMounted() ? this.papaSandy.mountedSpeedMultiplier : 1);
    }

    getCurrentJumpPower() {
        return this.papaSandy.jumpPower * (this.isMounted() ? this.papaSandy.mountedJumpMultiplier : 1);
    }

    getNearestAvailableTire(range = 110) {
        let nearestTire = null;
        let minDistance = Infinity;

        for (let tire of this.tires) {
            if (!tire.pushed) {
                const distance = Math.abs((tire.x + tire.width / 2) - (this.papaSandy.x + this.papaSandy.width / 2));
                if (distance < minDistance && distance < range) {
                    minDistance = distance;
                    nearestTire = tire;
                }
            }
        }

        return nearestTire;
    }

    getNearestHorse(range = 70) {
        let nearestHorse = null;
        let minDistance = Infinity;
        for (const horse of this.horses) {
            const distance = Math.abs((horse.x + horse.width / 2) - (this.papaSandy.x + this.papaSandy.width / 2));
            if (distance < minDistance && distance < range) {
                minDistance = distance;
                nearestHorse = horse;
            }
        }
        return nearestHorse;
    }

    getNearestGate(range = 90) {
        let nearestGate = null;
        let minDistance = Infinity;
        for (const gate of this.worldGates) {
            if (gate.opened) continue;
            const distance = Math.abs((gate.x + gate.width / 2) - (this.papaSandy.x + this.papaSandy.width / 2));
            if (distance < minDistance && distance < range) {
                minDistance = distance;
                nearestGate = gate;
            }
        }
        return nearestGate;
    }

    pushNearestTire() {
        const nearestTire = this.getNearestAvailableTire(95);
        if (!nearestTire) return false;

        nearestTire.pushed = true;
        nearestTire.thrown = false;
        nearestTire.velocityX = this.papaSandy.direction * 4;
        nearestTire.velocityY = 0;
        nearestTire.pushTime = 160;
        return true;
    }

    throwNearestTire() {
        const nearestTire = this.getNearestAvailableTire(120);

        if (nearestTire) {
            nearestTire.pushed = true;
            nearestTire.thrown = true;
            nearestTire.velocityX = this.papaSandy.direction * 5;
            nearestTire.velocityY = -8;
            nearestTire.pushTime = 210;
            this.score += 100;
            return true;
        }
        return false;
    }

    handleActionPress() {
        if (this.tryMountOrDismount()) return;
        if (this.interactWithNearbyObject()) return;
        this.throwNearestTire();
    }

    tryMountOrDismount() {
        if (this.isMounted()) {
            const horse = this.horses.find((h) => h.id === this.mountedHorseId);
            if (!horse) {
                this.mountedHorseId = null;
                return false;
            }
            horse.mounted = false;
            horse.x = this.papaSandy.x + (this.papaSandy.direction * 26);
            horse.facing = this.papaSandy.direction;
            if (horse.x < 0) horse.x = 0;
            if (horse.x + horse.width > this.canvas.width) horse.x = this.canvas.width - horse.width;
            this.mountedHorseId = null;
            this.papaSandy.y = this.groundY - this.papaSandy.height;
            this.papaSandy.velocityY = 0;
            this.papaSandy.onGround = true;
            return true;
        }

        const nearbyHorse = this.getNearestHorse();
        if (!nearbyHorse) return false;

        this.mountedHorseId = nearbyHorse.id;
        nearbyHorse.mounted = true;
        nearbyHorse.facing = this.papaSandy.direction;
        this.papaSandy.y = this.groundY - this.mountRideHeight - this.papaSandy.height;
        this.papaSandy.velocityY = 0;
        this.papaSandy.onGround = true;
        return true;
    }

    interactWithNearbyObject() {
        const nearbyGate = this.getNearestGate();
        if (!nearbyGate) return false;

        if (!nearbyGate.requiresHorse || this.isMounted()) {
            nearbyGate.opened = true;
            this.score += 50;
            return true;
        }
        return false;
    }

    updateHorseState() {
        if (!this.isMounted()) return;

        const horse = this.horses.find((h) => h.id === this.mountedHorseId);
        if (!horse) {
            this.mountedHorseId = null;
            return;
        }

        horse.mounted = true;
        horse.facing = this.papaSandy.direction;
        horse.x = this.papaSandy.x - (horse.width - this.papaSandy.width) / 2;
        horse.y = this.groundY - horse.height;

        if (horse.x < 0) horse.x = 0;
        if (horse.x + horse.width > this.canvas.width) horse.x = this.canvas.width - horse.width;

        this.papaSandy.y = Math.min(this.papaSandy.y, this.groundY - this.mountRideHeight - this.papaSandy.height);
    }

    updateGateCollisions() {
        for (const gate of this.worldGates) {
            if (gate.opened) continue;

            const overlaps = this.papaSandy.x < gate.x + gate.width &&
                this.papaSandy.x + this.papaSandy.width > gate.x &&
                this.papaSandy.y < gate.y + gate.height &&
                this.papaSandy.y + this.papaSandy.height > gate.y;

            if (!overlaps) continue;

            if (gate.requiresHorse && this.isMounted()) {
                gate.opened = true;
                continue;
            }

            if (this.papaSandy.velocityX > 0) {
                this.papaSandy.x = gate.x - this.papaSandy.width;
            } else if (this.papaSandy.velocityX < 0) {
                this.papaSandy.x = gate.x + gate.width;
            }
            this.papaSandy.velocityX = 0;
        }
    }

    startBossBattle() {
        if (this.bossBattle && this.bossBattle.active) return;
        this.levelCompleted = false;
        this.bossBattle = {
            active: true,
            x: 620,
            y: this.groundY - 96,
            width: 64,
            height: 96,
            velocityX: 1.8,
            direction: -1,
            patrolStart: 500,
            patrolEnd: 740,
            health: 8,
            maxHealth: 8,
            hurtCooldown: 0,
            attackTimer: 0
        };

        // Make room for a boss arena feel
        this.enemies.forEach((enemy) => { enemy.alive = false; });
        this.papaSandy.x = 120;
        this.papaSandy.y = this.groundY - this.papaSandy.height;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
    }

    updateBossBattle() {
        const boss = this.bossBattle;
        if (!boss || !boss.active) return;

        boss.attackTimer++;
        boss.x += boss.velocityX * boss.direction;

        if (boss.x <= boss.patrolStart || boss.x + boss.width >= boss.patrolEnd) {
            boss.direction *= -1;
        }

        // short charge bursts to increase pressure
        if (boss.attackTimer > 180) {
            boss.attackTimer = 0;
            boss.direction = this.papaSandy.x < boss.x ? -1 : 1;
            boss.velocityX = 3.2;
        } else if (boss.velocityX > 1.8) {
            boss.velocityX *= 0.98;
            if (boss.velocityX < 1.8) boss.velocityX = 1.8;
        }

        if (boss.hurtCooldown > 0) boss.hurtCooldown--;

        // Tires damage the boss
        for (let tire of this.tires) {
            if (!tire.pushed) continue;
            if (tire.x < boss.x + boss.width && tire.x + tire.width > boss.x && tire.y < boss.y + boss.height && tire.y + tire.height > boss.y) {
                if (boss.hurtCooldown <= 0) {
                    boss.health -= 2;
                    boss.hurtCooldown = 20;
                    this.score += 400;
                }
                tire.pushed = false;
                tire.thrown = false;
                tire.velocityX = 0;
                tire.velocityY = 0;
                tire.pushTime = 0;
                tire.y = this.groundY - tire.height;
            }
        }

        if (boss.health <= 0) {
            boss.active = false;
            this.gameState = 'WIN';
            this.winCelebrationStart = Date.now();
            this.stopBackgroundMusic();
        }
    }

    checkBossCollisions() {
        const boss = this.bossBattle;
        if (!boss || !boss.active) return;

        const overlaps = this.papaSandy.x < boss.x + boss.width &&
            this.papaSandy.x + this.papaSandy.width > boss.x &&
            this.papaSandy.y < boss.y + boss.height &&
            this.papaSandy.y + this.papaSandy.height > boss.y;

        if (!overlaps) return;

        const previousBottom = (this.papaSandy.y - this.papaSandy.velocityY) + this.papaSandy.height;
        const stompedFromAbove = this.papaSandy.velocityY > 0 && previousBottom <= boss.y + 8;

        if (stompedFromAbove && boss.hurtCooldown <= 0) {
            boss.health -= 1;
            boss.hurtCooldown = 24;
            this.papaSandy.velocityY = -this.papaSandy.jumpPower * 0.8;
            this.papaSandy.onGround = false;
            this.score += 180;
            if (boss.health <= 0) {
                boss.active = false;
                this.gameState = 'WIN';
                this.winCelebrationStart = Date.now();
                this.stopBackgroundMusic();
            }
            return;
        }

        if (!this.papaSandy.invulnerable) {
            this.papaSandy.health--;
            this.papaSandy.invulnerable = true;
            this.papaSandy.invulnerableTimer = 90;
            if (this.papaSandy.health <= 0) {
                this.gameState = 'GAME_OVER';
                this.stopBackgroundMusic();
            } else {
                this.respawnAtCheckpoint();
            }
        }
    }

    drawBossScene() {
        // White Corvette parked near/behind Dr.vette
        const carX = 500;
        const carY = this.groundY - 54;
        this.ctx.fillStyle = '#FDFDFD';
        this.ctx.fillRect(carX, carY + 16, 110, 26);
        this.ctx.fillRect(carX + 24, carY, 52, 18);
        this.ctx.fillStyle = '#B0C4DE';
        this.ctx.fillRect(carX + 30, carY + 3, 40, 12);
        this.ctx.fillStyle = '#1E1E1E';
        this.ctx.fillRect(carX + 16, carY + 36, 22, 18);
        this.ctx.fillRect(carX + 78, carY + 36, 22, 18);
    }

    drawDrVette() {
        const boss = this.bossBattle;
        if (!boss || !boss.active) return;

        // Dr.vette: vet/lab-coat silhouette, ~2x Papa Sandy height
        this.ctx.fillStyle = '#9AA0A6'; // grey hair
        this.ctx.fillRect(boss.x + 16, boss.y + 2, 32, 20);
        this.ctx.fillStyle = '#EBC9A8'; // face
        this.ctx.fillRect(boss.x + 20, boss.y + 12, 24, 18);

        this.ctx.fillStyle = '#FFFFFF'; // lab coat body
        this.ctx.fillRect(boss.x + 12, boss.y + 30, 40, 50);
        this.ctx.fillRect(boss.x + 8, boss.y + 34, 12, 34);
        this.ctx.fillRect(boss.x + 44, boss.y + 34, 12, 34);

        this.ctx.fillStyle = '#C62828'; // vet cross badge
        this.ctx.fillRect(boss.x + 30, boss.y + 42, 4, 14);
        this.ctx.fillRect(boss.x + 25, boss.y + 47, 14, 4);

        this.ctx.fillStyle = '#7E57C2'; // outfit under coat
        this.ctx.fillRect(boss.x + 22, boss.y + 52, 20, 22);
        this.ctx.fillStyle = '#212121';
        this.ctx.fillRect(boss.x + 18, boss.y + 80, 10, 16);
        this.ctx.fillRect(boss.x + 36, boss.y + 80, 10, 16);

        // eyes
        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(boss.x + 26, boss.y + 18, 3, 3);
        this.ctx.fillRect(boss.x + 35, boss.y + 18, 3, 3);

        // hit flash
        if (boss.hurtCooldown > 0 && Math.floor(boss.hurtCooldown / 3) % 2) {
            this.ctx.fillStyle = 'rgba(255, 64, 129, 0.35)';
            this.ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        }
    }
    
    // Story system methods
    startStory(mode) {
        this.storyMode = mode;
        this.storyTimer = 0;
        this.storyScrollY = 0;
        this.storyAutoScroll = true;
        this.splashSkipLocked = true;
        this.gameState = 'SPLASH';
        this.initializeBackgroundMusic();
        
        // Calculate max scroll distance
        const lines = this.stories[this.storyMode].split('\n');
        const lineHeight = 25;
        const textHeight = lines.length * lineHeight;
        // Full-screen cinematic scroll: start on-screen and scroll past the top
        this.storyMaxScroll = textHeight + this.canvas.height;
    }
    
    updateStory() {
        if (this.gameState !== 'SPLASH') return;

        this.storyTimer += 1;
        
        const anyKeyPressed = this.keys['Space'] || this.keys['Enter'] || this.keys['Escape'] ||
            Object.values(this.keys).some(key => key === true);

        // Debounce skip so a held key from previous splash screen doesn't instantly skip the next one
        if (this.splashSkipLocked) {
            if (!anyKeyPressed) {
                this.splashSkipLocked = false;
            }
            return;
        }

        // Handle skip with any key
        if (anyKeyPressed) {
            this.handleStorySkip();
            return;
        }
    }
    
    drawStory() {
        if (this.gameState !== 'SPLASH') return;
        
        // Clear screen with dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw title or world name at top
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px Courier New';
        this.ctx.textAlign = 'center';
        
        let titleText = '';
        if (this.storyMode === 'INTRO') {
            titleText = 'SANDYLAND';
        } else if (this.storyMode === 'LEGEND') {
            titleText = 'HOW TO PLAY';
        } else if (this.storyMode === 'WORLD_1') {
            titleText = 'WORLD 1: BEACH PARADISE';
        } else if (this.storyMode === 'WORLD_2') {
            titleText = 'WORLD 2: COWBOY COUNTRY';
        } else if (this.storyMode === 'WORLD_3') {
            titleText = 'WORLD 3: TROPICAL JUNGLE';
        } else if (this.storyMode === 'VICTORY') {
            titleText = 'VICTORY!';
        }
        
        this.ctx.fillText(titleText, this.canvas.width / 2, 60);

        if (this.storyMode === 'LEGEND') {
            this.drawLegendScreen();
            return;
        }
        
        // Draw static story text panel
        this.ctx.fillStyle = 'rgba(255,255,255,0.06)';
        this.ctx.fillRect(38, 96, this.canvas.width - 76, this.canvas.height - 200);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'left';

        const baseLines = this.stories[this.storyMode].split('\n');
        const lineHeight = 22;
        const startY = 132;
        const textX = 56;
        const maxWidth = this.canvas.width - 112;

        // Word-wrap so long lines don't run off the screen
        const storyLines = [];
        for (const rawLine of baseLines) {
            if (!rawLine.trim()) {
                storyLines.push('');
                continue;
            }

            const words = rawLine.split(' ');
            let current = '';
            for (const word of words) {
                const candidate = current ? `${current} ${word}` : word;
                if (this.ctx.measureText(candidate).width <= maxWidth) {
                    current = candidate;
                } else {
                    if (current) storyLines.push(current);
                    current = word;
                }
            }
            if (current) storyLines.push(current);
        }

        for (let i = 0; i < storyLines.length; i++) {
            const lineY = startY + (i * lineHeight);
            if (lineY > 80 && lineY < this.canvas.height - 120) {
                this.ctx.fillText(storyLines[i], textX, lineY);
            }
        }

        // Decorative spinning Corvette + tire smoke below text
        this.drawSpinningCorvette(this.canvas.width / 2, this.canvas.height - 62);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 18px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACE / ENTER / TAP to continue', this.canvas.width / 2, this.canvas.height - 18);
    }

    drawSpinningCorvette(cx, y) {
        const t = this.storyTimer || 0;
        const wheelSpin = t * 0.35;
        const bob = Math.sin(t * 0.08) * 2;

        const carX = cx - 70;
        const carY = y + bob - 26;

        // Body
        this.ctx.fillStyle = '#F8F8F8';
        this.ctx.fillRect(carX + 10, carY + 12, 120, 22);
        this.ctx.fillRect(carX + 36, carY, 58, 14);

        // Window
        this.ctx.fillStyle = '#BFD7EA';
        this.ctx.fillRect(carX + 48, carY + 2, 34, 10);

        // Wheels
        const wheelY = carY + 36;
        const wheel1X = carX + 34;
        const wheel2X = carX + 106;

        [wheel1X, wheel2X].forEach((wx) => {
            this.ctx.beginPath();
            this.ctx.fillStyle = '#111';
            this.ctx.arc(wx, wheelY, 12, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.beginPath();
            this.ctx.fillStyle = '#9EA4AA';
            this.ctx.arc(wx, wheelY, 6, 0, Math.PI * 2);
            this.ctx.fill();

            // spinning spokes
            this.ctx.strokeStyle = '#E6EBEF';
            this.ctx.lineWidth = 1.5;
            for (let i = 0; i < 4; i++) {
                const a = wheelSpin + (i * Math.PI / 2);
                this.ctx.beginPath();
                this.ctx.moveTo(wx, wheelY);
                this.ctx.lineTo(wx + Math.cos(a) * 5, wheelY + Math.sin(a) * 5);
                this.ctx.stroke();
            }
        });

        // Tire smoke puffs
        const puffBaseX = carX - 20;
        for (let i = 0; i < 4; i++) {
            const px = puffBaseX - i * 11 + Math.sin((t + i * 7) * 0.11) * 2;
            const py = wheelY - 5 - i * 5 - ((t * 0.3 + i * 5) % 12);
            const r = 4 + i * 1.3;
            this.ctx.beginPath();
            this.ctx.fillStyle = `rgba(210,210,210,${0.25 - i * 0.05})`;
            this.ctx.arc(px, py, r, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawLegendScreen() {
        this.ctx.fillStyle = 'rgba(255,255,255,0.08)';
        this.ctx.fillRect(40, 90, 720, 420);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '18px Courier New';
        this.ctx.textAlign = 'left';

        // Sprite/icon key (drawn to match in-game visuals)
        // Papa Sandy mini-sprite: grey hair + face + white shirt + blue shorts
        this.ctx.fillStyle = '#9AA0A6';
        this.ctx.fillRect(70, 124, 14, 6);
        this.ctx.fillStyle = '#E2B58F';
        this.ctx.fillRect(72, 130, 10, 6);
        this.ctx.fillStyle = '#F2F2F2';
        this.ctx.fillRect(70, 136, 14, 8);
        this.ctx.fillStyle = '#3E6FB8';
        this.ctx.fillRect(70, 144, 14, 8);
        this.ctx.fillStyle = '#1F1F1F';
        this.ctx.fillRect(71, 152, 4, 3);
        this.ctx.fillRect(79, 152, 4, 3);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Papa Sandy (you)', 100, 145);

        // Gold bullion power-up (gold ingot)
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(70, 168, 18, 18);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.fillText('🪙', 74, 182);
        this.ctx.font = '18px Courier New';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Gold bullion (collect 2 per world)', 100, 183);

        // Tire icon (matches in-game tire/rim)
        this.ctx.beginPath();
        this.ctx.fillStyle = '#111111';
        this.ctx.arc(82, 214, 12, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.fillStyle = '#9E9E9E';
        this.ctx.arc(82, 214, 5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#555555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(82, 214, 10, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Tire: E to push or throw (auto-picks best)', 100, 220);

        // Enemy strip: crab body/claws + minion aura block + coconut sphere
        this.ctx.fillStyle = '#FF6347'; // crab body
        this.ctx.fillRect(70, 242, 18, 10);
        this.ctx.fillRect(67, 244, 5, 3);
        this.ctx.fillRect(86, 244, 5, 3);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(74, 239, 3, 3);
        this.ctx.fillRect(81, 239, 3, 3);

        this.ctx.fillStyle = '#4B0082'; // minion
        this.ctx.fillRect(98, 238, 16, 16);
        this.ctx.strokeStyle = '#8a5cff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(97, 237, 18, 18);

        this.ctx.beginPath(); // coconut
        this.ctx.fillStyle = '#8B4513';
        this.ctx.arc(131, 246, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#654321';
        this.ctx.beginPath();
        this.ctx.arc(131, 246, 5, 0.4, Math.PI - 0.4);
        this.ctx.stroke();

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Enemies: crab / minion / coconut', 150, 253);

        // Final cue icon row: Corvette + Dr.vette silhouette
        this.ctx.fillStyle = '#FDFDFD';
        this.ctx.fillRect(70, 282, 58, 12);
        this.ctx.fillRect(86, 272, 26, 10);
        this.ctx.fillStyle = '#B0C4DE';
        this.ctx.fillRect(90, 274, 18, 6);
        this.ctx.fillStyle = '#1E1E1E';
        this.ctx.fillRect(76, 293, 10, 8);
        this.ctx.fillRect(109, 293, 10, 8);

        this.ctx.fillStyle = '#9AA0A6'; // Dr.vette hair
        this.ctx.fillRect(142, 268, 10, 5);
        this.ctx.fillStyle = '#EBC9A8';
        this.ctx.fillRect(143, 273, 8, 6);
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(141, 279, 12, 16);

        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillText('Final cue: White Corvette + Dr.vette boss', 180, 290);

        this.ctx.fillStyle = '#CFE8FF';
        this.ctx.fillText('Controls: Move Arrows/A,D | Jump Space/W/Up | Action E (mount/interact/throw)', 70, 350);
        this.ctx.fillText('Mobile: Use on-screen buttons (← ↑ 🛞 E)', 70, 382);

        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.fillText('Press SPACE / ENTER / TAP to begin!', 70, 440);
    }
    
    handleStorySkip() {
        // Prevent accidental instant skips from initial key/touch events
        if (this.gameState === 'SPLASH' && this.splashSkipLocked) return;

        // Ensure intro is visible briefly before allowing transition
        if (this.storyMode === 'INTRO' && this.storyTimer < 45) return;

        if (this.storyMode === 'INTRO') {
            this.startStory('LEGEND');
            return;
        }

        if (this.storyMode === 'LEGEND') {
            this.startGame();
            return;
        }

        this.gameState = 'PLAYING';
        this.playBackgroundMusic();
    }

    startGame() {
        this.currentWorld = 1;
        this.score = 0;
        this.levelCompleted = false;
        this.papaSandy.health = 3;
        this.initializeWorld(1);
        this.bossBattle = null;
        this.winCelebrationStart = 0;
        this.resetPlayerForWorldStart();

        // Start gameplay immediately after intro + legend flow.
        this.gameState = 'PLAYING';
        this.playBackgroundMusic();
    }
    
    showWorldIntro() {
        this.startStory('WORLD_' + this.currentWorld);
    }
}
