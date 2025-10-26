import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('Please enter a username');
      return;
    }

    try {
      // Simulate login by creating/getting a user
      const response = await axios.post('http://localhost:5000/api/login', { username });
      console.log('Login successful:', response.data);
      // Store user info in localStorage for simplicity (in a real app, use secure sessions)
      localStorage.setItem('user', JSON.stringify(response.data.user));
      // Redirect to main app after login
      navigate('/app/feed');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '100px auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label>Username: </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '10px' }}>Login</button>
      </form>
    </div>
  );
};

export default Login;