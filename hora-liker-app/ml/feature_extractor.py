import cv2
import numpy as np
import json
import sys
import os

# Try to import dlib and imutils
try:
    import dlib
    from imutils import face_utils
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False
    print("Warning: dlib not available, using basic feature extraction", file=sys.stderr)

def extract_features(image_path):
    """
    Extracts detailed facial features from a portrait image.
    Features:
    - Face detection (boolean)
    - Face bounding box coordinates (if detected)
    - Detailed facial landmarks (68 points if dlib available, basic estimation otherwise)
    - Color histogram (average RGB values)
    - Face geometry features (distances, ratios)
    - Skin tone analysis
    """
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            return {"error": "File not found"}
            
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            return {"error": "Could not read image"}
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Use dlib if available, otherwise fallback to basic method
        if DLIB_AVAILABLE:
            return extract_features_dlib(image, gray)
        else:
            return extract_features_basic(image, gray)
    except Exception as e:
        return {"error": f"Exception in feature extraction: {str(e)}"}

def extract_features_dlib(image, gray):
    """Feature extraction using dlib for enhanced accuracy"""
    try:
        # Initialize dlib's face detector and facial landmark predictor
        detector_path = os.path.join(os.path.dirname(__file__), "shape_predictor_68_face_landmarks.dat")
        
        if not os.path.exists(detector_path):
            return {"error": "dlib shape predictor model not found"}
        
        detector = dlib.get_frontal_face_detector()
        predictor = dlib.shape_predictor(detector_path)
        
        # Detect faces
        rects = detector(gray, 1)
        
        features = {
            "has_face": len(rects) > 0,
            "face_count": len(rects),
            "face_bbox": None,
            "landmarks": None,
            "face_geometry": None,
            "avg_color": None,
            "skin_tone": None,
            "eye_features": None,
            "mouth_features": None,
            "nose_features": None
        }
        
        if len(rects) > 0:
            # For simplicity, take the first detected face
            rect = rects[0]
            
            # Face bounding box
            features["face_bbox"] = {
                "x": int(rect.left()),
                "y": int(rect.top()),
                "width": int(rect.width()),
                "height": int(rect.height())
            }
            
            # Extract facial landmarks
            shape = predictor(gray, rect)
            shape = face_utils.shape_to_np(shape)
            
            # Convert landmarks to dictionary
            landmarks_dict = {}
            for i, (x, y) in enumerate(shape):
                landmarks_dict[f"point_{i}"] = {"x": int(x), "y": int(y)}
            
            features["landmarks"] = landmarks_dict
            
            # Extract region of interest (face)
            (x, y, w, h) = (rect.left(), rect.top(), rect.width(), rect.height())
            face_roi = image[max(0, y):min(image.shape[0], y+h), max(0, x):min(image.shape[1], x+w)]
            
            # --- Detailed Face Geometry Features ---
            features["face_geometry"] = extract_face_geometry(shape, image.shape)
            
            # --- Average Color ---
            avg_color_per_row = np.average(face_roi, axis=0)
            avg_color = np.average(avg_color_per_row, axis=0)
            features["avg_color"] = {
                "r": int(avg_color[2]),  # OpenCV uses BGR
                "g": int(avg_color[1]),
                "b": int(avg_color[0])
            }
            
            # --- Skin Tone Analysis ---
            features["skin_tone"] = analyze_skin_tone(face_roi)
            
            # --- Eye Features ---
            features["eye_features"] = extract_eye_features(shape)
            
            # --- Mouth Features ---
            features["mouth_features"] = extract_mouth_features(shape)
            
            # --- Nose Features ---
            features["nose_features"] = extract_nose_features(shape)
        else:
            # If no face, use whole image for color
            avg_color_per_row = np.average(image, axis=0)
            avg_color = np.average(avg_color_per_row, axis=0)
            features["avg_color"] = {
                "r": int(avg_color[2]),  # OpenCV uses BGR
                "g": int(avg_color[1]),
                "b": int(avg_color[0])
            }
            
        return features
    except Exception as e:
        return {"error": f"Exception in dlib feature extraction: {str(e)}"}

