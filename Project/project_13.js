"use strict";

var canvas;
var gl;
var program;

var projectionMatrixLoc;
var angle = 0.0;
var pan = 0.0;
var panAccel=0.0015;
var panTime = 0.0;
var panDone = false;
var moonShift = 0.0;
var moonShiftSpeed = 0.001;
var moonLoc;
var moonDone = false;
var starReady = false;

var panDown = false;
var panDownSpeed = 0.0015;
var panDownAmount = 0.0;


var eye;
var at;
var up;
var starView;

var sunBufferId;
var moonBufferId;
var sunColorBuffer;
var moonColorBuffer;
var starColorBuffer;
var star1BufferId;
var star1ColorBuffer;
var star2BufferId;
var star2ColorBuffer;
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

var starStop = false;
var starTime = 0.0;
var starGo = false;

var stopTimer = 0.0;
var lift = 0.0;
var liftFactor = 0.0018;
var pause = 0.0;
var time = 0.0;             //Control for movement and color transitions
var slow = 0.0;             //Modifies speed to create gradual transitions
var speed = 0.005;         //Modifies time
var timeLoc;
var backRed = 0.5;          //Background red value
var backGreen = 1.0;        //Background green value
var backBlue = 1.0;         //Background blue value
var sunset = 1.0;           //Green value for sun
var starRed = backRed;      //Star red value  
var starGreen = backGreen;  //Star green value
var starBlue = backBlue;    //Star blue value


var starsGenerated = false;
var starsInPosition = false;
var star1ModelViewMatrix = mat4();
var star2ModelViewMatrix = mat4();
var starView = mat4();


var star1X = 2.0, star1Y = 0.0, star1Z = -1.5;
var star2X = -2.0, star2Y = 0.0, star2Z = -1.5;
var star1VelX = -0.008, star1VelY = 0.0, star1VelZ = 0.0;
var star2VelX = 0.008, star2VelY = 0.0, star2VelZ = 0.0;
var rotationSpeed = 0.1;
var collision = false;
var lastCollision = false;
var TEMP_TEST_PAUSE = 0.0;
// Calculate distance between star centers
var dx;
var dy;
var dz;
var distance;
var starsMet = false;

var starRadius = 0.16; // outerRadius
var collisionDistance = starRadius * 1.1;


var sunColors = [];
for (let i = 0; i < 42; i++) {
    sunColors.push(vec3(1.0, sunset, 0.0));
}

var moonColors = [];
for (let i = 0; i < 42; i++) {
    moonColors.push(vec3(1.0, 1.0, 0.7));
}


// Arrays for randomly generated stars
var starVertices = [];
var starColors = [];




// Function to generate a 3D star
function generateStar3D(centerX, centerY, centerZ, outerRadius, innerRadius, depth, points) {
    var vertices = [];
    var angleStep = (2 * Math.PI) / points;
    var angleOffset = Math.PI / 2; // ADD THIS: rotates everything 90° counterclockwise so first point aims up
    
    // Generate front face vertices
    var frontVertices = [];
    for (var i = 0; i < points * 2; i++) {
        var angle = i * angleStep / 2 + angleOffset; // ADD angleOffset here
        var radius = (i % 2 === 0) ? outerRadius : innerRadius;
        frontVertices.push(vec3(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle),
            centerZ + depth / 2
        ));
    }
    
    // Generate back face vertices
    var backVertices = [];
    for (var i = 0; i < points * 2; i++) {
        var angle = i * angleStep / 2 + angleOffset; // ADD angleOffset here
        var radius = (i % 2 === 0) ? outerRadius : innerRadius;
        backVertices.push(vec3(
            centerX + radius * Math.cos(angle),
            centerY + radius * Math.sin(angle),
            centerZ - depth / 2
        ));
    }
    
    // Create triangles for front face (centered star)
    for (var i = 0; i < points * 2; i++) {
        var next = (i + 1) % (points * 2);
        vertices.push(vec3(centerX, centerY, centerZ + depth / 2));
        vertices.push(frontVertices[i]);
        vertices.push(frontVertices[next]);
    }
    
    // Create triangles for back face (centered star)
    for (var i = 0; i < points * 2; i++) {
        var next = (i + 1) % (points * 2);
        vertices.push(vec3(centerX, centerY, centerZ - depth / 2));
        vertices.push(backVertices[next]);
        vertices.push(backVertices[i]);
    }
    
    // Create side triangles connecting front and back
    for (var i = 0; i < points * 2; i++) {
        var next = (i + 1) % (points * 2);
        
        // First triangle
        vertices.push(frontVertices[i]);
        vertices.push(backVertices[i]);
        vertices.push(frontVertices[next]);
        
        // Second triangle
        vertices.push(frontVertices[next]);
        vertices.push(backVertices[i]);
        vertices.push(backVertices[next]);
    }
    
    return vertices;
}

