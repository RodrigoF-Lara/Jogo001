// Canvas e contexto
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Sistema de Sons com Web Audio API + Áudio de Arquivo
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.audioFiles = {};
        this.isLoadingAudio = false;
        this.initAudioContext();
        this.loadAudioFiles();
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    loadAudioFiles() {
        // Tenta carregar arquivos de áudio da pasta audio/
        const audioTypes = ['engine', 'level_up', 'collision', 'score'];
        
        audioTypes.forEach(type => {
            const audio = new Audio();
            audio.src = `audio/${type}.mp3`;
            audio.onerror = () => {
                // Se não encontrar, usa síntese de áudio
                console.log(`⚠️ Áudio ${type}.mp3 não encontrado. Usando síntese.`);
            };
            this.audioFiles[type] = audio;
        });
    }

    playAudioFile(type) {
        if (!this.enabled) return;
        
        try {
            const audio = this.audioFiles[type];
            if (audio && audio.src) {
                // Para o som de motor, usar loop
                if (type === 'engine') {
                    audio.loop = true;
                    audio.currentTime = 0;
                } else {
                    audio.loop = false;
                    audio.currentTime = 0;
                }
                audio.play().catch(e => {
                    // Se falhar, usa síntese de áudio como fallback
                    this.playSynthSound(type);
                });
            }
        } catch (e) {
            this.playSynthSound(type);
        }
    }

    playSynthSound(type, duration = 0.2) {
        if (!this.enabled || !this.audioContext) return;

        const now = this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();

        oscillator.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        if (type === 'collision') {
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(100, now + duration);
            gainNode.gain.setValueAtTime(0.4, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        } else if (type === 'engine') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(150 + Math.random() * 50, now);
            oscillator.frequency.linearRampToValueAtTime(200 + Math.random() * 50, now + 0.1);
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(100, now);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        } else if (type === 'gameOver') {
            oscillator.frequency.setValueAtTime(400, now);
            oscillator.frequency.exponentialRampToValueAtTime(200, now + duration);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
        } else if (type === 'score') {
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.25, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.setValueAtTime(1000, now + 0.067);
            oscillator.frequency.setValueAtTime(1200, now + 0.133);
        } else if (type === 'level_up') {
            // Som celebrativo de passagem de nível
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            
            oscillator.frequency.setValueAtTime(523, now);        // C
            oscillator.frequency.setValueAtTime(659, now + 0.1);  // E
            oscillator.frequency.setValueAtTime(784, now + 0.2);  // G
            duration = 0.3;
        }

        oscillator.start(now);
        oscillator.stop(now + (type === 'score' ? 0.2 : type === 'level_up' ? 0.3 : duration));
    }

    playSound(type, duration = 0.2) {
        // Tenta usar arquivo de áudio, se falhar usa síntese
        if (type === 'engine' || type === 'level_up' || type === 'collision' || type === 'score') {
            this.playAudioFile(type);
        } else {
            this.playSynthSound(type, duration);
        }
    }

    toggleSound() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    stopEngine() {
        if (this.audioFiles['engine']) {
            this.audioFiles['engine'].pause();
            this.audioFiles['engine'].currentTime = 0;
        }
    }
}

const soundManager = new SoundManager();

// Classe do Carro
class Car {
    constructor() {
        this.width = 40;
        this.height = 60;
        this.x = canvas.width / 2 - this.width / 2;
        this.y = canvas.height - 100;
        this.velocity = 0; // Velocidade do carro (pixel/frame)
        this.maxVelocity = 12; // Velocidade máxima
        this.minVelocity = 2; // Velocidade mínima
        this.lane = 1; // 0 = esquerda, 1 = meio, 2 = direita
        this.lanePositions = [50, 180, 310];
        this.lastEngineSound = 0;
    }

    update() {
        // Movimento suave do carro
        const targetX = this.lanePositions[this.lane];
        this.x += (targetX - this.x) * 0.1;
        
        // Garante que a velocidade fica dentro dos limites
        this.velocity = Math.max(this.minVelocity, Math.min(this.maxVelocity, this.velocity));
    }
    
    accelerate() {
        this.velocity = Math.min(this.maxVelocity, this.velocity + 0.5);
    }
    
    decelerate() {
        this.velocity = Math.max(this.minVelocity, this.velocity - 0.5);
    }

