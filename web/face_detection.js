// face_detection.js — Simulación ESP32-CAM Stream + Face Recognition (Santos & Santos, Unit 5.2)
// Usando face-api.js, simula lo que haría la ESP32-CAM + OpenCV procesando un stream de cámara IP.

let faceVideo = null;
let faceAnimFrame = null;
let faceStream = null;
let isFaceRunning = false;
let fpsInterval = null;
let frameCount = 0;
let lastFpsTime = Date.now();
let currentFps = 0;
let faceCount = 0;

// CDN base para los modelos de face-api.js
const MODELS_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

window.startFaceDetection = async function (containerId) {
    if (isFaceRunning) return;

    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Face detection container not found: ' + containerId);
        return;
    }

    // ── Layout ───────────────────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.id = 'face-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.background = '#0a0a1a';
    wrapper.style.overflow = 'hidden';
    wrapper.style.borderRadius = '12px';
    container.appendChild(wrapper);

    // Barra superior estilo cámara IP
    const topBar = document.createElement('div');
    topBar.style.cssText = `
        position:absolute; top:0; left:0; right:0; z-index:20;
        background:linear-gradient(90deg,#0d1b2a,#1b263b);
        padding:8px 14px; display:flex; align-items:center; gap:10px;
        font-family:'Roboto Mono',monospace; font-size:12px; color:#90e0ef;
        border-bottom:1px solid #023e8a;
    `;
    topBar.innerHTML = `
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#ef233c;box-shadow:0 0 6px #ef233c;animation:blink 1s infinite;"></span>
        <span>ESP32-CAM SIM &nbsp;|&nbsp; STREAM: WebCam &nbsp;|&nbsp;</span>
        <span id="face-fps-label">FPS: --</span>
        <span>&nbsp;|&nbsp;</span>
        <span id="face-count-label">Rostros: 0</span>
        <span style="margin-left:auto; color:#48cae4;" id="face-time-label"></span>
    `;
    wrapper.appendChild(topBar);

    // Video
    faceVideo = document.createElement('video');
    faceVideo.setAttribute('autoplay', '');
    faceVideo.setAttribute('muted', '');
    faceVideo.setAttribute('playsinline', '');
    faceVideo.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;';
    wrapper.appendChild(faceVideo);

    // Canvas overlay para dibujar detecciones
    const canvas = document.createElement('canvas');
    canvas.id = 'face-canvas';
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;';
    wrapper.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    // Barra de estado inferior
    const statusBar = document.createElement('div');
    statusBar.id = 'face-status';
    statusBar.style.cssText = `
        position:absolute; bottom:0; left:0; right:0; z-index:20;
        background:rgba(2,6,23,0.85); padding:8px 16px;
        font-family:'Roboto Mono',monospace; font-size:12px;
        color:#90e0ef; border-top:1px solid #023e8a;
        display:flex; justify-content:space-between; align-items:center;
    `;
    statusBar.innerHTML = `<span id="face-status-text">🔄 Inicializando modelos...</span><span style="color:#48cae4;">face-api.js v0.22.2</span>`;
    wrapper.appendChild(statusBar);

    // CSS de animación parpadeo
    if (!document.getElementById('face-style')) {
        const style = document.createElement('style');
        style.id = 'face-style';
        style.textContent = `
            @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap');
        `;
        document.head.appendChild(style);
    }

    const setStatus = (msg) => {
        const el = document.getElementById('face-status-text');
        if (el) el.textContent = msg;
    };

    try {
        // 1. Solicitar cámara
        setStatus('📷 Solicitando acceso a la cámara (WebCam simulando ESP32-CAM)...');
        faceStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720, facingMode: 'user' }, audio: false });
        faceVideo.srcObject = faceStream;

        await new Promise(res => { faceVideo.onloadeddata = res; });
        canvas.width = faceVideo.videoWidth;
        canvas.height = faceVideo.videoHeight;

        // 2. Cargar modelos face-api.js
        setStatus('🧠 Cargando modelos de IA (TinyFaceDetector + Landmarks + Expresiones)...');
        await Promise.all([
            faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
            faceapi.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
            faceapi.nets.faceExpressionNet.loadFromUri(MODELS_URL),
        ]);
        setStatus('✅ Modelos cargados — Detección activa');

        isFaceRunning = true;

        // FPS counter
        fpsInterval = setInterval(() => {
            const now = Date.now();
            const elapsed = (now - lastFpsTime) / 1000;
            currentFps = Math.round(frameCount / elapsed);
            frameCount = 0;
            lastFpsTime = now;
            const fpsEl = document.getElementById('face-fps-label');
            if (fpsEl) fpsEl.textContent = 'FPS: ' + currentFps;
            const timeEl = document.getElementById('face-time-label');
            if (timeEl) timeEl.textContent = new Date().toLocaleTimeString();
        }, 1000);

        // 3. Bucle de detección
        async function detect() {
            if (!isFaceRunning) return;

            const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.45 });
            const detections = await faceapi
                .detectAllFaces(faceVideo, options)
                .withFaceLandmarks()
                .withFaceExpressions();

            // Escalar detecciones al tamaño real del canvas
            const displaySize = { width: faceVideo.videoWidth, height: faceVideo.videoHeight };
            const resized = faceapi.resizeResults(detections, displaySize);

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawDetections(ctx, resized);

            faceCount = resized.length;
            const countEl = document.getElementById('face-count-label');
            if (countEl) countEl.textContent = `Rostros: ${faceCount}`;

            frameCount++;
            faceAnimFrame = requestAnimationFrame(detect);
        }

        detect();

    } catch (err) {
        console.error('Face detection error:', err);
        setStatus('❌ Error: ' + err.message);
    }
};

