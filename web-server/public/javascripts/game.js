var game = new Phaser.Game(1280, 720, Phaser.AUTO, 'game-container', { preload: preload, create: create, update: update });

function preload() {

  game.load.atlas('breakout', 'assets/breakout.png', 'assets/breakout.json');
  game.load.image('starfield', 'assets/starfield.jpg');
  game.load.image('paddle-left', 'assets/paddle-vertical-left.png');
  game.load.image('paddle-right', 'assets/paddle-vertical-right.png');

}

var ball;
var paddle1;
var paddle2;

var ballTimer;
var BALL_SPEED_START = 600;
var BALL_SPEED_INCREMENT = 100;

var PADDLE_OFFSET = 100;
var isBallReady = true;
var isGameOver = false;

var MAX_SCORE = 5;
var scorePaddle1 = 0;
var scorePaddle2 = 0;

var scoreText;
var introText;

var cursors;

var s;

function createPaddle(x, y, asset) {
  var paddle = game.add.sprite(x, y, asset);
  paddle.anchor.setTo(0.5, 0.5);
  game.physics.enable(paddle, Phaser.Physics.ARCADE);
  paddle.body.collideWorldBounds = true;
  paddle.body.bounce.set(1);
  paddle.body.immovable = true;
  return paddle;
}

function create() {

  game.physics.startSystem(Phaser.Physics.ARCADE);

  //  We check bounds collisions against all walls other than the bottom one
  game.physics.arcade.checkCollision.right = false;
  game.physics.arcade.checkCollision.left = false;

  s = game.add.tileSprite(0, 0, 1280, 720, 'starfield');

  paddle1 = createPaddle(PADDLE_OFFSET, game.world.centerY, 'paddle-left');
  paddle2 = createPaddle(game.world.width - PADDLE_OFFSET, game.world.centerY, 'paddle-right');

  cursors = game.input.keyboard.createCursorKeys();

  ball = game.add.sprite(game.world.centerX, game.world.centerY, 'breakout', 'ball_1.png');
  ball.anchor.set(0.5);
  ball.checkWorldBounds = true;
  game.physics.enable(ball, Phaser.Physics.ARCADE);
  ball.body.collideWorldBounds = true;
  ball.body.bounce.set(1);
  ball.animations.add('spin', ['ball_1.png', 'ball_2.png', 'ball_3.png', 'ball_4.png', 'ball_5.png'], 50, true, false);

  ball.events.onOutOfBounds.add(ballLost, this);

  scoreText = game.add.text(game.world.centerX, game.world.height - 50, `${scorePaddle1} - ${scorePaddle2}`, {
    font: "20px Arial",
    fill: "#ffffff",
    align: "left"
  });
  introText = game.add.text(game.world.centerX, 400, '- click to start -', { font: "40px Arial", fill: "#ffffff", align: "center" });
  introText.anchor.setTo(0.5, 0.5);

  game.input.onDown.add(releaseBall, this);

}

function checkPaddleBoundaries(paddle) {
  if (paddle.y < 30) {
    paddle.y = 30;
  } else if (paddle.y > game.height - 30) {
    paddle.y = game.height - 30;
  }
}

function update() {

  paddle2.y = game.input.y;
  if (cursors.up.isDown) {
    paddle1.y -= 18;
  } else if (cursors.down.isDown) {
    paddle1.y += 18;
  }

  checkPaddleBoundaries(paddle1);
  checkPaddleBoundaries(paddle2);

  if (!isBallReady) {
    game.physics.arcade.collide(ball, paddle1, ballHitPaddle, null, this);
    game.physics.arcade.collide(ball, paddle2, ballHitPaddle, null, this);
  }

}

function releaseBall() {
  if (isBallReady) {
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
  if (isGameOver) {
    isGameOver = false;
    isBallReady = true;
    introText.text = "- click to start -";
    ball.reset(game.world.centerX, game.world.centerY);
    scorePaddle1 = 0;
    scorePaddle2 = 0;
    scoreText.text = `${scorePaddle1} - ${scorePaddle2}`;
  }
}

function ballLost() {
  if (ball.x < 0) {
    scorePaddle2++;
  } else if (ball.x > game.world.width) {
    scorePaddle1++;
  }
  scoreText.text = `${scorePaddle1} - ${scorePaddle2}`;

  if (scorePaddle1 == MAX_SCORE || scorePaddle2 == MAX_SCORE) {
    gameOver();
  } else {
    isBallReady = true;
    ball.reset(game.world.centerX, game.world.centerY);
    ball.animations.stop();
  }
}

function gameOver() {
  clearInterval(ballTimer);
  ball.body.velocity.setTo(0, 0);
  isGameOver = true;
  introText.text = "Player " + (scorePaddle1 > scorePaddle2 ? "One" : "Two") + " Wins";
  introText.visible = true;
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
