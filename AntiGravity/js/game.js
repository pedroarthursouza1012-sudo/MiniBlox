/* =========================================================
   MINIBLOX RUN — ANTI-GRAVITY ENDLESS RUNNER
   ========================================================= */

(() => {
    'use strict';

    // -------------------------------------------------------
    // 1. INTEGRAÇÃO COM O MINIBLOX (VESTIÁRIO & USUÁRIO)
    // -------------------------------------------------------

    const times = {
        palmeiras: 'PALMEIRAS',
        flamengo: 'FLAMENGO',
        'sao-paulo': 'SÃO PAULO',
        fluminense: 'FLUMINENSE',
        bahia: 'BAHIA',
        botafogo: 'BOTAFOGO',
        gremio: 'GRÊMIO',
        vasco: 'VASCO',
        internacional: 'INTERNACIONAL',
        santos: 'SANTOS',
        corinthians: 'CORINTHIANS',
        mirassol: 'MIRASSOL'
    };

    const CORES_CABELO = {
        cabelo1: 'rgb(139, 57, 57)',
        cabelo2: 'rgb(255, 223, 45)',
        cabelo3: 'rgb(255, 201, 101)',
        cabelo4: 'rgb(37, 37, 37)',
        cabelo5: 'rgb(191, 197, 202)'
    };

    const CORES_PELE = {
        pele1: 'rgb(240, 177, 140)',
        pele2: 'rgb(204, 110, 73)',
        pele3: 'rgb(255, 157, 118)',
        pele4: 'rgb(255, 203, 183)',
        pele5: 'rgb(143, 78, 53)'
    };

    const CORES_CALCA = {
        azul: 'rgb(51, 31, 99)',
        bege: '#d4b089',
        preta: 'rgb(51, 48, 48)'
    };

    const PERSONAGEM_PADRAO = {
        cabelo: 'cabeloM',
        corCabelo: 'cabelo1',
        pele: 'pele1',
        camisa: 'preta',
        calca: 'azul'
    };

    function carregarNomeUsuario() {
        try {
            const raw = localStorage.getItem('usuario');
            if (!raw) return 'JOGADOR';
            try {
                const parsed = JSON.parse(raw);
                if (typeof parsed === 'string' && parsed.trim()) return parsed.trim();
                if (parsed && typeof parsed === 'object') {
                    const candidato = parsed.nome || parsed.name || parsed.usuario || parsed.apelido;
                    if (typeof candidato === 'string' && candidato.trim()) return candidato.trim();
                }
            } catch {
                if (raw.trim()) return raw.trim();
            }
        } catch {
            // Sem acesso ao storage
        }
        return 'JOGADOR';
    }

    function carregarPersonagem() {
        try {
            const raw = localStorage.getItem('personagem');
            if (!raw) return { ...PERSONAGEM_PADRAO };
            const parsed = JSON.parse(raw);
            return {
                cabelo: parsed?.cabelo || PERSONAGEM_PADRAO.cabelo,
                corCabelo: parsed?.corCabelo || PERSONAGEM_PADRAO.corCabelo,
                pele: parsed?.pele || PERSONAGEM_PADRAO.pele,
                camisa: parsed?.camisa || PERSONAGEM_PADRAO.camisa,
                calca: parsed?.calca || PERSONAGEM_PADRAO.calca
            };
        } catch {
            return { ...PERSONAGEM_PADRAO };
        }
    }

    function criarPersonagemHTML(dados) {
        const el = document.createElement('div');
        el.className = `personagem ${dados.cabelo === 'cabeloF' ? 'feminino' : 'masculino'}`;
        el.innerHTML = `
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
                <div class="braco-direito"></div>
            </div>
            <div class="pernas">
                <div class="perna-esquerda"></div>
                <div class="perna-direita"></div>
            </div>
        `;

        const camisaCss = String(dados.camisa || 'preta').toLowerCase();
        el.style.setProperty('--cabelo', CORES_CABELO[dados.corCabelo] || CORES_CABELO.cabelo1);
        el.style.setProperty('--pele', CORES_PELE[dados.pele] || CORES_PELE.pele1);
        el.style.setProperty('--camisa', `var(--${camisaCss})`);
        el.style.setProperty('--calca', CORES_CALCA[dados.calca] || CORES_CALCA.azul);

        return el;
    }

    function gerarMensagemInicio(nomeUsuario, camisa) {
        return times[camisa]
            ? `VAI, ${times[camisa]}!`
            : `VAI, ${nomeUsuario.toUpperCase()}!`;
    }

    // -------------------------------------------------------
    // 2. CONFIGURAÇÃO DAS 3 DIFICULDADES & CHAVES DE SAVE
    // -------------------------------------------------------

    const DIFICULDADES = {
        facil: {
            label: 'FÁCIL',
            storageKey: 'miniblox_antigravity_record_facil',
            baseSpeed: 340,
            maxSpeed: 620,
            speedRamp: 5.5,
            reactionTime: 0.40,
            minGapExtra: 110,
            switchChance: 0.45,
            coinChance: 0.85
        },
        medio: {
            label: 'MÉDIO',
            storageKey: 'miniblox_antigravity_record_medio',
            baseSpeed: 440,
            maxSpeed: 820,
            speedRamp: 9.0,
            reactionTime: 0.27,
            minGapExtra: 75,
            switchChance: 0.62,
            coinChance: 0.78
        },
        dificil: {
            label: 'DIFÍCIL',
            storageKey: 'miniblox_antigravity_record_dificil',
            baseSpeed: 560,
            maxSpeed: 1020,
            speedRamp: 13.0,
            reactionTime: 0.18,
            minGapExtra: 48,
            switchChance: 0.78,
            coinChance: 0.68
        }
    };

    const STORAGE_MOEDAS = 'miniblox_antigravity_coins_total';
    const TRANSITION_DURATION = 0.24; // segundos para inverter entre chão e teto

    // -------------------------------------------------------
    // 3. ÁUDIO (WEB AUDIO API)
    // -------------------------------------------------------

    class SoundEngine {
        constructor() {
            this.enabled = true;
            this.ctx = null;
            this.musicTimer = null;
            this.step = 0;
        }

        getCtx() {
            if (!this.enabled) return null;
            if (!this.ctx) {
                const AC = window.AudioContext || window.webkitAudioContext;
                if (AC) this.ctx = new AC();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return this.ctx;
        }

        toggle() {
            this.enabled = !this.enabled;
            if (!this.enabled) this.stopMusic();
            return this.enabled;
        }

        playClick() {
            const ctx = this.getCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(520, ctx.currentTime);
            gain.gain.setValueAtTime(0.07, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.07);
        }

        playFlip(toCeiling) {
            const ctx = this.getCtx();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            const startFreq = toCeiling ? 240 : 480;
            const endFreq = toCeiling ? 540 : 210;
            osc.frequency.setValueAtTime(startFreq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
        }

        playCoin() {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now);
            osc.frequency.setValueAtTime(1318.51, now + 0.06);
            gain.gain.setValueAtTime(0.11, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        }

        playCrash() {
            const ctx = this.getCtx();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(180, now);
            osc.frequency.exponentialRampToValueAtTime(42, now + 0.36);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.37);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.38);
        }

        startMusic() {
            this.stopMusic();
            if (!this.enabled) return;
            const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23];
            this.step = 0;
            this.musicTimer = setInterval(() => {
                if (!this.enabled) return;
                const ctx = this.getCtx();
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(notes[this.step % notes.length], ctx.currentTime);
                gain.gain.setValueAtTime(0.024, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
                osc.connect(gain).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.17);
                this.step++;
            }, 200);
        }

        stopMusic() {
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }
        }
    }

    // -------------------------------------------------------
    // 4. ELEMENTOS DO DOM
    // -------------------------------------------------------

    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');

    const menuCharacterMount = document.getElementById('menuCharacterMount');
    const menuPlayerName = document.getElementById('menuPlayerName');
    const menuDiffLabel = document.getElementById('menuDiffLabel');
    const menuBestScore = document.getElementById('menuBestScore');
    const menuTotalCoins = document.getElementById('menuTotalCoins');
    const diffButtons = document.querySelectorAll('.diff-btn');

    const hudScore = document.getElementById('hudScore');
    const hudCoins = document.getElementById('hudCoins');
    const hudBest = document.getElementById('hudBest');
    const hudDiff = document.getElementById('hudDiff');

    const arena = document.getElementById('arena');
    const cloudsLayer = document.getElementById('cloudsLayer');
    const skylineLayer = document.getElementById('skylineLayer');
    const propsLayer = document.getElementById('propsLayer');
    const ceilingSurface = document.getElementById('ceilingSurface');
    const floorSurface = document.getElementById('floorSurface');
    const ceilingPattern = document.getElementById('ceilingPattern');
    const floorPattern = document.getElementById('floorPattern');
    const obstaclesLayer = document.getElementById('obstaclesLayer');
    const coinsLayer = document.getElementById('coinsLayer');
    const fxLayer = document.getElementById('fxLayer');

    const playerWrap = document.getElementById('playerWrap');
    const gameCharacterMount = document.getElementById('gameCharacterMount');
    const invertActionBtn = document.getElementById('invertActionBtn');
    const startBanner = document.getElementById('startBanner');
    const startBannerText = document.getElementById('startBannerText');

    const goPlayerName = document.getElementById('goPlayerName');
    const goFinalScore = document.getElementById('goFinalScore');
    const goCoins = document.getElementById('goCoins');
    const goDiff = document.getElementById('goDiff');
    const goBestScore = document.getElementById('goBestScore');
    const newRecordBadge = document.getElementById('newRecordBadge');

    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const menuBtn = document.getElementById('menuBtn');
    const audioToggleBtn = document.getElementById('audioToggleBtn');

    // -------------------------------------------------------
    // 5. ESTADO DO JOGO
    // -------------------------------------------------------

    const sound = new SoundEngine();
    const nomeUsuario = carregarNomeUsuario();
    const dadosPersonagem = carregarPersonagem();

    let gameCharEl = null;
    let rafId = null;
    let lastTime = 0;
    let bannerTimeout = null;

    const state = {
        phase: 'menu', // 'menu' | 'banner' | 'playing' | 'gameover'
        difficulty: 'medio',
        speed: 440,
        distance: 0,
        coinsRun: 0,
        coinBonus: 0,
        score: 0,
        bestScore: 0,

        // Física vertical do jogador (0 = chão, 1 = teto)
        surface: 'floor',
        targetSurface: 'floor',
        isTransitioning: false,
        transitionProgress: 0,
        yProgress: 0,

        // Dimensões calculadas da arena
        arenaW: 800,
        arenaH: 500,
        surfaceH: 56,
        playerX: 110,
        playerW: 48,
        playerH: 108,
        charScale: 0.38,

        // Paralaxe e spawn
        surfaceScroll: 0,
        clouds: [],
        buildings: [],
        props: [],
        obstacles: [],
        coins: [],

        // Controle procedural validado
        nextSpawnX: 700,
        expectedSafeSurface: 'floor',
        lastObstacleSurface: null
    };

    const OBSTACULOS_CHAO = [
        { tipo: 'caixa', w: 54, h: 52 },
        { tipo: 'cone', w: 42, h: 54 },
        { tipo: 'barreira', w: 68, h: 56 },
        { tipo: 'lixeira', w: 48, h: 58 },
        { tipo: 'pedra', w: 62, h: 44 },
        { tipo: 'veiculo', w: 96, h: 64 }
    ];

    const OBSTACULOS_TETO = [
        { tipo: 'placa', w: 64, h: 58, text: 'CUIDADO' },
        { tipo: 'estrutura', w: 74, h: 62 },
        { tipo: 'barreira', w: 68, h: 54 },
        { tipo: 'caixa', w: 56, h: 54 }
    ];

    // -------------------------------------------------------
    // 6. MENU & TELAS
    // -------------------------------------------------------

    function mostrarTela(tela) {
        [startScreen, gameScreen, gameOverScreen].forEach(s => s.classList.remove('active'));
        tela.classList.add('active');
    }

    function obterRecorde(diff) {
        const key = DIFICULDADES[diff].storageKey;
        return Number(localStorage.getItem(key)) || 0;
    }

    function atualizarMenu() {
        const cfg = DIFICULDADES[state.difficulty];
        state.bestScore = obterRecorde(state.difficulty);

        menuPlayerName.textContent = nomeUsuario;
        menuDiffLabel.textContent = cfg.label;
        menuBestScore.textContent = state.bestScore;
        menuTotalCoins.textContent = Number(localStorage.getItem(STORAGE_MOEDAS)) || 0;

        menuCharacterMount.innerHTML = '';
        menuCharacterMount.appendChild(criarPersonagemHTML(dadosPersonagem));
    }

    diffButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            sound.playClick();
            diffButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.difficulty = btn.dataset.diff;
            atualizarMenu();
        });
    });

    // -------------------------------------------------------
    // 7. MEDIDAS RESPONSIVAS & PARALAXE DO CENÁRIO
    // -------------------------------------------------------

    function recalcularDimensoes() {
        const rect = arena.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        state.arenaW = rect.width;
        state.arenaH = rect.height;
        state.surfaceH = window.innerWidth <= 760 ? 44 : 56;

        const trackSpan = state.arenaH - state.surfaceH * 2;
        state.playerH = Math.max(76, Math.min(116, trackSpan * 0.25));
        state.charScale = state.playerH / 280;
        state.playerW = 120 * state.charScale;
        state.playerX = Math.max(56, Math.min(140, state.arenaW * 0.14));

        playerWrap.style.width = `${state.playerW}px`;
        playerWrap.style.height = `${state.playerH}px`;
        playerWrap.style.left = `${state.playerX}px`;
    }

    function posicionarJogador() {
        const floorTop = state.arenaH - state.surfaceH - state.playerH;
        const ceilingTop = state.surfaceH;
        const currentTop = floorTop - state.yProgress * (floorTop - ceilingTop);

        playerWrap.style.top = `${currentTop}px`;

        // Interpola orientação vertical suavemente: 1 (chão) até -1 (teto)
        const flipY = 1 - 2 * state.yProgress;
        if (gameCharEl) {
            gameCharEl.style.transform = `scale(${state.charScale}) scaleY(${flipY})`;
        }
    }

    function iniciarCenarioParallax() {
        cloudsLayer.innerHTML = '';
        skylineLayer.innerHTML = '';
        propsLayer.innerHTML = '';
        state.clouds = [];
        state.buildings = [];
        state.props = [];

        // Nuvens
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'cloud';
            const w = 68 + Math.random() * 64;
            const h = 24 + Math.random() * 14;
            const x = (state.arenaW / 6) * i + Math.random() * 60;
            const y = state.surfaceH + 20 + Math.random() * (state.arenaH * 0.28);
            el.style.width = `${w}px`;
            el.style.height = `${h}px`;
            el.style.top = `${y}px`;
            el.style.left = `${x}px`;
            cloudsLayer.appendChild(el);
            state.clouds.push({ el, x, w, speedFactor: 0.08 + Math.random() * 0.06 });
        }

        // Prédios de fundo
        const colors = ['#8c52ff', '#ff8c42', '#5ce1e6', '#ffde59', '#ff5757', '#7ed957'];
        let bx = 0;
        for (let i = 0; i < 12; i++) {
            const el = document.createElement('div');
            el.className = 'bg-building';
            const w = 64 + Math.random() * 54;
            const h = 80 + Math.random() * 120;
            el.style.width = `${w}px`;
            el.style.height = `${h}px`;
            el.style.background = colors[i % colors.length];
            el.style.left = `${bx}px`;
            skylineLayer.appendChild(el);
            state.buildings.push({ el, x: bx, w, speedFactor: 0.24 });
            bx += w + 18;
        }

        // Árvores e postes decorativos
        let px = 80;
        for (let i = 0; i < 8; i++) {
            const isTree = i % 2 === 0;
            const el = document.createElement('div');
            el.className = `bg-prop ${isTree ? 'prop-tree' : 'prop-lamp'}`;
            el.innerHTML = isTree
                ? '<div class="trunk"></div><div class="crown"></div>'
                : '<div class="pole"></div><div class="head"></div>';
            el.style.left = `${px}px`;
            propsLayer.appendChild(el);
            state.props.push({ el, x: px, w: 50, speedFactor: 0.55 });
            px += 180 + Math.random() * 90;
        }
    }

    // -------------------------------------------------------
    // 8. INÍCIO DE PARTIDA & MENSAGEM PERSONALIZADA
    // -------------------------------------------------------

    function limparPartidaAnterior() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        if (bannerTimeout) {
            clearTimeout(bannerTimeout);
            bannerTimeout = null;
        }
        obstaclesLayer.innerHTML = '';
        coinsLayer.innerHTML = '';
        fxLayer.innerHTML = '';
        arena.classList.remove('shake');
        state.obstacles = [];
        state.coins = [];
    }

    function prepararPartida() {
        limparPartidaAnterior();

        const cfg = DIFICULDADES[state.difficulty];
        state.phase = 'banner';
        state.speed = cfg.baseSpeed;
        state.distance = 0;
        state.coinsRun = 0;
        state.coinBonus = 0;
        state.score = 0;
        state.bestScore = obterRecorde(state.difficulty);

        state.surface = 'floor';
        state.targetSurface = 'floor';
        state.isTransitioning = false;
        state.transitionProgress = 0;
        state.yProgress = 0;

        mostrarTela(gameScreen);
        recalcularDimensoes();

        gameCharacterMount.innerHTML = '';
        gameCharEl = criarPersonagemHTML(dadosPersonagem);
        gameCharacterMount.appendChild(gameCharEl);
        posicionarJogador();

        iniciarCenarioParallax();

        state.nextSpawnX = Math.max(state.arenaW + 120, 760);
        state.expectedSafeSurface = 'floor';
        state.lastObstacleSurface = null;

        hudScore.textContent = '0';
        hudCoins.textContent = '0';
        hudBest.textContent = state.bestScore;
        hudDiff.textContent = cfg.label;

        // Mensagem personalizada de início
        startBannerText.textContent = gerarMensagemInicio(nomeUsuario, dadosPersonagem.camisa);
        startBanner.classList.remove('show');
        void startBanner.offsetWidth;
        startBanner.classList.add('show');

        bannerTimeout = setTimeout(() => {
            if (state.phase !== 'banner') return;
            startBanner.classList.remove('show');
            iniciarLoop();
        }, 1700);
    }

    function iniciarLoop() {
        state.phase = 'playing';
        if (gameCharEl) {
            gameCharEl.classList.remove('flipping', 'crashed');
            gameCharEl.classList.add('running');
        }
        sound.startMusic();
        lastTime = performance.now();
        rafId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------
    // 9. INVERSÃO DE GRAVIDADE
    // -------------------------------------------------------

    function inverterGravidade() {
        if (state.phase !== 'playing' || state.isTransitioning) return;

        state.targetSurface = state.surface === 'floor' ? 'ceiling' : 'floor';
        state.isTransitioning = true;
        state.transitionProgress = 0;

        if (gameCharEl) {
            gameCharEl.classList.remove('running');
            gameCharEl.classList.add('flipping');
        }

        sound.playFlip(state.targetSurface === 'ceiling');
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    window.addEventListener('keydown', (e) => {
        if (state.phase !== 'playing') return;
        if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
            e.preventDefault();
            inverterGravidade();
        }
    });

    arena.addEventListener('pointerdown', (e) => {
        if (state.phase !== 'playing') return;
        if (e.target === invertActionBtn) return;
        inverterGravidade();
    });

    invertActionBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        inverterGravidade();
    });

    window.addEventListener('resize', () => {
        if (state.phase === 'playing' || state.phase === 'banner') {
            recalcularDimensoes();
            posicionarJogador();
        }
    });

    // -------------------------------------------------------
    // 10. GERAÇÃO PROCEDURAL VALIDADA DE OBSTÁCULOS & MOEDAS
    // -------------------------------------------------------

    function calcularDistanciaMinimaSegura() {
        const cfg = DIFICULDADES[state.difficulty];
        // Tempo mínimo = tempo de transição + tempo de reação da dificuldade
        const tempoNecessario = TRANSITION_DURATION + cfg.reactionTime;
        return state.speed * tempoNecessario + state.playerW + cfg.minGapExtra;
    }

    function spawnObstaculoValido() {
        const cfg = DIFICULDADES[state.difficulty];
        const minSafeDist = calcularDistanciaMinimaSegura();

        // Decide se o próximo obstáculo força troca de superfície ou mantém ritmo
        let surface;
        if (state.lastObstacleSurface === null) {
            surface = Math.random() < 0.5 ? 'floor' : 'ceiling';
        } else {
            const deveAlternar = Math.random() < cfg.switchChance;
            surface = deveAlternar
                ? (state.expectedSafeSurface === 'floor' ? 'floor' : 'ceiling')
                : state.lastObstacleSurface;
        }

        // Validação: se o obstáculo está na superfície em que o jogador estaria,
        // garante que houve distância suficiente desde o último obstáculo para inverter
        const lista = surface === 'floor' ? OBSTACULOS_CHAO : OBSTACULOS_TETO;
        const modelo = lista[Math.floor(Math.random() * lista.length)];

        const escalaTela = Math.min(1, state.arenaH / 520);
        const w = Math.round(modelo.w * Math.max(0.78, escalaTela));
        const h = Math.round(modelo.h * Math.max(0.75, escalaTela));

        const el = document.createElement('div');
        el.className = `obstacle obs-${modelo.tipo} ${surface === 'ceiling' ? 'on-ceiling' : 'on-floor'}`;
        el.style.width = `${w}px`;
        el.style.height = `${h}px`;
        if (modelo.text) el.textContent = modelo.text;

        const y = surface === 'floor'
            ? state.arenaH - state.surfaceH - h
            : state.surfaceH;

        el.style.left = `${state.nextSpawnX}px`;
        el.style.top = `${y}px`;
        obstaclesLayer.appendChild(el);

        state.obstacles.push({
            el,
            x: state.nextSpawnX,
            y,
            w,
            h,
            surface
        });

        // Superfície segura após este obstáculo
        const safeSurface = surface === 'floor' ? 'ceiling' : 'floor';
        state.expectedSafeSurface = safeSurface;
        state.lastObstacleSurface = surface;

        // Gera moedas na superfície segura (incentivando a inversão correta)
        if (Math.random() < cfg.coinChance) {
            const qtd = 3 + Math.floor(Math.random() * 3);
            const coinY = safeSurface === 'floor'
                ? state.arenaH - state.surfaceH - 42
                : state.surfaceH + 12;

            for (let i = 0; i < qtd; i++) {
                const cx = state.nextSpawnX + i * 42;
                const cel = document.createElement('div');
                cel.className = 'coin';
                cel.textContent = '$';
                cel.style.left = `${cx}px`;
                cel.style.top = `${coinY}px`;
                coinsLayer.appendChild(cel);
                state.coins.push({
                    el: cel,
                    x: cx,
                    y: coinY,
                    w: 30,
                    h: 30,
                    collected: false
                });
            }
        }

        // Calcula próximo X respeitando o espaço mínimo seguro
        const extraAleatorio = Math.random() * (cfg.minGapExtra * 1.4);
        state.nextSpawnX += w + minSafeDist + extraAleatorio;
    }

    function mostrarPopMoeda(x, y) {
        const pop = document.createElement('div');
        pop.className = 'coin-pop';
        pop.textContent = '+10';
        pop.style.left = `${x}px`;
        pop.style.top = `${y}px`;
        fxLayer.appendChild(pop);
        setTimeout(() => pop.remove(), 600);
    }

    // -------------------------------------------------------
    // 11. LOOP PRINCIPAL (BASEADO EM DELTA-TIME)
    // -------------------------------------------------------

    function gameLoop(timestamp) {
        if (state.phase !== 'playing') return;

        const dt = Math.min(0.05, (timestamp - lastTime) / 1000);
        lastTime = timestamp;

        const cfg = DIFICULDADES[state.difficulty];

        // Progressão de velocidade por dificuldade
        state.speed = Math.min(cfg.maxSpeed, state.speed + cfg.speedRamp * dt);
        state.distance += state.speed * dt * 0.08;
        state.score = Math.floor(state.distance) + state.coinBonus;

        hudScore.textContent = state.score;
        hudCoins.textContent = state.coinsRun;

        // Atualiza transição de gravidade
        if (state.isTransitioning) {
            state.transitionProgress += dt / TRANSITION_DURATION;
            if (state.transitionProgress >= 1) {
                state.transitionProgress = 1;
                state.isTransitioning = false;
                state.surface = state.targetSurface;
                state.yProgress = state.surface === 'ceiling' ? 1 : 0;
                if (gameCharEl) {
                    gameCharEl.classList.remove('flipping');
                    gameCharEl.classList.add('running');
                }
            } else {
                const eased = easeInOutCubic(state.transitionProgress);
                state.yProgress = state.targetSurface === 'ceiling' ? eased : 1 - eased;
            }
        }

        posicionarJogador();

        // Movimento das superfícies (chão e teto)
        state.surfaceScroll = (state.surfaceScroll + state.speed * dt) % 84;
        floorPattern.style.transform = `translateX(${-state.surfaceScroll}px)`;
        ceilingPattern.style.transform = `translateX(${-state.surfaceScroll}px)`;

        // Movimento de paralaxe
        for (const c of state.clouds) {
            c.x -= state.speed * c.speedFactor * dt;
            if (c.x + c.w < -20) c.x = state.arenaW + 40;
            c.el.style.left = `${c.x}px`;
        }

        for (const b of state.buildings) {
            b.x -= state.speed * b.speedFactor * dt;
            if (b.x + b.w < -20) {
                const maxX = Math.max(...state.buildings.map(item => item.x + item.w));
                b.x = Math.max(state.arenaW, maxX) + 18;
            }
            b.el.style.left = `${b.x}px`;
        }

        for (const p of state.props) {
            p.x -= state.speed * p.speedFactor * dt;
            if (p.x + p.w < -20) {
                const maxX = Math.max(...state.props.map(item => item.x + item.w));
                p.x = Math.max(state.arenaW, maxX) + 160 + Math.random() * 80;
            }
            p.el.style.left = `${p.x}px`;
        }

        // Avança referência de spawn e cria novos obstáculos
        state.nextSpawnX -= state.speed * dt;
        while (state.nextSpawnX < state.arenaW + 240) {
            spawnObstaculoValido();
        }

        // Hitbox do jogador (margem justa para evitar colisões frustrantes)
        const floorTop = state.arenaH - state.surfaceH - state.playerH;
        const ceilingTop = state.surfaceH;
        const playerTop = floorTop - state.yProgress * (floorTop - ceilingTop);

        const pBox = {
            left: state.playerX + state.playerW * 0.18,
            right: state.playerX + state.playerW * 0.82,
            top: playerTop + state.playerH * 0.08,
            bottom: playerTop + state.playerH * 0.92
        };

        // Atualiza moedas
        for (let i = state.coins.length - 1; i >= 0; i--) {
            const coin = state.coins[i];
            coin.x -= state.speed * dt;
            coin.el.style.left = `${coin.x}px`;

            if (coin.x + coin.w < -40) {
                coin.el.remove();
                state.coins.splice(i, 1);
                continue;
            }

            if (
                !coin.collected &&
                pBox.right > coin.x &&
                pBox.left < coin.x + coin.w &&
                pBox.bottom > coin.y &&
                pBox.top < coin.y + coin.h
            ) {
                coin.collected = true;
                state.coinsRun += 1;
                state.coinBonus += 10;
                sound.playCoin();
                mostrarPopMoeda(coin.x, coin.y);
                coin.el.remove();
                state.coins.splice(i, 1);
            }
        }

        // Atualiza obstáculos e verifica colisões
        for (let i = state.obstacles.length - 1; i >= 0; i--) {
            const obs = state.obstacles[i];
            obs.x -= state.speed * dt;
            obs.el.style.left = `${obs.x}px`;

            if (obs.x + obs.w < -60) {
                obs.el.remove();
                state.obstacles.splice(i, 1);
                continue;
            }

            const oLeft = obs.x + 5;
            const oRight = obs.x + obs.w - 5;
            const oTop = obs.y + 5;
            const oBottom = obs.y + obs.h - 5;

            if (pBox.right > oLeft && pBox.left < oRight && pBox.bottom > oTop && pBox.top < oBottom) {
                encerrarPartida();
                return;
            }
        }

        rafId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------
    // 12. GAME OVER
    // -------------------------------------------------------

    function encerrarPartida() {
        state.phase = 'gameover';
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        sound.stopMusic();
        sound.playCrash();
        arena.classList.add('shake');

        if (gameCharEl) {
            gameCharEl.classList.remove('running', 'flipping');
            gameCharEl.classList.add('crashed');
        }

        const cfg = DIFICULDADES[state.difficulty];
        const recordeAnterior = obterRecorde(state.difficulty);
        const novoRecorde = state.score > recordeAnterior;

        if (novoRecorde) {
            state.bestScore = state.score;
            localStorage.setItem(cfg.storageKey, String(state.score));
        } else {
            state.bestScore = recordeAnterior;
        }

        const totalMoedas = (Number(localStorage.getItem(STORAGE_MOEDAS)) || 0) + state.coinsRun;
        localStorage.setItem(STORAGE_MOEDAS, String(totalMoedas));

        setTimeout(() => {
            goPlayerName.textContent = nomeUsuario;
            goFinalScore.textContent = state.score;
            goCoins.textContent = state.coinsRun;
            goDiff.textContent = cfg.label;
            goBestScore.textContent = state.bestScore;
            newRecordBadge.classList.toggle('hidden', !novoRecorde);
            mostrarTela(gameOverScreen);
        }, 580);
    }

    // -------------------------------------------------------
    // 13. BOTÕES DE CONTROLE DA INTERFACE
    // -------------------------------------------------------

    playBtn.addEventListener('click', () => {
        sound.playClick();
        prepararPartida();
    });

    restartBtn.addEventListener('click', () => {
        sound.playClick();
        prepararPartida();
    });

    menuBtn.addEventListener('click', () => {
        sound.playClick();
        limparPartidaAnterior();
        sound.stopMusic();
        state.phase = 'menu';
        atualizarMenu();
        mostrarTela(startScreen);
    });

    audioToggleBtn.addEventListener('click', () => {
        const ativo = sound.toggle();
        audioToggleBtn.textContent = ativo ? '🔊 Som: ON' : '🔇 Som: OFF';
        if (ativo && state.phase === 'playing') {
            sound.startMusic();
        }
    });

    // Inicialização
    atualizarMenu();
    mostrarTela(startScreen);
})();