# Hora Liker

Hora Liker is a face likeness prediction application that allows users to upload portraits, like/dislike images, and receive personalized predictions on how likely they are to like new faces.

## Features

- User authentication (simulated)
- Image upload for portraits
- Feed of images with likeness probability predictions
- Like/dislike functionality
- Personalized machine learning model for each user
- AI-generated faces that are automatically added to the feed
- Model statistics and feature visualization

## How It Works

1. **User Interaction**: Users log in, upload portraits, and like/dislike images (both user-uploaded and AI-generated).
2. **Feature Extraction**: When an image is uploaded or generated, the system extracts facial features using OpenCV, including:
   - Face detection
   - Facial landmarks (eyes, nose, mouth)
   - Color distribution (average RGB values)
   - Face bounding box dimensions
3. **Model Training**: The system trains a personalized Logistic Regression model for each user based on their interactions (likes/dislikes).
4. **Prediction**: When viewing the feed, the system predicts the likeness probability for each image using the user's trained model.
5. **AI Face Generation**: The system periodically generates new AI faces using `thispersondoesnotexist.com` and adds them to the feed automatically.

## Technology Stack

- **Frontend**: React with React Router
- **Backend**: Node.js with Express
- **Machine Learning**: Python with scikit-learn, OpenCV
- **Data Storage**: JSON files (for prototyping)
- **Image Storage**: Local file system
- **AI Face Generation**: thispersondoesnotexist.com

## Setup

1. Run `setup.bat` to install all dependencies.
2. Run `start-backend.bat` to start the backend server.
3. Run `start-frontend.bat` to start the frontend development server.
4. Open your browser and go to `http://localhost:5173`.

## Usage

1. Log in with any username (a new user will be created if it doesn't exist).
2. Upload portraits using the "Upload" tab.
3. View images in the "Feed" tab and like/dislike them.
4. Check your model statistics in the "Model Stats" tab.
5. See AI-generated faces automatically appear in the feed.