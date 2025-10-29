var gl;

var theta = 0.0;
var thetaLoc;

var speed = 0.00;
var prevSpeed = speed;
var paused = true;
var direction = true;
var colorsTemp = [];

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var vertices = [
        vec3( -1, 0.25, 0.0),
        vec3( 0, 1, 0.0),
        vec3( 1, 0.25, 0.0),
        vec3( -1,-0.25, 0.0),
        vec3( 0, -1, 0),
        vec3( 1, -0.25, 0),
    ];



    var colors = [
        vec3( 1.0, 0.0, 0.0),
        vec3(0.0, 1.0, 0.0 ),
        vec3(  0.0, 0.0, 1.0),
        vec3(  0.0, 1.0, 1.0),
        vec3(  1.0, 0.0, 1.0),
        vec3(  1.0, 1.0, 0.0)
    ]

    


    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);


    var colorLoc = gl.getAttribLocation( program, "aColor");
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);


    // Create a buffer object, initialize it, and associate it with the
    //  associated attribute variable in our vertex shader
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation( program, "uTheta" );

    // Initialize event handlers
    document.getElementById("Color").onclick = function () {
        for (var i = 3; i < 6; ++i){
            colorsTemp[i-3] = colors[i];
        }
        for (var i = 3; i < 6; ++i){
            colors[i] = colors[i - 3];
        }
        for (var i = 0; i < 3; ++i){
            colors[i] = colorsTemp[i];
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

        gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(colorLoc);

    };

    document.getElementById("Controls" ).onclick = function(event) {
        switch(event.target.index) {
         case 0:
            if (paused == false){
                prevSpeed = speed;
                speed = 0;
                paused = true;
            }
            else{
                if (prevSpeed == 0.00){
                    speed = 0.05;
                    prevSpeed = speed;
                }
                speed = prevSpeed;
                paused = false;

            }
            break;
         case 1:
            direction = !direction;
            break;
         case 2:
            speed *= 2;
            break;
         case 3:
            speed /= 2;
            break;
		}
    };

    render();
};

function render()
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    if (direction){
        theta += speed;
    }
    if (!direction){
        theta -= speed;
    }
	gl.uniform1f(thetaLoc, theta);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

	requestAnimationFrame(render);

 }
