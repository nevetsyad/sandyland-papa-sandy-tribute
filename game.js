class SandylandGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        // Game state
        this.keys = {};
        this.gravity = 0.8;
        this.friction = 0.8;
        this.groundY = 500;
        this.gamePhase = 2;
        
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
        
        // Sound effects using Web Audio API
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = {
            collectPowerUp: this.createSound(440, 0.1, 'sine'),
            jump: this.createSound(220, 0.1, 'triangle'),
            rollTire: this.createSound(110, 0.2, 'sawtooth'),
            destroyBarrier: this.createSound(330, 0.3, 'square'),
            enemyDefeat: this.createSound(880, 0.1, 'sine')
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
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
        
        // Spawn power-ups periodically
        setInterval(() => this.spawnPowerUp(), 15000);
    }
    
    // Sound effect creation
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
    
    // Particle effect system
    createParticles(x, y, color, count = 10) {
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 30,
                maxLife: 30,
                color: color,
                size: Math.random() * 4 + 2
            });
        }
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3; // Gravity
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
    
    update() {
        this.updatePapaSandy();
        this.updateTires();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateActivePowerUps();
        this.updateParticles();
        this.checkCollisions();
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
            this.sounds.jump();
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
            
            // Play tire rolling sound
            this.sounds.rollTire();
            
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
                    this.sounds.enemyDefeat();
                    this.createParticles(enemy.x + enemy.width/2, enemy.y + enemy.height/2, '#FF0000', 10);
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
        this.createParticles(x + 15, y + 30, '#FFA500', 15);
        this.sounds.destroyBarrier();
        this.score += 25;
    }
    
    gameOver() {
        // Simple game over - could be expanded with proper game over screen
        alert(`Game Over! Final Score: ${this.score}`);
        location.reload();
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
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw barriers
        this.drawBarriers();
        
        // Draw tires
        this.drawTires();
        
        // Draw power-ups
        this.drawPowerUps();
        
        // Draw particles
        this.drawParticles();
        
        // Draw enemies
        this.drawEnemies();
        
        // Draw Papa Sandy (with power-up effects)
        this.drawPapaSandy();
        
        // Draw UI and story elements
        this.drawEnhancedUI();
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
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
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
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
window.addEventListener('load', () => {
    new SandylandGame();
});