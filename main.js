// Obstacle Rush Main Game Logic
console.log("Obstacle Rush initialized.");

// ==================== SOUND MANAGER ====================
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = localStorage.getItem('orSoundEnabled') !== 'false';
        this.volume = parseFloat(localStorage.getItem('orSoundVolume')) || 0.8;
    }
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    play(type) {
        if (!this.enabled || !this.ctx) return;
        try { this.ctx.resume(); } catch (e) { }
        const t = this.ctx.currentTime;
        const g = this.ctx.createGain();
        g.gain.value = this.volume * 0.3;
        g.connect(this.ctx.destination);
        if (type === 'click') {
            const o = this.ctx.createOscillator();
            o.type = 'sine'; o.frequency.setValueAtTime(800, t);
            o.frequency.exponentialRampToValueAtTime(600, t + 0.06);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            o.connect(g); o.start(t); o.stop(t + 0.08);
        } else if (type === 'start') {
            [400, 500, 700].forEach((f, i) => {
                const o = this.ctx.createOscillator();
                o.type = 'sine'; o.frequency.value = f;
                const sg = this.ctx.createGain();
                sg.gain.setValueAtTime(0, t + i * 0.08);
                sg.gain.linearRampToValueAtTime(this.volume * 0.2, t + i * 0.08 + 0.03);
                sg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
                o.connect(sg); sg.connect(this.ctx.destination);
                o.start(t + i * 0.08); o.stop(t + i * 0.08 + 0.12);
            });
        } else if (type === 'gameOver') {
            const o = this.ctx.createOscillator();
            o.type = 'sawtooth'; o.frequency.setValueAtTime(300, t);
            o.frequency.exponentialRampToValueAtTime(80, t + 0.4);
            g.gain.setValueAtTime(this.volume * 0.15, t);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
            o.connect(g); o.start(t); o.stop(t + 0.5);
        } else if (type === 'newRecord') {
            [523, 659, 784, 1047].forEach((f, i) => {
                const o = this.ctx.createOscillator();
                o.type = 'sine'; o.frequency.value = f;
                const sg = this.ctx.createGain();
                sg.gain.setValueAtTime(0, t + i * 0.1);
                sg.gain.linearRampToValueAtTime(this.volume * 0.25, t + i * 0.1 + 0.03);
                sg.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.2);
                o.connect(sg); sg.connect(this.ctx.destination);
                o.start(t + i * 0.1); o.stop(t + i * 0.1 + 0.2);
            });
        } else if (type === 'target') {
            const o = this.ctx.createOscillator();
            o.type = 'sine'; o.frequency.setValueAtTime(880, t);
            o.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
            o.connect(g); o.start(t); o.stop(t + 0.12);
        } else if (type === 'pause') {
            const o = this.ctx.createOscillator();
            o.type = 'triangle'; o.frequency.value = 500;
            g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            o.connect(g); o.start(t); o.stop(t + 0.1);
        }
    }
    setEnabled(v) { this.enabled = v; localStorage.setItem('orSoundEnabled', v); }
    setVolume(v) { this.volume = v; localStorage.setItem('orSoundVolume', v); }
}
const sfx = new SoundManager();

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
const blackoutConfig = document.getElementById('blackoutConfig');
const rngBlackoutRadius = document.getElementById('rngBlackoutRadius');
const valBlackoutRadius = document.getElementById('valBlackoutRadius');
const rngChainsawAmp = document.getElementById('rngChainsawAmp');
const valChainsawAmp = document.getElementById('valChainsawAmp');

const chkBullet = document.getElementById('chkBullet');
const chkHoming = document.getElementById('chkHoming');
const chkShotgun = document.getElementById('chkShotgun');
const chkWave = document.getElementById('chkWave');
const chkSniper = document.getElementById('chkSniper');

const togMirror = document.getElementById('togMirror');
const togMirrorPlayer = document.getElementById('togMirrorPlayer');
const togDisguise = document.getElementById('togDisguise');

const togBot = document.getElementById('togBot');
const botLevelContainer = document.getElementById('botLevelContainer');
const rngBotLevel = document.getElementById('rngBotLevel');
const valBotLevel = document.getElementById('valBotLevel');

const livesText = document.getElementById('livesText');

