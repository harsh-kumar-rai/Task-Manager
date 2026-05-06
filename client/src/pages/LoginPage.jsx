import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not sign you in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (role) => {
    setEmail(role === 'admin' ? 'admin@demo.com' : 'member@demo.com');
    setPassword('demo1234');
  };

  return (
    <div className="auth-shell">
      <section className="auth-form-side">
        <div className="auth-inner">
          <div className="auth-brand">
            <span className="brand-mark">S</span>
            Stack
          </div>

          <p className="auth-eyebrow">Welcome back</p>
          <h1 className="auth-title">Sign in to your <em>workspace</em></h1>
          <p className="auth-subtitle">
            Pick up where you left off. Track tasks, manage your team, and keep projects moving.
          </p>

          {error && <div className="banner-error mb-4">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                className="input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                className="input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="flex gap-2 mt-3" style={{ flexWrap: 'wrap' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillDemo('admin')}>
              Use admin demo
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => fillDemo('member')}>
              Use member demo
            </button>
          </div>

          <p className="auth-footer-link">
            New to Stack? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>

      <aside className="auth-aside">
        <div>
          <div className="aside-meta">A workspace for shipping</div>
        </div>
        <div>
          <p className="quote">
            &ldquo;A calm place to plan the work, see who&apos;s doing what, and ship without the <em>noise</em>.&rdquo;
          </p>
          <div className="demo-creds">
            <strong>Demo credentials</strong>
            admin@demo.com / demo1234<br />
            member@demo.com / demo1234
          </div>
        </div>
      </aside>
    </div>
  );
}
