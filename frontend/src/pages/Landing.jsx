import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const FAQS = [
  {
    q: 'How does the QR code attendance work?',
    a: 'Teachers generate a unique QR code for each class session from the Dashboard. Students open the Scan QR tab on their phone, point their camera at the code, select their Student ID, and their attendance is instantly logged as "Present" in the database.'
  },
  {
    q: 'Can I access SmartAttend from my phone?',
    a: 'Yes! SmartAttend is fully responsive and works on any device — phone, tablet, or desktop. Simply open your browser and navigate to the network URL provided when the server starts. Both the Dashboard and the QR scanner work beautifully on mobile.'
  },
  {
    q: 'Is the attendance data stored securely?',
    a: 'All data is stored in an encrypted SQLite database on your server. Authentication uses JWT tokens with configurable expiration. Passwords are hashed with bcrypt. Only authenticated users can access attendance records.'
  },
  {
    q: 'Can I export attendance reports?',
    a: 'Absolutely. The Reports tab lets you generate per-course or per-student attendance summaries showing total classes, present/late/absent counts, and attendance rates. You can export any report to CSV with a single click.'
  },
  {
    q: 'How do I add students and courses?',
    a: 'Navigate to the Dashboard and use the Students or Courses tab. Click the "+ Add" button to open a form where you can enter the details. All records are immediately available for attendance logging and reporting.'
  },
  {
    q: 'Does it support multiple themes?',
    a: 'Yes! SmartAttend includes 8 stunning themes — Midnight, Ocean, Sunset, Forest, Rose, Aurora, Obsidian, and Cosmic. Click the 🎨 button in the bottom-right corner of any page to switch. Your choice is saved and persists across sessions.'
  },
  {
    q: 'Can multiple teachers use the system?',
    a: 'Yes. Any registered user can log in, create courses, add students, generate QR sessions, and view reports. Each user has their own JWT-authenticated session with full Dashboard access.'
  },
  {
    q: 'What happens if a student scans the QR code twice?',
    a: 'The system will log a second attendance entry. Teachers can review duplicates in the Attendance tab and manage records accordingly. Future updates will include automatic duplicate detection.'
  },
];

function FaqItem({ faq, isOpen, onClick }) {
  return (
    <div
      className="glass-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'border-color 0.25s ease, box-shadow 0.25s ease',
        borderColor: isOpen ? 'var(--accent-primary)' : undefined,
        boxShadow: isOpen ? '0 0 20px var(--accent-glow)' : undefined,
      }}
      onClick={onClick}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 1.5rem',
        gap: '1rem',
      }}>
        <h3 style={{
          fontSize: 'var(--font-base)',
          fontWeight: 600,
          fontFamily: 'var(--font-display)',
          color: isOpen ? 'var(--accent-primary-light)' : 'var(--text-primary)',
          transition: 'color 0.2s ease',
          margin: 0,
        }}>{faq.q}</h3>
        <span style={{
          fontSize: '1.2rem',
          color: 'var(--accent-primary)',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
          flexShrink: 0,
        }}>+</span>
      </div>
      <div style={{
        maxHeight: isOpen ? '300px' : '0px',
        overflow: 'hidden',
        transition: 'max-height 0.35s ease, padding 0.35s ease',
        padding: isOpen ? '0 1.5rem 1.25rem' : '0 1.5rem 0',
      }}>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-sm)',
          lineHeight: 1.75,
          margin: 0,
        }}>{faq.a}</p>
      </div>
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <Link to="/" className="navbar-brand">
        <span className="brand-icon">SA</span>
        SmartAttend
      </Link>
      <ul className="navbar-links">
        <li><a href="#features">Features</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#about">About</a></li>
      </ul>
      <div className="navbar-actions">
        <Link to="/login" className="btn btn-ghost">Sign In</Link>
        <Link to="/register" className="btn btn-primary">Get Started →</Link>
      </div>
    </nav>
  );
}