// Game State
let animationId;
let lastTime = 0;
let timeSurvived = 0; // in seconds
let targetScore = 0; // for target hunt
let targetHuntEnabled = true; // target hunt toggle
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
const defaultGrowth = 0.97;
const MODES = {
    obstacle: { category: 'Klasik', label: 'Obstacles', icon: '🔴', desc: 'Pengalaman klasik yang menegangkan. Hindari lingkaran merah yang berjatuhan; kecepatan mereka akan terus meningkat secara konstan seiring waktu.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    laser: { category: 'Klasik', label: 'Lasers', icon: '💥', desc: 'Sinar laser mematikan dari ujung ke ujung layar. Perhatikan peringatan transparan sebelum laser diaktifkan secara mendadak!', lives: 1, obsSpawn: 0, lasSpawn: 1.0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    chaos: { category: 'Klasik', label: 'Chaos', icon: '🔥', desc: 'Kekacauan mutlak. Baik obstacles maupun laser akan muncul secara bersamaan untuk menguji refleks ekstrem Anda.', lives: 1, obsSpawn: 0.5, lasSpawn: 1.0, proSpawn: 0, speed: 150, track: 0, obsGrowth: 0.95, lasGrowth: 0.95, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    sluggish: { category: 'Tantangan', label: 'Sluggish', icon: '🐌', desc: 'Rintangan bergerak sangat lambat namun kemunculan sangat beruntun, perlahan akan menutupi seluruh layar.', lives: 1, obsSpawn: 0.25, lasSpawn: 0, proSpawn: 0, speed: 25, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    lightning: { category: 'Tantangan', label: 'Lightning', icon: '⚡', desc: 'Berkedip dan Anda akan mati. Obstacles bergerak dengan kecepatan luar biasa.', lives: 1, obsSpawn: 0.7, lasSpawn: 0, proSpawn: 0, speed: 1200, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    stalker: { category: 'Tantangan', label: 'Stalker', icon: '👁️', desc: 'Mereka mengawasi dan mengikuti Anda. Obstacles secara perlahan akan berbelok dan melacak pergerakan kursor Anda.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 1.5, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    mirror: { category: 'Eksperimental', label: 'Mirror', icon: '🪞', desc: 'Setiap rintangan yang muncul memiliki duplikat simetris dari sisi berlawanan layar. Jumlah rintangan 2x lipat!', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    mirrorPlayer: { category: 'Eksperimental', label: 'Mirror Player', icon: '🎭', desc: '2 objek player bergerak di layar — satu mengikuti kursor, satu bergerak terbalik. Keduanya harus dijaga agar selamat!', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    blackout: { category: 'Eksperimental', label: 'Blackout', icon: '🔦', desc: 'Malam yang gelap gulita. Pemain hanya dibekali cahaya senter kecil untuk meraba rintangan merah yang mendekat diam-diam.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: true, chainsaw: false, blackoutRadius: 160, chainsawAmp: 400, saveScore: true },
    chainsaw: { category: 'Tantangan', label: 'Chainsaw', icon: '⚙️', desc: 'Rintangan bergerak secara bergelombang dan memutar dalam lintasan sinusoidal yang sulit diprediksi ujung hitboxnya.', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: true, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    proyektil: { category: 'Klasik', label: 'Proyektil', icon: '📡', desc: '5 jenis peluru mematikan: Bullet, Homing, Shotgun, Wave, dan Sniper — masing-masing dengan gaya unik. Semakin lama, semakin sulit!', lives: 3, obsSpawn: 0, lasSpawn: 0, proSpawn: 0.6, speed: 220, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    disguise: { category: 'Eksperimental', label: 'Disguise', icon: '🔴', desc: 'Player terlihat identik dengan rintangan — merah, tanpa glow, ukuran sama. Bisakah Anda melacak diri sendiri di antara kerumunan?', lives: 1, obsSpawn: 0.5, lasSpawn: 0, proSpawn: 0, speed: 150, track: 0, obsGrowth: defaultGrowth, lasGrowth: defaultGrowth, lasWarn: 1.0, blackout: false, chainsaw: false, blackoutRadius: 200, chainsawAmp: 400, saveScore: true },
    custom: { category: 'Kustom', label: 'Custom', icon: '🛠️', desc: 'Atur engine fisika permainan secara manual menggunakan panel sistem. Skor tertinggi tidak akan disimpan pada mode ini.', saveScore: false }
};

// Entities arrays
let entities = [];
let obsSpawnTimer = 0;
let lasSpawnTimer = 0;
let proSpawnTimer = 0;
let targetSpawnTimer = 0;

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
            if (Math.floor(invulnerableTimer * 10) % 2 === 0) return;
        }

        // Disguise mode: draw as obstacle-like
        if (currentMode === 'disguise' || (currentMode === 'custom' && modConfig.disguise)) {
            ctx.save();
            const dg = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0, this.x, this.y, this.radius);
            dg.addColorStop(0, '#ff8a8a'); dg.addColorStop(0.5, '#ef4444'); dg.addColorStop(1, '#991b1b');
            ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = dg; ctx.shadowBlur = 12; ctx.shadowColor = '#ef4444'; ctx.fill();
            ctx.shadowBlur = 0; ctx.restore();
            return;
        }

        ctx.save();
        // Outer halo
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius + 6, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Main body gradient
        const pg = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0, this.x, this.y, this.radius);
        pg.addColorStop(0, '#ffffff'); pg.addColorStop(0.4, '#e0f2fe'); pg.addColorStop(1, '#0891b2');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = pg;
        ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(6, 182, 212, 0.7)';
        ctx.fill(); ctx.shadowBlur = 0;

        // Inner core
        const ig = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 0.5);
        ig.addColorStop(0, '#22d3ee'); ig.addColorStop(1, 'rgba(6, 182, 212, 0.3)');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = ig; ctx.fill();

        // Specular highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.3, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fill();

        ctx.restore();
    }
}

class Projectile {
    constructor(type = null, startX = null, startY = null, targetAngle = null) {
        this.radius = 6;
        let types = ['bullet', 'homing', 'shotgun', 'wave', 'sniper'];

        // In custom mode, filter to only checked types
        if (currentMode === 'custom' && type === null) {
            const activeTypes = [];
            if (chkBullet && chkBullet.checked) activeTypes.push('bullet');
            if (chkHoming && chkHoming.checked) activeTypes.push('homing');
            if (chkShotgun && chkShotgun.checked) activeTypes.push('shotgun');
            if (chkWave && chkWave.checked) activeTypes.push('wave');
            if (chkSniper && chkSniper.checked) activeTypes.push('sniper');
            if (activeTypes.length > 0) types = activeTypes;
        }

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

        const speedMult = 1 + (timeSurvived / 120);
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
            this.trackTimer = 2.5;
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
        ctx.save();
        const STYLES = {
            bullet: { c1: '#fca5a5', c2: '#ef4444', c3: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.6)' },
            homing: { c1: '#fde68a', c2: '#f59e0b', c3: '#78350f', glow: 'rgba(245, 158, 11, 0.6)' },
            shotgun: { c1: '#fca5a5', c2: '#ef4444', c3: '#7f1d1d', glow: 'rgba(239, 68, 68, 0.5)' },
            wave: { c1: '#ddd6fe', c2: '#a78bfa', c3: '#4c1d95', glow: 'rgba(167, 139, 250, 0.6)' },
            sniper: { c1: '#a7f3d0', c2: '#34d399', c3: '#064e3b', glow: 'rgba(52, 211, 153, 0.6)' }
        };
        const s = STYLES[this.type] || STYLES.bullet;

        // Trail effect
        ctx.beginPath();
        ctx.arc(this.x - this.vx * 0.03, this.y - this.vy * 0.03, this.radius * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = s.glow.replace('0.6', '0.2'); ctx.fill();

        // Outer glow ring
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = s.glow.replace('0.6', '0.25'); ctx.lineWidth = 1.5; ctx.stroke();

        // Main gradient body
        const g = ctx.createRadialGradient(this.x - this.radius * 0.25, this.y - this.radius * 0.25, 0, this.x, this.y, this.radius);
        g.addColorStop(0, s.c1); g.addColorStop(0.5, s.c2); g.addColorStop(1, s.c3);
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.shadowBlur = 14; ctx.shadowColor = s.glow;
        ctx.fill(); ctx.shadowBlur = 0;

        // Specular dot
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.2, this.y - this.radius * 0.2, this.radius * 0.2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();

        ctx.restore();
    }

    isDead() {
        if (this.dead) return true;
        const margin = this.radius * 2;
        return (this.x < -margin || this.x > canvas.width + margin || this.y < -margin || this.y > canvas.height + margin);
    }
}

class Obstacle {
    constructor() {
        // Disguise mode: fixed radius = PLAYER_RADIUS
        this.radius = (currentMode === 'disguise' || (currentMode === 'custom' && modConfig.disguise)) ? PLAYER_RADIUS : SIZES[Math.floor(Math.random() * SIZES.length)];
        const edge = Math.floor(Math.random() * 4);

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

        const speedMult = 1 + (timeSurvived / 120);
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
        ctx.save();
        // Outer glow ring
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)'; ctx.lineWidth = 2; ctx.stroke();

