const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const LEVEL_WIDTH = 1920;
const PLAYER_SPEED = 260;
const JUMP_VELOCITY = -520;
const BULLET_SPEED = 560;
const SHOOT_COOLDOWN = 220;
const ENEMY_SPEED = 70;
const ENEMY_PATROL_MIN_X = 320;
const ENEMY_PATROL_MAX_X = 520;

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
    this.createHazards();
    this.createEnemy();
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
    graphics.destroy();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#60a5fa");

    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.7);
    [[120, 88], [480, 145], [780, 78], [1120, 115], [1420, 70], [1740, 145]].forEach(([x, y]) => {
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

    this.physics.world.setBounds(0, 0, LEVEL_WIDTH, GAME_HEIGHT);

    this.add.text(22, 20, "Základní herní scéna", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    }).setScrollFactor(0);

    this.livesText = this.add.text(650, 20, "Životy: 3", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    }).setScrollFactor(0);

    this.scoreText = this.add.text(810, 20, "Mince: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
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
    this.physics.add.collider(this.player, this.platforms);
    this.lives = 3;
    this.isHurt = false;
    this.gameOver = false;
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
    ].forEach(([x, y]) => this.coins.create(x, y, "coin"));

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  collectCoin(_player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`Mince: ${this.score}`);
  }

  createProjectiles() {
    this.lastShotAt = -SHOOT_COOLDOWN;
    this.bullets = this.physics.add.group();
  }

  shoot(time) {
    if (time - this.lastShotAt < SHOOT_COOLDOWN) {
      return;
    }

    const direction = this.player.flipX ? -1 : 1;
    const bullet = this.bullets.create(
      this.player.x + direction * 24,
      this.player.y - 4,
      "bullet",
    );

    bullet.body.allowGravity = false;
    bullet.setVelocityX(direction * BULLET_SPEED);
    this.lastShotAt = time;

    this.time.delayedCall(1200, () => {
      if (bullet.active) {
        bullet.destroy();
      }
    });
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
    ].forEach(([x, y]) => this.spikes.create(x, y, "spikes"));

    this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
  }

  createEnemy() {
    this.enemyLives = 2;
    this.enemy = this.physics.add.sprite(420, 280, "enemy");
    this.enemy.setVelocityX(ENEMY_SPEED);
    this.physics.add.collider(this.enemy, this.platforms);

    this.enemyHealthText = this.add.text(420, 245, "♥♥", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#991b1b",
      stroke: "#ffffff",
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.physics.add.overlap(this.player, this.enemy, this.hitEnemy, null, this);
    this.physics.add.overlap(this.bullets, this.enemy, this.damageEnemy, null, this);
  }

  updateEnemy() {
    if (!this.enemy?.active) {
      return;
    }

    if (this.enemy.x <= ENEMY_PATROL_MIN_X) {
      this.enemy.setVelocityX(ENEMY_SPEED);
      this.enemy.setFlipX(false);
    } else if (this.enemy.x >= ENEMY_PATROL_MAX_X) {
      this.enemy.setVelocityX(-ENEMY_SPEED);
      this.enemy.setFlipX(true);
    }

    this.enemyHealthText.setPosition(this.enemy.x, this.enemy.y - 34);
  }

  hitEnemy() {
    this.takeDamage();
  }

  damageEnemy(firstObject, secondObject) {
    const bullet = firstObject === this.enemy ? secondObject : firstObject;

    if (!this.enemy.active || !bullet.active) {
      return;
    }

    bullet.destroy();

    this.enemyLives -= 1;

    if (this.enemyLives === 0) {
      this.enemy.disableBody(true, true);
      this.enemyHealthText.destroy();
      return;
    }

    this.enemyHealthText.setText("♥");
    this.enemy.setTint(0xfca5a5);
    this.time.delayedCall(140, () => {
      if (this.enemy.active) {
        this.enemy.clearTint();
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
    this.livesText.setText(`Životy: ${this.lives}`);

    if (this.lives === 0) {
      this.gameOver = true;
      this.player.setVelocity(0, 0);
      this.scene.start("GameOverScene", { score: this.score });
      return;
    }

    this.isHurt = true;
    this.player.setPosition(100, 300);
    this.player.setVelocity(0, 0);
    this.player.setTint(0xef4444);

    this.time.delayedCall(900, () => {
      this.isHurt = false;
      this.player.clearTint();
    });
  }

  createControls() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys("W,A,D");
    this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.pauseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
  }

  pauseGame() {
    this.scene.pause();
    this.scene.launch("PauseScene");
  }

  update(time) {
    if (Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      this.pauseGame();
      return;
    }

    this.updateEnemy();

    if (this.gameOver || this.isHurt) {
      return;
    }

    const movingLeft = this.cursors.left.isDown || this.wasd.A.isDown;
    const movingRight = this.cursors.right.isDown || this.wasd.D.isDown;
    const jumping = this.cursors.up.isDown || this.wasd.W.isDown || this.cursors.space.isDown;

    if (movingLeft) {
      this.player.setVelocityX(-PLAYER_SPEED);
      this.player.setFlipX(true);
    } else if (movingRight) {
      this.player.setVelocityX(PLAYER_SPEED);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    if (jumping && this.player.body.blocked.down) {
      this.player.setVelocityY(JUMP_VELOCITY);
    }

    if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
      this.shoot(time);
    }
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
