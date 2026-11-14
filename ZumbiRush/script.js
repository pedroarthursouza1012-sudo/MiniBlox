(() => {
    "use strict";

    /* =========================================================================
       1. CONSTANTES E INTEGRAÇÃO REAL COM LOCALSTORAGE DO MINIBLOX
    ========================================================================= */
    const STORAGE_KEYS = {
        MINIBLOX_STATUS: "situacao",
        MINIBLOX_CHAR: "personagem",
        MINIBLOX_USER_OPT: "usuario",
        ZR_DATA: "miniblox_zombierush_data_v1",
        ZR_AUDIO: "miniblox_zombierush_audio_v1"
    };

    const SKIN_COLORS = {
        pele1: "rgb(240, 177, 140)",
        pele2: "rgb(204, 110, 73)",
        pele3: "rgb(255, 157, 118)",
        pele4: "rgb(255, 203, 183)",
        pele5: "rgb(143, 78, 53)"
    };

    const HAIR_COLORS = {
        cabelo1: "rgb(139, 57, 57)",
        cabelo2: "rgb(255, 223, 45)",
        cabelo3: "rgb(255, 201, 101)",
        cabelo4: "rgb(37, 37, 37)",
        cabelo5: "rgb(191, 197, 202)"
    };

    const PANTS_COLORS = {
        azul: "rgb(51, 31, 99)",
        bege: "#d4b089",
        preta: "rgb(51, 48, 48)"
    };

    const ARENA_W = 960;
    const ARENA_H = 580;
    const MAX_CONCURRENT_ZOMBIES = 16;
    const MAX_HP_CAP = 350;
    const MAX_HP_PURCHASES = 10;
    const ULT_KILLS_REQUIRED = 15;
    const UPGRADE_DURATION = 5.0;

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function safeGetJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    function safeSetJSON(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch {
            /* Ignora erro de quota/modo privado */
        }
    }

    function loadMiniBloxCharacter() {
        const saved = safeGetJSON(STORAGE_KEYS.MINIBLOX_CHAR, null);
        return {
            hasSaved: Boolean(saved),
            cabelo: saved && saved.cabelo === "cabeloF" ? "cabeloF" : "cabeloM",
            corCabelo: saved && HAIR_COLORS[saved.corCabelo] ? saved.corCabelo : "cabelo1",
            pele: saved && SKIN_COLORS[saved.pele] ? saved.pele : "pele1",
            camisa: saved && typeof saved.camisa === "string" ? saved.camisa : "preta",
            calca: saved && PANTS_COLORS[saved.calca] ? saved.calca : "azul"
        };
    }

    function readOptionalMiniBloxUserName() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.MINIBLOX_USER_OPT);
            if (!raw) return "";
            if (raw.trim().startsWith("{")) {
                const parsed = JSON.parse(raw);
                const candidate = parsed.nome || parsed.name || parsed.usuario || "";
                return String(candidate).trim().slice(0, 16);
            }
            return raw.trim().slice(0, 16);
        } catch {
            return "";
        }
    }

    function loadZombieRushData() {
        const defaults = {
            lastPlayerName: "",
            record: {
                playerName: "",
                bestWave: 0,
                bestKills: 0,
                bestScore: 0,
                date: ""
            },
            leaderboard: []
        };
        const saved = safeGetJSON(STORAGE_KEYS.ZR_DATA, null);
        if (!saved) return defaults;

        const rec = saved.record && typeof saved.record === "object" ? saved.record : defaults.record;
        const board = Array.isArray(saved.leaderboard) ? saved.leaderboard : [];

        return {
            lastPlayerName: typeof saved.lastPlayerName === "string" ? saved.lastPlayerName.slice(0, 16) : "",
            record: {
                playerName: typeof rec.playerName === "string" ? rec.playerName : "",
                bestWave: Number.isFinite(rec.bestWave) ? rec.bestWave : 0,
                bestKills: Number.isFinite(rec.bestKills) ? rec.bestKills : 0,
                bestScore: Number.isFinite(rec.bestScore) ? rec.bestScore : 0,
                date: typeof rec.date === "string" ? rec.date : ""
            },
            leaderboard: board
                .filter(item => item && typeof item === "object" && typeof item.name === "string")
                .map(item => ({
                    name: String(item.name).slice(0, 16),
                    wave: Number.isFinite(item.wave) ? item.wave : 0,
                    kills: Number.isFinite(item.kills) ? item.kills : 0,
                    score: Number.isFinite(item.score) ? item.score : 0,
                    date: typeof item.date === "string" ? item.date : ""
                }))
        };
    }

    function loadAudioSettings() {
        const defaults = {
            musicEnabled: true,
            sfxEnabled: true,
            musicVolume: 0.45,
            sfxVolume: 0.75
        };
        const saved = safeGetJSON(STORAGE_KEYS.ZR_AUDIO, null);
        if (!saved) return defaults;

        return {
            musicEnabled: typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : defaults.musicEnabled,
            sfxEnabled: typeof saved.sfxEnabled === "boolean" ? saved.sfxEnabled : defaults.sfxEnabled,
            musicVolume: typeof saved.musicVolume === "number" ? clamp(saved.musicVolume, 0, 1) : defaults.musicVolume,
            sfxVolume: typeof saved.sfxVolume === "number" ? clamp(saved.sfxVolume, 0, 1) : defaults.sfxVolume
        };
    }

    /* =========================================================================
       2. CONSTRUTOR DO PERSONAGEM REAL DO MINIBLOX (DOM + CSS DO VESTIÁRIO)
    ========================================================================= */
    function buildMiniBloxCharacterElement(charConfig, options = {}) {
        const root = document.createElement("div");
        root.className = "personagem " + (charConfig.cabelo === "cabeloF" ? "feminino" : "masculino");
        if (options.previewScale) root.classList.add("preview-scale");

        root.style.setProperty("--pele", SKIN_COLORS[charConfig.pele] || SKIN_COLORS.pele1);
        root.style.setProperty("--cabelo", HAIR_COLORS[charConfig.corCabelo] || HAIR_COLORS.cabelo1);
        root.style.setProperty("--calca", PANTS_COLORS[charConfig.calca] || PANTS_COLORS.azul);
        root.style.setProperty("--camisa", `var(--${charConfig.camisa})`);

        root.innerHTML = `
            <div class="cabeca">
                <div class="cabelo"></div>
                <div class="cabelo-feminino">
                    <div class="mecha-esquerda"></div>
                    <div class="mecha-direita"></div>
                </div>
                <div class="olho-esquerdo"></div>
                <div class="olho-direito"></div>
            </div>
            <div class="corpo">
                <div class="braco-esquerdo"></div>
                <div class="braco-direito">
                    <div class="sword-pivot">
                        <div class="sword-sprite">
                            <div class="sword-blade"></div>
                            <div class="sword-guard"></div>
                            <div class="sword-handle"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="pernas">
                <div class="perna-esquerda"></div>
                <div class="perna-direita"></div>
            </div>
        `;

        return root;
    }

    /* =========================================================================
       3. SISTEMA DE ÁUDIO COMPLETO (WEB AUDIO API)
    ========================================================================= */
    class AudioEngine {
        constructor(settings) {
            this.settings = settings;
            this.ctx = null;
            this.musicGain = null;
            this.sfxGain = null;
            this.menuBus = null;
            this.battleBus = null;
            this.unlocked = false;
            this.currentTrack = null;
            this.timer = null;
            this.nextNote = 0;
            this.step = 0;
            this.cooldowns = {};
        }

        unlock() {
            if (!this.ctx) {
                const Ctx = window.AudioContext || window.webkitAudioContext;
                if (!Ctx) return;
                this.ctx = new Ctx();
                this.musicGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();
                this.menuBus = this.ctx.createGain();
                this.battleBus = this.ctx.createGain();

                this.menuBus.gain.value = 0;
                this.battleBus.gain.value = 0;

                this.menuBus.connect(this.musicGain);
                this.battleBus.connect(this.musicGain);
                this.musicGain.connect(this.ctx.destination);
                this.sfxGain.connect(this.ctx.destination);

                this.syncVolumes();
            }

            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }

            this.unlocked = true;
            if (this.currentTrack && this.settings.musicEnabled && !this.timer) {
                this.startLoop();
            }
        }

        syncVolumes() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const mTarget = this.settings.musicEnabled ? this.settings.musicVolume * 0.24 : 0;
            const sTarget = this.settings.sfxEnabled ? this.settings.sfxVolume * 0.65 : 0;
            this.musicGain.gain.setTargetAtTime(mTarget, now, 0.04);
            this.sfxGain.gain.setTargetAtTime(sTarget, now, 0.02);
        }

        updateSettings(partial) {
            Object.assign(this.settings, partial);
            safeSetJSON(STORAGE_KEYS.ZR_AUDIO, this.settings);
            this.syncVolumes();

            if (!this.settings.musicEnabled) {
                this.stopLoop();
            } else if (this.unlocked && this.currentTrack && !this.timer) {
                this.startLoop();
            }
        }

        setTrack(track) {
            if (this.currentTrack === track) return;
            this.currentTrack = track;
            this.step = 0;

            if (this.ctx) {
                const now = this.ctx.currentTime;
                this.menuBus.gain.setTargetAtTime(track === "menu" ? 1 : 0, now, 0.12);
                this.battleBus.gain.setTargetAtTime(track === "battle" ? 1 : 0, now, 0.12);
            }

            if (this.unlocked && this.settings.musicEnabled && !this.timer) {
                this.startLoop();
            }
        }

        startLoop() {
            if (!this.ctx || this.timer) return;
            this.nextNote = this.ctx.currentTime + 0.05;

            const tick = () => {
                if (!this.ctx || !this.settings.musicEnabled || !this.currentTrack) {
                    this.timer = null;
                    return;
                }
                const bpm = this.currentTrack === "menu" ? 112 : 136;
                const stepDur = 60 / bpm / 2;

                while (this.nextNote < this.ctx.currentTime + 0.18) {
                    this.playMusicStep(this.step, this.nextNote, stepDur);
                    this.nextNote += stepDur;
                    this.step = (this.step + 1) % 16;
                }
                this.timer = setTimeout(tick, 45);
            };
            tick();
        }

        stopLoop() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        playMusicStep(step, time, dur) {
            if (this.currentTrack === "menu") {
                const lead = [329.63, 0, 392.0, 440.0, 392.0, 0, 329.63, 293.66, 329.63, 0, 392.0, 493.88, 440.0, 392.0, 329.63, 0];
                const bass = [110, 0, 110, 0, 130.81, 0, 130.81, 0, 146.83, 0, 146.83, 0, 164.81, 0, 130.81, 0];
                if (lead[step]) this.note(lead[step], time, dur * 0.85, "triangle", 0.2, this.menuBus);
                if (bass[step]) this.note(bass[step], time, dur * 1.05, "sine", 0.26, this.menuBus);
            } else {
                const lead = [440, 0, 523.25, 493.88, 440, 0, 659.25, 587.33, 523.25, 0, 587.33, 659.25, 523.25, 493.88, 440, 0];
                const bass = [110, 110, 0, 110, 98, 98, 0, 98, 130.81, 130.81, 0, 130.81, 146.83, 0, 164.81, 0];
                if (lead[step]) this.note(lead[step], time, dur * 0.68, "square", 0.1, this.battleBus);
                if (bass[step]) this.note(bass[step], time, dur * 0.78, "triangle", 0.28, this.battleBus);
            }
        }

        note(freq, time, dur, type, vol, bus) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0.0001, time);
            g.gain.linearRampToValueAtTime(vol, time + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            osc.connect(g);
            g.connect(bus);
            osc.start(time);
            osc.stop(time + dur + 0.02);
        }

        ready(id, minMs = 45) {
            if (!this.settings.sfxEnabled) return false;
            this.unlock();
            if (!this.ctx || !this.sfxGain) return false;
            const now = performance.now();
            if (now - (this.cooldowns[id] || 0) < minMs) return false;
            this.cooldowns[id] = now;
            return true;
        }

        playClick() {
            if (!this.ready("click", 40)) return;
            const t = this.ctx.currentTime;
            this.tone(540, 760, 0.06, "triangle", 0.22, t);
        }

        playStep() {
            if (!this.ready("step", 240)) return;
            const t = this.ctx.currentTime;
            this.tone(135, 95, 0.04, "sine", 0.08, t);
        }

        playSlash() {
            if (!this.ready("slash", 90)) return;
            const t = this.ctx.currentTime;
            this.tone(580, 180, 0.11, "triangle", 0.28, t);
        }

        playSwordHit() {
            if (!this.ready("hit", 45)) return;
            const t = this.ctx.currentTime;
            this.tone(220, 75, 0.09, "square", 0.2, t);
        }

        playZombieDie() {
            if (!this.ready("zdie", 50)) return;
            const t = this.ctx.currentTime;
            this.tone(280, 90, 0.16, "sawtooth", 0.16, t);
        }

        playPlayerHurt() {
            if (!this.ready("hurt", 120)) return;
            const t = this.ctx.currentTime;
            this.tone(180, 65, 0.18, "sawtooth", 0.28, t);
        }

        playWaveStart() {
            if (!this.ready("wstart", 200)) return;
            const t = this.ctx.currentTime;
            [330, 440, 554.37].forEach((f, i) => this.tone(f, f * 1.03, 0.14, "triangle", 0.24, t + i * 0.08));
        }

        playWaveClear() {
            if (!this.ready("wclear", 200)) return;
            const t = this.ctx.currentTime;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f, 0.18, "triangle", 0.28, t + i * 0.075));
        }

        playBuy() {
            if (!this.ready("buy", 70)) return;
            const t = this.ctx.currentTime;
            this.tone(660, 990, 0.09, "triangle", 0.26, t);
            this.tone(990, 1320, 0.12, "triangle", 0.24, t + 0.06);
        }

        playUltimate() {
            if (!this.ready("ult", 250)) return;
            const t = this.ctx.currentTime;
            this.tone(220, 880, 0.24, "sawtooth", 0.24, t);
            this.tone(140, 55, 0.36, "triangle", 0.42, t + 0.05);
            this.tone(523.25, 1046.5, 0.3, "square", 0.14, t + 0.03);
        }

        playGameOver() {
            if (!this.ready("gameover", 250)) return;
            const t = this.ctx.currentTime;
            [392, 349.23, 311.13, 220].forEach((f, i) => this.tone(f, f * 0.94, 0.18, "sawtooth", 0.2, t + i * 0.12));
        }

        tone(fStart, fEnd, dur, type, vol, startTime) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(fStart, startTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), startTime + dur);
            g.gain.setValueAtTime(vol, startTime);
            g.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);
            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(startTime);
            osc.stop(startTime + dur + 0.02);
        }
    }

    /* =========================================================================
       4. CONFIGURAÇÃO DE WAVES E UPGRADES (EQUILIBRADO E COM LIMITES)
    ========================================================================= */
    const WAVE_COUNTS = [3, 6, 8, 10, 13, 15, 18, 20, 23, 26];

    function getWaveZombieCount(wave) {
        if (wave <= WAVE_COUNTS.length) return WAVE_COUNTS[wave - 1];
        return 26 + (wave - 10) * 3;
    }

    function pickZombieType(wave) {
        const roll = Math.random();
        if (wave === 1) return "classic";
        if (wave === 2) return roll < 0.35 ? "runner" : "classic";
        if (roll < 0.22) return "brute";
        if (roll < 0.52) return "runner";
        return "classic";
    }

    function createZombieStats(type, wave) {
        const w = wave - 1;
        if (type === "runner") {
            return {
                hp: Math.min(35 + w * 6, 120),
                speed: Math.min(96 + w * 5.2, 165),
                damage: Math.min(8 + Math.floor(w / 4), 15),
                radius: 20
            };
        }
        if (type === "brute") {
            return {
                hp: Math.min(90 + w * 14, 285),
                speed: Math.min(52 + w * 3.2, 102),
                damage: Math.min(15 + Math.floor(w / 3), 24),
                radius: 28
            };
        }
        return {
            hp: Math.min(50 + w * 8, 170),
            speed: Math.min(68 + w * 4.4, 132),
            damage: Math.min(10 + Math.floor(w / 3), 18),
            radius: 23
        };
    }

    function getAttackPrice(purchases) {
        return Math.round((50 + purchases * 20 + purchases * purchases * 2.5) / 5) * 5;
    }

    function getHealPrice(purchases) {
        return Math.round((25 + purchases * 12 + purchases * purchases * 1.5) / 5) * 5;
    }

    function getMaxHpPrice(purchases) {
        return Math.round((75 + purchases * 22 + purchases * purchases * 2) / 5) * 5;
    }

    /* =========================================================================
       5. DOM E ESTADO GLOBAL DO JOGO
    ========================================================================= */
    const charConfig = loadMiniBloxCharacter();
    const audioSettings = loadAudioSettings();
    const audio = new AudioEngine(audioSettings);
    let zrData = loadZombieRushData();

    const dom = {
        screens: {
            menu: document.getElementById("screen-menu"),
            register: document.getElementById("screen-register"),
            game: document.getElementById("screen-game"),
            ranking: document.getElementById("screen-ranking")
        },
        toggleMusicBtn: document.getElementById("toggle-music-btn"),
        toggleSfxBtn: document.getElementById("toggle-sfx-btn"),
        volumePopoverBtn: document.getElementById("volume-popover-btn"),
        volumePopover: document.getElementById("volume-popover"),
        musicSlider: document.getElementById("music-volume-slider"),
        sfxSlider: document.getElementById("sfx-volume-slider"),
        musicVolLabel: document.getElementById("music-volume-label"),
        sfxVolLabel: document.getElementById("sfx-volume-label"),

        menuRecordWaves: document.getElementById("menu-record-waves"),
        menuRecordDetails: document.getElementById("menu-record-details"),
        menuVestiarioStatus: document.getElementById("menu-vestiario-status"),
        menuAvatarStage: document.getElementById("menu-avatar-stage"),
        btnGoRegister: document.getElementById("btn-go-register"),
        btnOpenHowto: document.getElementById("btn-open-howto"),
        btnOpenRanking: document.getElementById("btn-open-ranking"),

        registerForm: document.getElementById("register-form"),
        registerAvatarStage: document.getElementById("register-avatar-stage"),
        registerPreviewName: document.getElementById("register-preview-name"),
        playerNameInput: document.getElementById("player-name-input"),
        registerError: document.getElementById("register-error"),
        btnRegisterBack: document.getElementById("btn-register-back"),

        hudPlayerName: document.getElementById("hud-player-name"),
        hudHpText: document.getElementById("hud-hp-text"),
        hudHpFill: document.getElementById("hud-hp-fill"),
        hudWave: document.getElementById("hud-wave"),
        hudRemaining: document.getElementById("hud-remaining"),
        hudKills: document.getElementById("hud-kills"),
        hudCoins: document.getElementById("hud-coins"),
        hudRecordBadge: document.getElementById("hud-record-badge"),
        hudUltWrap: document.getElementById("hud-ult-wrap"),
        hudUltText: document.getElementById("hud-ult-text"),
        hudUltFill: document.getElementById("hud-ult-fill"),

        arenaViewport: document.getElementById("arena-viewport"),
        arenaWorld: document.getElementById("arena-world"),
        entitiesLayer: document.getElementById("entities-layer"),
        fxCanvas: document.getElementById("fx-canvas"),
        waveToast: document.getElementById("wave-toast"),

        overlayUpgrade: document.getElementById("overlay-upgrade"),
        upgradeWaveBadge: document.getElementById("upgrade-wave-badge"),
        upgradeTimerText: document.getElementById("upgrade-timer-text"),
        upgradeTimerBar: document.getElementById("upgrade-timer-bar"),
        upgradeCoinsText: document.getElementById("upgrade-coins-text"),
        upAtkDesc: document.getElementById("up-atk-desc"),
        upHealDesc: document.getElementById("up-heal-desc"),
        upMaxHpDesc: document.getElementById("up-maxhp-desc"),
        btnBuyAtk: document.getElementById("btn-buy-atk"),
        btnBuyHeal: document.getElementById("btn-buy-heal"),
        btnBuyMaxHp: document.getElementById("btn-buy-maxhp"),
        upgradeFeedback: document.getElementById("upgrade-feedback"),
        btnSkipUpgrade: document.getElementById("btn-skip-upgrade"),

        overlayGameover: document.getElementById("overlay-gameover"),
        goPlayerLine: document.getElementById("go-player-line"),
        goNewRecord: document.getElementById("go-new-record"),
        goWave: document.getElementById("go-wave"),
        goKills: document.getElementById("go-kills"),
        goCoins: document.getElementById("go-coins"),
        goRecord: document.getElementById("go-record"),
        btnRetry: document.getElementById("btn-retry"),
        btnGoRanking: document.getElementById("btn-go-ranking"),
        btnGoMenu: document.getElementById("btn-go-menu"),

        rankingTbody: document.getElementById("ranking-tbody"),
        btnRankingBack: document.getElementById("btn-ranking-back"),
        btnRankingPlay: document.getElementById("btn-ranking-play"),

        modalHowto: document.getElementById("modal-howto"),
        btnCloseHowto: document.getElementById("btn-close-howto"),
        btnHowtoOk: document.getElementById("btn-howto-ok")
    };

    const fxCtx = dom.fxCanvas.getContext("2d");

    const state = {
        screen: "MENU",
        phase: "IDLE", // IDLE | PLAYING | UPGRADE | GAMEOVER
        playerName: "Jogador",

        // Entidade jogador
        player: {
            x: ARENA_W / 2,
            y: ARENA_H / 2,
            radius: 22,
            speed: 230,
            facing: 1,
            aimAngle: 0,
            hp: 100,
            maxHp: 100,
            damage: 25,
            invulnTimer: 0,
            el: null,
            flipEl: null,
            swordPivotEl: null
        },

        // Ataque e Ultimate
        attackCooldown: 0,
        swingSeq: 0,
        activeSwing: null, // { id, aimAngle, elapsed, duration }
        ultProgress: 0,
        ultCharges: 0,
        ultWaves: [], // { x, y, vx, vy, angle, dist, maxDist, damage, hitIds }

        // Economia e Upgrades
        coins: 0,
        totalCoinsEarned: 0,
        totalKills: 0,
        score: 0,
        atkBuys: 0,
        healBuys: 0,
        maxHpBuys: 0,
        upgradeTimer: 0,

        // Waves e Zumbis
        wave: 1,
        waveTotal: 3,
        waveSpawned: 0,
        waveKills: 0,
        spawnTimer: 0,
        toastTimer: 0,
        zombies: [],
        nextZombieId: 1,

        // FX Canvas
        slashEffects: [],
        particles: [],
        floatingTexts: [],

        // Controles
        keysDown: new Set(),
        mouseX: ARENA_W * 0.65,
        mouseY: ARENA_H * 0.5,

        // Loop único
        rafId: null,
        lastTime: 0
    };

    /* =========================================================================
       6. MENU, PREVIEW E RANKING LOCAL
    ========================================================================= */
    function renderStaticPreviews() {
        dom.menuAvatarStage.innerHTML = "";
        dom.menuAvatarStage.appendChild(buildMiniBloxCharacterElement(charConfig, { previewScale: true }));

        dom.registerAvatarStage.innerHTML = "";
        dom.registerAvatarStage.appendChild(buildMiniBloxCharacterElement(charConfig, { previewScale: true }));

        dom.menuVestiarioStatus.textContent = charConfig.hasSaved ? "Vestiário Salvo ✅" : "Visual Padrão";
    }

    function renderRecordDisplays() {
        const rec = zrData.record;
        dom.menuRecordWaves.textContent = `RECORDE: ${rec.bestWave} ${rec.bestWave === 1 ? "WAVE" : "WAVES"}`;
        if (rec.bestWave > 0) {
            dom.menuRecordDetails.textContent = `${rec.playerName} • ${rec.bestKills} zumbis • ${rec.bestScore} pts`;
        } else {
            dom.menuRecordDetails.textContent = "Nenhuma partida registrada ainda";
        }
        dom.hudRecordBadge.textContent = `REC: ${rec.bestWave} W`;
    }

    function renderRankingTable() {
        const rows = zrData.leaderboard;
        dom.rankingTbody.innerHTML = "";

        if (!rows.length) {
            const tr = document.createElement("tr");
            tr.innerHTML = `<td colspan="6" style="text-align:center;font-weight:700;padding:1.4rem;">Nenhuma partida salva ainda. Seja o primeiro a entrar no ranking!</td>`;
            dom.rankingTbody.appendChild(tr);
            return;
        }

        rows.forEach((entry, idx) => {
            const tr = document.createElement("tr");
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}º`;
            const dateStr = entry.date ? new Date(entry.date).toLocaleDateString("pt-BR") : "—";
            tr.innerHTML = `
                <td><strong>${medal}</strong></td>
                <td><strong>${escapeHtml(entry.name)}</strong></td>
                <td><strong>${entry.wave}</strong></td>
                <td>${entry.kills}</td>
                <td>${entry.score} pts</td>
                <td>${dateStr}</td>
            `;
            dom.rankingTbody.appendChild(tr);
        });
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function syncAudioUi() {
        dom.toggleMusicBtn.textContent = audioSettings.musicEnabled ? "🎵 Música: ON" : "🎵 Música: OFF";
        dom.toggleMusicBtn.classList.toggle("is-muted", !audioSettings.musicEnabled);
        dom.toggleMusicBtn.setAttribute("aria-pressed", String(audioSettings.musicEnabled));

        dom.toggleSfxBtn.textContent = audioSettings.sfxEnabled ? "🔊 Efeitos: ON" : "🔇 Efeitos: OFF";
        dom.toggleSfxBtn.classList.toggle("is-muted", !audioSettings.sfxEnabled);
        dom.toggleSfxBtn.setAttribute("aria-pressed", String(audioSettings.sfxEnabled));

        const mPct = Math.round(audioSettings.musicVolume * 100);
        const sPct = Math.round(audioSettings.sfxVolume * 100);
        dom.musicSlider.value = String(mPct);
        dom.sfxSlider.value = String(sPct);
        dom.musicVolLabel.textContent = `${mPct}%`;
        dom.sfxVolLabel.textContent = `${sPct}%`;
    }

    function showScreen(key) {
        Object.entries(dom.screens).forEach(([k, el]) => {
            el.classList.toggle("active", k === key);
        });
        state.screen = key.toUpperCase();
        state.keysDown.clear();

        if (key === "menu") {
            state.phase = "IDLE";
            audio.setTrack("menu");
            renderRecordDisplays();
        } else if (key === "register") {
            state.phase = "IDLE";
            audio.setTrack("menu");
            dom.registerError.classList.add("hidden");

            if (!dom.playerNameInput.value) {
                const fromMiniBlox = readOptionalMiniBloxUserName();
                const initial = fromMiniBlox || zrData.lastPlayerName || "";
                dom.playerNameInput.value = initial;
            }
            dom.registerPreviewName.textContent = dom.playerNameInput.value.trim() || "Sobrevivente";
        } else if (key === "game") {
            audio.setTrack("battle");
            fitArenaScale();
        } else if (key === "ranking") {
            state.phase = "IDLE";
            audio.setTrack("menu");
            renderRankingTable();
        }
    }

    function fitArenaScale() {
        const rect = dom.arenaViewport.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        const scale = Math.min(rect.width / ARENA_W, rect.height / ARENA_H);
        dom.arenaWorld.style.transform = `scale(${scale})`;
    }

    /* =========================================================================
       7. PARTIDA, PLAYER, SPAWN E COMBATE
    ========================================================================= */
    function resetAndStartMatch(playerName) {
        state.playerName = playerName;
        zrData.lastPlayerName = playerName;
        safeSetJSON(STORAGE_KEYS.ZR_DATA, zrData);

        dom.entitiesLayer.innerHTML = "";
        dom.overlayUpgrade.classList.add("hidden");
        dom.overlayGameover.classList.add("hidden");
        fxCtx.clearRect(0, 0, ARENA_W, ARENA_H);

        // Cria entidade do jogador com modelo real do Vestiário
        const pWrap = document.createElement("div");
        pWrap.className = "player-entity";

        const pShadow = document.createElement("div");
        pShadow.className = "player-shadow";
        const pFlip = document.createElement("div");
        pFlip.className = "player-flip";

        const charEl = buildMiniBloxCharacterElement(charConfig, { previewScale: false });
        pFlip.appendChild(charEl);
        pWrap.appendChild(pShadow);
        pWrap.appendChild(pFlip);
        dom.entitiesLayer.appendChild(pWrap);

        state.player = {
            x: ARENA_W / 2,
            y: ARENA_H / 2,
            radius: 22,
            speed: 230,
            facing: 1,
            aimAngle: 0,
            hp: 100,
            maxHp: 100,
            damage: 25,
            invulnTimer: 0,
            el: pWrap,
            flipEl: pFlip,
            swordPivotEl: charEl.querySelector(".sword-pivot")
        };

        state.attackCooldown = 0;
        state.activeSwing = null;
        state.ultProgress = 0;
        state.ultCharges = 0;
        state.ultWaves = [];

        state.coins = 0;
        state.totalCoinsEarned = 0;
        state.totalKills = 0;
        state.score = 0;
        state.atkBuys = 0;
        state.healBuys = 0;
        state.maxHpBuys = 0;

        state.zombies = [];
        state.slashEffects = [];
        state.particles = [];
        state.floatingTexts = [];
        state.keysDown.clear();

        dom.hudPlayerName.textContent = playerName;
        renderRecordDisplays();

        showScreen("game");
        startWave(1);
    }

    function startWave(waveNumber) {
        state.wave = waveNumber;
        state.waveTotal = getWaveZombieCount(waveNumber);
        state.waveSpawned = 0;
        state.waveKills = 0;
        state.spawnTimer = 0.25;
        state.phase = "PLAYING";

        dom.overlayUpgrade.classList.add("hidden");
        dom.waveToast.textContent = `WAVE ${waveNumber} — ${state.waveTotal} ZUMBIS!`;
        dom.waveToast.classList.remove("hidden");
        state.toastTimer = 1.6;

        audio.playWaveStart();
        updateHud();
    }

    function spawnZombie() {
        const type = pickZombieType(state.wave);
        const cfg = createZombieStats(type, state.wave);

        // Nasce nas 4 bordas da arena
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        if (edge === 0) { x = Math.random() * ARENA_W; y = -28; }
        else if (edge === 1) { x = ARENA_W + 28; y = Math.random() * ARENA_H; }
        else if (edge === 2) { x = Math.random() * ARENA_W; y = ARENA_H + 28; }
        else { x = -28; y = Math.random() * ARENA_H; }

        const el = document.createElement("div");
        el.className = `zombie-entity type-${type} is-walking`;
        el.innerHTML = `
            <div class="zombie-shadow"></div>
            <div class="zombie-hp-mini"><div class="zombie-hp-mini-fill" style="width:100%"></div></div>
            <div class="zombie-body-rig">
                <div class="zombie-head">
                    <div class="zombie-hair"></div>
                    <div class="zombie-eyes"></div>
                    <div class="zombie-mouth"></div>
                </div>
                <div class="zombie-torso">
                    <div class="zombie-arm zombie-arm-l"></div>
                    <div class="zombie-arm zombie-arm-r"></div>
                </div>
                <div class="zombie-legs">
                    <div class="zombie-leg"></div>
                    <div class="zombie-leg"></div>
                </div>
            </div>
        `;
        dom.entitiesLayer.appendChild(el);

        state.zombies.push({
            id: state.nextZombieId++,
            type,
            x,
            y,
            vxKnock: 0,
            vyKnock: 0,
            hp: cfg.hp,
            maxHp: cfg.hp,
            speed: cfg.speed,
            damage: cfg.damage,
            radius: cfg.radius,
            alive: true,
            lastHitSwingId: -1,
            hitFlashTimer: 0,
            attackAnimTimer: 0,
            enteredArena: false,
            el,
            rigEl: el.querySelector(".zombie-body-rig"),
            hpBarWrap: el.querySelector(".zombie-hp-mini"),
            hpBarFill: el.querySelector(".zombie-hp-mini-fill")
        });

        state.waveSpawned++;
    }

    function triggerSwordAttack() {
        if (state.screen !== "GAME" || state.phase !== "PLAYING") return;
        if (state.attackCooldown > 0) return;

        const p = state.player;
        const aimAngle = Math.atan2(state.mouseY - p.y, state.mouseX - p.x);
        p.aimAngle = aimAngle;
        p.facing = Math.cos(aimAngle) >= 0 ? 1 : -1;

        state.attackCooldown = 0.34;
        state.activeSwing = {
            id: ++state.swingSeq,
            aimAngle,
            elapsed: 0,
            duration: 0.22
        };

        state.slashEffects.push({
            x: p.x,
            y: p.y - 12,
            angle: aimAngle,
            radius: 102,
            life: 0.19,
            maxLife: 0.19
        });

        audio.playSlash();
    }

    function triggerUltimate() {
        if (state.screen !== "GAME" || state.phase !== "PLAYING") return;
        if (state.ultCharges <= 0) return;

        state.ultCharges -= 1;
        state.ultProgress = 0;

        const p = state.player;
        const aimAngle = Math.atan2(state.mouseY - p.y, state.mouseX - p.x);
        p.aimAngle = aimAngle;
        p.facing = Math.cos(aimAngle) >= 0 ? 1 : -1;

        // Onda poderosa atravessa toda a arena na direção do cursor
        const speed = 860;
        state.ultWaves.push({
            x: p.x + Math.cos(aimAngle) * 28,
            y: p.y - 10 + Math.sin(aimAngle) * 28,
            vx: Math.cos(aimAngle) * speed,
            vy: Math.sin(aimAngle) * speed,
            angle: aimAngle,
            radius: 82,
            dist: 0,
            maxDist: 1180,
            damage: Math.max(130, Math.round(p.damage * 4.5)),
            hitIds: new Set()
        });

        p.el.classList.add("is-ulting");
        setTimeout(() => {
            if (state.player.el) state.player.el.classList.remove("is-ulting");
        }, 320);

        // Partículas iniciais da ultimate
        spawnParticles(p.x, p.y - 12, 22, ["#75e3ff", "#ffcf40", "#ffffff", "#c054ff"], 320);
        triggerArenaShake();
        audio.playUltimate();
        updateHud();
    }

    function damageZombie(zombie, amount, knockX, knockY, isUlt = false) {
        if (!zombie.alive) return;

        zombie.hp -= amount;
        zombie.hitFlashTimer = 0.12;
        zombie.el.classList.add("is-hit");
        zombie.vxKnock += knockX;
        zombie.vyKnock += knockY;

        const pct = clamp((zombie.hp / zombie.maxHp) * 100, 0, 100);
        zombie.hpBarWrap.classList.add("visible");
        zombie.hpBarFill.style.width = `${pct}%`;

        spawnParticles(zombie.x, zombie.y - 16, isUlt ? 10 : 6, isUlt ? ["#75e3ff", "#ffcf40", "#8cf06c"] : ["#8cf06c", "#ffcf40", "#ffffff"], 210);
        spawnFloatingText(zombie.x, zombie.y - 44, `-${amount}`, "#ffffff", isUlt ? "#2c88e0" : "#ff4d4d");

        if (zombie.hp <= 0) {
            killZombie(zombie);
        }
    }

    function killZombie(zombie) {
        if (!zombie.alive) return;
        zombie.alive = false;

        // Recompensas contabilizadas exatamente uma vez
        state.coins += 10;
        state.totalCoinsEarned += 10;
        state.totalKills += 1;
        state.waveKills += 1;
        state.score += 100 + (state.wave - 1) * 15;

        if (state.ultCharges === 0) {
            state.ultProgress = Math.min(ULT_KILLS_REQUIRED, state.ultProgress + 1);
            if (state.ultProgress >= ULT_KILLS_REQUIRED) {
                state.ultCharges = 1;
            }
        }

        spawnFloatingText(zombie.x, zombie.y - 62, "+10 💰", "#000000", "#ffcf40");
        spawnParticles(zombie.x, zombie.y - 14, 12, ["#7cd964", "#ffcf40", "#4b5563"], 240);
        audio.playZombieDie();

        // Animação rápida de morte e remoção limpa do DOM
        const el = zombie.el;
        el.classList.remove("is-walking");
        el.classList.add("is-dying");
        el.style.transform = `translate3d(${zombie.x}px, ${zombie.y}px, 0) scale(0.75) rotate(${Math.random() > 0.5 ? 25 : -25}deg)`;
        setTimeout(() => {
            if (el.parentNode) el.parentNode.removeChild(el);
        }, 260);

        updateHud();
    }

    function damagePlayer(amount, sourceX, sourceY) {
        const p = state.player;
        if (p.invulnTimer > 0 || state.phase !== "PLAYING") return;

        p.hp = Math.max(0, p.hp - amount);
        p.invulnTimer = 0.75;
        p.el.classList.add("is-invuln");

        // Pequeno empurrão para afastar do zumbi
        const angle = Math.atan2(p.y - sourceY, p.x - sourceX);
        p.x = clamp(p.x + Math.cos(angle) * 18, 28, ARENA_W - 28);
        p.y = clamp(p.y + Math.sin(angle) * 18, 52, ARENA_H - 22);

        spawnFloatingText(p.x, p.y - 54, `-${amount} HP`, "#ffffff", "#e02424");
        triggerArenaShake();
        audio.playPlayerHurt();
        updateHud();

        if (p.hp <= 0) {
            triggerGameOver();
        }
    }

    function triggerArenaShake() {
        dom.arenaViewport.classList.remove("shake");
        void dom.arenaViewport.offsetWidth;
        dom.arenaViewport.classList.add("shake");
    }

    /* =========================================================================
       8. FASE DE UPGRADES (5 SEGUNDOS + SKIP) E GAME OVER
    ========================================================================= */
    function enterUpgradePhase() {
        state.phase = "UPGRADE";
        state.upgradeTimer = UPGRADE_DURATION;
        state.keysDown.clear();
        state.activeSwing = null;
        state.ultWaves = [];

        audio.playWaveClear();

        dom.upgradeWaveBadge.textContent = `WAVE ${state.wave} CONCLUÍDA! 🎉`;
        dom.upgradeFeedback.textContent = "Escolha suas melhorias antes que o tempo acabe!";
        refreshUpgradeModal();
        dom.overlayUpgrade.classList.remove("hidden");
    }

    function refreshUpgradeModal() {
        const p = state.player;
        const atkPrice = getAttackPrice(state.atkBuys);
        const healPrice = getHealPrice(state.healBuys);
        const maxHpPrice = getMaxHpPrice(state.maxHpBuys);

        dom.upgradeCoinsText.textContent = String(state.coins);
        dom.upgradeTimerText.textContent = `${Math.max(0, state.upgradeTimer).toFixed(1)}s`;
        dom.upgradeTimerBar.style.width = `${clamp((state.upgradeTimer / UPGRADE_DURATION) * 100, 0, 100)}%`;

        dom.upAtkDesc.textContent = `Dano atual: ${p.damage} → ${p.damage + 8} (+8 de dano na espada)`;
        dom.btnBuyAtk.textContent = `COMPRAR • 💰 ${atkPrice}`;
        dom.btnBuyAtk.disabled = state.coins < atkPrice;

        const isFullHp = p.hp >= p.maxHp;
        dom.upHealDesc.textContent = isFullHp
            ? `Sua vida já está cheia (${p.hp}/${p.maxHp} HP)`
            : `Recupera +40 HP (${p.hp} → ${Math.min(p.maxHp, p.hp + 40)} HP)`;
        dom.btnBuyHeal.textContent = isFullHp ? "VIDA CHEIA ✅" : `COMPRAR • 💰 ${healPrice}`;
        dom.btnBuyHeal.disabled = isFullHp || state.coins < healPrice;

        const atMaxCap = state.maxHpBuys >= MAX_HP_PURCHASES || p.maxHp >= MAX_HP_CAP;
        dom.upMaxHpDesc.textContent = atMaxCap
            ? `Limite máximo atingido (${MAX_HP_CAP} HP)!`
            : `Máximo: ${p.maxHp} → ${Math.min(MAX_HP_CAP, p.maxHp + 25)} HP (+15 HP atual)`;
        dom.btnBuyMaxHp.textContent = atMaxCap ? `MÁXIMO (${MAX_HP_CAP} HP)` : `COMPRAR • 💰 ${maxHpPrice}`;
        dom.btnBuyMaxHp.disabled = atMaxCap || state.coins < maxHpPrice;
    }

    function buyUpgrade(type) {
        if (state.phase !== "UPGRADE") return;
        const p = state.player;

        if (type === "atk") {
            const price = getAttackPrice(state.atkBuys);
            if (state.coins < price) return;
            state.coins -= price;
            state.atkBuys += 1;
            p.damage += 8;
            dom.upgradeFeedback.textContent = `Espada fortalecida! Novo dano: ${p.damage}`;
        } else if (type === "heal") {
            const price = getHealPrice(state.healBuys);
            if (state.coins < price || p.hp >= p.maxHp) return;
            state.coins -= price;
            state.healBuys += 1;
            p.hp = Math.min(p.maxHp, p.hp + 40);
            dom.upgradeFeedback.textContent = `Vida recuperada! (${p.hp}/${p.maxHp} HP)`;
        } else if (type === "maxhp") {
            const price = getMaxHpPrice(state.maxHpBuys);
            if (state.coins < price || state.maxHpBuys >= MAX_HP_PURCHASES || p.maxHp >= MAX_HP_CAP) return;
            state.coins -= price;
            state.maxHpBuys += 1;
            p.maxHp = Math.min(MAX_HP_CAP, p.maxHp + 25);
            p.hp = Math.min(p.maxHp, p.hp + 15);
            dom.upgradeFeedback.textContent = `Vida máxima aumentada para ${p.maxHp} HP!`;
        }

        audio.playBuy();
        updateHud();
        refreshUpgradeModal();
    }

    function finishUpgradePhase() {
        if (state.phase !== "UPGRADE") return;
        startWave(state.wave + 1);
    }

    function triggerGameOver() {
        state.phase = "GAMEOVER";
        state.keysDown.clear();
        state.activeSwing = null;
        state.ultWaves = [];

        // Limpa zumbis ativos sem conceder recompensas
        state.zombies.forEach(z => {
            z.alive = false;
            if (z.el && z.el.parentNode) z.el.parentNode.removeChild(z.el);
        });
        state.zombies = [];

        audio.playGameOver();

        const wavesCompleted = Math.max(0, state.wave - 1);
        const nowIso = new Date().toISOString();

        // Verifica se superou o recorde salvo (critério: maior wave, depois abates)
        const prev = zrData.record;
        const beatRecord =
            state.wave > prev.bestWave ||
            (state.wave === prev.bestWave && state.totalKills > prev.bestKills) ||
            (state.wave === prev.bestWave && state.totalKills === prev.bestKills && state.score > prev.bestScore);

        if (beatRecord) {
            zrData.record = {
                playerName: state.playerName,
                bestWave: state.wave,
                bestKills: state.totalKills,
                bestScore: state.score,
                date: nowIso
            };
        }

        // Adiciona no ranking próprio do Zombie Rush e mantém os 10 melhores
        zrData.leaderboard.push({
            name: state.playerName,
            wave: state.wave,
            kills: state.totalKills,
            score: state.score,
            date: nowIso
        });

        zrData.leaderboard.sort((a, b) => {
            if (b.wave !== a.wave) return b.wave - a.wave;
            if (b.kills !== a.kills) return b.kills - a.kills;
            return b.score - a.score;
        });
        zrData.leaderboard = zrData.leaderboard.slice(0, 10);

        safeSetJSON(STORAGE_KEYS.ZR_DATA, zrData);
        renderRecordDisplays();

        dom.goPlayerLine.textContent = `Sobrevivente: ${state.playerName} (${wavesCompleted} ${wavesCompleted === 1 ? "wave concluída" : "waves concluídas"})`;
        dom.goNewRecord.classList.toggle("hidden", !beatRecord);
        dom.goWave.textContent = `Wave ${state.wave}`;
        dom.goKills.textContent = String(state.totalKills);
        dom.goCoins.textContent = `${state.totalCoinsEarned} 💰`;
        dom.goRecord.textContent = `${zrData.record.bestWave} ${zrData.record.bestWave === 1 ? "Wave" : "Waves"}`;

        dom.overlayGameover.classList.remove("hidden");
    }

    /* =========================================================================
       9. HUD E PARTICLES
    ========================================================================= */
    function updateHud() {
        const p = state.player;
        const hpPct = clamp((p.hp / p.maxHp) * 100, 0, 100);

        dom.hudHpText.textContent = `${p.hp} / ${p.maxHp} HP`;
        dom.hudHpFill.style.width = `${hpPct}%`;
        dom.hudHpFill.classList.toggle("is-low", hpPct <= 25);
        dom.hudHpFill.classList.toggle("is-medium", hpPct > 25 && hpPct <= 55);

        dom.hudWave.textContent = String(state.wave);
        dom.hudRemaining.textContent = String(Math.max(0, state.waveTotal - state.waveKills));
        dom.hudKills.textContent = String(state.totalKills);
        dom.hudCoins.textContent = String(state.coins);

        const isUltReady = state.ultCharges > 0;
        dom.hudUltWrap.classList.toggle("is-ready", isUltReady);
        if (isUltReady) {
            dom.hudUltText.textContent = `PRONTA! (${state.ultCharges}x)`;
            dom.hudUltFill.style.width = "100%";
        } else {
            dom.hudUltText.textContent = `${state.ultProgress} / ${ULT_KILLS_REQUIRED}`;
            dom.hudUltFill.style.width = `${(state.ultProgress / ULT_KILLS_REQUIRED) * 100}%`;
        }
    }

    function spawnParticles(x, y, count, palette, maxSpeed) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * TWO_PI;
            const speed = 50 + Math.random() * maxSpeed;
            state.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 4 + Math.random() * 5,
                life: 0.32 + Math.random() * 0.25,
                maxLife: 0.57,
                color: palette[i % palette.length]
            });
        }
    }

    function spawnFloatingText(x, y, text, color, bg) {
        state.floatingTexts.push({
            x,
            y,
            text,
            color,
            bg,
            life: 0.72,
            maxLife: 0.72
        });
    }

    /* =========================================================================
       10. UPDATE E RENDERIZAÇÃO DO LOOP PRINCIPAL (REQUESTANIMATIONFRAME)
    ========================================================================= */
    const TWO_PI = Math.PI * 2;

    function shortestAngleDiff(a, b) {
        let diff = (a - b + Math.PI) % TWO_PI;
        if (diff < 0) diff += TWO_PI;
        return Math.abs(diff - Math.PI);
    }

    function updateGame(dt) {
        if (state.screen !== "GAME") return;

        if (state.toastTimer > 0) {
            state.toastTimer -= dt;
            if (state.toastTimer <= 0) {
                dom.waveToast.classList.add("hidden");
            }
        }

        // Atualiza partículas mesmo durante upgrade/gameover para transição limpa
        for (let i = state.particles.length - 1; i >= 0; i--) {
            const pt = state.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vx *= 0.92;
            pt.vy *= 0.92;
            pt.life -= dt;
            if (pt.life <= 0) state.particles.splice(i, 1);
        }

        for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
            const ft = state.floatingTexts[i];
            ft.y -= 36 * dt;
            ft.life -= dt;
            if (ft.life <= 0) state.floatingTexts.splice(i, 1);
        }

        for (let i = state.slashEffects.length - 1; i >= 0; i--) {
            state.slashEffects[i].life -= dt;
            if (state.slashEffects[i].life <= 0) state.slashEffects.splice(i, 1);
        }

        if (state.phase === "UPGRADE") {
            state.upgradeTimer -= dt;
            dom.upgradeTimerText.textContent = `${Math.max(0, state.upgradeTimer).toFixed(1)}s`;
            dom.upgradeTimerBar.style.width = `${clamp((state.upgradeTimer / UPGRADE_DURATION) * 100, 0, 100)}%`;
            if (state.upgradeTimer <= 0) {
                finishUpgradePhase();
            }
            return;
        }

        if (state.phase !== "PLAYING") return;

        const p = state.player;

        // 1. Movimentação WASD normalizada
        let dx = 0;
        let dy = 0;
        if (state.keysDown.has("w")) dy -= 1;
        if (state.keysDown.has("s")) dy += 1;
        if (state.keysDown.has("a")) dx -= 1;
        if (state.keysDown.has("d")) dx += 1;

        const moving = dx !== 0 || dy !== 0;
        if (moving) {
            if (dx !== 0 && dy !== 0) {
                dx *= Math.SQRT1_2;
                dy *= Math.SQRT1_2;
            }
            p.x = clamp(p.x + dx * p.speed * dt, 26, ARENA_W - 26);
            p.y = clamp(p.y + dy * p.speed * dt, 52, ARENA_H - 22);
            if (!state.activeSwing && dx !== 0) {
                p.facing = dx > 0 ? 1 : -1;
            }
            audio.playStep();
        }
        p.el.classList.toggle("is-walking", moving);

        // 2. Invulnerabilidade
        if (p.invulnTimer > 0) {
            p.invulnTimer -= dt;
            if (p.invulnTimer <= 0) {
                p.invulnTimer = 0;
                p.el.classList.remove("is-invuln");
            }
        }

        // 3. Recarga, animação de slash da espada e colisão angular
        if (state.attackCooldown > 0) {
            state.attackCooldown = Math.max(0, state.attackCooldown - dt);
        }

        let swordVisualDeg = -28;
        if (state.activeSwing) {
            const sw = state.activeSwing;
            sw.elapsed += dt;
            const prog = clamp(sw.elapsed / sw.duration, 0, 1);

            // Arco visível da espada ligada à mão
            if (prog < 0.2) {
                const t = prog / 0.2;
                swordVisualDeg = -28 - t * 48; // preparação
            } else if (prog < 0.72) {
                const t = (prog - 0.2) / 0.52;
                swordVisualDeg = -76 + t * 175; // golpe amplo de corte
            } else {
                const t = (prog - 0.72) / 0.28;
                swordVisualDeg = 99 - t * 127; // retorno suave
            }

            // Janela de impacto: 1 golpe atinge cada zumbi apenas 1 vez
            if (prog >= 0.16 && prog <= 0.78) {
                const slashRange = 108;
                const halfArc = 1.26; // ~72 graus para cada lado
                let hitSomething = false;

                for (let i = state.zombies.length - 1; i >= 0; i--) {
                    const z = state.zombies[i];
                    if (!z.alive || z.lastHitSwingId === sw.id) continue;

                    const zdx = z.x - p.x;
                    const zdy = z.y - p.y;
                    const dist = Math.hypot(zdx, zdy);

                    if (dist <= slashRange + z.radius) {
                        const angleToZ = Math.atan2(zdy, zdx);
                        if (shortestAngleDiff(angleToZ, sw.aimAngle) <= halfArc) {
                            z.lastHitSwingId = sw.id;
                            const knockForce = 240;
                            const nx = dist > 0.01 ? zdx / dist : Math.cos(sw.aimAngle);
                            const ny = dist > 0.01 ? zdy / dist : Math.sin(sw.aimAngle);
                            damageZombie(z, p.damage, nx * knockForce, ny * knockForce, false);
                            hitSomething = true;
                        }
                    }
                }

                if (hitSomething) {
                    audio.playSwordHit();
                }
            }

            if (prog >= 1) {
                state.activeSwing = null;
            }
        }

        p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
        p.flipEl.style.transform = `scale(${0.28 * p.facing}, 0.28)`;
        if (p.swordPivotEl) {
            p.swordPivotEl.style.transform = `rotate(${swordVisualDeg}deg)`;
        }

        // 4. Ondas de energia da Ultimate
        for (let i = state.ultWaves.length - 1; i >= 0; i--) {
            const uw = state.ultWaves[i];
            const stepX = uw.vx * dt;
            const stepY = uw.vy * dt;
            uw.x += stepX;
            uw.y += stepY;
            uw.dist += Math.hypot(stepX, stepY);

            if (Math.random() < 0.75) {
                spawnParticles(uw.x, uw.y, 2, ["#75e3ff", "#ffcf40", "#ffffff"], 95);
            }

            for (let j = state.zombies.length - 1; j >= 0; j--) {
                const z = state.zombies[j];
                if (!z.alive || uw.hitIds.has(z.id)) continue;

                const dist = Math.hypot(z.x - uw.x, z.y - uw.y);
                if (dist <= uw.radius + z.radius) {
                    uw.hitIds.add(z.id);
                    const knock = 380;
                    damageZombie(z, uw.damage, Math.cos(uw.angle) * knock, Math.sin(uw.angle) * knock, true);
                }
            }

            if (
                uw.dist >= uw.maxDist ||
                uw.x < -120 || uw.x > ARENA_W + 120 ||
                uw.y < -120 || uw.y > ARENA_H + 120
            ) {
                state.ultWaves.splice(i, 1);
            }
        }

        // 5. Spawn gradual de zumbis
        if (state.waveSpawned < state.waveTotal && state.zombies.length < MAX_CONCURRENT_ZOMBIES) {
            state.spawnTimer -= dt;
            if (state.spawnTimer <= 0) {
                spawnZombie();
                state.spawnTimer = Math.max(0.4, 1.08 - (state.wave - 1) * 0.065);
            }
        }

        // 6. Atualização e perseguição dos zumbis
        for (let i = state.zombies.length - 1; i >= 0; i--) {
            const z = state.zombies[i];
            if (!z.alive) {
                state.zombies.splice(i, 1);
                continue;
            }

            if (z.hitFlashTimer > 0) {
                z.hitFlashTimer -= dt;
                if (z.hitFlashTimer <= 0) z.el.classList.remove("is-hit");
            }

            if (z.attackAnimTimer > 0) {
                z.attackAnimTimer -= dt;
                if (z.attackAnimTimer <= 0) z.el.classList.remove("is-attacking");
            }

            const toPx = p.x - z.x;
            const toPy = p.y - z.y;
            const distToPlayer = Math.hypot(toPx, toPy) || 0.001;

            // Separação sutil entre zumbis para não empilharem exatamente no mesmo pixel
            let sepX = 0;
            let sepY = 0;
            for (let k = 0; k < state.zombies.length; k++) {
                if (k === i) continue;
                const other = state.zombies[k];
                if (!other.alive) continue;
                const dxZ = z.x - other.x;
                const dyZ = z.y - other.y;
                const dZ = Math.hypot(dxZ, dyZ);
                const minSep = z.radius + other.radius - 6;
                if (dZ > 0.01 && dZ < minSep) {
                    const push = (minSep - dZ) * 2.2;
                    sepX += (dxZ / dZ) * push;
                    sepY += (dyZ / dZ) * push;
                }
            }

            z.x += ((toPx / distToPlayer) * z.speed + z.vxKnock + sepX) * dt;
            z.y += ((toPy / distToPlayer) * z.speed + z.vyKnock + sepY) * dt;
            z.vxKnock *= Math.pow(0.05, dt);
            z.vyKnock *= Math.pow(0.05, dt);

            if (z.x >= 24 && z.x <= ARENA_W - 24 && z.y >= 46 && z.y <= ARENA_H - 20) {
                z.enteredArena = true;
            }
            if (z.enteredArena) {
                z.x = clamp(z.x, 22, ARENA_W - 22);
                z.y = clamp(z.y, 44, ARENA_H - 18);
            }

            const faceDir = toPx >= 0 ? 1 : -1;
            const scaleVal = z.type === "runner" ? 0.92 : z.type === "brute" ? 1.22 : 1;
            z.el.style.transform = `translate3d(${z.x}px, ${z.y}px, 0)`;
            z.rigEl.style.transform = `scale(${scaleVal * faceDir}, ${scaleVal})`;

            // Colisão com jogador
            if (distToPlayer <= p.radius + z.radius - 4) {
                z.attackAnimTimer = 0.26;
                z.el.classList.add("is-attacking");
                damagePlayer(z.damage, z.x, z.y);
                if (state.phase !== "PLAYING") return;
            }
        }

        // 7. Fim da wave quando todos forem derrotados
        if (state.waveSpawned >= state.waveTotal && state.zombies.length === 0 && state.phase === "PLAYING") {
            enterUpgradePhase();
        }
    }

    function renderFxCanvas() {
        if (state.screen !== "GAME") return;

        fxCtx.clearRect(0, 0, ARENA_W, ARENA_H);

        // 1. Efeitos de arco de slash da espada
        for (let i = 0; i < state.slashEffects.length; i++) {
            const sf = state.slashEffects[i];
            const alpha = clamp(sf.life / sf.maxLife, 0, 1);

            fxCtx.save();
            fxCtx.translate(sf.x, sf.y);
            fxCtx.rotate(sf.angle);
            fxCtx.globalAlpha = alpha;

            // Arco principal brilhante
            fxCtx.beginPath();
            fxCtx.arc(0, 0, sf.radius, -1.05, 1.05);
            fxCtx.arc(0, 0, sf.radius * 0.62, 1.05, -1.05, true);
            fxCtx.closePath();

            const grad = fxCtx.createRadialGradient(0, 0, sf.radius * 0.55, 0, 0, sf.radius);
            grad.addColorStop(0, "rgba(255, 255, 255, 0.2)");
            grad.addColorStop(0.65, "#75e3ff");
            grad.addColorStop(1, "#ffffff");
            fxCtx.fillStyle = grad;
            fxCtx.fill();
            fxCtx.lineWidth = 3;
            fxCtx.strokeStyle = "#000000";
            fxCtx.stroke();

            // Traço secundário amarelo
            fxCtx.beginPath();
            fxCtx.arc(0, 0, sf.radius * 0.85, -0.82, 0.82);
            fxCtx.strokeStyle = "#ffcf40";
            fxCtx.lineWidth = 4;
            fxCtx.stroke();

            fxCtx.restore();
        }

        // 2. Grandes ondas de energia da Ultimate
        for (let i = 0; i < state.ultWaves.length; i++) {
            const uw = state.ultWaves[i];
            fxCtx.save();
            fxCtx.translate(uw.x, uw.y);
            fxCtx.rotate(uw.angle);

            // Aura externa
            fxCtx.beginPath();
            fxCtx.arc(-20, 0, uw.radius, -1.15, 1.15);
            fxCtx.arc(-44, 0, uw.radius * 0.72, 1.15, -1.15, true);
            fxCtx.closePath();

            const uGrad = fxCtx.createLinearGradient(-40, 0, uw.radius, 0);
            uGrad.addColorStop(0, "#c054ff");
            uGrad.addColorStop(0.55, "#75e3ff");
            uGrad.addColorStop(1, "#ffffff");
            fxCtx.fillStyle = uGrad;
            fxCtx.fill();
            fxCtx.lineWidth = 4;
            fxCtx.strokeStyle = "#000000";
            fxCtx.stroke();

            // Núcleo dourado de energia
            fxCtx.beginPath();
            fxCtx.arc(-24, 0, uw.radius * 0.76, -0.85, 0.85);
            fxCtx.strokeStyle = "#ffcf40";
            fxCtx.lineWidth = 6;
            fxCtx.stroke();

            fxCtx.restore();
        }

        // 3. Partículas cartoon
        for (let i = 0; i < state.particles.length; i++) {
            const pt = state.particles[i];
            const alpha = clamp(pt.life / pt.maxLife, 0, 1);
            fxCtx.save();
            fxCtx.globalAlpha = alpha;
            fxCtx.fillStyle = pt.color;
            fxCtx.strokeStyle = "#000000";
            fxCtx.lineWidth = 1.5;
            fxCtx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            fxCtx.strokeRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            fxCtx.restore();
        }

        // 4. Textos flutuantes (-25, +10 💰)
        for (let i = 0; i < state.floatingTexts.length; i++) {
            const ft = state.floatingTexts[i];
            const alpha = clamp(ft.life / ft.maxLife, 0, 1);
            fxCtx.save();
            fxCtx.globalAlpha = alpha;
            fxCtx.font = "700 14px 'Space Grotesk', sans-serif";
            const tw = fxCtx.measureText(ft.text).width;
            const bw = tw + 14;
            const bh = 22;

            fxCtx.fillStyle = ft.bg;
            fxCtx.strokeStyle = "#000000";
            fxCtx.lineWidth = 2;
            fxCtx.beginPath();
            fxCtx.rect(ft.x - bw / 2, ft.y - bh / 2, bw, bh);
            fxCtx.fill();
            fxCtx.stroke();

            fxCtx.fillStyle = ft.color;
            fxCtx.textAlign = "center";
            fxCtx.textBaseline = "middle";
            fxCtx.fillText(ft.text, ft.x, ft.y + 1);
            fxCtx.restore();
        }
    }

    function mainLoop(timestamp) {
        if (!state.lastTime) state.lastTime = timestamp;
        const dt = Math.min((timestamp - state.lastTime) / 1000, 0.05);
        state.lastTime = timestamp;

        updateGame(dt);
        renderFxCanvas();

        state.rafId = requestAnimationFrame(mainLoop);
    }

    function startLoopOnce() {
        if (state.rafId !== null) return;
        state.lastTime = performance.now();
        state.rafId = requestAnimationFrame(mainLoop);
    }

    /* =========================================================================
       11. EVENTOS E INICIALIZAÇÃO
    ========================================================================= */
    function updateMouseCoords(e) {
        const rect = dom.arenaWorld.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;
        state.mouseX = clamp(((e.clientX - rect.left) / rect.width) * ARENA_W, 0, ARENA_W);
        state.mouseY = clamp(((e.clientY - rect.top) / rect.height) * ARENA_H, 0, ARENA_H);
    }

    function bindEvents() {
        const unlockOnce = () => audio.unlock();
        document.addEventListener("pointerdown", unlockOnce, { passive: true });
        document.addEventListener("keydown", unlockOnce, { passive: true });

        // Controles de áudio
        dom.toggleMusicBtn.addEventListener("click", () => {
            audio.updateSettings({ musicEnabled: !audioSettings.musicEnabled });
            audio.playClick();
            syncAudioUi();
        });

        dom.toggleSfxBtn.addEventListener("click", () => {
            audio.updateSettings({ sfxEnabled: !audioSettings.sfxEnabled });
            if (audioSettings.sfxEnabled) audio.playClick();
            syncAudioUi();
        });

        dom.volumePopoverBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            audio.playClick();
            const hidden = dom.volumePopover.classList.toggle("hidden");
            dom.volumePopoverBtn.setAttribute("aria-expanded", String(!hidden));
        });

        document.addEventListener("click", (e) => {
            if (!dom.volumePopover.classList.contains("hidden")) {
                if (!dom.volumePopover.contains(e.target) && e.target !== dom.volumePopoverBtn) {
                    dom.volumePopover.classList.add("hidden");
                    dom.volumePopoverBtn.setAttribute("aria-expanded", "false");
                }
            }
        });

        dom.musicSlider.addEventListener("input", () => {
            const v = clamp(Number(dom.musicSlider.value) / 100, 0, 1);
            audio.updateSettings({ musicVolume: v });
            dom.musicVolLabel.textContent = `${Math.round(v * 100)}%`;
        });

        dom.sfxSlider.addEventListener("input", () => {
            const v = clamp(Number(dom.sfxSlider.value) / 100, 0, 1);
            audio.updateSettings({ sfxVolume: v });
            dom.sfxVolLabel.textContent = `${Math.round(v * 100)}%`;
        });

        // Menu e Modais
        dom.btnGoRegister.addEventListener("click", () => {
            audio.playClick();
            showScreen("register");
            dom.playerNameInput.focus();
        });

        dom.btnOpenHowto.addEventListener("click", () => {
            audio.playClick();
            dom.modalHowto.classList.remove("hidden");
        });

        const closeHowto = () => {
            audio.playClick();
            dom.modalHowto.classList.add("hidden");
        };
        dom.btnCloseHowto.addEventListener("click", closeHowto);
        dom.btnHowtoOk.addEventListener("click", closeHowto);
        dom.modalHowto.addEventListener("click", (e) => {
            if (e.target === dom.modalHowto) closeHowto();
        });

        dom.btnOpenRanking.addEventListener("click", () => {
            audio.playClick();
            showScreen("ranking");
        });

        dom.btnRankingBack.addEventListener("click", () => {
            audio.playClick();
            showScreen("menu");
        });

        dom.btnRankingPlay.addEventListener("click", () => {
            audio.playClick();
            showScreen("register");
            dom.playerNameInput.focus();
        });

        // Identificação do jogador
        dom.playerNameInput.addEventListener("input", () => {
            dom.registerPreviewName.textContent = dom.playerNameInput.value.trim() || "Sobrevivente";
        });

        dom.btnRegisterBack.addEventListener("click", () => {
            audio.playClick();
            showScreen("menu");
        });

        dom.registerForm.addEventListener("submit", (e) => {
            e.preventDefault();
            audio.playClick();

            const cleaned = dom.playerNameInput.value.trim();
            if (!cleaned) {
                dom.registerError.textContent = "Digite um nome válido para começar (não pode ficar vazio).";
                dom.registerError.classList.remove("hidden");
                return;
            }
            if (cleaned.length > 16) {
                dom.registerError.textContent = "O nome deve ter no máximo 16 caracteres.";
                dom.registerError.classList.remove("hidden");
                return;
            }

            dom.registerError.classList.add("hidden");
            resetAndStartMatch(cleaned);
        });

        // Controles da Arena (Mouse e Teclado)
        dom.arenaWorld.addEventListener("pointermove", updateMouseCoords);
        dom.arenaWorld.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            updateMouseCoords(e);
            triggerSwordAttack();
        });

        window.addEventListener("keydown", (e) => {
            if (e.code === "Escape" && !dom.modalHowto.classList.contains("hidden")) {
                closeHowto();
                return;
            }

            const tag = document.activeElement ? document.activeElement.tagName : "";
            if (tag === "INPUT" || tag === "TEXTAREA") return;

            if (state.screen !== "GAME" || state.phase !== "PLAYING") return;

            const k = e.key.toLowerCase();
            if (k === "w" || e.code === "KeyW") state.keysDown.add("w");
            if (k === "a" || e.code === "KeyA") state.keysDown.add("a");
            if (k === "s" || e.code === "KeyS") state.keysDown.add("s");
            if (k === "d" || e.code === "KeyD") state.keysDown.add("d");

            if ((k === "r" || e.code === "KeyR") && !e.repeat) {
                triggerUltimate();
            }
        });

        window.addEventListener("keyup", (e) => {
            const k = e.key.toLowerCase();
            if (k === "w" || e.code === "KeyW") state.keysDown.delete("w");
            if (k === "a" || e.code === "KeyA") state.keysDown.delete("a");
            if (k === "s" || e.code === "KeyS") state.keysDown.delete("s");
            if (k === "d" || e.code === "KeyD") state.keysDown.delete("d");
        });

        window.addEventListener("blur", () => {
            state.keysDown.clear();
        });

        // Upgrades
        dom.btnBuyAtk.addEventListener("click", () => buyUpgrade("atk"));
        dom.btnBuyHeal.addEventListener("click", () => buyUpgrade("heal"));
        dom.btnBuyMaxHp.addEventListener("click", () => buyUpgrade("maxhp"));
        dom.btnSkipUpgrade.addEventListener("click", () => {
            audio.playClick();
            finishUpgradePhase();
        });

        // Game Over
        dom.btnRetry.addEventListener("click", () => {
            audio.playClick();
            resetAndStartMatch(state.playerName);
        });

        dom.btnGoRanking.addEventListener("click", () => {
            audio.playClick();
            showScreen("ranking");
        });

        dom.btnGoMenu.addEventListener("click", () => {
            audio.playClick();
            showScreen("menu");
        });

        window.addEventListener("resize", () => {
            if (state.screen === "GAME") fitArenaScale();
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                state.keysDown.clear();
                audio.stopLoop();
            } else if (audio.unlocked && audioSettings.musicEnabled && audio.currentTrack) {
                audio.startLoop();
            }
        });
    }

    function init() {
        renderStaticPreviews();
        renderRecordDisplays();
        syncAudioUi();
        bindEvents();
        showScreen("menu");
        startLoopOnce();
    }

    init();
})();