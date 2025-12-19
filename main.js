import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';

// --- Configuration ---
const PAGE_COUNT = 10;
const PAGE_WIDTH = 3.5;
const PAGE_HEIGHT = 4.8;
const PAGE_SEGMENTS_W = 20;
const PAGE_SEGMENTS_H = 1;

// Colors
const COLORS = {
    bg: '#FAF1E6',
    gold: '#E5C89B',
    pink: '#E6A6B0',
    blue: '#A8D0D8',
    text: '#4A4A4A',
    dark: '#2A2A2A'
};

// --- Debug Utility ---
const debugConsole = document.getElementById('debug-console');
function logToScreen(msg, type = 'log') {
    if (!debugConsole) return;
    if (type === 'error') debugConsole.style.display = 'block';

    const line = document.createElement('div');
    line.style.color = type === 'error' ? '#ff6b6b' : '#a8d0d8';
    line.innerText = `> ${msg}`;
    debugConsole.prepend(line);
}
// Override console
const originalLog = console.log;
const originalError = console.error;
console.log = (...args) => { originalLog(...args); logToScreen(args.join(' ')); };
console.error = (...args) => { originalError(...args); logToScreen(args.join(' '), 'error'); };


// --- State ---
let currentPage = 0;
let isAnimating = false;
let gestureModel = null;
let video = null;
let lastGestureTime = 0;
const GESTURE_COOLDOWN = 1500;

