document.addEventListener('DOMContentLoaded', function() {
    // Shape definitions
    const shapes = {
        square: {
            name: 'square',
            color: '#4ade80', // green
            render: (container) => {
                const square = document.createElement('div');
                square.className = 'shape';
                square.style.width = '80px';
                square.style.height = '80px';
                square.style.backgroundColor = shapes.square.color;
                square.style.borderRadius = '4px';
                container.appendChild(square);
                return square;
            }
        },
        circle: {
            name: 'circle',
            color: '#60a5fa', // blue
            render: (container) => {
                const circle = document.createElement('div');
                circle.className = 'shape';
                circle.style.width = '80px';
                circle.style.height = '80px';
                circle.style.backgroundColor = shapes.circle.color;
                circle.style.borderRadius = '50%';
                container.appendChild(circle);
                return circle;
            }
        },
        triangle: {
            name: 'triangle',
            color: '#f97316', // orange
            render: (container) => {
                const triangle = document.createElement('div');
                triangle.className = 'shape';
                triangle.style.width = '0';
                triangle.style.height = '0';
                triangle.style.borderLeft = '40px solid transparent';
                triangle.style.borderRight = '40px solid transparent';
                triangle.style.borderBottom = `70px solid ${shapes.triangle.color}`;
                container.appendChild(triangle);
                return triangle;
            }
        },
        star: {
            name: 'star',
            color: '#a5b4fc', // light purple
            render: (container) => {
                const star = document.createElement('div');
                star.className = 'shape';
                star.innerHTML = `
                    <svg width="80" height="80" viewBox="0 0 24 24">
                        <path fill="${shapes.star.color}" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                    </svg>
                `;
                container.appendChild(star);
                return star;
            }
        },
        hexagon: {
            name: 'hexagon',
            color: '#f472b6', // pink
            render: (container) => {
                const hexagon = document.createElement('div');
                hexagon.className = 'shape';
                hexagon.innerHTML = `
                    <svg width="80" height="80" viewBox="0 0 24 24">
                        <path fill="${shapes.hexagon.color}" d="M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z" />
                    </svg>
                `;
                container.appendChild(hexagon);
                return hexagon;
            }
        },
        diamond: {
            name: 'diamond',
            color: '#facc15', // yellow
            render: (container) => {
                const diamond = document.createElement('div');
                diamond.className = 'shape';
                diamond.style.width = '80px';
                diamond.style.height = '80px';
                diamond.style.backgroundColor = shapes.diamond.color;
                diamond.style.transform = 'rotate(45deg)';
                container.appendChild(diamond);
                return diamond;
            }
        }
    };

    // DOM elements
    const targetContainer = document.getElementById('target-container');
    const optionsContainer = document.getElementById('options-container');
    const dropArea = document.getElementById('drop-area');
    const verifyBtn = document.getElementById('verify-btn');
    const verificationResult = document.getElementById('verification-result');

    // State variables
    let targetShape = '';
    let draggedShape = null;
    let isCorrect = null;
    let dragStartTime = null;
    let mouseMovements = [];
    let hesitations = 0;
    let lastMousePos = null;
    let lastMoveTime = null;

    // Generate random shapes
    function initializeVerification() {
        // Clear containers
        targetContainer.innerHTML = '';
        optionsContainer.innerHTML = '';
        dropArea.innerHTML = '<span class="text-gray-500 font-medium">Drop Here</span>';
        dropArea.className = 'border-2 border-dashed border-gray-400 rounded-lg w-40 h-40 flex items-center justify-center';
        verificationResult.classList.add('hidden');
        verifyBtn.disabled = true;
        isCorrect = null;

        // Get all shape names
        const shapeNames = Object.keys(shapes);
        
        // Select random target shape
        targetShape = shapeNames[Math.floor(Math.random() * shapeNames.length)];
        
        // Render target shape
        shapes[targetShape].render(targetContainer);
        
        // Create options array with the target and 2 other random shapes
        let options = [targetShape];
        while (options.length < 3) {
            const randomShape = shapeNames[Math.floor(Math.random() * shapeNames.length)];
            if (!options.includes(randomShape)) {
                options.push(randomShape);
            }
        }
        
        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);
        
        // Render options
        options.forEach(shapeName => {
            const shapeContainer = document.createElement('div');
            shapeContainer.draggable = true;
            shapeContainer.dataset.shape = shapeName;
            shapeContainer.className = 'cursor-grab active:cursor-grabbing transition-transform hover:scale-105';
            
            // Add drag event listeners
            shapeContainer.addEventListener('dragstart', handleDragStart);
            
            // Render shape
            shapes[shapeName].render(shapeContainer);
            
            optionsContainer.appendChild(shapeContainer);
        });
    }

    // Handle drag start
    function handleDragStart(e) {
        draggedShape = e.currentTarget.dataset.shape;
        dragStartTime = Date.now();
        mouseMovements = [];
        hesitations = 0;
        lastMousePos = null;
        lastMoveTime = null;
        
        // Set drag image (optional)
        if (e.dataTransfer) {
            e.dataTransfer.setData('text/plain', draggedShape);
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    // Handle mouse move during drag
    document.addEventListener('mousemove', function(e) {
        if (draggedShape) {
            const currentTime = Date.now();
            
            // Track mouse movements
            if (lastMousePos) {
                const dx = e.clientX - lastMousePos.x;
                const dy = e.clientY - lastMousePos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                mouseMovements.push(distance);
                
                // Detect hesitations (very slow movement)
                if (lastMoveTime && currentTime - lastMoveTime > 300 && distance < 5) {
                    hesitations++;
                }
            }
            
            lastMousePos = { x: e.clientX, y: e.clientY };
            lastMoveTime = currentTime;
        }
    });

    // Handle drag over
    dropArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('highlight');
    });

    // Handle drag leave
    dropArea.addEventListener('dragleave', function() {
        this.classList.remove('highlight');
    });

    // Handle drop
    dropArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('highlight');
        
        if (draggedShape) {
            // Clear drop area
            this.innerHTML = '';
            
            // Render the dropped shape in the drop area
            shapes[draggedShape].render(this);
            
            // Check if correct
            isCorrect = draggedShape === targetShape;
            
            // Update UI based on correctness
            if (isCorrect) {
                this.classList.add('correct');
                this.classList.remove('incorrect');
                
                // Add success message
                const successMsg = document.createElement('div');
                successMsg.className = 'flex items-center text-green-600 font-medium mt-2';
                successMsg.innerHTML = `
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Correct Shape!</span>
                `;
                this.appendChild(successMsg);
                
                // Enable verify button
                verifyBtn.disabled = false;
            } else {
                this.classList.add('incorrect');
                this.classList.remove('correct');
                
                // Add error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'flex items-center text-red-600 font-medium mt-2';
                errorMsg.innerHTML = `
                    <svg class="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Try Again</span>
                `;
                this.appendChild(errorMsg);
            }
            
            draggedShape = null;
        }
    });

    // Handle verification
    verifyBtn.addEventListener('click', async function() {
        if (isCorrect) {
            // Calculate metrics for ML model
            const dragDuration = Date.now() - dragStartTime;
            const avgMovement = mouseMovements.length > 0 
                ? mouseMovements.reduce((sum, val) => sum + val, 0) / mouseMovements.length 
                : 0;
            
            // Prepare data for the backend
            const data = {
                dragDuration,
                mouseMovements,
                hesitations,
                avgMovement,
                correctMatch: isCorrect
            };
            
            try {
                // Send data to backend for ML model processing
                const response = await fetch('/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const result = await response.json();
                
                // Show verification result
                verificationResult.classList.remove('hidden');
                
                if (result.isHuman) {
                    verificationResult.className = 'verification-result success';
                    verificationResult.innerHTML = `
                        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Human Verified! Redirecting...</span>
                    `;
                    
                    // Log the features used for classification
                    console.log('Classification features:', result.features);
                    
                    // Redirect to dashboard after a short delay
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 2000);
                } else {
                    verificationResult.className = 'verification-result error';
                    verificationResult.innerHTML = `
                        <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Verification failed. Please try again.</span>
                    `;
                    
                    // Log the features used for classification
                    console.log('Classification features:', result.features);
                    
                    // Reset verification after a short delay
                    setTimeout(initializeVerification, 2000);
                }
            } catch (error) {
                console.error('Error:', error);
                
                // Show error message
                verificationResult.classList.remove('hidden');
                verificationResult.className = 'verification-result error';
                verificationResult.innerHTML = `
                    <svg class="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>An error occurred. Please try again.</span>
                `;
                
                // Reset verification after a short delay
                setTimeout(initializeVerification, 2000);
            }
        }
    });

    // Initialize verification on page load
    initializeVerification();
});