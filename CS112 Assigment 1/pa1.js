"use strict";

var gl;                 // The webgl context.

var a_coords_loc;       // Location of the a_coords attribute variable in the shader program.
var a_coords_buffer;    // Buffer to hold the values for a_coords.
var a_normal_loc;       // Location of a_normal attribute.
var a_normal_buffer;    // Buffer for a_normal.
var index_buffer;       // Buffer to hold vetex indices from model.

var u_diffuseColor;     // Locations of uniform variables in the shader program
var u_specularColor;
var u_specularExponent;
var u_lightPosition;
var u_modelview;
var u_projection;
var u_normalMatrix;    

var projection = mat4.create();          // projection matrix
var modelview;                           // modelview matrix; value comes from rotator
var normalMatrix = mat3.create();        // matrix, derived from model and view matrix, for transforming normal vectors
var rotator;                             // A TrackballRotator to implement rotation by mouse.

var lastTime = 0;
var colors = [  // RGB color arrays for diffuse and specular color values
    [1,1,1],
];

var lightPositions = [  // values for light position
  [0,0,0,1],
];

var objects = [         // Objects for display
    chair(),table(), cube(),
];

var currentModelNumber;  // contains data for the current object

function degToRad(degrees) {
  return degrees * Math.PI / 180;
}


function perspective(//TODO: function inputs
    modelData,fovy,aspect,near,far
    ){

    if (document.getElementById("my_gl").checked) {
         /*
        TODO: Your code goes here.
        Write the code to perform perspective transformation. 
        Think about what would be the input and output to the function would be
        */
        let f = 1.0 / Math.tan(fovy / 2);
        let nf = 1 / (near - far);
        modelData[0] = f / aspect;
        modelData[1] = 0;
        modelData[2] = 0;
        modelData[3] = 0;
        modelData[4] = 0;
        modelData[5] = f;
        modelData[6] = 0;
        modelData[7] = 0;
        modelData[8] = 0;
        modelData[9] = 0;
        modelData[10] = (far + near) * nf;
        modelData[11] = -1;
        modelData[12] = 0;
        modelData[13] = 0;
        modelData[14] = (2 * far * near) * nf;
        modelData[15] = 0;
        return modelData;
    }
    else {
        /*
        TODO: Your code goes here.
        use inbuilt_gl functions to perform perspective projection
        */
        mat4.perspective(modelData, fovy, aspect, near, far);
        return modelData;
    }  
}

function translate(//TODO: function inputs
    modelData, parameter
    ){
    if (document.getElementById("my_gl").checked) {
        /*
        TODO: Your code goes here.
        Write the code to perform translation transformation. 
        Think about what would be the input and output to the function would be
        */
        let x = parameter[0], y = parameter[1], z = parameter[2];

        modelData[12] = modelData[0] * x + modelData[4] * y + modelData[8] * z + modelData[12];
        modelData[13] = modelData[1] * x + modelData[5] * y + modelData[9] * z + modelData[13];
        modelData[14] = modelData[2] * x + modelData[6] * y + modelData[10] * z + modelData[14];
        modelData[15] = modelData[3] * x + modelData[7] * y + modelData[11] * z + modelData[15];

        return modelData;
        
    }
    else {
        /*
        TODO: Your code goes here.
        use inbuilt_gl functions to perform translation
        */
        mat4.translate(modelData, modelData, parameter);
        return modelData;
    }  
}

