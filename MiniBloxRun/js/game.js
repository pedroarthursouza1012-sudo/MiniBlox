/* =========================================================
   MINIBLOX RUN — MOTOR DO JOGO & INTEGRAÇÃO COM MINIBLOX
   ========================================================= */

(() => {
    'use strict';

    // -------------------------------------------------------
    // 1. CONSTANTES DO VESTIÁRIO E INTEGRAÇÃO LOCALSTORAGE
    // -------------------------------------------------------

    const TIMES = {
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

    const STORAGE_RECORDE = 'miniblox_run_recorde';
    const STORAGE_MOEDAS = 'miniblox_run_moedas_total';

    function carregarUsuarioNome() {
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
            // Ignora falhas de acesso ao storage
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

    function criarElementoPersonagem(dados, estadoInicial = 'idle') {
        const el = document.createElement('div');
        el.className = `personagem ${dados.cabelo === 'cabeloF' ? 'feminino' : 'masculino'} ${estadoInicial}`;

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

        el.style.setProperty('--cabelo', CORES_CABELO[dados.corCabelo] || CORES_CABELO.cabelo1);
        el.style.setProperty('--pele', CORES_PELE[dados.pele] || CORES_PELE.pele1);
        el.style.setProperty('--camisa', `var(--${dados.camisa}, #1e1e24)`);
        el.style.setProperty('--calca', CORES_CALCA[dados.calca] || CORES_CALCA.azul);

        return el;
    }

    function obterMensagemPersonalizada(nomeUsuario, camisa) {
        const chaveCamisa = String(camisa || '').toLowerCase();
        if (Object.prototype.hasOwnProperty.call(TIMES, chaveCamisa)) {
            return `VAI, ${TIMES[chaveCamisa]}!`;
        }
        return `VAI, ${nomeUsuario.toUpperCase()}!`;
    }

    // -------------------------------------------------------
    // 2. SISTEMA DE ÁUDIO (WEB AUDIO API)
    // -------------------------------------------------------

    class SoundManager {
        constructor() {
            this.enabled = true;
            this.ctx = null;
            this.musicTimer = null;
            this.musicStep = 0;
        }

        ensureContext() {
            if (!this.enabled) return null;
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) this.ctx = new AudioCtx();
            }
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume();
            }
            return this.ctx;
        }

        toggle() {
            this.enabled = !this.enabled;
            if (!this.enabled) {
                this.stopMusic();
            }
            return this.enabled;
        }

        playJump() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(520, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.08, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
        }

        playSlide() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(300, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.14);
            gain.gain.setValueAtTime(0.09, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
            osc.connect(gain).connect(ctx.destination);
            osc.start();
            osc.stop(ctx.currentTime + 0.16);
        }

        playCoin() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(987.77, now);
            osc.frequency.setValueAtTime(1318.51, now + 0.06);
            gain.gain.setValueAtTime(0.12, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.23);
        }

        playCrash() {
            const ctx = this.ensureContext();
            if (!ctx) return;
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(42, now + 0.35);
            gain.gain.setValueAtTime(0.16, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
            osc.connect(gain).connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.37);
        }

        startMusic() {
            this.stopMusic();
            if (!this.enabled) return;
            const notes = [261.63, 329.63, 392.0, 523.25, 392.0, 329.63, 293.66, 349.23];
            this.musicStep = 0;
            this.musicTimer = setInterval(() => {
                if (!this.enabled) return;
                const ctx = this.ensureContext();
                if (!ctx) return;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(notes[this.musicStep % notes.length], ctx.currentTime);
                gain.gain.setValueAtTime(0.025, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
                osc.connect(gain).connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.17);
                this.musicStep++;
            }, 210);
        }

        stopMusic() {
            if (this.musicTimer) {
                clearInterval(this.musicTimer);
                this.musicTimer = null;
            }
        }
    }

    // -------------------------------------------------------
    // 3. REFERÊNCIAS DO DOM
    // -------------------------------------------------------

    const startScreen = document.getElementById('startScreen');
    const gameScreen = document.getElementById('gameScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');

    const menuCharacterMount = document.getElementById('menuCharacterMount');
    const gameCharacterMount = document.getElementById('gameCharacterMount');
    const menuPlayerName = document.getElementById('menuPlayerName');
    const menuBestScore = document.getElementById('menuBestScore');
    const menuTotalCoins = document.getElementById('menuTotalCoins');

    const hudScore = document.getElementById('hudScore');
    const hudCoins = document.getElementById('hudCoins');
    const hudBest = document.getElementById('hudBest');

    const world = document.getElementById('world');
    const cloudsLayer = document.getElementById('cloudsLayer');
    const sceneryLayer = document.getElementById('sceneryLayer');
    const entitiesLayer = document.getElementById('entitiesLayer');
    const fxLayer = document.getElementById('fxLayer');
    const playerContainer = document.getElementById('playerContainer');
    const playerShadow = playerContainer.querySelector('.player-shadow');

    const startBanner = document.getElementById('startBanner');
    const startBannerText = document.getElementById('startBannerText');

    const goPlayerName = document.getElementById('goPlayerName');
    const goFinalScore = document.getElementById('goFinalScore');
    const goCoins = document.getElementById('goCoins');
    const goBestScore = document.getElementById('goBestScore');
    const newRecordBadge = document.getElementById('newRecordBadge');

    const playBtn = document.getElementById('playBtn');
    const restartBtn = document.getElementById('restartBtn');
    const menuBtn = document.getElementById('menuBtn');
    const audioToggleBtn = document.getElementById('audioToggleBtn');

    const touchLeft = document.getElementById('touchLeft');
    const touchRight = document.getElementById('touchRight');
    const touchJump = document.getElementById('touchJump');
    const touchSlide = document.getElementById('touchSlide');

    // -------------------------------------------------------
    // 4. ESTADO GLOBAL & CONFIGURAÇÕES DO JOGO
    // -------------------------------------------------------

    const sound = new SoundManager();
    const nomeUsuario = carregarUsuarioNome();
    const dadosPersonagem = carregarPersonagem();

    let gameCharacterEl = null;
    let rafId = null;
    let lastTimestamp = 0;

    const state = {
        phase: 'menu', // 'menu' | 'banner' | 'playing' | 'gameover'
        lane: 1,       // 0 = esquerda, 1 = centro, 2 = direita
        isJumping: false,
        jumpVelocity: 0,
        jumpHeight: 0,
        isSliding: false,
        slideTimer: 0,
        speed: 0.42,   // velocidade de avanço em z/segundo
        distance: 0,
        coinBonus: 0,
        coinsRun: 0,
        score: 0,
        bestScore: Number(localStorage.getItem(STORAGE_RECORDE)) || 0,
        totalCoins: Number(localStorage.getItem(STORAGE_MOEDAS)) || 0,
        spawnTimer: 0,
        sceneryTimer: 0,
        clouds: [],
        entities: [],
        scenery: []
    };

    const OBSTACULOS_TIPOS = [
        { tipo: 'caixa', rule: 'jump' },
        { tipo: 'cone', rule: 'jump' },
        { tipo: 'pedra', rule: 'jump' },
        { tipo: 'lixeira', rule: 'jump' },
        { tipo: 'barreira', rule: 'slide' },
        { tipo: 'placa', rule: 'slide' },
        { tipo: 'veiculo', rule: 'dodge' }
    ];

    const CENARIO_TIPOS = ['arvore', 'poste', 'predio', 'placa'];

    // -------------------------------------------------------
    // 5. INICIALIZAÇÃO DE TELAS & PERSONAGEM
    // -------------------------------------------------------

    function atualizarMenu() {
        state.bestScore = Number(localStorage.getItem(STORAGE_RECORDE)) || 0;
        state.totalCoins = Number(localStorage.getItem(STORAGE_MOEDAS)) || 0;

        menuPlayerName.textContent = nomeUsuario;
        menuBestScore.textContent = state.bestScore;
        menuTotalCoins.textContent = state.totalCoins;

        menuCharacterMount.innerHTML = '';
        menuCharacterMount.appendChild(criarElementoPersonagem(dadosPersonagem, 'idle'));
    }

    function mostrarTela(tela) {
        [startScreen, gameScreen, gameOverScreen].forEach(s => s.classList.remove('active'));
        tela.classList.add('active');
    }

    function iniciarNuvens() {
        cloudsLayer.innerHTML = '';
        state.clouds = [];
        for (let i = 0; i < 6; i++) {
            const el = document.createElement('div');
            el.className = 'cloud';
            const w = 70 + Math.random() * 60;
            const h = 26 + Math.random() * 14;
            const x = Math.random() * 100;
            const y = 10 + Math.random() * 48;
            const speed = 1.5 + Math.random() * 2.5;
            el.style.width = `${w}px`;
            el.style.height = `${h}px`;
            el.style.left = `${x}%`;
            el.style.top = `${y}%`;
            cloudsLayer.appendChild(el);
            state.clouds.push({ el, x, speed });
        }
    }

    // -------------------------------------------------------
    // 6. FLUXO DE PARTIDA & MENSAGEM PERSONALIZADA
    // -------------------------------------------------------

    function prepararNovaPartida() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }

        // Limpa entidades antigas
        entitiesLayer.innerHTML = '';
        sceneryLayer.innerHTML = '';
        fxLayer.innerHTML = '';
        world.classList.remove('shake');

        state.phase = 'banner';
        state.lane = 1;
        state.isJumping = false;
        state.jumpVelocity = 0;
        state.jumpHeight = 0;
        state.isSliding = false;
        state.slideTimer = 0;
        state.speed = 0.42;
        state.distance = 0;
        state.coinBonus = 0;
        state.coinsRun = 0;
        state.score = 0;
        state.spawnTimer = 0.6;
        state.sceneryTimer = 0;
        state.entities = [];
        state.scenery = [];

        playerContainer.className = 'player-container lane-1';
        playerContainer.style.transform = 'translateX(-50%)';
        playerShadow.style.transform = 'translateX(-50%) scale(1)';
        playerShadow.style.opacity = '1';

        gameCharacterMount.innerHTML = '';
        gameCharacterEl = criarElementoPersonagem(dadosPersonagem, 'idle');
        gameCharacterMount.appendChild(gameCharacterEl);

        hudScore.textContent = '0';
        hudCoins.textContent = '0';
        hudBest.textContent = state.bestScore;

        iniciarNuvens();
        mostrarTela(gameScreen);

        // Exibe a mensagem personalizada antes de iniciar a corrida
        startBannerText.textContent = obterMensagemPersonalizada(nomeUsuario, dadosPersonagem.camisa);
        startBanner.classList.remove('show');
        void startBanner.offsetWidth; // força reflow para reiniciar animação
        startBanner.classList.add('show');

        setTimeout(() => {
            if (state.phase !== 'banner') return;
            startBanner.classList.remove('show');
            comecarCorrida();
        }, 1750);
    }

    function comecarCorrida() {
        state.phase = 'playing';
        atualizarClassePersonagem('running');
        sound.startMusic();
        lastTimestamp = performance.now();
        rafId = requestAnimationFrame(gameLoop);
    }

    function atualizarClassePersonagem(acao) {
        if (!gameCharacterEl) return;
        gameCharacterEl.classList.remove('idle', 'running', 'jumping', 'sliding', 'crashed');
        gameCharacterEl.classList.add(acao);
    }

    // -------------------------------------------------------
    // 7. CONTROLES (TECLADO + TOUCH)
    // -------------------------------------------------------

    function moverPista(delta) {
        if (state.phase !== 'playing') return;
        const novaPista = Math.max(0, Math.min(2, state.lane + delta));
        if (novaPista !== state.lane) {
            state.lane = novaPista;
            playerContainer.className = `player-container lane-${state.lane}`;
        }
    }

    function pular() {
        if (state.phase !== 'playing' || state.isJumping) return;
        state.isSliding = false;
        state.slideTimer = 0;
        state.isJumping = true;
        state.jumpVelocity = 780;
        atualizarClassePersonagem('jumping');
        sound.playJump();
    }

    function deslizar() {
        if (state.phase !== 'playing') return;
        if (state.isJumping) {
            // Queda rápida se estiver no ar
            state.jumpVelocity = Math.min(state.jumpVelocity, -650);
            return;
        }
        if (state.isSliding) return;
        state.isSliding = true;
        state.slideTimer = 0.62;
        atualizarClassePersonagem('sliding');
        sound.playSlide();
    }

    window.addEventListener('keydown', (e) => {
        if (state.phase !== 'playing') return;
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                e.preventDefault();
                moverPista(-1);
                break;
            case 'ArrowRight':
            case 'KeyD':
                e.preventDefault();
                moverPista(1);
                break;
            case 'ArrowUp':
            case 'KeyW':
            case 'Space':
                e.preventDefault();
                pular();
                break;
            case 'ArrowDown':
            case 'KeyS':
                e.preventDefault();
                deslizar();
                break;
        }
    });

    // Botões touch
    touchLeft.addEventListener('pointerdown', (e) => { e.preventDefault(); moverPista(-1); });
    touchRight.addEventListener('pointerdown', (e) => { e.preventDefault(); moverPista(1); });
    touchJump.addEventListener('pointerdown', (e) => { e.preventDefault(); pular(); });
    touchSlide.addEventListener('pointerdown', (e) => { e.preventDefault(); deslizar(); });

    // Gestos swipe na tela do jogo
    let touchStartX = 0;
    let touchStartY = 0;
    world.addEventListener('touchstart', (e) => {
        if (e.touches.length === 0) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, { passive: true });

    world.addEventListener('touchend', (e) => {
        if (state.phase !== 'playing' || e.changedTouches.length === 0) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            moverPista(dx > 0 ? 1 : -1);
        } else {
            if (dy < 0) pular();
            else deslizar();
        }
    }, { passive: true });

    // -------------------------------------------------------
    // 8. GERAÇÃO DE OBSTÁCULOS, MOEDAS E CENÁRIO
    // -------------------------------------------------------

    function criarElementoObstaculo(info) {
        const el = document.createElement('div');
        el.className = `entity obs-${info.tipo}`;

        switch (info.tipo) {
            case 'cone':
                el.innerHTML = '<div class="cone-body"></div><div class="cone-base"></div>';
                break;
            case 'barreira':
                el.innerHTML = '<div class="barra-top"></div><div class="perna l"></div><div class="perna r"></div>';
                break;
            case 'placa':
                el.innerHTML = '<div class="placa-topo">PARE</div><div class="poste l"></div><div class="poste r"></div>';
                break;
            case 'veiculo':
                el.innerHTML = '<div class="car-top"></div><div class="car-body"><div class="farol"></div><div class="farol"></div></div><div class="roda l"></div><div class="roda r"></div>';
                break;
            default:
                break;
        }
        return el;
    }

    function criarElementoMoeda() {
        const el = document.createElement('div');
        el.className = 'entity coin-entity';
        el.textContent = '$';
        return el;
    }

    function spawnPadrao() {
        // Escolhe de 1 a 2 pistas bloqueadas conforme dificuldade (nunca todas as 3 com bloqueio total)
        const dificuldade = Math.min(1, (state.speed - 0.42) / 0.55);
        const bloquearDuas = Math.random() < (0.25 + dificuldade * 0.45);
        const pistas = [0, 1, 2];
        const embaralhadas = pistas.sort(() => Math.random() - 0.5);
        const qtdBloqueios = bloquearDuas ? 2 : 1;

        for (let i = 0; i < qtdBloqueios; i++) {
            const lane = embaralhadas[i];
            const info = OBSTACULOS_TIPOS[Math.floor(Math.random() * OBSTACULOS_TIPOS.length)];
            const el = criarElementoObstaculo(info);
            entitiesLayer.appendChild(el);
            state.entities.push({
                kind: 'obstacle',
                tipo: info.tipo,
                rule: info.rule,
                lane,
                z: 0.02,
                hit: false,
                el
            });
        }

        // Gera sequência de moedas em uma pista livre
        const pistaLivre = embaralhadas[qtdBloqueios];
        if (Math.random() < 0.8) {
            const qtdMoedas = 3 + Math.floor(Math.random() * 3);
            for (let m = 0; m < qtdMoedas; m++) {
                const el = criarElementoMoeda();
                entitiesLayer.appendChild(el);
                state.entities.push({
                    kind: 'coin',
                    lane: pistaLivre,
                    z: 0.02 - m * 0.06,
                    collected: false,
                    el
                });
            }
        }
    }

    function spawnCenarioLateral() {
        const lados = [-1, 1];
        lados.forEach((side) => {
            const tipo = CENARIO_TIPOS[Math.floor(Math.random() * CENARIO_TIPOS.length)];
            const el = document.createElement('div');
            el.className = `entity scenery-${tipo}`;

            if (tipo === 'arvore') {
                el.innerHTML = '<div class="tronco"></div><div class="copa"></div>';
            } else if (tipo === 'poste') {
                el.innerHTML = '<div class="haste"></div><div class="luz"></div>';
            } else if (tipo === 'predio') {
                el.innerHTML = '<div class="janela"></div><div class="janela"></div><div class="janela"></div><div class="janela"></div>';
            } else if (tipo === 'placa') {
                el.innerHTML = '<div class="haste"></div><div class="quadro"></div>';
            }

            sceneryLayer.appendChild(el);
            state.scenery.push({
                side,
                z: 0.01,
                el
            });
        });
    }

    // -------------------------------------------------------
    // 9. LOOP PRINCIPAL (DELTA-TIME / 60FPS INDEPENDENTE)
    // -------------------------------------------------------

    function projetarPosicao(z, laneOffset) {
        const p = Math.pow(Math.max(0, z), 1.75);
        const yPercent = 38 + p * 55; // de 38% (horizonte) até 93% (base)
        const spread = 10 + p * 22;   // abertura das pistas
        const xPercent = 50 + laneOffset * spread;
        const scale = 0.24 + p * 0.92;
        return { p, xPercent, yPercent, scale };
    }

    function mostrarEfeitoMoeda(xPercent, yPercent) {
        const pop = document.createElement('div');
        pop.className = 'coin-pop';
        pop.textContent = '+10';
        pop.style.left = `${xPercent}%`;
        pop.style.top = `${yPercent - 8}%`;
        fxLayer.appendChild(pop);
        setTimeout(() => pop.remove(), 650);
    }

    function gameLoop(timestamp) {
        if (state.phase !== 'playing') return;

        const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;

        // Dificuldade progressiva
        state.speed = Math.min(1.05, state.speed + dt * 0.012);
        state.distance += state.speed * dt * 42;
        state.score = Math.floor(state.distance) + state.coinBonus;

        hudScore.textContent = state.score;
        hudCoins.textContent = state.coinsRun;

        // Física do pulo
        if (state.isJumping) {
            state.jumpHeight += state.jumpVelocity * dt;
            state.jumpVelocity -= 2200 * dt;
            if (state.jumpHeight <= 0) {
                state.jumpHeight = 0;
                state.jumpVelocity = 0;
                state.isJumping = false;
                atualizarClassePersonagem(state.isSliding ? 'sliding' : 'running');
            }
            playerContainer.style.transform = `translateX(-50%) translateY(${-state.jumpHeight}px)`;
            const shadowScale = Math.max(0.45, 1 - state.jumpHeight / 200);
            playerShadow.style.transform = `translateX(-50%) scale(${shadowScale})`;
            playerShadow.style.opacity = String(shadowScale);
        } else {
            playerContainer.style.transform = 'translateX(-50%)';
        }

        // Temporizador do deslize
        if (state.isSliding) {
            state.slideTimer -= dt;
            if (state.slideTimer <= 0) {
                state.isSliding = false;
                if (!state.isJumping) {
                    atualizarClassePersonagem('running');
                }
            }
        }

        // Nuvens em paralaxe
        for (const cloud of state.clouds) {
            cloud.x -= cloud.speed * dt;
            if (cloud.x < -20) cloud.x = 110;
            cloud.el.style.left = `${cloud.x}%`;
        }

        // Spawns de obstáculos e cenário
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
            spawnPadrao();
            const intervaloBase = Math.max(0.68, 1.45 - (state.speed - 0.42) * 1.1);
            state.spawnTimer = intervaloBase + Math.random() * 0.35;
        }

        state.sceneryTimer -= dt;
        if (state.sceneryTimer <= 0) {
            spawnCenarioLateral();
            state.sceneryTimer = 0.48;
        }

        // Atualiza cenário lateral
        for (let i = state.scenery.length - 1; i >= 0; i--) {
            const item = state.scenery[i];
            item.z += state.speed * dt;
            if (item.z > 1.15) {
                item.el.remove();
                state.scenery.splice(i, 1);
                continue;
            }
            const proj = projetarPosicao(item.z, item.side * 1.55);
            item.el.style.left = `${proj.xPercent}%`;
            item.el.style.top = `${proj.yPercent}%`;
            item.el.style.transform = `translate(-50%, -100%) scale(${proj.scale})`;
            item.el.style.zIndex = String(Math.floor(proj.p * 15));
        }

        // Atualiza obstáculos e moedas + colisões
        for (let i = state.entities.length - 1; i >= 0; i--) {
            const ent = state.entities[i];
            ent.z += state.speed * dt;

            if (ent.z > 1.12) {
                ent.el.remove();
                state.entities.splice(i, 1);
                continue;
            }

            if (ent.z < 0) {
                ent.el.style.display = 'none';
                continue;
            }
            ent.el.style.display = '';

            const proj = projetarPosicao(ent.z, ent.lane - 1);
            ent.el.style.left = `${proj.xPercent}%`;
            ent.el.style.top = `${proj.yPercent}%`;
            ent.el.style.transform = `translate(-50%, -100%) scale(${proj.scale})`;
            ent.el.style.zIndex = String(Math.floor(proj.p * 19));

            // Janela de colisão na faixa do jogador (z entre 0.86 e 0.98)
            if (ent.z >= 0.86 && ent.z <= 0.98 && ent.lane === state.lane) {
                if (ent.kind === 'coin' && !ent.collected) {
                    ent.collected = true;
                    state.coinsRun += 1;
                    state.coinBonus += 10;
                    sound.playCoin();
                    mostrarEfeitoMoeda(proj.xPercent, proj.yPercent);
                    ent.el.remove();
                    state.entities.splice(i, 1);
                    continue;
                }

                if (ent.kind === 'obstacle' && !ent.hit) {
                    const pulouPorCima = ent.rule === 'jump' && state.jumpHeight > 52;
                    const deslizouPorBaixo = ent.rule === 'slide' && state.isSliding;

                    if (!pulouPorCima && !deslizouPorBaixo) {
                        ent.hit = true;
                        encerrarPartida();
                        return;
                    }
                }
            }
        }

        rafId = requestAnimationFrame(gameLoop);
    }

    // -------------------------------------------------------
    // 10. GAME OVER & PERSISTÊNCIA
    // -------------------------------------------------------

    async function encerrarPartida() {
        state.phase = 'gameover';
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;

        }

        sound.stopMusic();
        sound.playCrash();
        atualizarClassePersonagem('crashed');
        world.classList.add('shake');

        const isNovoRecorde = state.score > state.bestScore;
        if (isNovoRecorde) {
            state.bestScore = state.score;
            localStorage.setItem(STORAGE_RECORDE, String(state.bestScore));
        }

        state.totalCoins += state.coinsRun;
        localStorage.setItem(STORAGE_MOEDAS, String(state.totalCoins));

        setTimeout(() => {
            goPlayerName.textContent = nomeUsuario;
            goFinalScore.textContent = state.score;
            goCoins.textContent = state.coinsRun;
            goBestScore.textContent = state.bestScore;
            newRecordBadge.classList.toggle('hidden', !isNovoRecorde);
            mostrarTela(gameOverScreen);
        }, 620);

        await enviarPontuacao("miniblox_run", state.score);

    }

    // -------------------------------------------------------
    // 11. EVENTOS DE INTERFACE
    // -------------------------------------------------------

    playBtn.addEventListener('click', prepararNovaPartida);
    restartBtn.addEventListener('click', prepararNovaPartida);

    menuBtn.addEventListener('click', () => {
        sound.stopMusic();
        atualizarMenu();
        mostrarTela(startScreen);
        state.phase = 'menu';
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