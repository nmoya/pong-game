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

/*Creation Functions*/

function create() {
  game.physics.startSystem(Phaser.Physics.ARCADE);

  //check bounds collisions only against top and bottom walls
  game.physics.arcade.checkCollision.right = false;
  game.physics.arcade.checkCollision.left = false;

  game.add.tileSprite(0, 0, 1280, 720, 'field');
  ball = Ball({ game: game, x: game.world.centerX, y: game.world.centerY, asset: 'ball_1.png' });

  player1 = Player({ x: PADDLE_X_OFFSET, y: game.world.centerY, asset: 'paddle-left' }, true);
  player2 = Player({ x: game.world.width - PADDLE_X_OFFSET, y: game.world.centerY, asset: 'paddle-right' }, false);

  // Sets ENTER as the game start key
  game.input.keyboard.addKey(Phaser.Keyboard.ENTER).onDown.add(checkGameState, this);

  createTexts();
}

function Player(options, isKeyboard) {
  var player = { paddle: createPaddle(options.x, options.y, options.asset), score: 0 };

  player.movePaddle = function (gameInput) {
    if (this.keys === undefined && gameInput) {
      this.paddle.y = gameInput.y;
    } else {
      if (this.keys.up.isDown) {
        this.paddle.y -= KEYBOARD_MOVEMENT_SPEED;
      } else if (this.keys.down.isDown) {
        this.paddle.y += KEYBOARD_MOVEMENT_SPEED;
      }
    }
    this.limitPaddleMovements();
  }

  player.limitPaddleMovements = function () {
    if (this.paddle.y < 30) {
      this.paddle.y = 30;
    } else if (this.paddle.y > game.height - 30) {
      this.paddle.y = game.height - 30;
    }
  };

  if (isKeyboard) {
    player.keys = createMovementKeys();
  }
  return player;
}

function Ball(options) {
  var ballTimer;

  var ball = options.game.add.sprite(options.x, options.y, 'breakout', options.asset);
  ball.isReady = true;
  ball.sprite.anchor.set(0.5);
  ball.sprite.checkWorldBounds = true;
  options.game.physics.enable(ball.sprite, Phaser.Physics.ARCADE);
  ball.sprite.body.collideWorldBounds = true;
  ball.sprite.body.bounce.set(1);
  ball.sprite.animations.add('spin', ['ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png'], 50,
    true,
    false);
  ball.sprite.events.onOutOfBounds.add(ballLeftBounds, this);

  ball.stop = function () {
    ball.isReady = true;
    clearInterval(this.ballTimer);
    ball.sprite.reset(game.world.centerX, game.world.centerY);
    ball.sprite.animations.stop('spin');
    ball.sprite.body.velocity.setTo(0, 0);
  }

  ball.start = function () {
    ball.isReady = false;
    ball.sprite.body.velocity.y = 0;
    ball.sprite.body.velocity.x = (Math.round(Math.random() * 2) == 1 ? -1 : 1) * BALL_SPEED_START;
    ball.sprite.animations.play('spin');

    this.ballTimer = setInterval(function () {
      if (ball.sprite.body.velocity.x < 0) {
        ball.sprite.body.velocity.x -= BALL_SPEED_INCREMENT;
      } else {
        ball.sprite.body.velocity.x += BALL_SPEED_INCREMENT;
      }
    }, 1000);
  }

  return ball;
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

function createPaddle(x, y, asset) {
  var paddle = game.add.sprite(x, y, asset);
  paddle.anchor.setTo(0.5, 0.5);
  game.physics.enable(paddle, Phaser.Physics.ARCADE);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.set(1);
  paddle.body.immovable = true;
  return paddle;
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

/*Game State Functions*/

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
