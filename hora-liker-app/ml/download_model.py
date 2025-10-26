import os
import urllib.request
import sys

def download_dlib_model():
    """Download the dlib facial landmark predictor model"""
    model_url = "http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2"
    model_file = "shape_predictor_68_face_landmarks.dat.bz2"
    extracted_file = "shape_predictor_68_face_landmarks.dat"
    
    # Check if model already exists
    if os.path.exists(extracted_file):
        print("Dlib model already exists.")
        return True
    
    try:
        print("Downloading dlib facial landmark predictor model...")
        print("This may take a few minutes as the file is approximately 60MB.")
        
        # Download the compressed model
        urllib.request.urlretrieve(model_url, model_file)
        print("Download completed.")
        
        # Extract the model
        print("Extracting model...")
        import bz2
        with open(model_file, 'rb') as source, open(extracted_file, 'wb') as dest:
            dest.write(bz2.decompress(source.read()))
        print("Extraction completed.")
        
        # Remove the compressed file
        os.remove(model_file)
        print("Cleanup completed.")
        
        return True
    except Exception as e:
        print(f"Error downloading or extracting model: {e}")
        return False

if __name__ == "__main__":
    # Check if dlib is installed
    try:
        import dlib
        print("dlib is installed. Proceeding with model download.")
    except ImportError:
        print("dlib is not installed. Skipping model download.")
        print("The application will use basic feature extraction.")
        sys.exit(0)
    
    success = download_dlib_model()
    if success:
        print("Dlib model is ready for use.")
        sys.exit(0)
    else:
        print("Failed to download dlib model.")
        sys.exit(1)