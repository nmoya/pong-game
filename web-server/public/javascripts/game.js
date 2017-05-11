var game = new Phaser.Game(1280, 720, Phaser.CANVAS, 'game-container', { preload: preload, create: create, update: update });

function preload() {
  game.load.atlas('breakout', 'assets/breakout.png', 'assets/breakout.json');
  game.load.image('field', 'assets/field.jpg');
  game.load.image('paddle-left', 'assets/paddle-vertical-left.png');
  game.load.image('paddle-right', 'assets/paddle-vertical-right.png');
}

/*Constants*/

var KEYBOARD_MOVEMENT_SPEED = 18;

var PADDLE_X_OFFSET = 50;

var BALL_SPEED_START = 600;
var BALL_SPEED_INCREMENT = 50;

var MAX_SCORE = 3;

/*Global Variables*/

var ball;
var isGameOver = false;

var scoreText;
var introText;

var player1;
var player2;

/* Instance Functions */

function Player(options, isKeyboard) {
  var _player = { paddle: Paddle(options.x, options.y, options.asset), score: 0 };

  _player.movePaddle = function (gameInput) {
    if (this.keys === undefined && gameInput) {
      this.paddle.y = gameInput.y;
    } else if (this.keys !== undefined) {
      if (this.keys.up.isDown) {
        this.paddle.y -= KEYBOARD_MOVEMENT_SPEED;
      } else if (this.keys.down.isDown) {
        this.paddle.y += KEYBOARD_MOVEMENT_SPEED;
      }
    }
    this.limitPaddleMovements();
  };

  _player.limitPaddleMovements = function () {
    if (this.paddle.y < 30) {
      this.paddle.y = 30;
    } else if (this.paddle.y > game.height - 30) {
      this.paddle.y = game.height - 30;
    }
  };

  if (isKeyboard) {
    _player.keys = createMovementKeys();
  }

  return _player;
}

function Ball(options) {
  var ballTimer;

  var _ball = { sprite: options.game.add.sprite(options.x, options.y, 'breakout', options.asset) };
  _ball.isReady = true;
  _ball.sprite.anchor.set(0.5);
  _ball.sprite.checkWorldBounds = true;
  options.game.physics.enable(_ball.sprite, Phaser.Physics.ARCADE);
  _ball.sprite.body.collideWorldBounds = true;
  _ball.sprite.body.bounce.set(1);
  _ball.sprite.animations.add('spin', ['ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png'], 50, true,
    false);
  _ball.sprite.events.onOutOfBounds.add(ballLeftBounds, this);

  _ball.stop = function () {
    this.isReady = true;
    clearInterval(this.ballTimer);
    this.sprite.reset(game.world.centerX, game.world.centerY);
    this.sprite.animations.stop('spin');
    this.sprite.body.velocity.setTo(0, 0);
  }

  _ball.start = function () {
    this.isReady = false;
    this.sprite.body.velocity.y = 0;
    this.sprite.body.velocity.x = (Math.round(Math.random() * 2) == 1 ? -1 : 1) * BALL_SPEED_START;
    this.sprite.animations.play('spin');

    this.ballTimer = setInterval(function () {
      if (_ball.sprite.body.velocity.x < 0) {
        _ball.sprite.body.velocity.x -= BALL_SPEED_INCREMENT;
      } else {
        _ball.sprite.body.velocity.x += BALL_SPEED_INCREMENT;
      }
    }, 1000);
  }

  return _ball;
}

function Paddle(x, y, asset) {
  var _paddle = game.add.sprite(x, y, asset);
  _paddle.anchor.setTo(0.5, 0.5);
  game.physics.enable(_paddle, Phaser.Physics.ARCADE);
  _paddle.body.collideWorldBounds = true;
  _paddle.body.bounce.set(1);
  _paddle.body.immovable = true;
  return _paddle;
}

/*Creation Functions*/

function create() {
  configureGame()

  ball = Ball({ game: game, x: game.world.centerX, y: game.world.centerY, asset: 'ball_1.png' });
  player1 = Player({ x: PADDLE_X_OFFSET, y: game.world.centerY, asset: 'paddle-left' }, true);
  player2 = Player({ x: game.world.width - PADDLE_X_OFFSET, y: game.world.centerY, asset: 'paddle-right' }, false);

  createTexts();
}

function createMovementKeys() {
  //for cursor keys, use game.input.keyboard.createCursorKeys()
  var keys = game.input.keyboard.addKeys({ 'up': Phaser.Keyboard.W, 'down': Phaser.Keyboard.S });
  return keys;
}

function createTexts() {
  introText = game.add.text(game.world.centerX, game.world.centerY + 50, '- press enter to start -', {
    font: "40px Arial",
    fill: "#666666",
    align: "center"
  });
  introText.anchor.setTo(0.5, 0.5);

  scoreText = game.add.text(game.world.centerX, game.world.height - 50, `${player1.score}     -     ${player2.score}`, {
    font: "48px Arial",
    fill: "#666666",
    align: "center"
  });
  scoreText.anchor.setTo(0.5, 0.5);
  scoreText.visible = false;
}

/*Update Functions*/

function update() {
  player1.movePaddle(game.input);
  player2.movePaddle(game.input);

  if (!ball.isReady && !isGameOver) {
    game.physics.arcade.collide(ball.sprite, player1.paddle, ballHitPaddle, null, this);
    game.physics.arcade.collide(ball.sprite, player2.paddle, ballHitPaddle, null, this);
  }
}

/*Game Functions*/

function configureGame() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  //check bounds collisions only against top and bottom walls
  game.physics.arcade.checkCollision.right = false;
  game.physics.arcade.checkCollision.left = false;

  game.add.tileSprite(0, 0, 1280, 720, 'field');

  // Sets ENTER as the game start key
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(checkGameState, this);
}

function checkGameState() {
  if (ball.isReady) {
    startGame();
  }
  if (isGameOver) {
    resetGame();
  }
}

function startGame() {
  ball.start();

  introText.visible = false;
  scoreText.visible = true;
}

function resetGame() {
  ball.stop();

  introText.text = `- press enter to ${isGameOver ? 'start' : 'continue'} -`;
  introText.visible = true;

  if (isGameOver) {
    isGameOver = false;

    player1.score = 0;
    player2.score = 0;

    scoreText.text = '0 - 0';
  }
}

function endGame() {
  isGameOver = true;

  introText.text = "Player " + (player1.score == MAX_SCORE ? "One" : "Two") + " Wins";
  introText.visible = true;
  scoreText.visible = false;
}

/*Ball Functions*/

function ballLeftBounds() {
  if (ball.sprite.x < 0) {
    player2.score++;
  } else if (ball.sprite.x > game.world.width) {
    player1.score++;
  }

  scoreText.text = `${player1.score} - ${player2.score}`;

  if (player1.score == MAX_SCORE || player2.score == MAX_SCORE) {
    endGame();
  } else {
    resetGame();
  }
}

function ballHitPaddle(_ball, _paddle) {
  var diff = 0;

  if (_ball.y < _paddle.y) {
    //  Ball is on the upper side of the _paddle2
    diff = _paddle.y - _ball.y;
    _ball.body.velocity.y = (-10 * diff);
  } else if (_ball.y > _paddle.y) {
    //  Ball is on the right-hand side of the _paddle2
    diff = _ball.y - _paddle.y;
    _ball.body.velocity.y = (10 * diff);
  } else {
    //  Ball is perfectly in the middle
    //  Add a little random X to stop it bouncing straight up!
    _ball.body.velocity.y = 2 + Math.random() * 8;
  }
}
