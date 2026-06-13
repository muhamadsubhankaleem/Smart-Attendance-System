import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const SIDEBAR_ITEMS = [
  { icon: '📊', label: 'Overview', id: 'overview' },
  { icon: '👥', label: 'Students', id: 'students' },
  { icon: '📚', label: 'Courses', id: 'courses' },
  { icon: '✅', label: 'Attendance', id: 'attendance' },
  { icon: '📱', label: 'QR Sessions', id: 'qr' },
  { icon: '📄', label: 'Reports', id: 'reports' },
];

const MOCK_ATTENDANCE = [
  { id: 1, student: 'Ahmed Khan', course: 'CS-301', date: '2026-06-13', status: 'present' },
  { id: 2, student: 'Sara Ali', course: 'CS-301', date: '2026-06-13', status: 'present' },
  { id: 3, student: 'Omar Hassan', course: 'CS-205', date: '2026-06-13', status: 'late' },
  { id: 4, student: 'Fatima Noor', course: 'CS-401', date: '2026-06-13', status: 'absent' },
  { id: 5, student: 'Bilal Raza', course: 'CS-205', date: '2026-06-13', status: 'present' },
  { id: 6, student: 'Ayesha Malik', course: 'CS-301', date: '2026-06-12', status: 'present' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      {/* Navbar */}
      <nav className="navbar scrolled">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">SA</span>
          SmartAttend
        </Link>
        <div className="navbar-actions">
          <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)' }}>
            Welcome, Admin
          </span>
          <button className="btn btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="sidebar">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="dashboard-header">
            <div>
              <h1>Dashboard</h1>
              <span className="date">{today}</span>
            </div>
            <button className="btn btn-primary">
              + New Session
            </button>
          </div>

          {/* Stats */}
          <div className="stats-grid">
            <div className="glass-card stats-card">
              <div className="stats-card-header">
                <div>
                  <div className="value">1,247</div>
                  <div className="label">Total Students</div>
                </div>
                <div className="stats-card-icon teal">👥</div>
              </div>
              <div className="change positive">+12% from last month</div>
            </div>

            <div className="glass-card stats-card">
              <div className="stats-card-header">
                <div>
                  <div className="value">48</div>
                  <div className="label">Active Courses</div>
                </div>
                <div className="stats-card-icon cyan">📚</div>
              </div>
              <div className="change positive">+3 new this semester</div>
            </div>

            <div className="glass-card stats-card">
              <div className="stats-card-header">
                <div>
                  <div className="value">94.2%</div>
                  <div className="label">Attendance Rate</div>
                </div>
                <div className="stats-card-icon green">📊</div>
              </div>
              <div className="change positive">+2.1% this week</div>
            </div>

            <div className="glass-card stats-card">
              <div className="stats-card-header">
                <div>
                  <div className="value">23</div>
                  <div className="label">Sessions Today</div>
                </div>
                <div className="stats-card-icon amber">📅</div>
              </div>
              <div className="change negative">5 remaining</div>
            </div>
          </div>

          {/* Recent Attendance Table */}
          <div className="glass-card table-card">
            <div className="table-card-header">
              <h2>Recent Attendance</h2>
              <button className="btn btn-outline" style={{ fontSize: 'var(--font-xs)' }}>
                View All
              </button>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ATTENDANCE.map((row) => (
                  <tr key={row.id}>
                    <td style={{ fontWeight: 500 }}>{row.student}</td>
                    <td>{row.course}</td>
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
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </>
  );
}
