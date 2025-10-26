import numpy as np
import json
import sys
import os
from sklearn.linear_model import LogisticRegression
import joblib
from sklearn.model_selection import train_test_split

# Model directory
MODEL_DIR = "../data/models"
os.makedirs(MODEL_DIR, exist_ok=True)

def prepare_features_for_model(interactions_with_features):
    """
    Prepare features and labels for training.
    interactions_with_features: List of dicts with 'features' and 'label' keys.
    """
    X = []
    y = []
    for item in interactions_with_features:
        features = item['features']
        label = item['label'] # 'like' or 'dislike'
        
        # Convert features to a numerical vector
        # This should match the feature extraction logic
        feature_vector = [
            features.get('has_face', False),
            features.get('avg_color', {}).get('r', 0),
            features.get('avg_color', {}).get('g', 0),
            features.get('avg_color', {}).get('b', 0),
            # Add more features as needed from feature_extractor.py
            # For landmarks, you'd need to flatten their coordinates
            # For face_bbox, you could use width/height or area
        ]
        
        # Simplify handling of boolean feature
        if isinstance(feature_vector[0], bool):
            feature_vector[0] = 1 if feature_vector[0] else 0
            
        X.append(feature_vector)
        y.append(1 if label == 'like' else 0) # Convert to 1/0
    
    return np.array(X), np.array(y)

def train_model(user_id, interactions_with_features):
    """
    Train or update a model for a user.
    """
    if not interactions_with_features:
        return {"error": "No interactions provided for training"}
        
    X, y = prepare_features_for_model(interactions_with_features)
    
    if len(X) == 0 or len(y) == 0:
        return {"error": "No valid data for training"}
        
    # Check if model already exists
    model_path = os.path.join(MODEL_DIR, f"user_{user_id}_model.pkl")
    
    if os.path.exists(model_path):
        # Load existing model
        model = joblib.load(model_path)
        # In a real scenario, you might want to implement incremental learning
        # or retrain with new data. For simplicity, we'll retrain.
        # For true incremental learning, consider models like SGDClassifier with partial_fit
    else:
        # Create a new model
        model = LogisticRegression()
    
    # Train the model
    try:
        model.fit(X, y)
        # Save the model
        joblib.dump(model, model_path)
        return {"message": "Model trained and saved successfully", "model_path": model_path}
    except Exception as e:
        return {"error": f"Model training failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python model_trainer.py <user_id> <json_interactions_with_features>"}))
        sys.exit(1)
        
    user_id = sys.argv[1]
    # The interactions string should be a JSON array of objects
    interactions_str = sys.argv[2]
    
    try:
        interactions_with_features = json.loads(interactions_str)
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON for interactions: {str(e)}"}))
        sys.exit(1)
        
    result = train_model(user_id, interactions_with_features)
    print(json.dumps(result))