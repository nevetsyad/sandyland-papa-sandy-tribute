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
        this.gameState = 'PLAYING';
        
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
            direction: 1
        };
        
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
            }
        ];
        
        // Background elements
        this.palms = [
            { x: 50, y: 300, scale: 0.8 },
            { x: 700, y: 280, scale: 1.0 }
        ];
        
        this.setupEventListeners();
        this.gameLoop();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle jumping
            if ((e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') && this.papaSandy.onGround) {
                this.papaSandy.velocityY = -this.papaSandy.jumpPower;
                this.papaSandy.onGround = false;
            }
            
            e.preventDefault();
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            e.preventDefault();
        });
    }
    
    update() {
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
    
    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw ground
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);
        
        // Draw grass
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.groundY, this.canvas.width, 10);
        
        // Draw palm trees
        this.ctx.fillStyle = '#8B4513';
        for (let palm of this.palms) {
            this.ctx.fillRect(palm.x, palm.y, 8, 40);
            this.ctx.fillStyle = '#228B22';
            this.ctx.beginPath();
            this.ctx.arc(palm.x + 4, palm.y - 10, 20, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.fillStyle = '#8B4513';
        }
        
        // Draw Papa Sandy
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(this.papaSandy.x, this.papaSandy.y, this.papaSandy.width, this.papaSandy.height);
        
        // Draw enemies
        for (let enemy of this.enemies) {
            if (!enemy.alive) continue;
            
            if (enemy.type === 'crab') {
                this.ctx.fillStyle = '#FF6347';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }
        
        // Draw score
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Score: 0', 10, 30);
        this.ctx.fillText('Lives: 3', 10, 60);
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}