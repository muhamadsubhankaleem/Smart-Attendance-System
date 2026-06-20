import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const SIDEBAR_ITEMS = [
  { icon: '📊', label: 'Overview', id: 'overview' },
  { icon: '👥', label: 'Students', id: 'students' },
  { icon: '📚', label: 'Courses', id: 'courses' },
  { icon: '✅', label: 'Attendance', id: 'attendance' },
  { icon: '📱', label: 'QR Sessions', id: 'qr' },
  { icon: '📷', label: 'Scan QR', id: 'scan' },
  { icon: '📄', label: 'Reports', id: 'reports' },
  { icon: '⚙️', label: 'Settings', id: 'settings' },
];

const MOCK_ATTENDANCE = [
  { id: 1, student: 'Ahmed Khan', course: 'CS-301', date: '2026-06-13', status: 'present' },
  { id: 2, student: 'Sara Ali', course: 'CS-301', date: '2026-06-13', status: 'present' },
  { id: 3, student: 'Omar Hassan', course: 'CS-205', date: '2026-06-13', status: 'late' },
  { id: 4, student: 'Fatima Noor', course: 'CS-401', date: '2026-06-13', status: 'absent' },
  { id: 5, student: 'Bilal Raza', course: 'CS-205', date: '2026-06-13', status: 'present' },
  { id: 6, student: 'Ayesha Malik', course: 'CS-301', date: '2026-06-12', status: 'present' },
];

