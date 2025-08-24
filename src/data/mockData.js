// Updated data/mockData.js - Student Login Fix
export const mockData = {
  users: [
    { 
      id: 1, 
      username: 'hod_admin', 
      password: 'hod123', 
      name: 'Dr. John Smith', 
      role: 'hod', 
      email: 'hod@university.edu', 
      temporaryPassword: false 
    },
    { 
      id: 2, 
      username: 'staff001', 
      password: 'temp123', 
      name: 'Prof. Sarah Johnson', 
      role: 'staff', 
      email: 'sarah@university.edu', 
      temporaryPassword: true, 
      assignedLabs: ['Physics Lab', 'Chemistry Lab'] 
    },
    // FIXED STUDENT CREDENTIALS - Multiple working student accounts
    { 
      id: 3, 
      username: 'student001', 
      password: 'temp456', 
      name: 'Alice Brown', 
      role: 'student', 
      email: 'alice@student.edu', 
      temporaryPassword: true, 
      year: '2nd Year', 
      studentId: 'STU001', 
      labs: ['Physics Lab', 'Mathematics Lab'] 
    },
    { 
      id: 4, 
      username: 'student002', 
      password: 'temp789', 
      name: 'Bob Wilson', 
      role: 'student', 
      email: 'bob@student.edu', 
      temporaryPassword: true, 
      year: '3rd Year', 
      studentId: 'STU002', 
      labs: ['Chemistry Lab', 'Biology Lab'] 
    },
    { 
      id: 5, 
      username: 'student003', 
      password: 'temp101', 
      name: 'Emma Davis', 
      role: 'student', 
      email: 'emma@student.edu', 
      temporaryPassword: true, 
      year: '2nd Year', 
      studentId: 'STU003', 
      labs: ['Physics Lab', 'Mathematics Lab'] 
    },
    // Additional student with no temp password for testing
    { 
      id: 6, 
      username: 'student_perm', 
      password: 'student123', 
      name: 'John Miller', 
      role: 'student', 
      email: 'john@student.edu', 
      temporaryPassword: false, 
      year: '4th Year', 
      studentId: 'STU004', 
      labs: ['Networks Lab', 'Database Lab'] 
    },
    { 
      id: 7, 
      username: 'student005', 
      password: 'temp303', 
      name: 'Lisa Anderson', 
      role: 'student', 
      email: 'lisa@student.edu', 
      temporaryPassword: true, 
      year: '3rd Year', 
      studentId: 'STU005', 
      labs: ['Chemistry Lab', 'Biology Lab'] 
    },
    { 
      id: 8, 
      username: 'staff002', 
      password: 'temp404', 
      name: 'Prof. Michael Brown', 
      role: 'staff', 
      email: 'michael@university.edu', 
      temporaryPassword: true, 
      assignedLabs: ['Biology Lab', 'Mathematics Lab'] 
    }
  ],
  
  attendance: [
    { 
      id: 1, 
      studentId: 'STU001', 
      date: '2024-01-15', 
      lab: 'Physics Lab', 
      status: 'present', 
      percentage: 92 
    },
    { 
      id: 2, 
      studentId: 'STU002', 
      date: '2024-01-15', 
      lab: 'Chemistry Lab', 
      status: 'present', 
      percentage: 78 
    },
    { 
      id: 3, 
      studentId: 'STU003', 
      date: '2024-01-15', 
      lab: 'Physics Lab', 
      status: 'absent', 
      percentage: 65 
    },
    { 
      id: 4, 
      studentId: 'STU001', 
      date: '2024-01-16', 
      lab: 'Mathematics Lab', 
      status: 'present', 
      percentage: 92 
    },
    { 
      id: 5, 
      studentId: 'STU002', 
      date: '2024-01-16', 
      lab: 'Biology Lab', 
      status: 'present', 
      percentage: 78 
    },
    { 
      id: 6, 
      studentId: 'STU004', 
      date: '2024-01-16', 
      lab: 'Networks Lab', 
      status: 'present', 
      percentage: 88 
    },
    { 
      id: 7, 
      studentId: 'STU005', 
      date: '2024-01-17', 
      lab: 'Chemistry Lab', 
      status: 'absent', 
      percentage: 72 
    },
    { 
      id: 8, 
      studentId: 'STU003', 
      date: '2024-01-17', 
      lab: 'Mathematics Lab', 
      status: 'present', 
      percentage: 65 
    },
    { 
      id: 9, 
      studentId: 'STU001', 
      date: '2024-01-18', 
      lab: 'Physics Lab', 
      status: 'present', 
      percentage: 92 
    },
    { 
      id: 10, 
      studentId: 'STU004', 
      date: '2024-01-18', 
      lab: 'Database Lab', 
      status: 'absent', 
      percentage: 88 
    }
  ],
  
  labs: [
    'Physics Lab',
    'Chemistry Lab', 
    'Biology Lab', 
    'Mathematics Lab', 
    'Computer Science Lab', 
    'Networks Lab',
    'Database Lab',
    'Electronics Lab'
  ],
  
  years: ['2nd Year', '3rd Year', '4th Year']
};