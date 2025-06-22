// Naval Insignia Creator - Fixed for proper border extraction
class NavalInsigniaCreator {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.userImage = null;
        this.borderImage = null;
        this.borderTemplate = 'IMG_9976.png'; // Use one image as the border template
        this.imagePosition = { x: 0, y: 0 };
        this.imageScale = 0.8;
        this.imageRotation = 0;
        this.init();
    }

    init() {
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Initialize event handlers
        this.initializeEventHandlers();
        
        // Load border template
        this.loadBorderTemplate();
        
        // Draw initial state (just the border)
        this.drawCanvas();
    }

    initializeEventHandlers() {
        // Upload area click handler
        const uploadArea = document.getElementById('upload-area');
        const imageUpload = document.getElementById('image-upload');
        
        if (uploadArea && imageUpload) {
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
        }

        // Control handlers
        const posX = document.getElementById('pos-x');
        const posY = document.getElementById('pos-y');
        const scale = document.getElementById('scale');
        const rotation = document.getElementById('rotation');

        if (posX) {
            posX.addEventListener('input', (e) => {
                this.imagePosition.x = parseInt(e.target.value);
                const valueSpan = document.getElementById('pos-x-value');
                if (valueSpan) valueSpan.textContent = e.target.value;
                this.drawCanvas();
            });
        }

        if (posY) {
            posY.addEventListener('input', (e) => {
                this.imagePosition.y = parseInt(e.target.value);
                const valueSpan = document.getElementById('pos-y-value');
                if (valueSpan) valueSpan.textContent = e.target.value;
                this.drawCanvas();
            });
        }

        if (scale) {
            scale.addEventListener('input', (e) => {
                this.imageScale = parseFloat(e.target.value);
                const valueSpan = document.getElementById('scale-value');
                if (valueSpan) valueSpan.textContent = e.target.value;
                this.drawCanvas();
            });
        }

        if (rotation) {
            rotation.addEventListener('input', (e) => {
                this.imageRotation = parseInt(e.target.value);
                const valueSpan = document.getElementById('rotation-value');
                if (valueSpan) valueSpan.textContent = e.target.value + '°';
                this.drawCanvas();
            });
        }

        // Download button
        const downloadBtn = document.getElementById('download-btn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => {
                this.downloadImage();
            });
        }
    }

    loadBorderTemplate() {
        this.borderImage = new Image();
        this.borderImage.onload = () => {
            console.log('Border image loaded successfully');
            this.drawCanvas();
        };
        this.borderImage.onerror = () => {
            console.error('Failed to load border image:', this.borderTemplate);
        };
        this.borderImage.src = this.borderTemplate;
    }

    handleImageUpload(file) {
        console.log('Handling image upload:', file.name);
        
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (JPG, PNG, GIF)');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.userImage = new Image();
            this.userImage.onload = () => {
                console.log('User image loaded successfully');
                
                // Show controls
                const controls = document.querySelector('.canvas-controls');
                if (controls) {
                    controls.style.display = 'block';
                }
                
                const downloadBtn = document.getElementById('download-btn');
                if (downloadBtn) {
                    downloadBtn.disabled = false;
                }
                
                // Update upload area
                const uploadArea = document.getElementById('upload-area');
                if (uploadArea) {
                    uploadArea.innerHTML = `
                        <div class="upload-content">
                            <div class="upload-icon">✅</div>
                            <p>Image uploaded successfully!</p>
                            <small>Click to upload a different image</small>
                        </div>
                    `;
                }
                
                this.drawCanvas();
            };
            this.userImage.onerror = () => {
                console.error('Failed to load user image');
                alert('Failed to load the uploaded image');
            };
            this.userImage.src = e.target.result;
        };
        reader.onerror = () => {
            console.error('Failed to read file');
            alert('Failed to read the uploaded file');
        };
        reader.readAsDataURL(file);
    }

    drawCanvas() {
        if (!this.canvas || !this.ctx) {
            console.error('Canvas not initialized');
            return;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Fill with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.userImage) {
            // Define the circular area for the user image
            // Based on the technical description: center at (50%, 60%) with radius ~18% of width
            const canvasSize = 500;
            const centerX = canvasSize * 0.5;  // 50% from left
            const centerY = canvasSize * 0.6;  // 60% from top
            const radius = canvasSize * 0.18;  // 18% radius to fit within the rope border
            
            // Save context for clipping
            this.ctx.save();
            
            // Create circular clipping path
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            this.ctx.clip();
            
            // Calculate image dimensions
            const scaledRadius = radius * this.imageScale;
            const imageX = centerX - scaledRadius + this.imagePosition.x;
            const imageY = centerY - scaledRadius + this.imagePosition.y;
            const imageSize = scaledRadius * 2;
            
            // Apply rotation if specified
            if (this.imageRotation !== 0) {
                this.ctx.translate(centerX + this.imagePosition.x, centerY + this.imagePosition.y);
                this.ctx.rotate((this.imageRotation * Math.PI) / 180);
                this.ctx.translate(-(centerX + this.imagePosition.x), -(centerY + this.imagePosition.y));
            }
            
            // Draw user image within the circular clip
            this.ctx.drawImage(
                this.userImage,
                imageX,
                imageY,
                imageSize,
                imageSize
            );
            
            // Restore context
            this.ctx.restore();
        }
        
        // Draw border template on top
        if (this.borderImage) {
            this.ctx.drawImage(this.borderImage, 0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Draw placeholder if border not loaded
            this.ctx.strokeStyle = '#bfa140';
            this.ctx.lineWidth = 3;
            this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
            
            this.ctx.fillStyle = '#bfa140';
            this.ctx.font = '20px Space Grotesk';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('Loading Naval Border...', this.canvas.width / 2, this.canvas.height / 2);
        }
    }

    downloadImage() {
        if (!this.userImage) {
            alert('Please upload an image first');
            return;
        }

        if (!this.borderImage) {
            alert('Border template is still loading, please wait...');
            return;
        }

        // Create a higher resolution canvas for download
        const downloadCanvas = document.createElement('canvas');
        const downloadCtx = downloadCanvas.getContext('2d');
        const resolution = 1000; // Higher resolution for download
        const scale = resolution / 500; // Scale factor
        
        downloadCanvas.width = resolution;
        downloadCanvas.height = resolution;
        
        // Fill with white background
        downloadCtx.fillStyle = '#ffffff';
        downloadCtx.fillRect(0, 0, resolution, resolution);
        
        // Draw user image with higher resolution
        if (this.userImage) {
            const centerX = resolution * 0.5;
            const centerY = resolution * 0.6;
            const radius = resolution * 0.18;
            
            // Save context for clipping
            downloadCtx.save();
            
            // Create circular clipping path
            downloadCtx.beginPath();
            downloadCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            downloadCtx.clip();
            
            // Calculate scaled image dimensions
            const scaledRadius = radius * this.imageScale;
            const imageX = centerX - scaledRadius + (this.imagePosition.x * scale);
            const imageY = centerY - scaledRadius + (this.imagePosition.y * scale);
            const imageSize = scaledRadius * 2;
            
            // Apply rotation if specified
            if (this.imageRotation !== 0) {
                downloadCtx.translate(centerX + (this.imagePosition.x * scale), centerY + (this.imagePosition.y * scale));
                downloadCtx.rotate((this.imageRotation * Math.PI) / 180);
                downloadCtx.translate(-(centerX + (this.imagePosition.x * scale)), -(centerY + (this.imagePosition.y * scale)));
            }
            
            // Draw user image
            downloadCtx.drawImage(
                this.userImage,
                imageX,
                imageY,
                imageSize,
                imageSize
            );
            
            downloadCtx.restore();
        }
        
        // Draw border at high resolution
        if (this.borderImage) {
            downloadCtx.drawImage(this.borderImage, 0, 0, resolution, resolution);
        }
        
        // Download the image
        downloadCanvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'kraken-naval-insignia.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 'image/png');
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Naval Insignia Creator...');
    new NavalInsigniaCreator();
});
