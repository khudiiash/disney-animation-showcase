import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
const clock = new THREE.Clock();
const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
renderer.shadowMap.enabled = true;
document.body.appendChild( renderer.domElement );

const textureLoader = new THREE.TextureLoader();
const normalMap = textureLoader.load('normal.jpeg');
normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;

// Background
const bgGeometry = new THREE.PlaneGeometry(2, 2);
const bgMaterial = new THREE.ShaderMaterial({
  uniforms: {
    normalMap: { value: normalMap },
    time: { value: 0 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D normalMap;
    varying vec2 vUv;
    
    void main() {
      // Base gradient colors
      vec3 colorTop = vec3(0.0, 0.85, 0.5);
      vec3 colorBottom = vec3(0.15, 0.45, 0.85);
      vec3 baseColor = mix(colorTop, colorBottom, vUv.y);
      
      vec2 tiledUv = vUv * 3.0;
      vec3 normalSample = texture2D(normalMap, tiledUv).rgb;
      vec3 normal = normalSample * 2.0 - 1.0;
      float perturbation = (normal.r + normal.g) * 0.15;
      vec3 finalColor = baseColor + perturbation;
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
  transparent: true,
  depthTest: false,
  depthWrite: false
});

const bgMesh = new THREE.Mesh(bgGeometry, bgMaterial);
const bgScene = new THREE.Scene();
bgScene.add(bgMesh);
const bgCamera = new THREE.Camera();



// Shadow plane
const shadowMaterial = new THREE.ShadowMaterial({ opacity: 0.25 });
const floor = new THREE.Mesh( new THREE.PlaneGeometry( 20, 20 ), shadowMaterial );
floor.position.z = -0.5;
floor.receiveShadow = true;
scene.add( floor );

// Head 
const sphereGeom = new THREE.SphereGeometry( 0.8, 64, 64);
const sphereMat = new THREE.MeshStandardMaterial( { color: 0x111111, roughness: 0.3, metalness: 0.1 } );
const head = new THREE.Mesh( sphereGeom, sphereMat );
head.castShadow = true;
head.position.set(-5, 5, 1);
// Left ear
const leftEar = new THREE.Mesh( sphereGeom, sphereMat );
leftEar.castShadow = true;
leftEar.scale.set( 0.6, 0.6, 0.6 );
leftEar.position.set( -5, 6, 1);
// Right ear
const rightEar = new THREE.Mesh( sphereGeom, sphereMat );
rightEar.castShadow = true;
rightEar.scale.set( 0.6, 0.6, 0.6 );
rightEar.position.set( 5, 6, 1);

scene.add( head );
scene.add( leftEar );
scene.add( rightEar );


// Lights
const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
dirLight.position.set( -5, 5, 10 );
dirLight.lookAt(0, 0, 0);
scene.add( dirLight );
dirLight.castShadow = true;

const ambientLight = new THREE.AmbientLight( 0xffffff, 1.0 );
scene.add( ambientLight );

const pointLight1 = new THREE.DirectionalLight( 0xffffff, 1 );
pointLight1.position.set(2, 5, 5);
scene.add( pointLight1 );

const pointLight2 = new THREE.PointLight( 0xffffff, 50.0 );
pointLight2.position.set( 0, 5, 5);
scene.add( pointLight2 );

// Bottom light
const pointLight3 = new THREE.PointLight( 0xffffff, 30.0 );
pointLight3.position.set( -1, -10, -5 );
scene.add( pointLight3 );


let leftEarContainer = new THREE.Group();
let rightEarContainer = new THREE.Group();


// Head animation
gsap.timeline()
    .to(head.position, { duration: 1, ease: 'power2.in', x: -2, y: -3, })
    .to(head.position, { duration: 1, ease: 'back.out(3)', x: 0, y: 1.5 })
    .from(head.scale, { duration: 2, ease: 'power2.out', x: 0.2, y: 0.2, z: 0.2, }, '-=1')

// Left ear animation
gsap.timeline({ delay: 0.5 })
    .to(leftEar.position, { duration: 1, ease: 'power2.in', x: -2.3, y: -3 })
    .to(leftEar.position, { duration: 1, ease: 'back.out(3)', x: -0.9, y: 2.2 })
    .from(leftEar.scale, { duration: 2, ease: 'power2.out', x: 0.2, y: 0.2, z: 0.2, }, '-=2')

// Right ear animation
gsap.timeline({ delay: 0.75 })
    .to(rightEar.position, { duration: 1, ease: 'power2.in', x: 2.3, y: -3 })
    .to(rightEar.position, { duration: 1, ease: 'back.out(3)', x: 0.9, y: 2.2 })
    .from(rightEar.scale, { duration: 2, ease: 'power2.out', x: 0.2, y: 0.2, z: 0.2, }, '-=2')
    .call(() => {
        // stick ears to head
        leftEarContainer.add(leftEar);
        rightEarContainer.add(rightEar);
        head.add(leftEarContainer);
        head.add(rightEarContainer);
        leftEar.position.set(-0.9, 0.7, 0);
        rightEar.position.set(0.9, 0.7, 0);
    })

// Squares
function random(min, max) {
    return Math.random() * (max - min) + min;
}
const squares = [];
const columns = 24;
const rows = 7;
const size = 0.35;
const squareGeom = new THREE.BoxGeometry(size, size, size);
const squareMat = new THREE.MeshStandardMaterial( { color: 0x5D218C, roughness: 0.5, metalness: 0 } );
const totalWidth = columns * size;
const totalHeight = rows * size; 
const centerX = -totalWidth / 2;
const centerY = -totalHeight / 2 - 1.6;
for (let i = 0; i < columns; i++) {
    for (let j = 0; j < rows; j++) {
        const square = new THREE.Mesh(squareGeom, squareMat);
        const targetX = size + centerX + i * size;
        const targetY = centerY + j * size;
        const originX = targetX * random(3, 5);
        const originY = targetY + random(10, 15);
        square.position.set(originX, originY, 0);
        const delay = 1 + (targetY + 5) * 0.5 + random(0, 0.5);
        square.castShadow = true;
        square.receiveShadow = true;
        gsap.to(square.position, { duration: random(1, 1.5), delay, ease: 'power4.out', x: targetX, y: targetY, yoyo: true })
        gsap.from(square.rotation, { duration: random(2, 3), delay, ease: 'power4.out', z: random(-Math.PI * 4, Math.PI * 4), x: random(-Math.PI * 4, Math.PI * 4), y: random(-Math.PI * 4, Math.PI * 4), yoyo: true })
        scene.add(square);
        squares.push(square);
    }
}

// Yellow rectangle
const yellowRect = new THREE.Mesh(new THREE.BoxGeometry(5.5, 2.5, 0.2), new THREE.MeshStandardMaterial( { color: 0xE5B628, roughness: 0.5, metalness: 0 } ));
yellowRect.position.set(-8, 8, 0.5);
yellowRect.castShadow = true;
yellowRect.receiveShadow = true;
scene.add(yellowRect);

gsap.timeline({ delay: 3 })
    .fromTo(yellowRect.rotation, { z: 0 }, { z: -0.5, duration: 1 })
    .to(yellowRect.position, { duration: 1, x: -1, y: -1.5, ease: 'sine.in' }, '<')
    .to(yellowRect.position, { duration: 0.5, x: 0, y: -1.5 })
    .fromTo(yellowRect.rotation, { z: -0.5 }, { z: 0.5, duration: 0.5, ease: 'sine.in' }, '<')
    .to(yellowRect.rotation, { z: 0.1, duration: 0.5 })
    .to(yellowRect.position, { duration: 1, x: 0, y: -0.5, ease: 'sine.out' }, '<')


// Green rectangle
const greenRect = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.2), new THREE.MeshStandardMaterial( { color: 0x207F63, roughness: 0.5, metalness: 0 } ));
greenRect.position.set(5, 8, 1.0);
greenRect.rotation.z = 0.2;
greenRect.castShadow = true;
greenRect.receiveShadow = true;
scene.add(greenRect);

gsap.timeline({ delay: 3 })
    .to(greenRect.position, { duration: 1, x: 0, y: -2, z: 1.0, ease: 'sine.in' }, '<')
    .to(greenRect.rotation, { x: -Math.PI * 2, z: -0.1, duration: 1, ease: 'sine.out' })
    .to(greenRect.position, { duration: 1, x: 0.7, y: 0.9, z: 1.0, ease: 'sine.out' }, '<')



// Disney logo
const loader = new GLTFLoader();
loader.load('disney_logo.glb', (gltf) => {   
    const disneyLogo = gltf.scene;
    disneyLogo.position.set(0, -1, 0.5);
    disneyLogo.rotation.x = Math.PI * 0.5;
    disneyLogo.scale.set(1.6, 1.6, 1.6);
    disneyLogo.rotation.y = 0.2;
    disneyLogo.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    const delay = 4;
    gsap.from(disneyLogo.position, { duration: 2, ease: 'power2.inOut', x: 0, y: -2, z: 10, delay })
    gsap.from(disneyLogo.rotation, { duration: 2, y: 0, ease: 'power2.inOut', delay })
    scene.add(disneyLogo);
});

// Ears animation
gsap.timeline({ delay: 4.4 })
    .to(leftEarContainer.scale, { duration: 1, x: 1.5, y: 1.5, z: 1.5 })
    .to(leftEar.scale, { duration: 1, x: 0.325, y: 0.325, z: 0.325 }, '<')
    .to(leftEarContainer.rotation, { duration: 2, z: Math.PI * 2, ease: 'sine.inOut' }, '<')
    .to(leftEarContainer.scale, { duration: 1, x: 1, y: 1, z: 1 }, '-=0.5')
    .to(leftEar.scale, { duration: 1, x: 0.65, y: 0.65, z: 0.65 }, '<')

gsap.timeline({ delay: 4.2 })
    .to(rightEarContainer.scale, { duration: 1, x: 2, y: 2, z: 2 })
    .to(rightEar.scale, { duration: 1, x: 0.325, y: 0.325, z: 0.325 }, '<')
    .to(rightEarContainer.rotation, { duration: 2, z: -Math.PI * 2, ease: 'sine.inOut' }, '<')
    .to(rightEarContainer.scale, { duration: 1, x: 1, y: 1, z: 1 }, '-=0.5')
    .to(rightEar.scale, { duration: 1, x: 0.65, y: 0.65, z: 0.65 }, '<')


gsap.timeline({ delay: 4.2 })
    .to(head.position, { duration: 1, ease: 'sine.inOut', ease: 'sine.out', x: -1, y: 2, z: 1.3 })
    .to(head.scale, { duration: 2, ease: 'sine.out', x: 0.5, y: 0.5, z: 0.5 })
    .to(head.position, { duration: 2, ease: 'sine.inOut', x: 0.6, y: 0.75, z: 1.3 }, '<')
    .to(head.rotation, { duration: 2, ease: 'sine.inOut', z: -0.25 }, '<')


let mixer;

// Videos stripe
loader.load('videos.glb', (gltf) => {
    const { scene: videos, animations } = gltf;
    const anim = animations[0];
    mixer = new THREE.AnimationMixer(videos);
    const action = mixer.clipAction(anim);
    action.setLoop(THREE.LoopOnce);
    action.clampWhenFinished = true;
    videos.position.set(-0.5, -1.8, 1);
    videos.scale.set(0.6, 0.6, 0.6);
    videos.rotation.x = Math.PI * 0.5;
    videos.rotation.y = -0.1;
    videos.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    gsap.delayedCall(6, () => {
        action.play();
        requestAnimationFrame(() => {
            scene.add(videos);
        });
    });
})


function animate() {
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(bgScene, bgCamera);
  
  renderer.render( scene, camera );
  if (mixer) {
    mixer.update(clock.getDelta());
  }
}