        // Main gradient fill
        const og = ctx.createRadialGradient(this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0, this.x, this.y, this.radius);
        og.addColorStop(0, '#ff8a8a'); og.addColorStop(0.5, '#ef4444'); og.addColorStop(1, '#991b1b');
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = og; ctx.shadowBlur = 16; ctx.shadowColor = 'rgba(239, 68, 68, 0.5)';
        ctx.fill(); ctx.shadowBlur = 0;

        // Inner highlight
        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.25, this.y - this.radius * 0.25, this.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'; ctx.fill();

        // Inner circuit ring
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius * 0.55, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
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
        ctx.save();

        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);

        if (this.phase === 'warning') {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.stroke();
            ctx.setLineDash([]);
        } else if (this.phase === 'active') {
            // Outer glow layer
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
            ctx.lineWidth = 28; ctx.stroke();
            // Mid glow layer
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.lineWidth = 16; ctx.stroke();
            // Core beam
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 6;
            ctx.shadowBlur = 20; ctx.shadowColor = '#ef4444';
            ctx.stroke();
            // White-hot center
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 2; ctx.shadowBlur = 0;
            ctx.stroke();
        }

        ctx.restore();
    }

    isDead() {
        if (this.dead) return true;
        return this.phase === 'dead';
    }
}

class Target {
    constructor() {
        this.radius = 12;
        this.x = this.radius + Math.random() * (canvas.width - this.radius * 2);
        this.y = this.radius + Math.random() * (canvas.height - this.radius * 2);
        this.collected = false;
        this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.pulsePhase += dt * 4;
    }

    draw(ctx) {
        if (this.collected) return;
        const pulse = 1 + Math.sin(this.pulsePhase) * 0.2;
        const r = this.radius * pulse;
        const t = this.pulsePhase;

        ctx.save();
        // Outer rotating ring
        ctx.translate(this.x, this.y);
        ctx.rotate(t * 0.5);
        ctx.beginPath(); ctx.arc(0, 0, r + 8, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.15)'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Outer glow halo
        ctx.beginPath(); ctx.arc(this.x, this.y, r + 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.1)'; ctx.fill();

        // Main gradient body
        const g = ctx.createRadialGradient(this.x - r * 0.25, this.y - r * 0.25, 0, this.x, this.y, r);
        g.addColorStop(0, '#fef9c3'); g.addColorStop(0.4, '#facc15'); g.addColorStop(1, '#a16207');
        ctx.beginPath(); ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.shadowBlur = 22; ctx.shadowColor = 'rgba(250, 204, 21, 0.7)';
        ctx.fill(); ctx.shadowBlur = 0;

        // Inner diamond shape
        const ir = r * 0.4;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - ir);
        ctx.lineTo(this.x + ir, this.y);
        ctx.lineTo(this.x, this.y + ir);
        ctx.lineTo(this.x - ir, this.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; ctx.fill();

        // Specular
        ctx.beginPath();
        ctx.arc(this.x - r * 0.2, this.y - r * 0.25, r * 0.15, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.fill();
        ctx.restore();
    }

    isDead() {
        return this.collected;
    }
}

let player = new Player();
let mirrorPlayer = null; // Used in mirrorPlayer mode

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

    // (Progress modal removed)

    // Achievement modal
    document.getElementById('showAchievementBtn').addEventListener('click', () => {
        renderAchievementModal();
        document.getElementById('mainMenu').style.display = 'none';
    });
    document.getElementById('closeAchievementBtn').addEventListener('click', () => {
        document.getElementById('achievementModal').classList.add('hidden');
        document.getElementById('mainMenu').style.display = 'flex';
    });

