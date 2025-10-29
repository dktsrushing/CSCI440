"use strict";

var shadedCube = function() {

var canvas;
var gl;

var numPositions = 36;

var positionsArray = [];
var normalsArray = [];

var vertices = [
        vec4(-0.5, -0.5,  0.5, 1.0),
        vec4(-0.5,  0.5,  0.5, 1.0),
        vec4(0.5,  0.5,  0.5, 1.0),
        vec4(0.5, -0.5,  0.5, 1.0),
        vec4(-0.5, -0.5, -0.5, 1.0),
        vec4(-0.5,  0.5, -0.5, 1.0),
        vec4(0.5,  0.5, -0.5, 1.0),
        vec4(0.5, -0.5, -0.5, 1.0)
    ];

var shininess = document.getElementById("shininess");
var ambientR = document.getElementById("ambientR");
var ambientG = document.getElementById("ambientG");
var ambientB = document.getElementById("ambientB");
var diffuseR = document.getElementById("diffuseR");
var diffuseG = document.getElementById("diffuseG");
var diffuseB = document.getElementById("diffuseB");
var specularR = document.getElementById("specularR");
var specularG = document.getElementById("specularG");
var specularB = document.getElementById("specularB");

var lightAmbientR = document.getElementById("lightAmbientR");
var lightAmbientG = document.getElementById("lightAmbientG");
var lightAmbientB = document.getElementById("lightAmbientB");

var lightDiffuseR = document.getElementById("lightDiffuseR");
var lightDiffuseG = document.getElementById("lightDiffuseG");
var lightDiffuseB = document.getElementById("lightDiffuseB");

var lightSpecularR = document.getElementById("lightSpecularR");
var lightSpecularG = document.getElementById("lightSpecularG");
var lightSpecularB = document.getElementById("lightSpecularB");




var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(
   parseFloat(lightAmbientR.value),
   parseFloat(lightAmbientG.value),
   parseFloat(lightAmbientB.value),
   1.0
);
var lightDiffuse = vec4(
   parseFloat(lightDiffuseR.value),
   parseFloat(lightDiffuseG.value),
   parseFloat(lightDiffuseB.value),
   1.0
);
var lightSpecular = vec4(
   parseFloat(lightSpecularR.value),
   parseFloat(lightSpecularG.value),
   parseFloat(lightSpecularB.value),
   1.0
);

var materialAmbient = vec4(
    parseFloat(ambientR.value),
    parseFloat(ambientG.value),
    parseFloat(ambientB.value),
    1.0
);
var materialDiffuse = vec4(
    parseFloat(diffuseR.value),
    parseFloat(diffuseG.value),
    parseFloat(diffuseB.value),
    1.0
);
var materialSpecular = vec4(
    parseFloat(specularR.value),
    parseFloat(specularG.value),
    parseFloat(specularB.value),
    1.0
);
var materialShininess = parseFloat(shininess.value);

var ctm;
var ambientColor, diffuseColor, specularColor;
var modelViewMatrix, projectionMatrix;
var viewerPos;
var program;

var xAxis = 0;
var yAxis = 1;
var zAxis = 2;
var axis = 0;
var theta = vec3(0, 0, 0);
var paused = true;

var thetaLoc;

var flag = false;


function quad(a, b, c, d) {

     var t1 = subtract(vertices[b], vertices[a]);
     var t2 = subtract(vertices[c], vertices[b]);
     var normal = cross(t1, t2);
     normal = vec3(normal);


     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     positionsArray.push(vertices[b]);
     normalsArray.push(normal);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     positionsArray.push(vertices[a]);
     normalsArray.push(normal);
     positionsArray.push(vertices[c]);
     normalsArray.push(normal);
     positionsArray.push(vertices[d]);
     normalsArray.push(normal);
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


window.onload = function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available");


    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    colorCube();

    var nBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

    var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(positionsArray), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation(program, "theta");

    viewerPos = vec3(0.0, 0.0, -20.0);

    projectionMatrix = ortho(-1, 1, -1, 1, -100, 100);

    var ambientProduct = mult(lightAmbient, materialAmbient);
    var diffuseProduct = mult(lightDiffuse, materialDiffuse);
    var specularProduct = mult(lightSpecular, materialSpecular);

    document.getElementById("ButtonX").onclick = function(){axis = xAxis;};
    document.getElementById("ButtonY").onclick = function(){axis = yAxis;};
    document.getElementById("ButtonZ").onclick = function(){axis = zAxis;};
    document.getElementById("ButtonT").onclick = function(){flag = !flag;};
    document.getElementById("ButtonP").onclick = function(){paused = !paused;};

   ambientR.oninput = () => console.log("Ambient R:", ambientR.value);
   ambientG.oninput = () => console.log("Ambient G:", ambientG.value);
   ambientB.oninput = () => console.log("Ambient B:", ambientB.value);
   shininess.oninput = () => console.log("Shininess:", shininess.value);

   specularR.oninput = () => console.log("Specular R:", specularR.value);
   specularG.oninput = () => console.log("Specular G:", specularG.value);
   specularB.oninput = () => console.log("Specular B:", specularB.value);

    gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uLightPosition"),
       lightPosition );

    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"), materialShininess);

    gl.uniformMatrix4fv( gl.getUniformLocation(program, "uProjectionMatrix"),
       false, flatten(projectionMatrix));
    render();
}

