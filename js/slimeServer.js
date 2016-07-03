var http = require('http');
var io = require('socket.io');
var express = require('express');

var app = express();
var server = http.createServer(app);

var players = new Array();
var numPlayers = 0;

io = io.listen(8001);

io.sockets.on('connection', function(socket){

	console.log("Connected with " + socket.id);
	var playerName = '';
	var joinedGame = false;

	socket.on('playersList', function() {
		socket.emit('playersList', players);
	});

	socket.on('playerName', function(data){
		console.log('new player: ' + data.name);

		if(data.opp == "") {
			socket.emit("message", 'waitingForOpp');
			socket.join('room1');
			players.push(data.name);
			numPlayers ++;
			playerName = data.name;
			joinedGame = true;
		} else {
			socket.join('room1');
			playerName = data.name;
			console.log(data.name + ' is entering the room');
			joinedGame = true;
			players.push(data.name);
			numPlayers ++;
			socket.broadcast.to('room1').emit('oppArrived', data.name);
			// io.sockets.in('room1').emit('startGame');
			startPoint();
		}
	});

	socket.on('playerMove', function(data){
		io.sockets.in('room1').emit('playerMove', data);
	});

	socket.on('disconnect', function(){
		console.log("Client " + socket.id + " has disconnected");
		if(joinedGame) {
			socket.broadcast.to('room1').emit('oppLeft');
			players.splice(players.indexOf(playerName), 1);
			numPlayers --;
		}
	});

	socket.on('newPoint', function(data){
		startPoint();
	});

	function startPoint() {
		io.sockets.in('room1').emit('timeLeft', '3');
		setTimeout(twoLeft, 1000);
		setTimeout(oneLeft, 2000);
		setTimeout(zeroLeft, 3000);
	}
	function twoLeft (){
		io.sockets.in('room1').emit('timeLeft', '2');
	}
	function oneLeft (){
		io.sockets.in('room1').emit('timeLeft', '1');
	}
	function zeroLeft() {
		io.sockets.in('room1').emit('timeLeft', '0');
	}



});