// --- Content Engine (Procedural Text) ---
class ContentEngine {
    static getRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    static getTopic(index) {
        const data = {
            title: "",
            subtitle: "",
            body: [],
            themeColor: COLORS.gold,
            type: "standard",
            artType: "none"
        };

        const haryanaFacts = [
            "Known as the '**Abode of God**'.",
            "A major hub for **automobile manufacturing**.",
            "Rich in **agricultural heritage**.",
            "Home to the historic battle of **Panipat**."
        ];

        const manipurFacts = [
            "Famous for its **classical dance** form.",
            "Birthplace of modern **Polo** (Sagol Kangjei).",
            "Known as the '**Jewel of India**'.",
            "Home to the floating **Loktak Lake**."
        ];

        switch (index) {
            case 0: // Intro
                data.title = "INCREDIBLE INDIA";
                data.subtitle = this.getRandom(["A Journey Begins", "Discover Heritage", "North & East"]);
                data.body = ["Welcome to a journey through the heart of **India's diversity**.", "Explore the contrast between the green fields of **Haryana** and the hills of **Manipur**."];
                data.type = "cover";
                data.artType = "mandala";
                break;

            case 1: // Haryana Info
                data.title = "HARYANA";
                data.subtitle = "The Green Land";
                data.body = [
                    "Located in North India, **Haryana** is known for its vibrant culture and rapidly growing cities like **Gurugram**.",
                    this.getRandom(haryanaFacts),
                    "The state balances modernity with **deep-rooted traditions**."
                ];
                data.themeColor = COLORS.gold;
                data.artType = "wheat";
                break;

            case 2: // Haryana Food
                data.title = "CULINARY DELIGHTS";
                data.subtitle = "Taste of Haryana";
                const hFoods = [
                    { name: "Bajra Khichdi", desc: "A wholesome millet porridge." },
                    { name: "Churma", desc: "Ghee-laden sweet delicacy." },
                    { name: "Kachri ki Sabzi", desc: "Tangy wild cucumber curry." },
                    { name: "Lassi", desc: "Tall glass of buttermilk." }
                ];
                const f1 = this.getRandom(hFoods);
                const f2 = this.getRandom(hFoods.filter(f => f !== f1));
                data.body = [
                    `Try the **${f1.name}**, ${f1.desc}`,
                    `Don't miss **${f2.name}**, ${f2.desc}`,
                    "Food here is simple, earthy, and rich in **dairy**."
                ];
                data.themeColor = COLORS.gold;
                data.artType = "bowl";
                break;

            case 3: // Haryana Places
                data.title = "DESTINATIONS";
                data.subtitle = "Explore Haryana";
                const hPlaces = ["Sultanpur Bird Sanctuary", "Kurukshetra", "Pinjore Gardens", "Morni Hills"];
                data.body = [
                    `1. **${this.getRandom(hPlaces)}**`,
                    `2. **${this.getRandom(hPlaces)}**`,
                    `3. **${this.getRandom(hPlaces)}**`,
                    "Each place tells a story of the past."
                ];
                data.type = "list";
                data.themeColor = COLORS.gold;
                data.artType = "compass";
                break;

            case 4: // Haryana Culture
                data.title = "CULTURE";
                data.subtitle = "Folk & Traditions";
                data.body = [
                    "Haryana has a rich tradition of **folk music and dance**.",
                    this.getRandom(["**Phag Dance** is popular here.", "**Saang theatre** is a vital art form.", "The **Haryanvi turban** represents pride."]),
                    "Festivals like **Teej** are celebrated with great pomp."
                ];
                data.themeColor = COLORS.gold;
                data.artType = "mandala";
                break;

            case 5: // Manipur Info
                data.title = "MANIPUR";
                data.subtitle = "Jewel of India";
                data.body = [
                    "Nestled in the Northeast, **Manipur** is defined by its hills and oval valley.",
                    this.getRandom(manipurFacts),
                    "It is a land of **exquisite art** and martial prowess."
                ];
                data.themeColor = COLORS.blue;
                data.artType = "mountains";
                break;

            case 6: // Manipur Food
                data.title = "EXQUISITE FLAVORS";
                data.subtitle = "Manipuri Cuisine";
                const mFoods = [
                    { name: "Eromba", desc: "A mash of boiled vegetables and fermented fish." },
                    { name: "Kangshoi", desc: "Vegetable stew." },
                    { name: "Chak-Hao Kheer", desc: "Purple rice pudding." },
                    { name: "Singju", desc: "Spicy vegetable salad." }
                ];
                const mf1 = this.getRandom(mFoods);
                const mf2 = this.getRandom(mFoods.filter(f => f !== mf1));
                data.body = [
                    `Savor the **${mf1.name}**, ${mf1.desc}`,
                    `Enjoy **${mf2.name}**, ${mf2.desc}`,
                    "Herbs and **organic ingredients** define this cuisine."
                ];
                data.themeColor = COLORS.blue;
                data.artType = "bowl";
                break;

            case 7: // Manipur Places
                data.title = "MUST VISIT";
                data.subtitle = "Sights of Manipur";
                const mPlaces = ["Loktak Lake", "Keibul Lamjao National Park", "Kangla Fort", "Imphal War Cemetery"];
                data.body = [
                    `1. **${this.getRandom(mPlaces)}**`,
                    `2. **${this.getRandom(mPlaces)}**`,
                    `3. **${this.getRandom(mPlaces)}**`,
                    "Nature here is **pristine** and untouched."
                ];
                data.type = "list";
                data.themeColor = COLORS.blue;
                data.artType = "mountains";
                break;

            case 8: // Manipur Culture
                data.title = "LIVING HERITAGE";
                data.subtitle = "Art & Dance";
                data.body = [
                    "Manipuri Dance (**Ras Lila**) is world-renowned for its grace.",
                    this.getRandom(["**Thang-Ta** is a traditional martial art.", "**Lai Haraoba** is a key festival.", "**Handloom weaving** is a major craft."]),
                    "The culture is deeply connected to **nature**."
                ];
                data.themeColor = COLORS.blue;
                data.artType = "mandala";
                break;

            case 9: // Thank You
                data.title = "THANK YOU";
                data.subtitle = "Safe Travels";
                data.body = ["We hope this journey inspired you.", "Come, visit **Incredible India**."];
                data.type = "cover";
                data.themeColor = COLORS.pink;
                data.artType = "mandala";
                break;
        }
        return data;
    }
}

