// --- Inisialisasi Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mengatur dimensi canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 250;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- Inisialisasi Audio (Tone.js) ---
// Membuat synthesizer untuk suara lompat dan game over
const jumpSound = new Tone.Synth({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 }
}).toDestination();

const gameOverSound = new Tone.Synth({
    oscillator: { type: 'sine' },
    envelope: { attack: 0.01, decay: 0.5, sustain: 0.1, release: 0.5 }
}).toDestination();


// --- Variabel & Konstanta Game ---
const GROUND_Y = CANVAS_HEIGHT - 50;
const PLAYER_X_POSITION = 50;

// Properti Pemain
const PLAYER_WIDTH = 44; // Lebar disesuaikan dengan sprite baru
const PLAYER_HEIGHT = 47; // Tinggi disesuaikan dengan sprite baru
const PLAYER_DUCK_WIDTH = 59;
const PLAYER_DUCK_HEIGHT = 25;
const JUMP_STRENGTH = 17;
const GRAVITY = 0.8;

// State Game
let gameSpeed = 5;
let score = 0;
let isGameOver = true; // Game dimulai dengan status 'over' untuk menampilkan menu
let gameStarted = false; // Untuk melacak apakah game sudah pernah dimulai
let obstacles = [];
let frameCount = 0;
let obstacleSpawnInterval = 100;

// --- Objek Game (Classes) ---

// Class untuk Player (Dinosaurus)
class Player {
    constructor() {
        this.x = PLAYER_X_POSITION;
        this.originalWidth = PLAYER_WIDTH;
        this.originalHeight = PLAYER_HEIGHT;
        this.width = this.originalWidth;
        this.height = this.originalHeight;
        this.y = GROUND_Y - this.height;
        this.velocityY = 0;
        this.isJumping = false;
        this.isDucking = false;
    }

    // Menggambar pemain dengan gaya pixel art
    draw() {
        ctx.fillStyle = '#555';
        const legFrame = Math.floor(frameCount / 5) % 2; // Ganti posisi kaki setiap 5 frame

        if (this.isDucking) {
            // Gambar saat menunduk (pixel art)
            ctx.fillRect(this.x, this.y + 15, 15, 5);
            ctx.fillRect(this.x + 15, this.y + 10, 5, 10);
            ctx.fillRect(this.x + 20, this.y + 5, 25, 5);
            ctx.fillRect(this.x + 45, this.y, 10, 10);
            // Kaki saat menunduk
            if (legFrame === 0) {
                 ctx.fillRect(this.x + 20, this.y + 20, 10, 5);
                 ctx.fillRect(this.x + 35, this.y + 20, 10, 5);
            } else {
                 ctx.fillRect(this.x + 15, this.y + 20, 10, 5);
                 ctx.fillRect(this.x + 30, this.y + 20, 10, 5);
            }
        } else {
            // Gambar saat berdiri (pixel art)
            ctx.fillRect(this.x, this.y + 30, 15, 5);
            ctx.fillRect(this.x + 5, this.y + 35, 10, 10);
            ctx.fillRect(this.x + 15, this.y + 20, 5, 15);
            ctx.fillRect(this.x + 20, this.y + 10, 15, 20);
            ctx.fillRect(this.x + 35, this.y, 10, 15);
            // Kaki (animasi sederhana)
            if (this.isJumping) {
                ctx.fillRect(this.x + 20, this.y + 30, 5, 10);
                ctx.fillRect(this.x + 30, this.y + 30, 5, 10);
            } else if (legFrame === 0) {
                ctx.fillRect(this.x + 20, this.y + 30, 5, 15);
                ctx.fillRect(this.x + 30, this.y + 30, 5, 5);
            } else {
                ctx.fillRect(this.x + 20, this.y + 30, 5, 5);
                ctx.fillRect(this.x + 30, this.y + 30, 5, 15);
            }
        }
    }

    update() {
        if (this.isJumping) {
            this.y += this.velocityY;
            this.velocityY += GRAVITY;
        }
        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }

    jump() {
        if (!this.isJumping && !this.isDucking) {
            this.velocityY = -JUMP_STRENGTH;
            this.isJumping = true;
            // Mainkan suara lompat
            jumpSound.triggerAttackRelease("C5", "8n");
        }
    }
    
    duck(isDucking) {
        if (this.isJumping) return;
        this.isDucking = isDucking;
        this.width = isDucking ? PLAYER_DUCK_WIDTH : this.originalWidth;
        this.height = isDucking ? PLAYER_DUCK_HEIGHT : this.originalHeight;
        this.y = GROUND_Y - this.height;
    }
}

