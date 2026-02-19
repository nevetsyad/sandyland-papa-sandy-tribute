// Sandyland Performance Monitor & Optimizer
// Phase 5: Performance Optimization System

class SandylandPerformanceMonitor {
    constructor() {
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.targetFPS = 60;
        this.frameSamples = [];
        this.maxSamples = 60;
        this.isMonitoring = false;
        
        // Performance metrics
        this.metrics = {
            fps: 60,
            averageFPS: 60,
            memoryUsage: 0,
            renderTime: 0,
            updateTime: 0,
            loadTime: 0
        };
        
        // Start monitoring
        this.startMonitoring();
    }
    
    startMonitoring() {
        this.isMonitoring = true;
        this.loadTime = performance.now();
        this.monitorFrame();
    }
    
    stopMonitoring() {
        this.isMonitoring = false;
    }
    
    monitorFrame() {
        if (!this.isMonitoring) return;
        
        const now = performance.now();
        const delta = now - this.lastTime;
        this.fps = Math.round(1000 / delta);
        
        // Store frame samples for average calculation
        this.frameSamples.push(this.fps);
        if (this.frameSamples.length > this.maxSamples) {
            this.frameSamples.shift();
        }
        
        // Calculate average FPS
        const sum = this.frameSamples.reduce((a, b) => a + b, 0);
        this.metrics.averageFPS = Math.round(sum / this.frameSamples.length);
        this.metrics.fps = this.fps;
        
        // Update memory usage if available
        if (performance.memory) {
            this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024);
        }
        
        this.lastTime = now;
        
        // Continue monitoring
        requestAnimationFrame(() => this.monitorFrame());
    }
    
    getPerformanceReport() {
        return {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            frameSamples: this.frameSamples.slice(-10), // Last 10 frames
            status: this.getPerformanceStatus()
        };
    }
    
    getPerformanceStatus() {
        const avgFPS = this.metrics.averageFPS;
        
        if (avgFPS >= 55) return 'Excellent';
        if (avgFPS >= 45) return 'Good';
        if (avgFPS >= 30) return 'Fair';
        return 'Poor';
    }
    
    shouldOptimize() {
        return this.metrics.averageFPS < 45 || this.metrics.memoryUsage > 50;
    }
}

// Sandyland Optimizer Class
class SandylandOptimizer {
    constructor(game) {
        this.game = game;
        this.performanceMonitor = new SandylandPerformanceMonitor();
        this.optimizationSettings = {
            particleCount: 20, // Max particles
            enemiesPerScreen: 3,
            powerUpsPerScreen: 2,
            detailLevel: 'high', // high, medium, low
            effectsEnabled: true,
            soundEnabled: true
        };
        this.isOptimized = false;
    }
    
    // Level of Detail System
    updateDetailLevel() {
        const avgFPS = this.performanceMonitor.metrics.averageFPS;
        
        if (avgFPS < 30) {
            this.setDetailLevel('low');
        } else if (avgFPS < 45) {
            this.setDetailLevel('medium');
        } else {
            this.setDetailLevel('high');
        }
    }
    
    setDetailLevel(level) {
        const oldLevel = this.optimizationSettings.detailLevel;
        this.optimizationSettings.detailLevel = level;
        
        switch(level) {
            case 'low':
                this.optimizationSettings.particleCount = 10;
                this.optimizationSettings.enemiesPerScreen = 2;
                this.optimizationSettings.powerUpsPerScreen = 1;
                break;
            case 'medium':
                this.optimizationSettings.particleCount = 15;
                this.optimizationSettings.enemiesPerScreen = 2;
                this.optimizationSettings.powerUpsPerScreen = 1;
                break;
            case 'high':
                this.optimizationSettings.particleCount = 20;
                this.optimizationSettings.enemiesPerScreen = 3;
                this.optimizationSettings.powerUpsPerScreen = 2;
                break;
        }
        
        // Apply optimizations
        this.applyOptimizations();
        
        console.log(`Detail level changed: ${oldLevel} → ${level}`);
    }
    
