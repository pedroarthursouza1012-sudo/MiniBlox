(() => {
    "use strict";

    /* =========================================================================
       1. DADOS BASE: 20 CLUBES DA SÉRIE A 2026, PELES, CABELOS E CONSTANTES
    ========================================================================= */
    const STORAGE_KEYS = {
        HISTORY: "futblox_historico",
        AUDIO: "futblox_audio_v1"
    };

    const SKIN_TONES = [
        { id: "claro", label: "Claro", hex: "#ffd2b8" },
        { id: "medio-claro", label: "Médio-claro", hex: "#f0b18c" },
        { id: "medio", label: "Médio", hex: "#d88c5a" },
        { id: "medio-escuro", label: "Médio-escuro", hex: "#a65e38" },
        { id: "escuro", label: "Escuro", hex: "#6d3b22" }
    ];

    const HAIR_COLORS = [
        { id: "preto", label: "Preto", hex: "#202126" },
        { id: "castanho", label: "Castanho", hex: "#6f3c23" },
        { id: "loiro", label: "Loiro", hex: "#f5cb38" },
        { id: "ruivo", label: "Ruivo", hex: "#c94a24" },
        { id: "branco", label: "Branco", hex: "#dce2e8" }
    ];

    const HAIRSTYLES = {
        masculino: [
            { id: "curto_espetado", label: "Curto Espetado" },
            { id: "curto_classico", label: "Curto Clássico" },
            { id: "topete", label: "Topete" }
        ],
        feminino: [
            { id: "longo_solto", label: "Longo Solto" },
            { id: "rabo_cavalo", label: "Rabo de Cavalo" },
            { id: "duas_marias", label: "Coque Duplo" }
        ]
    };

    // Todos os 20 clubes obrigatórios da Série A do Brasileirão 2026
    const CLUBS = [
        { id: "athletico", name: "Athletico Paranaense", short: "CAP", pattern: "diag-red-black", colors: ["#d71920", "#141414", "#ffffff"], textOnMain: "#ffffff" },
        { id: "atletico-mg", name: "Atlético Mineiro", short: "CAM", pattern: "vstripes-bw", colors: ["#141414", "#ffffff", "#ffcf40"], textOnMain: "#ffffff" },
        { id: "bahia", name: "Bahia", short: "BAH", pattern: "tricolor-bah", colors: ["#005ca9", "#d71920", "#ffffff"], textOnMain: "#ffffff" },
        { id: "botafogo", name: "Botafogo", short: "BOT", pattern: "vstripes-bw", colors: ["#141414", "#ffffff", "#2c2c2c"], textOnMain: "#ffffff" },
        { id: "chapecoense", name: "Chapecoense", short: "CHA", pattern: "solid-trim", colors: ["#00843d", "#ffffff", "#00612d"], textOnMain: "#ffffff" },
        { id: "corinthians", name: "Corinthians", short: "COR", pattern: "white-shoulders", colors: ["#ffffff", "#141414", "#d4d4d4"], textOnMain: "#000000" },
        { id: "coritiba", name: "Coritiba", short: "CFC", pattern: "white-chest-band", colors: ["#ffffff", "#00723b", "#141414"], textOnMain: "#000000" },
        { id: "cruzeiro", name: "Cruzeiro", short: "CRU", pattern: "solid-trim", colors: ["#0055a4", "#ffffff", "#003d7a"], textOnMain: "#ffffff" },
        { id: "flamengo", name: "Flamengo", short: "FLA", pattern: "hstripes-rb", colors: ["#d71920", "#141414", "#ffffff"], textOnMain: "#ffffff" },
        { id: "fluminense", name: "Fluminense", short: "FLU", pattern: "tricolor-flu", colors: ["#7b1535", "#006b45", "#ffffff"], textOnMain: "#ffffff" },
        { id: "gremio", name: "Grêmio", short: "GRE", pattern: "tricolor-gre", colors: ["#0082ca", "#141414", "#ffffff"], textOnMain: "#ffffff" },
        { id: "internacional", name: "Internacional", short: "INT", pattern: "solid-trim", colors: ["#d71920", "#ffffff", "#a80d13"], textOnMain: "#ffffff" },
        { id: "mirassol", name: "Mirassol", short: "MIR", pattern: "solid-trim", colors: ["#ffdf00", "#008b45", "#ffffff"], textOnMain: "#000000" },
        { id: "palmeiras", name: "Palmeiras", short: "PAL", pattern: "solid-trim", colors: ["#006437", "#ffffff", "#004b29"], textOnMain: "#ffffff" },
        { id: "bragantino", name: "Red Bull Bragantino", short: "RBB", pattern: "white-red-accent", colors: ["#ffffff", "#d71920", "#1d3557"], textOnMain: "#000000" },
        { id: "remo", name: "Remo", short: "REM", pattern: "solid-trim", colors: ["#0c2340", "#ffffff", "#1e4475"], textOnMain: "#ffffff" },
        { id: "santos", name: "Santos", short: "SAN", pattern: "white-gold", colors: ["#ffffff", "#141414", "#ffcf40"], textOnMain: "#000000" },
        { id: "sao-paulo", name: "São Paulo", short: "SAO", pattern: "tricolor-sp", colors: ["#ffffff", "#d71920", "#141414"], textOnMain: "#000000" },
        { id: "vasco", name: "Vasco", short: "VAS", pattern: "sash-black-white", colors: ["#141414", "#ffffff", "#d71920"], textOnMain: "#ffffff" },
        { id: "vitoria", name: "Vitória", short: "VIT", pattern: "vstripes-rb", colors: ["#d71920", "#141414", "#ffffff"], textOnMain: "#ffffff" }
    ];

    const FIELD = {
        CANVAS_W: 1100,
        CANVAS_H: 640,
        LEFT: 72,
        RIGHT: 1028,
        TOP: 42,
        BOTTOM: 598,
        CENTER_X: 550,
        CENTER_Y: 320,
        GOAL_HALF_H: 82,
        GOAL_DEPTH: 48,
        POST_RADIUS: 8
    };

    const HALF_DURATION_SEC = 180; // 3 minutos cada tempo
    const HALFTIME_DURATION_SEC = 10; // 10 segundos de intervalo
    const FIXED_PHYSICS_DT = 1 / 120;

    function getClubById(id) {
        return CLUBS.find(c => c.id === id) || CLUBS[0];
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function safeReadJSON(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return fallback;
            const parsed = JSON.parse(raw);
            return parsed !== null && typeof parsed === "object" ? parsed : fallback;
        } catch {
            return fallback;
        }
    }

    function safeWriteJSON(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch {
            /* Ignora falha de quota */
        }
    }

    /* =========================================================================
       2. HISTÓRICO DE PARTIDAS (FUTBLOX_HISTORICO)
    ========================================================================= */
    function loadHistory() {
        const list = safeReadJSON(STORAGE_KEYS.HISTORY, []);
        return Array.isArray(list) ? list : [];
    }

    function saveHistoryList(list) {
        safeWriteJSON(STORAGE_KEYS.HISTORY, list.slice(0, 100));
    }

    function formatBrazilianDate(ts) {
        const d = new Date(ts);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return { dateFormatted: `${day}/${month}/${year}`, timeFormatted: `${hh}:${mm}` };
    }

    function recordFinishedMatch(p1, p2) {
        const now = Date.now();
        const { dateFormatted, timeFormatted } = formatBrazilianDate(now);
        const entry = {
            id: `fb_${now}_${Math.random().toString(36).slice(2, 7)}`,
            timestamp: now,
            dateFormatted,
            timeFormatted,
            p1: {
                name: p1.name,
                score: p1.score,
                clubId: p1.clubId,
                clubName: getClubById(p1.clubId).name,
                gender: p1.gender,
                hairStyle: p1.hairStyle,
                skin: p1.skin,
                hairColor: p1.hairColor
            },
            p2: {
                name: p2.name,
                score: p2.score,
                clubId: p2.clubId,
                clubName: getClubById(p2.clubId).name,
                gender: p2.gender,
                hairStyle: p2.hairStyle,
                skin: p2.skin,
                hairColor: p2.hairColor
            }
        };

        const current = loadHistory();
        current.unshift(entry); // Mais recentes primeiro
        saveHistoryList(current);
    }

    /* =========================================================================
       3. SISTEMA DE ÁUDIO (WEB AUDIO API)
    ========================================================================= */
    function loadAudioConfig() {
        const def = { musicEnabled: true, sfxEnabled: true, musicVolume: 0.45, sfxVolume: 0.75 };
        const saved = safeReadJSON(STORAGE_KEYS.AUDIO, null);
        if (!saved) return def;
        return {
            musicEnabled: typeof saved.musicEnabled === "boolean" ? saved.musicEnabled : def.musicEnabled,
            sfxEnabled: typeof saved.sfxEnabled === "boolean" ? saved.sfxEnabled : def.sfxEnabled,
            musicVolume: typeof saved.musicVolume === "number" ? clamp(saved.musicVolume, 0, 1) : def.musicVolume,
            sfxVolume: typeof saved.sfxVolume === "number" ? clamp(saved.sfxVolume, 0, 1) : def.sfxVolume
        };
    }

    class FutAudioEngine {
        constructor(config) {
            this.cfg = config;
            this.ctx = null;
            this.musicGain = null;
            this.sfxGain = null;
            this.unlocked = false;
            this.musicPlaying = false;
            this.musicPaused = false;
            this.timer = null;
            this.nextNoteTime = 0;
            this.step = 0;
            this.cooldowns = {};
        }

        unlock() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (!AudioCtx) return;
                this.ctx = new AudioCtx();
                this.musicGain = this.ctx.createGain();
                this.sfxGain = this.ctx.createGain();
                this.musicGain.connect(this.ctx.destination);
                this.sfxGain.connect(this.ctx.destination);
                this.syncGains();
            }
            if (this.ctx.state === "suspended") {
                this.ctx.resume().catch(() => {});
            }
            this.unlocked = true;
            if (this.cfg.musicEnabled && !this.musicPaused && !this.timer) {
                this.startMusic();
            }
        }

        syncGains() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const mTarget = this.cfg.musicEnabled && !this.musicPaused ? this.cfg.musicVolume * 0.22 : 0;
            const sTarget = this.cfg.sfxEnabled ? this.cfg.sfxVolume * 0.65 : 0;
            this.musicGain.gain.setTargetAtTime(mTarget, now, 0.04);
            this.sfxGain.gain.setTargetAtTime(sTarget, now, 0.02);
        }

        updateConfig(partial) {
            Object.assign(this.cfg, partial);
            safeWriteJSON(STORAGE_KEYS.AUDIO, this.cfg);
            this.syncGains();
            if (!this.cfg.musicEnabled || this.musicPaused) {
                this.stopMusicLoop();
            } else if (this.unlocked && !this.timer) {
                this.startMusic();
            }
        }

        setPausedState(isPaused) {
            this.musicPaused = isPaused;
            this.syncGains();
            if (isPaused) {
                this.stopMusicLoop();
            } else if (this.unlocked && this.cfg.musicEnabled && !this.timer) {
                this.startMusic();
            }
        }

        startMusic() {
            if (!this.ctx || !this.cfg.musicEnabled || this.musicPaused || this.timer) return;
            this.nextNoteTime = this.ctx.currentTime + 0.06;

            const schedule = () => {
                if (!this.ctx || !this.cfg.musicEnabled || this.musicPaused) {
                    this.timer = null;
                    return;
                }
                const stepDur = 60 / 118 / 2;
                while (this.nextNoteTime < this.ctx.currentTime + 0.18) {
                    this.playMenuBeat(this.step, this.nextNoteTime, stepDur);
                    this.nextNoteTime += stepDur;
                    this.step = (this.step + 1) % 16;
                }
                this.timer = setTimeout(schedule, 45);
            };
            schedule();
        }

        stopMusicLoop() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        playMenuBeat(step, time, dur) {
            const lead = [523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 659.25, 523.25, 0, 587.33, 659.25, 783.99, 880.0, 783.99, 0];
            const bass = [130.81, 0, 196.0, 0, 146.83, 0, 196.0, 0, 164.81, 0, 196.0, 0, 146.83, 0, 196.0, 0];
            if (lead[step]) this.musicNote(lead[step], time, dur * 0.85, "triangle", 0.2);
            if (bass[step]) this.musicNote(bass[step], time, dur * 1.1, "sine", 0.25);
        }

        musicNote(freq, time, dur, type, vol) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, time);
            g.gain.setValueAtTime(0.0001, time);
            g.gain.linearRampToValueAtTime(vol, time + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
            osc.connect(g);
            g.connect(this.musicGain);
            osc.start(time);
            osc.stop(time + dur + 0.02);
        }

        canPlay(name, ms = 45) {
            if (!this.cfg.sfxEnabled) return false;
            this.unlock();
            if (!this.ctx || !this.sfxGain) return false;
            const now = performance.now();
            if (now - (this.cooldowns[name] || 0) < ms) return false;
            this.cooldowns[name] = now;
            return true;
        }

        tone(f1, f2, dur, type, vol, startOffset = 0) {
            const t = this.ctx.currentTime + startOffset;
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(f1, t);
            osc.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
            g.gain.setValueAtTime(vol, t);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        noiseBurst(dur, filterFreq, vol, startOffset = 0) {
            const bufferSize = Math.floor(this.ctx.sampleRate * dur);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const src = this.ctx.createBufferSource();
            src.buffer = buffer;

            const filter = this.ctx.createBiquadFilter();
            filter.type = "bandpass";
            filter.frequency.value = filterFreq;
            filter.Q.value = 1.1;

            const t = this.ctx.currentTime + startOffset;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.08);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

            src.connect(filter);
            filter.connect(g);
            g.connect(this.sfxGain);
            src.start(t);
            src.stop(t + dur + 0.02);
        }

        playClick() {
            if (!this.canPlay("click", 40)) return;
            this.tone(520, 740, 0.06, "triangle", 0.22);
        }

        playTeamSelect() {
            if (!this.canPlay("team", 60)) return;
            this.tone(440, 660, 0.07, "triangle", 0.24);
            this.tone(660, 880, 0.09, "triangle", 0.22, 0.05);
        }

        playCustomize() {
            if (!this.canPlay("cust", 45)) return;
            this.tone(600, 720, 0.05, "sine", 0.18);
        }

        playWhistle(duration = 0.28, offset = 0) {
            const t = this.ctx.currentTime + offset;
            const osc = this.ctx.createOscillator();
            const lfo = this.ctx.createOscillator();
            const lfoGain = this.ctx.createGain();
            const g = this.ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(2650, t);
            lfo.frequency.setValueAtTime(38, t);
            lfoGain.gain.setValueAtTime(110, t);

            lfo.connect(lfoGain);
            lfoGain.connect(osc.frequency);

            g.gain.setValueAtTime(0.001, t);
            g.gain.linearRampToValueAtTime(0.24, t + 0.02);
            g.gain.setValueAtTime(0.22, t + duration - 0.04);
            g.gain.exponentialRampToValueAtTime(0.0001, t + duration);

            osc.connect(g);
            g.connect(this.sfxGain);
            osc.start(t);
            lfo.start(t);
            osc.stop(t + duration + 0.02);
            lfo.stop(t + duration + 0.02);
        }

        playMatchStart() {
            if (!this.canPlay("mstart", 200)) return;
            this.playWhistle(0.32);
        }

        playBallKick(intensity) {
            if (!this.canPlay("kick", 45)) return;
            const power = clamp(intensity, 0.15, 1);
            this.tone(155 + power * 70, 58, 0.09, "triangle", 0.22 + power * 0.35);
        }

        playPostHit() {
            if (!this.canPlay("post", 70)) return;
            this.tone(920, 640, 0.22, "square", 0.22);
            this.tone(1380, 950, 0.18, "triangle", 0.24);
        }

        playWallBounce() {
            if (!this.canPlay("wall", 60)) return;
            this.tone(130, 72, 0.07, "sine", 0.18);
        }

        playGoal() {
            if (!this.canPlay("goal", 400)) return;
            this.playWhistle(0.18, 0);
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
                this.tone(f, f * 1.02, 0.26, "triangle", 0.28, 0.08 + i * 0.09);
            });
            this.noiseBurst(1.35, 950, 0.32, 0.1);
        }

        playHalftimeStart() {
            if (!this.canPlay("htstart", 300)) return;
            this.playWhistle(0.16, 0);
            this.playWhistle(0.28, 0.24);
        }

        playHalftimeEnd() {
            if (!this.canPlay("htend", 300)) return;
            this.playWhistle(0.32, 0);
        }

        playMatchEnd() {
            if (!this.canPlay("mend", 400)) return;
            this.playWhistle(0.18, 0);
            this.playWhistle(0.18, 0.24);
            this.playWhistle(0.45, 0.48);
        }

        playVictory() {
            if (!this.canPlay("vic", 300)) return;
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
                this.tone(f, f, 0.24, "triangle", 0.26, 0.15 + i * 0.1);
            });
            this.noiseBurst(1.1, 1100, 0.22, 0.2);
        }

        playDraw() {
            if (!this.canPlay("draw", 300)) return;
            [440, 523.25, 440].forEach((f, i) => {
                this.tone(f, f, 0.2, "triangle", 0.22, 0.15 + i * 0.14);
            });
        }
    }

    /* =========================================================================
       4. DESENHO DOS AVATARES, CAMISAS E CABEÇAS (CANVAS 2D)
    ========================================================================= */
    function drawJerseyRect(ctx, x, y, w, h, club) {
        const [c1, c2, c3] = club.colors;
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 5);
        ctx.clip();

        ctx.fillStyle = c1;
        ctx.fillRect(x, y, w, h);

        switch (club.pattern) {
            case "hstripes-rb":
                ctx.fillStyle = c2;
                for (let sy = y; sy < y + h; sy += h * 0.34) {
                    ctx.fillRect(x, sy, w, h * 0.17);
                }
                break;
            case "vstripes-bw":
            case "vstripes-rb":
                ctx.fillStyle = c2;
                for (let sx = x; sx < x + w; sx += w * 0.34) {
                    ctx.fillRect(sx, y, w * 0.17, h);
                }
                break;
            case "diag-red-black":
                ctx.fillStyle = c2;
                ctx.beginPath();
                ctx.moveTo(x - 4, y + h * 0.45);
                ctx.lineTo(x + w + 4, y - 2);
                ctx.lineTo(x + w + 4, y + h * 0.38);
                ctx.lineTo(x - 4, y + h * 0.85);
                ctx.closePath();
                ctx.fill();
                break;
            case "tricolor-flu":
                ctx.fillStyle = c3;
                ctx.fillRect(x + w * 0.22, y, w * 0.12, h);
                ctx.fillRect(x + w * 0.66, y, w * 0.12, h);
                ctx.fillStyle = c2;
                ctx.fillRect(x + w * 0.34, y, w * 0.32, h);
                break;
            case "tricolor-gre":
                ctx.fillStyle = c2;
                ctx.fillRect(x + w * 0.33, y, w * 0.34, h);
                ctx.fillStyle = c3;
                ctx.fillRect(x + w * 0.27, y, w * 0.06, h);
                ctx.fillRect(x + w * 0.67, y, w * 0.06, h);
                break;
            case "tricolor-bah":
                ctx.fillStyle = c2;
                ctx.fillRect(x, y + h * 0.35, w, h * 0.28);
                ctx.fillStyle = c3;
                ctx.fillRect(x, y + h * 0.63, w, h * 0.14);
                break;
            case "tricolor-sp":
                ctx.fillStyle = c2;
                ctx.fillRect(x, y + h * 0.28, w, h * 0.18);
                ctx.fillStyle = c3;
                ctx.fillRect(x, y + h * 0.5, w, h * 0.18);
                break;
            case "white-chest-band":
                ctx.fillStyle = c2;
                ctx.fillRect(x, y + h * 0.3, w, h * 0.34);
                break;
            case "sash-black-white":
                ctx.fillStyle = c2;
                ctx.beginPath();
                ctx.moveTo(x - 2, y);
                ctx.lineTo(x + w * 0.34, y);
                ctx.lineTo(x + w + 2, y + h);
                ctx.lineTo(x + w * 0.66, y + h);
                ctx.closePath();
                ctx.fill();
                break;
            case "white-shoulders":
                ctx.fillStyle = c2;
                ctx.fillRect(x, y, w * 0.22, h * 0.35);
                ctx.fillRect(x + w * 0.78, y, w * 0.22, h * 0.35);
                break;
            case "white-red-accent":
                ctx.fillStyle = c2;
                ctx.fillRect(x, y + h * 0.72, w, h * 0.28);
                ctx.fillStyle = c3;
                ctx.fillRect(x, y, w, h * 0.18);
                break;
            case "white-gold":
                ctx.fillStyle = c3;
                ctx.fillRect(x, y, w, h * 0.16);
                ctx.fillStyle = c2;
                ctx.fillRect(x, y + h * 0.84, w, h * 0.16);
                break;
            case "solid-trim":
            default:
                ctx.fillStyle = c2;
                ctx.fillRect(x, y, w, h * 0.16);
                break;
        }
        ctx.restore();

        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 5);
        ctx.stroke();
    }

    function drawHairAndHead(ctx, cx, cy, r, charData, lookAngle = 0, blink = false) {
        ctx.save();
        ctx.translate(cx, cy);

        // Cabelo traseiro feminino (fica atrás da cabeça)
        if (charData.gender === "feminino") {
            ctx.fillStyle = charData.hairColor;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.4;

            if (charData.hairStyle === "rabo_cavalo") {
                ctx.beginPath();
                ctx.ellipse(-r * 0.82, 2, r * 0.52, r * 0.72, 0.35, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else if (charData.hairStyle === "duas_marias") {
                ctx.beginPath();
                ctx.arc(-r * 0.85, -r * 0.55, r * 0.44, 0, Math.PI * 2);
                ctx.arc(r * 0.85, -r * 0.55, r * 0.44, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            } else {
                // longo_solto
                ctx.beginPath();
                ctx.roundRect(-r * 1.12, -r * 0.45, r * 2.24, r * 1.75, 10);
                ctx.fill();
                ctx.stroke();
            }
        }

        // Cabeça estilizada MiniBlox (quadrado bem arredondado)
        ctx.fillStyle = charData.skin;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.42);
        ctx.fill();
        ctx.stroke();

        // Olhos acompanhando levemente a direção do movimento
        const lookX = Math.cos(lookAngle) * (r * 0.14);
        const lookY = Math.sin(lookAngle) * (r * 0.1);
        const eyeH = blink ? 2 : r * 0.46;

        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.roundRect(-r * 0.42 + lookX, -r * 0.12 + lookY - eyeH * 0.5, r * 0.22, eyeH, 2);
        ctx.roundRect(r * 0.2 + lookX, -r * 0.12 + lookY - eyeH * 0.5, r * 0.22, eyeH, 2);
        ctx.fill();

        // Topo do cabelo + franja
        ctx.fillStyle = charData.hairColor;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.2;

        if (charData.gender === "masculino") {
            if (charData.hairStyle === "topete") {
                ctx.beginPath();
                ctx.moveTo(-r, -r * 0.45);
                ctx.quadraticCurveTo(-r * 0.3, -r * 1.48, r * 0.9, -r * 0.82);
                ctx.lineTo(r, -r * 0.42);
                ctx.lineTo(-r, -r * 0.42);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            } else if (charData.hairStyle === "curto_classico") {
                ctx.beginPath();
                ctx.roundRect(-r, -r, r * 2, r * 0.62, [r * 0.42, r * 0.42, 3, 3]);
                ctx.fill();
                ctx.stroke();
            } else {
                // curto_espetado
                ctx.beginPath();
                ctx.moveTo(-r, -r * 0.42);
                ctx.lineTo(-r, -r * 0.88);
                ctx.lineTo(-r * 0.5, -r * 1.25);
                ctx.lineTo(-r * 0.1, -r * 0.96);
                ctx.lineTo(r * 0.25, -r * 1.28);
                ctx.lineTo(r * 0.65, -r * 0.95);
                ctx.lineTo(r, -r * 0.9);
                ctx.lineTo(r, -r * 0.42);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        } else {
            // Franja feminina
            ctx.beginPath();
            ctx.roundRect(-r * 1.03, -r * 1.05, r * 2.06, r * 0.66, [r * 0.48, r * 0.48, 6, 6]);
            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawFullMiniBloxPlayer(ctx, x, y, playerData, animTime, isPreview = false) {
        const club = getClubById(playerData.clubId);
        const speed = isPreview ? 0 : Math.hypot(playerData.vx || 0, playerData.vy || 0);
        const isMoving = speed > 15;
        const swingPhase = isMoving ? Math.sin(animTime * 14) * clamp(speed / 240, 0.35, 1) : 0;
        const idleBob = isMoving ? Math.abs(Math.sin(animTime * 14)) * 2.5 : Math.sin(animTime * 3.2) * 1.4;
        const scale = isPreview ? 1.45 : 0.88;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);

        // Marcador de identificação do jogador (azul P1 / vermelho P2) sem alterar a camisa
        if (!isPreview) {
            const ringColor = playerData.slot === 1 ? "#1f7bff" : "#ff3b3b";
            ctx.save();
            ctx.strokeStyle = ringColor;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(0, 12, 23, 14, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Sombra no gramado
            ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
            ctx.beginPath();
            ctx.ellipse(0, 12, 18, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
            ctx.beginPath();
            ctx.ellipse(0, 42, 24, 8, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        const bodyYOffset = isPreview ? 0 : -14;
        ctx.translate(0, bodyYOffset - idleBob);

        // Pernas articuladas: Bermuda azul obrigatória + meias + chuteiras
        const leftLegSwing = swingPhase * 7;
        const rightLegSwing = -swingPhase * 7;

        const drawLeg = (lx, swing) => {
            ctx.save();
            ctx.translate(lx, 12 + swing * 0.4);

            // Bermuda azul padrão MiniBlox para todos os times
            ctx.fillStyle = "#1e4fa3";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-5, 0, 10, 10, 2);
            ctx.fill();
            ctx.stroke();

            // Meia
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.roundRect(-4.5, 9, 9, 7, 2);
            ctx.fill();
            ctx.stroke();

            // Chuteira
            ctx.fillStyle = "#171717";
            ctx.beginPath();
            ctx.roundRect(-5, 15, 10, 6, 3);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

        drawLeg(-6, leftLegSwing);
        drawLeg(6, rightLegSwing);

        // Braços articulados com tom de pele
        const drawArm = (ax, swing) => {
            ctx.save();
            ctx.translate(ax, -5 + swing * 0.5);
            ctx.fillStyle = playerData.skin;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-4, 0, 8, 17, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

        drawArm(-15, -swingPhase * 6);
        drawArm(15, swingPhase * 6);

        // Tronco compacto vestindo a camisa do clube escolhido
        drawJerseyRect(ctx, -12, -8, 24, 22, club);

        // Cabeça grande proporcional MiniBlox
        const blink = (animTime % 4) > 3.86;
        drawHairAndHead(ctx, 0, -21, 14, playerData, playerData.facingAngle || 0, blink);

        // Etiqueta discreta J1 / J2 acima do personagem em jogo
        if (!isPreview) {
            ctx.fillStyle = playerData.slot === 1 ? "#1f7bff" : "#ff3b3b";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-12, -48, 24, 13, 4);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ffffff";
            ctx.font = "700 9px 'Space Grotesk', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`J${playerData.slot}`, 0, -41);
        }

        ctx.restore();
    }

    function drawHistoryHeadToCanvas(canvas, charSnap) {
        const c = canvas.getContext("2d");
        c.clearRect(0, 0, canvas.width, canvas.height);
        drawHairAndHead(c, canvas.width / 2, canvas.height * 0.54, 18, charSnap, 0, false);
    }

    /* =========================================================================
       5. GERENCIAMENTO DE ESTADO DA PARTIDA, FÍSICA E RENDERIZAÇÃO
    ========================================================================= */
    const state = {
        mode: "menu", // menu | configuracao | jogando | pausado | intervalo | gol | finalizado | historico
        pausedFromMode: null,
        lastPauseToggleAt: 0,
        matchSavedToHistory: false,

        targetPickerSlot: 1, // 1 ou 2 na tela de configuração
        activeConfirmCallback: null,
        settingsOrigin: "menu", // menu | pausa

        // Config dos jogadores
        p1: {
            slot: 1,
            name: "Jogador 1",
            gender: "masculino",
            hairStyle: "curto_espetado",
            skin: SKIN_TONES[1].hex,
            hairColor: HAIR_COLORS[0].hex,
            clubId: "flamengo",
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 21,
            facingAngle: 0,
            score: 0
        },
        p2: {
            slot: 2,
            name: "Jogador 2",
            gender: "feminino",
            hairStyle: "longo_solto",
            skin: SKIN_TONES[0].hex,
            hairColor: HAIR_COLORS[1].hex,
            clubId: "palmeiras",
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            radius: 21,
            facingAngle: Math.PI,
            score: 0
        },

        // Bola
        ball: {
            x: FIELD.CENTER_X,
            y: FIELD.CENTER_Y,
            vx: 0,
            vy: 0,
            radius: 14,
            rotation: 0,
            spinVel: 0
        },

        // Tempo e Lados
        half: 1, // 1 ou 2
        halfTimeLeft: HALF_DURATION_SEC,
        halftimeLeft: HALFTIME_DURATION_SEC,
        sidesSwapped: false, // false no 1º tempo (J1 defende esquerda), true no 2º tempo (J1 defende direita)

        // Animação de Gol
        goalScoredLock: false,
        goalTimer: 0,
        goalDuration: 2.35,
        goalScoringSlot: 1,
        goalBannerText: "",
        goalClubColors: ["#ffcf40", "#111111"],
        netRippleLeft: 0,
        netRippleRight: 0,

        // Partículas e loop
        particles: [],
        keys: new Set(),
        physicsAccumulator: 0,
        animClock: 0,
        rafId: null,
        lastFrameTs: 0
    };

    const audioConfig = loadAudioConfig();
    const audio = new FutAudioEngine(audioConfig);

    /* =========================================================================
       6. ELEMENTOS DOM
    ========================================================================= */
    const dom = {
        screens: {
            menu: document.getElementById("screen-menu"),
            setup: document.getElementById("screen-setup"),
            game: document.getElementById("screen-game"),
            results: document.getElementById("screen-results"),
            history: document.getElementById("screen-history")
        },
        quickMusicBtn: document.getElementById("quick-music-btn"),
        quickSfxBtn: document.getElementById("quick-sfx-btn"),

        // Menu
        btnMenuPlay: document.getElementById("btn-menu-play"),
        btnMenuHistory: document.getElementById("btn-menu-history"),
        btnMenuHowto: document.getElementById("btn-menu-howto"),
        btnMenuSettings: document.getElementById("btn-menu-settings"),

        // Setup
        btnSetupBack: document.getElementById("btn-setup-back"),
        btnTargetP1: document.getElementById("btn-target-p1"),
        btnTargetP2: document.getElementById("btn-target-p2"),
        tabPickP1: document.getElementById("tab-pick-p1"),
        tabPickP2: document.getElementById("tab-pick-p2"),
        clubTargetIndicator: document.getElementById("club-target-indicator"),
        clubsGrid: document.getElementById("clubs-grid"),
        setupError: document.getElementById("setup-error"),
        btnStartMatch: document.getElementById("btn-start-match"),

        p1PreviewCanvas: document.getElementById("p1-preview-canvas"),
        p2PreviewCanvas: document.getElementById("p2-preview-canvas"),
        p1ClubPill: document.getElementById("p1-club-pill"),
        p2ClubPill: document.getElementById("p2-club-pill"),
        p1NameInput: document.getElementById("p1-name-input"),
        p2NameInput: document.getElementById("p2-name-input"),
        p1GenderSelect: document.getElementById("p1-gender-select"),
        p2GenderSelect: document.getElementById("p2-gender-select"),
        p1HairStyleSelect: document.getElementById("p1-hairstyle-select"),
        p2HairStyleSelect: document.getElementById("p2-hairstyle-select"),
        p1SkinSwatches: document.getElementById("p1-skin-swatches"),
        p2SkinSwatches: document.getElementById("p2-skin-swatches"),
        p1HairSwatches: document.getElementById("p1-hair-swatches"),
        p2HairSwatches: document.getElementById("p2-hair-swatches"),

        // HUD e Partida
        hudP1Name: document.getElementById("hud-p1-name"),
        hudP2Name: document.getElementById("hud-p2-name"),
        hudP1Club: document.getElementById("hud-p1-club"),
        hudP2Club: document.getElementById("hud-p2-club"),
        hudP1Score: document.getElementById("hud-p1-score"),
        hudP2Score: document.getElementById("hud-p2-score"),
        hudHalfLabel: document.getElementById("hud-half-label"),
        hudClock: document.getElementById("hud-clock"),
        btnPauseHud: document.getElementById("btn-pause-hud"),
        gameCanvas: document.getElementById("game-canvas"),

        overlayHalftime: document.getElementById("overlay-halftime"),
        htP1Club: document.getElementById("ht-p1-club"),
        htP2Club: document.getElementById("ht-p2-club"),
        htP1Score: document.getElementById("ht-p1-score"),
        htP2Score: document.getElementById("ht-p2-score"),
        htCountdown: document.getElementById("ht-countdown"),

        overlayPause: document.getElementById("overlay-pause"),
        btnPauseResume: document.getElementById("btn-pause-resume"),
        btnPauseAudio: document.getElementById("btn-pause-audio"),
        btnPauseRestart: document.getElementById("btn-pause-restart"),
        btnPauseMenu: document.getElementById("btn-pause-menu"),

        // Resultados
        resultsTrophy: document.getElementById("results-trophy"),
        resultsHeading: document.getElementById("results-heading"),
        resultsWinnerText: document.getElementById("results-winner-text"),
        resP1Col: document.getElementById("res-p1-col"),
        resP2Col: document.getElementById("res-p2-col"),
        resP1Canvas: document.getElementById("res-p1-canvas"),
        resP2Canvas: document.getElementById("res-p2-canvas"),
        resP1Name: document.getElementById("res-p1-name"),
        resP2Name: document.getElementById("res-p2-name"),
        resP1Club: document.getElementById("res-p1-club"),
        resP2Club: document.getElementById("res-p2-club"),
        resP1Score: document.getElementById("res-p1-score"),
        resP2Score: document.getElementById("res-p2-score"),
        btnResultsRematch: document.getElementById("btn-results-rematch"),
        btnResultsHistory: document.getElementById("btn-results-history"),
        btnResultsMenu: document.getElementById("btn-results-menu"),

        // Histórico
        historyEmpty: document.getElementById("history-empty"),
        historyList: document.getElementById("history-list"),
        btnHistoryClear: document.getElementById("btn-history-clear"),
        btnHistoryBack: document.getElementById("btn-history-back"),
        btnEmptyBack: document.getElementById("btn-empty-back"),

        // Modais
        modalHowto: document.getElementById("modal-howto"),
        btnCloseHowto: document.getElementById("btn-close-howto"),
        btnOkHowto: document.getElementById("btn-ok-howto"),

        modalSettings: document.getElementById("modal-settings"),
        btnCloseSettings: document.getElementById("btn-close-settings"),
        btnOkSettings: document.getElementById("btn-ok-settings"),
        setMusicToggle: document.getElementById("set-music-toggle"),
        setSfxToggle: document.getElementById("set-sfx-toggle"),
        setMusicVol: document.getElementById("set-music-vol"),
        setSfxVol: document.getElementById("set-sfx-vol"),
        setMusicVal: document.getElementById("set-music-val"),
        setSfxVal: document.getElementById("set-sfx-val"),

        modalConfirm: document.getElementById("modal-confirm"),
        confirmTitle: document.getElementById("confirm-title"),
        confirmMessage: document.getElementById("confirm-message"),
        btnConfirmCancel: document.getElementById("btn-confirm-cancel"),
        btnConfirmYes: document.getElementById("btn-confirm-yes")
    };

    const gameCtx = dom.gameCanvas.getContext("2d");

    /* =========================================================================
       7. CONTROLE DE TELAS, PERSONALIZAÇÃO E SELEÇÃO DOS 20 CLUBES
    ========================================================================= */
    function switchScreen(screenName, modeName) {
        Object.entries(dom.screens).forEach(([k, el]) => {
            el.classList.toggle("active", k === screenName);
        });
        state.mode = modeName;
        state.keys.clear();

        if (screenName !== "game") {
            dom.overlayPause.classList.add("hidden");
            dom.overlayHalftime.classList.add("hidden");
        }
    }

    function syncAudioControlsUI() {
        const mOn = audioConfig.musicEnabled;
        const sOn = audioConfig.sfxEnabled;

        dom.quickMusicBtn.textContent = mOn ? "🎵 Música: ON" : "🎵 Música: OFF";
        dom.quickMusicBtn.classList.toggle("is-muted", !mOn);
        dom.quickMusicBtn.setAttribute("aria-pressed", String(mOn));

        dom.quickSfxBtn.textContent = sOn ? "🔊 Efeitos: ON" : "🔇 Efeitos: OFF";
        dom.quickSfxBtn.classList.toggle("is-muted", !sOn);
        dom.quickSfxBtn.setAttribute("aria-pressed", String(sOn));

        dom.setMusicToggle.textContent = mOn ? "ON" : "OFF";
        dom.setMusicToggle.classList.toggle("is-muted", !mOn);

        dom.setSfxToggle.textContent = sOn ? "ON" : "OFF";
        dom.setSfxToggle.classList.toggle("is-muted", !sOn);

        const mPct = Math.round(audioConfig.musicVolume * 100);
        const sPct = Math.round(audioConfig.sfxVolume * 100);
        dom.setMusicVol.value = String(mPct);
        dom.setSfxVol.value = String(sPct);
        dom.setMusicVal.textContent = `${mPct}%`;
        dom.setSfxVal.textContent = `${sPct}%`;
    }

    function populateHairstylesForPlayer(player, selectEl) {
        const list = HAIRSTYLES[player.gender] || HAIRSTYLES.masculino;
        selectEl.innerHTML = "";
        list.forEach(item => {
            const opt = document.createElement("option");
            opt.value = item.id;
            opt.textContent = item.label;
            selectEl.appendChild(opt);
        });
        if (!list.some(h => h.id === player.hairStyle)) {
            player.hairStyle = list[0].id;
        }
        selectEl.value = player.hairStyle;
    }

    function buildSwatchGroup(container, palette, currentHex, onSelect) {
        container.innerHTML = "";
        palette.forEach(item => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "swatch-btn" + (item.hex === currentHex ? " is-selected" : "");
            btn.style.backgroundColor = item.hex;
            btn.title = item.label;
            btn.setAttribute("aria-label", item.label);
            btn.addEventListener("click", () => {
                audio.playCustomize();
                onSelect(item.hex);
                Array.from(container.children).forEach(ch => ch.classList.remove("is-selected"));
                btn.classList.add("is-selected");
            });
            container.appendChild(btn);
        });
    }

    function setClubTargetSlot(slot) {
        state.targetPickerSlot = slot;
        dom.btnTargetP1.classList.toggle("active-picker", slot === 1);
        dom.btnTargetP2.classList.toggle("active-picker", slot === 2);
        dom.tabPickP1.classList.toggle("is-active", slot === 1);
        dom.tabPickP2.classList.toggle("is-active", slot === 2);
        dom.clubTargetIndicator.innerHTML = `Escolhendo time para: <strong>Jogador ${slot}</strong>`;
        renderClubsGrid();
    }

    function applyClubThumbCss(thumbEl, club) {
        const [c1, c2, c3] = club.colors;
        if (club.pattern === "hstripes-rb") {
            thumbEl.style.background = `repeating-linear-gradient(180deg, ${c1} 0 6px, ${c2} 6px 12px)`;
        } else if (club.pattern === "vstripes-bw" || club.pattern === "vstripes-rb") {
            thumbEl.style.background = `repeating-linear-gradient(90deg, ${c1} 0 6px, ${c2} 6px 12px)`;
        } else if (club.pattern === "diag-red-black" || club.pattern === "sash-black-white") {
            thumbEl.style.background = `linear-gradient(135deg, ${c1} 35%, ${c2} 35% 65%, ${c1} 65%)`;
        } else if (club.pattern.startsWith("tricolor")) {
            thumbEl.style.background = `linear-gradient(90deg, ${c1} 0 33%, ${c3} 33% 66%, ${c2} 66% 100%)`;
        } else if (club.pattern === "white-chest-band" || club.pattern === "white-red-accent") {
            thumbEl.style.background = `linear-gradient(180deg, ${c1} 0 35%, ${c2} 35% 68%, ${c1} 68%)`;
        } else {
            thumbEl.style.background = `linear-gradient(135deg, ${c1} 72%, ${c2} 72%)`;
        }
    }

    function renderClubsGrid() {
        dom.clubsGrid.innerHTML = "";
        const targetSlot = state.targetPickerSlot;
        const otherPlayer = targetSlot === 1 ? state.p2 : state.p1;

        CLUBS.forEach(club => {
            const ownedByP1 = state.p1.clubId === club.id;
            const ownedByP2 = state.p2.clubId === club.id;
            const blocked = otherPlayer.clubId === club.id;

            const card = document.createElement("button");
            card.type = "button";
            card.className = "club-card";
            if (ownedByP1) card.classList.add("selected-p1");
            if (ownedByP2) card.classList.add("selected-p2");
            if (blocked) {
                card.classList.add("blocked-club");
                card.disabled = true;
            }

            const top = document.createElement("div");
            top.className = "club-card-top";

            const thumb = document.createElement("div");
            thumb.className = "club-jersey-thumb";
            applyClubThumbCss(thumb, club);

            const info = document.createElement("div");
            info.className = "club-card-info";

            const title = document.createElement("strong");
            title.textContent = club.name;
            title.title = club.name;

            const dots = document.createElement("div");
            dots.className = "club-colors-dots";
            club.colors.forEach(col => {
                const dot = document.createElement("span");
                dot.className = "color-dot";
                dot.style.backgroundColor = col;
                dots.appendChild(dot);
            });

            info.appendChild(title);
            info.appendChild(dots);
            top.appendChild(thumb);
            top.appendChild(info);
            card.appendChild(top);

            if (ownedByP1 || ownedByP2) {
                const tag = document.createElement("span");
                tag.className = "club-owner-tag " + (ownedByP1 ? "owner-p1" : "owner-p2");
                tag.textContent = ownedByP1
                    ? (targetSlot === 2 ? "EM USO PELO J1" : "SELECIONADO (J1)")
                    : (targetSlot === 1 ? "EM USO PELO J2" : "SELECIONADO (J2)");
                card.appendChild(tag);
            }

            card.addEventListener("click", () => {
                selectClubForPlayer(targetSlot, club.id);
            });

            dom.clubsGrid.appendChild(card);
        });

        const c1 = getClubById(state.p1.clubId);
        const c2 = getClubById(state.p2.clubId);
        dom.p1ClubPill.textContent = c1 ? c1.name : "Sem time";
        dom.p2ClubPill.textContent = c2 ? c2.name : "Sem time";
    }

    function selectClubForPlayer(slot, clubId) {
        const player = slot === 1 ? state.p1 : state.p2;
        const other = slot === 1 ? state.p2 : state.p1;

        // Bloqueio rígido em JS contra times repetidos
        if (other.clubId === clubId) {
            dom.setupError.textContent = `O clube ${getClubById(clubId).name} já foi escolhido pelo outro jogador!`;
            dom.setupError.classList.remove("hidden");
            return;
        }

        dom.setupError.classList.add("hidden");
        player.clubId = clubId;
        audio.playTeamSelect();
        renderClubsGrid();
    }

    function renderSetupPreviews() {
        const renderOne = (canvas, player) => {
            const c = canvas.getContext("2d");
            c.clearRect(0, 0, canvas.width, canvas.height);
            drawFullMiniBloxPlayer(c, canvas.width / 2, canvas.height * 0.56, player, state.animClock, true);
        };
        renderOne(dom.p1PreviewCanvas, state.p1);
        renderOne(dom.p2PreviewCanvas, state.p2);
    }

    /* =========================================================================
       8. INÍCIO, RESET, INTERVALO, TROCA DE LADOS E PAUSA
    ========================================================================= */
    function positionPlayersForKickoff() {
        const cy = FIELD.CENTER_Y;
        const offsetFromCenter = 190;

        if (!state.sidesSwapped) {
            // 1º tempo: J1 na esquerda, J2 na direita
            state.p1.x = FIELD.CENTER_X - offsetFromCenter;
            state.p1.y = cy;
            state.p1.facingAngle = 0;

            state.p2.x = FIELD.CENTER_X + offsetFromCenter;
            state.p2.y = cy;
            state.p2.facingAngle = Math.PI;
        } else {
            // 2º tempo (troca de lados): J1 na direita, J2 na esquerda
            state.p1.x = FIELD.CENTER_X + offsetFromCenter;
            state.p1.y = cy;
            state.p1.facingAngle = Math.PI;

            state.p2.x = FIELD.CENTER_X - offsetFromCenter;
            state.p2.y = cy;
            state.p2.facingAngle = 0;
        }

        state.p1.vx = 0;
        state.p1.vy = 0;
        state.p2.vx = 0;
        state.p2.vy = 0;

        state.ball.x = FIELD.CENTER_X;
        state.ball.y = cy;
        state.ball.vx = 0;
        state.ball.vy = 0;
        state.ball.spinVel = 0;
        state.goalScoredLock = false;
    }

    function resetMatchStateAndStart() {
        state.p1.score = 0;
        state.p2.score = 0;
        state.half = 1;
        state.halfTimeLeft = HALF_DURATION_SEC;
        state.halftimeLeft = HALFTIME_DURATION_SEC;
        state.sidesSwapped = false;
        state.goalTimer = 0;
        state.goalScoredLock = false;
        state.matchSavedToHistory = false;
        state.pausedFromMode = null;
        state.particles = [];
        state.netRippleLeft = 0;
        state.netRippleRight = 0;
        state.physicsAccumulator = 0;
        state.keys.clear();

        positionPlayersForKickoff();
        updateMatchHud();

        dom.overlayHalftime.classList.add("hidden");
        dom.overlayPause.classList.add("hidden");
        switchScreen("game", "jogando");

        audio.setPausedState(false);
        audio.playMatchStart();
    }

    function formatClock(secFloat) {
        const totalSec = Math.max(0, Math.ceil(secFloat));
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    function updateMatchHud() {
        dom.hudP1Name.textContent = state.p1.name;
        dom.hudP2Name.textContent = state.p2.name;
        dom.hudP1Club.textContent = getClubById(state.p1.clubId).name;
        dom.hudP2Club.textContent = getClubById(state.p2.clubId).name;
        dom.hudP1Score.textContent = String(state.p1.score);
        dom.hudP2Score.textContent = String(state.p2.score);
        dom.hudHalfLabel.textContent = state.half === 1 ? "1º TEMPO" : "2º TEMPO";
        dom.hudClock.textContent = formatClock(state.halfTimeLeft);
    }

    function pauseMatch() {
        const now = performance.now();
        if (now - state.lastPauseToggleAt < 180) return;
        if (state.mode !== "jogando" && state.mode !== "intervalo" && state.mode !== "gol") return;

        state.lastPauseToggleAt = now;
        state.pausedFromMode = state.mode;
        state.mode = "pausado";
        state.keys.clear();

        audio.setPausedState(true);
        audio.playClick();
        dom.overlayPause.classList.remove("hidden");
    }

    function resumeMatch() {
        const now = performance.now();
        if (now - state.lastPauseToggleAt < 180) return;
        if (state.mode !== "pausado" || !state.pausedFromMode) return;

        state.lastPauseToggleAt = now;
        const restoreMode = state.pausedFromMode;
        state.pausedFromMode = null;
        state.mode = restoreMode;
        state.keys.clear();

        dom.overlayPause.classList.add("hidden");
        audio.setPausedState(false);
        audio.playClick();
    }

    function openConfirmModal(title, message, onConfirm) {
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = message;
        state.activeConfirmCallback = onConfirm;
        dom.modalConfirm.classList.remove("hidden");
    }

    function closeConfirmModal() {
        state.activeConfirmCallback = null;
        dom.modalConfirm.classList.add("hidden");
    }

    /* =========================================================================
       9. FÍSICA (PASSO FIXO 120HZ), COLISÕES E DETECÇÃO DE GOLS
    ========================================================================= */
    function resolveCircleCollision(a, b, restitution) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = a.radius + b.radius;
        const distSq = dx * dx + dy * dy;

        if (distSq >= minDist * minDist) return null;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = minDist - dist;

        return { nx, ny, overlap, dist, restitution };
    }

    function stepPhysics(dt) {
        const goalTop = FIELD.CENTER_Y - FIELD.GOAL_HALF_H;
        const goalBottom = FIELD.CENTER_Y + FIELD.GOAL_HALF_H;

        // 1. Movimentação dos dois jogadores (WASD e Setas simultâneos)
        const updatePlayer = (pl, up, down, left, right) => {
            let ix = 0;
            let iy = 0;
            if (state.keys.has(up)) iy -= 1;
            if (state.keys.has(down)) iy += 1;
            if (state.keys.has(left)) ix -= 1;
            if (state.keys.has(right)) ix += 1;

            const accel = 2050;
            const drag = 1650;
            const maxSpeed = 285;

            if (ix !== 0 || iy !== 0) {
                const len = Math.hypot(ix, iy);
                ix /= len;
                iy /= len;
                pl.vx += ix * accel * dt;
                pl.vy += iy * accel * dt;
                pl.facingAngle = Math.atan2(iy, ix);
            } else {
                const sp = Math.hypot(pl.vx, pl.vy);
                if (sp > 0) {
                    const drop = Math.max(0, sp - drag * dt);
                    pl.vx = (pl.vx / sp) * drop;
                    pl.vy = (pl.vy / sp) * drop;
                }
            }

            const curSpeed = Math.hypot(pl.vx, pl.vy);
            if (curSpeed > maxSpeed) {
                pl.vx = (pl.vx / curSpeed) * maxSpeed;
                pl.vy = (pl.vy / curSpeed) * maxSpeed;
            }

            pl.x += pl.vx * dt;
            pl.y += pl.vy * dt;

            // Respeita limites do campo para jogadores
            pl.x = clamp(pl.x, FIELD.LEFT + pl.radius, FIELD.RIGHT - pl.radius);
            pl.y = clamp(pl.y, FIELD.TOP + pl.radius, FIELD.BOTTOM - pl.radius);
        };

        updatePlayer(state.p1, "w", "s", "a", "d");
        updatePlayer(state.p2, "arrowup", "arrowdown", "arrowleft", "arrowright");

        // 2. Colisão entre os dois jogadores (não podem atravessar um ao outro)
        const ppCol = resolveCircleCollision(state.p1, state.p2, 0.3);
        if (ppCol) {
            const half = ppCol.overlap * 0.5;
            state.p1.x -= ppCol.nx * half;
            state.p1.y -= ppCol.ny * half;
            state.p2.x += ppCol.nx * half;
            state.p2.y += ppCol.ny * half;

            const rvx = state.p2.vx - state.p1.vx;
            const rvy = state.p2.vy - state.p1.vy;
            const vn = rvx * ppCol.nx + rvy * ppCol.ny;
            if (vn < 0) {
                const imp = -(1 + 0.3) * vn * 0.5;
                state.p1.vx -= imp * ppCol.nx;
                state.p1.vy -= imp * ppCol.ny;
                state.p2.vx += imp * ppCol.nx;
                state.p2.vy += imp * ppCol.ny;
            }

            // Re-clampa após separação
            state.p1.x = clamp(state.p1.x, FIELD.LEFT + state.p1.radius, FIELD.RIGHT - state.p1.radius);
            state.p1.y = clamp(state.p1.y, FIELD.TOP + state.p1.radius, FIELD.BOTTOM - state.p1.radius);
            state.p2.x = clamp(state.p2.x, FIELD.LEFT + state.p2.radius, FIELD.RIGHT - state.p2.radius);
            state.p2.y = clamp(state.p2.y, FIELD.TOP + state.p2.radius, FIELD.BOTTOM - state.p2.radius);
        }

        // 3. Movimento da bola e atrito com o gramado
        const b = state.ball;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Desaceleração gradual pelo atrito
        const grassFriction = Math.exp(-1.45 * dt);
        b.vx *= grassFriction;
        b.vy *= grassFriction;
        const bSpeed = Math.hypot(b.vx, b.vy);
        if (bSpeed < 4) {
            b.vx = 0;
            b.vy = 0;
            b.spinVel = 0;
        } else {
            b.spinVel = (bSpeed / b.radius) * (b.vx >= 0 ? 1 : -1);
            b.rotation += b.spinVel * dt;
        }

        // 4. Contato físico entre jogadores e bola
        [state.p1, state.p2].forEach(pl => {
            const pbCol = resolveCircleCollision(pl, b, 0.85);
            if (!pbCol) return;

            // Separa a bola completamente do jogador para nunca ficar presa dentro dele
            b.x += pbCol.nx * (pbCol.overlap + 0.5);
            b.y += pbCol.ny * (pbCol.overlap + 0.5);

            const relVx = b.vx - pl.vx;
            const relVy = b.vy - pl.vy;
            const relVn = relVx * pbCol.nx + relVy * pbCol.ny;

            const playerSpeed = Math.hypot(pl.vx, pl.vy);
            if (relVn < 0) {
                const restitution = 0.78;
                const impulse = -(1 + restitution) * relVn;
                b.vx += impulse * pbCol.nx + pl.vx * 0.35;
                b.vy += impulse * pbCol.ny + pl.vy * 0.35;

                // Garante impulso mínimo suave ao driblar/encostar andando
                if (playerSpeed > 25 && Math.hypot(b.vx, b.vy) < playerSpeed * 1.15) {
                    b.vx += pbCol.nx * 95;
                    b.vy += pbCol.ny * 95;
                }

                const impactPower = clamp((-relVn + playerSpeed * 0.4) / 420, 0.18, 1);
                audio.playBallKick(impactPower);
            } else if (playerSpeed > 10) {
                b.vx += pbCol.nx * 70 + pl.vx * 0.25;
                b.vy += pbCol.ny * 70 + pl.vy * 0.25;
            }
        });

        // Limite máximo de velocidade da bola
        const postKickSpeed = Math.hypot(b.vx, b.vy);
        const MAX_BALL_SPEED = 780;
        if (postKickSpeed > MAX_BALL_SPEED) {
            b.vx = (b.vx / postKickSpeed) * MAX_BALL_SPEED;
            b.vy = (b.vy / postKickSpeed) * MAX_BALL_SPEED;
        }

        // 5. Colisão com as 4 traves circulares
        const posts = [
            { x: FIELD.LEFT, y: goalTop, radius: FIELD.POST_RADIUS },
            { x: FIELD.LEFT, y: goalBottom, radius: FIELD.POST_RADIUS },
            { x: FIELD.RIGHT, y: goalTop, radius: FIELD.POST_RADIUS },
            { x: FIELD.RIGHT, y: goalBottom, radius: FIELD.POST_RADIUS }
        ];

        for (let i = 0; i < posts.length; i++) {
            const post = posts[i];
            const pc = resolveCircleCollision(post, b, 0.85);
            if (!pc) continue;

            b.x += pc.nx * (pc.overlap + 0.5);
            b.y += pc.ny * (pc.overlap + 0.5);
            const vn = b.vx * pc.nx + b.vy * pc.ny;
            if (vn < 0) {
                b.vx -= 1.85 * vn * pc.nx;
                b.vy -= 1.85 * vn * pc.ny;
                audio.playPostHit();
            }
        }

        // 6. Colisão com limites do campo e paredes internas da rede do gol
        if (b.y - b.radius < FIELD.TOP) {
            b.y = FIELD.TOP + b.radius;
            if (b.vy < 0) {
                b.vy = -b.vy * 0.82;
                audio.playWallBounce();
            }
        } else if (b.y + b.radius > FIELD.BOTTOM) {
            b.y = FIELD.BOTTOM - b.radius;
            if (b.vy > 0) {
                b.vy = -b.vy * 0.82;
                audio.playWallBounce();
            }
        }

        const inGoalOpening = b.y > goalTop + FIELD.POST_RADIUS && b.y < goalBottom - FIELD.POST_RADIUS;

        // Extremidade esquerda
        if (b.x - b.radius < FIELD.LEFT) {
            if (!inGoalOpening && b.x > FIELD.LEFT - b.radius * 0.8) {
                b.x = FIELD.LEFT + b.radius;
                if (b.vx < 0) {
                    b.vx = -b.vx * 0.82;
                    audio.playWallBounce();
                }
            } else {
                // Dentro da caixa do gol esquerdo
                if (b.y - b.radius < goalTop) {
                    b.y = goalTop + b.radius;
                    b.vy = Math.abs(b.vy) * 0.4;
                } else if (b.y + b.radius > goalBottom) {
                    b.y = goalBottom - b.radius;
                    b.vy = -Math.abs(b.vy) * 0.4;
                }
                if (b.x - b.radius < FIELD.LEFT - FIELD.GOAL_DEPTH) {
                    b.x = FIELD.LEFT - FIELD.GOAL_DEPTH + b.radius;
                    b.vx = Math.abs(b.vx) * 0.25;
                    state.netRippleLeft = 1;
                }
            }
        }

        // Extremidade direita
        if (b.x + b.radius > FIELD.RIGHT) {
            if (!inGoalOpening && b.x < FIELD.RIGHT + b.radius * 0.8) {
                b.x = FIELD.RIGHT - b.radius;
                if (b.vx > 0) {
                    b.vx = -b.vx * 0.82;
                    audio.playWallBounce();
                }
            } else {
                // Dentro da caixa do gol direito
                if (b.y - b.radius < goalTop) {
                    b.y = goalTop + b.radius;
                    b.vy = Math.abs(b.vy) * 0.4;
                } else if (b.y + b.radius > goalBottom) {
                    b.y = goalBottom - b.radius;
                    b.vy = -Math.abs(b.vy) * 0.4;
                }
                if (b.x + b.radius > FIELD.RIGHT + FIELD.GOAL_DEPTH) {
                    b.x = FIELD.RIGHT + FIELD.GOAL_DEPTH - b.radius;
                    b.vx = -Math.abs(b.vx) * 0.25;
                    state.netRippleRight = 1;
                }
            }
        }

        // 7. Detecção oficial de GOL (bola cruzou completamente a linha dentro da abertura)
        if (!state.goalScoredLock && state.mode === "jogando") {
            const insideMouthY = b.y > goalTop && b.y < goalBottom;
            if (insideMouthY && b.x + b.radius < FIELD.LEFT) {
                // Gol na trave ESQUERDA
                const scoringSlot = state.sidesSwapped ? 1 : 2;
                state.netRippleLeft = 1;
                onGoalScored(scoringSlot);
            } else if (insideMouthY && b.x - b.radius > FIELD.RIGHT) {
                // Gol na trave DIREITA
                const scoringSlot = state.sidesSwapped ? 2 : 1;
                state.netRippleRight = 1;
                onGoalScored(scoringSlot);
            }
        }
    }

    function onGoalScored(scoringSlot) {
        if (state.goalScoredLock || state.mode !== "jogando") return;
        state.goalScoredLock = true;
        state.mode = "gol";
        state.goalTimer = state.goalDuration;
        state.goalScoringSlot = scoringSlot;

        const scorer = scoringSlot === 1 ? state.p1 : state.p2;
        scorer.score += 1;
        const club = getClubById(scorer.clubId);

        state.goalBannerText = `GOOOOOOOL DO ${club.name.toUpperCase()}!`;
        state.goalClubColors = [club.colors[0], club.colors[1]];

        // Partículas de celebração
        const palette = [club.colors[0], club.colors[1], "#ffcf40", "#ffffff"];
        for (let i = 0; i < 48; i++) {
            const ang = Math.random() * Math.PI * 2;
            const spd = 120 + Math.random() * 340;
            state.particles.push({
                x: state.ball.x,
                y: state.ball.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                size: 5 + Math.random() * 6,
                life: 1.0 + Math.random() * 0.7,
                maxLife: 1.7,
                color: palette[i % palette.length]
            });
        }

        updateMatchHud();
        audio.playGoal();
    }

    /* =========================================================================
       10. UPDATE TEMPORAL E RENDERIZAÇÃO DO CAMPO NO CANVAS 2D
    ========================================================================= */
    function updateMatch(dt) {
        state.animClock += dt;

        // Preview animado na tela de configuração
        if (state.mode === "configuracao") {
            renderSetupPreviews();
            return;
        }

        // Quando pausado, congela 100% da física, cronômetro e animações
        if (state.mode === "pausado") {
            return;
        }

        // Atualiza partículas durante jogo/gol
        if (state.mode === "jogando" || state.mode === "gol") {
            state.netRippleLeft = Math.max(0, state.netRippleLeft - dt * 1.8);
            state.netRippleRight = Math.max(0, state.netRippleRight - dt * 1.8);

            for (let i = state.particles.length - 1; i >= 0; i--) {
                const pt = state.particles[i];
                pt.x += pt.vx * dt;
                pt.y += pt.vy * dt;
                pt.vx *= 0.96;
                pt.vy *= 0.96;
                pt.life -= dt;
                if (pt.life <= 0) state.particles.splice(i, 1);
            }
        }

        if (state.mode === "jogando") {
            // Passo fixo para estabilidade da física independente do FPS
            state.physicsAccumulator = Math.min(state.physicsAccumulator + dt, 0.08);
            while (state.physicsAccumulator >= FIXED_PHYSICS_DT && state.mode === "jogando") {
                stepPhysics(FIXED_PHYSICS_DT);
                state.physicsAccumulator -= FIXED_PHYSICS_DT;
            }

            // Cronômetro regressivo (só corre enquanto jogando)
            if (state.mode === "jogando") {
                state.halfTimeLeft -= dt;
                dom.hudClock.textContent = formatClock(state.halfTimeLeft);

                if (state.halfTimeLeft <= 0) {
                    state.halfTimeLeft = 0;
                    dom.hudClock.textContent = "00:00";

                    if (state.half === 1) {
                        enterHalftime();
                    } else {
                        finishMatch();
                    }
                }
            }
        } else if (state.mode === "gol") {
            state.goalTimer -= dt;
            if (state.goalTimer <= 0) {
                state.goalTimer = 0;
                positionPlayersForKickoff();
                state.mode = "jogando";
            }
        } else if (state.mode === "intervalo") {
            state.halftimeLeft -= dt;
            dom.htCountdown.textContent = String(Math.max(0, Math.ceil(state.halftimeLeft)));
            if (state.halftimeLeft <= 0) {
                startSecondHalf();
            }
        }
    }

    function enterHalftime() {
        state.mode = "intervalo";
        state.halftimeLeft = HALFTIME_DURATION_SEC;
        state.keys.clear();

        dom.htP1Club.textContent = getClubById(state.p1.clubId).name;
        dom.htP2Club.textContent = getClubById(state.p2.clubId).name;
        dom.htP1Score.textContent = String(state.p1.score);
        dom.htP2Score.textContent = String(state.p2.score);
        dom.htCountdown.textContent = "10";
        dom.overlayHalftime.classList.remove("hidden");

        audio.playHalftimeStart();
    }

    function startSecondHalf() {
        dom.overlayHalftime.classList.add("hidden");
        state.half = 2;
        state.halfTimeLeft = HALF_DURATION_SEC;
        state.sidesSwapped = true; // Troca obrigatória de lados no 2º tempo
        positionPlayersForKickoff();
        updateMatchHud();

        state.mode = "jogando";
        audio.playHalftimeEnd();
    }

     async function finishMatch() {
        state.mode = "finalizado";
        state.keys.clear();
        audio.playMatchEnd();

        // Garante que cada partida finalizada seja gravada apenas 1 vez
        if (!state.matchSavedToHistory) {
                state.matchSavedToHistory = true;
            recordFinishedMatch(state.p1, state.p2);

            const maiorPlacar = Math.max(state.p1.score, state.p2.score);
            const bonusResultado = state.p1.score !== state.p2.score ? 100 : 50;
            const pontuacaoFinalFutBlox = maiorPlacar * 100 + bonusResultado;
            await enviarPontuacao("futblox", pontuacaoFinalFutBlox);
        }

        const c1 = getClubById(state.p1.clubId);
        const c2 = getClubById(state.p2.clubId);

        dom.resP1Name.textContent = state.p1.name;
        dom.resP2Name.textContent = state.p2.name;
        dom.resP1Club.textContent = c1.name;
        dom.resP2Club.textContent = c2.name;
        dom.resP1Score.textContent = String(state.p1.score);
        dom.resP2Score.textContent = String(state.p2.score);

        dom.resP1Col.classList.toggle("is-winner", state.p1.score > state.p2.score);
        dom.resP2Col.classList.toggle("is-winner", state.p2.score > state.p1.score);

        const drawOne = (canvas, player) => {
            const c = canvas.getContext("2d");
            c.clearRect(0, 0, canvas.width, canvas.height);
            drawHairAndHead(c, canvas.width / 2, canvas.height * 0.55, 22, player, 0, false);
        };
        drawOne(dom.resP1Canvas, state.p1);
        drawOne(dom.resP2Canvas, state.p2);

        if (state.p1.score > state.p2.score) {
            dom.resultsTrophy.textContent = "🏆";
            dom.resultsHeading.textContent = "FIM DE JOGO!";
            dom.resultsWinnerText.textContent = `Vitória de ${state.p1.name} (${c1.name})!`;
            audio.playVictory();
        } else if (state.p2.score > state.p1.score) {
            dom.resultsTrophy.textContent = "🏆";
            dom.resultsHeading.textContent = "FIM DE JOGO!";
            dom.resultsWinnerText.textContent = `Vitória de ${state.p2.name} (${c2.name})!`;
            audio.playVictory();
        } else {
            dom.resultsTrophy.textContent = "🤝";
            dom.resultsHeading.textContent = "EMPATE EQUILIBRADO!";
            dom.resultsWinnerText.textContent = `Ninguém cedeu! ${c1.name} e ${c2.name} ficaram iguais no placar!`;
            audio.playDraw();
        }

        switchScreen("results", "finalizado");
    }

    function drawSoccerPitch(ctx) {
        const W = FIELD.CANVAS_W;
        const H = FIELD.CANVAS_H;
        const L = FIELD.LEFT;
        const R = FIELD.RIGHT;
        const T = FIELD.TOP;
        const B = FIELD.BOTTOM;
        const FW = R - L;
        const FH = B - T;
        const cx = FIELD.CENTER_X;
        const cy = FIELD.CENTER_Y;
        const gTop = cy - FIELD.GOAL_HALF_H;
        const gBot = cy + FIELD.GOAL_HALF_H;

        // Fundo externo ao gramado
        ctx.fillStyle = "#2b7a33";
        ctx.fillRect(0, 0, W, H);

        // Faixas alternadas de grama
        const stripeCount = 10;
        const stripeW = FW / stripeCount;
        for (let i = 0; i < stripeCount; i++) {
            ctx.fillStyle = i % 2 === 0 ? "#47bd4d" : "#3dae43";
            ctx.fillRect(L + i * stripeW, T, stripeW + 0.5, FH);
        }

        // Linhas brancas do campo
        ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
        ctx.lineWidth = 4;

        // Contorno principal
        ctx.strokeRect(L, T, FW, FH);

        // Linha do meio-campo e círculo central
        ctx.beginPath();
        ctx.moveTo(cx, T);
        ctx.lineTo(cx, B);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, 74, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        // Grandes áreas e pequenas áreas
        const bigW = 148;
        const bigH = 296;
        const smallW = 54;
        const smallH = 176;

        ctx.strokeRect(L, cy - bigH / 2, bigW, bigH);
        ctx.strokeRect(L, cy - smallH / 2, smallW, smallH);
        ctx.strokeRect(R - bigW, cy - bigH / 2, bigW, bigH);
        ctx.strokeRect(R - smallW, cy - smallH / 2, smallW, smallH);

        // Arcos das áreas e marcas do pênalti
        ctx.beginPath();
        ctx.arc(L + 106, cy, 58, -0.78, 0.78);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(R - 106, cy, 58, Math.PI - 0.78, Math.PI + 0.78);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(L + 106, cy, 4.5, 0, Math.PI * 2);
        ctx.arc(R - 106, cy, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Arcos de escanteio
        const cr = 18;
        [
            [L, T, 0, Math.PI / 2],
            [R, T, Math.PI / 2, Math.PI],
            [R, B, Math.PI, Math.PI * 1.5],
            [L, B, Math.PI * 1.5, Math.PI * 2]
        ].forEach(([ax, ay, a1, a2]) => {
            ctx.beginPath();
            ctx.arc(ax, ay, cr, a1, a2);
            ctx.stroke();
        });

        // Desenho dos 2 gols com redes detalhadas e indicação de defesa (J1 azul / J2 vermelho)
        const drawGoalNet = (isLeft) => {
            const gx = isLeft ? L - FIELD.GOAL_DEPTH : R;
            const ripple = isLeft ? state.netRippleLeft : state.netRippleRight;
            const shakeX = ripple > 0 ? Math.sin(state.animClock * 42) * ripple * 4 : 0;
            const defendColor = isLeft
                ? (!state.sidesSwapped ? "#1f7bff" : "#ff3b3b")
                : (!state.sidesSwapped ? "#ff3b3b" : "#1f7bff");

            ctx.save();
            ctx.translate(shakeX, 0);

            // Gramado interno do gol
            ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
            ctx.fillRect(gx, gTop, FIELD.GOAL_DEPTH, FIELD.GOAL_HALF_H * 2);

            // Rede quadriculada
            ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            for (let nx = gx + 8; nx < gx + FIELD.GOAL_DEPTH; nx += 10) {
                ctx.moveTo(nx, gTop);
                ctx.lineTo(nx, gBot);
            }
            for (let ny = gTop + 10; ny < gBot; ny += 12) {
                ctx.moveTo(gx, ny);
                ctx.lineTo(gx + FIELD.GOAL_DEPTH, ny);
            }
            ctx.stroke();

            // Estrutura externa do gol
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 5;
            ctx.beginPath();
            if (isLeft) {
                ctx.moveTo(L, gTop);
                ctx.lineTo(gx, gTop);
                ctx.lineTo(gx, gBot);
                ctx.lineTo(L, gBot);
            } else {
                ctx.moveTo(R, gTop);
                ctx.lineTo(gx + FIELD.GOAL_DEPTH, gTop);
                ctx.lineTo(gx + FIELD.GOAL_DEPTH, gBot);
                ctx.lineTo(R, gBot);
            }
            ctx.stroke();

            // Traves coloridas pela cor de quem defende aquele gol
            const postX = isLeft ? L : R;
            [gTop, gBot].forEach(py => {
                ctx.fillStyle = defendColor;
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.arc(postX, py, FIELD.POST_RADIUS, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
            });

            ctx.restore();
        };

        drawGoalNet(true);
        drawGoalNet(false);
    }

    function drawSoccerBall(ctx, b) {
        const speed = Math.hypot(b.vx, b.vy);

        // Sombra no gramado
        ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
        ctx.beginPath();
        ctx.ellipse(b.x + 3, b.y + 6, b.radius * 0.95, b.radius * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();

        // Linhas sutis de velocidade quando a bola vai rápido
        if (speed > 340) {
            const ang = Math.atan2(b.vy, b.vx);
            ctx.save();
            ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            for (let i = -1; i <= 1; i++) {
                const ox = -Math.cos(ang) * (b.radius + 6) + Math.sin(ang) * i * 6;
                const oy = -Math.sin(ang) * (b.radius + 6) - Math.cos(ang) * i * 6;
                ctx.beginPath();
                ctx.moveTo(b.x + ox, b.y + oy);
                ctx.lineTo(b.x + ox - Math.cos(ang) * 16, b.y + oy - Math.sin(ang) * 16);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Bola circular com gomos pretos e brancos rotacionando conforme velocidade
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Pentágono central + painéis nas bordas
        ctx.fillStyle = "#141414";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = Math.cos(a) * (b.radius * 0.42);
            const py = Math.sin(a) * (b.radius * 0.42);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        for (let i = 0; i < 5; i++) {
            const a = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const px = Math.cos(a) * (b.radius * 0.88);
            const py = Math.sin(a) * (b.radius * 0.88);
            ctx.beginPath();
            ctx.arc(px, py, b.radius * 0.22, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    function drawGoalCelebrationBanner(ctx) {
        if (state.mode !== "gol" && !(state.mode === "pausado" && state.pausedFromMode === "gol")) {
            return;
        }

        const progress = clamp(1 - state.goalTimer / state.goalDuration, 0, 1);
        const W = FIELD.CANVAS_W;
        const cy = FIELD.CENTER_Y;

        ctx.save();
        ctx.font = "700 54px 'Space Grotesk', sans-serif";
        const text = state.goalBannerText;
        const textW = ctx.measureText(text).width;

        // Entra pela direita (W + textW/2) e sai pela esquerda (-textW/2)
        const startX = W + textW * 0.65;
        const endX = -textW * 0.65;
        const x = startX + (endX - startX) * progress;

        // Faixa de fundo nas cores do time
        ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
        ctx.fillRect(0, cy - 58, W, 116);

        ctx.fillStyle = state.goalClubColors[1];
        ctx.fillRect(0, cy - 48, W, 96);
        ctx.fillStyle = state.goalClubColors[0];
        ctx.fillRect(0, cy - 42, W, 84);

        // Texto grande com sombra sólida e contorno preto
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.lineWidth = 10;
        ctx.strokeStyle = "#000000";
        ctx.fillStyle = "#000000";
        ctx.fillText(text, x + 5, cy + 5);

        ctx.strokeText(text, x, cy);
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, x, cy);
        ctx.restore();
    }

    function renderGameCanvas() {
        const showPitch =
            state.mode === "jogando" ||
            state.mode === "gol" ||
            state.mode === "intervalo" ||
            state.mode === "pausado";

        if (!showPitch) return;

        drawSoccerPitch(gameCtx);

        // Desenha personagens ordenados por Y para profundidade correta
        const playersOrdered = [state.p1, state.p2].sort((a, b) => a.y - b.y);
        playersOrdered.forEach(pl => {
            drawFullMiniBloxPlayer(gameCtx, pl.x, pl.y, pl, state.animClock, false);
        });

        drawSoccerBall(gameCtx, state.ball);

        // Partículas de comemoração
        for (let i = 0; i < state.particles.length; i++) {
            const pt = state.particles[i];
            const alpha = clamp(pt.life / pt.maxLife, 0, 1);
            gameCtx.save();
            gameCtx.globalAlpha = alpha;
            gameCtx.fillStyle = pt.color;
            gameCtx.strokeStyle = "#000000";
            gameCtx.lineWidth = 1.5;
            gameCtx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            gameCtx.strokeRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            gameCtx.restore();
        }

        drawGoalCelebrationBanner(gameCtx);
    }

    function mainLoop(ts) {
        if (!state.lastFrameTs) state.lastFrameTs = ts;
        const dt = Math.min((ts - state.lastFrameTs) / 1000, 0.05);
        state.lastFrameTs = ts;

        updateMatch(dt);
        renderGameCanvas();

        state.rafId = requestAnimationFrame(mainLoop);
    }

    function startSingleLoop() {
        if (state.rafId !== null) return;
        state.lastFrameTs = performance.now();
        state.rafId = requestAnimationFrame(mainLoop);
    }

    /* =========================================================================
       11. RENDERIZAÇÃO DA TELA DE HISTÓRICO
    ========================================================================= */
    function renderHistoryScreen() {
        const list = loadHistory();
        dom.historyList.innerHTML = "";

        if (list.length === 0) {
            dom.historyEmpty.classList.remove("hidden");
            dom.historyList.classList.add("hidden");
            dom.btnHistoryClear.disabled = true;
            return;
        }

        dom.historyEmpty.classList.add("hidden");
        dom.historyList.classList.remove("hidden");
        dom.btnHistoryClear.disabled = false;

        list.forEach(item => {
            const c1 = getClubById(item.p1.clubId);
            const c2 = getClubById(item.p2.clubId);

            const card = document.createElement("article");
            card.className = "history-card";

            let outcomeClass = "outcome-draw";
            let outcomeLabel = "EMPATE";
            if (item.p1.score > item.p2.score) {
                outcomeClass = "outcome-p1";
                outcomeLabel = `VITÓRIA ${item.p1.name}`;
            } else if (item.p2.score > item.p1.score) {
                outcomeClass = "outcome-p2";
                outcomeLabel = `VITÓRIA ${item.p2.name}`;
            }

            card.innerHTML = `
                <div class="history-card-main">
                    <div class="history-side">
                        <canvas class="history-head-canvas" width="60" height="60"></canvas>
                        <div class="history-player-info">
                            <strong></strong>
                            <span class="history-club-tag"></span>
                        </div>
                    </div>

                    <div class="history-score-center">
                        <div class="history-score-nums">
                            <span>${item.p1.score}</span>
                            <small>X</small>
                            <span>${item.p2.score}</span>
                        </div>
                        <span class="history-outcome-pill ${outcomeClass}"></span>
                    </div>

                    <div class="history-side right-side">
                        <canvas class="history-head-canvas" width="60" height="60"></canvas>
                        <div class="history-player-info">
                            <strong></strong>
                            <span class="history-club-tag"></span>
                        </div>
                    </div>
                </div>
                <div class="history-card-footer">
                    <span>Partida encerrada em ${item.dateFormatted}</span>
                    <span>Horário: ${item.timeFormatted || "--:--"}</span>
                </div>
            `;

            const sideEls = card.querySelectorAll(".history-side");
            const canvases = card.querySelectorAll(".history-head-canvas");
            const outcomeEl = card.querySelector(".history-outcome-pill");

            sideEls[0].querySelector("strong").textContent = item.p1.name;
            const tag1 = sideEls[0].querySelector(".history-club-tag");
            tag1.textContent = c1.name;
            tag1.style.backgroundColor = c1.colors[0];
            tag1.style.color = c1.textOnMain;

            sideEls[1].querySelector("strong").textContent = item.p2.name;
            const tag2 = sideEls[1].querySelector(".history-club-tag");
            tag2.textContent = c2.name;
            tag2.style.backgroundColor = c2.colors[0];
            tag2.style.color = c2.textOnMain;

            outcomeEl.textContent = outcomeLabel;

            drawHistoryHeadToCanvas(canvases[0], item.p1);
            drawHistoryHeadToCanvas(canvases[1], item.p2);

            dom.historyList.appendChild(card);
        });
    }

    /* =========================================================================
       12. EVENTOS E INICIALIZAÇÃO
    ========================================================================= */
    function initSetupControls() {
        dom.p1NameInput.value = state.p1.name;
        dom.p2NameInput.value = state.p2.name;
        dom.p1GenderSelect.value = state.p1.gender;
        dom.p2GenderSelect.value = state.p2.gender;

        populateHairstylesForPlayer(state.p1, dom.p1HairStyleSelect);
        populateHairstylesForPlayer(state.p2, dom.p2HairStyleSelect);

        buildSwatchGroup(dom.p1SkinSwatches, SKIN_TONES, state.p1.skin, hex => {
            state.p1.skin = hex;
        });
        buildSwatchGroup(dom.p2SkinSwatches, SKIN_TONES, state.p2.skin, hex => {
            state.p2.skin = hex;
        });
        buildSwatchGroup(dom.p1HairSwatches, HAIR_COLORS, state.p1.hairColor, hex => {
            state.p1.hairColor = hex;
        });
        buildSwatchGroup(dom.p2HairSwatches, HAIR_COLORS, state.p2.hairColor, hex => {
            state.p2.hairColor = hex;
        });

        setClubTargetSlot(1);
        renderSetupPreviews();
    }

    function bindEvents() {
        const unlockAudio = () => audio.unlock();
        document.addEventListener("pointerdown", unlockAudio, { passive: true });
        document.addEventListener("keydown", unlockAudio, { passive: true });

        // Controles rápidos de áudio no Header
        dom.quickMusicBtn.addEventListener("click", () => {
            audio.updateConfig({ musicEnabled: !audioConfig.musicEnabled });
            audio.playClick();
            syncAudioControlsUI();
        });

        dom.quickSfxBtn.addEventListener("click", () => {
            audio.updateConfig({ sfxEnabled: !audioConfig.sfxEnabled });
            if (audioConfig.sfxEnabled) audio.playClick();
            syncAudioControlsUI();
        });

        // Menu Inicial
        dom.btnMenuPlay.addEventListener("click", () => {
            audio.playClick();
            dom.setupError.classList.add("hidden");
            switchScreen("setup", "configuracao");
        });

        dom.btnMenuHistory.addEventListener("click", () => {
            audio.playClick();
            renderHistoryScreen();
            switchScreen("history", "historico");
        });

        dom.btnMenuHowto.addEventListener("click", () => {
            audio.playClick();
            dom.modalHowto.classList.remove("hidden");
        });

        dom.btnMenuSettings.addEventListener("click", () => {
            audio.playClick();
            state.settingsOrigin = "menu";
            syncAudioControlsUI();
            dom.modalSettings.classList.remove("hidden");
        });

        // Modais Como Jogar e Configurações
        const closeHowto = () => {
            audio.playClick();
            dom.modalHowto.classList.add("hidden");
        };
        dom.btnCloseHowto.addEventListener("click", closeHowto);
        dom.btnOkHowto.addEventListener("click", closeHowto);
        dom.modalHowto.addEventListener("click", e => {
            if (e.target === dom.modalHowto) closeHowto();
        });

        const closeSettings = () => {
            audio.playClick();
            dom.modalSettings.classList.add("hidden");
        };
        dom.btnCloseSettings.addEventListener("click", closeSettings);
        dom.btnOkSettings.addEventListener("click", closeSettings);
        dom.modalSettings.addEventListener("click", e => {
            if (e.target === dom.modalSettings) closeSettings();
        });

        dom.setMusicToggle.addEventListener("click", () => {
            audio.updateConfig({ musicEnabled: !audioConfig.musicEnabled });
            audio.playClick();
            syncAudioControlsUI();
        });

        dom.setSfxToggle.addEventListener("click", () => {
            audio.updateConfig({ sfxEnabled: !audioConfig.sfxEnabled });
            if (audioConfig.sfxEnabled) audio.playClick();
            syncAudioControlsUI();
        });

        dom.setMusicVol.addEventListener("input", () => {
            const v = clamp(Number(dom.setMusicVol.value) / 100, 0, 1);
            audio.updateConfig({ musicVolume: v });
            syncAudioControlsUI();
        });

        dom.setSfxVol.addEventListener("input", () => {
            const v = clamp(Number(dom.setSfxVol.value) / 100, 0, 1);
            audio.updateConfig({ sfxVolume: v });
            syncAudioControlsUI();
        });

        // Modal de Confirmação
        dom.btnConfirmCancel.addEventListener("click", () => {
            audio.playClick();
            closeConfirmModal();
        });

        dom.btnConfirmYes.addEventListener("click", () => {
            audio.playClick();
            const cb = state.activeConfirmCallback;
            closeConfirmModal();
            if (typeof cb === "function") cb();
        });

        // Tela de Configuração
        dom.btnSetupBack.addEventListener("click", () => {
            audio.playClick();
            switchScreen("menu", "menu");
        });

        dom.btnTargetP1.addEventListener("click", () => {
            audio.playClick();
            setClubTargetSlot(1);
        });
        dom.btnTargetP2.addEventListener("click", () => {
            audio.playClick();
            setClubTargetSlot(2);
        });
        dom.tabPickP1.addEventListener("click", () => {
            audio.playClick();
            setClubTargetSlot(1);
        });
        dom.tabPickP2.addEventListener("click", () => {
            audio.playClick();
            setClubTargetSlot(2);
        });

        dom.p1GenderSelect.addEventListener("change", () => {
            state.p1.gender = dom.p1GenderSelect.value;
            populateHairstylesForPlayer(state.p1, dom.p1HairStyleSelect);
            audio.playCustomize();
        });

        dom.p2GenderSelect.addEventListener("change", () => {
            state.p2.gender = dom.p2GenderSelect.value;
            populateHairstylesForPlayer(state.p2, dom.p2HairStyleSelect);
            audio.playCustomize();
        });

        dom.p1HairStyleSelect.addEventListener("change", () => {
            state.p1.hairStyle = dom.p1HairStyleSelect.value;
            audio.playCustomize();
        });

        dom.p2HairStyleSelect.addEventListener("change", () => {
            state.p2.hairStyle = dom.p2HairStyleSelect.value;
            audio.playCustomize();
        });

        dom.btnStartMatch.addEventListener("click", () => {
            audio.playClick();
            const n1 = dom.p1NameInput.value.trim();
            const n2 = dom.p2NameInput.value.trim();

            if (!n1 || !n2) {
                dom.setupError.textContent = "Os dois jogadores precisam informar um nome válido!";
                dom.setupError.classList.remove("hidden");
                return;
            }
            if (!state.p1.clubId || !state.p2.clubId || state.p1.clubId === state.p2.clubId) {
                dom.setupError.textContent = "Os dois jogadores precisam escolher times diferentes!";
                dom.setupError.classList.remove("hidden");
                return;
            }

            state.p1.name = n1.slice(0, 14);
            state.p2.name = n2.slice(0, 14);
            dom.setupError.classList.add("hidden");
            resetMatchStateAndStart();
        });

        // Pausa e Controles da Partida
        dom.btnPauseHud.addEventListener("click", () => {
            pauseMatch();
        });

        dom.btnPauseResume.addEventListener("click", () => {
            resumeMatch();
        });

        dom.btnPauseAudio.addEventListener("click", () => {
            audio.playClick();
            state.settingsOrigin = "pausa";
            syncAudioControlsUI();
            dom.modalSettings.classList.remove("hidden");
        });

        dom.btnPauseRestart.addEventListener("click", () => {
            audio.playClick();
            openConfirmModal(
                "REINICIAR PARTIDA?",
                "O placar e o cronômetro serão zerados. A partida atual não será salva no histórico.",
                () => {
                    resetMatchStateAndStart();
                }
            );
        });

        dom.btnPauseMenu.addEventListener("click", () => {
            audio.playClick();
            openConfirmModal(
                "VOLTAR AO MENU?",
                "A partida atual será abandonada e não entrará no histórico.",
                () => {
                    state.pausedFromMode = null;
                    state.keys.clear();
                    audio.setPausedState(false);
                    switchScreen("menu", "menu");
                }
            );
        });

        // Teclado (WASD, Setas e ESC com prevenção de rolagem)
        window.addEventListener("keydown", e => {
            const tag = document.activeElement ? document.activeElement.tagName : "";
            const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

            if (e.code === "Escape") {
                e.preventDefault();
                if (!dom.modalConfirm.classList.contains("hidden")) {
                    closeConfirmModal();
                    return;
                }
                if (!dom.modalSettings.classList.contains("hidden")) {
                    closeSettings();
                    return;
                }
                if (!dom.modalHowto.classList.contains("hidden")) {
                    closeHowto();
                    return;
                }

                if (state.mode === "jogando" || state.mode === "intervalo" || state.mode === "gol") {
                    if (!e.repeat) pauseMatch();
                } else if (state.mode === "pausado") {
                    if (!e.repeat) resumeMatch();
                }
                return;
            }

            if (typing) return;

            const keyLower = e.key.toLowerCase();
            if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(keyLower)) {
                if (state.mode === "jogando" || state.mode === "pausado" || state.mode === "intervalo" || state.mode === "gol") {
                    e.preventDefault();
                }
            }

            if (state.mode === "jogando") {
                if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(keyLower)) {
                    state.keys.add(keyLower);
                }
            }
        });

        window.addEventListener("keyup", e => {
            const keyLower = e.key.toLowerCase();
            state.keys.delete(keyLower);
        });

        window.addEventListener("blur", () => {
            state.keys.clear();
        });

        // Resultados
        dom.btnResultsRematch.addEventListener("click", () => {
            audio.playClick();
            dom.setupError.classList.add("hidden");
            switchScreen("setup", "configuracao");
        });

        dom.btnResultsHistory.addEventListener("click", () => {
            audio.playClick();
            renderHistoryScreen();
            switchScreen("history", "historico");
        });

        dom.btnResultsMenu.addEventListener("click", () => {
            audio.playClick();
            switchScreen("menu", "menu");
        });

        // Histórico
        const goMenuFromHistory = () => {
            audio.playClick();
            switchScreen("menu", "menu");
        };
        dom.btnHistoryBack.addEventListener("click", goMenuFromHistory);
        dom.btnEmptyBack.addEventListener("click", goMenuFromHistory);

        dom.btnHistoryClear.addEventListener("click", () => {
            audio.playClick();
            openConfirmModal(
                "EXCLUIR TODO O HISTÓRICO?",
                "Todas as partidas registradas serão apagadas permanentemente.",
                () => {
                    saveHistoryList([]);
                    renderHistoryScreen();
                }
            );
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                state.keys.clear();
                audio.stopMusicLoop();
            } else if (audio.unlocked && audioConfig.musicEnabled && !audio.musicPaused) {
                audio.startMusic();
            }
        });
    }

    function init() {
        syncAudioControlsUI();
        initSetupControls();
        bindEvents();
        switchScreen("menu", "menu");
        startSingleLoop();
    }

    init();
})();