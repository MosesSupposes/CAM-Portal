import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PublicPortal from './components/PublicPortal';
import ZodiacWheel from './components/ZodiacWheel';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [currentView, setView] = useState('portal');
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentView={currentView} setView={setView} theme={theme} setTheme={setTheme} />

      <main style={{ flex: 1, maxWidth: '1200px', width: '100%', margin: '0 auto', padding: ' clamp(20px, 4vw, 48px) 20px' }}>
        {currentView === 'portal' && <PublicPortal onOpenWheel={() => setView('wheel')} />}
        {currentView === 'wheel' && (
          <div>
            <iframe
              src="https://cam-zodiac-wheel.netlify.app"
              title="Natal Wheel"
              style={{ width: '100%', height: '80vh', minHeight: '600px', border: '1px solid var(--line)', borderRadius: '12px' }}
            />
            <p style={{ textAlign: 'center', fontSize: '13px' }}>
              <a href="https://cam-zodiac-wheel.netlify.app" target="_blank" rel="noopener noreferrer">Open Natal Wheel in a new tab ↗</a>
            </p>
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
