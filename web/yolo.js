let video;
let detector;
let isDetecting = false;
let yoloStream = null;
let yoloAnimFrame = null;
let yoloFpsInterval = null;
let yoloFrameCount = 0;
let yoloLastFpsTime = Date.now();
let yoloDetectedCount = 0;

window.startYoloDetection = async function(containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error("Container " + containerId + " not found.");
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.style.position = 'relative';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.style.overflow = 'hidden';
    container.appendChild(wrapper);

    video = document.createElement('video');
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.style.position = 'absolute';
    video.style.top = '0';
    video.style.left = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    wrapper.appendChild(video);

    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    wrapper.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    
    const statusDiv = document.createElement('div');
    statusDiv.style.position = 'absolute';
    statusDiv.style.top = '10px';
    statusDiv.style.left = '10px';
    statusDiv.style.color = 'white';
    statusDiv.style.backgroundColor = 'rgba(0,0,0,0.6)';
    statusDiv.style.padding = '8px 12px';
    statusDiv.style.borderRadius = '8px';
    statusDiv.style.fontFamily = 'sans-serif';
    statusDiv.style.fontSize = '14px';
    statusDiv.style.fontWeight = 'bold';
    statusDiv.innerText = "Solicitando cámara...";
    wrapper.appendChild(statusDiv);

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 1280, height: 720 }, audio: false });
        yoloStream = stream;
        video.srcObject = stream;
        
        video.onloadeddata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            if (typeof ml5 === 'undefined') {
                statusDiv.innerText = "Error: ml5.js no está cargado.";
                return;
            }

            statusDiv.innerText = "Descargando Modelo YOLO (puede tardar un momento)...";
            
            // Initialize YOLO from ml5.js
            const yolo = ml5.YOLO(video, () => {
                statusDiv.innerText = "YOLO Listo - Detección Activa";
                statusDiv.style.backgroundColor = 'rgba(0,128,0,0.6)';
                detect();
            });

            function detect() {
                yolo.detect((err, results) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    draw(results);
                    // Continue detecting
                    requestAnimationFrame(detect);
                });
            }

            function draw(results) {
                // Clear the canvas
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                if (!results) return;

                // Scaling context in case the video is scaled through object-fit: cover
                // We will assume the canvas coordinates map exactly to video inner coordinates
                // since canvas width and height equal video.videoWidth and video.videoHeight.
                for (let i = 0; i < results.length; i++) {
                    const object = results[i];
                    
                    let x = object.x;
                    let y = object.y;
                    let w = object.w;
                    let h = object.h;

                    // ml5.YOLO <= 0.4.3 sometimes returns normalized (0-1) coordinates
                    if (x < 1 && y < 1 && w <= 1 && h <= 1) {
                        x *= canvas.width;
                        y *= canvas.height;
                        w *= canvas.width;
                        h *= canvas.height;
                    }

                    const label = object.label || object.className || "Object";
                    const confidence = object.confidence || object.classProb || 0;

                    ctx.strokeStyle = "#00FF00";
                    ctx.lineWidth = 4;
                    ctx.strokeRect(x, y, w, h);

                    ctx.fillStyle = "#00FF00";
                    ctx.font = "bold 20px sans-serif";
                    
                    const text = `${label} (${Math.round(confidence * 100)}%)`;
                    const textWidth = ctx.measureText(text).width;
                    
                    ctx.fillRect(x - 2, y - 28, textWidth + 10, 28);
                    
                    ctx.fillStyle = "#000000";
                    ctx.fillText(text, x + 3, y - 6);
                }
            }
        };
    } catch (err) {
        console.error("Error accessing camera: ", err);
        statusDiv.innerText = "Error: Permiso de cámara denegado.";
        statusDiv.style.backgroundColor = 'rgba(255,0,0,0.6)';
    }
}

window.stopYoloDetection = function() {
    isDetecting = false;
    if (yoloAnimFrame) cancelAnimationFrame(yoloAnimFrame);
    if (yoloFpsInterval) clearInterval(yoloFpsInterval);
    if (yoloStream) yoloStream.getTracks().forEach(t => t.stop());
    if (video && video.srcObject) video.srcObject = null;
    yoloStream = null;
    video = null;
};

window.getYoloStats = function() {
    return { fps: Math.round(yoloFrameCount), objects: yoloDetectedCount };
};
