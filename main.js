// Obstacle Rush Main Game Logic
console.log("Obstacle Rush initialized.");

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// UI Elements
const uiLayer = document.getElementById('uiLayer');
const hud = document.getElementById('hud');
const mainMenu = document.getElementById('mainMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const pauseMenu = document.getElementById('pauseMenu');
const scoreTextNodes = document.querySelectorAll('#scoreText, #finalScoreText');
const highScoreNodes = document.querySelectorAll('.highScoreValue');

const modeList = document.getElementById('modeList');
const infoTitle = document.getElementById('infoTitle');
const infoDesc = document.getElementById('infoDesc');
const modeStats = document.getElementById('modeStats');

const customPanel = document.getElementById('customPanel');
const highScoreContainer = document.getElementById('highScoreContainer');

// Custom Mode Inputs
const rngObsSpawn = document.getElementById('rngObsSpawn');
const valObsSpawn = document.getElementById('valObsSpawn');
const rngLaserSpawn = document.getElementById('rngLaserSpawn');
const valLaserSpawn = document.getElementById('valLaserSpawn');
const rngSpeed = document.getElementById('rngSpeed');
const valSpeed = document.getElementById('valSpeed');
const rngTrack = document.getElementById('rngTrack');
const valTrack = document.getElementById('valTrack');

const rngLives = document.getElementById('rngLives');
const valLives = document.getElementById('valLives');
const rngObsGrowth = document.getElementById('rngObsGrowth');
const valObsGrowth = document.getElementById('valObsGrowth');
const rngLaserGrowth = document.getElementById('rngLaserGrowth');
const valLaserGrowth = document.getElementById('valLaserGrowth');
const rngLaserWarn = document.getElementById('rngLaserWarn');
const valLaserWarn = document.getElementById('valLaserWarn');

const togObs = document.getElementById('togObs');
const togLaser = document.getElementById('togLaser');
const obsConfig = document.getElementById('obsConfig');
const laserConfig = document.getElementById('laserConfig');

const togPro = document.getElementById('togPro');
const proConfig = document.getElementById('proConfig');
const rngProSpawn = document.getElementById('rngProSpawn');
const valProSpawn = document.getElementById('valProSpawn');

const togChainsaw = document.getElementById('togChainsaw');
const togBlackout = document.getElementById('togBlackout');
const rngBlackoutRadius = document.getElementById('rngBlackoutRadius');
const valBlackoutRadius = document.getElementById('valBlackoutRadius');
const rngChainsawAmp = document.getElementById('rngChainsawAmp');
const valChainsawAmp = document.getElementById('valChainsawAmp');

const togBot = document.getElementById('togBot');
const botLevelContainer = document.getElementById('botLevelContainer');
const rngBotLevel = document.getElementById('rngBotLevel');
const valBotLevel = document.getElementById('valBotLevel');

const livesText = document.getElementById('livesText');

// Game State
let animationId;
let lastTime = 0;
let timeSurvived = 0; // in seconds
let isPlaying = false;
let isPaused = false;

// Bot tracking
let botVx = 0;
let botVy = 0;
let mouse = { x: canvas.width / 2 || 0, y: canvas.height / 2 || 0 };

let playerLives = 1;
let maxLives = 1;
let isInvulnerable = false;
let invulnerableTimer = 0;

let isBotPlaying = false;
let botLevel = 1;

let currentMode = 'obstacle'; // Default mode
let modConfig = {};

const BOT_LEVELS = [
    { label: '1 - Noob', reactFast: 0.1, scanRadius: 100, speedBoost: 0.8 },
    { label: '2 - Beginner', reactFast: 0.2, scanRadius: 150, speedBoost: 1.0 },
    { label: '3 - Intermediate', reactFast: 0.4, scanRadius: 200, speedBoost: 1.2 },
    { label: '4 - Advanced', reactFast: 0.6, scanRadius: 300, speedBoost: 1.5 },
    { label: '5 - Expert', reactFast: 0.8, scanRadius: 400, speedBoost: 1.8 },
    { label: '6 - Master', reactFast: 1.0, scanRadius: 600, speedBoost: 2.5 }
];

// Mode Configurations
const defaultGrowth = 0.99;
const MODES = {
    obstacle: { category: 'Klasik', label: 'Obstacles', icon: '🔴', desc: 'Pengalaman klasik yang menegangkan. Hindari lingkaran merah yang berjatuhan; kecepatan mereka akan terus meningkat secara konstan seiring waktu.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    laser: { category: 'Klasik', label: 'Lasers', icon: '💥', desc: 'Sinar laser mematikan dari ujung ke ujung layar. Perhatikan peringatan transparan sebelum laser diaktifkan secara mendadak!', lives: 1, obsSpawn: 0, lasSpawn: 1.0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    chaos: { category: 'Klasik', label: 'Chaos', icon: '🔥', desc: 'Kekacauan mutlak. Baik obstacles maupun laser akan muncul secara bersamaan untuk menguji refleks ekstrem Anda.', lives: 1, obsSpawn: 0.5, lasSpawn: 1.0, proSpawn: 0, speed: 150, track: 0, obsGrowth: 0.95, lasGrowth: 0.95, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    sluggish: { category: 'Tantangan', label: 'Sluggish', icon: '🐌', desc: 'Rintangan bergerak sangat lambat namun kemunculan sangat beruntun, perlahan akan menutupi seluruh layar.', lives: 1, obsSpawn: 0.25, lasSpawn: 0, proSpawn: 0, speed: 25, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    lightning: { category: 'Tantangan', label: 'Lightning', icon: '⚡', desc: 'Berkedip dan Anda akan mati. Obstacles bergerak dengan kecepatan luar biasa.', lives: 1, obsSpawn: 0.7, lasSpawn: 0, proSpawn: 0, speed: 1200, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    stalker: { category: 'Tantangan', label: 'Stalker', icon: '👁️', desc: 'Mereka mengawasi dan mengikuti Anda. Obstacles secara perlahan akan berbelok dan melacak pergerakan kursor Anda.', lives: 1, obsSpawn: 0.6, lasSpawn: 0, proSpawn: 0, speed: 140, track: 1.5, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    blackout: { category: 'Eksperimental', label: 'Blackout', icon: '🔦', desc: 'Malam yang gelap gulita. Pemain hanya dibekali cahaya senter kecil untuk meraba rintangan merah yang mendekat diam-diam.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 130, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: true, chainsaw: false, blackoutRadius: 160, chainsawAmp: 400, saveScore: true },
    chainsaw: { category: 'Eksperimental', label: 'Chainsaw', icon: '⚙️', desc: 'Rintangan bergerak secara bergelombang dan memutar dalam lintasan sinusoidal yang sulit diprediksi ujung hitboxnya.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 110, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: true, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    proyektil: { category: 'Eksperimental', label: 'Proyektil', icon: '📡', desc: '5 jenis peluru mematikan: Bullet, Homing, Shotgun, Wave, dan Sniper — masing-masing dengan gaya unik. Semakin lama, semakin sulit!', lives: 3, obsSpawn: 0, lasSpawn: 0, proSpawn: 0.6, speed: 220, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    custom: { category: 'Kustom', label: 'Custom', icon: '🛠️', desc: 'Atur engine fisika permainan secara manual menggunakan panel sistem. Skor tertinggi tidak akan disimpan pada mode ini.', saveScore: false }
};

// Entities arrays
let entities = [];
let obsSpawnTimer = 0;
let lasSpawnTimer = 0;
let proSpawnTimer = 0;

// Game Config
const MOUSE_FOLLOW_SPEED = 0.2; // Lerp factor
const PLAYER_RADIUS = 15;

// Obstacle Config
const SIZES = [8, 12, 16, 24, 32];

// Laser Config
const LASER_WARNING_TIME = 0.5;
const LASER_LIFETIME = 0.5; // how long it stays active after warning


class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.radius = PLAYER_RADIUS;
    }

    update() {
        this.x += (mouse.x - this.x) * MOUSE_FOLLOW_SPEED;
        this.y += (mouse.y - this.y) * MOUSE_FOLLOW_SPEED;

        this.x = Math.max(this.radius, Math.min(canvas.width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(canvas.height - this.radius, this.y));
    }

    draw(ctx) {
        if (isInvulnerable) {
            // Blink every 0.1s
            if (Math.floor(invulnerableTimer * 10) % 2 === 0) {
                return; // skip drawing to create blink effect
            }
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#f8fafc';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#06b6d4';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

class Projectile {
    constructor(type = null, startX = null, startY = null, targetAngle = null) {
        this.radius = 6;
        const types = ['bullet', 'homing', 'shotgun', 'wave', 'sniper'];
        this.type = type || types[Math.floor(Math.random() * types.length)];

        // Spawn edge logic
        if (startX === null || startY === null) {
            const edge = Math.floor(Math.random() * 4);
            if (edge === 0) { this.x = Math.random() * canvas.width; this.y = -this.radius; }
            else if (edge === 1) { this.x = canvas.width + this.radius; this.y = Math.random() * canvas.height; }
            else if (edge === 2) { this.x = Math.random() * canvas.width; this.y = canvas.height + this.radius; }
            else { this.x = -this.radius; this.y = Math.random() * canvas.height; }
        } else {
            this.x = startX;
            this.y = startY;
        }

        const speedMult = 1 + (timeSurvived / 60);
        let baseSpeed = modConfig.speed * speedMult * 1.2;

        if (this.type === 'shotgun') {
            if (targetAngle === null) {
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                for (let i = -2; i <= 2; i++) {
                    const spread = angleToPlayer + (i * 0.2);
                    entities.push(new Projectile('bullet', this.x, this.y, spread));
                }
                this.dead = true;
                return;
            }
        }

        const angle = targetAngle !== null ? targetAngle : Math.atan2(player.y - this.y, player.x - this.x);

        if (this.type === 'homing') baseSpeed *= 0.6;
        if (this.type === 'sniper') { baseSpeed *= 2.0; this.radius = 4; }
        if (this.type === 'wave') { this.waveTimer = 0; }

        this.vx = Math.cos(angle) * baseSpeed;
        this.vy = Math.sin(angle) * baseSpeed;
        this.speed = baseSpeed;
        this.angle = angle;

        if (this.type === 'homing') {
            this.trackTimer = 1.5;
        }
    }

    update(dt) {
        if (this.dead) return;

        if (this.type === 'homing') {
            this.trackTimer -= dt;
            if (this.trackTimer > 0) {
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                const currentAngle = Math.atan2(this.vy, this.vx);
                let angleDiff = angleToPlayer - currentAngle;
                while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                const turnSpeed = 0.5;
                const newAngle = currentAngle + Math.max(-turnSpeed * dt, Math.min(turnSpeed * dt, angleDiff));
                this.vx = Math.cos(newAngle) * this.speed;
                this.vy = Math.sin(newAngle) * this.speed;
            }
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Wave type: sinusoidal perpendicular movement
        if (this.type === 'wave') {
            this.waveTimer += dt;
            const perpX = -Math.sin(this.angle);
            const perpY = Math.cos(this.angle);
            const waveOffset = Math.sin(this.waveTimer * 6) * 120 * dt;
            this.x += perpX * waveOffset;
            this.y += perpY * waveOffset;
        }
    }

    draw(ctx) {
        if (this.dead) return;
        const COLORS = {
            bullet: '#f87171',  // Red
            homing: '#fbbf24',  // Amber
            shotgun: '#f87171', // Red (pellets)
            wave: '#a78bfa',    // Purple
            sniper: '#34d399'   // Green
        };
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS[this.type] || '#f87171';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isDead() {
        if (this.dead) return true;
        const margin = this.radius * 2;
        return (this.x < -margin || this.x > canvas.width + margin || this.y < -margin || this.y > canvas.height + margin);
    }
}

class Obstacle {
    constructor() {
        this.radius = SIZES[Math.floor(Math.random() * SIZES.length)];
        const edge = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left

        if (edge === 0) {
            this.x = Math.random() * canvas.width;
            this.y = -this.radius;
        } else if (edge === 1) {
            this.x = canvas.width + this.radius;
            this.y = Math.random() * canvas.height;
        } else if (edge === 2) {
            this.x = Math.random() * canvas.width;
            this.y = canvas.height + this.radius;
        } else {
            this.x = -this.radius;
            this.y = Math.random() * canvas.height;
        }

        const targetX = canvas.width / 2 + (Math.random() - 0.5) * canvas.width * 0.5;
        const targetY = canvas.height / 2 + (Math.random() - 0.5) * canvas.height * 0.5;
        const angle = Math.atan2(targetY - this.y, targetX - this.x);

        const speedMult = 1 + (timeSurvived / 30);
        const speed = modConfig.speed * speedMult * (0.8 + Math.random() * 0.4);

        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }

    update(dt) {
        // Track the player slightly if track factor > 0
        if (modConfig.track > 0) {
            const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
            // Apply slight acceleration towards player
            this.vx += Math.cos(angleToPlayer) * modConfig.track * 200 * dt;
            this.vy += Math.sin(angleToPlayer) * modConfig.track * 200 * dt;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Apply Chainsaw wave physics
        if (currentMode === 'chainsaw' || (currentMode === 'custom' && modConfig.chainsaw)) {
            const len = Math.sqrt(this.vx * this.vx + this.vy * this.vy) || 1;
            const perpX = -this.vy / len;
            const perpY = this.vx / len;
            const waveAmplitude = modConfig.chainsawAmp || 400;
            const waveSpeed = 2;
            const wave = Math.sin(timeSurvived * waveSpeed) * waveAmplitude * dt;
            this.x += perpX * wave;
            this.y += perpY * wave;
        }
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ef4444';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    isDead() {
        if (this.dead) return true;
        const margin = this.radius * 2;
        return (this.x < -margin || this.x > canvas.width + margin || this.y < -margin || this.y > canvas.height + margin);
    }
}

class Laser {
    constructor() {
        this.phase = 'warning';
        this.timer = 0;
        const edge = Math.floor(Math.random() * 2);

        if (edge === 0) {
            this.x1 = 0;
            this.y1 = Math.random() * canvas.height;
            this.x2 = canvas.width;
            this.y2 = Math.random() * canvas.height;
        } else {
            this.x1 = Math.random() * canvas.width;
            this.y1 = 0;
            this.x2 = Math.random() * canvas.width;
            this.y2 = canvas.height;
        }
    }

    update(dt) {
        if (this.dead) return;
        this.timer += dt;
        if (this.phase === 'warning' && this.timer >= modConfig.lasWarn) {
            this.phase = 'active';
            this.timer = 0;
        } else if (this.phase === 'active' && this.timer >= LASER_LIFETIME) {
            this.phase = 'dead';
        }
    }

    draw(ctx) {
        if (this.phase === 'dead' || this.dead) return;

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);

        if (this.phase === 'warning') {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.lineWidth = 4;
            ctx.shadowBlur = 0;
        } else if (this.phase === 'active') {
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 12;
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#ef4444';
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    isDead() {
        if (this.dead) return true;
        return this.phase === 'dead';
    }
}

let player = new Player();

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function init() {
    window.addEventListener('pointermove', (e) => {
        if (isBotPlaying) return; // Prevent user cursor interference when bot is active
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('keydown', (e) => {
        if ((e.code === 'Space' || e.code === 'Escape') && isPlaying) {
            e.preventDefault();
            togglePause();
        }
    });

    document.getElementById('startBtn').addEventListener('click', startGame);
    document.getElementById('restartBtn').addEventListener('click', startGame);
    document.getElementById('menuBtn').addEventListener('click', showMainMenu);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('pauseMenuBtn').addEventListener('click', showMainMenu);

    document.getElementById('showProgressBtn').addEventListener('click', () => {
        renderProgressList();
        document.getElementById('progressModal').classList.remove('hidden');
        document.getElementById('mainMenu').style.display = 'none';
    });
    document.getElementById('closeProgressBtn').addEventListener('click', () => {
        document.getElementById('progressModal').classList.add('hidden');
        document.getElementById('mainMenu').style.display = 'flex';
    });
    document.getElementById('resetAllProgressBtn').addEventListener('click', () => {
        for (const key of Object.keys(MODES)) {
            localStorage.removeItem(`obstacleRushHigh_${key}`);
        }
        renderProgressList();
        loadHighScore();
    });

    // Populate Preset Select Dropdown
    const presetSelect = document.getElementById('presetSelect');
    presetSelect.innerHTML = '<option value="" disabled selected>-- Pilih Mode Dasar --</option>';

    // Build interactive mode UI hierarchically
    modeList.innerHTML = '';
    let currentCat = '';
    for (const [key, mode] of Object.entries(MODES)) {
        if (key !== 'custom') {
            const opt = document.createElement('option');
            opt.value = key;
            opt.textContent = `${mode.icon} ${mode.label}`;
            presetSelect.appendChild(opt);
        }

        if (mode.category !== currentCat) {
            currentCat = mode.category;
            const catHeader = document.createElement('div');
            catHeader.className = 'mode-category';
            catHeader.textContent = currentCat;
            modeList.appendChild(catHeader);
        }

        const card = document.createElement('div');
        card.className = 'mode-card';
        card.dataset.mode = key;
        card.innerHTML = `<span class="mode-name">${mode.label}</span><span class="mode-icon">${mode.icon}</span>`;
        card.addEventListener('click', () => setMode(key));
        modeList.appendChild(card);
    }

    presetSelect.addEventListener('change', (e) => {
        if (e.target.value) {
            applyPreset(e.target.value);
            // Optional: reset select back to default after applying so it acts like a button
            e.target.value = "";
        }
    });

    togObs.addEventListener('change', (e) => {
        if (e.target.checked) obsConfig.classList.remove('hidden-content');
        else obsConfig.classList.add('hidden-content');
    });
    togLaser.addEventListener('change', (e) => {
        if (e.target.checked) laserConfig.classList.remove('hidden-content');
        else laserConfig.classList.add('hidden-content');
    });
    togPro.addEventListener('change', (e) => {
        if (e.target.checked) proConfig.classList.remove('hidden-content');
        else proConfig.classList.add('hidden-content');
    });
    togBot.addEventListener('change', (e) => {
        isBotPlaying = e.target.checked;
        const botContainer = document.querySelector('.bot-controller');
        if (e.target.checked) {
            botLevelContainer.classList.remove('hidden-content');
            botContainer.classList.remove('bot-collapsed');
            document.getElementById('startBtn').innerHTML = 'LIHAT BOT BERMAIN <span class="arrow">→</span>';
            botContainer.style.background = 'rgba(0,0,0,0.4)';
            botContainer.style.borderColor = 'rgba(6, 182, 212, 0.3)';
        } else {
            botLevelContainer.classList.add('hidden-content');
            botContainer.classList.add('bot-collapsed');
            document.getElementById('startBtn').innerHTML = 'MAIN SEKARANG <span class="arrow">→</span>';
            botContainer.style.background = 'rgba(0,0,0,0.1)';
            botContainer.style.borderColor = 'rgba(255,255,255,0.05)';
        }
    });

    rngBotLevel.addEventListener('input', (e) => {
        botLevel = parseInt(e.target.value);
        valBotLevel.textContent = BOT_LEVELS[botLevel - 1].label;
    });

    // Listen to custom ranges
    const syncVal = (el, valNode, suffix = '') => {
        el.addEventListener('input', (e) => {
            valNode.textContent = e.target.value + suffix;
        });
    };
    syncVal(rngObsSpawn, valObsSpawn, 's');
    syncVal(rngLaserSpawn, valLaserSpawn, 's');
    syncVal(rngProSpawn, valProSpawn, 's');
    syncVal(rngSpeed, valSpeed, '');
    syncVal(rngTrack, valTrack, 'x');
    syncVal(rngLives, valLives, '');
    syncVal(rngObsGrowth, valObsGrowth, 'x');
    syncVal(rngLaserGrowth, valLaserGrowth, 'x');
    syncVal(rngLaserWarn, valLaserWarn, 's');
    if (rngBlackoutRadius) syncVal(rngBlackoutRadius, valBlackoutRadius, 'px');
    if (rngChainsawAmp) syncVal(rngChainsawAmp, valChainsawAmp, 'px');


    setMode('obstacle');
    showMainMenu();
    drawBackground();
}

function setMode(modeKey) {
    currentMode = modeKey;
    const isCustom = modeKey === 'custom';

    // Update active styles in the list
    Array.from(modeList.children).forEach(card => {
        if (card.dataset.mode === modeKey) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });

    const mode = MODES[modeKey];
    infoTitle.textContent = mode.label;
    infoDesc.textContent = mode.desc;

    // Render Mode Config Stats for transparency
    modeStats.innerHTML = '';
    if (!isCustom) {
        if (mode.obsSpawn > 0) {
            modeStats.innerHTML += `<div class="stat-pill">⏱️ Kemunculan: ${mode.obsSpawn.toFixed(2)}s</div>`;
            modeStats.innerHTML += `<div class="stat-pill">💨 Kecepatan: ${mode.speed}</div>`;
        }
        if (mode.lasSpawn > 0) {
            modeStats.innerHTML += `<div class="stat-pill">💥 Laser: ${mode.lasSpawn.toFixed(1)}s</div>`;
        }
        if (mode.proSpawn > 0) {
            modeStats.innerHTML += `<div class="stat-pill">📡 Proyektil: ${mode.proSpawn.toFixed(2)}s</div>`;
            modeStats.innerHTML += `<div class="stat-pill">🚀 Kecepatan: ${mode.speed}</div>`;
        }
        if (mode.track > 0) {
            modeStats.innerHTML += `<div class="stat-pill">🎯 Pelacakan: ${mode.track}x</div>`;
        }
        if (mode.chainsaw) {
            modeStats.innerHTML += `<div class="stat-pill">⚙️ Ayunan: ${mode.chainsawAmp}px</div>`;
        }
        if (mode.blackout) {
            modeStats.innerHTML += `<div class="stat-pill">🔦 Area Senter: ${mode.blackoutRadius}px</div>`;
        }
    }

    if (isCustom) {
        customPanel.classList.remove('hidden');
        highScoreContainer.classList.add('hidden'); // no high scores in custom mode
    } else {
        customPanel.classList.add('hidden');
        highScoreContainer.classList.remove('hidden');
        loadHighScore();
    }
}

function applyPreset(presetMode) {
    const mode = MODES[presetMode];
    if (!mode) return;

    rngLives.value = 1; // Default back to 1 life usually for classic presets
    valLives.textContent = rngLives.value;

    if (mode.obsSpawn > 0) {
        togObs.checked = true;
        obsConfig.classList.remove('hidden-content');
        rngObsSpawn.value = mode.obsSpawn;
        valObsSpawn.textContent = mode.obsSpawn.toFixed(2) + 's';
    } else {
        togObs.checked = false;
        obsConfig.classList.add('hidden-content');
    }

    rngSpeed.value = mode.speed;
    valSpeed.textContent = mode.speed;
    rngTrack.value = mode.track;
    valTrack.textContent = mode.track.toFixed(1) + 'x';
    rngObsGrowth.value = mode.obsGrowth || 0.99;
    valObsGrowth.textContent = parseFloat(rngObsGrowth.value).toFixed(2) + 'x';

    if (mode.lasSpawn > 0) {
        togLaser.checked = true;
        laserConfig.classList.remove('hidden-content');
        rngLaserSpawn.value = mode.lasSpawn;
        valLaserSpawn.textContent = mode.lasSpawn.toFixed(2) + 's';
    } else {
        togLaser.checked = false;
        laserConfig.classList.add('hidden-content');
    }

    rngLaserWarn.value = mode.lasWarn || 1.0;
    valLaserWarn.textContent = parseFloat(rngLaserWarn.value).toFixed(2) + 's';
    rngLaserGrowth.value = mode.lasGrowth || 0.99;
    valLaserGrowth.textContent = parseFloat(rngLaserGrowth.value).toFixed(2) + 'x';

    if (mode.proSpawn > 0) {
        togPro.checked = true;
        proConfig.classList.remove('hidden-content');
        rngProSpawn.value = mode.proSpawn;
        valProSpawn.textContent = mode.proSpawn.toFixed(2) + 's';
    } else {
        togPro.checked = false;
        proConfig.classList.add('hidden-content');
    }

    togChainsaw.checked = !!mode.chainsaw;
    togBlackout.checked = !!mode.blackout;

    if (rngBlackoutRadius) {
        rngBlackoutRadius.value = mode.blackoutRadius || 200;
        valBlackoutRadius.textContent = rngBlackoutRadius.value + 'px';
    }
    if (rngChainsawAmp) {
        rngChainsawAmp.value = mode.chainsawAmp || 400;
        valChainsawAmp.textContent = rngChainsawAmp.value + 'px';
    }
}

function buildModConfig() {
    if (currentMode === 'custom') {
        modConfig = {
            obsSpawn: togObs.checked ? parseFloat(rngObsSpawn.value) : 0,
            lasSpawn: togLaser.checked ? parseFloat(rngLaserSpawn.value) : 0,
            proSpawn: togPro.checked ? parseFloat(rngProSpawn.value) : 0,
            speed: parseFloat(rngSpeed.value),
            track: parseFloat(rngTrack.value),
            lives: parseInt(rngLives.value),
            obsGrowth: parseFloat(rngObsGrowth.value),
            lasGrowth: parseFloat(rngLaserGrowth.value),
            lasWarn: parseFloat(rngLaserWarn.value),
            chainsaw: togChainsaw.checked,
            blackout: togBlackout.checked,
            blackoutRadius: rngBlackoutRadius ? parseInt(rngBlackoutRadius.value) : 200,
            chainsawAmp: rngChainsawAmp ? parseInt(rngChainsawAmp.value) : 400
        };
    } else {
        modConfig = MODES[currentMode];
    }
}

function drawBackground() {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    const gridSize = 50;

    ctx.beginPath();
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
    }
    ctx.stroke();
}

function togglePause() {
    if (!isPlaying) return;
    isPaused = !isPaused;

    if (isPaused) {
        pauseMenu.classList.remove('hidden');
        hud.classList.add('hidden');
        uiLayer.style.pointerEvents = 'auto';
    } else {
        lastTime = performance.now();
        pauseMenu.classList.add('hidden');
        hud.classList.remove('hidden');
        uiLayer.style.pointerEvents = 'none';
        requestAnimationFrame(gameLoop);
    }
}

function takeDamage(entity) {
    playerLives--;
    updateLivesDisplay();

    // Mark entity as dead instantly so it doesn't drain another life on the next frame
    if (entity) entity.dead = true;

    if (playerLives <= 0) {
        gameOver();
    }
}

function updateLivesDisplay() {
    let hearts = '';
    for (let i = 0; i < playerLives; i++) {
        hearts += '❤️';
    }
    if (playerLives === 0) hearts = '💀';
    livesText.textContent = hearts;
}

function startGame() {
    buildModConfig();

    isPlaying = true;
    isPaused = false;
    timeSurvived = 0;
    entities = [];
    obsSpawnTimer = 0;
    lasSpawnTimer = 0;
    proSpawnTimer = 0;

    playerLives = modConfig.lives || 1;
    maxLives = playerLives;
    isInvulnerable = false;
    invulnerableTimer = 0;
    updateLivesDisplay();

    if (maxLives <= 1) {
        document.querySelector('.lives-display').classList.add('hidden');
    } else {
        document.querySelector('.lives-display').classList.remove('hidden');
    }

    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2;
    player = new Player();

    lastTime = performance.now();

    mainMenu.classList.add('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    hud.classList.remove('hidden');

    uiLayer.style.pointerEvents = 'none';

    cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameLoop);
}

function gameOver() {
    isPlaying = false;
    cancelAnimationFrame(animationId);
    uiLayer.style.pointerEvents = 'auto';

    if (currentMode !== 'custom') {
        saveHighScore();
    }

    updateScoreDisplay();

    hud.classList.add('hidden');
    gameOverMenu.classList.remove('hidden');
}

function showMainMenu() {
    isPlaying = false;
    isPaused = false;
    cancelAnimationFrame(animationId);

    mainMenu.classList.remove('hidden');
    gameOverMenu.classList.add('hidden');
    pauseMenu.classList.add('hidden');
    hud.classList.add('hidden');
    uiLayer.style.pointerEvents = 'auto';

    if (currentMode !== 'custom') {
        loadHighScore();
    }
    drawBackground();
}

function formatTime(seconds) {
    return seconds.toFixed(2).replace('.', ',') + 's';
}

function updateScoreDisplay() {
    const formattedMsg = formatTime(timeSurvived);
    scoreTextNodes.forEach(node => node.textContent = formattedMsg);
}

function getStoreKey() {
    return `obstacleRushHigh_${currentMode}`;
}

function saveHighScore() {
    if (isBotPlaying) return; // Never save score if bot is playing
    const key = getStoreKey();
    const currentHigh = parseFloat(localStorage.getItem(key)) || 0;
    if (timeSurvived > currentHigh) {
        localStorage.setItem(key, timeSurvived.toString());
    }
}

function loadHighScore() {
    const key = getStoreKey();
    const high = parseFloat(localStorage.getItem(key)) || 0;
    const formattedMsg = formatTime(high);
    highScoreNodes.forEach(node => node.textContent = formattedMsg);
}

function renderProgressList() {
    const listContainer = document.getElementById('progressList');
    listContainer.innerHTML = '';

    for (const [key, mode] of Object.entries(MODES)) {
        if (!mode.saveScore) continue;
        const storeKey = `obstacleRushHigh_${key}`;
        const high = parseFloat(localStorage.getItem(storeKey)) || 0;

        const item = document.createElement('div');
        item.className = 'progress-item';

        item.innerHTML = `
            <div class="mode-name">
                <span class="mode-icon">${mode.icon}</span> ${mode.label}
            </div>
            <span class="score-val">${formatTime(high)}</span>
            <div class="progress-actions">
                <button class="delete-single-btn" data-mode="${key}" title="Hapus Skor">✕</button>
            </div>
        `;
        listContainer.appendChild(item);
    }

    listContainer.querySelectorAll('.delete-single-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const m = e.target.dataset.mode;
            localStorage.removeItem(`obstacleRushHigh_${m}`);
            renderProgressList(); // Refresh modal
            if (currentMode === m) loadHighScore(); // Sync active view UI
        });
    });
}

function pointLineDistance(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0)
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}


function checkCollision(p, entity) {
    if (entity instanceof Obstacle || entity instanceof Projectile) {
        const dx = p.x - entity.x;
        const dy = p.y - entity.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < (p.radius + entity.radius) * 0.8;
    } else if (entity instanceof Laser) {
        if (entity.phase !== 'active') return false;
        const dist = pointLineDistance(p.x, p.y, entity.x1, entity.y1, entity.x2, entity.y2);
        return dist < (p.radius + 6) * 0.9;
    }
    return false;
}

function gameLoop(currentTime) {
    if (!isPlaying || isPaused) return;

    const dt = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    const safeDt = Math.min(dt, 0.1);
    timeSurvived += safeDt;

    drawBackground();
    updateScoreDisplay();

    // Determine current effective spawn rates
    let oRate = 0;
    if (modConfig.obsSpawn > 0) {
        const growthPower = Math.pow(modConfig.obsGrowth, timeSurvived);
        oRate = Math.max(0.05, modConfig.obsSpawn * growthPower);
    }

    let lRate = 0;
    if (modConfig.lasSpawn > 0) {
        const growthPower = Math.pow(modConfig.lasGrowth, timeSurvived);
        lRate = Math.max(0.1, modConfig.lasSpawn * growthPower);
    }

    let pRate = 0;
    if (modConfig.proSpawn > 0) {
        pRate = modConfig.proSpawn;
    }

    // Obstacle Spawner
    if (oRate > 0) {
        obsSpawnTimer += safeDt;
        if (obsSpawnTimer >= oRate) {
            entities.push(new Obstacle());
            obsSpawnTimer = 0;
        }
    }

    // Laser Spawner
    if (lRate > 0) {
        lasSpawnTimer += safeDt;
        if (lasSpawnTimer >= lRate) {
            entities.push(new Laser());
            lasSpawnTimer = 0;
        }
    }

    // Projectile Spawner
    if (pRate > 0) {
        proSpawnTimer += safeDt;
        if (proSpawnTimer >= pRate) {
            entities.push(new Projectile());
            proSpawnTimer = 0;
        }
    }

    if (isBotPlaying) {
        updateBot(safeDt);
    } else {
        player.update();
    }

    player.draw(ctx);

    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        entity.update(safeDt);
        entity.draw(ctx);

        if (checkCollision(player, entity)) {
            takeDamage(entity);
        }

        if (entity.isDead()) {
            entities.splice(i, 1);
        }
    }

    if (currentMode === 'blackout' || (currentMode === 'custom' && modConfig.blackout)) {
        const cx = player.x;
        const cy = player.y;
        const radius = modConfig.blackoutRadius || 160;
        const maxDim = Math.max(canvas.width, canvas.height) * 1.5;

        const gradient = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, maxDim);
        gradient.addColorStop(0, 'rgba(5, 5, 8, 0)');
        gradient.addColorStop(radius / maxDim, 'rgba(5, 5, 8, 0.4)');
        gradient.addColorStop(Math.min((radius * 1.5) / maxDim, 0.99), 'rgba(5, 5, 8, 0.95)');
        gradient.addColorStop(1, 'rgba(5, 5, 8, 1)');

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    animationId = requestAnimationFrame(gameLoop);
}

function updateBot(dt) {
    const levelSpec = BOT_LEVELS[botLevel - 1];
    let forceX = 0;
    let forceY = 0;

    // Attractive force to center of screen (keeps bot alive and away from borders)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distCenterSq = Math.pow(centerX - player.x, 2) + Math.pow(centerY - player.y, 2);

    // Slight pull towards center
    const pullBase = 200;
    const cwX = (centerX - player.x) / (Math.sqrt(distCenterSq) || 1);
    const cwY = (centerY - player.y) / (Math.sqrt(distCenterSq) || 1);
    forceX += cwX * pullBase;
    forceY += cwY * pullBase;

    // Absolute Wall / Boundary Repulsion (Exponential 1/dist^3 keeps bot actively out of corners)
    const margin = 120;
    const wallPushPower = 2000;
    let leftDist = player.x;
    let rightDist = canvas.width - player.x;
    let topDist = player.y;
    let bottomDist = canvas.height - player.y;

    if (leftDist < margin) forceX += Math.pow(margin / (leftDist || 1), 3) * wallPushPower;
    if (rightDist < margin) forceX -= Math.pow(margin / (rightDist || 1), 3) * wallPushPower;
    if (topDist < margin) forceY += Math.pow(margin / (topDist || 1), 3) * wallPushPower;
    if (bottomDist < margin) forceY -= Math.pow(margin / (bottomDist || 1), 3) * wallPushPower;

    // Repulsive forces from entities
    let nearbyThreats = 0;
    entities.forEach(entity => {
        if (entity instanceof Obstacle) {
            // Predictive Evasion: Calculate future position of obstacle based on velocity
            const lookAheadTime = 0.5 * levelSpec.reactFast; // higher levels look further ahead
            const predX = entity.x + entity.vx * lookAheadTime;
            const predY = entity.y + entity.vy * lookAheadTime;

            const dx = player.x - predX;
            const dy = player.y - predY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < levelSpec.scanRadius) {
                nearbyThreats++;
                // The closer it is, the stronger the push
                const pushPow = Math.pow(levelSpec.scanRadius / (dist || 1), 3);
                forceX += (dx / dist) * pushPow * 800; // slightly toned down individual obstacle push
                forceY += (dy / dist) * pushPow * 800;
            }
        } else if (entity instanceof Laser && entity.phase === 'warning') {
            // Flee perpendicular to laser line
            const dist = pointLineDistance(player.x, player.y, entity.x1, entity.y1, entity.x2, entity.y2);
            if (dist < levelSpec.scanRadius * 1.5) { // Lasers are very dangerous, look further
                nearbyThreats++;
                const dx = entity.x2 - entity.x1;
                const dy = entity.y2 - entity.y1;
                const len = Math.sqrt(dx * dx + dy * dy);

                // Perpendicular normal vectors
                const nx1 = -dy / len;
                const ny1 = dx / len;
                const nx2 = dy / len;
                const ny2 = -dx / len;

                // Choose normal that points away from center of laser
                const midX = (entity.x1 + entity.x2) / 2;
                const midY = (entity.y1 + entity.y2) / 2;
                const pDx = player.x - midX;
                const pDy = player.y - midY;

                let ex, ey;
                if (nx1 * pDx + ny1 * pDy > 0) {
                    ex = nx1; ey = ny1;
                } else {
                    ex = nx2; ey = ny2;
                }

                const pushPow = Math.pow(levelSpec.scanRadius * 1.5 / (dist || 1), 2);
                forceX += ex * pushPow * 1500;
                forceY += ey * pushPow * 1500;
            }
        }
    });

    // If there are many threats, the bot might get overwhelmed with vectors. 
    // We add a tiny bit of "panic" randomness at lower levels, and clinical precision at higher levels.
    if (nearbyThreats > 2) {
        const panicScale = (6 - botLevel) * 100; // More panic at lower levels
        forceX += (Math.random() - 0.5) * panicScale;
        forceY += (Math.random() - 0.5) * panicScale;
    }

    // Normalize and scale by max speed
    const maxSpeedBase = 800; // Pixels per second
    const botSpeed = maxSpeedBase * levelSpec.speedBoost;

    const forceMag = Math.sqrt(forceX * forceX + forceY * forceY);
    let targetVx = 0;
    let targetVy = 0;
    if (forceMag > 0) {
        targetVx = (forceX / forceMag) * botSpeed;
        targetVy = (forceY / forceMag) * botSpeed;
    }

    // Apply Flow Physics Momentum
    const friction = 0.85; // Natural glide friction
    botVx = botVx * friction + targetVx * (1 - friction) * levelSpec.reactFast;
    botVy = botVy * friction + targetVy * (1 - friction) * levelSpec.reactFast;

    mouse.x = player.x + botVx * dt;
    mouse.y = player.y + botVy * dt;

    player.update();
}

init();
