const GAME_WIDTH = 960;
const GAME_HEIGHT = 540;
const PLAYER_SPEED = 260;
const JUMP_VELOCITY = -520;

class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");
  }

  create() {
    this.createTextures();
    this.createWorld();
    this.createPlayer();
    this.createCollectibles();
    this.createHazards();
    this.createControls();
  }

  createTextures() {
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
    graphics.destroy();
  }

  createWorld() {
    this.cameras.main.setBackgroundColor("#60a5fa");

    const clouds = this.add.graphics();
    clouds.fillStyle(0xffffff, 0.7);
    [[120, 88], [480, 145], [780, 78]].forEach(([x, y]) => {
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

    this.add.text(22, 20, "Základní herní scéna", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    });

    this.livesText = this.add.text(650, 20, "Životy: 3", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    });

    this.scoreText = this.add.text(810, 20, "Mince: 0", {
      fontFamily: "system-ui, sans-serif",
      fontSize: "20px",
      fontStyle: "bold",
      color: "#0f172a",
    });
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
    ].forEach(([x, y]) => this.coins.create(x, y, "coin"));

    this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
  }

  collectCoin(_player, coin) {
    coin.disableBody(true, true);
    this.score += 1;
    this.scoreText.setText(`Mince: ${this.score}`);
  }

  createHazards() {
    this.spikes = this.physics.add.staticGroup();

    [
      [350, 488],
      [382, 488],
      [690, 227],
    ].forEach(([x, y]) => this.spikes.create(x, y, "spikes"));

    this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
  }

  hitSpikes() {
    if (this.isHurt || this.gameOver) {
      return;
    }

    this.lives -= 1;
    this.livesText.setText(`Životy: ${this.lives}`);

    if (this.lives === 0) {
      this.gameOver = true;
      this.player.setVelocity(0, 0);
      this.player.setTint(0xef4444);
      this.add.text(480, 270, "Konec hry", {
        fontFamily: "system-ui, sans-serif",
        fontSize: "42px",
        fontStyle: "bold",
        color: "#ffffff",
        stroke: "#0f172a",
        strokeThickness: 8,
      }).setOrigin(0.5);
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
  }

  update() {
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
  scene: MainScene,
});
