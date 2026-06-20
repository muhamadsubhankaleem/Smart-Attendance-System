import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Login({ isRegister = false }) {
  const [mode, setMode] = useState(isRegister ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'register' ? '/api/v1/auth/register' : '/api/v1/auth/login';
      const body = mode === 'register'
        ? { full_name: form.name, email: form.email, password: form.password }
        : { email: form.email, password: form.password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(res.status === 503
          ? 'Database is not available. Please try again later.'
          : `Server error (${res.status})`);
      }

      if (!res.ok) throw new Error(data.detail || 'Something went wrong');

      if (data.access_token) localStorage.setItem('token', data.access_token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message === 'Failed to fetch'
        ? 'Cannot connect to server. Is the backend running?'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <div className="auth-card">
        {/* Logo */}
        <Link to="/" className="navbar-brand" style={{ marginBottom: '2rem', justifyContent: 'center', display: 'flex' }}>
          <span className="brand-icon" style={{ width: 40, height: 40, fontSize: '0.8rem' }}>SA</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>SmartAttend</span>
        </Link>

        {/* Mode Toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 'var(--radius-lg)',
          padding: '4px',
          marginBottom: 'var(--space-8)',
          border: '1px solid var(--border-glass)',
        }}>
          {['login', 'register'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1,
                padding: 'var(--space-2) var(--space-4)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontFamily: 'var(--font-family)',
                fontSize: 'var(--font-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all var(--transition-base)',
                background: mode === m ? 'var(--gradient-btn)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--text-secondary)',
                boxShadow: mode === m ? 'var(--shadow-btn)' : 'none',
              }}
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <h1>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="subtitle">
          {mode === 'register'
            ? 'Start tracking attendance with AI power.'
            : 'Sign in to access your dashboard.'}
        </p>

        {error && (
          <div className="error-alert">
            <span>⚠️</span>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <div className="input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              name="email"
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="input-field"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            id="auth-submit-btn"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: 'var(--space-4)', fontSize: 'var(--font-base)', marginTop: 'var(--space-2)' }}
          >
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                Please wait...
              </span>
            ) : (
              mode === 'register' ? 'Create Account →' : 'Sign In →'
            )}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'register' ? (
            <p>Already have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); }}>Sign In</a>
            </p>
          ) : (
            <p>Don't have an account?{' '}
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setError(''); }}>Create one</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
