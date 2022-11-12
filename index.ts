import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { mesh } from "topojson-client";
import geojsonCountries from "./natural-earth-countries-1_110m.geojson.json";
import * as earcut from "earcut";

const scene = new THREE.Scene();
scene.background = new THREE.Color();  // white background

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

drawThreeGeo(geojsonCountries, radius + 1, 'sphere', {
  color: 'yellow'
});


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