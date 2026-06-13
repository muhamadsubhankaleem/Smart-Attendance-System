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

      // Safely parse — server may return non-JSON when DB is down
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(res.status === 503
          ? 'Database is not available. Please try again later.'
          : `Server error (${res.status})`);
      }

      if (!res.ok) {
        throw new Error(data.detail || 'Something went wrong');
      }

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
      }
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

      <div className="glass-card auth-card">
        <Link to="/" className="navbar-brand" style={{ marginBottom: '2rem', justifyContent: 'center' }}>
          <span className="brand-icon">SA</span>
          SmartAttend
        </Link>

        <h1>{mode === 'register' ? 'Create Account' : 'Welcome Back'}</h1>
        <p className="subtitle">
          {mode === 'register'
            ? 'Start tracking attendance with AI power.'
            : 'Sign in to your dashboard.'}
        </p>

        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            fontSize: 'var(--font-sm)',
            marginBottom: '1rem',
          }}>
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

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading
              ? 'Please wait...'
              : mode === 'register' ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          {mode === 'register' ? (
            <p>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Sign In</a></p>
          ) : (
            <p>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Create one</a></p>
          )}
        </div>
      </div>
    </div>
  );
}