function rotate(//TODO: function inputs
    modelData, parameter, axis
    ){

    if (document.getElementById("my_gl").checked) {
        /*
        TODO: Your code goes here.
        Write the code to perform rotation about ARBITARY axis.
        Note: One of the input to this function would be axis vector around which you would rotate. 
        Think about what would be the input and output to the function would be
        */
        let x = axis[0], y = axis[1], z = axis[2];
        let len = Math.sqrt(x * x + y * y + z * z);
        let s, c, t;
        let a00, a01, a02, a03;
        let a10, a11, a12, a13;
        let a20, a21, a22, a23;
        let b00, b01, b02;
        let b10, b11, b12;
        let b20, b21, b22;
        if (Math.abs(len) < glMatrix.EPSILON) { return null; }
        len = 1 / len;
        x *= len;
        y *= len;
        z *= len;
        s = Math.sin(parameter);
        c = Math.cos(parameter);
        t = 1 - c;
        a00 = modelData[0]; a01 = modelData[1]; a02 = modelData[2]; a03 = modelData[3];
        a10 = modelData[4]; a11 = modelData[5]; a12 = modelData[6]; a13 = modelData[7];
        a20 = modelData[8]; a21 = modelData[9]; a22 = modelData[10]; a23 = modelData[11];
        // Construct the elements of the rotation matrix
        b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
        b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
        b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;
        // Perform rotation-specific matrix multiplication
        modelData[0] = a00 * b00 + a10 * b01 + a20 * b02;
        modelData[1] = a01 * b00 + a11 * b01 + a21 * b02;
        modelData[2] = a02 * b00 + a12 * b01 + a22 * b02;
        modelData[3] = a03 * b00 + a13 * b01 + a23 * b02;
        modelData[4] = a00 * b10 + a10 * b11 + a20 * b12;
        modelData[5] = a01 * b10 + a11 * b11 + a21 * b12;
        modelData[6] = a02 * b10 + a12 * b11 + a22 * b12;
        modelData[7] = a03 * b10 + a13 * b11 + a23 * b12;
        modelData[8] = a00 * b20 + a10 * b21 + a20 * b22;
        modelData[9] = a01 * b20 + a11 * b21 + a21 * b22;
        modelData[10] = a02 * b20 + a12 * b21 + a22 * b22;
        modelData[11] = a03 * b20 + a13 * b21 + a23 * b22;

        return modelData;
    }
    else {
        /*
        TODO: Your code goes here.
        use inbuilt_gl functions to perform rotation
        */
        mat4.rotate(modelData,modelData,parameter,[0,1,0]);
        return modelData;
    }  

}

function scale(//TODO: function inputs
    modelData,parameter
    ){

    if (document.getElementById("my_gl").checked) {
        /*
        TODO: Your code goes here.
        Write the code to perform scale transformation. 
        Think about what would be the input and output to the function would be
        */
        let x = parameter[0], y = parameter[1], z = parameter[2];
        modelData[0] = modelData[0] * x;
        modelData[1] = modelData[1] * x;
        modelData[2] = modelData[2] * x;
        modelData[3] = modelData[3] * x;
        modelData[4] = modelData[4] * y;
        modelData[5] = modelData[5] * y;
        modelData[6] = modelData[6] * y;
        modelData[7] = modelData[7] * y;
        modelData[8] = modelData[8] * z;
        modelData[9] = modelData[9] * z;
        modelData[10] = modelData[10] * z;
        modelData[11] = modelData[11] * z;
        modelData[12] = modelData[12];
        modelData[13] = modelData[13];
        modelData[14] = modelData[14];
        modelData[15] = modelData[15];
        return modelData;
    }
    else {
        /*
        TODO: Your code goes here.
        use inbuilt_gl functions to perform scaling
        */
        mat4.scale(modelData, modelData,parameter);
        return modelData;
    } 
}



