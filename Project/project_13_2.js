"use strict";

var canvas;
var gl;
var program;

var start = false;

var sunset = 1.0;

var starVertices = [];
var starColors = [];

var sunVertices = [];
var sunColors = [];

var moonVertices = [];
var moonColors = [];

var star1Vertices = [];
var star1Colors = [];

var star2Vertices = [];
var star2Colors = [];




window.onload = function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = canvas.getContext('webgl2');
    if (!gl) alert ("WebGl 2.0 isn't available");

    //Configure WebGl
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.5, 1.0, 1.0, 1.0);
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    document.getElementById( "start" ).onclick = function () {
        start = true;
    };

    // --- Sun (even 12-sided circle + center) ---
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




    

};



function render(){
    gl.clearColot(backRed, backGreen, backBlue);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);








    requestAnimationFrame(render);
}

