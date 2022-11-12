/* Draw GeoJSON

Iterates through the latitude and longitude values, converts the values to XYZ coordinates, and draws the geoJSON geometries.

*/

let TRIANGULATION_DENSITY = 5;
let WIREFRAME = false;

function verts2array(coords) {
  let flat = [];
  for (let k = 0; k < coords.length; k++) {
    flat.push(coords[k][0], coords[k][1]);
  }
  return flat;
}

function array2verts(arr) {
  let coords = [];
  for (let k = 0; k < arr.length; k += 2) {
    coords.push([arr[k], arr[k + 1]]);
  }
  return coords;
}

function findBBox(points) {
  let min = {
    x: 1e99,
    y: 1e99
  };
  let max = {
    x: -1e99,
    y: -1e99
  };
  for (var point_num = 0; point_num < points.length; point_num++) {
    if (points[point_num][0] < min.x) {
      min.x = points[point_num][0];
    }
    if (points[point_num][0] > max.x) {
      max.x = points[point_num][0];
    }
    if (points[point_num][1] < min.y) {
      min.y = points[point_num][1];
    }
    if (points[point_num][1] > max.y) {
      max.y = points[point_num][1];
    }
  }
  return {
    min: min,
    max: max
  };
}

function isInside(point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point[0],
    y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    var xi = vs[i][0],
      yi = vs[i][1];
    var xj = vs[j][0],
      yj = vs[j][1];

    var intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }

  return inside;
}

function genInnerVerts(points) {
  let res = [];
  for (let k = 0; k < points.length; k++) {
    res.push(points[k]);
  }

  let bbox = findBBox(points);

  let step = TRIANGULATION_DENSITY;
  let k = 0;
  for (let x = bbox.min.x + step / 2; x < bbox.max.x; x += step) {
    for (let y = bbox.min.y + step / 2; y < bbox.max.y; y += step) {
      let newp = [x, y];
      if (isInside(newp, points)) {
        res.push(newp);
      }
      k++;
    }
  }

  return res;
}

function removeOuterTriangles(delaunator, points) {
  let newTriangles = [];
  for (let k = 0; k < delaunator.triangles.length; k += 3) {
    let t0 = delaunator.triangles[k];
    let t1 = delaunator.triangles[k + 1];
    let t2 = delaunator.triangles[k + 2];

    let x0 = delaunator.coords[2 * t0];
    let y0 = delaunator.coords[2 * t0 + 1];

    let x1 = delaunator.coords[2 * t1];
    let y1 = delaunator.coords[2 * t1 + 1];

    let x2 = delaunator.coords[2 * t2];
    let y2 = delaunator.coords[2 * t2 + 1];

    let midx = (x0 + x1 + x2) / 3;
    let midy = (y0 + y1 + y2) / 3;

    let midp = [midx, midy];

    if (isInside(midp, points)) {
      newTriangles.push(t0, t1, t2);
    }
  }
  delaunator.triangles = newTriangles;
}

var x_values = [];
var y_values = [];
var z_values = [];

var clickableObjects = [];
var someColors = [0x909090, 0x808080, 0xa0a0a0, 0x929292, 0x858585, 0xa9a9a9];

