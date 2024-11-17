// Import necessary Three.js modules
import * as THREE from 'three';
import { GLTFLoader } from './libs/addons/loaders/GLTFLoader.js';
import { OrbitControls } from './libs/addons/controls/OrbitControls.js';

// Get the container element for the 3D model
const modelContainer = document.getElementById('model-container');

// Create a WebGL renderer with transparency and anti-aliasing
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    alpha: true
});
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Function to handle renderer resize
function updateRendererSize() {
    renderer.setSize(window.innerWidth, window.innerHeight);
}
updateRendererSize();

// Configure renderer settings
renderer.setClearColor(0x000000, 0); // Transparent background
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Add renderer to the DOM
modelContainer.appendChild(renderer.domElement);

// Create a new scene
const scene = new THREE.Scene();
scene.background = null;

// Set up lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight1.position.set(5, 5, 5);
directionalLight1.castShadow = true;
scene.add(directionalLight1);

const directionalLight2 = new THREE.DirectionalLight(0xffd700, 1);
directionalLight2.position.set(-5, 3, -5);
scene.add(directionalLight2);

const frontLight = new THREE.DirectionalLight(0xffffff, 1);
frontLight.position.set(0, 0, 5);
scene.add(frontLight);

// Add colored point lights for dramatic effect
const pointLight1 = new THREE.PointLight(0xff9000, 1, 10);
pointLight1.position.set(2, 2, 2);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0x0066ff, 1, 10);
pointLight2.position.set(-2, 2, -2);
scene.add(pointLight2);

// Set up camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(4, 5, 11);

// Set up orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = 0.5;
controls.maxPolarAngle = 1.5;
controls.autoRotate = false;
controls.target = new THREE.Vector3(0, 1, 0);
controls.enabled = false;
controls.update();

// Variables for model interaction
let modelMesh;
const mouse = new THREE.Vector2();
const targetRotation = new THREE.Vector2();
const currentRotation = new THREE.Vector2();
const smoothness = 0.1;

// Mouse move handler for model interaction
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
    
    targetRotation.x = -mouse.y * 0.5;
    targetRotation.y = mouse.x * 0.5;
}

document.addEventListener('mousemove', onMouseMove);

// Load the 3D model
const loader = new GLTFLoader().setPath('public/model/');
loader.load('scene.gltf', 
    // Success callback
    (gltf) => {
        console.log('loading model');
        modelMesh = gltf.scene;

        // Configure model materials and shadows
        modelMesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                if (child.material) {
                    // Configure material properties
                    child.material.transparent = false;
                    child.material.opacity = 1;
                    child.material.depthWrite = true;
                    child.material.depthTest = true;
                    child.material.metalness = 0.7;
                    child.material.roughness = 0.3;
                    child.material.color = new THREE.Color(0xcccccc);
                    child.material.envMapIntensity = 1.5;
                    child.material.needsUpdate = true;
                }
            }
        });

        // Scale and position the model
        modelMesh.scale.set(30, 30, 30);
        modelMesh.position.set(5, 0, 0); // Position model to the right

        scene.add(modelMesh);

        // Set up environment mapping
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();
        
        const environmentTexture = pmremGenerator.fromScene(new THREE.Scene()).texture;
        scene.environment = environmentTexture;

        // Adjust camera position
        camera.position.set(8, 4, 8);
        controls.update();

        // Hide loading indicator
        document.getElementById('progress-container').style.display = 'none';
    },
    // Progress callback
    (xhr) => {
        console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
    },
    // Error callback
    (error) => {
        console.error(error);
    }
);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update model rotation based on mouse position
    if (modelMesh) {
        currentRotation.x += (targetRotation.x - currentRotation.x) * smoothness;
        currentRotation.y += (targetRotation.y - currentRotation.y) * smoothness;
        
        modelMesh.rotation.x = currentRotation.x;
        modelMesh.rotation.y = currentRotation.y;
    }
    
    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', () => {
    updateRendererSize();
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Start animation loop
animate();