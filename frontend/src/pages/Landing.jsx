import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
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
        <li><a href="#stats">Stats</a></li>
        <li><a href="#about">About</a></li>
      </ul>
      <div className="navbar-actions">
        <Link to="/login" className="btn btn-ghost">Sign In</Link>
        <Link to="/register" className="btn btn-primary">Get Started</Link>
      </div>
    </nav>
  );
}

const FEATURES = [
  { icon: '📸', title: 'Face Recognition', desc: 'AI-powered facial recognition for seamless, contactless attendance marking with 99.5% accuracy.' },
  { icon: '📱', title: 'QR Code Scanning', desc: 'Generate unique QR codes per session. Students scan to mark attendance instantly from their phones.' },
  { icon: '📊', title: 'Real-time Analytics', desc: 'Live dashboards with attendance trends, student performance metrics, and automated reports.' },
  { icon: '🔐', title: 'Secure Authentication', desc: 'JWT-based multi-role auth system with admin, teacher, and student access levels.' },
  { icon: '📋', title: 'Course Management', desc: 'Full CRUD for courses, sections, and enrollment. Manage your entire academic structure.' },
  { icon: '📄', title: 'Export Reports', desc: 'Download detailed attendance reports in PDF/CSV format for records and compliance.' },
];

export default function Landing() {
  return (
    <>
      <Navbar />

      {/* ── Hero Section ── */}
      <section className="hero" id="home">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot" />
            Next-Gen Attendance Platform
          </div>
          <h1>
            Smart <span className="gradient-text">Attendance</span><br />
            System
          </h1>
          <p className="hero-subtitle">
            Revolutionize how you track attendance with AI-powered face recognition,
            QR code scanning, and real-time analytics — all in one beautiful platform.
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn btn-primary btn-lg">
              Get Started Free
            </Link>
            <a href="#features" className="btn btn-outline btn-lg">
              Explore Features
            </a>
          </div>

          {/* Stats Bar */}
          <div className="stats-bar" id="stats">
            <div className="stat-item">
              <div className="stat-value">10K+</div>
              <div className="stat-label">Students Tracked</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">500+</div>
              <div className="stat-label">Courses Managed</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">99.5%</div>
              <div className="stat-label">Recognition Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-value">24/7</div>
              <div className="stat-label">System Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="section" id="features">
        <div className="section-header">
          <div className="label">Features</div>
          <h2>Everything You Need</h2>
          <p>A complete suite of tools designed to make attendance management effortless, accurate, and insightful.</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div className="glass-card feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="section" id="about" style={{ textAlign: 'center' }}>
        <div className="section-header">
          <div className="label">Get Started</div>
          <h2>Ready to Modernize Attendance?</h2>
          <p>Join thousands of institutions already using SmartAttend to streamline their attendance workflow.</p>
        </div>
        <Link to="/register" className="btn btn-primary btn-lg">
          Create Free Account
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 SmartAttend. Built with modern technology.</p>
          <ul className="footer-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><Link to="/login">Sign In</Link></li>
          </ul>
        </div>
      </footer>
    </>
  );
}
