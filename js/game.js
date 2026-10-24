const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const MAX_LIVES = 3;
const MAX_AMMO = 10;
const PLAYER_SPEED = 260;
const JUMP_VELOCITY = -520;
const BULLET_SPEED = 560;
const SHOOT_COOLDOWN = 220;
const ENEMY_SPEED = 70;
const ENEMY_BULLET_SPEED = 180;
const DASH_SPEED = 620;
const DASH_DURATION = 150;
const DASH_COOLDOWN = 950;
const TIME_CHALLENGE_SECONDS = 300;
const BOSS_LIVES = 5;
const PROGRESS_STORAGE_KEY = "platformer-game-progress";
const LEVELS = [
  { id: 1, name: "Neonový sektor", shortName: "NEON", description: "Město pod elektrickým nebem", accent: 0x35d6e8, sky: 0x07172f, horizon: 0x172554, ground: 0x0f766e, platformTint: 0xffffff },
  { id: 2, name: "Ledová citadela", shortName: "LED", description: "Mrazivé věže a skleněné mosty", accent: 0x93c5fd, sky: 0x0c1a2f, horizon: 0x1e3a5f, ground: 0x2563eb, platformTint: 0xdbeafe },
  { id: 3, name: "Lávové slévárny", shortName: "LÁVA", description: "Žár, kov a roztavené jádro", accent: 0xfb923c, sky: 0x260b0b, horizon: 0x7c2d12, ground: 0xdc2626, platformTint: 0xffedd5 },
  { id: 4, name: "Hvězdná trhlina", shortName: "PRÁZDNO", description: "Poslední cesta mezi hvězdami", accent: 0xc4b5fd, sky: 0x130d2b, horizon: 0x312e81, ground: 0x7c3aed, platformTint: 0xede9fe },
];
const DIFFICULTIES = {
  easy: { label: "LEHKÁ", startingLives: 3, hurtDelay: 1200 },
  normal: { label: "NORMÁLNÍ", startingLives: 3, hurtDelay: 900 },
  hard: { label: "TĚŽKÁ", startingLives: 2, hurtDelay: 650 },
};

function playTone(scene, frequency, duration, type = "sine", volume = 0.04) {
  const context = scene.sound?.context;

  if (!context || context.state === "suspended") {
    return;
  }

  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, context.currentTime);
  gain.gain.setValueAtTime(volume, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + duration);
}

function formatDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function loadProgress() {
  try {
    const progress = JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) ?? {};
    return {
      wins: progress.wins ?? 0,
      bestTime: progress.bestTime ?? null,
      unlockedLevel: progress.unlockedLevel ?? (progress.unlockedSector >= 2 ? 2 : 1),
    };
  } catch (_error) {
    return { wins: 0, bestTime: null, unlockedLevel: 1 };
  }
}

function getLevel(levelId) {
  return LEVELS.find((level) => level.id === levelId) ?? LEVELS[0];
}

const LEVEL_LAYOUTS = {
  1: {
    width: 3200,
    platforms: [[250, 520, 4], [700, 470, 2], [1050, 470, 2], [1450, 390, 3], [1900, 440, 2], [2400, 350, 3], [2850, 520, 5]],
    movingPlatforms: [{ x: 1450, y: 355, width: 128, amplitude: 90, speed: 0.0012, axis: "x" }],
    coins: [[110, 470], [260, 470], [650, 420], [760, 420], [1000, 420], [1100, 420], [1360, 340], [1460, 340], [1580, 340], [1860, 390], [1960, 390], [2310, 300], [2410, 300], [2530, 300], [2820, 470]],
    health: [[700, 420], [1900, 390]], ammo: [[1050, 420], [2400, 300]], weapon: [[1450, 340]], spikes: [[420, 488], [2230, 488]],
    barriers: [{ x: 2450, lives: 3 }], gates: [{ gateX: 2700, switchX: 2400, switchY: 305 }], checkpoints: [[1900, 375, 1900, 390]],
    enemies: [
      { x: 700, y: 425, texture: "enemy", type: "patrol", lives: 2, minX: 620, maxX: 780, speed: 70 },
      { x: 1450, y: 345, texture: "hopper", type: "hopper", lives: 1, minX: 1320, maxX: 1580, speed: 90, nextActionAt: 700 },
      { x: 1900, y: 400, texture: "sentry", type: "sentry", lives: 2, nextActionAt: 1200 },
    ],
  },
  2: {
    width: 3800,
    platforms: [[250, 520, 4], [540, 430, 1], [740, 340, 1], [960, 250, 2], [1260, 180, 1], [1540, 250, 1], [1780, 350, 1], [2020, 450, 2], [2380, 520, 4], [2750, 420, 2], [3050, 320, 1], [3330, 240, 1], [3600, 520, 4]],
    movingPlatforms: [{ x: 1480, y: 350, width: 128, amplitude: 105, speed: 0.001, axis: "y" }, { x: 2700, y: 320, width: 128, amplitude: 110, speed: 0.0011, axis: "x" }],
    coins: [[120, 470], [250, 470], [540, 380], [740, 290], [920, 200], [1000, 200], [1260, 130], [1540, 200], [1780, 300], [2020, 400], [2120, 400], [2340, 470], [2440, 470], [2720, 370], [2810, 370], [3050, 270], [3330, 190], [3590, 470]],
    health: [[1260, 130], [2380, 470]], ammo: [[960, 200], [3050, 270]], weapon: [[1540, 200]], spikes: [[410, 488], [2480, 488]],
    barriers: [{ x: 2450, lives: 3 }], gates: [{ gateX: 3500, switchX: 3330, switchY: 195 }], checkpoints: [[2020, 405, 2020, 420], [2750, 375, 2750, 390]],
    enemies: [
      { x: 960, y: 205, texture: "hopper", type: "hopper", lives: 1, minX: 850, maxX: 1070, speed: 100, nextActionAt: 700 },
      { x: 1540, y: 205, texture: "enemy", type: "patrol", lives: 2, minX: 1480, maxX: 1600, speed: 75 },
      { x: 2750, y: 380, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 1300 },
      { x: 3330, y: 195, texture: "enemy", type: "patrol", lives: 2, minX: 3270, maxX: 3390, speed: 95 },
    ],
  },
  3: {
    width: 4500,
    // Láva: krátké kovové ostrůvky, strmé schody a dvě proměnlivé plošiny nad žárem.
    platforms: [[220, 520, 3], [600, 420, 1], [850, 300, 1], [1120, 420, 1], [1400, 250, 2], [1750, 400, 1], [2000, 520, 3], [2400, 360, 1], [2700, 240, 2], [3100, 390, 1], [3400, 520, 3], [3800, 330, 2], [4200, 520, 4]],
    movingPlatforms: [{ x: 1500, y: 335, width: 128, amplitude: 80, speed: 0.0012, axis: "y" }, { x: 2900, y: 330, width: 128, amplitude: 110, speed: 0.0011, axis: "x" }],
    coins: [[110, 470], [250, 470], [600, 370], [850, 250], [1120, 370], [1340, 200], [1450, 200], [1690, 350], [1920, 470], [2050, 470], [2400, 310], [2640, 190], [2750, 190], [3100, 340], [3330, 470], [3450, 470], [3740, 280], [3840, 280], [4160, 470]],
    health: [[1400, 200], [3400, 470]], ammo: [[1120, 370], [3800, 280]], weapon: [[2700, 190]], spikes: [[430, 488], [2110, 488], [3500, 488]],
    barriers: [{ x: 2050, lives: 4 }, { x: 3400, lives: 4 }], gates: [{ gateX: 4000, switchX: 3800, switchY: 285 }], checkpoints: [[2000, 455, 2000, 470], [3400, 455, 3400, 470]],
    enemies: [
      { x: 600, y: 375, texture: "enemy", type: "patrol", lives: 2, minX: 540, maxX: 660, speed: 90 },
      { x: 1400, y: 205, texture: "hopper", type: "hopper", lives: 2, minX: 1280, maxX: 1520, speed: 105, nextActionAt: 800 },
      { x: 1750, y: 360, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 1200 },
      { x: 2700, y: 195, texture: "enemy", type: "patrol", lives: 2, minX: 2580, maxX: 2820, speed: 105 },
      { x: 3100, y: 350, texture: "hopper", type: "hopper", lives: 2, minX: 3040, maxX: 3160, speed: 110, nextActionAt: 1650 },
      { x: 3800, y: 290, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 1900 },
    ],
  },
  4: {
    width: 4800,
    // Prázdno: izolované plovoucí ostrovy, velké mezery a dlouhé výškové skoky.
    platforms: [[220, 520, 3], [580, 350, 1], [900, 220, 1], [1250, 380, 1], [1580, 180, 1], [1920, 330, 1], [2250, 520, 3], [2620, 260, 1], [3000, 140, 1], [3350, 310, 1], [3700, 500, 2], [4100, 270, 1], [4450, 520, 4]],
    movingPlatforms: [{ x: 1450, y: 300, width: 128, amplitude: 105, speed: 0.0011, axis: "x" }, { x: 2450, y: 350, width: 128, amplitude: 85, speed: 0.001, axis: "y" }, { x: 3900, y: 320, width: 128, amplitude: 120, speed: 0.0011, axis: "x" }],
    coins: [[100, 470], [230, 470], [620, 300], [900, 170], [1195, 330], [1580, 130], [1870, 280], [2180, 470], [2300, 470], [2620, 210], [2950, 90], [3300, 260], [3650, 450], [3750, 450], [4050, 220], [4410, 470]],
    health: [[900, 170], [3700, 450]], ammo: [[1580, 130], [4100, 220]], weapon: [[3000, 90]], spikes: [[390, 488], [2380, 488]],
    barriers: [{ x: 2250, lives: 4 }, { x: 4450, lives: 5 }], gates: [{ gateX: 4300, switchX: 4100, switchY: 225 }], checkpoints: [[2250, 455, 2250, 470], [3700, 435, 3700, 450]],
    enemies: [
      { x: 580, y: 305, texture: "enemy", type: "patrol", lives: 2, minX: 520, maxX: 640, speed: 90 },
      { x: 1250, y: 335, texture: "hopper", type: "hopper", lives: 2, minX: 1190, maxX: 1310, speed: 110, nextActionAt: 700 },
      { x: 1920, y: 290, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 1300 },
      { x: 3000, y: 95, texture: "enemy", type: "patrol", lives: 2, minX: 2940, maxX: 3060, speed: 110 },
      { x: 3350, y: 270, texture: "hopper", type: "hopper", lives: 2, minX: 3290, maxX: 3410, speed: 115, nextActionAt: 1800 },
      { x: 4100, y: 230, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 2100 },
    ],
  },
};