    // Target Hunt toggle
    const togTargetHunt = document.getElementById('togTargetHunt');
    if (togTargetHunt) {
        togTargetHunt.checked = true;
        togTargetHunt.addEventListener('change', () => {
            targetHuntEnabled = togTargetHunt.checked;
        });
    }

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
            // Create grid container for this category's cards
            const grid = document.createElement('div');
            grid.className = 'mode-cat-grid';
            grid.dataset.cat = currentCat;
            modeList.appendChild(grid);
        }

        const card = document.createElement('div');
        card.className = 'mode-card';
        card.dataset.mode = key;
        card.innerHTML = `<span class="mode-name">${mode.label}</span><span class="mode-icon">${mode.icon}</span>`;
        card.addEventListener('click', () => setMode(key));
        // Append to the last grid container
        const grids = modeList.querySelectorAll('.mode-cat-grid');
        grids[grids.length - 1].appendChild(card);
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
    togBlackout.addEventListener('change', (e) => {
        if (e.target.checked) blackoutConfig.classList.remove('hidden-content');
        else blackoutConfig.classList.add('hidden-content');
    });
    togBot.addEventListener('change', (e) => {
        isBotPlaying = e.target.checked;
        if (e.target.checked) {
            botLevelContainer.classList.remove('hidden-content');
            document.getElementById('startBtn').innerHTML = 'LIHAT BOT BERMAIN <span class="arrow">→</span>';
        } else {
            botLevelContainer.classList.add('hidden-content');
            document.getElementById('startBtn').innerHTML = 'MAIN SEKARANG <span class="arrow">→</span>';
        }
    });

    rngBotLevel.addEventListener('input', (e) => {
        botLevel = parseInt(e.target.value);
        valBotLevel.textContent = BOT_LEVELS[botLevel - 1].label;
        updateBotSliderColor(e.target);
    });

    function updateBotSliderColor(slider) {
        const val = parseInt(slider.value);
        const max = parseInt(slider.max);
        const pct = (val - 1) / (max - 1);
        // Blue → Orange → Red gradient
        const r = Math.round(0 + pct * 255);
        const g = Math.round(212 - pct * 140);
        const b = Math.round(255 - pct * 255);
        const color = `rgb(${r}, ${g}, ${b})`;
        slider.style.setProperty('--slider-color', color);
        slider.style.background = `linear-gradient(90deg, rgba(0,212,255,0.3) 0%, rgba(${r},${g},${b},0.4) ${pct * 100}%, rgba(255,255,255,0.06) ${pct * 100}%)`;
    }

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

    // Settings modal
    const settingsModal = document.getElementById('settingsModal');
    const togSound = document.getElementById('togSound');
    const rngVolume = document.getElementById('rngVolume');
    const valVolume = document.getElementById('valVolume');
    togSound.checked = sfx.enabled;
    rngVolume.value = sfx.volume * 100;
    valVolume.textContent = Math.round(sfx.volume * 100) + '%';

    document.getElementById('showSettingsBtn').addEventListener('click', () => {
        sfx.play('click');
        settingsModal.classList.remove('hidden');
        document.getElementById('mainMenu').style.display = 'none';
    });
    document.getElementById('closeSettingsBtn').addEventListener('click', () => {
        sfx.play('click');
        settingsModal.classList.add('hidden');
        document.getElementById('mainMenu').style.display = 'flex';
    });
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
            document.getElementById('mainMenu').style.display = 'flex';
        }
    });
    togSound.addEventListener('change', (e) => {
        sfx.setEnabled(e.target.checked);
        if (e.target.checked) { sfx.init(); sfx.play('click'); }
    });
    rngVolume.addEventListener('input', (e) => {
        const v = parseInt(e.target.value) / 100;
        sfx.setVolume(v);
        valVolume.textContent = e.target.value + '%';
    });
    document.getElementById('resetAllDataBtn').addEventListener('click', async () => {
        sfx.play('click');
        const ok = await gameConfirm(
            '⚠️ Hapus Semua Data',
            'Apakah Anda yakin ingin menghapus SEMUA data permainan? Ini termasuk high score, pencapaian, dan semua progres. Tindakan ini tidak dapat dibatalkan.',
            'Ya, Hapus Semua'
        );
        if (!ok) return;
        const keysToDelete = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && (k.startsWith('obstacleRush') || k.startsWith('orAch_'))) keysToDelete.push(k);
        }
        keysToDelete.forEach(k => localStorage.removeItem(k));
        loadHighScore();
        updateModeStatsPanel(currentMode);
        // Stay on settings page (don't close modal)
    });
    document.getElementById('startBtn').addEventListener('click', () => sfx.play('click'));
    document.getElementById('showAchievementBtn').addEventListener('click', () => sfx.play('click'));

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
        const perfEl = document.getElementById('perfPreview');
        if (perfEl) perfEl.style.display = 'none';
    } else {
        customPanel.classList.add('hidden');
        highScoreContainer.classList.remove('hidden');
        loadHighScore();
        updateModeStatsPanel(modeKey);
    }
}

function updateModeStatsPanel(modeKey) {
    const panel = document.getElementById('modeAchPanel');
    if (!panel) return;
    if (modeKey === 'custom') { panel.style.display = 'none'; return; }
    panel.style.display = '';
    const stats = getModeAchStats(modeKey);
    panel.innerHTML = `
        <div class="msp-title">🏆 Pencapaian</div>
        <div class="msp-progress">
            <div class="msp-bar-row">
                <span class="msp-bar-label">⏱️ Waktu</span>
                <div class="ach-bar-bg msp-bar"><div class="ach-bar-fill ach-bar-time" style="width:${stats.timePct}%"></div></div>
                <span class="msp-bar-pct">${stats.timePct}% <span style="opacity:0.5;font-size:0.65rem">/ 300s</span></span>
            </div>
            <div class="msp-bar-row">
                <span class="msp-bar-label">🎯 Target</span>
                <div class="ach-bar-bg msp-bar"><div class="ach-bar-fill ach-bar-target" style="width:${stats.targetPct}%"></div></div>
                <span class="msp-bar-pct">${stats.targetPct}% <span style="opacity:0.5;font-size:0.65rem">/ 50</span></span>
            </div>
        </div>
        <div class="msp-overall">
            <span>Keseluruhan</span>
            <span class="msp-overall-pct">${stats.combinedPct}%</span>
        </div>
    `;
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

    if (mode.blackout) {
        blackoutConfig.classList.remove('hidden-content');
    } else {
        blackoutConfig.classList.add('hidden-content');
    }

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
            chainsawAmp: rngChainsawAmp ? parseInt(rngChainsawAmp.value) : 400,
            mirror: togMirror ? togMirror.checked : false,
            mirrorPlayer: togMirrorPlayer ? togMirrorPlayer.checked : false,
            disguise: togDisguise ? togDisguise.checked : false
        };
    } else {
        modConfig = MODES[currentMode];
    }
}

