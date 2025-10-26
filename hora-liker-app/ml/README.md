# Enhanced Facial Feature Extraction

This document explains how to set up and use the enhanced facial feature extraction capabilities in Hora-Liker.

## Prerequisites

1. **Python 3.7 or higher**
2. **CMake 3.1 or higher** (required for dlib compilation)
3. **Visual Studio Build Tools** (for Windows users)

## Setup

The enhanced feature extraction uses dlib for more accurate facial landmark detection. To set it up:

1. Install CMake from https://cmake.org/download/
2. Add CMake to your system PATH
3. Run the main setup script: `setup.bat`
4. This will automatically:
   - Install all required Python dependencies including dlib
   - Download the dlib facial landmark predictor model (approx. 60MB)

## Features Extracted

The enhanced feature extractor now extracts the following detailed facial features:

1. **Face Detection**
   - Presence of face(s)
   - Number of faces detected
   - Face bounding box coordinates

2. **Detailed Facial Landmarks**
   - 68-point facial landmark detection
   - Precise positioning of facial features

3. **Face Geometry**
   - Face width and height
   - Face aspect ratio
   - Eye distance
   - Eye to mouth distance
   - Jaw width
   - Forehead width

4. **Skin Tone Analysis**
   - Average color in BGR, HSV, and LAB color spaces
   - Dominant skin tone color

5. **Eye Features**
   - Individual eye bounding boxes
   - Eye aspect ratios
   - Eye areas
   - Eye symmetry measurements

6. **Mouth Features**
   - Mouth bounding box
   - Mouth aspect ratio
   - Outer and inner mouth areas
   - Lip thickness

7. **Nose Features**
   - Nose bounding box
   - Nose width and height
   - Nose aspect ratio
   - Nose area

## Manual Installation (if setup.bat fails)

If the automatic setup fails, you can manually install the dependencies:

1. Create a virtual environment:
   ```
   python -m venv venv
   call venv\Scripts\activate.bat
   ```

2. Install dependencies:
   ```
   pip install numpy opencv-python scikit-learn dlib imutils
   ```

3. Download the dlib model:
   - Go to http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
   - Download the file
   - Extract it using 7-Zip or similar tool
   - Place the .dat file in the ml directory

4. Verify installation:
   ```
   python check_dlib.py
   ```

## Troubleshooting

### Common Issues

1. **CMake not found**: 
   - Ensure CMake is installed and added to PATH
   - Restart your command prompt after installing CMake

2. **Visual Studio Build Tools missing**:
   - Download and install "Microsoft C++ Build Tools" from https://visualstudio.microsoft.com/visual-cpp-build-tools/
   - During installation, select "C++ build tools" workload

3. **dlib installation fails**:
   - Try: `pip install cmake` followed by `pip install dlib`
   - Or download a pre-compiled wheel file

4. **Model download fails**:
   - Manually download from http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2
   - Extract and place in the ml directory

### Verifying Installation

Run the check script to verify everything is working:
```
python check_dlib.py
```

## Performance Note

The enhanced feature extraction is more computationally intensive than the basic version. 
Feature extraction for each image may take 1-5 seconds depending on your system.

The enhanced features are required for accurate likeness probability predictions.