function drawDetections(ctx, detections) {
    const COLORS = ['#00b4d8', '#48cae4', '#90e0ef', '#ade8f4', '#caf0f8'];

    detections.forEach((det, i) => {
        const box = det.detection.box;
        const color = COLORS[i % COLORS.length];
        const expressions = det.expressions;
        const topExpression = Object.entries(expressions).sort((a, b) => b[1] - a[1])[0];
        const exprLabel = topExpression ? `${expressionEmoji(topExpression[0])} ${topExpression[0]} ${Math.round(topExpression[1] * 100)}%` : '';
        const confidence = Math.round(det.detection.score * 100);

        // Bounding box con efecto neón
        ctx.shadowColor = color;
        ctx.shadowBlur = 16;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        ctx.shadowBlur = 0;

        // Esquinas decorativas (estilo cámara de seguridad)
        const cLen = 18;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        [[box.x, box.y], [box.x + box.width, box.y], [box.x, box.y + box.height], [box.x + box.width, box.y + box.height]].forEach(([cx, cy]) => {
            const dx = cx === box.x ? 1 : -1;
            const dy = cy === box.y ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy * cLen); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx * cLen, cy);
            ctx.stroke();
        });

        // Etiqueta superior
        const label = `ROSTRO ${i + 1}  |  ${confidence}%`;
        ctx.font = 'bold 13px "Roboto Mono", monospace';
        const lw = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(box.x, box.y - 24, lw + 14, 24);
        ctx.fillStyle = '#0a0a1a';
        ctx.fillText(label, box.x + 7, box.y - 6);

        // Expresión debajo del bounding box
        if (exprLabel) {
            ctx.font = '12px "Roboto Mono", monospace';
            const ew = ctx.measureText(exprLabel).width;
            ctx.fillStyle = 'rgba(2,6,23,0.8)';
            ctx.fillRect(box.x, box.y + box.height, ew + 14, 22);
            ctx.fillStyle = '#90e0ef';
            ctx.fillText(exprLabel, box.x + 7, box.y + box.height + 15);
        }

        // Landmarks (puntos faciales — marca el contorno del rostro como OpenCV)
        if (det.landmarks) {
            const pts = det.landmarks.positions;
            ctx.fillStyle = color;
            pts.forEach(pt => {
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, 1.5, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });
}

function expressionEmoji(name) {
    const map = { happy: '😊', sad: '😢', angry: '😠', surprised: '😮', disgusted: '🤢', fearful: '😨', neutral: '😐' };
    return map[name] || '🙂';
}

window.stopFaceDetection = function () {
    isFaceRunning = false;
    if (faceAnimFrame) cancelAnimationFrame(faceAnimFrame);
    if (fpsInterval) clearInterval(fpsInterval);
    if (faceStream) faceStream.getTracks().forEach(t => t.stop());
    faceVideo = null;
    faceStream = null;
    frameCount = 0;
    const wrapper = document.getElementById('face-wrapper');
    if (wrapper) wrapper.remove();
};
