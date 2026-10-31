import React from 'react';
import { apiPost, setAuthToken } from '../api';

export default function Navbar({ currentView, setView, theme, setTheme, user, setUser, onOpenAccount }) {
  const logout = async () => {
    try { await apiPost('/auth/logout', {}); } catch {}
    setAuthToken(null);
    setUser(null);
  };

  return (
    <header style={{
      borderBottom: '1px solid var(--line)',
      background: 'var(--panel)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(10px)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '14px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Brand */}
        <div
          onClick={() => setView('portal')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <span style={{ fontSize: '26px', color: 'var(--accent)', fontFamily: 'var(--glyph)' }}>✦</span>
          <div>
            <div style={{
              fontFamily: 'var(--display)',
              fontWeight: '700',
              fontSize: '20px',
              letterSpacing: '-0.02em',
              lineHeight: 1.1
            }}>
              C.A.M.
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Cosmic Astrological Minds
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <button
            type="button"
            className={currentView === 'portal' ? 'primary' : ''}
            onClick={() => setView('portal')}
          >
            Club Portal
          </button>

          <button
            type="button"
            className={currentView === 'wheel' ? 'primary' : ''}
            onClick={() => setView('wheel')}
          >
            Natal Wheel
          </button>
          <button
            type="button"
            className={currentView === 'admin' ? 'primary' : ''}
            onClick={() => setView('admin')}
          >
            Admin Cockpit
          </button>

          <div>
            {user ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '13px' }}>
                @{user.username}
                <button type="button" onClick={logout}>Sign out</button>
              </span>
            ) : (
              <button type="button" onClick={onOpenAccount}>Account</button>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            style={{ marginLeft: '6px', fontSize: '16px' }}
            title="Toggle Light / Dark Cosmic Theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </nav>

      </div>
    </header>
  );
}