var star1Vertices = [];
var star2Vertices = [];

// Generate colors for big stars
function generateStarColors(numVertices) {
    var colors = [];
    for (var i = 0; i < numVertices; i++) {
        colors.push(vec3(1.0, 1.0, 0.45)); // Gold color
    }
    return colors;
}

// Function to get all star edge points (outer AND inner points)
function getStarEdgePoints(centerX, centerY, centerZ, outerRadius, innerRadius, rotation) {
    var points = [];
    var angleStep = (2 * Math.PI) / 5;
    var angleOffset = Math.PI / 2;
    
    for (var i = 0; i < 10; i++) { // 10 points: 5 outer + 5 inner
        var angle = i * angleStep / 2 + angleOffset + radians(rotation);
        var radius = (i % 2 === 0) ? outerRadius : innerRadius;
        var x = centerX + radius * Math.cos(angle);
        var y = centerY + radius * Math.sin(angle);
        points.push({x: x, y: y, z: centerZ});
    }
    return points;
}

// Check if two line segments intersect
function lineSegmentsIntersect(p1, p2, p3, p4) {
    var denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
    if (Math.abs(denom) < 0.0001) return false; // parallel
    
    var ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
    var ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
    
    return (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1);
}


var star1Colors = [];
var star2Colors = [];


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
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    // --- Sun (even 12-sided circle + center) ---
    var sunVertices = [];
    var sunCenter = vec3(-0.7, 0.58, 0.0);
    sunVertices.push(sunCenter);

    var sunRadius = 0.12;
    var sunSegments = 40;
    for (let i = 0; i <= sunSegments; i++) { // <= closes loop
        let angle = (i / sunSegments) * 2 * Math.PI;
        let x = sunCenter[0] + Math.cos(angle) * sunRadius;
        let y = sunCenter[1] + Math.sin(angle) * sunRadius;
        sunVertices.push(vec3(x, y, 0.0));
    }

    // --- Moon (even 12-sided circle + center) ---
    var moonVertices = [];
    var moonCenter = vec3(-2.5, 0.58, 0.0);
    moonVertices.push(moonCenter);

    var moonRadius = 0.12;
    var moonSegments = 40;
    for (let i = 0; i <= moonSegments; i++) {
        let angle = (i / moonSegments) * 2 * Math.PI;
        let x = moonCenter[0] + Math.cos(angle) * moonRadius;
        let y = moonCenter[1] + Math.sin(angle) * moonRadius;
        moonVertices.push(vec3(x, y, 0.0));
    }






    for (var i = 0; i < 7000; ++i) {
        // Random direction from origin
        var theta = Math.random() * 2 * Math.PI;   // around Y axis
        var phi = Math.acos(2 * Math.random() - 1); // polar angle
        var radius = 10.0; // distance of star sphere
        var x = radius * Math.sin(phi) * Math.cos(theta);
        var y = radius * Math.sin(phi) * Math.sin(theta);
        var z = radius * Math.cos(phi);
        starVertices.push(vec3(x, y, z));
        starColors.push(vec3(backRed, backGreen, backBlue));
    }


    document.getElementById( "start" ).onclick = function () {
        start = true;
    };

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


/*
    star1ColorBuffer = gl.createBuffer();
    star1BufferId = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, star1BufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Vertices), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, star1ColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Colors), gl.STATIC_DRAW);

    star2BufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, star2BufferId);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(star2Vertices), gl.STATIC_DRAW);

    star2ColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, star2ColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(star2Colors), gl.STATIC_DRAW);
*/


    star1ColorBuffer = gl.createBuffer();
    star1BufferId = gl.createBuffer();
    star2BufferId = gl.createBuffer();
    star2ColorBuffer = gl.createBuffer();


    colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    timeLoc = gl.getUniformLocation(program, "uTime");
    moonLoc = gl.getUniformLocation(program, "uMoon");
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");

    render();
};


