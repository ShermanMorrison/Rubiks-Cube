//var CUBE = (function() {

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );

var renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );



//controls = new THREE.OrbitControls (camera, renderer.domElement);
//var webglEl = document.getElementById('webgl');
//webglEl.appendChild(renderer.domElement);


camera.position.z = 10;
camera.position.x = 10;
camera.position.y = 7;

camera.rotation.y = Math.PI/4;


var rad = Math.PI/ 180;


var render = function () {

    if (bigCube.is_scrambling){
        bigCube.do_full_rotation();

        requestAnimationFrame( render );
        renderer.render(scene, camera);
        return;
    }

    bigCube.try_rotate();

    requestAnimationFrame( render );

    renderer.render(scene, camera);

    bigCube.try_update();
};


/*
** Class for individual cubes within the Rubik's Cube.
** Contains methods to manipulate cube and add it to scene.
*/
function Cube (x, y, z, offset) {

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material1 = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors} );
    var material2 = new THREE.MeshBasicMaterial( { color: 0x000000, vertexColors: THREE.FaceColors, wireframe: true,
        wireframeLinewidth: 4,
        } );

    geometry.faces[0].color.setHex(0xff0000);
    geometry.faces[1].color.setHex(0xff0000);

    geometry.faces[2].color.setHex(0x0000ff);
    geometry.faces[3].color.setHex(0x0000ff);

    geometry.faces[4].color.setHex(0x00ff00);
    geometry.faces[5].color.setHex(0x00ff00);

    geometry.faces[6].color.setHex(0xffff00);
    geometry.faces[7].color.setHex(0xffff00);

    geometry.faces[8].color.setHex(0xff7f00);
    geometry.faces[9].color.setHex(0xff7f00);

    geometry.faces[10].color.setHex(0xffffff);
    geometry.faces[11].color.setHex(0xffffff);

    var cube = new THREE.Mesh( geometry, material1);
    cube.position.x = x;
    cube.position.y = y;
    cube.position.z = z;
    this.cube = cube;

    var cube2 = new THREE.Mesh( geometry, material2);
    cube2.position.x = x;
    cube2.position.y = y;
    cube2.position.z = z;
    this.cube2 = cube2;

    this.orig_x = x + offset;
    this.orig_y = y + offset;
    this.orig_z = z + offset;
}

Cube.prototype.add_to_scene = function() {
    scene.add(this.cube);
    scene.add(this.cube2);
}

Cube.prototype.translate = function(x, y, z) {
    var translation = new THREE.Matrix4().makeTranslation(x, y, z);
    this.cube.geometry.applyMatrix(translation);
}

Cube.prototype.rotate = function(dim, a){

    var rotation;
    switch(dim) {
        case 0:
            rotation = new THREE.Matrix4().makeRotationX(a);
            break;
        case 1:
            rotation = new THREE.Matrix4().makeRotationY(a);
            break;
        case 2:
            rotation = new THREE.Matrix4().makeRotationZ(a);
            break;
        default:
            throw "Error: No rotation axis specified";
    }
    this.cube.geometry.applyMatrix(rotation);
}

/*
** Class for queued rotations.
*/
function QueuedRotation (xyz, layer, ccw) {
    this.xyz = xyz;
    this.layer = layer;
    this.ccw = ccw;
    this.angle = 90 * rad * (ccw ? 1 : -1);
}


/*
** Class for entire Rubik's Cube.
** Contains methods to rotate cube and make cube copies.
*/
function BigCube(dim) {

    this.is_checking_solved = false;
    this.is_solved = false;

    this.num_scramble_turns = 1;
    this.is_scrambling = false;

    this.dim = dim;

    this.angles = [0, 0, 0];    // remaining angle to rotate
    this.original_angles = [0, 0, 0];   // original angle to rotate
    this.rate = 0.1;

    this.xyz_to_rotate = null;
    this.layer_to_rotate = null;

    this.queue = new Queue();

    this.make_cube = function(dim){
        cube = [];
        for (var x=0; x<dim; x++){
            cube.push([]);
            for (var y=0; y<dim; y++){
                cube[x].push([]);
                for (var z=0; z<dim; z++){
                    cube[x][y].push(new Cube(x - (this.dim/2 - 0.5), y - (this.dim/2 - 0.5), z - (this.dim/2 - 0.5), this.dim/2 - 0.5));
                }
            }
        }
        return cube;
    }

    this.make_layers = function(dim){
        layers = [];
        for (var i=0; i<3; i++){
            layers.push([])
            for (var j=0; j<dim; j++){
                layers[i].push([]);
            }
        }

        for (var x=0; x<dim; x++){
            for (var y=0; y<dim; y++){
                for (var z=0; z<dim; z++){
                    var cube = this.cube[x][y][z];
                    layers[0][x].push(cube);
                    layers[1][y].push(cube);
                    layers[2][z].push(cube);
                    cube.add_to_scene();
                }
            }
        }
        return layers;
    }

    this.cube = this.make_cube(dim);
    this.layers = this.make_layers(dim);

}