// Base Class untuk rintangan
class Obstacle {
    constructor() {
        this.x = CANVAS_WIDTH;
        this.isScored = false;
    }
    update() {
        this.x -= gameSpeed;
    }
}

// Class untuk Kaktus
class Cactus extends Obstacle {
    constructor() {
        super();
        this.width = 20 + (Math.random() * 20);
        this.height = 40 + (Math.random() * 20);
        this.y = GROUND_Y - this.height;
    }
    draw() {
        ctx.fillStyle = '#2a9d8f';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillRect(this.x - 5, this.y + 10, 5, this.height / 2);
        ctx.fillRect(this.x + this.width, this.y + 15, 5, this.height / 2);
    }
}

// Class untuk Pterodactyl
class Pterodactyl extends Obstacle {
    constructor() {
        super();
        this.width = 50;
        this.height = 30;
        this.y = GROUND_Y - 80 - (Math.random() * 40);
    }
    draw() {
        ctx.fillStyle = '#e76f51';
        const wingFrame = Math.floor(frameCount / 8) % 2;
        ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 10);
        if (wingFrame === 0) {
            ctx.fillRect(this.x, this.y, this.width, 10);
        } else {
            ctx.fillRect(this.x, this.y + 5, this.width, 10);
        }
    }
}

const player = new Player();

// --- Fungsi Utama Game ---

function spawnObstacle() {
    frameCount++;
    if (frameCount > obstacleSpawnInterval) {
        if (Math.random() < 0.3 && score > 300) {
            obstacles.push(new Pterodactyl());
        } else {
            obstacles.push(new Cactus());
        }
        frameCount = 0;
        obstacleSpawnInterval = Math.floor(Math.random() * 50) + 70 - (gameSpeed * 3);
        if (obstacleSpawnInterval < 50) obstacleSpawnInterval = 50;
    }
}

function detectCollision() {
    for (const obs of obstacles) {
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            isGameOver = true;
            gameOverSound.triggerAttackRelease("C3", "0.5s");
        }
    }
}

function updateScore() {
    for (const obs of obstacles) {
        if (obs.x + obs.width < player.x && !obs.isScored) {
            obs.isScored = true;
            score += 25;
        }
    }
    ctx.fillStyle = '#333';
    ctx.font = '20px "Courier New", Courier, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`Score: ${score}`, CANVAS_WIDTH - 20, 30);
    ctx.textAlign = 'center';
}

function increaseDifficulty() {
    if (score > 0 && score % 200 === 0 && score !== 0) {
        if (gameSpeed < 18) {
            gameSpeed += 0.5;
        }
    }
}

function drawGround() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
}

function resetGame() {
    gameStarted = true;
    isGameOver = false;
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    player.duck(false);
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    gameLoop();
}

function showGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 50px Arial';
    ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Skor Akhir: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    ctx.font = '16px Arial';
    ctx.fillText('Tekan Spasi untuk Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}

// Fungsi baru untuk menampilkan menu petunjuk
function showInstructions() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGround();
    player.draw(); // Gambar dino di posisi awal
    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#333';
    ctx.fillText('Petunjuk Permainan', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

    ctx.font = '18px Arial';
    ctx.fillText('Spasi / Panah Atas  ->  Lompat', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    ctx.fillText('Panah Bawah  ->  Menunduk', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 10);
    
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#e76f51';
    ctx.fillText('Tekan Spasi untuk Mulai', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}


function gameLoop() {
    if (isGameOver) {
        if(gameStarted) {
            showGameOverScreen();
        } else {
            showInstructions();
        }
        return;
    }

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGround();
    player.update();
    player.draw();

    spawnObstacle();
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].draw();
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    detectCollision();
    updateScore();
    increaseDifficulty();

    requestAnimationFrame(gameLoop);
}

// --- Input Handler ---
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (isGameOver) {
            resetGame();
        } else {
            player.jump();
        }
    } else if (e.code === 'ArrowDown') {
        if (!isGameOver) {
            player.duck(true);
        }
    }
});

window.addEventListener('keyup', (e) => {
    if (e.code === 'ArrowDown') {
        if (!isGameOver) {
            player.duck(false);
        }
    }
});

// --- Memulai Game ---
gameLoop(); // Mulai game loop untuk menampilkan menu petunjuk
