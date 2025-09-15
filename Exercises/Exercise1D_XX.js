var gl;

var theta = 0.0;
var thetaLoc;

var direction = true;
var stopped = false;
var speed = 0.01;
var lastSpeed = speed;

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

	// Four vertices
    var vertices = [
        vec2( 0,  1),
        vec2(-1,  0),
        vec2( 0, 0),
        vec2( 0, 0),
        vec2( 1, 0),
        vec2( 0, -1)
    ];

    var colors = [
        vec3(1.0, 0.0, 0.0),  // red
        vec3(0.0, 1.0, 0.0),  // green
        vec3(0.0, 0.0, 1.0),  // blue
        vec3(1.0, 1.0, 0.0),  // yellow
        vec3(1.0, 0.0, 1.0),  // magenta
        vec3(0.0, 1.0, 1.0)   // cyan
    ]

	
    //  Configure WebGL
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);

    //  Load shaders and initialize attribute buffers
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
	
    // Load the data into the GPU
    // Associate out shader variables with our data buffer
    var vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation( program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    thetaLoc = gl.getUniformLocation( program, "uTheta" );

    // Initialize event handlers
    document.getElementById("Direction").onclick = function () {
        direction = !direction;
    };

    document.getElementById("Controls" ).onclick = function(event) {
        switch(event.target.index) {
		case 0:
            if (stopped == false){
                speed = 0;
                stopped = !stopped;
            }
            else{
                speed = lastSpeed;
                stopped = !stopped;
            }
            break;
        case 1:
            speed *= 2;
            lastSpeed = speed;
            break;
        case 2:
            speed /= 2;
            lastSpeed = speed;
            break;
        }
    };

    render();
};

function render(){
    gl.clear(gl.COLOR_BUFFER_BIT);
	
	if (direction)
		theta += speed;
	else 
		theta -= speed;

    gl.uniform1f(thetaLoc, theta);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
	
	requestAnimationFrame(render);
}