function getLevelLayout(levelId) {
  return LEVEL_LAYOUTS[levelId] ?? LEVEL_LAYOUTS[1];
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

const UI_COLORS = {
  panel: 0x0b1224,
  panelEdge: 0x263a60,
  text: "#e6f4ff",
  muted: "#8ea3c7",
  cyan: 0x35d6e8,
  purple: 0x9b7cff,
  green: 0x41d6a0,
  red: 0xff7087,
  yellow: 0xffcc66,
};

function addSceneBackdrop(scene, accent = UI_COLORS.cyan) {
  scene.cameras.main.setBackgroundColor("#050914");
  const backdrop = scene.add.graphics();
  backdrop.fillStyle(0x050914);
  backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
  backdrop.fillStyle(accent, 0.13);
  backdrop.fillCircle(130, 90, 180);
  backdrop.fillStyle(UI_COLORS.purple, 0.1);
  backdrop.fillCircle(830, 450, 220);
  backdrop.lineStyle(1, 0x243757, 0.28);
  for (let x = -100; x < GAME_WIDTH + 140; x += 70) {
    backdrop.lineBetween(x, 540, x + 170, 330);
  }
  for (let y = 350; y < 560; y += 34) {
    backdrop.lineBetween(0, y, GAME_WIDTH, y);
  }
}

function createUiButton(scene, { x, y, width = 280, label, accent = UI_COLORS.cyan, onClick, secondary = false }) {
  const height = 54;
  const fill = secondary ? 0x15213a : accent;
  const labelColor = secondary ? UI_COLORS.text : "#07111f";
  const button = scene.add.rectangle(x, y, width, height, fill)
    .setStrokeStyle(1, secondary ? UI_COLORS.panelEdge : 0xb9f7ff)
    .setInteractive({ useHandCursor: true });
  const text = scene.add.text(x, y, label, {
    fontFamily: "system-ui, sans-serif",
    fontSize: "17px",
    fontStyle: "bold",
    color: labelColor,
    letterSpacing: 1,
  }).setOrigin(0.5).setInteractive({ useHandCursor: true });
  const activate = () => onClick();
  const hoverIn = () => {
    button.setScale(1.025);
    text.setScale(1.025);
    if (secondary) button.setFillStyle(0x20345a);
  };
  const hoverOut = () => {
    button.setScale(1);
    text.setScale(1);
    if (secondary) button.setFillStyle(fill);
  };
  [button, text].forEach((item) => {
    item.on("pointerdown", activate);
    item.on("pointerover", hoverIn);
    item.on("pointerout", hoverOut);
  });
  return { button, text };
}

function createUiCard(scene, x, y, width, height) {
  scene.add.rectangle(x, y, width, height, UI_COLORS.panel, 0.94)
    .setStrokeStyle(1, UI_COLORS.panelEdge);
  scene.add.rectangle(x - width / 2 + 1, y - height / 2 + 1, width - 2, 3, UI_COLORS.cyan, 0.72);
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.selectedDifficulty = "normal";
    this.progress = loadProgress();
    this.selectedLevel = this.progress.unlockedLevel;
    addSceneBackdrop(this);

    this.add.text(480, 78, "NEON HORIZON", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#67e8f9",
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(480, 126, "Skok do dobrodružství", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "42px",
      fontStyle: "bold",
      color: "#e0f2fe",
    }).setOrigin(0.5);

    this.add.text(480, 157, "Projdi cestu světy a odemykej další výpravy.", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: UI_COLORS.muted,
    }).setOrigin(0.5);

    createUiCard(this, 330, 316, 500, 270);
    createUiCard(this, 745, 316, 200, 270);

    this.add.text(330, 220, "MAPA VÝPRAVY", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#67e8f9",
      letterSpacing: 2,
    }).setOrigin(0.5);

    this.mapNodes = [];
    const mapPositions = [[155, 330], [275, 278], [400, 342], [510, 267]];
    const route = this.add.graphics();
    route.lineStyle(3, 0x365273, 0.8);
    mapPositions.slice(0, -1).forEach((point, index) => route.lineBetween(point[0], point[1], mapPositions[index + 1][0], mapPositions[index + 1][1]));
    LEVELS.forEach((level, index) => this.createMapNode(mapPositions[index][0], mapPositions[index][1], level));
    this.levelInfo = this.add.text(330, 411, "", {
      fontFamily: "system-ui, sans-serif", fontSize: "13px", color: UI_COLORS.muted, align: "center", wordWrap: { width: 430 },
    }).setOrigin(0.5);

    this.add.text(745, 220, "OBTÍŽNOST", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#67e8f9",
      letterSpacing: 2,
    }).setOrigin(0.5);
    this.difficultyButtons = [];
    [
      ["easy", "LEHKÁ", "Více času na chybu"],
      ["normal", "NORMÁLNÍ", "Doporučená volba"],
      ["hard", "TĚŽKÁ", "Rychlá reakce nutná"],
    ].forEach(([key, label, detail], index) => this.createDifficultyButton(745, 263 + index * 54, key, label, detail));

    const startGame = () => this.scene.start("MainScene", {
      difficulty: this.selectedDifficulty,
      level: this.selectedLevel,
    });
    createUiButton(this, { x: 480, y: 465, width: 330, label: "SPUSTIT VÝPRAVU", onClick: startGame });
    this.add.text(480, 512, `Rekord ${this.progress.bestTime === null ? "—" : formatDuration(this.progress.bestTime)}   •   Dokončení ${this.progress.wins}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      color: UI_COLORS.muted,
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", startGame);
    this.refreshMenuSelection();
  }

  createMapNode(x, y, level) {
    const unlocked = level.id <= this.progress.unlockedLevel;
    const ring = this.add.circle(x, y, 28, 0x0c1528).setStrokeStyle(3, unlocked ? level.accent : 0x334155);
    const core = this.add.circle(x, y, 17, unlocked ? level.accent : 0x1d2b42);
    const number = this.add.text(x, y, String(level.id), { fontFamily: "system-ui, sans-serif", fontSize: "17px", fontStyle: "bold", color: unlocked ? "#06101e" : "#64748b" }).setOrigin(0.5);
    const label = this.add.text(x, y + 42, level.shortName, { fontFamily: "system-ui, sans-serif", fontSize: "11px", fontStyle: "bold", color: unlocked ? UI_COLORS.text : "#52617b" }).setOrigin(0.5);
    if (unlocked) {
      ring.setInteractive({ useHandCursor: true });
      core.setInteractive({ useHandCursor: true });
      [ring, core, number, label].forEach((item) => item.on?.("pointerdown", () => { this.selectedLevel = level.id; this.refreshMenuSelection(); }));
    }
    this.mapNodes.push({ level, unlocked, ring, core, number, label });
  }

  createDifficultyButton(x, y, key, label, detail) {
    const button = this.add.rectangle(x, y, 160, 45, 0x14233e).setStrokeStyle(1, UI_COLORS.panelEdge).setInteractive({ useHandCursor: true });
    const labelText = this.add.text(x - 66, y - 8, label, { fontFamily: "system-ui, sans-serif", fontSize: "13px", fontStyle: "bold", color: UI_COLORS.text }).setOrigin(0, 0.5);
    const detailText = this.add.text(x - 66, y + 10, detail, { fontFamily: "system-ui, sans-serif", fontSize: "10px", color: UI_COLORS.muted }).setOrigin(0, 0.5);
    button.on("pointerdown", () => { this.selectedDifficulty = key; this.refreshMenuSelection(); });
    this.difficultyButtons.push({ key, button, labelText, detailText });
  }

  refreshMenuSelection() {
    this.mapNodes.forEach((item) => {
      const active = item.level.id === this.selectedLevel;
      item.ring.setStrokeStyle(active ? 5 : 3, active ? UI_COLORS.yellow : item.unlocked ? item.level.accent : 0x334155);
      item.core.setFillStyle(item.unlocked ? (active ? UI_COLORS.yellow : item.level.accent) : 0x1d2b42);
    });
    const selected = getLevel(this.selectedLevel);
    this.levelInfo.setText(`${selected.name}  ·  ${selected.description}`);
    this.difficultyButtons.forEach((item) => {
      const active = item.key === this.selectedDifficulty;
      item.button.setFillStyle(active ? 0x243d62 : 0x14233e);
      item.button.setStrokeStyle(active ? 2 : 1, active ? UI_COLORS.purple : UI_COLORS.panelEdge);
      item.labelText.setColor(active ? "#ddd6fe" : UI_COLORS.text);
    });
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.finalScore = data.score ?? 0;
    this.finalKills = data.kills ?? 0;
    this.finalTime = data.time ?? 0;
    this.difficulty = data.difficulty ?? "normal";
    this.level = data.level ?? 1;
  }

  create() {
    addSceneBackdrop(this, UI_COLORS.red);
    createUiCard(this, 480, 292, 520, 350);

    this.add.text(480, 164, "VÝPRAVA SKONČILA", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ff9bab",
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(480, 212, "Zkus to znovu", {
      fontFamily: "system-ui, sans-serif", fontSize: "38px", fontStyle: "bold", color: UI_COLORS.text,
    }).setOrigin(0.5);

    this.add.text(480, 274, `Mince  ${this.finalScore}    ·    Eliminace  ${this.finalKills}    ·    Čas  ${formatDuration(this.finalTime)}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      color: UI_COLORS.muted,
    }).setOrigin(0.5);

    const restartGame = () => this.scene.start("MainScene", { difficulty: this.difficulty, level: this.level });
    const returnToMenu = () => this.scene.start("MenuScene");

    createUiButton(this, { x: 480, y: 350, width: 330, label: "ZKUSIT ZNOVU", accent: UI_COLORS.red, onClick: restartGame });
    createUiButton(this, { x: 480, y: 418, width: 330, label: "ZPĚT DO HLAVNÍ NABÍDKY", onClick: returnToMenu, secondary: true });

    this.input.keyboard.once("keydown-ENTER", restartGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-ESC", returnToMenu);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    createUiButton(this, { x, y, label, accent: backgroundColor, onClick, secondary: false });
  }
}

