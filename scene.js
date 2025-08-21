import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

let scene, camera, renderer, controls, transformControls;
let onTransformEndCallback;
const models = {}; // Store loaded models: { modelId: THREE.Object3D }

export function initScene(canvas, onTransformEnd) {
    onTransformEndCallback = onTransformEnd;

    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x222222);

    // Camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(2, 5, 5);
    scene.add(directionalLight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Transform Controls
    transformControls = new TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('dragging-changed', (event) => {
        controls.enabled = !event.value;
        if (!event.value) { // Dragging ended
            const model = transformControls.object;
            if (model && model.userData.id && onTransformEndCallback) {
                onTransformEndCallback(model.userData.id);
            }
        }
    });
    scene.add(transformControls);

    // Click listener to attach transform controls
    renderer.domElement.addEventListener('click', (event) => {
        if (transformControls.dragging) return;
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(Object.values(models), true);
        
        if (intersects.length > 0) {
            let object = intersects[0].object;
            while(object.parent && !object.userData.isModelRoot) {
                object = object.parent;
            }
            if (object.userData.isModelRoot) {
                transformControls.attach(object);
            }
        } else {
            transformControls.detach();
        }
    }, false);


    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Start animation loop
    animate();

    return { scene, models };
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

const loader = new GLTFLoader();

export function addOrUpdateModel(modelData) {
    const { id, url, position, rotation, scale } = modelData;

    if (models[id]) {
        // Model exists, update its transform
        const model = models[id];
        model.position.set(position.x, position.y, position.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        model.scale.set(scale.x, scale.y, scale.z);
    } else {
        // Model doesn't exist, load it
        loader.load(url, (gltf) => {
            const model = gltf.scene;
            model.userData.id = id;
            model.userData.isModelRoot = true; // Mark this as the object to be transformed
            
            // Apply initial transform
            model.position.set(position.x, position.y, position.z);
            model.rotation.set(rotation.x, rotation.y, rotation.z);
            model.scale.set(scale.x, scale.y, scale.z);

            models[id] = model;
            scene.add(model);
        }, undefined, (error) => {
            console.error(`An error happened loading model ${id}:`, error);
        });
    }
}

export function removeModel(modelId) {
    if (models[modelId]) {
        if (transformControls.object === models[modelId]) {
            transformControls.detach();
        }
        scene.remove(models[modelId]);
        delete models[modelId];
    }
}

export function updateModelTransformFromScene(modelId) {
    const model = models[modelId];
    if (model) {
        // Important: get the full model data to avoid overwriting other fields
        const room = new WebsimSocket(); // get access to roomState
        const currentModelData = room.roomState.models[modelId];

        return {
            ...currentModelData, // preserve url, owner, etc.
            position: { x: model.position.x, y: model.position.y, z: model.position.z },
            rotation: { x: model.rotation.x, y: model.rotation.y, z: model.rotation.z },
            scale: { x: model.scale.x, y: model.scale.y, z: model.scale.z },
        };
    }
    return null;
}

