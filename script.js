// AirDraw - Hand Tracking Drawing Application
class AirDrawApp {
    constructor() {
        this.video = document.getElementById('videoElement');
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.handCanvas = document.getElementById('handCanvas');
        this.drawingCtx = this.drawingCanvas.getContext('2d');
        this.handCtx = this.handCanvas.getContext('2d');
        
        this.camera = null;
        this.hands = null;
        this.isDrawing = false;
        this.lastPoint = null;
        
        // Drawing settings
        this.currentColor = '#FF0000';
        this.brushSize = 3;
        this.drawMode = 'draw';
        
        // Color selection with hand - removed
        this.colorIndicator = document.getElementById('colorIndicator');
        
        this.initializeElements();
        this.setupEventListeners();
        this.setupMediaPipe();
    }
    
    initializeElements() {
        this.startBtn = document.getElementById('startCamera');
        this.stopBtn = document.getElementById('stopCamera');
        this.clearBtn = document.getElementById('clearCanvas');
        this.saveBtn = document.getElementById('saveDrawing');
        this.colorPicker = document.getElementById('colorPicker');
        this.brushSizeSlider = document.getElementById('brushSize');
        this.sizeValue = document.getElementById('sizeValue');
        this.status = document.getElementById('status');
        
        // Set canvas size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = document.querySelector('.canvas-container');
        const width = container.clientWidth;
        const height = width * 0.75; // 4:3 aspect ratio
        
        this.drawingCanvas.width = width;
        this.drawingCanvas.height = height;
        this.handCanvas.width = width;
        this.handCanvas.height = height;
    }
    
    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startCamera());
        this.stopBtn.addEventListener('click', () => this.stopCamera());
        this.clearBtn.addEventListener('click', () => this.clearCanvas());
        this.saveBtn.addEventListener('click', () => this.saveDrawing());
        
        // Legacy controls
        this.colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value;
        });
        
        this.brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.sizeValue.textContent = this.brushSize;
        });
        
        document.querySelectorAll('input[name="drawMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.drawMode = e.target.value;
            });
        });
        
        // In-camera controls
        this.setupInCameraControls();
    }
    
    setupInCameraControls() {
        // In-camera controls removed - only hand color selection remains
    }
    
    setColor(color) {
        this.currentColor = color;
        this.colorPicker.value = color;
    }
    
    setBrushSize(size) {
        this.brushSize = size;
        this.brushSizeSlider.value = size;
        this.sizeValue.textContent = size;
    }
    
    setDrawMode(mode) {
        this.drawMode = mode;
        document.querySelector(`input[name="drawMode"][value="${mode}"]`).checked = true;
    }
    
        
    setupMediaPipe() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults((results) => this.onHandResults(results));
    }
    
    async startCamera() {
        try {
            this.updateStatus('📷 กำลังเปิดกล้อง...', 'active');
            
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });
            
            this.video.srcObject = stream;
            
            this.camera = new Camera(this.video, {
                onFrame: async () => {
                    await this.hands.send({ image: this.video });
                },
                width: 1280,
                height: 720
            });
            
            await this.camera.start();
            
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.updateStatus('✅ กล้องพร้อมใช้งาน! ยกนิ้วชี้เพื่อเริ่มวาด', 'active');
            
        } catch (error) {
            console.error('Error accessing camera:', error);
            this.updateStatus('❌ ไม่สามารถเปิดกล้องได้: ' + error.message, 'error');
        }
    }
    
    stopCamera() {
        if (this.camera) {
            this.camera.stop();
        }
        
        if (this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
        
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.updateStatus('👋 กล้องปิดแล้ว', '');
        
        // Clear hand canvas
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
    }
    
    onHandResults(results) {
        // Clear hand canvas
        this.handCtx.clearRect(0, 0, this.handCanvas.width, this.handCanvas.height);
        
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Draw hand landmarks
            this.drawHandLandmarks(landmarks);
            
            // Get index finger tip position
            const indexTip = landmarks[8];
            const indexMcp = landmarks[5];
            
            // Check if index finger is up (drawing gesture)
            const isIndexFingerUp = this.isIndexFingerUp(landmarks);
            
            if (isIndexFingerUp) {
                const canvasX = indexTip.x * this.drawingCanvas.width;
                const canvasY = indexTip.y * this.drawingCanvas.height;
                
                this.handleDrawing(canvasX, canvasY);
            } else {
                this.isDrawing = false;
                this.lastPoint = null;
            }
        }
    }
    
    drawHandLandmarks(landmarks) {
        // Draw connections
        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
            [0, 5], [5, 6], [6, 7], [7, 8],  // Index finger
            [5, 9], [9, 10], [10, 11], [11, 12],  // Middle finger
            [9, 13], [13, 14], [14, 15], [15, 16],  // Ring finger
            [13, 17], [17, 18], [18, 19], [19, 20],  // Pinky
            [0, 17]  // Palm
        ];
        
        this.handCtx.strokeStyle = '#00FF00';
        this.handCtx.lineWidth = 2;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.handCtx.beginPath();
            this.handCtx.moveTo(startPoint.x * this.handCanvas.width, startPoint.y * this.handCanvas.height);
            this.handCtx.lineTo(endPoint.x * this.handCanvas.width, endPoint.y * this.handCanvas.height);
            this.handCtx.stroke();
        });
        
        // Draw landmarks
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.handCanvas.width;
            const y = landmark.y * this.handCanvas.height;
            
            this.handCtx.fillStyle = index === 8 ? '#FF0000' : '#00FF00'; // Index finger tip in red
            this.handCtx.beginPath();
            this.handCtx.arc(x, y, 5, 0, 2 * Math.PI);
            this.handCtx.fill();
        });
    }
    
    isIndexFingerUp(landmarks) {
        const indexTip = landmarks[8];
        const indexMcp = landmarks[5];
        const middleTip = landmarks[12];
        const middleMcp = landmarks[9];
        
        // Check if index finger is higher than middle finger
        return indexTip.y < middleTip.y && indexTip.y < indexMcp.y;
    }
    
    handleDrawing(x, y) {
        if (this.drawMode === 'draw') {
            if (this.isDrawing && this.lastPoint) {
                // Draw line from last point to current point
                this.drawingCtx.strokeStyle = this.currentColor;
                this.drawingCtx.lineWidth = this.brushSize;
                this.drawingCtx.lineCap = 'round';
                this.drawingCtx.lineJoin = 'round';
                
                this.drawingCtx.beginPath();
                this.drawingCtx.moveTo(this.lastPoint.x, this.lastPoint.y);
                this.drawingCtx.lineTo(x, y);
                this.drawingCtx.stroke();
            }
            
            this.isDrawing = true;
            this.lastPoint = { x, y };
        } else if (this.drawMode === 'erase') {
            // Erase at current position
            this.drawingCtx.globalCompositeOperation = 'destination-out';
            this.drawingCtx.beginPath();
            this.drawingCtx.arc(x, y, this.brushSize * 3, 0, 2 * Math.PI);
            this.drawingCtx.fill();
            this.drawingCtx.globalCompositeOperation = 'source-over';
        }
    }
    
    clearCanvas() {
        this.drawingCtx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.updateStatus('🗑️ ลบรูปเรียบร้อย', 'active');
    }
    
    saveDrawing() {
        // Create a temporary canvas to merge video and drawing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.drawingCanvas.width;
        tempCanvas.height = this.drawingCanvas.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw video frame
        tempCtx.drawImage(this.video, 0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the drawing on top
        tempCtx.drawImage(this.drawingCanvas, 0, 0);
        
        // Save the image
        const link = document.createElement('a');
        link.download = `air-drawing-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
        
        this.updateStatus('💾 บันทึกรูปเรียบร้อย', 'active');
    }
    
    updateStatus(message, type) {
        this.status.innerHTML = `<p>${message}</p>`;
        this.status.className = 'status';
        if (type) {
            this.status.classList.add(type);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('AirDraw Application Loaded!');
    new AirDrawApp();
});
