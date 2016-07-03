var field;
var ball;
var playerA;
var playerB;

var b2Vec2 = Box2D.Common.Math.b2Vec2, 
    b2BodyDef = Box2D.Dynamics.b2BodyDef, 
    b2Body = Box2D.Dynamics.b2Body, 
    b2FixtureDef = Box2D.Dynamics.b2FixtureDef, 
    b2Fixture = Box2D.Dynamics.b2Fixture, 
    b2World = Box2D.Dynamics.b2World, 
    b2MassData = Box2D.Collision.Shapes.b2MassData, 
    b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape, 
    b2CircleShape = Box2D.Collision.Shapes.b2CircleShape, 
    b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

var scale = 30;
var gravity = 30;	
var bodies = new Array();
var ballBody,
	playerABody,
	playerBBody;
var animID;
var oppListID;

var playOnline = false;

var gamePaused = false;
var nextSide = 0;

var showDebug = false;
var admin = false;

var wallFixDef = new b2FixtureDef;
var netFixDef = new b2FixtureDef;
var groundFixDef = new b2FixtureDef;
var invisibleFixDef = new b2FixtureDef;

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

	var world;

    field = new field(ctx, baseWidth, baseHeight, netWidth, netHeight);
    field.draw();

	ball = new Ball(nextSide);
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
		// $('#exitButton').removeClass('hidden');
		playOnline = false;

		bindKeys(true);
	});


	/*****   One Player - Online   *****/
	
	var numGames = 0;

	$('#playOnlineButton').click(function(){

		if(admin) {
			$('#startMenu').addClass('hidden');
			$('#playOnline').removeClass('hidden');

			// Connect to the webSocket server
			socket = io.connect("http://54.247.71.232:8001/");
			socket.on('connect', function(){
				console.log('Connected!');
			});

			// Get the list of players
			getOppList();
			// oppListID = setInterval(getOppList, 2000);

			function getOppList() {
				console.log("Getting list of opponents...")
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
			}

			if(numGames > 0) {
				$('#playOnlineOKButton:hover').css('cursor', 'pointer');
			}
		} else {
			$('#startMenu').addClass('hidden');
			$('#underConstruction').removeClass('hidden');
		}
	});
	
	$('#underConstructionBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#underConstruction').addClass('hidden');
	});



	$('#playOnlineBackButton').click(function(){
		clearInterval(oppListID);
		$('#startMenu').removeClass('hidden');
		$('#playOnline').addClass('hidden');
	});

	$('#playOnlineNewButton').click(function() {
		// clearInterval(oppListID);
		startOnline(true);
	});

	$('#playOnlineOKButton').click(function(){
		// clearInterval(oppListID);
		if(numGames > 0) {startOnline(false);}
	});


	/*****   Controls   *****/

	$('#controlsButton').click(function(){
		$('#startMenu').addClass('hidden');
		$('#Controls').removeClass('hidden');
	});

	$('#controlsBackButton').click(function(){
		$('#startMenu').removeClass('hidden');
		$('#Controls').addClass('hidden');
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
		if($('#startButton').text() == "START") {
			$('#exitButton').removeClass('hidden');
			startPoint();
		}
	});
	
	/*****   Exit Button   *****/

	$('#exitButton').click(function(){
		Animation.stop();
		resetPoint();
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

					$('#startButton').removeClass('hidden');
					$('#player1Data').removeClass('hidden');
					$('#player2Data').removeClass('hidden');
				}

				break;
			case 32: // Spacebar (or the contrary...)
				if(Animation.isRunning()) {
					Animation.stop();
				} else {
					Animation.start();
				}
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

	playerA.name = $('#playerNameInput').val();
	if(playerA.name == "") {playerA.name = "Player lambda";}
	$('#player1Name').text(playerA.name);

	if(!newGame) {
		console.log("I'm player B");
		nextSide = 1;
		ball.reset(nextSide);
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
	// $('#exitButton').removeClass('hidden');
	
















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
		console.log({playerA: playerA.name, playerB: playerB.name})
		if(data.player == playerB.name){
			// console.log(data.player + " pressed");
			switch(data.move) {
				case 'pressedLeft':
					playerB.pressedRight();
					break;
				case 'pressedRight':
					playerB.pressedLeft();
					break;
				case 'pressedUp':
					playerB.pressedUp();
					break;
				case 'releasedKey':
					playerB.releasedKey();
					break;
			}
		} else {
			console.log(data.player + " pressed");
			switch(data.move) {
				case 'pressedLeft':
					playerA.pressedLeft();
					break;
				case 'pressedRight':
					playerA.pressedRight();
					break;
				case 'pressedUp':
					playerA.pressedUp();
					break;
				case 'releasedKey':
					playerA.releasedKey();
					break;
			}
		}
	});

	socket.on('disconnect', function(){
		console.log('Disconnected from server');
	});

	socket.on('oppLeft', function() {
		console.log('Opponent left');
		clearTimeout(animID);
		$('#startButton').text(playerB.name + ' has left the game');
		$('#startButton').removeClass('hidden');
	});

	socket.on('timeLeft', function(data) {
		switch(data) {
			case '3':
				console.log("game starts in 3")
				$('#startButton').text('3');
				break;
			case '2':
				console.log("game starts in 2")
				$('#startButton').text('2');
				break;
			case '1':
				console.log("game starts in 1")
				$('#startButton').text('1');
				break;
			case '0':
				console.log("game starts now!")
				$('#startButton').addClass('hidden');
				requestAnimFrame(update);
				break;
		}
	});

	socket.on('pointState', function(state) {

		field.ctx.clearRect(0,0,field.width,field.height);
		field.draw();

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
					if(playOnline){
						socket.emit('playerMove', {player: playerA.name, move:'pressedLeft'});
					} else {
						playerA.pressedLeft();
					}
					break;
				case 39:
					if(playOnline){
						socket.emit('playerMove', {player: playerA.name, move:'pressedRight'});
					} else {
						playerA.pressedRight();
					}
					break;
				case 38:
					if(playOnline){
						socket.emit('playerMove', {player: playerA.name, move:'pressedUp'});
					} else {
						playerA.pressedUp();
					}
					break;
			}
		});

		$(document).bind('keyup', function(e) {
			if(e.which == 37 || e.which == 39){
				if(playOnline){
					socket.emit('playerMove', {player: playerA.name, move:'releasedKey'});
				} else {
					playerA.releasedKey();
				}
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
		playerA.pressedUp();
	});
}

































