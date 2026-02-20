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
        this.gameState = 'SPLASH'; // SPLASH, PLAYING, PAUSED, GAME_OVER
        this.menuState = 'CLOSED'; // CLOSED, PAUSED, MAIN
        
        // Background music system
        this.audioContext = null;
        this.backgroundMusic = null;
        this.musicVolume = 0.1; // Soft background volume
        this.musicMuted = false;
        this.currentMusicTrack = 0;
        
        // Story system
        this.storyMode = 'INTRO'; // INTRO, WORLD_1, WORLD_2, WORLD_3, VICTORY
        this.storyText = '';
        this.storyTimer = 0;
        this.storySpeed = 2;
        this.storyScrollY = 0;
        this.storyMaxScroll = 0;
        this.storyAutoScroll = true;
        
        // Story content as scrolling text
        this.stories = {
            INTRO: `PAPA SANDY: RETIRED TIRE SALESMAN

Once upon a time, in sunny Florida...
Papa Sandy lived a peaceful retirement.
His pride and joy? His beautiful white Corvette!

But trouble was brewing...
His ex-wife Dr.vette still held a grudge.
She was jealous of his happiness and success.

One day, Dr.vette stole his beloved Corvette!
She hid it in her veterinary clinic fortress.

Now, Papa Sandy must rescue his car!
Using his tire-rolling skills from his salesman days,
he embarks on an epic adventure across three worlds!

Press SPACE to begin the rescue mission!`,

            WORLD_1: `WORLD 1: BEACH PARADISE

Papa Sandy arrives at the sunny beaches where
he once sold tires to tourists.

The crabs here are angry about beach pollution,
and Dr.vette's minions guard the shoreline.

Roll tires over the crabs to clear your path!
Collect 2 stars to unlock the next area.

Press SPACE to continue!`,

            WORLD_2: `WORLD 2: COWBOY COUNTRY

The journey takes Papa Sandy to the wild west,
where tumbleweeds roll across the desert.

Dr.vette's coconut bombs drop from above,
and her loyal minions patrol the dusty plains.

Use your tire-rolling skills strategically!
Push tires to create bridges and defeat enemies.

Press SPACE to continue!`,

            WORLD_3: `WORLD 3: TROPICAL JUNGLE

Deep in the jungle awaits Dr.vette's fortress!
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
            onGround: true,
            direction: 1,
            health: 3,
            invulnerable: false,
            invulnerableTimer: 0
        };
        
        // World-specific enemies and objects
        this.enemies = [];
        this.powerUps = [];
        this.tires = [];
        this.backgroundElements = [];
        
        this.initializeWorld(this.currentWorld);
        
        // Level completion flag
        this.levelCompleted = false;
        this.levelCompletionThreshold = 2; // Need to collect 2 stars
        
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
        if (!this.audioContext) return;
        
        // Create country-style background music
        this.createCountryMusicLoop();
    }
    
    createCountryMusicLoop() {
        if (!this.audioContext || this.musicMuted) return;
        
        // Create a simple country-style melody using Web Audio API
        const notes = [196, 196, 220, 196, 262, 220]; // G3, G3, A3, G3, C4, A3
        const durations = [0.4, 0.4, 0.8, 0.4, 0.8, 0.8]; // Quarter, quarter, half, quarter, half, half
        
        let currentTime = this.audioContext.currentTime;
        
        notes.forEach((note, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Create warm acoustic guitar-like tone
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(note, currentTime);
            
            // Add gentle volume envelope for acoustic feel
            gainNode.gain.setValueAtTime(0, currentTime);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.3, currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(this.musicVolume * 0.2, currentTime + 0.1);
            gainNode.gain.linearRampToValueAtTime(0, currentTime + durations[index]);
            
            // Add subtle low-pass filter for acoustic guitar effect
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1000, currentTime);
            filter.Q.setValueAtTime(10, currentTime);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(currentTime);
            oscillator.stop(currentTime + durations[index]);
            
            currentTime += durations[index];
        });
        
        // Loop the music every 4 seconds
        setTimeout(() => {
            if (this.gameState === 'PLAYING' && !this.musicMuted) {
                this.createCountryMusicLoop();
            }
        }, 4000);
    }
    
    toggleMute() {
        this.musicMuted = !this.musicMuted;
        if (this.musicMuted) {
            // Stop current music
            if (this.backgroundMusic) {
                this.backgroundMusic.stop();
                this.backgroundMusic = null;
            }
        } else {
            // Resume music
            this.createCountryMusicLoop();
        }
        return this.musicMuted;
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
                        type: 'star',
                        x: 300,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'star',
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
                        type: 'star',
                        x: 250,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'star',
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
                        type: 'star',
                        x: 300,
                        y: this.groundY - 40,
                        width: 24,
                        height: 24,
                        collected: false,
                        color: '#FFD700'
                    },
                    {
                        type: 'star',
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
    }
    
    setupEventListeners() {
        // Keyboard controls for desktop
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Skip story mode with any key
            if (this.gameState === 'SPLASH') {
                this.startGame();
                return;
            }
            
            // Handle jumping
            if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && this.papaSandy.onGround && this.gameState === 'PLAYING') {
                this.papaSandy.velocityY = -this.papaSandy.jumpPower;
                this.papaSandy.onGround = false;
            }
            
            // Handle menu toggle
            if (e.code === 'Escape' && this.gameState === 'PLAYING') {
                this.toggleMenu();
            }
            
            // Handle tire pushing
            if (e.code === 'KeyB' && this.gameState === 'PLAYING') {
                this.pushNearestTire();
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
                this.startGame();
            }
        });
        
        // Create control buttons for mobile
        if ('ontouchstart' in window) {
            this.createMobileControls();
        }
    }
    
    createMobileControls() {
        // Control panel container
        const controlPanel = document.createElement('div');
        controlPanel.style.position = 'fixed';
        controlPanel.style.bottom = '20px';
        controlPanel.style.left = '50%';
        controlPanel.style.transform = 'translateX(-50%)';
        controlPanel.style.display = 'flex';
        controlPanel.style.gap = '10px';
        controlPanel.style.zIndex = '1000';
        
        // Left button
        const leftBtn = document.createElement('button');
        leftBtn.innerHTML = '←';
        leftBtn.style.width = '60px';
        leftBtn.style.height = '60px';
        leftBtn.style.fontSize = '24px';
        leftBtn.style.border = '2px solid #333';
        leftBtn.style.borderRadius = '10px';
        leftBtn.style.background = '#4CAF50';
        leftBtn.style.color = 'white';
        leftBtn.style.cursor = 'pointer';
        
        // Right button
        const rightBtn = document.createElement('button');
        rightBtn.innerHTML = '→';
        rightBtn.style.width = '60px';
        rightBtn.style.height = '60px';
        rightBtn.style.fontSize = '24px';
        rightBtn.style.border = '2px solid #333';
        rightBtn.style.borderRadius = '10px';
        rightBtn.style.background = '#4CAF50';
        rightBtn.style.color = 'white';
        rightBtn.style.cursor = 'pointer';
        
        // Jump button
        const jumpBtn = document.createElement('button');
        jumpBtn.innerHTML = '⬆️';
        jumpBtn.style.width = '60px';
        jumpBtn.style.height = '60px';
        jumpBtn.style.fontSize = '24px';
        jumpBtn.style.border = '2px solid #333';
        jumpBtn.style.borderRadius = '10px';
        jumpBtn.style.background = '#2196F3';
        jumpBtn.style.color = 'white';
        jumpBtn.style.cursor = 'pointer';
        
        // Tire roll button
        const tireBtn = document.createElement('button');
        tireBtn.innerHTML = '🛞';
        tireBtn.style.width = '60px';
        tireBtn.style.height = '60px';
        tireBtn.style.fontSize = '24px';
        tireBtn.style.border = '2px solid #333';
        tireBtn.style.borderRadius = '10px';
        tireBtn.style.background = '#FF9800';
        tireBtn.style.color = 'white';
        tireBtn.style.cursor = 'pointer';
        
        // Button event handlers
        const handleButtonStart = (direction) => {
            this.keys[`Arrow${direction.toUpperCase()}`] = true;
        };
        
        const handleButtonEnd = (direction) => {
            this.keys[`Arrow${direction.toUpperCase()}`] = false;
        };
        
        // Add event listeners
        leftBtn.addEventListener('touchstart', () => handleButtonStart('Left'));
        leftBtn.addEventListener('touchend', () => handleButtonEnd('Left'));
        leftBtn.addEventListener('mousedown', () => handleButtonStart('Left'));
        leftBtn.addEventListener('mouseup', () => handleButtonEnd('Left'));
        
        rightBtn.addEventListener('touchstart', () => handleButtonStart('Right'));
        rightBtn.addEventListener('touchend', () => handleButtonEnd('Right'));
        rightBtn.addEventListener('mousedown', () => handleButtonStart('Right'));
        rightBtn.addEventListener('mouseup', () => handleButtonEnd('Right'));
        
        jumpBtn.addEventListener('touchstart', () => {
            if (this.papaSandy.onGround) {
                this.papaSandy.velocityY = -this.papaSandy.jumpPower;
                this.papaSandy.onGround = false;
            }
        });
        jumpBtn.addEventListener('mousedown', () => {
            if (this.papaSandy.onGround) {
                this.papaSandy.velocityY = -this.papaSandy.jumpPower;
                this.papaSandy.onGround = false;
            }
        });
        
        // Tire push button events
        tireBtn.addEventListener('touchstart', () => {
            this.pushNearestTire();
        });
        tireBtn.addEventListener('mousedown', () => {
            this.pushNearestTire();
        });
        
        // Add buttons to control panel
        controlPanel.appendChild(leftBtn);
        controlPanel.appendChild(jumpBtn);
        controlPanel.appendChild(tireBtn);
        controlPanel.appendChild(rightBtn);
        
        // Add to document
        document.body.appendChild(controlPanel);
        
        // Store references for cleanup
        this.mobileControls = {
            panel: controlPanel,
            left: leftBtn,
            right: rightBtn,
            jump: jumpBtn,
            tire: tireBtn
        };
    }
    
    update() {
        // Update story system
        this.updateStory();
        
        // Don't update game logic if in story mode
        if (this.gameState === 'SPLASH') return;
        
        // Handle horizontal movement
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            this.papaSandy.velocityX = -this.papaSandy.speed;
            this.papaSandy.direction = -1;
        } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            this.papaSandy.velocityX = this.papaSandy.speed;
            this.papaSandy.direction = 1;
        } else {
            this.papaSandy.velocityX *= this.friction;
        }
        
        // Handle jumping
        if ((this.keys['Space'] || this.keys['ArrowUp'] || this.keys['KeyW']) && this.papaSandy.onGround) {
            this.papaSandy.velocityY = -this.papaSandy.jumpPower;
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
        
        // Ground collision
        if (this.papaSandy.y + this.papaSandy.height > this.groundY) {
            this.papaSandy.y = this.groundY - this.papaSandy.height;
            this.papaSandy.velocityY = 0;
            this.papaSandy.onGround = true;
        }
        
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
                        this.levelCompleted = true;
                    }
                }
            }
        }
        
        // Check enemy collisions and damage
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            // Collision detection between Papa Sandy and enemy
            if (this.papaSandy.x < enemy.x + enemy.width &&
                this.papaSandy.x + this.papaSandy.width > enemy.x &&
                this.papaSandy.y < enemy.y + enemy.height &&
                this.papaSandy.y + this.papaSandy.height > enemy.y) {
                
                if (!this.papaSandy.invulnerable) {
                    // Enemy damages Papa Sandy
                    this.papaSandy.health--;
                    this.papaSandy.invulnerable = true;
                    this.papaSandy.invulnerableTimer = 120; // 2 seconds of invulnerability
                    
                    // Knockback Papa Sandy
                    this.papaSandy.velocityX = this.papaSandy.direction * -3;
                    this.papaSandy.velocityY = -5;
                    
                    // Check if Papa Sandy died
                    if (this.papaSandy.health <= 0) {
                        this.gameState = 'GAME_OVER';
                    }
                }
            }
            
            // Check if Papa Sandy lands on enemy (stomping)
            if (this.papaSandy.velocityY > 0 && // Falling
                this.papaSandy.x < enemy.x + enemy.width &&
                this.papaSandy.x + this.papaSandy.width > enemy.x &&
                this.papaSandy.y + this.papaSandy.height > enemy.y &&
                this.papaSandy.y + this.papaSandy.height < enemy.y + enemy.height + 10) {
                
                // Papa Sandy stomped on enemy
                enemy.alive = false;
                this.papaSandy.velocityY = -this.papaSandy.jumpPower * 0.7; // Small bounce
                this.papaSandy.onGround = false;
                this.score += 150;
            }
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
                // Update pushed tire physics
                tire.x += tire.velocityX;
                tire.velocityX *= 0.95; // Friction
                tire.pushTime--;
                
                // Stop tire after push time or hitting wall
                if (tire.pushTime <= 0 || tire.x <= 0 || tire.x + tire.width >= this.canvas.width) {
                    tire.pushed = false;
                    tire.velocityX = 0;
                    tire.pushTime = 0;
                }
            }
            
            // Keep tires within bounds
            if (tire.x < 0) tire.x = 0;
            if (tire.x + tire.width > this.canvas.width) {
                tire.x = this.canvas.width - tire.width;
                tire.pushed = false;
                tire.velocityX = 0;
                tire.pushTime = 0;
            }
        }
    }
    
    draw() {
        // Draw story mode first
        this.drawStory();
        
        // Don't draw game if in story mode
        if (this.gameState === 'SPLASH') return;
        
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
        
        // Draw background elements
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
        
        // Draw Papa Sandy
        if (this.papaSandy.invulnerable && Math.floor(this.papaSandy.invulnerableTimer / 10) % 2) {
            // Flashing effect when invulnerable
            this.ctx.fillStyle = '#FF69B4';
        // Normal Papa Sandy appearance
        if (this.papaSandy.invulnerable && Math.floor(this.papaSandy.invulnerableTimer / 10) % 2) {
            // Flashing effect when invulnerable
            this.ctx.fillStyle = '#FF69B4';
        } else {
            this.ctx.fillStyle = '#FFD700';
        }
        this.ctx.fillRect(this.papaSandy.x, this.papaSandy.y, this.papaSandy.width, this.papaSandy.height);
        
        // Draw enemies
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.type === 'crab') {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            } else if (enemy.type === 'coconut') {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Draw coconut texture
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 4, 16, 16);
            } else if (enemy.type === 'minion') {
                this.ctx.fillStyle = enemy.color;
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
                // Draw minion face
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(enemy.x + 4, enemy.y + 4, 8, 8);
                this.ctx.fillRect(enemy.x + 20, enemy.y + 4, 8, 8);
                this.ctx.fillStyle = '#000000';
                this.ctx.fillRect(enemy.x + 6, enemy.y + 6, 4, 4);
                this.ctx.fillRect(enemy.x + 22, enemy.y + 6, 4, 4);
            }
        }
        
        // Draw tires
        for (let tire of this.tires) {
            if (tire.pushed) {
                // Draw rolling tire
                this.ctx.fillStyle = tire.color;
                this.ctx.fillRect(tire.x, tire.y, tire.width, tire.height);
                // Draw tire treads
                this.ctx.fillStyle = '#666666';
                for (let i = 0; i < 3; i++) {
                    this.ctx.fillRect(tire.x + 4, tire.y + 8 + i * 8, tire.width - 8, 2);
                }
            } else {
                // Draw stationary tire
                this.ctx.fillStyle = tire.color;
                this.ctx.fillRect(tire.x, tire.y, tire.width, tire.height);
                // Draw tire rim
                this.ctx.fillStyle = '#999999';
                this.ctx.fillRect(tire.x + 6, tire.y + 6, tire.width - 12, tire.height - 12);
            }
        }
        
        // Draw power-ups
        for (let powerUp of this.powerUps) {
            if (!powerUp.collected) {
                this.ctx.fillStyle = powerUp.color;
                this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
                
                // Draw star shape
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '16px Courier New';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('⭐', powerUp.x + powerUp.width/2, powerUp.y + powerUp.height - 4);
            }
        }
        
        // Draw UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';
        
        // World name
        this.ctx.fillText('World: ' + this.worldNames[this.currentWorld], 10, 30);
        this.ctx.fillText('Score: ' + this.score, 10, 60);
        
        // Draw health
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText('Health: ', 10, 90);
        for (let i = 0; i < this.papaSandy.health; i++) {
            this.ctx.fillRect(80 + i * 25, 75, 20, 15);
        }
        
        // Draw controls info
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '12px Courier New';
        this.ctx.fillText('Arrow Keys: Move | Space: Jump | B: Tire Roll', 10, this.canvas.height - 20);
        
        // Draw level progress
        const collectedCount = this.powerUps.filter(p => p.collected).length;
        this.ctx.fillText('Stars: ' + collectedCount + '/' + this.levelCompletionThreshold, 10, 90);
        
        // Draw level completion message
        if (this.levelCompleted) {
            this.ctx.fillStyle = '#00FF00';
            this.ctx.font = '32px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('LEVEL COMPLETE!', this.canvas.width/2, this.canvas.height/2);
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('Press SPACE to advance to ' + this.worldNames[this.currentWorld % 3 + 1], this.canvas.width/2, this.canvas.height/2 + 40);
            
            // Check for space press to advance to next level
            if (this.keys['Space']) {
                this.nextLevel();
            }
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    nextLevel() {
        // Advance to next world
        this.currentWorld = (this.currentWorld % 3) + 1;
        
        // Reset level completion flag
        this.levelCompleted = false;
        
        // Reinitialize the new world
        this.initializeWorld(this.currentWorld);
        
        // Reset Papa Sandy position
        this.papaSandy.x = 100;
        this.papaSandy.y = this.groundY;
        this.papaSandy.velocityX = 0;
        this.papaSandy.velocityY = 0;
        
        // Reset keys
        this.keys = {};
        
        // Add bonus points for world completion
        this.score += 100;
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
                        color: '#333333'
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
                        color: '#333333'
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
                        color: '#654321'
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
                        color: '#654321'
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
                        color: '#654321'
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
                        color: '#8B4513'
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
                        color: '#8B4513'
                    }
                ];
                break;
        }
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
        // Pause the game by stopping the game loop
        this.gameState = 'PAUSED';
    }
    
    resumeGame() {
        // Resume the game
        this.gameState = 'PLAYING';
        this.gameLoop();
    }
    
    pushNearestTire() {
        // Find the nearest tire
        let nearestTire = null;
        let minDistance = Infinity;
        
        for (let tire of this.tires) {
            if (!tire.pushed) {
                const distance = Math.abs(tire.x - this.papaSandy.x);
                if (distance < minDistance && distance < 80) { // Within pushing range
                    minDistance = distance;
                    nearestTire = tire;
                }
            }
        }
        
        if (nearestTire) {
            // Push the tire
            nearestTire.pushed = true;
            nearestTire.velocityX = this.papaSandy.direction * 3;
            nearestTire.pushTime = 180; // 3 seconds
            
            // Add score for pushing tire
            this.score += 50;
        }
    }
    
    // Story system methods
    startStory(mode) {
        this.storyMode = mode;
        this.storyTimer = 0;
        this.storyScrollY = 0;
        this.storyAutoScroll = true;
        this.gameState = 'SPLASH';
        
        // Calculate max scroll distance
        const lines = this.stories[this.storyMode].split('\n');
        this.storyMaxScroll = Math.max(0, (lines.length * 25) - (this.canvas.height - 100));
    }
    
    updateStory() {
        if (this.gameState !== 'SPLASH') return;
        
        // Handle skip with any key
        if (this.keys['Space'] || this.keys['Enter'] || this.keys['Escape'] || 
            Object.values(this.keys).some(key => key === true)) {
            this.startGame();
            return;
        }
        
        // Auto-scroll story
        if (this.storyAutoScroll && this.storyScrollY < this.storyMaxScroll) {
            this.storyScrollY += this.storySpeed;
            if (this.storyScrollY >= this.storyMaxScroll) {
                this.storyScrollY = this.storyMaxScroll;
                this.storyAutoScroll = false;
            }
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
        
        // Draw scrolling story text
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';
        
        const storyLines = this.stories[this.storyMode].split('\n');
        const lineHeight = 25;
        const startY = 120;
        const maxLines = Math.floor((this.canvas.height - 140) / lineHeight);
        
        // Calculate which lines to show
        const startLine = Math.floor(this.storyScrollY / lineHeight);
        const endLine = Math.min(startLine + maxLines + 1, storyLines.length);
        
        for (let i = startLine; i < endLine; i++) {
            const lineY = startY + ((i - startLine) * lineHeight) - (this.storyScrollY % lineHeight);
            if (lineY > 50 && lineY < this.canvas.height - 50) {
                this.ctx.fillText(storyLines[i], 50, lineY);
            }
        }
        
        // Draw progress indicator
        if (this.storyMaxScroll > 0) {
            const progress = this.storyScrollY / this.storyMaxScroll;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.fillRect(50, this.canvas.height - 30, (this.canvas.width - 100) * progress, 4);
            this.ctx.strokeStyle = '#FFFFFF';
            this.ctx.strokeRect(50, this.canvas.height - 30, this.canvas.width - 100, 4);
        }
        
        // Draw skip prompt
        this.ctx.fillStyle = '#CCCCCC';
        this.ctx.font = '16px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press any key to skip...', this.canvas.width / 2, this.canvas.height - 50);
    }
    
    startGame() {
        this.gameState = 'PLAYING';
        this.storyMode = 'WORLD_1';
        this.playBackgroundMusic();
        this.initializeWorld(1);
    }
    
    showWorldIntro() {
        this.startStory('WORLD_' + this.currentWorld);
    }
}}
