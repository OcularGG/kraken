// Naval Insignia Creator - Tools JavaScript
class NavalInsigniaCreator {
    constructor() {        this.canvas = null;
        this.ctx = null;
        this.userImage = null;
        this.borderImage = null;
        this.currentBorder = 'IMG_0092.png'; // Default border (Captain's Mark)
        this.imagePosition = { x: 0, y: 0 };
        this.imageScale = 1.0;
        this.init();
    }

    init() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize event handlers
        this.initializeEventHandlers();
        
        // Load default border
        this.loadBorderImage();
        
        // Draw initial state
        this.drawCanvas();
    }    initializeEventHandlers() {
        // Border selection handlers
        const borderOptions = document.querySelectorAll('.border-option');
        borderOptions.forEach(option => {
            option.addEventListener('click', () => {
                // Remove active class from all options
                borderOptions.forEach(opt => opt.classList.remove('active'));
                
                // Add active class to clicked option
                option.classList.add('active');
                
                // Update current border
                this.currentBorder = option.dataset.border;
                this.loadBorderImage();
            });
        });

        // Upload area click handler
        const uploadArea = document.getElementById('upload-area');
        const imageUpload = document.getElementById('image-upload');
        
        uploadArea.addEventListener('click', () => {
            imageUpload.click();
        });

        // Drag and drop handlers
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleImageUpload(files[0]);
            }
        });

        // File input handler
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleImageUpload(file);
            }
        });

        // Control handlers
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const scale = document.getElementById('scale');

        posX.addEventListener('input', (e) => {
            this.imagePosition.x = parseInt(e.target.value);
            document.getElementById('pos-x-value').textContent = e.target.value;
            this.drawCanvas();
        });

        posY.addEventListener('input', (e) => {
            this.imagePosition.y = parseInt(e.target.value);
            document.getElementById('pos-y-value').textContent = e.target.value;
            this.drawCanvas();
        });

        scale.addEventListener('input', (e) => {
            this.imageScale = parseFloat(e.target.value);
            document.getElementById('scale-value').textContent = e.target.value;
            this.drawCanvas();
        });

        // Download button
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadImage();
        });
    }

    loadBorderImage() {
        this.borderImage = new Image();
        this.borderImage.onload = () => {
            this.drawCanvas();
        };
        this.borderImage.src = this.currentBorder;
    }

    handleImageUpload(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, GIF)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.userImage = new Image();
            this.userImage.onload = () => {
                // Show controls
                document.querySelector('.canvas-controls').style.display = 'block';
                document.getElementById('download-btn').disabled = false;
                
                // Update upload area
                const uploadArea = document.getElementById('upload-area');
                uploadArea.innerHTML = `
                    <div class="upload-content">
                        <div class="upload-icon">✅</div>
                        <p>Image uploaded successfully!</p>
                        <small>Click to upload a different image</small>
                    </div>
                `;
                
                this.drawCanvas();
            };
            this.userImage.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    drawCanvas() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set canvas background to transparent
        this.ctx.globalCompositeOperation = 'source-over';
        
        if (this.userImage) {
            // Calculate image dimensions and position
            const canvasSize = 500;
            const imageSize = Math.min(canvasSize - 100, 350); // Leave space for border
            
            // Calculate scaled dimensions
            const scaledWidth = imageSize * this.imageScale;
            const scaledHeight = imageSize * this.imageScale;
            
            // Calculate position (center + offset)
            const centerX = canvasSize / 2;
            const centerY = canvasSize / 2;
            const imageX = centerX - scaledWidth / 2 + this.imagePosition.x;
            const imageY = centerY - scaledHeight / 2 + this.imagePosition.y;
            
            // Create circular clipping path for the image
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.arc(centerX + this.imagePosition.x, centerY + this.imagePosition.y, scaledWidth / 2, 0, 2 * Math.PI);
            this.ctx.clip();
            
            // Draw user image
            this.ctx.drawImage(
                this.userImage,
                imageX,
                imageY,
                scaledWidth,
                scaledHeight
            );
            
            this.ctx.restore();
        }
        
        // Draw border image on top
        if (this.borderImage) {
            this.ctx.drawImage(this.borderImage, 0, 0, this.canvas.width, this.canvas.height);
        }
    }

    downloadImage() {
        if (!this.userImage) {
            alert('Please upload an image first');
            return;
        }

        // Create a higher resolution canvas for download
        const downloadCanvas = document.createElement('canvas');
        const downloadCtx = downloadCanvas.getContext('2d');
        const resolution = 1000; // Higher resolution for download
        
        downloadCanvas.width = resolution;
        downloadCanvas.height = resolution;
        
        // Draw on high-res canvas
        if (this.userImage) {
            const imageSize = Math.min(resolution - 200, 700); // Proportional to 500px canvas
            const scaledWidth = imageSize * this.imageScale;
            const scaledHeight = imageSize * this.imageScale;
            
            const centerX = resolution / 2;
            const centerY = resolution / 2;
            const imageX = centerX - scaledWidth / 2 + (this.imagePosition.x * 2); // Scale position
            const imageY = centerY - scaledHeight / 2 + (this.imagePosition.y * 2);
            
            // Create circular clipping path
            downloadCtx.save();
            downloadCtx.beginPath();
            downloadCtx.arc(centerX + (this.imagePosition.x * 2), centerY + (this.imagePosition.y * 2), scaledWidth / 2, 0, 2 * Math.PI);
            downloadCtx.clip();
            
            // Draw user image
            downloadCtx.drawImage(
                this.userImage,
                imageX,
                imageY,
                scaledWidth,
                scaledHeight
            );
            
            downloadCtx.restore();
        }
        
        // Draw border
        if (this.borderImage) {
            downloadCtx.drawImage(this.borderImage, 0, 0, resolution, resolution);
        }
        
        // Download the image
        downloadCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'naval-insignia.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new NavalInsigniaCreator();
});
