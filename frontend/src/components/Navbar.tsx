import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="page-container flex items-center justify-between py-0" style={{ paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
        {/* Logo */}
        <Link to="/" id="nav-logo" className="flex items-center gap-2 group" style={{ textDecoration: 'none' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
              transition: 'transform 0.2s',
            }}
            className="group-hover:scale-110"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Auto<span className="gradient-text">Vault</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link
                to="/"
                id="nav-vehicles"
                style={{
                  color: '#94a3b8',
                  textDecoration: 'none',
                  fontWeight: 500,
                  fontSize: '0.9rem',
                  padding: '0.4rem 0.75rem',
                  borderRadius: '0.5rem',
                  transition: 'color 0.2s',
                }}
                onMouseOver={e => (e.currentTarget.style.color = '#a5b4fc')}
                onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
              >
                Inventory
              </Link>

              {isAdmin && (
                <Link
                  to="/admin"
                  id="nav-admin"
                  style={{
                    color: '#94a3b8',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '0.5rem',
                    transition: 'color 0.2s',
                  }}
                  onMouseOver={e => (e.currentTarget.style.color = '#a5b4fc')}
                  onMouseOut={e => (e.currentTarget.style.color = '#94a3b8')}
                >
                  Admin
                </Link>
              )}

              {/* User chip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: '9999px',
                padding: '0.3rem 0.75rem',
              }}>
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                }}>
                  {user?.name?.[0]?.toUpperCase() ?? 'U'}
                </div>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500 }}>
                  {user?.name?.split(' ')[0]}
                </span>
                {isAdmin && <span className="badge badge-indigo" style={{ fontSize: '0.6rem' }}>Admin</span>}
              </div>

              <button id="nav-logout" className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }} onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" id="nav-login">
                <button className="btn-ghost" style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                  Login
                </button>
              </Link>
              <Link to="/register" id="nav-register">
                <button className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.4rem 0.875rem' }}>
                  Sign Up
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
