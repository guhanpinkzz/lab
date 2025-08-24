// components/SignupPage.js
import React, { useState } from 'react';
import { FaUser, FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const SignupPage = ({ handleSignup, navigateTo, users }) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    username: '', 
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    // Validation
    if (!formData.name || !formData.email || !formData.username || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if username already exists
    if (users.some(u => u.username === formData.username)) {
      setError('Username already exists');
      return;
    }

    // Check if email already exists
    if (users.some(u => u.email === formData.email)) {
      setError('Email already exists');
      return;
    }

    // Create HOD account
    handleSignup(formData);
    setError('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>HOD Registration</h1>
          <p>Create your Head of Department account</p>
        </div>
        
        <div>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Enter your full name"
            />
            <FaUser className="input-icon" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
            />
            <FaEnvelope className="input-icon" />
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Choose a username"
            />
            <FaUser className="input-icon" />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Create a password (min 6 characters)"
            />
            <span 
              className="input-icon" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Confirm your password"
            />
            <FaLock className="input-icon" />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button onClick={handleSubmit} className="btn btn-primary">
            <FaUser /> Create HOD Account
          </button>
        </div>

        <div className="auth-links">
          <button 
            className="auth-link"
            onClick={() => navigateTo('login')}
          >
            Already have an account? Login here
          </button>
        </div>

        {/* Information Box */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e7f3ff', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#0066cc'
        }}>
          <strong>Note:</strong> Only HODs can create accounts. After registration, you can add staff and students to the system.
        </div>
      </div>
    </div>
  );
};

export default SignupPage;