class VictoryScene extends Phaser.Scene {
  constructor() {
    super("VictoryScene");
  }

  init(data) {
    this.finalScore = data.score ?? 0;
    this.finalKills = data.kills ?? 0;
    this.finalTime = data.time ?? 0;
    this.difficulty = data.difficulty ?? "normal";
    this.level = data.level ?? 1;
  }

  create() {
    addSceneBackdrop(this, UI_COLORS.green);
    createUiCard(this, 480, 292, 560, 370);

    this.add.text(480, 154, "SEKTOR ZAJIŠTĚN", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#8ff5c7",
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(480, 202, "Vítězství", { fontFamily: "system-ui, sans-serif", fontSize: "42px", fontStyle: "bold", color: UI_COLORS.text }).setOrigin(0.5);

    this.add.text(480, 210, "Posbíral/a jsi všechny mince a porazil/a bosse.", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      color: UI_COLORS.muted,
    }).setOrigin(0.5);

    this.add.text(480, 250, `Celkem mincí: ${this.finalScore}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fde68a",
    }).setOrigin(0.5);

    const challengeStatus = this.finalTime <= TIME_CHALLENGE_SECONDS ? "Časová výzva splněna!" : "Časová výzva: zkus to pod 5:00";
    this.add.text(480, 282, `Poražení nepřátelé: ${this.finalKills}  ·  Čas: ${formatDuration(this.finalTime)}  ·  ${DIFFICULTIES[this.difficulty].label}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: UI_COLORS.muted,
    }).setOrigin(0.5);

    this.add.text(480, 305, challengeStatus, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: this.finalTime <= TIME_CHALLENGE_SECONDS ? "#86efac" : "#cbd5e1",
    }).setOrigin(0.5);

    const restartGame = () => this.scene.start("MainScene", { difficulty: this.difficulty, level: this.level });
    const returnToMenu = () => this.scene.start("MenuScene");

    createUiButton(this, { x: 480, y: 374, width: 330, label: "HRÁT ZNOVU", accent: UI_COLORS.green, onClick: restartGame });
    createUiButton(this, { x: 480, y: 440, width: 330, label: "ZPĚT DO HLAVNÍ NABÍDKY", onClick: returnToMenu, secondary: true });

    this.input.keyboard.once("keydown-ENTER", restartGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-ESC", returnToMenu);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    createUiButton(this, { x, y, label, accent: backgroundColor, onClick });
  }
}

class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create() {
    this.add.rectangle(480, 270, GAME_WIDTH, GAME_HEIGHT, 0x030712, 0.78);
    createUiCard(this, 480, 270, 460, 310);