const FEATURES = [
  {
    icon: '🧠',
    title: 'Face Recognition',
    desc: 'AI-powered facial recognition for seamless, contactless attendance with 99.5% accuracy.',
    color: 'rgba(129,140,248,0.12)',
  },
  {
    icon: '📲',
    title: 'QR Code Sessions',
    desc: 'Generate unique QR codes per session. Students scan to mark attendance instantly.',
    color: 'rgba(34,211,238,0.1)',
  },
  {
    icon: '📊',
    title: 'Real-time Analytics',
    desc: 'Live dashboards with attendance trends, performance metrics, and automated reports.',
    color: 'rgba(192,132,252,0.1)',
  },
  {
    icon: '🔐',
    title: 'Secure Auth',
    desc: 'JWT-based multi-role authentication with admin, teacher, and student access levels.',
    color: 'rgba(52,211,153,0.1)',
  },
  {
    icon: '📚',
    title: 'Course Management',
    desc: 'Full CRUD for courses, sections, and enrollment. Manage your entire academic structure.',
    color: 'rgba(251,191,36,0.1)',
  },
  {
    icon: '📥',
    title: 'Export Reports',
    desc: 'Download detailed attendance reports in PDF/CSV format for records and compliance.',
    color: 'rgba(248,113,113,0.1)',
  },
];

const STATS = [
  { value: '10K+', label: 'Students Tracked' },
  { value: '500+', label: 'Courses Managed' },
  { value: '99.5%', label: 'Accuracy Rate' },
  { value: '24/7', label: 'Uptime SLA' },
];

export default function Landing() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Navbar />

      {/* ── Hero ── */}
      <section className="hero" id="home">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <span className="dot" />
            Next-Gen Attendance Platform
          </div>

          <h1>
            Smarter<br />
            <span className="gradient-text">Attendance</span><br />
            Management
          </h1>

          <p className="hero-subtitle">
            Revolutionize attendance tracking with AI-powered face recognition,
            QR code sessions, and real-time analytics — all in one beautiful platform.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free →
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              Explore Features
            </a>
          </div>

          {/* Stats Bar */}
          <div className="stats-bar" id="stats">
            {STATS.map((s, i) => (
              <div className="stat-item" key={i}>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="section" id="features">
        <div className="section-header">
          <div className="label">Features</div>
          <h2>Everything You Need</h2>
          <p>
            A complete suite of tools designed to make attendance management
            effortless, accurate, and insightful.
          </p>
        </div>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div
              className="glass-card feature-card animate-fade-in-up"
              key={i}
              style={{ animationDelay: `${i * 0.08}s`, opacity: 0 }}
            >
              <div className="feature-icon" style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="section" id="about" style={{ textAlign: 'center' }}>
        <div
          className="glass-card"
          style={{
            padding: 'var(--space-16) var(--space-8)',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(34,211,238,0.04))',
            border: '1px solid rgba(129,140,248,0.16)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Glow blob */}
          <div style={{
            position: 'absolute',
            width: '400px', height: '400px',
            background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)',
            top: '-100px', left: '50%', transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="label" style={{
              display: 'inline-block',
              fontSize: 'var(--font-xs)',
              fontWeight: 700,
              color: 'var(--accent-primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-1) var(--space-4)',
              background: 'rgba(129,140,248,0.08)',
              border: '1px solid rgba(129,140,248,0.18)',
              borderRadius: 'var(--radius-full)',
            }}>
              Get Started
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--font-4xl)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 'var(--space-4)',
            }}>
              Ready to Modernize<br />
              <span className="gradient-text">Attendance?</span>
            </h2>
            <p style={{
              fontSize: 'var(--font-lg)',
              color: 'var(--text-secondary)',
              maxWidth: '520px',
              margin: '0 auto var(--space-10)',
              lineHeight: 1.8,
            }}>
              Join thousands of institutions already using SmartAttend to
              streamline their attendance workflow.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-4)', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create Free Account →
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ Section ── */}
      <section className="section" id="faq">
        <div className="section-header">
          <div className="label">FAQ</div>
          <h2>Frequently Asked Questions</h2>
          <p>
            Everything you need to know about SmartAttend.
            Can't find what you're looking for? Reach out to our team.
          </p>
        </div>

        <div style={{
          maxWidth: '720px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}>
          {FAQS.map((faq, i) => (
            <FaqItem
              key={i}
              faq={faq}
              isOpen={openFaq === i}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            />
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div className="brand-icon" style={{
              width: 28, height: 28,
              background: 'var(--gradient-btn)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 800, color: '#fff',
            }}>SA</div>
            <span style={{ color: 'var(--text-muted)', fontSize: 'var(--font-sm)' }}>
              © 2026 SmartAttend — Built with modern technology.
            </span>
          </div>
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#faq">FAQ</a></li>
            <li><a href="#about">About</a></li>
            <li><Link to="/login">Sign In</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
