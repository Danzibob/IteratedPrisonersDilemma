var socket;

function setup(){
	socket = io.connect('http://91.134.143.48:3000');
	socket.on('mouse',newDrawing);
    canvas = createCanvas(1200,630);
	canvas.parent("myContainer");
	background(51);
}

function draw(){
	
}

function mouseDragged(){
	var data = {
		x: mouseX,
		y: mouseY
	}
	noStroke();
	fill(255,200);
	ellipse(mouseX,mouseY,20,20);
	socket.emit('mouse',data);
}

function newDrawing(data){
	noStroke();
	fill(0,0,255,200);
	ellipse(data.x,data.y,20,20);
}