import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mesh } from "topojson-client";
import topology from "world-atlas/land-10m.json";

const scene = new THREE.Scene();
scene.background = new THREE.Color();  // white background

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

function vertex([longitude, latitude], radius) {
    const lambda = longitude * Math.PI / 180;
    const phi = latitude * Math.PI / 180;
    return new THREE.Vector3(
      radius * Math.cos(phi) * Math.cos(lambda),
      radius * Math.sin(phi),
      -radius * Math.cos(phi) * Math.sin(lambda)
    );
}

function wireframe(multilinestring, radius, material) {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (const P of multilinestring.coordinates) {
      for (let p0, p1 = vertex(P[0], radius), i = 1; i < P.length; ++i) {
        vertices.push(p0 = p1, p1 = vertex(P[i], radius));
      }
    }
    console.log(vertices);
    const positions = [];
    for (const vertex of vertices) {
        positions.push(vertex.x, vertex.y, vertex.z);
    }
    geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(positions), 3 ) );
    return new THREE.LineSegments(geometry, material);
}

const radius = 2;
const topoMesh = mesh(topology, topology.objects.land);
const land = wireframe(topoMesh, radius, new THREE.LineBasicMaterial({color: 0xff0000}));

scene.add(land);

camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;

window.addEventListener( 'resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
} );

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
}
animate();