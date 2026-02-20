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

// Game State
let animationId;
let lastTime = 0;
let timeSurvived = 0; // in seconds
let isPlaying = false;
let isPaused = false;
let mouse = { x: canvas.width / 2 || 0, y: canvas.height / 2 || 0 };

let currentMode = 'obstacle'; // Default mode
let modConfig = {};

// Mode Configurations
const MODES = {
    obstacle: { label: 'Obstacles', icon: '🔴', desc: 'The classic experience. Dodge falling red circles as they gradually speed up over time.', obsSpawn: 0.5, lasSpawn: 0, speed: 150, track: 0, saveScore: true },
    laser: { label: 'Lasers', icon: '💥', desc: 'Deadly edge-to-edge laser beams. Watch for the transparent warnings before they activate!', obsSpawn: 0, lasSpawn: 1.0, speed: 150, track: 0, saveScore: true },
    chaos: { label: 'Chaos', icon: '🔥', desc: 'Absolute mayhem. Both obstacles and lasers will spawn simultaneously to test your reflexes.', obsSpawn: 0.5, lasSpawn: 1.5, speed: 150, track: 0, saveScore: true },
    sluggish: { label: 'Sluggish (Siput)', icon: '🐌', desc: 'A slow-paced challenge. Obstacles move very slowly but cover the screen over time.', obsSpawn: 2.0, lasSpawn: 0, speed: 50, track: 0, saveScore: true },
    lightning: { label: 'Lightning (Fast)', icon: '⚡', desc: 'Blink and you lose. Obstacles move incredibly fast with a high spawn rate.', obsSpawn: 0.2, lasSpawn: 0, speed: 350, track: 0, saveScore: true },
    stalker: { label: 'Stalker', icon: '👁️', desc: 'They are watching you. Obstacles will slowly curve and track your cursor.', obsSpawn: 0.6, lasSpawn: 0, speed: 140, track: 0.5, saveScore: true },
    custom: { label: 'Custom', icon: '⚙️', desc: 'Tune the physics engine manually using sliders. High scores will not be saved here.', saveScore: false }
};

// Entities arrays
let entities = [];
let obsSpawnTimer = 0;
let lasSpawnTimer = 0;

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
        this.timer += dt;
        if (this.phase === 'warning' && this.timer >= LASER_WARNING_TIME) {
            this.phase = 'active';
            this.timer = 0;
        } else if (this.phase === 'active' && this.timer >= LASER_LIFETIME) {
            this.phase = 'dead';
        }
    }

    draw(ctx) {
        if (this.phase === 'dead') return;

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
    document.getElementById('resetScoreBtn').addEventListener('click', resetHighScore);
    document.getElementById('resumeBtn').addEventListener('click', togglePause);
    document.getElementById('pauseMenuBtn').addEventListener('click', showMainMenu);

    // Build interactive mode UI
    modeList.innerHTML = '';
    for (const [key, mode] of Object.entries(MODES)) {
        const card = document.createElement('div');
        card.className = 'mode-card';
        card.dataset.mode = key;
        card.innerHTML = `<span class="mode-name">${mode.label}</span><span class="mode-icon">${mode.icon}</span>`;
        card.addEventListener('click', () => setMode(key));
        modeList.appendChild(card);
    }

    // Listen to custom ranges
    const syncVal = (el, valNode, suffix = '') => {
        el.addEventListener('input', (e) => {
            valNode.textContent = e.target.value + suffix;
        });
    };
    syncVal(rngObsSpawn, valObsSpawn, 's');
    syncVal(rngLaserSpawn, valLaserSpawn, 's');
    syncVal(rngSpeed, valSpeed, '');
    syncVal(rngTrack, valTrack, '%');


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

    if (isCustom) {
        customPanel.classList.remove('hidden');
        highScoreContainer.classList.add('hidden'); // no high scores in custom mode
    } else {
        customPanel.classList.add('hidden');
        highScoreContainer.classList.remove('hidden');
        loadHighScore();
    }
}

function buildModConfig() {
    if (currentMode === 'custom') {
        const obsS = parseFloat(rngObsSpawn.value);
        const lasS = parseFloat(rngLaserSpawn.value);
        modConfig = {
            obsSpawn: obsS > 2.9 ? 0 : obsS, // if set to max, treat as off (for ease)
            lasSpawn: lasS === 0 ? 0 : lasS,
            speed: parseFloat(rngSpeed.value),
            track: parseFloat(rngTrack.value)
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

function startGame() {
    buildModConfig();

    isPlaying = true;
    isPaused = false;
    timeSurvived = 0;
    entities = [];
    obsSpawnTimer = 0;
    lasSpawnTimer = 0;

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

function resetHighScore() {
    if (currentMode !== 'custom') {
        localStorage.removeItem(getStoreKey());
        loadHighScore();
    }
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
    if (entity instanceof Obstacle) {
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
    // Spawn rate intervals decrease (get faster) over time
    let oRate = 0;
    if (modConfig.obsSpawn > 0) {
        oRate = Math.max(0.05, modConfig.obsSpawn - (timeSurvived * 0.005));
    }
    let lRate = 0;
    if (modConfig.lasSpawn > 0) {
        lRate = Math.max(0.1, modConfig.lasSpawn - (timeSurvived * 0.01));
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

    // Update and draw
    player.update();
    player.draw(ctx);

    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        entity.update(safeDt);
        entity.draw(ctx);

        if (checkCollision(player, entity)) {
            gameOver();
            return;
        }

        if (entity.isDead()) {
            entities.splice(i, 1);
        }
    }

    animationId = requestAnimationFrame(gameLoop);
}

init();