function render() {
    // Set background color
    gl.clearColor(backRed, backGreen, backBlue, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

if (start==true){

    // Background colors gradually decrease, becoming close to black
    if (backRed > 0.03 && backGreen > 0.03 && backBlue > 0.03 && time >= 0.25){
        backRed -= speed * 0.25;
        backGreen -= speed * 0.52;
        backBlue -= speed * 0.52;

    }

    // Sun green value decreases, becoming orange
    if (sunset > 0.55) {
    sunset -= speed * 0.18;
    for (var i = 0; i < 42; i++) sunColors[i] = vec3(1.0, sunset, 0.0);
    }

    // Stars colors start off same color as background, then transition to white
    if (time >= 0.05 && starStop == false){
        if (starRed <= 1.0){
            starRed += speed*0.9;
        }
        if (starGreen <= 1.0){
            starGreen += speed*0.9;
        }
        if (starBlue <= 1.0){
            starBlue += speed*0.9;
        }
        if (starRed >= 1.0 && starGreen >= 1.0 && starBlue >= 1.0){
            starStop = true;
        }
        console.log("Star Red:", starRed);
        console.log("Star Green:", starGreen);
        console.log("Star Blue:", starBlue);
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
    if (time < 0.1 && speed >= 0.0002){
        time += speed;
    }
    // Past threshold, speed gradually lowered, time increases a slower rate
    else if (time >= 0.1 && speed >= 0.0002){
        slow += 0.00000003;
        speed -= slow;
        time += speed;
        //  console.log(time);  //Tracking time when speed reaches 0
        console.log(speed)
    }

    if (speed <= 0.0002 && pause <= 0.5){
            pause += 0.015
        }


/* OLD STUFF
    if (speed <= 0.0002 && pause <= 0.5){
        pause += 0.015
    }
    if (pause >= 0.5 && doneLifting == false){
        lift += liftFactor;
        if (star1Spawned == true){
            starLift += liftFactor;
        }
        if (liftFactor < 0.28 && lifted == false && star1Spawned == false){
            liftFactor *= 1.0118;
            //console.log(liftFactor);
            if (liftFactor >= 0.28){
                lifted = true;
            }
            modelViewMatrix = mat4();

            modelViewMatrix = mult(translate(0.0, lift, 0.0), modelViewMatrix);
        }
        else if (lifted == true && liftFactor >= 0.006 && star1Spawned == false){
            liftFactor *= 0.987;
            //console.log(liftFactor);
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
*/


}



    if (moonDone == false){
        // Time passed to vertex shader, moves sun and moon
        gl.uniform1f(timeLoc, time);
        gl.uniform1f(moonLoc, moonShift);

        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4()));
        

        // Sun color and vertex values sent to shaders
        gl.bindBuffer(gl.ARRAY_BUFFER, sunColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(sunColors), gl.DYNAMIC_DRAW);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);


        gl.bindBuffer(gl.ARRAY_BUFFER, sunBufferId);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 42);


        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(mat4()));


        // Moon color and vertex values sent to shaders
        gl.bindBuffer(gl.ARRAY_BUFFER, moonColorBuffer);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

        gl.bindBuffer(gl.ARRAY_BUFFER, moonBufferId);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.TRIANGLE_FAN, 0, 42);


        gl.uniform1f(timeLoc, 0.0);
    }


    var aspect = canvas.width / canvas.height;
    var starProjection = perspective(45.0, aspect, 0.1, 100.0);

    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(starProjection));

    // Camera panning 
    if (pause >= 0.5 && panAccel > 0.0001){
        angle = pan;
        pan += panAccel;
        if (pan > 2 * Math.PI) {
            pan -= 2 * Math.PI;
        }


        moonShift = pan;

        if (panTime < 1.88){
            panAccel *= 1.025;
            panTime += 0.01;
            if (panTime >= 1.5){
                moonDone = true;
            }
        }
        else if (panTime >= 1.88){
            panAccel *= 0.975;
            panTime += 0.01;
            console.log("PanAccel: ", panAccel);
            if (panTime >= 4.0){
                    starReady = true;
                }
        }
    }
    else if (panAccel <= 0.0001){
        panDone = true;
    }

/*    if (panDone == true && starGo == false){
        starTime += 0.1;
        console.log("starTime: ", starTime);
        if (starTime >= 8.0){
            starGo = true;
        }
    }
*/


