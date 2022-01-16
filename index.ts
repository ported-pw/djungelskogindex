import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry';
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

function buildMesh(multilinestring, radius, material) {
    const points = [];
    for (const P of multilinestring.coordinates) {
      for (let p0, p1 = vertex(P[0], radius), i = 1; i < P.length; ++i) {
        points.push(p0 = p1, p1 = vertex(P[i], radius));
      }
    }
    const geometry = new ConvexGeometry(points);
    return new THREE.Mesh(geometry, material);
}

const radius = 2;

const geometry = new THREE.SphereGeometry( 1.96, 50, 50 );
const material = new THREE.MeshBasicMaterial( { color: 0xd7edfa } );
const sphere = new THREE.Mesh( geometry, material );
scene.add( sphere );

for (const country of topology.objects.countries.geometries) {
  const topoMesh = mesh(topology, country);
  const countryMesh = buildMesh(topoMesh, radius, new THREE.MeshBasicMaterial({color: 0xd9f4e0}));
  
  scene.add(countryMesh);
}


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