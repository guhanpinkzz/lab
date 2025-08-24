// components/HODDashboard.js
import React, { useState } from 'react';
import { 
  FaUser, FaSignOutAlt, FaFilter, FaPlus, FaKey, FaEye, FaDownload, 
  FaTrash, FaChevronRight, FaBell, FaUsers, FaChartPie, FaCog, FaCheck, FaTimes,
  FaBook, FaGraduationCap, FaEdit, FaSave, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for demonstration
const mockData = {
  years: ['2nd Year', '3rd Year', '4th Year'],
  labs: ['Physics Lab', 'Chemistry Lab', 'Electronics Lab', 'Computer Lab', 'Circuit Analysis Lab', 'Project Lab', 'Advanced Electronics Lab', 'Research Lab']
};

const HODDashboard = ({ 
  currentUser = { name: 'Dr. John Smith', email: 'john.smith@university.edu' },
  handleLogout = () => console.log('Logout'),
  users = [
    { id: 1, name: 'Alice Johnson', email: 'alice@student.edu', role: 'student', year: '2nd Year', studentId: 'STU001' },
    { id: 2, name: 'Bob Wilson', email: 'bob@student.edu', role: 'student', year: '3rd Year', studentId: 'STU002' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@student.edu', role: 'student', year: '4th Year', studentId: 'STU003' },
    { id: 4, name: 'Prof. Sarah Davis', email: 'sarah@staff.edu', role: 'staff', assignedLabs: ['Physics Lab', 'Chemistry Lab'] }
  ],
  setUsers = () => {},
  attendance = [
    { id: 1, studentId: 'STU001', lab: 'Physics Lab', date: '2024-01-15', status: 'present', percentage: 85 },
    { id: 2, studentId: 'STU002', lab: 'Electronics Lab', date: '2024-01-15', status: 'absent', percentage: 72 },
    { id: 3, studentId: 'STU003', lab: 'Computer Lab', date: '2024-01-15', status: 'present', percentage: 90 }
  ],
  notifications = [
    { id: 1, message: 'Bob Wilson has low attendance (72%)', type: 'warning' }
  ],
  addUser = () => 'temp123456',
  deleteUser = () => {},
  updateUserPassword = () => {}
}) => {
  // State Management
  const [yearFilter, setYearFilter] = useState('All');
  const [labFilter, setLabFilter] = useState('All Labs');
  const [openDropdowns, setOpenDropdowns] = useState({});
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showAddModal, setShowAddModal] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);
  const [activeSection, setActiveSection] = useState('overview');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [drilldownYear, setDrilldownYear] = useState(null);
  const [studentIdSearch, setStudentIdSearch] = useState('');
  const [showLabAssignModal, setShowLabAssignModal] = useState(null);
  const [selectedStaffLabs, setSelectedStaffLabs] = useState([]);

  // Lab Subject Management States
  const [selectedYear, setSelectedYear] = useState('2nd Year');
  const [labSubjects, setLabSubjects] = useState({
    '2nd Year': ['Physics Lab', 'Chemistry Lab'],
    '3rd Year': ['Electronics Lab', 'Computer Lab', 'Circuit Analysis Lab'],
    '4th Year': ['Project Lab', 'Advanced Electronics Lab', 'Research Lab']
  });
  const [newSubject, setNewSubject] = useState('');
  const [editingSubject, setEditingSubject] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [notification, setNotification] = useState({ type: '', message: '' });

  // Available years
  const years = ['2nd Year', '3rd Year', '4th Year'];

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

  const exportCSV = (data, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(data[0]).join(",") + "\n"
      + data.map(row => Object.values(row).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Lab Subject Management Functions
  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification({ type: '', message: '' }), 3000);
  };

  const updateStudentLabAssignments = (year, subjects) => {
    const updatedUsers = users.map(user => {
      if (user.role === 'student' && user.year === year) {
        return {
          ...user,
          labs: subjects
        };
      }
      return user;
    });
    setUsers(updatedUsers);
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) {
      showNotification('error', 'Subject name cannot be empty');
      return;
    }

    if (labSubjects[selectedYear].includes(newSubject.trim())) {
      showNotification('error', 'Subject already exists for this year');
      return;
    }

    const updatedSubjects = {
      ...labSubjects,
      [selectedYear]: [...labSubjects[selectedYear], newSubject.trim()]
    };
    
    setLabSubjects(updatedSubjects);
    updateStudentLabAssignments(selectedYear, updatedSubjects[selectedYear]);
    setNewSubject('');
    setShowAddForm(false);
    showNotification('success', `"${newSubject.trim()}" added to ${selectedYear} successfully`);
  };

  const handleRemoveSubject = (subjectToRemove) => {
    if (window.confirm(`Are you sure you want to remove "${subjectToRemove}" from ${selectedYear}? This will affect all ${selectedYear} students.`)) {
      const updatedSubjects = {
        ...labSubjects,
        [selectedYear]: labSubjects[selectedYear].filter(subject => subject !== subjectToRemove)
      };
      
      setLabSubjects(updatedSubjects);
      updateStudentLabAssignments(selectedYear, updatedSubjects[selectedYear]);
      showNotification('success', `"${subjectToRemove}" removed from ${selectedYear} successfully`);
    }
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setEditingValue(subject);
  };

  const handleSaveEdit = () => {
    if (!editingValue.trim()) {
      showNotification('error', 'Subject name cannot be empty');
      return;
    }

    if (editingValue.trim() !== editingSubject && labSubjects[selectedYear].includes(editingValue.trim())) {
      showNotification('error', 'Subject already exists for this year');
      return;
    }

    const updatedSubjects = {
      ...labSubjects,
      [selectedYear]: labSubjects[selectedYear].map(subject => 
        subject === editingSubject ? editingValue.trim() : subject
      )
    };
    
    setLabSubjects(updatedSubjects);
    updateStudentLabAssignments(selectedYear, updatedSubjects[selectedYear]);
    setEditingSubject(null);
    setEditingValue('');
    showNotification('success', `Subject updated to "${editingValue.trim()}" successfully`);
  };

  const handleCancelEdit = () => {
    setEditingSubject(null);
    setEditingValue('');
  };

  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewSubject('');
  };

  const getStudentCount = (year) => {
    return users.filter(user => user.role === 'student' && user.year === year).length;
  };

  const applySubjectsToStudents = () => {
    if (window.confirm(`Apply current subject list to all ${selectedYear} students? This will override their existing lab assignments.`)) {
      updateStudentLabAssignments(selectedYear, labSubjects[selectedYear]);
      showNotification('success', `Lab subjects applied to all ${selectedYear} students successfully`);
    }
  };

  // Data Processing
  const filteredStudents = users.filter(u => {
    if (u.role !== 'student') return false;
    if (yearFilter !== 'All' && u.year !== yearFilter) return false;
    if (labFilter !== 'All Labs') {
      const hasLab = attendance.some(a => a.studentId === u.studentId && a.lab === labFilter);
      if (!hasLab) return false;
    }
    if (studentIdSearch && !String(u.studentId || '').toLowerCase().includes(studentIdSearch.toLowerCase())) return false;
    return true;
  });

  const filteredStaff = users.filter(u => u.role === 'staff');

  // Group students by year
  const studentsByYear = mockData.years.reduce((acc, year) => {
    acc[year] = filteredStudents.filter(s => s.year === year);
    return acc;
  }, {});

  // Calculate statistics
  const totalStudents = filteredStudents.length;
  const totalStaff = filteredStaff.length;
  const avgAttendance = attendance.length > 0 
    ? Math.round(attendance.reduce((sum, a) => sum + a.percentage, 0) / attendance.length)
    : 0;

  // Pie chart data
  const pieData = mockData.years.map(year => {
    const yearStudents = studentsByYear[year] || [];
    const yearAttendance = yearStudents.length > 0
      ? yearStudents.reduce((sum, student) => {
          const studentAttendance = attendance.filter(a => a.studentId === student.studentId);
          const avgAtt = studentAttendance.length > 0
            ? studentAttendance.reduce((s, a) => s + a.percentage, 0) / studentAttendance.length
            : 0;
          return sum + avgAtt;
        }, 0) / yearStudents.length
      : 0;
    
    return {
      name: year,
      value: Math.round(yearAttendance) || 0,
      students: yearStudents.length
    };
  }).filter(item => item.students > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Event Handlers
  const handleGenerateTempPassword = (userId) => {
    const password = 'temp' + Math.random().toString(36).substr(2, 6);
    updateUserPassword(userId, password);
    setTempPassword(password);
  };

  const handleViewAttendance = (student) => {
    setSelectedStudent(student);
  };

  const handleAddUser = (password) => {
    setTempPassword(password);
  };

  const handleChangePassword = (newPassword) => {
    if (!currentUser || !newPassword) return;
    setUsers(users.map(u => u.id === currentUser.id ? { ...u, password: newPassword, temporaryPassword: false } : u));
    setShowChangePassword(false);
    alert('Password updated successfully.');
  };

  const handleAssignLabs = (staff) => {
    setShowLabAssignModal(staff);
    setSelectedStaffLabs(staff.assignedLabs || []);
  };

  const handleLabToggle = (labName) => {
    setSelectedStaffLabs(prev => {
      if (prev.includes(labName)) {
        return prev.filter(lab => lab !== labName);
      } else {
        return [...prev, labName];
      }
    });
  };

  const handleSaveLabAssignment = () => {
    if (!showLabAssignModal) return;
    
    setUsers(users.map(u => 
      u.id === showLabAssignModal.id 
        ? { ...u, assignedLabs: selectedStaffLabs }
        : u
    ));
    
    setShowLabAssignModal(null);
    setSelectedStaffLabs([]);
    alert(`Lab assignments updated successfully for ${showLabAssignModal.name}`);
  };

  // Modal Components
  const AddUserModal = ({ type, onClose, onAdd }) => {
    const [formData, setFormData] = useState({
      name: '', email: '', year: '2nd Year', studentId: '', assignedLabs: []
    });

    const handleSubmit = () => {
      if (!formData.name || !formData.email) {
        alert('Please fill in all required fields');
        return;
      }
      
      const userData = {
        ...formData,
        role: type,
        studentId: type === 'student' ? formData.studentId || `STU${Date.now()}` : undefined,
        labs: type === 'student' ? [] : undefined,
        assignedLabs: type === 'staff' ? formData.assignedLabs : undefined
      };
      
      const tempPassword = addUser(userData);
      onAdd(tempPassword);
      onClose();
    };

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2 className="modal-header">Add New {type === 'student' ? 'Student' : 'Staff'}</h2>
          <div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Enter full name"
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Enter email address"
              />
            </div>
            
            {type === 'student' && (
              <>
                <div className="form-group">
                  <label className="form-label">Student ID (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                    placeholder="Auto-generated if empty"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Year</label>
                  <select
                    className="form-input"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                  >
                    {mockData.years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            {type === 'staff' && (
              <div className="form-group">
                <label className="form-label">Assigned Labs (Optional)</label>
                <select
                  multiple
                  className="form-input"
                  style={{ height: '120px' }}
                  value={formData.assignedLabs}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value);
                    setFormData({...formData, assignedLabs: selected});
                  }}
                >
                  {mockData.labs.map(lab => (
                    <option key={lab} value={lab}>{lab}</option>
                  ))}
                </select>
                <small style={{ fontSize: '12px', color: '#666' }}>
                  Hold Ctrl/Cmd to select multiple labs. You can assign labs later.
                </small>
              </div>
            )}
            
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button onClick={handleSubmit} className="btn btn-primary">
                Add {type === 'student' ? 'Student' : 'Staff'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const TempPasswordModal = ({ password, onClose }) => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="temp-password-display">
          <h2 className="modal-header">Temporary Password Generated</h2>
          <p>The user has been created successfully. Please share this temporary password:</p>
          
          <div className="temp-password-box">
            <div className="temp-password-value">{password}</div>
          </div>
          
          <div className="temp-password-note">
            <strong>Important:</strong> The user must login with this password and will be prompted to set a new password on their first login.
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-primary" onClick={onClose}>
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const LabAssignmentModal = ({ staff, onClose }) => (
    <div className="modal-overlay">
      <div className="modal">
        <div className="lab-assignment-modal">
          <h2 className="modal-header">Assign Labs to {staff.name}</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Select the lab subjects that {staff.name} will be responsible for managing.
          </p>
          
          <div className="lab-selection-grid">
            {mockData.labs.map(lab => (
              <div key={lab} className="lab-selection-item">
                <label className="lab-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedStaffLabs.includes(lab)}
                    onChange={() => handleLabToggle(lab)}
                  />
                  <span className="checkmark">
                    {selectedStaffLabs.includes(lab) ? <FaCheck /> : ''}
                  </span>
                  <span className="lab-name">{lab}</span>
                </label>
              </div>
            ))}
          </div>
          
          <div className="assignment-summary">
            <h4>Assignment Summary:</h4>
            <p>
              <strong>{selectedStaffLabs.length}</strong> lab{selectedStaffLabs.length !== 1 ? 's' : ''} selected
              {selectedStaffLabs.length > 0 && (
                <span style={{ color: '#10b981', marginLeft: '10px' }}>
                  ✓ {selectedStaffLabs.join(', ')}
                </span>
              )}
            </p>
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleSaveLabAssignment}
              disabled={selectedStaffLabs.length === 0}
            >
              <FaCheck /> Save Assignment ({selectedStaffLabs.length} labs)
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={dashboardContainerStyles}>
      {/* Header */}
      <div style={dashboardHeaderStyles}>
        <div style={dashboardNavStyles}>
          <h1 style={dashboardTitleStyles}>HOD Dashboard</h1>
          <div style={profileAreaStyles}>
            <button style={profileButtonStyles} onClick={() => setShowProfileMenu(v => !v)} aria-label="Profile menu">
              <FaUser />
            </button>
            {showProfileMenu && (
              <div style={profileDropdownStyles}>
                <div style={profileInfoRowStyles}><strong>{currentUser?.name}</strong></div>
                <div style={profileInfoRowStyles}>{currentUser?.email}</div>
                <div style={profileDividerStyles} />
                <button style={profileItemStyles} onClick={() => { setShowChangePassword(true); setShowProfileMenu(false); }}>Change Password</button>
                <button style={profileItemStyles} onClick={() => setShowProfileMenu(false)}>View Profile</button>
                <button style={{...profileItemStyles, color: '#dc3545'}} onClick={handleLogout}><FaSignOutAlt /> Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={dashboardContentStyles}>
        {/* Sidebar */}
        <aside style={sidebarStyles}>
          <button style={{
            ...sidebarItemStyles,
            ...(activeSection === 'overview' ? sidebarItemActiveStyles : {})
          }} onClick={() => setActiveSection('overview')}>
            <FaChartPie /> Overview
          </button>
          <button style={{
            ...sidebarItemStyles,
            ...(activeSection === 'students' ? sidebarItemActiveStyles : {})
          }} onClick={() => setActiveSection('students')}>
            <FaUsers /> Students
          </button>
          <button style={{
            ...sidebarItemStyles,
            ...(activeSection === 'staff' ? sidebarItemActiveStyles : {})
          }} onClick={() => setActiveSection('staff')}>
            <FaUsers /> Staff
          </button>
          <button style={{
            ...sidebarItemStyles,
            ...(activeSection === 'subjects' ? sidebarItemActiveStyles : {})
          }} onClick={() => setActiveSection('subjects')}>
            <FaBook /> Lab Subjects
          </button>
          <button style={{
            ...sidebarItemStyles,
            ...(activeSection === 'analytics' ? sidebarItemActiveStyles : {})
          }} onClick={() => setActiveSection('analytics')}>
            <FaChartPie /> Analytics
          </button>
        </aside>

        <main style={dashboardMainStyles}>
          {/* Notification */}
          {notification.message && (
            <div style={{
              padding: '10px 15px',
              margin: '0 0 20px 0',
              borderRadius: '6px',
              backgroundColor: notification.type === 'success' ? '#d4edda' : '#f8d7da',
              color: notification.type === 'success' ? '#155724' : '#721c24',
              border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px'
            }}>
              {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
              {notification.message}
            </div>
          )}

          {/* Controls Bar */}
          {activeSection !== 'staff' && activeSection !== 'subjects' && activeSection !== 'overview' && (
          <div style={controlsBarStyles}>
            <div style={filterGroupStyles}>
              <label style={filterLabelStyles}>
                <FaFilter /> Year Filter
              </label>
              <select
                style={filterSelectStyles}
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
              >
                <option value="All">All Years</option>
                {mockData.years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            <div style={filterGroupStyles}>
              <label style={filterLabelStyles}>Lab Filter</label>
              <select
                style={filterSelectStyles}
                value={labFilter}
                onChange={(e) => setLabFilter(e.target.value)}
              >
                <option value="All Labs">All Labs</option>
                {mockData.labs.map(lab => (
                  <option key={lab} value={lab}>{lab}</option>
                ))}
              </select>
            </div>

            {activeSection === 'students' && (
              <div style={filterGroupStyles}>
                <label style={filterLabelStyles}>Search by Student ID</label>
                <input
                  type="text"
                  style={formInputStyles}
                  placeholder="e.g., STU001"
                  value={studentIdSearch}
                  onChange={(e) => setStudentIdSearch(e.target.value)}
                />
              </div>
            )}
          </div>
          )}

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              {/* Clean Summary Cards */}
              <div style={summaryCardsStyles}>
                <div style={summaryCardStyles}>
                  <div style={summaryCardIconStyles}>
                    <FaUsers />
                  </div>
                  <div style={summaryCardContentStyles}>
                    <div style={summaryCardValueStyles}>{users.filter(u => u.role === 'student').length}</div>
                    <div style={summaryCardTitleStyles}>Total Students</div>
                  </div>
                </div>
                <div style={summaryCardStyles}>
                  <div style={{...summaryCardIconStyles, backgroundColor: '#f0f9ff', color: '#0284c7'}}>
                    <FaUsers />
                  </div>
                  <div style={summaryCardContentStyles}>
                    <div style={summaryCardValueStyles}>{filteredStaff.length}</div>
                    <div style={summaryCardTitleStyles}>Total Staff</div>
                  </div>
                </div>
                <div style={summaryCardStyles}>
                  <div style={{...summaryCardIconStyles, backgroundColor: '#f0fdf4', color: '#16a34a'}}>
                    <FaChartPie />
                  </div>
                  <div style={summaryCardContentStyles}>
                    <div style={summaryCardValueStyles}>{avgAttendance}%</div>
                    <div style={summaryCardTitleStyles}>Avg Attendance</div>
                  </div>
                </div>
                <div style={summaryCardStyles}>
                  <div style={{...summaryCardIconStyles, backgroundColor: '#fef3c7', color: '#d97706'}}>
                    <FaBook />
                  </div>
                  <div style={summaryCardContentStyles}>
                    <div style={summaryCardValueStyles}>{attendance.length}</div>
                    <div style={summaryCardTitleStyles}>Total Records</div>
                  </div>
                </div>
              </div>

              {/* Clean Students by Year */}
              <div style={sectionStyles}>
                <div style={sectionHeaderStyles}>
                  <h2 style={sectionTitleStyles}>
                    <FaGraduationCap /> Students by Year
                  </h2>
                </div>
                <div style={studentsByYearGridStyles}>
                  {years.map((year) => (
                    <div key={year} style={yearOverviewCardStyles}>
                      <div style={yearCardHeaderStyles}>
                        <div style={yearTitleStyles}>{year}</div>
                        <div style={yearIconStyles}>
                          <FaGraduationCap />
                        </div>
                      </div>
                      <div style={yearCardContentStyles}>
                        <div style={studentCountDisplayStyles}>
                          <span style={countNumberStyles}>{getStudentCount(year)}</span>
                          <span style={countLabelStyles}>students</span>
                        </div>
                        <div style={subjectCountDisplayStyles}>
                          <span style={subjectCountStyles}>{labSubjects[year].length}</span>
                          <span style={subjectLabelStyles}>lab subjects</span>
                        </div>
                      </div>
                      <div style={yearCardFooterStyles}>
                        <button
                          style={viewDetailsBtnStyles}
                          onClick={() => setActiveSection('students')}
                        >
                          View Details →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clean Quick Actions */}
              <div style={sectionStyles}>
                <div style={sectionHeaderStyles}>
                  <h2 style={sectionTitleStyles}>
                    <FaCog /> Quick Actions
                  </h2>
                </div>
                <div style={quickActionsStyles}>
                  <button 
                    style={quickActionBtnStyles}
                    onClick={() => setActiveSection('students')}
                  >
                    <div style={quickActionIconStyles}>
                      <FaPlus />
                    </div>
                    <span style={quickActionTextStyles}>Add Student</span>
                  </button>
                  <button 
                    style={quickActionBtnStyles}
                    onClick={() => setActiveSection('staff')}
                  >
                    <div style={{...quickActionIconStyles, backgroundColor: '#f0f9ff', color: '#0284c7'}}>
                      <FaPlus />
                    </div>
                    <span style={quickActionTextStyles}>Add Staff</span>
                  </button>
                  <button 
                    style={quickActionBtnStyles}
                    onClick={() => setActiveSection('subjects')}
                  >
                    <div style={{...quickActionIconStyles, backgroundColor: '#f0fdf4', color: '#16a34a'}}>
                      <FaBook />
                    </div>
                    <span style={quickActionTextStyles}>Lab Subjects</span>
                  </button>
                  <button 
                    style={quickActionBtnStyles}
                    onClick={() => setActiveSection('analytics')}
                  >
                    <div style={{...quickActionIconStyles, backgroundColor: '#fef3c7', color: '#d97706'}}>
                      <FaChartPie />
                    </div>
                    <span style={quickActionTextStyles}>Analytics</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Summary Cards for other sections */}
          {activeSection === 'students' && (
          <div style={summaryCardsStyles}>
            <div style={summaryCardStyles}>
              <div style={summaryCardIconStyles}>
                <FaUsers />
              </div>
              <div style={summaryCardContentStyles}>
                <div style={summaryCardValueStyles}>{totalStudents}</div>
                <div style={summaryCardTitleStyles}>Total Students</div>
              </div>
            </div>
            <div style={summaryCardStyles}>
              <div style={{...summaryCardIconStyles, backgroundColor: '#f0fdf4', color: '#16a34a'}}>
                <FaChartPie />
              </div>
              <div style={summaryCardContentStyles}>
                <div style={summaryCardValueStyles}>{avgAttendance}%</div>
                <div style={summaryCardTitleStyles}>Avg Attendance</div>
              </div>
            </div>
          </div>
          )}

          {activeSection === 'staff' && (
            <div style={summaryCardsStyles}>
              <div style={summaryCardStyles}>
                <div style={{...summaryCardIconStyles, backgroundColor: '#f0f9ff', color: '#0284c7'}}>
                  <FaUsers />
                </div>
                <div style={summaryCardContentStyles}>
                  <div style={summaryCardValueStyles}>{totalStaff}</div>
                  <div style={summaryCardTitleStyles}>Total Staff</div>
                </div>
              </div>
              <div style={summaryCardStyles}>
                <div style={{...summaryCardIconStyles, backgroundColor: '#fef3c7', color: '#d97706'}}>
                  <FaCog />
                </div>
                <div style={summaryCardContentStyles}>
                  <div style={summaryCardValueStyles}>{filteredStaff.reduce((sum, s) => sum + (s.assignedLabs?.length || 0), 0)}</div>
                  <div style={summaryCardTitleStyles}>Lab Assignments</div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'students' && notifications.length > 0 && (
            <div style={notificationsStyles}>
              <div style={sectionHeaderStyles}>
                <h2 style={sectionTitleStyles}>
                  <FaBell /> Attendance Alerts
                </h2>
              </div>
              {notifications.map(notification => (
                <div key={notification.id} style={notificationItemStyles}>
                  <FaBell />
                  {notification.message}
                </div>
              ))}
            </div>
          )}

          {/* Students Section */}
          {activeSection === 'students' && (
          <div style={sectionStyles}>
            <div style={sectionHeaderStyles}>
              <h2 style={sectionTitleStyles}>
                <FaUsers /> Students Management
              </h2>
              <button 
                style={{...btnStyles, ...btnPrimaryStyles}}
                onClick={() => setShowAddModal('student')}
              >
                <FaPlus /> Add Student
              </button>
            </div>
            
            {mockData.years.map(year => {
              const yearStudents = studentsByYear[year] || [];
              if (yearStudents.length === 0) return null;
              
              return (
                <div key={year} style={dropdownSectionStyles}>
                  <div 
                    style={dropdownHeaderStyles}
                    onClick={() => toggleDropdown(`students-${year}`)}
                  >
                    <span>{year} ({yearStudents.length} students)</span>
                    <span style={{
                      ...chevronStyles,
                      transform: openDropdowns[`students-${year}`] ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      <FaChevronRight />
                    </span>
                  </div>
                  {openDropdowns[`students-${year}`] && (
                    <div style={dropdownContentStyles}>
                      <div style={tableContainerStyles}>
                        <table style={tableStyles}>
                          <thead>
                            <tr>
                              <th style={tableHeaderStyles}>ID</th>
                              <th style={tableHeaderStyles}>Name</th>
                              <th style={tableHeaderStyles}>Email</th>
                              <th style={tableHeaderStyles}>Attendance %</th>
                              <th style={tableHeaderStyles}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {yearStudents.map(student => {
                              const studentAttendance = attendance.filter(a => a.studentId === student.studentId);
                              const avgAttendance = studentAttendance.length > 0
                                ? Math.round(studentAttendance.reduce((sum, a) => sum + a.percentage, 0) / studentAttendance.length)
                                : 0;
                              
                              return (
                                <tr key={student.id} style={tableRowStyles}>
                                  <td style={tableCellStyles}>{student.studentId}</td>
                                  <td style={tableCellStyles}>{student.name}</td>
                                  <td style={tableCellStyles}>{student.email}</td>
                                  <td style={tableCellStyles}>
                                    <span style={{
                                      ...attendancePercentageStyles,
                                      color: avgAttendance >= 85 ? '#16a34a' : avgAttendance >= 75 ? '#d97706' : '#dc2626'
                                    }}>
                                      {avgAttendance}%
                                    </span>
                                  </td>
                                  <td style={tableCellStyles}>
                                    <div style={actionButtonsStyles}>
                                      <button 
                                        style={{...actionBtnStyles, ...actionBtnPrimaryStyles}}
                                        onClick={() => handleGenerateTempPassword(student.id)}
                                        title="Generate Temporary Password"
                                      >
                                        <FaKey />
                                      </button>
                                      <button 
                                        style={{...actionBtnStyles, ...actionBtnSecondaryStyles}}
                                        onClick={() => handleViewAttendance(student)}
                                        title="View Attendance"
                                      >
                                        <FaEye />
                                      </button>
                                      <button 
                                        style={{...actionBtnStyles, ...actionBtnSuccessStyles}}
                                        onClick={() => exportCSV(studentAttendance, `${student.studentId}_attendance.csv`)}
                                        title="Export CSV"
                                      >
                                        <FaDownload />
                                      </button>
                                      <button 
                                        style={{...actionBtnStyles, ...actionBtnDangerStyles}}
                                        onClick={() => {
                                          if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
                                            deleteUser(student.id);
                                          }
                                        }}
                                        title="Delete Student"
                                      >
                                        <FaTrash />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}

          {/* Staff Section */}
          {activeSection === 'staff' && (
          <div style={sectionStyles}>
            <div style={sectionHeaderStyles}>
              <h2 style={sectionTitleStyles}>
                <FaUsers /> Staff Management
              </h2>
              <button 
                style={{...btnStyles, ...btnPrimaryStyles}}
                onClick={() => setShowAddModal('staff')}
              >
                <FaPlus /> Add Staff
              </button>
            </div>
            
            <div style={tableContainerStyles}>
              <table style={tableStyles}>
                <thead>
                  <tr>
                    <th style={tableHeaderStyles}>Name</th>
                    <th style={tableHeaderStyles}>Email</th>
                    <th style={tableHeaderStyles}>Assigned Labs</th>
                    <th style={tableHeaderStyles}>Lab Count</th>
                    <th style={tableHeaderStyles}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(staff => (
                    <tr key={staff.id} style={tableRowStyles}>
                      <td style={tableCellStyles}>{staff.name}</td>
                      <td style={tableCellStyles}>{staff.email}</td>
                      <td style={tableCellStyles}>
                        <div>
                          {staff.assignedLabs && staff.assignedLabs.length > 0 ? (
                            <div>
                              {staff.assignedLabs.map((lab, index) => (
                                <span key={lab} style={labTagStyles}>
                                  {lab}
                                  {index < staff.assignedLabs.length - 1 && ', '}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: '#999', fontStyle: 'italic' }}>No labs assigned</span>
                          )}
                        </div>
                      </td>
                      <td style={tableCellStyles}>
                        <span style={{
                          ...labCountStyles,
                          backgroundColor: (staff.assignedLabs?.length || 0) > 0 ? '#3b82f6' : '#6b7280',
                          color: 'white'
                        }}>
                          {staff.assignedLabs?.length || 0}
                        </span>
                      </td>
                      <td style={tableCellStyles}>
                        <div style={actionButtonsStyles}>
                          <button 
                            style={{...actionBtnStyles, ...actionBtnInfoStyles}}
                            onClick={() => handleAssignLabs(staff)}
                            title="Assign Labs"
                          >
                            <FaCog /> Assign
                          </button>
                          <button 
                            style={{...actionBtnStyles, ...actionBtnPrimaryStyles}}
                            onClick={() => handleGenerateTempPassword(staff.id)}
                            title="Generate Temporary Password"
                          >
                            <FaKey />
                          </button>
                          <button 
                            style={{...actionBtnStyles, ...actionBtnDangerStyles}}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete ${staff.name}?`)) {
                                deleteUser(staff.id);
                              }
                            }}
                            title="Delete Staff"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* Lab Subjects Management Section - keeping original inline styles */}
          {activeSection === 'subjects' && (
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaBook /> Lab Subject Management
                </h2>
                <div className="manager-controls">
                  <button 
                    className="btn btn-primary"
                    onClick={applySubjectsToStudents}
                    disabled={labSubjects[selectedYear].length === 0}
                  >
                    <FaCheckCircle /> Apply to All {selectedYear} Students
                  </button>
                </div>
              </div>

              {/* Year Selection */}
              <div className="year-selector" style={{ 
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <label className="filter-label">
                  <FaGraduationCap /> Select Year to Manage:
                </label>
                <select 
                  className="filter-select" 
                  value={selectedYear}
                  onChange={(e) => {
                    setSelectedYear(e.target.value);
                    setShowAddForm(false);
                    setEditingSubject(null);
                  }}
                  style={{ minWidth: '200px' }}
                >
                  {years.map(year => (
                    <option key={year} value={year}>
                      {year} ({getStudentCount(year)} students)
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Subjects Display */}
              <div className="subjects-container" style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <div className="subjects-header" style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #dee2e6'
                }}>
                  <h3 style={{ margin: '0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaUsers /> {selectedYear} Lab Subjects ({labSubjects[selectedYear].length} subjects)
                  </h3>
                  <button 
                    className="btn-premium"
                    onClick={() => setShowAddForm(true)}
                    disabled={showAddForm}
                    style={{
                      background: '#3b82f6',
                      border: 'none',
                      color: 'white',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minWidth: 'auto',
                      width: 'auto'
                    }}
                  >
                    <FaPlus style={{ fontSize: '12px' }} /> Add Subject
                  </button>
                </div>

                {/* Add New Subject Form */}
                {showAddForm && (
                  <div className="add-subject-form" style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    margin: '10px 0'
                  }}>
                    <div className="form-group">
                      <label className="form-label">New Subject Name:</label>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Enter lab subject name (e.g., Advanced Physics Lab)"
                          value={newSubject}
                          onChange={(e) => setNewSubject(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddSubject()}
                          style={{ flex: 1 }}
                          autoFocus
                        />
                        <button 
                          className="btn btn-primary"
                          onClick={handleAddSubject}
                        >
                          <FaSave /> Save
                        </button>
                        <button 
                          className="btn btn-secondary"
                          onClick={handleCancelAdd}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Subjects List */}
                <div className="subjects-list">
                  {labSubjects[selectedYear].length > 0 ? (
                    <div className="table-container">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>#</th>
                            <th>Subject Name</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {labSubjects[selectedYear].map((subject, index) => (
                            <tr key={subject}>
                              <td>{index + 1}</td>
                              <td>
                                {editingSubject === subject ? (
                                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      value={editingValue}
                                      onChange={(e) => setEditingValue(e.target.value)}
                                      onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                                      style={{ flex: 1 }}
                                      autoFocus
                                    />
                                    <button 
                                      className="action-btn save-btn"
                                      onClick={handleSaveEdit}
                                      title="Save Changes"
                                      style={{
                                        background: '#28a745',
                                        color: 'white',
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FaSave />
                                    </button>
                                    <button 
                                      className="action-btn cancel-btn"
                                      onClick={handleCancelEdit}
                                      title="Cancel Edit"
                                      style={{
                                        background: '#6c757d',
                                        color: 'white',
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                      }}
                                    >
                                      <FaTimes />
                                    </button>
                                  </div>
                                ) : (
                                  <span style={{ fontWeight: '500' }}>{subject}</span>
                                )}
                              </td>
                              <td>
                                {editingSubject !== subject && (
                                  <div className="action-buttons">
                                    <button 
                                      className="action-btn edit-btn"
                                      onClick={() => handleEditSubject(subject)}
                                      title="Edit Subject"
                                      style={{
                                        background: '#007bff',
                                        color: 'white',
                                        padding: '6px 12px',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        marginRight: '8px'
                                      }}
                                    >
                                      <FaEdit /> Edit
                                    </button>
                                    <button 
                                      className="action-btn delete-btn"
                                      onClick={() => handleRemoveSubject(subject)}
                                      title="Remove Subject"
                                    >
                                      <FaTrash /> Remove
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ 
                      padding: '40px', 
                      textAlign: 'center', 
                      color: '#666',
                      background: '#f8f9fa',
                      border: '1px solid #dee2e6',
                      borderRadius: '4px'
                    }}>
                      <FaBook size={32} style={{ opacity: 0.3, marginBottom: '15px' }} />
                      <p>No lab subjects assigned to {selectedYear} yet.</p>
                      <p>Click "Add New Subject" to start assigning lab subjects.</p>
                    </div>
                  )}
                </div>

                {/* Students Impact Info */}
                <div className="impact-info" style={{
                  marginTop: '20px',
                  padding: '15px',
                  background: '#e3f2fd',
                  border: '1px solid #bbdefb',
                  borderRadius: '4px'
                }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                    <FaUsers /> Impact Information
                  </h4>
                  <p style={{ margin: '0', color: '#1976d2' }}>
                    Changes to {selectedYear} subjects will automatically update lab assignments for <strong>{getStudentCount(selectedYear)} students</strong> in this year group.
                  </p>
                  {getStudentCount(selectedYear) === 0 && (
                    <p style={{ margin: '5px 0 0 0', color: '#f57c00', fontStyle: 'italic' }}>
                      ⚠️ No students found in {selectedYear}. Subjects will be applied when students are added to this year.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Selected Student Attendance Details */}
          {selectedStudent && (
            <div style={sectionStyles}>
              <div style={sectionHeaderStyles}>
                <h2 style={sectionTitleStyles}>
                  Attendance Details - {selectedStudent.name}
                </h2>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button 
                    style={{...btnStyles, ...btnSuccessStyles}}
                    onClick={() => {
                      const studentAttendance = attendance.filter(a => a.studentId === selectedStudent.studentId);
                      exportCSV(studentAttendance, `${selectedStudent.studentId}_detailed_attendance.csv`);
                    }}
                  >
                    <FaDownload /> Export CSV
                  </button>
                  <button 
                    style={{...btnStyles, ...btnSecondaryStyles}}
                    onClick={() => setSelectedStudent(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
              <div style={tableContainerStyles}>
                <table style={tableStyles}>
                  <thead>
                    <tr>
                      <th style={tableHeaderStyles}>Date</th>
                      <th style={tableHeaderStyles}>Subject/Lab</th>
                      <th style={tableHeaderStyles}>Status</th>
                      <th style={tableHeaderStyles}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance
                      .filter(a => a.studentId === selectedStudent.studentId)
                      .map(record => (
                        <tr key={record.id} style={tableRowStyles}>
                          <td style={tableCellStyles}>{record.date}</td>
                          <td style={tableCellStyles}>{record.lab}</td>
                          <td style={tableCellStyles}>
                            <span style={{
                              ...attendancePercentageStyles,
                              color: record.status === 'present' ? '#16a34a' : '#dc2626'
                            }}>
                              {record.status.toUpperCase()}
                            </span>
                          </td>
                          <td style={tableCellStyles}>{record.percentage}%</td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Chart */}
          {activeSection === 'analytics' && (
          <div style={chartContainerStyles}>
            <h2 style={chartTitleStyles}>
              <FaChartPie /> Year-wise Attendance Distribution
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, value, students}) => `${name}: ${value}% (${students} students)`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  onClick={(data, index) => setDrilldownYear(pieData[index]?.name || null)}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value}%`, 
                  `${props.payload.name} (${props.payload.students} students)`
                ]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          )}
          
          {activeSection === 'analytics' && drilldownYear && (
            <div style={sectionStyles}>
              <div style={sectionHeaderStyles}>
                <h2 style={sectionTitleStyles}>{drilldownYear} - Students Detail</h2>
                <button style={{...btnStyles, ...btnSecondaryStyles}} onClick={() => setDrilldownYear(null)}>Close</button>
              </div>
              {(studentsByYear[drilldownYear] || []).map(student => (
                <div key={student.id} style={{...tableContainerStyles, marginBottom: '16px'}}>
                  <h3 style={{ margin: '8px 0' }}>{student.name} ({student.studentId})</h3>
                  <table style={tableStyles}>
                    <thead>
                      <tr>
                        <th style={tableHeaderStyles}>Date</th>
                        <th style={tableHeaderStyles}>Subject/Lab</th>
                        <th style={tableHeaderStyles}>Status</th>
                        <th style={tableHeaderStyles}>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance
                        .filter(a => a.studentId === student.studentId && (labFilter === 'All Labs' || a.lab === labFilter))
                        .map(record => (
                          <tr key={record.id} style={tableRowStyles}>
                            <td style={tableCellStyles}>{record.date}</td>
                            <td style={tableCellStyles}>{record.lab}</td>
                            <td style={tableCellStyles}>
                              <span style={{
                                ...attendancePercentageStyles,
                                color: record.status === 'present' ? '#16a34a' : '#dc2626'
                              }}>
                                {record.status.toUpperCase()}
                              </span>
                            </td>
                            <td style={tableCellStyles}>{record.percentage}%</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

        </main>
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddUserModal
          type={showAddModal}
          onClose={() => setShowAddModal(null)}
          onAdd={handleAddUser}
        />
      )}

      {tempPassword && (
        <TempPasswordModal
          password={tempPassword}
          onClose={() => setTempPassword(null)}
        />
      )}

      {showLabAssignModal && (
        <LabAssignmentModal
          staff={showLabAssignModal}
          onClose={() => {
            setShowLabAssignModal(null);
            setSelectedStaffLabs([]);
          }}
        />
      )}

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

// Clean Professional Blue-White Theme Styles
const dashboardContainerStyles = {
  background: '#f8fafc',
  minHeight: '100vh',
  fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color: '#1e293b'
};

const dashboardHeaderStyles = {
  background: '#3b82f6',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
  padding: '16px 24px',
  borderBottom: '1px solid #e2e8f0'
};

const dashboardNavStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const dashboardTitleStyles = {
  color: 'white',
  fontSize: '20px',
  fontWeight: '600',
  margin: 0
};

const profileAreaStyles = {
  position: 'relative'
};

const profileButtonStyles = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: '50%',
  width: '36px',
  height: '36px',
  color: 'white',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  transition: 'all 0.2s ease'
};

const profileDropdownStyles = {
  position: 'absolute',
  top: '45px',
  right: '0',
  background: 'white',
  borderRadius: '8px',
  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  minWidth: '200px',
  zIndex: 1000,
  overflow: 'hidden',
  border: '1px solid #e5e7eb'
};

const profileInfoRowStyles = {
  padding: '10px 16px',
  fontSize: '14px',
  color: '#374151',
  borderBottom: '1px solid #f3f4f6'
};

const profileDividerStyles = {
  height: '1px',
  background: '#e5e7eb',
  margin: '4px 0'
};

const profileItemStyles = {
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '10px 16px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'background 0.15s ease'
};

const dashboardContentStyles = {
  display: 'flex',
  minHeight: 'calc(100vh - 73px)'
};

const sidebarStyles = {
  width: '220px',
  background: 'white',
  boxShadow: '1px 0 3px rgba(0, 0, 0, 0.1)',
  padding: '16px 0',
  borderRight: '1px solid #e5e7eb'
};

const sidebarItemStyles = {
  width: '100%',
  background: 'none',
  border: 'none',
  padding: '12px 20px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '14px',
  color: '#6b7280',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  transition: 'all 0.15s ease',
  fontWeight: '500'
};

const sidebarItemActiveStyles = {
  background: '#3b82f6',
  color: 'white',
  borderRight: '3px solid #1d4ed8'
};

const dashboardMainStyles = {
  flex: 1,
  background: 'white',
  borderRadius: '0',
  padding: '24px',
  margin: '0',
  boxShadow: 'none',
  overflow: 'auto'
};

const controlsBarStyles = {
  display: 'flex',
  gap: '16px',
  marginBottom: '20px',
  padding: '16px',
  background: '#f8fafc',
  borderRadius: '8px',
  border: '1px solid #e5e7eb'
};

const filterGroupStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
};

const filterLabelStyles = {
  fontSize: '13px',
  fontWeight: '500',
  color: '#374151',
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
};

const filterSelectStyles = {
  padding: '6px 10px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  backgroundColor: 'white',
  minWidth: '140px'
};

// Clean Summary Cards
const summaryCardsStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '16px',
  marginBottom: '24px'
};

const summaryCardStyles = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  cursor: 'default'
};

const summaryCardIconStyles = {
  width: '48px',
  height: '48px',
  borderRadius: '8px',
  backgroundColor: '#dbeafe',
  color: '#3b82f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '20px',
  flexShrink: 0
};

const summaryCardContentStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
};

const summaryCardValueStyles = {
  fontSize: '28px',
  fontWeight: '700',
  color: '#1e293b',
  lineHeight: 1
};

const summaryCardTitleStyles = {
  fontSize: '13px',
  color: '#6b7280',
  fontWeight: '500',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

// Students by Year
const studentsByYearGridStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
  marginBottom: '24px'
};

const yearOverviewCardStyles = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '20px',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  cursor: 'default'
};

const yearCardHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px'
};

const yearTitleStyles = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  margin: 0
};

const yearIconStyles = {
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  background: '#3b82f6',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px'
};

const yearCardContentStyles = {
  marginBottom: '16px'
};

const studentCountDisplayStyles = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  marginBottom: '8px'
};

const countNumberStyles = {
  fontSize: '32px',
  fontWeight: '700',
  color: '#3b82f6',
  lineHeight: 1
};

const countLabelStyles = {
  fontSize: '14px',
  color: '#6b7280',
  fontWeight: '500'
};

const subjectCountDisplayStyles = {
  display: 'flex',
  alignItems: 'baseline',
  gap: '8px',
  paddingLeft: '12px',
  borderLeft: '3px solid #e5e7eb'
};

const subjectCountStyles = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#374151'
};

const subjectLabelStyles = {
  fontSize: '12px',
  color: '#6b7280',
  fontWeight: '500'
};

const yearCardFooterStyles = {
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px'
};

const viewDetailsBtnStyles = {
  width: '100%',
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '6px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background 0.2s ease'
};

// Quick Actions
const quickActionsStyles = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '24px'
};

const quickActionBtnStyles = {
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
};

const quickActionIconStyles = {
  width: '36px',
  height: '36px',
  borderRadius: '6px',
  backgroundColor: '#dbeafe',
  color: '#3b82f6',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  flexShrink: 0
};

const quickActionTextStyles = {
  fontSize: '14px',
  fontWeight: '500',
  color: '#374151'
};

const sectionStyles = {
  marginBottom: '32px'
};

const sectionHeaderStyles = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
  paddingBottom: '12px',
  borderBottom: '1px solid #e5e7eb'
};

const sectionTitleStyles = {
  fontSize: '20px',
  fontWeight: '600',
  color: '#1e293b',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  margin: 0
};

// Additional styles for other sections
const notificationsStyles = {
  marginBottom: '20px'
};

const notificationItemStyles = {
  padding: '10px 14px',
  marginBottom: '6px',
  backgroundColor: '#fef3cd',
  color: '#856404',
  border: '1px solid #feeeba',
  borderRadius: '6px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px'
};

const dropdownSectionStyles = {
  marginBottom: '16px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const dropdownHeaderStyles = {
  padding: '14px 16px',
  background: '#f8fafc',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontWeight: '500',
  color: '#374151',
  transition: 'background 0.15s ease',
  fontSize: '14px'
};

const chevronStyles = {
  transition: 'transform 0.2s ease',
  fontSize: '12px'
};

const dropdownContentStyles = {
  padding: '16px'
};

const tableContainerStyles = {
  background: 'white',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  border: '1px solid #e5e7eb'
};

const tableStyles = {
  width: '100%',
  borderCollapse: 'collapse'
};

const tableHeaderStyles = {
  background: '#3b82f6',
  color: 'white',
  padding: '12px',
  textAlign: 'left',
  fontWeight: '500',
  fontSize: '13px',
  textTransform: 'uppercase',
  letterSpacing: '0.5px'
};

const tableRowStyles = {
  borderBottom: '1px solid #e5e7eb',
  transition: 'background 0.15s ease'
};

const tableCellStyles = {
  padding: '12px',
  fontSize: '13px',
  color: '#374151'
};

const attendancePercentageStyles = {
  fontWeight: '500',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px'
};

const actionButtonsStyles = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap'
};

const actionBtnStyles = {
  border: 'none',
  borderRadius: '4px',
  padding: '6px 10px',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.15s ease',
  fontWeight: '500'
};

const actionBtnPrimaryStyles = {
  background: '#3b82f6',
  color: 'white'
};

const actionBtnSecondaryStyles = {
  background: '#6b7280',
  color: 'white'
};

const actionBtnSuccessStyles = {
  background: '#16a34a',
  color: 'white'
};

const actionBtnDangerStyles = {
  background: '#dc2626',
  color: 'white'
};

const actionBtnInfoStyles = {
  background: '#0284c7',
  color: 'white'
};

const labTagStyles = {
  display: 'inline-block',
  background: '#f3f4f6',
  color: '#374151',
  padding: '2px 6px',
  borderRadius: '4px',
  fontSize: '12px',
  fontWeight: '500'
};

const labCountStyles = {
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '12px',
  fontWeight: '500'
};

const btnStyles = {
  border: 'none',
  borderRadius: '6px',
  padding: '10px 16px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  transition: 'all 0.2s ease'
};

const btnPrimaryStyles = {
  background: '#3b82f6',
  color: 'white'
};

const btnSecondaryStyles = {
  background: '#6b7280',
  color: 'white'
};

const btnSuccessStyles = {
  background: '#16a34a',
  color: 'white'
};

const chartContainerStyles = {
  background: 'white',
  borderRadius: '8px',
  padding: '20px',
  marginBottom: '24px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
};

const chartTitleStyles = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#1e293b',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
};

const formInputStyles = {
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '13px',
  transition: 'border-color 0.15s ease',
  boxSizing: 'border-box',
  width: '100%'
};

export default HODDashboard;