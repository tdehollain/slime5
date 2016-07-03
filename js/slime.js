
var world;
var ball;
var playerA;
var playerB;
var id;

var playOnline = false;

var radius = 40;
var g = 5;
var gamePaused = false;
var pauseDuration = 0;
var pauseTime = 0;
var timeStamp = 0;
var nextSide = 0;
   
var socket;




$(document).ready(function() {

	// Get the Canvas
    var canvasElement = document.getElementById('myCanvas');
    var jQcanvasElement = $('#myCanvas');
    var ctx = canvasElement.getContext('2d');

    var baseWidth = parseInt(jQcanvasElement.attr('width'));
    var baseHeight = parseInt(jQcanvasElement.attr('height'));
    var netHeight = 60;
	var netWidth = 12;

    world = new World(ctx, baseWidth, baseHeight, netWidth, netHeight);
    world.draw();

	ball = new Ball(0);
	playerA = new Player(0, 'Player A');
	playerB = new Player(1, 'Player B');


	/**************************
	*****   User Events   *****
	**************************/


	/*****   Two Players - Local   *****/

	$('#twoPlayersButton').click(function(){
		$('#startMenu').addClass('hidden');
		$('#twoPlayers').removeClass('hidden');
	});

	$('#twoPlayersBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#twoPlayers').addClass('hidden');
	});

	$('#twoPlayersOKButton').click(function(){
		$('#twoPlayers').addClass('hidden');

		playerA.name = $('#player1NameInput').val();
		if(playerA.name == "") {playerA.name = "Player 1";}
		$('#player1Name').text(playerA.name);

		playerB.name = $('#player2NameInput').val();
		if(playerB.name == "") {playerB.name = "Player 2";}
		$('#player2Name').text(playerB.name);

		$('#startButton').removeClass('hidden');
		$('#player1Data').removeClass('hidden');
		$('#player2Data').removeClass('hidden');
		$('#exitButton').removeClass('hidden');
		playOnline = false;

		bindKeys(true);
	});


	/*****   One Player - Online   *****/
	
	var numGames = 0;

	$('#playOnlineButton').click(function(){
		$('#startMenu').addClass('hidden');
		$('#playOnline').removeClass('hidden');

		// Connect to the webSocket server
		socket = io.connect("http://54.247.71.232:8001/");
		socket.on('connect', function(){
			console.log('Connected!');
		});

		// Get the list of players
		socket.emit('playersList', '');
		socket.on('playersList', function(data) {
			$('#oppList').empty();
			$.each(data, function(index, value) {
				$('#oppList').append($('<option>', {
					value: value,
					text: value
				}));
				numGames++;
			});
		});

		if(numGames > 0) {
			$('#playOnlineOKButton:hover').css('cursor', 'pointer');
		}

	});

	$('#playOnlineBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#playOnline').addClass('hidden');
	});

	$('#playOnlineNewButton').click(function() {
		startOnline(true);
	});

	$('#playOnlineOKButton').click(function(){
		if(numGames > 0) {startOnline(false);}
	});


	/*****   One Player - Offline   *****/

	$('#onePlayerOfflineButton').click(function(){
		$('#startMenu').addClass('hidden');
		$('#underConstruction').removeClass('hidden');
		playOnline = false;
	});

	$('#underConstructionBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#underConstruction').addClass('hidden');
	});


	/*****   About   *****/

	$('#aboutButton').click(function(){
		$('#startMenu').addClass('hidden');
		$('#About').removeClass('hidden');
	});

	$('#aboutBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#About').addClass('hidden');
	});

	
	/*****   Start Button   *****/

	$('#startButton').click(function(){
		if($('#startButton').text() == "START") {startPoint();}
	});
	
	/*****   Exit Button   *****/

	$('#exitButton').click(function(){
		resetGame();
		if(playOnline) {socket.disconnect();}
		$('#player1Data').addClass('hidden');
		$('#player2Data').addClass('hidden');
		$('#startButton').addClass('hidden');
		$('#exitButton').addClass('hidden');
		$('#startMenu').removeClass('hidden');
	});

	$(document).bind('keydown', function(e) {
		switch(e.which) {
			case 13: // Enter
				if(!$("#startButton").hasClass('hidden')) {
					startPoint();
				} else if(!$("#twoPlayers").hasClass('hidden')) {
					$('#twoPlayers').addClass('hidden');
					playerA.name = $('#player1NameInput').val();
					if(playerA.name == "") {playerA.name = "Player 1";}
					$('#player1Name').text(playerA.name);

					playerB.name = $('#player2NameInput').val();
					if(playerB.name == "") {playerB.name = "Player 2";}
					$('#player2Name').text(playerB.name);
					console.log(playerB.name);

					$('#startButton').removeClass('hidden');
					$('#player1Data').removeClass('hidden');
					$('#player2Data').removeClass('hidden');
				}

				break;
			case 32: // Spacebar (or the contrary...)
				// startPoint();
				break;
			case 69: // e
				if(typeof id === 'number') {clearInterval(id);}
				break;
		}
	});

});