/*
    if (panDone && !panDown) {
        panDown = true;

    }

    if (panDown == true && panDownAmount <= 2.35){
        panDownAmount += panDownSpeed;
        if (panDownAmount <= 1.1){
            panDownSpeed *= 1.02;
        }
        else{
            panDownSpeed *= 0.983;
        }
        console.log("Pan down amount", panDownAmount);
    }
*/

    eye = vec3(0.0, 0.0, 1.0);
    // Camera pans vertically
    var verticalAngle = pan;
    //var radius = 1.5; //
    var y = Math.sin(verticalAngle); 
    var z = Math.cos(verticalAngle); 

    if (panDown == false) {
        at = vec3(0.0, y, -z);
    } else {
        at = vec3(0.0, y - panDownAmount, -z);
    }

    up  = vec3(0.0, 1.0, 0.0);

    var starView = lookAt(eye, at, up);
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(starView));






    gl.uniform1f(timeLoc, 0.0);
    gl.uniform1f(moonLoc, 0.0);


    gl.bindBuffer(gl.ARRAY_BUFFER, starColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(starColors), gl.DYNAMIC_DRAW);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    gl.bindBuffer(gl.ARRAY_BUFFER, starBuffer);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.drawArrays(gl.POINTS, 0, starVertices.length);


    if (panDone && !starsGenerated) {
        // Camera has stopped, spawn stars OFF-SCREEN to the left and right
        //var centerY = at[1]; 
        //var centerZ = at[2] - 1.5;
        
        // Far left and far right, off-screen
        star1Vertices = generateStar3D(0.0, 0.0, 0.0, 0.16, 0.064, 0.04, 5);
        star2Vertices = generateStar3D(0.0, 0.0, 0.0, 0.16, 0.064, 0.04, 5);
        
        // Set starting positions
        star1X = 1.7;
        star1Y = at[1];
        star1Z = at[2] - 1.5;
        
        star2X = -1.7;
        star2Y = at[1];
        star2Z = at[2] - 1.5;


        gl.bindBuffer(gl.ARRAY_BUFFER, star1BufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Vertices), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, star2BufferId);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(star2Vertices), gl.STATIC_DRAW);
        
        star1Colors = generateStarColors(star1Vertices.length);
        star2Colors = generateStarColors(star2Vertices.length);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, star1ColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(star1Colors), gl.STATIC_DRAW);
        
        gl.bindBuffer(gl.ARRAY_BUFFER, star2ColorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(star2Colors), gl.STATIC_DRAW);
        
        starsGenerated = true;
        starReady = true; 
    }


    if (panDone && starsMet == false) {
        if (starsMet == false) {

            // Pause upon contact for demonstration
            if (TEMP_TEST_PAUSE == 0.0 || TEMP_TEST_PAUSE >= 2.0){
                star1X += star1VelX;
                star1Y += star1VelY;
                star1Z += star1VelZ;
                
                star2X += star2VelX;
                star2Y += star2VelY;
                star2Z += star2VelZ;
            }
                
            // Apply transforms
            
            star1ModelViewMatrix = mat4();
            star1ModelViewMatrix = mult(star1ModelViewMatrix, translate(star1X, star1Y, star1Z));
            star1ModelViewMatrix = mult(star1ModelViewMatrix, rotate(rotationSpeed, 0.0, 0.0, 1.0));
        
            
            star2ModelViewMatrix = mat4();
            star2ModelViewMatrix = mult(star2ModelViewMatrix, translate(star2X, star2Y, star2Z));
            star2ModelViewMatrix = mult(star2ModelViewMatrix, rotate(rotationSpeed, 0.0, 0.0, 1.0));
            if (!lastCollision){
                rotationSpeed += 0.25;
            }

            var star1Points = getStarEdgePoints(star1X, star1Y, star1Z, 0.16, 0.064, rotationSpeed);
            var star2Points = getStarEdgePoints(star2X, star2Y, star2Z, 0.16, 0.064, rotationSpeed);
                    
            // Check for collision  
            collision = false;
            if (!collision){
                for (var i = 0; i < star1Points.length; i++) {
                    var p1 = star1Points[i];
                    var p2 = star1Points[(i + 1) % star1Points.length]; // next point (wraps around)
                    
                    for (var j = 0; j < star2Points.length; j++) {
                        var p3 = star2Points[j];
                        var p4 = star2Points[(j + 1) % star2Points.length];
                        
                        if (lineSegmentsIntersect(p1, p2, p3, p4)) {
                            collision = true;
                            console.log("Collision detected");
                            break;
                        }
                    }
                    if (collision) break;
                }
            }

            if (collision && !lastCollision){
                star1VelX = -star1VelX;
                star2VelX = -star2VelX;

            }
            lastCollision = collision;
            if (lastCollision){
                TEMP_TEST_PAUSE += 0.03;
            }
                    
            /*if (collision) {
                starsMet = true;
            }*/

        }
        
    }

    if (starReady && panDone) {

        var aspect = canvas.width / canvas.height;
        var starProjection = perspective(45.0, aspect, 0.1, 100.0);
        gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(starProjection));
        
/*
        if (starGo == true){
            star1ModelViewMatrix = mult(translate(0.001, 0.0, 0.0), star1ModelViewMatrix);
            star2ModelViewMatrix = mult(translate(-0.001, 0.001, 0.0), star2ModelViewMatrix);
        }
*/
        

        var finalStar1View = mult(starView, star1ModelViewMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(finalStar1View));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, star1ColorBuffer);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, star1BufferId);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
        gl.drawArrays(gl.TRIANGLES, 0, star1Vertices.length);
        

        var finalStar2View = mult(starView, star2ModelViewMatrix);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(finalStar2View));
        
        gl.bindBuffer(gl.ARRAY_BUFFER, star2ColorBuffer);
        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, star2BufferId);
        gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);
        gl.drawArrays(gl.TRIANGLES, 0, star2Vertices.length);
    }



    requestAnimationFrame(render);
}
