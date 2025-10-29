"use strict";

var canvas;
var gl;

var positionsArray = [];
var positionsArray2 = [];
var colorLoc;
var modelViewMatrix, modelViewMatrix2, modelViewMatrixLoc;

var red;
var theta = 0;

var vBuffer;
var vBuffer2;


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");
    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );
    gl.enable(gl.DEPTH_TEST);
	
	red = vec4(1.0, 0.0, 0.0, 1.0);

	// square
	// DO NOT MODIFY THESE POSITIONS
	positionsArray.push(vec4( 0.2, 0.2, 0, 1));
	positionsArray.push(vec4( 0.6, 0.2, 0, 1));
	positionsArray.push(vec4( 0.6, 0.6, 0, 1));
	positionsArray.push(vec4( 0.2, 0.6, 0, 1));

	/*positionsArray2.push(vec4( -0.2, 0.2, 0, 1));
	positionsArray2.push(vec4( -0.6, 0.2, 0, 1));
	positionsArray2.push(vec4( -0.6, 0.6, 0, 1));
	positionsArray2.push(vec4( -0.2, 0.6, 0, 1));*/

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram( program );

    vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

 


    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    colorLoc = gl.getUniformLocation(program, "uColor");



    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");

    render();
}

var render = function() {

        gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        theta += 2.0;

		modelViewMatrix = mat4();
        
        modelViewMatrix = mult(modelViewMatrix, translate(.4, .4, 0));
        modelViewMatrix = mult(modelViewMatrix, scale(.4, .4, 0));
        modelViewMatrix = mult(modelViewMatrix, rotate(theta, 0.0, 0.0, 1.0));
        modelViewMatrix = mult(modelViewMatrix, translate(-.4, -.4, 0));

        // send color and matrix for square then render
        gl.uniform4fv(colorLoc, flatten(red));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);



        modelViewMatrix = mat4();
        modelViewMatrix = mult(modelViewMatrix, translate(-.4, .4, 0));
        modelViewMatrix = mult(modelViewMatrix, scale(.4, .4, 0));
        modelViewMatrix = mult(modelViewMatrix, rotate(-theta, 0.0, 0.0, 1.0));
        modelViewMatrix = mult(modelViewMatrix, translate(.4, -.4, 0));
        modelViewMatrix = mult(modelViewMatrix, translate(-.8, 0.0, 0.0));

        

        gl.uniform4fv(colorLoc, flatten(red));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        

        requestAnimationFrame(render);
    }