var render = function(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

   materialAmbient = vec4(
    parseFloat(ambientR.value),
    parseFloat(ambientG.value),
    parseFloat(ambientB.value),
    1.0
);
materialDiffuse = vec4(
    parseFloat(diffuseR.value),
    parseFloat(diffuseG.value),
    parseFloat(diffuseB.value),
    1.0
);
materialSpecular = vec4(
    parseFloat(specularR.value),
    parseFloat(specularG.value),
    parseFloat(specularB.value),
    1.0
);
lightAmbient = vec4(
   parseFloat(lightAmbientR.value),
   parseFloat(lightAmbientG.value),
   parseFloat(lightAmbientB.value),
   1.0
);
lightDiffuse = vec4(
   parseFloat(lightDiffuseR.value),
   parseFloat(lightDiffuseG.value),
   parseFloat(lightDiffuseB.value),
   1.0
);
lightSpecular = vec4(
   parseFloat(lightSpecularR.value),
   parseFloat(lightSpecularG.value),
   parseFloat(lightSpecularB.value),
   1.0
);

   var ambientProduct = mult(lightAmbient, materialAmbient);
   var diffuseProduct = mult(lightDiffuse, materialDiffuse);
   var specularProduct = mult(lightSpecular, materialSpecular);
   materialShininess = parseFloat(shininess.value);
gl.uniform4fv(gl.getUniformLocation(program, "uAmbientProduct"),
       ambientProduct);
    gl.uniform4fv(gl.getUniformLocation(program, "uDiffuseProduct"),
       diffuseProduct );
    gl.uniform4fv(gl.getUniformLocation(program, "uSpecularProduct"),
       specularProduct ); 
    gl.uniform1f(gl.getUniformLocation(program,
       "uShininess"), materialShininess);


    if(!paused){
      if(flag){
        theta[axis] += 2.0; 
      }
      else{
         theta[axis] -= 2.0;
      }
    }

    modelViewMatrix = mat4();
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[xAxis], vec3(1, 0, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[yAxis], vec3(0, 1, 0)));
    modelViewMatrix = mult(modelViewMatrix, rotate(theta[zAxis], vec3(0, 0, 1)));

    //console.log(modelView);

    gl.uniformMatrix4fv(gl.getUniformLocation(program,
            "uModelViewMatrix"), false, flatten(modelViewMatrix));

    gl.drawArrays(gl.TRIANGLES, 0, numPositions);


    requestAnimationFrame(render);
}

}

shadedCube();


/*Add button for pause rotation, switch toggle rotation to change direction
Add sliders for:
Shininess (0-200)
Material, Ambient (RGB 0-1, 3 sliders)
Material, Diffuse (RGB 0-1, 3 sliders)
Material, Soecular   (RGB 0-1, 3 sliders)
Light, Ambient (RGB 0-1, 3 sliders)
Light, Diffuse (RGB 0-1, 3 sliders)
Light, Specular   (RGB 0-1, 3 sliders)*/