// --- Procedural Art Helper ---
class CanvasArt {
    static draw(ctx, type, color, w, h) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.4; // INCREASED VISIBILITY
        ctx.lineWidth = 3;

        const cx = w / 2;
        const cy = h / 2 + 100; // Offset downwards for watermark/icon style

        if (type === 'mandala') {
            ctx.beginPath();
            for (let i = 0; i < 8; i++) {
                ctx.ellipse(cx, cy, 200, 80, (Math.PI * i) / 4, 0, Math.PI * 2);
            }
            ctx.stroke();
            ctx.globalAlpha = 0.1;
            ctx.beginPath();
            ctx.arc(cx, cy, 120, 0, Math.PI * 2);
            ctx.fill();
        }
        else if (type === 'wheat') {
            // Stylized Wheat Stalks
            for (let offset of [-60, 0, 60]) {
                const x = cx + offset;
                const y = cy;
                ctx.beginPath();
                ctx.moveTo(x, y + 200);
                ctx.quadraticCurveTo(x + (offset / 2), y, x, y - 200);
                ctx.stroke();
                // Grains
                for (let j = 0; j < 5; j++) {
                    ctx.beginPath();
                    ctx.ellipse(x, y - 200 + (j * 40), 10, 20, Math.PI / 4, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.ellipse(x, y - 200 + (j * 40), 10, 20, -Math.PI / 4, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
        else if (type === 'mountains') {
            // Triangle Mountains
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.lineTo(cx - 200, h - 300);
            ctx.lineTo(cx, h - 100);
            ctx.lineTo(cx + 200, h - 400);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.fill();
            // Snow caps
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.moveTo(cx - 200, h - 300);
            ctx.lineTo(cx - 150, h - 225);
            ctx.lineTo(cx - 250, h - 225);
            ctx.fill();
        }
        else if (type === 'bowl') {
            // Stylized Bowl
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(cx, cy, 150, 0, Math.PI, false);
            ctx.stroke();
            ctx.beginPath();
            ctx.ellipse(cx, cy, 150, 30, 0, 0, Math.PI * 2);
            ctx.stroke();
            // Steam
            ctx.lineWidth = 3;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.moveTo(cx + (i * 50), cy - 50);
                ctx.quadraticCurveTo(cx + (i * 50) + 20, cy - 150, cx + (i * 50), cy - 250);
                ctx.stroke();
            }
        }
        else if (type === 'compass') {
            // Compass / Map pin
            ctx.beginPath();
            ctx.arc(cx, cy, 100, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx, cy - 80);
            ctx.lineTo(cx + 20, cy);
            ctx.lineTo(cx, cy + 80);
            ctx.lineTo(cx - 20, cy);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}


// --- Procedural Asset Generation ---
function drawRichText(ctx, text, x, startY, maxWidth, lineHeight, baseFont) {
    // 1. Split text into words, preserving manual newlines if any (not handled here, assuming single lines passed)
    // 2. We handle **bold** parsing

    // Parse into segments: [{text: "word", bold: false}, ...]
    let parts = text.split(/(\*\*.*?\*\*)/g); // Split by **...**
    let segments = [];

    parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
            segments.push({ text: part.slice(2, -2), bold: true });
        } else if (part.length > 0) {
            // Split non-bold parts by spaces to allow wrapping
            let words = part.split(' ');
            words.forEach((w, i) => {
                let space = i < words.length - 1 ? ' ' : '';
                segments.push({ text: w + space, bold: false });
            });
        }
    });

    let xCursor = x; // Not used for center align logic easily without pre-calc.
    // Simpler strategy: Build lines of words, then render lines.

    let lines = [];
    let currentLine = [];
    let currentWidth = 0;

    ctx.font = baseFont; // Default to measure

    segments.forEach(seg => {
        ctx.font = seg.bold ? baseFont.replace('24px', 'bold 24px').replace('32px', 'bold 32px') : baseFont;
        let w = ctx.measureText(seg.text).width;

        if (currentWidth + w < maxWidth) {
            currentLine.push({ ...seg, width: w });
            currentWidth += w;
        } else {
            lines.push(currentLine);
            currentLine = [{ ...seg, width: w }];
            currentWidth = w;
        }
    });
    if (currentLine.length > 0) lines.push(currentLine);

    // Render lines centered
    let yCursor = startY;
    lines.forEach(line => {
        let totalLineWidth = line.reduce((sum, s) => sum + s.width, 0);
        let startX = x - (totalLineWidth / 2); // Center alignment

        line.forEach(seg => {
            ctx.font = seg.bold ? baseFont.replace('24px', 'bold 24px').replace('32px', 'bold 32px') : baseFont;
            ctx.fillStyle = seg.bold ? COLORS.dark : '#555'; // Darker for bold
            ctx.fillText(seg.text, startX, yCursor);
            startX += seg.width;
        });
        yCursor += lineHeight;
    });

    return yCursor; // Return new Y position
}

function createPageTexture(index) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1400;
    const ctx = canvas.getContext('2d');

    // Get Dynamic Data
    const data = ContentEngine.getTopic(index);

    // Background
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Background Art (Watermark)
    if (data.artType && data.artType !== 'none') {
        CanvasArt.draw(ctx, data.artType, data.themeColor, canvas.width, canvas.height);
    }

    // Decorative Border
    ctx.strokeStyle = data.themeColor;
    ctx.lineWidth = 5;
    ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);

