// components/StudentDashboard.js
import React, { useState } from 'react';
import { 
  FaUser, FaSignOutAlt, FaDownload, FaBell, FaCheckCircle, 
  FaTimesCircle, FaChartBar, FaGraduationCap 
} from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const StudentDashboard = ({ 
  currentUser, handleLogout, users, attendance, notifications 
}) => {
  // State for profile dropdown and change password
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Get student's attendance records
  const myAttendance = attendance?.filter(a => a.studentId === currentUser?.studentId) || [];
  
  // Calculate overall statistics
  const totalClasses = myAttendance.length;
  const presentClasses = myAttendance.filter(a => a.status === 'present').length;
  const absentClasses = totalClasses - presentClasses;
  const overallPercentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  // Lab-wise breakdown
  const labWiseAttendance = myAttendance.reduce((acc, record) => {
    if (!acc[record.lab]) {
      acc[record.lab] = { present: 0, total: 0, lab: record.lab };
    }
    acc[record.lab].total++;
    if (record.status === 'present') {
      acc[record.lab].present++;
    }
    return acc;
  }, {});

  // Convert to array and calculate percentages
  const labWiseData = Object.values(labWiseAttendance).map(lab => ({
    ...lab,
    percentage: lab.total > 0 ? Math.round((lab.present / lab.total) * 100) : 0,
    absent: lab.total - lab.present
  }));

  // Data for pie chart
  const pieData = [
    { name: 'Present', value: presentClasses, color: '#28a745' },
    { name: 'Absent', value: absentClasses, color: '#dc3545' }
  ];

  // Get student's notifications
  const myNotifications = notifications?.filter(n => n.studentId === currentUser.studentId || n.userId === currentUser.id) || [];

  // Helper functions
  const getAttendanceColor = (percentage) => {
    if (percentage >= 85) return 'percentage-good';
    if (percentage >= 75) return 'percentage-mid';
    return 'percentage-low';
  };

  const getRowColor = (percentage) => {
    if (percentage >= 85) return 'row-good';
    if (percentage >= 75) return 'row-mid';
    return 'row-low';
  };

  const handleChangePassword = (newPassword) => {
    if (!currentUser || !newPassword) return;
    // This would typically update the user's password in the database
    alert('Password updated successfully.');
    setShowChangePassword(false);
  };

  const exportCSV = () => {
    if (myAttendance.length === 0) {
      alert('No attendance data to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Date,Lab,Status,Percentage\n"
      + myAttendance.map(row => 
          `${row.date},${row.lab},${row.status},${row.percentage}`
        ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentUser?.studentId || 'student'}_attendance_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAttendanceReport = () => {
    const reportContent = `
ATTENDANCE REPORT
=================
Student: ${currentUser.name}
Student ID: ${currentUser.studentId}
Year: ${currentUser.year}
Email: ${currentUser.email}
Report Generated: ${new Date().toLocaleString()}

OVERALL SUMMARY
===============
Total Classes: ${totalClasses}
Present: ${presentClasses}
Absent: ${absentClasses}
Overall Percentage: ${overallPercentage}%

LAB-WISE BREAKDOWN
==================
${labWiseData.map(lab => 
  `${lab.lab}: ${lab.percentage}% (${lab.present}/${lab.total})`
).join('\n')}

DETAILED ATTENDANCE
===================
${myAttendance.map(record => 
  `${record.date} | ${record.lab} | ${record.status.toUpperCase()}`
).join('\n')}
    `;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentUser.studentId}_attendance_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-container">
      {/* Header - Same style as Staff Dashboard */}
      <div className="dashboard-header">
        <div className="dashboard-nav">
          <h1 className="dashboard-title">Student Dashboard</h1>
          <div className="dashboard-user profile-area">
            <button className="profile-button" onClick={() => setShowProfileMenu(v => !v)} aria-label="Profile menu">
              <FaUser />
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info-row"><strong>{currentUser?.name}</strong></div>
                <div className="profile-info-row">{currentUser?.studentId}</div>
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

      <div className="container">
        {/* Attendance Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card attendance">
            <h3>Overall Attendance</h3>
            <div className="value" style={{ 
              color: overallPercentage >= 85 ? '#28a745' : 
                     overallPercentage >= 75 ? '#ffc107' : '#dc3545' 
            }}>
              {overallPercentage}%
            </div>
          </div>
          <div className="summary-card students">
            <h3>Present sessions</h3>
            <div className="value">{presentClasses}</div>
          </div>
          <div className="summary-card staff">
            <h3>Absent sessions</h3>
            <div className="value">{absentClasses}</div>
          </div>
          <div className="summary-card">
            <h3>Total sessions</h3>
            <div className="value">{totalClasses}</div>
          </div>
        </div>

        {/* Notifications */}
        {myNotifications && myNotifications.length > 0 && (
          <div className="notifications">
            <div className="section-header">
              <h2 className="section-title">
                <FaBell /> My Notifications
              </h2>
            </div>
            {myNotifications.map((notification, index) => (
              <div key={notification.id || index} className={`notification-item ${notification.type || ''}`}>
                <FaBell />
                {notification.message}
              </div>
            ))}
          </div>
        )}

        {/* Lab-wise Breakdown */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <FaChartBar /> Lab-wise Attendance Breakdown
            </h2>
            <button 
              className="btn export-btn"
              onClick={exportCSV}
              disabled={myAttendance.length === 0}
            >
              <FaDownload /> Export CSV
            </button>
          </div>
          
          {labWiseData.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Lab/Subject</th>
                    <th>Present</th>
                    <th>Absent</th>
                    <th>Total</th>
                    <th>Percentage</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {labWiseData.map(lab => (
                    <tr key={lab.lab} className={getRowColor(lab.percentage)}>
                      <td>{lab.lab}</td>
                      <td>
                        <span style={{ color: '#28a745' }}>
                          <FaCheckCircle /> {lab.present}
                        </span>
                      </td>
                      <td>
                        <span style={{ color: '#dc3545' }}>
                          <FaTimesCircle /> {lab.absent}
                        </span>
                      </td>
                      <td>{lab.total}</td>
                      <td>
                        <span className={`attendance-percentage ${getAttendanceColor(lab.percentage)}`}>
                          {lab.percentage}%
                        </span>
                      </td>
                      <td>
                        {lab.percentage >= 85 && (
                          <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                            <FaCheckCircle /> Excellent
                          </span>
                        )}
                        {lab.percentage >= 75 && lab.percentage < 85 && (
                          <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                            ⚠️ Good
                          </span>
                        )}
                        {lab.percentage < 75 && (
                          <span style={{ color: '#dc3545', fontWeight: 'bold' }}>
                            <FaTimesCircle /> Below Requirement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <FaGraduationCap size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
              <p>No attendance data available yet.</p>
              <p>Your attendance will appear here once you start attending lab sessions.</p>
            </div>
          )}
        </div>

        {/* Charts Section */}
        {totalClasses > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', marginBottom: '30px' }}>
            {/* Overall Attendance Pie Chart */}
            <div className="chart-container">
              <h2 className="chart-title">Overall Attendance Distribution</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({name, value, percent}) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Lab-wise Bar Chart */}
            <div className="chart-container">
              <h2 className="chart-title">Lab-wise Performance</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={labWiseData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="lab" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    fontSize={12}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [`${value}%`, 'Attendance']}
                    labelFormatter={(label) => `Lab: ${label}`}
                  />
                  <Bar 
                    dataKey="percentage" 
                    fill="#667eea"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Detailed Attendance History */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">My Attendance History</h2>
            <div>
              <button 
                className="btn dashboard-btn"
                onClick={generateAttendanceReport}
                disabled={myAttendance.length === 0}
                style={{ marginRight: '10px' }}
              >
                <FaDownload /> Generate Report
              </button>
              <button 
                className="btn export-btn"
                onClick={exportCSV}
                disabled={myAttendance.length === 0}
              >
                <FaDownload /> Export CSV
              </button>
            </div>
          </div>
          
          {myAttendance.length > 0 ? (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lab/Subject</th>
                    <th>Status</th>
                    <th>Day</th>
                  </tr>
                </thead>
                <tbody>
                  {myAttendance
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(record => (
                      <tr key={record.id}>
                        <td>{new Date(record.date).toLocaleDateString()}</td>
                        <td>{record.lab}</td>
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
                        <td>{new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <FaGraduationCap size={48} style={{ opacity: 0.3, marginBottom: '20px' }} />
              <p>No attendance records found.</p>
              <p>Your attendance history will appear here once you start attending lab sessions.</p>
            </div>
          )}
        </div>

        {/* Performance Tips */}
        {overallPercentage < 75 && myAttendance.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title" style={{ color: '#dc3545' }}>
                <FaBell /> Attendance Improvement Tips
              </h2>
            </div>
            <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', margin: '20px' }}>
              <h4 style={{ color: '#856404', marginBottom: '10px' }}>⚠️ Your attendance is below the required 75%</h4>
              <ul style={{ color: '#856404', paddingLeft: '20px' }}>
                <li>Try to attend all upcoming lab sessions</li>
                <li>Contact your lab instructor if you have valid reasons for absence</li>
                <li>Set reminders for your lab schedule</li>
                <li>Join study groups to stay motivated</li>
                {overallPercentage < 50 && <li style={{ fontWeight: 'bold' }}>⚠️ Critical: Contact HOD immediately for academic counseling</li>}
              </ul>
            </div>
          </div>
        )}

        {overallPercentage >= 85 && myAttendance.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2 className="section-title" style={{ color: '#28a745' }}>
                <FaCheckCircle /> Excellent Performance!
              </h2>
            </div>
            <div style={{ padding: '20px', background: '#d4edda', borderRadius: '8px', margin: '20px' }}>
              <h4 style={{ color: '#155724', marginBottom: '10px' }}>🎉 Congratulations on maintaining excellent attendance!</h4>
              <p style={{ color: '#155724' }}>
                Keep up the great work! Your consistent attendance will contribute to your academic success.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password Modal - Same as Staff Dashboard */}
      {showChangePassword && (
        <div className="modal-overlay">
          <div className="modal">
            <h2 className="modal-header">Change Password</h2>
            <ChangePasswordForm onCancel={() => setShowChangePassword(false)} onSave={handleChangePassword} />
          </div>
        </div>
      )}
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

export default StudentDashboard;