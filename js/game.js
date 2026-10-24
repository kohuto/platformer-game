const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const LEVEL_WIDTH = 5760;
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
    return JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY)) ?? { wins: 0, bestTime: null, unlockedSector: 1 };
  } catch (_error) {
    return { wins: 0, bestTime: null, unlockedSector: 1 };
  }
}

function saveProgress(progress) {
  localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress));
}

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.selectedDifficulty = "normal";
    this.selectedSector = 1;
    this.progress = loadProgress();
    this.cameras.main.setBackgroundColor("#071126");
    this.add.circle(110, 90, 72, 0x22d3ee, 0.2);
    this.add.circle(850, 460, 130, 0xa78bfa, 0.16);

    this.add.text(480, 105, "SKOK DO DOBRODRUŽSTVÍ", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#67e8f9",
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(480, 165, "Platformer Game", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "52px",
      fontStyle: "bold",
      color: "#e0f2fe",
    }).setOrigin(0.5);

    const controlsPanel = this.add.rectangle(480, 315, 500, 180, 0x0f172a, 0.82)
      .setStrokeStyle(2, 0x22d3ee);
    controlsPanel.setInteractive({ useHandCursor: false });

    this.add.text(480, 255, "OVLÁDÁNÍ", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#facc15",
    }).setOrigin(0.5);

    this.add.text(480, 300, "Pohyb doleva / doprava:  ← →  nebo  A / D", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      color: "#e2e8f0",
    }).setOrigin(0.5);

    this.add.text(480, 345, "Skok:  ↑, W nebo mezerník", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      color: "#e2e8f0",
    }).setOrigin(0.5);

    this.add.text(480, 380, "Střelba:  X   ·   Dash: Shift", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      color: "#e2e8f0",
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(480, 480, 280, 56, 0x22d3ee)
      .setStrokeStyle(3, 0xa5f3fc)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(480, 480, "ZAČÍT HRU", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#082f49",
    }).setOrigin(0.5);

    const startGame = () => this.scene.start("MainScene", {
      difficulty: this.selectedDifficulty,
      sector: this.selectedSector,
    });
    startButton.on("pointerover", () => startButton.setFillStyle(0x67e8f9));
    startButton.on("pointerout", () => startButton.setFillStyle(0x22d3ee));
    startButton.on("pointerdown", startGame);
    startLabel.setInteractive({ useHandCursor: true }).on("pointerdown", startGame);

    this.add.text(480, 420, "Obtížnost:  1 Lehká  ·  2 Normální  ·  3 Těžká  ·  S: sektor", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#bae6fd",
    }).setOrigin(0.5);

    this.difficultyText = this.add.text(480, 445, "Vybráno: NORMÁLNÍ · SEKTOR 1", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: "#facc15",
    }).setOrigin(0.5);

    this.add.text(480, 530, `Rekord: ${this.progress.bestTime === null ? "zatím žádný" : formatDuration(this.progress.bestTime)}  ·  Dokončení: ${this.progress.wins}  ·  Sektor 2: ${this.progress.unlockedSector >= 2 ? "odemčen" : "zamčen"}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", startGame);
    this.input.keyboard.once("keydown-SPACE", startGame);
    ["ONE", "TWO", "THREE"].forEach((key, index) => {
      this.input.keyboard.on(`keydown-${key}`, () => {
        this.selectedDifficulty = ["easy", "normal", "hard"][index];
        this.updateSelectionText();
      });
    });
    this.input.keyboard.on("keydown-S", () => {
      if (this.progress.unlockedSector >= 2) {
        this.selectedSector = this.selectedSector === 1 ? 2 : 1;
        this.updateSelectionText();
      }
    });
  }

  updateSelectionText() {
    this.difficultyText.setText(`Vybráno: ${DIFFICULTIES[this.selectedDifficulty].label} · SEKTOR ${this.selectedSector}`);
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
    this.sector = data.sector ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor("#120b25");
    this.add.circle(125, 445, 160, 0xfb7185, 0.16);
    this.add.circle(830, 90, 105, 0xa78bfa, 0.14);

    this.add.text(480, 125, "Konec hry", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "54px",
      fontStyle: "bold",
      color: "#fecaca",
    }).setOrigin(0.5);

    this.add.text(480, 205, `Nasbírané mince: ${this.finalScore}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "24px",
      color: "#fef3c7",
    }).setOrigin(0.5);

    this.add.text(480, 242, `Poražení nepřátelé: ${this.finalKills}  ·  Čas: ${formatDuration(this.finalTime)}  ·  ${DIFFICULTIES[this.difficulty].label}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      color: "#fed7aa",
    }).setOrigin(0.5);

    const restartGame = () => this.scene.start("MainScene", { difficulty: this.difficulty, sector: this.sector });
    const returnToMenu = () => this.scene.start("MenuScene");

    this.createButton(480, 310, "RESTART HRY", 0x22c55e, 0x052e16, restartGame);
    this.createButton(480, 395, "ÚVODNÍ MENU", 0x334155, 0xf8fafc, returnToMenu);

    this.add.text(480, 485, "Enter / R: restart  ·  Esc / M: úvodní menu", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", restartGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-ESC", returnToMenu);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    const button = this.add.rectangle(x, y, 300, 62, backgroundColor)
      .setStrokeStyle(3, 0xe2e8f0)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
    text.on("pointerdown", onClick);
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
    this.sector = data.sector ?? 1;
  }

  create() {
    this.cameras.main.setBackgroundColor("#061b2b");
    this.add.circle(130, 100, 120, 0x22d3ee, 0.14);
    this.add.circle(820, 450, 165, 0xfacc15, 0.12);
    this.add.rectangle(480, 275, 580, 365, 0x0f172a, 0.8)
      .setStrokeStyle(3, 0x67e8f9);

    this.add.text(480, 135, "Vítězství!", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "58px",
      fontStyle: "bold",
      color: "#a5f3fc",
      stroke: "#083344",
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(480, 210, "Posbíral/a jsi všechny mince a porazil/a bosse.", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      color: "#e0f2fe",
    }).setOrigin(0.5);

    this.add.text(480, 250, `Celkem mincí: ${this.finalScore}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "25px",
      fontStyle: "bold",
      color: "#fde68a",
    }).setOrigin(0.5);

    const challengeStatus = this.finalTime <= TIME_CHALLENGE_SECONDS ? "Časová výzva splněna!" : "Časová výzva: zkus to pod 5:00";
    this.add.text(480, 282, `Poražení nepřátelé: ${this.finalKills}  ·  Čas: ${formatDuration(this.finalTime)}  ·  ${DIFFICULTIES[this.difficulty].label}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      color: "#bae6fd",
    }).setOrigin(0.5);

    this.add.text(480, 305, challengeStatus, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      fontStyle: "bold",
      color: this.finalTime <= TIME_CHALLENGE_SECONDS ? "#86efac" : "#cbd5e1",
    }).setOrigin(0.5);

    const restartGame = () => this.scene.start("MainScene", { difficulty: this.difficulty, sector: this.sector });
    const returnToMenu = () => this.scene.start("MenuScene");

    this.createButton(480, 355, "HRÁT ZNOVU", 0x22d3ee, 0x083344, restartGame);
    this.createButton(480, 430, "ÚVODNÍ MENU", 0x334155, 0xf8fafc, returnToMenu);

    this.add.text(480, 505, "Enter / R: hrát znovu  ·  Esc / M: úvodní menu", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#bae6fd",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", restartGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-ESC", returnToMenu);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    const button = this.add.rectangle(x, y, 300, 58, backgroundColor)
      .setStrokeStyle(3, 0xe0f2fe)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
    text.on("pointerdown", onClick);
  }
}

class PauseScene extends Phaser.Scene {
  constructor() {
    super("PauseScene");
  }

  create() {
    this.add.rectangle(480, 270, GAME_WIDTH, GAME_HEIGHT, 0x0f172a, 0.72);

    this.add.rectangle(480, 270, 520, 350, 0x1e293b, 0.96)
      .setStrokeStyle(3, 0x93c5fd);

    this.add.text(480, 155, "Hra pozastavena", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "42px",
      fontStyle: "bold",
      color: "#f8fafc",
    }).setOrigin(0.5);

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

    this.createButton(480, 245, "POKRAČOVAT", 0x22c55e, 0x052e16, resumeGame);
    this.createButton(480, 325, "RESTART HRY", 0xf59e0b, 0x451a03, restartGame);
    this.createButton(480, 405, "ÚVODNÍ MENU", 0x475569, 0xf8fafc, returnToMenu);

    this.add.text(480, 485, "Esc: pokračovat  ·  R: restart  ·  M: úvodní menu", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "16px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ESC", resumeGame);
    this.input.keyboard.once("keydown-R", restartGame);
    this.input.keyboard.once("keydown-M", returnToMenu);
  }

  createButton(x, y, label, backgroundColor, textColor, onClick) {
    const button = this.add.rectangle(x, y, 300, 56, backgroundColor)
      .setStrokeStyle(3, 0xe2e8f0)
      .setInteractive({ useHandCursor: true });
    const text = this.add.text(x, y, label, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "21px",
      fontStyle: "bold",
      color: textColor,
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on("pointerover", () => button.setScale(1.04));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
    text.on("pointerdown", onClick);
  }
}

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  init(data) {
    this.difficulty = data.difficulty ?? "normal";
    this.sector = data.sector ?? 1;
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
    this.cameras.main.setBackgroundColor("#020617");

    const sky = this.add.graphics().setDepth(-20);
    sky.fillStyle(0x020617);
    sky.fillRect(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    sky.fillStyle(0x0f1d3d);
    sky.fillRect(0, 100, LEVEL_WIDTH, 180);
    sky.fillStyle(0x172554);
    sky.fillRect(0, 260, LEVEL_WIDTH, 120);
    sky.fillStyle(0x1e1b4b);
    sky.fillCircle(220, 105, 58);
    sky.fillStyle(0xc4b5fd, 0.8);
    sky.fillCircle(205, 91, 8);
    sky.fillCircle(238, 123, 5);

    const mountains = this.add.graphics().setDepth(-15);
    mountains.fillStyle(0x111c3d);
    for (let x = -80; x < LEVEL_WIDTH + 160; x += 180) {
      mountains.fillTriangle(x, 410, x + 90, 200 + (x % 3) * 18, x + 180, 410);
    }
    mountains.fillStyle(0x172554);
    for (let x = -40; x < LEVEL_WIDTH + 180; x += 145) {
      mountains.fillTriangle(x, 455, x + 72, 275 + (x % 4) * 12, x + 145, 455);
    }

    const city = this.add.graphics().setDepth(-10);
    city.fillStyle(0x0b1128);
    for (let x = 40; x < LEVEL_WIDTH; x += 110) {
      const height = 48 + ((x / 10) % 4) * 24;
      city.fillRect(x, 470 - height, 72, height);
      city.fillStyle(0x22d3ee, 0.45);
      city.fillRect(x + 12, 482 - height, 8, 3);
      city.fillRect(x + 37, 500 - height, 8, 3);
      city.fillStyle(0x0b1128);
    }

    const clouds = this.add.graphics().setDepth(-5);
    clouds.fillStyle(0xbae6fd, 0.18);
    [[120, 88], [480, 145], [780, 78], [1120, 115], [1420, 70], [1740, 145], [2050, 92], [2380, 140], [2680, 76], [3020, 112], [3360, 70], [3680, 145], [4050, 86], [4380, 130], [4720, 75], [5070, 120], [5420, 90], [5680, 145]].forEach(([x, y]) => {
      clouds.fillCircle(x, y, 22);
      clouds.fillCircle(x + 27, y - 10, 30);
    clouds.fillCircle(x + 57, y, 20);
    });

    const gateArchitecture = this.add.graphics().setDepth(-2);
    [1950, 3850, 4800, 5600].forEach((x) => {
      gateArchitecture.fillStyle(0x0b1128, 0.9);
      gateArchitecture.fillRect(x - 46, 160, 92, 344);
      gateArchitecture.fillStyle(0x155e75, 0.8);
      gateArchitecture.fillRect(x - 42, 170, 7, 324);
      gateArchitecture.fillRect(x + 35, 170, 7, 324);
      gateArchitecture.fillStyle(0x22d3ee, 0.55);
      gateArchitecture.fillRect(x - 42, 175, 7, 76);
      gateArchitecture.fillRect(x + 35, 175, 7, 76);
    });

    this.platforms = this.physics.add.staticGroup();
    this.addPlatform(480, 520, 8);
    this.addPlatform(165, 400, 2);
    this.addPlatform(420, 330, 2);
    this.addPlatform(690, 255, 2);
    this.addPlatform(855, 390, 1);
    this.addPlatform(1440, 520, 8);
    this.addPlatform(1110, 405, 2);
    this.addPlatform(1350, 325, 2);
    this.addPlatform(1590, 250, 2);
    this.addPlatform(1800, 385, 1);
    this.addPlatform(2400, 520, 8);
    this.addPlatform(2100, 400, 2);
    this.addPlatform(2350, 320, 2);
    this.addPlatform(2620, 245, 2);
    this.addPlatform(2800, 385, 1);
    this.addPlatform(3360, 520, 8);
    this.addPlatform(3070, 405, 2);
    this.addPlatform(3290, 330, 2);
    this.addPlatform(3550, 250, 2);
    this.addPlatform(3740, 385, 1);
    this.addPlatform(4320, 520, 8);
    this.addPlatform(4020, 400, 2);
    this.addPlatform(4240, 315, 2);
    this.addPlatform(4460, 230, 2);
    this.addPlatform(4700, 370, 1);
    this.addPlatform(5280, 520, 8);
    this.addPlatform(5000, 395, 2);
    this.addPlatform(5220, 310, 2);
    this.addPlatform(5480, 245, 2);
    this.addPlatform(5700, 380, 1);

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    this.add.text(22, 20, this.sector === 2 ? "SEKTOR 2: VÝZVA" : "NEONOVÝ SEKTOR", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#e0f2fe",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.livesText = this.add.text(620, 20, "Životy:", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#e0f2fe",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.lifeIcons = Array.from({ length: MAX_LIVES }, (_value, index) => (
      this.add.image(715 + index * 29, 31, "health")
        .setDisplaySize(24, 22)
        .setScrollFactor(0)
    ));

    this.scoreText = this.add.text(805, 20, "Mince: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#fef3c7",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.timeText = this.add.text(445, 20, "Čas: 0:00", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#e0f2fe",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.ammoText = this.add.text(22, 48, `Náboje: ${MAX_AMMO} / ${MAX_AMMO}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#fef3c7",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.killText = this.add.text(800, 48, "Eliminace: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#fda4af",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.dashText = this.add.text(500, 48, "Dash: připraven", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "17px",
      fontStyle: "bold",
      color: "#a5f3fc",
      stroke: "#020617",
      strokeThickness: 4,
    }).setScrollFactor(0);
  }

  addPlatform(x, y, widthInTiles) {
    const platform = this.platforms.create(x, y, "platform");
    platform.setDisplaySize(widthInTiles * 128, 32);
    platform.setDepth(0);
    platform.refreshBody();
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
    this.cameras.main.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.1, 0);
    this.cameras.main.setDeadzone(240, GAME_HEIGHT);
  }

  createMovingPlatforms() {
    this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });

    [
      { x: 920, y: 285, width: 128, amplitude: 105, speed: 0.0012, axis: "x" },
      { x: 1930, y: 335, width: 128, amplitude: 75, speed: 0.001, axis: "y" },
      { x: 3650, y: 310, width: 128, amplitude: 120, speed: 0.0011, axis: "x" },
      { x: 4550, y: 355, width: 128, amplitude: 90, speed: 0.0013, axis: "y" },
      { x: 5350, y: 300, width: 128, amplitude: 115, speed: 0.001, axis: "x" },
    ].forEach((config) => this.addMovingPlatform(config));

    this.physics.add.collider(this.player, this.movingPlatforms);
  }

  addMovingPlatform(config) {
    const platform = this.movingPlatforms.create(config.x, config.y, "platform");
    platform.setDisplaySize(config.width, 32);
    platform.setTint(0xa5f3fc);
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

    [
      [180, 365],
      [190, 365],
      [380, 295],
      [455, 295],
      [650, 220],
      [725, 220],
      [855, 355],
      [1070, 370],
      [1140, 370],
      [1310, 290],
      [1380, 290],
      [1550, 215],
      [1625, 215],
      [1800, 350],
      [2050, 365],
      [2140, 365],
      [2310, 285],
      [2390, 285],
      [2580, 210],
      [2650, 210],
      [2800, 350],
      [3030, 370],
      [3100, 370],
      [3250, 295],
      [3320, 295],
      [3510, 215],
      [3580, 215],
      [3740, 350],
      [3980, 365],
      [4050, 365],
      [4200, 280],
      [4270, 280],
      [4420, 195],
      [4490, 195],
      [4700, 335],
      [4960, 360],
      [5030, 360],
      [5180, 275],
      [5250, 275],
      [5440, 210],
      [5510, 210],
      [5700, 345],
    ].forEach(([x, y]) => this.coins.create(x, y, "coin"));

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  collectCoin(_player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`Mince: ${this.score}`);
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
      progress.unlockedSector = 2;
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

    [
      [560, 478],
      [700, 210],
      [1350, 290],
      [1800, 350],
      [2350, 285],
      [2800, 350],
      [3550, 215],
      [4460, 195],
      [5480, 210],
    ].forEach(([x, y]) => this.healthPickups.create(x, y, "health"));

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
    [[1200, 370], [2700, 210], [4470, 170]].forEach(([x, y]) => {
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

    [
      [855, 350],
      [1590, 210],
      [2380, 285],
      [2630, 210],
      [2800, 350],
      [3290, 295],
      [4240, 280],
      [5220, 275],
      [5700, 345],
    ].forEach(([x, y]) => this.ammoPickups.create(x, y, "ammoPickup"));

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
    this.ammoText.setText(`Náboje: ${this.ammo} / ${MAX_AMMO}`);
  }

  getRunStats() {
    return {
      score: this.score,
      kills: this.kills,
      time: Math.floor((this.time.now - this.startedAt) / 1000),
      difficulty: this.difficulty,
      sector: this.sector,
    };
  }

  updateRunHud(time) {
    const elapsedSeconds = Math.floor((time - this.startedAt) / 1000);
    this.timeText.setText(`Čas: ${formatDuration(elapsedSeconds)}`);
    this.killText.setText(`Eliminace: ${this.kills}`);

    const remaining = Math.max(0, this.nextDashAt - time);
    if (remaining === 0) {
      this.dashText.setText("Dash: připraven");
      this.dashText.setColor("#a5f3fc");
    } else {
      this.dashText.setText(`Dash: ${(remaining / 1000).toFixed(1)} s`);
      this.dashText.setColor("#94a3b8");
    }

    if (this.weaponMode === "spread") {
      this.ammoText.setText(`Náboje: ${this.ammo} / ${MAX_AMMO}  ·  Trojstřela: ${Math.max(0, Math.ceil((this.weaponEndsAt - time) / 1000))} s`);
    } else {
      this.updateAmmoText();
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

    [
      [350, 488],
      [382, 488],
      [690, 227],
      [1040, 488],
      [1072, 488],
      [1450, 488],
      [1590, 222],
      [2020, 488],
      [2052, 488],
      [2500, 488],
      [2620, 217],
      [3150, 488],
      [3182, 488],
      [3550, 222],
      [4100, 488],
      [4132, 488],
      [4460, 202],
      [5050, 488],
      [5082, 488],
      [5480, 217],
    ].forEach(([x, y]) => this.spikes.create(x, y, "spikes"));

    this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
  }

  createBarriers() {
    this.barriers = this.physics.add.staticGroup();

    this.addBarrier(1950, 3);
    this.addBarrier(3850, 4);
    this.addBarrier(4800, 4);
    this.addBarrier(5600, 5);

    this.physics.add.collider(this.player, this.barriers);
    this.physics.add.overlap(this.bullets, this.barriers, this.damageBarrier, null, this);
  }

  createLogicGates() {
    this.logicGates = this.physics.add.staticGroup();
    this.switches = this.physics.add.staticGroup();

    this.addLogicGate({ gateX: 3050, switchX: 2940, label: "AKTIVUJ SPÍNAČ" });
    this.addLogicGate({ gateX: 5100, switchX: 4960, label: "AKTIVUJ SPÍNAČ" });

    this.physics.add.collider(this.player, this.logicGates);
    this.physics.add.overlap(this.player, this.switches, this.activateSwitch, null, this);
  }

  addLogicGate(config) {
    const gate = this.logicGates.create(config.gateX, 344, "barrier");
    gate.setDisplaySize(44, 320);
    gate.setTint(0xa78bfa);
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

    const gameSwitch = this.switches.create(config.switchX, 475, "switch");
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

    this.addCheckpoint(1110, 350, 1110, 360);
    this.addCheckpoint(2150, 455, 2150, 470);
    this.addCheckpoint(3070, 350, 3070, 360);
    this.addCheckpoint(4240, 260, 4240, 270);
    this.addCheckpoint(5000, 345, 5000, 350);

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

    this.createEnemy({
      x: 420,
      y: 280,
      texture: "enemy",
      type: "patrol",
      lives: 2,
      minX: 320,
      maxX: 520,
      speed: ENEMY_SPEED,
    });
    this.createEnemy({
      x: 1350,
      y: 285,
      texture: "hopper",
      type: "hopper",
      lives: 1,
      minX: 1245,
      maxX: 1455,
      speed: 95,
      nextActionAt: 700,
    });
    this.createEnemy({
      x: 1800,
      y: 348,
      texture: "sentry",
      type: "sentry",
      lives: 3,
      nextActionAt: 1200,
    });
    this.createEnemy({
      x: 3290,
      y: 292,
      texture: "enemy",
      type: "patrol",
      lives: 2,
      minX: 3200,
      maxX: 3380,
      speed: ENEMY_SPEED,
    });
    this.createEnemy({
      x: 3740,
      y: 348,
      texture: "sentry",
      type: "sentry",
      lives: 3,
      nextActionAt: 2400,
    });
    this.createEnemy({
      x: 4240,
      y: 280,
      texture: "hopper",
      type: "hopper",
      lives: 1,
      minX: 4140,
      maxX: 4340,
      speed: 105,
      nextActionAt: 1700,
    });
    this.createEnemy({
      x: 4460,
      y: 193,
      texture: "enemy",
      type: "patrol",
      lives: 2,
      minX: 4360,
      maxX: 4560,
      speed: 90,
    });
    this.createEnemy({
      x: 4700,
      y: 337,
      texture: "sentry",
      type: "sentry",
      lives: 3,
      nextActionAt: 3400,
    });
    this.createEnemy({
      x: 5220,
      y: 275,
      texture: "hopper",
      type: "hopper",
      lives: 1,
      minX: 5120,
      maxX: 5320,
      speed: 110,
      nextActionAt: 2900,
    });
    this.createEnemy({
      x: 5480,
      y: 208,
      texture: "enemy",
      type: "patrol",
      lives: 2,
      minX: 5380,
      maxX: 5580,
      speed: 95,
    });
    this.createEnemy({
      x: 5700,
      y: 347,
      texture: "sentry",
      type: "sentry",
      lives: 3,
      nextActionAt: 4100,
    });

    if (this.sector === 2) {
      this.createEnemy({ x: 2350, y: 285, texture: "sentry", type: "sentry", lives: 3, nextActionAt: 2000 });
      this.createEnemy({ x: 4020, y: 365, texture: "enemy", type: "patrol", lives: 2, minX: 3920, maxX: 4120, speed: 105 });
      this.createEnemy({ x: 5000, y: 360, texture: "hopper", type: "hopper", lives: 2, minX: 4900, maxX: 5100, speed: 120, nextActionAt: 2600 });
    }

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
    this.boss = this.physics.add.sprite(5700, 458, "boss");
    this.boss.setDepth(2);
    this.boss.setVelocityX(-55);
    this.physics.add.collider(this.boss, this.platforms);
    this.bossHealthText = this.add.text(5700, 360, `BOSS: ${this.bossLives}`, {
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

    if (this.boss.x <= 5665) {
      this.boss.setVelocityX(55);
      this.boss.setFlipX(false);
    } else if (this.boss.x >= 5715) {
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