function drawThreeGeo(json, radius, options) {

  var json_geom = createGeometryArray(json);

  for (var geom_num = 0; geom_num < json_geom.length; geom_num++) {
    if (json_geom[geom_num].type == 'Point') {
        convertToSphereCoords(json_geom[geom_num].coordinates, radius);
      drawParticle(y_values[0], z_values[0], x_values[0], options);

    } else if (json_geom[geom_num].type == 'MultiPoint') {
      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertToSphereCoords(json_geom[geom_num].coordinates[point_num], radius);
        drawParticle(y_values[0], z_values[0], x_values[0], options);
      }

    } else if (json_geom[geom_num].type == 'LineString') {

      for (let point_num = 0; point_num < json_geom[geom_num].coordinates.length; point_num++) {
        convertToSphereCoords(json_geom[geom_num].coordinates[point_num], radius);
      }
      drawLine(y_values, z_values, x_values, options);

    } else if (json_geom[geom_num].type == 'Polygon') {
      let group = createGroup(geom_num);
      let randomColor = someColors[Math.floor(someColors.length * Math.random())];

      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {

        let coords = json_geom[geom_num].coordinates[segment_num];
        let refined = genInnerVerts(coords);
        let flat = verts2array(refined);
        let d = new Delaunator(flat);
        removeOuterTriangles(d, coords);

        let delaunayVerts = array2verts(d.coords);
        for (let point_num = 0; point_num < delaunayVerts.length; point_num++) {
            convertToSphereCoords(delaunayVerts[point_num], radius);
        }
        drawMesh(group, y_values, z_values, x_values, d.triangles, randomColor);
      }

    } else if (json_geom[geom_num].type == 'MultiLineString') {
      for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates.length; segment_num++) {
        let coords = json_geom[geom_num].coordinates[segment_num];
        for (let point_num = 0; point_num < coords.length; point_num++) {
            convertToSphereCoords(json_geom[geom_num].coordinates[segment_num][point_num], radius);
        }
        drawLine(y_values, z_values, x_values);
      }

    } else if (json_geom[geom_num].type == 'MultiPolygon') {
      let group = createGroup(geom_num);
      let randomColor = someColors[Math.floor(someColors.length * Math.random())];

      for (let polygon_num = 0; polygon_num < json_geom[geom_num].coordinates.length; polygon_num++) {
        for (let segment_num = 0; segment_num < json_geom[geom_num].coordinates[polygon_num].length; segment_num++) {

          let coords = json_geom[geom_num].coordinates[polygon_num][segment_num];
          let refined = genInnerVerts(coords);
          let flat = verts2array(refined);
          let d = new Delaunator(flat);
          removeOuterTriangles(d, coords);

          let delaunayVerts = array2verts(d.coords);
          for (let point_num = 0; point_num < delaunayVerts.length; point_num++) {
            convertToSphereCoords(delaunayVerts[point_num], radius);
          }
          drawMesh(group, y_values, z_values, x_values, d.triangles, randomColor)
        }
      }
    } else {
      throw new Error('The geoJSON is not valid.');
    }

  }
}

function createGeometryArray(json) {
  var geometry_array = [];

  if (json.type == 'Feature') {
    geometry_array.push(json.geometry);
  } else if (json.type == 'FeatureCollection') {
    for (var feature_num = 0; feature_num < json.features.length; feature_num++) {
      geometry_array.push(json.features[feature_num].geometry);
    }
  } else if (json.type == 'GeometryCollection') {
    for (var geom_num = 0; geom_num < json.geometries.length; geom_num++) {
      geometry_array.push(json.geometries[geom_num]);
    }
  } else {
    throw new Error('The geoJSON is not valid.');
  }
  //alert(geometry_array.length);
  return geometry_array;
}

function convertToSphereCoords(coordinates_array, sphere_radius) {
  var lon = coordinates_array[0];
  var lat = coordinates_array[1];

  x_values.push(Math.cos(lat * Math.PI / 180) * Math.cos(lon * Math.PI / 180) * sphere_radius);
  y_values.push(Math.cos(lat * Math.PI / 180) * Math.sin(lon * Math.PI / 180) * sphere_radius);
  z_values.push(Math.sin(lat * Math.PI / 180) * sphere_radius);
}

function drawParticle(x, y, z, options) {
  var particle_geom = new THREE.Geometry();
  particle_geom.vertices.push(new THREE.Vector3(x, y, z));

  var particle_material = new THREE.ParticleSystemMaterial(options);

  var particle = new THREE.ParticleSystem(particle_geom, particle_material);
  scene.add(particle);

  clearArrays();
}

function drawLine(x_values, y_values, z_values, options) {
  var line_geom = new THREE.Geometry();
  createVertexForEachPoint(line_geom, x_values, y_values, z_values);

  var line_material = new THREE.LineBasicMaterial(options);
  var line = new THREE.Line(line_geom, line_material);
  scene.add(line);

  clearArrays();
}

function createGroup(idx) {
  var group = new THREE.Group();
  group.userData.userText = "_" + idx;
  scene.add(group);
  return group;
}

function drawMesh(group, x_values, y_values, z_values, triangles, color) {
  var geometry = new THREE.Geometry();

  for (let k = 0; k < x_values.length; k++) {
    geometry.vertices.push(
      new THREE.Vector3(x_values[k], y_values[k], z_values[k])
    );
  }

  for (let k = 0; k < triangles.length; k += 3) {
    geometry.faces.push(new THREE.Face3(triangles[k], triangles[k + 1], triangles[k + 2]));
  }

  geometry.computeVertexNormals()

  var mesh = new THREE.Mesh(geometry, new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    color: color,
    wireframe: WIREFRAME
  }));
  clickableObjects.push(mesh);
  group.add(mesh);

  clearArrays();
}