def extract_features_basic(image, gray):
    """Fallback feature extraction using Haar cascades"""
    try:
        # Load pre-trained Haar Cascade for face detection
        cascade_paths = [
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml',
            'haarcascade_frontalface_default.xml'
        ]
        
        face_cascade = None
        for cascade_path in cascade_paths:
            if os.path.exists(cascade_path):
                face_cascade = cv2.CascadeClassifier(cascade_path)
                break
        
        if face_cascade is None:
            return {"error": "Could not load face detection model"}
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))
        
        features = {
            "has_face": len(faces) > 0,
            "face_count": len(faces),
            "face_bbox": None,
            "landmarks": None,
            "face_geometry": None,
            "avg_color": None,
            "skin_tone": None,
            "eye_features": None,
            "mouth_features": None,
            "nose_features": None
        }
        
        if len(faces) > 0:
            # For simplicity, take the first detected face
            (x, y, w, h) = faces[0]
            features["face_bbox"] = {
                "x": int(x), "y": int(y), "width": int(w), "height": int(h)
            }
            
            # Extract region of interest (face)
            face_roi = image[y:y+h, x:x+w]
            
            # --- Basic Landmarks (simplified) ---
            landmarks_dict = {}
            for i in range(68):
                if i < 17:  # Jawline
                    landmarks_dict[f"point_{i}"] = {"x": int(x + (i/16.0) * w), "y": int(y + h)}
                elif i < 22:  # Right eyebrow
                    landmarks_dict[f"point_{i}"] = {"x": int(x + (0.2 + (i-17)/5.0 * 0.1) * w), "y": int(y + 0.2 * h)}
                elif i < 27:  # Left eyebrow
                    landmarks_dict[f"point_{i}"] = {"x": int(x + (0.7 + (i-22)/5.0 * 0.1) * w), "y": int(y + 0.2 * h)}
                elif i < 31:  # Nose bridge
                    landmarks_dict[f"point_{i}"] = {"x": int(x + w/2), "y": int(y + (0.3 + (i-27)/4.0 * 0.1) * h)}
                elif i < 36:  # Nose base
                    landmarks_dict[f"point_{i}"] = {"x": int(x + (0.4 + (i-31)/5.0 * 0.2) * w), "y": int(y + 0.5 * h)}
                elif i < 42:  # Right eye
                    angle = (i-36) * 60 / 6
                    landmarks_dict[f"point_{i}"] = {"x": int(x + 0.3 * w + 0.1 * w * np.cos(np.radians(angle))), 
                                                   "y": int(y + 0.4 * h + 0.1 * h * np.sin(np.radians(angle)))}
                elif i < 48:  # Left eye
                    angle = (i-42) * 60 / 6
                    landmarks_dict[f"point_{i}"] = {"x": int(x + 0.7 * w + 0.1 * w * np.cos(np.radians(angle))), 
                                                   "y": int(y + 0.4 * h + 0.1 * h * np.sin(np.radians(angle)))}
                elif i < 60:  # Outer mouth
                    angle = (i-48) * 360 / 12
                    landmarks_dict[f"point_{i}"] = {"x": int(x + w/2 + 0.2 * w * np.cos(np.radians(angle))), 
                                                   "y": int(y + 0.7 * h + 0.1 * h * np.sin(np.radians(angle)))}
                else:  # Inner mouth
                    angle = (i-60) * 360 / 8
                    landmarks_dict[f"point_{i}"] = {"x": int(x + w/2 + 0.1 * w * np.cos(np.radians(angle))), 
                                                   "y": int(y + 0.75 * h + 0.05 * h * np.sin(np.radians(angle)))}
            
            features["landmarks"] = landmarks_dict
            
            # --- Average Color ---
            avg_color_per_row = np.average(face_roi, axis=0)
            avg_color = np.average(avg_color_per_row, axis=0)
            features["avg_color"] = {
                "r": int(avg_color[2]),  # OpenCV uses BGR
                "g": int(avg_color[1]),
                "b": int(avg_color[0])
            }
            
            # --- Skin Tone Analysis ---
            features["skin_tone"] = analyze_skin_tone(face_roi)
            
        else:
            # If no face, use whole image for color
            avg_color_per_row = np.average(image, axis=0)
            avg_color = np.average(avg_color_per_row, axis=0)
            features["avg_color"] = {
                "r": int(avg_color[2]),  # OpenCV uses BGR
                "g": int(avg_color[1]),
                "b": int(avg_color[0])
            }
            
        return features
    except Exception as e:
        return {"error": f"Exception in basic feature extraction: {str(e)}"}