function draw() { 
    gl.clearColor(0.15,0.15,0.3,1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    mat4.perspective(projection, Math.PI / 5, 1, 10, 20);
    modelview = rotator.getViewMatrix();

    // draw the 1st chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    /*
    TODO: Your code goes here. 
    Compute all the necessary transformation to align object[0] (chair)
    Use your own functions with the proper inputs i.e
        1. translate()
        2. scale()
        3. rotate()
    Apply those transformation to the modelview matrix.
    Not all the transformations are relative and they keep on adding as you modify modelview. 
    Hence, you might want to reverse the previous transformation. Keep in mind the order
    in which you apply transformation.
    */
    translate(modelview, [0, 0, -0.6]);
    rotate(modelview, degToRad(180),[0,1,0]);
    translate(modelview, [1.4, -0.62, 0.66]);
    update_uniform(modelview, projection, 0);


    //undo 1st chair
    translate(modelview, [-1.4, 0.62, -0.66]);
    rotate(modelview, degToRad(-180),[0,1,0]);
    translate(modelview, [0, 0, 0.6]);
    // draw the 2nd chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    //TODO: Your code goes here.
    translate(modelview, [0, 0, -0.6]);
    rotate(modelview, degToRad(90), [0, 1, 0]);
    translate(modelview, [1.4, -0.62, 0.66]);
    update_uniform(modelview,projection, 0);


    //undo 2nd chair
    translate(modelview, [-1.4, 0.62, -0.66]);
    rotate(modelview, degToRad(-90), [0, 1, 0]);
    translate(modelview, [0, 0, 0.6]);
    // draw the 3rd chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    //TODO: Your code goes here. 
    translate(modelview, [0, 0, -0.6]);
    rotate(modelview, degToRad(-90), [0, 1, 0]);
    translate(modelview, [1.4, -0.62, 0.66]);
    update_uniform(modelview,projection, 0);


    //undo 3rd chair
    translate(modelview, [-1.4, 0.62, -0.66]);
    rotate(modelview, degToRad(90), [0, 1, 0]);
    translate(modelview, [0, 0, 0.6]);
    // draw the 4th chair , object[0]
    installModel(objects[0]);
    currentModelNumber = 0;
    //TODO: Your code goes here. 
    translate(modelview, [0, 0, -0.6]);
    translate(modelview, [1.4, -0.62, 0.66]);
    update_uniform(modelview,projection, 0);
    

    //undo 4th chair
    translate(modelview, [-1.4, 0.62, -0.66]);
    translate(modelview, [0, 0, 0.6]);
    // draw the Table , object[1]
    installModel(objects[1]);
    currentModelNumber = 1;
    //TODO: Your code goes here. 
    rotate(modelview, degToRad(45), [0, 1, 0]);
    translate(modelview, [0.3, 0, -0.5]);
    update_uniform(modelview,projection, 1);
    

    //undo table
    translate(modelview, [-0.3, 0, 0.5]);
    rotate(modelview, degToRad(-45), [0, 1, 0]);
    // draw the Cube , object[2]
    installModel(objects[2]);
    currentModelNumber = 2;
    //TODO: Your code goes here. 
    scale(modelview, [0.5, 0.5, 0.5]);
    translate(modelview, [-0.1, 0, -1.12]);
    update_uniform(modelview, projection, 2);


    //undo cube
    translate(modelview, [0.1, 0, 1.12]);
    scale(modelview, [-0.5,-0.5, -0.5]);
}

/*
  this function assigns the computed values to the uniforms for the model, view and projection 
  transform
*/
function update_uniform(modelview,projection,currentModelNumber){

    /* Get the matrix for transforming normal vectors from the modelview matrix,
       and send matrices to the shader program*/
    mat3.normalFromMat4(normalMatrix, modelview);
    
    gl.uniformMatrix3fv(u_normalMatrix, false, normalMatrix);
    gl.uniformMatrix4fv(u_modelview, false, modelview );
    gl.uniformMatrix4fv(u_projection, false, projection );   
    gl.drawElements(gl.TRIANGLES, objects[currentModelNumber].indices.length, gl.UNSIGNED_SHORT, 0);
}



/* 
 * Called and data for the model are copied into the appropriate buffers, and the 
 * scene is drawn.
 */
function installModel(modelData) {
     gl.bindBuffer(gl.ARRAY_BUFFER, a_coords_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexPositions, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_coords_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_coords_loc);
     gl.bindBuffer(gl.ARRAY_BUFFER, a_normal_buffer);
     gl.bufferData(gl.ARRAY_BUFFER, modelData.vertexNormals, gl.STATIC_DRAW);
     gl.vertexAttribPointer(a_normal_loc, 3, gl.FLOAT, false, 0, 0);
     gl.enableVertexAttribArray(a_normal_loc);
     gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index_buffer);
     gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, modelData.indices, gl.STATIC_DRAW);
}


