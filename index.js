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


var render = function () {

    bigCube.try_rotate();

    requestAnimationFrame( render );

    renderer.render(scene, camera);
};


/*
** Class for individual cubes within the Rubik's Cube.
** Contains methods to manipulate cube and add it to scene.
*/
function Cube (x, y, z) {

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
** Class for entire Rubik's Cube.
** Contains methods to rotate cube and make cube copies.
*/
function BigCube (dim) {

    this.dim = dim;

    this.angles = [0, 0, 0];    // remaining angle to rotate
    this.original_angles = [0, 0, 0];   // original angle to rotate
    this.rate = 0.01;

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
                    cube[x][y].push(new Cube(x-1, y-1, z-1));
                }
            }
        }
        return cube;
    }

    this.make_layers = function(dim){
        layers = [];
        for (var i=0; i<dim; i++){
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

BigCube.prototype.try_rotate = function() {
    // no rotation to do
    if (this.xyz_to_rotate == null || this.layer_to_rotate == null
        || !(this.angles[this.xyz_to_rotate]) || this.layer_to_rotate == null){
        return;
    }

    // physically rotate cube
    this.rotate_animate(this.xyz_to_rotate, this.layer_to_rotate, this.rate);


    // cleanup if last iteration of the current rotation
    this.process_rotation();

}

BigCube.prototype.process_rotation = function() {
    var rate = this.rate;

    if (this.angles[this.xyz_to_rotate] > 0){
        this.angles[this.xyz_to_rotate] -= rate;
    }
    else {
        this.angles[this.xyz_to_rotate] += rate;
    }

    this.cleanup_if_last_rotation();
}


BigCube.prototype.cleanup_if_last_rotation = function() {
    if (Math.abs(this.angles[this.xyz_to_rotate]) < this.rate){
        this.update_cube_state(this.xyz_to_rotate, this.layer_to_rotate, this.original_angles[this.xyz_to_rotate]);

        //cleanup
        this.angles[this.xyz_to_rotate] = 0;
        this.original_angles[this.xyz_to_rotate] = 0;
        this.xyz_to_rotate = null;
        this.layer_to_rotate = null;
    }

}

// Physically rotate the cube
BigCube.prototype.rotate_animate = function(xyz, index, rate) {

    var layer = this.layers[xyz][index];
    for (var i=0; i<layer.length; i++){
        var cube = layer[i];
        var p = cube.cube.position;
        cube.translate(p.x, p.y, p.z);
        cube.rotate(xyz, rate);
        cube.translate(-p.x, -p.y, -p.z);
    }

}

// Update layers after completing a rotation
BigCube.prototype.update_cube_state = function(xyz, index, angle) {

    // set lower & upper lims on indices for the rotating plane
    var lower_lims = Array.apply(null, Array(3)).map(Number.prototype.valueOf, 0);
    var upper_lims = Array.apply(null, Array(3)).map(Number.prototype.valueOf, this.dim);
    lower_lims[xyz] = index;
    upper_lims[xyz] = index + 1;

    // update the cube
    this.update_cube(xyz, index, angle, lower_lims, upper_lims);

    // update the layers
    this.update_layers(xyz, index, angle);
}


BigCube.prototype.update_cube = function(xyz, index, angle, lower_lims, upper_lims) {
    var cube_copy = this.copy_cube();

    for (var x=lower_lims[0]; x<upper_lims[0]; x++){
        for (var y=lower_lims[1]; y<upper_lims[1]; y++){
            for (var z=lower_lims[2]; z<upper_lims[2]; z++){
                if (angle > 0){
                    switch (xyz) {
                        case 0:
                            this.cube[x][y][z] = cube_copy[x][z][2-y];
                            break;
                        case 1:
                            this.cube[x][y][z] = cube_copy[2-z][y][x];
                        default:
                            throw "AHHH";
                            break;
                    }
                }
            }
        }
    }
}

BigCube.prototype.queue_rotation = function(xyz, ccw) {

}


BigCube.prototype.update_layers = function(xyz, index, angle, lower_lims, upper_lims) {
//    var dim1 = (xyz + 1) % 3;
//    var dim2 = (xyz + 1) % 3;
//
//    // add and remove from the <dim> layers of dim1
//    for (var i=0; i<this.dim; i++){
//        for (var j=0; j<(this.dim * this.dim); j++){
//
//        }
//    }
//
//    // add to layers

    this.layers = this.make_layers(this.dim);
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

var rad = Math.PI/ 180;
var bigCube = new BigCube(3);


function rotateX() {
    bigCube.xyz_to_rotate = 0;
    bigCube.layer_to_rotate = 2;
    bigCube.original_angles[bigCube.xyz_to_rotate] = 90 * rad;
    bigCube.angles[bigCube.xyz_to_rotate] = 90 * rad;
}

function rotateY() {
    bigCube.xyz_to_rotate = 1;
    bigCube.layer_to_rotate = 2;
    bigCube.original_angles[bigCube.xyz_to_rotate] = 90 * rad;
    bigCube.angles[bigCube.xyz_to_rotate] = 90 * rad;
}
render();






