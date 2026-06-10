import { useEffect, useState, useRef, useCallback } from 'react'
import {
  BarChart3, Download, Filter, FileText, Calendar,
  TrendingUp, Users, BookOpen, CheckCircle, XCircle, Clock,
  RefreshCw, ChevronDown, Printer,
} from 'lucide-react'
import { coursesApi, studentsApi, reportsApi } from '../../api/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title, PointElement, LineElement, Filler,
} from 'chart.js'
import { Bar, Pie, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title, PointElement, LineElement, Filler,
)

// ─── Chart config helpers ─────────────────────────────────────────────────────
const darkPlugin = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#94a3b8', font: { size: 11, family: 'Inter' } } },
    tooltip: {
      backgroundColor: '#0d1526',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
    },
  },
}

const axisOpts = {
  x: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  y: { ticks: { color: '#475569', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' }, max: 100, min: 0 },
}

const TABS = ['overview', 'course', 'student']

// ─── DateRangePicker ──────────────────────────────────────────────────────────
function DateRangePicker({ startDate, endDate, onChange }) {
  const presets = [
    { label: 'Last 7 days',   days: 7 },
    { label: 'Last 30 days',  days: 30 },
    { label: 'Last 3 months', days: 90 },
    { label: 'This year',     days: 365 },
  ]
  const applyPreset = (days) => {
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - days)
    onChange(start.toISOString().split('T')[0], end.toISOString().split('T')[0])
  }
  const clearDates = () => onChange('', '')

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5 glass-card px-3 py-2">
        <Calendar size={13} className="text-slate-600" />
        <input
          type="date" value={startDate}
          onChange={e => onChange(e.target.value, endDate)}
          className="bg-transparent text-slate-300 text-xs outline-none w-32"
        />
        <span className="text-slate-600 text-xs">→</span>
        <input
          type="date" value={endDate}
          onChange={e => onChange(startDate, e.target.value)}
          className="bg-transparent text-slate-300 text-xs outline-none w-32"
        />
      </div>
      <div className="flex gap-1">
        {presets.map(p => (
          <button key={p.label} onClick={() => applyPreset(p.days)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-slate-500 hover:text-indigo-400 hover:border-indigo-500/30 transition-all">
            {p.label}
          </button>
        ))}
        {(startDate || endDate) && (
          <button onClick={clearDates} className="text-xs px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.07] text-rose-500 hover:bg-rose-500/10 transition-all">
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ─── SummaryCard ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, iconClass, valueClass }) {
  return (
    <div className="glass-card p-4 flex items-center gap-4 animate-slide-up">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconClass}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-slate-500 text-xs">{label}</p>
        <p className={`text-xl font-bold leading-tight ${valueClass || 'text-white'}`}>{value ?? '—'}</p>
        {sub && <p className="text-slate-600 text-xs">{sub}</p>}
      </div>
    </div>
  )
}

// ─── AttendanceBar ────────────────────────────────────────────────────────────
function AttendanceBar({ pct }) {
  const color = pct >= 75 ? '#34d399' : pct >= 60 ? '#fbbf24' : '#f87171'
  const textColor = pct >= 75 ? 'text-emerald-400' : pct >= 60 ? 'text-amber-400' : 'text-rose-400'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className={`text-xs font-bold w-10 text-right ${textColor}`}>{pct}%</span>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab]             = useState('overview')
  const [courses, setCourses]     = useState([])
  const [students, setStudents]   = useState([])
  const [selCourse, setSelCourse] = useState('')
  const [selStudent, setSelStudent] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate]     = useState('')
  const [report, setReport]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const reportRef                 = useRef(null)

  useEffect(() => {
    Promise.all([coursesApi.getAll(), studentsApi.getAll()])
      .then(([c, s]) => { setCourses(c); setStudents(s) })
      .catch(() => toast.error('Failed to load data'))
  }, [])

  const handleDateChange = (s, e) => { setStartDate(s); setEndDate(e); setReport(null) }

  const dateParams = { ...(startDate && { start_date: startDate }), ...(endDate && { end_date: endDate }) }

  const loadReport = useCallback(async () => {
    setReport(null); setLoading(true)
    try {
      if (tab === 'overview') {
        const r = await reportsApi.overview(dateParams); setReport(r)
      } else if (tab === 'course' && selCourse) {
        const r = await reportsApi.courseReport(selCourse, dateParams); setReport(r)
      } else if (tab === 'student' && selStudent) {
        const r = await reportsApi.studentReport(selStudent, dateParams); setReport(r)
      }
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed to generate report') }
    finally { setLoading(false) }
  }, [tab, selCourse, selStudent, startDate, endDate])

  const canGenerate = tab === 'overview' || (tab === 'course' && selCourse) || (tab === 'student' && selStudent)

  // ── CSV Export ───────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    try {
      const params = {
        ...dateParams,
        ...(tab === 'course' ? { course_id: selCourse } : {}),
        ...(tab === 'student' ? { student_id: selStudent } : {}),
      }
      const blob = await reportsApi.exportCsv(params)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url
      a.download = `attendance_report_${new Date().toISOString().split('T')[0]}.csv`
      a.click(); URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch { toast.error('CSV export failed') }
  }

  // ── PDF Export ───────────────────────────────────────────────────────────────
  const exportPDF = async () => {
    if (!reportRef.current) return
    setExportingPdf(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#0a0f1e',
        scale: 2,
        useCORS: true,
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const imgW = pageW - 20
      const imgH = (canvas.height * imgW) / canvas.width
      let y = 10

      // Header
      pdf.setFillColor(10, 15, 30)
      pdf.rect(0, 0, pageW, pageH, 'F')
      pdf.setTextColor(241, 245, 249)
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('Smart Attendance System', 10, 14)
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(148, 163, 184)
      pdf.text(`Attendance Report · Generated ${new Date().toLocaleDateString()}`, 10, 20)
      if (startDate || endDate) {
        pdf.text(`Period: ${startDate || 'All time'} → ${endDate || 'today'}`, 10, 25)
      }
      y = startDate || endDate ? 30 : 27

      // Paginate image if tall
      const maxImgH = pageH - y - 5
      if (imgH <= maxImgH) {
        pdf.addImage(imgData, 'PNG', 10, y, imgW, imgH)
      } else {
        let srcY = 0
        let pageImgH = maxImgH
        let first = true
        while (srcY < canvas.height) {
          if (!first) {
            pdf.addPage()
            pdf.setFillColor(10, 15, 30)
            pdf.rect(0, 0, pageW, pageH, 'F')
            y = 10; pageImgH = pageH - 15
          }
          const sliceH = Math.min(pageImgH, imgH - (srcY * imgW / canvas.width))
          pdf.addImage(imgData, 'PNG', 10, y, imgW, sliceH, undefined, 'FAST', 0)
          srcY += (pageImgH / imgH) * canvas.height
          first = false
        }
      }

      pdf.save(`attendance_report_${new Date().toISOString().split('T')[0]}.pdf`)
      toast.success('PDF exported successfully')
    } catch (e) { console.error(e); toast.error('PDF export failed') }
    finally { setExportingPdf(false) }
  }

  // ── Chart Data ───────────────────────────────────────────────────────────────
  const buildBarData = (stats) => ({
    labels: stats.map(s => s.roll_number || s.student_name?.split(' ')[0]),
    datasets: [{
      label: 'Attendance %',
      data: stats.map(s => s.percentage),
      backgroundColor: stats.map(s => s.percentage >= 75 ? 'rgba(99,102,241,0.7)' : s.percentage >= 60 ? 'rgba(251,191,36,0.7)' : 'rgba(248,113,113,0.7)'),
      borderColor: stats.map(s => s.percentage >= 75 ? '#6366f1' : s.percentage >= 60 ? '#fbbf24' : '#f87171'),
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    }],
  })

  const buildPieData = (present, absent, late) => ({
    labels: ['Present', 'Absent', 'Late'],
    datasets: [{
      data: [present, absent, late],
      backgroundColor: ['rgba(52,211,153,0.85)', 'rgba(248,113,113,0.85)', 'rgba(251,191,36,0.85)'],
      borderColor: ['#34d399', '#f87171', '#fbbf24'],
      borderWidth: 2,
    }],
  })

  const buildLineData = (daily) => ({
    labels: daily.map(d => d.date),
    datasets: [
      {
        label: 'Attendance Rate %',
        data: daily.map(d => d.rate),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#6366f1',
        pointRadius: 3,
      },
    ],
  })

  const buildTrendData = (trend) => ({
    labels: trend.map(d => d.date),
    datasets: [
      { label: 'Present', data: trend.map(d => d.present), backgroundColor: 'rgba(52,211,153,0.7)', borderRadius: 4, borderSkipped: false },
      { label: 'Absent',  data: trend.map(d => d.absent),  backgroundColor: 'rgba(248,113,113,0.7)', borderRadius: 4, borderSkipped: false },
      { label: 'Late',    data: trend.map(d => d.late),    backgroundColor: 'rgba(251,191,36,0.7)', borderRadius: 4, borderSkipped: false },
    ],
  })

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {/* ── Page header ── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div className="page-header mb-0">
          <h1 className="page-title flex items-center gap-2">
            <BarChart3 size={22} className="text-indigo-400" /> Attendance Reports
          </h1>
          <p className="page-subtitle">Filter, visualise, and export attendance data</p>
        </div>
        {report && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={exportCSV} className="btn-secondary btn-sm">
              <Download size={14} /> CSV
            </button>
            <button onClick={exportPDF} disabled={exportingPdf} className="btn-secondary btn-sm">
              {exportingPdf ? <LoadingSpinner size="sm" /> : <FileText size={14} />} PDF
            </button>
          </div>
        )}
      </div>

      {/* ── Tab bar ── */}
      <div className="flex bg-white/[0.04] border border-white/[0.07] rounded-xl p-1 w-fit mb-5">
        {[
          { v: 'overview', label: '📊 Overview' },
          { v: 'course',   label: '📚 Course Report' },
          { v: 'student',  label: '👤 Student Report' },
        ].map(({ v, label }) => (
          <button key={v} onClick={() => { setTab(v); setReport(null) }}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${tab === v ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Filters panel ── */}
      <div className="glass-card p-5 mb-5">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Course / Student selector */}
          {tab === 'course' && (
            <div className="flex-1 min-w-48">
              <label className="input-label">Course</label>
              <select className="select-field" value={selCourse} onChange={e => { setSelCourse(e.target.value); setReport(null) }}>
                <option value="">Select course…</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
          )}
          {tab === 'student' && (
            <div className="flex-1 min-w-48">
              <label className="input-label">Student</label>
              <select className="select-field" value={selStudent} onChange={e => { setSelStudent(e.target.value); setReport(null) }}>
                <option value="">Select student…</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.roll_number} — {s.name}</option>)}
              </select>
            </div>
          )}

          {/* Date range */}
          <div className="flex flex-col gap-1">
            <span className="input-label">Date Range</span>
            <DateRangePicker startDate={startDate} endDate={endDate} onChange={handleDateChange} />
          </div>

          <button onClick={loadReport} disabled={loading || !canGenerate} className="btn-primary self-end">
            {loading ? <><LoadingSpinner size="sm" /> Generating…</> : <><Filter size={15} /> Generate Report</>}
          </button>
        </div>
      </div>

      {/* ── Loading ── */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-slate-500 text-sm">Building report…</p>
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!report && !loading && (
        <div className="flex flex-col items-center justify-center h-52 glass-card text-slate-600">
          <BarChart3 size={44} className="mb-3 opacity-20" />
          <p className="text-sm font-medium">
            {tab === 'overview' ? 'Click "Generate Report" to load overview stats' :
             tab === 'course'   ? 'Select a course and click Generate Report' :
                                  'Select a student and click Generate Report'}
          </p>
          <p className="text-xs mt-1 opacity-70">Optionally filter by date range first</p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          REPORT OUTPUT — captured by html2canvas for PDF
          ════════════════════════════════════════════════════════════════════ */}
      {report && !loading && (
        <div ref={reportRef} className="space-y-5 animate-slide-up">

          {/* ── OVERVIEW TAB ── */}
          {tab === 'overview' && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Users}          label="Total Students"  value={report.total_students}
                  iconClass="bg-indigo-500/15 border border-indigo-500/20 text-indigo-400"   valueClass="text-white" />
                <SummaryCard icon={BookOpen}       label="Total Courses"   value={report.total_courses}
                  iconClass="bg-violet-500/15 border border-violet-500/20 text-violet-400"   valueClass="text-white" />
                <SummaryCard icon={BarChart3}      label="Sessions"        value={report.total_sessions}
                  iconClass="bg-cyan-500/15 border border-cyan-500/20 text-cyan-400"         valueClass="text-white" />
                <SummaryCard icon={TrendingUp}     label="Attendance Rate" value={`${report.attendance_rate}%`}
                  iconClass="bg-emerald-500/15 border border-emerald-500/20 text-emerald-400"
                  valueClass={report.attendance_rate >= 75 ? 'text-emerald-400' : report.attendance_rate >= 60 ? 'text-amber-400' : 'text-rose-400'} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Status pie */}
                <div className="glass-card p-5">
                  <h2 className="text-white font-semibold text-sm mb-4">Status Distribution</h2>
                  <div className="flex flex-col items-center">
                    <div style={{ width: 200, height: 200 }}>
                      <Pie data={buildPieData(report.status_counts.present, report.status_counts.absent, report.status_counts.late)}
                        options={{ ...darkPlugin, maintainAspectRatio: false }} />
                    </div>
                    <div className="flex gap-4 mt-4 text-xs">
                      {[
                        { label: 'Present', count: report.status_counts.present, color: 'text-emerald-400' },
                        { label: 'Absent',  count: report.status_counts.absent,  color: 'text-rose-400' },
                        { label: 'Late',    count: report.status_counts.late,     color: 'text-amber-400' },
                      ].map(({ label, count, color }) => (
                        <div key={label} className="text-center">
                          <p className={`font-bold text-base ${color}`}>{count}</p>
                          <p className="text-slate-600">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Daily trend stacked bar */}
                <div className="glass-card p-5 lg:col-span-2">
                  <h2 className="text-white font-semibold text-sm mb-4">Daily Attendance Trend</h2>
                  {report.daily_trend?.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <Bar
                        data={buildTrendData(report.daily_trend)}
                        options={{
                          ...darkPlugin, maintainAspectRatio: false,
                          scales: { x: axisOpts.x, y: { ...axisOpts.y, stacked: false, max: undefined } },
                        }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No sessions in selected range</div>
                  )}
                </div>
              </div>

              {/* Recent sessions */}
              {report.recent_sessions?.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="px-5 py-3 border-b border-white/[0.06]">
                    <h2 className="text-white font-semibold text-sm">Recent Sessions</h2>
                  </div>
                  <div className="table-wrapper">
                    <table className="data-table">
                      <thead><tr><th>Date</th><th>Course</th><th>Students</th><th>Present</th><th>Rate</th></tr></thead>
                      <tbody>
                        {report.recent_sessions.map(s => (
                          <tr key={s.session_id}>
                            <td className="font-mono text-xs text-indigo-300">{s.date}</td>
                            <td>
                              <p className="text-white text-xs font-medium">{s.course_name}</p>
                              <p className="text-slate-600 text-[11px]">{s.course_code}</p>
                            </td>
                            <td className="text-slate-400 text-xs">{s.total_records}</td>
                            <td><span className="badge-present badge">{s.present_count}</span></td>
                            <td>
                              <div className="w-24"><AttendanceBar pct={s.attendance_rate} /></div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── COURSE REPORT TAB ── */}
          {tab === 'course' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: BookOpen,  label: 'Course',          value: report.course_name,          iconClass: 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400' },
                  { icon: Users,     label: 'Students',         value: report.student_stats?.length, iconClass: 'bg-violet-500/15 border border-violet-500/20 text-violet-400' },
                  { icon: Calendar,  label: 'Sessions',         value: report.total_sessions,        iconClass: 'bg-cyan-500/15 border border-cyan-500/20 text-cyan-400' },
                  { icon: TrendingUp, label: 'Avg Attendance',  value: `${report.avg_attendance}%`,  iconClass: 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400' },
                ].map(({ icon, label, value, iconClass }) => (
                  <SummaryCard key={label} icon={icon} label={label} value={value} iconClass={iconClass} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Attendance % bar chart */}
                {report.student_stats?.length > 0 && (
                  <div className="glass-card p-5">
                    <h2 className="text-white font-semibold text-sm mb-4">Attendance % per Student</h2>
                    <div style={{ height: 250 }}>
                      <Bar
                        data={buildBarData(report.student_stats)}
                        options={{ ...darkPlugin, maintainAspectRatio: false, scales: axisOpts }}
                      />
                    </div>
                  </div>
                )}

                {/* Session trend line chart */}
                {report.daily_sessions?.length > 0 && (
                  <div className="glass-card p-5">
                    <h2 className="text-white font-semibold text-sm mb-4">Session Attendance Rate</h2>
                    <div style={{ height: 250 }}>
                      <Line
                        data={buildLineData(report.daily_sessions)}
                        options={{ ...darkPlugin, maintainAspectRatio: false, scales: axisOpts }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Student breakdown table */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center justify-between">
                  <h2 className="text-white font-semibold text-sm">Student Breakdown</h2>
                  <div className="flex gap-3 text-xs text-slate-600">
                    <span>✅ ≥75% Good</span>
                    <span>⚠️ 60–74% At risk</span>
                    <span>❌ &lt;60% Critical</span>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Roll No.</th><th>Student Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Total</th><th className="w-36">Attendance</th></tr>
                    </thead>
                    <tbody>
                      {report.student_stats.map(s => (
                        <tr key={s.student_id}>
                          <td><span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{s.roll_number}</span></td>
                          <td className="text-white font-medium text-xs">{s.student_name}</td>
                          <td><span className="badge-present badge">{s.present}</span></td>
                          <td><span className="badge-absent badge">{s.absent}</span></td>
                          <td><span className="badge-late badge">{s.late}</span></td>
                          <td className="text-slate-500 text-xs">{s.total}</td>
                          <td><AttendanceBar pct={s.percentage} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── STUDENT REPORT TAB ── */}
          {tab === 'student' && (
            <>
              {/* Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Users,     label: 'Student',     value: report.student_name,          iconClass: 'bg-indigo-500/15 border border-indigo-500/20 text-indigo-400' },
                  { icon: BookOpen,  label: 'Roll Number', value: report.roll_number,            iconClass: 'bg-violet-500/15 border border-violet-500/20 text-violet-400' },
                  { icon: Calendar,  label: 'Dept / Sem',  value: `${report.department} · Sem ${report.semester}`, iconClass: 'bg-cyan-500/15 border border-cyan-500/20 text-cyan-400' },
                  { icon: TrendingUp, label: 'Overall',    value: `${report.overall_percentage}%`, iconClass: 'bg-emerald-500/15 border border-emerald-500/20 text-emerald-400',
                    valueClass: report.overall_percentage >= 75 ? 'text-emerald-400' : report.overall_percentage >= 60 ? 'text-amber-400' : 'text-rose-400' },
                ].map(({ icon, label, value, iconClass, valueClass }) => (
                  <SummaryCard key={label} icon={icon} label={label} value={value} iconClass={iconClass} valueClass={valueClass} />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                {/* Status pie */}
                <div className="glass-card p-5 lg:col-span-2 flex flex-col">
                  <h2 className="text-white font-semibold text-sm mb-4">Overall Status</h2>
                  {(() => {
                    const totPresent = report.course_stats.reduce((a, c) => a + c.present, 0)
                    const totAbsent  = report.course_stats.reduce((a, c) => a + c.absent,  0)
                    const totLate    = report.course_stats.reduce((a, c) => a + c.late,    0)
                    return (
                      <div className="flex flex-col items-center flex-1 justify-center">
                        <div style={{ width: 180, height: 180 }}>
                          <Pie data={buildPieData(totPresent, totAbsent, totLate)}
                            options={{ ...darkPlugin, maintainAspectRatio: false }} />
                        </div>
                        <div className="flex gap-5 mt-4 text-xs">
                          {[
                            { label: 'Present', count: totPresent, cls: 'text-emerald-400' },
                            { label: 'Absent',  count: totAbsent,  cls: 'text-rose-400' },
                            { label: 'Late',    count: totLate,    cls: 'text-amber-400' },
                          ].map(({ label, count, cls }) => (
                            <div key={label} className="text-center">
                              <p className={`font-bold text-lg ${cls}`}>{count}</p>
                              <p className="text-slate-600">{label}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Per-course bar */}
                <div className="glass-card p-5 lg:col-span-3">
                  <h2 className="text-white font-semibold text-sm mb-4">Attendance % by Course</h2>
                  {report.course_stats.length > 0 ? (
                    <div style={{ height: 220 }}>
                      <Bar
                        data={{
                          labels: report.course_stats.map(c => c.course_code),
                          datasets: [{
                            label: 'Attendance %',
                            data: report.course_stats.map(c => c.percentage),
                            backgroundColor: report.course_stats.map(c => c.percentage >= 75 ? 'rgba(99,102,241,0.7)' : c.percentage >= 60 ? 'rgba(251,191,36,0.7)' : 'rgba(248,113,113,0.7)'),
                            borderColor: report.course_stats.map(c => c.percentage >= 75 ? '#6366f1' : c.percentage >= 60 ? '#fbbf24' : '#f87171'),
                            borderWidth: 1.5, borderRadius: 6, borderSkipped: false,
                          }],
                        }}
                        options={{ ...darkPlugin, maintainAspectRatio: false, scales: axisOpts }}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-40 text-slate-600 text-sm">No attendance records in selected range</div>
                  )}
                </div>
              </div>

              {/* Per-course table */}
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06]">
                  <h2 className="text-white font-semibold text-sm">Per-Course Breakdown</h2>
                </div>
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr><th>Code</th><th>Course Name</th><th>Present</th><th>Absent</th><th>Late</th><th>Sessions</th><th className="w-36">Attendance</th></tr>
                    </thead>
                    <tbody>
                      {report.course_stats.map(c => (
                        <tr key={c.course_id}>
                          <td><span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded">{c.course_code}</span></td>
                          <td className="text-white font-medium text-xs">{c.course_name}</td>
                          <td><span className="badge-present badge">{c.present}</span></td>
                          <td><span className="badge-absent badge">{c.absent}</span></td>
                          <td><span className="badge-late badge">{c.late}</span></td>
                          <td className="text-slate-500 text-xs">{c.total_sessions}</td>
                          <td><AttendanceBar pct={c.percentage} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
