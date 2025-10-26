import React from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import Feed from './Feed';
import Upload from './Upload';
import ModelStats from './ModelStats';

const MainApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get user from localStorage (simulated auth)
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    navigate('/'); // Redirect to login if not logged in
    return null;
  }
  
  // Determine active tab based on URL
  const getActiveTab = () => {
    if (location.pathname.includes('/upload')) return 'upload';
    if (location.pathname.includes('/stats')) return 'stats';
    return 'feed'; // default to feed
  };
  
  const activeTab = getActiveTab();
  
  const handleLogout = () => {
    // Clear user from localStorage
    localStorage.removeItem('user');
    // Redirect to login
    navigate('/');
  };
  
  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Hora Liker</h2>
        <div>
          <span style={{ marginRight: '15px' }}>Logged in as: {user.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>
      
      <div style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }}>
        <button 
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px', 
            backgroundColor: activeTab === 'feed' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'feed' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/app/feed')}
        >
          Feed
        </button>
        <button 
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px', 
            backgroundColor: activeTab === 'upload' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'upload' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/app/upload')}
        >
          Upload
        </button>
        <button 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: activeTab === 'stats' ? '#007bff' : '#f8f9fa',
            color: activeTab === 'stats' ? 'white' : 'black',
            border: '1px solid #ccc',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/app/stats')}
        >
          Model Stats
        </button>
      </div>
      
      <div>
        <Routes>
          <Route path="/feed" element={<Feed />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/stats" element={<ModelStats />} />
        </Routes>
      </div>
    </div>
  );
};

export default MainApp;