function drawBackground() {
    ctx.fillStyle = '#050811';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(100, 120, 200, 0.04)';
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
    if (entity) entity.dead = true;

    // Screen flash + shake effect
    const cv = document.getElementById('gameCanvas');
    cv.style.filter = 'brightness(3) saturate(0)';
    cv.style.transform = 'translate(4px, -3px)';
    setTimeout(() => { cv.style.filter = ''; cv.style.transform = 'translate(-3px, 2px)'; }, 50);
    setTimeout(() => { cv.style.filter = ''; cv.style.transform = ''; }, 120);
    sfx.play('gameOver');

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
    sfx.init();
    sfx.play('start');

    isPlaying = true;
    isPaused = false;
    timeSurvived = 0;
    targetScore = 0;
    entities = [];
    obsSpawnTimer = 0;
    lasSpawnTimer = 0;
    proSpawnTimer = 0;
    targetSpawnTimer = 0;

    // Initialize mirror player for mirrorPlayer mode
    if (currentMode === 'mirrorPlayer' || (currentMode === 'custom' && modConfig.mirrorPlayer)) {
        mirrorPlayer = { x: canvas.width / 2, y: canvas.height / 2, radius: PLAYER_RADIUS };
    } else {
        mirrorPlayer = null;
    }

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

    canvas.style.cursor = 'none'; // Hide cursor during gameplay

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
    canvas.style.cursor = 'default';

    // Capture previous bests BEFORE saving
    const prevTimeBest = parseFloat(localStorage.getItem(getStoreKey())) || 0;
    const prevTargetBest = parseFloat(localStorage.getItem(`obstacleRushHighTarget_${currentMode}`)) || 0;

    if (currentMode !== 'custom') {
        saveHighScore();
        checkAchievements();
    }

    // Populate game over screen
    const newTimeBest = parseFloat(localStorage.getItem(getStoreKey())) || 0;
    const newTargetBest = parseFloat(localStorage.getItem(`obstacleRushHighTarget_${currentMode}`)) || 0;

    // Time stat card
    const goTimeVal = document.getElementById('goTimeValue');
    const goTimeBest = document.getElementById('goTimeBest');
    const goTimeDelta = document.getElementById('goTimeDelta');
    if (goTimeVal) goTimeVal.textContent = formatTime(timeSurvived);
    if (goTimeBest) goTimeBest.textContent = `Terbaik: ${formatTime(newTimeBest)}`;
    if (goTimeDelta) {
        if (timeSurvived > prevTimeBest && prevTimeBest > 0) {
            goTimeDelta.textContent = `+${formatTime(timeSurvived - prevTimeBest)} \u2B06`;
            goTimeDelta.classList.remove('hidden');
            goTimeDelta.classList.add('go-delta-up');
        } else if (timeSurvived >= prevTimeBest && prevTimeBest === 0 && timeSurvived > 0) {
            goTimeDelta.textContent = '\u2728 REKOR BARU!';
            goTimeDelta.classList.remove('hidden');
            goTimeDelta.classList.add('go-delta-new');
        } else {
            goTimeDelta.classList.add('hidden');
            goTimeDelta.classList.remove('go-delta-up', 'go-delta-new');
        }
    }

    // Target stat card
    const goTargetVal = document.getElementById('goTargetValue');
    const goTargetBest = document.getElementById('goTargetBest');
    const goTargetDelta = document.getElementById('goTargetDelta');
    if (goTargetVal) goTargetVal.textContent = targetScore;
    if (goTargetBest) goTargetBest.textContent = `Terbaik: ${Math.floor(newTargetBest)}`;
    if (goTargetDelta) {
        if (targetHuntEnabled && targetScore > prevTargetBest && prevTargetBest > 0) {
            goTargetDelta.textContent = `+${targetScore - Math.floor(prevTargetBest)} \u2B06`;
            goTargetDelta.classList.remove('hidden');
            goTargetDelta.classList.add('go-delta-up');
        } else if (targetHuntEnabled && targetScore > 0 && prevTargetBest === 0) {
            goTargetDelta.textContent = '\u2728 REKOR BARU!';
            goTargetDelta.classList.remove('hidden');
            goTargetDelta.classList.add('go-delta-new');
        } else {
            goTargetDelta.classList.add('hidden');
            goTargetDelta.classList.remove('go-delta-up', 'go-delta-new');
        }
    }

    // Target card visibility
    const targetCard = document.querySelector('.go-stat-target');
    if (targetCard) {
        targetCard.style.display = targetHuntEnabled ? '' : 'none';
    }

    updateGameOverProgress();
    sfx.play('gameOver');

    hud.classList.add('hidden');
    gameOverMenu.classList.remove('hidden');
}

function showMainMenu() {
    isPlaying = false;
    isPaused = false;
    cancelAnimationFrame(animationId);
    canvas.style.cursor = 'default'; // Show cursor again

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
    const timeMsg = formatTime(timeSurvived);
    if (targetHuntEnabled) {
        const msg = `${timeMsg}  │  🎯 ${targetScore}`;
        scoreTextNodes.forEach(node => node.textContent = msg);
    } else {
        scoreTextNodes.forEach(node => node.textContent = timeMsg);
    }
}

function getStoreKey() {
    return `obstacleRushHigh_${currentMode}`;
}

function saveHighScore() {
    if (isBotPlaying) return;
    const key = getStoreKey();
    // Save time-based high score
    const currentTimeHigh = parseFloat(localStorage.getItem(key)) || 0;
    if (timeSurvived > currentTimeHigh) {
        localStorage.setItem(key, timeSurvived.toString());
    }
    // Save target-based high score (separate key)
    if (targetHuntEnabled) {
        const targetKey = `obstacleRushHighTarget_${currentMode}`;
        const currentTargetHigh = parseFloat(localStorage.getItem(targetKey)) || 0;
        if (targetScore > currentTargetHigh) {
            localStorage.setItem(targetKey, targetScore.toString());
        }
    }
}

