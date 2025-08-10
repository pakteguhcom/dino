// --- Inisialisasi Canvas ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Mengatur dimensi canvas
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 250;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// --- Variabel & Konstanta Game ---
const GROUND_Y = CANVAS_HEIGHT - 50; // Posisi Y tanah
const PLAYER_X_POSITION = 50; // Posisi X pemain yang tetap

// Properti Pemain
const PLAYER_WIDTH = 40;
const PLAYER_HEIGHT = 60;
const JUMP_STRENGTH = 16;
const GRAVITY = 0.8;

// Properti Rintangan
const OBSTACLE_MIN_WIDTH = 20;
const OBSTACLE_MAX_WIDTH = 50;
const OBSTACLE_HEIGHT = 40;

// State Game
let gameSpeed = 5;
let score = 0;
let isGameOver = false;
let obstacles = [];
let frameCount = 0; // Untuk menghitung frame, digunakan untuk spawn rintangan
let obstacleSpawnInterval = 100; // Interval awal spawn rintangan

// --- Objek Game (Classes) ---

// Class untuk Player (Dinosaurus)
class Player {
    constructor() {
        this.x = PLAYER_X_POSITION;
        this.y = GROUND_Y - PLAYER_HEIGHT;
        this.width = PLAYER_WIDTH;
        this.height = PLAYER_HEIGHT;
        this.velocityY = 0;
        this.isJumping = false;
    }

    // Menggambar pemain di canvas
    draw() {
        ctx.fillStyle = '#666';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Memperbarui posisi pemain
    update() {
        // Menerapkan gravitasi
        if (this.isJumping) {
            this.y += this.velocityY;
            this.velocityY += GRAVITY;
        }

        // Mencegah pemain jatuh melewati tanah
        if (this.y + this.height > GROUND_Y) {
            this.y = GROUND_Y - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }
    }

    // Fungsi untuk melompat
    jump() {
        // Hanya bisa melompat jika berada di tanah
        if (!this.isJumping) {
            this.velocityY = -JUMP_STRENGTH;
            this.isJumping = true;
        }
    }
}

// Class untuk Obstacle (Kaktus)
class Obstacle {
    constructor() {
        this.width = Math.random() * (OBSTACLE_MAX_WIDTH - OBSTACLE_MIN_WIDTH) + OBSTACLE_MIN_WIDTH;
        this.height = OBSTACLE_HEIGHT;
        this.x = CANVAS_WIDTH;
        this.y = GROUND_Y - this.height;
    }

    // Menggambar rintangan
    draw() {
        ctx.fillStyle = '#d9534f'; // Warna merah untuk kaktus
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Memperbarui posisi rintangan (bergerak ke kiri)
    update() {
        this.x -= gameSpeed;
    }
}

// Inisialisasi pemain
const player = new Player();

// --- Fungsi Utama Game ---

// Fungsi untuk membuat rintangan baru
function spawnObstacle() {
    frameCount++;
    // Spawn rintangan jika frame count melebihi interval
    if (frameCount > obstacleSpawnInterval) {
        obstacles.push(new Obstacle());
        frameCount = 0;
        // Membuat interval spawn berikutnya sedikit acak
        obstacleSpawnInterval = Math.floor(Math.random() * 60) + 80 - (gameSpeed * 4);
        if (obstacleSpawnInterval < 40) obstacleSpawnInterval = 40; // Batas minimum interval
    }
}

// Fungsi untuk mendeteksi tabrakan
function detectCollision() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        // Logika deteksi tabrakan AABB (Axis-Aligned Bounding Box)
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            isGameOver = true;
        }
    }
}

// Fungsi untuk memperbarui skor
function updateScore() {
    score++;
    ctx.fillStyle = '#333';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${Math.floor(score / 5)}`, CANVAS_WIDTH - 150, 30);
}

// Fungsi untuk meningkatkan kesulitan
function increaseDifficulty() {
    // Setiap 100 poin (score / 5), kecepatan bertambah
    if (Math.floor(score / 5) % 100 === 0 && Math.floor(score / 5) > 0) {
        if (gameSpeed < 15) { // Batas kecepatan maksimum
           gameSpeed += 0.05;
        }
    }
}

// Fungsi untuk menggambar tanah
function drawGround() {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, GROUND_Y);
    ctx.lineTo(CANVAS_WIDTH, GROUND_Y);
    ctx.stroke();
}

// Fungsi untuk mereset game
function resetGame() {
    isGameOver = false;
    score = 0;
    gameSpeed = 5;
    obstacles = [];
    player.y = GROUND_Y - player.height;
    player.velocityY = 0;
    gameLoop(); // Memulai kembali game loop
}

// Fungsi untuk menampilkan pesan Game Over
function showGameOverScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    ctx.fillStyle = 'white';
    ctx.font = '50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);
    
    ctx.font = '20px Arial';
    ctx.fillText(`Skor Akhir: ${Math.floor(score / 5)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
    
    ctx.font = '16px Arial';
    ctx.fillText('Tekan Spasi untuk Restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
}


// --- Game Loop ---
function gameLoop() {
    // Jika game over, hentikan loop dan tampilkan layar game over
    if (isGameOver) {
        showGameOverScreen();
        return;
    }

    // Membersihkan canvas untuk frame berikutnya
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Menggambar tanah
    drawGround();

    // Memperbarui dan menggambar pemain
    player.update();
    player.draw();

    // Menangani rintangan
    spawnObstacle();
    // Loop melalui rintangan dari belakang agar aman saat menghapus
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].update();
        obstacles[i].draw();
        
        // Hapus rintangan yang sudah keluar dari layar
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }

    // Memeriksa tabrakan
    detectCollision();

    // Memperbarui skor dan kesulitan
    updateScore();
    increaseDifficulty();

    // Meminta frame animasi berikutnya
    requestAnimationFrame(gameLoop);
}

// --- Input Handler ---
window.addEventListener('keydown', (e) => {
    // Memeriksa tombol yang ditekan
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        if (isGameOver) {
            resetGame();
        } else {
            player.jump();
        }
    }
});

// --- Memulai Game ---
// Tampilkan pesan awal untuk memulai
ctx.textAlign = 'center';
ctx.font = '20px Arial';
ctx.fillStyle = '#555';
ctx.fillText('Tekan Spasi untuk Mulai', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
isGameOver = true; // Set ke true agar game tidak langsung berjalan
