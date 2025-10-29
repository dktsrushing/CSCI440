"use strict";

var canvas;
var gl;

var sunBufferId;
var moonBufferId;
var sunColorBuffer;
var moonColorBuffer;
var starColorBuffer;
var star1BufferId;
var star1ColorBuffer;
var starBuffer;
var positionLoc;
var colorLoc;
var modelViewMatrix = mat4();
var modelViewMatrixLoc;
var lifted = false;
var doneLifting = false;
var star1Vertices = [];
var star1Colors = [];
var star1Spawned = false;
var star1Matrix;
var starLift = 0.0;
var start = false;

var stopTimer = 0.0;
var lift = 0.0;
var liftFactor = 0.0018;
var pause = 0.0;
var time = 0.0;             //Control for movement and color transitions
var slow = 0.0;             //Modifies speed to create gradual transitions
var speed = 0.0017;         //Modifies time
var timeLoc;
var backRed = 0.5;          //Background red value
var backGreen = 1.0;        //Background green value
var backBlue = 1.0;         //Background blue value
var sunset = 1.0;           //Green value for sun
var starRed = backRed;      //Star red value  
var starGreen = backGreen;  //Star green value
var starBlue = backBlue;    //Star blue value

// Sun colors, green value decreases over time
var sunColors = [   
    vec3( 1.0, sunset, 0.0),
    vec3( 1.0, sunset, 0.0),
    vec3( 1.0, sunset, 0.0),
    vec3( 1.0, sunset, 0.0),
];

// Arrays for randomly generated stars
var starVertices = [];
var starColors = [];


window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert( "WebGL 2.0 isn't available" );


    //
    //  Configure WebGL
    //
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);


    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var sunVertices = [
        vec3(-0.6, 0.7, 0.0),
        vec3(-.8, 0.7, 0.0),
        vec3(-0.6, .5, 0.0),
        vec3(-.8, .5, 0.0)
    ];

    var moonVertices = [
        vec3(-2.4, 0.7, 0.0),
        vec3(-2.6, 0.7, 0.0),
        vec3(-2.4, .5, 0.0),
        vec3(-2.6, .5, 0.0)
    ];

    var moonColors = [
        vec3( 1.0, 1.0, 0.7 ),
        vec3( 1.0, 1.0, 0.7),
        vec3( 1.0, 1.0, 0.7),
        vec3( 1.0, 1.0, 0.7),
    ];



    // Generate 200 stars at random positions, push to vertex and color arrays
    for (var i = 0; i < 8000; ++i){
        // Generate number 0 to 2, -1 for range -1 to 1
        var x = Math.random() * 2 -1;
        var y = Math.random() * 80 -79;
        starVertices.push(vec3(x,y, 0.5));
        starColors.push(vec3(backRed, backGreen, backBlue));
    }

    document.getElementById( "start" ).onclick = function () {
        start = true;
    };
    // Load the data into the GPU

    moonColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(moonColors), gl.STATIC_DRAW);

    moonBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, moonBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(moonVertices), gl.STATIC_DRAW);

    sunColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sunColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sunColors), gl.STATIC_DRAW);

    sunBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, sunBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sunVertices), gl.STATIC_DRAW);

    starColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(starColors), gl.STATIC_DRAW);

    starBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(starVertices), gl.STATIC_DRAW);

    star1ColorBuffer = gl.createBuffer();


    star1BufferId = gl.createBuffer();




    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // Associate out shader variables with our data bufferData

    positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    timeLoc = gl.getUniformLocation(program, "uTime");
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");

    render();
};


