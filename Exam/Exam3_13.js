"use strict";

var canvas;
var gl;

var nRows = 50;
var nColumns = 50;

// data for radial hat function: sin(Pi*r)/(Pi*r)
var data = [];
for(var i = 0; i < nRows; ++i) {
    data.push([]);
    var x = Math.PI*(4*i/nRows-2.0);
    for(var j = 0; j < nColumns; ++j) {
        var y = Math.PI*(4*j/nRows-2.0);
        var r = Math.sqrt(x*x+y*y);
        // take care of 0/0 for r = 0
        data[i][j] = r ? Math.sin(r) / r : 1.0;
    }
}

var positionsArray = [];
var normalsArray = [];

var eye = vec3(0.0, 0.0, 1.0); 
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var left = -1.5;
var right = 1.5;
var ytop = 1.5;
var bottom = -0.75;
var near = -10;
var far = 10;

var scanBool = false;
var atShift=0.01;
var scanDir = false;


var inspectBool = false;

var stretchBool = false;


var tarnishBool = false;
var xTarn = 1.0;
var yTarn = 0.0;
var zTarn = 1.0;
var tarnFlag = false;

var x = 0.01;
var radius = 2.0;
var theta = 0.0;
var phi = 0.0;

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(xTarn, yTarn, zTarn, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var nMatrix, nMatrixLoc;

var ambientProduct, ambientProductLoc; 
var diffuseProduct, diffuseProductLoc;
var specularProduct, specularProductLoc;
var lightPositionLoc, shininessLoc;

var apt, bpt, cpt, dpt;

window.onload = function init() {
console.log('init function called');
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");

    gl.viewport(0, 0, canvas.width, canvas.height);

    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // enable depth testing and polygon offset
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

	// vertex array of nRows*nColumns quadrilaterals
	// (two triangles/quad) from data
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
			var apt = vec4(2*i/nRows-1, data[i][j], 2*j/nColumns-1, 1.0);
			var bpt = vec4(2*(i+1)/nRows-1, data[i+1][j], 2*j/nColumns-1, 1.0);
			var cpt = vec4(2*(i+1)/nRows-1, data[i+1][j+1], 2*(j+1)/nColumns-1, 1.0);
			var dpt = vec4(2*i/nRows-1, data[i][j+1], 2*(j+1)/nColumns-1, 1.0);
			positionsArray.push(apt);
			positionsArray.push(bpt);
			positionsArray.push(cpt);
			positionsArray.push(dpt);
			normalsArray.push(apt);
			normalsArray.push(bpt);
			normalsArray.push(cpt);
			normalsArray.push(dpt);
		}
	}

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    modelViewMatrixLoc = gl.getUniformLocation( program, "uModelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "uProjectionMatrix" );
    nMatrixLoc = gl.getUniformLocation( program, "uNormalMatrix" );

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);	
	
	ambientProductLoc = gl.getUniformLocation(program,"uAmbientProduct");
	diffuseProductLoc = gl.getUniformLocation(program,"uDiffuseProduct");
	specularProductLoc = gl.getUniformLocation(program,"uSpecularProduct");
	lightPositionLoc = gl.getUniformLocation(program,"uLightPosition")
	shininessLoc = gl.getUniformLocation(program, "uShininess");
	
    gl.uniform4fv( ambientProductLoc, ambientProduct );
    gl.uniform4fv( diffuseProductLoc, diffuseProduct );
    gl.uniform4fv( specularProductLoc, specularProduct );
    gl.uniform4fv( lightPositionLoc, lightPosition );
    gl.uniform1f( shininessLoc,materialShininess );
	
	// Initialize event handlers
    document.getElementById("Button0").onclick = function () {
        scanBool = false;
        atShift=0.00;
        scanDir = false;


        inspectBool = false;


        tarnishBool = false;
        xTarn = 1.0;
        yTarn = 0.0;
        zTarn = 1.0;
        materialAmbient = vec4(xTarn, yTarn, zTarn, 1.0);
        tarnFlag = false;
        eye = vec3(0.0, 0.0, 1.0);

    };
    document.getElementById("Button1").onclick = function () {
        scanBool = !scanBool;
        if (scanBool == true){
            atShift = 0.0;
        }

    };
    document.getElementById("Button2").onclick = function () {
        inspectBool = !inspectBool
        if (inspectBool == true){
            eye = vec3(0.0, 0.5, 1.0);
        }
        else{
            eye = vec3(0.0, 0.0, 1.0);
            theta = 0.0;
        }

    };
    document.getElementById("Button3").onclick = function () {


    };
    document.getElementById("Button4").onclick = function () {
        tarnishBool = !tarnishBool;


    };
    render();
}

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if (scanBool == false){
        at = vec3(0.0, 0.0, 0.0);
    }
    else{
        at = vec3(atShift, 0.0, 0.0);
        if (atShift <= 1.0 && scanDir == false){
            atShift += 0.01;
            if (atShift >= 1.0){
                scanDir = true;
            }
        }
        else if (atShift >= -1.0 && scanDir == true){
            atShift -= 0.01;
            if (atShift <= -1.0){
                scanDir = false;
            }
        }
    }


    if (inspectBool == true){
        lightPosition = vec4(Math.sin(theta), Math.sin(theta), 1.0, 0.0);
        theta += 0.01;
    }
    else{
        lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
    }


    if (tarnishBool == true){
        if (tarnFlag == false){
            xTarn -= 0.01;
            yTarn += 0.01;
            zTarn -= 0.01;
            materialAmbient = vec4(xTarn, yTarn, zTarn, 1.0);
            if (xTarn <= 0.0){
                tarnFlag = true;
            }
        }
        else{
            xTarn += 0.01;
            yTarn -= 0.01;
            zTarn += 0.01;
            materialAmbient = vec4(xTarn, yTarn, zTarn, 1.0);
            if (xTarn >= 1.0){
                tarnFlag = false;
            }
        }
    }

    modelViewMatrix = lookAt(eye, at, up);	
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    nMatrix = normalMatrix(modelViewMatrix, true);
	
    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);

	gl.uniform4fv( ambientProductLoc, flatten(ambientProduct) );
    gl.uniform4fv( diffuseProductLoc, flatten(diffuseProduct) );
    gl.uniform4fv( specularProductLoc, flatten(specularProduct) );	
    gl.uniform4fv( lightPositionLoc, flatten(lightPosition) );
    gl.uniform1f( shininessLoc, materialShininess );
	
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix3fv(nMatrixLoc, false, flatten(nMatrix)  );

    for(var i=0; i<positionsArray.length; i+=4) {
        gl.drawArrays( gl.TRIANGLE_FAN, i, 4 );
    }

    requestAnimationFrame(render);
}