/************************
*****   ANIMATION   *****
************************/



window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       || 
          window.webkitRequestAnimationFrame || 
          window.mozRequestAnimationFrame    || 
          window.oRequestAnimationFrame      || 
          window.msRequestAnimationFrame     || 
          function(callback, element){window.setTimeout(callback, 1000 / 60);};
})();

function update() {
	world.Step(
		1 / 60   //frame-rate
		,  10       //velocity iterations
		,  10       //position iterations
	);
	world.DrawDebugData();
	// world.ClearForces();

    ball.update();
    playerA.update();
    playerB.update();

	// Redrawing field
	if(!showDebug) {
		field.ctx.clearRect(0, 0, field.width, field.height);
		field.draw();
		ball.draw();
		playerA.draw();
		playerB.draw();
	}


	// Check if end of point
	if(ball.y > field.height*0.791 - ball.radius) {
		// clearTimeout(animID);
		if(ball.x < field.width/2) {
			playerB.winPoint();
		} else {
			playerA.winPoint();
		}
	} else {
		// animID = window.requestAnimFrame(update);
	}
};

Animation.add(update);




function startPoint() {
	$('#exitButton').removeClass('hidden');
	$('#startButton').addClass('hidden');
	$('#winnerInfo').addClass('hidden');
	ball.reset(nextSide);
	Animation.start();
}



function resetPoint() {
	field.ctx.clearRect(0, 0, field.width, field.height);
	field.draw();

	playerA.reset();
	playerB.reset();
	if(nextSide == 0){nextSide = 1} else {nextSide = 0};
	ball.reset(nextSide);
	// startPoint();
	if(playOnline) {
		$('#startButton').text('START');
		socket.emit('newPoint');
	}
	$('#exitButton').addClass('hidden');
	$('#startButton').removeClass('hidden');
}

function resetGame() {
	playerA.score = 0;
	$('#player1Score li').removeClass('on').addClass('off');
	playerB.score = 0;
	$('#player2Score li').removeClass('on').addClass('off');

	if(playOnline) {
		// Do something
	} else {
		resetPoint();
	}
}








































/***************************
*****   field Object   *****
****************************/