    applyOptimizations() {
        const settings = this.optimizationSettings;
        
        // Optimize particle system
        if (this.game.particles) {
            // Remove excess particles
            while (this.game.particles.length > settings.particleCount) {
                this.game.particles.pop();
            }
            
            // Reduce particle generation rate
            this.game.maxParticles = settings.particleCount;
        }
        
        // Optimize enemy spawning
        if (this.game.enemies) {
            // Remove distant enemies
            this.game.enemies = this.game.enemies.filter(enemy => {
                const distance = Math.abs(enemy.x - this.game.papaSandy.x);
                return distance < 800; // Only keep enemies within 800px
            });
        }
        
        // Optimize power-up spawning
        if (this.game.powerUps) {
            // Remove distant power-ups
            this.game.powerUps = this.game.powerUps.filter(powerUp => {
                const distance = Math.abs(powerUp.x - this.game.papaSandy.x);
                return distance < 600; // Only keep power-ups within 600px
            });
        }
        
        // Optimize rendering based on detail level
        this.optimizeRendering();
    }
    
    optimizeRendering() {
        const ctx = this.game.ctx;
        const settings = this.optimizationSettings;
        
        switch(settings.detailLevel) {
            case 'low':
                // Reduced quality rendering
                ctx.globalAlpha = 0.8;
                break;
            case 'medium':
                // Medium quality rendering
                ctx.globalAlpha = 0.9;
                break;
            case 'high':
                // Full quality rendering
                ctx.globalAlpha = 1.0;
                break;
        }
    }
    
    // Object Pool for Particles
    createParticlePool() {
        this.particlePool = {
            available: [],
            inUse: [],
            
            acquire() {
                if (this.available.length > 0) {
                    const particle = this.available.pop();
                    this.inUse.push(particle);
                    return this.resetParticle(particle);
                }
                // Create new particle if pool is empty
                return this.createParticle();
            },
            
            release(particle) {
                const index = this.inUse.indexOf(particle);
                if (index > -1) {
                    this.inUse.splice(index, 1);
                    this.available.push(particle);
                }
            },
            
            createParticle() {
                return {
                    x: 0,
                    y: 0,
                    vx: 0,
                    vy: 0,
                    size: 3,
                    color: '#FFD700',
                    life: 1,
                    maxLife: 1
                };
            },
            
            resetParticle(particle) {
                particle.x = 0;
                particle.y = 0;
                particle.vx = 0;
                particle.vy = 0;
                particle.size = 3;
                particle.color = '#FFD700';
                particle.life = 1;
                particle.maxLife = 1;
                return particle;
            },
            
            clear() {
                this.available = [];
                this.inUse = [];
            }
        };
    }
    
    // Performance-optimized collision detection
    optimizedCollisionDetection() {
        if (!this.game.papaSandy || !this.game.enemies) return;
        
        const sandy = this.game.papaSandy;
        
        // Simple distance-based collision detection for performance
        for (let enemy of this.game.enemies) {
            if (!enemy.alive) continue;
            
            const dx = sandy.x - enemy.x;
            const dy = sandy.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Use circular collision for performance
            if (distance < (sandy.width + enemy.width) / 2) {
                this.game.handleEnemyCollision(enemy);
            }
        }
    }
    
    // Get performance report
    getPerformanceReport() {
        return {
            ...this.performanceMonitor.getPerformanceReport(),
            optimizations: {
                detailLevel: this.optimizationSettings.detailLevel,
                particleCount: this.optimizationSettings.particleCount,
                enemiesPerScreen: this.optimizationSettings.enemiesPerScreen,
                powerUpsPerScreen: this.optimizationSettings.powerUpsPerScreen
            },
            timestamp: new Date().toISOString()
        };
    }
    
    // Auto-optimize based on performance
    autoOptimize() {
        if (this.performanceMonitor.shouldOptimize()) {
            this.updateDetailLevel();
            this.applyOptimizations();
            this.isOptimized = true;
        } else {
            this.isOptimized = false;
        }
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SandylandPerformanceMonitor, SandylandOptimizer };
}