function startOnline(newGame) {

	playOnline = true;
	$('#playOnline').addClass('hidden');
	$('#exitButton').removeClass('hidden');

	playerA.name = $('#playerNameInput').val();
	if(playerA.name == "") {playerA.name = "Player lambda";}
	$('#player1Name').text(playerA.name);

	if(!newGame) {
		playerB.name = $('#oppList option:selected').html();
		$('#player2Name').text(playerB.name);
	} else {
		playerB.name = '';
		// $('#player2Name').text('[waiting for opponent...]');
	}

	$('#startButton').text('waiting for opponent');
	$('#startButton').removeClass('hidden');
	$('#player1Data').removeClass('hidden');
	$('#player2Data').removeClass('hidden');
	

	/*************************
	*****   WebSockets   *****
	*************************/


	socket.emit('playerName', {name:playerA.name, opp:playerB.name});

	socket.on('oppArrived', function(data) {
		console.log('Opponent has arrived: ' + data);
		playerB.name = data;
		$('#player2Name').text(playerB.name);
	})

	socket.on('startGame', function() {
		startPoint();
	});

	socket.on('playerMove', function(data) {
		switch(data.move) {
			case 'pressedLeft':
				playerB.pressedLeft();
				break;
			case 'pressedRight':
				playerB.pressedRight();
				break;
			case 'pressedUp':
				playerB.pressedUp();
				break;
			case 'releasedKey':
				playerB.releasedKey();
				break;
		}
	});

	socket.on('disconnect', function(){
		console.log('Disconnected from server');
	});

	socket.on('oppLeft', function() {
		console.log('Opponent left');
		clearInterval(id);
		$('#startButton').text(playerB.name + ' has left the game');
		$('#startButton').removeClass('hidden');
	});

	socket.on('timeLeft', function(data) {
		switch(data) {
			case '3':
				$('#startButton').text('3');
				break;
			case '2':
				$('#startButton').text('2');
				break;
			case '1':
				$('#startButton').text('1');
				break;
			case '0':
				$('#startButton').addClass('hidden');
				break;
		}
	});

	socket.on('pointState', function(state) {

		world.ctx.clearRect(0,0,world.width,world.height);
		world.draw();

		playerA.x = state.p1x;
		playerA.y = state.p1y;
		playerB.x = state.p2x;
		playerB.y = state.p2y;
		ball.x = state.bx;
		ball.y = state.by;

		playerA.draw();
		playerB.draw();
		ball.draw();
	});



	bindKeys(false);
}


	/***************************
	*****   Keys Binding   *****
	***************************/

function bindKeys(multi){

	if(multi) {
		$(document).bind('keydown', function(e) {
			switch(e.which) {
				// Player A
				case 65:
					playerA.pressedLeft();
					break;
				case 68:
					playerA.pressedRight();
					break;
				case 87:
					playerA.pressedUp();
					break;

				// Player B
				case 37:
					playerB.pressedLeft();
					break;
				case 39:
					playerB.pressedRight();
					break;
				case 38:
					playerB.pressedUp();
					break;
			}
		});

		$(document).bind('keyup', function(e) {
			if(e.which == 65 || e.which == 68){ // Player A
				playerA.releasedKey();
			} else if(e.which == 37 || e.which == 39){ // Player B
				playerB.releasedKey();
			}
		});
	} else {
		$(document).bind('keydown', function(e) {
			switch(e.which) {
				case 37:
					playerA.pressedLeft();
					break;
				case 39:
					playerA.pressedRight();
					break;
				case 38:
					playerA.pressedUp();
					break;
			}
		});

		$(document).bind('keyup', function(e) {
			if(e.which == 37 || e.which == 39){
				playerA.releasedKey();
			}
		});
	}

	// Touch Events
	$('#leftButton').live('touchstart', function(){
		playerA.pressedLeft();
	});
	$('#leftButton').live('touchend', function(){
	playerA.releasedKey();
	});
	$('#rightButton').live('touchstart', function(){
		playerA.pressedRight();
	});
	$('#rightButton').live('touchend', function(){
		playerA.releasedKey();
	});
	$('#jumpButton').live('touchstart', function(){
		if(playerA.initSpeedY == 0){
			playerA.initSpeedY = 2.5;
			playerA.jumpInit = new Date().getTime();
			playerA.pressedUp();
		}
	});
}

