function field(ctx, width, height, netWidth, netHeight) {
	this.ctx = ctx
	this.width = width;
	this.height = height;
	this.netWidth = netWidth;
	this.netHeight = netHeight;

	world = new b2World(
		new b2Vec2(0, gravity)    //gravity
		,  false                 //allow sleep
	);


	// Ground & Roof
	this.build(width/(2*scale), height*0.9/scale, "ground");
	this.build(width/(2*scale), -height*0.1/scale, "ground");

	// Walls
	this.build(-4/scale, 2*height/scale, "wall");
	this.build((width+4)/scale, 2*height/scale, "wall");

	// Net
	this.build(this.width/(2*scale), (this.height*0.8 - this.netHeight/2)/scale, "net");

	// Invisble wall
	this.build(this.width/(2*scale), (this.height*0.8 - this.netHeight/2)/scale, "invisible");



	// Collision handler
	var listener = new Box2D.Dynamics.b2ContactListener;
	listener.BeginContact = function(contact) {
	}

	listener.PostSolve = function(contact, impulse) {
		var typeA = contact.m_fixtureA.m_body.m_type;
		var typeB = contact.m_fixtureB.m_body.m_type;
		if(typeA == typeB) {
			if(ball.x < width/2) {
				vecX = ball.x - playerA.x + playerA.playerBody.m_linearVelocity.x;
				vecY = ball.y - playerA.y + playerA.playerBody.m_linearVelocity.y;
				ball.ballBody.SetLinearVelocity({x:vecX/3, y:vecY/3});
			} else {
				vecX = ball.x - playerB.x + playerB.playerBody.m_linearVelocity.x;
				vecY = ball.y - playerB.y + playerB.playerBody.m_linearVelocity.y;
				ball.ballBody.SetLinearVelocity({x:vecX/3, y:vecY/3});			}
		}
	}

	world.SetContactListener(listener);

	//setup debug draw
	if(showDebug) {
		var debugDraw = new b2DebugDraw();
		debugDraw.SetSprite(ctx);
		debugDraw.SetDrawScale(scale);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(1.0);
		debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
		world.SetDebugDraw(debugDraw);
	}
}

field.prototype.build = function(x, y, type) {

	var fieldBodyDef = new b2BodyDef;
	fieldBodyDef.type = b2Body.b2_staticBody;
	       
	// positions the center of the object (not upper left!)
	fieldBodyDef.position.x = x;
	fieldBodyDef.position.y = y;
       
	// half width, half height.
	if(type=="wall") {
		wallFixDef.density = 2.0;
		wallFixDef.friction = 0;
		wallFixDef.restitution = 0;
		wallFixDef.filter.categoryBits = 1;
		wallFixDef.filter.maskBits = 12;
		wallFixDef.shape = new b2PolygonShape;
		wallFixDef.shape.SetAsBox(5/scale, 2*this.height/scale);
		if(x*scale < this.width/2) {
			this.wall1Body = world.CreateBody(fieldBodyDef).CreateFixture(wallFixDef);
			bodies[bodies.length] = this.wall1Body;
			this.wall1Body.aname = "wall1";
		} else {
			this.wall2Body = world.CreateBody(fieldBodyDef).CreateFixture(wallFixDef);
			bodies[bodies.length] = this.wall2Body;
			this.wall2Body.aname = "wall2";
		}
	} else if(type=="net") {
		netFixDef.density = 2.0;
		netFixDef.friction = 0;
		netFixDef.restitution = 0;
		netFixDef.filter.categoryBits = 1;
		netFixDef.filter.maskBits = 12;
		netFixDef.shape = new b2PolygonShape;
		netFixDef.shape.SetAsBox(this.netWidth/(2*scale), this.netHeight/(2*scale));
		this.netBody = world.CreateBody(fieldBodyDef).CreateFixture(netFixDef);
		bodies[bodies.length] = this.netBody;
		this.netBody.aname = "net";
	} else if(type=="ground"){
		groundFixDef.density = 2.0;
		groundFixDef.friction = 0;
		groundFixDef.restitution = 0;
		groundFixDef.filter.categoryBits = 2;
		groundFixDef.filter.maskBits = 8;
		groundFixDef.shape = new b2PolygonShape;
		groundFixDef.shape.SetAsBox((this.width / scale) / 2, (this.height*0.2/scale) / 2);
		if(y*scale < this.height/2) {
			this.groundBody = world.CreateBody(fieldBodyDef).CreateFixture(groundFixDef);
			bodies[bodies.length] = this.groundBody;
			this.groundBody.aname = "ground";
		} else {
			this.roofBody = world.CreateBody(fieldBodyDef).CreateFixture(groundFixDef);
			bodies[bodies.length] = this.roofBody;
			this.roofBody.aname = "roof";
		}
	} else if(type=="invisible") {
		invisibleFixDef.density = 2.0;
		invisibleFixDef.friction = 0;
		invisibleFixDef.restitution = 0;
		invisibleFixDef.filter.categoryBits = 2;
		invisibleFixDef.filter.maskBits = 8;
		invisibleFixDef.shape = new b2PolygonShape;
		invisibleFixDef.shape.SetAsBox(7/scale, this.height/scale);
		this.invisibleBoby = world.CreateBody(fieldBodyDef).CreateFixture(invisibleFixDef);
		bodies[bodies.length] = this.invisibleBoby;
		this.invisibleBoby.aname = "invisible";
	}
}

