import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mesh } from "topojson-client";
import topology from "world-atlas/countries-110m.json";

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
    const positions = [];
    for (const vertex of vertices) {
        positions.push(vertex.x, vertex.y, vertex.z);
    }
    geometry.setAttribute( 'position', new THREE.BufferAttribute(new Float32Array(positions), 3 ) );
    return new THREE.LineSegments(geometry, material);
}

const radius = 2;

const geometry = new THREE.SphereGeometry( 1.96, 50, 50 );
const material = new THREE.MeshBasicMaterial( { color: 0xcbe4f9 } );
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

const topoMesh = mesh(topology, topology.objects.countries);
const countries = wireframe(topoMesh, radius, new THREE.LineBasicMaterial({color: 0xff0000}));

scene.add(countries);

camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 2.6;
controls.maxDistance = 5;

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