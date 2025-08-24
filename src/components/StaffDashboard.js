// components/StaffDashboard.js
import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUser, FaSignOutAlt, FaBarcode, FaPlay, FaStop, FaDownload, 
  FaFilter, FaClock, FaCheckCircle, FaTimesCircle, FaBluetooth,
  FaVolumeUp, FaVolumeMute, FaExclamationTriangle, FaCheck, FaEye,
  FaChevronRight, FaUsers, FaWifi, FaSpinner, FaPlug, FaSync
} from 'react-icons/fa';
import { mockData } from '../data/mockData';

const StaffDashboard = ({ 
  currentUser, handleLogout, users, attendance, setAttendance, markAttendance 
}) => {
  // State Management
  const [yearFilter, setYearFilter] = useState('All');
  const [selectedLab, setSelectedLab] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState([]);
  const [scannerInput, setScannerInput] = useState('');
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [studentIdSearch, setStudentIdSearch] = useState('');
  const [activeSection, setActiveSection] = useState('scanner');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [openDropdowns, setOpenDropdowns] = useState({});
  
  // Enhanced Bluetooth Scanner states
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [scannerStatus, setScannerStatus] = useState('disconnected'); // 'disconnected', 'connecting', 'connected', 'error'
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [availableDevices, setAvailableDevices] = useState([]);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [lastScannedId, setLastScannedId] = useState('');
  const [scanFeedback, setScanFeedback] = useState({ type: '', message: '' });
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [duplicateScans, setDuplicateScans] = useState([]);
  const [scanLog, setScanLog] = useState([]); // Complete log of all scans
  const [autoReconnect, setAutoReconnect] = useState(true);
  
  // Refs
  const scannerInputRef = useRef(null);
  const audioContextRef = useRef(null);
  const deviceRef = useRef(null);
  const serverRef = useRef(null);

  // Get staff's assigned labs
  const myLabs = currentUser.assignedLabs || [];
  const myAttendanceRecords = attendance.filter(record => 
    myLabs.includes(record.lab)
  );

  // Check Bluetooth support on component mount
  useEffect(() => {
    if (navigator.bluetooth) {
      setBluetoothSupported(true);
    } else {
      console.log('Web Bluetooth API not supported');
      setBluetoothSupported(false);
    }
  }, []);

  // Helper Functions
  const toggleDropdown = (key) => {
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return 'row-good';
    if (percentage >= 75) return 'row-mid';
    return 'row-low';
  };

  // Filter students that are enrolled in staff's assigned labs
  const getStudentsInMyLabs = () => {
    return users.filter(user => {
      if (user.role !== 'student') return false;
      
      const isEnrolledInMyLabs = user.labs?.some(lab => myLabs.includes(lab)) || 
                                 attendance.some(record => 
                                   record.studentId === user.studentId && myLabs.includes(record.lab)
                                 );
      
      if (yearFilter !== 'All' && user.year !== yearFilter) return false;
      if (studentIdSearch && !String(user.studentId || '').toLowerCase().includes(studentIdSearch.toLowerCase())) return false;
      
      return isEnrolledInMyLabs;
    });
  };

  const filteredStudents = getStudentsInMyLabs();

  // Get all unique years from the actual filtered students data and ensure 4th Year is always included
  const availableYearsFromStudents = [...new Set(filteredStudents.map(student => student.year))].sort();
  const allYears = [...new Set([...availableYearsFromStudents, '4th Year'])];
  
  // Group students by year using all available years
  const studentsByYear = allYears.reduce((acc, year) => {
    acc[year] = filteredStudents.filter(s => s.year === year);
    return acc;
  }, {});

  // Timer for session duration
  useEffect(() => {
    let interval;
    if (isScanning && sessionStartTime) {
      interval = setInterval(() => {
        setSessionDuration(Math.floor((Date.now() - sessionStartTime) / 1000));
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => clearInterval(interval);
  }, [isScanning, sessionStartTime]);

  // Audio feedback setup
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Bluetooth Scanner Functions
  const discoverBluetoothDevices = async () => {
    if (!bluetoothSupported) {
      alert('Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera with HTTPS.');
      return;
    }

    setIsDiscovering(true);
    setConnectionError('');
    
    try {
      // Request Bluetooth device with filters for common barcode scanner services
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '00001812-0000-1000-8000-00805f9b34fb', // Human Interface Device (HID)
          '0000180f-0000-1000-8000-00805f9b34fb', // Battery Service
          '00001800-0000-1000-8000-00805f9b34fb', // Generic Access Service
          '00001801-0000-1000-8000-00805f9b34fb'  // Generic Attribute Service
        ]
      });

      if (device) {
        setAvailableDevices([device]);
        setShowDeviceList(true);
      }
    } catch (error) {
      console.error('Bluetooth discovery error:', error);
      setConnectionError(`Discovery failed: ${error.message}`);
      if (error.name === 'NotAllowedError') {
        setConnectionError('Bluetooth access denied. Please allow Bluetooth permissions and try again.');
      }
    } finally {
      setIsDiscovering(false);
    }
  };

  const connectToDevice = async (device) => {
    setScannerStatus('connecting');
    setConnectionError('');
    setShowDeviceList(false);
    
    try {
      await device.gatt.connect();
      deviceRef.current = device;
      setConnectedDevice(device);
      setScannerStatus('connected');
      showScanFeedback('success', `Connected to ${device.name || 'Scanner'}`, 3000);

      // Listen for disconnection
      device.addEventListener('gattserverdisconnected', handleDeviceDisconnection);
      
      // Setup HID service if available
      await setupHIDService(device);
      
    } catch (error) {
      console.error('Connection error:', error);
      setScannerStatus('error');
      setConnectionError(`Failed to connect: ${error.message}`);
      showScanFeedback('error', 'Connection failed', 3000);
    }
  };

  const setupHIDService = async (device) => {
    try {
      const server = await device.gatt.connect();
      serverRef.current = server;
      
      // Try to get HID service
      const service = await server.getPrimaryService('00001812-0000-1000-8000-00805f9b34fb');
      if (service) {
        console.log('HID service found');
        // Additional HID setup would go here
      }
    } catch (error) {
      console.log('HID service not available, using keyboard input fallback');
      // Fall back to keyboard input capture
    }
  };

  const handleDeviceDisconnection = () => {
    setScannerStatus('disconnected');
    setConnectedDevice(null);
    showScanFeedback('error', 'Scanner disconnected', 3000);
    
    if (autoReconnect && deviceRef.current) {
      setTimeout(() => {
        attemptReconnection();
      }, 2000);
    }
  };

  const attemptReconnection = async () => {
    if (!deviceRef.current) return;
    
    setScannerStatus('connecting');
    try {
      await deviceRef.current.gatt.connect();
      setScannerStatus('connected');
      setConnectedDevice(deviceRef.current);
      showScanFeedback('success', 'Reconnected successfully', 2000);
    } catch (error) {
      setScannerStatus('error');
      setConnectionError('Reconnection failed');
    }
  };

  const disconnectScanner = () => {
    if (deviceRef.current && deviceRef.current.gatt.connected) {
      deviceRef.current.gatt.disconnect();
    }
    setScannerStatus('disconnected');
    setConnectedDevice(null);
    deviceRef.current = null;
    serverRef.current = null;
    showScanFeedback('success', 'Scanner disconnected', 2000);
  };

  // Helper Functions
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Audio feedback functions
  const playBeep = (frequency = 800, duration = 200) => {
    if (!audioEnabled || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration / 1000);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration / 1000);
    } catch (error) {
      console.log('Audio feedback not available:', error);
    }
  };

  const playErrorBeep = () => {
    playBeep(400, 300);
  };

  const playSuccessBeep = () => {
    playBeep(1000, 150);
  };

  const showScanFeedback = (type, message, duration = 3000) => {
    setScanFeedback({ type, message });
    setTimeout(() => setScanFeedback({ type: '', message: '' }), duration);
  };

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Lab,Student_ID,Student_Name,Status,Percentage\n"
      + data.map(row => {
          const student = users.find(u => u.studentId === row.studentId);
          return `${row.date},${row.lab},${row.studentId},${student?.name || 'Unknown'},${row.status},${row.percentage}`;
        }).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportScanLog = () => {
    if (scanLog.length === 0) {
      alert('No scan log to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Student_ID,Student_Name,Status,Lab,Session_ID\n"
      + scanLog.map(log => 
          `${log.timestamp},${log.studentId},${log.studentName},${log.status},${log.lab},${log.sessionId}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scan_log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleViewAttendance = (student) => {
    setSelectedStudent(student);
  };

  const handleChangePassword = (newPassword) => {
    if (!currentUser || !newPassword) return;
    alert('Password updated successfully.');
    setShowChangePassword(false);
  };

  // Event Handlers
  const handleStartSession = () => {
    if (!selectedLab) {
      alert('Please select a lab first');
      return;
    }
    
    if (bluetoothSupported && scannerStatus !== 'connected') {
      alert('Please connect a Bluetooth scanner first');
      return;
    }
    
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setIsScanning(true);
    setScannedStudents([]);
    setDuplicateScans([]);
    setScanLog([]);
    setSessionStartTime(Date.now());
    setScannerInput('');
    setLastScannedId('');
    setScanFeedback({ type: '', message: '' });
    
    // Focus scanner input
    setTimeout(() => {
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    }, 100);
    
    showScanFeedback('success', `Session started for ${selectedLab}`, 2000);
  };

  const handleEndSession = () => {
    if (scannedStudents.length === 0) {
      if (!window.confirm('No students were scanned. Are you sure you want to end the session?')) {
        return;
      }
    }

    setIsScanning(false);
    setSessionStartTime(null);
    
    // Create attendance records for scanned students
    const attendanceData = scannedStudents.map(student => ({
      id: Date.now() + Math.random(),
      studentId: student.studentId,
      date: new Date().toISOString().split('T')[0],
      lab: selectedLab,
      status: 'present',
      percentage: 85,
      markedBy: currentUser.id,
      sessionDuration: sessionDuration,
      sessionId: sessionId
    }));

    setAttendance(prev => [...prev, ...attendanceData]);
    
    // Calculate summary
    const totalEnrolled = users.filter(u => u.role === 'student' && u.labs?.includes(selectedLab)).length;
    const presentCount = scannedStudents.length;
    const absentCount = totalEnrolled - presentCount;
    
    const summary = `Session completed!\n\nLab: ${selectedLab}\nDuration: ${formatTime(sessionDuration)}\nTotal Enrolled: ${totalEnrolled}\nStudents Present: ${presentCount}\nStudents Absent: ${absentCount}\nDuplicate Attempts: ${duplicateScans.length}\n\nWould you like to export the session data?`;
    
    if (window.confirm(summary)) {
      exportScanLog();
    }
    
    // Reset session data
    setScannedStudents([]);
    setDuplicateScans([]);
    setSelectedLab('');
    setScannerInput('');
    setSessionId(null);
    setLastScannedId('');
  };

  const handleScan = (e) => {
    if (e.key === 'Enter' && scannerInput.trim()) {
      const studentId = scannerInput.trim().toUpperCase();
      setLastScannedId(studentId);
      
      const student = users.find(u => 
        u.studentId === studentId && 
        u.role === 'student'
      );
      
      // Add to scan log regardless of outcome
      const logEntry = {
        timestamp: new Date().toISOString(),
        studentId,
        studentName: student?.name || 'Unknown',
        status: 'scanned',
        lab: selectedLab,
        sessionId
      };
      setScanLog(prev => [...prev, logEntry]);
      
      if (!student) {
        showScanFeedback('error', `Student ID ${studentId} not found!`);
        playErrorBeep();
        logEntry.status = 'not_found';
        setScannerInput('');
        return;
      }
      
      if (scannedStudents.find(s => s.studentId === studentId)) {
        showScanFeedback('error', `${student.name} (${studentId}) already scanned!`);
        playErrorBeep();
        setDuplicateScans(prev => [...prev, { studentId, time: new Date().toLocaleTimeString() }]);
        logEntry.status = 'duplicate';
        setScannerInput('');
        return;
      }
      
      const isEnrolledInLab = student.labs?.includes(selectedLab);
      if (!isEnrolledInLab) {
        const confirmScan = window.confirm(
          `${student.name} (${studentId}) is not enrolled in ${selectedLab}. Mark attendance anyway?`
        );
        if (!confirmScan) {
          setScannerInput('');
          return;
        }
        logEntry.status = 'not_enrolled_but_marked';
      } else {
        logEntry.status = 'success';
      }
      
      setScannedStudents(prev => [...prev, {
        ...student,
        scanTime: new Date().toLocaleTimeString(),
        enrolled: isEnrolledInLab
      }]);
      
      showScanFeedback('success', `${student.name} (${studentId}) marked present`);
      playSuccessBeep();
      
      setScannerInput('');
      
      setTimeout(() => {
        if (scannerInputRef.current) {
          scannerInputRef.current.focus();
        }
      }, 100);
    }
  };

  const removeScannedStudent = (studentId) => {
    setScannedStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  const getScannerStatusIcon = () => {
    switch (scannerStatus) {
      case 'connected':
        return <FaCheck style={{ color: '#28a745' }} />;
      case 'connecting':
        return <FaSpinner className="fa-spin" style={{ color: '#ffc107' }} />;
      case 'error':
        return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      default:
        return <FaTimesCircle style={{ color: '#dc3545' }} />;
    }
  };

  const getScannerStatusText = () => {
    switch (scannerStatus) {
      case 'connected':
        return `✅ Connected: ${connectedDevice?.name || 'Scanner'}`;
      case 'connecting':
        return '⏳ Connecting...';
      case 'error':
        return `❌ Error: ${connectionError}`;
      default:
        return '❌ Disconnected';
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-title">Staff Dashboard</h1>
          <div className="dashboard-user profile-area">
            <button className="profile-button" onClick={() => setShowProfileMenu(v => !v)} aria-label="Profile menu">
              <FaUser />
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info-row"><strong>{currentUser?.name}</strong></div>
                <div className="profile-info-row">{currentUser?.email}</div>
                <div className="profile-divider" />
                <button className="profile-item" onClick={() => { setShowChangePassword(true); setShowProfileMenu(false); }}>Change Password</button>
                <button className="profile-item" onClick={() => setShowProfileMenu(false)}>View Profile</button>
                <button className="profile-item danger" onClick={handleLogout}><FaSignOutAlt /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Sidebar */}
        <aside className="sidebar">
          <button className={`sidebar-item ${activeSection === 'scanner' ? 'active' : ''}`} onClick={() => setActiveSection('scanner')}>
            <FaBarcode /> Scanner
          </button>
          <button className={`sidebar-item ${activeSection === 'students' ? 'active' : ''}`} onClick={() => setActiveSection('students')}>
            <FaUsers /> Students
          </button>
        </aside>

        <main className="dashboard-main container">
          {/* Controls Bar */}
          <div className="controls-bar">
            <div className="filter-group">
              <label className="filter-label">
                <FaFilter /> Year Filter
              </label>
              <select
                className="filter-select"
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="All">All Years</option>
                {allYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {activeSection === 'scanner' && (
              <div className="filter-group">
                <label className="filter-label">
                  <FaFilter /> Select Lab
                </label>
                <select
                  className="filter-select"
                  value={selectedLab}
                  onChange={(e) => setSelectedLab(e.target.value)}
                  disabled={isScanning}
                >
                  <option value="">Choose a lab to manage</option>
                  {myLabs.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
              </div>
            )}

            {activeSection === 'students' && (
              <div className="filter-group">
                <label className="filter-label">Search by Student ID</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., STU001"
                  value={studentIdSearch}
                  onChange={(e) => setStudentIdSearch(e.target.value)}
                />
              </div>
            )}
            
            {activeSection === 'scanner' && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <button 
                  className={`btn ${isScanning ? 'btn-secondary' : 'dashboard-btn'}`}
                  onClick={handleStartSession}
                  disabled={!selectedLab || isScanning || (bluetoothSupported && scannerStatus !== 'connected')}
                >
                  <FaPlay /> Start Session
                </button>
                <button 
                  className="btn delete-btn"
                  onClick={handleEndSession}
                  disabled={!isScanning}
                >
                  <FaStop /> End Session
                </button>
              </div>
            )}
            
            {isScanning && (
              <div className="filter-group">
                <label className="filter-label">
                  <FaClock /> Session Duration
                </label>
                <div style={{ 
                  background: '#28a745', 
                  color: 'white', 
                  padding: '10px 15px', 
                  borderRadius: '6px',
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {formatTime(sessionDuration)}
                </div>
              </div>
            )}
          </div>

          {/* Bluetooth Scanner Connection Section */}
          {activeSection === 'scanner' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaBluetooth /> Bluetooth Scanner Connection
                </h2>
              </div>
              
              {/* Scanner Status Bar */}
              <div className="scanner-connection-panel">
                <div className="scanner-status-display">
                  {getScannerStatusIcon()}
                  <span className="status-text">{getScannerStatusText()}</span>
                  {bluetoothSupported ? (
                    <div className="scanner-controls">
                      {scannerStatus === 'disconnected' && (
                        <button className="btn btn-primary" onClick={discoverBluetoothDevices} disabled={isDiscovering}>
                          {isDiscovering ? <><FaSpinner className="fa-spin" /> Discovering...</> : <><FaWifi /> Connect Scanner</>}
                        </button>
                      )}
                      {scannerStatus === 'connected' && (
                        <button className="btn btn-secondary" onClick={disconnectScanner}>
                          <FaPlug /> Disconnect
                        </button>
                      )}
                      {scannerStatus === 'error' && (
                        <button className="btn btn-primary" onClick={attemptReconnection}>
                          <FaSync /> Reconnect
                        </button>
                      )}
                      <label style={{ marginLeft: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <input 
                          type="checkbox" 
                          checked={autoReconnect} 
                          onChange={(e) => setAutoReconnect(e.target.checked)}
                        />
                        Auto-reconnect
                      </label>
                    </div>
                  ) : (
                    <div className="bluetooth-not-supported">
                      <FaExclamationTriangle style={{ color: '#ffc107' }} />
                      Bluetooth not supported. Please use Chrome/Edge with HTTPS or manual input.
                    </div>
                  )}
                </div>

                {connectionError && (
                  <div className="connection-error">
                    <FaExclamationTriangle /> {connectionError}
                  </div>
                )}
                
                {/* Device Selection Modal */}
                {showDeviceList && (
                  <div className="device-selection-modal">
                    <div className="device-list">
                      <h3>Select Bluetooth Scanner</h3>
                      {availableDevices.map((device, index) => (
                        <div key={index} className="device-item" onClick={() => connectToDevice(device)}>
                          <FaBluetooth />
                          <div className="device-info">
                            <div className="device-name">{device.name || 'Unknown Device'}</div>
                            <div className="device-id">ID: {device.id}</div>
                          </div>
                          <button className="btn btn-small">Connect</button>
                        </div>
                      ))}
                      <button className="btn btn-secondary" onClick={() => setShowDeviceList(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Students Section */}
          {activeSection === 'students' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaUsers /> My Students ({filteredStudents.length} total)
                </h2>
              </div>
              
              {allYears.map(year => {
                const yearStudents = studentsByYear[year] || [];
                // Always show 4th Year dropdown, show others only if they have students
                if (yearStudents.length === 0 && year !== '4th Year') return null;
                
                return (
                  <div key={year}>
                    <div 
                      className="dropdown-header"
                      onClick={() => toggleDropdown(`students-${year}`)}
                    >
                      <span>{year} ({yearStudents.length} students)</span>
                      <span className={`chevron ${openDropdowns[`students-${year}`] ? 'rotated' : ''}`}>
                        <FaChevronRight />
                      </span>
                    </div>
                    <div className={`dropdown-content ${openDropdowns[`students-${year}`] ? 'open' : ''}`}>
                      <div className="table-container">
                        {yearStudents.length > 0 ? (
                          <table className="table">
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Attendance %</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {yearStudents.map(student => {
                                const studentAttendance = attendance.filter(a => 
                                  a.studentId === student.studentId && myLabs.includes(a.lab)
                                );
                                const avgAttendance = studentAttendance.length > 0
                                  ? Math.round(studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length)
                                  : 0;
                                
                                return (
                                  <tr key={student.id} className={getAttendanceColor(avgAttendance)}>
                                    <td>{student.studentId}</td>
                                    <td>{student.name}</td>
                                    <td>{student.email}</td>
                                    <td>
                                      <span className={`attendance-percentage percentage-${
                                        avgAttendance >= 85 ? 'good' : avgAttendance >= 75 ? 'mid' : 'low'
                                      }`}>
                                        {avgAttendance}%
                                      </span>
                                    </td>
                                    <td>
                                      <div className="action-buttons">
                                        <button 
                                          className="action-btn view-attendance-btn"
                                          onClick={() => handleViewAttendance(student)}
                                          title="View Attendance"
                                        >
                                          <FaEye /> View
                                        </button>
                                        <button 
                                          className="action-btn export-btn"
                                          onClick={() => {
                                            const studentAttendanceInMyLabs = attendance.filter(a => 
                                              a.studentId === student.studentId && myLabs.includes(a.lab)
                                            );
                                            exportCSV(studentAttendanceInMyLabs, `${student.studentId}_attendance.csv`);
                                          }}
                                          title="Export CSV"
                                        >
                                          <FaDownload /> Export
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ 
                            padding: '20px', 
                            textAlign: 'center', 
                            color: '#666', 
                            fontStyle: 'italic',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            backgroundColor: '#f9f9f9'
                          }}>
                            No {year} students found in your assigned labs.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Student Attendance Details */}
          {selectedStudent && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  Attendance Details - {selectedStudent.name}
                </h2>
                <div>
                  <button 
                    className="btn export-btn"
                    onClick={() => {
                      const studentAttendance = attendance.filter(a => 
                        a.studentId === selectedStudent.studentId && myLabs.includes(a.lab)
                      );
                      exportCSV(studentAttendance, `${selectedStudent.studentId}_detailed_attendance.csv`);
                    }}
                    style={{ marginRight: '10px' }}
                  >
                    <FaDownload /> Export CSV
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setSelectedStudent(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Subject/Lab</th>
                      <th>Status</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance
                      .filter(a => a.studentId === selectedStudent.studentId && myLabs.includes(a.lab))
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map(record => (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.lab}</td>
                          <td>
                            <span className={`attendance-percentage ${
                              record.status === 'present' ? 'percentage-good' : 'percentage-low'
                            }`}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td>{record.percentage}%</td>
                        </tr>
                      ))
                    }
                    {attendance.filter(a => a.studentId === selectedStudent.studentId && myLabs.includes(a.lab)).length === 0 && (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                          No attendance records found for this student in your assigned labs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Scanner Interface */}
          {activeSection === 'scanner' && (
            <>
              {isScanning ? (
                <div className="scanner-interface">
                  {/* Enhanced Scanner Status Bar */}
                  <div className="scanner-status-bar">
                    <div className="scanner-status">
                      {getScannerStatusIcon()}
                      <span>Scanner: {getScannerStatusText()}</span>
                    </div>
                    <div className="scanner-controls">
                      <button 
                        className={`btn ${audioEnabled ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        title={audioEnabled ? 'Disable Audio' : 'Enable Audio'}
                      >
                        {audioEnabled ? <FaVolumeUp /> : <FaVolumeMute />}
                      </button>
                      <button 
                        className="btn export-btn"
                        onClick={exportScanLog}
                        disabled={scanLog.length === 0}
                        title="Export Scan Log"
                      >
                        <FaDownload /> Export Log
                      </button>
                    </div>
                  </div>

                  {/* Last Scanned ID Display */}
                  {lastScannedId && (
                    <div className="last-scanned-display">
                      <h3>Last Scanned ID:</h3>
                      <div className="scanned-id">{lastScannedId}</div>
                    </div>
                  )}

                  {/* Scan Feedback */}
                  {scanFeedback.message && (
                    <div className={`scan-feedback ${scanFeedback.type}`}>
                      {scanFeedback.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
                      {scanFeedback.message}
                    </div>
                  )}

                  {/* Scanner Input */}
                  <input
                    ref={scannerInputRef}
                    type="text"
                    className="scanner-input"
                    placeholder="Scan student ID or type manually and press Enter..."
                    value={scannerInput}
                    onChange={(e) => setScannerInput(e.target.value.toUpperCase())}
                    onKeyPress={handleScan}
                    autoFocus
                  />

                  {/* Enhanced Real-time Stats */}
                  <div className="scanner-stats">
                    <div className="stat-item">
                      <span className="stat-label">Students Present:</span>
                      <span className="stat-value">{scannedStudents.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Session Duration:</span>
                      <span className="stat-value">{formatTime(sessionDuration)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Duplicate Attempts:</span>
                      <span className="stat-value error">{duplicateScans.length}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Total Scans:</span>
                      <span className="stat-value">{scanLog.length}</span>
                    </div>
                  </div>
                  
                  {scannedStudents.length > 0 && (
                    <div className="scanned-students">
                      <div className="scanned-header">
                        <h3>Students Marked Present ({scannedStudents.length})</h3>
                        <button 
                          className="btn export-btn"
                          onClick={() => exportCSV(scannedStudents.map(s => ({
                            studentId: s.studentId,
                            name: s.name,
                            year: s.year,
                            scanTime: s.scanTime,
                            enrolled: s.enrolled ? 'Yes' : 'No',
                            lab: selectedLab,
                            sessionId: sessionId
                          })), `${selectedLab}_session_${new Date().toISOString().split('T')[0]}.csv`)}
                        >
                          <FaDownload /> Export Session
                        </button>
                      </div>
                      {scannedStudents.map(student => (
                        <div key={student.studentId} className="scanned-student">
                          <div className="scanned-student-info">
                            <div className="scanned-student-id">
                              {student.studentId} - {student.name}
                            </div>
                            <div className="scanned-student-name">
                              {student.year} | Scanned at: {student.scanTime}
                              {!student.enrolled && (
                                <span style={{ color: '#ffc107', marginLeft: '10px' }}>
                                  ⚠️ Not enrolled in this lab
                                </span>
                              )}
                            </div>
                          </div>
                          <button 
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '12px' }}
                            onClick={() => removeScannedStudent(student.studentId)}
                            title="Remove from scan list"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Duplicate Scans Log */}
                  {duplicateScans.length > 0 && (
                    <div className="duplicate-scans">
                      <h3>Duplicate Scan Attempts ({duplicateScans.length})</h3>
                      {duplicateScans.map((scan, index) => (
                        <div key={index} className="duplicate-scan-item">
                          <span>{scan.studentId}</span>
                          <span>{scan.time}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="scanner-interface">
                  <div className="scanner-status inactive">
                    <FaBarcode />
                    Scanner Ready
                  </div>
                  <p style={{ color: '#666', fontSize: '16px' }}>
                    {bluetoothSupported 
                      ? (scannerStatus === 'connected' 
                          ? `Connected to ${connectedDevice?.name || 'Scanner'}. Select a lab and start session.`
                          : 'Connect a Bluetooth scanner and select a lab to begin scanning.')
                      : 'Select a lab and start session to begin manual ID entry.'
                    }
                  </p>
                </div>
              )}
            </>
          )}

          {/* Quick Stats */}
          <div className="summary-cards">
            <div className="summary-card">
              <h3>My Labs</h3>
              <div className="value">{myLabs.length}</div>
            </div>
            <div className="summary-card attendance">
              <h3>{activeSection === 'students' ? 'Total Students' : 'Sessions Conducted'}</h3>
              <div className="value">{activeSection === 'students' ? filteredStudents.length : myAttendanceRecords.length}</div>
            </div>
            <div className="summary-card students">
              <h3>Students Marked Today</h3>
              <div className="value">
                {myAttendanceRecords.filter(r => 
                  r.date === new Date().toISOString().split('T')[0]
                ).length}
              </div>
            </div>
          </div>

          {/* Attendance History */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">
                {activeSection === 'students' ? 'Recent Attendance Activity' : 'Attendance History'}
              </h2>
              <div>
                <button 
                  className="btn export-btn"
                  onClick={() => exportCSV(myAttendanceRecords, `${currentUser.name}_attendance_${new Date().toISOString().split('T')[0]}.csv`)}
                  disabled={myAttendanceRecords.length === 0}
                >
                  <FaDownload /> Export All
                </button>
              </div>
            </div>
            
            <div className="table-container" style={{ 
              maxHeight: '400px', 
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}>
              <table className="table">
                <thead style={{ 
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f8f9fa',
                  zIndex: 1
                }}>
                  <tr>
                    <th>Date</th>
                    <th>Lab</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Status</th>
                    <th>Time Marked</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendanceRecords
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, activeSection === 'students' ? 10 : undefined)
                    .map(record => {
                      const student = users.find(u => u.studentId === record.studentId);
                      return (
                        <tr key={record.id}>
                          <td>{record.date}</td>
                          <td>{record.lab}</td>
                          <td>{record.studentId}</td>
                          <td>{student?.name || 'Unknown Student'}</td>
                          <td>
                            <span className={`attendance-percentage ${
                              record.status === 'present' ? 'percentage-good' : 'percentage-low'
                            }`}>
                              {record.status === 'present' ? (
                                <><FaCheckCircle /> Present</>
                              ) : (
                                <><FaTimesCircle /> Absent</>
                              )}
                            </span>
                          </td>
                          <td>
                            {record.sessionDuration ? 
                              formatTime(record.sessionDuration) : 
                              'Manual Entry'
                            }
                          </td>
                        </tr>
                      );
                    })
                  }
                  {myAttendanceRecords.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                        No attendance records found. Start a session to begin marking attendance.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lab-wise Summary - Only show in scanner section */}
          {activeSection === 'scanner' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">Lab-wise Summary</h2>
              </div>
              
              <div className="table-container">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Lab</th>
                      <th>Total Sessions</th>
                      <th>Students Marked</th>
                      <th>Last Session</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myLabs.map(lab => {
                      const labRecords = myAttendanceRecords.filter(r => r.lab === lab);
                      const uniqueDates = [...new Set(labRecords.map(r => r.date))];
                      const lastSession = labRecords.length > 0 ? 
                        Math.max(...labRecords.map(r => new Date(r.date))) : null;
                      
                      return (
                        <tr key={lab}>
                          <td>{lab}</td>
                          <td>{uniqueDates.length}</td>
                          <td>{labRecords.length}</td>
                          <td>
                            {lastSession ? 
                              new Date(lastSession).toLocaleDateString() : 
                              'No sessions yet'
                            }
                          </td>
                          <td>
                            <button 
                              className="btn export-btn"
                              onClick={() => exportCSV(labRecords, `${lab}_attendance.csv`)}
                              disabled={labRecords.length === 0}
                            >
                              <FaDownload /> Export
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {myLabs.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                          No labs assigned. Please contact HOD to assign labs.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-header">Change Password</h2>
            <ChangePasswordForm onCancel={() => setShowChangePassword(false)} onSave={handleChangePassword} />
          </div>
        </div>
      )}

      {/* Custom Styles for Bluetooth Features */}
      <style jsx>{`
        .scanner-connection-panel {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .scanner-status-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 15px;
        }

        .status-text {
          font-size: 16px;
          font-weight: 500;
          margin-left: 10px;
        }

        .scanner-controls {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .connection-error {
          background: #f8d7da;
          color: #721c24;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .bluetooth-not-supported {
          background: #fff3cd;
          color: #856404;
          padding: 10px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-selection-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .device-list {
          background: white;
          padding: 20px;
          border-radius: 8px;
          min-width: 400px;
          max-width: 500px;
        }

        .device-item {
          display: flex;
          align-items: center;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 6px;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .device-item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .device-info {
          margin-left: 10px;
          flex: 1;
        }

        .device-name {
          font-weight: 500;
          margin-bottom: 2px;
        }

        .device-id {
          font-size: 12px;
          color: #666;
        }

        .btn-small {
          padding: 5px 10px;
          font-size: 12px;
        }

        .fa-spin {
          animation: fa-spin 2s infinite linear;
        }

        @keyframes fa-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(359deg);
          }
        }
      `}</style>
    </div>
  );
};

const ChangePasswordForm = ({ onCancel, onSave }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const canSave = password && password.length >= 6 && password === confirm;
  return (
    <div>
      <div className="form-group">
        <label className="form-label">New Password</label>
        <input className="form-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter new password" />
      </div>
      <div className="form-group">
        <label className="form-label">Confirm Password</label>
        <input className="form-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter password" />
      </div>
      <div className="modal-actions">
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={!canSave} onClick={() => onSave(password)}>Save Password</button>
      </div>
    </div>
  );
};

export default StaffDashboard;