    // Page Number
    ctx.fillStyle = COLORS.text;
    ctx.font = '30px "Courier New", monospace';
    ctx.fillText(`${index + 1}`.padStart(2, '0'), canvas.width - 80, canvas.height - 60);

    // Design Elements (Lines/Circles)
    if (data.type === 'cover') {
        // Big Cover Style
        ctx.beginPath();
        ctx.arc(canvas.width / 2, canvas.height / 2, 300, 0, Math.PI * 2);
        ctx.strokeStyle = data.themeColor;
        ctx.lineWidth = 3;
        ctx.stroke();
    } else {
        // Content Page Style
        ctx.beginPath();
        ctx.moveTo(100, 200);
        ctx.lineTo(canvas.width - 100, 200);
        ctx.strokeStyle = data.themeColor;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    // Text Content
    ctx.textAlign = 'left'; // Helper handles alignment manually
    ctx.textBaseline = 'middle';

    // Headings
    ctx.textAlign = 'center';
    if (data.type === 'cover') {
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 90px "Times New Roman", serif';
        ctx.fillText(data.title, canvas.width / 2, 500);

        ctx.font = 'italic 50px "Arial", sans-serif';
        ctx.fillStyle = data.themeColor;
        ctx.fillText(data.subtitle, canvas.width / 2, 600);
    } else {
        ctx.fillStyle = COLORS.text;
        ctx.font = 'bold 70px "Times New Roman", serif';
        ctx.fillText(data.title, canvas.width / 2, 300);

        ctx.font = 'italic 40px "Arial", sans-serif';
        ctx.fillStyle = data.themeColor;
        ctx.fillText(data.subtitle, canvas.width / 2, 380);
    }

    // Body Text with Formatting
    let textY = data.type === 'cover' ? 800 : 500;
    const baseFont = '32px "Arial", sans-serif';

    // Reset alignment for manual rich text rendering
    ctx.textAlign = 'left';

    data.body.forEach(line => {
        textY = drawRichText(ctx, line, canvas.width / 2, textY, 800, 50, baseFont);
        textY += 20; // Paragraph gap
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
}


// --- Three.js Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(COLORS.bg);
scene.fog = new THREE.Fog(COLORS.bg, 10, 25);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 10); // Adjusted camera Z

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('canvas-container').appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 8;
controls.maxDistance = 25;

// --- Lighting (Brightened) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xfff0dd, 1.5);
dirLight.position.set(5, 5, 10);
dirLight.castShadow = true;
scene.add(dirLight);

const spotLight = new THREE.SpotLight(COLORS.pink, 2.0);
spotLight.position.set(-5, 10, 5);
spotLight.lookAt(0, 0, 0);
scene.add(spotLight);


// --- Brochure Construction ---
const pages = [];
const pageGroup = new THREE.Group();
scene.add(pageGroup);

// Create all pages
for (let i = 0; i < PAGE_COUNT; i++) {
    const texture = createPageTexture(i);

    // Geometry with high segments for curl
    const geometry = new THREE.PlaneGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_SEGMENTS_W, PAGE_SEGMENTS_H);
    geometry.translate(PAGE_WIDTH / 2, 0, 0);

    // Store original positions for bending calculation
    const positionAttribute = geometry.attributes.position;
    const originalPositions = [];
    for (let j = 0; j < positionAttribute.count; j++) {
        originalPositions.push(positionAttribute.getX(j), positionAttribute.getY(j), positionAttribute.getZ(j));
    }
    geometry.userData.originalPositions = originalPositions;

    const material = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.6,
        metalness: 0.0,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // Stack: Page 0 on Top
    mesh.position.z = (PAGE_COUNT - i) * 0.005;

    mesh.userData = {
        index: i,
        isFlipped: false,
        bendStrength: 0
    };

    pageGroup.add(mesh);
    pages.push(mesh);
}
pageGroup.position.x = -PAGE_WIDTH / 2;


// --- Animation Logic (Page Curl) ---
const uiMessage = document.getElementById('center-message');

function showFeedback(text) {
    if (!uiMessage) return;
    uiMessage.innerText = text;
    uiMessage.classList.add('visible');
    setTimeout(() => {
        uiMessage.classList.remove('visible');
    }, 1500);
}

function updatePageBend(mesh) {
    const geom = mesh.geometry;
    const positions = geom.attributes.position;
    const originals = geom.userData.originalPositions;
    const bend = mesh.userData.bendStrength;

    for (let i = 0; i < positions.count; i++) {
        const x = originals[i * 3];
        const y = originals[i * 3 + 1];
        const nx = x / PAGE_WIDTH;
        // Cubic curl for more realistic paper feel
        const zOffset = bend * Math.pow(nx, 3);
        positions.setXYZ(i, x, y, originals[i * 3 + 2] + zOffset);
    }
    positions.needsUpdate = true;
}

function flipPageForward() {
    if (currentPage >= PAGE_COUNT || isAnimating) return;

    const pageToFlip = pages[currentPage];
    isAnimating = true;
    showFeedback("Next Page"); // Text Feedback

    gsap.to(pageToFlip.rotation, {
        y: -Math.PI + 0.05,
        duration: 1.6,
        ease: "power2.inOut",
        onUpdate: function () {
            const currentRot = pageToFlip.rotation.y;
            const progress = Math.abs(currentRot) / Math.PI;

            // Peak bend at 50%
            let bendFactor = 4 * progress * (1 - progress);
            pageToFlip.userData.bendStrength = bendFactor * 1.5;

            updatePageBend(pageToFlip);
        },
        onComplete: () => {
            pageToFlip.userData.isFlipped = true;
            pageToFlip.userData.bendStrength = 0;
            updatePageBend(pageToFlip);
            isAnimating = false;
            // Move slightly up so it stacks on left
            pageToFlip.position.z = currentPage * 0.006 + 0.1;
        }
    });

    currentPage++;
}

function flipPageBackward() {
    if (currentPage <= 0 || isAnimating) return;

    currentPage--;
    const pageToFlip = pages[currentPage];
    isAnimating = true;
    showFeedback("Previous Page");

    gsap.to(pageToFlip.rotation, {
        y: 0,
        duration: 1.6,
        ease: "power2.inOut",
        onUpdate: function () {
            const currentRot = pageToFlip.rotation.y;
            const progress = Math.abs(currentRot) / Math.PI;

            let bendFactor = 4 * progress * (1 - progress);
            pageToFlip.userData.bendStrength = bendFactor * 1.5;

            updatePageBend(pageToFlip);
        },
        onComplete: () => {
            pageToFlip.userData.isFlipped = false;
            pageToFlip.userData.bendStrength = 0;
            updatePageBend(pageToFlip);
            isAnimating = false;
            pageToFlip.position.z = (PAGE_COUNT - currentPage) * 0.005;
        }
    });
}


// --- Gesture Control ---
async function setupWebcam() {
    video = document.getElementById('webcam');
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("NotFoundError"); // Emulate not found if API missing
    }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            'audio': false,
            'video': { facingMode: 'user', width: 640, height: 480 }
        });
        video.srcObject = stream;
        return new Promise((resolve) => {
            video.onloadedmetadata = () => {
                video.play();
                // Show the feed container
                const container = document.getElementById('cam-container');
                if (container) container.classList.add('active');
                resolve(video);
            };
        });
    } catch (e) {
        console.warn("Cam failed", e);
        // Throw simple error or return null, but handled in initGesture
        throw e;
    }
}

