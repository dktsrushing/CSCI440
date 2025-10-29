"use strict";

var canvas;
var gl;

var numPositions  = 36;

var positions = [];
var colors = [];
var modelViewMatrix;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;

var axis = 0;
var theta = [0, 0, 0];
var direction = true;
var thetaLoc;
var modelViewMatrixLoc;
var speed = 2.0;
var paused = false;
var solid = true;
var scene = false;

var vertices = [
	vec4(-0.5, -0.5,  0.5, 1.0),
	vec4(-0.5,  0.5,  0.5, 1.0),
	vec4( 0.5,  0.5,  0.5, 1.0),
	vec4( 0.5, -0.5,  0.5, 1.0),
	vec4(-0.5, -0.5, -0.5, 1.0),
	vec4(-0.5,  0.5, -0.5, 1.0),
	vec4( 0.5,  0.5, -0.5, 1.0),
	vec4( 0.5, -0.5, -0.5, 1.0)
];
var vertexColors = [
	vec4(0.0, 0.0, 0.0, 1.0),  // black
	vec4(1.0, 0.0, 0.0, 1.0),  // red
	vec4(1.0, 1.0, 0.0, 1.0),  // yellow
	vec4(0.0, 1.0, 0.0, 1.0),  // green
	vec4(0.0, 0.0, 1.0, 1.0),  // blue
	vec4(1.0, 0.0, 1.0, 1.0),  // magenta
	vec4(0.0, 1.0, 1.0, 1.0),  // cyan
	vec4(1.0, 1.0, 1.0, 1.0)   // white
];
	
window.onload = function init()
{
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    colorCube();

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.7, 0.7, 0.7, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positions), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation( program, "aColor" );
    gl.vertexAttribPointer( colorLoc, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( colorLoc );

    thetaLoc = gl.getUniformLocation(program, "uTheta");
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");


	//event listeners for buttons
	document.getElementById( "xButton" ).onclick = function () {
        axis = xAxis;
    };
    document.getElementById( "yButton" ).onclick = function () {
        axis = yAxis;
    };
    document.getElementById( "zButton" ).onclick = function () {
        axis = zAxis;
    };
    document.getElementById( "directionButton" ).onclick = function () {
        direction = !direction;
    };
    document.getElementById( "pauseButton" ).onclick = function () {
        paused = !paused;
        if (paused == true){
            speed = 0;
        }
        else{
            speed = 2;
        }
    };
    document.getElementById( "colorButton" ).onclick = function () {
        solid = !solid;
        positions = [];
        colors = [];
        colorCube();

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);    


	};
    document.getElementById( "sceneButton" ).onclick = function () {
        scene = !scene;
    };
    render();
}

function colorCube()
{
    quad(1, 0, 3, 2);
    quad(2, 3, 7, 6);
    quad(3, 0, 4, 7);
    quad(6, 5, 1, 2);
    quad(4, 5, 6, 7);
    quad(5, 4, 0, 1);
}

function quad(a, b, c, d)
{
    // We need to parition the quad into two triangles in order for
    // WebGL to be able to render it.  In this case, we create two
    // triangles from the quad indices

    var indices = [a, b, c, a, c, d];

    for ( var i = 0; i < indices.length; ++i ) {
		positions.push( vertices[indices[i]] );

        if (solid == true){
            colors.push( vertexColors[a] );
        }
        else{
            colors.push(vertexColors[indices[i]]);
        }

    }
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	if (direction == true){
        theta[axis] += speed;
    }
    else{
        theta[axis] -= speed;
    }
    if (scene == true){
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(-0.7, 0.7, 0.0));
    modelViewMatrix = mult(modelViewMatrix, scale(0.3, 0.3, 0.3));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);
    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, translate(-0.2, .2, 0.0));
    modelViewMatrix = mult(modelViewMatrix, scale(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);

    modelViewMatrix = mat4(
        1.0, 0.0, 0.0, -.6,
        0.0, 1.0, 0.0, 0.6,
        0.0, 0.0, 1.0, 0.0,
        0.0, 0.0, 0.0, 1.0
    );
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    }
    else{
        modelViewMatrix = mat4();
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    }
	
	gl.uniform3fv(thetaLoc, theta);	

	gl.drawArrays(gl.TRIANGLES, 0, numPositions);



    requestAnimationFrame(render);
}