/************************
*****   ANIMATION   *****
************************/


function startPoint() {
	$('#startButton').addClass('hidden');
	ball.reset(nextSide);
	id = window.setInterval(animate, 10);
}

function animate(){
	world.ctx.clearRect(0,0,world.width,world.height);
	world.draw();

	// Timer (in seconds)
	var t = new Date().getTime();

	// draw Players
	playerA.computePosition(t);
	playerB.computePosition(t);
	ball.computePosition(t);

	playerA.draw();
	playerB.draw();
	ball.draw();
	
}


function resetPoint() {
	clearInterval(id);
	world.ctx.clearRect(0, 0, world.width, world.height);
	world.draw();
	playerA.reset();
	playerB.reset();
	if(nextSide == 0){nextSide = 1} else {nextSide = 0};
	ball.reset(nextSide);
	id = window.setInterval(animate, 10);
	// $('#startButton').removeClass('hidden');
}

function resetGame() {
	if(typeof id === 'number') {clearInterval(id);}
	world.ctx.clearRect(0, 0, world.width, world.height);
	world.draw();
	playerA.reset();
	playerA.score = 0;
	$('#player1Score li').removeClass('on').addClass('off');
	playerB.reset();
	playerB.score = 0;
	$('#player2Score li').removeClass('on').addClass('off');


	ball.reset(nextSide);
}



/***************************
*****   World Object   *****
****************************/

function World(ctx, width, height, netWidth, netHeight) {
	this.ctx = ctx
	this.width = width;
	this.height = height;
	this.netWidth = netWidth;
	this.netHeight = netHeight;
}

World.prototype.draw = function(){
	// Build the ground, sky & net
	this.ctx.fillStyle = 'rgb(160,82,45)';
	this.ctx.fillRect(0, 0.8*this.height, this.width, this.height);
	this.ctx.fillStyle = 'rgb(0,191,255)';
	this.ctx.fillRect(0, 0, this.width, 0.8*this.height);
	this.ctx.fillStyle = 'rgb(128,128,128)';
	this.ctx.fillRect((this.width-this.netWidth)/2, 0.8*this.height - this.netHeight, this.netWidth, this.netHeight);
}



/****************************
*****   Player Object   *****
*****************************/

function Player(side, name) {
	this.side = side;
	this.name = name;
	this.x = (0.25 + side/2)*world.width;
	this.y = 0.8*world.height;
	this.speedX = 0;
	this.speedY = 0;
	this.initSpeedX = 0;
	this.initSpeedY = 0;
	if(side == 0){
		this.leftKey = 65;
		this.rightKey = 68;
		this.upKey = 87;
	} else {
		this.leftKey = 37;
		this.rightKey = 39;
		this.upKey = 38;
	}
	this.jump = false;
	this.jumpInit = new Date().getTime(); // time when jump was initiated
	this.inTheAir = false;
	this.score = 0;
	this.ballDist = 0;
	this.draw();
}

Player.prototype.evalBallDist = function() {
	this.ballDist = Math.sqrt(Math.pow(ball.x - this.x, 2) + Math.pow(ball.y - this.y, 2));
}

Player.prototype.evalBounce = function(){
	ball.speed = 0.4 - (0.8*world.height - ball.y)/1000;
	ball.initTime = new Date().getTime() - 10;
	// reposition the ball outside off the player
	// debugger;
	ball.x = this.x - (radius + ball.radius + 1) * (this.x - ball.x)/(radius + ball.radius);
	ball.y = this.y - (radius + ball.radius + 1) * (this.y - ball.y)/(radius + ball.radius);
	ball.initX = ball.x;
	ball.initY = ball.y;
	ball.initSpeedX = 15*this.initSpeedX + 3*ball.speed * (ball.x - this.x)/(radius + ball.radius);
	ball.initSpeedY = -1.3 + 0.7*ball.speed * (ball.y - this.y)/(radius + ball.radius);
}

