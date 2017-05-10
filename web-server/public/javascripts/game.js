var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'game-container', { preload: preload, create: create, update: update });
//To test in virtual machines, use Phaser.CANVAS.

function preload() {
  game.load.atlas('breakout', 'assets/breakout.png', 'assets/breakout.json');
  game.load.image('starfield', 'assets/starfield.jpg');
  game.load.image('paddle-left', 'assets/paddle-vertical-left.png');
  game.load.image('paddle-right', 'assets/paddle-vertical-right.png');
}

/*Constants*/

var KEYBOARD_MOVEMENT_SPEED = 18;

var PADDLE_X_OFFSET = 100;

var BALL_SPEED_START = 600;
var BALL_SPEED_INCREMENT = 100;

var MAX_SCORE = 3;

/*Global Variables*/

var ball;
var paddle1;
var paddle2;

var ballTimer;

var isBallReady = true;
var isGameOver = false;

var scorePaddle1 = 0;
var scorePaddle2 = 0;

var scoreText;
var introText;

var cursors;

var s;

/*Creation Functions*/

function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);

  //  We check bounds collisions against all walls other than the bottom one
  game.physics.arcade.checkCollision.right = false;
  game.physics.arcade.checkCollision.left = false;

  s = game.add.tileSprite(0, 0, 1280, 720, 'starfield');

  paddle1 = createPaddle(PADDLE_X_OFFSET, game.world.centerY, 'paddle-left');
  paddle2 = createPaddle(game.world.width - PADDLE_X_OFFSET, game.world.centerY, 'paddle-right');

  ball = createBall(game.world.centerX, game.world.centerY, 'ball_1.png')

  cursors = game.input.keyboard.createCursorKeys();

  scoreText = game.add.text(game.world.centerX, game.world.height - 50, `${scorePaddle1} - ${scorePaddle2}`, {
    font: "20px Arial",
    fill: "#ffffff",
    align: "left"
  });
  introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
  introText.anchor.setTo(0.5, 0.5);

  game.input.onDown.add(checkGameState, this);
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

function createBall(x, y) {
  var ball = game.add.sprite(game.world.centerX, game.world.centerY, 'breakout', 'ball_1.png');
  ball.anchor.set(0.5);
  ball.checkWorldBounds = true;
  game.physics.enable(ball, Phaser.Physics.ARCADE);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);
  ball.animations.add('spin', ['ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png'], 50, true, false);
  ball.events.onOutOfBounds.add(ballLeftBounds, this);
  return ball;
}

/*Update Functions*/

function update() {

  paddle2.y = game.input.y;
  if (cursors.up.isDown) {
    paddle1.y -= KEYBOARD_MOVEMENT_SPEED;
  } else if (cursors.down.isDown) {
    paddle1.y += KEYBOARD_MOVEMENT_SPEED;
  }

  limitPaddleBoundaries(paddle1);
  limitPaddleBoundaries(paddle2);

  if (!isBallReady && !isGameOver) {
    game.physics.arcade.collide(ball, paddle1, ballHitPaddle, null, this);
    game.physics.arcade.collide(ball, paddle2, ballHitPaddle, null, this);
  }
}

/*Game State Functions*/

function checkGameState() {
  if (isBallReady) {
    startGame();
  }
  if (isGameOver) {
    resetGame();
  }
}

function startGame() {
  isBallReady = false;

  ball.body.velocity.y = 0;
  ball.body.velocity.x = (Math.round(Math.random() * 2) == 1 ? -1 : 1) * BALL_SPEED_START;
  ball.animations.play('spin');

  introText.visible = false;

  ballTimer = setInterval(function () {
    if (ball.body.velocity.x < 0) {
      ball.body.velocity.x -= BALL_SPEED_INCREMENT;
    } else {
      ball.body.velocity.x += BALL_SPEED_INCREMENT;
    }
  }, 1000);
}

function resetGame() {
  clearInterval(ballTimer);

  isBallReady = true;

  ball.reset(game.world.centerX, game.world.centerY);
  ball.animations.stop('spin');

  introText.text = `- click to ${isGameOver ? 'start' : 'continue'} -`;
  introText.visible = true;

  if (isGameOver) {
    isGameOver = false;
    scorePaddle1 = 0;
    scorePaddle2 = 0;

    scoreText.text = '0 - 0';
  }
}

function endGame() {
  clearInterval(ballTimer);

  isGameOver = true;

  ball.body.velocity.setTo(0, 0);

  introText.text = "Player " + (scorePaddle1 == MAX_SCORE ? "One" : "Two") + " Wins";
  introText.visible = true;
}

/*Ball Functions*/

function ballLeftBounds() {
  if (ball.x < 0) {
    scorePaddle2++;
  } else if (ball.x > game.world.width) {
    scorePaddle1++;
  }

  scoreText.text = `${scorePaddle1} - ${scorePaddle2}`;

  if (scorePaddle1 == MAX_SCORE || scorePaddle2 == MAX_SCORE) {
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

/*Paddle Functions*/

function limitPaddleBoundaries(paddle) {
  if (paddle.y < 30) {
    paddle.y = 30;
  } else if (paddle.y > game.height - 30) {
    paddle.y = game.height - 30;
  }
}