    draw() {
        // Corpo do carro
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Janela
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(this.x + 5, this.y + 15, this.width - 10, 20);

        // Rodas
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y, 8, 10);
        ctx.fillRect(this.x + this.width - 16, this.y, 8, 10);
        ctx.fillRect(this.x + 8, this.y + this.height - 10, 8, 10);
        ctx.fillRect(this.x + this.width - 16, this.y + this.height - 10, 8, 10);
        
        // Indicador de velocidade
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${Math.round(this.velocity * 10)} km/h`, this.x - 5, this.y - 5);
    }

    moveLeft() {
        if (this.lane > 0) this.lane--;
    }

    moveRight() {
        if (this.lane < this.lanePositions.length - 1) this.lane++;
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Classe de Obstáculo
class Obstacle {
    constructor(lane, speed, type = 'car', lanePositions) {
        this.width = 40;
        this.height = 60;
        this.lanePositions = lanePositions;
        this.lane = lane;
        this.x = this.lanePositions[lane];
        this.y = -this.height;
        this.speed = speed;
        this.type = type;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        switch(this.type) {
            case 'car':
                this.drawCar();
                break;
            case 'tree':
                this.drawTree();
                break;
            case 'wall':
                this.drawWall();
                break;
            case 'animal':
                this.drawAnimal();
                break;
            case 'box':
                this.drawBox();
                break;
        }
    }

    drawCar() {
        // Outro carro
        ctx.fillStyle = '#0099ff';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Janela
        ctx.fillStyle = '#87ceeb';
        ctx.fillRect(this.x + 5, this.y + 15, this.width - 10, 20);

        // Rodas
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y, 8, 10);
        ctx.fillRect(this.x + this.width - 16, this.y, 8, 10);
    }

    drawTree() {
        // Tronco
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x + 12, this.y + 30, 16, 30);

        // Copa
        ctx.fillStyle = '#228B22';
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 20, 18, 0, Math.PI * 2);
        ctx.fill();

        // Detalhes
        ctx.fillStyle = '#1a6b1a';
        ctx.beginPath();
        ctx.arc(this.x + 10, this.y + 25, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 25, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    drawWall() {
        // Parede de concreto com tijolos
        ctx.fillStyle = '#696969';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Padrão de tijolos
        ctx.strokeStyle = '#505050';
        ctx.lineWidth = 2;
        for (let i = 0; i < 3; i++) {
            ctx.strokeRect(this.x + 5, this.y + i * 20 + 5, this.width - 10, 15);
        }

        // Brilho
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(this.x, this.y, this.width, 5);
    }

    drawAnimal() {
        // Corpo de animal (coelho/cervo)
        ctx.fillStyle = '#8B6F47';
        ctx.beginPath();
        ctx.ellipse(this.x + 20, this.y + 35, 12, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cabeça
        ctx.beginPath();
        ctx.arc(this.x + 20, this.y + 15, 10, 0, Math.PI * 2);
        ctx.fill();

        // Orelhas
        ctx.fillStyle = '#A0826D';
        ctx.beginPath();
        ctx.ellipse(this.x + 15, this.y + 5, 4, 10, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 25, this.y + 5, 4, 10, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Olhos
        ctx.fillStyle = '#000';
        ctx.arc(this.x + 17, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(this.x + 23, this.y + 12, 2, 0, Math.PI * 2);
        ctx.fill();

        // Cauda
        ctx.fillStyle = '#8B6F47';
        ctx.fillRect(this.x + 28, this.y + 30, 8, 15);
    }

    drawBox() {
        // Caixa
        ctx.fillStyle = '#DAA520';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Linha da caixa
        ctx.strokeStyle = '#8B7500';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Padrão X
        ctx.beginPath();
        ctx.moveTo(this.x + 5, this.y + 5);
        ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(this.x + this.width - 5, this.y + 5);
        ctx.lineTo(this.x + 5, this.y + this.height - 5);
        ctx.stroke();
    }

    isOffScreen() {
        return this.y > canvas.height;
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Classe do Jogo
class Game {
    constructor() {
        // Sistema de Faixas Dinâmicas
        this.numLanes = 6; // Começa com 6 faixas
        this.minLanes = 2; // Mínimo de 2 faixas
        this.lanePositions = [];
        this.updateLanePositions();
        
        this.car = new Car();
        this.car.lane = Math.floor(this.numLanes / 2); // Começa no meio
        this.car.lanePositions = this.lanePositions;
        
        this.obstacles = [];
        this.score = 0; // Em centenas de metros (x10 = quilometragem)
        this.gameOver = false;
        this.obstacleSpeed = 5;
        this.spawnRate = 60; // Frames entre spawns
        this.frameCounter = 0;
        this.obstacleTypes = ['car', 'tree', 'wall', 'animal', 'box'];
        this.lastDodgeScore = 0;
        
        // Sistema de Fases
        this.level = 1;
        this.levelDistance = 150; // A cada 15km (150 x 0.1)
        this.lastLevelScore = 0;
        this.showingLevelUp = false;
        this.levelUpTimer = 0;
        this.levelUpDuration = 180; // 3 segundos em 60fps
    }

    updateLanePositions() {
        // Calcula posições das faixas dinamicamente
        this.lanePositions = [];
        const laneWidth = canvas.width / this.numLanes;
        for (let i = 0; i < this.numLanes; i++) {
            this.lanePositions.push(i * laneWidth + laneWidth / 2 - 20);
        }
    }

    checkLevelUp() {
        const currentLevel = Math.floor(this.score / this.levelDistance) + 1;
        if (currentLevel > this.level) {
            this.level = currentLevel;
            this.showingLevelUp = true;
            this.levelUpTimer = 0;
            soundManager.playSound('level_up');
            
            // Reduz número de faixas a cada 2 níveis
            const newNumLanes = Math.max(this.minLanes, 6 - Math.floor((this.level - 1) / 2));
            if (newNumLanes !== this.numLanes) {
                this.numLanes = newNumLanes;
                this.updateLanePositions();
                this.car.lanePositions = this.lanePositions;
                // Ajusta posição do carro se necessário
                if (this.car.lane >= this.numLanes) {
                    this.car.lane = this.numLanes - 1;
                }
            }
            
            // Aumenta dificuldade
            this.obstacleSpeed += 1;
            this.spawnRate = Math.max(25, this.spawnRate - 3);
        }
    }

    spawnObstacle() {
        if (this.frameCounter % this.spawnRate === 0) {
            const lane = Math.floor(Math.random() * this.numLanes);
            const type = this.obstacleTypes[Math.floor(Math.random() * this.obstacleTypes.length)];
            // Obstáculos aparecem com a velocidade combinada
            const obstacle = new Obstacle(lane, this.obstacleSpeed + this.car.velocity * 0.5, type, this.lanePositions);
            this.obstacles.push(obstacle);

            // Aumenta dificuldade a cada 5000m
            if (this.score > 0 && this.score % 50 === 0) {
                this.obstacleSpeed = Math.min(12, this.obstacleSpeed + 0.5);
                this.spawnRate = Math.max(30, this.spawnRate - 2);
            }
        }
    }

    update() {
        if (this.gameOver) return;

        this.frameCounter++;
        this.car.update();
        
        // Quilometragem baseada na velocidade real do carro
        // Quanto mais rápido, mais km percorre por segundo
        const kmPerFrame = this.car.velocity * 0.0008; // ~1km/s na velocidade máxima
        this.score += kmPerFrame * 10; // Multiplica por 10 (score é em centenas de metros)
        
        this.spawnObstacle();
        
        // Toca som do motor continuamente como fundo
        if (this.frameCounter - this.car.lastEngineSound > 8) {
            soundManager.playSound('engine', 0.1);
            this.car.lastEngineSound = this.frameCounter;
        }
        
        // Atualiza animação de level up
        if (this.showingLevelUp) {
            this.levelUpTimer++;
            if (this.levelUpTimer >= this.levelUpDuration) {
                this.showingLevelUp = false;
            }
        }
        
        // Verifica se passou de fase
        this.checkLevelUp();

        // Atualiza obstáculos
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update();

            // Remove obstáculos que saíram da tela
            if (this.obstacles[i].isOffScreen()) {
                this.obstacles.splice(i, 1);
                soundManager.playSound('score');
            }
        }

        // Verifica colisão
        this.checkCollision();
    }

    checkCollision() {
        const carRect = this.car.getRect();

        for (let obstacle of this.obstacles) {
            const obsRect = obstacle.getRect();

            if (this.rectsCollide(carRect, obsRect)) {
                this.gameOver = true;
                soundManager.stopEngine(); // Para o som do motor
                soundManager.playSound('gameOver', 0.5);
                this.showGameOver();
            }
        }
    }

    rectsCollide(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    draw() {
        // Fundo (estrada)
        ctx.fillStyle = '#2d3436';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Marcação da estrada (animada de acordo com a velocidade)
        // Desenha linhas divisórias entre as faixas
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 10]);
        // A velocidade da animação acompanha a velocidade do carro
        ctx.lineDashOffset = -(this.frameCounter * this.car.velocity * 0.5) % 30;
        
        const laneWidth = canvas.width / this.numLanes;
        for (let i = 1; i < this.numLanes; i++) {
            ctx.beginPath();
            ctx.moveTo(i * laneWidth, 0);
            ctx.lineTo(i * laneWidth, canvas.height);
            ctx.stroke();
        }
        ctx.setLineDash([]);

        // Desenha obstáculos
        for (let obstacle of this.obstacles) {
            obstacle.draw();
        }

        // Desenha carro
        this.car.draw();
        
        // Desenha animação de passagem de nível
        if (this.showingLevelUp) {
            this.drawLevelUp();
        }
    }
    
    drawLevelUp() {
        // Fundo semitransparente
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Calcular escala de animação
        const progress = this.levelUpTimer / this.levelUpDuration;
        let scale = 0.5 + progress * 0.5; // Começa pequeno, cresce
        if (progress > 0.7) {
            scale = 1.2 - (progress - 0.7) * 0.67; // Depois encolhe
        }
        
        // Salvar contexto
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.scale(scale, scale);
        
        // Fundo da mensagem
        ctx.fillStyle = 'rgba(255, 215, 0, 0.9)';
        ctx.fillRect(-70, -40, 140, 80);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.strokeRect(-70, -40, 140, 80);
        
        // Texto
        ctx.fillStyle = '#000';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`FASE ${this.level}!`, 0, -5);
        
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`${this.level * 15}km`, 0, 20);
        
        // Restaurar contexto
        ctx.restore();
    }

    showGameOver() {
        const gameOverScreen = document.getElementById('gameOverScreen');
        gameOverScreen.innerHTML = `
            <div class="gameOverContent">
                <h1>GAME OVER! Comprou a carteira foi ?!</h1>
                <p id="finalScore">Quilometragem Final: ${Math.floor(this.score / 10)} km que perigo....</p>
                <button onclick="location.reload()">Jogar Novamente</button>
            </div>
        `;
        gameOverScreen.classList.remove('hidden');
    }

    getScore() {
        return this.score / 10; // Converte para quilometragem (km)
    }
    
    getCurrentLevel() {
        return Math.floor(this.getScore() / 15) + 1;
    }
}

// Controles
const keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        game.car.moveLeft();
    }
    if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        game.car.moveRight();
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        game.car.accelerate();
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        game.car.decelerate();
    }
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Suporte para touch (mobile)
let touchStartX = 0;
canvas.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
});

canvas.addEventListener('touchmove', (e) => {
    const touchEndX = e.touches[0].clientX;
    const diff = touchEndX - touchStartX;
    
    if (diff > 50) {
        game.car.moveRight();
        touchStartX = touchEndX;
    } else if (diff < -50) {
        game.car.moveLeft();
        touchStartX = touchEndX;
    }
});

// Botão de controle de som
const soundToggle = document.getElementById('soundToggle');
soundToggle.addEventListener('click', () => {
    const enabled = soundManager.toggleSound();
    soundToggle.textContent = enabled ? '🔊 Som ON' : '🔇 Som OFF';
    soundToggle.classList.toggle('muted');
    soundManager.playSound('dodge');
});

// Loop do jogo
let game = new Game();

function gameLoop() {
    game.update();
    game.draw();

    // Atualiza UI
    document.getElementById('score').textContent = `Quilometragem: ${game.getScore().toFixed(1)} km`;
    document.getElementById('levelDisplay').textContent = `Fase: ${game.level}`;

    requestAnimationFrame(gameLoop);
}

gameLoop();
