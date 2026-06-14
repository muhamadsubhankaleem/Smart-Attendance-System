import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function AttendanceRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // Fetch attendance data from backend (mock endpoint)
    fetch('/api/v1/attendance')
      .then((res) => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Calculate pagination (moved after filtered)

  const filtered = records.filter((r) => {
    const term = search.toLowerCase();
    return (
      r.date?.toLowerCase().includes(term) ||
      r.student?.toLowerCase().includes(term) ||
      r.course?.toLowerCase().includes(term) ||
      r.status?.toLowerCase().includes(term)
    );
  });
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  return (
    <section className="attendance-page" style={{ padding: 'var(--space-8)', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="glass-card" style={{ padding: 'var(--space-6)', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 className="gradient-text" style={{ fontSize: 'var(--font-4xl)', marginBottom: 'var(--space-6)' }}>
          Attendance Records
        </h1>
        <div className="input-group" style={{ marginBottom: 'var(--space-6)' }}>
          <label htmlFor="search">Search</label>
          <input
            id="search"
            className="input-field"
            type="text"
            placeholder="Search by date, student, course, status…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading && <p>Loading attendance data…</p>}
        {error && <p style={{ color: 'var(--danger)' }}>Error: {error}</p>}
        {!loading && !error && (
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr className="bg-glass" style={{ background: 'var(--bg-glass)' }}>
                    <th className="p-4 text-left" style={{ padding: 'var(--space-4)' }}>Date</th>
                  <th className="p-4 text-left" style={{ padding: 'var(--space-4)' }}>Student</th>
                  <th className="p-4 text-left" style={{ padding: 'var(--space-4)' }}>Course</th>
                  <th className="p-4 text-left" style={{ padding: 'var(--space-4)' }}>Status</th>
                  <th className="p-4 text-left" style={{ padding: 'var(--space-4)' }}>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((rec, idx) => (
                    <tr key={idx} className="glass-card row-hover" style={{ background: 'var(--bg-card)', transition: 'var(--transition-base)' }}>
                      <td className="p-4" style={{ padding: 'var(--space-4)' }}>{rec.date}</td>
                      <td className="p-4" style={{ padding: 'var(--space-4)' }}>{rec.student}</td>
                      <td className="p-4" style={{ padding: 'var(--space-4)' }}>{rec.course}</td>
                      <td className="p-4" style={{ padding: 'var(--space-4)', color: rec.status === 'Present' ? 'var(--success)' : 'var(--danger)' }}>{rec.status}</td>
                      <td className="p-4" style={{ padding: 'var(--space-4)' }}>{rec.remarks || '-'} </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p style={{ marginTop: 'var(--space-4)' }}>No records match your search.</p>}
              {/* Pagination Controls */}
              <div className="pagination" style={{ marginTop: 'var(--space-4)', display: 'flex', justifyContent: 'center', gap: 'var(--space-2)' }}>
                <button className="btn btn-outline" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>Prev</button>
                <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>
                <button className="btn btn-outline" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>Next</button>
                <button className="btn btn-primary" onClick={() => {
                  const csv = ['Date,Student,Course,Status,Remarks', ...filtered.map(r => `${r.date},${r.student},${r.course},${r.status},${r.remarks || ''}`)].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'attendance_records.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}>Export CSV</button>
              </div>
            </div>
          )}
          <div style={{ marginTop: 'var(--space-8)', textAlign: 'right' }}>
          <Link to="/dashboard" className="btn btn-ghost">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}
