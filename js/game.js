const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const LEVEL_WIDTH = 2880;
const MAX_LIVES = 3;
const MAX_AMMO = 10;
const PLAYER_SPEED = 260;
const JUMP_VELOCITY = -520;
const BULLET_SPEED = 560;
const SHOOT_COOLDOWN = 220;
const ENEMY_SPEED = 70;
const ENEMY_BULLET_SPEED = 180;

class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1e3a5f");
    this.add.circle(110, 90, 72, 0x60a5fa, 0.18);
    this.add.circle(850, 460, 130, 0x4ade80, 0.12);

    this.add.text(480, 105, "SKOK DO DOBRODRUŽSTVÍ", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#93c5fd",
      letterSpacing: 4,
    }).setOrigin(0.5);

    this.add.text(480, 165, "Platformer Game", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "52px",
      fontStyle: "bold",
      color: "#ffffff",
    }).setOrigin(0.5);

    const controlsPanel = this.add.rectangle(480, 315, 500, 180, 0x0f172a, 0.55)
      .setStrokeStyle(2, 0x475569);
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

    this.add.text(480, 380, "Střelba:  X", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "19px",
      color: "#e2e8f0",
    }).setOrigin(0.5);

    const startButton = this.add.rectangle(480, 455, 280, 64, 0x22c55e)
      .setStrokeStyle(3, 0x86efac)
      .setInteractive({ useHandCursor: true });
    const startLabel = this.add.text(480, 455, "ZAČÍT HRU", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "24px",
      fontStyle: "bold",
      color: "#052e16",
    }).setOrigin(0.5);

    const startGame = () => this.scene.start("MainScene");
    startButton.on("pointerover", () => startButton.setFillStyle(0x4ade80));
    startButton.on("pointerout", () => startButton.setFillStyle(0x22c55e));
    startButton.on("pointerdown", startGame);
    startLabel.setInteractive({ useHandCursor: true }).on("pointerdown", startGame);

    this.add.text(480, 520, "Pro spuštění můžeš také stisknout Enter nebo mezerník", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "15px",
      color: "#cbd5e1",
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", startGame);
    this.input.keyboard.once("keydown-SPACE", startGame);
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  init(data) {
    this.finalScore = data.score ?? 0;
  }

  create() {
    this.cameras.main.setBackgroundColor("#2a1622");
    this.add.circle(125, 445, 160, 0xef4444, 0.12);
    this.add.circle(830, 90, 105, 0xfacc15, 0.1);

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

    const restartGame = () => this.scene.start("MainScene");
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

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createCamera();
    this.createProjectiles();
    this.createCollectibles();
    this.createHealthPickups();
    this.createAmmoPickups();
    this.createHazards();
    this.createCheckpoints();
    this.createEnemies();
    this.createControls();
  }

  createTextures() {
    if (this.textures.exists("platform")) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(0x4ade80);
    graphics.fillRect(0, 0, 128, 32);
    graphics.fillStyle(0x22c55e);
    graphics.fillRect(0, 0, 128, 7);
    graphics.generateTexture("platform", 128, 32);
    graphics.clear();

    graphics.fillStyle(0xfbbf24);
    graphics.fillRoundedRect(0, 0, 34, 46, 8);
    graphics.fillStyle(0x1e3a8a);
    graphics.fillRect(7, 18, 20, 19);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(11, 11, 4);
    graphics.fillCircle(23, 11, 4);
    graphics.generateTexture("player", 34, 46);
    graphics.clear();

    graphics.fillStyle(0xfacc15);
    graphics.fillCircle(12, 12, 12);
    graphics.lineStyle(3, 0xf59e0b);
    graphics.strokeCircle(12, 12, 10);
    graphics.fillStyle(0xffffff, 0.75);
    graphics.fillCircle(8, 8, 3);
    graphics.generateTexture("coin", 24, 24);
    graphics.clear();

    graphics.fillStyle(0xef4444);
    graphics.fillCircle(9, 8, 7);
    graphics.fillCircle(19, 8, 7);
    graphics.fillTriangle(3, 10, 25, 10, 14, 24);
    graphics.lineStyle(2, 0x991b1b);
    graphics.strokeCircle(9, 8, 7);
    graphics.strokeCircle(19, 8, 7);
    graphics.strokeTriangle(3, 10, 25, 10, 14, 24);
    graphics.generateTexture("health", 28, 26);
    graphics.clear();

    graphics.fillStyle(0x94a3b8);
    graphics.fillTriangle(0, 24, 10, 0, 20, 24);
    graphics.fillTriangle(12, 24, 22, 0, 32, 24);
    graphics.lineStyle(2, 0x475569);
    graphics.strokeTriangle(0, 24, 10, 0, 20, 24);
    graphics.strokeTriangle(12, 24, 22, 0, 32, 24);
    graphics.generateTexture("spikes", 32, 24);
    graphics.clear();

    graphics.fillStyle(0xf8fafc);
    graphics.fillRoundedRect(0, 0, 18, 8, 4);
    graphics.fillStyle(0x38bdf8);
    graphics.fillCircle(14, 4, 3);
    graphics.generateTexture("bullet", 18, 8);
    graphics.clear();

    graphics.fillStyle(0xfacc15);
    graphics.fillRect(4, 7, 12, 22);
    graphics.fillStyle(0xf97316);
    graphics.fillRoundedRect(4, 0, 12, 10, 5);
    graphics.fillStyle(0x92400e);
    graphics.fillRect(4, 25, 12, 4);
    graphics.lineStyle(2, 0x78350f);
    graphics.strokeRect(4, 7, 12, 22);
    graphics.generateTexture("ammoPickup", 20, 30);
    graphics.clear();

    graphics.fillStyle(0xef4444);
    graphics.fillRoundedRect(0, 0, 36, 42, 8);
    graphics.fillStyle(0x7f1d1d);
    graphics.fillRect(5, 20, 26, 16);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(11, 12, 4);
    graphics.fillCircle(25, 12, 4);
    graphics.fillStyle(0x111827);
    graphics.fillCircle(11, 12, 1.5);
    graphics.fillCircle(25, 12, 1.5);
    graphics.generateTexture("enemy", 36, 42);
    graphics.clear();

    graphics.fillStyle(0x8b5cf6);
    graphics.fillRoundedRect(0, 5, 34, 33, 12);
    graphics.fillStyle(0xc4b5fd);
    graphics.fillRect(5, 25, 24, 8);
    graphics.fillStyle(0xffffff);
    graphics.fillCircle(10, 15, 4);
    graphics.fillCircle(24, 15, 4);
    graphics.fillStyle(0x312e81);
    graphics.fillCircle(10, 15, 1.5);
    graphics.fillCircle(24, 15, 1.5);
    graphics.generateTexture("hopper", 34, 38);
    graphics.clear();

    graphics.fillStyle(0xf97316);
    graphics.fillRoundedRect(0, 8, 40, 26, 7);
    graphics.fillStyle(0x7c2d12);
    graphics.fillRect(8, 3, 24, 8);
    graphics.fillStyle(0xfef3c7);
    graphics.fillCircle(13, 21, 4);
    graphics.fillCircle(27, 21, 4);
    graphics.fillStyle(0x431407);
    graphics.fillCircle(13, 21, 1.5);
    graphics.fillCircle(27, 21, 1.5);
    graphics.generateTexture("sentry", 40, 34);
    graphics.clear();

    graphics.fillStyle(0xfb7185);
    graphics.fillRoundedRect(0, 0, 14, 8, 4);
    graphics.fillStyle(0xfef3c7);
    graphics.fillCircle(10, 4, 2);
    graphics.generateTexture("enemyBullet", 14, 8);
    graphics.clear();

    graphics.fillStyle(0x334155);
    graphics.fillRect(2, 0, 5, 52);
    graphics.fillStyle(0x2563eb);
    graphics.fillTriangle(7, 4, 30, 12, 7, 25);
    graphics.lineStyle(2, 0x1e3a8a);
    graphics.strokeTriangle(7, 4, 30, 12, 7, 25);
    graphics.fillStyle(0xf8fafc);
    graphics.fillCircle(4.5, 2, 4);
    graphics.generateTexture("checkpoint", 32, 52);
    graphics.clear();

    graphics.fillStyle(0x334155);
    graphics.fillRoundedRect(0, 2, 29, 9, 3);
    graphics.fillStyle(0x94a3b8);
    graphics.fillRect(18, 4, 12, 4);
    graphics.fillStyle(0x1e293b);
    graphics.fillRect(8, 10, 7, 4);
    graphics.fillStyle(0xfacc15);
    graphics.fillCircle(25, 6, 2);
    graphics.generateTexture("weapon", 30, 14);
    graphics.destroy();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#60a5fa");

    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.7);
    [[120, 88], [480, 145], [780, 78], [1120, 115], [1420, 70], [1740, 145], [2050, 92], [2380, 140], [2680, 76]].forEach(([x, y]) => {
      clouds.fillCircle(x, y, 22);
      clouds.fillCircle(x + 27, y - 10, 30);
      clouds.fillCircle(x + 57, y, 20);
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

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    this.add.text(22, 20, "Základní herní scéna", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    }).setScrollFactor(0);

    this.livesText = this.add.text(620, 20, "Životy:", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
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
      color: "#0f172a",
    }).setScrollFactor(0);

    this.ammoText = this.add.text(22, 48, `Náboje: ${MAX_AMMO} / ${MAX_AMMO}`, {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#0f172a",
    }).setScrollFactor(0);
  }

  addPlatform(x, y, widthInTiles) {
    const platform = this.platforms.create(x, y, "platform");
    platform.setDisplaySize(widthInTiles * 128, 32);
    platform.refreshBody();
  }

  createPlayer() {
    this.player = this.physics.add.sprite(100, 300, "player");
    this.player.setBounce(0.05);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(1);
    this.physics.add.collider(this.player, this.platforms);
    this.playerLimbs = this.add.graphics().setDepth(0.5);
    this.weapon = this.add.image(this.player.x + 24, this.player.y + 4, "weapon")
      .setDepth(2);
    this.walkCycle = 0;
    this.jumpsRemaining = 2;
    this.lives = MAX_LIVES;
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
    ].forEach(([x, y]) => this.coins.create(x, y, "coin"));

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  collectCoin(_player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`Mince: ${this.score}`);
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
    const bullet = this.bullets.create(
      this.player.x + direction * 38,
      this.player.y + 4,
      "bullet",
    );

    bullet.body.allowGravity = false;
    bullet.setVelocityX(direction * BULLET_SPEED);
    this.ammo -= 1;
    this.updateAmmoText();
    this.lastShotAt = time;

    this.time.delayedCall(1200, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
  }

  createAmmoPickups() {
    this.ammoPickups = this.physics.add.staticGroup();

    [
      [855, 350],
      [1590, 210],
      [2380, 285],
      [2630, 210],
      [2800, 350],
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
  }

  updateAmmoText() {
    this.ammoText.setText(`Náboje: ${this.ammo} / ${MAX_AMMO}`);
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
    ].forEach(([x, y]) => this.spikes.create(x, y, "spikes"));

    this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
  }

  createCheckpoints() {
    this.checkpoints = this.physics.add.staticGroup();

    this.addCheckpoint(1110, 350, 1110, 360);
    this.addCheckpoint(2150, 455, 2150, 470);

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

    this.physics.add.overlap(this.player, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.enemies, this.damageEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemyBullets, this.hitEnemyBullet, null, this);
    this.physics.add.collider(this.enemyBullets, this.platforms, (bullet) => bullet.destroy());
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
    }).setOrigin(0.5);

    enemy.setData({ ...config, healthText });
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

      enemy.getData("healthText").setPosition(enemy.x, enemy.y - 34);
    });
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

    if (this.lives === 0) {
      this.gameOver = true;
      this.player.setVelocity(0, 0);
      this.scene.start("GameOverScene", { score: this.score });
      return;
    }

    this.isHurt = true;
    this.player.setPosition(this.respawnPoint.x, this.respawnPoint.y);
    this.player.setVelocity(0, 0);
    this.jumpsRemaining = 2;
    this.player.setTint(0xef4444);
    this.updateWeapon();
    this.updatePlayerLimbs(0, false);

    this.time.delayedCall(900, () => {
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

    this.updateEnemies(time);

    if (this.gameOver || this.isHurt) {
      return;
    }

    const movingLeft = this.cursors.left.isDown || this.wasd.A.isDown;
    const movingRight = this.cursors.right.isDown || this.wasd.D.isDown;
    const jumpPressed = this.jumpKeys.some((key) => Phaser.Input.Keyboard.JustDown(key));

    if (movingLeft) {
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
  scene: [MenuScene, MainScene, PauseScene, GameOverScene],
});