function render() {
    // Set background color
    gl.clearColor(backRed, backGreen, backBlue, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

if (start==true){

    // Background colors gradually decrease, becoming close to black
    if (backRed > 0.0 && backGreen > 0.0 && backBlue > 0.0){
        backRed -= 0.00035;
        backGreen -= 0.00062;
        backBlue -= 0.00062;
    }

    // Sun green value decreases, becoming orange
    if (sunset > 0.55){
        sunset -= 0.00027;
        sunColors[0] = vec3( 1.0, sunset, 0.0);
        sunColors[1] = vec3( 1.0, sunset, 0.0);
        sunColors[2] = vec3( 1.0, sunset, 0.0);
        sunColors[3] = vec3( 1.0, sunset, 0.0);
    }

    // Stars colors start off same color as background, then transition to white
    if (time >= 1.1){
        if (starRed <= 1.0 - 0.00055){
            starRed += 0.00085;
        }
        if (starGreen <= 1.0 - 0.00055){
            starGreen += 0.00046;
        }
        if (starBlue <= 1.0 - 0.00055){
            starBlue += 0.00046;
        }
    }

    // Update star colors
    for (var i = 0; i < starColors.length; ++i){
        // Until threshold, stay same as background color
        if (time < 1.1){
            starColors[i] = vec3(backRed, backGreen, backBlue);
            starRed = backRed;
            starGreen = backGreen;
            starBlue = backGreen;
        }
        // Past threshold, colors gradually change to white
        else if (time >= 1.1 && time < 1.9){
            starColors[i] = vec3(starRed, starGreen, starBlue);
            // console.log(starColors[0]); // Tracking color values
        }
    }

    // Time increases by initial speed rate
    if (time < 0.1 && speed >= 0.0){
        time += speed;
    }
    // Past threshold, speed gradually lowered, time increases a slower rate
    else if (time >= 0.1 && speed >= 0.0){
        slow += 0.0000000013;
        speed -= slow;
        time += speed;
        //  console.log(time);  //Tracking time when speed reaches 0
    }



    if (speed <= 0.0 && pause <= 0.3){
        pause += 0.015
    }
    if (pause >= 0.30 && doneLifting == false){
        lift += liftFactor;
        if (star1Spawned == true){
            starLift += liftFactor;
        }
        if (liftFactor < 0.28 && lifted == false && star1Spawned == false){
            liftFactor *= 1.0118;
            console.log(liftFactor);
            if (liftFactor >= 0.28){
                lifted = true;
            }
            modelViewMatrix = mat4();

            modelViewMatrix = mult(translate(0.0, lift, 0.0), modelViewMatrix);
        }
        else if (lifted == true && liftFactor >= 0.006 && star1Spawned == false){
            liftFactor *= 0.987;
            console.log(liftFactor);
            modelViewMatrix = mat4();

            modelViewMatrix = mult(translate(0.0, lift, 0.0), modelViewMatrix);
        }
        else if (lifted == true && liftFactor < 0.06 && star1Spawned == false){
            star1Spawned = true;
                star1Vertices = [
                    vec3(0.0, -1.2, 0.0),
                    vec3(0.15, -1.6, 0.0),
                    vec3(-0.225, -1.35, 0.0),
                    vec3(0.225, -1.35, 0.0),
                    vec3(-0.15, -1.6, 0.0),
                    vec3(0.0, -1.2, 0.0),
                ];
            for (var i = 0; i < 6; i++) {
            star1Colors.push(vec3(1.0, 1.0, 0.8)); // warm white star
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, star1BufferId);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Vertices), gl.STATIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER, star1ColorBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Colors), gl.STATIC_DRAW);

            
        }
        else if(star1Spawned == true && stopTimer < 1.0){
            stopTimer += 0.005;
            modelViewMatrix = mat4();

            modelViewMatrix = mult(translate(0.0, lift, 0.0), modelViewMatrix);
        }
        else if (stopTimer >= 1.0 && liftFactor >= 0.001){
            liftFactor *= 0.985;
            modelViewMatrix = mat4();

            modelViewMatrix = mult(translate(0.0, lift, 0.0), modelViewMatrix);
        }
        else{
            doneLifting = !doneLifting;
        }

    }
}
    // Time passed to vertex shader, moves sun and moon
    gl.uniform1f(timeLoc, time);

    
    // Sun color and vertex values sent to shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, sunColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sunColors), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, sunBufferId);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);


    // Moon color and vertex values sent to shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, moonBufferId);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Change uTime to 0.0, so stars do not move with sun and moon
    gl.uniform1f(timeLoc, 0.0);


    // Star color and vertex values sent to shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, starColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(starColors), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.POINTS, 0, starVertices.length);

    if (star1Spawned) {
        // Create a separate matrix for the rising star
        if (doneLifting == false){
            star1Matrix = mult(mat4(), translate(0.0, starLift, 0.0));

        }
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(star1Matrix));

        // Star color
        gl.bindBuffer(gl.ARRAY_BUFFER, star1ColorBuffer);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        // Star vertices
        gl.bindBuffer(gl.ARRAY_BUFFER, star1BufferId);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        // Draw the 10-vertex star
        gl.drawArrays(gl.LINE_STRIP, 0, 6);
    }

    requestAnimationFrame(render);
}