function loadHighScore() {
    const key = getStoreKey();
    const timeHigh = parseFloat(localStorage.getItem(key)) || 0;
    const targetKey = `obstacleRushHighTarget_${currentMode}`;
    const targetHigh = parseFloat(localStorage.getItem(targetKey)) || 0;
    let formattedMsg = `⏱️ ${formatTime(timeHigh)}`;
    if (targetHigh > 0) {
        formattedMsg += `  │  🎯 ${Math.floor(targetHigh)}`;
    }
    highScoreNodes.forEach(node => node.textContent = formattedMsg);
}

// renderProgressList removed — progress page deleted

// ==================== ACHIEVEMENT SYSTEM ====================
// Time: 1% per 3 seconds => 100% = 300s
// Target: 2% per target => 100% = 50 targets
const ACH_TIME_MAX = 300; // seconds for 100%
const ACH_TARGET_MAX = 50; // targets for 100%

function getTimePercent(seconds) {
    return Math.min(100, Math.round((seconds / ACH_TIME_MAX) * 100));
}

function getTargetPercent(targets) {
    return Math.min(100, Math.round((targets / ACH_TARGET_MAX) * 100));
}

function getAchStoreKey(modeKey, type) {
    return `obstacleRushAchProg_${modeKey}_${type}`;
}

function checkAchievements() {
    if (isBotPlaying || currentMode === 'custom') return;
    const mode = MODES[currentMode];
    if (!mode || !mode.saveScore) return;

    // Save best time progress
    const timeKey = getAchStoreKey(currentMode, 'time');
    const prevTime = parseFloat(localStorage.getItem(timeKey)) || 0;
    if (timeSurvived > prevTime) {
        localStorage.setItem(timeKey, timeSurvived.toString());
    }

    // Save best target progress
    if (targetHuntEnabled) {
        const targetKey = getAchStoreKey(currentMode, 'target');
        const prevTarget = parseFloat(localStorage.getItem(targetKey)) || 0;
        if (targetScore > prevTarget) {
            localStorage.setItem(targetKey, targetScore.toString());
        }
    }
}

function getModeAchStats(modeKey) {
    const bestTime = parseFloat(localStorage.getItem(getAchStoreKey(modeKey, 'time'))) || 0;
    const bestTarget = parseFloat(localStorage.getItem(getAchStoreKey(modeKey, 'target'))) || 0;
    const timePct = getTimePercent(bestTime);
    const targetPct = getTargetPercent(bestTarget);
    const combinedPct = Math.round((timePct + targetPct) / 2);
    return { bestTime, bestTarget, timePct, targetPct, combinedPct };
}

function getOverallAchStats() {
    let totalTimePct = 0;
    let totalTargetPct = 0;
    let modeCount = 0;
    for (const [key, mode] of Object.entries(MODES)) {
        if (!mode.saveScore) continue;
        const stats = getModeAchStats(key);
        totalTimePct += stats.timePct;
        totalTargetPct += stats.targetPct;
        modeCount++;
    }
    const avgTime = modeCount > 0 ? Math.round(totalTimePct / modeCount) : 0;
    const avgTarget = modeCount > 0 ? Math.round(totalTargetPct / modeCount) : 0;
    const avgCombined = Math.round((avgTime + avgTarget) / 2);
    return { avgTime, avgTarget, avgCombined, modeCount };
}

function gameConfirm(title, message, yesLabel = 'Ya, Hapus') {
    return new Promise((resolve) => {
        const overlay = document.getElementById('customConfirmOverlay');
        const titleEl = document.getElementById('confirmTitle');
        const msgEl = document.getElementById('confirmMessage');
        const yesBtn = document.getElementById('confirmYesBtn');
        const noBtn = document.getElementById('confirmNoBtn');
        if (!overlay) { resolve(confirm(message)); return; }
        titleEl.textContent = title;
        msgEl.textContent = message;
        yesBtn.textContent = yesLabel;
        overlay.classList.remove('hidden');

        const cleanup = () => {
            overlay.classList.add('hidden');
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            overlay.removeEventListener('click', onOverlay);
        };
        const onYes = () => { cleanup(); resolve(true); };
        const onNo = () => { cleanup(); resolve(false); };
        const onOverlay = (e) => { if (e.target === overlay) { cleanup(); resolve(false); } };
        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
        overlay.addEventListener('click', onOverlay);
    });
}

// resetAllAchievements removed — delete button moved to Settings page

function updateGameOverProgress() {
    const el = document.getElementById('gameOverAchProgress');
    if (!el || currentMode === 'custom') { if (el) el.innerHTML = ''; return; }
    const stats = getModeAchStats(currentMode);
    el.innerHTML = `
        <div class="go-ach-section">
            <div class="go-ach-title">Pencapaian Mode</div>
            <div class="go-ach-bars">
                <div class="go-ach-bar-row">
                    <span class="go-ach-bar-label">⏱️ Waktu</span>
                    <div class="ach-bar-bg go-bar"><div class="ach-bar-fill ach-bar-time" style="width:${stats.timePct}%"></div></div>
                    <span class="go-ach-bar-pct">${stats.timePct}%</span>
                </div>
                <div class="go-ach-bar-row">
                    <span class="go-ach-bar-label">🎯 Target</span>
                    <div class="ach-bar-bg go-bar"><div class="ach-bar-fill ach-bar-target" style="width:${stats.targetPct}%"></div></div>
                    <span class="go-ach-bar-pct">${stats.targetPct}%</span>
                </div>
            </div>
        </div>
    `;
}