def extract_face_geometry(shape, image_shape):
    """Extract geometric features of the face"""
    try:
        # Face width and height
        face_width = np.max(shape[:, 0]) - np.min(shape[:, 0])
        face_height = np.max(shape[:, 1]) - np.min(shape[:, 1])
        
        # Face aspect ratio
        face_ratio = face_width / face_height if face_height > 0 else 0
        
        # Distances between key points
        # Distance between eyes
        left_eye_center = np.mean(shape[36:42], axis=0)
        right_eye_center = np.mean(shape[42:48], axis=0)
        eye_distance = np.linalg.norm(left_eye_center - right_eye_center)
        
        # Distance from eyes to mouth
        mouth_center = np.mean(shape[48:68], axis=0)
        eye_to_mouth_distance = np.linalg.norm((left_eye_center + right_eye_center) / 2 - mouth_center)
        
        # Jaw width
        jaw_width = np.linalg.norm(shape[0] - shape[16])
        
        # Forehead width (approximate)
        forehead_width = np.linalg.norm(shape[17] - shape[26])
        
        return {
            "face_width": int(face_width),
            "face_height": int(face_height),
            "face_ratio": float(face_ratio),
            "eye_distance": int(eye_distance),
            "eye_to_mouth_distance": int(eye_to_mouth_distance),
            "jaw_width": int(jaw_width),
            "forehead_width": int(forehead_width)
        }
    except Exception as e:
        return {"error": f"Error in face geometry extraction: {str(e)}"}

def analyze_skin_tone(face_roi):
    """Analyze the skin tone of the face"""
    try:
        # Convert to different color spaces
        hsv = cv2.cvtColor(face_roi, cv2.COLOR_BGR2HSV)
        lab = cv2.cvtColor(face_roi, cv2.COLOR_BGR2LAB)
        
        # Calculate average values
        avg_bgr = np.mean(face_roi, axis=(0, 1))
        avg_hsv = np.mean(hsv, axis=(0, 1))
        avg_lab = np.mean(lab, axis=(0, 1))
        
        # Dominant color in BGR
        pixels = np.float32(face_roi.reshape(-1, 3))
        n_colors = 5
        criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 200, .1)
        flags = cv2.KMEANS_RANDOM_CENTERS
        _, labels, palette = cv2.kmeans(pixels, n_colors, None, criteria, 10, flags)
        _, counts = np.unique(labels, return_counts=True)
        dominant_color = palette[np.argmax(counts)]
        
        return {
            "avg_bgr": {
                "b": int(avg_bgr[0]),
                "g": int(avg_bgr[1]),
                "r": int(avg_bgr[2])
            },
            "avg_hsv": {
                "h": int(avg_hsv[0]),
                "s": int(avg_hsv[1]),
                "v": int(avg_hsv[2])
            },
            "avg_lab": {
                "l": int(avg_lab[0]),
                "a": int(avg_lab[1]),
                "b": int(avg_lab[2])
            },
            "dominant_color": {
                "b": int(dominant_color[0]),
                "g": int(dominant_color[1]),
                "r": int(dominant_color[2])
            }
        }
    except Exception as e:
        return {"error": f"Error in skin tone analysis: {str(e)}"}

