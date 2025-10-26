import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Upload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  // Get user from localStorage (simulated auth)
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    navigate('/'); // Redirect to login if not logged in
    return null;
  }

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('userId', user.id);

    try {
      const response = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload successful:', response.data);
      alert('Image uploaded successfully!');
      // Navigate to feed after upload
      navigate('/app/feed');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed. Please try again.');
    }
  };

  return (
    <div>
      <h2>Upload Image</h2>
      <form onSubmit={handleUpload}>
        <div>
          <input type="file" onChange={handleFileChange} accept="image/*" required />
        </div>
        <br />
        <button type="submit">Upload</button>
      </form>
    </div>
  );
};

export default Upload;