function renderAchievementModal() {
    const modal = document.getElementById('achievementModal');
    const content = document.getElementById('achievementContent');
    if (!content) return;
    content.innerHTML = '';

    const overall = getOverallAchStats();

    // Overall card (full width)
    const overallDiv = document.createElement('div');
    overallDiv.className = 'ach-overall ach-3d-card';
    overallDiv.innerHTML = `
        <div class="ach-3d-inner">
            <div class="ach-overall-header">
                <span class="ach-trophy">🏆</span>
                <div class="ach-overall-info">
                    <span class="ach-overall-title">Keseluruhan Game</span>
                    <span class="ach-overall-pct">${overall.avgCombined}%</span>
                </div>
            </div>
            <div class="ach-dual-bars">
                <div class="ach-dual-row">
                    <span class="ach-dual-label">⏱️ Waktu</span>
                    <div class="ach-bar-bg"><div class="ach-bar-fill ach-bar-time" style="width:${overall.avgTime}%"></div></div>
                    <span class="ach-dual-val">${overall.avgTime}%</span>
                </div>
                <div class="ach-dual-row">
                    <span class="ach-dual-label">🎯 Target</span>
                    <div class="ach-bar-bg"><div class="ach-bar-fill ach-bar-target" style="width:${overall.avgTarget}%"></div></div>
                    <span class="ach-dual-val">${overall.avgTarget}%</span>
                </div>
            </div>
        </div>
    `;
    content.appendChild(overallDiv);

    // 2-column grid for per-mode cards
    const grid = document.createElement('div');
    grid.className = 'ach-mode-grid';

    for (const [key, mode] of Object.entries(MODES)) {
        if (!mode.saveScore) continue;
        const stats = getModeAchStats(key);
        const highTime = parseFloat(localStorage.getItem(`obstacleRushHigh_${key}`)) || 0;
        const highTarget = parseFloat(localStorage.getItem(`obstacleRushHighTarget_${key}`)) || 0;

        const section = document.createElement('div');
        section.className = 'ach-mode-section ach-3d-card';
        section.innerHTML = `
            <div class="ach-3d-inner">
                <div class="ach-mode-header">
                    <span class="ach-mode-icon">${mode.icon}</span>
                    <span class="ach-mode-name">${mode.label}</span>
                    <span class="ach-mode-pct">${stats.combinedPct}%</span>
                </div>
                <div class="ach-highscores">
                    <div class="ach-hs-item">
                        <span class="ach-hs-icon">⏱️</span>
                        <span class="ach-hs-val ach-hs-cyan">${highTime > 0 ? formatTime(highTime) : '—'}</span>
                    </div>
                    <div class="ach-hs-divider"></div>
                    <div class="ach-hs-item">
                        <span class="ach-hs-icon">🎯</span>
                        <span class="ach-hs-val ach-hs-gold">${highTarget > 0 ? Math.floor(highTarget) : '—'}</span>
                    </div>
                </div>
                <div class="ach-dual-bars">
                    <div class="ach-dual-row">
                        <span class="ach-dual-label">⏱️</span>
                        <div class="ach-bar-bg"><div class="ach-bar-fill ach-bar-time" style="width:${stats.timePct}%"></div></div>
                        <span class="ach-dual-val">${stats.timePct}%</span>
                    </div>
                    <div class="ach-dual-row">
                        <span class="ach-dual-label">🎯</span>
                        <div class="ach-bar-bg"><div class="ach-bar-fill ach-bar-target" style="width:${stats.targetPct}%"></div></div>
                        <span class="ach-dual-val">${stats.targetPct}%</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(section);
    }
    content.appendChild(grid);

    modal.classList.remove('hidden');
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
        const growthPower = Math.pow(modConfig.obsGrowth || 0.97, timeSurvived);
        pRate = Math.max(0.1, modConfig.proSpawn * growthPower);
    }

    // Obstacle Spawner
    if (oRate > 0) {
        obsSpawnTimer += safeDt;
        if (obsSpawnTimer >= oRate) {
            const obs = new Obstacle();
            entities.push(obs);

            // Mirror mode: spawn symmetric duplicate
            if (currentMode === 'mirror' || (currentMode === 'custom' && modConfig.mirror)) {
                const mirrorObs = new Obstacle();
                mirrorObs.x = canvas.width - obs.x;
                mirrorObs.y = canvas.height - obs.y;
                mirrorObs.vx = -obs.vx;
                mirrorObs.vy = -obs.vy;
                mirrorObs.radius = obs.radius;
                entities.push(mirrorObs);
            }

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

    // Target Spawner (active in all modes when target hunt is enabled)
    if (targetHuntEnabled && currentMode !== 'custom') {
        if (timeSurvived >= 10) {
            targetSpawnTimer += safeDt;
            const hasActiveTarget = entities.some(e => e instanceof Target && !e.collected);
            if (!hasActiveTarget && targetSpawnTimer >= 2.0) {
                entities.push(new Target());
                targetSpawnTimer = 0;
            }
        }
    }

    if (isBotPlaying) {
        updateBot(safeDt);
    } else {
        player.update();
    }

    // Mirror Player mode: update & draw mirror player
    if ((currentMode === 'mirrorPlayer' || (currentMode === 'custom' && modConfig.mirrorPlayer)) && mirrorPlayer) {
        mirrorPlayer.x = canvas.width - player.x;
        mirrorPlayer.y = canvas.height - player.y;
    }

    player.draw(ctx);

    // Draw mirror player (amber color)
    if ((currentMode === 'mirrorPlayer' || (currentMode === 'custom' && modConfig.mirrorPlayer)) && mirrorPlayer) {
        ctx.beginPath();
        ctx.arc(mirrorPlayer.x, mirrorPlayer.y, mirrorPlayer.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#fbbf24';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#fbbf24';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(mirrorPlayer.x, mirrorPlayer.y, mirrorPlayer.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    for (let i = entities.length - 1; i >= 0; i--) {
        const entity = entities[i];
        entity.update(safeDt);
        entity.draw(ctx);

        // Target collection (not damage)
        if (entity instanceof Target && !entity.collected) {
            const dx = player.x - entity.x;
            const dy = player.y - entity.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < (player.radius + entity.radius)) {
                entity.collected = true;
                targetScore++;
                sfx.play('target');
                // Particle burst effect
                for (let p = 0; p < 12; p++) {
                    const angle = (Math.PI * 2 / 12) * p;
                    const speed = 60 + Math.random() * 80;
                    const px = entity.x, py = entity.y;
                    const pvx = Math.cos(angle) * speed, pvy = Math.sin(angle) * speed;
                    const pLife = 0.3 + Math.random() * 0.2;
                    let pTime = 0;
                    const pId = requestAnimationFrame(function drawP(ts) {
                        pTime += 0.016;
                        if (pTime > pLife) return;
                        const x = px + pvx * pTime, y = py + pvy * pTime;
                        const alpha = 1 - pTime / pLife;
                        ctx.beginPath(); ctx.arc(x, y, 3 * alpha, 0, Math.PI * 2);
                        ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
                        ctx.shadowBlur = 8; ctx.shadowColor = '#facc15';
                        ctx.fill(); ctx.shadowBlur = 0;
                        requestAnimationFrame(drawP);
                    });
                }
            }
        } else if (checkCollision(player, entity)) {
            takeDamage(entity);
        }

        // Mirror Player collision check
        if ((currentMode === 'mirrorPlayer' || (currentMode === 'custom' && modConfig.mirrorPlayer)) && mirrorPlayer && !entity.dead) {
            if (!(entity instanceof Target) && checkCollision(mirrorPlayer, entity)) {
                takeDamage(entity);
            }
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

    // Strong pull towards center (keeps bot playing in center area)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distCenter = Math.sqrt(Math.pow(centerX - player.x, 2) + Math.pow(centerY - player.y, 2)) || 1;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
    const centerPull = 150 + (distCenter / maxDist) * 200; // Stronger pull when further from center
    forceX += ((centerX - player.x) / distCenter) * centerPull;
    forceY += ((centerY - player.y) / distCenter) * centerPull;

    // Wall repulsion (strong exponential push away from edges AND corners)
    const margin = 80;
    const wallPush = 1500;
    const cornerPush = 3000;
    const leftDist = Math.max(1, player.x);
    const rightDist = Math.max(1, canvas.width - player.x);
    const topDist = Math.max(1, player.y);
    const bottomDist = Math.max(1, canvas.height - player.y);

    if (leftDist < margin) forceX += Math.pow(margin / leftDist, 2) * wallPush;
    if (rightDist < margin) forceX -= Math.pow(margin / rightDist, 2) * wallPush;
    if (topDist < margin) forceY += Math.pow(margin / topDist, 2) * wallPush;
    if (bottomDist < margin) forceY -= Math.pow(margin / bottomDist, 2) * wallPush;

    // Extra corner avoidance — diagonal push if in corner zone
    const cornerMargin = 150;
    if (leftDist < cornerMargin && topDist < cornerMargin) {
        forceX += cornerPush; forceY += cornerPush;
    }
    if (rightDist < cornerMargin && topDist < cornerMargin) {
        forceX -= cornerPush; forceY += cornerPush;
    }
    if (leftDist < cornerMargin && bottomDist < cornerMargin) {
        forceX += cornerPush; forceY -= cornerPush;
    }
    if (rightDist < cornerMargin && bottomDist < cornerMargin) {
        forceX -= cornerPush; forceY -= cornerPush;
    }

    // Threat avoidance — Obstacles AND Projectiles
    let nearbyThreats = 0;
    entities.forEach(entity => {
        if (entity instanceof Obstacle || entity instanceof Projectile) {
            // Predictive evasion: look ahead based on velocity
            const lookAhead = 0.4 * levelSpec.reactFast;
            const predX = entity.x + (entity.vx || 0) * lookAhead;
            const predY = entity.y + (entity.vy || 0) * lookAhead;
            const dx = player.x - predX;
            const dy = player.y - predY;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;

            // Braver: smaller effective scan radius (bot allows closer proximity)
            const effectiveRadius = levelSpec.scanRadius * 0.7;
            if (dist < effectiveRadius) {
                nearbyThreats++;
                // Quadratic push instead of cubic (less overreaction)
                const pushPow = Math.pow(effectiveRadius / dist, 2);
                const pushStr = (entity instanceof Projectile) ? 600 : 400;
                forceX += (dx / dist) * pushPow * pushStr;
                forceY += (dy / dist) * pushPow * pushStr;
            }
        } else if (entity instanceof Laser && entity.phase === 'warning') {
            const dist = pointLineDistance(player.x, player.y, entity.x1, entity.y1, entity.x2, entity.y2);
            if (dist < levelSpec.scanRadius * 1.5) {
                nearbyThreats++;
                const ldx = entity.x2 - entity.x1;
                const ldy = entity.y2 - entity.y1;
                const len = Math.sqrt(ldx * ldx + ldy * ldy) || 1;
                const nx1 = -ldy / len;
                const ny1 = ldx / len;
                const nx2 = ldy / len;
                const ny2 = -ldx / len;
                const midX = (entity.x1 + entity.x2) / 2;
                const midY = (entity.y1 + entity.y2) / 2;
                const pDx = player.x - midX;
                const pDy = player.y - midY;
                let ex, ey;
                if (nx1 * pDx + ny1 * pDy > 0) { ex = nx1; ey = ny1; }
                else { ex = nx2; ey = ny2; }
                const pushPow = Math.pow(levelSpec.scanRadius * 1.5 / (dist || 1), 2);
                forceX += ex * pushPow * 1200;
                forceY += ey * pushPow * 1200;
            }
        }
    });

    // Slight panic randomness at low levels
    if (nearbyThreats > 3) {
        const panicScale = (6 - botLevel) * 60;
        forceX += (Math.random() - 0.5) * panicScale;
        forceY += (Math.random() - 0.5) * panicScale;
    }

    // Normalize force and calculate target velocity
    const maxSpeedBase = 900;
    const botSpeed = maxSpeedBase * levelSpec.speedBoost;
    const forceMag = Math.sqrt(forceX * forceX + forceY * forceY) || 1;
    const targetVx = (forceX / forceMag) * botSpeed;
    const targetVy = (forceY / forceMag) * botSpeed;

    // Smooth acceleration with lerp (not stiff, agile movement)
    const smoothing = 0.12 * levelSpec.reactFast; // Higher levels react faster
    botVx += (targetVx - botVx) * smoothing;
    botVy += (targetVy - botVy) * smoothing;

    mouse.x = player.x + botVx * dt;
    mouse.y = player.y + botVy * dt;

    player.update();
}

init();