/* Initialize the WebGL context.  Called from init() */
function initGL() {
    var prog = createProgram(gl,"vshader-source","fshader-source");
    gl.useProgram(prog);
    a_coords_loc =  gl.getAttribLocation(prog, "a_coords");
    a_normal_loc =  gl.getAttribLocation(prog, "a_normal");
    u_modelview = gl.getUniformLocation(prog, "modelview");
    u_projection = gl.getUniformLocation(prog, "projection");
    u_normalMatrix =  gl.getUniformLocation(prog, "normalMatrix");
    u_lightPosition=  gl.getUniformLocation(prog, "lightPosition");
    u_diffuseColor =  gl.getUniformLocation(prog, "diffuseColor");
    u_specularColor =  gl.getUniformLocation(prog, "specularColor");
    u_specularExponent = gl.getUniformLocation(prog, "specularExponent");
    a_coords_buffer = gl.createBuffer();
    a_normal_buffer = gl.createBuffer();
    index_buffer = gl.createBuffer();
    gl.enable(gl.DEPTH_TEST);
    gl.uniform3f(u_specularColor, 0.5, 0.5, 0.5);
    gl.uniform4f(u_diffuseColor, 1, 1, 1, 1);
    gl.uniform1f(u_specularExponent, 10);
    gl.uniform4f(u_lightPosition, 0, 0, 0, 1);
}

/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type String is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 *    The second and third parameters are the id attributes for <script>
 * elementst that contain the source code for the vertex and fragment
 * shaders.
 */
function createProgram(gl, vertexShaderID, fragmentShaderID) {
    function getTextContent( elementID ) {
            // This nested function retrieves the text content of an
            // element on the web page.  It is used here to get the shader
            // source code from the script elements that contain it.
        var element = document.getElementById(elementID);
        var node = element.firstChild;
        var str = "";
        while (node) {
            if (node.nodeType == 3) // this is a text node
                str += node.textContent;
            node = node.nextSibling;
        }
        return str;
    }
    try {
        var vertexShaderSource = getTextContent( vertexShaderID );
        var fragmentShaderSource = getTextContent( fragmentShaderID );
    }
    catch (e) {
        throw "Error: Could not get shader source code from script elements.";
    }
    var vsh = gl.createShader( gl.VERTEX_SHADER );
    gl.shaderSource(vsh,vertexShaderSource);
    gl.compileShader(vsh);
    if ( ! gl.getShaderParameter(vsh, gl.COMPILE_STATUS) ) {
        throw "Error in vertex shader:  " + gl.getShaderInfoLog(vsh);
     }
    var fsh = gl.createShader( gl.FRAGMENT_SHADER );
    gl.shaderSource(fsh, fragmentShaderSource);
    gl.compileShader(fsh);
    if ( ! gl.getShaderParameter(fsh, gl.COMPILE_STATUS) ) {
       throw "Error in fragment shader:  " + gl.getShaderInfoLog(fsh);
    }
    var prog = gl.createProgram();
    gl.attachShader(prog,vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if ( ! gl.getProgramParameter( prog, gl.LINK_STATUS) ) {
       throw "Link error in program:  " + gl.getProgramInfoLog(prog);
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    try {
        var canvas = document.getElementById("myGLCanvas");
        gl = canvas.getContext("webgl") || 
                         canvas.getContext("experimental-webgl");
        if ( ! gl ) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context:" + e + "</p>";
        return;
    }

    document.getElementById("my_gl").checked = false;
    document.getElementById("my_gl").onchange = draw;
    rotator = new TrackballRotator(canvas, draw, 15);
    draw();
}