function ScanQRTab({ courses, students }) {
  const [scanResult, setScanResult] = useState(null);
  const [scanStatus, setScanStatus] = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicate, setDuplicate] = useState(false);

  useEffect(() => {
    if (!scanResult) {
      const scanner = new Html5QrcodeScanner('reader', { qrbox: { width: 250, height: 250 }, fps: 10 }, false);
      scanner.render(
        (result) => {
          scanner.clear();
          try {
            const data = JSON.parse(result);
            if (data.type === 'attendance') {
              setScanResult(data);
              setScanStatus('');
              setDuplicate(false);
            } else {
              setScanStatus('Invalid QR Code type.');
            }
          } catch {
            setScanStatus('Invalid QR Code format.');
          }
        },
        (err) => { /* ignore */ }
      );
      return () => { scanner.clear().catch(e => console.error(e)); };
    }
  }, [scanResult]);

  const handleSubmit = async (force = false) => {
    if (!studentId || !scanResult) return;
    setLoading(true);
    setDuplicate(false);
    try {
      const token = localStorage.getItem('token');
      const forceParam = force ? '&force=true' : '';
      const res = await fetch(`/api/v1/auth/attendance?token=${encodeURIComponent(token)}${forceParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          course_code: scanResult.course,
          date: scanResult.date,
          status: 'present'
        })
      });
      if (res.ok) {
        setScanStatus(force ? 'Success! Additional attendance entry added.' : 'Success! Attendance marked as Present.');
        setDuplicate(false);
      } else if (res.status === 409) {
        const error = await res.json();
        setScanStatus(error.detail);
        setDuplicate(true);
      } else {
        const error = await res.json();
        setScanStatus(`Error: ${error.detail}`);
      }
    } catch (err) {
      setScanStatus('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1>Scan QR</h1>
          <span className="date">Scan a session QR code to mark your attendance</span>
        </div>
      </div>
      <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        {!scanResult ? (
          <>
            <div id="reader" style={{ background: '#fff', borderRadius: '1rem', overflow: 'hidden' }}></div>
            {scanStatus && <p style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}>{scanStatus}</p>}
          </>
        ) : (
          <div style={{ textAlign: 'center', animation: 'fadeInUp 0.3s ease-out' }}>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--accent-primary-light)' }}>QR Code Scanned!</h2>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '1rem', marginBottom: '1.5rem', textAlign: 'left' }}>
              <p><strong>Course:</strong> {scanResult.course}</p>
              <p><strong>Date:</strong> {scanResult.date}</p>
            </div>
            
            <div className="input-group" style={{ textAlign: 'left' }}>
              <label>Select Your Student ID to Confirm</label>
              <select
                className="input-field"
                style={{ background: 'rgba(0,0,0,0.4)', color: '#fff' }}
                value={studentId}
                onChange={(e) => { setStudentId(e.target.value); setScanStatus(''); setDuplicate(false); }}
              >
                <option value="">-- Choose Student --</option>
                {students.map(s => (
                  <option key={s.id} value={s.student_id}>{s.student_id} - {s.full_name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setScanResult(null); setScanStatus(''); setDuplicate(false); }}>Rescan</button>
              <button className="btn btn-primary" style={{ flex: 1 }} disabled={!studentId || loading} onClick={() => handleSubmit(false)}>
                {loading ? 'Submitting...' : 'Mark Attendance'}
              </button>
            </div>

            {/* Status / Duplicate Warning */}
            {scanStatus && (
              <div style={{
                marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem',
                background: scanStatus.includes('Success') ? 'rgba(52,211,153,0.1)' : duplicate ? 'rgba(251,191,36,0.1)' : 'rgba(248,113,113,0.1)',
                color: scanStatus.includes('Success') ? 'var(--success)' : duplicate ? 'var(--warning)' : 'var(--danger)',
                textAlign: 'left',
              }}>
                <p style={{ fontWeight: 600, marginBottom: duplicate ? '0.75rem' : 0 }}>
                  {duplicate ? '⚠️ ' : scanStatus.includes('Success') ? '✅ ' : '❌ '}
                  {scanStatus}
                </p>
                {duplicate && (
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', marginTop: '0.5rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                    disabled={loading}
                    onClick={() => handleSubmit(true)}
                  >
                    {loading ? 'Adding...' : 'Mark Again Anyway (Force Add)'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    active_courses: 0,
    attendance_rate: 100,
    sessions_today: 0
  });

  // Report States
  const [reportType, setReportType] = useState('course');
  const [selectedReportCourse, setSelectedReportCourse] = useState('');
  const [selectedReportStudent, setSelectedReportStudent] = useState('');
  const [reportData, setReportData] = useState([]);
  const [reportLoading, setReportLoading] = useState(false);

  // Modal States
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [attDuplicateError, setAttDuplicateError] = useState('');

  // Form States
  const [courseForm, setCourseForm] = useState({ course_code: '', course_name: '', description: '' });
  const [studentForm, setStudentForm] = useState({ student_id: '', full_name: '', email: '' });
  const [attendanceForm, setAttendanceForm] = useState({
    student_id: '',
    course_code: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present'
  });

  // QR Session States
  const [qrSessionCourse, setQrSessionCourse] = useState('');
  const [showQR, setShowQR] = useState(false);

  // Settings States
  const [systemSettings, setSystemSettings] = useState({
    allow_multiple_daily_attendance: 'false'
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const fetchSystemSettings = async () => {
    const token = localStorage.getItem('token');
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/v1/auth/settings?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        const settObj = {};
        data.forEach(s => {
          settObj[s.key] = s.value;
        });
        setSystemSettings(settObj);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSystemSetting = async (key, value) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/settings/${key}?token=${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: String(value) })
      });
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(prev => ({ ...prev, [data.key]: data.value }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/stats?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/courses?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/students?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAttendance = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/attendance?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setAttendance(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourseReport = async (courseCode) => {
    if (!courseCode) return;
    setReportLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/reports/course/${encodeURIComponent(courseCode)}?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const fetchStudentReport = async (studentId) => {
    if (!studentId) return;
    setReportLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/reports/student/${encodeURIComponent(studentId)}?token=${encodeURIComponent(token)}`);
      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(`/api/v1/auth/me?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          throw new Error('Unauthorized');
        }
        const data = await res.json();
        setUser(data);
      } catch (err) {
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'overview') {
        fetchStats();
        fetchAttendance();
      } else if (activeTab === 'courses') {
        fetchCourses();
      } else if (activeTab === 'students') {
        fetchStudents();
      } else if (activeTab === 'attendance') {
        fetchAttendance();
        fetchCourses();
        fetchStudents();
      } else if (activeTab === 'reports') {
        fetchCourses();
        fetchStudents();
      } else if (activeTab === 'scan' || activeTab === 'qr') {
        fetchCourses();
        fetchStudents();
      } else if (activeTab === 'settings') {
        fetchSystemSettings();
      }
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab === 'reports') {
      if (reportType === 'course') {
        fetchCourseReport(selectedReportCourse);
      } else {
        fetchStudentReport(selectedReportStudent);
      }
    }
  }, [reportType, selectedReportCourse, selectedReportStudent, activeTab]);

  useEffect(() => {
    if (activeTab === 'reports') {
      if (reportType === 'course' && !selectedReportCourse && courses.length > 0) {
        setSelectedReportCourse(courses[0].course_code);
      } else if (reportType === 'student' && !selectedReportStudent && students.length > 0) {
        setSelectedReportStudent(students[0].student_id);
      }
    }
  }, [courses, students, reportType, activeTab]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/courses?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(courseForm),
      });
      if (res.ok) {
        setShowCourseModal(false);
        setCourseForm({ course_code: '', course_name: '', description: '' });
        fetchCourses();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to add course');
      }
    } catch (err) {
      console.error(err);
      alert('Network error adding course');
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/v1/auth/students?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentForm),
      });
      if (res.ok) {
        setShowStudentModal(false);
        setStudentForm({ student_id: '', full_name: '', email: '' });
        fetchStudents();
        fetchStats();
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to add student');
      }
    } catch (err) {
      console.error(err);
      alert('Network error adding student');
    }
  };

  const handleAttendanceSubmit = async (e, force = false) => {
    if (e) e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const forceParam = force ? '&force=true' : '';
      const res = await fetch(`/api/v1/auth/attendance?token=${encodeURIComponent(token)}${forceParam}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceForm),
      });
      if (res.ok) {
        setShowAttendanceModal(false);
        setAttDuplicateError('');
        setAttendanceForm({
          student_id: students[0]?.student_id || '',
          course_code: courses[0]?.course_code || '',
          date: new Date().toISOString().split('T')[0],
          status: 'present'
        });
        fetchAttendance();
        fetchStats();
      } else if (res.status === 409) {
        const data = await res.json();
        setAttDuplicateError(data.detail);
      } else {
        const data = await res.json();
        alert(data.detail || 'Failed to log attendance');
      }
    } catch (err) {
      console.error(err);
      alert('Network error logging attendance');
    }
  };

  const exportReportToCSV = () => {
    if (reportData.length === 0) return;
    
    let csvContent = "\uFEFF"; // Unicode BOM for Excel compatibility
    
    if (reportType === 'course') {
      csvContent += "Student ID,Student Name,Total Classes,Present,Late,Absent,Attendance Rate\n";
      reportData.forEach(r => {
        csvContent += `"${r.student_id}","${r.student_name}",${r.total_classes},${r.present_count},${r.late_count},${r.absent_count},${r.attendance_rate}%\n`;
      });
    } else {
      csvContent += "Course Code,Course Name,Total Classes,Present,Late,Absent,Attendance Rate\n";
      reportData.forEach(r => {
        csvContent += `"${r.course_code}","${r.course_name}",${r.total_classes},${r.present_count},${r.late_count},${r.absent_count},${r.attendance_rate}%\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = reportType === 'course' 
      ? `attendance_report_course_${selectedReportCourse || 'all'}.csv` 
      : `attendance_report_student_${selectedReportStudent || 'all'}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderOverview = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Overview</h1>
            <span className="date">{today}</span>
          </div>
          <button className="btn btn-primary" onClick={() => {
            if (courses.length > 0 && students.length > 0) {
              setAttendanceForm({
                student_id: students[0].student_id,
                course_code: courses[0].course_code,
                date: new Date().toISOString().split('T')[0],
                status: 'present'
              });
            }
            setShowAttendanceModal(true);
          }}>
            + Log Attendance
          </button>
        </div>

        <div className="stats-grid">
          <div className="glass-card stats-card">
            <div className="stats-card-header">
              <div>
                <div className="value">{stats.total_students}</div>
                <div className="label">Total Students</div>
              </div>
              <div className="stats-card-icon teal">👥</div>
            </div>
            <div className="change positive">Registered in system</div>
          </div>

          <div className="glass-card stats-card">
            <div className="stats-card-header">
              <div>
                <div className="value">{stats.active_courses}</div>
                <div className="label">Active Courses</div>
              </div>
              <div className="stats-card-icon cyan">📚</div>
            </div>
            <div className="change positive">Courses configured</div>
          </div>

          <div className="glass-card stats-card">
            <div className="stats-card-header">
              <div>
                <div className="value">{stats.attendance_rate}%</div>
                <div className="label">Attendance Rate</div>
              </div>
              <div className="stats-card-icon green">📊</div>
            </div>
            <div className="change positive">Present & Late logs</div>
          </div>

          <div className="glass-card stats-card">
            <div className="stats-card-header">
              <div>
                <div className="value">{stats.sessions_today}</div>
                <div className="label">Active Courses Today</div>
              </div>
              <div className="stats-card-icon amber">📅</div>
            </div>
            <div className="change positive">Updated in real-time</div>
          </div>
        </div>

        <div className="glass-card table-card">
          <div className="table-card-header">
            <h2>Recent Attendance</h2>
            <button className="btn btn-outline" style={{ fontSize: 'var(--font-xs)' }} onClick={() => setActiveTab('attendance')}>
              View All
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.slice(0, 5).map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.student_id}</td>
                  <td style={{ fontWeight: 500 }}>{row.student_name}</td>
                  <td>{row.course_code}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                  <td>
                    <span className={`status-badge ${row.status}`}>
                      {row.status === 'present' && '●'}
                      {row.status === 'absent' && '●'}
                      {row.status === 'late' && '●'}
                      {' '}{row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No attendance logged yet. Click "+ Log Attendance" to add one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderStudents = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Student Management</h1>
            <span className="date">Register and manage academic students</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>
            + Add Student
          </button>
        </div>

        <div className="glass-card table-card">
          <div className="table-card-header">
            <h2>Registered Students</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{s.student_id}</td>
                  <td style={{ fontWeight: 500 }}>{s.full_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{s.email || 'No email provided'}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No students registered yet. Click "+ Add Student" to register one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderCourses = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Course Management</h1>
            <span className="date">Manage active academic courses</span>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCourseModal(true)}>
            + Add Course
          </button>
        </div>

        <div className="glass-card table-card">
          <div className="table-card-header">
            <h2>Active Courses</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Course Code</th>
                <th>Course Name</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{c.course_code}</td>
                  <td style={{ fontWeight: 500 }}>{c.course_name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{c.description || 'No description provided'}</td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No courses found. Click "+ Add Course" to create one!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderAttendance = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Attendance Logs</h1>
            <span className="date">Track and log student attendance records</span>
          </div>
          <button className="btn btn-primary" onClick={() => {
            if (courses.length > 0 && students.length > 0) {
              setAttendanceForm({
                student_id: students[0].student_id,
                course_code: courses[0].course_code,
                date: new Date().toISOString().split('T')[0],
                status: 'present'
              });
            }
            setAttDuplicateError('');
            setShowAttendanceModal(true);
          }}>
            + Log Attendance
          </button>
        </div>

        <div className="glass-card table-card">
          <div className="table-card-header">
            <h2>Attendance History</h2>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student Name</th>
                <th>Course</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.student_id}</td>
                  <td style={{ fontWeight: 500 }}>{row.student_name}</td>
                  <td>{row.course_code}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{row.date}</td>
                  <td>
                    <span className={`status-badge ${row.status}`}>
                      {row.status === 'present' && '●'}
                      {row.status === 'absent' && '●'}
                      {row.status === 'late' && '●'}
                      {' '}{row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
              {attendance.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                    No attendance records found. Click "+ Log Attendance" to start!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  const renderReports = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>Attendance Reports</h1>
            <span className="date">Export and review attendance statistics</span>
          </div>
          {reportData.length > 0 && (
            <button className="btn btn-outline" onClick={exportReportToCSV}>
              📥 Export CSV
            </button>
          )}
        </div>

        {/* Report Type Toggle & Filters */}
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
            <div className="input-group" style={{ flex: '0 0 auto', width: '200px' }}>
              <label>Report Type</label>
              <select
                className="input-field"
                style={{ background: '#111827', color: '#fff', cursor: 'pointer' }}
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData([]);
                }}
              >
                <option value="course">Course Report</option>
                <option value="student">Student Report</option>
              </select>
            </div>

            {reportType === 'course' ? (
              <div className="input-group" style={{ flex: '1 1 250px' }}>
                <label htmlFor="course_report_select">Select Course</label>
                <select
                  id="course_report_select"
                  className="input-field"
                  style={{ background: '#111827', color: '#fff', cursor: 'pointer' }}
                  value={selectedReportCourse}
                  onChange={(e) => setSelectedReportCourse(e.target.value)}
                >
                  <option value="">-- Choose Course --</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.course_code}>{c.course_code} - {c.course_name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="input-group" style={{ flex: '1 1 250px' }}>
                <label htmlFor="student_report_select">Select Student</label>
                <select
                  id="student_report_select"
                  className="input-field"
                  style={{ background: '#111827', color: '#fff', cursor: 'pointer' }}
                  value={selectedReportStudent}
                  onChange={(e) => setSelectedReportStudent(e.target.value)}
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.student_id}>{s.student_id} - {s.full_name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Report Data Table */}
        <div className="glass-card table-card">
          <div className="table-card-header">
            <h2>
              {reportType === 'course' 
                ? `Course Summary: ${selectedReportCourse || 'Select a course'}` 
                : `Student Summary: ${selectedReportStudent || 'Select a student'}`}
            </h2>
          </div>

          {reportLoading ? (
             <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
               Generating report summary...
             </div>
          ) : (
            <table className="data-table">
              <thead>
                {reportType === 'course' ? (
                  <tr>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Total Classes</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                ) : (
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Total Classes</th>
                    <th>Present</th>
                    <th>Late</th>
                    <th>Absent</th>
                    <th>Attendance Rate</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {reportData.map((row, idx) => {
                  const rate = row.attendance_rate;
                  let rateClass = 'status-badge present'; // Teal/Green for high
                  if (rate < 75) rateClass = 'status-badge absent'; // Red for low
                  else if (rate < 90) rateClass = 'status-badge late'; // Yellow/Amber for moderate
                  
                  return reportType === 'course' ? (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.student_id}</td>
                      <td style={{ fontWeight: 500 }}>{row.student_name}</td>
                      <td>{row.total_classes}</td>
                      <td style={{ color: 'var(--success)' }}>{row.present_count}</td>
                      <td style={{ color: 'var(--warning)' }}>{row.late_count}</td>
                      <td style={{ color: 'var(--danger)' }}>{row.absent_count}</td>
                      <td>
                        <span className={rateClass}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  ) : (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{row.course_code}</td>
                      <td style={{ fontWeight: 500 }}>{row.course_name}</td>
                      <td>{row.total_classes}</td>
                      <td style={{ color: 'var(--success)' }}>{row.present_count}</td>
                      <td style={{ color: 'var(--warning)' }}>{row.late_count}</td>
                      <td style={{ color: 'var(--danger)' }}>{row.absent_count}</td>
                      <td>
                        <span className={rateClass}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                      Select a filter above to populate the attendance report summary.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
  };

  const renderQRSession = () => {
    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>QR Sessions</h1>
            <span className="date">Generate a QR code for students to scan</span>
          </div>
        </div>

        <div className="glass-card" style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <div className="input-group">
            <label>Select Course for Session</label>
            <select
              className="input-field"
              style={{ background: 'rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer' }}
              value={qrSessionCourse}
              onChange={(e) => { setQrSessionCourse(e.target.value); setShowQR(false); }}
            >
              <option value="">-- Choose Course --</option>
              {courses.map(c => (
                <option key={c.id} value={c.course_code}>{c.course_code} - {c.course_name}</option>
              ))}
            </select>
          </div>

          <button 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={!qrSessionCourse}
            onClick={() => setShowQR(true)}
          >
            Generate QR Code
          </button>

          {showQR && qrSessionCourse && (
            <div style={{ marginTop: '2.5rem', textAlign: 'center', animation: 'fadeInUp 0.3s ease-out' }}>
              <div style={{
                background: '#fff',
                padding: '1.5rem',
                borderRadius: '1.5rem',
                display: 'inline-block',
                boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
              }}>
                <QRCodeCanvas 
                  value={JSON.stringify({ course: qrSessionCourse, date: new Date().toISOString().split('T')[0], type: 'attendance' })}
                  size={240}
                  level="H"
                />
              </div>
              <p style={{ marginTop: '1.5rem', fontSize: '1.1rem', fontWeight: 600 }}>
                Scan this code to mark attendance for <span style={{ color: 'var(--accent-primary-light)' }}>{qrSessionCourse}</span>
              </p>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Session Date: {new Date().toISOString().split('T')[0]}
              </p>
            </div>
          )}
        </div>
      </>
    );
  };

  const renderSettings = () => {
    const allowMultiple = systemSettings.allow_multiple_daily_attendance === 'true';

    return (
      <>
        <div className="dashboard-header">
          <div>
            <h1>System Settings</h1>
            <span className="date">Configure global platform rules and defaults</span>
          </div>
        </div>

        <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto', padding: '2.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
            ⚙️ Attendance Settings
          </h2>

          {settingsLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Loading settings...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                gap: '2rem',
                background: 'rgba(255,255,255,0.02)',
                padding: '1.5rem',
                borderRadius: '1rem',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem', color: '#fff' }}>
                    Allow Multiple Daily Attendances
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                    Allow students to log attendance for the same course multiple times on the same day. 
                    If disabled, duplicate scans will trigger warnings and require manual bypass.
                  </p>
                </div>
                <div>
                  <label className="switch" style={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '60px',
                    height: '34px',
                  }}>
                    <input 
                      type="checkbox" 
                      checked={allowMultiple}
                      onChange={(e) => updateSystemSetting('allow_multiple_daily_attendance', e.target.checked ? 'true' : 'false')}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span className="slider round" style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0, left: 0, right: 0, bottom: 0,
                      backgroundColor: allowMultiple ? 'var(--accent-primary)' : 'rgba(255,255,255,0.15)',
                      transition: '.4s',
                      borderRadius: '34px',
                      boxShadow: allowMultiple ? '0 0 10px var(--accent-primary-light)' : 'none'
                    }}>
                      <span className="thumb" style={{
                        position: 'absolute',
                        content: '""',
                        height: '26px',
                        width: '26px',
                        left: '4px',
                        bottom: '4px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                        transform: allowMultiple ? 'translateX(26px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  };


  const renderPlaceholder = () => {
    const item = SIDEBAR_ITEMS.find(i => i.id === activeTab);
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <div className="glass-card" style={{ maxWidth: '500px', margin: '0 auto', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item?.icon || '⚙️'}</div>
          <h2>{item?.label} Feature</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '2rem' }}>
            We are working hard to bring this feature to life. Stay tuned!
          </p>
          <button className="btn btn-outline" onClick={() => setActiveTab('overview')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="orb orb-1" style={{ opacity: 0.3 }} />
        <div className="spinner" />
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>Loading dashboard…</p>
      </div>
    );
  }

  const initials = (user?.full_name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="brand-icon">SA</span>
          SmartAttend
        </div>

        <div className="sidebar-section-label">Main</div>
        {SIDEBAR_ITEMS.slice(0, 4).map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="sidebar-section-label">Analytics</div>
        {SIDEBAR_ITEMS.slice(4).map((item) => (
          <button
            key={item.id}
            className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="sidebar-spacer" />

        <div className="sidebar-bottom">
          <button className="sidebar-link" onClick={handleLogout}>
            <span className="icon">🚪</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Top Bar */}
      <div className="top-bar">
        <div className="top-bar-left">
          <h2>{SIDEBAR_ITEMS.find(i => i.id === activeTab)?.label || 'Dashboard'}</h2>
          <div className="breadcrumb">{today}</div>
        </div>
        <div className="top-bar-right">
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <span className="user-name">{user?.full_name || 'User'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'students' && renderStudents()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'attendance' && renderAttendance()}
        {activeTab === 'qr' && renderQRSession()}
        {activeTab === 'scan' && <ScanQRTab courses={courses} students={students} />}
        {activeTab === 'reports' && renderReports()}
        {!['overview', 'students', 'courses', 'attendance', 'qr', 'scan', 'reports'].includes(activeTab) && renderPlaceholder()}
      </main>

      {/* Course Add Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>➕ Add New Course</h2>
              <button className="modal-close" onClick={() => setShowCourseModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCourseSubmit} className="modal-form">
              <div className="input-group">
                <label htmlFor="course_code">Course Code</label>
                <input id="course_code" type="text" className="input-field" placeholder="e.g. CS-301"
                  value={courseForm.course_code}
                  onChange={(e) => setCourseForm({ ...courseForm, course_code: e.target.value })} required />
              </div>
              <div className="input-group">
                <label htmlFor="course_name">Course Name</label>
                <input id="course_name" type="text" className="input-field" placeholder="e.g. Advanced Algorithms"
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label htmlFor="description">Description (Optional)</label>
                <textarea id="description" className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                  placeholder="Brief course information"
                  value={courseForm.description}
                  onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowCourseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Course</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Student Add Modal */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Add New Student</h2>
              <button className="modal-close" onClick={() => setShowStudentModal(false)}>✕</button>
            </div>
            <form onSubmit={handleStudentSubmit} className="modal-form">
              <div className="input-group">
                <label htmlFor="student_id">Student ID / Roll No</label>
                <input id="student_id" type="text" className="input-field" placeholder="e.g. STU-2026-001"
                  value={studentForm.student_id}
                  onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })} required />
              </div>
              <div className="input-group">
                <label htmlFor="full_name">Full Name</label>
                <input id="full_name" type="text" className="input-field" placeholder="e.g. Ahmad Raza"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label htmlFor="s_email">Email Address (Optional)</label>
                <input id="s_email" type="email" className="input-field" placeholder="e.g. ahmad@example.com"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Add Student</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Attendance Log Modal */}
      {showAttendanceModal && (
        <div className="modal-overlay" onClick={() => { setShowAttendanceModal(false); setAttDuplicateError(''); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✅ Log Attendance</h2>
              <button className="modal-close" onClick={() => { setShowAttendanceModal(false); setAttDuplicateError(''); }}>✕</button>
            </div>
            <form onSubmit={(e) => handleAttendanceSubmit(e, false)} className="modal-form">
              {courses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>No Courses Yet</h3>
                  <p>Add at least one course before logging attendance.</p>
                </div>
              ) : students.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">👥</div>
                  <h3>No Students Yet</h3>
                  <p>Add at least one student before logging attendance.</p>
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="student_select">Select Student</label>
                    <select id="student_select" className="input-field"
                      value={attendanceForm.student_id}
                      onChange={(e) => {
                        setAttendanceForm({ ...attendanceForm, student_id: e.target.value });
                        setAttDuplicateError('');
                      }} required>
                      {students.map((s) => (
                        <option key={s.id} value={s.student_id}>{s.student_id} — {s.full_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="course_select">Select Course</label>
                    <select id="course_select" className="input-field"
                      value={attendanceForm.course_code}
                      onChange={(e) => {
                        setAttendanceForm({ ...attendanceForm, course_code: e.target.value });
                        setAttDuplicateError('');
                      }} required>
                      {courses.map((c) => (
                        <option key={c.id} value={c.course_code}>{c.course_code} — {c.course_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label htmlFor="attendance_date">Date</label>
                    <input id="attendance_date" type="date" className="input-field"
                      value={attendanceForm.date}
                      onChange={(e) => {
                        setAttendanceForm({ ...attendanceForm, date: e.target.value });
                        setAttDuplicateError('');
                      }} required />
                  </div>
                  <div className="input-group">
                    <label htmlFor="status_select">Status</label>
                    <select id="status_select" className="input-field"
                      value={attendanceForm.status}
                      onChange={(e) => {
                        setAttendanceForm({ ...attendanceForm, status: e.target.value });
                        setAttDuplicateError('');
                      }} required>
                      <option value="present">✅ Present</option>
                      <option value="absent">❌ Absent</option>
                      <option value="late">⏰ Late</option>
                    </select>
                  </div>
                </>
              )}

              {attDuplicateError && (
                <div style={{
                  marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem',
                  background: 'rgba(251,191,36,0.1)', color: 'var(--warning)',
                  textAlign: 'left'
                }}>
                  <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>⚠️ {attDuplicateError}</p>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%', marginTop: '0.5rem', borderColor: 'var(--warning)', color: 'var(--warning)' }}
                    onClick={() => handleAttendanceSubmit(null, true)}
                  >
                    Mark Again Anyway (Force Add)
                  </button>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => { setShowAttendanceModal(false); setAttDuplicateError(''); }}>Cancel</button>
                {courses.length > 0 && students.length > 0 &&
                  <button type="submit" className="btn btn-primary" disabled={!!attDuplicateError}>Log Record</button>}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
