"use strict";

var canvas;
var gl;

var sunBufferId;
var moonBufferId;
var sunColorBuffer;
var moonColorBuffer;
var starColorBuffer;
var starBuffer;
var positionLoc;
var colorLoc;

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
        vec3(-0.6, 0.8, 0.0),
        vec3(-.8, 0.8, 0.0),
        vec3(-0.6, .6, 0.0),
        vec3(-.8, .6, 0.0)
    ];

    var moonVertices = [
        vec3(-2.4, 0.8, 0.0),
        vec3(-2.6, 0.8, 0.0),
        vec3(-2.4, .6, 0.0),
        vec3(-2.6, .6, 0.0)
    ];

    var moonColors = [
        vec3( 1.0, 1.0, 0.7 ),
        vec3( 1.0, 1.0, 0.7),
        vec3( 1.0, 1.0, 0.7),
        vec3( 1.0, 1.0, 0.7),
    ];


    // Generate 200 stars at random positions, push to vertex and color arrays
    for (var i = 0; i < 200; ++i){
        // Generate number 0 to 2, -1 for range -1 to 1
        var x = Math.random() * 2 -1;
        var y = Math.random() * 2 - 1;
        starVertices.push(vec3(x,y, 0.5));
        starColors.push(vec3(backRed, backGreen, backBlue));
    }

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



    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // Associate out shader variables with our data bufferData

    positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    timeLoc = gl.getUniformLocation(program, "uTime");

    render();
};


function render() {
    // Set background color
    gl.clearColor(backRed, backGreen, backBlue, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

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
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Moon color and vertex values sent to shaders
    gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, moonBufferId);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
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
    gl.drawArrays(gl.POINTS, 0, starVertices.length);

    requestAnimationFrame(render);
}