Player.prototype.computePosition = function(t) {
	// SIDE MOVEMENT
	if(this.side){
		if(this.speedX > 0 && this.x < world.width-radius) {
			this.x = this.x + this.speedX;
		}
		if(this.speedX < 0 && this.x > 0.5*(world.width + world.netWidth)+radius) {
			this.x = this.x + this.speedX;
		}
	} else {
		if(this.speedX > 0 && this.x < (0.5*(world.width - world.netWidth)-radius)) {
			this.x = this.x + this.speedX;
		}
		if(this.speedX < 0 && this.x > radius) {
			this.x = this.x + this.speedX;
		}
	}

	// IN THE AIR
	if(!this.initSpeedY == 0) {
		var timeSinceJump = (t - this.jumpInit)/1000;
		var newPlayerY = 0.8*world.height - 300*(this.initSpeedY*(timeSinceJump) - g*Math.pow(timeSinceJump,2));
		if(newPlayerY>(0.8*world.height + 1)){
			newPlayerY = 0.8*world.height;
			this.initSpeedY = 0;
		}
		this.y = newPlayerY;
	}
}

Player.prototype.winPoint = function() {
	this.score += 1;

	if(this.score == 5) {
		alert(this.name + ' wins!');
		resetGame();
	}
	if(this.name == playerA.name){
		$('#player1Score li:nth-child(' + playerA.score + ')').removeClass('off').addClass('on');
	} else {
		$('#player2Score li:nth-child(' + playerB.score + ')').removeClass('off').addClass('on');
	}
	resetPoint();
}

Player.prototype.reset = function() {
	this.x = (0.25 + this.side/2)*world.width;
	this.y = 0.8*world.height;
	this.left = false;
	this.right = false;
	this.jump = false;
	this.jumpInit = 0;
	this.inTheAir = false;
	this.draw();
}

Player.prototype.pressedLeft = function(){
	this.speedX = -3;
	if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedRight'});}
}

Player.prototype.pressedRight = function(){
	this.speedX = 3;
	if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedLeft'});}
}

Player.prototype.releasedKey = function(){
	this.speedX = 0;
	if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'releasedKey'});}
}

Player.prototype.pressedUp = function(){
	if(this.initSpeedY == 0){
		this.initSpeedY = 2.5;
		this.jumpInit = new Date().getTime();
		if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedUp'});}
	}
}

Player.prototype.draw = function(){
	world.ctx.beginPath();
	world.ctx.arc(this.x, this.y, radius, 0, Math.PI, true);
	if(this.side == 0) {
		world.ctx.fillStyle = 'rgb(127,255,0)';	
	} else {
		world.ctx.fillStyle = 'rgb(153,50,204)';
	}
	world.ctx.closePath();
	world.ctx.fill();

	// Draw eyes white
	world.ctx.beginPath();
	if(this.side) {
		world.ctx.arc(this.x - radius/2, this.y - radius/2, 7, 0, Math.PI*2, true);
	} else {
		world.ctx.arc(this.x + radius/2, this.y - radius/2, 7, 0, Math.PI*2, true);
	}
	world.ctx.fillStyle = 'rgb(255,255,255)';
	world.ctx.closePath();
	world.ctx.fill();

	// Draw eyes retina
	world.ctx.beginPath();
	// get ball vector
	var xDiff = this.x - ball.x;
	var yDiff = this.y - ball.y;
	// Normalize
	var xVect = (xDiff)/(Math.abs(xDiff) + Math.abs(yDiff));
	var yVect = (yDiff)/(Math.abs(xDiff) + Math.abs(yDiff));

	if(this.side) {
		world.ctx.arc(this.x - radius/2 - 5*xVect, this.y - radius/2 - 5*yVect, 3, 0, Math.PI*2, true);
	} else {
		world.ctx.arc(this.x + radius/2 - 5*xVect, this.y - radius/2 - 5*yVect, 3, 0, Math.PI*2, true);
	}
	world.ctx.fillStyle = 'rgb(0,0,0)';
	world.ctx.closePath();
	world.ctx.fill();
}


/**************************
*****   Ball Object   *****
**************************/

