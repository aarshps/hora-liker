import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ModelStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user from localStorage (simulated auth)
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    return null;
  }
  
  useEffect(() => {
    fetchModelStats();
  }, []);
  
  const fetchModelStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/model-stats/${user.id}`);
      setStats(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching model stats:', err);
      setError('Failed to fetch model stats. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return <div>Loading model stats...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!stats) {
    return <div>No stats available</div>;
  }
  
  return (
    <div>
      <h2>Model Statistics</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>User Activity</h3>
          <p><strong>Total Interactions:</strong> {stats.totalInteractions}</p>
          <p><strong>Likes:</strong> {stats.likes}</p>
          <p><strong>Dislikes:</strong> {stats.dislikes}</p>
          <p><strong>Uploaded Images:</strong> {stats.uploadedImages}</p>
        </div>
        
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
          <h3>Model Status</h3>
          <p><strong>Model Trained:</strong> {stats.modelExists ? 'Yes' : 'No'}</p>
          {stats.modelExists ? (
            <p>Your personalized model has been trained and is being used to predict likeness probabilities.</p>
          ) : (
            <p>
              Your personalized model has not been trained yet. 
              Interact with more images (like/dislike) to train the model.
            </p>
          )}
        </div>
      </div>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', backgroundColor: '#f9f9f9' }}>
        <h3>About AI-Generated Faces</h3>
        <p>
          This system automatically generates new faces using AI and adds them to the feed. 
          These faces are not uploaded by users but are created by an AI model.
        </p>
        <p>
          You can like or dislike AI-generated faces just like user-uploaded images. 
          Your interactions with AI faces help improve the model's understanding of your preferences.
        </p>
        <p>
          New AI faces are generated periodically and added to the feed automatically.
        </p>
      </div>
      
      <div style={{ marginTop: '20px' }}>
        <h3>How It Works</h3>
        <p>
          The system uses machine learning to predict how likely you are to like a face based on your past interactions.
          The more images you like or dislike, the better the model becomes at predicting your preferences.
        </p>
        <p>
          Facial features are extracted from each image and used as input to the model. These features include:
        </p>
        <ul>
          <li>Face detection (whether a face is present)</li>
          <li>Facial landmarks (positions of eyes, nose, mouth)</li>
          <li>Color distribution (average RGB values)</li>
          <li>Face bounding box dimensions</li>
        </ul>
      </div>
    </div>
  );
};

export default ModelStats;