import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Feed = () => {
  const [needsActionImages, setNeedsActionImages] = useState([]);
  const [actionTakenImages, setActionTakenImages] = useState([]);
  const navigate = useNavigate();

  // Get user from localStorage (simulated auth)
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    navigate('/'); // Redirect to login if not logged in
    return null;
  }

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      console.log(`Fetching images for user ID: ${user.id}`);
      const response = await axios.get(`http://localhost:5000/api/images/${user.id}`);
      console.log("Received images from API:", response.data);
      setNeedsActionImages(response.data.needsAction);
      setActionTakenImages(response.data.actionTaken);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const handleInteraction = async (imageId, action) => {
    try {
      const response = await axios.post('http://localhost:5000/api/interact', {
        userId: user.id,
        imageId,
        action,
      });
      console.log(`Image ${action}d successfully:`, response.data);
      // Refresh the feed to reflect changes
      fetchImages(); 
    } catch (error) {
      if (error.response && error.response.status === 400) {
        // User already interacted with this image
        console.log('User has already interacted with this image');
        // Refresh the feed to show the current state
        fetchImages();
      } else {
        console.error(`Error ${action}ing image:`, error);
        alert(`Failed to ${action} image. Please try again.`);
      }
    }
  };

  // Function to manually generate an AI image (for testing)
  const generateAIImage = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/generate-ai-image');
      console.log('AI image generated:', response.data);
      alert('AI image generated successfully!');
      // Refresh the feed to show the new image
      fetchImages();
    } catch (error) {
      console.error('Error generating AI image:', error);
      alert('Failed to generate AI image. Please try again.');
    }
  };

  // Function to render facial features
  const renderFeatures = (features) => {
    // Handle cases where features are missing or null
    if (!features) {
      return <p>No features extracted for this image. Enhanced feature extraction requires dlib.</p>;
    }
    
    // Handle error cases
    if (features.error) {
      return <p>Error extracting features: {features.error}</p>;
    }
    
    // Check if this is using basic features (without detailed geometry)
    const isBasicFeatures = !features.face_geometry && !features.eye_features && !features.mouth_features && !features.nose_features;
    
    if (isBasicFeatures) {
      return (
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          <h4>Basic Extracted Features:</h4>
          <p><strong>Warning:</strong> Enhanced feature extraction requires dlib. Using basic extraction.</p>
          
          {/* Face Detection */}
          <p><strong>Has Face:</strong> {features.has_face !== undefined ? (features.has_face ? 'Yes' : 'No') : 'Unknown'}</p>
          {features.face_count && <p><strong>Number of Faces:</strong> {features.face_count}</p>}
          
          {/* Basic Color Information */}
          {features.avg_color && (
            <p><strong>Average Color (RGB):</strong> 
              R: {features.avg_color.r || 0}, 
              G: {features.avg_color.g || 0}, 
              B: {features.avg_color.b || 0}
            </p>
          )}
          
          {/* Face Bounding Box */}
          {features.face_bbox && (
            <p><strong>Face Bounding Box:</strong> 
              X: {features.face_bbox.x || 0}, 
              Y: {features.face_bbox.y || 0}, 
              Width: {features.face_bbox.width || 0}, 
              Height: {features.face_bbox.height || 0}
            </p>
          )}
          
          {/* Basic Landmarks */}
          {features.landmarks && (
            <div>
              <p><strong>Estimated Landmarks:</strong> {Object.keys(features.landmarks).length} points</p>
              <details>
                <summary>View Landmarks</summary>
                <ul>
                  {Object.entries(features.landmarks).map(([key, point]) => (
                    <li key={key}>{key}: X:{point.x}, Y:{point.y}</li>
                  ))}
                </ul>
              </details>
            </div>
          )}
        </div>
      );
    }
    
    // Render enhanced features
    return (
      <div style={{ marginTop: '10px', fontSize: '14px' }}>
        <h4>Enhanced Extracted Features:</h4>
        
        {/* Face Detection */}
        <p><strong>Has Face:</strong> {features.has_face !== undefined ? (features.has_face ? 'Yes' : 'No') : 'Unknown'}</p>
        {features.face_count && <p><strong>Number of Faces:</strong> {features.face_count}</p>}
        
        {/* Basic Color Information */}
        {features.avg_color && (
          <p><strong>Average Color (RGB):</strong> 
            R: {features.avg_color.r || 0}, 
            G: {features.avg_color.g || 0}, 
            B: {features.avg_color.b || 0}
          </p>
        )}
        
        {/* Face Bounding Box */}
        {features.face_bbox && (
          <p><strong>Face Bounding Box:</strong> 
            X: {features.face_bbox.x || 0}, 
            Y: {features.face_bbox.y || 0}, 
            Width: {features.face_bbox.width || 0}, 
            Height: {features.face_bbox.height || 0}
          </p>
        )}
        
        {/* Face Geometry */}
        {features.face_geometry && (
          <div>
            <p><strong>Face Geometry:</strong></p>
            <ul>
              <li>Width: {features.face_geometry.face_width || 0}px</li>
              <li>Height: {features.face_geometry.face_height || 0}px</li>
              <li>Aspect Ratio: {(features.face_geometry.face_ratio || 0).toFixed(2)}</li>
              <li>Eye Distance: {features.face_geometry.eye_distance || 0}px</li>
              <li>Eye to Mouth Distance: {features.face_geometry.eye_to_mouth_distance || 0}px</li>
              <li>Jaw Width: {features.face_geometry.jaw_width || 0}px</li>
              <li>Forehead Width: {features.face_geometry.forehead_width || 0}px</li>
            </ul>
          </div>
        )}
        
        {/* Skin Tone Analysis */}
        {features.skin_tone && (
          <div>
            <p><strong>Skin Tone Analysis:</strong></p>
            <ul>
              <li>Avg BGR: B:{features.skin_tone.avg_bgr?.b || 0}, G:{features.skin_tone.avg_bgr?.g || 0}, R:{features.skin_tone.avg_bgr?.r || 0}</li>
              <li>Avg HSV: H:{features.skin_tone.avg_hsv?.h || 0}, S:{features.skin_tone.avg_hsv?.s || 0}, V:{features.skin_tone.avg_hsv?.v || 0}</li>
              <li>Avg LAB: L:{features.skin_tone.avg_lab?.l || 0}, A:{features.skin_tone.avg_lab?.a || 0}, B:{features.skin_tone.avg_lab?.b || 0}</li>
              <li>Dominant Color: B:{features.skin_tone.dominant_color?.b || 0}, G:{features.skin_tone.dominant_color?.g || 0}, R:{features.skin_tone.dominant_color?.r || 0}</li>
            </ul>
          </div>
        )}
        
        {/* Eye Features */}
        {features.eye_features && (
          <div>
            <p><strong>Eye Features:</strong></p>
            <ul>
              <li>Right Eye - Aspect Ratio: {(features.eye_features.right_eye?.aspect_ratio || 0).toFixed(2)}, Area: {features.eye_features.right_eye?.area || 0}px²</li>
              <li>Left Eye - Aspect Ratio: {(features.eye_features.left_eye?.aspect_ratio || 0).toFixed(2)}, Area: {features.eye_features.left_eye?.area || 0}px²</li>
              <li>Eye Similarity: {(features.eye_features.similarity || 0).toFixed(2)}</li>
            </ul>
          </div>
        )}
        
        {/* Mouth Features */}
        {features.mouth_features && (
          <div>
            <p><strong>Mouth Features:</strong></p>
            <ul>
              <li>Aspect Ratio: {(features.mouth_features.aspect_ratio || 0).toFixed(2)}</li>
              <li>Outer Area: {features.mouth_features.outer_area || 0}px²</li>
              <li>Inner Area: {features.mouth_features.inner_area || 0}px²</li>
              <li>Lip Thickness: {features.mouth_features.lip_thickness || 0}px</li>
            </ul>
          </div>
        )}
        
        {/* Nose Features */}
        {features.nose_features && (
          <div>
            <p><strong>Nose Features:</strong></p>
            <ul>
              <li>Width: {features.nose_features.width || 0}px</li>
              <li>Height: {features.nose_features.height || 0}px</li>
              <li>Aspect Ratio: {(features.nose_features.aspect_ratio || 0).toFixed(2)}</li>
              <li>Area: {features.nose_features.area || 0}px²</li>
            </ul>
          </div>
        )}
        
        {/* Landmarks Summary */}
        {features.landmarks && (
          <div>
            <p><strong>Faces Landmarks:</strong> {Object.keys(features.landmarks).length} points detected</p>
            <details>
              <summary>View All Landmarks</summary>
              <ul>
                {Object.entries(features.landmarks).map(([key, point]) => (
                  <li key={key}>{key}: X:{point.x}, Y:{point.y}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </div>
    );
  };

  // Function to render interaction buttons or status
  const renderInteraction = (img) => {
    if (img.userAction) {
      // User has already interacted with this image
      return (
        <div style={{ 
          padding: '8px 16px', 
          borderRadius: '4px',
          fontWeight: 'bold',
          display: 'inline-block',
          marginTop: '10px'
        }}>
          {img.userAction === 'like' ? (
            <span style={{ color: '#4CAF50' }}>✓ Liked</span>
          ) : (
            <span style={{ color: '#f44336' }}>✗ Disliked</span>
          )}
        </div>
      );
    } else {
      // User hasn't interacted yet, show buttons
      return (
        <div style={{ marginTop: '10px' }}>
          <button 
            onClick={() => handleInteraction(img.id, 'like')}
            style={{ 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            Like
          </button>
          <button 
            onClick={() => handleInteraction(img.id, 'dislike')}
            style={{ 
              backgroundColor: '#f44336', 
              color: 'white', 
              padding: '8px 16px', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Dislike
          </button>
        </div>
      );
    }
  };

  // Function to render a single image card
  const renderImageCard = (img) => (
    <div key={img.id} style={{ 
      border: '1px solid #ccc', 
      borderRadius: '8px',
      padding: '15px', 
      backgroundColor: '#f9f9f9',
      marginBottom: '20px'
    }}>
      {img.isAI ? (
        <div style={{ 
          backgroundColor: '#e7f3ff', 
          padding: '5px', 
          borderRadius: '3px', 
          marginBottom: '10px',
          textAlign: 'center',
          fontWeight: 'bold'
        }}>
          AI-Generated Face
        </div>
      ) : (
        <p><strong>Uploader:</strong> {img.uploaderId}</p>
      )}
      <div style={{ textAlign: 'center' }}>
        <img 
          src={`http://localhost:5000${img.path}`} 
          alt={img.originalName} 
          style={{ 
            maxWidth: '100%', 
            maxHeight: '300px',
            borderRadius: '5px',
            border: '1px solid #ddd'
          }} 
        />
      </div>
      <p style={{ marginTop: '10px' }}><strong>Likeness Probability:</strong> {(img.likenessProbability * 100).toFixed(2)}%</p>
      {renderInteraction(img)}
      {renderFeatures(img.features)}
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Image Feed</h2>
        <button 
          onClick={generateAIImage}
          style={{ 
            backgroundColor: '#007bff', 
            color: 'white', 
            padding: '8px 16px', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Generate AI Image
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Needs Action Column */}
        <div style={{ flex: 1 }}>
          <h3>Needs Your Action</h3>
          {needsActionImages.length === 0 ? (
            <p>No images need your action at the moment.</p>
          ) : (
            <div>
              {needsActionImages.map(renderImageCard)}
            </div>
          )}
        </div>
        
        {/* Action Taken Column */}
        <div style={{ flex: 1 }}>
          <h3>Action Taken</h3>
          {actionTakenImages.length === 0 ? (
            <p>You haven't taken any actions yet.</p>
          ) : (
            <div>
              {actionTakenImages.map(renderImageCard)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Feed;