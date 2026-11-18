

(() => {
    "use strict";

    /* =========================================================================
       1. CHAVES DE LOCALSTORAGE & PALETAS DO VESTIÁRIO MINIBLOX
    ========================================================================= */
    const STORAGE_KEYS = {
        MINIBLOX_CHAR: "personagem",
        MINIBLOX_USER: "usuario",
        VERTIGO_SAVE: "vertigo_save"
    };

    const SKIN_MAP = {
        pele1: "#f0b18c",
        pele2: "#cc6e49",
        pele3: "#ff9d76",
        pele4: "#ffccb7",
        pele5: "#8f4e35"
    };

    const HAIR_MAP = {
        cabelo1: "#8b3939",
        cabelo2: "#ffdf2d",
        cabelo3: "#ffc965",
        cabelo4: "#252525",
        cabelo5: "#bfc5ca"
    };

    const SHIRT_MAP = {
        azul: "#5e98be",
        vermelha: "#ee3b3b",
        preta: "#232325",
        branca: "#e6e6e6",
        roxa: "#800080",
        amarela: "#ffd900",
        Amarela: "#ffd900",
        verde: "#ccee37",
        rosa: "#ff526f",
        flamengo: "#e62e2e",
        palmeiras: "#24af59",
        corinthians: "#222222",
        fluminense: "#7b1535",
        "sao-paulo": "#d71920",
        bahia: "#005ca9",
        botafogo: "#1c1c1c",
        vasco: "#151515",
        gremio: "#0072bc",
        santos: "#f0f0f0",
        mirassol: "#008b45",
        internacional: "#d71920"
    };

    const PANTS_MAP = {
        azul: "#331f63",
        bege: "#d4b089",
        preta: "#333030"
    };

    const TILE = 40;
    const VIEW_W = 900;
    const VIEW_H = 560;

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
            /* Ignora falha de escrita */
        }
    }

    function readMiniBloxCharacter() {
        const raw = safeGetJSON(STORAGE_KEYS.MINIBLOX_CHAR, null);
        return {
            hasSaved: Boolean(raw),
            cabelo: raw && raw.cabelo === "cabeloF" ? "cabeloF" : "cabeloM",
            corCabelo: raw && HAIR_MAP[raw.corCabelo] ? HAIR_MAP[raw.corCabelo] : HAIR_MAP.cabelo1,
            pele: raw && SKIN_MAP[raw.pele] ? SKIN_MAP[raw.pele] : SKIN_MAP.pele1,
            camisa: raw && SHIRT_MAP[raw.camisa] ? SHIRT_MAP[raw.camisa] : SHIRT_MAP.azul,
            calca: raw && PANTS_MAP[raw.calca] ? PANTS_MAP[raw.calca] : PANTS_MAP.azul
        };
    }

    function readMiniBloxUsuarioName() {
        try {
            const raw = localStorage.getItem(STORAGE_KEYS.MINIBLOX_USER);
            if (!raw) return "";
            const trimmed = raw.trim();
            if (trimmed.startsWith("{")) {
                const parsed = JSON.parse(trimmed);
                const candidate = parsed.nome || parsed.name || parsed.usuario || "";
                return String(candidate).trim().slice(0, 16);
            }
            return trimmed.slice(0, 16);
        } catch {
            return "";
        }
    }

    function createDefaultSave() {
        const userFromMiniBlox = readMiniBloxUsuarioName();
        return {
            playerName: userFromMiniBlox || "",
            audio: {
                musicEnabled: true,
                sfxEnabled: true,
                musicVolume: 0.45,
                sfxVolume: 0.75
            },
            unlockedLevel: 1,
            completedLevels: [],
            infiniteUnlocked: false,
            bestLevelScores: {},
            bestLevelTimes: {},
            stats: {
                totalScore: 0,
                bestScore: 0,
                totalCoins: 0,
                attempts: 0,
                maxStreak: 0,
                currentStreak: 0,
                infBestDistance: 0,
                infBestScore: 0,
                infBestCoins: 0,
                infBestTime: 0
            },
            history: []
        };
    }

    function loadSave() {
        const def = createDefaultSave();
        const saved = safeGetJSON(STORAGE_KEYS.VERTIGO_SAVE, null);
        if (!saved) return def;

        const miniName = readMiniBloxUsuarioName();
        return {
            playerName: typeof saved.playerName === "string" && saved.playerName.trim()
                ? saved.playerName.trim().slice(0, 16)
                : miniName,
            audio: {
                musicEnabled: typeof saved.audio?.musicEnabled === "boolean" ? saved.audio.musicEnabled : def.audio.musicEnabled,
                sfxEnabled: typeof saved.audio?.sfxEnabled === "boolean" ? saved.audio.sfxEnabled : def.audio.sfxEnabled,
                musicVolume: typeof saved.audio?.musicVolume === "number" ? clamp(saved.audio.musicVolume, 0, 1) : def.audio.musicVolume,
                sfxVolume: typeof saved.audio?.sfxVolume === "number" ? clamp(saved.audio.sfxVolume, 0, 1) : def.audio.sfxVolume
            },
            unlockedLevel: Number.isFinite(saved.unlockedLevel) ? clamp(saved.unlockedLevel, 1, 10) : 1,
            completedLevels: Array.isArray(saved.completedLevels) ? saved.completedLevels.filter(n => Number.isInteger(n) && n >= 1 && n <= 10) : [],
            infiniteUnlocked: Boolean(saved.infiniteUnlocked),
            bestLevelScores: saved.bestLevelScores && typeof saved.bestLevelScores === "object" ? saved.bestLevelScores : {},
            bestLevelTimes: saved.bestLevelTimes && typeof saved.bestLevelTimes === "object" ? saved.bestLevelTimes : {},
            stats: {
                totalScore: Number.isFinite(saved.stats?.totalScore) ? saved.stats.totalScore : 0,
                bestScore: Number.isFinite(saved.stats?.bestScore) ? saved.stats.bestScore : 0,
                totalCoins: Number.isFinite(saved.stats?.totalCoins) ? saved.stats.totalCoins : 0,
                attempts: Number.isFinite(saved.stats?.attempts) ? saved.stats.attempts : 0,
                maxStreak: Number.isFinite(saved.stats?.maxStreak) ? saved.stats.maxStreak : 0,
                currentStreak: Number.isFinite(saved.stats?.currentStreak) ? saved.stats.currentStreak : 0,
                infBestDistance: Number.isFinite(saved.stats?.infBestDistance) ? saved.stats.infBestDistance : 0,
                infBestScore: Number.isFinite(saved.stats?.infBestScore) ? saved.stats.infBestScore : 0,
                infBestCoins: Number.isFinite(saved.stats?.infBestCoins) ? saved.stats.infBestCoins : 0,
                infBestTime: Number.isFinite(saved.stats?.infBestTime) ? saved.stats.infBestTime : 0
            },
            history: Array.isArray(saved.history) ? saved.history.slice(0, 60) : []
        };
    }

    function persistSave() {
        safeSetJSON(STORAGE_KEYS.VERTIGO_SAVE, save);
    }

    /* =========================================================================
       2. DEFINIÇÃO DAS 10 FASES DA CAMPANHA (TODAS VERIFICADAS PARA DESLIZE)
    ========================================================================= */
    const CAMPAIGN_LEVELS = [
        {
            id: 1,
            name: "FIRST STEPS",
            speed: 520,
            minCoins: 6,
            darkness: false,
            risingHazard: false,
            hint: "Use WASD ou Setas para deslizar até a parede. Colete 6 moedas e chegue à saída verde!",
            map: [
                "#############",
                "#S..c..#c..G#",
                "#####..#..###",
                "#c..c....c#.#",
                "#.#########.#",
                "#c..P..c..#.#",
                "###.#####.#.#",
                "#G.c..#c..c.#",
                "#.###.#.#####",
                "#...c...c..E#",
                "#############"
            ]
        },
        {
            id: 2,
            name: "SPIKE TRAP",
            speed: 540,
            minCoins: 7,
            darkness: false,
            risingHazard: false,
            hint: "Cuidado com espinhos fixos (^) e temporizados (~)! Observe antes de deslizar.",
            map: [
                "###############",
                "#S..c.#c..~..G#",
                "#####.#.#####.#",
                "#c..c.#.~..c^.#",
                "#.###.#####.#.#",
                "#..~..P..c..#.#",
                "###.#######.#.#",
                "#G..#c..~..#c.#",
                "#.#.#.###..#.##",
                "#c..c...#..c.E#",
                "###############"
            ]
        },
        {
            id: 3,
            name: "ELECTRICITY",
            speed: 560,
            minCoins: 7,
            darkness: false,
            risingHazard: false,
            hint: "Lasers elétricos piscam em amarelo antes de ligar! Atravesse quando estiverem desligados.",
            map: [
                "###############",
                "#S..c..#c..G..#",
                "######L#.####.#",
                "#c..c..#....#.#",
                "#.#######.#...#",
                "#..L..P..c..L.#",
                "###.#######..##",
                "#G..c..#L..c..#",
                "#.####.#.######",
                "#...c.......cE#",
                "###############"
            ]
        },
        {
            id: 4,
            name: "MOVING WALLS",
            speed: 575,
            minCoins: 7,
            darkness: false,
            risingHazard: false,
            hint: "Blocos móveis (M) abrem e fecham passagens em ciclos previsíveis!",
            map: [
                "###############",
                "#S..c.M..c...G#",
                "#####.#.#####.#",
                "#c..c.#..M..#.#",
                "#.###.#####.#.#",
                "#..c..P..c..M.#",
                "###.#####.###.#",
                "#G.M..#c..cc..#",
                "#.#.#.#..######",
                "#...c...c..M.E#",
                "###############"
            ]
        },
        {
            id: 5,
            name: "TELEPORT",
            speed: 590,
            minCoins: 7,
            darkness: false,
            risingHazard: false,
            hint: "Portais coloridos conectam regiões isoladas do labirinto!",
            map: [
                "###############",
                "#S..c..1#2.c.G#",
                "#####.###.###.#",
                "#c..c.#.#..c..#",
                "#.###.#.#.###.#",
                "#3.c#P..#..c#4#",
                "#####.#.#####.#",
                "#G..c..c.c~..c#",
                "#.###.##.#.##.#",
                "#...c...c..#E.#",
                "###############"
            ]
        },
        {
            id: 6,
            name: "THE HUNTER",
            speed: 605,
            minCoins: 8,
            darkness: false,
            risingHazard: false,
            hint: "Um Caçador percorre os corredores atrás de você! Use voltas rápidas para despistá-lo.",
            map: [
                "###############",
                "#S..c..#..c..G#",
                "#.####.#.####.#",
                "#c...c...c...c#",
                "#..#.#####.#..#",
                "#..P..c.H.c...#",
                "#.###.###..####",
                "#c..#..c.....c#",
                "#.#.#####.###.#",
                "#G..c...c..Ec.#",
                "###############"
            ]
        },
        {
            id: 7,
            name: "DARKNESS",
            speed: 615,
            minCoins: 7,
            darkness: true,
            risingHazard: false,
            hint: "Visibilidade reduzida! Colete cristais luminosos (◆) para ampliar sua área iluminada.",
            map: [
                "###############",
                "#S..c.G.c..~..#",
                "#####.#..####.#",
                "#c..c....c#...#",
                "#.###.#######.#",
                "#..~..P..c..L.#",
                "###.#####.###.#",
                "#G..##c..c..cc#",
                "#.#.##.##.##.##",
                "#c..c......G.E#",
                "###############"
            ]
        },
        {
            id: 8,
            name: "SPEED RUN",
            speed: 650,
            minCoins: 8,
            darkness: false,
            risingHazard: true,
            risingSpeed: 18,
            hint: "O pulso de plasma está subindo por baixo! Escale o labirinto sem parar!",
            map: [
                "#############",
                "#E..c...c..G#",
                "###.###.###.#",
                "#c..#..c..#c#",
                "#.###.###.###",
                "#..~..P..c..#",
                "#.#####.###.#",
                "#c.c.#...L..#",
                "###.#.#.###.#",
                "#G..#c..c..c#",
                "#.###.#####.#",
                "#...~...c..c#",
                "###.#######.#",
                "#S..c..c...G#",
                "#############"
            ]
        },
        {
            id: 9,
            name: "CHAOS",
            speed: 665,
            minCoins: 9,
            darkness: false,
            risingHazard: false,
            hint: "Espinhos, lasers, portais, blocos móveis e um Caçador. Mantenha o controle!",
            map: [
                "#################",
                "#S..c.L.#c..M..G#",
                "#####.#.#.#####.#",
                "#c..~.#...c..1#c#",
                "#.###.#######.#.#",
                "#..c..Pc.Hc.#2..#",
                "###.#####.#.###.#",
                "#G..#c..L.#c..~.#",
                "#.#.#.###.#.#####",
                "#c..c...#..c..M.#",
                "#.#####.#.#.###.#",
                "#c..~...c..c..cE#",
                "#################"
            ]
        },
        {
            id: 10,
            name: "VERTIGO",
            speed: 690,
            minCoins: 10,
            darkness: false,
            risingHazard: false,
            hint: "FASE FINAL! Encontre o cristal secreto (B) ou domine todas as armadilhas até a saída!",
            map: [
                "###################",
                "#S..c..L..#c..M..G#",
                "#####.###.#.#####.#",
                "#B#c..#...c..1#..^#",
                "#.#.###.###.#.#.###",
                "#...~..Pc.c.#2..c.#",
                "###.#######.#.###.#",
                "#G..#c.H..L.#..~c.#",
                "#.#.#.###.#.#.###.#",
                "#c..c...#...c....3#",
                "#.#####.#.###.#.###",
                "#..M..#c..~....c.4#",
                "###.#.#.###.#####.#",
                "#c..c...c...L..G.E#",
                "###################"
            ]
        }
    ];

    /* =========================================================================
       3. GERADOR PROCEDURAL SOLUCIONÁVEL PARA O MODO INFINITO
    ========================================================================= */
    function isSlideSolvable(grid, startPos, targetChecker) {
        const rows = grid.length;
        const cols = grid[0].length;
        const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        const isWall = (x, y) => x < 0 || y < 0 || x >= cols || y >= rows || grid[y][x] === "#";
        const visited = new Set([`${startPos.x},${startPos.y}`]);
        const queue = [startPos];

        while (queue.length > 0) {
            const cur = queue.shift();
            if (targetChecker(cur.x, cur.y, grid[cur.y][cur.x])) return true;

            for (let i = 0; i < dirs.length; i++) {
                const d = dirs[i];
                let nx = cur.x;
                let ny = cur.y;
                while (!isWall(nx + d.x, ny + d.y)) {
                    nx += d.x;
                    ny += d.y;
                    if (targetChecker(nx, ny, grid[ny][nx])) return true;
                }
                const key = `${nx},${ny}`;
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny });
                }
            }
        }
        return false;
    }

    function generateInfiniteLevel(sectorIndex) {
        const cols = 15;
        const rows = 13;

        for (let attempt = 0; attempt < 40; attempt++) {
            const g = Array.from({ length: rows }, () => Array(cols).fill("#"));

            for (let y = 1; y < rows - 1; y++) {
                for (let x = 1; x < cols - 1; x++) {
                    if (y % 2 === 1 || x % 2 === 1) {
                        g[y][x] = ".";
                    }
                }
            }

            for (let y = 1; y < rows - 1; y++) {
                for (let x = 1; x < cols - 1; x++) {
                    if ((x === 1 && y === rows - 2) || (x === cols - 2 && y === 1)) continue;
                    if (y % 2 === 1 && x % 2 === 0 && Math.random() < 0.28) {
                        g[y][x] = "#";
                    } else if (x % 2 === 1 && y % 2 === 0 && Math.random() < 0.25) {
                        g[y][x] = "#";
                    }
                }
            }

            g[rows - 2][1] = "S";
            g[1][cols - 2] = "E";
            g[Math.floor(rows / 2)][Math.floor(cols / 2)] = "P";

            if (!isSlideSolvable(g, { x: 1, y: rows - 2 }, (x, y) => x === cols - 2 && y === 1)) {
                continue;
            }

            let coinsPlaced = 0;
            const hazardChance = Math.min(0.04 + sectorIndex * 0.014, 0.14);

            for (let y = 1; y < rows - 1; y++) {
                for (let x = 1; x < cols - 1; x++) {
                    if (g[y][x] !== ".") continue;
                    const nearStartOrEnd = (x <= 2 && y >= rows - 3) || (x >= cols - 3 && y <= 2);
                    const r = Math.random();

                    if (!nearStartOrEnd && r < hazardChance) {
                        const hRoll = Math.random();
                        g[y][x] = hRoll < 0.45 ? "~" : (hRoll < 0.8 ? "L" : "M");
                    } else if (r > 0.72) {
                        g[y][x] = "c";
                        coinsPlaced++;
                    } else if (r > 0.69) {
                        g[y][x] = "G";
                    }
                }
            }

            if (sectorIndex >= 3 && g[3][cols - 4] === ".") {
                g[3][cols - 4] = "H";
            }

            return {
                id: 100 + sectorIndex,
                name: `SETOR INFINITO #${sectorIndex}`,
                speed: Math.min(540 + sectorIndex * 22, 770),
                minCoins: Math.min(5 + Math.floor(sectorIndex / 2), Math.max(3, coinsPlaced)),
                darkness: sectorIndex >= 5 && sectorIndex % 3 === 0,
                risingHazard: true,
                risingSpeed: Math.min(13 + sectorIndex * 1.4, 28),
                hint: `Setor Infinito #${sectorIndex} — Escale antes que o plasma alcance você!`,
                map: g.map(row => row.join(""))
            };
        }

        return {
            ...CAMPAIGN_LEVELS[7],
            id: 100 + sectorIndex,
            name: `SETOR INFINITO #${sectorIndex}`
        };
    }

    /* =========================================================================
       4. SISTEMA DE ÁUDIO (WEB AUDIO API)
    ========================================================================= */
    class VertigoAudio {
        constructor(audioCfg) {
            this.cfg = audioCfg;
            this.ctx = null;
            this.musicGain = null;
            this.sfxGain = null;
            this.unlocked = false;
            this.paused = false;
            this.intenseMode = false;
            this.timer = null;
            this.nextNote = 0;
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
            if (this.cfg.musicEnabled && !this.paused && !this.timer) {
                this.startMusic();
            }
        }

        syncGains() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            const mTarget = this.cfg.musicEnabled ? (this.paused ? this.cfg.musicVolume * 0.05 : this.cfg.musicVolume * 0.22) : 0;
            const sTarget = this.cfg.sfxEnabled ? this.cfg.sfxVolume * 0.65 : 0;
            this.musicGain.gain.setTargetAtTime(mTarget, now, 0.04);
            this.sfxGain.gain.setTargetAtTime(sTarget, now, 0.02);
        }

        setPaused(p) {
            this.paused = p;
            this.syncGains();
        }

        setIntense(intense) {
            this.intenseMode = intense;
        }

        updateConfig(partial) {
            Object.assign(this.cfg, partial);
            persistSave();
            this.syncGains();
            if (!this.cfg.musicEnabled) {
                this.stopMusic();
            } else if (this.unlocked && !this.timer) {
                this.startMusic();
            }
        }

        startMusic() {
            if (!this.ctx || !this.cfg.musicEnabled || this.timer) return;
            this.nextNote = this.ctx.currentTime + 0.05;

            const loop = () => {
                if (!this.ctx || !this.cfg.musicEnabled) {
                    this.timer = null;
                    return;
                }
                const bpm = this.intenseMode ? 142 : 122;
                const stepDur = 60 / bpm / 2;

                while (this.nextNote < this.ctx.currentTime + 0.18) {
                    this.playStep(this.step, this.nextNote, stepDur);
                    this.nextNote += stepDur;
                    this.step = (this.step + 1) % 16;
                }
                this.timer = setTimeout(loop, 45);
            };
            loop();
        }

        stopMusic() {
            if (this.timer) {
                clearTimeout(this.timer);
                this.timer = null;
            }
        }

        playStep(step, t, dur) {
            const lead = this.intenseMode
                ? [440, 523.25, 659.25, 523.25, 587.33, 659.25, 783.99, 659.25, 440, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 523.25]
                : [329.63, 0, 392, 440, 0, 392, 329.63, 293.66, 329.63, 0, 440, 493.88, 523.25, 493.88, 440, 0];
            const bass = [110, 110, 0, 110, 130.81, 130.81, 0, 130.81, 146.83, 146.83, 0, 146.83, 164.81, 0, 130.81, 0];

            if (lead[step]) this.musicNote(lead[step], t, dur * 0.72, this.intenseMode ? "square" : "triangle", this.intenseMode ? 0.09 : 0.18);
            if (bass[step]) this.musicNote(bass[step], t, dur * 0.88, "sine", 0.24);
        }

        musicNote(freq, t, dur, type, vol) {
            const osc = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, t);
            g.gain.setValueAtTime(0.0001, t);
            g.gain.linearRampToValueAtTime(vol, t + 0.012);
            g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
            osc.connect(g);
            g.connect(this.musicGain);
            osc.start(t);
            osc.stop(t + dur + 0.02);
        }

        canPlay(key, cd = 45) {
            if (!this.cfg.sfxEnabled) return false;
            this.unlock();
            if (!this.ctx || !this.sfxGain) return false;
            const now = performance.now();
            if (now - (this.cooldowns[key] || 0) < cd) return false;
            this.cooldowns[key] = now;
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

        playClick() { if (this.canPlay("click", 40)) this.tone(540, 780, 0.055, "triangle", 0.22); }
        playSlide() { if (this.canPlay("slide", 45)) this.tone(240, 420, 0.06, "sine", 0.16); }
        playWallStop() { if (this.canPlay("stop", 50)) this.tone(140, 75, 0.055, "triangle", 0.18); }
        playCoin() { if (this.canPlay("coin", 30)) { this.tone(880, 1320, 0.08, "triangle", 0.24); } }
        playCrystal() {
            if (!this.canPlay("crys", 80)) return;
            this.tone(740, 1110, 0.12, "triangle", 0.26, 0);
            this.tone(1110, 1480, 0.16, "sine", 0.24, 0.07);
        }
        playCheckpoint() {
            if (!this.canPlay("cp", 150)) return;
            [523.25, 659.25, 783.99].forEach((f, i) => this.tone(f, f * 1.02, 0.12, "triangle", 0.24, i * 0.06));
        }
        playLaserToggle(active) {
            if (!this.canPlay("laser", 160)) return;
            if (active) this.tone(760, 320, 0.11, "sawtooth", 0.12);
            else this.tone(320, 180, 0.07, "sine", 0.08);
        }
        playPortal() {
            if (!this.canPlay("portal", 120)) return;
            this.tone(320, 980, 0.16, "sine", 0.26);
            this.tone(980, 480, 0.14, "triangle", 0.2, 0.08);
        }
        playHunterPulse() { if (this.canPlay("hunter", 480)) this.tone(130, 88, 0.14, "sawtooth", 0.12); }
        playHurt() {
            if (!this.canPlay("hurt", 160)) return;
            this.tone(240, 68, 0.22, "sawtooth", 0.28);
        }
        playLevelClear() {
            if (!this.canPlay("clear", 200)) return;
            [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.tone(f, f, 0.18, "triangle", 0.26, i * 0.08));
        }
        playVictory() {
            if (!this.canPlay("vic", 300)) return;
            [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, f, 0.24, "triangle", 0.28, i * 0.1));
        }
        playGameOver() {
            if (!this.canPlay("go", 300)) return;
            [392, 349.23, 311.13, 220].forEach((f, i) => this.tone(f, f * 0.92, 0.19, "sawtooth", 0.2, i * 0.12));
        }
    }

    /* =========================================================================
       5. RENDERIZAÇÃO DO AVATAR MINIBLOX NO CANVAS 2D
    ========================================================================= */
    function roundRectPath(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.lineTo(x + w - rr, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
        ctx.lineTo(x + w, y + h - rr);
        ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
        ctx.lineTo(x + rr, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
        ctx.lineTo(x, y + rr);
        ctx.quadraticCurveTo(x, y, x + rr, y);
        ctx.closePath();
    }

    function drawMiniBloxAvatar(ctx, cx, cy, sizeScale, avatar, options = {}) {
        const { dirX = 0, dirY = 0, sliding = false, animTime = 0, invuln = false, warpScale = 1 } = options;
        if (invuln && Math.floor(animTime * 18) % 2 === 0) return;

        ctx.save();
        ctx.translate(cx, cy);

        const tilt = sliding ? (dirX * 0.16 + dirY * 0.05) : 0;
        const bob = sliding ? 0 : Math.sin(animTime * 4) * 1.4;
        ctx.translate(0, bob);
        ctx.rotate(tilt);
        ctx.scale(sizeScale * warpScale, sizeScale * warpScale);

        if (avatar.cabelo === "cabeloF") {
            ctx.fillStyle = avatar.corCabelo;
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.2;
            roundRectPath(ctx, -14, -14, 28, 25, 7);
            ctx.fill();
            ctx.stroke();
        }

        const legSwing = sliding ? Math.sin(animTime * 22) * 3 : 0;
        ctx.fillStyle = avatar.calca;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        roundRectPath(ctx, -9, 10 + legSwing * 0.4, 7, 10, 2);
        ctx.fill();
        ctx.stroke();
        roundRectPath(ctx, 2, 10 - legSwing * 0.4, 7, 10, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.camisa;
        roundRectPath(ctx, -10, -2, 20, 14, 3);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.pele;
        roundRectPath(ctx, -14, -1, 4, 11, 2);
        ctx.fill();
        ctx.stroke();
        roundRectPath(ctx, 10, -1, 4, 11, 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.pele;
        roundRectPath(ctx, -12, -20, 24, 20, 5);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = avatar.corCabelo;
        ctx.beginPath();
        ctx.moveTo(-12, -13);
        ctx.lineTo(-12, -20);
        ctx.lineTo(12, -20);
        ctx.lineTo(12, -13);
        ctx.lineTo(7, -11);
        ctx.lineTo(2, -14);
        ctx.lineTo(-3, -11);
        ctx.lineTo(-8, -14);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        const blink = (animTime % 4) > 3.87;
        const eyeOffsetX = dirX * 2.2;
        const eyeOffsetY = dirY * 1.6;
        const eyeH = blink ? 1.5 : 5.5;

        ctx.fillStyle = "#000000";
        roundRectPath(ctx, -6 + eyeOffsetX, -11 + eyeOffsetY - eyeH / 2, 3, eyeH, 1);
        ctx.fill();
        roundRectPath(ctx, 3 + eyeOffsetX, -11 + eyeOffsetY - eyeH / 2, 3, eyeH, 1);
        ctx.fill();

        ctx.restore();
    }

    /* =========================================================================
       6. ESTADO GLOBAL E PARSER DE NÍVEIS
    ========================================================================= */
    const avatarData = readMiniBloxCharacter();
    let save = loadSave();
    const audio = new VertigoAudio(save.audio);

    const dom = {
        screens: {
            menu: document.getElementById("screen-menu"),
            levels: document.getElementById("screen-levels"),
            game: document.getElementById("screen-game")
        },
        headerMusicBtn: document.getElementById("header-music-btn"),
        headerSfxBtn: document.getElementById("header-sfx-btn"),

        menuAvatarCanvas: document.getElementById("menu-avatar-canvas"),
        menuPlayerName: document.getElementById("menu-player-name"),
        menuVestTag: document.getElementById("menu-vest-tag"),
        menuBestScore: document.getElementById("menu-best-score"),
        menuCurrentLevel: document.getElementById("menu-current-level"),
        menuClearedCount: document.getElementById("menu-cleared-count"),
        menuTotalCoins: document.getElementById("menu-total-coins"),

        btnMenuPlay: document.getElementById("btn-menu-play"),
        btnMenuContinue: document.getElementById("btn-menu-continue"),
        btnMenuLevels: document.getElementById("btn-menu-levels"),
        btnMenuInfinite: document.getElementById("btn-menu-infinite"),
        btnMenuHowto: document.getElementById("btn-menu-howto"),
        btnMenuSettings: document.getElementById("btn-menu-settings"),

        tabStatsBtn: document.getElementById("tab-stats-btn"),
        tabHistoryBtn: document.getElementById("tab-history-btn"),
        panelStats: document.getElementById("panel-stats"),
        panelHistory: document.getElementById("panel-history"),
        stTotalScore: document.getElementById("st-total-score"),
        stBestScore: document.getElementById("st-best-score"),
        stCleared: document.getElementById("st-cleared"),
        stStreak: document.getElementById("st-streak"),
        stCoins: document.getElementById("st-coins"),
        stAttempts: document.getElementById("st-attempts"),
        stInfDist: document.getElementById("st-inf-dist"),
        stInfScore: document.getElementById("st-inf-score"),
        bestTimesGrid: document.getElementById("best-times-grid"),
        historyList: document.getElementById("history-list"),

        levelsGrid: document.getElementById("levels-grid"),
        btnLevelsBack: document.getElementById("btn-levels-back"),

        hudLevelBadge: document.getElementById("hud-level-badge"),
        hudLevelName: document.getElementById("hud-level-name"),
        hudObjective: document.getElementById("hud-objective"),
        hudScore: document.getElementById("hud-score"),
        hudCoins: document.getElementById("hud-coins"),
        hudTimer: document.getElementById("hud-timer"),
        hudLives: document.getElementById("hud-lives"),
        btnHudPause: document.getElementById("btn-hud-pause"),
        gameCanvas: document.getElementById("game-canvas"),
        phaseHint: document.getElementById("phase-hint"),
        touchDpad: document.getElementById("touch-dpad"),

        overlayPause: document.getElementById("overlay-pause"),
        btnPauseResume: document.getElementById("btn-pause-resume"),
        btnPauseRestart: document.getElementById("btn-pause-restart"),
        btnPauseSettings: document.getElementById("btn-pause-settings"),
        btnPauseExit: document.getElementById("btn-pause-exit"),

        overlayClear: document.getElementById("overlay-clear"),
        clearPill: document.getElementById("clear-pill"),
        clearTitle: document.getElementById("clear-title"),
        clearRank: document.getElementById("clear-rank"),
        clearScore: document.getElementById("clear-score"),
        clearTime: document.getElementById("clear-time"),
        clearCoins: document.getElementById("clear-coins"),
        clearLives: document.getElementById("clear-lives"),
        clearBonuses: document.getElementById("clear-bonuses"),
        btnClearMenu: document.getElementById("btn-clear-menu"),
        btnClearRetry: document.getElementById("btn-clear-retry"),
        btnClearNext: document.getElementById("btn-clear-next"),

        overlayChampion: document.getElementById("overlay-champion"),
        champScore: document.getElementById("champ-score"),
        champTime: document.getElementById("champ-time"),
        champCoins: document.getElementById("champ-coins"),
        champRank: document.getElementById("champ-rank"),
        btnChampMenu: document.getElementById("btn-champ-menu"),
        btnChampInfinite: document.getElementById("btn-champ-infinite"),

        overlayGameover: document.getElementById("overlay-gameover"),
        goSubtitle: document.getElementById("go-subtitle"),
        goScore: document.getElementById("go-score"),
        goCoins: document.getElementById("go-coins"),
        goExtraLabel: document.getElementById("go-extra-label"),
        goExtraVal: document.getElementById("go-extra-val"),
        goModeLabel: document.getElementById("go-mode-label"),
        btnGoMenu: document.getElementById("btn-go-menu"),
        btnGoRetry: document.getElementById("btn-go-retry"),

        modalName: document.getElementById("modal-name"),
        nameModalForm: document.getElementById("name-modal-form"),
        nameModalInput: document.getElementById("name-modal-input"),
        nameModalError: document.getElementById("name-modal-error"),
        btnNameCancel: document.getElementById("btn-name-cancel"),

        modalHowto: document.getElementById("modal-howto"),
        btnCloseHowto: document.getElementById("btn-close-howto"),
        btnOkHowto: document.getElementById("btn-ok-howto"),

        modalSettings: document.getElementById("modal-settings"),
        btnCloseSettings: document.getElementById("btn-close-settings"),
        btnOkSettings: document.getElementById("btn-ok-settings"),
        settingsNameInput: document.getElementById("settings-name-input"),
        btnSaveName: document.getElementById("btn-save-name"),
        settingsNameError: document.getElementById("settings-name-error"),
        setMusicToggle: document.getElementById("set-music-toggle"),
        setSfxToggle: document.getElementById("set-sfx-toggle"),
        setMusicVol: document.getElementById("set-music-vol"),
        setSfxVol: document.getElementById("set-sfx-vol"),
        setMusicVal: document.getElementById("set-music-val"),
        setSfxVal: document.getElementById("set-sfx-val"),
        settingsResetBox: document.getElementById("settings-reset-box"),
        btnResetSave: document.getElementById("btn-reset-save"),

        modalConfirm: document.getElementById("modal-confirm"),
        confirmTitle: document.getElementById("confirm-title"),
        confirmMessage: document.getElementById("confirm-message"),
        btnConfirmCancel: document.getElementById("btn-confirm-cancel"),
        btnConfirmYes: document.getElementById("btn-confirm-yes")
    };

    const ctx = dom.gameCanvas.getContext("2d");

    const lightCanvas = document.createElement("canvas");
    lightCanvas.width = VIEW_W;
    lightCanvas.height = VIEW_H;
    const lightCtx = lightCanvas.getContext("2d");

    const game = {
        appState: "menu",
        pausedFrom: null,
        pendingActionAfterName: null,
        confirmCallback: null,

        isInfinite: false,
        infiniteSector: 1,
        infiniteDistance: 0,
        infiniteRunCoins: 0,
        infiniteRunScore: 0,
        infiniteRunTime: 0,

        levelDef: null,
        rows: 0,
        cols: 0,
        grid: [],
        coins: [],
        crystals: [],
        checkpoints: [],
        staticSpikes: [],
        toggleSpikes: [],
        lasers: [],
        movingWalls: [],
        portals: [],
        hunters: [],
        exitPos: { gx: 1, gy: 1 },
        startPos: { gx: 1, gy: 1 },
        checkpointPos: { gx: 1, gy: 1 },

        player: {
            gx: 1,
            gy: 1,
            px: 60,
            py: 60,
            nextGx: 1,
            nextGy: 1,
            dirX: 0,
            dirY: 0,
            sliding: false,
            queue: [],
            lives: 3,
            invulnTimer: 0,
            lightBoostTimer: 0,
            warpTimer: 0,
            portalCooldown: 0,
            bumpTimer: 0,
            bumpDirX: 0,
            bumpDirY: 0,
            trail: []
        },

        score: 0,
        coinsCollected: 0,
        elapsedTime: 0,
        hintTimer: 0,
        hazardClock: 0,
        risingDangerY: 9999,
        camX: 0,
        camY: 0,
        shakeTimer: 0,

        particles: [],
        floatingTexts: [],

        animClock: 0,
        rafId: null,
        lastTs: 0
    };

    function parseAndLoadLevel(levelDef, resetSessionCounters = true) {
        game.levelDef = levelDef;
        game.rows = levelDef.map.length;
        game.cols = levelDef.map[0].length;
        game.grid = [];
        game.coins = [];
        game.crystals = [];
        game.checkpoints = [];
        game.staticSpikes = [];
        game.toggleSpikes = [];
        game.lasers = [];
        game.movingWalls = [];
        game.portals = [];
        game.hunters = [];
        game.particles = [];
        game.floatingTexts = [];

        const rawPortals = {};

        for (let y = 0; y < game.rows; y++) {
            const row = [];
            for (let x = 0; x < game.cols; x++) {
                const ch = levelDef.map[y][x];
                if (ch === "#") {
                    row.push("#");
                } else {
                    row.push(".");
                    if (ch === "S") {
                        game.startPos = { gx: x, gy: y };
                        game.checkpointPos = { gx: x, gy: y };
                    } else if (ch === "E") {
                        game.exitPos = { gx: x, gy: y };
                    } else if (ch === "c") {
                        game.coins.push({ gx: x, gy: y, collected: false });
                    } else if (ch === "G" || ch === "B") {
                        game.crystals.push({ gx: x, gy: y, collected: false, secret: ch === "B" });
                    } else if (ch === "P") {
                        game.checkpoints.push({ gx: x, gy: y, active: false });
                    } else if (ch === "^") {
                        game.staticSpikes.push({ gx: x, gy: y });
                    } else if (ch === "~") {
                        game.toggleSpikes.push({ gx: x, gy: y, offset: (x + y) * 0.35 });
                    } else if (ch === "L") {
                        game.lasers.push({ gx: x, gy: y, offset: (x * 0.4 + y * 0.2) % 2.8, wasActive: false });
                    } else if (ch === "M") {
                        game.movingWalls.push({ gx: x, gy: y, offset: (x + y) * 0.5, closed: false });
                    } else if (ch === "H") {
                        game.hunters.push({
                            gx: x,
                            gy: y,
                            px: x * TILE + TILE / 2,
                            py: y * TILE + TILE / 2,
                            targetGx: x,
                            targetGy: y,
                            moveProg: 1,
                            thinkTimer: 0
                        });
                    } else if (ch === "1" || ch === "2" || ch === "3" || ch === "4") {
                        rawPortals[ch] = { gx: x, gy: y };
                    }
                }
            }
            game.grid.push(row);
        }

        const linkPair = (aKey, bKey, color) => {
            if (rawPortals[aKey] && rawPortals[bKey]) {
                const a = rawPortals[aKey];
                const b = rawPortals[bKey];
                game.portals.push({ gx: a.gx, gy: a.gy, partnerGx: b.gx, partnerGy: b.gy, color });
                game.portals.push({ gx: b.gx, gy: b.gy, partnerGx: a.gx, partnerGy: a.gy, color });
            }
        };
        linkPair("1", "2", "#00f5d4");
        linkPair("3", "4", "#ff4dff");

        if (resetSessionCounters) {
            game.score = 0;
            game.coinsCollected = 0;
            game.elapsedTime = 0;
            game.player.lives = 3;
        }

        game.hazardClock = 0;
        game.risingDangerY = levelDef.risingHazard ? (game.rows + 1.5) * TILE : 99999;

        placePlayerAt(game.startPos.gx, game.startPos.gy);
        game.player.invulnTimer = 0;
        game.player.lightBoostTimer = 0;
        game.player.warpTimer = 0;
        game.player.portalCooldown = 0;
        game.player.queue = [];

        if (levelDef.hint) {
            dom.phaseHint.textContent = levelDef.hint;
            dom.phaseHint.classList.remove("hidden");
            game.hintTimer = 5.5;
        } else {
            dom.phaseHint.classList.add("hidden");
            game.hintTimer = 0;
        }

        audio.setIntense(levelDef.id >= 6 || game.isInfinite);
        updateGameHud();
        snapCamera();
    }

    function placePlayerAt(gx, gy) {
        const p = game.player;
        p.gx = gx;
        p.gy = gy;
        p.nextGx = gx;
        p.nextGy = gy;
        p.px = gx * TILE + TILE / 2;
        p.py = gy * TILE + TILE / 2;
        p.dirX = 0;
        p.dirY = 0;
        p.sliding = false;
        p.queue = [];
        p.trail = [];
    }

    function snapCamera() {
        const worldW = game.cols * TILE;
        const worldH = game.rows * TILE;
        game.camX = worldW <= VIEW_W ? -(VIEW_W - worldW) / 2 : clamp(game.player.px - VIEW_W / 2, 0, worldW - VIEW_W);
        game.camY = worldH <= VIEW_H ? -(VIEW_H - worldH) / 2 : clamp(game.player.py - VIEW_H / 2, 0, worldH - VIEW_H);
    }

    /* =========================================================================
       7. LÓGICA DE ESTADOS DO JOGO, FASES, PAUSA E RECORDES
    ========================================================================= */
    function formatTime(sec) {
        const total = Math.max(0, Math.floor(sec));
        const m = Math.floor(total / 60);
        const s = total % 60;
        return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }

    function ensurePlayerNameThen(callback) {
        if (save.playerName && save.playerName.trim().length > 0) {
            callback();
            return;
        }
        game.pendingActionAfterName = callback;
        dom.nameModalError.classList.add("hidden");
        dom.nameModalInput.value = "";
        dom.modalName.classList.remove("hidden");
        dom.nameModalInput.focus();
    }

    function startCampaignLevel(levelNum) {
        ensurePlayerNameThen(() => {
            const idx = clamp(levelNum, 1, 10) - 1;
            game.isInfinite = false;
            save.stats.attempts += 1;
            persistSave();

            hideGameOverlays();
            parseAndLoadLevel(CAMPAIGN_LEVELS[idx], true);
            showScreen("game", "playing");
            audio.setPaused(false);
        });
    }

    function startInfiniteMode() {
        if (!save.infiniteUnlocked) return;
        ensurePlayerNameThen(() => {
            game.isInfinite = true;
            game.infiniteSector = 1;
            game.infiniteDistance = 0;
            game.infiniteRunCoins = 0;
            game.infiniteRunScore = 0;
            game.infiniteRunTime = 0;

            save.stats.attempts += 1;
            persistSave();

            hideGameOverlays();
            parseAndLoadLevel(generateInfiniteLevel(1), true);
            showScreen("game", "playing");
            audio.setPaused(false);
        });
    }

    function hideGameOverlays() {
        dom.overlayPause.classList.add("hidden");
        dom.overlayClear.classList.add("hidden");
        dom.overlayChampion.classList.add("hidden");
        dom.overlayGameover.classList.add("hidden");
    }

    function showScreen(screenKey, stateName) {
        Object.entries(dom.screens).forEach(([k, el]) => {
            el.classList.toggle("active", k === screenKey);
        });
        game.appState = stateName;
        if (screenKey === "menu") {
            audio.setIntense(false);
            audio.setPaused(false);
            refreshMenuUI();
        } else if (screenKey === "levels") {
            renderLevelsGrid();
        }
    }

    function updateGameHud() {
        const def = game.levelDef;
        if (!def) return;

        if (game.isInfinite) {
            dom.hudLevelBadge.textContent = `INFINITO #${game.infiniteSector}`;
            dom.hudLevelName.textContent = `${game.infiniteDistance}m • Meta: ${game.coinsCollected}/${def.minCoins} 🪙`;
            dom.hudObjective.textContent = `${game.coinsCollected} / ${def.minCoins} 🪙`;
            dom.hudScore.textContent = String(game.infiniteRunScore + game.score);
            dom.hudCoins.textContent = String(game.infiniteRunCoins + game.coinsCollected);
            dom.hudTimer.textContent = formatTime(game.infiniteRunTime + game.elapsedTime);
        } else {
            dom.hudLevelBadge.textContent = `FASE ${String(def.id).padStart(2, "0")}`;
            dom.hudLevelName.textContent = def.name;
            dom.hudObjective.textContent = `${game.coinsCollected} / ${def.minCoins} 🪙`;
            dom.hudScore.textContent = String(game.score);
            dom.hudCoins.textContent = String(game.coinsCollected);
            dom.hudTimer.textContent = formatTime(game.elapsedTime);
        }

        const hearts = "❤️".repeat(Math.max(0, game.player.lives)) + "🖤".repeat(Math.max(0, 3 - game.player.lives));
        dom.hudLives.textContent = hearts;
    }

    function pauseGame() {
        if (game.appState !== "playing") return;
        game.pausedFrom = "playing";
        game.appState = "paused";
        game.player.queue = [];
        audio.setPaused(true);
        audio.playClick();
        dom.overlayPause.classList.remove("hidden");
    }

    function resumeGame() {
        if (game.appState !== "paused") return;
        game.appState = game.pausedFrom || "playing";
        game.pausedFrom = null;
        dom.overlayPause.classList.add("hidden");
        audio.setPaused(false);
        audio.playClick();
    }

    /* =========================================================================
       8. COLISÕES, ARMADILHAS, HUNTER IA E MOVIMENTAÇÃO EM GRADE
    ========================================================================= */
    function isMovingWallClosed(mw) {
        const cycle = (game.hazardClock + mw.offset) % 3.2;
        return cycle < 1.6;
    }

    function isLaserActive(ls) {
        const cycle = (game.hazardClock + ls.offset) % 3.0;
        return cycle >= 1.9;
    }

    function isLaserWarning(ls) {
        const cycle = (game.hazardClock + ls.offset) % 3.0;
        return cycle >= 1.3 && cycle < 1.9;
    }

    function isToggleSpikeActive(sp) {
        const cycle = (game.hazardClock + sp.offset) % 2.6;
        return cycle >= 1.3;
    }

    function isCellBlocked(gx, gy) {
        if (gx < 0 || gy < 0 || gx >= game.cols || gy >= game.rows) return true;
        if (game.grid[gy][gx] === "#") return true;
        for (let i = 0; i < game.movingWalls.length; i++) {
            const mw = game.movingWalls[i];
            if (mw.gx === gx && mw.gy === gy && mw.closed) return true;
        }
        return false;
    }

    function tryStartSlide(dx, dy) {
        const p = game.player;
        if (p.sliding || p.warpTimer > 0) return false;

        if (!isCellBlocked(p.gx + dx, p.gy + dy)) {
            p.dirX = dx;
            p.dirY = dy;
            p.nextGx = p.gx + dx;
            p.nextGy = p.gy + dy;
            p.sliding = true;
            audio.playSlide();
            return true;
        } else {
            p.bumpTimer = 0.12;
            p.bumpDirX = dx;
            p.bumpDirY = dy;
            return false;
        }
    }

    function queueDirection(dx, dy) {
        if (game.appState !== "playing") return;
        const p = game.player;

        if (!p.sliding) {
            tryStartSlide(dx, dy);
            return;
        }

        const last = p.queue.length > 0 ? p.queue[p.queue.length - 1] : { dx: p.dirX, dy: p.dirY };
        if (last.dx === dx && last.dy === dy) return;
        if (p.queue.length < 2) {
            p.queue.push({ dx, dy });
        }
    }

    function triggerPlayerDamage(reasonText) {
        const p = game.player;
        if (p.invulnTimer > 0 || game.appState !== "playing") return;

        p.lives -= 1;
        p.invulnTimer = 1.4;
        game.shakeTimer = 0.28;
        spawnParticles(p.px, p.py, "#ff4d4d", 18, 220);
        audio.playHurt();
        updateGameHud();

        if (p.lives <= 0) {
            triggerGameOver(reasonText);
            return;
        }

        placePlayerAt(game.checkpointPos.gx, game.checkpointPos.gy);
        if (game.levelDef.risingHazard) {
            game.risingDangerY = Math.max(game.risingDangerY, (game.checkpointPos.gy + 4.5) * TILE);
        }
    }

    function processCellArrival(gx, gy) {
        const p = game.player;

        for (let i = 0; i < game.coins.length; i++) {
            const c = game.coins[i];
            if (!c.collected && c.gx === gx && c.gy === gy) {
                c.collected = true;
                game.coinsCollected += 1;
                game.score += 10;
                save.stats.totalCoins += 1;
                spawnParticles(p.px, p.py, "#ffcf40", 10, 140);
                spawnFloatingText(p.px, p.py - 18, "+10", "#ffcf40");
                audio.playCoin();
                updateGameHud();
                persistSave();
            }
        }

        for (let i = 0; i < game.crystals.length; i++) {
            const cr = game.crystals[i];
            if (!cr.collected && cr.gx === gx && cr.gy === gy) {
                cr.collected = true;
                const pts = cr.secret ? 150 : 50;
                game.score += pts;
                p.lightBoostTimer = 8.0;
                spawnParticles(p.px, p.py, cr.secret ? "#ff4dff" : "#00f5d4", 18, 190);
                spawnFloatingText(p.px, p.py - 20, cr.secret ? `SECRETO +${pts}!` : `+${pts} ◆`, cr.secret ? "#ff4dff" : "#00f5d4");
                audio.playCrystal();
                updateGameHud();
            }
        }

        for (let i = 0; i < game.checkpoints.length; i++) {
            const cp = game.checkpoints[i];
            if (!cp.active && cp.gx === gx && cp.gy === gy) {
                cp.active = true;
                game.checkpointPos = { gx, gy };
                spawnParticles(p.px, p.py, "#bbff62", 16, 160);
                spawnFloatingText(p.px, p.py - 22, "CHECKPOINT!", "#bbff62");
                audio.playCheckpoint();
                persistSave();
            }
        }

        if (p.portalCooldown <= 0) {
            for (let i = 0; i < game.portals.length; i++) {
                const pt = game.portals[i];
                if (pt.gx === gx && pt.gy === gy) {
                    const keepDx = p.dirX;
                    const keepDy = p.dirY;
                    spawnParticles(p.px, p.py, pt.color, 16, 170);
                    placePlayerAt(pt.partnerGx, pt.partnerGy);
                    p.warpTimer = 0.18;
                    p.portalCooldown = 0.35;
                    spawnParticles(p.px, p.py, pt.color, 16, 170);
                    audio.playPortal();
                    if (!isCellBlocked(p.gx + keepDx, p.gy + keepDy)) {
                        p.dirX = keepDx;
                        p.dirY = keepDy;
                        p.nextGx = p.gx + keepDx;
                        p.nextGy = p.gy + keepDy;
                        p.sliding = true;
                    }
                    return "teleported";
                }
            }
        }

        if (gx === game.exitPos.gx && gy === game.exitPos.gy) {
            if (game.coinsCollected >= game.levelDef.minCoins) {
                completeCurrentLevel();
                return "exited";
            } else {
                const faltam = game.levelDef.minCoins - game.coinsCollected;
                spawnFloatingText(p.px, p.py - 24, `Faltam ${faltam} 🪙!`, "#ff7070");
            }
        }

        return "ok";
    }

    function checkTileHazardsAt(gx, gy) {
        for (let i = 0; i < game.staticSpikes.length; i++) {
            const s = game.staticSpikes[i];
            if (s.gx === gx && s.gy === gy) {
                triggerPlayerDamage("Você atingiu um espinho!");
                return true;
            }
        }

        for (let i = 0; i < game.toggleSpikes.length; i++) {
            const s = game.toggleSpikes[i];
            if (s.gx === gx && s.gy === gy && isToggleSpikeActive(s)) {
                triggerPlayerDamage("Você tocou um espinho ativo!");
                return true;
            }
        }

        for (let i = 0; i < game.lasers.length; i++) {
            const l = game.lasers[i];
            if (l.gx === gx && l.gy === gy && isLaserActive(l)) {
                triggerPlayerDamage("Eletrocutado por um laser!");
                return true;
            }
        }

        return false;
    }

    function findHunterNextStep(startGx, startGy, goalGx, goalGy) {
        if (startGx === goalGx && startGy === goalGy) return { gx: startGx, gy: startGy };
        const dirs = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        const visited = new Set([`${startGx},${startGy}`]);
        const queue = [{ x: startGx, y: startGy, first: null }];

        while (queue.length > 0) {
            const cur = queue.shift();
            for (let i = 0; i < dirs.length; i++) {
                const nx = cur.x + dirs[i].x;
                const ny = cur.y + dirs[i].y;
                if (isCellBlocked(nx, ny)) continue;
                const key = `${nx},${ny}`;
                if (visited.has(key)) continue;
                visited.add(key);

                const firstStep = cur.first || { gx: nx, gy: ny };
                if (nx === goalGx && ny === goalGy) return firstStep;
                queue.push({ x: nx, y: ny, first: firstStep });
            }
        }
        return { gx: startGx, gy: startGy };
    }

    /* =========================================================================
       9. CONCLUSÃO DE FASE, CAMPANHA E GAME OVER
    ========================================================================= */
    function pushHistoryRecord(modeLabel, scoreVal, timeVal, coinsVal, resultLabel, resultClass) {
        const d = new Date();
        const dateStr = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
        save.history.unshift({
            mode: modeLabel,
            score: scoreVal,
            time: formatTime(timeVal),
            coins: coinsVal,
            result: resultLabel,
            cls: resultClass,
            date: dateStr
        });
        save.history = save.history.slice(0, 60);
    }

    function completeCurrentLevel() {
        audio.playLevelClear();

        if (game.isInfinite) {
            const sectorClearBonus = 200 + game.infiniteSector * 40;
            game.infiniteRunScore += game.score + sectorClearBonus;
            game.infiniteRunCoins += game.coinsCollected;
            game.infiniteRunTime += game.elapsedTime;
            game.infiniteDistance += game.rows * 4;

            if (game.infiniteDistance > save.stats.infBestDistance) save.stats.infBestDistance = game.infiniteDistance;
            if (game.infiniteRunScore > save.stats.infBestScore) save.stats.infBestScore = game.infiniteRunScore;
            if (game.infiniteRunCoins > save.stats.infBestCoins) save.stats.infBestCoins = game.infiniteRunCoins;
            if (game.infiniteRunTime > save.stats.infBestTime) save.stats.infBestTime = game.infiniteRunTime;
            persistSave();

            game.infiniteSector += 1;
            parseAndLoadLevel(generateInfiniteLevel(game.infiniteSector), true);
            return;
        }

        const lvlId = game.levelDef.id;
        const timeBonus = Math.max(0, Math.round((45 - game.elapsedTime) * 4));
        const perfectBonus = game.player.lives === 3 ? 150 : 0;
        const levelClearBonus = 200;
        const totalLevelScore = game.score + levelClearBonus + timeBonus + perfectBonus;

        save.stats.totalScore += totalLevelScore;
        if (totalLevelScore > save.stats.bestScore) save.stats.bestScore = totalLevelScore;
        save.stats.currentStreak += 1;
        if (save.stats.currentStreak > save.stats.maxStreak) {
            save.stats.maxStreak = save.stats.currentStreak;
        }

        if (!save.completedLevels.includes(lvlId)) {
            save.completedLevels.push(lvlId);
        }
        if (lvlId < 10 && save.unlockedLevel < lvlId + 1) {
            save.unlockedLevel = lvlId + 1;
        }
        if (lvlId === 10) {
            save.infiniteUnlocked = true;
        }

        const prevBest = save.bestLevelScores[lvlId] || 0;
        if (totalLevelScore > prevBest) save.bestLevelScores[lvlId] = totalLevelScore;

        const prevTime = save.bestLevelTimes[lvlId];
        if (!prevTime || game.elapsedTime < prevTime) save.bestLevelTimes[lvlId] = game.elapsedTime;

        pushHistoryRecord(
            `Fase ${String(lvlId).padStart(2, "0")}`,
            totalLevelScore,
            game.elapsedTime,
            game.coinsCollected,
            "CONCLUÍDA",
            "hb-win"
        );
        persistSave();

        const rank = totalLevelScore >= 520 ? "RANK S" : totalLevelScore >= 380 ? "RANK A" : "RANK B";

        if (lvlId === 10) {
            game.appState = "champion";
            audio.playVictory();
            dom.champScore.textContent = String(totalLevelScore);
            dom.champTime.textContent = formatTime(game.elapsedTime);
            dom.champCoins.textContent = String(game.coinsCollected);
            dom.champRank.textContent = rank;
            dom.overlayChampion.classList.remove("hidden");
            return;
        }

        game.appState = "level_clear";
        dom.clearTitle.textContent = `FASE ${String(lvlId).padStart(2, "0")} — ${game.levelDef.name}`;
        dom.clearRank.textContent = rank;
        dom.clearScore.textContent = String(totalLevelScore);
        dom.clearTime.textContent = formatTime(game.elapsedTime);
        dom.clearCoins.textContent = String(game.coinsCollected);
        dom.clearLives.textContent = `${game.player.lives} / 3`;
        dom.clearBonuses.textContent = `Bônus: +${levelClearBonus} Fase | +${timeBonus} Tempo | +${perfectBonus} Perfeição`;
        dom.overlayClear.classList.remove("hidden");
    }

    function triggerGameOver(reasonText) {
        game.appState = "gameover";
        audio.playGameOver();

        if (game.isInfinite) {
            const totalScore = game.infiniteRunScore + game.score;
            const totalCoins = game.infiniteRunCoins + game.coinsCollected;
            const totalTime = game.infiniteRunTime + game.elapsedTime;

            if (game.infiniteDistance > save.stats.infBestDistance) save.stats.infBestDistance = game.infiniteDistance;
            if (totalScore > save.stats.infBestScore) save.stats.infBestScore = totalScore;
            if (totalCoins > save.stats.infBestCoins) save.stats.infBestCoins = totalCoins;
            if (totalTime > save.stats.infBestTime) save.stats.infBestTime = totalTime;

            pushHistoryRecord("Modo Infinito", totalScore, totalTime, totalCoins, `${game.infiniteDistance}m`, "hb-inf");
            persistSave();

            dom.goSubtitle.textContent = reasonText || "Fim da corrida infinita!";
            dom.goScore.textContent = String(totalScore);
            dom.goCoins.textContent = String(totalCoins);
            dom.goExtraLabel.textContent = "Distância";
            dom.goExtraVal.textContent = `${game.infiniteDistance} m`;
            dom.goModeLabel.textContent = `Infinito #${game.infiniteSector}`;
        } else {
            save.stats.currentStreak = 0;
            pushHistoryRecord(
                `Fase ${String(game.levelDef.id).padStart(2, "0")}`,
                game.score,
                game.elapsedTime,
                game.coinsCollected,
                "DERROTA",
                "hb-lose"
            );
            persistSave();

            dom.goSubtitle.textContent = reasonText || "Você perdeu todas as suas vidas.";
            dom.goScore.textContent = String(game.score);
            dom.goCoins.textContent = String(game.coinsCollected);
            dom.goExtraLabel.textContent = "Tempo";
            dom.goExtraVal.textContent = formatTime(game.elapsedTime);
            dom.goModeLabel.textContent = `Fase ${String(game.levelDef.id).padStart(2, "0")}`;
        }

        dom.overlayGameover.classList.remove("hidden");
    }

    /* =========================================================================
       10. UPDATE & RENDER (CANVAS 2D + PARTÍCULAS)
    ========================================================================= */
    function spawnParticles(x, y, color, count, speed) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = 40 + Math.random() * speed;
            game.particles.push({
                x,
                y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                size: 3 + Math.random() * 4,
                life: 0.32 + Math.random() * 0.25,
                maxLife: 0.57,
                color
            });
        }
    }

    function spawnFloatingText(x, y, text, color) {
        game.floatingTexts.push({
            x,
            y,
            text,
            color,
            life: 0.78,
            maxLife: 0.78
        });
    }

    function updateGame(dt) {
        game.animClock += dt;

        if (game.appState === "menu") {
            const mCtx = dom.menuAvatarCanvas.getContext("2d");
            mCtx.clearRect(0, 0, 96, 96);
            drawMiniBloxAvatar(mCtx, 48, 56, 1.85, avatarData, { animTime: game.animClock });
            return;
        }

        if (game.appState !== "playing") return;

        const p = game.player;
        game.elapsedTime += dt;
        game.hazardClock += dt;

        if (game.hintTimer > 0) {
            game.hintTimer -= dt;
            if (game.hintTimer <= 0) {
                dom.phaseHint.classList.add("hidden");
            }
        }

        if (p.invulnTimer > 0) p.invulnTimer = Math.max(0, p.invulnTimer - dt);
        if (p.lightBoostTimer > 0) p.lightBoostTimer = Math.max(0, p.lightBoostTimer - dt);
        if (p.warpTimer > 0) p.warpTimer = Math.max(0, p.warpTimer - dt);
        if (p.portalCooldown > 0) p.portalCooldown = Math.max(0, p.portalCooldown - dt);
        if (p.bumpTimer > 0) p.bumpTimer = Math.max(0, p.bumpTimer - dt);
        if (game.shakeTimer > 0) game.shakeTimer = Math.max(0, game.shakeTimer - dt);

        for (let i = 0; i < game.movingWalls.length; i++) {
            const mw = game.movingWalls[i];
            const wantsClosed = isMovingWallClosed(mw);
            const playerInside =
                (p.gx === mw.gx && p.gy === mw.gy) ||
                (p.sliding && p.nextGx === mw.gx && p.nextGy === mw.gy);
            if (wantsClosed && !playerInside) {
                mw.closed = true;
            } else if (!wantsClosed) {
                mw.closed = false;
            }
        }

        for (let i = 0; i < game.lasers.length; i++) {
            const l = game.lasers[i];
            const act = isLaserActive(l);
            if (act !== l.wasActive) {
                l.wasActive = act;
                if (Math.hypot(l.gx - p.gx, l.gy - p.gy) <= 6) {
                    audio.playLaserToggle(act);
                }
            }
        }

        if (p.sliding && p.warpTimer <= 0) {
            let speed = game.levelDef.speed;
            if (game.levelDef.risingHazard) {
                const progressRatio = 1 - p.gy / Math.max(1, game.rows - 1);
                speed *= 1 + progressRatio * 0.28;
            }

            let remainingMove = speed * dt;

            while (remainingMove > 0 && p.sliding && game.appState === "playing") {
                const targetPx = p.nextGx * TILE + TILE / 2;
                const targetPy = p.nextGy * TILE + TILE / 2;
                const distToTarget = Math.hypot(targetPx - p.px, targetPy - p.py);

                p.trail.push({ x: p.px, y: p.py, life: 0.16 });
                if (p.trail.length > 12) p.trail.shift();

                if (remainingMove < distToTarget) {
                    p.px += p.dirX * remainingMove;
                    p.py += p.dirY * remainingMove;
                    remainingMove = 0;
                } else {
                    p.px = targetPx;
                    p.py = targetPy;
                    p.gx = p.nextGx;
                    p.gy = p.nextGy;
                    remainingMove -= distToTarget;

                    if (game.isInfinite) {
                        const climbed = Math.max(0, (game.rows - 2 - p.gy) * 4);
                        if (climbed > game.infiniteDistance % (game.rows * 4) || game.infiniteSector === 1) {
                            game.infiniteDistance = Math.max(game.infiniteDistance, (game.infiniteSector - 1) * game.rows * 4 + climbed);
                        }
                    }

                    const arrival = processCellArrival(p.gx, p.gy);
                    if (arrival === "exited" || game.appState !== "playing") break;

                    if (checkTileHazardsAt(p.gx, p.gy)) break;

                    if (arrival === "teleported") break;

                    if (!isCellBlocked(p.gx + p.dirX, p.gy + p.dirY)) {
                        p.nextGx = p.gx + p.dirX;
                        p.nextGy = p.gy + p.dirY;
                    } else {
                        p.sliding = false;
                        p.dirX = 0;
                        p.dirY = 0;
                        audio.playWallStop();

                        while (p.queue.length > 0) {
                            const nextCmd = p.queue.shift();
                            if (tryStartSlide(nextCmd.dx, nextCmd.dy)) {
                                break;
                            }
                        }
                    }
                }
            }
        } else if (p.warpTimer <= 0) {
            checkTileHazardsAt(p.gx, p.gy);
        }

        if (game.appState !== "playing") return;

        for (let i = 0; i < game.hunters.length; i++) {
            const h = game.hunters[i];
            if (h.moveProg >= 1) {
                h.gx = h.targetGx;
                h.gy = h.targetGy;
                const nextStep = findHunterNextStep(h.gx, h.gy, p.gx, p.gy);
                h.targetGx = nextStep.gx;
                h.targetGy = nextStep.gy;
                h.moveProg = 0;
                if (Math.hypot(h.gx - p.gx, h.gy - p.gy) <= 5) {
                    audio.playHunterPulse();
                }
            }
            const hunterSpeed = game.levelDef.speed * 0.38;
            h.moveProg = Math.min(1, h.moveProg + (hunterSpeed / TILE) * dt);
            h.px = (h.gx + (h.targetGx - h.gx) * h.moveProg) * TILE + TILE / 2;
            h.py = (h.gy + (h.targetGy - h.gy) * h.moveProg) * TILE + TILE / 2;

            if (Math.hypot(h.px - p.px, h.py - p.py) < TILE * 0.62) {
                triggerPlayerDamage("Capturado pelo Caçador!");
                return;
            }
        }

        if (game.levelDef.risingHazard) {
            game.risingDangerY -= (game.levelDef.risingSpeed || 18) * dt;
            if (p.py + 12 >= game.risingDangerY) {
                triggerPlayerDamage("Engolido pelo plasma crescente!");
                return;
            }
        }

        for (let i = p.trail.length - 1; i >= 0; i--) {
            p.trail[i].life -= dt;
            if (p.trail[i].life <= 0) p.trail.splice(i, 1);
        }

        for (let i = game.particles.length - 1; i >= 0; i--) {
            const pt = game.particles[i];
            pt.x += pt.vx * dt;
            pt.y += pt.vy * dt;
            pt.vx *= 0.93;
            pt.vy *= 0.93;
            pt.life -= dt;
            if (pt.life <= 0) game.particles.splice(i, 1);
        }

        for (let i = game.floatingTexts.length - 1; i >= 0; i--) {
            const ft = game.floatingTexts[i];
            ft.y -= 32 * dt;
            ft.life -= dt;
            if (ft.life <= 0) game.floatingTexts.splice(i, 1);
        }

        const worldW = game.cols * TILE;
        const worldH = game.rows * TILE;
        const targetCamX = worldW <= VIEW_W ? -(VIEW_W - worldW) / 2 : clamp(p.px - VIEW_W / 2, 0, worldW - VIEW_W);
        const targetCamY = worldH <= VIEW_H ? -(VIEW_H - worldH) / 2 : clamp(p.py - VIEW_H / 2, 0, worldH - VIEW_H);
        game.camX += (targetCamX - game.camX) * Math.min(1, dt * 12);
        game.camY += (targetCamY - game.camY) * Math.min(1, dt * 12);

        dom.hudTimer.textContent = formatTime(game.isInfinite ? game.infiniteRunTime + game.elapsedTime : game.elapsedTime);
    }

    function renderGame() {
        const showArena =
            game.appState === "playing" ||
            game.appState === "paused" ||
            game.appState === "level_clear" ||
            game.appState === "gameover" ||
            game.appState === "champion";

        if (!showArena || !game.levelDef) return;

        ctx.clearRect(0, 0, VIEW_W, VIEW_H);

        ctx.fillStyle = "#100c22";
        ctx.fillRect(0, 0, VIEW_W, VIEW_H);

        ctx.save();
        const shakeX = game.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;
        const shakeY = game.shakeTimer > 0 ? (Math.random() - 0.5) * 9 : 0;
        ctx.translate(-game.camX + shakeX, -game.camY + shakeY);

        for (let y = 0; y < game.rows; y++) {
            for (let x = 0; x < game.cols; x++) {
                const px = x * TILE;
                const py = y * TILE;
                if (game.grid[y][x] === "#") {
                    ctx.fillStyle = "#261b47";
                    ctx.fillRect(px, py, TILE, TILE);
                    ctx.strokeStyle = "#7c4dff";
                    ctx.lineWidth = 2;
                    ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
                    ctx.fillStyle = "rgba(0, 245, 212, 0.08)";
                    ctx.fillRect(px + 6, py + 6, TILE - 12, 5);
                } else {
                    ctx.fillStyle = (x + y) % 2 === 0 ? "#16112d" : "#191334";
                    ctx.fillRect(px, py, TILE, TILE);
                }
            }
        }

        for (let i = 0; i < game.movingWalls.length; i++) {
            const mw = game.movingWalls[i];
            const px = mw.gx * TILE;
            const py = mw.gy * TILE;
            if (mw.closed) {
                ctx.fillStyle = "#3e2478";
                ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
                ctx.strokeStyle = "#00f5d4";
                ctx.lineWidth = 2.5;
                ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
            } else {
                ctx.strokeStyle = "rgba(0, 245, 212, 0.35)";
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 2;
                ctx.strokeRect(px + 4, py + 4, TILE - 8, TILE - 8);
                ctx.setLineDash([]);
            }
        }

        for (let i = 0; i < game.checkpoints.length; i++) {
            const cp = game.checkpoints[i];
            const cx = cp.gx * TILE + TILE / 2;
            const cy = cp.gy * TILE + TILE / 2;
            ctx.fillStyle = cp.active ? "#bbff62" : "#64748b";
            ctx.beginPath();
            ctx.arc(cx, cy, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = cp.active ? "#166534" : "#1e293b";
            ctx.fillRect(cx - 2, cy - 8, 3, 14);
            ctx.fillStyle = cp.active ? "#ffcf40" : "#cbd5e1";
            ctx.fillRect(cx + 1, cy - 8, 8, 6);
        }

        for (let i = 0; i < game.portals.length; i++) {
            const pt = game.portals[i];
            const cx = pt.gx * TILE + TILE / 2;
            const cy = pt.gy * TILE + TILE / 2;
            const pulse = 13 + Math.sin(game.animClock * 6) * 2.5;
            ctx.save();
            ctx.strokeStyle = pt.color;
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.arc(cx, cy, pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = "rgba(255,255,255,0.22)";
            ctx.fill();
            ctx.restore();
        }

        {
            const ex = game.exitPos.gx * TILE + TILE / 2;
            const ey = game.exitPos.gy * TILE + TILE / 2;
            const unlocked = game.coinsCollected >= game.levelDef.minCoins;
            const pulse = 13 + Math.sin(game.animClock * 5) * 2;
            ctx.fillStyle = unlocked ? "rgba(187, 255, 98, 0.25)" : "rgba(255, 112, 112, 0.2)";
            ctx.fillRect(game.exitPos.gx * TILE + 3, game.exitPos.gy * TILE + 3, TILE - 6, TILE - 6);
            ctx.strokeStyle = unlocked ? "#bbff62" : "#ff7070";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(ex, ey, pulse, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = unlocked ? "#bbff62" : "#ff7070";
            ctx.font = "700 10px 'Space Grotesk', sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("SAÍDA", ex, ey);
        }

        const drawSpikeTriangles = (gx, gy, active) => {
            const px = gx * TILE;
            const py = gy * TILE;
            ctx.fillStyle = active ? "#ff4d6d" : "#475569";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 1.5;
            const h = active ? 13 : 4;
            for (let s = 0; s < 3; s++) {
                const bx = px + 6 + s * 10;
                const by = py + TILE - 6;
                ctx.beginPath();
                ctx.moveTo(bx, by);
                ctx.lineTo(bx + 4.5, by - h);
                ctx.lineTo(bx + 9, by);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            }
        };

        game.staticSpikes.forEach(s => drawSpikeTriangles(s.gx, s.gy, true));
        game.toggleSpikes.forEach(s => drawSpikeTriangles(s.gx, s.gy, isToggleSpikeActive(s)));

        game.lasers.forEach(l => {
            const px = l.gx * TILE;
            const py = l.gy * TILE;
            const active = isLaserActive(l);
            const warn = isLaserWarning(l);

            ctx.fillStyle = "#334155";
            ctx.fillRect(px + 2, py + 15, 5, 10);
            ctx.fillRect(px + TILE - 7, py + 15, 5, 10);

            if (active) {
                ctx.strokeStyle = "#00f5d4";
                ctx.lineWidth = 6;
                ctx.beginPath();
                ctx.moveTo(px + 6, py + TILE / 2);
                ctx.lineTo(px + TILE - 6, py + TILE / 2);
                ctx.stroke();
                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();
            } else if (warn && Math.floor(game.animClock * 16) % 2 === 0) {
                ctx.strokeStyle = "#ffcf40";
                ctx.setLineDash([4, 4]);
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(px + 6, py + TILE / 2);
                ctx.lineTo(px + TILE - 6, py + TILE / 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        });

        game.coins.forEach(c => {
            if (c.collected) return;
            const cx = c.gx * TILE + TILE / 2;
            const cy = c.gy * TILE + TILE / 2;
            const rx = Math.max(3, Math.abs(Math.cos(game.animClock * 4 + c.gx)) * 8);
            ctx.fillStyle = "#ffcf40";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, 9, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        game.crystals.forEach(cr => {
            if (cr.collected) return;
            const cx = cr.gx * TILE + TILE / 2;
            const cy = cr.gy * TILE + TILE / 2 + Math.sin(game.animClock * 5) * 2;
            ctx.fillStyle = cr.secret ? "#ff4dff" : "#00f5d4";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - 11);
            ctx.lineTo(cx + 9, cy);
            ctx.lineTo(cx, cy + 11);
            ctx.lineTo(cx - 9, cy);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });

        const p = game.player;
        for (let i = 0; i < p.trail.length; i++) {
            const tr = p.trail[i];
            ctx.fillStyle = `rgba(0, 245, 212, ${clamp(tr.life / 0.16, 0, 1) * 0.35})`;
            ctx.beginPath();
            ctx.arc(tr.x, tr.y, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        const bumpX = p.bumpTimer > 0 ? p.bumpDirX * 4 : 0;
        const bumpY = p.bumpTimer > 0 ? p.bumpDirY * 4 : 0;
        const warpScale = p.warpTimer > 0 ? 1 - Math.sin((p.warpTimer / 0.18) * Math.PI) * 0.75 : 1;

        drawMiniBloxAvatar(ctx, p.px + bumpX, p.py + bumpY, 0.85, avatarData, {
            dirX: p.dirX,
            dirY: p.dirY,
            sliding: p.sliding,
            animTime: game.animClock,
            invuln: p.invulnTimer > 0,
            warpScale
        });

        for (let i = 0; i < game.hunters.length; i++) {
            const h = game.hunters[i];
            const bob = Math.sin(game.animClock * 10) * 2.5;
            ctx.fillStyle = "#ff2e63";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2.5;
            roundRectPath(ctx, h.px - 13, h.py - 13 + bob, 26, 26, 6);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = "#ffef5b";
            ctx.fillRect(h.px - 7, h.py - 5 + bob, 5, 5);
            ctx.fillRect(h.px + 2, h.py - 5 + bob, 5, 5);
        }

        if (game.levelDef.risingHazard) {
            const dy = game.risingDangerY;
            const totalW = game.cols * TILE;
            ctx.fillStyle = "rgba(255, 46, 99, 0.65)";
            ctx.fillRect(0, dy, totalW, game.rows * TILE + 120);
            ctx.strokeStyle = "#ffcf40";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, dy);
            ctx.lineTo(totalW, dy);
            ctx.stroke();
        }

        for (let i = 0; i < game.particles.length; i++) {
            const pt = game.particles[i];
            ctx.save();
            ctx.globalAlpha = clamp(pt.life / pt.maxLife, 0, 1);
            ctx.fillStyle = pt.color;
            ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
            ctx.restore();
        }

        for (let i = 0; i < game.floatingTexts.length; i++) {
            const ft = game.floatingTexts[i];
            ctx.save();
            ctx.globalAlpha = clamp(ft.life / ft.maxLife, 0, 1);
            ctx.font = "700 13px 'Space Grotesk', sans-serif";
            ctx.textAlign = "center";
            ctx.fillStyle = "#000";
            ctx.fillText(ft.text, ft.x + 1, ft.y + 1);
            ctx.fillStyle = ft.color;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }

        ctx.restore();

        if (game.levelDef.darkness) {
            const screenPx = p.px - game.camX;
            const screenPy = p.py - game.camY;
            const lightRadius = p.lightBoostTimer > 0 ? 270 : 148;

            lightCtx.clearRect(0, 0, VIEW_W, VIEW_H);
            lightCtx.fillStyle = "rgba(6, 4, 16, 0.94)";
            lightCtx.fillRect(0, 0, VIEW_W, VIEW_H);

            lightCtx.globalCompositeOperation = "destination-out";
            const grad = lightCtx.createRadialGradient(screenPx, screenPy, lightRadius * 0.25, screenPx, screenPy, lightRadius);
            grad.addColorStop(0, "rgba(0,0,0,1)");
            grad.addColorStop(1, "rgba(0,0,0,0)");
            lightCtx.fillStyle = grad;
            lightCtx.beginPath();
            lightCtx.arc(screenPx, screenPy, lightRadius, 0, Math.PI * 2);
            lightCtx.fill();
            lightCtx.globalCompositeOperation = "source-over";

            ctx.drawImage(lightCanvas, 0, 0);
        }
    }

    function mainLoop(ts) {
        if (!game.lastTs) game.lastTs = ts;
        const dt = Math.min((ts - game.lastTs) / 1000, 0.05);
        game.lastTs = ts;

        updateGame(dt);
        renderGame();

        game.rafId = requestAnimationFrame(mainLoop);
    }

    function startSingleLoop() {
        if (game.rafId !== null) return;
        game.lastTs = performance.now();
        game.rafId = requestAnimationFrame(mainLoop);
    }

    /* =========================================================================
       11. UI DO MENU, FASES, ESTATÍSTICAS E CONFIGURAÇÕES
    ========================================================================= */
    function refreshMenuUI() {
        dom.menuPlayerName.textContent = save.playerName || "Explorador";
        dom.menuVestTag.textContent = avatarData.hasSaved ? "Vestiário MiniBlox ✅" : "Avatar Padrão";
        dom.menuBestScore.textContent = String(save.stats.bestScore);
        dom.menuCurrentLevel.textContent = `Fase ${String(save.unlockedLevel).padStart(2, "0")}`;
        dom.menuClearedCount.textContent = `${save.completedLevels.length} / 10`;
        dom.menuTotalCoins.textContent = String(save.stats.totalCoins);

        dom.btnMenuContinue.textContent = save.completedLevels.length > 0 || save.unlockedLevel > 1
            ? `CONTINUAR (FASE ${String(save.unlockedLevel).padStart(2, "0")}) ⏩`
            : "CONTINUAR ⏩";

        dom.btnMenuInfinite.classList.toggle("is-locked", !save.infiniteUnlocked);
        dom.btnMenuInfinite.disabled = !save.infiniteUnlocked;
        dom.btnMenuInfinite.textContent = save.infiniteUnlocked ? "MODO INFINITO ∞" : "INFINITO 🔒 (Vença 10 Fases)";

        dom.stTotalScore.textContent = String(save.stats.totalScore);
        dom.stBestScore.textContent = String(save.stats.bestScore);
        dom.stCleared.textContent = `${save.completedLevels.length} / 10`;
        dom.stStreak.textContent = String(save.stats.maxStreak);
        dom.stCoins.textContent = String(save.stats.totalCoins);
        dom.stAttempts.textContent = String(save.stats.attempts);
        dom.stInfDist.textContent = `${save.stats.infBestDistance} m`;
        dom.stInfScore.textContent = String(save.stats.infBestScore);

        dom.bestTimesGrid.innerHTML = "";
        CAMPAIGN_LEVELS.forEach(lvl => {
            const t = save.bestLevelTimes[lvl.id];
            const chip = document.createElement("div");
            chip.className = "time-chip";
            chip.innerHTML = `<span>F${String(lvl.id).padStart(2, "0")}</span><strong>${t ? formatTime(t) : "--:--"}</strong>`;
            dom.bestTimesGrid.appendChild(chip);
        });

        dom.historyList.innerHTML = "";
        if (!save.history.length) {
            dom.historyList.innerHTML = `<p style="font-weight:700;padding:.8rem;text-align:center;">Nenhuma partida registrada ainda.</p>`;
        } else {
            save.history.forEach(h => {
                const row = document.createElement("div");
                row.className = "history-row";
                row.innerHTML = `
                    <strong>${h.mode}</strong>
                    <span>${h.score} pts</span>
                    <span>${h.time}</span>
                    <span>${h.coins} 🪙</span>
                    <span class="history-badge ${h.cls}">${h.result}</span>
                    <span>${h.date}</span>
                `;
                dom.historyList.appendChild(row);
            });
        }
    }

    function renderLevelsGrid() {
        dom.levelsGrid.innerHTML = "";

        CAMPAIGN_LEVELS.forEach(lvl => {
            const unlocked = lvl.id <= save.unlockedLevel;
            const completed = save.completedLevels.includes(lvl.id);

            const card = document.createElement("button");
            card.type = "button";
            card.className = "level-card";
            if (!unlocked) {
                card.classList.add("is-locked");
                card.disabled = true;
            } else if (completed) {
                card.classList.add("is-completed");
            }

            const statusCls = completed ? "st-done" : (unlocked ? "st-open" : "st-lock");
            const statusText = completed ? "CONCLUÍDA" : (unlocked ? "LIBERADA" : "BLOQUEADA 🔒");
            const bestSc = save.bestLevelScores[lvl.id] || 0;

            card.innerHTML = `
                <div class="level-card-head">
                    <span>FASE ${String(lvl.id).padStart(2, "0")}</span>
                    <span class="level-status-pill ${statusCls}">${statusText}</span>
                </div>
                <canvas class="level-thumb-canvas" width="180" height="82"></canvas>
                <div class="level-card-title">${lvl.name}</div>
                <div class="level-card-score">Melhor: ${bestSc} pts</div>
            `;

            const thumb = card.querySelector(".level-thumb-canvas");
            drawLevelMiniThumb(thumb, lvl, unlocked);

            card.addEventListener("click", () => {
                if (!unlocked) return;
                audio.playClick();
                startCampaignLevel(lvl.id);
            });

            dom.levelsGrid.appendChild(card);
        });
    }

    function drawLevelMiniThumb(canvas, lvl, unlocked) {
        const tc = canvas.getContext("2d");
        const rows = lvl.map.length;
        const cols = lvl.map[0].length;
        const cw = canvas.width / cols;
        const ch = canvas.height / rows;

        tc.fillStyle = "#120d26";
        tc.fillRect(0, 0, canvas.width, canvas.height);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const c = lvl.map[y][x];
                if (c === "#") {
                    tc.fillStyle = unlocked ? "#5b3cc4" : "#3a3a4a";
                    tc.fillRect(x * cw, y * ch, cw, ch);
                } else if (c === "E") {
                    tc.fillStyle = "#bbff62";
                    tc.fillRect(x * cw, y * ch, cw, ch);
                } else if (c === "S") {
                    tc.fillStyle = "#00f5d4";
                    tc.fillRect(x * cw, y * ch, cw, ch);
                }
            }
        }
    }

    function syncAudioUI() {
        const mOn = save.audio.musicEnabled;
        const sOn = save.audio.sfxEnabled;

        dom.headerMusicBtn.textContent = mOn ? "🎵 Música: ON" : "🎵 Música: OFF";
        dom.headerMusicBtn.classList.toggle("is-muted", !mOn);
        dom.headerMusicBtn.setAttribute("aria-pressed", String(mOn));

        dom.headerSfxBtn.textContent = sOn ? "🔊 Efeitos: ON" : "🔇 Efeitos: OFF";
        dom.headerSfxBtn.classList.toggle("is-muted", !sOn);
        dom.headerSfxBtn.setAttribute("aria-pressed", String(sOn));

        dom.setMusicToggle.textContent = mOn ? "ON" : "OFF";
        dom.setMusicToggle.classList.toggle("is-muted", !mOn);

        dom.setSfxToggle.textContent = sOn ? "ON" : "OFF";
        dom.setSfxToggle.classList.toggle("is-muted", !sOn);

        const mPct = Math.round(save.audio.musicVolume * 100);
        const sPct = Math.round(save.audio.sfxVolume * 100);
        dom.setMusicVol.value = String(mPct);
        dom.setSfxVol.value = String(sPct);
        dom.setMusicVal.textContent = `${mPct}%`;
        dom.setSfxVal.textContent = `${sPct}%`;
    }

    function openSettingsModal(allowReset) {
        dom.settingsNameInput.value = save.playerName || "";
        dom.settingsNameError.classList.add("hidden");
        dom.settingsResetBox.classList.toggle("hidden", !allowReset);
        syncAudioUI();
        dom.modalSettings.classList.remove("hidden");
    }

    function openConfirmModal(title, msg, cb) {
        dom.confirmTitle.textContent = title;
        dom.confirmMessage.textContent = msg;
        game.confirmCallback = cb;
        dom.modalConfirm.classList.remove("hidden");
    }

    /* =========================================================================
       12. EVENTOS DE INTERFACE E TECLADO
    ========================================================================= */
    function bindEvents() {
        const unlock = () => audio.unlock();
        document.addEventListener("pointerdown", unlock, { passive: true });
        document.addEventListener("keydown", unlock, { passive: true });

        dom.headerMusicBtn.addEventListener("click", () => {
            audio.updateConfig({ musicEnabled: !save.audio.musicEnabled });
            audio.playClick();
            syncAudioUI();
        });

        dom.headerSfxBtn.addEventListener("click", () => {
            audio.updateConfig({ sfxEnabled: !save.audio.sfxEnabled });
            if (save.audio.sfxEnabled) audio.playClick();
            syncAudioUI();
        });

        dom.btnMenuPlay.addEventListener("click", () => {
            audio.playClick();
            startCampaignLevel(1);
        });

        dom.btnMenuContinue.addEventListener("click", () => {
            audio.playClick();
            startCampaignLevel(save.unlockedLevel);
        });

        dom.btnMenuLevels.addEventListener("click", () => {
            audio.playClick();
            showScreen("levels", "levels");
        });

        dom.btnMenuInfinite.addEventListener("click", () => {
            audio.playClick();
            startInfiniteMode();
        });

        dom.btnMenuHowto.addEventListener("click", () => {
            audio.playClick();
            dom.modalHowto.classList.remove("hidden");
        });

        dom.btnMenuSettings.addEventListener("click", () => {
            audio.playClick();
            openSettingsModal(true);
        });

        dom.tabStatsBtn.addEventListener("click", () => {
            audio.playClick();
            dom.tabStatsBtn.classList.add("is-active");
            dom.tabHistoryBtn.classList.remove("is-active");
            dom.panelStats.classList.remove("hidden");
            dom.panelHistory.classList.add("hidden");
        });

        dom.tabHistoryBtn.addEventListener("click", () => {
            audio.playClick();
            dom.tabHistoryBtn.classList.add("is-active");
            dom.tabStatsBtn.classList.remove("is-active");
            dom.panelHistory.classList.remove("hidden");
            dom.panelStats.classList.add("hidden");
        });

        dom.btnLevelsBack.addEventListener("click", () => {
            audio.playClick();
            showScreen("menu", "menu");
        });

        dom.nameModalForm.addEventListener("submit", e => {
            e.preventDefault();
            audio.playClick();
            const val = dom.nameModalInput.value.trim();
            if (!val) {
                dom.nameModalError.textContent = "Digite um nome válido (sem espaços vazios).";
                dom.nameModalError.classList.remove("hidden");
                return;
            }
            save.playerName = val.slice(0, 16);
            persistSave();
            dom.modalName.classList.add("hidden");
            refreshMenuUI();
            const cb = game.pendingActionAfterName;
            game.pendingActionAfterName = null;
            if (typeof cb === "function") cb();
        });

        dom.btnNameCancel.addEventListener("click", () => {
            audio.playClick();
            game.pendingActionAfterName = null;
            dom.modalName.classList.add("hidden");
        });

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

        dom.btnSaveName.addEventListener("click", () => {
            audio.playClick();
            const val = dom.settingsNameInput.value.trim();
            if (!val) {
                dom.settingsNameError.textContent = "O nome não pode ficar vazio.";
                dom.settingsNameError.classList.remove("hidden");
                return;
            }
            dom.settingsNameError.classList.add("hidden");
            save.playerName = val.slice(0, 16);
            persistSave();
            refreshMenuUI();
        });

        dom.setMusicToggle.addEventListener("click", () => {
            audio.updateConfig({ musicEnabled: !save.audio.musicEnabled });
            audio.playClick();
            syncAudioUI();
        });

        dom.setSfxToggle.addEventListener("click", () => {
            audio.updateConfig({ sfxEnabled: !save.audio.sfxEnabled });
            if (save.audio.sfxEnabled) audio.playClick();
            syncAudioUI();
        });

        dom.setMusicVol.addEventListener("input", () => {
            audio.updateConfig({ musicVolume: clamp(Number(dom.setMusicVol.value) / 100, 0, 1) });
            syncAudioUI();
        });

        dom.setSfxVol.addEventListener("input", () => {
            audio.updateConfig({ sfxVolume: clamp(Number(dom.setSfxVol.value) / 100, 0, 1) });
            syncAudioUI();
        });

        dom.btnResetSave.addEventListener("click", () => {
            audio.playClick();
            openConfirmModal(
                "APAGAR PROGRESSO?",
                "Isso zerará fases concluídas, moedas, estatísticas e histórico do VERTIGO.",
                () => {
                    const keepAudio = { ...save.audio };
                    const keepName = save.playerName;
                    save = createDefaultSave();
                    save.audio = keepAudio;
                    save.playerName = keepName;
                    persistSave();
                    refreshMenuUI();
                    dom.modalSettings.classList.add("hidden");
                }
            );
        });

        dom.btnConfirmCancel.addEventListener("click", () => {
            audio.playClick();
            game.confirmCallback = null;
            dom.modalConfirm.classList.add("hidden");
        });

        dom.btnConfirmYes.addEventListener("click", () => {
            audio.playClick();
            const cb = game.confirmCallback;
            game.confirmCallback = null;
            dom.modalConfirm.classList.add("hidden");
            if (typeof cb === "function") cb();
        });

        dom.btnHudPause.addEventListener("click", pauseGame);
        dom.btnPauseResume.addEventListener("click", resumeGame);
        dom.btnPauseSettings.addEventListener("click", () => {
            audio.playClick();
            openSettingsModal(false);
        });
        dom.btnPauseRestart.addEventListener("click", () => {
            audio.playClick();
            if (game.isInfinite) {
                startInfiniteMode();
            } else {
                startCampaignLevel(game.levelDef.id);
            }
        });
        dom.btnPauseExit.addEventListener("click", () => {
            audio.playClick();
            showScreen("menu", "menu");
        });

        dom.btnClearMenu.addEventListener("click", () => { audio.playClick(); showScreen("menu", "menu"); });
        dom.btnClearRetry.addEventListener("click", () => { audio.playClick(); startCampaignLevel(game.levelDef.id); });
        dom.btnClearNext.addEventListener("click", () => { audio.playClick(); startCampaignLevel(game.levelDef.id + 1); });

        dom.btnChampMenu.addEventListener("click", () => { audio.playClick(); showScreen("menu", "menu"); });
        dom.btnChampInfinite.addEventListener("click", () => { audio.playClick(); startInfiniteMode(); });

        dom.btnGoMenu.addEventListener("click", () => { audio.playClick(); showScreen("menu", "menu"); });
        dom.btnGoRetry.addEventListener("click", () => {
            audio.playClick();
            if (game.isInfinite) startInfiniteMode();
            else startCampaignLevel(game.levelDef.id);
        });

        dom.touchDpad.querySelectorAll(".dpad-btn").forEach(btn => {
            btn.addEventListener("pointerdown", e => {
                e.preventDefault();
                const d = btn.dataset.dir;
                if (d === "up") queueDirection(0, -1);
                else if (d === "down") queueDirection(0, 1);
                else if (d === "left") queueDirection(-1, 0);
                else if (d === "right") queueDirection(1, 0);
            });
        });

        window.addEventListener("keydown", e => {
            const tag = document.activeElement ? document.activeElement.tagName : "";
            const typing = tag === "INPUT" || tag === "TEXTAREA";
            if (typing) return;

            if (e.code === "Escape") {
                if (!dom.modalConfirm.classList.contains("hidden")) {
                    dom.modalConfirm.classList.add("hidden");
                    game.confirmCallback = null;
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
                if (game.appState === "playing" && !e.repeat) {
                    e.preventDefault();
                    pauseGame();
                } else if (game.appState === "paused" && !e.repeat) {
                    e.preventDefault();
                    resumeGame();
                }
                return;
            }

            if (game.appState !== "playing") return;

            const k = e.key.toLowerCase();
            if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"].includes(k)) {
                e.preventDefault();
            }
            if (e.repeat) return;

            if (k === "w" || e.code === "ArrowUp") queueDirection(0, -1);
            else if (k === "s" || e.code === "ArrowDown") queueDirection(0, 1);
            else if (k === "a" || e.code === "ArrowLeft") queueDirection(-1, 0);
            else if (k === "d" || e.code === "ArrowRight") queueDirection(1, 0);
        });

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                audio.stopMusic();
            } else if (audio.unlocked && save.audio.musicEnabled) {
                audio.startMusic();
            }
        });
    }

    function init() {
        syncAudioUI();
        refreshMenuUI();
        bindEvents();
        showScreen("menu", "menu");
        startSingleLoop();
    }

    init();
})();