async function initGesture() {
    const camStatus = document.getElementById('cam-status');
    const indicator = document.querySelector('.status-indicator');

    const isSecure = window.isSecureContext || window.location.hostname === 'localhost';
    if (!isSecure) {
        if (camStatus) camStatus.innerText = "HTTPS Required";
        return;
    }

    try {
        if (camStatus) camStatus.innerText = "Init Cam...";
        await setupWebcam();

        if (camStatus) camStatus.innerText = "Init AI...";
        gestureModel = await handpose.load();

        if (camStatus) camStatus.innerText = "Active";
        if (indicator) indicator.classList.add('status-active');
        showFeedback("Gestures Ready");

        detectHands();
    } catch (e) {
        if (camStatus) {
            // Show specific error for better debugging
            if (e.name === 'NotAllowedError') camStatus.innerText = "Perm Denied";
            else if (e.name === 'NotFoundError') camStatus.innerText = "No Cam Found";
            else camStatus.innerText = "Cam Error";
        }
        console.error("Gesture error:", e);
    }
}

let lastX = null;
// --- Drawing Helper ---
const canvas = document.getElementById('output-canvas');
const ctx = canvas ? canvas.getContext('2d') : null;

// Determine colors based on curl state
function getFingerColor(isCurled) {
    return isCurled ? '#FF0000' : '#00FF00'; // Red if curled, Green if open
}