field.prototype.draw = function(){
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
	this.radius = 40;
	this.name = name;
	this.x = (0.25 + side/2)*field.width;
	this.y = 0.8*field.height;
	if(side == 0){
		this.leftKey = 65;
		this.rightKey = 68;
		this.upKey = 87;
	} else {
		this.leftKey = 37;
		this.rightKey = 39;
		this.upKey = 38;
	}
	this.score = 0;

	this.initBody();
	
	this.draw();
}

Player.prototype.initBody = function() {
	// Box2d Model
	this.playerBodyDef = new b2BodyDef;
	this.playerBodyDef.type = b2Body.b2_dynamicBody;
	this.playerBodyDef.fixedRotation = true;

	this.playerFixDef = new b2FixtureDef;
	this.playerFixDef.density = 100;
	this.playerFixDef.friction = 0.5;
	this.playerFixDef.restitution = 0;
	this.playerFixDef.filter.categoryBits = 8;
	this.playerFixDef.filter.maskBits = 7;

	this.playerBodyDef.position.x = (0.25 + this.side/2)*field.width / scale;
	this.playerBodyDef.position.y = 0.8*field.height / scale;
	this.body = world.CreateBody(this.playerBodyDef);
	bodies[bodies.length] = this.body;
	this.body.aname = this.name;

	// Define the semi-circle as a polygon
	var numVertices = 20; // must be even to have a flat surface on top
	var vecs = new Array();
	for(i=0; i < numVertices + 1; i++) {
		var vec = new b2Vec2();
		var vec_x = (this.radius + 3) / scale * Math.cos(Math.PI / numVertices * (numVertices - i));
		var vec_y = (this.radius + 3) / scale * -Math.sin(Math.PI / numVertices * (numVertices - i));
		vec.Set(vec_x, vec_y);
		vecs[i] = vec;
	}

	this.playerFixDef.shape = new b2PolygonShape;
	this.playerFixDef.shape.SetAsArray(vecs, vecs.length);
    this.body.CreateFixture(this.playerFixDef);
    
    this.playerBody = world.GetBodyList();

    // Simulate stronger gravity for players
    this.body.ApplyForce(new b2Vec2(0, 15000), this.body.GetWorldCenter());

	this.x = this.playerBodyDef.position.x * scale;
	this.y = this.playerBodyDef.position.y * scale;
};

Player.prototype.update = function() {
	this.x = this.playerBody.GetPosition().x * scale;
	this.y = this.playerBody.GetPosition().y * scale;
}


Player.prototype.winPoint = function() {
	Animation.stop();
	this.score += 1;
	if(this.name == playerA.name){
		$('#player1Score li:nth-child(' + playerA.score + ')').removeClass('off').addClass('on');
	} else {
		$('#player2Score li:nth-child(' + playerB.score + ')').removeClass('off').addClass('on');
	}

	if(this.score == 5) {
		alert(this.name + ' wins the game!');
		resetGame();
	} else {
		$('#winnerInfo').text(this.name + ' wins!');
		$('#winnerInfo').removeClass('hidden');
		$('#startButton').removeClass('hidden');
		resetPoint();
	}
}

Player.prototype.reset = function() {
	world.DestroyBody(this.body);
	world.DestroyBody(this.playerBody);
	bodies.splice(this.playerBody);
	this.initBody();
	this.draw();
}

Player.prototype.pressedLeft = function(){
	this.body.SetLinearVelocity({x:-10, y:this.playerBody.GetLinearVelocity().y});
	// if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedLeft'});}
}

