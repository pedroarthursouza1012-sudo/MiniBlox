(() => {
    "use strict";

    /* =========================================================================
       1. DADOS DOS 12 PERSONAGENS (6 HOMENS + 6 MULHERES) E 5 ARENAS
    ========================================================================= */
    const STORAGE_KEY_SETTINGS = "punchblox_settings_v1";

    const FIGHTERS = [
        // 6 MASCULINOS
        {
            id: "kairo", name: "Kairo", title: "O Espadachim", gender: "M",
            weapon: "katana", weaponLabel: "Katana", style: "Equilibrado e técnico",
            desc: "Cortes rápidos, sequência de golpes e avanço preciso com katana.",
            specialName: "CORTE DO DRAGÃO",
            atk: 8, spd: 8, def: 7,
            colors: { skin: "#f0b18c", hair: "#16161a", main: "#1f212b", accent: "#e62e3d", energy: "#ff2e43" },
            hairType: "spiky", bodyType: "normal"
        },
        {
            id: "brax", name: "Brax", title: "O Colosso", gender: "M",
            weapon: "gauntlets", weaponLabel: "Manoplas Metálicas", style: "Força e resistência",
            desc: "Golpes pesados com manoplas gigantes que causam enorme impacto.",
            specialName: "RUPTURA TITÂNICA",
            atk: 10, spd: 5, def: 10,
            colors: { skin: "#cc7e54", hair: "#2a201b", main: "#242429", accent: "#ffcf40", energy: "#ffcf40" },
            hairType: "mohawk", bodyType: "heavy"
        },
        {
            id: "zephyr", name: "Zephyr", title: "O Veloz", gender: "M",
            weapon: "daggers", weaponLabel: "Duas Adagas", style: "Velocidade e combos",
            desc: "Sequências ultrarrápidas e esquivas ágeis em alta velocidade.",
            specialName: "TEMPESTADE FANTASMA",
            atk: 7, spd: 10, def: 6,
            colors: { skin: "#ffd2b8", hair: "#dce8f5", main: "#2c7be5", accent: "#ffffff", energy: "#4dc3ff" },
            hairType: "swept", bodyType: "slim"
        },
        {
            id: "ignis", name: "Ignis", title: "O Mestre das Chamas", gender: "M",
            weapon: "fire", weaponLabel: "Poderes de Fogo", style: "Controle e explosões",
            desc: "Socos flamejantes e chutes que deixam rastros incandescentes.",
            specialName: "FÊNIX ASCENDENTE",
            atk: 9, spd: 7, def: 6,
            colors: { skin: "#f0a980", hair: "#ff6b1a", main: "#1c191c", accent: "#ff5722", energy: "#ff7b00" },
            hairType: "flame", bodyType: "normal"
        },
        {
            id: "nox", name: "Nox", title: "O Sombrio", gender: "M",
            weapon: "scythe", weaponLabel: "Foice Sombria", style: "Alcance e imprevisibilidade",
            desc: "Cortes curvos de energia roxa e investidas através das sombras.",
            specialName: "ABISMO NEGRO",
            atk: 8, spd: 7, def: 7,
            colors: { skin: "#e0c4b8", hair: "#1a1326", main: "#191126", accent: "#9b4dff", energy: "#b55cff" },
            hairType: "hood", bodyType: "cloak"
        },
        {
            id: "volt", name: "Volt", title: "O Dominador Elétrico", gender: "M",
            weapon: "batons", weaponLabel: "Bastões Elétricos", style: "Velocidade e choque",
            desc: "Rajadas rápidas com bastões carregados de eletricidade.",
            specialName: "SOBRECARGA ABSOLUTA",
            atk: 8, spd: 9, def: 6,
            colors: { skin: "#f5be9a", hair: "#ffdf2d", main: "#1b2838", accent: "#00f5d4", energy: "#00f5d4" },
            hairType: "spiky", bodyType: "tech"
        },
        // 6 FEMININOS
        {
            id: "akira", name: "Akira", title: "A Ninja", gender: "F",
            weapon: "kunais", weaponLabel: "Duas Kunais", style: "Velocidade e precisão",
            desc: "Cortes ágeis, saltos acrobáticos e ataques furtivos.",
            specialName: "DANÇA DAS SOMBRAS",
            atk: 8, spd: 10, def: 5,
            colors: { skin: "#ffd5be", hair: "#16161a", main: "#d71920", accent: "#ffffff", energy: "#ff3355" },
            hairType: "ponytail", bodyType: "slim"
        },
        {
            id: "freya", name: "Freya", title: "A Guardiã", gender: "F",
            weapon: "spear", weaponLabel: "Lança", style: "Alcance e defesa",
            desc: "Estocadas longas, varreduras e postura defensiva firme.",
            specialName: "LANÇA CELESTIAL",
            atk: 8, spd: 6, def: 9,
            colors: { skin: "#f5c2a4", hair: "#f7d147", main: "#1e56a0", accent: "#ffcf40", energy: "#ffe066" },
            hairType: "long", bodyType: "armor"
        },
        {
            id: "nyx", name: "Nyx", title: "A Ilusionista", gender: "F",
            weapon: "fans", weaponLabel: "Leques Mágicos", style: "Mobilidade e ilusões",
            desc: "Ondas arcanas com leques brilhantes e movimentos elegantes.",
            specialName: "ILUSÃO INFINITA",
            atk: 7, spd: 8, def: 7,
            colors: { skin: "#e8b6a0", hair: "#8844dd", main: "#3d1e5a", accent: "#ff66cc", energy: "#e066ff" },
            hairType: "wavy", bodyType: "dress"
        },
        {
            id: "raven", name: "Raven", title: "A Caçadora", gender: "F",
            weapon: "chain", weaponLabel: "Corrente com Lâmina", style: "Alcance e controle",
            desc: "Ataques giratórios de longo alcance usando corrente cortante.",
            specialName: "CORRENTE DA DESTRUIÇÃO",
            atk: 9, spd: 7, def: 7,
            colors: { skin: "#edd0c4", hair: "#f0f4f8", main: "#1c1c20", accent: "#e62e3d", energy: "#ff2e43" },
            hairType: "bob", bodyType: "coat"
        },
        {
            id: "luna", name: "Luna", title: "A Lutadora Solar", gender: "F",
            weapon: "light", weaponLabel: "Poderes de Luz", style: "Equilíbrio e energia",
            desc: "Golpes luminosos e explosões radiantes de energia solar.",
            specialName: "EXPLOSÃO SOLAR",
            atk: 8, spd: 8, def: 8,
            colors: { skin: "#cc8055", hair: "#ffe047", main: "#f7f7f7", accent: "#ffcf40", energy: "#fff066" },
            hairType: "long", bodyType: "normal"
        },
        {
            id: "kira", name: "Kira", title: "A Cyberpunk", gender: "F",
            weapon: "cyber_gauntlets", weaponLabel: "Manoplas Tech", style: "Combos e tecnologia",
            desc: "Socos mecanizados e descargas neon de alta cadência.",
            specialName: "PROTOCOLO ZERO",
            atk: 8, spd: 9, def: 7,
            colors: { skin: "#f0b999", hair: "#00c8ff", main: "#1f2433", accent: "#00f5d4", energy: "#00f5d4" },
            hairType: "cyber", bodyType: "tech"
        }
    ];

    const ARENAS = [
        { id: "neon", name: "NEON CITY", skyTop: "#0e0a29", skyBot: "#2a1458", floor: "#1c1638", accent: "#ff4dff", tempo: 132 },
        { id: "temple", name: "TEMPLO DAS CHAMAS", skyTop: "#240808", skyBot: "#5c170d", floor: "#3b1b15", accent: "#ff6b1a", tempo: 126 },
        { id: "ice", name: "GELO ETERNO", skyTop: "#0c2b47", skyBot: "#3a7ca5", floor: "#b9e6ff", accent: "#ffffff", tempo: 118 },
        { id: "samurai", name: "TERRA DOS SAMURAIS", skyTop: "#3d0f1e", skyBot: "#b84b3e", floor: "#522a24", accent: "#ffcf40", tempo: 122 },
        { id: "chaos", name: "ARENA DO CAOS", skyTop: "#090414", skyBot: "#230b42", floor: "#170c29", accent: "#c054ff", tempo: 138 }
    ];

    const WORLD = { W: 1120, H: 580, FLOOR_Y: 486, LEFT: 54, RIGHT: 1066, GRAVITY: 2150 };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function getFighterById(id) {
        return FIGHTERS.find(f => f.id === id) || FIGHTERS[0];
    }

    function getArenaById(id) {
        return ARENAS.find(a => a.id === id) || ARENAS[0];
    }

    /* =========================================================================
       2. CONFIGURAÇÕES E SISTEMA DE ÁUDIO (WEB AUDIO API)
    ========================================================================= */
    function loadSettings() {
        const def = { masterVol: 0.8, musicVol: 0.5, sfxVol: 0.8, musicOn: true, sfxOn: true, fxQuality: "normal" };
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (!raw) return def;
            const s = JSON.parse(raw);
            return {
                masterVol: typeof s.masterVol === "number" ? clamp(s.masterVol, 0, 1) : def.masterVol,
                musicVol: typeof s.musicVol === "number" ? clamp(s.musicVol, 0, 1) : def.musicVol,
                sfxVol: typeof s.sfxVol === "number" ? clamp(s.sfxVol, 0, 1) : def.sfxVol,
                musicOn: typeof s.musicOn === "boolean" ? s.musicOn : def.musicOn,
                sfxOn: typeof s.sfxOn === "boolean" ? s.sfxOn : def.sfxOn,
                fxQuality: ["low", "normal", "high"].includes(s.fxQuality) ? s.fxQuality : def.fxQuality
            };
        } catch {
            return def;
        }
    }

    class FightAudio {
        constructor(cfg) {
            this.cfg = cfg;
            this.ctx = null;
            this.musicGain = null;
            this.sfxGain = null;
            this.unlocked = false;
            this.paused = false;
            this.track = "menu"; // menu | intro | arena_id
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
                this.musicGain.connect(this.ctx.destination);
                this.sfxGain.connect(this.ctx.destination);
                this.syncGains();
            }
            if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
            this.unlocked = true;
            if (this.cfg.musicOn && !this.timer) this.startLoop();
        }

        syncGains() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const mVol = this.cfg.musicOn && !this.paused ? this.cfg.masterVol * this.cfg.musicVol * 0.28 : 0;
            const sVol = this.cfg.sfxOn ? this.cfg.masterVol * this.cfg.sfxVol * 0.72 : 0;
            this.musicGain.gain.setTargetAtTime(mVol, now, 0.04);
            this.sfxGain.gain.setTargetAtTime(sVol, now, 0.02);
        }

        saveAndSync() {
            try { localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(this.cfg)); } catch {}
            this.syncGains();
            if (!this.cfg.musicOn) this.stopLoop();
            else if (this.unlocked && !this.timer) this.startLoop();
        }

        setPaused(p) {
            this.paused = p;
            this.syncGains();
        }

        setTrack(track) {
            if (this.track === track) return;
            this.track = track;
            this.step = 0;
        }

        startLoop() {
            if (!this.ctx || !this.cfg.musicOn || this.timer) return;
            this.nextNote = this.ctx.currentTime + 0.05;
            const tick = () => {
                if (!this.ctx || !this.cfg.musicOn) {
                    this.timer = null;
                    return;
                }
                const arena = ARENAS.find(a => a.id === this.track);
                const bpm = this.track === "intro" ? 105 : (arena ? arena.tempo : 120);
                const stepDur = 60 / bpm / 2;
                while (this.nextNote < this.ctx.currentTime + 0.18) {
                    this.scheduleStep(this.step, this.nextNote, stepDur);
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

        scheduleStep(step, t, dur) {
            if (this.track === "intro") {
                const bass = [110, 0, 110, 0, 116.54, 0, 123.47, 0, 130.81, 0, 138.59, 0, 146.83, 146.83, 155.56, 164.81];
                if (bass[step]) this.mNote(bass[step], t, dur * 1.1, "sawtooth", 0.16);
                return;
            }
            const patterns = {
                menu: [329.63, 0, 392, 440, 0, 392, 329.63, 293.66, 329.63, 0, 440, 523.25, 493.88, 440, 392, 0],
                neon: [440, 523.25, 659.25, 0, 587.33, 523.25, 440, 0, 392, 493.88, 587.33, 0, 659.25, 587.33, 523.25, 493.88],
                temple: [293.66, 0, 349.23, 440, 415.3, 0, 349.23, 293.66, 261.63, 0, 329.63, 392, 440, 392, 349.23, 0],
                ice: [523.25, 0, 659.25, 783.99, 0, 659.25, 587.33, 523.25, 440, 0, 523.25, 659.25, 587.33, 0, 493.88, 0],
                samurai: [329.63, 0, 349.23, 493.88, 523.25, 0, 493.88, 349.23, 329.63, 0, 440, 523.25, 659.25, 523.25, 493.88, 0],
                chaos: [392, 440, 466.16, 0, 523.25, 466.16, 440, 392, 349.23, 392, 440, 0, 587.33, 523.25, 466.16, 440]
            };
            const lead = patterns[this.track] || patterns.menu;
            const bass = [110, 110, 0, 110, 130.81, 130.81, 0, 130.81, 146.83, 146.83, 0, 146.83, 164.81, 0, 146.83, 0];
            if (lead[step]) this.mNote(lead[step], t, dur * 0.78, "triangle", 0.18);
            if (bass[step]) this.mNote(bass[step], t, dur * 0.85, "sine", 0.24);
        }

        mNote(freq, t, dur, type, vol) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.015);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        ok(name, cd = 40) {
            if (!this.cfg.sfxOn) return false;
            this.unlock();
            if (!this.ctx || !this.sfxGain) return false;
            const now = performance.now();
            if (now - (this.cooldowns[name] || 0) < cd) return false;
            this.cooldowns[name] = now;
            return true;
        }

        tone(f1, f2, dur, type, vol, delay = 0) {
            const t = this.ctx.currentTime + delay;
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

        playClick() { if (this.ok("clk", 35)) this.tone(540, 780, 0.055, "triangle", 0.22); }
        playSelect() { if (this.ok("sel", 45)) { this.tone(440, 660, 0.07, "triangle", 0.24); this.tone(660, 880, 0.08, "triangle", 0.2, 0.05); } }
        playConfirm() { if (this.ok("cnf", 120)) { [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, f * 1.03, 0.12, "triangle", 0.25, i * 0.06)); } }
        playCountdown(isGo) {
            if (!this.ok("cnt", 80)) return;
            if (isGo) { this.tone(523.25, 1046.5, 0.28, "sawtooth", 0.24); this.tone(783.99, 1318.5, 0.3, "triangle", 0.28, 0.04); }
            else this.tone(440, 440, 0.14, "triangle", 0.26);
        }
        playJump() { if (this.ok("jmp", 80)) this.tone(240, 520, 0.12, "sine", 0.2); }
        playAttack(isKick) {
            if (!this.ok("atk", 55)) return;
            if (isKick) this.tone(360, 120, 0.13, "triangle", 0.26);
            else this.tone(520, 190, 0.09, "triangle", 0.22);
        }
        playHit(heavy, charId) {
            if (!this.ok("hit", 45)) return;
            const pitchBias = charId === "brax" ? 0.75 : (charId === "volt" ? 1.35 : 1);
            this.tone((heavy ? 180 : 240) * pitchBias, 55, heavy ? 0.15 : 0.1, "square", heavy ? 0.24 : 0.18);
            this.tone(130 * pitchBias, 45, 0.14, "triangle", 0.34);
        }
        playBlock() { if (this.ok("blk", 55)) { this.tone(860, 620, 0.08, "square", 0.18); this.tone(1240, 940, 0.09, "triangle", 0.22); } }
        playSpecial(charId) {
            if (!this.ok("spc", 200)) return;
            if (charId === "volt" || charId === "kira") {
                this.tone(320, 1280, 0.28, "sawtooth", 0.22);
                this.tone(880, 220, 0.32, "square", 0.18, 0.12);
            } else if (charId === "brax" || charId === "ignis") {
                this.tone(140, 45, 0.42, "sawtooth", 0.32);
                this.tone(260, 620, 0.28, "triangle", 0.28, 0.06);
            } else {
                this.tone(240, 960, 0.24, "triangle", 0.3);
                this.tone(720, 180, 0.34, "sawtooth", 0.2, 0.14);
            }
        }
        playRoundEnd() { if (this.ok("rend", 250)) [659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f, 0.2, "triangle", 0.25, i * 0.08)); }
        playVictory() { if (this.ok("vic", 350)) [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, f, 0.26, "triangle", 0.28, i * 0.1)); }
        playDefeat() { if (this.ok("def", 350)) [349.23, 311.13, 261.63, 196].forEach((f, i) => this.tone(f, f * 0.9, 0.2, "sawtooth", 0.18, i * 0.11)); }
    }

    /* =========================================================================
       3. DESENHO DETALHADO DOS 12 LUTADORES, ARMAS E ANIMAÇÕES NO CANVAS
    ========================================================================= */
    function roundRect(c, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        c.beginPath();
        c.moveTo(x + rr, y);
        c.lineTo(x + w - rr, y);
        c.quadraticCurveTo(x + w, y, x + w, y + rr);
        c.lineTo(x + w, y + h - rr);
        c.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        c.lineTo(x + rr, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - rr);
        c.lineTo(x, y + rr);
        c.quadraticCurveTo(x, y, x + rr, y);
        c.closePath();
    }

    function drawWeaponInHand(c, fighter, stateName, animTime) {
        const col = fighter.colors;
        c.save();
        c.strokeStyle = "#000000";
        c.lineWidth = 2.2;

        switch (fighter.weapon) {
            case "katana":
                c.fillStyle = "#e2ebf5";
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(54, -4);
                c.lineTo(60, 0);
                c.lineTo(0, 5);
                c.closePath();
                c.fill();
                c.stroke();
                c.fillStyle = "#ffcf40";
                c.fillRect(-3, -4, 5, 12);
                c.strokeRect(-3, -4, 5, 12);
                c.fillStyle = col.accent;
                c.fillRect(-14, -2, 11, 7);
                c.strokeRect(-14, -2, 11, 7);
                break;

            case "gauntlets":
            case "cyber_gauntlets":
                c.fillStyle = fighter.weapon === "cyber_gauntlets" ? col.main : col.accent;
                roundRect(c, -6, -11, 24, 22, 5);
                c.fill();
                c.stroke();
                c.fillStyle = fighter.weapon === "cyber_gauntlets" ? col.energy : "#555";
                c.fillRect(6, -5, 9, 10);
                break;

            case "daggers":
            case "kunais":
                c.fillStyle = "#dce8f5";
                c.beginPath();
                c.moveTo(0, -4);
                c.lineTo(30, 0);
                c.lineTo(0, 4);
                c.closePath();
                c.fill();
                c.stroke();
                c.fillStyle = col.accent;
                c.fillRect(-9, -2, 9, 5);
                c.strokeRect(-9, -2, 9, 5);
                break;

            case "spear":
                c.fillStyle = "#8c5832";
                c.fillRect(-26, -3, 76, 6);
                c.strokeRect(-26, -3, 76, 6);
                c.fillStyle = col.accent;
                c.beginPath();
                c.moveTo(50, -7);
                c.lineTo(74, 0);
                c.lineTo(50, 7);
                c.closePath();
                c.fill();
                c.stroke();
                break;

            case "scythe":
                c.fillStyle = "#2b213d";
                c.fillRect(-22, -3, 68, 6);
                c.strokeRect(-22, -3, 68, 6);
                c.fillStyle = col.energy;
                c.beginPath();
                c.moveTo(42, -3);
                c.quadraticCurveTo(66, 8, 44, 34);
                c.quadraticCurveTo(46, 12, 34, 3);
                c.closePath();
                c.fill();
                c.stroke();
                break;

            case "batons":
                c.fillStyle = "#222";
                c.fillRect(-6, -3, 12, 6);
                c.fillStyle = col.energy;
                roundRect(c, 6, -4, 34, 8, 3);
                c.fill();
                c.stroke();
                break;

            case "fans":
                c.fillStyle = col.accent;
                c.beginPath();
                c.moveTo(0, 0);
                c.arc(0, 0, 26, -0.75, 0.75);
                c.closePath();
                c.fill();
                c.stroke();
                break;

            case "chain":
                c.strokeStyle = "#b0b8c4";
                c.lineWidth = 3;
                c.setLineDash([4, 3]);
                c.beginPath();
                c.moveTo(0, 0);
                c.lineTo(36, 6 + Math.sin(animTime * 8) * 3);
                c.stroke();
                c.setLineDash([]);
                c.fillStyle = col.accent;
                c.strokeStyle = "#000";
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(36, 0);
                c.lineTo(56, 6);
                c.lineTo(36, 12);
                c.closePath();
                c.fill();
                c.stroke();
                break;

            case "fire":
            case "light": {
                const auraR = (stateName === "attack" || stateName === "special" || stateName === "victory") ? 14 : 9;
                c.fillStyle = col.energy;
                c.beginPath();
                c.arc(8, 0, auraR + Math.sin(animTime * 16) * 2, 0, Math.PI * 2);
                c.fill();
                c.stroke();
                break;
            }
        }
        c.restore();
    }

    function drawFighter(c, fighter, fState, animTime, options = {}) {
        const {
            x = 0,
            y = 0,
            facing = 1,
            scale = 1,
            state = "idle", // idle | walk | jump | crouch | punch | kick | block | hit | special | victory | defeat
            stateTimer = 0,
            fierceEyes = false,
            shadowCoverEyes = false,
            alpha = 1
        } = options;

        const col = fighter.colors;
        const torsoW = fighter.bodyType === "heavy" ? 42 : (fighter.bodyType === "slim" ? 28 : 34);
        const torsoH = fighter.bodyType === "heavy" ? 48 : 44;

        c.save();
        c.globalAlpha = alpha;
        c.translate(x, y);
        c.scale(facing * scale, scale);

        // Posição de derrota no chão
        if (state === "defeat") {
            c.translate(0, -14);
            c.rotate(-Math.PI / 2);
        }

        const isCrouch = state === "crouch";
        const crouchOffset = isCrouch ? 24 : 0;
        const idleBob = state === "idle" ? Math.sin(animTime * 5) * 2.5 : 0;
        const walkSwing = state === "walk" ? Math.sin(animTime * 14) : 0;

        // Sombra no solo
        if (state !== "defeat" && !options.noShadow) {
            c.fillStyle = "rgba(0,0,0,0.3)";
            c.beginPath();
            c.ellipse(0, 0, 26, 7, 0, 0, Math.PI * 2);
            c.fill();
        }

        c.translate(0, -96 + crouchOffset + idleBob);
        c.strokeStyle = "#000000";
        c.lineWidth = 2.6;

        // Perna traseira e dianteira
        const drawLeg = (lx, swingAngle, isKickLeg) => {
            c.save();
            c.translate(lx, 44 - (isCrouch ? 14 : 0));
            const ang = isKickLeg ? -1.35 : swingAngle * 0.48;
            c.rotate(ang);
            c.fillStyle = fighter.bodyType === "dress" ? col.skin : col.main;
            roundRect(c, -7, 0, 14, isCrouch ? 28 : 40, 4);
            c.fill();
            c.stroke();
            // Bota/Tênis
            c.fillStyle = col.accent;
            roundRect(c, -7, (isCrouch ? 28 : 40) - 10, 19, 10, 3);
            c.fill();
            c.stroke();
            c.restore();
        };

        drawLeg(-8, -walkSwing, false);
        drawLeg(8, walkSwing, state === "kick");

        // Capa / Casaco traseiro (Freya, Raven, Nox)
        if (fighter.bodyType === "armor" || fighter.bodyType === "coat" || fighter.bodyType === "cloak") {
            c.fillStyle = fighter.bodyType === "armor" ? "#143a70" : col.main;
            c.beginPath();
            c.moveTo(-torsoW / 2, 4);
            c.lineTo(-torsoW / 2 - 14, 52);
            c.lineTo(0, 48);
            c.closePath();
            c.fill();
            c.stroke();
        }

        // Braço traseiro
        c.save();
        c.translate(-torsoW / 2 + 2, 10);
        c.rotate(state === "block" ? -0.9 : -walkSwing * 0.45);
        c.fillStyle = col.skin;
        roundRect(c, -5, 0, 11, 28, 4);
        c.fill();
        c.stroke();
        c.restore();

        // Tronco
        c.fillStyle = col.main;
        roundRect(c, -torsoW / 2, 4, torsoW, torsoH, 7);
        c.fill();
        c.stroke();

        // Detalhe no tronco
        c.fillStyle = col.accent;
        if (fighter.bodyType === "dress") {
            c.beginPath();
            c.moveTo(-torsoW / 2, 34);
            c.lineTo(-torsoW / 2 - 8, 60);
            c.lineTo(torsoW / 2 + 8, 60);
            c.lineTo(torsoW / 2, 34);
            c.closePath();
            c.fill();
            c.stroke();
        } else {
            c.fillRect(-torsoW / 2 + 4, 14, torsoW - 8, 7);
            c.strokeRect(-torsoW / 2 + 4, 14, torsoW - 8, 7);
        }

        // Cabeça + Cabelo exclusivo
        c.save();
        c.translate(0, -14);
        if (state === "hit") c.rotate(-0.22);

        // Cabelo comprido atrás (personagens femininas)
        if (fighter.gender === "F") {
            c.fillStyle = col.hair;
            if (fighter.hairType === "ponytail") {
                c.beginPath();
                c.ellipse(-19, -2, 10, 16, 0.4, 0, Math.PI * 2);
                c.fill();
                c.stroke();
            } else if (fighter.hairType === "long" || fighter.hairType === "wavy") {
                roundRect(c, -21, -15, 42, 42, 10);
                c.fill();
                c.stroke();
            } else if (fighter.hairType === "bob" || fighter.hairType === "cyber") {
                roundRect(c, -19, -15, 38, 28, 8);
                c.fill();
                c.stroke();
            }
        }

        // Rosto
        c.fillStyle = col.skin;
        roundRect(c, -16, -15, 32, 30, 8);
        c.fill();
        c.stroke();

        // Sombra dramática nos olhos durante a encarada (Etapa 3 da intro)
        if (shadowCoverEyes) {
            c.fillStyle = "rgba(0, 0, 0, 0.72)";
            c.fillRect(-15, -14, 30, 16);
        }

        // Olhos
        if (state === "hit" || state === "defeat") {
            c.strokeStyle = "#000";
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(2, -4); c.lineTo(8, 2);
            c.moveTo(8, -4); c.lineTo(2, 2);
            c.stroke();
        } else {
            c.fillStyle = (fierceEyes || fighter.hairType === "hood") ? col.energy : "#000000";
            c.fillRect(3, -5, 5, fierceEyes ? 4 : 7);
            c.fillRect(-5, -5, 4, fierceEyes ? 4 : 7);
            if (fierceEyes) {
                // Sobrancelha inclinada de rivalidade
                c.strokeStyle = "#000";
                c.lineWidth = 2.5;
                c.beginPath();
                c.moveTo(-7, -9); c.lineTo(10, -5);
                c.stroke();
            }
        }
        c.strokeStyle = "#000000";
        c.lineWidth = 2.6;

        // Cabelo frontal / Capuz
        c.fillStyle = fighter.hairType === "hood" ? col.main : col.hair;
        if (fighter.hairType === "spiky" || fighter.hairType === "flame") {
            c.beginPath();
            c.moveTo(-17, -6);
            c.lineTo(-19, -20);
            c.lineTo(-9, -16);
            c.lineTo(-3, -27);
            c.lineTo(4, -17);
            c.lineTo(12, -25);
            c.lineTo(18, -14);
            c.lineTo(17, -6);
            c.closePath();
            c.fill();
            c.stroke();
        } else if (fighter.hairType === "mohawk") {
            roundRect(c, -6, -27, 12, 16, 3);
            c.fill();
            c.stroke();
        } else if (fighter.hairType === "hood") {
            roundRect(c, -18, -18, 36, 16, 8);
            c.fill();
            c.stroke();
        } else {
            roundRect(c, -17, -17, 34, 12, 6);
            c.fill();
            c.stroke();
        }

        // Visor cyberpunk para Kira
        if (fighter.id === "kira") {
            c.fillStyle = col.energy;
            roundRect(c, -4, -7, 18, 6, 2);
            c.fill();
            c.stroke();
        }
        c.restore();

        // Braço dianteiro + Arma integrada sem atravessar o corpo
        c.save();
        c.translate(torsoW / 2 - 4, 12);
        let armAngle = 0.25 + walkSwing * 0.45;
        if (state === "punch") armAngle = -1.45;
        else if (state === "block") armAngle = -1.15;
        else if (state === "special") armAngle = -0.8;
        else if (state === "victory") armAngle = -2.2;
        else if (state === "kick") armAngle = -0.35;

        c.rotate(armAngle);
        c.fillStyle = col.skin;
        roundRect(c, -5, 0, 12, 28, 4);
        c.fill();
        c.stroke();

        // Mão + Arma posicionada na extremidade do braço
        c.translate(0, 26);
        c.rotate(state === "punch" ? 1.45 : (state === "victory" ? 0.6 : 1.1));
        drawWeaponInHand(c, fighter, state, animTime);
        c.restore();

        // Escudo visual quando defendendo
        if (state === "block") {
            c.strokeStyle = "#75e3ff";
            c.lineWidth = 4;
            c.beginPath();
            c.arc(16, 22, 34, -1.1, 1.1);
            c.stroke();
        }

        c.restore();
    }

    /* =========================================================================
       4. CENÁRIOS DAS 5 ARENAS
    ========================================================================= */
    function drawArenaBackground(c, arena, animTime, envParticles) {
        const W = WORLD.W;
        const H = WORLD.H;

        const grad = c.createLinearGradient(0, 0, 0, WORLD.FLOOR_Y);
        grad.addColorStop(0, arena.skyTop);
        grad.addColorStop(1, arena.skyBot);
        c.fillStyle = grad;
        c.fillRect(0, 0, W, WORLD.FLOOR_Y);

        if (arena.id === "neon") {
            // Prédios + letreiros neon
            const bHeights = [220, 310, 180, 340, 260, 290, 200, 320, 240];
            bHeights.forEach((bh, i) => {
                const bx = i * 130;
                c.fillStyle = i % 2 === 0 ? "#120f2b" : "#181338";
                c.fillRect(bx, WORLD.FLOOR_Y - bh, 122, bh);
                c.fillStyle = i % 3 === 0 ? "#ff4dff" : "#00f5d4";
                for (let wy = WORLD.FLOOR_Y - bh + 20; wy < WORLD.FLOOR_Y - 30; wy += 28) {
                    c.fillRect(bx + 18, wy, 18, 10);
                    c.fillRect(bx + 76, wy, 18, 10);
                }
            });
            // Letreiro central neon
            c.strokeStyle = "#ff4dff";
            c.lineWidth = 3;
            c.strokeRect(430, 120, 260, 56);
            c.fillStyle = "#00f5d4";
            c.font = "700 26px 'Space Grotesk', sans-serif";
            c.textAlign = "center";
            c.fillText("PUNCHBLOX", 560, 157);
        } else if (arena.id === "temple") {
            // Pilares de pedra + lava + tochas
            c.fillStyle = "#ff5500";
            c.fillRect(0, WORLD.FLOOR_Y - 36, W, 36);
            [140, 380, 740, 980].forEach(px => {
                c.fillStyle = "#2d1a18";
                c.fillRect(px - 26, 80, 52, WORLD.FLOOR_Y - 80);
                c.strokeStyle = "#000";
                c.lineWidth = 3;
                c.strokeRect(px - 26, 80, 52, WORLD.FLOOR_Y - 80);
                // Chama da tocha
                c.fillStyle = "#ffcf40";
                c.beginPath();
                c.arc(px, 195 + Math.sin(animTime * 14 + px) * 4, 18, 0, Math.PI * 2);
                c.fill();
            });
        } else if (arena.id === "ice") {
            // Montanhas congeladas + cristais
            c.fillStyle = "#8bc8e8";
            c.beginPath();
            c.moveTo(0, WORLD.FLOOR_Y);
            c.lineTo(180, 170);
            c.lineTo(360, WORLD.FLOOR_Y);
            c.lineTo(560, 130);
            c.lineTo(780, WORLD.FLOOR_Y);
            c.lineTo(960, 190);
            c.lineTo(W, WORLD.FLOOR_Y);
            c.closePath();
            c.fill();
            [110, 290, 860, 1020].forEach(cx => {
                c.fillStyle = "#75e3ff";
                c.strokeStyle = "#fff";
                c.lineWidth = 2;
                c.beginPath();
                c.moveTo(cx - 18, WORLD.FLOOR_Y);
                c.lineTo(cx, WORLD.FLOOR_Y - 95);
                c.lineTo(cx + 18, WORLD.FLOOR_Y);
                c.closePath();
                c.fill();
                c.stroke();
            });
        } else if (arena.id === "samurai") {
            // Lua dourada + pagode + cerejeiras
            c.fillStyle = "#ffcf40";
            c.beginPath();
            c.arc(560, 190, 96, 0, Math.PI * 2);
            c.fill();
            c.fillStyle = "#2a1215";
            c.fillRect(460, 260, 200, WORLD.FLOOR_Y - 260);
            c.beginPath();
            c.moveTo(410, 265);
            c.lineTo(560, 205);
            c.lineTo(710, 265);
            c.closePath();
            c.fill();
            [120, 990].forEach(tx => {
                c.fillStyle = "#3b1f1a";
                c.fillRect(tx - 12, 230, 24, WORLD.FLOOR_Y - 230);
                c.fillStyle = "#ff8dc7";
                c.beginPath();
                c.arc(tx, 210, 68, 0, Math.PI * 2);
                c.fill();
            });
        } else {
            // Arena do Caos: plataformas flutuantes + raios roxos
            c.strokeStyle = "rgba(192, 84, 255, 0.35)";
            c.lineWidth = 3;
            for (let i = 0; i < 6; i++) {
                c.beginPath();
                c.moveTo(i * 220, 0);
                c.lineTo(W / 2, WORLD.FLOOR_Y - 120);
                c.stroke();
            }
            [220, 560, 900].forEach((px, idx) => {
                const py = 180 + Math.sin(animTime * 2.5 + idx) * 14;
                c.fillStyle = "#2a144a";
                c.strokeStyle = "#c054ff";
                c.lineWidth = 3;
                c.fillRect(px - 60, py, 120, 22);
                c.strokeRect(px - 60, py, 120, 22);
            });
        }

        // Chão da arena
        c.fillStyle = arena.floor;
        c.fillRect(0, WORLD.FLOOR_Y, W, H - WORLD.FLOOR_Y);
        c.strokeStyle = arena.accent;
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(0, WORLD.FLOOR_Y);
        c.lineTo(W, WORLD.FLOOR_Y);
        c.stroke();

        // Partículas ambientais (chuva / neve / brasas / pétalas / caos)
        for (let i = 0; i < envParticles.length; i++) {
            const ep = envParticles[i];
            c.fillStyle = ep.color;
            if (arena.id === "neon") {
                c.fillRect(ep.x, ep.y, 2, 12);
            } else {
                c.beginPath();
                c.arc(ep.x, ep.y, ep.size, 0, Math.PI * 2);
                c.fill();
            }
        }
    }

    /* =========================================================================
       5. ESTADO GLOBAL, CONTROLES SIMULTÂNEOS E MOTOR DE COMBATE
    ========================================================================= */
    const settings = loadSettings();
    const audio = new FightAudio(settings);

    const dom = {
        screens: {
            menu: document.getElementById("screen-menu"),
            roster: document.getElementById("screen-roster"),
            names: document.getElementById("screen-names"),
            select: document.getElementById("screen-select"),
            confirm: document.getElementById("screen-confirm"),
            fight: document.getElementById("screen-fight")
        },
        quickMusicBtn: document.getElementById("quick-music-btn"),
        quickSfxBtn: document.getElementById("quick-sfx-btn"),
        menuP1Canvas: document.getElementById("menu-p1-canvas"),
        menuP2Canvas: document.getElementById("menu-p2-canvas"),
        btnMenuPlay: document.getElementById("btn-menu-play"),
        btnMenuTraining: document.getElementById("btn-menu-training"),
        btnMenuChars: document.getElementById("btn-menu-chars"),
        btnMenuHowto: document.getElementById("btn-menu-howto"),
        btnMenuSettings: document.getElementById("btn-menu-settings"),

        rosterGalleryGrid: document.getElementById("roster-gallery-grid"),
        btnRosterBack: document.getElementById("btn-roster-back"),

        namesForm: document.getElementById("names-form"),
        p1NameInput: document.getElementById("p1-name-input"),
        p2NameInput: document.getElementById("p2-name-input"),
        namesError: document.getElementById("names-error"),
        btnNamesBack: document.getElementById("btn-names-back"),

        selectSubtitle: document.getElementById("select-subtitle"),
        slotP1Box: document.getElementById("slot-p1-box"),
        slotP2Box: document.getElementById("slot-p2-box"),
        slotP1PlayerName: document.getElementById("slot-p1-player-name"),
        slotP2PlayerName: document.getElementById("slot-p2-player-name"),
        slotP1Canvas: document.getElementById("slot-p1-canvas"),
        slotP2Canvas: document.getElementById("slot-p2-canvas"),
        slotP1Char: document.getElementById("slot-p1-char"),
        slotP2Char: document.getElementById("slot-p2-char"),
        slotP1Spec: document.getElementById("slot-p1-spec"),
        slotP2Spec: document.getElementById("slot-p2-spec"),
        btnFocusP1: document.getElementById("btn-focus-p1"),
        btnFocusP2: document.getElementById("btn-focus-p2"),
        arenaSelect: document.getElementById("arena-select"),
        turnSelectHint: document.getElementById("turn-select-hint"),
        selectCardsGrid: document.getElementById("select-cards-grid"),
        selectError: document.getElementById("select-error"),
        btnSelectBack: document.getElementById("btn-select-back"),
        btnGoConfirm: document.getElementById("btn-go-confirm"),

        confirmArenaName: document.getElementById("confirm-arena-name"),
        confP1Player: document.getElementById("conf-p1-player"),
        confP2Player: document.getElementById("conf-p2-player"),
        confP1Canvas: document.getElementById("conf-p1-canvas"),
        confP2Canvas: document.getElementById("conf-p2-canvas"),
        confP1Char: document.getElementById("conf-p1-char"),
        confP2Char: document.getElementById("conf-p2-char"),
        confP1Special: document.getElementById("conf-p1-special"),
        confP2Special: document.getElementById("conf-p2-special"),
        btnConfirmBack: document.getElementById("btn-confirm-back"),
        btnStartFight: document.getElementById("btn-start-fight"),

        hudP1Portrait: document.getElementById("hud-p1-portrait"),
        hudP2Portrait: document.getElementById("hud-p2-portrait"),
        hudP1Player: document.getElementById("hud-p1-player"),
        hudP2Player: document.getElementById("hud-p2-player"),
        hudP1Char: document.getElementById("hud-p1-char"),
        hudP2Char: document.getElementById("hud-p2-char"),
        hudP1HpNum: document.getElementById("hud-p1-hp-num"),
        hudP2HpNum: document.getElementById("hud-p2-hp-num"),
        hudP1HpFill: document.getElementById("hud-p1-hp-fill"),
        hudP2HpFill: document.getElementById("hud-p2-hp-fill"),
        hudP1HpTrail: document.getElementById("hud-p1-hp-trail"),
        hudP2HpTrail: document.getElementById("hud-p2-hp-trail"),
        hudP1EnergyWrap: document.getElementById("hud-p1-energy-wrap"),
        hudP2EnergyWrap: document.getElementById("hud-p2-energy-wrap"),
        hudP1EnergyFill: document.getElementById("hud-p1-energy-fill"),
        hudP2EnergyFill: document.getElementById("hud-p2-energy-fill"),
        hudP1EnergyTxt: document.getElementById("hud-p1-energy-txt"),
        hudP2EnergyTxt: document.getElementById("hud-p2-energy-txt"),
        hudP1Rounds: document.getElementById("hud-p1-rounds"),
        hudP2Rounds: document.getElementById("hud-p2-rounds"),
        hudRoundLabel: document.getElementById("hud-round-label"),
        hudClock: document.getElementById("hud-clock"),
        btnFightPause: document.getElementById("btn-fight-pause"),
        fightCanvas: document.getElementById("fight-canvas"),

        trainingBar: document.getElementById("training-bar"),
        trComboDmg: document.getElementById("tr-combo-dmg"),
        trComboHits: document.getElementById("tr-combo-hits"),
        trLastDmg: document.getElementById("tr-last-dmg"),
        btnTrFillSpec: document.getElementById("btn-tr-fill-spec"),
        btnTrResetPos: document.getElementById("btn-tr-reset-pos"),
        btnTrExit: document.getElementById("btn-tr-exit"),

        overlayPause: document.getElementById("overlay-pause"),
        btnPauseResume: document.getElementById("btn-pause-resume"),
        btnPauseRestart: document.getElementById("btn-pause-restart"),
        btnPauseAudio: document.getElementById("btn-pause-audio"),
        btnPauseMenu: document.getElementById("btn-pause-menu"),

        overlayResult: document.getElementById("overlay-result"),
        resWinnerTitle: document.getElementById("res-winner-title"),
        resWinnerSub: document.getElementById("res-winner-sub"),
        resWinPlayer: document.getElementById("res-win-player"),
        resWinChar: document.getElementById("res-win-char"),
        resLosePlayer: document.getElementById("res-lose-player"),
        resLoseChar: document.getElementById("res-lose-char"),
        resRoundsScore: document.getElementById("res-rounds-score"),
        btnResRematch: document.getElementById("btn-res-rematch"),
        btnResMenu: document.getElementById("btn-res-menu"),

        modalHowto: document.getElementById("modal-howto"),
        btnCloseHowto: document.getElementById("btn-close-howto"),
        btnOkHowto: document.getElementById("btn-ok-howto"),

        modalSettings: document.getElementById("modal-settings"),
        btnCloseSettings: document.getElementById("btn-close-settings"),
        btnOkSettings: document.getElementById("btn-ok-settings"),
        cfgMasterVol: document.getElementById("cfg-master-vol"),
        cfgMusicVol: document.getElementById("cfg-music-vol"),
        cfgSfxVol: document.getElementById("cfg-sfx-vol"),
        lblMasterVol: document.getElementById("lbl-master-vol"),
        lblMusicVol: document.getElementById("lbl-music-vol"),
        lblSfxVol: document.getElementById("lbl-sfx-vol"),
        cfgMusicBtn: document.getElementById("cfg-music-btn"),
        cfgSfxBtn: document.getElementById("cfg-sfx-btn"),
        cfgFxQuality: document.getElementById("cfg-fx-quality")
    };

    const fightCtx = dom.fightCanvas.getContext("2d");

    const app = {
        mode: "menu", // menu | roster | names | select | confirm | intro | fighting | round_end | match_end | paused | training
        pausedFrom: null,
        isTraining: false,
        pickingSlot: 1,
        p1Name: "Jogador 1",
        p2Name: "Jogador 2",
        p1CharId: "kairo",
        p2CharId: "freya",
        arenaId: "neon",

        roundNumber: 1,
        roundClock: 99,
        p1RoundWins: 0,
        p2RoundWins: 0,
        roundResults: [],

        introTimer: 0,
        introLastBeat: 0,
        roundEndTimer: 0,
        matchEndTimer: 0,
        bannerText: "",
        bannerSub: "",

        // Efeitos cinematográficos de especial e câmera
        cinematic: { active: false, timer: 0, duration: 0, ownerSlot: 1, charId: "", zoom: 1, targetX: 560, targetY: 360, hitApplied: false },
        camShake: 0,
        flashAlpha: 0,
        flashColor: "#ffffff",

        // Treinamento
        trainComboHits: 0,
        trainComboDmg: 0,
        trainLastDmg: 0,
        trainComboResetTimer: 0,

        // Controles simultâneos
        heldCodes: new Set(),
        fighters: [],
        particles: [],
        slashLines: [],
        floatingTexts: [],
        envParticles: [],

        animClock: 0,
        rafId: null,
        lastTs: 0
    };

    function createCombatant(slot, playerName, charId, startX, facing) {
        const def = getFighterById(charId);
        return {
            slot,
            playerName,
            def,
            x: startX,
            y: WORLD.FLOOR_Y,
            vx: 0,
            vy: 0,
            facing,
            grounded: true,
            crouching: false,
            blocking: false,
            hp: 100,
            energy: 0,
            state: "idle", // idle | walk | jump | crouch | punch | kick | block | hit | special | victory | defeat
            actionTimer: 0,
            actionDuration: 0,
            attackHitDealt: false,
            comboStep: 0,
            comboWindow: 0,
            hitStunTimer: 0,
            comboHitsTaken: 0
        };
    }

    /* =========================================================================
       6. TELAS, CARDS DOS 12 PERSONAGENS E SELEÇÃO
    ========================================================================= */
    function switchScreen(screenName, modeName) {
        Object.entries(dom.screens).forEach(([k, el]) => {
            el.classList.toggle("active", k === screenName);
        });
        app.mode = modeName;
        app.heldCodes.clear();
        if (screenName === "menu") audio.setTrack("menu");
    }

    function buildCharacterCard(f, opts = {}) {
        const card = document.createElement(opts.clickable ? "button" : "div");
        if (opts.clickable) card.type = "button";
        card.className = "char-card" + (opts.clickable ? " clickable" : "");

        if (opts.pickedBy === 1) card.classList.add("picked-p1");
        if (opts.pickedBy === 2) card.classList.add("picked-p2");
        if (opts.disabled) {
            card.classList.add("is-taken");
            card.disabled = true;
        }

        const badgeTag = opts.pickedBy === 1 ? " [J1]" : (opts.pickedBy === 2 ? " [J2]" : "");

        card.innerHTML = `
            <div class="char-card-top">
                <canvas class="char-card-canvas" width="66" height="76"></canvas>
                <div class="char-card-titles">
                    <strong>${f.name}${badgeTag}</strong>
                    <span class="char-gender-pill ${f.gender === "M" ? "g-m" : "g-f"}">
                        ${f.gender === "M" ? "Masculino" : "Feminino"} • ${f.weaponLabel}
                    </span>
                    <small>${f.title} (${f.style})</small>
                </div>
            </div>
            <p class="char-card-desc">${f.desc}</p>
            <div class="char-stats-bars">
                <div class="stat-line"><span>Força</span><div class="stat-track"><div class="stat-fill fill-atk" style="width:${f.atk * 10}%"></div></div></div>
                <div class="stat-line"><span>Veloc.</span><div class="stat-track"><div class="stat-fill fill-spd" style="width:${f.spd * 10}%"></div></div></div>
                <div class="stat-line"><span>Defesa</span><div class="stat-track"><div class="stat-fill fill-def" style="width:${f.def * 10}%"></div></div></div>
            </div>
            <div class="char-special-tag">⚡ Especial: ${f.specialName}</div>
        `;

        const cv = card.querySelector("canvas");
        const cc = cv.getContext("2d");
        drawFighter(cc, f, null, 0, { x: 33, y: 70, facing: 1, scale: 0.62, state: "idle", noShadow: true });

        if (opts.onClick) card.addEventListener("click", opts.onClick);
        return card;
    }

    function renderRosterGallery() {
        dom.rosterGalleryGrid.innerHTML = "";
        FIGHTERS.forEach(f => {
            dom.rosterGalleryGrid.appendChild(buildCharacterCard(f, { clickable: false }));
        });
    }

    function populateArenaSelector() {
        dom.arenaSelect.innerHTML = "";
        ARENAS.forEach(a => {
            const opt = document.createElement("option");
            opt.value = a.id;
            opt.textContent = a.name;
            dom.arenaSelect.appendChild(opt);
        });
        dom.arenaSelect.value = app.arenaId;
    }

    function refreshSelectionScreen() {
        dom.selectSubtitle.textContent = app.isTraining
            ? "Modo Treinamento: escolha seu lutador, o boneco alvo e a arena."
            : "Cada jogador deve escolher um lutador diferente e a arena do combate.";

        dom.slotP1PlayerName.textContent = app.isTraining ? "VOCÊ (J1)" : app.p1Name;
        dom.slotP2PlayerName.textContent = app.isTraining ? "ALVO (TREINO)" : app.p2Name;
        dom.btnFocusP1.textContent = app.isTraining ? "Escolher Seu" : "Escolher J1";
        dom.btnFocusP2.textContent = app.isTraining ? "Escolher Alvo" : "Escolher J2";

        dom.slotP1Box.classList.toggle("is-choosing", app.pickingSlot === 1);
        dom.slotP2Box.classList.toggle("is-choosing", app.pickingSlot === 2);
        dom.turnSelectHint.textContent = app.pickingSlot === 1
            ? `Vez de: ${app.isTraining ? "Você" : app.p1Name}`
            : `Vez de: ${app.isTraining ? "Alvo" : app.p2Name}`;

        const f1 = getFighterById(app.p1CharId);
        const f2 = getFighterById(app.p2CharId);

        dom.slotP1Char.textContent = `${f1.name} — ${f1.title}`;
        dom.slotP1Spec.textContent = `Especial: ${f1.specialName}`;
        dom.slotP2Char.textContent = `${f2.name} — ${f2.title}`;
        dom.slotP2Spec.textContent = `Especial: ${f2.specialName}`;

        const c1 = dom.slotP1Canvas.getContext("2d");
        c1.clearRect(0, 0, 90, 105);
        drawFighter(c1, f1, null, 0, { x: 45, y: 98, facing: 1, scale: 0.8, state: "idle", noShadow: true });

        const c2 = dom.slotP2Canvas.getContext("2d");
        c2.clearRect(0, 0, 90, 105);
        drawFighter(c2, f2, null, 0, { x: 45, y: 98, facing: -1, scale: 0.8, state: "idle", noShadow: true });

        dom.selectCardsGrid.innerHTML = "";
        FIGHTERS.forEach(f => {
            const p1Picked = app.p1CharId === f.id;
            const p2Picked = app.p2CharId === f.id;
            const blockedSame = !app.isTraining && ((app.pickingSlot === 1 && p2Picked) || (app.pickingSlot === 2 && p1Picked));

            const card = buildCharacterCard(f, {
                clickable: true,
                pickedBy: p1Picked ? 1 : (p2Picked ? 2 : 0),
                disabled: blockedSame,
                onClick: () => {
                    if (!app.isTraining && ((app.pickingSlot === 1 && app.p2CharId === f.id) || (app.pickingSlot === 2 && app.p1CharId === f.id))) {
                        dom.selectError.textContent = "Os dois jogadores não podem escolher o mesmo lutador!";
                        dom.selectError.classList.remove("hidden");
                        return;
                    }
                    dom.selectError.classList.add("hidden");
                    audio.playSelect();
                    if (app.pickingSlot === 1) {
                        app.p1CharId = f.id;
                        app.pickingSlot = 2;
                    } else {
                        app.p2CharId = f.id;
                    }
                    refreshSelectionScreen();
                }
            });
            dom.selectCardsGrid.appendChild(card);
        });
    }

    function openConfirmScreen() {
        const f1 = getFighterById(app.p1CharId);
        const f2 = getFighterById(app.p2CharId);
        const arena = getArenaById(app.arenaId);

        dom.confirmArenaName.textContent = `Arena: ${arena.name}`;
        dom.confP1Player.textContent = app.p1Name;
        dom.confP2Player.textContent = app.p2Name;
        dom.confP1Char.textContent = `${f1.name} — ${f1.title}`;
        dom.confP2Char.textContent = `${f2.name} — ${f2.title}`;
        dom.confP1Special.textContent = `Especial: ${f1.specialName}`;
        dom.confP2Special.textContent = `Especial: ${f2.specialName}`;

        const c1 = dom.confP1Canvas.getContext("2d");
        c1.clearRect(0, 0, 150, 170);
        drawFighter(c1, f1, null, 0, { x: 75, y: 158, facing: 1, scale: 1.25, state: "idle", noShadow: true });

        const c2 = dom.confP2Canvas.getContext("2d");
        c2.clearRect(0, 0, 150, 170);
        drawFighter(c2, f2, null, 0, { x: 75, y: 158, facing: -1, scale: 1.25, state: "idle", noShadow: true });

        audio.playConfirm();
        switchScreen("confirm", "confirm");
    }

    /* =========================================================================
       7. INÍCIO DE COMBATE, INTRODUÇÃO CINEMATOGRÁFICA, ROUNDS E TREINAMENTO
    ========================================================================= */
    function initEnvParticles(arena) {
        app.envParticles = [];
        const count = settings.fxQuality === "low" ? 18 : (settings.fxQuality === "high" ? 55 : 34);
        for (let i = 0; i < count; i++) {
            app.envParticles.push({
                x: Math.random() * WORLD.W,
                y: Math.random() * WORLD.FLOOR_Y,
                vx: arena.id === "ice" ? -45 - Math.random() * 45 : (arena.id === "samurai" ? -25 - Math.random() * 20 : 0),
                vy: arena.id === "neon" ? 520 : (arena.id === "temple" || arena.id === "chaos" ? -35 - Math.random() * 40 : 45 + Math.random() * 45),
                size: 2.5 + Math.random() * 3,
                color: arena.id === "neon" ? "rgba(117,227,255,0.55)"
                    : arena.id === "temple" ? "#ff9800"
                    : arena.id === "ice" ? "#ffffff"
                    : arena.id === "samurai" ? "#ff9ed2"
                    : "#c054ff"
            });
        }
    }

    function setupFightHudStatic() {
        const f1 = getFighterById(app.p1CharId);
        const f2 = getFighterById(app.p2CharId);

        dom.hudP1Player.textContent = app.isTraining ? "TREINO (VOCÊ)" : app.p1Name;
        dom.hudP2Player.textContent = app.isTraining ? "BONECO ALVO" : app.p2Name;
        dom.hudP1Char.textContent = f1.name.toUpperCase();
        dom.hudP2Char.textContent = f2.name.toUpperCase();

        const p1C = dom.hudP1Portrait.getContext("2d");
        p1C.clearRect(0, 0, 56, 56);
        drawFighter(p1C, f1, null, 0, { x: 28, y: 74, facing: 1, scale: 0.72, state: "idle", noShadow: true });

        const p2C = dom.hudP2Portrait.getContext("2d");
        p2C.clearRect(0, 0, 56, 56);
        drawFighter(p2C, f2, null, 0, { x: 28, y: 74, facing: -1, scale: 0.72, state: "idle", noShadow: true });
    }

    function startNew2PMatch() {
        app.isTraining = false;
        app.roundNumber = 1;
        app.p1RoundWins = 0;
        app.p2RoundWins = 0;
        app.roundResults = [];

        setupFightHudStatic();
        dom.trainingBar.classList.add("hidden");
        dom.overlayPause.classList.add("hidden");
        dom.overlayResult.classList.add("hidden");

        initEnvParticles(getArenaById(app.arenaId));
        resetRoundEntities();
        updateFightHud();

        // Inicia Introdução Cinematográfica de 5 etapas
        app.introTimer = 0;
        app.introLastBeat = -1;
        audio.setTrack("intro");
        switchScreen("fight", "intro");
    }

    function startTrainingSession() {
        app.isTraining = true;
        app.roundNumber = 1;
        app.p1RoundWins = 0;
        app.p2RoundWins = 0;
        app.trainComboHits = 0;
        app.trainComboDmg = 0;
        app.trainLastDmg = 0;

        setupFightHudStatic();
        dom.trainingBar.classList.remove("hidden");
        dom.overlayPause.classList.add("hidden");
        dom.overlayResult.classList.add("hidden");

        initEnvParticles(getArenaById(app.arenaId));
        resetRoundEntities();
        app.fighters[0].energy = 100;
        updateFightHud();
        updateTrainingBar();

        audio.setTrack(app.arenaId);
        switchScreen("fight", "training");
    }

    function resetRoundEntities() {
        app.roundClock = 99;
        app.cinematic.active = false;
        app.particles = [];
        app.slashLines = [];
        app.floatingTexts = [];
        app.camShake = 0;
        app.flashAlpha = 0;

        app.fighters = [
            createCombatant(1, app.p1Name, app.p1CharId, 280, 1),
            createCombatant(2, app.p2Name, app.p2CharId, 840, -1)
        ];
    }

    function updateFightHud() {
        const [f1, f2] = app.fighters;
        if (!f1 || !f2) return;

        dom.hudP1HpNum.textContent = String(Math.ceil(f1.hp));
        dom.hudP1HpFill.style.width = `${clamp(f1.hp, 0, 100)}%`;
        dom.hudP1HpTrail.style.width = `${clamp(f1.hp, 0, 100)}%`;

        dom.hudP2HpNum.textContent = app.isTraining ? "∞" : String(Math.ceil(f2.hp));
        dom.hudP2HpFill.style.width = app.isTraining ? "100%" : `${clamp(f2.hp, 0, 100)}%`;
        dom.hudP2HpTrail.style.width = app.isTraining ? "100%" : `${clamp(f2.hp, 0, 100)}%`;

        const e1 = Math.floor(f1.energy);
        const e2 = Math.floor(f2.energy);
        dom.hudP1EnergyFill.style.width = `${e1}%`;
        dom.hudP1EnergyWrap.classList.toggle("is-full", e1 >= 100);
        dom.hudP1EnergyTxt.textContent = e1 >= 100 ? "ESPECIAL PRONTO! [R]" : `ESPECIAL [R]: ${e1}%`;

        dom.hudP2EnergyFill.style.width = `${e2}%`;
        dom.hudP2EnergyWrap.classList.toggle("is-full", e2 >= 100);
        dom.hudP2EnergyTxt.textContent = e2 >= 100 ? "ESPECIAL PRONTO! [NUM 5]" : `ESPECIAL [NUM 5]: ${e2}%`;

        dom.hudRoundLabel.textContent = app.isTraining ? "TREINO" : `ROUND ${app.roundNumber}`;
        dom.hudClock.textContent = app.isTraining ? "∞" : String(Math.ceil(app.roundClock));

        const p1Pips = dom.hudP1Rounds.querySelectorAll(".r-pip");
        const p2Pips = dom.hudP2Rounds.querySelectorAll(".r-pip");
        p1Pips.forEach((el, i) => el.classList.toggle("won", i < app.p1RoundWins));
        p2Pips.forEach((el, i) => el.classList.toggle("won", i < app.p2RoundWins));
    }

    function updateTrainingBar() {
        dom.trComboDmg.textContent = String(app.trainComboDmg);
        dom.trComboHits.textContent = String(app.trainComboHits);
        dom.trLastDmg.textContent = String(app.trainLastDmg);
    }

    /* =========================================================================
       8. AÇÕES DE COMBATE, COLISÕES E ESPECIAIS EXCLUSIVOS
    ========================================================================= */
    function startFighterAttack(attacker, isKick) {
        if (attacker.state === "hit" || attacker.state === "special" || attacker.blocking || attacker.crouching) return;
        if (attacker.state === "punch" || attacker.state === "kick") {
            // Permite encadear combo se estiver no final do golpe atual
            if (attacker.comboWindow <= 0) return;
        }

        attacker.state = isKick ? "kick" : "punch";
        attacker.actionDuration = isKick ? 0.36 : 0.24;
        attacker.actionTimer = attacker.actionDuration;
        attacker.attackHitDealt = false;
        attacker.comboStep = (attacker.comboStep % 3) + 1;
        attacker.comboWindow = 0;

        // Pequeno avanço tático no soco/chute
        attacker.vx = attacker.facing * (isKick ? 130 : 90);
        audio.playAttack(isKick);
    }

    function triggerSpecial(attacker, defender) {
        if (attacker.energy < 100) return;
        if (attacker.state === "hit" || attacker.state === "special" || attacker.blocking) return;

        attacker.energy = 0;
        attacker.state = "special";
        attacker.actionDuration = 1.15;
        attacker.actionTimer = 1.15;
        attacker.vx = 0;
        attacker.vy = 0;

        app.cinematic = {
            active: true,
            timer: 0,
            duration: 1.15,
            ownerSlot: attacker.slot,
            charId: attacker.def.id,
            zoom: 1.18,
            targetX: (attacker.x + defender.x) / 2,
            targetY: WORLD.FLOOR_Y - 85,
            hitApplied: false
        };

        app.flashColor = attacker.def.colors.energy;
        app.flashAlpha = 0.45;
        audio.playSpecial(attacker.def.id);
        updateFightHud();
    }

    function applyDamage(attacker, defender, rawDamage, knockX, knockY, isSpecialHit = false) {
        const blocked = defender.blocking && !isSpecialHit;
        const defScale = 1 - (defender.def.def - 5) * 0.035;
        const atkScale = 1 + (attacker.def.atk - 7) * 0.04;

        let finalDmg = Math.max(2, Math.round(rawDamage * atkScale * defScale));
        if (blocked) {
            finalDmg = Math.max(1, Math.round(finalDmg * 0.25));
            audio.playBlock();
            spawnSparkBurst(defender.x + defender.facing * 20, defender.y - 64, "#75e3ff", 10);
            spawnFloatingText(defender.x, defender.y - 108, `BLOQ -${finalDmg}`, "#75e3ff");
        } else {
            audio.playHit(isSpecialHit || rawDamage >= 13, attacker.def.id);
            spawnSparkBurst(defender.x, defender.y - 64, attacker.def.colors.energy, isSpecialHit ? 28 : 12);
            spawnFloatingText(defender.x, defender.y - 112, `-${finalDmg}`, isSpecialHit ? "#ffcf40" : "#ff4d5a");

            defender.state = "hit";
            defender.hitStunTimer = isSpecialHit ? 0.44 : (rawDamage >= 13 ? 0.28 : 0.2);
            defender.comboHitsTaken += 1;
            app.camShake = isSpecialHit ? 14 : 6;
        }

        defender.vx = knockX * (blocked ? 0.45 : 1);
        if (!blocked && knockY < 0) {
            defender.vy = knockY;
            defender.grounded = false;
        }

        // Energia ganho para ambos
        if (!isSpecialHit) {
            attacker.energy = clamp(attacker.energy + (blocked ? 6 : 18), 0, 100);
        }
        defender.energy = clamp(defender.energy + 12, 0, 100);

        if (app.isTraining && defender.slot === 2) {
            app.trainComboHits += 1;
            app.trainComboDmg += finalDmg;
            app.trainLastDmg = finalDmg;
            app.trainComboResetTimer = 1.6;
            updateTrainingBar();
            updateFightHud();
            return;
        }

        defender.hp = Math.max(0, defender.hp - finalDmg);
        updateFightHud();

        if (defender.hp <= 0) {
            finishRound(attacker.slot);
        }
    }

    async function finishRound(winnerSlot) {
        const [f1, f2] = app.fighters;
        const winner = winnerSlot === 1 ? f1 : f2;
        const loser = winnerSlot === 1 ? f2 : f1;

        loser.state = "defeat";
        winner.state = "victory";
        app.cinematic.active = false;
        app.roundResults.push(winnerSlot);

        if (winnerSlot === 1) app.p1RoundWins += 1;
        else app.p2RoundWins += 1;

        updateFightHud();
        audio.playRoundEnd();

if (app.p1RoundWins >= 2 || app.p2RoundWins >= 2) {
            app.mode = "match_end";
            app.matchEndTimer = 2.2;
            app.bannerText = `${winner.def.name.toUpperCase()} VENCEU!`;
            app.bannerSub = `${winner.playerName} é o campeão!`;
            audio.playVictory();
            setTimeout(() => audio.playDefeat(), 280);

            if (!app.isTraining) {
                const bonusInvicto = Math.abs(app.p1RoundWins - app.p2RoundWins) === 2 ? 50 : 0;
                const pontuacaoFinalPunchBlox = 100 + Math.round(winner.hp) + bonusInvicto;
                await enviarPontuacao("punch_blox", pontuacaoFinalPunchBlox);
            }
        } else {
            app.mode = "round_end";
            app.roundEndTimer = 2.1;
            app.bannerText = `ROUND ${app.roundNumber} — KO!`;
            app.bannerSub = `${winner.def.name} (${winner.playerName}) venceu o round!`;
        }
    }

    function spawnSparkBurst(x, y, color, count) {
        const mult = settings.fxQuality === "low" ? 0.5 : (settings.fxQuality === "high" ? 1.4 : 1);
        const total = Math.max(3, Math.round(count * mult));
        for (let i = 0; i < total; i++) {
            const a = Math.random() * Math.PI * 2;
            const spd = 90 + Math.random() * 290;
            app.particles.push({
                x, y,
                vx: Math.cos(a) * spd,
                vy: Math.sin(a) * spd,
                size: 4 + Math.random() * 5,
                life: 0.28 + Math.random() * 0.25,
                maxLife: 0.53,
                color
            });
        }
    }

    function spawnFloatingText(x, y, text, color) {
        app.floatingTexts.push({ x, y, text, color, life: 0.72, maxLife: 0.72 });
    }

    /* =========================================================================
       9. UPDATE PRINCIPAL (INTRO, COMBATE, ESPECIAIS, PAUSA E TREINO)
    ========================================================================= */
    function updateEnvParticles(dt) {
        for (let i = 0; i < app.envParticles.length; i++) {
            const ep = app.envParticles[i];
            ep.x += ep.vx * dt;
            ep.y += ep.vy * dt;
            if (ep.x < 0) ep.x += WORLD.W;
            if (ep.x > WORLD.W) ep.x -= WORLD.W;
            if (ep.y < 0) ep.y += WORLD.FLOOR_Y;
            if (ep.y > WORLD.FLOOR_Y) ep.y -= WORLD.FLOOR_Y;
        }
    }

    function updateParticles(dt) {
        for (let i = app.particles.length - 1; i >= 0; i--) {
            const pt = app.particles[i];
            pt.vy += 420 * dt;
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.life -= dt;
            if (pt.life <= 0) app.particles.splice(i, 1);
        }
        for (let i = app.slashLines.length - 1; i >= 0; i--) {
            app.slashLines[i].life -= dt;
            if (app.slashLines[i].life <= 0) app.slashLines.splice(i, 1);
        }
        for (let i = app.floatingTexts.length - 1; i >= 0; i--) {
            const ft = app.floatingTexts[i];
            ft.y -= 36 * dt;
            ft.life -= dt;
            if (ft.life <= 0) app.floatingTexts.splice(i, 1);
        }
    }

    function updateFightersPhysics(dt) {
        const [f1, f2] = app.fighters;

        const handleControl = (f, opp, leftC, rightC, upC, downC, blockC) => {
            if (app.isTraining && f.slot === 2) {
                // Boneco do treinamento permanece parado sem atacar
                f.vx *= 0.85;
                f.blocking = false;
                f.crouching = false;
                if (f.hitStunTimer > 0) {
                    f.hitStunTimer -= dt;
                    if (f.hitStunTimer <= 0) f.state = "idle";
                } else {
                    f.state = "idle";
                }
                return;
            }

            if (f.state === "special" || f.state === "victory" || f.state === "defeat") return;

            if (f.hitStunTimer > 0) {
                f.hitStunTimer -= dt;
                if (f.hitStunTimer <= 0) f.state = "idle";
                return;
            }

            if (f.actionTimer > 0) {
                f.actionTimer -= dt;
                const progress = 1 - f.actionTimer / f.actionDuration;

                // Janela ativa de acerto do soco ou chute
                if ((f.state === "punch" || f.state === "kick") && !f.attackHitDealt && progress >= 0.25 && progress <= 0.68) {
                    const reach = f.state === "kick" ? 96 : 74;
                    const distX = (opp.x - f.x) * f.facing;
                    const distY = Math.abs(opp.y - f.y);
                    const hitHeightOk = !(f.state === "punch" && opp.crouching && distY < 10) && distY < 74;

                    if (distX > -12 && distX <= reach && hitHeightOk) {
                        f.attackHitDealt = true;
                        f.comboWindow = 0.28;
                        const baseDmg = f.state === "kick" ? 14 : 9;
                        const knockX = f.facing * (f.state === "kick" ? 310 : 145);
                        applyDamage(f, opp, baseDmg, knockX, f.state === "kick" ? -120 : 0, false);
                    }
                }

                if (f.actionTimer <= 0) {
                    f.state = "idle";
                }
                return;
            }

            if (f.comboWindow > 0) f.comboWindow = Math.max(0, f.comboWindow - dt);

            // Direcionamento automático para o oponente
            if (opp.x !== f.x) f.facing = opp.x > f.x ? 1 : -1;

            f.blocking = app.heldCodes.has(blockC) && f.grounded;
            f.crouching = !f.blocking && app.heldCodes.has(downC) && f.grounded;

            if (f.blocking) {
                f.vx = 0;
                f.state = "block";
                return;
            }
            if (f.crouching) {
                f.vx = 0;
                f.state = "crouch";
                return;
            }

            const moveSpeed = 240 + (f.def.spd - 5) * 26;
            let moveDir = 0;
            if (app.heldCodes.has(leftC)) moveDir -= 1;
            if (app.heldCodes.has(rightC)) moveDir += 1;

            f.vx = moveDir * moveSpeed;

            if (app.heldCodes.has(upC) && f.grounded) {
                f.vy = -780;
                f.grounded = false;
                audio.playJump();
            }

            if (!f.grounded) f.state = "jump";
            else if (moveDir !== 0) f.state = "walk";
            else f.state = "idle";
        };

        handleControl(f1, f2, "KeyA", "KeyD", "KeyW", "KeyS", "KeyK");
        handleControl(f2, f1, "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Numpad2");

        // Integração física (gravidade, chão, paredes e separação de corpos)
        [f1, f2].forEach(f => {
            f.x += f.vx * dt;
            f.y += f.vy * dt;

            if (!f.grounded) {
                f.vy += WORLD.GRAVITY * dt;
            }
            if (f.y >= WORLD.FLOOR_Y) {
                f.y = WORLD.FLOOR_Y;
                f.vy = 0;
                f.grounded = true;
            }

            if (f.hitStunTimer > 0 || f.state === "punch" || f.state === "kick") {
                f.vx *= Math.pow(0.05, dt);
            }

            f.x = clamp(f.x, WORLD.LEFT, WORLD.RIGHT);
        });

        // Colisão entre personagens (não atravessam livremente no chão)
        if (!app.cinematic.active) {
            const minGap = 48;
            const dx = f2.x - f1.x;
            const dy = Math.abs(f2.y - f1.y);
            if (Math.abs(dx) < minGap && dy < 72) {
                const push = (minGap - Math.abs(dx)) * 0.5;
                const sign = dx >= 0 ? 1 : -1;
                f1.x = clamp(f1.x - sign * push, WORLD.LEFT, WORLD.RIGHT);
                f2.x = clamp(f2.x + sign * push, WORLD.LEFT, WORLD.RIGHT);
            }
        }
    }

    function updateCinematicSpecial(dt) {
        const cin = app.cinematic;
        if (!cin.active) return;

        const [f1, f2] = app.fighters;
        const attacker = cin.ownerSlot === 1 ? f1 : f2;
        const defender = cin.ownerSlot === 1 ? f2 : f1;

        cin.timer += dt;
        const prog = clamp(cin.timer / cin.duration, 0, 1);

        // Movimento cinematográfico exclusivo conforme o personagem
        if (prog < 0.35) {
            // Preparação
            cin.zoom = 1 + prog * 0.5;
            cin.targetX = attacker.x;
            if (attacker.def.id === "freya" || attacker.def.id === "luna") {
                attacker.y = WORLD.FLOOR_Y - Math.sin((prog / 0.35) * Math.PI * 0.5) * 90;
            }
        } else if (prog >= 0.35 && !cin.hitApplied) {
            cin.hitApplied = true;
            const charId = attacker.def.id;

            // Posicionamento/efeito exclusivo por lutador
            if (charId === "kairo") {
                // Corte do Dragão: atravessa e para do outro lado do adversário!
                const crossX = clamp(defender.x + attacker.facing * 95, WORLD.LEFT, WORLD.RIGHT);
                app.slashLines.push({ x1: attacker.x, y1: WORLD.FLOOR_Y - 58, x2: crossX, y2: WORLD.FLOOR_Y - 58, color: "#ff2e43", life: 0.45, maxLife: 0.45 });
                attacker.x = crossX;
                attacker.facing = -attacker.facing;
            } else if (charId === "zephyr" || charId === "akira" || charId === "nyx") {
                // Teleportes / cópias ao redor do adversário
                [defender.x - 70, defender.x + 70, defender.x].forEach(px => {
                    spawnSparkBurst(px, WORLD.FLOOR_Y - 55, attacker.def.colors.energy, 10);
                });
                attacker.x = clamp(defender.x - attacker.facing * 72, WORLD.LEFT, WORLD.RIGHT);
            } else if (charId === "freya") {
                // Lança Celestial: mergulho vertical explosivo
                attacker.y = WORLD.FLOOR_Y;
                attacker.x = clamp(defender.x - attacker.facing * 64, WORLD.LEFT, WORLD.RIGHT);
                app.slashLines.push({ x1: defender.x, y1: 40, x2: defender.x, y2: WORLD.FLOOR_Y, color: "#ffe066", life: 0.5, maxLife: 0.5 });
            } else {
                // Onda de choque / feixe cruzando arena até o oponente
                app.slashLines.push({ x1: attacker.x, y1: WORLD.FLOOR_Y - 54, x2: defender.x, y2: WORLD.FLOOR_Y - 54, color: attacker.def.colors.energy, life: 0.45, maxLife: 0.45 });
            }

            app.flashColor = attacker.def.colors.energy;
            app.flashAlpha = 0.55;
            applyDamage(attacker, defender, 28, attacker.facing * 360, -240, true);
        } else {
            // Recuperação suave
            cin.zoom = 1.18 - (prog - 0.35) * 0.27;
            attacker.y += (WORLD.FLOOR_Y - attacker.y) * Math.min(1, dt * 12);
        }

        if (prog >= 1) {
            cin.active = false;
            attacker.y = WORLD.FLOOR_Y;
            if (attacker.state === "special") attacker.state = "idle";
        }
    }

    function updateMain(dt) {
        app.animClock += dt;

        // Menu: anima lutadores em combate vermelho vs azul
        if (app.mode === "menu") {
            const p1C = dom.menuP1Canvas.getContext("2d");
            p1C.clearRect(0, 0, 210, 260);
            drawFighter(p1C, FIGHTERS[0], null, app.animClock, { x: 105, y: 235, facing: 1, scale: 1.55, state: "idle" });

            const p2C = dom.menuP2Canvas.getContext("2d");
            p2C.clearRect(0, 0, 210, 260);
            drawFighter(p2C, FIGHTERS[7], null, app.animClock, { x: 105, y: 235, facing: -1, scale: 1.55, state: "idle" });
            return;
        }

        if (app.mode === "paused" || app.mode === "roster" || app.mode === "names" || app.mode === "select" || app.mode === "confirm") {
            return;
        }

        updateEnvParticles(dt);
        updateParticles(dt);

        if (app.flashAlpha > 0) app.flashAlpha = Math.max(0, app.flashAlpha - dt * 1.8);
        if (app.camShake > 0) app.camShake = Math.max(0, app.camShake - dt * 28);

        // Sequência Cinematográfica de Introdução (Etapas 1 a 5)
        if (app.mode === "intro") {
            app.introTimer += dt;
            const t = app.introTimer;

            // Sons sincronizados na contagem regressiva (5.0s, 5.55s, 6.1s, 6.65s)
            if (t >= 5.0 && app.introLastBeat < 1) { app.introLastBeat = 1; audio.playCountdown(false); }
            if (t >= 5.55 && app.introLastBeat < 2) { app.introLastBeat = 2; audio.playCountdown(false); }
            if (t >= 6.1 && app.introLastBeat < 3) { app.introLastBeat = 3; audio.playCountdown(false); }
            if (t >= 6.65 && app.introLastBeat < 4) {
                app.introLastBeat = 4;
                audio.playCountdown(true);
                app.flashColor = "#ffcf40";
                app.flashAlpha = 0.5;
            }
            if (t >= 7.2) {
                app.mode = "fighting";
                audio.setTrack(app.arenaId);
            }
            return;
        }

        if (app.mode === "round_end") {
            app.roundEndTimer -= dt;
            if (app.roundEndTimer <= 0) {
                app.roundNumber += 1;
                resetRoundEntities();
                updateFightHud();
                app.mode = "fighting";
                audio.playCountdown(true);
            }
            return;
        }

        if (app.mode === "match_end") {
            app.matchEndTimer -= dt;
            if (app.matchEndTimer <= 0 && dom.overlayResult.classList.contains("hidden")) {
                showMatchResultOverlay();
            }
            return;
        }

        // Luta ativa ou Treinamento
        if (app.mode === "fighting" || app.mode === "training") {
            if (app.cinematic.active) {
                updateCinematicSpecial(dt);
            } else {
                updateFightersPhysics(dt);
            }

            if (app.mode === "fighting" && !app.cinematic.active) {
                app.roundClock -= dt;
                dom.hudClock.textContent = String(Math.max(0, Math.ceil(app.roundClock)));
                if (app.roundClock <= 0) {
                    const [f1, f2] = app.fighters;
                    finishRound(f1.hp >= f2.hp ? 1 : 2);
                }
            }

            if (app.mode === "training") {
                const f1 = app.fighters[0];
                if (f1.energy < 100) {
                    f1.energy = Math.min(100, f1.energy + dt * 20);
                    updateFightHud();
                }
                if (app.trainComboResetTimer > 0) {
                    app.trainComboResetTimer -= dt;
                    if (app.trainComboResetTimer <= 0) {
                        app.trainComboHits = 0;
                        app.trainComboDmg = 0;
                        updateTrainingBar();
                    }
                }
            }
        }
    }

    function showMatchResultOverlay() {
        const p1Won = app.p1RoundWins >= app.p2RoundWins;
        const winSlot = p1Won ? 1 : 2;
        const winPlayer = winSlot === 1 ? app.p1Name : app.p2Name;
        const losePlayer = winSlot === 1 ? app.p2Name : app.p1Name;
        const winChar = getFighterById(winSlot === 1 ? app.p1CharId : app.p2CharId);
        const loseChar = getFighterById(winSlot === 1 ? app.p2CharId : app.p1CharId);

        dom.resWinnerTitle.textContent = `${winChar.name.toUpperCase()} VENCEU!`;
        dom.resWinnerSub.textContent = `${winPlayer} conquistou a vitória na arena!`;
        dom.resWinPlayer.textContent = winPlayer;
        dom.resWinChar.textContent = winChar.name;
        dom.resLosePlayer.textContent = losePlayer;
        dom.resLoseChar.textContent = loseChar.name;
        dom.resRoundsScore.textContent = `${Math.max(app.p1RoundWins, app.p2RoundWins)} - ${Math.min(app.p1RoundWins, app.p2RoundWins)}`;

        dom.overlayResult.classList.remove("hidden");
    }

    /* =========================================================================
       10. RENDERIZAÇÃO DA ARENA E DA INTRODUÇÃO CINEMATOGRÁFICA
    ========================================================================= */
    function renderIntroSequence(c) {
        const t = app.introTimer;
        const f1 = getFighterById(app.p1CharId);
        const f2 = getFighterById(app.p2CharId);
        const arena = getArenaById(app.arenaId);
        const W = WORLD.W;
        const H = WORLD.H;

        // Etapa 1 (0.0s -> 1.1s): Tela escura + Nome da Arena
        if (t < 1.1) {
            c.fillStyle = "#080612";
            c.fillRect(0, 0, W, H);
            c.fillStyle = "#ffcf40";
            c.font = "700 44px 'Space Grotesk', sans-serif";
            c.textAlign = "center";
            c.fillText(arena.name, W / 2, H / 2);
            return;
        }

        // Etapas 2 e 3 (1.1s -> 4.2s): Divisão Vermelho x Azul + Raio + Encarada + VERSUS
        if (t < 4.2) {
            const isFaceOff = t >= 2.4;
            const walkProg = clamp((t - 1.1) / 1.3, 0, 1);

            // Fundo esquerdo vermelho / direito azul
            c.fillStyle = "#b81427";
            c.fillRect(0, 0, W / 2, H);
            c.fillStyle = "#1449b8";
            c.fillRect(W / 2, 0, W / 2, H);

            if (!isFaceOff) {
                // Etapa 2: Entrada dos dois lutadores nas metades opostas
                const x1 = -80 + walkProg * 360;
                const x2 = W + 80 - walkProg * 360;
                drawFighter(c, f1, null, app.animClock, { x: x1, y: 440, facing: 1, scale: 2.0, state: walkProg < 1 ? "walk" : "idle", noShadow: true });
                drawFighter(c, f2, null, app.animClock, { x: x2, y: 440, facing: -1, scale: 2.0, state: walkProg < 1 ? "walk" : "idle", noShadow: true });
            } else {
                // Etapa 3: Encarada com câmera aproximada no rosto e olhos sombreados de rivalidade
                const zoomProg = clamp((t - 2.4) / 0.9, 0, 1);
                const zoomScale = 2.4 + zoomProg * 1.4;
                const moveCenter = zoomProg * 75;

                c.save();
                drawFighter(c, f1, null, app.animClock, {
                    x: 340 + moveCenter,
                    y: 620 + zoomProg * 140,
                    facing: 1,
                    scale: zoomScale,
                    state: "idle",
                    fierceEyes: true,
                    shadowCoverEyes: true,
                    noShadow: true
                });
                drawFighter(c, f2, null, app.animClock, {
                    x: W - 340 - moveCenter,
                    y: 620 + zoomProg * 140,
                    facing: -1,
                    scale: zoomScale,
                    state: "idle",
                    fierceEyes: true,
                    shadowCoverEyes: true,
                    noShadow: true
                });
                c.restore();
            }

            // Raio elétrico central animado
            c.strokeStyle = "#ffffff";
            c.lineWidth = 6;
            c.beginPath();
            c.moveTo(W / 2, 0);
            for (let y = 40; y <= H; y += 45) {
                c.lineTo(W / 2 + Math.sin(app.animClock * 35 + y) * 16, y);
            }
            c.stroke();

            if (isFaceOff) {
                c.font = "700 72px 'Space Grotesk', sans-serif";
                c.textAlign = "center";
                c.textBaseline = "middle";
                c.lineWidth = 10;
                c.strokeStyle = "#000";
                c.strokeText("VERSUS", W / 2, H / 2);
                c.fillStyle = "#ffcf40";
                c.fillText("VERSUS", W / 2, H / 2);
            }
            return;
        }

        // Etapas 4 e 5 (4.2s -> 7.2s): Arena real + Contagem Regressiva 3, 2, 1, LUTEM!
        drawArenaBackground(c, arena, app.animClock, app.envParticles);
        app.fighters.forEach(f => {
            drawFighter(c, f.def, f, app.animClock, { x: f.x, y: f.y, facing: f.facing, scale: 1.05, state: "idle" });
        });

        // Abertura das cortinas na etapa 4
        if (t < 5.0) {
            const openProg = (t - 4.2) / 0.8;
            const halfW = (W / 2) * (1 - openProg);
            c.fillStyle = "#b81427";
            c.fillRect(0, 0, halfW, H);
            c.fillStyle = "#1449b8";
            c.fillRect(W - halfW, 0, halfW, H);
            return;
        }

        // Contagem regressiva
        let countLabel = "";
        if (t < 5.55) countLabel = "3";
        else if (t < 6.1) countLabel = "2";
        else if (t < 6.65) countLabel = "1";
        else countLabel = "LUTEM!";

        c.save();
        c.font = `700 ${countLabel === "LUTEM!" ? 92 : 110}px 'Space Grotesk', sans-serif`;
        c.textAlign = "center";
        c.textBaseline = "middle";
        c.lineWidth = 12;
        c.strokeStyle = "#000000";
        c.strokeText(countLabel, W / 2, H / 2 - 30);
        c.fillStyle = countLabel === "LUTEM!" ? "#bbff62" : "#ffcf40";
        c.fillText(countLabel, W / 2, H / 2 - 30);
        c.restore();
    }

    function renderFightCanvas() {
        if (!["intro", "fighting", "round_end", "match_end", "paused", "training"].includes(app.mode)) return;

        const c = fightCtx;
        c.clearRect(0, 0, WORLD.W, WORLD.H);

        if (app.mode === "intro") {
            renderIntroSequence(c);
            return;
        }

        const arena = getArenaById(app.arenaId);
        const sx = app.camShake > 0 ? (Math.random() - 0.5) * app.camShake : 0;
        const sy = app.camShake > 0 ? (Math.random() - 0.5) * app.camShake : 0;

        c.save();
        if (app.cinematic.active) {
            const z = app.cinematic.zoom;
            c.translate(WORLD.W / 2 + sx, WORLD.H / 2 + sy);
            c.scale(z, z);
            c.translate(-app.cinematic.targetX, -app.cinematic.targetY);
        } else {
            c.translate(sx, sy);
        }

        drawArenaBackground(c, arena, app.animClock, app.envParticles);

        // Escurece o fundo durante especiais dramáticos
        if (app.cinematic.active) {
            c.fillStyle = "rgba(0, 0, 0, 0.48)";
            c.fillRect(0, 0, WORLD.W, WORLD.H);
        }

        app.fighters.forEach(f => {
            drawFighter(c, f.def, f, app.animClock, {
                x: f.x,
                y: f.y,
                facing: f.facing,
                scale: 1.05,
                state: f.state,
                stateTimer: f.actionTimer
            });
        });

        // Feixes/Cortes dos especiais
        app.slashLines.forEach(sl => {
            c.save();
            c.globalAlpha = clamp(sl.life / sl.maxLife, 0, 1);
            c.strokeStyle = sl.color;
            c.lineWidth = 14;
            c.beginPath();
            c.moveTo(sl.x1, sl.y1);
            c.lineTo(sl.x2, sl.y2);
            c.stroke();
            c.strokeStyle = "#ffffff";
            c.lineWidth = 5;
            c.stroke();
            c.restore();
        });

        // Partículas e números flutuantes
        app.particles.forEach(pt => {
            c.save();
            c.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
            c.fillStyle = pt.color;
            c.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            c.restore();
        });

        app.floatingTexts.forEach(ft => {
            c.save();
            c.globalAlpha = clamp(ft.life / ft.maxLife, 0, 1);
            c.font = "700 18px 'Space Grotesk', sans-serif";
            c.textAlign = "center";
            c.lineWidth = 4;
            c.strokeStyle = "#000";
            c.strokeText(ft.text, ft.x, ft.y);
            c.fillStyle = ft.color;
            c.fillText(ft.text, ft.x, ft.y);
            c.restore();
        });

        c.restore();

        // Nome do especial na tela durante execução cinematográfica
        if (app.cinematic.active) {
            const spDef = getFighterById(app.cinematic.charId);
            c.save();
            c.font = "700 36px 'Space Grotesk', sans-serif";
            c.textAlign = "center";
            c.lineWidth = 6;
            c.strokeStyle = "#000";
            c.strokeText(spDef.specialName, WORLD.W / 2, 92);
            c.fillStyle = spDef.colors.energy;
            c.fillText(spDef.specialName, WORLD.W / 2, 92);
            c.restore();
        }

        if (app.flashAlpha > 0) {
            c.fillStyle = app.flashColor;
            c.globalAlpha = app.flashAlpha;
            c.fillRect(0, 0, WORLD.W, WORLD.H);
            c.globalAlpha = 1;
        }

        if (app.mode === "round_end" || app.mode === "match_end") {
            c.save();
            c.font = "700 46px 'Space Grotesk', sans-serif";
            c.textAlign = "center";
            c.lineWidth = 8;
            c.strokeStyle = "#000";
            c.strokeText(app.bannerText, WORLD.W / 2, WORLD.H / 2 - 20);
            c.fillStyle = "#ffcf40";
            c.fillText(app.bannerText, WORLD.W / 2, WORLD.H / 2 - 20);

            c.font = "700 22px 'Space Grotesk', sans-serif";
            c.lineWidth = 5;
            c.strokeText(app.bannerSub, WORLD.W / 2, WORLD.H / 2 + 26);
            c.fillStyle = "#ffffff";
            c.fillText(app.bannerSub, WORLD.W / 2, WORLD.H / 2 + 26);
            c.restore();
        }
    }

    function mainLoop(ts) {
        if (!app.lastTs) app.lastTs = ts;
        const dt = Math.min((ts - app.lastTs) / 1000, 0.05);
        app.lastTs = ts;

        updateMain(dt);
        renderFightCanvas();

        app.rafId = requestAnimationFrame(mainLoop);
    }

    function startSingleLoop() {
        if (app.rafId !== null) return;
        app.lastTs = performance.now();
        app.rafId = requestAnimationFrame(mainLoop);
    }

    /* =========================================================================
       11. PAUSA, CONFIGURAÇÕES E EVENTOS DE TECLADO SIMULTÂNEOS
    ========================================================================= */
    function syncAudioSettingsUI() {
        dom.quickMusicBtn.textContent = settings.musicOn ? "🎵 Música: ON" : "🎵 Música: OFF";
        dom.quickMusicBtn.classList.toggle("is-muted", !settings.musicOn);
        dom.quickSfxBtn.textContent = settings.sfxOn ? "🔊 Efeitos: ON" : "🔇 Efeitos: OFF";
        dom.quickSfxBtn.classList.toggle("is-muted", !settings.sfxOn);

        dom.cfgMasterVol.value = String(Math.round(settings.masterVol * 100));
        dom.lblMasterVol.textContent = `${Math.round(settings.masterVol * 100)}%`;
        dom.cfgMusicVol.value = String(Math.round(settings.musicVol * 100));
        dom.lblMusicVol.textContent = `${Math.round(settings.musicVol * 100)}%`;
        dom.cfgSfxVol.value = String(Math.round(settings.sfxVol * 100));
        dom.lblSfxVol.textContent = `${Math.round(settings.sfxVol * 100)}%`;
        dom.cfgMusicBtn.textContent = settings.musicOn ? "ON" : "OFF";
        dom.cfgMusicBtn.classList.toggle("is-muted", !settings.musicOn);
        dom.cfgSfxBtn.textContent = settings.sfxOn ? "ON" : "OFF";
        dom.cfgSfxBtn.classList.toggle("is-muted", !settings.sfxOn);
        dom.cfgFxQuality.value = settings.fxQuality;
    }

    function pauseFight() {
        if (app.mode !== "fighting" && app.mode !== "training") return;
        app.pausedFrom = app.mode;
        app.mode = "paused";
        app.heldCodes.clear();
        audio.setPaused(true);
        audio.playClick();
        dom.overlayPause.classList.remove("hidden");
    }

    function resumeFight() {
        if (app.mode !== "paused") return;
        app.mode = app.pausedFrom || "fighting";
        app.pausedFrom = null;
        dom.overlayPause.classList.add("hidden");
        audio.setPaused(false);
        audio.playClick();
    }

    function bindEvents() {
        const unlock = () => audio.unlock();
        document.addEventListener("pointerdown", unlock, { passive: true });
        document.addEventListener("keydown", unlock, { passive: true });

        dom.quickMusicBtn.addEventListener("click", () => {
            settings.musicOn = !settings.musicOn;
            audio.saveAndSync();
            audio.playClick();
            syncAudioSettingsUI();
        });

        dom.quickSfxBtn.addEventListener("click", () => {
            settings.sfxOn = !settings.sfxOn;
            audio.saveAndSync();
            if (settings.sfxOn) audio.playClick();
            syncAudioSettingsUI();
        });

        // Menu Principal
        dom.btnMenuPlay.addEventListener("click", () => {
            audio.playClick();
            app.isTraining = false;
            dom.namesError.classList.add("hidden");
            switchScreen("names", "names");
            dom.p1NameInput.focus();
        });

        dom.btnMenuTraining.addEventListener("click", () => {
            audio.playClick();
            app.isTraining = true;
            app.pickingSlot = 1;
            app.p1Name = "Você";
            app.p2Name = "Boneco de Treino";
            dom.selectError.classList.add("hidden");
            refreshSelectionScreen();
            switchScreen("select", "select");
        });

        dom.btnMenuChars.addEventListener("click", () => {
            audio.playClick();
            renderRosterGallery();
            switchScreen("roster", "roster");
        });

        dom.btnRosterBack.addEventListener("click", () => {
            audio.playClick();
            switchScreen("menu", "menu");
        });

        // Como Jogar & Configurações
        dom.btnMenuHowto.addEventListener("click", () => { audio.playClick(); dom.modalHowto.classList.remove("hidden"); });
        const closeHowto = () => { audio.playClick(); dom.modalHowto.classList.add("hidden"); };
        dom.btnCloseHowto.addEventListener("click", closeHowto);
        dom.btnOkHowto.addEventListener("click", closeHowto);

        dom.btnMenuSettings.addEventListener("click", () => { audio.playClick(); syncAudioSettingsUI(); dom.modalSettings.classList.remove("hidden"); });
        const closeSettings = () => { audio.playClick(); dom.modalSettings.classList.add("hidden"); };
        dom.btnCloseSettings.addEventListener("click", closeSettings);
        dom.btnOkSettings.addEventListener("click", closeSettings);

        dom.cfgMasterVol.addEventListener("input", () => { settings.masterVol = Number(dom.cfgMasterVol.value) / 100; audio.saveAndSync(); syncAudioSettingsUI(); });
        dom.cfgMusicVol.addEventListener("input", () => { settings.musicVol = Number(dom.cfgMusicVol.value) / 100; audio.saveAndSync(); syncAudioSettingsUI(); });
        dom.cfgSfxVol.addEventListener("input", () => { settings.sfxVol = Number(dom.cfgSfxVol.value) / 100; audio.saveAndSync(); syncAudioSettingsUI(); });
        dom.cfgMusicBtn.addEventListener("click", () => { settings.musicOn = !settings.musicOn; audio.saveAndSync(); audio.playClick(); syncAudioSettingsUI(); });
        dom.cfgSfxBtn.addEventListener("click", () => { settings.sfxOn = !settings.sfxOn; audio.saveAndSync(); if (settings.sfxOn) audio.playClick(); syncAudioSettingsUI(); });
        dom.cfgFxQuality.addEventListener("change", () => { settings.fxQuality = dom.cfgFxQuality.value; audio.saveAndSync(); });

        // Nomes
        dom.btnNamesBack.addEventListener("click", () => { audio.playClick(); switchScreen("menu", "menu"); });
        dom.namesForm.addEventListener("submit", e => {
            e.preventDefault();
            audio.playClick();
            const n1 = dom.p1NameInput.value.trim();
            const n2 = dom.p2NameInput.value.trim();
            if (!n1 || !n2) {
                dom.namesError.textContent = "Os dois jogadores precisam digitar seus nomes!";
                dom.namesError.classList.remove("hidden");
                return;
            }
            app.p1Name = n1.slice(0, 14);
            app.p2Name = n2.slice(0, 14);
            app.pickingSlot = 1;
            if (app.p1CharId === app.p2CharId) {
                app.p2CharId = FIGHTERS.find(f => f.id !== app.p1CharId).id;
            }
            dom.selectError.classList.add("hidden");
            refreshSelectionScreen();
            switchScreen("select", "select");
        });

        // Seleção
        dom.btnFocusP1.addEventListener("click", () => { audio.playClick(); app.pickingSlot = 1; refreshSelectionScreen(); });
        dom.btnFocusP2.addEventListener("click", () => { audio.playClick(); app.pickingSlot = 2; refreshSelectionScreen(); });
        dom.arenaSelect.addEventListener("change", () => { audio.playClick(); app.arenaId = dom.arenaSelect.value; });
        dom.btnSelectBack.addEventListener("click", () => {
            audio.playClick();
            switchScreen(app.isTraining ? "menu" : "names", app.isTraining ? "menu" : "names");
        });

        dom.btnGoConfirm.addEventListener("click", () => {
            audio.playClick();
            if (!app.isTraining && app.p1CharId === app.p2CharId) {
                dom.selectError.textContent = "Escolha lutadores diferentes para J1 e J2!";
                dom.selectError.classList.remove("hidden");
                return;
            }
            if (app.isTraining) {
                startTrainingSession();
            } else {
                openConfirmScreen();
            }
        });

        // Confirmação
        dom.btnConfirmBack.addEventListener("click", () => { audio.playClick(); switchScreen("select", "select"); });
        dom.btnStartFight.addEventListener("click", () => { audio.playConfirm(); startNew2PMatch(); });

        // Pausa, Treino e Resultado
        dom.btnFightPause.addEventListener("click", pauseFight);
        dom.btnPauseResume.addEventListener("click", resumeFight);
        dom.btnPauseAudio.addEventListener("click", () => { audio.playClick(); syncAudioSettingsUI(); dom.modalSettings.classList.remove("hidden"); });
        dom.btnPauseRestart.addEventListener("click", () => {
            audio.playClick();
            dom.overlayPause.classList.add("hidden");
            audio.setPaused(false);
            if (app.pausedFrom === "training" || app.isTraining) {
                startTrainingSession();
            } else {
                resetRoundEntities();
                updateFightHud();
                app.mode = "fighting";
            }
        });
        dom.btnPauseMenu.addEventListener("click", () => {
            audio.playClick();
            dom.overlayPause.classList.add("hidden");
            audio.setPaused(false);
            switchScreen("menu", "menu");
        });

        dom.btnTrFillSpec.addEventListener("click", () => {
            audio.playConfirm();
            if (app.fighters[0]) { app.fighters[0].energy = 100; updateFightHud(); }
        });
        dom.btnTrResetPos.addEventListener("click", () => {
            audio.playClick();
            resetRoundEntities();
            app.fighters[0].energy = 100;
            updateFightHud();
        });
        dom.btnTrExit.addEventListener("click", () => { audio.playClick(); switchScreen("menu", "menu"); });

        dom.btnResRematch.addEventListener("click", () => {
            audio.playClick();
            dom.overlayResult.classList.add("hidden");
            refreshSelectionScreen();
            switchScreen("select", "select");
        });
        dom.btnResMenu.addEventListener("click", () => {
            audio.playClick();
            dom.overlayResult.classList.add("hidden");
            switchScreen("menu", "menu");
        });

        // Leitura simultânea precisa por e.code (NUMPAD estrito para J2)
        const BLOCK_SCROLL_CODES = new Set(["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Numpad1", "Numpad2", "Numpad3", "Numpad5"]);

        window.addEventListener("keydown", e => {
            const tag = document.activeElement ? document.activeElement.tagName : "";
            if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

            if (e.code === "Escape" && !e.repeat) {
                e.preventDefault();
                if (!dom.modalSettings.classList.contains("hidden")) { closeSettings(); return; }
                if (!dom.modalHowto.classList.contains("hidden")) { closeHowto(); return; }
                if (app.mode === "fighting" || app.mode === "training") pauseFight();
                else if (app.mode === "paused") resumeFight();
                return;
            }

            if (app.mode !== "fighting" && app.mode !== "training") return;
            if (BLOCK_SCROLL_CODES.has(e.code)) e.preventDefault();

            app.heldCodes.add(e.code);
            if (e.repeat) return;

            const [f1, f2] = app.fighters;
            if (!f1 || !f2 || app.cinematic.active) return;

            // Golpes J1
            if (e.code === "KeyJ") startFighterAttack(f1, false);
            else if (e.code === "KeyL") startFighterAttack(f1, true);
            else if (e.code === "KeyR") triggerSpecial(f1, f2);

            // Golpes J2 (apenas Numpad estrito — nunca Digit1/2/3/5)
            if (!app.isTraining) {
                if (e.code === "Numpad1") startFighterAttack(f2, false);
                else if (e.code === "Numpad3") startFighterAttack(f2, true);
                else if (e.code === "Numpad5") triggerSpecial(f2, f1);
            }
        });

        window.addEventListener("keyup", e => {
            app.heldCodes.delete(e.code);
        });

        window.addEventListener("blur", () => {
            app.heldCodes.clear();
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                app.heldCodes.clear();
                audio.stopLoop();
            } else if (audio.unlocked && settings.musicOn) {
                audio.startLoop();
            }
        });
    }

    function init() {
        populateArenaSelector();
        syncAudioSettingsUI();
        bindEvents();
        switchScreen("menu", "menu");
        startSingleLoop();
    }

    init();
})();