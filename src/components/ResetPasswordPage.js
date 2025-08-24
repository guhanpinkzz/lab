// components/ResetPasswordPage.js
import React, { useState } from 'react';
import { FaLock, FaEye, FaEyeSlash, FaKey } from 'react-icons/fa';

const ResetPasswordPage = ({ currentUser, handleResetPassword }) => {
  const [passwords, setPasswords] = useState({ 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    // Validation
    if (!passwords.newPassword || !passwords.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Check if new password is different from current temporary password
    if (passwords.newPassword === currentUser.password) {
      setError('New password cannot be the same as your temporary password');
      return;
    }

    // Password strength check
    const hasNumber = /\d/.test(passwords.newPassword);
    const hasLetter = /[a-zA-Z]/.test(passwords.newPassword);
    
    if (!hasNumber || !hasLetter) {
      setError('Password must contain both letters and numbers');
      return;
    }

    handleResetPassword(passwords.newPassword);
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
          <h1>Set New Password</h1>
          <p>Welcome, {currentUser?.name}</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            This is your first login. Please create a secure password.
          </p>
        </div>
        
        <div>
          {/* Current Temp Password Display */}
          <div style={{ 
            background: '#fff3cd', 
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '20px'
          }}>
            <h4 style={{ color: '#856404', marginBottom: '5px' }}>
              <FaKey /> Your Temporary Password:
            </h4>
            <code style={{ 
              background: '#f8f9fa',
              padding: '5px 10px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '16px',
              color: '#495057'
            }}>
              {currentUser?.password}
            </code>
            <p style={{ fontSize: '12px', color: '#856404', marginTop: '5px' }}>
              Please create a new, secure password below.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Enter your new password"
            />
            <FaLock className="input-icon" />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="form-input"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Confirm your new password"
            />
            <span 
              className="input-icon" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {/* Password Requirements */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '6px',
            marginBottom: '15px',
            fontSize: '12px',
            color: '#666'
          }}>
            <strong>Password Requirements:</strong>
            <ul style={{ marginTop: '5px', paddingLeft: '20px' }}>
              <li>At least 6 characters long</li>
              <li>Must contain both letters and numbers</li>
              <li>Different from your temporary password</li>
            </ul>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button onClick={handleSubmit} className="btn btn-primary">
            <FaKey /> Update Password & Continue
          </button>
        </div>

        {/* Security Note */}
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#e7f3ff', 
          borderRadius: '8px',
          fontSize: '12px',
          color: '#0066cc'
        }}>
          <strong>Security Note:</strong> Once you set your new password, your temporary password will no longer work. Please remember your new password for future logins.
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;