    this.add.text(480, 168, "PAUZA", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#67e8f9",
      letterSpacing: 3,
    }).setOrigin(0.5);
    this.add.text(480, 208, "Nabij síly", { fontFamily: "system-ui, sans-serif", fontSize: "32px", fontStyle: "bold", color: UI_COLORS.text }).setOrigin(0.5);

    const resumeGame = () => {
      this.scene.resume("MainScene");
      this.scene.stop();
    };
    const restartGame = () => {
      this.scene.stop("MainScene");
      this.scene.start("MainScene");
    };
    const returnToMenu = () => {
      this.scene.stop("MainScene");
      this.scene.start("MenuScene");
    };

    createUiButton(this, { x: 480, y: 276, width: 300, label: "POKRAČOVAT", accent: UI_COLORS.green, onClick: resumeGame });
    createUiButton(this, { x: 480, y: 338, width: 300, label: "RESTARTOVAT VÝPRAVU", accent: UI_COLORS.yellow, onClick: restartGame });
    createUiButton(this, { x: 480, y: 400, width: 300, label: "HLAVNÍ NABÍDKA", onClick: returnToMenu, secondary: true });

    this.input.keyboard.once("keydown-ESC", resumeGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    createUiButton(this, { x, y, label, accent: backgroundColor, onClick });
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  init(data) {
    this.difficulty = data.difficulty ?? "normal";
    this.level = data.level ?? 1;
    this.theme = getLevel(this.level);
    this.layout = getLevelLayout(this.level);
    this.levelWidth = this.layout.width;
    this.difficultySettings = DIFFICULTIES[this.difficulty] ?? DIFFICULTIES.normal;
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createCamera();
    this.createMovingPlatforms();
    this.createProjectiles();
    this.createCollectibles();
    this.createHealthPickups();
    this.createAmmoPickups();
    this.createWeaponPickups();
    this.createHazards();
    this.createBarriers();
    this.createLogicGates();
    this.createCheckpoints();
    this.createEnemies();
    this.createBoss();
    this.createControls();
  }

  createTextures() {
    if (this.textures.exists("platform")) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(0x0f172a);
    graphics.fillRect(0, 0, 128, 32);
    graphics.fillStyle(0x334155);
    graphics.fillRect(4, 8, 120, 20);
    graphics.fillStyle(0x1e293b);
    graphics.fillRect(8, 13, 112, 15);
    graphics.fillStyle(0x22d3ee);
    graphics.fillRect(0, 0, 128, 8);
    graphics.fillStyle(0xa5f3fc);
    graphics.fillRect(4, 2, 120, 3);
    graphics.fillStyle(0x164e63);
    graphics.fillRect(0, 8, 4, 24);
    graphics.fillStyle(0x020617);
    graphics.fillRect(4, 28, 120, 4);
    graphics.generateTexture("platform", 128, 32);
    graphics.clear();

    graphics.fillStyle(0x020617);
    graphics.fillEllipse(18, 44, 28, 6);
    graphics.fillStyle(0x2563eb);
    graphics.fillRoundedRect(3, 3, 28, 40, 8);
    graphics.fillStyle(0x60a5fa);
    graphics.fillRoundedRect(6, 6, 21, 14, 5);
    graphics.fillStyle(0x0f172a);
    graphics.fillRoundedRect(6, 22, 22, 16, 4);
    graphics.fillStyle(0x38bdf8);
    graphics.fillRect(8, 25, 18, 4);
    graphics.fillStyle(0xe0f2fe);
    graphics.fillCircle(11, 13, 3);
    graphics.fillCircle(23, 13, 3);
    graphics.fillStyle(0x0f172a);
    graphics.fillCircle(11, 13, 1.25);
    graphics.fillCircle(23, 13, 1.25);
    graphics.fillStyle(0x93c5fd);
    graphics.fillRect(4, 10, 3, 24);
    graphics.generateTexture("player", 34, 46);
    graphics.clear();

    graphics.fillStyle(0x713f12);
    graphics.fillCircle(12, 12, 12);
    graphics.fillStyle(0xf59e0b);
    graphics.fillCircle(11, 10, 10);
    graphics.fillStyle(0xfef3c7);
    graphics.fillCircle(8, 6, 3);
    graphics.fillStyle(0xb45309);
    graphics.fillRect(11, 1, 3, 18);
    graphics.generateTexture("coin", 24, 24);
    graphics.clear();

    graphics.fillStyle(0x7f1d1d);
    graphics.fillCircle(9, 8, 7);
    graphics.fillCircle(19, 8, 7);
    graphics.fillTriangle(3, 10, 25, 10, 14, 24);
    graphics.fillStyle(0xfb7185);
    graphics.fillCircle(8, 7, 6);
    graphics.fillCircle(18, 7, 6);
    graphics.fillTriangle(2, 9, 24, 9, 14, 23);
    graphics.fillStyle(0xffe4e6);
    graphics.fillCircle(7, 5, 2);
    graphics.generateTexture("health", 28, 26);
    graphics.clear();

    graphics.fillStyle(0x0f172a);
    graphics.fillTriangle(0, 24, 10, 0, 20, 24);
    graphics.fillTriangle(12, 24, 22, 0, 32, 24);
    graphics.fillStyle(0x94a3b8);
    graphics.fillTriangle(2, 23, 10, 3, 18, 23);
    graphics.fillTriangle(14, 23, 22, 3, 30, 23);
    graphics.fillStyle(0xe2e8f0);
    graphics.fillTriangle(4, 20, 10, 5, 13, 20);
    graphics.fillTriangle(16, 20, 22, 5, 25, 20);
    graphics.generateTexture("spikes", 32, 24);
    graphics.clear();

    graphics.fillStyle(0x0f172a);
    graphics.fillRoundedRect(0, 1, 18, 8, 4);
    graphics.fillStyle(0x67e8f9);
    graphics.fillRoundedRect(1, 0, 16, 6, 3);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(14, 3, 2);
    graphics.generateTexture("bullet", 18, 8);
    graphics.clear();

    graphics.fillStyle(0x78350f);
    graphics.fillRect(4, 7, 12, 22);
    graphics.fillStyle(0xfbbf24);
    graphics.fillRect(6, 8, 7, 16);
    graphics.fillStyle(0xf97316);
    graphics.fillRoundedRect(4, 0, 12, 10, 5);
    graphics.fillStyle(0xffedd5);
    graphics.fillCircle(8, 4, 2);
    graphics.fillStyle(0x451a03);
    graphics.fillRect(4, 25, 12, 4);
    graphics.generateTexture("ammoPickup", 20, 30);
    graphics.clear();

    graphics.fillStyle(0x450a0a);
    graphics.fillRoundedRect(1, 3, 34, 39, 8);
    graphics.fillStyle(0xef4444);
    graphics.fillRoundedRect(3, 1, 29, 35, 8);
    graphics.fillStyle(0x991b1b);
    graphics.fillRect(6, 23, 24, 12);
    graphics.fillStyle(0xfecaca);
    graphics.fillRect(5, 7, 3, 18);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(11, 12, 4);
    graphics.fillCircle(24, 12, 4);
    graphics.fillStyle(0x111827);
    graphics.fillCircle(11, 12, 1.5);
    graphics.fillCircle(25, 12, 1.5);
    graphics.generateTexture("enemy", 36, 42);
    graphics.clear();

    graphics.fillStyle(0x3b0764);
    graphics.fillRoundedRect(1, 7, 33, 31, 12);
    graphics.fillStyle(0x8b5cf6);
    graphics.fillRoundedRect(3, 4, 28, 29, 12);
    graphics.fillStyle(0xc4b5fd);
    graphics.fillRect(6, 24, 21, 7);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(10, 15, 4);
    graphics.fillCircle(24, 15, 4);
    graphics.fillStyle(0x312e81);
    graphics.fillCircle(10, 15, 1.5);
    graphics.fillCircle(24, 15, 1.5);
    graphics.generateTexture("hopper", 34, 38);
    graphics.clear();

    graphics.fillStyle(0x431407);
    graphics.fillRoundedRect(2, 10, 38, 24, 7);
    graphics.fillStyle(0xf97316);
    graphics.fillRoundedRect(2, 7, 34, 23, 7);
    graphics.fillStyle(0x9a3412);
    graphics.fillRect(8, 2, 24, 8);
    graphics.fillStyle(0xfdba74);
    graphics.fillRect(9, 4, 18, 3);
    graphics.fillStyle(0xfef3c7);
    graphics.fillCircle(13, 21, 4);
    graphics.fillCircle(27, 21, 4);
    graphics.fillStyle(0x431407);
    graphics.fillCircle(13, 21, 1.5);
    graphics.fillCircle(27, 21, 1.5);
    graphics.generateTexture("sentry", 40, 34);
    graphics.clear();

    graphics.fillStyle(0x4c0519);
    graphics.fillRoundedRect(0, 1, 14, 8, 4);
    graphics.fillStyle(0xfb7185);
    graphics.fillRoundedRect(1, 0, 12, 6, 3);
    graphics.fillStyle(0xfef3c7);
    graphics.fillCircle(10, 3, 2);
    graphics.generateTexture("enemyBullet", 14, 8);
    graphics.clear();

    graphics.fillStyle(0x2e1065);
    graphics.fillRoundedRect(2, 8, 70, 76, 18);
    graphics.fillStyle(0x7e22ce);
    graphics.fillRoundedRect(5, 4, 62, 68, 16);
    graphics.fillStyle(0x581c87);
    graphics.fillRect(10, 43, 52, 24);
    graphics.fillStyle(0xc4b5fd);
    graphics.fillRoundedRect(13, 15, 46, 22, 8);
    graphics.fillStyle(0xfef08a);
    graphics.fillCircle(25, 26, 5);
    graphics.fillCircle(47, 26, 5);
    graphics.fillStyle(0x1e1b4b);
    graphics.fillCircle(25, 26, 2);
    graphics.fillCircle(47, 26, 2);
    graphics.fillStyle(0xf0abfc);
    graphics.fillRect(8, 20, 5, 35);
    graphics.fillRect(59, 20, 5, 35);
    graphics.generateTexture("boss", 74, 86);
    graphics.clear();

    graphics.fillStyle(0x0f172a);
    graphics.fillRect(2, 0, 5, 52);
    graphics.fillStyle(0x38bdf8);
    graphics.fillTriangle(7, 4, 30, 12, 7, 25);
    graphics.fillStyle(0x0e7490);
    graphics.fillTriangle(7, 15, 30, 12, 7, 25);
    graphics.fillStyle(0xf8fafc);
    graphics.fillCircle(4.5, 2, 4);
    graphics.generateTexture("checkpoint", 32, 52);
    graphics.clear();

    graphics.fillStyle(0x020617);
    graphics.fillRect(0, 0, 56, 96);
    graphics.fillStyle(0x1e293b);
    graphics.fillRect(5, 3, 46, 90);
    graphics.fillStyle(0x0e7490);
    graphics.fillRect(8, 7, 40, 82);
    graphics.fillStyle(0x22d3ee, 0.8);
    graphics.fillRect(12, 10, 6, 76);
    graphics.fillRect(38, 10, 6, 76);
    graphics.fillStyle(0x164e63);
    graphics.fillRect(20, 10, 16, 76);
    graphics.fillStyle(0xa5f3fc);
    graphics.fillRect(23, 18, 10, 6);
    graphics.fillRect(23, 42, 10, 6);
    graphics.fillRect(23, 66, 10, 6);
    graphics.generateTexture("barrier", 56, 96);
    graphics.clear();

    graphics.fillStyle(0x111827);
    graphics.fillRoundedRect(0, 0, 34, 24, 5);
    graphics.fillStyle(0x0e7490);
    graphics.fillRoundedRect(3, 3, 28, 18, 4);
    graphics.fillStyle(0x67e8f9);
    graphics.fillCircle(17, 12, 6);
    graphics.fillStyle(0xf8fafc);
    graphics.fillCircle(15, 10, 2);
    graphics.generateTexture("switch", 34, 24);
    graphics.clear();

    graphics.fillStyle(0x020617);
    graphics.fillRoundedRect(0, 3, 29, 9, 3);
    graphics.fillStyle(0x64748b);
    graphics.fillRoundedRect(2, 2, 25, 6, 2);
    graphics.fillStyle(0x38bdf8);
    graphics.fillRect(18, 3, 12, 3);
    graphics.fillStyle(0x0f172a);
    graphics.fillRect(8, 10, 7, 4);
    graphics.fillStyle(0xfef08a);
    graphics.fillCircle(25, 4, 2);
    graphics.generateTexture("weapon", 30, 14);
    graphics.destroy();
  }

  createWorld() {
    const { sky: skyColor, horizon, ground, accent, platformTint } = this.theme;
    this.platformTint = platformTint;
    this.cameras.main.setBackgroundColor(skyColor);

    const sky = this.add.graphics().setDepth(-20);
    sky.fillStyle(skyColor);
    sky.fillRect(0, 0, this.levelWidth, GAME_HEIGHT);
    sky.fillStyle(horizon, 0.6);
    sky.fillRect(0, 100, this.levelWidth, 180);
    sky.fillStyle(ground, 0.25);
    sky.fillRect(0, 260, this.levelWidth, 120);
    sky.fillStyle(accent, 0.16);
    sky.fillCircle(220, 105, 58);
    sky.fillStyle(accent, 0.8);
    sky.fillCircle(205, 91, 8);
    sky.fillCircle(238, 123, 5);

    const mountains = this.add.graphics().setDepth(-15);
    mountains.fillStyle(skyColor, 0.72);
    for (let x = -80; x < this.levelWidth + 160; x += 180) {
      mountains.fillTriangle(x, 410, x + 90, 200 + (x % 3) * 18, x + 180, 410);
    }
    mountains.fillStyle(horizon, 0.56);
    for (let x = -40; x < this.levelWidth + 180; x += 145) {
      mountains.fillTriangle(x, 455, x + 72, 275 + (x % 4) * 12, x + 145, 455);
    }

    const city = this.add.graphics().setDepth(-10);
    city.fillStyle(skyColor, 0.88);
    for (let x = 40; x < this.levelWidth; x += 110) {
      const height = 48 + ((x / 10) % 4) * 24;
      city.fillRect(x, 470 - height, 72, height);
      city.fillStyle(accent, 0.45);
      city.fillRect(x + 12, 482 - height, 8, 3);
      city.fillRect(x + 37, 500 - height, 8, 3);
      city.fillStyle(skyColor, 0.88);
    }

    const clouds = this.add.graphics().setDepth(-5);
    clouds.fillStyle(accent, 0.16);
    [[120, 88], [480, 145], [780, 78], [1120, 115], [1420, 70], [1740, 145], [2050, 92], [2380, 140], [2680, 76], [3020, 112], [3360, 70], [3680, 145], [4050, 86], [4380, 130], [4720, 75], [5070, 120], [5420, 90], [5680, 145]].forEach(([x, y]) => {
      clouds.fillCircle(x, y, 22);
      clouds.fillCircle(x + 27, y - 10, 30);
      clouds.fillCircle(x + 57, y, 20);
    });

    this.createThemeDecorations();

    const gateArchitecture = this.add.graphics().setDepth(-2);
    [...this.layout.barriers.map((barrier) => barrier.x), ...this.layout.gates.map((gate) => gate.gateX)].forEach((x) => {
      gateArchitecture.fillStyle(skyColor, 0.9);
      gateArchitecture.fillRect(x - 46, 160, 92, 344);
      gateArchitecture.fillStyle(horizon, 0.8);
      gateArchitecture.fillRect(x - 42, 170, 7, 324);
      gateArchitecture.fillRect(x + 35, 170, 7, 324);
      gateArchitecture.fillStyle(accent, 0.55);
      gateArchitecture.fillRect(x - 42, 175, 7, 76);
      gateArchitecture.fillRect(x + 35, 175, 7, 76);
    });

    this.platforms = this.physics.add.staticGroup();
    this.layout.platforms.forEach(([x, y, width]) => this.addPlatform(x, y, width));

    this.physics.world.setBounds(0, 0, this.levelWidth, GAME_HEIGHT);

    this.add.rectangle(480, 30, 930, 46, 0x081226, 0.88)
      .setStrokeStyle(1, 0x274569, 0.9)
      .setScrollFactor(0)
      .setDepth(20);
    this.add.text(34, 30, this.theme.shortName, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      fontStyle: "bold",
      color: "#67e8f9",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.livesText = this.add.text(88, 30, "ŽIVOTY", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "12px",
      fontStyle: "bold",
      color: "#8ea3c7",
      letterSpacing: 1,
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.lifeIcons = Array.from({ length: MAX_LIVES }, (_value, index) => (
      this.add.image(154 + index * 25, 30, "health")
        .setDisplaySize(20, 18)
        .setScrollFactor(0)
        .setDepth(21)
    ));

    this.scoreText = this.add.text(245, 30, "MINCE 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fef3c7",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.ammoText = this.add.text(365, 30, `NÁBOJE ${MAX_AMMO}/${MAX_AMMO}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#fef3c7",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.timeText = this.add.text(535, 30, "ČAS 0:00", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#e0f2fe",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.dashText = this.add.text(665, 30, "DASH PŘIPRAVEN", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#a5f3fc",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);

    this.killText = this.add.text(835, 30, "× 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "14px",
      fontStyle: "bold",
      color: "#ff9bab",
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(21);
  }

  addPlatform(x, y, widthInTiles) {
    const platform = this.platforms.create(x, y, "platform");
    platform.setDisplaySize(widthInTiles * 128, 32);
    platform.setTint(this.platformTint);
    platform.setDepth(0);
    platform.refreshBody();
  }

  createThemeDecorations() {
    const decorations = this.add.graphics().setDepth(-7);

    if (this.level === 2) {
      decorations.fillStyle(0xdbeafe, 0.5);
      for (let x = 60; x < this.levelWidth; x += 170) {
        decorations.fillTriangle(x, 0, x + 28, 0, x + 14, 46 + (x % 5) * 5);
        decorations.fillCircle(x + 65, 110 + (x % 3) * 34, 3);
        decorations.fillCircle(x + 92, 164 + (x % 4) * 25, 2);
      }
      decorations.fillStyle(0x93c5fd, 0.18);
      decorations.fillRect(0, 470, this.levelWidth, 70);
      return;
    }

    if (this.level === 3) {
      decorations.fillStyle(0x7f1d1d, 0.9);
      decorations.fillRect(0, 492, this.levelWidth, 48);
      decorations.fillStyle(0xfb923c, 0.75);
      for (let x = 0; x < this.levelWidth; x += 64) {
        decorations.fillCircle(x + 22, 510 + Math.sin(x) * 5, 18);
      }
      decorations.fillStyle(0xfde68a, 0.6);
      for (let x = 80; x < this.levelWidth; x += 230) {
        decorations.fillCircle(x, 185 + (x % 4) * 45, 3);
        decorations.fillCircle(x + 34, 230 + (x % 3) * 35, 2);
      }
      return;
    }

    if (this.level === 4) {
      decorations.fillStyle(0xffffff, 0.75);
      for (let x = 35; x < this.levelWidth; x += 90) {
        const y = 56 + ((x * 17) % 330);
        decorations.fillCircle(x, y, x % 4 === 0 ? 3 : 1);
      }
      decorations.fillStyle(0x8b5cf6, 0.18);
      for (let x = 140; x < this.levelWidth; x += 390) {
        decorations.fillTriangle(x, 390, x + 70, 225, x + 130, 420);
      }
    }
  }

  createPlayer() {
    this.player = this.physics.add.sprite(100, 300, "player");
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);
    this.physics.add.collider(this.player, this.platforms);
    this.playerShadow = this.add.ellipse(this.player.x, this.player.y + 25, 34, 9, 0x020617, 0.55)
      .setDepth(0.25);
    this.playerLimbs = this.add.graphics().setDepth(0.5);
    this.weapon = this.add.image(this.player.x + 24, this.player.y + 4, "weapon")
      .setDepth(2);
    this.walkCycle = 0;
    this.jumpsRemaining = 2;
    this.lives = this.difficultySettings.startingLives;
    this.kills = 0;
    this.startedAt = this.time.now;
    this.isDashing = false;
    this.dashEndsAt = 0;
    this.nextDashAt = 0;
    this.weaponMode = "basic";
    this.weaponEndsAt = 0;
    this.respawnPoint = { x: 100, y: 300 };
    this.isHurt = false;
    this.gameOver = false;
    this.updatePlayerLimbs(0, false);
    this.updateLivesText();
  }

  updateWeapon() {
    const direction = this.player.flipX ? -1 : 1;
    this.weapon.setPosition(this.player.x + direction * 24, this.player.y + 4);
    this.weapon.setFlipX(this.player.flipX);
  }

  updatePlayerLimbs(delta, isWalking) {
    if (isWalking) {
      this.walkCycle += delta * 0.014;
    } else {
      this.walkCycle = 0;
    }

    const stride = isWalking ? Math.sin(this.walkCycle) * 7 : 0;
    const armSwing = stride * 0.65;
    const direction = this.player.flipX ? -1 : 1;
    const x = this.player.x;
    const y = this.player.y;

    this.playerShadow.setPosition(x, y + 25);
    this.playerShadow.setScale(this.player.body.blocked.down ? 1 : 0.72, 1);

    this.playerLimbs.clear();
    this.playerLimbs.lineStyle(5, 0x1e3a8a, 1);

    this.playerLimbs.lineBetween(x - 7, y + 16, x - 9 + stride, y + 30);
    this.playerLimbs.lineBetween(x + 7, y + 16, x + 9 - stride, y + 30);

    this.playerLimbs.lineBetween(
      x - direction * 10,
      y - 3,
      x - direction * 19,
      y + 6 - armSwing,
    );
    this.playerLimbs.lineBetween(
      x + direction * 10,
      y - 3,
      x + direction * 21,
      y + 6 + armSwing,
    );

    this.playerLimbs.fillStyle(0xfbbf24, 1);
    this.playerLimbs.fillCircle(x - direction * 19, y + 6 - armSwing, 3);
    this.playerLimbs.fillCircle(x + direction * 21, y + 6 + armSwing, 3);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.levelWidth, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0);
    this.cameras.main.setDeadzone(240, GAME_HEIGHT);
  }

  createMovingPlatforms() {
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });

    this.layout.movingPlatforms.forEach((config) => this.addMovingPlatform(config));

    this.physics.add.collider(this.player, this.movingPlatforms);
  }

  addMovingPlatform(config) {
    const platform = this.movingPlatforms.create(config.x, config.y, "platform");
    platform.setDisplaySize(config.width, 32);
    platform.setTint(this.theme.accent);
    platform.setDepth(0.1);
    platform.body.setAllowGravity(false);
    platform.body.setImmovable(true);
    platform.setData({ ...config, startX: config.x, startY: config.y });
  }

  updateMovingPlatforms(time) {
    this.movingPlatforms.getChildren().forEach((platform) => {
      const offset = Math.sin(time * platform.getData("speed")) * platform.getData("amplitude");
      const x = platform.getData("axis") === "x"
        ? platform.getData("startX") + offset
        : platform.getData("startX");
      const y = platform.getData("axis") === "y"
        ? platform.getData("startY") + offset
        : platform.getData("startY");

      platform.setPosition(x, y);
      platform.body.updateFromGameObject();
    });
  }

  createCollectibles() {
    this.score = 0;
    this.coins = this.physics.add.staticGroup();

    this.layout.coins.forEach(([x, y]) => this.coins.create(x, y, "coin"));

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  collectCoin(_player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`MINCE ${this.score}`);
    playTone(this, 740, 0.09, "triangle", 0.035);
    this.createBurst(coin.x, coin.y, 0xfacc15);

    this.checkVictory();
  }

  checkVictory() {
    if (this.coins.countActive(true) === 0 && this.bossDefeated) {
      this.gameOver = true;
      this.player.setVelocity(0, 0);
      playTone(this, 880, 0.28, "sine", 0.06);
      const progress = loadProgress();
      progress.wins += 1;
      progress.unlockedLevel = Math.min(LEVELS.length, Math.max(progress.unlockedLevel, this.level + 1));
      const stats = this.getRunStats();
      if (progress.bestTime === null || stats.time < progress.bestTime) {
        progress.bestTime = stats.time;
      }
      saveProgress(progress);
      this.scene.start("VictoryScene", stats);
    }
  }

  createHealthPickups() {
    this.healthPickups = this.physics.add.staticGroup();

    this.layout.health.forEach(([x, y]) => this.healthPickups.create(x, y, "health"));

    this.physics.add.overlap(this.player, this.healthPickups, this.collectHealth, null, this);
  }

  collectHealth(_player, healthPickup) {
    if (this.lives >= MAX_LIVES) {
      return;
    }

    healthPickup.disableBody(true, true);
    this.lives = Math.min(this.lives + 1, MAX_LIVES);
    this.updateLivesText();
    playTone(this, 520, 0.16, "sine", 0.05);
  }

  updateLivesText() {
    this.lifeIcons.forEach((heart, index) => {
      heart.setAlpha(index < this.lives ? 1 : 0.25);
    });
  }

  createProjectiles() {
    this.lastShotAt = -SHOOT_COOLDOWN;
    this.bullets = this.physics.add.group();
    this.ammo = MAX_AMMO;
    this.updateAmmoText();
  }

  shoot(time) {
    if (time - this.lastShotAt < SHOOT_COOLDOWN || this.ammo === 0) {
      return;
    }

    const direction = this.player.flipX ? -1 : 1;
    const shotOffsets = this.weaponMode === "spread" ? [-95, 0, 95] : [0];
    shotOffsets.forEach((verticalSpeed) => {
      const bullet = this.bullets.create(
        this.player.x + direction * 38,
        this.player.y + 4,
        "bullet",
      );
      bullet.body.allowGravity = false;
      bullet.setVelocity(direction * BULLET_SPEED, verticalSpeed);

      this.time.delayedCall(1200, () => {
        if (bullet.active) {
          bullet.destroy();
        }
      });
    });
    this.ammo -= 1;
    this.updateAmmoText();
    playTone(this, 260, 0.06, "square", 0.03);
    this.lastShotAt = time;

  }

  createWeaponPickups() {
    this.weaponPickups = this.physics.add.staticGroup();
    this.layout.weapon.forEach(([x, y]) => {
      const pickup = this.weaponPickups.create(x, y, "ammoPickup");
      pickup.setTint(0xa78bfa);
      pickup.setScale(1.15);
    });
    this.physics.add.overlap(this.player, this.weaponPickups, this.collectWeapon, null, this);
  }

  collectWeapon(_player, pickup) {
    pickup.disableBody(true, true);
    this.weaponMode = "spread";
    this.weaponEndsAt = this.time.now + 10000;
    playTone(this, 780, 0.22, "triangle", 0.06);
    this.createBurst(pickup.x, pickup.y, 0xa78bfa);
  }

  createAmmoPickups() {
    this.ammoPickups = this.physics.add.staticGroup();

    this.layout.ammo.forEach(([x, y]) => this.ammoPickups.create(x, y, "ammoPickup"));

    this.physics.add.overlap(this.player, this.ammoPickups, this.collectAmmo, null, this);
  }

  collectAmmo(_player, ammoPickup) {
    if (this.ammo >= MAX_AMMO) {
      return;
    }

    ammoPickup.disableBody(true, true);
    this.ammo = MAX_AMMO;
    this.updateAmmoText();
    playTone(this, 430, 0.14, "triangle", 0.05);
  }

  updateAmmoText() {
    this.ammoText.setText(`NÁBOJE ${this.ammo}/${MAX_AMMO}`);
  }

  getRunStats() {
    return {
      score: this.score,
      kills: this.kills,
      time: Math.floor((this.time.now - this.startedAt) / 1000),
      difficulty: this.difficulty,
      level: this.level,
    };
  }

  updateRunHud(time) {
    const elapsedSeconds = Math.floor((time - this.startedAt) / 1000);
    this.timeText.setText(`ČAS ${formatDuration(elapsedSeconds)}`);
    this.killText.setText(`× ${this.kills}`);

    const remaining = Math.max(0, this.nextDashAt - time);
    if (remaining === 0) {
      this.dashText.setText("DASH PŘIPRAVEN");
      this.dashText.setColor("#a5f3fc");
    } else {
      this.dashText.setText(`DASH ${(remaining / 1000).toFixed(1)} S`);
      this.dashText.setColor("#94a3b8");
    }

    if (this.weaponMode === "spread") {
      this.dashText.setText(`TROJSTŘELA ${Math.max(0, Math.ceil((this.weaponEndsAt - time) / 1000))} S`);
      this.dashText.setColor("#d8b4fe");
    }
  }

  createBurst(x, y, color) {
    for (let index = 0; index < 6; index += 1) {
      const particle = this.add.circle(x, y, 3, color, 0.9).setDepth(5);
      const angle = (Math.PI * 2 * index) / 6;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 28,
        y: y + Math.sin(angle) * 28,
        alpha: 0,
        scale: 0.2,
        duration: 260,
        onComplete: () => particle.destroy(),
      });
    }
  }

  createHazards() {
    this.spikes = this.physics.add.staticGroup();

    this.layout.spikes.forEach(([x, y]) => this.spikes.create(x, y, "spikes"));

    this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
  }

  createBarriers() {
    this.barriers = this.physics.add.staticGroup();

    this.layout.barriers.forEach(({ x, lives }) => this.addBarrier(x, lives));

    this.physics.add.collider(this.player, this.barriers);
    this.physics.add.overlap(this.bullets, this.barriers, this.damageBarrier, null, this);
  }

  createLogicGates() {
    this.logicGates = this.physics.add.staticGroup();
    this.switches = this.physics.add.staticGroup();

    this.layout.gates.forEach((gate) => this.addLogicGate({ ...gate, label: "AKTIVUJ SPÍNAČ" }));

    this.physics.add.collider(this.player, this.logicGates);
    this.physics.add.overlap(this.player, this.switches, this.activateSwitch, null, this);
  }

  addLogicGate(config) {
    const gate = this.logicGates.create(config.gateX, 344, "barrier");
    gate.setDisplaySize(44, 320);
    gate.setTint(this.theme.accent);
    gate.refreshBody();
    const label = this.add.text(config.gateX, 158, config.label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#ddd6fe",
      stroke: "#020617",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    gate.setData("label", label);

    const gameSwitch = this.switches.create(config.switchX, config.switchY ?? 475, "switch");
    gameSwitch.setData("gate", gate);
    gameSwitch.setData("used", false);
  }

  activateSwitch(_player, gameSwitch) {
    if (gameSwitch.getData("used")) {
      return;
    }

    gameSwitch.setData("used", true);
    gameSwitch.setTint(0x86efac);
    const gate = gameSwitch.getData("gate");
    gate.getData("label").destroy();
    gate.disableBody(true, true);
    this.createBurst(gate.x, gate.y, 0xa78bfa);
    playTone(this, 620, 0.2, "sine", 0.06);
  }

  addBarrier(x, lives) {
    const barrier = this.barriers.create(x, 344, "barrier");
    barrier.setDisplaySize(56, 320);
    barrier.setDepth(1);
    barrier.setTint(this.theme.accent);
    barrier.refreshBody();
    const healthText = this.add.text(x, 158, `Štít: ${lives}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#a5f3fc",
      stroke: "#020617",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);

    barrier.setData({ lives, healthText });
  }

  damageBarrier(firstObject, secondObject) {
    const barrier = firstObject.getData?.("lives") ? firstObject : secondObject;
    const bullet = barrier === firstObject ? secondObject : firstObject;

    if (!barrier.active || !bullet.active) {
      return;
    }

    bullet.destroy();
    const remainingLives = barrier.getData("lives") - 1;
    barrier.setData("lives", remainingLives);

    if (remainingLives === 0) {
      barrier.disableBody(true, true);
      barrier.getData("healthText").destroy();
      playTone(this, 110, 0.35, "sawtooth", 0.07);
      return;
    }

    barrier.getData("healthText").setText(`Štít: ${remainingLives}`);
    playTone(this, 210, 0.08, "square", 0.04);
    barrier.setTint(0xfef08a);
    this.time.delayedCall(120, () => {
      if (barrier.active) {
        barrier.clearTint();
      }
    });
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();

    this.layout.checkpoints.forEach(([x, y, respawnX, respawnY]) => this.addCheckpoint(x, y, respawnX, respawnY));

    this.physics.add.overlap(this.player, this.checkpoints, this.activateCheckpoint, null, this);
  }

  addCheckpoint(x, y, respawnX, respawnY) {
    const checkpoint = this.checkpoints.create(x, y, "checkpoint");
    checkpoint.setDepth(0.4);
    checkpoint.setAlpha(0.65);
    checkpoint.setData({ respawnX, respawnY, active: false });
  }

  activateCheckpoint(_player, checkpoint) {
    if (checkpoint.getData("active")) {
      return;
    }

    this.checkpoints.getChildren().forEach((item) => {
      item.setData("active", false);
      item.clearTint();
      item.setAlpha(0.65);
    });

    checkpoint.setData("active", true);
    checkpoint.setTint(0x86efac);
    checkpoint.setAlpha(1);
    playTone(this, 660, 0.2, "sine", 0.05);
    this.respawnPoint = {
      x: checkpoint.getData("respawnX"),
      y: checkpoint.getData("respawnY"),
    };
  }

  createEnemies() {
    this.enemies = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();

    this.layout.enemies.forEach((enemy) => this.createEnemy(enemy));

    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.damageEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitEnemyBullet, null, this);
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => bullet.destroy());
    this.physics.add.collider(this.enemyBullets, this.barriers, (bullet) => bullet.destroy());
  }

  createBoss() {
    this.bossLives = BOSS_LIVES;
    this.bossDefeated = false;
    this.bossNextShotAt = 1600;
    this.bossStartX = this.levelWidth - 140;
    this.bossMinX = this.bossStartX - 40;
    this.bossMaxX = this.bossStartX + 40;
    this.boss = this.physics.add.sprite(this.bossStartX, 458, "boss");
    this.boss.setDepth(2);
    this.boss.setVelocityX(-55);
    this.physics.add.collider(this.boss, this.platforms);
    this.bossHealthText = this.add.text(this.bossStartX, 360, `BOSS: ${this.bossLives}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#f0abfc",
      stroke: "#020617",
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(4);
    this.bossBarBackground = this.add.rectangle(480, 82, 260, 16, 0x0f172a, 0.9)
      .setStrokeStyle(2, 0xf0abfc)
      .setScrollFactor(0)
      .setDepth(8)
      .setVisible(false);
    this.bossBarFill = this.add.rectangle(352, 82, 256, 10, 0xc026d3)
      .setOrigin(0, 0.5)
      .setScrollFactor(0)
      .setDepth(9)
      .setVisible(false);
    this.bossBarLabel = this.add.text(480, 82, "BOSS", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "13px",
      fontStyle: "bold",
      color: "#fdf4ff",
    }).setOrigin(0.5).setScrollFactor(0).setDepth(10).setVisible(false);

    this.physics.add.overlap(this.player, this.boss, this.hitEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.boss, this.damageBoss, null, this);
  }

  updateBoss(time) {
    if (!this.boss?.active) {
      return;
    }

    const isBossInView = Math.abs(this.player.x - this.boss.x) < GAME_WIDTH * 0.7;
    this.bossBarBackground.setVisible(isBossInView);
    this.bossBarFill.setVisible(isBossInView);
    this.bossBarLabel.setVisible(isBossInView);

    if (this.boss.x <= this.bossMinX) {
      this.boss.setVelocityX(55);
      this.boss.setFlipX(false);
    } else if (this.boss.x >= this.bossMaxX) {
      this.boss.setVelocityX(-55);
      this.boss.setFlipX(true);
    }

    if (time >= this.bossNextShotAt) {
      const direction = this.player.x < this.boss.x ? -1 : 1;
      this.fireEnemyBullet(this.boss, direction);
      this.bossNextShotAt = time + 1050;
    }

    const pulse = Math.sin(time * 0.008) * 0.04;
    this.boss.setScale(1 + pulse, 1 - pulse);
    this.bossHealthText.setPosition(this.boss.x, this.boss.y - 58);
  }

  damageBoss(firstObject, secondObject) {
    const boss = firstObject === this.boss ? firstObject : secondObject;
    const bullet = boss === firstObject ? secondObject : firstObject;

    if (!boss.active || !bullet.active) {
      return;
    }

    bullet.destroy();
    this.bossLives -= 1;
    playTone(this, 180, 0.12, "sawtooth", 0.05);

    if (this.bossLives === 0) {
      boss.disableBody(true, true);
      this.bossHealthText.destroy();
      this.bossBarBackground.destroy();
      this.bossBarFill.destroy();
      this.bossBarLabel.destroy();
      this.bossDefeated = true;
      this.kills += 1;
      this.createBurst(boss.x, boss.y, 0xf0abfc);
      playTone(this, 120, 0.45, "sawtooth", 0.08);
      this.checkVictory();
      return;
    }

    this.bossHealthText.setText(`BOSS: ${this.bossLives}`);
    this.bossBarFill.displayWidth = 256 * (this.bossLives / BOSS_LIVES);
    boss.setTint(0xfef08a);
    this.time.delayedCall(120, () => {
      if (boss.active) {
        boss.clearTint();
      }
    });
  }

  createEnemy(config) {
    const enemy = this.enemies.create(config.x, config.y, config.texture);
    const healthText = this.add.text(config.x, config.y - 34, "♥".repeat(config.lives), {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#991b1b",
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(3);

    enemy.setData({ ...config, healthText });
    enemy.setDepth(1);
    enemy.setVelocityX(config.type === "patrol" ? config.speed : 0);
    this.physics.add.collider(enemy, this.platforms);
    return enemy;
  }

  updateEnemies(time) {
    this.enemies.getChildren().forEach((enemy) => {
      if (!enemy.active) {
        return;
      }

      const type = enemy.getData("type");
      const speed = enemy.getData("speed") ?? 0;
      const minX = enemy.getData("minX");
      const maxX = enemy.getData("maxX");

      if (type === "patrol") {
        if (enemy.x <= minX) {
          enemy.setVelocityX(speed);
          enemy.setFlipX(false);
        } else if (enemy.x >= maxX) {
          enemy.setVelocityX(-speed);
          enemy.setFlipX(true);
        }
      }

      if (type === "hopper") {
        if (enemy.x <= minX) {
          enemy.setVelocityX(speed);
          enemy.setFlipX(false);
        } else if (enemy.x >= maxX) {
          enemy.setVelocityX(-speed);
          enemy.setFlipX(true);
        }

        if (time >= enemy.getData("nextActionAt") && enemy.body.blocked.down) {
          enemy.setVelocityY(-430);
          enemy.setVelocityX(enemy.flipX ? -speed : speed);
          enemy.setData("nextActionAt", time + 1250);
        }
      }

      if (type === "sentry" && time >= enemy.getData("nextActionAt")) {
        const direction = this.player.x < enemy.x ? -1 : 1;
        enemy.setFlipX(direction < 0);
        this.fireEnemyBullet(enemy, direction);
        enemy.setData("nextActionAt", time + 1700);
      }

      this.animateEnemy(enemy, type, time);
      enemy.getData("healthText").setPosition(enemy.x, enemy.y - 34);
    });
  }

  animateEnemy(enemy, type, time) {
    const phase = time * 0.012 + enemy.x * 0.01;

    if (type === "patrol") {
      const step = Math.sin(phase);
      enemy.setScale(1 + step * 0.04, 1 - step * 0.05);
      enemy.setAngle(step * 2);
      return;
    }

    if (type === "hopper") {
      if (!enemy.body.blocked.down) {
        enemy.setScale(0.88, 1.14);
        enemy.setAngle(enemy.body.velocity.x * 0.015);
      } else {
        const bounce = Math.sin(phase) * 0.04;
        enemy.setScale(1.08 - bounce, 0.92 + bounce);
        enemy.setAngle(0);
      }
      return;
    }

    const pulse = Math.sin(time * 0.006 + enemy.x * 0.02);
    enemy.setScale(1 + pulse * 0.025, 1 - pulse * 0.025);
    enemy.setAngle(pulse * 1.5);
  }

  fireEnemyBullet(enemy, direction) {
    const bullet = this.enemyBullets.create(
      enemy.x + direction * 25,
      enemy.y,
      "enemyBullet",
    );
    bullet.body.allowGravity = false;
    bullet.setVelocityX(direction * ENEMY_BULLET_SPEED);

    this.time.delayedCall(3500, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  hitEnemy() {
    this.takeDamage();
  }

  hitEnemyBullet(_player, bullet) {
    bullet.destroy();
    this.takeDamage();
  }

  damageEnemy(firstObject, secondObject) {
    const enemy = firstObject.getData?.("type") ? firstObject : secondObject;
    const bullet = enemy === firstObject ? secondObject : firstObject;

    if (!enemy.active || !bullet.active) {
      return;
    }

    bullet.destroy();

    const remainingLives = enemy.getData("lives") - 1;
    enemy.setData("lives", remainingLives);

    if (remainingLives === 0) {
      enemy.disableBody(true, true);
      enemy.getData("healthText").destroy();
      this.kills += 1;
      this.createBurst(enemy.x, enemy.y, 0xfb7185);
      playTone(this, 130, 0.24, "sawtooth", 0.05);
      return;
    }

    enemy.getData("healthText").setText("♥".repeat(remainingLives));
    enemy.setTint(0xfca5a5);
    this.time.delayedCall(140, () => {
      if (enemy.active) {
        enemy.clearTint();
      }
    });
  }

  hitSpikes() {
    this.takeDamage();
  }

  takeDamage() {
    if (this.isHurt || this.gameOver) {
      return;
    }

    this.lives -= 1;
    this.updateLivesText();
    playTone(this, 150, 0.18, "sawtooth", 0.06);

    if (this.lives === 0) {
      this.gameOver = true;
      this.player.setVelocity(0, 0);
      this.scene.start("GameOverScene", this.getRunStats());
      return;
    }

    this.isHurt = true;
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.setVelocity(0, 0);
    this.jumpsRemaining = 2;
    this.player.setTint(0xef4444);
    this.updateWeapon();
    this.updatePlayerLimbs(0, false);

    this.time.delayedCall(this.difficultySettings.hurtDelay, () => {
      this.isHurt = false;
      this.player.clearTint();
    });
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,D");
    this.jumpKeys = [this.cursors.up, this.wasd.W, this.cursors.space];
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.dashKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  tryDash(time, direction) {
    if (time < this.nextDashAt || this.isDashing) {
      return;
    }

    this.isDashing = true;
    this.dashDirection = direction;
    this.dashEndsAt = time + DASH_DURATION;
    this.nextDashAt = time + DASH_COOLDOWN;
    this.player.setVelocityX(direction * DASH_SPEED);
    this.player.setTint(0x67e8f9);
    playTone(this, 390, 0.1, "sawtooth", 0.035);
  }

  pauseGame() {
    this.scene.pause();
    this.scene.launch("PauseScene");
  }

  update(time, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.pauseGame();
      return;
    }

    this.updateMovingPlatforms(time);
    this.updateEnemies(time);
    this.updateBoss(time);
    this.updateRunHud(time);

    if (this.weaponMode === "spread" && time >= this.weaponEndsAt) {
      this.weaponMode = "basic";
      playTone(this, 300, 0.1, "sine", 0.03);
    }

    if (this.gameOver || this.isHurt) {
      return;
    }

    const movingLeft = this.cursors.left.isDown || this.wasd.A.isDown;
    const movingRight = this.cursors.right.isDown || this.wasd.D.isDown;
    const jumpPressed = this.jumpKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));

    const facingDirection = this.player.flipX ? -1 : 1;

    if (Phaser.Input.Keyboard.JustDown(this.dashKey)) {
      this.tryDash(time, movingLeft ? -1 : movingRight ? 1 : facingDirection);
    }

    if (this.isDashing && time < this.dashEndsAt) {
      this.player.setVelocityX(this.dashDirection * DASH_SPEED);
    } else if (this.isDashing) {
      this.isDashing = false;
      this.player.clearTint();
    }

    if (this.isDashing) {
      // Dash ponechává nastavenou rychlost po celou dobu trvání.
    } else if (movingLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (this.player.body.blocked.down) {
      this.jumpsRemaining = 2;
    }

    if (jumpPressed && this.jumpsRemaining > 0) {
      this.player.setVelocityY(JUMP_VELOCITY);
      this.jumpsRemaining -= 1;
    }

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.shoot(time);
    }

    this.updateWeapon();
    this.updatePlayerLimbs(delta, (movingLeft || movingRight) && this.player.body.blocked.down);
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 1000 },
      debug: false,
    },
  },
  scene: [MenuScene, MainScene, PauseScene, GameOverScene, VictoryScene],
});
