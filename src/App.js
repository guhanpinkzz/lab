// Updated App.js - Student Login Fix
import React, { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import HODDashboard from './components/HODDashboard';
import StaffDashboard from './components/StaffDashboard';
import StudentDashboard from './components/StudentDashboard';
import { mockData } from './data/mockData';
import './styles/dashboard.css';

const App = () => {
  // Global State
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const [users, setUsers] = useState(mockData.users);
  const [attendance, setAttendance] = useState(mockData.attendance);
  const [notifications, setNotifications] = useState([]);

  // Debug: Log initial data
  useEffect(() => {
    console.log('App initialized with users:', users.map(u => ({
      username: u.username,
      role: u.role,
      temporaryPassword: u.temporaryPassword
    })));
  }, [users]);

  // Generate notifications for low attendance
  useEffect(() => {
    const lowAttendanceNotifications = users
      .filter(user => user.role === 'student')
      .map(student => {
        const studentAttendance = attendance.filter(a => a.studentId === student.studentId);
        const avgAttendance = studentAttendance.length > 0 
          ? studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length 
          : 0;
        
        if (avgAttendance < 75) {
          return {
            id: student.id,
            message: `${student.name}'s attendance is below 75% (${avgAttendance.toFixed(1)}%)`,
            type: 'warning'
          };
        }
        return null;
      })
      .filter(Boolean);
    
    setNotifications(lowAttendanceNotifications);
  }, [attendance, users]);

  // Enhanced Authentication Functions
  const handleLogin = (username, password, role) => {
    console.log('handleLogin called with:', { username, password, role });
    
    // Find user with exact match
    const user = users.find(u => {
      const matches = u.username === username && u.password === password && u.role === role;
      console.log(`Checking user ${u.username}: username=${u.username === username}, password=${u.password === password}, role=${u.role === role}`);
      return matches;
    });
    
    if (user) {
      console.log('User found:', user);
      setCurrentUser(user);
      
      if (user.temporaryPassword) {
        console.log('Redirecting to password reset');
        setCurrentPage('resetPassword');
      } else {
        const targetPage = `${user.role}Dashboard`;
        console.log('Redirecting to:', targetPage);
        setCurrentPage(targetPage);
      }
      return true;
    } else {
      console.log('No user found with provided credentials');
      console.log('Available users for role ' + role + ':', 
        users.filter(u => u.role === role).map(u => ({
          username: u.username,
          hasPassword: !!u.password
        }))
      );
      return false;
    }
  };

  const handleSignup = (userData) => {
    const newUser = {
      id: Date.now(),
      ...userData,
      role: 'hod',
      temporaryPassword: false
    };
    setUsers([...users, newUser]);
    setCurrentPage('login');
  };

  const handleResetPassword = (newPassword) => {
    if (!currentUser) {
      console.error('No current user for password reset');
      return;
    }
    
    const updatedUser = { ...currentUser, password: newPassword, temporaryPassword: false };
    console.log('Updating password for user:', updatedUser.username);
    
    setCurrentUser(updatedUser);
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u));
    
    const targetPage = `${updatedUser.role}Dashboard`;
    console.log('After password reset, redirecting to:', targetPage);
    setCurrentPage(targetPage);
  };

  const handleLogout = () => {
    console.log('User logged out');
    setCurrentUser(null);
    setCurrentPage('login');
  };

  // User Management Functions
  const generateTempPassword = () => {
    return 'temp' + Math.random().toString(36).substr(2, 6);
  };

  const addUser = (userData) => {
    const tempPassword = generateTempPassword();
    const newUser = {
      id: Date.now(),
      username: userData.email.split('@')[0],
      password: tempPassword,
      temporaryPassword: true,
      ...userData
    };
    setUsers([...users, newUser]);
    return tempPassword;
  };

  const deleteUser = (userId) => {
    setUsers(users.filter(u => u.id !== userId));
  };

  const updateUserPassword = (userId, newPassword) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? {...u, password: newPassword, temporaryPassword: true}
        : u
    ));
  };

  // Attendance Functions
  const markAttendance = (attendanceData) => {
    setAttendance([...attendance, ...attendanceData]);
  };

  // Navigation
  const navigateTo = (page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);
  };

  // Shared Props for all components
  const sharedProps = {
    currentUser,
    users,
    setUsers,
    attendance,
    setAttendance,
    notifications,
    handleLogin,
    handleSignup,
    handleResetPassword,
    handleLogout,
    addUser,
    deleteUser,
    updateUserPassword,
    markAttendance,
    navigateTo,
    generateTempPassword
  };

  // Enhanced Render current page with debugging
  const renderCurrentPage = () => {
    console.log('Rendering page:', currentPage);
    console.log('Current user:', currentUser);
    
    switch (currentPage) {
      case 'login':
        return <LoginPage {...sharedProps} />;
      case 'signup':
        return <SignupPage {...sharedProps} />;
      case 'resetPassword':
        return <ResetPasswordPage {...sharedProps} />;
      case 'hodDashboard':
        console.log('Rendering HOD Dashboard');
        return <HODDashboard {...sharedProps} />;
      case 'staffDashboard':
        console.log('Rendering Staff Dashboard');
        return <StaffDashboard {...sharedProps} />;
      case 'studentDashboard':
        console.log('Rendering Student Dashboard');
        return <StudentDashboard {...sharedProps} />;
      default:
        console.log('Unknown page, falling back to login:', currentPage);
        return <LoginPage {...sharedProps} />;
    }
  };

  return (
    <div className="app">
      {renderCurrentPage()}
    </div>
  );
};

export default App;