Player.prototype.pressedRight = function(){
	this.body.SetLinearVelocity({x:10, y:this.playerBody.GetLinearVelocity().y});
	// if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedRight'});}
}

Player.prototype.releasedKey = function(){
	this.body.SetLinearVelocity({x:0, y:this.playerBody.GetLinearVelocity().y});
	// if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'releasedKey'});}
}

Player.prototype.pressedUp = function(){
	if(this.y >= 0.799*field.height) {
		this.body.ApplyImpulse({x:0, y:-6000}, this.body.GetWorldCenter());
	}
	// if(playOnline && !this.side){socket.emit('playerMove', {player: this.name, move:'pressedUp'});}
}

Player.prototype.draw = function(){
	field.ctx.beginPath();
	field.ctx.arc(this.x, this.y, this.radius, 0, Math.PI, true);
	if(this.side == 0) {
		field.ctx.fillStyle = 'rgb(127,255,0)';	
	} else {
		field.ctx.fillStyle = 'rgb(153,50,204)';
	}
	field.ctx.closePath();
	field.ctx.fill();

	// Draw eyes white
	field.ctx.beginPath();
	if(this.side) {
		field.ctx.arc(this.x - this.radius/2, this.y - this.radius/2, 7, 0, Math.PI*2, true);
	} else {
		field.ctx.arc(this.x + this.radius/2, this.y - this.radius/2, 7, 0, Math.PI*2, true);
	}
	field.ctx.fillStyle = 'rgb(255,255,255)';
	field.ctx.closePath();
	field.ctx.fill();

	// Draw eyes retina
	field.ctx.beginPath();
	// get ball vector
	var xDiff = this.x - ball.x;
	var yDiff = this.y - ball.y;
	// Normalize
	var xVect = (xDiff)/(Math.abs(xDiff) + Math.abs(yDiff));
	var yVect = (yDiff)/(Math.abs(xDiff) + Math.abs(yDiff));

	if(this.side) {
		field.ctx.arc(this.x - this.radius/2 - 5*xVect, this.y - this.radius/2 - 5*yVect, 3, 0, Math.PI*2, true);
	} else {
		field.ctx.arc(this.x + this.radius/2 - 5*xVect, this.y - this.radius/2 - 5*yVect, 3, 0, Math.PI*2, true);
	}
	field.ctx.fillStyle = 'rgb(0,0,0)';
	field.ctx.closePath();
	field.ctx.fill();
}

























/**************************
*****   Ball Object   *****
**************************/

function Ball(side) {
	this.radius = 8;
	this.side = side;

	this.initBody();

	this.draw();
}

Ball.prototype.initBody = function() {
	// Box2d Model
	this.ballBodyDef = new b2BodyDef;
	this.ballBodyDef.type = b2Body.b2_dynamicBody;

	this.ballFixDef = new b2FixtureDef;
	this.ballFixDef.density = 1.0;
	this.ballFixDef.friction = 0;
	this.ballFixDef.restitution = 0.9;
	this.ballFixDef.filter.categoryBits = 4;
	this.ballFixDef.filter.maskBits = 9;

	this.ballFixDef.shape = new b2CircleShape(this.radius/scale);
   
	this.ballBodyDef.position.x = (0.25 + this.side/2)*field.width / scale;
	this.ballBodyDef.position.y = 0.4*field.height / scale;

    this.body = world.CreateBody(this.ballBodyDef).CreateFixture(this.ballFixDef);
    bodies[bodies.length] = this.body;
    this.ballBody = world.GetBodyList();
    this.body.aname = "ball";

	this.x = this.ballBodyDef.position.x * scale;
	this.y = this.ballBodyDef.position.y * scale;
};

Ball.prototype.update = function() {
	this.x = this.ballBody.GetPosition().x * scale;
	this.y = this.ballBody.GetPosition().y * scale;
}

Ball.prototype.draw = function(){
	field.ctx.beginPath();
	field.ctx.arc(this.x, this.y, this.radius + 2, 0, Math.PI *2, true);
	field.ctx.fillStyle = 'rgb(255,255,0)';	
	field.ctx.closePath();
	field.ctx.fill();
}

Ball.prototype.reset = function(side){
	this.side = side;
	world.DestroyBody(this.ballBody);
	bodies.splice(this.ballBody);
	this.initBody();
	this.draw();
}

