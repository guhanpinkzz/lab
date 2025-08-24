// Updated components/LoginPage.js - Student Login Fix
import React, { useState } from 'react';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = ({ handleLogin, navigateTo, users }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    role: 'hod' 
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    // Clear previous errors
    setError('');
    
    // Validation
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    // Debug: Log current form data
    console.log('Login attempt:', {
      username: formData.username,
      password: formData.password,
      role: formData.role
    });

    // Debug: Log all users for troubleshooting
    console.log('Available users:', users.map(u => ({
      username: u.username,
      role: u.role,
      hasPassword: !!u.password
    })));

    // Enhanced login logic with debugging
    const user = users.find(u => {
      const usernameMatch = u.username === formData.username;
      const passwordMatch = u.password === formData.password;
      const roleMatch = u.role === formData.role;
      
      // Debug individual matches
      if (usernameMatch) {
        console.log(`Username match found for: ${u.username}`);
        console.log(`Password match: ${passwordMatch}`);
        console.log(`Role match: ${roleMatch} (expected: ${formData.role}, actual: ${u.role})`);
      }
      
      return usernameMatch && passwordMatch && roleMatch;
    });

    if (user) {
      console.log('Login successful for user:', user.username);
      if (!handleLogin(formData.username, formData.password, formData.role)) {
        setError('Login function failed. Please try again.');
      }
    } else {
      // Provide specific error messages
      const usernameExists = users.find(u => u.username === formData.username);
      const roleExists = users.find(u => u.role === formData.role);
      
      if (!usernameExists) {
        setError(`Username "${formData.username}" not found. Please check your username.`);
      } else if (!roleExists) {
        setError(`No users found for role "${formData.role}".`);
      } else {
        const userWithUsername = users.find(u => u.username === formData.username);
        if (userWithUsername && userWithUsername.role !== formData.role) {
          setError(`Username "${formData.username}" exists but not for role "${formData.role}". User role is "${userWithUsername.role}".`);
        } else {
          setError('Invalid password. Please check your password.');
        }
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Quick login buttons for testing
  const quickLogin = (username, password, role) => {
    setFormData({ username, password, role });
    setError('');
  };

  return (
    <div className="auth-container premium-bg">
      <div className="auth-card premium-card">
        <div className="auth-header">
          <h2 className="headline">Welcome back</h2>
          <p className="subtext">Sign in to continue to your dashboard</p>
        </div>
        
        <div className="auth-form">
          <div className="form-group">
            <label className="form-label">Role</label>
            <select 
              className="form-input"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
            >
              <option value="hod">HOD (Head of Department)</option>
              <option value="staff">Staff/Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username"
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
              placeholder="Enter your password"
            />
            <span 
              className="input-icon" 
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer' }}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button onClick={handleSubmit} className="btn btn-primary premium-cta">
            <FaLock /> Sign in
          </button>
        </div>

        <div className="auth-links">
          {formData.role === 'hod' && (
            <button 
              className="auth-link" 
              onClick={() => navigateTo('signup')}
            >
              Create HOD account
            </button>
          )}
        </div>

        <div className="demo-credentials">
          <div className="demo-title">Quick demo logins</div>
          <div className="demo-grid">
            <button className="demo-pill" onClick={() => quickLogin('hod_admin', 'hod123', 'hod')}>
              HOD · hod_admin / hod123
            </button>
            <button className="demo-pill" onClick={() => quickLogin('staff001', 'temp123', 'staff')}>
              Staff · staff001 / temp123
            </button>
            <button className="demo-pill" onClick={() => quickLogin('student001', 'temp456', 'student')}>
              Student · student001 / temp456
            </button>
            <button className="demo-pill" onClick={() => quickLogin('student002', 'temp789', 'student')}>
              Student · student002 / temp789
            </button>
            <button className="demo-pill" onClick={() => quickLogin('student_perm', 'student123', 'student')}>
              Student · student_perm / student123
            </button>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="dev-hint">Debug enabled • Users: {users?.length || 0} • Role: {formData.role}</div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;