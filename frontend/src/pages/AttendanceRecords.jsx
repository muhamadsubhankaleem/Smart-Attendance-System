import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;

  useEffect(() => {
    fetch('/api/v1/attendance')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => { setRecords(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = records.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.date?.toLowerCase().includes(term) ||
      r.student?.toLowerCase().includes(term) ||
      r.course?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportCSV = () => {
    const csv = ['Date,Student,Course,Status,Remarks',
      ...filtered.map(r => `${r.date},${r.student},${r.course},${r.status},${r.remarks || ''}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'attendance_records.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusClass = (status) => {
    if (!status) return '';
    const s = status.toLowerCase();
    if (s === 'present') return 'present';
    if (s === 'absent') return 'absent';
    if (s === 'late') return 'late';
    return '';
  };

  return (
    <section className="attendance-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="gradient-text">Attendance Records</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-sm)', marginTop: 'var(--space-1)' }}>
            View and export all attendance logs
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link to="/dashboard" className="btn btn-ghost">← Dashboard</Link>
          <button className="btn btn-outline" onClick={exportCSV} disabled={filtered.length === 0}>
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="glass-card" style={{ maxWidth: '1200px', margin: '0 auto', overflow: 'hidden' }}>

        {/* Search Bar */}
        <div style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--border-glass)' }}>
          <div className="search-bar-wrapper">
            <span className="search-icon">🔍</span>
            <input
              id="search"
              className="input-field"
              type="text"
              placeholder="Search by date, student, course or status…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ padding: 'var(--space-16)', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto var(--space-4)' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>Loading records…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ padding: 'var(--space-6)' }}>
            <div className="error-alert">⚠️ Error: {error}</div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Status</th>
                    <th>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan="5">
                        <div className="empty-state">
                          <div className="empty-icon">📋</div>
                          <h3>No Records Found</h3>
                          <p>{search ? 'No records match your search.' : 'No attendance data yet.'}</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginated.map((rec, idx) => (
                      <tr key={idx}>
                        <td style={{ color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>{rec.date}</td>
                        <td style={{ fontWeight: 600 }}>{rec.student}</td>
                        <td>
                          <span style={{
                            padding: '2px 8px',
                            background: 'rgba(129,140,248,0.08)',
                            border: '1px solid rgba(129,140,248,0.15)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 600,
                            color: 'var(--accent-primary-light)',
                          }}>{rec.course}</span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusClass(rec.status)}`}>
                            {rec.status}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
                          {rec.remarks || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-outline"
                  style={{ padding: 'var(--space-2) var(--space-4)' }}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                >
                  ← Prev
                </button>
                <span className="page-info">Page {currentPage} of {totalPages} · {filtered.length} records</span>
                <button
                  className="btn btn-outline"
                  style={{ padding: 'var(--space-2) var(--space-4)' }}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