function createVertexForEachPoint(object_geometry, values_axis1, values_axis2, values_axis3) {
  for (var i = 0; i < values_axis1.length; i++) {
    object_geometry.vertices.push(new THREE.Vector3(values_axis1[i],
      values_axis2[i], values_axis3[i]));
  }
}

function clearArrays() {
  x_values.length = 0;
  y_values.length = 0;
  z_values.length = 0;
}

var scene = new THREE.Scene();
var raycaster = new THREE.Raycaster();
var camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.5, 1000);
var radius = 200;

camera.position.x = 140.7744005681177;
camera.position.y = 160.30950538100814;
camera.position.z = 131.8637122564268;

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

var light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);

var light = new THREE.AmbientLight(0x505050); // soft white light
scene.add(light);

var geometry = new THREE.SphereGeometry(radius, 32, 32);

var material = new THREE.MeshPhongMaterial({
  color: 0x1e90ff
});
var sphere = new THREE.Mesh(geometry, material);
scene.add(sphere);



var controls = new THREE.TrackballControls(camera, renderer.domElement);
controls.rotateSpeed *= 0.5;
controls.zoomSpeed *= 0.5;
controls.panSpeed *= 0.5;
controls.minDistance = 10;
controls.maxDistance = 5000;

function render() {
  controls.update();
  requestAnimationFrame(render);
  renderer.setClearColor(0x1e90ff, 1);
  renderer.render(scene, camera);
}

render()

function convert_lat_lng(lat, lng, radius) {
  var phi = (90 - lat) * Math.PI / 180,
    theta = (180 - lng) * Math.PI / 180,
    position = new THREE.Vector3();

  position.x = radius * Math.sin(phi) * Math.cos(theta);
  position.y = radius * Math.cos(phi);
  position.z = radius * Math.sin(phi) * Math.sin(theta);

  return position;
}

// this will be 2D coordinates of the current mouse position, [0,0] is middle of the screen.
var mouse = new THREE.Vector2();

var hoveredObj; // this objects is hovered at the moment

// Following two functions will convert mouse coordinates
// from screen to three.js system (where [0,0] is in the middle of the screen)
function updateMouseCoords(event, coordsObj) {
  coordsObj.x = ((event.clientX - renderer.domElement.offsetLeft + 0.5) / window.innerWidth) * 2 - 1;
  coordsObj.y = -((event.clientY - renderer.domElement.offsetTop + 0.5) / window.innerHeight) * 2 + 1;
}

function onMouseMove(event) {
  updateMouseCoords(event, mouse);

  latestMouseProjection = undefined;
  clickedObj = undefined;

  raycaster.setFromCamera(mouse, camera); {
    var intersects = raycaster.intersectObjects(clickableObjects);

    let setGroupColor = function(group, colorHex) {
      for (let i = 0; i < group.children.length; i++) {
        if (!group.children[i].userData.color) {
          group.children[i].userData.color = hoveredObj.parent.children[i].material.color.clone();
          group.children[i].material.color.set(colorHex);
          group.children[i].material.needsUpdate = true;
        }
      }
    }

    let resetGroupColor = function(group) {
      // set all shapes of the group to initial color
      for (let i = 0; i < group.children.length; i++) {
        if (group.children[i].userData.color) {
          group.children[i].material.color = group.children[i].userData.color;
          delete group.children[i].userData.color;
          group.children[i].material.needsUpdate = true;
        }
      }
    }

    if (intersects.length > 0) {
      latestMouseProjection = intersects[0].point;
      // reset colors for previously hovered group
      if (hoveredObj) {
        resetGroupColor(hoveredObj.parent);
      }

      hoveredObj = intersects[0].object;
      if (!hoveredObj.parent) return;
      // set colors for hovered group
      setGroupColor(hoveredObj.parent, 0xff0000);
    } else {
      if (!hoveredObj || !hoveredObj.parent) return;

      // nothing is hovered => just reset colors on the last group
      resetGroupColor(hoveredObj.parent);
      hoveredObj = undefined;
      console.log("<deselected>");
    }
  }
}

window.addEventListener('mousemove', onMouseMove, false);
