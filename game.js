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
        this.gamePhase = 6; // Enhanced Phase 6
        
        // Game states: SPLASH, MENU, STORY, PLAYING, PAUSED, GAME_OVER, VICTORY
        this.gameState = 'SPLASH';
        this.stateStartTime = Date.now();
        
        // Phase 6: Difficulty System
        this.difficultySettings = {
            easy: {
                name: "Easy Mode",
                description: "Perfect for beginners and family play",
                settings: {
                    playerHitBoxMultiplier: 1.5,
                    enemySpeedMultiplier: 0.7,
                    powerUpFrequency: 1.5,
                    lives: 5,
                    jumpPower: 1.2,
                    tireRollSpeed: 0.8,
                    platformWidthMultiplier: 1.3,
                    enemyDamage: 0.5
                }
            },
            medium: {
                name: "Medium Mode", 
                description: "Balanced challenge for experienced players",
                settings: {
                    playerHitBoxMultiplier: 1.0,
                    enemySpeedMultiplier: 1.0,
                    powerUpFrequency: 1.0,
                    lives: 3,
                    jumpPower: 1.0,
                    tireRollSpeed: 1.0,
                    platformWidthMultiplier: 1.0,
                    enemyDamage: 1.0
                }
            },
            hard: {
                name: "Hard Mode",
                description: "Ultimate challenge for expert players",
                settings: {
                    playerHitBoxMultiplier: 0.7,
                    enemySpeedMultiplier: 1.5,
                    powerUpFrequency: 0.6,
                    lives: 1,
                    jumpPower: 0.9,
                    tireRollSpeed: 1.3,
                    platformWidthMultiplier: 0.8,
                    enemyDamage: 1.5
                }
            }
        };
        
        this.selectedDifficulty = 'medium';
        this.showingDifficultyMenu = false;
        
        // Phase 6: World System
        this.currentWorld = 1;
        this.completedWorlds = new Set();
        this.worldProgress = {
            1: { levels: [false, false, false, false], unlocked: true },
            2: { levels: [false, false, false, false], unlocked: false },
            3: { levels: [false, false, false, false], unlocked: false }
        };
        
        // Phase 6: Enhanced Story System
        this.storySequences = {
            opening: null,
            worldTransitions: {},
            characterInteractions: [],
            drVetteBackstory: false
        };
        
        // Phase 6: World-specific configurations
        this.worldConfigs = {
            1: { // Beach World
                name: "Beach Paradise",
                background: "beach-sunset",
                music: "tropical",
                papaSandyOutfit: "hawaiian",
                theme: "retirement_florida"
            },
            2: { // Cowboy World  
                name: "Cowboy Country",
                background: "western-sunset",
                music: "country",
                papaSandyOutfit: "western",
                theme: "younger_adventures"
            },
            3: { // Jungle World
                name: "Tropical Jungle",
                background: "jungle-dense",
                music: "jungle",
                papaSandyOutfit: "explorer",
                theme: "paradise_restoration"
            }
        };
        
        this.currentWorldConfig = this.worldConfigs[1];
        
        // Victory screen properties
        this.victoryScreen = {
            isActive: false,
            title: "VICTORY!",
            subtitle: "Papa Sandy Rescued His Corvette!",
            celebrationTime: 0,
            finalStats: {
                score: 0,
                time: 0,
                enemiesDefeated: 0,
                barriersDestroyed: 0,
                powerUpsCollected: 0
            },
            showStats: false,
            confetti: [],
            corvetteX: 0,
            corvetteY: 0,
            papaSandyVictoryPose: 0,
            cameraShake: 0,
            screenFlash: 0
        };
        
        // Splash screen properties
        this.splashScreen = {
            title: "SANDYLAND",
            subtitle: "Papa Sandy's Corvette Rescue Mission",
            currentLine: 0,
            lines: [
                "",
                "",
                "A loving tribute to Papa Sandy",
                "",
                "",
                "Once upon a time in the tropical paradise...",
                "",
                "Papa Sandy, with his signature grey hair",
                "and colorful Hawaiian shirt, finally",
                "achieved his dream - a beautiful white Corvette!",
                "",
                "But his ex-wife, the jealous Dr.vette,",
                "was furious that he finally had what she",
                "never let him have during their marriage.",
                "",
                "In a fit of spite, she stole his prized",
                "Corvette and hid it in her secret veterinary",
                "clinic fortress deep in the tropical jungle!",
                "",
                "Now Papa Sandy must use his tire-rolling",
                "skills from his days as a tractor tire",
                "salesman to rescue his beloved car!",
                "",
                "",
                "Are you ready to help Papa Sandy",
                "save his Corvette and restore",
                "the tropical paradise?",
                "",
                "",
                "Press SPACEBAR to begin your adventure!"
            ],
            typewriterSpeed: 80,
            lastLineTime: 0
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
            onGround: true,
            direction: 1, // 1 for right, -1 for left
            isRollingTire: false,
            
            // Character design specs
            headHeight: 12,
            bodyHeight: 20,
            legHeight: 16,
            isShort: true,
            hasThickBuild: true,
            hasGreyHair: true,
            hasFacialHair: false,
            wearsHawaiianShirt: true
        };
        
        // Pause menu properties
        this.pauseMenu = {
            isActive: false,
            selectedIndex: 0,
            options: [
                "RESUME GAME",
                "RESTART STORY",
                "VIEW STORY",
                "QUIT TO MENU"
            ]
        };
        
        // Story presentation system
        this.storySequences = [
            {
                id: "opening",
                title: "The Rescue Mission Begins",
                text: [
                    "Papa Sandy stands at the edge of Sandyland,",
                    "determined to rescue his beloved Corvette.",
                    "",
                    "The tropical breeze rustles through the palm",
                    "trees as he prepares for his adventure.",
                    "",
                    "His years as a tractor tire salesman have",
                    "prepared him for this moment - the tire",
                    "rolling skills will be crucial!"
                ],
                trigger: "game_start"
            },
            {
                id: "first_powerup",
                title: "A Helping Hand",
                text: [
                    "Papa Sandy discovers a magical tire!",
                    "This Super Tire will help him roll",
                    "faster and break through barriers!",
                    "",
                    "With his enhanced abilities, nothing",
                    "can stop him from reaching Dr.vette's",
                    "clinic fortress!"
                ],
                trigger: "first_powerup"
            },
            {
                id: "barrier_break",
                title: "Breaking Through",
                text: [
                    "Using his tire-rolling expertise,",
                    "Papa Sandy smashes through the",
                    "barriers blocking his path.",
                    "",
                    "The sound of breaking barriers echoes",
                    "through Sandyland as he gets closer",
                    "to his goal!"
                ],
                trigger: "barrier_break"
            }
        ];
        
        this.currentStorySequence = null;
        this.storySequenceStartTime = 0;
        
        // Tractor tires for rolling mechanics
        this.tires = [
            {
                x: 300,
                y: this.groundY - 40,
                width: 40,
                height: 40,
                velocityX: 0,
                velocityY: 0,
                isRolling: false,
                canPush: true,
                mass: 2
            },
            {
                x: 500,
                y: this.groundY - 40,
                width: 40,
                height: 40,
                velocityX: 0,
                velocityY: 0,
                isRolling: false,
                canPush: true,
                mass: 2
            }
        ];
        
        // Barriers that can be destroyed
        this.barriers = [
            { x: 250, y: this.groundY - 60, width: 30, height: 60, health: 3, maxHealth: 3 },
            { x: 400, y: this.groundY - 60, width: 30, height: 60, health: 3, maxHealth: 3 },
            { x: 550, y: this.groundY - 60, width: 30, height: 60, health: 3, maxHealth: 3 }
        ];
        
        // Basic enemies
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
                alive: true
            },
            {
                type: 'coconut',
                x: 600,
                y: this.groundY - 40,
                width: 24,
                height: 24,
                velocityX: 2,
                direction: -1,
                patrolStart: 550,
                patrolEnd: 750,
                alive: true
            }
        ];
        
        // Level platforms for collision detection
        this.platforms = [
            { x: 0, y: this.groundY, width: 800, height: 100 }, // Ground
            { x: 200, y: 400, width: 150, height: 20 },
            { x: 450, y: 350, width: 120, height: 20 },
            { x: 650, y: 420, width: 100, height: 20 }
        ];
        
        // Background elements for tropical feel
        this.palms = [
            { x: 50, y: 300, scale: 0.8 },
            { x: 700, y: 280, scale: 1.0 },
            { x: 350, y: 320, scale: 0.6 }
        ];
        
        // Dr.vette storyline elements
        this.storyElements = {
            missionText: "Rescue Papa Sandy's Corvette from Dr.vette!",
            currentObjective: "Roll tires to break barriers and reach the clinic!",
            enemiesDefeated: 0,
            barriersDestroyed: 0
        };
        
        // Power-ups system
        this.powerUps = [];
        this.activePowerUps = [];
        this.powerUpEffects = {
            superTire: { duration: 10000, color: '#FFD700', name: 'Super Tire' },
            medicalKit: { duration: 8000, color: '#FF69B4', name: 'Medical Kit' },
            tropicalEnergy: { duration: 6000, color: '#00FF00', name: 'Tropical Energy' }
        };
        
        // Enhanced Sound effects using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
            // Enhanced collection sounds with chord progressions
            collectPowerUp: () => this.playChord([440, 554, 659], 0.15, 'sine'), // A major chord
            superTireCollect: () => this.playChord([523, 659, 784], 0.2, 'sine'),   // C major chord
            medicalKitCollect: () => this.playChord([349, 440, 523], 0.15, 'sine'), // F major chord
            
            // Enhanced jump sounds with pitch bend
            jump: () => this.playPitchBend(220, 440, 0.15, 'triangle'),
            superJump: () => this.playPitchBend(330, 660, 0.2, 'triangle'),
            
            // Enhanced tire rolling with engine-like sounds
            rollTire: () => this.playEngineSound(110, 0.3),
            superRollTire: () => this.playEngineSound(165, 0.4),
            
            // Enhanced destruction sounds with reverb
            destroyBarrier: () => this.playDestructionSound(330, 0.3),
            barrierBreak: () => this.playDestructionSound(220, 0.4),
            
            // Enhanced enemy defeat sounds
            enemyDefeat: () => this.playEnemyDefeat(880, 0.1),
            enemyCrush: () => this.playEnemyDefeat(440, 0.15),
            
            // Victory and celebration sounds
            victoryFanfare: null, // Will be set during victory
            levelComplete: () => this.playLevelComplete(),
            
            // Environmental sounds
            footstep: () => this.playFootstep(),
            land: () => this.playLandSound(),
            
            // Enhanced power-up activation sounds
            powerUpActivate: () => this.playPowerUpActivate(),
            
            // Game state sounds
            gameOver: null, // Will be set during game over
            pause: () => this.playPauseSound(),
            resume: () => this.playResumeSound()
        };
        
        // Particle effects system
        this.particles = [];
        
        // Enhanced UI elements
        this.score = 0;
        this.lives = 3;
        this.gameStartTime = Date.now();
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle pause menu (ESC or P key)
            if ((e.code === 'Escape' || e.code === 'KeyP') && this.gameState === 'PLAYING') {
                this.togglePause();
                e.preventDefault();
            }
            
            // Handle pause menu navigation
            if (this.gameState === 'PAUSED') {
                if (e.code === 'ArrowUp') {
                    this.pauseMenu.selectedIndex = (this.pauseMenu.selectedIndex - 1 + this.pauseMenu.options.length) % this.pauseMenu.options.length;
                    e.preventDefault();
                } else if (e.code === 'ArrowDown') {
                    this.pauseMenu.selectedIndex = (this.pauseMenu.selectedIndex + 1) % this.pauseMenu.options.length;
                    e.preventDefault();
                } else if (e.code === 'Enter' || e.code === 'Space') {
                    this.handlePauseMenuSelection();
                    e.preventDefault();
                }
            }
            
            // Handle splash screen progression
            if (this.gameState === 'SPLASH' && e.code === 'Space') {
                this.advanceStory();
                e.preventDefault();
            }
            
            // Handle story screen progression
            if (this.gameState === 'STORY' && e.code === 'Space') {
                this.advanceStory();
                e.preventDefault();
            }
            
            // Handle victory screen progression
            if (this.gameState === 'VICTORY' && e.code === 'Space') {
                this.restartGame();
                e.preventDefault();
            }
            
            // Phase 6: Enhanced menu handling
            if (this.gameState === 'MENU') {
                if (this.menuType === 'difficulty') {
                    this.handleDifficultyMenuInput(e);
                } else if (this.menuType === 'world') {
                    this.handleWorldMenuInput(e);
                }
                e.preventDefault();
            }
            
            // Handle escape from menus
            if (e.code === 'Escape' && this.gameState === 'MENU') {
                this.gameState = 'SPLASH';
                this.showingDifficultyMenu = false;
                e.preventDefault();
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Spawn power-ups periodically
        setInterval(() => this.spawnPowerUp(), 15000);
    }
    
    // Enhanced Sound effect creation methods
    createSound(frequency, duration, waveType) {
        return () => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = waveType;
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }
    
    // Play chord progression for richer sounds
    playChord(frequencies, duration, waveType) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = waveType;
                
                gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
            }, index * 50); // Stagger chord notes
        });
    }
    
    // Pitch bend effects for dynamic sounds
    playPitchBend(startFreq, endFreq, duration, waveType) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(startFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(endFreq, this.audioContext.currentTime + duration);
        oscillator.type = waveType;
        
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Engine-like rolling sound
    playEngineSound(baseFreq, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Create rumbling engine effect
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.audioContext.currentTime + duration);
        
        // Low-pass filter for rumble effect
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(200, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + duration);
        
        gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Destruction sound with reverb effect
    playDestructionSound(frequency, duration) {
        // Primary sound
        const oscillator1 = this.audioContext.createOscillator();
        const oscillator2 = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator1.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator1.type = 'square';
        
        oscillator2.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
        oscillator2.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator1.start(this.audioContext.currentTime);
        oscillator2.start(this.audioContext.currentTime);
        oscillator1.stop(this.audioContext.currentTime + duration);
        oscillator2.stop(this.audioContext.currentTime + duration);
    }
    
    // Enemy defeat sound with impact effect
    playEnemyDefeat(frequency, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Quick pitch drop for impact
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.3, this.audioContext.currentTime + duration);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.06, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // Level complete fanfare
    playLevelComplete() {
        const notes = [523, 659, 784, 1047]; // C, E, G, C (higher octave)
        const durations = [0.2, 0.2, 0.3, 0.4];
        
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + durations[index]);
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + durations[index]);
            }, index * 150);
        });
    }
    
    // Footstep sound
    playFootstep() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(80, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.05);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(0.03, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.05);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
    }
    
    // Landing sound
    playLandSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.1);
        oscillator.type = 'triangle';
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
    
    // Power-up activation sound
    playPowerUpActivate() {
        this.playChord([659, 831, 988], 0.3, 'sine'); // E major chord with higher notes
    }
    
    // Pause sound
    playPauseSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // Resume sound
    playResumeSound() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }
    
    // Power-up spawning
    spawnPowerUp() {
        if (this.powerUps.length >= 3) return; // Limit active power-ups
        
        const types = ['superTire', 'medicalKit', 'tropicalEnergy'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const powerUp = {
            id: Date.now() + Math.random(),
            type: type,
            x: Math.random() * (this.canvas.width - 40) + 20,
            y: Math.random() * (this.canvas.height - 200) + 50,
            width: 30,
            height: 30,
            collected: false,
            bounce: 0,
            glow: 0
        };
        
        this.powerUps.push(powerUp);
    }
    
    // Enhanced Particle effect system
    createParticles(x, y, color, count = 10, options = {}) {
        for (let i = 0; i < count; i++) {
            const particle = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                color: color,
                size: Math.random() * 4 + 2,
                gravity: 0.3,
                bounce: options.bounce || 0.5,
                fade: options.fade || true,
                sparkle: options.sparkle || false,
                trail: options.trail || false
            };
            
            // Apply custom options
            if (options.vx) particle.vx = options.vx;
            if (options.vy) particle.vy = options.vy;
            if (options.life) particle.life = particle.maxLife = options.life;
            if (options.size) particle.size = options.size;
            
            this.particles.push(particle);
        }
    }
    
    // Special particle effects for key moments
    createExplosion(x, y, color, count = 20) {
        // Radial explosion effect
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = Math.random() * 6 + 2;
            this.createParticles(x, y, color, 1, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 40,
                size: Math.random() * 6 + 3,
                fade: true,
                sparkle: true
            });
        }
    }
    
    createMagicBurst(x, y, color = '#FFD700', count = 15) {
        // Magical burst with spiral effect
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
            const speed = Math.random() * 4 + 1;
            this.createParticles(x, y, color, 1, {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2, // Slight upward bias
                life: 50,
                size: Math.random() * 4 + 2,
                fade: true,
                sparkle: true
            });
        }
    }
    
    createCelebrationBurst(x, y, colors, count = 25) {
        // Multi-colored celebration burst
        colors.forEach(color => {
            for (let i = 0; i < count / colors.length; i++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.createParticles(x, y, color, 1, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: 60,
                    size: Math.random() * 5 + 2,
                    fade: true,
                    sparkle: true
                });
            }
        });
    }
    
    createRainEffect(x, y, color = '#00BFFF', count = 5) {
        // Gentle rain drop effect
        for (let i = 0; i < count; i++) {
            this.createParticles(x + Math.random() * 20 - 10, y, color, 1, {
                vx: (Math.random() - 0.5) * 2,
                vy: Math.random() * 3 + 2,
                life: 40,
                size: Math.random() * 3 + 1,
                gravity: 0.5
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Enhanced particle physics
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity || 0.3; // Custom gravity
            
            // Bounce effect for certain particles
            if (particle.bounce && particle.y > this.groundY) {
                particle.y = this.groundY;
                particle.vy *= -particle.bounce;
                particle.vx *= 0.8; // Friction
            }
            
            // Fade effect
            if (particle.fade) {
                particle.alpha = particle.life / particle.maxLife;
            }
            
            // Sparkle effect - add extra particles
            if (particle.sparkle && Math.random() < 0.1) {
                this.createParticles(
                    particle.x + (Math.random() - 0.5) * 4,
                    particle.y + (Math.random() - 0.5) * 4,
                    particle.color,
                    1,
                    {
                        vx: (Math.random() - 0.5) * 2,
                        vy: (Math.random() - 0.5) * 2,
                        life: 10,
                        size: 1
                    }
                );
            }
            
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Power-up activation and management
    activatePowerUp(type) {
        const effect = this.powerUpEffects[type];
        this.sounds.collectPowerUp();
        
        // Remove existing power-up of same type
        this.activePowerUps = this.activePowerUps.filter(p => p.type !== type);
        
        // Add new power-up
        this.activePowerUps.push({
            type: type,
            startTime: Date.now(),
            effect: effect
        });
        
        // Create collection effect
        this.createParticles(this.papaSandy.x + this.papaSandy.width/2, 
                           this.papaSandy.y + this.papaSandy.height/2, 
                           effect.color, 20);
        
        // Play enhanced collection sound based on power-up type
        if (type === 'superTire') {
            this.sounds.superTireCollect();
        } else if (type === 'medicalKit') {
            this.sounds.medicalKitCollect();
        } else {
            this.sounds.collectPowerUp();
        }
        
        // Play power-up activation sound
        this.sounds.powerUpActivate();
        
        this.score += 100;
    }
    
    updateActivePowerUps() {
        const currentTime = Date.now();
        
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            
            if (currentTime - powerUp.startTime > powerUp.effect.duration) {
                this.activePowerUps.splice(i, 1);
            }
        }
    }
    
    // Phase 6: Difficulty and World Management Methods
    showDifficultyMenu() {
        this.gameState = 'MENU';
        this.showingDifficultyMenu = true;
        this.menuType = 'difficulty';
    }
    
    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        this.applyDifficultySettings();
        this.startWorld();
    }
    
    applyDifficultySettings() {
        const difficulty = this.difficultySettings[this.selectedDifficulty];
        const settings = difficulty.settings;
        
        // Apply difficulty settings to game mechanics
        this.papaSandy.speed = 4 * settings.tireRollSpeed;
        this.papaSandy.jumpPower = 15 * settings.jumpPower;
        this.lives = settings.lives;
        
        // Apply settings to existing enemies and platforms
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                enemy.speed = (enemy.baseSpeed || 2) * settings.enemySpeedMultiplier;
                enemy.damage = (enemy.baseDamage || 1) * settings.enemyDamage;
            });
        }
        
        if (this.platforms) {
            this.platforms.forEach(platform => {
                if (platform.widthMultiplier) {
                    platform.width *= settings.platformWidthMultiplier;
                }
            });
        }
    }
    
    switchToWorld(worldNumber) {
        if (worldNumber >= 1 && worldNumber <= 3) {
            this.currentWorld = worldNumber;
            this.currentWorldConfig = this.worldConfigs[worldNumber];
            this.playWorldTransition(worldNumber);
            this.loadWorldAssets(worldNumber);
        }
    }
    
    playWorldTransition(worldNumber) {
        // Create world transition effect
        this.transitionEffect = {
            isActive: true,
            startTime: Date.now(),
            duration: 2000,
            worldNumber: worldNumber,
            fadeAlpha: 1.0
        };
        
        // Play transition sound
        this.sounds.worldTransition();
    }
    
    loadWorldAssets(worldNumber) {
        const world = this.worldConfigs[worldNumber];
        
        // Update background and theme
        this.background = world.background;
        this.currentTheme = world.theme;
        
        // Update Papa Sandy's outfit based on world
        this.papaSandy.currentOutfit = world.papaSandyOutfit;
        
        // Load world-specific story elements
        this.loadWorldStoryElements(worldNumber);
    }
    
    // Phase 6: Menu Input Handling
    handleDifficultyMenuInput(e) {
        if (e.code === 'ArrowUp') {
            const difficulties = ['easy', 'medium', 'hard'];
            const currentIndex = difficulties.indexOf(this.selectedDifficulty);
            this.selectedDifficulty = difficulties[(currentIndex - 1 + difficulties.length) % difficulties.length];
            e.preventDefault();
        } else if (e.code === 'ArrowDown') {
            const difficulties = ['easy', 'medium', 'hard'];
            const currentIndex = difficulties.indexOf(this.selectedDifficulty);
            this.selectedDifficulty = difficulties[(currentIndex + 1) % difficulties.length];
            e.preventDefault();
        } else if (e.code === 'Space' || e.code === 'Enter') {
            this.selectDifficulty(this.selectedDifficulty);
            e.preventDefault();
        }
    }
    
    handleWorldMenuInput(e) {
        if (e.code === 'ArrowUp') {
            if (this.currentWorld > 1) {
                this.currentWorld--;
                while (!this.worldProgress[this.currentWorld].unlocked && this.currentWorld > 1) {
                    this.currentWorld--;
                }
            }
            e.preventDefault();
        } else if (e.code === 'ArrowDown') {
            if (this.currentWorld < 3) {
                this.currentWorld++;
                while (!this.worldProgress[this.currentWorld].unlocked && this.currentWorld < 3) {
                    this.currentWorld++;
                }
            }
            e.preventDefault();
        } else if (e.code === 'Space' || e.code === 'Enter') {
            if (this.worldProgress[this.currentWorld].unlocked) {
                this.startWorld();
            }
            e.preventDefault();
        }
    }
    
    // Phase 6: Enhanced Story Navigation
    advanceStory() {
        if (this.gameState === 'SPLASH') {
            this.gameState = 'MENU';
            this.menuType = 'difficulty';
            this.showingDifficultyMenu = true;
        } else if (this.gameState === 'STORY') {
            if (this.storySequence === 'world_start' && this.currentStoryTexts) {
                this.currentStoryIndex++;
                if (this.currentStoryIndex >= this.currentStoryTexts.length) {
                    this.gameState = 'PLAYING';
                    this.loadLevel(1); // Load first level of current world
                }
            }
        } else if (this.gameState === 'MENU') {
            if (this.menuType === 'difficulty') {
                // Start the game with selected difficulty
                this.selectDifficulty(this.selectedDifficulty);
            }
        }
    }
    
    loadWorldStoryElements(worldNumber) {
        const worldStories = {
            1: [ // Beach World
                "Welcome to Beach Paradise! Papa Sandy's retirement years in Florida...",
                "The sandy beaches remind Papa Sandy of his peaceful retirement days.",
                "Dr.vette's beach front clinic is just ahead! Be careful!"
            ],
            2: [ // Cowboy World
                "Howdy partner! Welcome to Cowboy Country!",
                "This brings back memories of Papa Sandy's younger adventurous days.",
                "Watch out for Dr.vette's cowboy minions and lasso traps!",
                "Yeehaw! Let's round up those tires!"
            ],
            3: [ // Jungle World
                "The dense jungle holds many secrets and challenges.",
                "Dr.vette's veterinary fortress is hidden deep within these jungles.",
                "Papa Sandy must use all his skills to rescue his Corvette!",
                "This tropical paradise must be saved!"
            ]
        };
        
        this.currentStoryTexts = worldStories[worldNumber] || [];
        this.currentStoryIndex = 0;
    }
    
    showWorldComplete(worldNumber) {
        this.worldProgress[worldNumber].levels.forEach((level, index) => {
            if (level) {
                this.worldProgress[worldNumber].levels[index] = true;
            }
        });
        
        // Unlock next world
        if (worldNumber < 3) {
            this.worldProgress[worldNumber + 1].unlocked = true;
        }
        
        this.completedWorlds.add(worldNumber);
        this.showVictoryScreen(true);
    }
    
    startWorld() {
        this.gameState = 'STORY';
        this.storySequence = 'world_start';
        this.stateStartTime = Date.now();
        
        // Apply world-specific settings
        this.switchToWorld(this.currentWorld);
        
        // Reset game state for new world
        this.score = 0;
        this.enemiesDefeated = 0;
        this.barriersDestroyed = 0;
        this.powerUpsCollected = 0;
        this.gameStartTime = Date.now();
        this.papaSandy.x = 100;
        this.papaSandy.y = this.groundY;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
    }
    
    update() {
        const updateStart = performance.now();
        
        // Performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.startUpdate();
        }
        
        // Update game systems with performance optimization
        this.updatePapaSandy();
        this.updateTires();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateActivePowerUps();
        this.updateParticles();
        this.checkCollisions();
        
        // Performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.endUpdate();
        }
        
        // Performance optimization: Limit particle count
        if (this.particles.length > 200) {
            this.particles = this.particles.slice(-200);
        }
        
        // Performance optimization: Limit confetti count
        if (this.victoryScreen.confetti.length > 200) {
            this.victoryScreen.confetti = this.victoryScreen.confetti.slice(-200);
        }
    }
    
    updateTires() {
        for (let tire of this.tires) {
            if (tire.isRolling) {
                // Apply physics to rolling tires
                tire.velocityY += this.gravity;
                tire.x += tire.velocityX;
                tire.y += tire.velocityY;
                
                // Friction for rolling
                tire.velocityX *= 0.95;
                
                // Stop rolling when velocity is low
                if (Math.abs(tire.velocityX) < 0.1) {
                    tire.isRolling = false;
                    tire.velocityX = 0;
                    tire.velocityY = 0;
                }
                
                // Keep tires within bounds
                if (tire.x < 0) {
                    tire.x = 0;
                    tire.velocityX = Math.abs(tire.velocityX) * 0.5;
                }
                if (tire.x + tire.width > this.canvas.width) {
                    tire.x = this.canvas.width - tire.width;
                    tire.velocityX = -Math.abs(tire.velocityX) * 0.5;
                }
            }
        }
    }
    
    updateEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            // Simple patrol AI
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
    
    updatePapaSandy() {
        // Apply power-up effects
        let currentSpeed = this.papaSandy.speed;
        let currentJumpPower = this.papaSandy.jumpPower;
        
        for (let powerUp of this.activePowerUps) {
            if (powerUp.type === 'tropicalEnergy') {
                currentSpeed *= 1.5;
                currentJumpPower *= 1.3;
            } else if (powerUp.type === 'superTire') {
                currentSpeed *= 1.2;
            }
        }
        
        // Handle horizontal movement
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
            this.papaSandy.velocityY = -currentJumpPower;
            this.papaSandy.onGround = false;
            
            // Play enhanced jump sound with power-up effects
            if (this.activePowerUps.some(p => p.type === 'tropicalEnergy')) {
                this.sounds.superJump();
            } else {
                this.sounds.jump();
            }
        }
        
        // Handle tire rolling (B key)
        if (this.keys['KeyB'] && this.papaSandy.onGround) {
            this.rollNearestTire();
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
    }
    
    rollNearestTire() {
        let nearestTire = null;
        let minDistance = Infinity;
        
        // Find the nearest tire
        for (let tire of this.tires) {
            if (tire.canPush) {
                const distance = Math.abs(this.papaSandy.x - tire.x);
                if (distance < minDistance && distance < 60) {
                    minDistance = distance;
                    nearestTire = tire;
                }
            }
        }
        
        // Roll the nearest tire
        if (nearestTire) {
            nearestTire.isRolling = true;
            
            // Enhanced tire rolling with power-up effects
            let rollSpeed = 3;
            if (this.activePowerUps.some(p => p.type === 'superTire')) {
                rollSpeed *= 1.5; // Super tires roll faster
            }
            
            nearestTire.velocityX = this.papaSandy.direction * rollSpeed;
            nearestTire.velocityY = -2; // Small hop when rolling
            
            // Play enhanced tire rolling sound based on power-up status
            if (this.activePowerUps.some(p => p.type === 'superTire')) {
                this.sounds.superRollTire();
            } else {
                this.sounds.rollTire();
            }
            
            // Check if tire hits a barrier
            for (let barrier of this.barriers) {
                if (this.checkTireBarrierCollision(nearestTire, barrier)) {
                    barrier.health--;
                    if (barrier.health <= 0) {
                        barrier.health = 0;
                        this.storyElements.barriersDestroyed++;
                        this.createDestructionEffect(barrier.x, barrier.y);
                    }
                }
            }
        }
    }
    
    checkCollisions() {
        this.papaSandy.onGround = false;
        
        // Check Papa Sandy collisions
        this.checkPapaSandyCollisions();
        
        // Check tire collisions
        this.checkTireCollisions();
        
        // Check enemy collisions
        this.checkEnemyCollisions();
    }
    
    checkPapaSandyCollisions() {
        for (let platform of this.platforms) {
            // Check if Papa Sandy collides with platform
            if (this.papaSandy.x < platform.x + platform.width &&
                this.papaSandy.x + this.papaSandy.width > platform.x &&
                this.papaSandy.y < platform.y + platform.height &&
                this.papaSandy.y + this.papaSandy.height > platform.y) {
                
                // Landing on top of platform
                if (this.papaSandy.velocityY > 0 && 
                    this.papaSandy.y < platform.y) {
                    this.papaSandy.y = platform.y - this.papaSandy.height;
                    this.papaSandy.velocityY = 0;
                    this.papaSandy.onGround = true;
                }
                // Hitting platform from below
                else if (this.papaSandy.velocityY < 0 && 
                         this.papaSandy.y > platform.y) {
                    this.papaSandy.y = platform.y + platform.height;
                    this.papaSandy.velocityY = 0;
                }
                // Side collisions
                else if (this.papaSandy.velocityX > 0) {
                    this.papaSandy.x = platform.x - this.papaSandy.width;
                    this.papaSandy.velocityX = 0;
                } else if (this.papaSandy.velocityX < 0) {
                    this.papaSandy.x = platform.x + platform.width;
                    this.papaSandy.velocityX = 0;
                }
            }
        }
        
        // Check Papa Sandy - tire collisions
        for (let tire of this.tires) {
            if (this.papaSandy.x < tire.x + tire.width &&
                this.papaSandy.x + this.papaSandy.width > tire.x &&
                this.papaSandy.y < tire.y + tire.height &&
                this.papaSandy.y + this.papaSandy.height > tire.y) {
                
                // Push tire away from Papa Sandy
                if (this.papaSandy.velocityX > 0) {
                    tire.x = this.papaSandy.x + this.papaSandy.width;
                    tire.velocityX = 1;
                } else if (this.papaSandy.velocityX < 0) {
                    tire.x = this.papaSandy.x - tire.width;
                    tire.velocityX = -1;
                }
            }
        }
    }
    
    checkTireCollisions() {
        for (let tire of this.tires) {
            // Platform collisions for tires
            for (let platform of this.platforms) {
                if (tire.x < platform.x + platform.width &&
                    tire.x + tire.width > platform.x &&
                    tire.y < platform.y + platform.height &&
                    tire.y + tire.height > platform.y) {
                    
                    // Landing on top
                    if (tire.velocityY > 0 && tire.y < platform.y) {
                        tire.y = platform.y - tire.height;
                        tire.velocityY = 0;
                    }
                }
            }
        }
    }
    
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            
            // Animate power-up
            powerUp.bounce += 0.1;
            powerUp.glow += 0.05;
            
            // Check collision with Papa Sandy
            if (this.papaSandy.x < powerUp.x + powerUp.width &&
                this.papaSandy.x + this.papaSandy.width > powerUp.x &&
                this.papaSandy.y < powerUp.y + powerUp.height &&
                this.papaSandy.y + this.papaSandy.height > powerUp.y) {
                
                // Collect power-up
                this.activatePowerUp(powerUp.type);
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    checkEnemyCollisions() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (this.papaSandy.x < enemy.x + enemy.width &&
                this.papaSandy.x + this.papaSandy.width > enemy.x &&
                this.papaSandy.y < enemy.y + enemy.height &&
                this.papaSandy.y + this.papaSandy.height > enemy.y) {
                
                // Check if medical kit power-up is active
                const hasMedicalKit = this.activePowerUps.some(p => p.type === 'medicalKit');
                
                if (hasMedicalKit) {
                    // Medical kit automatically defeats enemies
                    enemy.alive = false;
                    this.storyElements.enemiesDefeated++;
                    this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF69B4', 15);
                    this.score += 50;
                } else if (this.papaSandy.velocityY > 0) {
                    // Papa stomps on enemy
                    enemy.alive = false;
                    this.storyElements.enemiesDefeated++;
                    this.papaSandy.velocityY = -8; // Bounce up
                    
                    // Play enhanced enemy defeat sound
                    if (this.activePowerUps.some(p => p.type === 'medicalKit')) {
                        this.sounds.enemyCrush();
                    } else {
                        this.sounds.enemyDefeat();
                    }
                    
                    // Create enhanced enemy defeat effect
                    this.createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000', 15);
                    this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FFFF00', 8);
                    
                    // Add screen shake for dramatic effect
                    this.addScreenShake(2, 150);
                    this.score += 50;
                } else {
                    // Papa takes damage - bounce back
                    this.papaSandy.velocityX = this.papaSandy.direction * -5;
                    this.papaSandy.velocityY = -5;
                    this.lives--;
                    
                    if (this.lives <= 0) {
                        this.gameOver();
                    }
                }
            }
        }
    }
    
    checkTireBarrierCollision(tire, barrier) {
        return tire.x < barrier.x + barrier.width &&
               tire.x + tire.width > barrier.x &&
               tire.y < barrier.y + barrier.height &&
               tire.y + tire.height > barrier.y;
    }
    
    createDestructionEffect(x, y) {
        // Create enhanced destruction effect
        this.createExplosion(x + 15, y + 30, '#FFA500', 20);
        this.createParticles(x + 15, y + 30, '#FF6347', 10);
        
        // Play enhanced destruction sound
        this.sounds.destroyBarrier();
        
        // Add screen shake for dramatic effect
        this.addScreenShake(3, 200);
        
        this.score += 25;
        
        // Check victory condition - all barriers destroyed
        const allBarriersDestroyed = this.barriers.every(barrier => barrier.health <= 0);
        if (allBarriersDestroyed && this.gameState !== 'VICTORY') {
            this.triggerVictory();
        }
    }
    
    gameOver() {
        this.gameState = 'GAME_OVER';
        this.victoryScreen.finalStats = {
            score: this.score,
            time: Math.floor((Date.now() - this.gameStartTime) / 1000),
            enemiesDefeated: this.storyElements.enemiesDefeated,
            barriersDestroyed: this.storyElements.barriersDestroyed,
            powerUpsCollected: this.activePowerUps.length
        };
        this.victoryScreen.isActive = true;
        this.victoryScreen.showStats = true;
        this.victoryScreen.title = "GAME OVER";
        this.victoryScreen.subtitle = "Papa Sandy Needs to Try Again!";
        
        // Create dramatic game over particles
        this.createParticles(this.papaSandy.x + this.papaSandy.width/2, 
                           this.papaSandy.y + this.papaSandy.height/2, '#FF0000', 30);
        
        // Play game over sound
        this.sounds.gameOver = this.createSound(100, 0.5, 'sawtooth');
        this.sounds.gameOver();
    }
    
    triggerVictory() {
        this.gameState = 'VICTORY';
        this.victoryScreen.finalStats = {
            score: this.score,
            time: Math.floor((Date.now() - this.gameStartTime) / 1000),
            enemiesDefeated: this.storyElements.enemiesDefeated,
            barriersDestroyed: this.storyElements.barriersDestroyed,
            powerUpsCollected: this.activePowerUps.length
        };
        this.victoryScreen.isActive = true;
        this.victoryScreen.celebrationTime = Date.now();
        this.victoryScreen.showStats = false;
        
        // Position corvette for victory scene
        this.victoryScreen.corvetteX = this.canvas.width - 200;
        this.victoryScreen.corvetteY = this.groundY - 60;
        
        // Create massive victory celebration with dramatic effects
        this.createVictoryConfetti();
        this.createCelebrationBurst(
            this.papaSandy.x + this.papaSandy.width/2, 
            this.papaSandy.y + this.papaSandy.height/2, 
            ['#FFD700', '#FF69B4', '#00FFFF', '#FF0000'], 
            50
        );
        
        // Add dramatic screen shake and flash
        this.addScreenShake(15, 1000);
        this.addScreenFlash('#FFD700', 0.7, 500);
        
        // Play victory fanfare
        this.sounds.victoryFanfare = () => {
            // Create a multi-note victory fanfare
            const notes = [523, 659, 784, 1047]; // C, E, G, C (higher octave)
            notes.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    oscillator.type = 'sine';
                    
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                }, index * 150);
            });
        };
        this.sounds.victoryFanfare();
        
        // Create ongoing celebration effects
        setInterval(() => {
            if (this.gameState === 'VICTORY' && Math.random() < 0.3) {
                this.createMagicBurst(
                    Math.random() * this.canvas.width,
                    Math.random() * this.canvas.height / 2,
                    '#FFD700',
                    10
                );
            }
        }, 1000);
    }
    
    // Restart game method
    restartGame() {
        // Clear all game state
        this.papaSandy.x = 100;
        this.papaSandy.y = this.groundY;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
        this.papaSandy.onGround = true;
        this.papaSandy.direction = 1;
        
        // Reset tires
        this.tires.forEach((tire, index) => {
            tire.x = 300 + index * 200;
            tire.y = this.groundY - 40;
            tire.velocityX = 0;
            tire.velocityY = 0;
            tire.isRolling = false;
        });
        
        // Reset barriers
        this.barriers.forEach(barrier => {
            barrier.health = barrier.maxHealth;
        });
        
        // Reset enemies
        this.enemies.forEach(enemy => {
            enemy.alive = true;
            enemy.x = enemy.patrolStart;
        });
        
        // Reset power-ups
        this.powerUps = [];
        this.activePowerUps = [];
        
        // Reset particles
        this.particles = [];
        this.victoryScreen.confetti = [];
        
        // Reset game state
        this.score = 0;
        this.lives = 3;
        this.gameStartTime = Date.now();
        this.storyElements.enemiesDefeated = 0;
        this.storyElements.barriersDestroyed = 0;
        
        // Reset victory screen
        this.victoryScreen.isActive = false;
        this.victoryScreen.showStats = false;
        this.victoryScreen.cameraShake = null;
        this.victoryScreen.screenFlash = null;
        
        // Return to splash screen
        this.gameState = 'SPLASH';
        this.victoryScreen.currentLine = 0;
        
        // Play restart sound
        this.sounds.resume();
    }
    
    createVictoryConfetti() {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FFA500'];
        for (let i = 0; i < 100; i++) {
            this.victoryScreen.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2,
                alpha: 1
            });
        }
    }
    
    // Screen shake effect for dramatic moments
    addScreenShake(intensity = 5, duration = 500) {
        this.victoryScreen.cameraShake = {
            intensity: intensity,
            duration: duration,
            startTime: Date.now()
        };
    }
    
    // Screen flash effect for dramatic moments
    addScreenFlash(color = '#FFFFFF', alpha = 0.5, duration = 200) {
        this.victoryScreen.screenFlash = {
            color: color,
            alpha: alpha,
            duration: duration,
            startTime: Date.now()
        };
    }
    
    updateVictoryConfetti() {
        for (let i = this.victoryScreen.confetti.length - 1; i >= 0; i--) {
            const confetti = this.victoryScreen.confetti[i];
            
            confetti.x += confetti.vx;
            confetti.y += confetti.vy;
            confetti.rotation += confetti.rotationSpeed;
            confetti.vy += 0.1; // Gravity
            
            // Remove confetti that falls off screen
            if (confetti.y > this.canvas.height + 10) {
                this.victoryScreen.confetti.splice(i, 1);
            }
        }
        
        // Add new confetti periodically
        if (this.victoryScreen.confetti.length < 50 && Math.random() < 0.1) {
            const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFD700', '#FFA500'];
            this.victoryScreen.confetti.push({
                x: Math.random() * this.canvas.width,
                y: -10,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 6 + 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.2
            });
        }
    }
    
    drawPixelatedSprite(x, y, width, height, pixels, colors) {
        const pixelSize = Math.max(1, Math.floor(Math.min(width, height) / 8));
        
        for (let py = 0; py < pixels.length; py++) {
            for (let px = 0; px < pixels[py].length; px++) {
                const colorIndex = pixels[py][px];
                if (colorIndex > 0) {
                    this.ctx.fillStyle = colors[colorIndex - 1];
                    this.ctx.fillRect(
                        x + px * pixelSize, 
                        y + py * pixelSize, 
                        pixelSize, 
                        pixelSize
                    );
                }
            }
        }
    }
    
    drawPapaSandy() {
        const x = this.papaSandy.x;
        const y = this.papaSandy.y;
        const facing = this.papaSandy.direction;
        
        // Draw power-up effects first
        if (this.activePowerUps.length > 0) {
            this.ctx.save();
            
            for (let powerUp of this.activePowerUps) {
                const effect = powerUp.effect;
                const time = Date.now() - powerUp.startTime;
                const pulse = Math.sin(time * 0.01) * 0.3 + 0.7;
                
                this.ctx.globalAlpha = pulse * 0.5;
                
                if (powerUp.type === 'medicalKit') {
                    // Pink aura for medical kit
                    this.ctx.strokeStyle = '#FF69B4';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.papaSandy.width/2, y + this.papaSandy.height/2, 
                               this.papaSandy.width + 10, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                } else if (powerUp.type === 'tropicalEnergy') {
                    // Green aura for tropical energy
                    this.ctx.strokeStyle = '#00FF00';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.papaSandy.width/2, y + this.papaSandy.height/2, 
                               this.papaSandy.width + 10, 0, Math.PI * 2);
                    this.ctx.stroke();
                    
                } else if (powerUp.type === 'superTire') {
                    // Golden aura for super tire
                    this.ctx.strokeStyle = '#FFD700';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.arc(x + this.papaSandy.width/2, y + this.papaSandy.height/2, 
                               this.papaSandy.width + 8, 0, Math.PI * 2);
                    this.ctx.stroke();
                }
            }
            
            this.ctx.restore();
        }
        
        // 8-bit pixel art colors for Papa Sandy
        let colors = [
            '#FFB6C1', // Skin color (light pink)
            '#696969', // Grey hair
            '#FF69B4', // Hawaiian shirt (pink)
            '#32CD32', // Hawaiian shirt (green)
            '#FFD700', // Hawaiian shirt (yellow)
            '#000000', // Black outline
            '#8B4513', // Brown hair (under grey)
            '#F0E68C'  // Shirt trim (khaki)
        ];
        
        // Modify colors based on active power-ups
        if (this.activePowerUps.some(p => p.type === 'tropicalEnergy')) {
            // Make Papa Sandy glow with tropical energy
            colors[0] = '#FFFFCC'; // Brighter skin
            colors[2] = '#FF00FF'; // More vibrant shirt
        }
        
        // Papa Sandy sprite (8x8 pixel grid, scaled up)
        // Format: [row][col] = colorIndex (0 = transparent)
        const sprite = [
            [0,0,0,0,0,0,0,0], // Row 0 (empty space)
            [0,6,6,6,6,6,6,0], // Row 1 (head outline)
            [6,1,1,1,1,1,1,6], // Row 2 (head/skin)
            [6,1,1,1,1,1,1,6], // Row 3 (head/skin)
            [6,1,1,1,1,1,1,6], // Row 4 (face/neck)
            [6,6,6,2,2,6,6,6], // Row 5 (Hawaiian shirt - top)
            [6,2,2,2,2,2,2,6], // Row 6 (Hawaiian shirt - middle)
            [6,2,2,3,3,2,2,6], // Row 7 (Hawaiian shirt - pattern)
            [6,2,2,2,2,2,2,6], // Row 8 (Hawaiian shirt - middle)
            [6,2,2,4,4,2,2,6], // Row 9 (Hawaiian shirt - bottom)
            [6,2,2,2,2,2,2,6], // Row 10 (Hawaiian shirt)
            [6,2,2,2,2,2,2,6], // Row 11 (Hawaiian shirt)
            [6,6,6,6,6,6,6,6], // Row 12 (shirt bottom)
            [0,6,6,6,6,6,6,0], // Row 13 (arms)
            [0,7,7,7,7,7,7,0], // Row 14 (body outline)
            [7,7,7,7,7,7,7,7]  // Row 15 (legs/bottom)
        ];
        
        this.drawPixelatedSprite(x, y, this.papaSandy.width, this.papaSandy.height, sprite, colors);
    }
    
    drawBackground() {
        // Sky gradient
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB'); // Sky blue
        gradient.addColorStop(1, '#98FB98'); // Pale green
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw simple palm trees
        this.ctx.fillStyle = '#8B4513'; // Brown trunk
        for (let palm of this.palms) {
            this.ctx.fillRect(palm.x, palm.y, 8, 80);
            // Simple palm fronds
            this.ctx.fillStyle = '#228B22'; // Green fronds
            this.ctx.fillRect(palm.x - 20, palm.y - 10, 48, 20);
            this.ctx.fillStyle = '#8B4513';
        }
        
        // Draw platforms
        this.ctx.fillStyle = '#DEB887'; // Sandy color
        for (let platform of this.platforms) {
            this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Add some texture to platforms
            this.ctx.fillStyle = '#F4A460';
            for (let i = 0; i < platform.width; i += 20) {
                this.ctx.fillRect(platform.x + i, platform.y, 2, platform.height);
            }
            this.ctx.fillStyle = '#DEB887';
        }
    }
    
    render() {
        const renderStart = performance.now();
        
        // Performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.startRender();
        }
        
        // Apply screen shake effect
        let shakeX = 0, shakeY = 0;
        if (this.victoryScreen.cameraShake && Date.now() - this.victoryScreen.cameraShake.startTime < this.victoryScreen.cameraShake.duration) {
            const shakeProgress = 1 - (Date.now() - this.victoryScreen.cameraShake.startTime) / this.victoryScreen.cameraShake.duration;
            shakeX = (Math.random() - 0.5) * this.victoryScreen.cameraShake.intensity * shakeProgress;
            shakeY = (Math.random() - 0.5) * this.victoryScreen.cameraShake.intensity * shakeProgress;
        } else {
            this.victoryScreen.cameraShake = null;
        }
        
        // Apply screen flash effect
        if (this.victoryScreen.screenFlash && Date.now() - this.victoryScreen.screenFlash.startTime < this.victoryScreen.screenFlash.duration) {
            const flashProgress = 1 - (Date.now() - this.victoryScreen.screenFlash.startTime) / this.victoryScreen.screenFlash.duration;
            this.ctx.save();
            this.ctx.globalAlpha = this.victoryScreen.screenFlash.alpha * flashProgress;
            this.ctx.fillStyle = this.victoryScreen.screenFlash.color;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();
        } else {
            this.victoryScreen.screenFlash = null;
        }
        
        // Clear canvas with performance optimization
        this.ctx.save();
        this.ctx.translate(shakeX, shakeY);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Only render game elements when not in pause menu
        if (this.gameState !== 'PAUSED' && this.gameState !== 'SPLASH' && this.gameState !== 'STORY') {
            // Draw background
            this.drawBackground();
            
            // Draw game objects with render optimization
            this.drawBarriers();
            this.drawTires();
            this.drawPowerUps();
            this.drawParticles();
            this.drawEnemies();
            this.drawPapaSandy();
            
            // Draw UI and story elements
            this.drawEnhancedUI();
            
            // Draw victory screen if active
            if (this.gameState === 'VICTORY') {
                this.drawVictoryScreen();
            }
        } else {
            // Draw UI for pause/story screens
            this.drawEnhancedUI();
        }
        
        this.ctx.restore();
        
        // Performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.endRender();
        }
        
        // Performance optimization: Skip frames if performance is poor
        if (this.performanceMonitor && this.performanceMonitor.metrics.fps < 30) {
            requestAnimationFrame(() => {
                setTimeout(() => this.render(), 16); // Cap at ~60 FPS
            });
        }
        
        // Phase 6: Enhanced rendering for different game states
        // Render based on game state
        switch (this.gameState) {
            case 'SPLASH':
                this.drawSplashScreen();
                break;
            case 'MENU':
                if (this.menuType === 'difficulty') {
                    this.drawDifficultyMenu();
                } else if (this.menuType === 'world') {
                    this.drawWorldMenu();
                }
                break;
            case 'STORY':
                this.drawEnhancedStoryScreen();
                break;
            case 'PLAYING':
                // Draw game elements
                this.drawBackground();
                this.drawBarriers();
                this.drawTires();
                this.drawPowerUps();
                this.drawParticles();
                this.drawEnemies();
                this.drawPapaSandy();
                this.drawEnhancedUI();
                break;
            case 'PAUSED':
                this.drawGameElements();
                this.drawPauseMenu();
                break;
            case 'VICTORY':
                this.drawGameElements();
                this.drawVictoryScreen();
                break;
            case 'GAME_OVER':
                this.drawGameOverScreen();
                break;
        }
        
        this.ctx.restore();
        
        // Performance monitoring
        if (this.performanceMonitor) {
            this.performanceMonitor.endRender();
        }
    }
    
    // Phase 6: Helper method to draw game elements when needed
    drawGameElements() {
        this.drawBackground();
        this.drawBarriers();
        this.drawTires();
        this.drawPowerUps();
        this.drawParticles();
        this.drawEnemies();
        this.drawPapaSandy();
        this.drawEnhancedUI();
    }
    
    drawVictoryScreen() {
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Victory title with glow effect
        this.ctx.save();
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = '#FFD700';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 48px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.victoryScreen.title, this.canvas.width / 2, 100);
        this.ctx.restore();
        
        // Victory subtitle
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '24px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.victoryScreen.subtitle, this.canvas.width / 2, 150);
        
        // Draw corvette in victory scene
        this.drawVictoryCorvette();
        
        // Draw Papa Sandy victory pose
        this.drawPapaSandyVictory();
        
        // Update and draw victory confetti
        this.updateVictoryConfetti();
        this.drawVictoryConfetti();
        
        // Show final statistics after delay
        if (Date.now() - this.victoryScreen.celebrationTime > 2000) {
            this.victoryScreen.showStats = true;
            this.drawVictoryStats();
        }
        
        // Continue celebration message
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press SPACEBAR to continue celebrating!', this.canvas.width / 2, this.canvas.height - 50);
    }
    
    drawVictoryCorvette() {
        const x = this.victoryScreen.corvetteX;
        const y = this.victoryScreen.corvetteY;
        
        // Draw white corvette
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(x, y, 80, 30);
        
        // Corvette details
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(x + 10, y + 5, 60, 20); // Racing stripe
        
        // Wheels
        this.ctx.fillStyle = '#333333';
        this.ctx.beginPath();
        this.ctx.arc(x + 15, y + 30, 8, 0, Math.PI * 2);
        this.ctx.arc(x + 65, y + 30, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Headlights
        this.ctx.fillStyle = '#FFFF00';
        this.ctx.fillRect(x + 70, y + 5, 5, 10);
        this.ctx.fillRect(x + 70, y + 15, 5, 10);
        
        // Victory sparkle effect
        this.createMagicBurst(x + 40, y + 15, '#FFD700', 3);
    }
    
    drawPapaSandyVictory() {
        const x = this.papaSandy.x;
        const y = this.papaSandy.y;
        
        // Animate victory pose
        this.victoryScreen.papaSandyVictoryPose += 0.1;
        const bounce = Math.sin(this.victoryScreen.papaSandyVictoryPose) * 5;
        
        // Draw Papa Sandy with victory pose (arms up)
        this.ctx.save();
        this.ctx.translate(0, bounce);
        
        // Victory aura
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = 0.5;
        this.ctx.beginPath();
        this.ctx.arc(x + this.papaSandy.width/2, y + this.papaSandy.height/2, 
                   this.papaSandy.width + 15, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1;
        
        // Draw Papa Sandy (using existing sprite method)
        this.drawPapaSandy();
        
        // Victory celebration particles
        if (Math.random() < 0.3) {
            this.createMagicBurst(x + this.papaSandy.width/2, y + this.papaSandy.height/2, '#FFD700', 2);
        }
        
        this.ctx.restore();
    }
    
    drawVictoryConfetti() {
        for (let confetti of this.victoryScreen.confetti) {
            this.ctx.save();
            this.ctx.translate(confetti.x, confetti.y);
            this.ctx.rotate(confetti.rotation);
            
            this.ctx.fillStyle = confetti.color;
            this.ctx.fillRect(-confetti.size/2, -confetti.size/2, confetti.size, confetti.size);
            
            this.ctx.restore();
        }
    }
    
    drawVictoryStats() {
        const stats = this.victoryScreen.finalStats;
        const startX = this.canvas.width / 2 - 150;
        const startY = 250;
        
        // Stats background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(startX, startY, 300, 200);
        
        // Stats border
        this.ctx.strokeStyle = '#FFD700';
        this.ctx.lineWidth = 3;
        this.ctx.strokeRect(startX, startY, 300, 200);
        
        // Title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Mission Statistics', this.canvas.width / 2, startY + 30);
        
        // Stats
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'left';
        
        const statLines = [
            `Final Score: ${stats.score}`,
            `Time: ${stats.time} seconds`,
            `Enemies Defeated: ${stats.enemiesDefeated}`,
            `Barriers Destroyed: ${stats.barriersDestroyed}`,
            `Power-ups Collected: ${stats.powerUpsCollected}`
        ];
        
        statLines.forEach((stat, index) => {
            this.ctx.fillText(stat, startX + 20, startY + 60 + index * 25);
        });
        
        stats.forEach((stat, index) => {
            this.ctx.fillText(stat, startX + 20, startY + 60 + index * 25);
        });
        
        // Performance rating
        const rating = this.getPerformanceRating(stats);
        this.ctx.fillStyle = rating.color;
        this.ctx.font = 'bold 18px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(rating.text, this.canvas.width / 2, startY + 180);
    }
    
    getPerformanceRating(stats) {
        const totalScore = stats.score + stats.enemiesDefeated * 50 + stats.barriersDestroyed * 25;
        
        if (totalScore > 2000) {
            return { text: '🏆 LEGENDARY PERFORMANCE!', color: '#FFD700' };
        } else if (totalScore > 1500) {
            return { text: '⭐ EXCELLENT!', color: '#FFA500' };
        } else if (totalScore > 1000) {
            return { text: '👍 GREAT JOB!', color: '#00FF00' };
        } else if (totalScore > 500) {
            return { text: '👌 GOOD WORK!', color: '#00BFFF' };
        } else {
            return { text: '👊 KEEP PRACTICING!', color: '#FF69B4' };
        }
        }
    
    drawBarriers() {
        for (let barrier of this.barriers) {
            if (barrier.health > 0) {
                // Color based on health
                const healthRatio = barrier.health / barrier.maxHealth;
                const red = Math.floor(255 * (1 - healthRatio));
                const green = Math.floor(255 * healthRatio);
                
                this.ctx.fillStyle = `rgb(${red}, ${green}, 0)`;
                this.ctx.fillRect(barrier.x, barrier.y, barrier.width, barrier.height);
                
                // Draw barrier texture
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                for (let i = 0; i < barrier.height; i += 10) {
                    this.ctx.fillRect(barrier.x, barrier.y + i, barrier.width, 2);
                }
            }
        }
    }
    
    drawTires() {
        for (let tire of this.tires) {
            // Tire colors
            this.ctx.fillStyle = tire.isRolling ? '#333' : '#444'; // Darker when rolling
            this.ctx.beginPath();
            this.ctx.arc(tire.x + tire.width/2, tire.y + tire.height/2, tire.width/2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Tire tread pattern
            this.ctx.strokeStyle = '#222';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const startX = tire.x + tire.width/2 + Math.cos(angle) * 8;
                const startY = tire.y + tire.height/2 + Math.sin(angle) * 8;
                const endX = tire.x + tire.width/2 + Math.cos(angle) * 15;
                const endY = tire.y + tire.height/2 + Math.sin(angle) * 15;
                
                this.ctx.beginPath();
                this.ctx.moveTo(startX, startY);
                this.ctx.lineTo(endX, endY);
                this.ctx.stroke();
            }
            
            // Highlight when pushable
            if (tire.canPush && this.isNearTire(tire)) {
                this.ctx.strokeStyle = '#FFD700';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(tire.x + tire.width/2, tire.y + tire.height/2, tire.width/2 + 3, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    drawEnemies() {
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.type === 'crab') {
                this.drawCrab(enemy);
            } else if (enemy.type === 'coconut') {
                this.drawCoconut(enemy);
            }
        }
    }
    
    drawCrab(crab) {
        // Crab body
        this.ctx.fillStyle = '#FF6347'; // Tomato red
        this.ctx.fillRect(crab.x, crab.y, crab.width, crab.height);
        
        // Crab claws
        this.ctx.fillStyle = '#FF4500';
        this.ctx.fillRect(crab.x - 4, crab.y + 4, 4, 8);
        this.ctx.fillRect(crab.x + crab.width, crab.y + 4, 4, 8);
        
        // Crab eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(crab.x + 6, crab.y + 2, 2, 2);
        this.ctx.fillRect(crab.x + crab.width - 8, crab.y + 2, 2, 2);
        
        // Crab legs
        this.ctx.strokeStyle = '#FF6347';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(crab.x + i * 8 + 2, crab.y + crab.height);
            this.ctx.lineTo(crab.x + i * 8 + 2 + (crab.direction > 0 ? 4 : -4), crab.y + crab.height + 4);
            this.ctx.stroke();
        }
    }
    
    drawCoconut(coconut) {
        // Coconut body
        this.ctx.fillStyle = '#8B4513'; // Brown
        this.ctx.beginPath();
        this.ctx.arc(coconut.x + coconut.width/2, coconut.y + coconut.height/2, coconut.width/2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Coconut eyes
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(coconut.x + 4, coconut.y + 6, 2, 2);
        this.ctx.fillRect(coconut.x + coconut.width - 6, coconut.y + 6, 2, 2);
        
        // Coconut mouth
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.arc(coconut.x + coconut.width/2, coconut.y + coconut.height/2 + 2, 3, 0, Math.PI);
        this.ctx.stroke();
    }
    
    drawUI() {
        // Mission text
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Courier New';
        this.ctx.fillText(this.storyElements.missionText, 10, 30);
        
        // Objective
        this.ctx.font = '12px Courier New';
        this.ctx.fillText(this.storyElements.currentObjective, 10, 50);
        
        // Stats
        this.ctx.fillText(`Enemies Defeated: ${this.storyElements.enemiesDefeated}`, 10, 70);
        this.ctx.fillText(`Barriers Destroyed: ${this.storyElements.barriersDestroyed}`, 10, 90);
        
        // Instructions
        this.ctx.font = '10px Courier New';
        this.ctx.fillText('B - Roll nearby tire', 10, this.canvas.height - 60);
        this.ctx.fillText('Jump on enemies to defeat them!', 10, this.canvas.height - 45);
        this.ctx.fillText('Roll tires into barriers to destroy them!', 10, this.canvas.height - 30);
        
        // Dr.vette story hint
        if (this.storyElements.barriersDestroyed >= 2) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '12px Courier New';
            this.ctx.fillText('Dr.vette\'s clinic is nearby! Keep going!', 10, 120);
        }
    }
    
    isNearTire(tire) {
        const distance = Math.abs(this.papaSandy.x - tire.x);
        return distance < 60;
    }
    
    drawPowerUps() {
        for (let powerUp of this.powerUps) {
            const bounce = Math.sin(powerUp.bounce) * 5;
            const glow = Math.sin(powerUp.glow) * 0.3 + 0.7;
            
            this.ctx.save();
            this.ctx.globalAlpha = glow;
            
            // Draw power-up glow effect
            const gradient = this.ctx.createRadialGradient(
                powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, 0,
                powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2, powerUp.width
            );
            gradient.addColorStop(0, this.powerUpEffects[powerUp.type].color);
            gradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(powerUp.x - 10, powerUp.y - 10, powerUp.width + 20, powerUp.height + 20);
            
            // Draw power-up based on type
            this.ctx.globalAlpha = 1;
            
            if (powerUp.type === 'superTire') {
                // Draw super tire
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + bounce, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw star pattern
                this.ctx.fillStyle = '#FFA500';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('⭐', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + bounce + 5);
                
            } else if (powerUp.type === 'medicalKit') {
                // Draw medical kit
                this.ctx.fillStyle = '#FF69B4';
                this.ctx.fillRect(powerUp.x, powerUp.y + bounce, powerUp.width, powerUp.height);
                
                // Draw cross
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(powerUp.x + 12, powerUp.y + bounce + 8, 6, 14);
                this.ctx.fillRect(powerUp.x + 8, powerUp.y + bounce + 14, 14, 6);
                
            } else if (powerUp.type === 'tropicalEnergy') {
                // Draw tropical energy
                this.ctx.fillStyle = '#00FF00';
                this.ctx.beginPath();
                this.ctx.arc(powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + bounce, powerUp.width/2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // Draw lightning bolt
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('⚡', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height/2 + bounce + 5);
            }
            
            // Draw power-up label
            this.ctx.fillStyle = 'white';
            this.ctx.font = '8px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.powerUpEffects[powerUp.type].name, 
                             powerUp.x + powerUp.width/2, powerUp.y + powerUp.height + 15 + bounce);
            
            this.ctx.restore();
        }
    }
    
    drawParticles() {
        for (let particle of this.particles) {
            const alpha = particle.alpha || (particle.life / particle.maxLife);
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            // Enhanced particle rendering
            if (particle.sparkle) {
                // Draw sparkle effect with glow
                this.ctx.save();
                this.ctx.shadowBlur = 10;
                this.ctx.shadowColor = particle.color;
                this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
                this.ctx.restore();
            } else {
                // Standard particle with optional rotation
                this.ctx.save();
                this.ctx.translate(particle.x + particle.size/2, particle.y + particle.size/2);
                
                if (particle.rotation) {
                    this.ctx.rotate(particle.rotation);
                }
                
                // Draw different particle shapes based on type
                if (particle.trail) {
                    // Trail particle - elongated
                    this.ctx.fillRect(-particle.size, -particle.size/2, particle.size * 2, particle.size);
                } else {
                    // Regular particle - square
                    this.ctx.fillRect(-particle.size/2, -particle.size/2, particle.size, particle.size);
                }
                
                this.ctx.restore();
            }
        }
        this.ctx.globalAlpha = 1;
    }
    
    drawEnhancedUI() {
        // UI Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 300, 180);
        
        // Mission text
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 14px Courier New';
        this.ctx.fillText(this.storyElements.missionText, 20, 35);
        
        // Objective
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText(this.storyElements.currentObjective, 20, 55);
        
        // Stats
        this.ctx.fillStyle = '#00FF00';
        this.ctx.fillText(`Score: ${this.score}`, 20, 80);
        this.ctx.fillText(`Lives: ${this.lives}`, 20, 100);
        this.ctx.fillText(`Enemies Defeated: ${this.storyElements.enemiesDefeated}`, 20, 120);
        this.ctx.fillText(`Barriers Destroyed: ${this.storyElements.barriersDestroyed}`, 20, 140);
        
        // Active power-ups
        this.ctx.fillStyle = '#FFA500';
        this.ctx.fillText('Active Power-ups:', 20, 165);
        let yOffset = 180;
        for (let powerUp of this.activePowerUps) {
            const remaining = (powerUp.effect.duration - (Date.now() - powerUp.startTime)) / 1000;
            this.ctx.fillStyle = powerUp.effect.color;
            this.ctx.font = '10px Courier New';
            this.ctx.fillText(`${powerUp.effect.name}: ${remaining.toFixed(1)}s`, 20, yOffset);
            yOffset += 15;
        }
        
        // Instructions
        this.ctx.fillStyle = 'white';
        this.ctx.font = '10px Courier New';
        this.ctx.fillText('B - Roll nearby tire', this.canvas.width - 180, this.canvas.height - 60);
        this.ctx.fillText('Jump on enemies to defeat them!', this.canvas.width - 180, this.canvas.height - 45);
        this.ctx.fillText('Roll tires into barriers to destroy them!', this.canvas.width - 180, this.canvas.height - 30);
        this.ctx.fillText('Collect power-ups for special abilities!', this.canvas.width - 180, this.canvas.height - 15);
        
        // Dr.vette story hint
        if (this.storyElements.barriersDestroyed >= 2) {
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = '12px Courier New';
            this.ctx.fillText('Dr.vette\'s clinic is nearby! Keep going!', 20, 120);
        }
        
        // Draw timer
        const gameTime = Math.floor((Date.now() - this.gameStartTime) / 1000);
        this.ctx.fillStyle = '#00FFFF';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText(`Time: ${gameTime}s`, this.canvas.width - 80, 30);
    }
    
    // Phase 6: Enhanced Menu Rendering
    drawDifficultyMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT DIFFICULTY', this.canvas.width / 2, 80);
        
        // Difficulty options
        const difficulties = ['easy', 'medium', 'hard'];
        const difficultyNames = ['Easy Mode', 'Medium Mode', 'Hard Mode'];
        const difficultyDescs = [
            'Perfect for beginners and family play',
            'Balanced challenge for experienced players', 
            'Ultimate challenge for expert players'
        ];
        
        difficulties.forEach((diff, index) => {
            const y = 150 + index * 100;
            const isSelected = diff === this.selectedDifficulty;
            
            // Highlight selected option
            if (isSelected) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(this.canvas.width / 2 - 200, y - 30, 400, 60);
            }
            
            // Difficulty name
            this.ctx.fillStyle = isSelected ? '#000000' : '#FFFFFF';
            this.ctx.font = 'bold 20px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(difficultyNames[index], this.canvas.width / 2, y);
            
            // Description
            this.ctx.fillStyle = isSelected ? '#CCCCCC' : '#AAAAAA';
            this.ctx.font = '14px Courier New';
            this.ctx.fillText(difficultyDescs[index], this.canvas.width / 2, y + 20);
        });
        
        // Instructions
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use ARROW KEYS to select, SPACEBAR to confirm', this.canvas.width / 2, this.canvas.height - 50);
        this.ctx.fillText('Press ESCAPE to return to story', this.canvas.width / 2, this.canvas.height - 25);
    }
    
    drawWorldMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title
        this.ctx.fillStyle = '#FFD700';
        this.ctx.font = 'bold 32px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT WORLD', this.canvas.width / 2, 80);
        
        // World options
        const worlds = [1, 2, 3];
        const worldNames = ['Beach Paradise', 'Cowboy Country', 'Tropical Jungle'];
        const worldDescs = [
            'Papa Sandy\'s retirement years in Florida',
            'Papa Sandy\'s younger adventurous days',
            'The final battle in Dr.vette\'s fortress'
        ];
        
        worlds.forEach((worldNum, index) => {
            const y = 150 + index * 100;
            const isUnlocked = this.worldProgress[worldNum].unlocked;
            const isCompleted = this.completedWorlds.has(worldNum);
            
            // Highlight selected option
            if (this.currentWorld === worldNum && isUnlocked) {
                this.ctx.fillStyle = isCompleted ? '#90EE90' : '#FFD700';
                this.ctx.fillRect(this.canvas.width / 2 - 200, y - 30, 400, 60);
            }
            
            // World name
            this.ctx.fillStyle = isUnlocked ? '#FFFFFF' : '#666666';
            this.ctx.font = isUnlocked ? 'bold 20px Courier New' : '16px Courier New';
            this.ctx.textAlign = 'center';
            
            const name = worldNames[index];
            const status = isCompleted ? ' ✓ COMPLETED' : isUnlocked ? '' : ' 🔒 LOCKED';
            this.ctx.fillText(name + status, this.canvas.width / 2, y);
            
            // Description
            this.ctx.fillStyle = isUnlocked ? '#CCCCCC' : '#888888';
            this.ctx.font = '14px Courier New';
            this.ctx.fillText(worldDescs[index], this.canvas.width / 2, y + 20);
        });
        
        // Instructions
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use ARROW KEYS to select, SPACEBAR to confirm', this.canvas.width / 2, this.canvas.height - 50);
        this.ctx.fillText('Press ESCAPE to return to main menu', this.canvas.width / 2, this.canvas.height - 25);
    }
    
    drawEnhancedStoryScreen() {
        const currentTime = Date.now();
        const elapsed = currentTime - this.stateStartTime;
        
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // World-specific background
        this.drawWorldBackground();
        
        // Story text
        if (this.storySequence === 'world_start' && this.currentStoryTexts) {
            if (this.currentStoryIndex < this.currentStoryTexts.length) {
                const storyText = this.currentStoryTexts[this.currentStoryIndex];
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = 'bold 24px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('WORLD ' + this.currentWorld, this.canvas.width / 2, 100);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '18px Courier New';
                this.ctx.textAlign = 'center';
                
                // Word wrap for long text
                const words = storyText.split(' ');
                let line = '';
                let y = 200;
                
                words.forEach(word => {
                    const testLine = line + word + ' ';
                    const metrics = this.ctx.measureText(testLine);
                    
                    if (metrics.width > this.canvas.width - 100 && line !== '') {
                        this.ctx.fillText(line, this.canvas.width / 2, y);
                        line = word + ' ';
                        y += 30;
                    } else {
                        line = testLine;
                    }
                });
                this.ctx.fillText(line, this.canvas.width / 2, y);
                
                // Continue prompt
                if (elapsed > 3000) {
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.font = '16px Courier New';
                    this.ctx.fillText('Press SPACEBAR to continue...', this.canvas.width / 2, this.canvas.height - 100);
                }
            }
        }
        
        // Papa Sandy character based on world
        this.drawPapaSandyStoryPose();
    }
    
    drawWorldBackground() {
        // Simple world-specific background gradients
        switch (this.currentWorld) {
            case 1: // Beach
                const beachGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                beachGradient.addColorStop(0, '#FFE4B5');
                beachGradient.addColorStop(0.6, '#87CEEB');
                beachGradient.addColorStop(1, '#F0E68C');
                this.ctx.fillStyle = beachGradient;
                break;
            case 2: // Cowboy
                const cowboyGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                cowboyGradient.addColorStop(0, '#FF6347');
                cowboyGradient.addColorStop(0.6, '#DEB887');
                cowboyGradient.addColorStop(1, '#8B4513');
                this.ctx.fillStyle = cowboyGradient;
                break;
            case 3: // Jungle
                const jungleGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                jungleGradient.addColorStop(0, '#228B22');
                jungleGradient.addColorStop(0.6, '#006400');
                jungleGradient.addColorStop(1, '#8B4513');
                this.ctx.fillStyle = jungleGradient;
                break;
        }
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    drawPapaSandyStoryPose() {
        const x = this.canvas.width / 2 - 50;
        const y = this.canvas.height - 200;
        
        // Draw Papa Sandy in world-specific outfit
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(x, y, 100, 120);
        
        // Add world-specific accessories
        switch (this.currentWorld) {
            case 1: // Beach - Hawaiian shirt pattern
                this.ctx.fillStyle = '#FF6347';
                for (let i = 0; i < 3; i++) {
                    for (let j = 0; j < 2; j++) {
                        this.ctx.fillRect(x + 10 + i * 30, y + 20 + j * 30, 20, 20);
                    }
                }
                break;
            case 2: // Cowboy - Western shirt
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x + 10, y + 20, 80, 40);
                this.ctx.fillStyle = '#FFD700';
                this.ctx.fillRect(x + 40, y + 10, 20, 10); // Cowboy hat
                break;
            case 3: // Explorer - Safari outfit
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(x + 40, y + 10, 20, 10); // Explorer hat
                this.ctx.fillStyle = '#228B22';
                this.ctx.fillRect(x + 10, y + 20, 80, 40);
                break;
        }
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    // Start performance monitoring
    const performanceMonitor = new SandylandPerformanceMonitor();
    
    // Initialize game with performance monitoring
    const game = new SandylandGame();
    game.performanceMonitor = performanceMonitor;
    
    // Log performance metrics periodically
    setInterval(() => {
        const metrics = performanceMonitor.getMetrics();
        console.log('Sandyland Performance:', metrics);
    }, 5000);
});