function Ball(side) {
	this.x = (0.25 + side/2)*world.width;
	this.y = 0.4*world.height;
	this.initX = (0.25 + side/2)*world.width;
	this.initY = 0.4*world.height;
	this.initSpeedX = 0;
	this.initSpeedY = 0;
	this.speed = 0;
	this.speedX = 0;
	this.speedY = 0;
	this.initTime = new Date().getTime();
	this.radius = 10;
	this.draw();
}

Ball.prototype.draw = function(){
	world.ctx.beginPath();
	world.ctx.arc(this.x, this.y, this.radius, 0, Math.PI *2, true);
	world.ctx.fillStyle = 'rgb(255,255,0)';	
	world.ctx.closePath();
	world.ctx.fill();
}

Ball.prototype.computePosition = function(t) {

	// Collision Check
	playerA.evalBallDist();
	playerB.evalBallDist();

	// Bounce on a player
	if(new Date().getTime() - this.initTime > 300){
		if(playerA.ballDist < (radius + this.radius)) {playerA.evalBounce();}
		if(playerB.ballDist < (radius + this.radius)) {playerB.evalBounce();}
	}

	// Walls
	if(this.x < this.radius || this.x > world.width-this.radius) {
		this.initSpeedX = -1*this.speedX;
		this.initSpeedY = this.speedY;
		if(this.x < this.radius){this.initX = this.x+1;} else {this.initX = this.x-1;};
		this.initY = this.y;
		this.initTime = new Date().getTime() - 10;
	}

	// Net
	// if(this.y - this.radius + 20 > 0.8*world.height - world.netHeight){
	// 	if(this.x + this.radius > (world.width-world.netWidth)/2 && this.x - this.radius < (world.width+world.netWidth)/2){
	// 		if(this.y - this.radius + 21 <  0.8*world.height - world.netHeight){
	// 			// Bounce on the top of the net
	// 			this.initSpeedX = this.speedX;
	// 			this.initSpeedY = -1.5;
	// 			this.initX = this.x;
	// 			this.initY = 0.8*world.height - this.radius - world.netHeight - 5;
	// 			this.initTime = new Date().getTime() - 10;
	// 		} else {
	// 			// Bounce on the side of the net
	// 			this.initSpeedX = -1*this.speedX;
	// 			this.initSpeedY = this.speedY;
	// 			if(this.x < world.width/2){this.initX = this.x - 1;} else {this.initX = this.x + 1;}
	// 			this.initY = this.y;
	// 			this.initTime = new Date().getTime() - 10;
	// 		}
	// 	}
	// }

	// Ball on the floor (Win or Rebound)
	if(this.y > (0.8*world.height - this.radius + 3)) {
		// this.initSpeedX = this.speedX;
		// this.initSpeedY = -1.6;
		// this.initX = this.x;
		// this.initY = 0.8*world.height - this.radius + 3;
		// this.initTime = new Date().getTime() - 10;
		
		this.y = 0.8*world.height - this.radius + 3;
		clearInterval(id);
		if(this.x < world.width/2) {
			playerB.winPoint();
		} else {
			playerA.winPoint();
		}

	}
	var ballTime = (t-this.initTime)/1000;

	var newBallX = this.initX + 300*this.initSpeedX*ballTime;
	var newBallY = this.initY + 300*(this.initSpeedY*ballTime + 0.3*g*Math.pow(ballTime, 2));
	this.evalSpeed(newBallX, newBallY, timeStamp, new Date().getTime());
	this.y = newBallY;
	this.x = newBallX;

	timeStamp = new Date().getTime();
}

Ball.prototype.evalSpeed = function(x, y, t1, t2) {
	this.speed = 5*Math.sqrt(Math.pow(this.x - x, 2) + Math.pow(this.y - y, 2))/(t2 - t1);
	this.speedX = 3*(x - this.x)/(t2 - t1);
	this.speedY = 3*(y - this.y)/(t2 - t1);
}

Ball.prototype.reset = function(side){
	this.x = (0.25 + side/2)*world.width;
	this.y = 0.4*world.height;
	this.initX = (0.25 + side/2)*world.width;
	this.initY = 0.4*world.height;
	this.initSpeedX = 0;
	this.initSpeedY = 0;
	this.speed = 0;
	this.speedX = 0;
	this.speedY = 0;
	this.initTime = new Date().getTime();
	this.draw();
}


