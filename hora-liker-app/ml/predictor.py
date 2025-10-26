import numpy as np
import json
import sys
import os
import joblib

# Model directory
MODEL_DIR = "../data/models"

def prepare_single_feature_vector(features):
    """
    Prepare a single feature vector for prediction.
    This should match the logic in model_trainer.py
    """
    feature_vector = [
        features.get('has_face', False),
        features.get('avg_color', {}).get('r', 0),
        features.get('avg_color', {}).get('g', 0),
        features.get('avg_color', {}).get('b', 0),
        # Add more features as needed, matching model_trainer.py
    ]
    
    # Simplify handling of boolean feature
    if isinstance(feature_vector[0], bool):
        feature_vector[0] = 1 if feature_vector[0] else 0
        
    return np.array(feature_vector).reshape(1, -1) # Reshape for single sample

def predict(user_id, image_features):
    """
    Predict the likeness probability for a user and image features.
    """
    model_path = os.path.join(MODEL_DIR, f"user_{user_id}_model.pkl")
    
    if not os.path.exists(model_path):
        # If no model exists for the user, return a default probability
        return {"probability": 0.5, "message": "No model found, using default probability"}
        
    try:
        model = joblib.load(model_path)
        X = prepare_single_feature_vector(image_features)
        probability = model.predict_proba(X)[0][1] # Probability of class 1 (like)
        return {"probability": float(probability)}
    except Exception as e:
        return {"error": f"Prediction failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python predictor.py <user_id> <json_image_features>"}))
        sys.exit(1)
        
    user_id = sys.argv[1]
    # The features string should be a JSON object
    features_str = sys.argv[2]
    
    try:
        image_features = json.loads(features_str)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON for features: {str(e)}"}))
        sys.exit(1)
        
    result = predict(user_id, image_features)
    print(json.dumps(result))