BigCube.prototype.do_full_rotation = function() {

    var current_rotation = this.queue.dequeue();

    this.rotate_animate(current_rotation.xyz, current_rotation.layer, current_rotation.ccw, current_rotation.angle, Math.PI/2);

    this.update_cube_state(current_rotation.xyz, current_rotation.layer, current_rotation.ccw);

    if (this.queue.isEmpty()){
        this.is_scrambling = false;
        this.check_if_solved();
    }
}

BigCube.prototype.try_rotate = function() {
    // no rotation to do
    if (this.queue.isEmpty()){
        return;
    }

    var current_rotation = this.queue.peek();

    // physically rotate cube
    this.rotate_animate(current_rotation.xyz, current_rotation.layer, current_rotation.ccw, current_rotation.angle, this.rate);

}

BigCube.prototype.try_update = function() {
    if (this.queue.isEmpty()){
        return;
    }

    var current_rotation = this.queue.peek();

    // cleanup if last iteration of the current rotation
    this.process_rotation(current_rotation);
}


BigCube.prototype.process_rotation = function(current_rotation) {
    var rate = this.rate;

    var is_last_rotation = this.cleanup_if_last_rotation(current_rotation);

    if (!is_last_rotation){

        if (current_rotation.angle > 0){
            current_rotation.angle -= rate;
        }
        else {
            current_rotation.angle += rate;
        }
    }

}


BigCube.prototype.cleanup_if_last_rotation = function(current_rotation) {
    if (Math.abs(current_rotation.angle) < this.rate){
        this.update_cube_state(current_rotation.xyz, current_rotation.layer, current_rotation.ccw);

        //cleanup
        this.queue.dequeue();

        //check if solved and handle appropriately
        this.check_if_solved();

        return true;
    }

    return false;

}

// Physically rotate the cube
BigCube.prototype.rotate_animate = function(xyz, index, ccw, angle, input_rate) {

    var layer = this.layers[xyz][index];
    for (var i=0; i<layer.length; i++){
        var cube = layer[i];
        var p = cube.cube.position;

        cube.translate(p.x, p.y, p.z );

        var rate = input_rate;

        if (Math.abs(angle) < rate){
            rate = Math.abs(angle);
        }
        var angle_to_rotate = rate * (ccw ? 1 : -1)

        cube.rotate(xyz, angle_to_rotate);
        cube.translate(-p.x, -p.y, -p.z);
    }

}

// Update layers after completing a rotation
BigCube.prototype.update_cube_state = function(xyz, index, ccw) {

    // set lower & upper lims on indices for the rotating plane
    var lower_lims = Array.apply(null, Array(3)).map(Number.prototype.valueOf, 0);
    var upper_lims = Array.apply(null, Array(3)).map(Number.prototype.valueOf, this.dim);
    lower_lims[xyz] = index;
    upper_lims[xyz] = index + 1;

    // update the cube
    this.update_cube(xyz, index, ccw, lower_lims, upper_lims);

    // update the layers
    this.update_layers(xyz, index, ccw);
}

BigCube.prototype.update_cube = function(xyz, index, ccw, lower_lims, upper_lims) {
    var cube_copy = this.copy_cube();

    for (var x=lower_lims[0]; x<upper_lims[0]; x++){
        for (var y=lower_lims[1]; y<upper_lims[1]; y++){
            for (var z=lower_lims[2]; z<upper_lims[2]; z++){
                if (ccw){
                    switch (xyz) {
                        case 0:
                            this.cube[x][y][z] = cube_copy[x][z][(this.dim-1)-y];
                            break;
                        case 1:
                            this.cube[x][y][z] = cube_copy[(this.dim-1)-z][y][x];
                            break;
                        case 2:
                            this.cube[x][y][z] = cube_copy[y][(this.dim-1)-x][z];
                            break;
                        default:
                            throw "AHHH";
                            break;
                    }
                }
                else{
                    switch (xyz) {
                        case 0:
                            this.cube[x][y][z] = cube_copy[x][(this.dim-1)-z][y];
                            break;
                        case 1:
                            this.cube[x][y][z] = cube_copy[z][y][(this.dim-1)-x];
                            break;
                        case 2:
                            this.cube[x][y][z] = cube_copy[(this.dim-1)-y][x][z];
                            break;
                        default:
                            throw "AHHH";
                            break;
                    }
                }
            }
        }
    }
}

