import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PublicPortal from './components/PublicPortal';
import ZodiacWheel from './components/ZodiacWheel';
import AdminDashboard from './components/AdminDashboard';
import { apiGet, setAuthToken } from './api';

export default function App() {
  const [currentView, setView] = useState('portal');
  const [theme, setTheme] = useState('dark');
  const [user, setUser] = useState(null);
  const [accountMode, setAccountMode] = useState('register');
  const [focusNameSignal, setFocusNameSignal] = useState(0);

  const openAccountForm = () => {
    setView('portal');
    setAccountMode('register');
    setFocusNameSignal(value => value + 1);
  };

  useEffect(() => {
    if (localStorage.getItem('cam_auth_token')) {
      apiGet('/auth/me').then(setUser).catch(() => {
        setAuthToken(null);
      });
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentView={currentView} setView={setView} theme={theme} setTheme={setTheme} user={user} setUser={setUser} onOpenAccount={openAccountForm} />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: ' clamp(20px, 4vw, 48px) 20px' }}>
        {currentView === 'portal' && <PublicPortal onOpenWheel={() => setView('wheel')} user={user} setUser={setUser} accountMode={accountMode} setAccountMode={setAccountMode} focusNameSignal={focusNameSignal} />}
        {currentView === 'wheel' && (
          <div>
            <ZodiacWheel key={user?.id || 'guest'} />
          </div>
        )}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      <footer style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--panel)',
        padding: '24px 20px',
        textAlign: 'center',
        color: 'var(--muted)',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>C.A.M. (Cosmic Astrological Minds)</strong> · College Astrology Club Platform
          </div>
          <div>
            Built with React, Laravel & MySQL · Palette: Cosmic Indigo, Blue, Purple & Gold
          </div>
        </div>
      </footer>
    </div>
  );
}
