import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as registerApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await registerApi({ name, email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.1) 0%, transparent 60%), #13131f',
    }}>
      <div aria-hidden style={{ position: 'fixed', top: '20%', right: '10%', width: 280, height: 280, background: 'rgba(139,92,246,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div aria-hidden style={{ position: 'fixed', bottom: '20%', left: '10%', width: 220, height: 220, background: 'rgba(99,102,241,0.06)', borderRadius: '50%', filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="auth-card" style={{ animation: 'slideUp 0.3s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '1rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
            boxShadow: '0 8px 32px rgba(139,92,246,0.45)',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
            Create account
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Join <span className="gradient-text" style={{ fontWeight: 600 }}>AutoVault</span> today
          </p>
        </div>

        {error && (
          <div role="alert" style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: '0.75rem', padding: '0.75rem 1rem', marginBottom: '1.25rem',
            color: '#fca5a5', fontSize: '0.875rem', textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        <form id="register-form" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="register-name" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Full Name</label>
            <input
              id="register-name"
              type="text"
              className="input-field"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="John Doe"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="register-email" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email</label>
            <input
              id="register-email"
              type="email"
              className="input-field"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="register-password" style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600, marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.75rem' }}>(min 6 chars)</span>
            </label>
            <input
              id="register-password"
              type="password"
              className="input-field"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '1rem', marginTop: '0.25rem' }}
            disabled={loading}
          >
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="animate-spin" style={{ display: 'inline-block', width: 18, height: 18, border: '2.5px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  Creating account…
                </span>
              : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.875rem', marginTop: '1.5rem' }}>
          Already have an account?{' '}
          <Link to="/login" id="link-login" style={{ color: '#a5b4fc', fontWeight: 600, textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