function drawHand(landmarks, curledStates) {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 4;

    // Finger connections
    const fingers = [
        [0, 1, 2, 3, 4], // Thumb
        [0, 5, 6, 7, 8], // Index
        [0, 9, 10, 11, 12], // Middle
        [0, 13, 14, 15, 16], // Ring
        [0, 17, 18, 19, 20]  // Pinky
    ];

    fingers.forEach((finger, i) => {
        const isCurled = curledStates[i];
        ctx.strokeStyle = getFingerColor(isCurled);

        ctx.beginPath();
        finger.forEach((idx, j) => {
            const [x, y] = landmarks[idx];
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    });

    // Draw joints
    ctx.fillStyle = '#FF0000';
    for (let i = 0; i < landmarks.length; i++) {
        const [x, y] = landmarks[i];
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
    }
}

// --- Gesture Logic: Finger Curls ---
function isFingerCurled(landmarks, tipIdx, pipIdx) {
    // Basic check: If Tip Y > PIP Y, it's curled (in standard upright hand)
    // Y increases downwards.
    return landmarks[tipIdx][1] > landmarks[pipIdx][1];
}

let wasIndexCurled = false;
let wasMiddleCurled = false;

async function detectHands() {
    if (!gestureModel || !video) return;

    // Ensure canvas matches video size
    if (canvas && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    const predictions = await gestureModel.estimateHands(video);

    if (predictions.length > 0) {
        const hand = predictions[0];

        // Check Curls (calculate first to draw correct colors)
        // Indices in fingers array: Thumb=0, Index=1, Middle=2, Ring=3, Pinky=4
        const indexCurled = isFingerCurled(hand.landmarks, 8, 6);
        const middleCurled = isFingerCurled(hand.landmarks, 12, 10);

        // Pass states to drawHand (Thumb, Index, Middle, Ring, Pinky)
        drawHand(hand.landmarks, [false, indexCurled, middleCurled, false, false]);

        const now = Date.now();
        if (now - lastGestureTime > 500) { // Shorter cooldown for clicks
            if (indexCurled && !wasIndexCurled) {
                // Index Down -> Next
                showFeedback("Next Triggered!"); // Visual confirmation on UI
                console.log("Gesture: Index Curl (Next)");
                flipPageForward();
                lastGestureTime = now;
            }

            if (middleCurled && !wasMiddleCurled) {
                // Middle Down -> Prev
                showFeedback("Prev Triggered!"); // Visual confirmation on UI
                console.log("Gesture: Middle Curl (Prev)");
                flipPageBackward();
                lastGestureTime = now;
            }

            wasIndexCurled = indexCurled;
            wasMiddleCurled = middleCurled;
        }
    } else {
        lastX = null;
        wasIndexCurled = false;
        wasMiddleCurled = false;
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    requestAnimationFrame(detectHands);
}


// --- Resize ---
function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isPortrait = width < height;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    if (isPortrait) {
        // Portrait brochure in portrait mode: No rotation needed, just pull back slightly
        gsap.to(pageGroup.rotation, { z: 0, duration: 0.5 });
        gsap.to(camera.position, { z: 18, duration: 0.5 }); // Closer zoom (was 28)
    } else {
        gsap.to(pageGroup.rotation, { z: 0, duration: 0.5 });
        gsap.to(camera.position, { z: 10, duration: 0.5 }); // Adjusted camera Z
    }
}
window.addEventListener('resize', handleResize);
handleResize();

// --- Loop ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();
initGesture();

// --- Manual Controls ---
const bPrev = document.getElementById('btn-prev');
const bNext = document.getElementById('btn-next');
if (bPrev) bPrev.addEventListener('click', flipPageBackward);
if (bNext) bNext.addEventListener('click', flipPageForward);

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') flipPageForward();
    if (e.key === 'ArrowLeft') flipPageBackward();
});

// --- Draggable Camera ---
const camContainer = document.getElementById('cam-container');
let isDragging = false;
let dragStartX, dragStartY;
let initialLeft, initialTop;

if (camContainer) {
    // Mouse Events
    camContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        const rect = camContainer.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;

        camContainer.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        const dx = e.clientX - dragStartX;
        const dy = e.clientY - dragStartY;

        camContainer.style.left = `${initialLeft + dx}px`;
        camContainer.style.top = `${initialTop + dy}px`;

        // Remove 'right' and 'bottom' if set, to switch to left/top positioning
        camContainer.style.right = 'auto';
        camContainer.style.bottom = 'auto';
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            camContainer.style.cursor = 'move';
        }
    });

    // Touch Events (for mobile)
    camContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;

        const rect = camContainer.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
    });

    window.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const dx = touch.clientX - dragStartX;
        const dy = touch.clientY - dragStartY;

        camContainer.style.left = `${initialLeft + dx}px`;
        camContainer.style.top = `${initialTop + dy}px`;
        camContainer.style.right = 'auto';
        camContainer.style.bottom = 'auto';
        e.preventDefault(); // Prevent scrolling
    }, { passive: false });

    window.addEventListener('touchend', () => {
        isDragging = false;
    });
}

