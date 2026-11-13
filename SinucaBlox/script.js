(() => {
  'use strict';

  /* ==========================================================================
   * 1. CONSTANTES DA MESA, FÍSICA E BOLAS
   * ========================================================================== */
  const LOGICAL_W = 1200;
  const LOGICAL_H = 680;
  const FELT_L = 80;
  const FELT_R = 1120;
  const FELT_T = 80;
  const FELT_B = 600;
  const FELT_W = FELT_R - FELT_L; // 1040
  const FELT_H = FELT_B - FELT_T; // 520

  const BALL_R = 14.5;
  const BALL_D = BALL_R * 2;
  const HEAD_STRING_X = FELT_L + FELT_W * 0.25; // 340
  const FOOT_SPOT_X = FELT_L + FELT_W * 0.75;   // 860
  const CENTER_Y = (FELT_T + FELT_B) * 0.5;     // 340

  // Física independente de FPS (240Hz fixo)
  const FIXED_DT = 1 / 240;
  const MAX_FRAME_DT = 0.05;
  const RESTITUTION_BALL = 0.945;
  const RESTITUTION_RAIL = 0.81;
  const DAMPING_PER_SEC = 0.68;
  const LINEAR_DECEL = 22;
  const STOP_SPEED = 4.2;
  const MAX_SHOT_SPEED = 1650;
  const MIN_SHOT_SPEED = 90;
  const MAX_PULL_PX = 185;
  const CANCEL_POWER_PCT = 4;

  const STORAGE_KEY = 'sinuca8ball_neobrutal_v1';

  const FELT_THEMES = {
    emerald: { main: '#147D4E', dark: '#0E5D39', light: '#1B945E', cushion: '#116B42' },
    cobalt:  { main: '#1B5E9E', dark: '#134373', light: '#2472BD', cushion: '#164F86' },
    crimson: { main: '#8B1E2B', dark: '#66141E', light: '#A52736', cushion: '#761823' }
  };

  const BALL_COLORS = {
    0:  '#FFFFFF',
    1:  '#F5C400',
    2:  '#1D4ED8',
    3:  '#DC2626',
    4:  '#7E22CE',
    5:  '#EA580C',
    6:  '#15803D',
    7:  '#7F1D1D',
    8:  '#141414',
    9:  '#F5C400',
    10: '#1D4ED8',
    11: '#DC2626',
    12: '#7E22CE',
    13: '#EA580C',
    14: '#15803D',
    15: '#7F1D1D'
  };

  // 6 Caçapas
  const POCKETS = [
    { id: 'tl', x: FELT_L + 4,  y: FELT_T + 4,  r: 26, captureR: 25, corner: true },
    { id: 'tm', x: 600,         y: FELT_T - 9,  r: 24, captureR: 23.5, corner: false },
    { id: 'tr', x: FELT_R - 4,  y: FELT_T + 4,  r: 26, captureR: 25, corner: true },
    { id: 'bl', x: FELT_L + 4,  y: FELT_B - 4,  r: 26, captureR: 25, corner: true },
    { id: 'bm', x: 600,         y: FELT_B + 9,  r: 24, captureR: 23.5, corner: false },
    { id: 'br', x: FELT_R - 4,  y: FELT_B - 4,  r: 26, captureR: 25, corner: true }
  ];

  // Segmentos das tabelas e quinas chanfradas das caçapas
  const CUSHION_SEGMENTS = [
    // Topo esquerdo
    { ax: 122, ay: FELT_T, bx: 568, by: FELT_T },
    { ax: 102, ay: 60,     bx: 122, by: FELT_T },
    { ax: 568, ay: FELT_T, bx: 576, by: 60 },
    // Topo direito
    { ax: 632, ay: FELT_T, bx: 1078, by: FELT_T },
    { ax: 624, ay: 60,     bx: 632,  by: FELT_T },
    { ax: 1078, ay: FELT_T, bx: 1098, by: 60 },
    // Base esquerda
    { ax: 122, ay: FELT_B, bx: 568, by: FELT_B },
    { ax: 102, ay: 620,    bx: 122, by: FELT_B },
    { ax: 568, ay: FELT_B, bx: 576, by: 620 },
    // Base direita
    { ax: 632, ay: FELT_B, bx: 1078, by: FELT_B },
    { ax: 624, ay: 620,    bx: 632,  by: FELT_B },
    { ax: 1078, ay: FELT_B, bx: 1098, by: 620 },
    // Lateral esquerda
    { ax: FELT_L, ay: 122, bx: FELT_L, by: 558 },
    { ax: 60,     ay: 102, bx: FELT_L, by: 122 },
    { ax: FELT_L, ay: 558, bx: 60,     by: 578 },
    // Lateral direita
    { ax: FELT_R, ay: 122, bx: FELT_R, by: 558 },
    { ax: 1140,   ay: 102, bx: FELT_R, by: 122 },
    { ax: FELT_R, ay: 558, bx: 1140,   by: 578 }
  ];

  /* ==========================================================================
   * 2. ÁUDIO PROCEDURAL (WEB AUDIO API)
   * ========================================================================== */
  const SoundEngine = {
    ctx: null,
    masterGain: null,
    lastBallSoundAt: 0,
    lastRailSoundAt: 0,

    unlock() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
        this.applyVolume();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    },

    applyVolume() {
      if (!this.masterGain || !this.ctx) return;
      const v = store.settings.muted ? 0 : store.settings.volume / 100;
      this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    },

    playTone(freq, endFreq, duration, type, gainVal, delay = 0) {
      if (!this.ctx || store.settings.muted || store.settings.volume <= 0) return;
      const now = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }
      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + duration + 0.01);
    },

    uiClick() {
      this.unlock();
      this.playTone(540, 320, 0.045, 'triangle', 0.12);
    },

    cueHit(powerRatio) {
      this.unlock();
      const g = 0.18 + powerRatio * 0.35;
      this.playTone(190 + powerRatio * 120, 65, 0.09, 'triangle', g);
      this.playTone(1100, 420, 0.035, 'sine', g * 0.45);
    },

    ballHit(speed) {
      if (!this.ctx || store.settings.muted) return;
      const nowMs = performance.now();
      if (nowMs - this.lastBallSoundAt < 18) return;
      this.lastBallSoundAt = nowMs;
      const norm = Math.min(1, speed / 900);
      if (norm < 0.025) return;
      const g = Math.min(0.42, 0.05 + norm * 0.35);
      this.playTone(2150 + norm * 550, 950, 0.038, 'sine', g);
      this.playTone(3400, 1800, 0.018, 'triangle', g * 0.4);
    },

    railHit(speed) {
      if (!this.ctx || store.settings.muted) return;
      const nowMs = performance.now();
      if (nowMs - this.lastRailSoundAt < 25) return;
      this.lastRailSoundAt = nowMs;
      const norm = Math.min(1, speed / 800);
      if (norm < 0.03) return;
      this.playTone(155, 68, 0.075, 'sine', Math.min(0.32, 0.05 + norm * 0.28));
    },

    pocket(isScratch = false) {
      this.unlock();
      if (isScratch) {
        this.playTone(220, 95, 0.25, 'sawtooth', 0.2);
      } else {
        this.playTone(280, 120, 0.14, 'triangle', 0.24);
        this.playTone(170, 90, 0.12, 'sine', 0.2, 0.06);
      }
    },

    foul() {
      this.unlock();
      this.playTone(210, 175, 0.16, 'sawtooth', 0.18);
      this.playTone(165, 115, 0.22, 'sawtooth', 0.2, 0.14);
    },

    turnChange() {
      this.unlock();
      this.playTone(520, 640, 0.08, 'triangle', 0.1);
    },

    victory() {
      this.unlock();
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((f, idx) => {
        this.playTone(f, f * 1.02, 0.22, 'triangle', 0.18, idx * 0.1);
      });
    }
  };

  /* ==========================================================================
   * 3. PERSISTÊNCIA E PERFIS DE JOGADOR
   * ========================================================================== */
  const defaultStore = {
    settings: {
      volume: 70,
      muted: false,
      aimGuide: 'full',
      feltColor: 'emerald'
    },
    profiles: []
  };

  let store = loadStore();

  function loadStore() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(defaultStore);
      const parsed = JSON.parse(raw);
      return {
        settings: { ...defaultStore.settings, ...(parsed.settings || {}) },
        profiles: Array.isArray(parsed.profiles) ? parsed.profiles : []
      };
    } catch {
      return structuredClone(defaultStore);
    }
  }

  function saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch {
      // Ignora quota cheia
    }
  }

  function createProfile(name) {
    const profile = {
      id: 'p_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 6),
      name: name.trim(),
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ballsPocketed: 0,
      fouls: 0,
      shotsTaken: 0,
      bestWinShots: null
    };
    store.profiles.push(profile);
    saveStore();
    return profile;
  }

  function resolveMatchProfiles(name1, name2) {
    const clean1 = name1.trim();
    const clean2 = name2.trim();
    let p1 = store.profiles.find(p => p.name.toLowerCase() === clean1.toLowerCase());
    if (!p1) p1 = createProfile(clean1);

    let p2;
    if (clean1.toLowerCase() === clean2.toLowerCase()) {
      // Jogadores com mesmo nome recebem identificação separada para não misturar estatísticas
      const tagName = `${clean2} (J2)`;
      p2 = store.profiles.find(p => p.name.toLowerCase() === tagName.toLowerCase() && p.id !== p1.id);
      if (!p2) p2 = createProfile(tagName);
    } else {
      p2 = store.profiles.find(p => p.name.toLowerCase() === clean2.toLowerCase() && p.id !== p1.id);
      if (!p2) p2 = createProfile(clean2);
    }
    return [p1, p2];
  }

  /* ==========================================================================
   * 4. REFERÊNCIAS DO DOM
   * ========================================================================== */
  const el = {
    screens: {
      menu: document.getElementById('screen-menu'),
      setup: document.getElementById('screen-setup'),
      game: document.getElementById('screen-game')
    },
    modals: {
      pause: document.getElementById('modal-pause'),
      victory: document.getElementById('modal-victory'),
      rules: document.getElementById('modal-rules'),
      settings: document.getElementById('modal-settings'),
      stats: document.getElementById('modal-stats'),
      confirm: document.getElementById('modal-confirm'),
      exit: document.getElementById('modal-exit')
    },
    canvas: document.getElementById('pool-canvas'),
    ctx: document.getElementById('pool-canvas').getContext('2d'),
    inputP1: document.getElementById('input-p1-name'),
    inputP2: document.getElementById('input-p2-name'),
    errorP1: document.getElementById('error-p1'),
    errorP2: document.getElementById('error-p2'),
    p1Suggestions: document.getElementById('p1-suggestions'),
    p2Suggestions: document.getElementById('p2-suggestions'),
    setupForm: document.getElementById('setup-form'),

    hudP1: document.getElementById('hud-p1'),
    hudP2: document.getElementById('hud-p2'),
    hudP1Name: document.getElementById('hud-p1-name'),
    hudP2Name: document.getElementById('hud-p2-name'),
    hudP1Group: document.getElementById('hud-p1-group'),
    hudP2Group: document.getElementById('hud-p2-group'),
    hudP1Balls: document.getElementById('hud-p1-balls'),
    hudP2Balls: document.getElementById('hud-p2-balls'),
    hudP1Score: document.getElementById('hud-p1-score'),
    hudP2Score: document.getElementById('hud-p2-score'),
    hudSeriesLabel: document.getElementById('hud-series-label'),
    hudTableState: document.getElementById('hud-table-state'),

    gameToast: document.getElementById('game-toast'),
    turnBanner: document.getElementById('turn-banner'),
    turnBannerTitle: document.getElementById('turn-banner-title'),
    turnBannerSub: document.getElementById('turn-banner-sub'),

    spinPad: document.getElementById('spin-pad'),
    spinMarker: document.getElementById('spin-marker'),
    spinLabel: document.getElementById('spin-label'),
    powerTrack: document.getElementById('power-bar-track'),
    powerFill: document.getElementById('power-bar-fill'),
    powerPercent: document.getElementById('power-percent'),
    powerHint: document.getElementById('power-bar-hint'),
    shotCounter: document.getElementById('shot-counter'),
    controlsHint: document.getElementById('controls-hint'),

    settingMute: document.getElementById('setting-mute'),
    settingVolume: document.getElementById('setting-volume'),
    settingVolumeVal: document.getElementById('setting-volume-val'),
    settingAim: document.getElementById('setting-aim'),
    settingFelt: document.getElementById('setting-felt'),

    statsBody: document.getElementById('stats-body'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    btnConfirmOk: document.getElementById('btn-confirm-ok'),
    btnConfirmCancel: document.getElementById('btn-confirm-cancel'),

    victoryBadge: document.getElementById('victory-badge'),
    victoryTitle: document.getElementById('victory-title'),
    victoryReason: document.getElementById('victory-reason'),
    vstatLoser: document.getElementById('vstat-loser'),
    vstatShots: document.getElementById('vstat-shots'),
    vstatDuration: document.getElementById('vstat-duration'),
    vstatSeries: document.getElementById('vstat-series'),
    btnVictoryNext: document.getElementById('btn-victory-next'),
    btnVictoryRematch: document.getElementById('btn-victory-rematch')
  };

  /* ==========================================================================
   * 5. ESTADO DO JOGO & SÉRIE
   * ========================================================================== */
  const game = {
    activeScreen: 'menu',
    paused: false,
    series: {
      bestOf: 1,
      winsNeeded: 1,
      gameNumber: 1,
      starterIndex: 0,
      players: [
        { profileId: null, name: 'Jogador 1', wins: 0, group: null },
        { profileId: null, name: 'Jogador 2', wins: 0, group: null }
      ]
    },
    // Estado da partida atual
    phase: 'IDLE', // IDLE | BALL_IN_HAND | AIMING | CHARGING | CUE_STRIKE | SIMULATING | GAME_OVER
    currentPlayer: 0,
    isBreakShot: true,
    tableOpen: true,
    ballInHandKitchenOnly: true,
    totalShots: 0,
    playerShots: [0, 0],
    startTimeMs: 0,

    // Bolas e efeitos visuais
    balls: [],
    fallingBalls: [],
    particles: [],
    feltPattern: null,
    feltPatternTheme: null,

    // Controle da tacada atual
    aimAngle: 0,
    powerPct: 0,
    spinX: 0,
    spinY: 0,
    cueStrikeAnim: 0,
    cueStrikePower: 0,
    pendingStrikeSpeed: 0,
    cueSpinCarry: { x: 0, y: 0, active: false },

    // Registro durante a simulação da tacada
    shotRecord: null,

    // Ponteiro
    pointer: {
      x: 600,
      y: 340,
      down: false,
      startX: 0,
      startY: 0,
      mode: 'none', // 'canvas-charge' | 'touch-aim' | 'bar-charge' | 'place-ball'
      isTouch: false,
      placingValid: true
    }
  };

  let toastTimer = null;
  let bannerTimer = null;
  let confirmCallback = null;

  /* ==========================================================================
   * 6. NAVEGAÇÃO DE TELAS E MODAIS
   * ========================================================================== */
  function showScreen(name) {
    Object.entries(el.screens).forEach(([k, node]) => {
      node.classList.toggle('screen-active', k === name);
    });
    game.activeScreen = name;
    if (name === 'setup') renderSetupSuggestions();
    if (name === 'game') resizeCanvasDisplay();
  }

  function openModal(modal) {
    modal.classList.add('is-open');
  }

  function closeModal(modal) {
    modal.classList.remove('is-open');
  }

  function closeAllModals() {
    Object.values(el.modals).forEach(closeModal);
  }

  function askConfirm(title, message, onConfirm) {
    el.confirmTitle.textContent = title;
    el.confirmMessage.textContent = message;
    confirmCallback = onConfirm;
    openModal(el.modals.confirm);
  }

  function showToast(msg, isInfo = false, duration = 3200) {
    el.gameToast.textContent = msg;
    el.gameToast.classList.toggle('is-info', isInfo);
    el.gameToast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.gameToast.classList.remove('is-visible');
    }, duration);
  }

  function showTurnBanner(title, sub = '') {
    el.turnBannerTitle.textContent = title;
    el.turnBannerSub.textContent = sub;
    el.turnBanner.classList.add('is-visible');
    clearTimeout(bannerTimer);
    bannerTimer = setTimeout(() => {
      el.turnBanner.classList.remove('is-visible');
    }, 1500);
  }

  /* ==========================================================================
   * 7. CRIAÇÃO DAS BOLAS & RACK OFICIAL
   * ========================================================================== */
  function makeBall(num, x, y) {
    return {
      num,
      x,
      y,
      vx: 0,
      vy: 0,
      pocketed: false,
      rollAngle: Math.random() * Math.PI * 2,
      rollTilt: (Math.random() - 0.5) * 0.4,
      isStripe: num >= 9 && num <= 15,
      isCue: num === 0,
      isEight: num === 8
    };
  }

  function setupRack() {
    game.balls = [];
    game.fallingBalls = [];
    game.particles = [];

    // Bola branca na região de saída
    game.balls.push(makeBall(0, HEAD_STRING_X - 85, CENTER_Y));

    // Ordem oficial do triângulo: 8 no centro da 3ª fileira, 1 lisa e 1 listrada nos cantos traseiros
    const solids = [1, 2, 3, 4, 5, 6, 7];
    const stripes = [9, 10, 11, 12, 13, 14, 15];
    shuffle(solids);
    shuffle(stripes);

    const cornerA = solids.pop();
    const cornerB = stripes.pop();
    const others = shuffle([...solids, ...stripes]);

    const rackNums = new Array(15);
    rackNums[4] = 8; // Centro da 3ª fileira (índice 4 em 0..14)
    rackNums[10] = Math.random() < 0.5 ? cornerA : cornerB;
    rackNums[14] = rackNums[10] === cornerA ? cornerB : cornerA;

    let idx = 0;
    for (let i = 0; i < 15; i++) {
      if (rackNums[i] === undefined) {
        rackNums[i] = others[idx++];
      }
    }

    const spacingX = BALL_D * Math.cos(Math.PI / 6) + 0.6;
    const spacingY = BALL_D + 0.6;
    let bIndex = 0;
    for (let row = 0; row < 5; row++) {
      const count = row + 1;
      const rx = FOOT_SPOT_X + row * spacingX;
      const startY = CENTER_Y - ((count - 1) * spacingY) / 2;
      for (let col = 0; col < count; col++) {
        const ry = startY + col * spacingY;
        game.balls.push(makeBall(rackNums[bIndex++], rx, ry));
      }
    }
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function getCueBall() {
    return game.balls.find(b => b.num === 0);
  }

  /* ==========================================================================
   * 8. INÍCIO DA SÉRIE E DA PARTIDA
   * ========================================================================== */
  function startSeries(p1Profile, p2Profile, bestOf) {
    game.series = {
      bestOf,
      winsNeeded: Math.ceil(bestOf / 2),
      gameNumber: 1,
      starterIndex: Math.random() < 0.5 ? 0 : 1,
      players: [
        { profileId: p1Profile.id, name: p1Profile.name, wins: 0, group: null },
        { profileId: p2Profile.id, name: p2Profile.name, wins: 0, group: null }
      ]
    };
    showScreen('game');
    startSingleGame();
  }

  function startSingleGame() {
    closeAllModals();
    game.paused = false;
    game.series.players[0].group = null;
    game.series.players[1].group = null;

    game.currentPlayer = game.series.starterIndex;
    game.isBreakShot = true;
    game.tableOpen = true;
    game.ballInHandKitchenOnly = true;
    game.totalShots = 0;
    game.playerShots = [0, 0];
    game.startTimeMs = Date.now();

    game.powerPct = 0;
    game.aimAngle = 0;
    resetSpin();
    setupRack();

    game.phase = 'BALL_IN_HAND';
    updateHUD();
    updatePowerUI(0);

    const starter = game.series.players[game.currentPlayer];
    showTurnBanner(`ABERTURA: ${starter.name.toUpperCase()}`, 'Posicione a bola branca na área de saída');
    showToast(`${starter.name} abre a partida! Clique na área destacada para posicionar a branca.`, true, 3600);
  }

  /* ==========================================================================
   * 9. REGRAS DO 8-BALL E AVALIAÇÃO DA TACADA
   * ========================================================================== */
  function beginShot(speed) {
    const cue = getCueBall();
    if (!cue || cue.pocketed) return;

    game.totalShots++;
    game.playerShots[game.currentPlayer]++;
    const activeProfile = getProfileById(game.series.players[game.currentPlayer].profileId);
    if (activeProfile) activeProfile.shotsTaken++;

    const dirX = Math.cos(game.aimAngle);
    const dirY = Math.sin(game.aimAngle);

    cue.vx = dirX * speed;
    cue.vy = dirY * speed;

    // Armazena energia de acompanhamento/retorno para após o primeiro impacto
    game.cueSpinCarry = {
      x: dirX * game.spinY * speed * 0.55,
      y: dirY * game.spinY * speed * 0.55,
      active: Math.abs(game.spinY) > 0.05
    };

    game.shotRecord = {
      shooter: game.currentPlayer,
      wasBreak: game.isBreakShot,
      wasOpen: game.tableOpen,
      shooterGroupAtStart: game.series.players[game.currentPlayer].group,
      shooterGroupClearedAtStart: isGroupCleared(game.currentPlayer),
      firstHitNum: null,
      pocketedBalls: [],
      cueScratch: false,
      railHitsAfterContact: 0
    };

    game.phase = 'SIMULATING';
    game.powerPct = 0;
    updatePowerUI(0);
    updateHUD();
  }

  function isGroupCleared(playerIdx) {
    const grp = game.series.players[playerIdx].group;
    if (!grp) return false;
    return game.balls
      .filter(b => (grp === 'solids' ? b.num >= 1 && b.num <= 7 : b.num >= 9 && b.num <= 15))
      .every(b => b.pocketed);
  }

  function ballBelongsToGroup(num, group) {
    if (group === 'solids') return num >= 1 && num <= 7;
    if (group === 'stripes') return num >= 9 && num <= 15;
    return false;
  }

  function evaluateShot() {
    const rec = game.shotRecord;
    const shooter = rec.shooter;
    const opponent = 1 - shooter;
    const shooterObj = game.series.players[shooter];
    const oppObj = game.series.players[opponent];
    const shooterProfile = getProfileById(shooterObj.profileId);

    // Atualiza bolas encaçapadas nas estatísticas (apenas bolas numeradas)
    const objectPocketed = rec.pocketedBalls.filter(n => n !== 0);
    if (shooterProfile && objectPocketed.length > 0) {
      shooterProfile.ballsPocketed += objectPocketed.length;
    }

    let foulReason = null;

    // 1. Verificar faltas básicas
    if (rec.cueScratch) {
      foulReason = 'Bola branca encaçapada.';
    } else if (rec.firstHitNum === null) {
      foulReason = 'Nenhuma bola foi atingida pela branca.';
    } else if (rec.wasOpen) {
      // Em mesa aberta não pode acertar a 8 primeiro (exceto na abertura se espalhar, mas na abertura raramente acontece; ainda assim em 8-ball padrão acertar a 8 primeiro na mesa aberta é falta)
      if (!rec.wasBreak && rec.firstHitNum === 8) {
        foulReason = 'Bola 8 atingida primeiro com a mesa aberta.';
      }
    } else {
      // Grupos definidos
      if (rec.shooterGroupClearedAtStart) {
        if (rec.firstHitNum !== 8) {
          foulReason = 'Deveria acertar a Bola 8 primeiro.';
        }
      } else {
        if (!ballBelongsToGroup(rec.firstHitNum, rec.shooterGroupAtStart)) {
          const expected = rec.shooterGroupAtStart === 'solids' ? 'Lisa (1-7)' : 'Listrada (9-15)';
          foulReason = `Primeiro contato deveria ser em uma bola ${expected}.`;
        }
      }
    }

    const eightPocketed = rec.pocketedBalls.includes(8);

    // 2. Regras especiais da Bola 8
    if (eightPocketed) {
      if (rec.wasBreak) {
        // Na abertura: reposiciona a Bola 8 no ponto de pé
        respotEightBall();
        if (foulReason) {
          applyFoulAndSwitch(opponent, `${foulReason} Bola 8 reposicionada.`, false);
        } else {
          // Sem falta na abertura: continua se alguma outra bola caiu
          game.isBreakShot = false;
          const nonEight = objectPocketed.filter(n => n !== 8);
          if (nonEight.length > 0) {
            showToast('Bola 8 caiu na abertura e foi reposicionada! Você continua.', true);
            prepareNextAim(shooter);
          } else {
            showToast('Bola 8 reposicionada na abertura.', true);
            switchTurn(opponent);
          }
        }
        saveStore();
        return;
      }

      // Pós-abertura: vitória ou derrota imediata
      if (!rec.shooterGroupClearedAtStart || rec.wasOpen) {
        SoundEngine.foul();
        endSingleGame(opponent, `${shooterObj.name} encaçapou a Bola 8 antes da hora.`);
        return;
      }
      if (foulReason) {
        SoundEngine.foul();
        endSingleGame(opponent, `${shooterObj.name} cometeu falta ao encaçapar a Bola 8 (${foulReason})`);
        return;
      }

      // Vitória legal!
      endSingleGame(shooter, `${shooterObj.name} encaçapou a Bola 8 legalmente!`);
      return;
    }

    // 3. Se houve falta sem queda da Bola 8
    if (foulReason) {
      if (shooterProfile) shooterProfile.fouls++;
      if (rec.cueScratch) {
        respawnCueBall();
      }
      game.isBreakShot = false;
      applyFoulAndSwitch(opponent, foulReason, rec.wasBreak);
      saveStore();
      return;
    }

    // 4. Jogada válida sem falta
    let keepTurn = false;

    if (rec.wasBreak) {
      game.isBreakShot = false;
      // Na abertura a mesa permanece aberta mesmo que bolas caiam
      if (objectPocketed.length > 0) {
        keepTurn = true;
        showToast(`${shooterObj.name} encaçapou na abertura e continua! Mesa ainda aberta.`, true);
      }
    } else if (rec.wasOpen) {
      // Primeira bola encaçapada legalmente após abertura define os grupos
      const firstLegal = objectPocketed.find(n => n !== 8);
      if (firstLegal !== undefined) {
        const chosenGroup = firstLegal <= 7 ? 'solids' : 'stripes';
        shooterObj.group = chosenGroup;
        oppObj.group = chosenGroup === 'solids' ? 'stripes' : 'solids';
        game.tableOpen = false;
        keepTurn = true;
        const label = chosenGroup === 'solids' ? 'Lisas (1-7)' : 'Listradas (9-15)';
        showToast(`${shooterObj.name} ficou com as bolas ${label}!`, true, 3200);
      }
    } else {
      // Grupos já definidos
      const pocketedOwn = objectPocketed.some(n => ballBelongsToGroup(n, shooterObj.group));
      if (pocketedOwn) {
        keepTurn = true;
      }
    }

    saveStore();

    if (keepTurn) {
      prepareNextAim(shooter);
    } else {
      switchTurn(opponent);
    }
  }

  function applyFoulAndSwitch(nextPlayer, reason, kitchenOnly) {
    SoundEngine.foul();
    game.currentPlayer = nextPlayer;
    game.ballInHandKitchenOnly = kitchenOnly;
    game.phase = 'BALL_IN_HAND';
    resetSpin();
    updateHUD();

    const nextName = game.series.players[nextPlayer].name;
    showToast(`FALTA! ${reason} Bola na mão para ${nextName}.`, false, 4200);
    showTurnBanner(`VEZ DE ${nextName.toUpperCase()}`, 'Bola na mão (posicione a branca)');
  }

  function switchTurn(nextPlayer) {
    SoundEngine.turnChange();
    game.currentPlayer = nextPlayer;
    resetSpin();
    prepareNextAim(nextPlayer, true);
  }

  function prepareNextAim(playerIdx, showBanner = false) {
    game.currentPlayer = playerIdx;
    game.phase = 'AIMING';
    resetSpin();
    updateHUD();
    if (showBanner) {
      const p = game.series.players[playerIdx];
      const sub = game.tableOpen
        ? 'Mesa Aberta'
        : isGroupCleared(playerIdx)
          ? 'Mire na Bola 8!'
          : p.group === 'solids' ? 'Suas bolas: Lisas (1-7)' : 'Suas bolas: Listradas (9-15)';
      showTurnBanner(`VEZ DE ${p.name.toUpperCase()}`, sub);
    }
  }

  function respawnCueBall() {
    const cue = getCueBall();
    if (!cue) return;
    cue.pocketed = false;
    cue.vx = 0;
    cue.vy = 0;
    const pos = findFreeSpot(HEAD_STRING_X - 80, CENTER_Y);
    cue.x = pos.x;
    cue.y = pos.y;
  }

  function respotEightBall() {
    const b8 = game.balls.find(b => b.num === 8);
    if (!b8) return;
    b8.pocketed = false;
    b8.vx = 0;
    b8.vy = 0;
    const pos = findFreeSpot(FOOT_SPOT_X, CENTER_Y);
    b8.x = pos.x;
    b8.y = pos.y;
  }

  function findFreeSpot(prefX, prefY) {
    let x = prefX;
    let y = prefY;
    for (let step = 0; step < 30; step++) {
      if (isPositionFreeForCue(x, y, 0)) return { x, y };
      x -= BALL_D * 0.8;
      if (x < FELT_L + BALL_R * 2) {
        x = FOOT_SPOT_X;
        y += BALL_D;
      }
    }
    return { x: prefX, y: prefY };
  }

  function isPositionFreeForCue(x, y, ignoreNum = 0) {
    for (const b of game.balls) {
      if (b.pocketed || b.num === ignoreNum) continue;
      const dx = b.x - x;
      const dy = b.y - y;
      if (dx * dx + dy * dy < (BALL_D + 1) * (BALL_D + 1)) return false;
    }
    return true;
  }

  function endSingleGame(winnerIdx, reason) {
    game.phase = 'GAME_OVER';
    SoundEngine.victory();

    const loserIdx = 1 - winnerIdx;
    const winner = game.series.players[winnerIdx];
    const loser = game.series.players[loserIdx];
    winner.wins++;

    // Estatísticas permanentes
    const winProfile = getProfileById(winner.profileId);
    const loseProfile = getProfileById(loser.profileId);
    if (winProfile) {
      winProfile.gamesPlayed++;
      winProfile.wins++;
      const wShots = game.playerShots[winnerIdx];
      if (winProfile.bestWinShots === null || wShots < winProfile.bestWinShots) {
        winProfile.bestWinShots = wShots;
      }
    }
    if (loseProfile) {
      loseProfile.gamesPlayed++;
      loseProfile.losses++;
    }
    saveStore();
    updateHUD();

    const durationSec = Math.max(1, Math.floor((Date.now() - game.startTimeMs) / 1000));
    const mm = String(Math.floor(durationSec / 60)).padStart(2, '0');
    const ss = String(durationSec % 60).padStart(2, '0');

    const seriesWon = winner.wins >= game.series.winsNeeded;
    el.victoryBadge.textContent = seriesWon
      ? (game.series.bestOf > 1 ? 'CAMPEÃO DA SÉRIE!' : 'VITÓRIA!')
      : `PARTIDA ${game.series.gameNumber} CONCLUÍDA`;
    el.victoryTitle.textContent = `${winner.name.toUpperCase()} VENCEU!`;
    el.victoryReason.textContent = reason;
    el.vstatLoser.textContent = loser.name;
    el.vstatShots.textContent = String(game.totalShots);
    el.vstatDuration.textContent = `${mm}:${ss}`;
    el.vstatSeries.textContent = `${game.series.players[0].wins} x ${game.series.players[1].wins}`;

    el.btnVictoryNext.style.display = seriesWon ? 'none' : 'inline-flex';
    el.btnVictoryRematch.textContent = seriesWon ? 'JOGAR NOVAMENTE' : 'REINICIAR SÉRIE';

    openModal(el.modals.victory);
  }

  function getProfileById(id) {
    return store.profiles.find(p => p.id === id) || null;
  }

  /* ==========================================================================
   * 10. MOTOR DE FÍSICA (PASSO FIXO 240Hz)
   * ========================================================================== */
  function stepPhysics(dt) {
    const activeBalls = game.balls.filter(b => !b.pocketed);

    // 1. Efeito de acompanhamento / retorno após o primeiro contato da branca
    const cue = getCueBall();
    if (cue && !cue.pocketed && game.cueSpinCarry.active && game.shotRecord && game.shotRecord.firstHitNum !== null) {
      const grip = 7.5;
      cue.vx += game.cueSpinCarry.x * grip * dt;
      cue.vy += game.cueSpinCarry.y * grip * dt;
      const decay = Math.exp(-6.5 * dt);
      game.cueSpinCarry.x *= decay;
      game.cueSpinCarry.y *= decay;
      if (Math.hypot(game.cueSpinCarry.x, game.cueSpinCarry.y) < 3) {
        game.cueSpinCarry.active = false;
      }
    }

    // 2. Movimento e atrito
    const damp = Math.pow(DAMPING_PER_SEC, dt);
    for (const b of activeBalls) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 0.1) {
        b.rollAngle += (speed * dt) / BALL_R;
        const newSpeed = Math.max(0, speed * damp - LINEAR_DECEL * dt);
        if (newSpeed < STOP_SPEED) {
          b.vx = 0;
          b.vy = 0;
        } else {
          const ratio = newSpeed / speed;
          b.vx *= ratio;
          b.vy *= ratio;
        }
      }
    }

    // 3. Colisão entre bolas
    const len = activeBalls.length;
    for (let i = 0; i < len; i++) {
      const b1 = activeBalls[i];
      for (let j = i + 1; j < len; j++) {
        const b2 = activeBalls[j];
        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const distSq = dx * dx + dy * dy;
        if (distSq >= BALL_D * BALL_D) continue;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;

        // Correção posicional anti-sobreposição
        const overlap = (BALL_D - dist) * 0.5 + 0.002;
        b1.x -= nx * overlap;
        b1.y -= ny * overlap;
        b2.x += nx * overlap;
        b2.y += ny * overlap;

        // Impulso elástico
        const rvx = b2.vx - b1.vx;
        const rvy = b2.vy - b1.vy;
        const vn = rvx * nx + rvy * ny;
        if (vn < 0) {
          const jImp = -(1 + RESTITUTION_BALL) * vn * 0.5;
          b1.vx -= jImp * nx;
          b1.vy -= jImp * ny;
          b2.vx += jImp * nx;
          b2.vy += jImp * ny;

          const impactSpeed = Math.abs(vn);
          SoundEngine.ballHit(impactSpeed);
          if (impactSpeed > 180) {
            spawnImpactParticle((b1.x + b2.x) * 0.5, (b1.y + b2.y) * 0.5);
          }

          // Registra primeiro contato da branca
          if (game.shotRecord && game.shotRecord.firstHitNum === null) {
            if (b1.isCue) game.shotRecord.firstHitNum = b2.num;
            else if (b2.isCue) game.shotRecord.firstHitNum = b1.num;
          }
        }
      }
    }

    // 4. Colisão com tabelas e quinas
    for (const b of activeBalls) {
      for (const seg of CUSHION_SEGMENTS) {
        const abx = seg.bx - seg.ax;
        const aby = seg.by - seg.ay;
        const abLenSq = abx * abx + aby * aby;
        let t = ((b.x - seg.ax) * abx + (b.y - seg.ay) * aby) / abLenSq;
        t = Math.max(0, Math.min(1, t));
        const cx = seg.ax + t * abx;
        const cy = seg.ay + t * aby;

        const dx = b.x - cx;
        const dy = b.y - cy;
        const distSq = dx * dx + dy * dy;
        if (distSq >= BALL_R * BALL_R) continue;

        const dist = Math.sqrt(distSq) || 0.0001;
        const nx = dx / dist;
        const ny = dy / dist;

        b.x += nx * (BALL_R - dist + 0.002);
        b.y += ny * (BALL_R - dist + 0.002);

        const vn = b.vx * nx + b.vy * ny;
        if (vn < 0) {
          b.vx -= (1 + RESTITUTION_RAIL) * vn * nx;
          b.vy -= (1 + RESTITUTION_RAIL) * vn * ny;

          // Efeito lateral da bola branca na tabela
          if (b.isCue && Math.abs(game.spinX) > 0.05) {
            const tx = -ny;
            const ty = nx;
            const englishBoost = game.spinX * Math.abs(vn) * 0.28;
            b.vx += tx * englishBoost;
            b.vy += ty * englishBoost;
            game.spinX *= 0.45;
          }

          SoundEngine.railHit(Math.abs(vn));
          if (game.shotRecord && game.shotRecord.firstHitNum !== null) {
            game.shotRecord.railHitsAfterContact++;
          }
        }
      }

      // Limite de segurança externo (evita bola sair da mesa)
      if (b.x < FELT_L - 35 || b.x > FELT_R + 35 || b.y < FELT_T - 35 || b.y > FELT_B + 35) {
        pocketBall(b, POCKETS[0]);
      }
    }

    // 5. Verificação das caçapas
    for (const b of activeBalls) {
      if (b.pocketed) continue;
      for (const p of POCKETS) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        if (dx * dx + dy * dy <= p.captureR * p.captureR) {
          pocketBall(b, p);
          break;
        }
      }
    }
  }

  function pocketBall(ball, pocket) {
    ball.pocketed = true;
    ball.vx = 0;
    ball.vy = 0;

    game.fallingBalls.push({
      num: ball.num,
      isStripe: ball.isStripe,
      x: ball.x,
      y: ball.y,
      targetX: pocket.x,
      targetY: pocket.y,
      progress: 0
    });

    SoundEngine.pocket(ball.isCue);

    if (game.shotRecord) {
      game.shotRecord.pocketedBalls.push(ball.num);
      if (ball.isCue) game.shotRecord.cueScratch = true;
    }
    updateHUD();
  }

  function spawnImpactParticle(x, y) {
    game.particles.push({ x, y, life: 0, maxLife: 0.2 });
  }

  function allBallsStopped() {
    return game.balls.every(b => b.pocketed || (b.vx === 0 && b.vy === 0));
  }

  /* ==========================================================================
   * 11. TRAJETÓRIA DE PREVISÃO (RAYCAST COM RAIO DA BOLA)
   * ========================================================================== */
  function computeAimPrediction() {
    const cue = getCueBall();
    if (!cue || cue.pocketed) return null;

    const dx = Math.cos(game.aimAngle);
    const dy = Math.sin(game.aimAngle);

    let minT = 1800;
    let hitType = 'none'; // 'ball' | 'rail'
    let hitBall = null;

    // 1. Interseção círculo-círculo contra todas as bolas
    for (const b of game.balls) {
      if (b.pocketed || b.isCue) continue;
      const ocX = b.x - cue.x;
      const ocY = b.y - cue.y;
      const proj = ocX * dx + ocY * dy;
      if (proj <= 0) continue;

      const perpSq = ocX * ocX + ocY * ocY - proj * proj;
      const hitDistSq = BALL_D * BALL_D;
      if (perpSq >= hitDistSq) continue;

      const thc = Math.sqrt(hitDistSq - perpSq);
      const t = proj - thc;
      if (t > 0 && t < minT) {
        minT = t;
        hitType = 'ball';
        hitBall = b;
      }
    }

    // 2. Interseção simples contra paredes da tabela (FELT_L+R .. FELT_R-R)
    const minX = FELT_L + BALL_R;
    const maxX = FELT_R - BALL_R;
    const minY = FELT_T + BALL_R;
    const maxY = FELT_B - BALL_R;

    if (dx > 0.0001) {
      const tx = (maxX - cue.x) / dx;
      if (tx > 0 && tx < minT) { minT = tx; hitType = 'rail'; hitBall = null; }
    } else if (dx < -0.0001) {
      const tx = (minX - cue.x) / dx;
      if (tx > 0 && tx < minT) { minT = tx; hitType = 'rail'; hitBall = null; }
    }

    if (dy > 0.0001) {
      const ty = (maxY - cue.y) / dy;
      if (ty > 0 && ty < minT) { minT = ty; hitType = 'rail'; hitBall = null; }
    } else if (dy < -0.0001) {
      const ty = (minY - cue.y) / dy;
      if (ty > 0 && ty < minT) { minT = ty; hitType = 'rail'; hitBall = null; }
    }

    const endX = cue.x + dx * minT;
    const endY = cue.y + dy * minT;

    // Verificar se alvo é legal para feedback visual
    let legalTarget = true;
    if (hitType === 'ball' && hitBall) {
      if (game.tableOpen) {
        if (!game.isBreakShot && hitBall.isEight) legalTarget = false;
      } else {
        const grp = game.series.players[game.currentPlayer].group;
        if (isGroupCleared(game.currentPlayer)) {
          legalTarget = hitBall.isEight;
        } else {
          legalTarget = ballBelongsToGroup(hitBall.num, grp);
        }
      }
    }

    return { cue, dx, dy, endX, endY, hitType, hitBall, legalTarget };
  }

  /* ==========================================================================
   * 12. RENDERIZAÇÃO NO CANVAS
   * ========================================================================== */
  function buildFeltPattern(themeKey) {
    const off = document.createElement('canvas');
    off.width = 96;
    off.height = 96;
    const octx = off.getContext('2d');
    const theme = FELT_THEMES[themeKey] || FELT_THEMES.emerald;
    octx.fillStyle = theme.main;
    octx.fillRect(0, 0, 96, 96);

    // Textura sutil de pano
    for (let i = 0; i < 240; i++) {
      const x = (i * 37) % 96;
      const y = (i * 53) % 96;
      octx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.035)';
      octx.fillRect(x, y, 2, 2);
    }
    game.feltPattern = el.ctx.createPattern(off, 'repeat');
    game.feltPatternTheme = themeKey;
  }

  function render() {
    const ctx = el.ctx;
    const themeKey = store.settings.feltColor;
    const theme = FELT_THEMES[themeKey] || FELT_THEMES.emerald;
    if (!game.feltPattern || game.feltPatternTheme !== themeKey) {
      buildFeltPattern(themeKey);
    }

    ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

    // 1. Moldura externa de madeira
    drawTableWoodFrame(ctx);

    // 2. Pano + iluminação sutil + marcações
    drawFeltAndMarkings(ctx, theme);

    // 3. Borrachas das tabelas
    drawCushions(ctx, theme);

    // 4. Caçapas
    drawPockets(ctx);

    // 5. Área de bola na mão (quando aplicável)
    if (game.phase === 'BALL_IN_HAND') {
      drawBallInHandOverlay(ctx);
    }

    // 6. Bolas caindo na caçapa
    drawFallingBalls(ctx);

    // 7. Bolas ativas (sombras primeiro, depois esferas 3D)
    drawBalls(ctx);

    // 8. Partículas de impacto
    drawParticles(ctx);

    // 9. Mira e taco
    if (game.phase === 'AIMING' || game.phase === 'CHARGING' || game.phase === 'CUE_STRIKE') {
      drawAimAndCue(ctx);
    }
  }

  function drawTableWoodFrame(ctx) {
    // Base madeira escura
    ctx.fillStyle = '#5C3317';
    ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

    // Borda externa chanfrada clara
    ctx.fillStyle = '#7C4823';
    ctx.fillRect(10, 10, LOGICAL_W - 20, LOGICAL_H - 20);

    // Linhas sutis de madeira
    ctx.strokeStyle = 'rgba(0,0,0,0.16)';
    ctx.lineWidth = 2;
    for (let y = 18; y < LOGICAL_H - 18; y += 14) {
      ctx.beginPath();
      ctx.moveTo(14, y);
      ctx.lineTo(LOGICAL_W - 14, y);
      ctx.stroke();
    }

    // Moldura interna escura ao redor da área do pano
    ctx.fillStyle = '#2B1608';
    ctx.fillRect(54, 54, LOGICAL_W - 108, LOGICAL_H - 108);

    // Placas metálicas / cantoneiras
    ctx.fillStyle = '#D4AF37';
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2.5;
    const cornerSize = 46;
    const corners = [
      [8, 8], [LOGICAL_W - cornerSize - 8, 8],
      [8, LOGICAL_H - cornerSize - 8], [LOGICAL_W - cornerSize - 8, LOGICAL_H - cornerSize - 8]
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx, cy, cornerSize, cornerSize);
      ctx.strokeRect(cx, cy, cornerSize, cornerSize);
    }

    // Placas das caçapas do meio
    ctx.fillRect(600 - 28, 8, 56, 26);
    ctx.strokeRect(600 - 28, 8, 56, 26);
    ctx.fillRect(600 - 28, LOGICAL_H - 34, 56, 26);
    ctx.strokeRect(600 - 28, LOGICAL_H - 34, 56, 26);

    // Diamantes de referência (sights)
    ctx.fillStyle = '#F5E6B8';
    const xSights = [
      FELT_L + FELT_W * 0.125, FELT_L + FELT_W * 0.25, FELT_L + FELT_W * 0.375,
      FELT_L + FELT_W * 0.625, FELT_L + FELT_W * 0.75, FELT_L + FELT_W * 0.875
    ];
    for (const sx of xSights) {
      drawDiamond(ctx, sx, 34);
      drawDiamond(ctx, sx, LOGICAL_H - 34);
    }
    const ySights = [
      FELT_T + FELT_H * 0.25, FELT_T + FELT_H * 0.5, FELT_T + FELT_H * 0.75
    ];
    for (const sy of ySights) {
      drawDiamond(ctx, 34, sy);
      drawDiamond(ctx, LOGICAL_W - 34, sy);
    }
  }

  function drawDiamond(ctx, x, y) {
    ctx.beginPath();
    ctx.moveTo(x, y - 5);
    ctx.lineTo(x + 5, y);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x - 5, y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawFeltAndMarkings(ctx, theme) {
    ctx.fillStyle = game.feltPattern;
    ctx.fillRect(60, 60, LOGICAL_W - 120, LOGICAL_H - 120);

    // Iluminação central suave
    const grad = ctx.createRadialGradient(600, 340, 80, 600, 340, 620);
    grad.addColorStop(0, 'rgba(255,255,255,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(60, 60, LOGICAL_W - 120, LOGICAL_H - 120);

    // Sombra interna projetada pelas tabelas
    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 8;
    ctx.strokeRect(FELT_L, FELT_T, FELT_W, FELT_H);

    // Linha de saída (Head String)
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(HEAD_STRING_X, FELT_T);
    ctx.lineTo(HEAD_STRING_X, FELT_B);
    ctx.stroke();
    ctx.restore();

    // Ponto de pé (Foot Spot) e ponto de saída
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath();
    ctx.arc(FOOT_SPOT_X, CENTER_Y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(HEAD_STRING_X, CENTER_Y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCushions(ctx, theme) {
    const polys = [
      // Topo esquerdo e direito
      [[102, 60], [576, 60], [568, FELT_T], [122, FELT_T]],
      [[624, 60], [1098, 60], [1078, FELT_T], [632, FELT_T]],
      // Base esquerda e direita
      [[102, 620], [122, FELT_B], [568, FELT_B], [576, 620]],
      [[624, 620], [632, FELT_B], [1078, FELT_B], [1098, 620]],
      // Lateral esquerda e direita
      [[60, 102], [FELT_L, 122], [FELT_L, 558], [60, 578]],
      [[1140, 102], [1140, 578], [FELT_R, 558], [FELT_R, 122]]
    ];

    for (const poly of polys) {
      ctx.beginPath();
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
      ctx.fillStyle = theme.cushion;
      ctx.fill();
      ctx.strokeStyle = theme.dark;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawPockets(ctx) {
    for (const p of POCKETS) {
      // Aro externo
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#1E140E';
      ctx.fill();

      // Fundo escuro da caçapa
      const pg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.r);
      pg.addColorStop(0, '#000000');
      pg.addColorStop(0.75, '#0D0D0D');
      pg.addColorStop(1, '#262626');
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();
    }
  }

  function drawBallInHandOverlay(ctx) {
    const maxX = game.ballInHandKitchenOnly ? HEAD_STRING_X - BALL_R : FELT_R - BALL_R;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 214, 0, 0.10)';
    ctx.strokeStyle = '#FFD600';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 6]);
    ctx.fillRect(FELT_L + 2, FELT_T + 2, maxX - FELT_L + BALL_R - 2, FELT_H - 4);
    ctx.strokeRect(FELT_L + 2, FELT_T + 2, maxX - FELT_L + BALL_R - 2, FELT_H - 4);
    ctx.restore();

    const cue = getCueBall();
    if (cue && !cue.pocketed) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cue.x, cue.y, BALL_R + 7, 0, Math.PI * 2);
      ctx.strokeStyle = game.pointer.placingValid ? '#FFD600' : '#FF5E5B';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawFallingBalls(ctx) {
    for (const fb of game.fallingBalls) {
      const t = fb.progress;
      const x = fb.x + (fb.targetX - fb.x) * t;
      const y = fb.y + (fb.targetY - fb.y) * t;
      const scale = Math.max(0.15, 1 - t * 0.8);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      drawSingleBallSphere(ctx, fb.num, 0, 0, 0);
      ctx.restore();
    }
  }

  function drawBalls(ctx) {
    // 1. Sombras no pano
    for (const b of game.balls) {
      if (b.pocketed) continue;
      const offX = (b.x - 600) * 0.008 + 3;
      const offY = (b.y - 340) * 0.008 + 4;
      ctx.beginPath();
      ctx.arc(b.x + offX, b.y + offY, BALL_R * 0.98, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.34)';
      ctx.fill();
    }

    // 2. Esferas
    for (const b of game.balls) {
      if (b.pocketed) continue;
      drawSingleBallSphere(ctx, b.num, b.x, b.y, b.rollAngle);
    }
  }

  function drawSingleBallSphere(ctx, num, x, y, rollAngle) {
    const color = BALL_COLORS[num] || '#FFFFFF';
    const isStripe = num >= 9 && num <= 15;

    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.clip();

    if (isStripe) {
      // Fundo branco da listrada + faixa giratória
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(x - BALL_R, y - BALL_R, BALL_D, BALL_D);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rollAngle * 0.35);
      ctx.fillStyle = color;
      ctx.fillRect(-BALL_R - 2, -BALL_R * 0.52, BALL_D + 4, BALL_R * 1.04);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x - BALL_R, y - BALL_R, BALL_D, BALL_D);
    }

    // Círculo branco e número
    if (num > 0) {
      const nx = x + Math.cos(rollAngle) * 1.6;
      const ny = y + Math.sin(rollAngle) * 1.6;
      ctx.beginPath();
      ctx.arc(nx, ny, BALL_R * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      ctx.fillStyle = '#111111';
      ctx.font = '800 9.5px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(num), nx, ny + 0.5);
    } else if (Math.abs(game.spinX) > 0.05 || Math.abs(game.spinY) > 0.05) {
      // Marca sutil de efeito na bola branca
      ctx.beginPath();
      ctx.arc(x + game.spinX * 6, y - game.spinY * 6, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#DC2626';
      ctx.fill();
    }

    // Sombreamento 3D
    const shade = ctx.createRadialGradient(
      x - BALL_R * 0.35, y - BALL_R * 0.35, BALL_R * 0.12,
      x, y, BALL_R
    );
    shade.addColorStop(0, 'rgba(255,255,255,0.42)');
    shade.addColorStop(0.55, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = shade;
    ctx.fillRect(x - BALL_R, y - BALL_R, BALL_D, BALL_D);

    ctx.restore();

    // Contorno sutil nítido
    ctx.beginPath();
    ctx.arc(x, y, BALL_R, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(17,17,17,0.65)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  function drawParticles(ctx) {
    for (const pt of game.particles) {
      const alpha = 1 - pt.life / pt.maxLife;
      const rad = 6 + (pt.life / pt.maxLife) * 14;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, rad, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  function drawAimAndCue(ctx) {
    const pred = computeAimPrediction();
    if (!pred) return;

    const { cue, dx, dy, endX, endY, hitType, hitBall, legalTarget } = pred;
    const isFullGuide = store.settings.aimGuide === 'full';

    // 1. Linha de mira
    if (game.phase === 'AIMING' || game.phase === 'CHARGING') {
      ctx.save();
      ctx.strokeStyle = legalTarget ? 'rgba(255, 255, 255, 0.72)' : 'rgba(255, 94, 91, 0.85)';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);

      const lineEndX = isFullGuide ? endX : cue.x + dx * Math.min(220, Math.hypot(endX - cue.x, endY - cue.y));
      const lineEndY = isFullGuide ? endY : cue.y + dy * Math.min(220, Math.hypot(endX - cue.x, endY - cue.y));

      ctx.beginPath();
      ctx.moveTo(cue.x, cue.y);
      ctx.lineTo(lineEndX, lineEndY);
      ctx.stroke();

      if (isFullGuide) {
        // Círculo fantasma no ponto de impacto
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(endX, endY, BALL_R, 0, Math.PI * 2);
        ctx.strokeStyle = legalTarget ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 94, 91, 0.9)';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Previsão de saída da bola atingida
        if (hitType === 'ball' && hitBall && legalTarget) {
          const nx = hitBall.x - endX;
          const ny = hitBall.y - endY;
          const nLen = Math.hypot(nx, ny) || 1;
          const ux = nx / nLen;
          const uy = ny / nLen;

          ctx.beginPath();
          ctx.moveTo(hitBall.x, hitBall.y);
          ctx.lineTo(hitBall.x + ux * 68, hitBall.y + uy * 68);
          ctx.strokeStyle = 'rgba(255, 214, 0, 0.9)';
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2. Desenho do taco
    let pullOffset = (game.powerPct / 100) * 115;
    if (game.phase === 'CUE_STRIKE') {
      // Animação rápida de avanço do taco até tocar na branca
      const maxPull = (game.cueStrikePower / 100) * 115;
      pullOffset = maxPull * (1 - game.cueStrikeAnim);
    }

    const gapFromCue = BALL_R + 7 + pullOffset;
    const cueLength = 350;

    ctx.save();
    ctx.translate(cue.x, cue.y);
    ctx.rotate(game.aimAngle);

    // Sombra do taco
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.moveTo(-gapFromCue, 4);
    ctx.lineTo(-gapFromCue - cueLength, 9);
    ctx.lineTo(-gapFromCue - cueLength, 1);
    ctx.lineTo(-gapFromCue, -1);
    ctx.closePath();
    ctx.fill();

    // Corpo do taco (cônico)
    const tipX = -gapFromCue;
    const buttX = -gapFromCue - cueLength;

    // Madeira clara (ponteira)
    ctx.beginPath();
    ctx.moveTo(tipX - 8, -2.5);
    ctx.lineTo(tipX - 180, -4.5);
    ctx.lineTo(tipX - 180, 4.5);
    ctx.lineTo(tipX - 8, 2.5);
    ctx.closePath();
    ctx.fillStyle = '#F3D8A8';
    ctx.fill();

    // Cabo escuro estilizado
    ctx.beginPath();
    ctx.moveTo(tipX - 180, -4.5);
    ctx.lineTo(buttX, -6.5);
    ctx.lineTo(buttX, 6.5);
    ctx.lineTo(tipX - 180, 4.5);
    ctx.closePath();
    ctx.fillStyle = '#2B180C';
    ctx.fill();

    // Detalhe amarelo Neobrutalista no cabo
    ctx.fillStyle = '#FFD600';
    ctx.fillRect(tipX - 210, -4.8, 16, 9.6);

    // Virola branca e sola azul
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(tipX - 8, -2.4, 5, 4.8);
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(tipX - 3, -2.4, 3, 4.8);

    // Contorno preto nítido do taco
    ctx.beginPath();
    ctx.moveTo(tipX, -2.4);
    ctx.lineTo(buttX, -6.5);
    ctx.lineTo(buttX, 6.5);
    ctx.lineTo(tipX, 2.4);
    ctx.closePath();
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.restore();
  }

  /* ==========================================================================
   * 13. LOOP PRINCIPAL
   * ========================================================================== */
  let lastTime = 0;
  let accumulator = 0;

  function mainLoop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    let frameDt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    if (frameDt > MAX_FRAME_DT) frameDt = MAX_FRAME_DT;

    if (game.activeScreen === 'game' && !game.paused) {
      // Animação das bolas caindo na caçapa
      for (let i = game.fallingBalls.length - 1; i >= 0; i--) {
        game.fallingBalls[i].progress += frameDt * 4.4;
        if (game.fallingBalls[i].progress >= 1) {
          game.fallingBalls.splice(i, 1);
        }
      }

      // Partículas
      for (let i = game.particles.length - 1; i >= 0; i--) {
        game.particles[i].life += frameDt;
        if (game.particles[i].life >= game.particles[i].maxLife) {
          game.particles.splice(i, 1);
        }
      }

      // Animação de avanço do taco ao soltar
      if (game.phase === 'CUE_STRIKE') {
        game.cueStrikeAnim += frameDt * 12;
        if (game.cueStrikeAnim >= 1) {
          game.cueStrikeAnim = 1;
          SoundEngine.cueHit(game.cueStrikePower / 100);
          beginShot(game.pendingStrikeSpeed);
        }
      }

      // Simulação física de passo fixo
      if (game.phase === 'SIMULATING') {
        accumulator += frameDt;
        while (accumulator >= FIXED_DT) {
          stepPhysics(FIXED_DT);
          accumulator -= FIXED_DT;
        }
        if (allBallsStopped() && game.fallingBalls.length === 0) {
          accumulator = 0;
          evaluateShot();
        }
      }

      render();
    }

    requestAnimationFrame(mainLoop);
  }

  /* ==========================================================================
   * 14. CONTROLES DE MIRA, FORÇA, EFEITO E POSICIONAMENTO
   * ========================================================================== */
  function canvasCoordsFromEvent(ev) {
    const rect = el.canvas.getBoundingClientRect();
    const scaleX = LOGICAL_W / rect.width;
    const scaleY = LOGICAL_H / rect.height;
    return {
      x: (ev.clientX - rect.left) * scaleX,
      y: (ev.clientY - rect.top) * scaleY
    };
  }

  function clampCuePlacement(x, y) {
    const minX = FELT_L + BALL_R + 1;
    const maxX = game.ballInHandKitchenOnly ? HEAD_STRING_X - BALL_R : FELT_R - BALL_R - 1;
    const minY = FELT_T + BALL_R + 1;
    const maxY = FELT_B - BALL_R - 1;
    return {
      x: Math.max(minX, Math.min(maxX, x)),
      y: Math.max(minY, Math.min(maxY, y))
    };
  }

  function updateAimToward(px, py, fine = false) {
    const cue = getCueBall();
    if (!cue || cue.pocketed) return;
    const targetAngle = Math.atan2(py - cue.y, px - cue.x);
    if (fine) {
      let diff = targetAngle - game.aimAngle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      game.aimAngle += diff * 0.2;
    } else {
      game.aimAngle = targetAngle;
    }
  }

  function fireCurrentShot() {
    if (game.powerPct < CANCEL_POWER_PCT) {
      game.powerPct = 0;
      updatePowerUI(0);
      game.phase = 'AIMING';
      return;
    }
    const norm = game.powerPct / 100;
    // Curva quadrática suave para tacadas fracas serem realmente controláveis e fortes explosivas
    const speed = MIN_SHOT_SPEED + (MAX_SHOT_SPEED - MIN_SHOT_SPEED) * Math.pow(norm, 1.35);
    game.cueStrikePower = game.powerPct;
    game.pendingStrikeSpeed = speed;
    game.cueStrikeAnim = 0;
    game.phase = 'CUE_STRIKE';
  }

  function updatePowerUI(pct) {
    const clamped = Math.max(0, Math.min(100, Math.round(pct)));
    game.powerPct = clamped;
    el.powerFill.style.width = `${clamped}%`;
    el.powerPercent.textContent = `${clamped}%`;
    el.powerTrack.setAttribute('aria-valuenow', String(clamped));

    if (clamped < 35) el.powerFill.style.backgroundColor = '#00C2A8';
    else if (clamped < 72) el.powerFill.style.backgroundColor = '#FFD600';
    else el.powerFill.style.backgroundColor = '#FF5E5B';

    if (clamped > 0 && clamped < CANCEL_POWER_PCT) {
      el.powerHint.textContent = 'Solte abaixo de 4% para cancelar';
    } else if (clamped >= CANCEL_POWER_PCT) {
      el.powerHint.textContent = 'Solte para tacar!';
    } else {
      el.powerHint.textContent = 'Arraste aqui ou recue na mesa para tacar';
    }
  }

  // Eventos no Canvas
  el.canvas.addEventListener('pointerdown', (ev) => {
    if (game.paused || game.activeScreen !== 'game') return;
    SoundEngine.unlock();
    const pos = canvasCoordsFromEvent(ev);
    game.pointer.isTouch = ev.pointerType === 'touch';

    if (game.phase === 'BALL_IN_HAND') {
      const clamped = clampCuePlacement(pos.x, pos.y);
      const cue = getCueBall();
      if (cue) {
        cue.x = clamped.x;
        cue.y = clamped.y;
      }
      game.pointer.placingValid = isPositionFreeForCue(clamped.x, clamped.y, 0);
      if (game.pointer.isTouch) {
        game.pointer.down = true;
        game.pointer.mode = 'place-ball';
        el.canvas.setPointerCapture(ev.pointerId);
      } else {
        if (game.pointer.placingValid) {
          SoundEngine.uiClick();
          game.phase = 'AIMING';
          updateHUD();
        } else {
          showToast('Espaço ocupado por outra bola! Escolha um ponto livre.', false, 2000);
        }
      }
      return;
    }

    if (game.phase === 'AIMING') {
      game.pointer.down = true;
      game.pointer.startX = pos.x;
      game.pointer.startY = pos.y;
      if (game.pointer.isTouch) {
        // No celular: arrastar no pano ajusta a mira; puxar a barra de força dispara
        game.pointer.mode = 'touch-aim';
        updateAimToward(pos.x, pos.y);
      } else {
        // No mouse: trava o ângulo e puxa para trás para carregar força
        game.pointer.mode = 'canvas-charge';
        game.phase = 'CHARGING';
        updatePowerUI(0);
      }
      el.canvas.setPointerCapture(ev.pointerId);
    }
  });

  el.canvas.addEventListener('pointermove', (ev) => {
    if (game.paused || game.activeScreen !== 'game') return;
    const pos = canvasCoordsFromEvent(ev);

    if (game.phase === 'BALL_IN_HAND') {
      if (!game.pointer.isTouch || game.pointer.mode === 'place-ball') {
        const clamped = clampCuePlacement(pos.x, pos.y);
        const cue = getCueBall();
        if (cue) {
          cue.x = clamped.x;
          cue.y = clamped.y;
        }
        game.pointer.placingValid = isPositionFreeForCue(clamped.x, clamped.y, 0);
      }
      return;
    }

    if (game.phase === 'AIMING' && (!game.pointer.down || game.pointer.mode === 'touch-aim')) {
      updateAimToward(pos.x, pos.y, ev.shiftKey);
      return;
    }

    if (game.phase === 'CHARGING' && game.pointer.mode === 'canvas-charge') {
      // Calcula o recuo ao longo do eixo oposto à mira
      const pullVecX = pos.x - game.pointer.startX;
      const pullVecY = pos.y - game.pointer.startY;
      const backX = -Math.cos(game.aimAngle);
      const backY = -Math.sin(game.aimAngle);
      const projected = pullVecX * backX + pullVecY * backY;
      const pullDist = Math.max(0, Math.min(MAX_PULL_PX, projected));
      const pct = (pullDist / MAX_PULL_PX) * 100;
      updatePowerUI(pct);
    }
  });

  el.canvas.addEventListener('pointerup', (ev) => {
    if (!game.pointer.down) return;
    game.pointer.down = false;

    if (game.pointer.mode === 'place-ball' && game.phase === 'BALL_IN_HAND') {
      if (game.pointer.placingValid) {
        SoundEngine.uiClick();
        game.phase = 'AIMING';
        updateHUD();
      } else {
        showToast('Solte em um local livre da mesa!', false, 1800);
      }
    } else if (game.pointer.mode === 'canvas-charge' && game.phase === 'CHARGING') {
      fireCurrentShot();
    }

    game.pointer.mode = 'none';
    if (el.canvas.hasPointerCapture(ev.pointerId)) {
      el.canvas.releasePointerCapture(ev.pointerId);
    }
  });

  el.canvas.addEventListener('pointercancel', () => {
    game.pointer.down = false;
    game.pointer.mode = 'none';
    if (game.phase === 'CHARGING') {
      updatePowerUI(0);
      game.phase = 'AIMING';
    }
  });

  // Barra de força interativa (funciona perfeitamente no celular e também no mouse!)
  let barDragging = false;
  el.powerTrack.addEventListener('pointerdown', (ev) => {
    if (game.paused || (game.phase !== 'AIMING' && game.phase !== 'CHARGING')) return;
    SoundEngine.unlock();
    barDragging = true;
    game.phase = 'CHARGING';
    el.powerTrack.setPointerCapture(ev.pointerId);
    updatePowerFromBarEvent(ev);
  });

  el.powerTrack.addEventListener('pointermove', (ev) => {
    if (!barDragging) return;
    updatePowerFromBarEvent(ev);
  });

  el.powerTrack.addEventListener('pointerup', (ev) => {
    if (!barDragging) return;
    barDragging = false;
    if (el.powerTrack.hasPointerCapture(ev.pointerId)) {
      el.powerTrack.releasePointerCapture(ev.pointerId);
    }
    fireCurrentShot();
  });

  function updatePowerFromBarEvent(ev) {
    const rect = el.powerTrack.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
    updatePowerUI(ratio * 100);
  }

  // Controle de efeito na bola branca
  let spinDragging = false;
  function setSpin(sx, sy) {
    const mag = Math.hypot(sx, sy);
    const maxR = 0.85;
    if (mag > maxR) {
      sx = (sx / mag) * maxR;
      sy = (sy / mag) * maxR;
    }
    game.spinX = sx;
    game.spinY = sy;
    el.spinMarker.style.left = `${50 + sx * 42}%`;
    el.spinMarker.style.top = `${50 - sy * 42}%`;

    const parts = [];
    if (sy > 0.22) parts.push('Acomp.');
    else if (sy < -0.22) parts.push('Retorno');
    if (sx < -0.22) parts.push('Esq.');
    else if (sx > 0.22) parts.push('Dir.');
    el.spinLabel.textContent = parts.length ? parts.join(' + ') : 'Centro';
  }

  function resetSpin() {
    setSpin(0, 0);
  }

  function updateSpinFromPad(ev) {
    const rect = el.spinPad.getBoundingClientRect();
    const nx = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = -(((ev.clientY - rect.top) / rect.height) * 2 - 1);
    setSpin(nx, ny);
  }

  el.spinPad.addEventListener('pointerdown', (ev) => {
    spinDragging = true;
    el.spinPad.setPointerCapture(ev.pointerId);
    updateSpinFromPad(ev);
  });
  el.spinPad.addEventListener('pointermove', (ev) => {
    if (spinDragging) updateSpinFromPad(ev);
  });
  el.spinPad.addEventListener('pointerup', () => { spinDragging = false; });

  document.getElementById('btn-reset-spin').addEventListener('click', () => {
    SoundEngine.uiClick();
    resetSpin();
  });

  document.querySelectorAll('.spin-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      SoundEngine.uiClick();
      setSpin(Number(btn.dataset.sx), Number(btn.dataset.sy));
    });
  });

  // Ajuste fino via teclado
  window.addEventListener('keydown', (ev) => {
    if (game.activeScreen !== 'game' || game.paused) return;
    if (ev.key === 'Escape') {
      togglePause();
      return;
    }
    if (game.phase === 'AIMING') {
      const step = ev.shiftKey ? 0.004 : 0.02;
      if (ev.key === 'ArrowLeft' || ev.key === 'a' || ev.key === 'A') {
        game.aimAngle -= step;
      } else if (ev.key === 'ArrowRight' || ev.key === 'd' || ev.key === 'D') {
        game.aimAngle += step;
      }
    }
  });

  /* ==========================================================================
   * 15. ATUALIZAÇÃO DO HUD E RESPONSIVIDADE DO CANVAS
   * ========================================================================== */
  function updateHUD() {
    const p1 = game.series.players[0];
    const p2 = game.series.players[1];

    el.hudP1Name.textContent = p1.name;
    el.hudP2Name.textContent = p2.name;
    el.hudP1Score.textContent = String(p1.wins);
    el.hudP2Score.textContent = String(p2.wins);

    el.hudP1.classList.toggle('is-active', game.currentPlayer === 0);
    el.hudP2.classList.toggle('is-active', game.currentPlayer === 1);

    el.hudSeriesLabel.textContent = `MELHOR DE ${game.series.bestOf} • JOGO ${game.series.gameNumber}`;

    if (game.phase === 'BALL_IN_HAND') {
      el.hudTableState.textContent = 'BOLA NA MÃO';
      el.hudTableState.style.background = '#FFD600';
    } else if (game.isBreakShot) {
      el.hudTableState.textContent = 'ABERTURA';
      el.hudTableState.style.background = '#00C2A8';
    } else if (game.tableOpen) {
      el.hudTableState.textContent = 'MESA ABERTA';
      el.hudTableState.style.background = '#00C2A8';
    } else {
      el.hudTableState.textContent = 'EM JOGO';
      el.hudTableState.style.background = '#E2E8F0';
    }

    el.shotCounter.textContent = `Tacadas: ${game.totalShots}`;

    renderPlayerGroupHUD(0, el.hudP1Group, el.hudP1Balls);
    renderPlayerGroupHUD(1, el.hudP2Group, el.hudP2Balls);

    // Dica contextual
    if (game.phase === 'BALL_IN_HAND') {
      el.controlsHint.textContent = game.ballInHandKitchenOnly
        ? 'Clique na área amarela de saída para posicionar a bola branca.'
        : 'Bola na mão! Clique em qualquer espaço livre da mesa para posicionar a branca.';
    } else if (game.phase === 'SIMULATING') {
      el.controlsHint.textContent = 'Aguarde todas as bolas pararem completamente...';
    } else {
      el.controlsHint.textContent = 'Mouse: mire e arraste para trás para tacar. Celular: toque na mesa para mirar e arraste a barra de força.';
    }
  }

  function renderPlayerGroupHUD(playerIdx, labelEl, listEl) {
    const p = game.series.players[playerIdx];
    listEl.innerHTML = '';

    if (game.tableOpen || !p.group) {
      labelEl.textContent = 'Mesa Aberta';
      return;
    }

    const nums = p.group === 'solids' ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15];
    const allCleared = isGroupCleared(playerIdx);
    labelEl.textContent = allCleared ? 'Bola 8!' : (p.group === 'solids' ? 'Lisas (1-7)' : 'Listradas (9-15)');

    const toShow = allCleared ? [8] : nums;
    for (const num of toShow) {
      const ball = game.balls.find(b => b.num === num);
      const dot = document.createElement('span');
      dot.className = 'mini-ball' + (ball && ball.pocketed ? ' is-pocketed' : '');
      dot.textContent = String(num);
      const col = BALL_COLORS[num];
      if (num >= 9 && num <= 15) {
        dot.style.background = `linear-gradient(180deg, #fff 24%, ${col} 24%, ${col} 76%, #fff 76%)`;
      } else {
        dot.style.background = col;
        if (num === 2 || num === 4 || num === 7 || num === 8) dot.style.color = '#fff';
      }
      listEl.appendChild(dot);
    }
  }

  function resizeCanvasDisplay() {
    const wrapper = document.getElementById('canvas-wrapper');
    if (!wrapper) return;
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    if (w <= 0 || h <= 0) return;

    const aspect = LOGICAL_W / LOGICAL_H;
    let targetW = w;
    let targetH = targetW / aspect;
    if (targetH > h) {
      targetH = h;
      targetW = targetH * aspect;
    }
    el.canvas.style.width = `${Math.floor(targetW)}px`;
    el.canvas.style.height = `${Math.floor(targetH)}px`;
  }

  window.addEventListener('resize', resizeCanvasDisplay);

  /* ==========================================================================
   * 16. CONFIGURAÇÕES, ESTATÍSTICAS E EVENTOS DE UI
   * ========================================================================== */
  function syncSettingsUI() {
    el.settingVolume.value = String(store.settings.volume);
    el.settingVolumeVal.textContent = `${store.settings.volume}%`;
    el.settingMute.textContent = store.settings.muted ? 'SILENCIADO' : 'SOM ATIVO';
    el.settingMute.classList.toggle('nb-btn-danger', store.settings.muted);
    el.settingMute.classList.toggle('nb-btn-yellow', !store.settings.muted);
    el.settingAim.value = store.settings.aimGuide;
    el.settingFelt.value = store.settings.feltColor;
  }

  function renderSetupSuggestions() {
    const renderInto = (container, inputEl) => {
      container.innerHTML = '';
      store.profiles.slice(-6).forEach(prof => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'profile-chip';
        btn.textContent = prof.name;
        btn.addEventListener('click', () => {
          SoundEngine.uiClick();
          inputEl.value = prof.name;
        });
        container.appendChild(btn);
      });
    };
    renderInto(el.p1Suggestions, el.inputP1);
    renderInto(el.p2Suggestions, el.inputP2);
  }

  function renderStatsModal() {
    el.statsBody.innerHTML = '';
    if (store.profiles.length === 0) {
      el.statsBody.innerHTML = '<div class="nb-panel">Nenhuma partida registrada ainda. Jogue uma partida para gerar estatísticas!</div>';
      return;
    }

    const sorted = [...store.profiles].sort((a, b) => b.wins - a.wins || b.gamesPlayed - a.gamesPlayed);
    for (const p of sorted) {
      const card = document.createElement('div');
      card.className = 'stat-player-card nb-panel';
      const winRate = p.gamesPlayed > 0 ? Math.round((p.wins / p.gamesPlayed) * 100) : 0;
      const bestText = p.bestWinShots !== null ? `${p.bestWinShots} tac.` : '-';
      card.innerHTML = `
        <div class="stat-player-head">
          <strong>${escapeHTML(p.name)}</strong>
          <span class="nb-badge nb-badge-yellow">${winRate}% aproveitamento</span>
        </div>
        <div class="stat-grid">
          <div class="stat-cell"><span>PARTIDAS</span><strong>${p.gamesPlayed}</strong></div>
          <div class="stat-cell"><span>VITÓRIAS</span><strong>${p.wins}</strong></div>
          <div class="stat-cell"><span>DERROTAS</span><strong>${p.losses}</strong></div>
          <div class="stat-cell"><span>ENCACAP.</span><strong>${p.ballsPocketed}</strong></div>
          <div class="stat-cell"><span>FALTAS</span><strong>${p.fouls}</strong></div>
          <div class="stat-cell"><span>MELHOR</span><strong>${bestText}</strong></div>
        </div>
      `;
      el.statsBody.appendChild(card);
    }
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function togglePause() {
    if (game.activeScreen !== 'game' || game.phase === 'GAME_OVER') return;
    game.paused = !game.paused;
    if (game.paused) openModal(el.modals.pause);
    else closeModal(el.modals.pause);
  }

  // Botões Menu Principal
  document.getElementById('btn-menu-play').addEventListener('click', () => {
    SoundEngine.uiClick();
    el.errorP1.textContent = '';
    el.errorP2.textContent = '';
    el.inputP1.classList.remove('input-error');
    el.inputP2.classList.remove('input-error');
    showScreen('setup');
  });
  document.getElementById('btn-menu-rules').addEventListener('click', () => {
    SoundEngine.uiClick();
    openModal(el.modals.rules);
  });
  document.getElementById('btn-menu-settings').addEventListener('click', () => {
    SoundEngine.uiClick();
    syncSettingsUI();
    openModal(el.modals.settings);
  });
  document.getElementById('btn-menu-stats').addEventListener('click', () => {
    SoundEngine.uiClick();
    renderStatsModal();
    openModal(el.modals.stats);
  });
  document.getElementById('btn-menu-exit').addEventListener('click', () => {
    SoundEngine.uiClick();
    openModal(el.modals.exit);
  });
  document.getElementById('btn-exit-return').addEventListener('click', () => {
    SoundEngine.uiClick();
    window.location.href = "../index.html";
    closeModal(el.modals.exit);
  });

  // Cadastro dos Jogadores
  document.getElementById('btn-setup-back').addEventListener('click', () => {
    SoundEngine.uiClick();
    showScreen('menu');
  });

  el.setupForm.addEventListener('submit', (ev) => {
    ev.preventDefault();
    SoundEngine.uiClick();

    const n1 = el.inputP1.value.trim();
    const n2 = el.inputP2.value.trim();
    let valid = true;

    el.errorP1.textContent = '';
    el.errorP2.textContent = '';
    el.inputP1.classList.remove('input-error');
    el.inputP2.classList.remove('input-error');

    if (!n1) {
      el.errorP1.textContent = 'Insira o nome do Jogador 1.';
      el.inputP1.classList.add('input-error');
      valid = false;
    }
    if (!n2) {
      el.errorP2.textContent = 'Insira o nome do Jogador 2.';
      el.inputP2.classList.add('input-error');
      valid = false;
    }
    if (!valid) return;

    const bestOf = Number(el.setupForm.querySelector('input[name="series-best"]:checked').value) || 1;
    const [p1Prof, p2Prof] = resolveMatchProfiles(n1, n2);
    startSeries(p1Prof, p2Prof, bestOf);
  });

  // HUD durante o jogo
  document.getElementById('btn-game-rules').addEventListener('click', () => {
    SoundEngine.uiClick();
    game.paused = true;
    openModal(el.modals.rules);
  });
  document.getElementById('btn-game-settings').addEventListener('click', () => {
    SoundEngine.uiClick();
    game.paused = true;
    syncSettingsUI();
    openModal(el.modals.settings);
  });
  document.getElementById('btn-game-pause').addEventListener('click', () => {
    SoundEngine.uiClick();
    togglePause();
  });

  // Menu de Pausa
  document.getElementById('btn-pause-resume').addEventListener('click', () => {
    SoundEngine.uiClick();
    game.paused = false;
    closeModal(el.modals.pause);
  });
  document.getElementById('btn-pause-restart').addEventListener('click', () => {
    SoundEngine.uiClick();
    askConfirm('REINICIAR PARTIDA', 'Deseja reiniciar a partida atual? O placar da série será mantido.', () => {
      startSingleGame();
    });
  });
  document.getElementById('btn-pause-rules').addEventListener('click', () => {
    SoundEngine.uiClick();
    openModal(el.modals.rules);
  });
  document.getElementById('btn-pause-settings').addEventListener('click', () => {
    SoundEngine.uiClick();
    syncSettingsUI();
    openModal(el.modals.settings);
  });
  document.getElementById('btn-pause-menu').addEventListener('click', () => {
    SoundEngine.uiClick();
    askConfirm('ABANDONAR PARTIDA', 'Tem certeza que deseja sair da partida atual e voltar ao menu principal?', () => {
      closeAllModals();
      game.paused = false;
      game.phase = 'IDLE';
      showScreen('menu');
    });
  });

  // Vitória
  el.btnVictoryNext.addEventListener('click', () => {
    SoundEngine.uiClick();
    game.series.gameNumber++;
    game.series.starterIndex = 1 - game.series.starterIndex;
    startSingleGame();
  });
  el.btnVictoryRematch.addEventListener('click', () => {
    SoundEngine.uiClick();
    game.series.players[0].wins = 0;
    game.series.players[1].wins = 0;
    game.series.gameNumber = 1;
    game.series.starterIndex = Math.random() < 0.5 ? 0 : 1;
    startSingleGame();
  });
  document.getElementById('btn-victory-menu').addEventListener('click', () => {
    SoundEngine.uiClick();
    closeAllModals();
    showScreen('menu');
  });

  // Fechar modais auxiliares
  document.getElementById('btn-rules-close').addEventListener('click', () => {
    SoundEngine.uiClick();
    closeModal(el.modals.rules);
    if (game.activeScreen === 'game' && !el.modals.pause.classList.contains('is-open')) {
      game.paused = false;
    }
  });
  document.getElementById('btn-settings-close').addEventListener('click', () => {
    SoundEngine.uiClick();
    closeModal(el.modals.settings);
    if (game.activeScreen === 'game' && !el.modals.pause.classList.contains('is-open')) {
      game.paused = false;
    }
  });
  document.getElementById('btn-stats-close').addEventListener('click', () => {
    SoundEngine.uiClick();
    closeModal(el.modals.stats);
  });

  // Reiniciar estatísticas com confirmação
  document.getElementById('btn-stats-reset').addEventListener('click', () => {
    SoundEngine.uiClick();
    askConfirm('REINICIAR ESTATÍSTICAS', 'Todos os registros salvos de partidas e jogadores serão apagados permanentemente.', () => {
      store.profiles = [];
      saveStore();
      renderStatsModal();
    });
  });

  // Modal de Confirmação
  el.btnConfirmCancel.addEventListener('click', () => {
    SoundEngine.uiClick();
    confirmCallback = null;
    closeModal(el.modals.confirm);
  });
  el.btnConfirmOk.addEventListener('click', () => {
    SoundEngine.uiClick();
    closeModal(el.modals.confirm);
    if (confirmCallback) {
      const fn = confirmCallback;
      confirmCallback = null;
      fn();
    }
  });

  // Controles de Configurações
  el.settingMute.addEventListener('click', () => {
    store.settings.muted = !store.settings.muted;
    SoundEngine.applyVolume();
    SoundEngine.uiClick();
    saveStore();
    syncSettingsUI();
  });
  el.settingVolume.addEventListener('input', () => {
    store.settings.volume = Number(el.settingVolume.value);
    if (store.settings.volume > 0 && store.settings.muted) {
      store.settings.muted = false;
    }
    SoundEngine.applyVolume();
    saveStore();
    syncSettingsUI();
  });
  el.settingAim.addEventListener('change', () => {
    store.settings.aimGuide = el.settingAim.value;
    saveStore();
  });
  el.settingFelt.addEventListener('change', () => {
    store.settings.feltColor = el.settingFelt.value;
    saveStore();
    if (game.activeScreen === 'game') render();
  });

  // Inicialização
  syncSettingsUI();
  requestAnimationFrame(mainLoop);
})();