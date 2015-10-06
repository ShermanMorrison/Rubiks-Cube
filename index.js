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
    if (this.xyz_to_rotate == null || this.layer_to_rotate == null){
        return;
    }

    // physically rotate cube
    this.rotate_animate(this.xyz_to_rotate, this.layer_to_rotate, this.rate);

    // last iteration of the current rotation
    if (this.angles[this.xyz_to_rotate] <= this.rate){
        //this.update_layers(this.xyz_to_rotate, this.layer_to_rotate this.original_angles[this.xyz_to_rotate]);

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
BigCube.prototype.update_layers = function(xyz, index, angle) {

}



BigCube.prototype.copy_cube = function(dim){
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

var bigCube = new BigCube(3);
bigCube.xyz_to_rotate = 2;
bigCube.layer_to_rotate = 2;
bigCube.angles[bigCube.xyz_to_rotate] = 90;
render();