// Queue a rotation about xyz in ccw direction
BigCube.prototype.enqueue_rotation = function(xyz, layer, ccw, is_scramble_rotation) {
    if (this.is_scrambling && !is_scramble_rotation){
        return;
    }
    this.queue.enqueue(new QueuedRotation(xyz, layer, ccw));
}

BigCube.prototype.update_layers = function(xyz, index, ccw, lower_lims, upper_lims) {
    this.layers = this.make_layers(this.dim);
}

BigCube.prototype.get_is_solved = function(){
    var is_solved = true;
    var cube = bigCube.cube;
    var p;
    for (var x=0; x<this.dim; x++){
        for (var y=0; y<this.dim; y++){
            for (var z=0; z<this.dim; z++){
                var mini_cube = cube[x][y][z]
                var orig_x = mini_cube.orig_x;
                var orig_y = mini_cube.orig_y;
                var orig_z = mini_cube.orig_z;
                if (!(orig_x==x && orig_y==y && orig_z==z)){
                    is_solved = false;
                    break;
                }
            }
        }
    }
    return is_solved;
}

BigCube.prototype.check_if_solved = function() {

    var is_solved = false;
    if (this.check_if_solved){
        this.get_is_solved();
    };

    if (is_solved){
        setTimeout(function() {alert("You solved the cube! Good job!"); }, 50);
    }

}

BigCube.prototype.copy_cube = function(){
    var dim = this.dim;
    cube = []

    for (var x=0; x<dim; x++){
        cube.push([])
        for (var y=0; y<dim; y++){
            cube[x].push([]);
            for (var z=0; z<dim; z++){
                cube[x][y].push(this.cube[x][y][z]);
            }
        }
    }
    return cube;
}

// Returns new, scrambled cube
function scramble(myCube) {

    // get new reset cube
    var newBigCube = reset(myCube);

    newBigCube.is_scrambling = true;
    newBigCube.is_checking_solved = true;

    // scramble cube
    for (var s=0; s<newBigCube.num_scramble_turns; s++) {
        var xyz = Math.floor(3 * Math.random());
        var layer = Math.floor(newBigCube.dim * Math.random());
        var ccw = true; //(Math.random() > 0.5) ? true : false;
        newBigCube.enqueue_rotation(xyz, layer, ccw, true);
    }

    return newBigCube;
}


// Returns new, reset cube
function reset(myCube, dim) {

    // clear previous cube from scene
    clear_scene();



    // create new cube in the scene
    var dim = dim != null ? dim : myCube.dim;
    var newBigCube = new BigCube(dim);

    camera.position.z =  3*dim;
    camera.position.x =  3*dim;
    camera.position.y =  2*dim;

    return newBigCube;
}


function clear_scene() {
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
}


function rotate(xyz, layer, ccw) {
    var is_scramble_rotation = false;
    bigCube.enqueue_rotation(xyz, layer, ccw, is_scramble_rotation);
}

function rotateX(layer){
    rotate(0, layer, true);
}

function rotateY(layer){
    rotate(1, layer, true);
}

function rotateZ(layer){
    rotate(2, layer, true);
}

var bigCube = new BigCube(3);

function call_scramble() {
    bigCube = scramble(bigCube);
}

function call_reset(dim) {
    bigCube = reset(bigCube, dim);
}


camera.position.z = 3*bigCube.dim;
camera.position.x = 3*bigCube.dim;
camera.position.y = 2*bigCube.dim;

render();


//rotate(1,2,false);
//rotateY(2);
//
//$("#btn_scramble").click(function(){
//    call_scramble();
//});
//
//$("#btn_reset").click(function(){
//    call_reset();
//});

document.onkeypress = function(e){
    e = e || window.event;
    var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
    if (charCode) {
        var char = String.fromCharCode(charCode);
        switch(char) {
            // x
            case "q":
                rotate(0,0,true);
                break;
            case "w":
                rotate(0,1,true);
                break;
            case "e":
                rotate(0,2,true);
                break;
            case "a":
                rotate(0,0,false);
                break;
            case "s":
                rotate(0,1,false);
                break;
            case "d":
                rotate(0,2,false);
                break;

            // y
            case "r":
                rotate(1,0,true);
                break;
            case "t":
                rotate(1,1,true);
                break;
            case "y":
                rotate(1,2,true);
                break;
            case "f":
                rotate(1,0,false);
                break;
            case "g":
                rotate(1,1,false);
                break;
            case "h":
                rotate(1,2,false);
                break;

            // x
            case "u":
                rotate(2,0,true);
                break;
            case "i":
                rotate(2,1,true);
                break;
            case "o":
                rotate(2,2,true);
                break;
            case "j":
                rotate(2,0,false);
                break;
            case "k":
                rotate(2,1,false);
                break;
            case "l":
                rotate(2,2,false);
                break;


        }
    }
};

