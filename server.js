
var express = require('express');
var socket = require('socket.io');

var app = express();
var server = app.listen(3001);

app.use(express.static('public'));

console.log("My socket server application is running");

var io = socket(server);

var games = {};

function game(joinCode, player1id){
	
	this.joinCode = joinCode;
	this.p1 = player1id;
	this.p2 = false;
	this.turn = [0,0];
	this.full = false;
	
	this.join = function(joinCode, player2id){
		if(joinCode === this.joinCode && !this.full){
			this.p2 = player2id;
			this.full = true;
			return "success";
		} else if(this.full){
			return "full";
		} else {
			return "wrong_code";
		}
	}
	
	this.checkTurn = function(playerid){
		return (this.p1 === playerid && this.turn[0] === 0) || (this.p2 === playerid && this.turn[1] === 0)
	}
	
	this.play = function(move,playerid){
		if(!(move === "share" || move === "steal")){
			console.log(timeStamp(),"ERROR: ", socket.id, " tried to play an invalid move in game ",gameID);
			socket.broadcast.to(socket.id).emit('ERROR', {error_code: "201", data: "Invalid move!"});
			return false;
		} else {
			if(playerid === this.p1){
				this.turn[0] = move;
			} else if(playerid === this.p1){
				this.turn[1] = move;
			}
			
			if(this.turn[0] !== 0 && this.turn[1] !== 0){
				this.evaluate();
			}
		
		}
	}
	
	this.evaluate = function(){
		var p1 = this.turn[0];
		var p2 = this.turn[1];
		this.turn = [0,0];
		if(p1 === p2){
			if(p1 === "share"){
				p1 = 3;
				p2 = 3;
			} else {
				p1 = 1;
				p2 = 1;
			}
		} else {
			if(p1 === "share"){
				p1 = 0;
				p2 = 5
			} else {
				p1 = 5;
				p2 = 0;
			}
		}
	}
	
}


io.sockets.on('connection',newConnection);

function newConnection(socket){
	console.log(timeStamp(),socket.id, " has connected");
	
	
	socket.on('NEW', function(joinCode){
		var ugid = UGID();
		games[ugid] = game(joinCode,socket.id);
		console.log(timeStamp(),socket.id, " has joined game ", ugid);
		socket.broadcast.to(socket.id).emit('JOIN_INFO', {id: ugid, code:joinCode});
	});
	
	
	socket.on('JOIN',function(data){
		var joinCode = data.code;
		var gameID = data.id;
		
		if(gameID in games){
			var x = games[gameID].join(joinCode,socket.id);
			if(x === "success"){
				console.log(timeStamp(),socket.id, " has also joined game ", gameID);
				console.log(timeStamp(),"game ",gameID, " is now closed");
			} else if(x === "full"){
				console.log(timeStamp(),"ERROR: game ",gameID, " is full");
				socket.broadcast.to(socket.id).emit('ERROR', {error_code: "001", data: "Game is full"});
			} else if(x === "wrong_code"){
				console.log(timeStamp(),"ERROR: incorrect join code for ",gameID);
				socket.broadcast.to(socket.id).emit('ERROR', {error_code: "101", data: "Incorrect join code"});
			}
		}
	});
	
	
	socket.on('play',function(data) {
		var gameID = data.id;
		var joinCode = data.code;
		var move = data.move;
		var x = auth(gameID, joinCode)
		if(x === true){
			if(games[gameID].checkTurn(socket.id)){
				games[gameID].play(move);
			} else {
				console.log(timeStamp(),"ERROR: ", socket.id, " tried to play out of turn in game ",gameID);
				socket.broadcast.to(socket.id).emit('ERROR', {error_code: "200", data: "Playing out of turn!"});
			}
		} else if (x === "wrong_code"){
			console.log(timeStamp(),"ERROR: failed auth for ",gameID);
			socket.broadcast.to(socket.id).emit('ERROR', {error_code: "101", data: "Incorrect join code"});
		} else if (x === "Doesn't exist"){
			console.log(timeStamp(),"ERROR: ",gameID, " does not exist!");
			socket.broadcast.to(selfID).emit('ERROR', {error_code: "002", data: "Game does not exist"});
		}
		
	});
}


function timeStamp(){
	var d = new Date();
	var time = d.toTimeString();
	time = time.slice(0,8);
	var date = d.toDateString();
	return "[" + date + " " + time + "] ";
}

function UGID(){
	var date = new Date();
	var time = date.getTime();
	return  String(random(100,999)) + String(time);
}

function auth(selfID,gID,code){
	if(gid in games){
		if (games[gID].joinCode === code){
			return true;
		} else {
			return "wrong_code";
		}
	} else {
		return "Doesn't exist";
	}
}