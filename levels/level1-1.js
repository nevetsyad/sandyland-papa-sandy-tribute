// Level 1-1: Sandy Shores - Tutorial Level
class SandyShoresLevel {
    constructor(game) {
        this.game = game;
        this.name = "Sandy Shores";
        this.description = "Learn the basics of movement and jumping";
        this.background = "beach-sunset";
        this.difficulty = "Tutorial";
        
        // Level platforms
        this.platforms = [
            // Ground
            { x: 0, y: game.groundY, width: 1000, height: 100, type: 'sand' },
            
            // Tutorial platforms
            { x: 150, y: 450, width: 100, height: 20, type: 'wood' },
            { x: 300, y: 400, width: 100, height: 20, type: 'wood' },
            { x: 500, y: 350, width: 100, height: 20, type: 'wood' },
            { x: 700, y: 300, width: 100, height: 20, type: 'wood' },
            
            // Palm tree platforms
            { x: 100, y: 500, width: 60, height: 60, type: 'palm-tree' },
            { x: 850, y: 500, width: 60, height: 60, type: 'palm-tree' }
        ];
        
        // Decorative elements
        this.decorations = [
            // Palm trees
            { x: 80, y: 420, type: 'palm-tree', scale: 1.2, swaying: true },
            { x: 200, y: 380, type: 'palm-tree', scale: 0.8 },
            { x: 400, y: 350, type: 'palm-tree', scale: 1.0 },
            { x: 600, y: 320, type: 'palm-tree', scale: 0.9 },
            { x: 750, y: 270, type: 'palm-tree', scale: 1.1 },
            { x: 900, y: 420, type: 'palm-tree', scale: 1.3 },
            
            // Seashells
            { x: 250, y: game.groundY - 5, type: 'seashell', scale: 0.5 },
            { x: 450, y: game.groundY - 5, type: 'seashell', scale: 0.7 },
            { x: 650, y: game.groundY - 5, type: 'seashell', scale: 0.6 },
            
            // Sand dunes
            { x: 350, y: game.groundY - 30, width: 80, height: 30, type: 'sand-dune' },
            { x: 550, y: game.groundY - 20, width: 60, height: 20, type: 'sand-dune' }
        ];
        
        // Tutorial messages
        this.tutorialMessages = [
            { x: 100, y: 200, text: "Use ARROW KEYS to move", trigger: true },
            { x: 300, y: 150, text: "Press SPACEBAR to jump", trigger: true },
            { x: 500, y: 100, text: "Welcome to Sandyland!", trigger: true },
            { x: 700, y: 50, text: "Your Corvette is missing!", trigger: true }
        ];
        
        // Level objectives
        this.objectives = [
            { type: 'move', target: 200, description: "Move right to start" },
            { type: 'jump', target: 1, description: "Jump on the first platform" },
            { type: 'reach', target: { x: 750, y: 300 }, description: "Reach the final platform" }
        ];
        
        // Completion flag
        this.completed = false;
        this.currentObjective = 0;
    }
    
    update() {
        // Check tutorial message triggers
        this.tutorialMessages.forEach((msg, index) => {
            if (msg.trigger && this.game.papaSandy.x > msg.x - 50) {
                msg.trigger = false;
                // Show tutorial message
                this.showTutorialMessage(msg.text);
            }
        });
        
        // Check objectives
        if (this.currentObjective < this.objectives.length) {
            const obj = this.objectives[this.currentObjective];
            if (obj.type === 'reach') {
                const distance = Math.sqrt(
                    Math.pow(this.game.papaSandy.x - obj.target.x, 2) + 
                    Math.pow(this.game.papaSandy.y - obj.target.y, 2)
                );
                if (distance < 50) {
                    this.completeObjective();
                }
            }
        }
    }
    
    completeObjective() {
        this.currentObjective++;
        if (this.currentObjective >= this.objectives.length) {
            this.completed = true;
            this.game.showLevelComplete("Great job! Ready for the beach bars?");
        }
    }
    
    showTutorialMessage(text) {
        // This will be handled by the game UI system
        this.game.pendingMessage = text;
    }
    
    render(ctx) {
        // Render background elements
        this.renderBackground(ctx);
        
        // Render decorations
        this.decorations.forEach(dec => {
            this.renderDecoration(ctx, dec);
        });
        
        // Render tutorial messages
        this.tutorialMessages.forEach(msg => {
            if (msg.trigger) {
                ctx.fillStyle = 'white';
                ctx.font = '16px Courier New';
                ctx.textAlign = 'center';
                ctx.fillText(msg.text, msg.x, msg.y);
            }
        });
    }
    
    renderBackground(ctx) {
        // Beach sunset gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#FF6B6B'); // Sunset red
        gradient.addColorStop(0.3, '#FFE66D'); // Sunset yellow
        gradient.addColorStop(0.6, '#4ECDC4'); // Ocean teal
        gradient.addColorStop(1, '#95E1D3'); // Beach green
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1000, 600);
        
        // Ocean waves
        ctx.fillStyle = '#4ECDC4';
        for (let i = 0; i < 5; i++) {
            const waveY = 500 + i * 20;
            const waveX = (Date.now() / 1000 + i * 100) % 1000;
            ctx.beginPath();
            ctx.arc(waveX, waveY, 30, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    renderDecoration(ctx, decoration) {
        ctx.save();
        
        switch (decoration.type) {
            case 'palm-tree':
                this.renderPalmTree(ctx, decoration);
                break;
            case 'seashell':
                this.renderSeashell(ctx, decoration);
                break;
            case 'sand-dune':
                this.renderSandDune(ctx, decoration);
                break;
        }
        
        ctx.restore();
    }
    
    renderPalmTree(ctx, tree) {
        const x = tree.x;
        const y = tree.y;
        const scale = tree.scale || 1.0;
        
        // Trunk
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(x - 5 * scale, y, 10 * scale, 40 * scale);
        
        // Leaves
        ctx.fillStyle = '#228B22';
        const sway = tree.swaying ? Math.sin(Date.now() / 1000) * 5 : 0;
        ctx.beginPath();
        ctx.arc(x + sway, y - 10 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // Coconuts
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(x + sway - 8 * scale, y - 15 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.arc(x + sway + 8 * scale, y - 15 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    
    renderSeashell(ctx, shell) {
        const x = shell.x;
        const y = shell.y;
        const scale = shell.scale || 1.0;
        
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.ellipse(x, y, 8 * scale, 6 * scale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#DEB887';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    renderSandDune(ctx, dune) {
        const x = dune.x;
        const y = dune.y;
        const width = dune.width || 60;
        const height = dune.height || 20;
        
        ctx.fillStyle = '#F4A460';
        ctx.beginPath();
        ctx.ellipse(x, y, width, height, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}