const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const https = require('https');
const { spawn } = require('child_process');
const util = require('util');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '../uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// --- Data Handling ---
const DATA_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const IMAGES_FILE = path.join(DATA_DIR, 'images.json');
const INTERACTIONS_FILE = path.join(DATA_DIR, 'interactions.json');

function readData(file) {
    try {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify([]));
            return [];
        }
        const data = fs.readFileSync(file, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        console.error(`Error reading data from ${file}:`, err);
        return [];
    }
}

function writeData(file, data) {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing data to ${file}:`, err);
        throw err;
    }
}

// Function to extract features from an image using Python script
function extractFeatures(imagePath) {
    return new Promise((resolve, reject) => {
        // Add a small delay to prevent overwhelming the system
        setTimeout(() => {
            // Path to the Python feature extractor script
            const scriptPath = path.join(__dirname, '../ml/feature_extractor.py');
            
            // Use the virtual environment's Python executable
            const pythonExecutable = path.join(__dirname, '../ml/venv/Scripts/python.exe');
            // Fallback to 'python' if the specific path doesn't exist
            const pythonCmd = fs.existsSync(pythonExecutable) ? pythonExecutable : 'python';
            
            // Check if the script exists
            if (!fs.existsSync(scriptPath)) {
                console.error(`[FEATURES] Python script not found at ${scriptPath}`);
                return resolve({ error: 'Feature extractor script not found' });
            }
            
            // Check if the image file exists
            if (!fs.existsSync(imagePath)) {
                console.error(`[FEATURES] Image file not found at ${imagePath}`);
                return resolve({ error: 'Image file not found' });
            }
            
            // Spawn the Python process
            const python = spawn(pythonCmd, [scriptPath, imagePath]);
            
            let stdout = '';
            let stderr = '';
            
            // Set a timeout for the Python process
            const timeout = setTimeout(() => {
                console.error(`[FEATURES] Python script timed out for ${imagePath}`);
                python.kill(); // Kill the process
                resolve({ error: 'Feature extraction timed out - dlib may not be properly installed' });
            }, 30000); // 30 second timeout for enhanced features
            
            python.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            
            python.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            
            python.on('close', (code) => {
                clearTimeout(timeout); // Clear the timeout
                
                if (code !== 0) {
                    console.error(`[FEATURES] Python script exited with code ${code}`);
                    console.error(`[FEATURES] Stderr: ${stderr}`);
                    return resolve({ error: `Feature extraction failed with code ${code}`, stderr: stderr });
                }
                
                try {
                    // Handle empty stdout
                    if (!stdout.trim()) {
                        console.error(`[FEATURES] Python script returned empty output`);
                        return resolve({ error: 'Feature extraction returned no output' });
                    }
                    
                    const features = JSON.parse(stdout);
                    
                    // Check if dlib is available
                    if (features.error && features.error.includes("dlib")) {
                        console.error(`[FEATURES] dlib not available: ${features.error}`);
                        return resolve({ error: 'dlib not available for enhanced feature extraction' });
                    }
                    
                    resolve(features);
                } catch (err) {
                    console.error(`[FEATURES] Error parsing Python output: ${err.message}`);
                    console.error(`[FEATURES] Stdout: ${stdout}`);
                    resolve({ error: 'Failed to parse feature extraction results', output: stdout });
                }
            });
            
            python.on('error', (err) => {
                clearTimeout(timeout); // Clear the timeout
                console.error(`[FEATURES] Failed to start Python process: ${err.message}`);
                resolve({ error: 'Failed to start feature extraction process', details: err.message });
            });
        }, 100); // 100ms delay
    });
}

// --- AI Image Generation ---
let aiImageGenerationInterval;

// Simple AI image generator - downloads images and registers them
async function generateAIImage() {
    return new Promise((resolve, reject) => {
        // Generate a unique filename
        const filename = `ai-face-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        const filepath = path.join(__dirname, '../uploads', filename);
        
        console.log(`[AI] Generating AI image: ${filename}`);
        
        // Fetch image from thispersondoesnotexist.com
        https.get('https://thispersondoesnotexist.com', (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to fetch image: ${response.statusCode}`));
                return;
            }
            
            // Save to file
            const fileStream = fs.createWriteStream(filepath);
            response.pipe(fileStream);
            
            fileStream.on('finish', () => {
                fileStream.close();
                
                // Verify file was saved
                if (!fs.existsSync(filepath)) {
                    reject(new Error('Failed to save image file'));
                    return;
                }
                
                const stats = fs.statSync(filepath);
                if (stats.size === 0) {
                    fs.unlinkSync(filepath);
                    reject(new Error('Downloaded file is empty'));
                    return;
                }
                
                console.log(`[AI] Image saved: ${filename} (${stats.size} bytes)`);
                
                // Extract features for the image
                extractFeatures(filepath).then(features => {
                    // Register in data file
                    try {
                        const images = readData(IMAGES_FILE);
                        
                        // Ensure features is an object
                        const safeFeatures = features && typeof features === 'object' && !features.error ? features : { 
                            error: features && features.error ? features.error : 'Feature extraction failed',
                            has_face: false,
                            avg_color: { r: 0, g: 0, b: 0 }
                        };
                        
                        const newImage = {
                            id: `ai-${Date.now()}`,
                            filename: filename,
                            originalName: 'AI Generated Face',
                            path: `/uploads/${filename}`,
                            uploaderId: 'system',
                            uploadTimestamp: new Date().toISOString(),
                            isAI: true,
                            likenessProbability: 0.5 + (Math.random() * 0.5),
                            features: safeFeatures
                        };
                        
                        images.push(newImage);
                        writeData(IMAGES_FILE, images);
                        
                        console.log(`[AI] Registered image: ${filename}`);
                        resolve(newImage);
                    } catch (err) {
                        reject(err);
                    }
                }).catch(err => {
                    console.error('[AI] Feature extraction failed:', err);
                    // Still register the image but with error features
                    try {
                        const images = readData(IMAGES_FILE);
                        
                        const newImage = {
                            id: `ai-${Date.now()}`,
                            filename: filename,
                            originalName: 'AI Generated Face',
                            path: `/uploads/${filename}`,
                            uploaderId: 'system',
                            uploadTimestamp: new Date().toISOString(),
                            isAI: true,
                            likenessProbability: 0.5 + (Math.random() * 0.5),
                            features: { 
                                error: 'Feature extraction failed',
                                has_face: false,
                                avg_color: { r: 0, g: 0, b: 0 }
                            }
                        };
                        
                        images.push(newImage);
                        writeData(IMAGES_FILE, images);
                        
                        console.log(`[AI] Registered image with error features: ${filename}`);
                        resolve(newImage);
                    } catch (writeErr) {
                        reject(writeErr);
                    }
                });
            });
            
            fileStream.on('error', (err) => {
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Start automatic AI image generation
function startAIImageGeneration() {
    // Generate AI image every 30 seconds (for testing)
    const interval = 30000;
    
    aiImageGenerationInterval = setInterval(async () => {
        try {
            console.log('[AI] Auto-generating new AI image...');
            await generateAIImage();
            console.log('[AI] Auto-generation completed');
        } catch (err) {
            console.error('[AI] Auto-generation failed:', err.message);
        }
    }, interval);
    
    console.log(`[AI] Started auto-generation (every ${interval/1000} seconds)`);
    
    // Generate first image immediately
    setTimeout(async () => {
        try {
            console.log('[AI] Generating first AI image...');
            await generateAIImage();
            console.log('[AI] First image generated');
        } catch (err) {
            console.error('[AI] First image generation failed:', err.message);
        }
    }, 3000);
}

// Function to update existing images with missing or placeholder features
async function updateImagesWithMissingFeatures() {
    try {
        console.log('[INIT] Checking for images with missing features...');
        const images = readData(IMAGES_FILE);
        let updated = false;
        
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            
            // Check if features are missing, placeholder, or error
            if (!img.features || 
                (typeof img.features === 'object' && img.features.test === true) ||
                (typeof img.features === 'object' && img.features.error) ||
                (typeof img.features === 'object' && Object.keys(img.features).length === 1 && img.features.hasOwnProperty('error'))) {
                
                console.log(`[INIT] Updating features for image: ${img.filename}`);
                
                // Extract features for the image
                const imagePath = path.join(__dirname, '..', img.path);
                const features = await extractFeatures(imagePath);
                
                // Ensure features is an object
                const safeFeatures = features && typeof features === 'object' && !features.error ? features : { 
                    error: features && features.error ? features.error : 'Feature extraction failed or skipped',
                    has_face: false,
                    avg_color: { r: 0, g: 0, b: 0 }
                };
                
                // Update the image with new features
                images[i].features = safeFeatures;
                updated = true;
            }
        }
        
        // Write updated images back to file if any changes were made
        if (updated) {
            writeData(IMAGES_FILE, images);
            console.log('[INIT] Updated images with missing features');
        } else {
            console.log('[INIT] No images needed feature updates');
        }
    } catch (err) {
        console.error('[INIT] Error updating images with missing features:', err);
    }
}

// Function to clean up test or invalid images
function cleanUpImages() {
    try {
        console.log('[INIT] Cleaning up test or invalid images...');
        const images = readData(IMAGES_FILE);
        const interactions = readData(INTERACTIONS_FILE);
        
        // Filter out test images
        const validImages = images.filter(img => 
            img.features && 
            !img.features.test && 
            img.id && 
            img.filename && 
            img.path
        );
        
        // Update interactions to remove references to invalid images
        const validImageIds = validImages.map(img => img.id);
        const validInteractions = interactions.filter(interaction => 
            validImageIds.includes(interaction.imageId)
        );
        
        // Check if we need to update the files
        if (validImages.length !== images.length || validInteractions.length !== interactions.length) {
            writeData(IMAGES_FILE, validImages);
            writeData(INTERACTIONS_FILE, validInteractions);
            console.log(`[INIT] Cleaned up ${images.length - validImages.length} invalid images and ${interactions.length - validInteractions.length} invalid interactions`);
        } else {
            console.log('[INIT] No cleanup needed');
        }
    } catch (err) {
        console.error('[INIT] Error cleaning up images:', err);
    }
}

// --- Routes ---

// Simulated Login
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }
    
    let users = readData(USERS_FILE);
    let user = users.find(u => u.username === username);
    
    if (!user) {
        user = { id: Date.now().toString(), username };
        users.push(user);
        writeData(USERS_FILE, users);
    }
    
    res.json({ message: 'Logged in', user });
});

// Get Images Feed
app.get('/api/images/:userId', (req, res) => {
    const { userId } = req.params;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
        const images = readData(IMAGES_FILE);
        const interactions = readData(INTERACTIONS_FILE);
        
        // Get user's interactions
        const userInteractions = interactions.filter(i => i.userId === userId);
        const userInteractionMap = {};
        userInteractions.forEach(i => {
            userInteractionMap[i.imageId] = i.action;
        });
        
        // Categorize images
        const needsAction = [];
        const actionTaken = [];
        
        images.forEach(img => {
            const userAction = userInteractionMap[img.id] || null;
            const processedImage = {
                ...img,
                userAction,
                likenessProbability: img.likenessProbability || 0.5
            };
            
            if (userAction) {
                actionTaken.push(processedImage);
            } else {
                needsAction.push(processedImage);
            }
        });
        
        // Sort both arrays by newest first
        needsAction.sort((a, b) => new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp));
        actionTaken.sort((a, b) => new Date(b.uploadTimestamp) - new Date(a.uploadTimestamp));
        
        console.log(`[FEED] Sending ${needsAction.length} needs-action and ${actionTaken.length} action-taken images to user ${userId}`);
        res.json({ needsAction, actionTaken });
    } catch (error) {
        console.error('[FEED] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Like/Dislike Image
app.post('/api/interact', (req, res) => {
    const { userId, imageId, action } = req.body;
    
    if (!userId || !imageId || !action) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (action !== 'like' && action !== 'dislike') {
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    try {
        const interactions = readData(INTERACTIONS_FILE);
        
        // Check if already interacted
        const existing = interactions.find(i => i.userId === userId && i.imageId === imageId);
        if (existing) {
            return res.status(400).json({ error: 'Already interacted with this image' });
        }
        
        // Record interaction
        const newInteraction = {
            id: Date.now().toString(),
            userId,
            imageId,
            action,
            timestamp: new Date().toISOString()
        };
        
        interactions.push(newInteraction);
        writeData(INTERACTIONS_FILE, interactions);
        
        res.json({ message: `Image ${action}d`, interaction: newInteraction });
    } catch (error) {
        console.error('[INTERACT] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Manual AI image generation endpoint
app.post('/api/generate-ai-image', async (req, res) => {
    try {
        console.log('[MANUAL] Generating AI image...');
        const image = await generateAIImage();
        res.json({ message: 'AI image generated', image });
    } catch (err) {
        console.error('[MANUAL] Error:', err);
        res.status(500).json({ error: 'Failed to generate AI image' });
    }
});

// Upload endpoint
app.post('/api/upload', upload.single('image'), async (req, res) => {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Extract features for the uploaded image
        const imagePath = path.join(__dirname, '../uploads', req.file.filename);
        const features = await extractFeatures(imagePath);
        
        // Ensure features is an object
        const safeFeatures = features && typeof features === 'object' && !features.error ? features : { 
            error: features && features.error ? features.error : 'Feature extraction failed',
            has_face: false,
            avg_color: { r: 0, g: 0, b: 0 }
        };
        
        // Save image data
        const images = readData(IMAGES_FILE);
        const newImage = {
            id: `user-${Date.now()}`,
            filename: req.file.filename,
            originalName: req.file.originalname,
            path: `/uploads/${req.file.filename}`,
            uploaderId: userId,
            uploadTimestamp: new Date().toISOString(),
            isAI: false,
            features: safeFeatures
        };
        
        images.push(newImage);
        writeData(IMAGES_FILE, images);
        
        res.json({ message: 'Image uploaded successfully', image: newImage });
    } catch (error) {
        console.error('[UPLOAD] Error:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
    try {
        const users = readData(USERS_FILE);
        const images = readData(IMAGES_FILE);
        const interactions = readData(INTERACTIONS_FILE);
        
        res.json({
            users: users.length,
            images: images.length,
            interactions: interactions.length,
            aiImages: images.filter(i => i.isAI).length,
            userImages: images.filter(i => !i.isAI).length
        });
    } catch (err) {
        res.status(500).json({ error: 'Debug failed' });
    }
});

// Model Stats endpoint
app.get('/api/model-stats/:userId', (req, res) => {
    const { userId } = req.params;
    
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }
    
    try {
        const images = readData(IMAGES_FILE);
        const interactions = readData(INTERACTIONS_FILE);
        const users = readData(USERS_FILE);
        
        // Find user
        const user = users.find(u => u.id === userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Calculate stats
        const userInteractions = interactions.filter(i => i.userId === userId);
        const likes = userInteractions.filter(i => i.action === 'like').length;
        const dislikes = userInteractions.filter(i => i.action === 'dislike').length;
        const totalInteractions = userInteractions.length;
        
        const userUploadedImages = images.filter(i => i.uploaderId === userId).length;
        
        // Simulate model status based on interaction count
        // For a real implementation, this would check if a model file exists for the user
        const modelExists = totalInteractions >= 5; // Require at least 5 interactions to consider model "trained"
        
        const stats = {
            totalInteractions,
            likes,
            dislikes,
            uploadedImages: userUploadedImages,
            modelExists
        };
        
        res.json(stats);
    } catch (error) {
        console.error('[MODEL STATS] Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`=== HORA-LIKER BACKEND SERVER STARTED ===`);
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Initialize data files
    [USERS_FILE, IMAGES_FILE, INTERACTIONS_FILE].forEach(file => {
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, JSON.stringify([]));
            console.log(`[INIT] Created ${path.basename(file)}`);
        }
    });
    
    // Clean up test or invalid images
    cleanUpImages();
    
    // Update existing images with missing features
    updateImagesWithMissingFeatures();
    
    // Start AI image generation
    startAIImageGeneration();
    
    console.log('=== SERVER READY ===');
});

module.exports = app;