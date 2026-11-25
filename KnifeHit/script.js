(() => {
    "use strict";

    /* =========================================================================
       1. CONSTANTES E PERSISTÊNCIA (LOCALSTORAGE INTEGRADO AO MINIBLOX)
    ========================================================================= */
    const KEYS = {
        MINIBLOX_STATUS: "situacao",
        MINIBLOX_CHARACTER: "personagem",
        AUDIO: "miniblox_knifehit_audio_v1",
        STATS: "miniblox_knifehit_stats_v1"
    };

    const SKIN_MAP = {
        pele1: "rgb(240, 177, 140)",
        pele2: "rgb(204, 110, 73)",
        pele3: "rgb(255, 157, 118)",
        pele4: "rgb(255, 203, 183)",
        pele5: "rgb(143, 78, 53)"
    };

    const HAIR_MAP = {
        cabelo1: "rgb(139, 57, 57)",
        cabelo2: "rgb(255, 223, 45)",
        cabelo3: "rgb(255, 201, 101)",
        cabelo4: "rgb(37, 37, 37)",
        cabelo5: "rgb(191, 197, 202)"
    };

    const SHIRT_MAP = {
        azul: "rgb(94, 152, 190)",
        vermelha: "rgb(238, 59, 59)",
        preta: "rgb(35, 35, 37)",
        branca: "rgb(230, 230, 230)",
        roxa: "#800080",
        amarela: "rgb(255, 217, 0)",
        Amarela: "rgb(255, 217, 0)",
        verde: "rgb(204, 238, 55)",
        rosa: "rgb(255, 82, 111)",
        flamengo: "#e62e2e",
        palmeiras: "#24af59",
        corinthians: "#222222",
        fluminense: "#7b1535",
        "sao-paulo": "#d71920",
        bahia: "#005ca9",
        botafogo: "#1c1c1c",
        vasco: "#111111",
        gremio: "#0072bc",
        santos: "#f0f0f0",
        mirassol: "#008b45",
        internacional: "#d71920"
    };

    function safeReadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === "object" ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    function safeWriteJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            /* Ignora falhas de quota/modo privado sem quebrar o jogo */
        }
    }

    function readMiniBloxProfile() {
        let registered = false;
        try {
            registered = localStorage.getItem(KEYS.MINIBLOX_STATUS) === "cadastrado";
        } catch {
            registered = false;
        }
        const character = safeReadJSON(KEYS.MINIBLOX_CHARACTER, null);
        return { registered, character };
    }

    function loadAudioSettings() {
        const defaults = {
            musicEnabled: true,
            sfxEnabled: true,
            musicVolume: 0.5,
            sfxVolume: 0.75
        };
        const saved = safeReadJSON(KEYS.AUDIO, null);
        if (!saved) return defaults;

        return {
            musicEnabled: typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : defaults.musicEnabled,
            sfxEnabled: typeof saved.sfxEnabled === "boolean" ? saved.sfxEnabled : defaults.sfxEnabled,
            musicVolume: typeof saved.musicVolume === "number" ? clamp(saved.musicVolume, 0, 1) : defaults.musicVolume,
            sfxVolume: typeof saved.sfxVolume === "number" ? clamp(saved.sfxVolume, 0, 1) : defaults.sfxVolume
        };
    }

    function loadStats() {
        const defaults = {
            bestStageOverall: 0,
            bestScoreOverall: 0,
            playerRecords: {},
            lastPlayers: ["", ""],
            lastMatch: null
        };
        const saved = safeReadJSON(KEYS.STATS, null);
        if (!saved) return defaults;

        return {
            bestStageOverall: Number.isFinite(saved.bestStageOverall) ? saved.bestStageOverall : 0,
            bestScoreOverall: Number.isFinite(saved.bestScoreOverall) ? saved.bestScoreOverall : 0,
            playerRecords: saved.playerRecords && typeof saved.playerRecords === "object" ? saved.playerRecords : {},
            lastPlayers: Array.isArray(saved.lastPlayers) && saved.lastPlayers.length === 2
                ? [String(saved.lastPlayers[0] || "").slice(0, 16), String(saved.lastPlayers[1] || "").slice(0, 16)]
                : ["", ""],
            lastMatch: saved.lastMatch && typeof saved.lastMatch === "object" ? saved.lastMatch : null
        };
    }

    /* =========================================================================
       2. UTILITÁRIOS MATEMÁTICOS E ANGULARES
    ========================================================================= */
    const TWO_PI = Math.PI * 2;
    const WORLD_HIT_ANGLE = Math.PI / 2; // Parte inferior do tronco (x = centro, y = +R)

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function normalizeAngle(angle) {
        let a = angle % TWO_PI;
        if (a < 0) a += TWO_PI;
        return a;
    }

    function shortestAngleDiff(a, b) {
        let diff = (a - b + Math.PI) % TWO_PI;
        if (diff < 0) diff += TWO_PI;
        return Math.abs(diff - Math.PI);
    }

    function shortestSignedDelta(fromAngle, toAngle) {
        let diff = (toAngle - fromAngle + Math.PI) % TWO_PI;
        if (diff < 0) diff += TWO_PI;
        return diff - Math.PI;
    }

    function seededRandom(seed) {
        let s = (seed * 9301 + 49297) % 233280;
        return () => {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }

    function roundRectPath(context, x, y, w, h, r) {
        const radius = Math.min(r, w / 2, h / 2);
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + w - radius, y);
        context.quadraticCurveTo(x + w, y, x + w, y + radius);
        context.lineTo(x + w, y + h - radius);
        context.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        context.lineTo(x + radius, y + h);
        context.quadraticCurveTo(x, y + h, x, y + h - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
    }

    /* =========================================================================
       3. SISTEMA DE ÁUDIO COMPLETO (WEB AUDIO API)
    ========================================================================= */
    class SoundEngine {
        constructor(settings) {
            this.settings = settings;
            this.ctx = null;
            this.masterMusicGain = null;
            this.masterSfxGain = null;
            this.menuGain = null;
            this.gameGain = null;
            this.unlocked = false;
            this.currentTrack = null;
            this.schedulerTimer = null;
            this.nextNoteTime = 0;
            this.stepIndex = 0;
            this.sfxTimestamps = {};
        }

        unlock() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;

                this.ctx = new AudioCtx();
                this.masterMusicGain = this.ctx.createGain();
                this.masterSfxGain = this.ctx.createGain();
                this.menuGain = this.ctx.createGain();
                this.gameGain = this.ctx.createGain();

                this.menuGain.gain.value = 0;
                this.gameGain.gain.value = 0;

                this.menuGain.connect(this.masterMusicGain);
                this.gameGain.connect(this.masterMusicGain);
                this.masterMusicGain.connect(this.ctx.destination);
                this.masterSfxGain.connect(this.ctx.destination);

                this.syncGains();
            }

            if (this.ctx && this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }

            this.unlocked = true;
            if (this.currentTrack && this.settings.musicEnabled && !this.schedulerTimer) {
                this.startMusicLoop();
            }
        }

        syncGains() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const targetMusic = this.settings.musicEnabled ? this.settings.musicVolume * 0.28 : 0;
            const targetSfx = this.settings.sfxEnabled ? this.settings.sfxVolume * 0.65 : 0;

            this.masterMusicGain.gain.cancelScheduledValues(now);
            this.masterMusicGain.gain.setTargetAtTime(targetMusic, now, 0.04);

            this.masterSfxGain.gain.cancelScheduledValues(now);
            this.masterSfxGain.gain.setTargetAtTime(targetSfx, now, 0.02);
        }

        updateSettings(partial) {
            Object.assign(this.settings, partial);
            safeWriteJSON(KEYS.AUDIO, this.settings);
            this.syncGains();

            if (!this.settings.musicEnabled) {
                this.stopMusicLoop();
            } else if (this.unlocked && this.currentTrack && !this.schedulerTimer) {
                this.startMusicLoop();
            }
        }

        setTrack(trackName) {
            if (this.currentTrack === trackName) return;
            this.currentTrack = trackName;
            this.stepIndex = 0;

            if (this.ctx) {
                const now = this.ctx.currentTime;
                this.menuGain.gain.cancelScheduledValues(now);
                this.gameGain.gain.cancelScheduledValues(now);
                this.menuGain.gain.setTargetAtTime(trackName === "menu" ? 1 : 0, now, 0.12);
                this.gameGain.gain.setTargetAtTime(trackName === "game" ? 1 : 0, now, 0.12);
            }

            if (this.unlocked && this.settings.musicEnabled && !this.schedulerTimer) {
                this.startMusicLoop();
            }
        }

        startMusicLoop() {
            if (!this.ctx || this.schedulerTimer) return;
            this.nextNoteTime = this.ctx.currentTime + 0.06;

            const schedule = () => {
                if (!this.ctx || !this.settings.musicEnabled || !this.currentTrack) {
                    this.schedulerTimer = null;
                    return;
                }

                const tempo = this.currentTrack === "menu" ? 114 : 128;
                const stepDuration = 60 / tempo / 2;

                while (this.nextNoteTime < this.ctx.currentTime + 0.18) {
                    this.scheduleMusicStep(this.stepIndex, this.nextNoteTime, stepDuration);
                    this.nextNoteTime += stepDuration;
                    this.stepIndex = (this.stepIndex + 1) % 16;
                }

                this.schedulerTimer = setTimeout(schedule, 45);
            };

            schedule();
        }

        stopMusicLoop() {
            if (this.schedulerTimer) {
                clearTimeout(this.schedulerTimer);
                this.schedulerTimer = null;
            }
        }

        scheduleMusicStep(step, time, stepDur) {
            if (!this.ctx) return;

            if (this.currentTrack === "menu") {
                const melody = [523.25, 0, 659.25, 783.99, 659.25, 0, 587.33, 659.25, 523.25, 0, 587.33, 659.25, 783.99, 659.25, 587.33, 0];
                const bass = [130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0, 164.81, 0, 196.0, 0, 146.83, 0, 196.0, 0];
                if (melody[step]) this.playMusicNote(melody[step], time, stepDur * 0.85, "triangle", 0.22, this.menuGain);
                if (bass[step]) this.playMusicNote(bass[step], time, stepDur * 1.1, "sine", 0.28, this.menuGain);
            } else if (this.currentTrack === "game") {
                const melody = [440, 0, 523.25, 587.33, 659.25, 0, 587.33, 523.25, 440, 0, 493.88, 523.25, 659.25, 783.99, 659.25, 0];
                const bass = [110, 110, 0, 110, 130.81, 130.81, 0, 130.81, 146.83, 146.83, 0, 146.83, 164.81, 0, 196.0, 0];
                if (melody[step]) this.playMusicNote(melody[step], time, stepDur * 0.72, "square", 0.1, this.gameGain);
                if (bass[step]) this.playMusicNote(bass[step], time, stepDur * 0.8, "triangle", 0.26, this.gameGain);
            }
        }

        playMusicNote(freq, time, dur, type, volume, targetGain) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);

            g.gain.setValueAtTime(0.0001, time);
            g.gain.linearRampToValueAtTime(volume, time + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

            osc.connect(g);
            g.connect(targetGain);
            osc.start(time);
            osc.stop(time + dur + 0.02);
        }

        canPlaySfx(name, cooldownMs = 45) {
            if (!this.settings.sfxEnabled) return false;
            this.unlock();
            if (!this.ctx || !this.masterSfxGain) return false;

            const nowMs = performance.now();
            const last = this.sfxTimestamps[name] || 0;
            if (nowMs - last < cooldownMs) return false;
            this.sfxTimestamps[name] = nowMs;
            return true;
        }

        playUiClick() {
            if (!this.canPlaySfx("click", 40)) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(520, now);
            osc.frequency.exponentialRampToValueAtTime(760, now + 0.055);
            g.gain.setValueAtTime(0.24, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
            osc.connect(g);
            g.connect(this.masterSfxGain);
            osc.start(now);
            osc.stop(now + 0.08);
        }

        playThrow() {
            if (!this.canPlaySfx("throw", 40)) return;
            const now = this.ctx.currentTime;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(640, now);
            osc.frequency.exponentialRampToValueAtTime(210, now + 0.09);
            g.gain.setValueAtTime(0.25, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(g);
            g.connect(this.masterSfxGain);
            osc.start(now);
            osc.stop(now + 0.11);
        }

        playWoodHit() {
            if (!this.canPlaySfx("wood", 35)) return;
            const now = this.ctx.currentTime;

            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(195, now);
            osc.frequency.exponentialRampToValueAtTime(62, now + 0.085);
            g.gain.setValueAtTime(0.55, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
            osc.connect(g);
            g.connect(this.masterSfxGain);
            osc.start(now);
            osc.stop(now + 0.11);

            const snap = this.ctx.createOscillator();
            const sg = this.ctx.createGain();
            snap.type = "square";
            snap.frequency.setValueAtTime(920, now);
            snap.frequency.exponentialRampToValueAtTime(340, now + 0.035);
            sg.gain.setValueAtTime(0.14, now);
            sg.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
            snap.connect(sg);
            sg.connect(this.masterSfxGain);
            snap.start(now);
            snap.stop(now + 0.045);
        }

        playCollision() {
            if (!this.canPlaySfx("collision", 80)) return;
            const now = this.ctx.currentTime;

            [1180, 1740].forEach((freq, idx) => {
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = idx === 0 ? "square" : "triangle";
                osc.frequency.setValueAtTime(freq, now);
                osc.frequency.exponentialRampToValueAtTime(freq * 0.62, now + 0.24);
                g.gain.setValueAtTime(idx === 0 ? 0.25 : 0.3, now);
                g.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
                osc.connect(g);
                g.connect(this.masterSfxGain);
                osc.start(now);
                osc.stop(now + 0.27);
            });
        }

        playStageClear() {
            if (!this.canPlaySfx("stage", 120)) return;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            const now = this.ctx.currentTime;
            notes.forEach((freq, i) => {
                const t = now + i * 0.075;
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.32, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
                osc.connect(g);
                g.connect(this.masterSfxGain);
                osc.start(t);
                osc.stop(t + 0.24);
            });
        }

        playVictory() {
            if (!this.canPlaySfx("victory", 200)) return;
            const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
            const offsets = [0, 0.09, 0.18, 0.28, 0.42, 0.54];
            const durs = [0.1, 0.1, 0.11, 0.16, 0.12, 0.38];
            const now = this.ctx.currentTime;

            notes.forEach((freq, i) => {
                const t = now + offsets[i];
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, t);
                g.gain.setValueAtTime(0.34, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + durs[i]);
                osc.connect(g);
                g.connect(this.masterSfxGain);
                osc.start(t);
                osc.stop(t + durs[i] + 0.03);
            });
        }

        playDefeat() {
            if (!this.canPlaySfx("defeat", 150)) return;
            const notes = [392.0, 349.23, 311.13, 233.08];
            const now = this.ctx.currentTime;
            notes.forEach((freq, i) => {
                const t = now + i * 0.11;
                const osc = this.ctx.createOscillator();
                const g = this.ctx.createGain();
                osc.type = "sawtooth";
                osc.frequency.setValueAtTime(freq, t);
                osc.frequency.linearRampToValueAtTime(freq * 0.92, t + 0.1);
                g.gain.setValueAtTime(0.18, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
                osc.connect(g);
                g.connect(this.masterSfxGain);
                osc.start(t);
                osc.stop(t + 0.18);
            });
        }
    }

    /* =========================================================================
       4. CONFIGURAÇÃO DETERMINÍSTICA DE FASES (PROGRESSÃO JUSTA)
    ========================================================================= */
    const MIN_SAFE_ANGLE = 0.23; // ~13.2 graus de separação angular mínima no raio R

    function getStageConfig(stageNumber) {
        const rand = seededRandom(stageNumber * 137 + 19);
        const knivesToHit = Math.min(5 + Math.floor((stageNumber - 1) * 0.85), 11);

        let preStuckCount = 0;
        if (stageNumber === 2) preStuckCount = 1;
        else if (stageNumber >= 3 && stageNumber <= 5) preStuckCount = 2;
        else if (stageNumber >= 6) preStuckCount = 3;

        const preStuckAngles = [];
        const safeSpacing = MIN_SAFE_ANGLE * 2.4;
        let attempts = 0;
        while (preStuckAngles.length < preStuckCount && attempts < 100) {
            attempts++;
            const candidate = rand() * TWO_PI;
            const ok = preStuckAngles.every(a => shortestAngleDiff(a, candidate) >= safeSpacing);
            if (ok) preStuckAngles.push(candidate);
        }

        const dir = stageNumber % 2 === 1 ? 1 : -1;
        const baseSpeed = Math.min(1.55 + (stageNumber - 1) * 0.22, 3.35) * dir;

        let mode = "steady";
        if (stageNumber === 3 || stageNumber === 6) mode = "pulse";
        else if (stageNumber === 4 || stageNumber === 7 || stageNumber >= 9) mode = "reverse";
        else if (stageNumber === 5 || stageNumber === 8) mode = "burst";

        return {
            stageNumber,
            knivesToHit,
            preStuckAngles,
            baseSpeed,
            mode,
            bonusPoints: 200 * stageNumber
        };
    }

    function computeAngularVelocity(config, elapsed) {
        const s = config.baseSpeed;
        switch (config.mode) {
            case "pulse":
                return s * (0.72 + 0.48 * Math.sin(elapsed * 2.1));
            case "reverse": {
                const wave = Math.sin(elapsed * 1.15);
                return s * Math.tanh(wave * 2.4) * 1.1;
            }
            case "burst": {
                const wave = Math.sin(elapsed * 1.85);
                return s * (wave > 0.35 ? 1.38 : 0.68);
            }
            case "steady":
            default:
                return s;
        }
    }

    /* =========================================================================
       5. ESTADO GLOBAL E ELEMENTOS DOM
    ========================================================================= */
    const audioSettings = loadAudioSettings();
    const sound = new SoundEngine(audioSettings);
    const stats = loadStats();

    const dom = {
        screens: {
            menu: document.getElementById("screen-menu"),
            setup: document.getElementById("screen-setup"),
            game: document.getElementById("screen-game"),
            results: document.getElementById("screen-results")
        },
        toggleMusicBtn: document.getElementById("toggle-music-btn"),
        toggleSfxBtn: document.getElementById("toggle-sfx-btn"),
        volumePopoverBtn: document.getElementById("volume-popover-btn"),
        volumePopover: document.getElementById("volume-popover"),
        musicSlider: document.getElementById("music-volume-slider"),
        sfxSlider: document.getElementById("sfx-volume-slider"),
        musicVolLabel: document.getElementById("music-volume-label"),
        sfxVolLabel: document.getElementById("sfx-volume-label"),

        minibloxStatusTitle: document.getElementById("miniblox-status-title"),
        minibloxStatusDesc: document.getElementById("miniblox-status-desc"),
        miniAvatar: document.getElementById("mini-avatar"),
        recordBestStage: document.getElementById("record-best-stage"),
        recordBestScore: document.getElementById("record-best-score"),
        btnGoSetup: document.getElementById("btn-go-setup"),
        btnOpenHowto: document.getElementById("btn-open-howto"),

        modalHowto: document.getElementById("modal-howto"),
        btnCloseHowto: document.getElementById("btn-close-howto"),
        btnHowtoOk: document.getElementById("btn-howto-ok"),

        setupForm: document.getElementById("setup-form"),
        p1Input: document.getElementById("player1-name"),
        p2Input: document.getElementById("player2-name"),
        setupError: document.getElementById("setup-error"),
        btnSetupBack: document.getElementById("btn-setup-back"),

        hudP1Card: document.getElementById("hud-p1-card"),
        hudP2Card: document.getElementById("hud-p2-card"),
        hudP1Name: document.getElementById("hud-p1-name"),
        hudP2Name: document.getElementById("hud-p2-name"),
        hudP1Tag: document.getElementById("hud-p1-tag"),
        hudP2Tag: document.getElementById("hud-p2-tag"),
        hudP1Stage: document.getElementById("hud-p1-stage"),
        hudP2Stage: document.getElementById("hud-p2-stage"),
        hudP1Score: document.getElementById("hud-p1-score"),
        hudP2Score: document.getElementById("hud-p2-score"),
        hudCurrentStage: document.getElementById("hud-current-stage"),
        hudTurnIndicator: document.getElementById("hud-turn-indicator"),
        knivesIcons: document.getElementById("knives-icons"),
        hudKnivesLeft: document.getElementById("hud-knives-left"),

        playfieldCard: document.getElementById("playfield-card"),
        canvas: document.getElementById("game-canvas"),
        controlsHint: document.getElementById("controls-hint"),
        overlayTurn: document.getElementById("overlay-turn"),
        turnOverlayCard: document.getElementById("turn-overlay-card"),
        turnOverlayPill: document.getElementById("turn-overlay-pill"),
        turnOverlayPlayer: document.getElementById("turn-overlay-player"),
        turnOverlayInfo: document.getElementById("turn-overlay-info"),
        btnBeginTurn: document.getElementById("btn-begin-turn"),

        overlayStageClear: document.getElementById("overlay-stage-clear"),
        clearOverlayTitle: document.getElementById("clear-overlay-title"),
        clearOverlayDesc: document.getElementById("clear-overlay-desc"),
        btnStageContinue: document.getElementById("btn-stage-continue"),

        overlayTurnLost: document.getElementById("overlay-turn-lost"),
        lostOverlayTitle: document.getElementById("lost-overlay-title"),
        lostOverlayDesc: document.getElementById("lost-overlay-desc"),
        btnLostContinue: document.getElementById("btn-lost-continue"),

        winnerCrown: document.getElementById("winner-crown"),
        resultsTitle: document.getElementById("results-title"),
        resultsSubtitle: document.getElementById("results-subtitle"),
        resultP1Card: document.getElementById("result-p1-card"),
        resultP2Card: document.getElementById("result-p2-card"),
        resultP1Winner: document.getElementById("result-p1-winner"),
        resultP2Winner: document.getElementById("result-p2-winner"),
        resultP1Name: document.getElementById("result-p1-name"),
        resultP2Name: document.getElementById("result-p2-name"),
        resultP1Score: document.getElementById("result-p1-score"),
        resultP2Score: document.getElementById("result-p2-score"),
        resultP1Stage: document.getElementById("result-p1-stage"),
        resultP2Stage: document.getElementById("result-p2-stage"),
        resultP1Cleared: document.getElementById("result-p1-cleared"),
        resultP2Cleared: document.getElementById("result-p2-cleared"),
        resultP1Hits: document.getElementById("result-p1-hits"),
        resultP2Hits: document.getElementById("result-p2-hits"),
        btnPlayAgain: document.getElementById("btn-play-again"),
        btnResultsMenu: document.getElementById("btn-results-menu")
    };

    const ctx = dom.canvas.getContext("2d");

    const gameState = {
        screen: "MENU",
        phase: "IDLE",
        players: [],
        currentPlayerIndex: 0,
        stageConfig: null,

        width: 600,
        height: 500,
        dpr: 1,
        logX: 300,
        logY: 185,
        logRadius: 68,
        knifeLength: 74,
        knifeProtrude: 56,
        throwStartY: 430,

        logAngle: 0,
        stageElapsed: 0,
        logRecoilY: 0,
        logScalePulse: 1,
        impactFlash: 0,
        stuckKnives: [],
        knivesRemaining: 0,

        throwingKnife: {
            active: false,
            tipY: 0,
            color: "#54adff"
        },

        bouncingKnife: {
            active: false,
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            angle: 0,
            spin: 0,
            color: "#54adff"
        },

        particles: [],
        floatingTexts: [],
        defeatTimer: 0,

        rafId: null,
        lastTimestamp: 0
    };

    /* =========================================================================
       6. INTEGRAÇÃO VISUAL COM MINIBLOX E MENU
    ========================================================================= */
    function renderMiniBloxProfile() {
        const { registered, character } = readMiniBloxProfile();

        if (registered) {
            dom.minibloxStatusTitle.textContent = "Jogador MiniBlox Conectado ✅";
            dom.minibloxStatusDesc.textContent = character
                ? `Visual do Vestiário carregado (${character.camisa || "padrão"})`
                : "Cadastro ativo no portal MiniBlox";
        } else {
            dom.minibloxStatusTitle.textContent = "Visitante MiniBlox";
            dom.minibloxStatusDesc.textContent = "Cadastre-se no MiniBlox para sincronizar seu visual.";
        }

        if (character) {
            const skin = SKIN_MAP[character.pele] || SKIN_MAP.pele1;
            const hair = HAIR_MAP[character.corCabelo] || HAIR_MAP.cabelo1;
            const shirt = SHIRT_MAP[character.camisa] || SHIRT_MAP.azul;

            dom.miniAvatar.style.setProperty("--avatar-skin", skin);
            dom.miniAvatar.style.setProperty("--avatar-hair", hair);
            dom.miniAvatar.style.setProperty("--avatar-shirt", shirt);
        }
    }

    function renderMenuRecords() {
        dom.recordBestStage.textContent = stats.bestStageOverall > 0 ? `Fase ${stats.bestStageOverall}` : "—";
        dom.recordBestScore.textContent = `${stats.bestScoreOverall} pts`;
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

    /* =========================================================================
       7. NAVEGAÇÃO ENTRE TELAS
    ========================================================================= */
    function showScreen(screenKey) {
        Object.entries(dom.screens).forEach(([key, el]) => {
            el.classList.toggle("active", key === screenKey);
        });
        gameState.screen = screenKey.toUpperCase();

        if (screenKey === "menu") {
            gameState.phase = "IDLE";
            sound.setTrack("menu");
            renderMenuRecords();
        } else if (screenKey === "setup") {
            gameState.phase = "IDLE";
            sound.setTrack("menu");
            dom.setupError.classList.add("hidden");
            if (!dom.p1Input.value && stats.lastPlayers[0]) dom.p1Input.value = stats.lastPlayers[0];
            if (!dom.p2Input.value && stats.lastPlayers[1]) dom.p2Input.value = stats.lastPlayers[1];
        } else if (screenKey === "game") {
            sound.setTrack("game");
            resizeCanvas();
        } else if (screenKey === "results") {
            gameState.phase = "RESULTS";
            sound.setTrack("menu");
        }
    }

    function hideAllGameOverlays() {
        dom.overlayTurn.classList.add("hidden");
        dom.overlayStageClear.classList.add("hidden");
        dom.overlayTurnLost.classList.add("hidden");
    }

    /* =========================================================================
       8. CONTROLE DA PARTIDA MULTIPLAYER
    ========================================================================= */
    function createFreshPlayers(name1, name2) {
        return [
            {
                id: 1,
                name: name1,
                color: "#54adff",
                handleAccent: "#2d8ae6",
                currentStage: 1,
                stagesCleared: 0,
                maxStageReached: 1,
                score: 0,
                hits: 0,
                alive: true
            },
            {
                id: 2,
                name: name2,
                color: "#ff7070",
                handleAccent: "#e04848",
                currentStage: 1,
                stagesCleared: 0,
                maxStageReached: 1,
                score: 0,
                hits: 0,
                alive: true
            }
        ];
    }

    function startNewMatch(name1, name2) {
        stats.lastPlayers = [name1, name2];
        safeWriteJSON(KEYS.STATS, stats);

        gameState.players = createFreshPlayers(name1, name2);
        gameState.currentPlayerIndex = 0;
        gameState.particles = [];
        gameState.floatingTexts = [];
        gameState.bouncingKnife.active = false;
        gameState.throwingKnife.active = false;

        showScreen("game");
        prepareCurrentPlayerTurn();
    }

    function getCurrentPlayer() {
        return gameState.players[gameState.currentPlayerIndex];
    }

    function prepareCurrentPlayerTurn() {
        const player = getCurrentPlayer();
        const config = getStageConfig(player.currentStage);

        gameState.stageConfig = config;
        gameState.logAngle = 0;
        gameState.stageElapsed = 0;
        gameState.logRecoilY = 0;
        gameState.logScalePulse = 1;
        gameState.impactFlash = 0;
        gameState.knivesRemaining = config.knivesToHit;
        gameState.throwingKnife.active = false;
        gameState.throwingKnife.tipY = gameState.throwStartY;
        gameState.throwingKnife.color = player.color;
        gameState.bouncingKnife.active = false;
        gameState.particles = [];
        gameState.floatingTexts = [];

        gameState.stuckKnives = config.preStuckAngles.map(angle => ({
            localAngle: normalizeAngle(angle),
            color: "#3f4756",
            isObstacle: true
        }));

        updateGameHud();
        showTurnBannerOverlay(player);
    }

    function showTurnBannerOverlay(player) {
        hideAllGameOverlays();
        gameState.phase = "TURN_BANNER";

        dom.turnOverlayCard.classList.remove("p1-accent", "p2-accent");
        dom.turnOverlayCard.classList.add(player.id === 1 ? "p1-accent" : "p2-accent");

        dom.turnOverlayPill.textContent = `TURNO DO JOGADOR ${player.id}`;
        dom.turnOverlayPlayer.textContent = player.name;

        const patternNames = {
            steady: "Rotação constante",
            pulse: "Velocidade variável!",
            reverse: "Muda de direção!",
            burst: "Acelerações surpresa!"
        };
        const modeHint = patternNames[gameState.stageConfig.mode] || "";
        dom.turnOverlayInfo.textContent = `Fase ${player.currentStage} • ${gameState.stageConfig.knivesToHit} facas • ${modeHint}`;

        dom.overlayTurn.classList.remove("hidden");
    }

    function beginActiveTurn() {
        if (gameState.phase !== "TURN_BANNER") return;
        hideAllGameOverlays();
        gameState.phase = "PLAYING";
        dom.controlsHint.classList.remove("hidden");
        if (document.activeElement && document.activeElement.blur) {
            document.activeElement.blur();
        }
    }

    function updateGameHud() {
        const [p1, p2] = gameState.players;
        const active = getCurrentPlayer();
        if (!p1 || !p2 || !active) return;

        dom.hudP1Name.textContent = p1.name;
        dom.hudP1Stage.textContent = String(p1.maxStageReached);
        dom.hudP1Score.textContent = String(p1.score);
        dom.hudP1Card.classList.toggle("is-active", active.id === 1 && p1.alive);
        dom.hudP1Card.classList.toggle("is-eliminated", !p1.alive);
        dom.hudP1Tag.textContent = !p1.alive ? "ELIMINADO" : (active.id === 1 ? "JOGANDO" : "AGUARDA");

        dom.hudP2Name.textContent = p2.name;
        dom.hudP2Stage.textContent = String(p2.maxStageReached);
        dom.hudP2Score.textContent = String(p2.score);
        dom.hudP2Card.classList.toggle("is-active", active.id === 2 && p2.alive);
        dom.hudP2Card.classList.toggle("is-eliminated", !p2.alive);
        dom.hudP2Tag.textContent = !p2.alive ? "ELIMINADO" : (active.id === 2 ? "JOGANDO" : "AGUARDA");

        dom.hudCurrentStage.textContent = String(active.currentStage);
        dom.hudTurnIndicator.textContent = `Vez de ${active.name}`;
        dom.hudKnivesLeft.textContent = String(gameState.knivesRemaining);

        const total = gameState.stageConfig ? gameState.stageConfig.knivesToHit : 0;
        const used = total - gameState.knivesRemaining;
        dom.knivesIcons.innerHTML = "";
        for (let i = 0; i < total; i++) {
            const pip = document.createElement("span");
            pip.className = i < used ? "knife-pip used" : "knife-pip";
            if (i >= used) {
                pip.style.backgroundColor = active.color;
            }
            dom.knivesIcons.appendChild(pip);
        }
    }

    function handleKnifeSuccess(impactLocalAngle) {
        const player = getCurrentPlayer();
        const stage = player.currentStage;

        gameState.stuckKnives.push({
            localAngle: normalizeAngle(impactLocalAngle),
            color: player.color,
            isObstacle: false
        });

        gameState.knivesRemaining = Math.max(0, gameState.knivesRemaining - 1);
        gameState.throwingKnife.active = false;

        const pointsEarned = 100 + (stage - 1) * 10;
        player.score += pointsEarned;
        player.hits += 1;

        gameState.logRecoilY = -8;
        gameState.logScalePulse = 1.07;
        gameState.impactFlash = 1;
        spawnWoodParticles(gameState.logX, gameState.logY + gameState.logRadius, 10);
        spawnFloatingText(gameState.logX, gameState.logY + gameState.logRadius + 24, `+${pointsEarned}`, "#111111", "#ffcf40");
        sound.playWoodHit();

        updateGameHud();

        if (gameState.knivesRemaining === 0) {
            completeCurrentStage();
        }
    }

    function completeCurrentStage() {
        const player = getCurrentPlayer();
        const bonus = gameState.stageConfig.bonusPoints;

        gameState.phase = "STAGE_CLEAR";
        player.stagesCleared += 1;
        player.currentStage += 1;
        player.maxStageReached = Math.max(player.maxStageReached, player.currentStage);
        player.score += bonus;

        spawnCelebrationParticles(gameState.logX, gameState.logY, 26);
        sound.playStageClear();
        updateGameHud();

        dom.clearOverlayTitle.textContent = `${player.name} venceu a Fase ${player.currentStage - 1}!`;
        dom.clearOverlayDesc.textContent = `+${bonus} pontos de bônus! Avançou para a Fase ${player.currentStage}.`;
        dom.overlayStageClear.classList.remove("hidden");
    }

    function handleKnifeCollision(collisionX, collisionY) {
        const player = getCurrentPlayer();
        gameState.phase = "DEFEAT_ANIM";
        gameState.throwingKnife.active = false;
        gameState.defeatTimer = 0.72;

        gameState.bouncingKnife = {
            active: true,
            x: collisionX,
            y: collisionY,
            vx: (Math.random() > 0.5 ? 1 : -1) * 185,
            vy: 340,
            angle: 0,
            spin: (Math.random() > 0.5 ? 1 : -1) * 12,
            color: player.color
        };

        spawnCollisionSparks(collisionX, collisionY, 18);
        spawnFloatingText(collisionX, collisionY - 14, "COLISÃO!", "#ffffff", "#ff4d4d");

        dom.playfieldCard.classList.remove("shake");
        void dom.playfieldCard.offsetWidth;
        dom.playfieldCard.classList.add("shake");

        sound.playCollision();
        setTimeout(() => {
            if (gameState.phase === "DEFEAT_ANIM") {
                sound.playDefeat();
            }
        }, 120);
    }

    function finalizePlayerDefeat() {
        const player = getCurrentPlayer();
        player.alive = false;
        gameState.phase = "TURN_LOST";
        updateGameHud();

        const [p1, p2] = gameState.players;
        const bothLost = !p1.alive && !p2.alive;

        dom.lostOverlayTitle.textContent = `${player.name} perdeu a vez!`;
        dom.lostOverlayDesc.textContent = `Alcançou a Fase ${player.maxStageReached} com ${player.score} pontos.`;
        dom.btnLostContinue.textContent = bothLost ? "VER RESULTADO FINAL 🏆" : "PASSAR A VEZ →";
        dom.overlayTurnLost.classList.remove("hidden");
    }

    function advanceAfterOutcome() {
        const [p1, p2] = gameState.players;
        if (!p1.alive && !p2.alive) {
            finishMatch();
            return;
        }

        const otherIndex = 1 - gameState.currentPlayerIndex;
        if (gameState.players[otherIndex].alive) {
            gameState.currentPlayerIndex = otherIndex;
        }
        prepareCurrentPlayerTurn();
    }

     async function finishMatch() {
        const [p1, p2] = gameState.players;

        [p1, p2].forEach(p => {
            if (p.maxStageReached > stats.bestStageOverall) {
                stats.bestStageOverall = p.maxStageReached;
            }
            if (p.score > stats.bestScoreOverall) {
                stats.bestScoreOverall = p.score;
            }
            const prev = stats.playerRecords[p.name] || { bestStage: 0, bestScore: 0 };
            stats.playerRecords[p.name] = {
                bestStage: Math.max(prev.bestStage, p.maxStageReached),
                bestScore: Math.max(prev.bestScore, p.score)
            };
        });

        let winner = null;
        if (p1.maxStageReached > p2.maxStageReached) winner = p1;
        else if (p2.maxStageReached > p1.maxStageReached) winner = p2;
        else if (p1.score > p2.score) winner = p1;
        else if (p2.score > p1.score) winner = p2;

        stats.lastMatch = {
            date: new Date().toISOString(),
            winner: winner ? winner.name : "EMPATE",
            p1: { name: p1.name, stage: p1.maxStageReached, score: p1.score, hits: p1.hits },
            p2: { name: p2.name, stage: p2.maxStageReached, score: p2.score, hits: p2.hits }
        };
        safeWriteJSON(KEYS.STATS, stats);

        dom.resultP1Name.textContent = p1.name;
        dom.resultP1Score.textContent = `${p1.score} pts`;
        dom.resultP1Stage.textContent = `Fase ${p1.maxStageReached}`;
        dom.resultP1Cleared.textContent = String(p1.stagesCleared);
        dom.resultP1Hits.textContent = String(p1.hits);

        dom.resultP2Name.textContent = p2.name;
        dom.resultP2Score.textContent = `${p2.score} pts`;
        dom.resultP2Stage.textContent = `Fase ${p2.maxStageReached}`;
        dom.resultP2Cleared.textContent = String(p2.stagesCleared);
        dom.resultP2Hits.textContent = String(p2.hits);

        dom.resultP1Card.classList.toggle("is-winner", winner === p1);
        dom.resultP2Card.classList.toggle("is-winner", winner === p2);
        dom.resultP1Winner.classList.toggle("hidden", winner !== p1);
        dom.resultP2Winner.classList.toggle("hidden", winner !== p2);

        if (winner) {
            dom.winnerCrown.textContent = "🏆";
            dom.resultsTitle.textContent = "TEMOS UM VENCEDOR!";
            dom.resultsSubtitle.textContent = `${winner.name} venceu alcançando a Fase ${winner.maxStageReached} com ${winner.score} pontos!`;
        } else {
            dom.winnerCrown.textContent = "🤝";
            dom.resultsTitle.textContent = "EMPATE ÉPICO!";
            dom.resultsSubtitle.textContent = `Os dois jogadores alcançaram a Fase ${p1.maxStageReached} com ${p1.score} pontos!`;
        }

        sound.playVictory();
        showScreen("results");

        const pontuacaoFinalKnifeHit = winner ? winner.score : Math.max(p1.score, p2.score);
        await enviarPontuacao("knife_hit", pontuacaoFinalKnifeHit);
    }

    /* =========================================================================
       9. LANÇAMENTO DE FACA E DETECÇÃO ANGULAR DE COLISÃO
    ========================================================================= */
    function attemptThrowKnife() {
        if (gameState.screen !== "GAME") return;
        if (gameState.phase !== "PLAYING") return;
        if (gameState.throwingKnife.active) return;
        if (gameState.knivesRemaining <= 0) return;

        const player = getCurrentPlayer();
        gameState.throwingKnife.active = true;
        gameState.throwingKnife.tipY = gameState.throwStartY;
        gameState.throwingKnife.color = player.color;

        sound.playThrow();
    }

    function checkAngularCollision(localAngle) {
        for (let i = 0; i < gameState.stuckKnives.length; i++) {
            const stuck = gameState.stuckKnives[i];
            if (shortestAngleDiff(localAngle, stuck.localAngle) < MIN_SAFE_ANGLE) {
                return true;
            }
        }
        return false;
    }

    /* =========================================================================
       10. PARTÍCULAS E TEXTOS FLUTUANTES
    ========================================================================= */
    function spawnWoodParticles(x, y, count) {
        const colors = ["#e2a86b", "#8d5228", "#f6caa0", "#ffcf40"];
        for (let i = 0; i < count; i++) {
            const angle = Math.PI * 0.15 + Math.random() * Math.PI * 0.7;
            const speed = 110 + Math.random() * 210;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed * (Math.random() > 0.5 ? 1 : -1),
                vy: Math.sin(angle) * speed * 0.65,
                size: 4 + Math.random() * 5,
                rot: Math.random() * TWO_PI,
                vRot: (Math.random() - 0.5) * 14,
                life: 0.48 + Math.random() * 0.25,
                maxLife: 0.73,
                color: colors[i % colors.length],
                gravity: 560
            });
        }
    }

    function spawnCollisionSparks(x, y, count) {
        const colors = ["#ffffff", "#ffcf40", "#ff5959", "#ffef5b"];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * TWO_PI;
            const speed = 140 + Math.random() * 260;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 3 + Math.random() * 4,
                rot: angle,
                vRot: (Math.random() - 0.5) * 16,
                life: 0.35 + Math.random() * 0.22,
                maxLife: 0.57,
                color: colors[i % colors.length],
                gravity: 340
            });
        }
    }

    function spawnCelebrationParticles(x, y, count) {
        const colors = ["#ffcf40", "#54adff", "#ff7070", "#bbff62", "#c054ff"];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * TWO_PI;
            const speed = 150 + Math.random() * 290;
            gameState.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 90,
                size: 5 + Math.random() * 5,
                rot: Math.random() * TWO_PI,
                vRot: (Math.random() - 0.5) * 12,
                life: 0.65 + Math.random() * 0.35,
                maxLife: 1.0,
                color: colors[i % colors.length],
                gravity: 420
            });
        }
    }

    function spawnFloatingText(x, y, text, textColor, bgColor) {
        gameState.floatingTexts.push({
            x,
            y,
            text,
            textColor,
            bgColor,
            life: 0.72,
            maxLife: 0.72
        });
    }

    /* =========================================================================
       11. LOOP PRINCIPAL (REQUESTANIMATIONFRAME + DELTATIME)
    ========================================================================= */
    function resizeCanvas() {
        const rect = dom.playfieldCard.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        gameState.dpr = dpr;
        gameState.width = rect.width;
        gameState.height = rect.height;

        dom.canvas.width = Math.round(rect.width * dpr);
        dom.canvas.height = Math.round(rect.height * dpr);

        const baseMin = Math.min(rect.width, rect.height);
        gameState.logX = rect.width * 0.5;
        gameState.logY = rect.height * 0.36;
        gameState.logRadius = clamp(baseMin * 0.165, 48, 78);
        gameState.knifeLength = gameState.logRadius * 1.15;
        gameState.knifeProtrude = gameState.logRadius * 0.85;
        gameState.throwStartY = rect.height - Math.max(88, rect.height * 0.19);
    }

    function updatePhysics(dt) {
        if (gameState.screen !== "GAME") return;

        gameState.logRecoilY += (0 - gameState.logRecoilY) * Math.min(1, dt * 18);
        gameState.logScalePulse += (1 - gameState.logScalePulse) * Math.min(1, dt * 16);
        gameState.impactFlash = Math.max(0, gameState.impactFlash - dt * 5.5);

        if ((gameState.phase === "PLAYING" || gameState.phase === "TURN_BANNER") && gameState.stageConfig) {
            const prevLogAngle = gameState.logAngle;
            gameState.stageElapsed += dt;
            const angVel = computeAngularVelocity(gameState.stageConfig, gameState.stageElapsed);
            gameState.logAngle = normalizeAngle(gameState.logAngle + angVel * dt);

            if (gameState.phase === "PLAYING" && gameState.throwingKnife.active) {
                const throwSpeed = Math.max(1500, gameState.height * 3.8);
                const prevTipY = gameState.throwingKnife.tipY;
                const nextTipY = prevTipY - throwSpeed * dt;

                const impactY = gameState.logY + gameState.logRadius;
                const handleOuterY = impactY + gameState.knifeProtrude * 0.42;

                if (nextTipY <= handleOuterY) {
                    const steps = 4;
                    let resolved = false;
                    const deltaAngle = shortestSignedDelta(prevLogAngle, gameState.logAngle);

                    for (let s = 1; s <= steps; s++) {
                        const frac = s / steps;
                        const sampleY = prevTipY + (nextTipY - prevTipY) * frac;
                        if (sampleY > handleOuterY) continue;

                        const sampleLogAngle = normalizeAngle(prevLogAngle + deltaAngle * frac);
                        const candidateLocalAngle = normalizeAngle(WORLD_HIT_ANGLE - sampleLogAngle);

                        if (checkAngularCollision(candidateLocalAngle)) {
                            handleKnifeCollision(gameState.logX, Math.max(sampleY, impactY));
                            resolved = true;
                            break;
                        }

                        if (sampleY <= impactY) {
                            handleKnifeSuccess(candidateLocalAngle);
                            resolved = true;
                            break;
                        }
                    }

                    if (!resolved) {
                        gameState.throwingKnife.tipY = nextTipY;
                    }
                } else {
                    gameState.throwingKnife.tipY = nextTipY;
                }
            }
        }

        if (gameState.phase === "DEFEAT_ANIM") {
            if (gameState.bouncingKnife.active) {
                const bk = gameState.bouncingKnife;
                bk.vy += 1200 * dt;
                bk.x += bk.vx * dt;
                bk.y += bk.vy * dt;
                bk.angle += bk.spin * dt;
            }
            gameState.defeatTimer -= dt;
            if (gameState.defeatTimer <= 0) {
                finalizePlayerDefeat();
            }
        }

        for (let i = gameState.particles.length - 1; i >= 0; i--) {
            const p = gameState.particles[i];
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rot += p.vRot * dt;
            p.life -= dt;
            if (p.life <= 0) {
                gameState.particles.splice(i, 1);
            }
        }

        for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
            const ft = gameState.floatingTexts[i];
            ft.y -= 42 * dt;
            ft.life -= dt;
            if (ft.life <= 0) {
                gameState.floatingTexts.splice(i, 1);
            }
        }
    }

    /* =========================================================================
       12. RENDERIZAÇÃO CARTOON NO CANVAS
    ========================================================================= */
    function drawKnifeShape(context, tipX, tipY, angleRad, bladeLen, handleLen, handleColor, scale = 1) {
        context.save();
        context.translate(tipX, tipY);
        context.rotate(angleRad);
        context.scale(scale, scale);

        const bladeWidth = 10;
        const guardWidth = 22;
        const handleWidth = 12;

        // Lâmina (ponta em (0, 0), corpo descendo para +Y)
        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(bladeWidth * 0.5, bladeLen * 0.32);
        context.lineTo(bladeWidth * 0.5, bladeLen);
        context.lineTo(-bladeWidth * 0.5, bladeLen);
        context.lineTo(-bladeWidth * 0.5, bladeLen * 0.32);
        context.closePath();

        const grad = context.createLinearGradient(-bladeWidth * 0.5, 0, bladeWidth * 0.5, 0);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.55, "#d2dde9");
        grad.addColorStop(1, "#8d9db3");
        context.fillStyle = grad;
        context.fill();
        context.lineWidth = 2.6;
        context.strokeStyle = "#000000";
        context.stroke();

        // Guarda dourada
        roundRectPath(context, -guardWidth * 0.5, bladeLen - 2, guardWidth, 7, 3);
        context.fillStyle = "#ffcf40";
        context.fill();
        context.stroke();

        // Cabo colorido do jogador
        roundRectPath(context, -handleWidth * 0.5, bladeLen + 5, handleWidth, handleLen, 4);
        context.fillStyle = handleColor;
        context.fill();
        context.stroke();

        // Detalhe claro no cabo
        context.fillStyle = "rgba(255,255,255,0.38)";
        context.fillRect(-handleWidth * 0.25, bladeLen + 9, handleWidth * 0.28, handleLen - 9);

        context.restore();
    }

    function renderCanvas() {
        if (gameState.screen !== "GAME") return;

        ctx.save();
        ctx.scale(gameState.dpr, gameState.dpr);

        const w = gameState.width;
        const h = gameState.height;
        const cx = gameState.logX;
        const cy = gameState.logY + gameState.logRecoilY;
        const r = gameState.logRadius;

        ctx.clearRect(0, 0, w, h);

        // Fundo sutil de arena cartoon
        ctx.fillStyle = "rgba(117, 227, 255, 0.14)";
        ctx.beginPath();
        ctx.arc(cx, cy, r * 2.15, 0, TWO_PI);
        ctx.fill();

        const bladeLen = r * 0.54;
        const handleLen = r * 0.48;
        const embedDepth = r * 0.18;

        // 1. Desenha todas as facas presas apontando o cabo para fora do tronco
        for (let i = 0; i < gameState.stuckKnives.length; i++) {
            const knife = gameState.stuckKnives[i];
            const worldAngle = gameState.logAngle + knife.localAngle;
            const ux = Math.cos(worldAngle);
            const uy = Math.sin(worldAngle);
            const tipX = cx + ux * (r - embedDepth);
            const tipY = cy + uy * (r - embedDepth);
            const drawRot = worldAngle - Math.PI / 2;

            drawKnifeShape(ctx, tipX, tipY, drawRot, bladeLen, handleLen, knife.color, 1);
        }

        // 2. Desenha faca em voo ou faca esperando para ser lançada
        if (gameState.phase === "PLAYING" && gameState.throwingKnife.active) {
            drawKnifeShape(
                ctx,
                cx,
                gameState.throwingKnife.tipY,
                0,
                bladeLen,
                handleLen,
                gameState.throwingKnife.color,
                1
            );
        } else if (
            (gameState.phase === "PLAYING" || gameState.phase === "TURN_BANNER") &&
            gameState.knivesRemaining > 0
        ) {
            const readyColor = getCurrentPlayer() ? getCurrentPlayer().color : "#54adff";
            drawKnifeShape(ctx, cx, gameState.throwStartY, 0, bladeLen, handleLen, readyColor, 1);
        }

        // 3. Desenha o tronco de madeira giratório
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(gameState.logScalePulse, gameState.logScalePulse);

        // Sombra sólida neobrutalista do tronco
        ctx.beginPath();
        ctx.arc(5, 6, r, 0, TWO_PI);
        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
        ctx.fill();

        ctx.rotate(gameState.logAngle);

        // Casca externa
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, TWO_PI);
        ctx.fillStyle = "#7a4420";
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#000000";
        ctx.stroke();

        // Miolo de madeira clara
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.83, 0, TWO_PI);
        ctx.fillStyle = "#e0a163";
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#5c3114";
        ctx.stroke();

        // Anéis de crescimento da madeira
        ctx.strokeStyle = "#c27d3e";
        ctx.lineWidth = 2.5;
        [0.62, 0.4, 0.18].forEach((ratio, idx) => {
            ctx.beginPath();
            ctx.arc(0, 0, r * ratio, idx * 0.6, TWO_PI - 0.55 + idx * 0.6);
            ctx.stroke();
        });

        // Marca de nó e brilho para facilitar a leitura da rotação
        ctx.fillStyle = "#b36d31";
        ctx.beginPath();
        ctx.ellipse(r * 0.34, -r * 0.22, r * 0.12, r * 0.08, 0.5, 0, TWO_PI);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 240, 220, 0.65)";
        ctx.lineWidth = 4;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.72, -2.55, -1.55);
        ctx.stroke();

        // Flash branco discreto no impacto
        if (gameState.impactFlash > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, TWO_PI);
            ctx.fillStyle = `rgba(255, 255, 255, ${gameState.impactFlash * 0.35})`;
            ctx.fill();
        }

        ctx.restore();

        // 4. Desenha faca ricocheteando na derrota
        if (gameState.bouncingKnife.active) {
            const bk = gameState.bouncingKnife;
            drawKnifeShape(ctx, bk.x, bk.y, bk.angle, bladeLen, handleLen, bk.color, 1);
        }

        // 5. Partículas cartoon
        for (let i = 0; i < gameState.particles.length; i++) {
            const p = gameState.particles[i];
            const alpha = clamp(p.life / p.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.color;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
            ctx.strokeRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size);
            ctx.restore();
        }

        // 6. Textos flutuantes (+100 / COLISÃO!)
        for (let i = 0; i < gameState.floatingTexts.length; i++) {
            const ft = gameState.floatingTexts[i];
            const alpha = clamp(ft.life / ft.maxLife, 0, 1);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = "700 15px 'Space Grotesk', sans-serif";
            const textW = ctx.measureText(ft.text).width;
            const padX = 10;
            const boxW = textW + padX * 2;
            const boxH = 26;

            roundRectPath(ctx, ft.x - boxW / 2, ft.y - boxH / 2, boxW, boxH, 5);
            ctx.fillStyle = ft.bgColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = ft.textColor;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(ft.text, ft.x, ft.y + 1);
            ctx.restore();
        }

        ctx.restore();
    }

    function mainLoop(timestamp) {
        if (!gameState.lastTimestamp) gameState.lastTimestamp = timestamp;
        const dt = Math.min((timestamp - gameState.lastTimestamp) / 1000, 0.05);
        gameState.lastTimestamp = timestamp;

        updatePhysics(dt);
        renderCanvas();

        gameState.rafId = requestAnimationFrame(mainLoop);
    }

    function startMainLoopOnce() {
        if (gameState.rafId !== null) return;
        gameState.lastTimestamp = performance.now();
        gameState.rafId = requestAnimationFrame(mainLoop);
    }

    /* =========================================================================
       13. EVENTOS DE INTERFACE, TECLADO E MOUSE
    ========================================================================= */
    function bindEvents() {
        const unlockOnce = () => {
            sound.unlock();
        };
        document.addEventListener("pointerdown", unlockOnce, { passive: true });
        document.addEventListener("keydown", unlockOnce, { passive: true });

        dom.toggleMusicBtn.addEventListener("click", () => {
            sound.updateSettings({ musicEnabled: !audioSettings.musicEnabled });
            sound.playUiClick();
            syncAudioUi();
        });

        dom.toggleSfxBtn.addEventListener("click", () => {
            sound.updateSettings({ sfxEnabled: !audioSettings.sfxEnabled });
            if (audioSettings.sfxEnabled) sound.playUiClick();
            syncAudioUi();
        });

        dom.volumePopoverBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            sound.playUiClick();
            const isHidden = dom.volumePopover.classList.toggle("hidden");
            dom.volumePopoverBtn.setAttribute("aria-expanded", String(!isHidden));
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
            const val = clamp(Number(dom.musicSlider.value) / 100, 0, 1);
            sound.updateSettings({ musicVolume: val });
            dom.musicVolLabel.textContent = `${Math.round(val * 100)}%`;
        });

        dom.sfxSlider.addEventListener("input", () => {
            const val = clamp(Number(dom.sfxSlider.value) / 100, 0, 1);
            sound.updateSettings({ sfxVolume: val });
            dom.sfxVolLabel.textContent = `${Math.round(val * 100)}%`;
        });

        dom.btnGoSetup.addEventListener("click", () => {
            sound.playUiClick();
            showScreen("setup");
            dom.p1Input.focus();
        });

        dom.btnOpenHowto.addEventListener("click", () => {
            sound.playUiClick();
            dom.modalHowto.classList.remove("hidden");
        });

        const closeHowto = () => {
            sound.playUiClick();
            dom.modalHowto.classList.add("hidden");
        };
        dom.btnCloseHowto.addEventListener("click", closeHowto);
        dom.btnHowtoOk.addEventListener("click", closeHowto);
        dom.modalHowto.addEventListener("click", (e) => {
            if (e.target === dom.modalHowto) closeHowto();
        });

        dom.btnSetupBack.addEventListener("click", () => {
            sound.playUiClick();
            showScreen("menu");
        });

        dom.setupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            sound.playUiClick();

            const name1 = dom.p1Input.value.trim();
            const name2 = dom.p2Input.value.trim();

            if (!name1 || !name2) {
                dom.setupError.textContent = "Preencha os nomes dos dois jogadores (sem espaços vazios).";
                dom.setupError.classList.remove("hidden");
                return;
            }

            if (name1.length > 16 || name2.length > 16) {
                dom.setupError.textContent = "Os nomes devem ter no máximo 16 caracteres.";
                dom.setupError.classList.remove("hidden");
                return;
            }

            if (name1.toLowerCase() === name2.toLowerCase()) {
                dom.setupError.textContent = "Os dois jogadores precisam ter nomes diferentes!";
                dom.setupError.classList.remove("hidden");
                return;
            }

            dom.setupError.classList.add("hidden");
            startNewMatch(name1, name2);
        });

        dom.btnBeginTurn.addEventListener("click", () => {
            sound.playUiClick();
            beginActiveTurn();
        });

        dom.btnStageContinue.addEventListener("click", () => {
            sound.playUiClick();
            advanceAfterOutcome();
        });

        dom.btnLostContinue.addEventListener("click", () => {
            sound.playUiClick();
            advanceAfterOutcome();
        });

        dom.canvas.addEventListener("pointerdown", (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            attemptThrowKnife();
        });

        window.addEventListener("keydown", (e) => {
            if (e.code === "Escape" && !dom.modalHowto.classList.contains("hidden")) {
                closeHowto();
                return;
            }

            if (e.code !== "Space") return;
            if (gameState.screen !== "GAME") return;

            const activeTag = document.activeElement ? document.activeElement.tagName : "";
            if (activeTag === "INPUT" || activeTag === "TEXTAREA") return;

            e.preventDefault();
            if (e.repeat) return;

            if (gameState.phase === "PLAYING") {
                attemptThrowKnife();
            }
        });

        dom.btnPlayAgain.addEventListener("click", () => {
            sound.playUiClick();
            const [p1, p2] = gameState.players;
            if (p1 && p2) {
                startNewMatch(p1.name, p2.name);
            } else {
                showScreen("setup");
            }
        });

        dom.btnResultsMenu.addEventListener("click", () => {
            sound.playUiClick();
            showScreen("menu");
        });

        window.addEventListener("resize", () => {
            if (gameState.screen === "GAME") {
                resizeCanvas();
            }
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                sound.stopMusicLoop();
            } else if (sound.unlocked && audioSettings.musicEnabled && sound.currentTrack) {
                sound.startMusicLoop();
            }
        });
    }

    /* =========================================================================
       14. INICIALIZAÇÃO
    ========================================================================= */
    function init() {
        renderMiniBloxProfile();
        renderMenuRecords();
        syncAudioUi();
        bindEvents();
        showScreen("menu");
        startMainLoopOnce();
    }

    init();
})();