def extract_eye_features(shape):
    """Extract features related to eyes"""
    try:
        # Right eye (points 36-41)
        right_eye = shape[36:42]
        # Left eye (points 42-47)
        left_eye = shape[42:48]
        
        # Eye bounding boxes
        right_eye_bbox = {
            "x": int(np.min(right_eye[:, 0])),
            "y": int(np.min(right_eye[:, 1])),
            "width": int(np.max(right_eye[:, 0]) - np.min(right_eye[:, 0])),
            "height": int(np.max(right_eye[:, 1]) - np.min(right_eye[:, 1]))
        }
        
        left_eye_bbox = {
            "x": int(np.min(left_eye[:, 0])),
            "y": int(np.min(left_eye[:, 1])),
            "width": int(np.max(left_eye[:, 0]) - np.min(left_eye[:, 0])),
            "height": int(np.max(left_eye[:, 1]) - np.min(left_eye[:, 1]))
        }
        
        # Eye aspect ratios (height/width)
        right_ear = (np.linalg.norm(right_eye[1] - right_eye[5]) + 
                     np.linalg.norm(right_eye[2] - right_eye[4])) / (2 * np.linalg.norm(right_eye[0] - right_eye[3]))
        left_ear = (np.linalg.norm(left_eye[1] - left_eye[5]) + 
                    np.linalg.norm(left_eye[2] - left_eye[4])) / (2 * np.linalg.norm(left_eye[0] - left_eye[3]))
        
        # Eye areas
        right_area = cv2.contourArea(np.array(right_eye))
        left_area = cv2.contourArea(np.array(left_eye))
        
        return {
            "right_eye": {
                "bbox": right_eye_bbox,
                "aspect_ratio": float(right_ear),
                "area": int(right_area)
            },
            "left_eye": {
                "bbox": left_eye_bbox,
                "aspect_ratio": float(left_ear),
                "area": int(left_area)
            },
            "similarity": float(np.abs(right_ear - left_ear))  # Difference in aspect ratios
        }
    except Exception as e:
        return {"error": f"Error in eye feature extraction: {str(e)}"}

def extract_mouth_features(shape):
    """Extract features related to mouth"""
    try:
        # Outer mouth (points 48-59)
        outer_mouth = shape[48:60]
        # Inner mouth (points 60-67)
        inner_mouth = shape[60:68]
        
        # Mouth bounding box
        mouth_bbox = {
            "x": int(np.min(outer_mouth[:, 0])),
            "y": int(np.min(outer_mouth[:, 1])),
            "width": int(np.max(outer_mouth[:, 0]) - np.min(outer_mouth[:, 0])),
            "height": int(np.max(outer_mouth[:, 1]) - np.min(outer_mouth[:, 1]))
        }
        
        # Mouth aspect ratio (height/width)
        mar = (np.linalg.norm(outer_mouth[1] - outer_mouth[7]) + 
               np.linalg.norm(outer_mouth[2] - outer_mouth[6]) + 
               np.linalg.norm(outer_mouth[3] - outer_mouth[5])) / (3 * np.linalg.norm(outer_mouth[0] - outer_mouth[4]))
        
        # Mouth area
        outer_area = cv2.contourArea(np.array(outer_mouth))
        inner_area = cv2.contourArea(np.array(inner_mouth)) if len(inner_mouth) >= 3 else 0
        
        return {
            "bbox": mouth_bbox,
            "aspect_ratio": float(mar),
            "outer_area": int(outer_area),
            "inner_area": int(inner_area),
            "lip_thickness": int(outer_area - inner_area) if inner_area > 0 else int(outer_area)
        }
    except Exception as e:
        return {"error": f"Error in mouth feature extraction: {str(e)}"}

def extract_nose_features(shape):
    """Extract features related to nose"""
    try:
        # Nose points (27-35)
        nose_points = shape[27:36]
        
        # Nose bounding box
        nose_bbox = {
            "x": int(np.min(nose_points[:, 0])),
            "y": int(np.min(nose_points[:, 1])),
            "width": int(np.max(nose_points[:, 0]) - np.min(nose_points[:, 0])),
            "height": int(np.max(nose_points[:, 1]) - np.min(nose_points[:, 1]))
        }
        
        # Nose width (distance between nostrils)
        nose_width = np.linalg.norm(nose_points[4] - nose_points[2])
        
        # Nose height (from bridge to tip)
        nose_height = np.linalg.norm(nose_points[0] - nose_points[3])
        
        # Nose aspect ratio
        nose_ratio = nose_height / nose_width if nose_width > 0 else 0
        
        # Nose area
        nose_area = cv2.contourArea(np.array(nose_points))
        
        return {
            "bbox": nose_bbox,
            "width": int(nose_width),
            "height": int(nose_height),
            "aspect_ratio": float(nose_ratio),
            "area": int(nose_area)
        }
    except Exception as e:
        return {"error": f"Error in nose feature extraction: {str(e)}"}

if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            print(json.dumps({"error": "Usage: python feature_extractor.py <image_path>"}))
            sys.exit(1)
            
        image_path = sys.argv[1]
        result = extract_features(image_path)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": f"Unhandled exception: {str(e)}"}))
        sys.exit(1)