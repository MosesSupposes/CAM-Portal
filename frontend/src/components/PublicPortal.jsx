import React, { useState, useEffect, useRef } from 'react';
import { SIGNS, INITIAL_EVENTS } from '../data/astrologyData';
import { apiAuth, apiGet, setAuthToken } from '../api';

export default function PublicPortal({ onOpenWheel, user, setUser, accountMode, setAccountMode, focusNameSignal }) {
  const nameInputRef = useRef(null);
  const identifierInputRef = useRef(null);
  const previousAccountMode = useRef(accountMode);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [events, setEvents] = useState(INITIAL_EVENTS);
  useEffect(() => {
    apiGet('/events').then(setEvents).catch(() => {});
  }, []);
  const [formData, setFormData] = useState({ name: '', studentId: '', username: '', password: '', identifier: '', email: '', phoneNumber: '', gender: '', sign: '', interest: '' });

  useEffect(() => {
    if (!focusNameSignal) return;
    document.getElementById('join-club')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    nameInputRef.current?.focus({ preventScroll: true });
  }, [focusNameSignal]);

  useEffect(() => {
    if (accountMode === 'login') identifierInputRef.current?.focus();
    if (accountMode === 'register' && previousAccountMode.current === 'login') nameInputRef.current?.focus();
    previousAccountMode.current = accountMode;
  }, [accountMode]);

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    try {
      const registering = accountMode === 'register';
      const result = await apiAuth(registering ? '/auth/register' : '/auth/login', registering ? {
        name: formData.name,
        student_id: formData.studentId,
        username: formData.username,
        password: formData.password,
        email: formData.email,
        phone_number: formData.phoneNumber,
        gender: formData.gender,
        sign: formData.sign,
        interest: formData.interest,
      } : {
        identifier: formData.identifier,
        password: formData.password,
      });
      setAuthToken(result.token);
      setUser(result.user);
      setAuthNotice(registering ? `Account created. Welcome, ${result.user.name}.` : `Signed in as ${result.user.name}.`);
      setFormData({ name: '', studentId: '', username: '', password: '', identifier: '', email: '', phoneNumber: '', gender: '', sign: '', interest: '' });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Hero Section */}
      <section className="panel" style={{
        textAlign: 'center',
        padding: 'clamp(36px, 6vw, 64px) 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div className="chip" style={{ margin: '0 auto 16px' }}>
          <span className="g">✦</span>
          <span>Official College Astrology Society</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: '700',
          lineHeight: 1.1,
          maxWidth: '850px',
          margin: '0 auto 16px'
        }}>
          Cosmic Astrological Minds
        </h1>

        <p style={{
          fontSize: 'clamp(18px, 2.2vw, 22px)',
          color: 'var(--muted)',
          maxWidth: '680px',
          margin: '0 auto 28px'
        }}>
          Mapping the celestial sphere, unpacking archetypes, and fostering community through the timeless wisdom of the zodiac.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button type="button" className="primary" style={{ padding: '12px 24px', fontSize: '17px' }} onClick={onOpenWheel}>
            Explore Natal Wheel ✦
          </button>
          <a href="#join-club">
            <button type="button" style={{ padding: '12px 24px', fontSize: '17px' }}>
              Join the Society
            </button>
          </a>
        </div>
      </section>

      {/* The 12 Signs Grid */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h2 style={{ fontSize: '32px' }}>The Twelve Celestial Houses</h2>
          <p style={{ color: 'var(--muted)', margin: 0 }}>Explore archetypes across Fire, Earth, Air, and Water.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          {SIGNS.map(s => (
            <div
              key={s.id}
              className="panel"
              style={{
                padding: '20px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
              onClick={onOpenWheel}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '32px', fontFamily: 'var(--glyph)', color: `var(--${s.element})` }}>
                  {s.glyph}
                </span>
                <span className="chip" style={{ '--el': `var(--${s.element})`, fontSize: '12px', padding: '2px 8px' }}>
                  {s.element}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '20px' }}>{s.name}</h3>
              <p style={{ fontSize: '13px', color: 'var(--accent)', margin: 0 }}>{s.dates}</p>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: 0 }}>"{s.style}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="panel">
        <h2 style={{ fontSize: '28px', marginBottom: '16px' }}>Upcoming Club Gatherings</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {events.map(ev => (
            <div key={ev.id} style={{
              background: 'var(--house)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '20px'
            }}>
              <span style={{ fontSize: '12px', color: 'var(--accent)', textTransform: 'uppercase', fontWeight: 'bold' }}>
                {ev.type}
              </span>
              <h3 style={{ fontSize: '19px', margin: '4px 0 8px' }}>{ev.title}</h3>
              <p style={{ fontSize: '14px', color: 'var(--muted)', margin: '0 0 4px' }}>📍 {ev.location}</p>
              <p style={{ fontSize: '13px', color: 'var(--ink)', margin: 0 }}>📅 {ev.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Join C.A.M. Membership Form */}
      <section id="join-club" className="panel" style={{ maxWidth: '640px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '28px', textAlign: 'center' }}>
          {accountMode === 'login' ? 'Welcome back, Stargazer.' : 'Become a C.A.M. Member'}
        </h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '20px' }}>
          {accountMode === 'login'
            ? 'Sign in to revisit your saved chart notes and reconnect with the C.A.M. community.'
            : 'Connect with fellow students, study charts, and attend observation nights.'}
        </p>

        {user ? (
          <div style={{
            background: 'var(--house)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'var(--accent)', margin: '0 0 8px' }}>{authNotice || `Welcome, ${user.name}!`}</h3>
            <p style={{ margin: 0, color: 'var(--ink)' }}>
              Your account is ready. Your saved Natal Wheel entries are linked to your account.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
            {accountMode === 'register' ? (
              <>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-name">Name</label>
                  <input ref={nameInputRef} id="account-name" required autoComplete="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Full name" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="student-id">Student ID</label>
                  <input id="student-id" required autoComplete="off" minLength="3" maxLength="32" pattern="[A-Za-z0-9-]{3,32}" value={formData.studentId} onChange={e => setFormData({ ...formData, studentId: e.target.value })} placeholder="Student ID number" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-username">Username</label>
                  <input id="account-username" required minLength="3" maxLength="30" pattern="[A-Za-z0-9_]{3,30}" autoComplete="username" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} placeholder="Choose a username" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-password">Password</label>
                  <input id="account-password" required minLength="12" maxLength="200" type="password" autoComplete="new-password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="At least 12 characters" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="student-email">Student Email Address</label>
                  <input id="student-email" type="email" required autoComplete="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="you@college.edu" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-phone">Phone Number <em>(optional)</em></label>
                  <input id="account-phone" type="tel" maxLength="50" autoComplete="tel" value={formData.phoneNumber} onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })} placeholder="Phone number" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-gender">Gender</label>
                  <select id="account-gender" required value={formData.gender} onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                    <option value="" disabled>Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Non-binary">Non-binary</option>
                  </select>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="sun-sign">Your Sun Sign</label>
                  <select id="sun-sign" required value={formData.sign} onChange={e => setFormData({ ...formData, sign: e.target.value })}>
                    <option value="" disabled>Select sun sign</option>
                    {SIGNS.map(s => <option key={s.id} value={s.name}>{s.name} ({s.glyph})</option>)}
                  </select>
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="interest">What draws you to astrology? <em>(optional)</em></label>
                  <textarea id="interest" rows="3" value={formData.interest} onChange={e => setFormData({ ...formData, interest: e.target.value })} placeholder="Share your interest in natal charts, planetary transits, or club events..." />
                </div>
              </>
            ) : (
              <>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="account-identifier">Username or Student ID</label>
                  <input ref={identifierInputRef} id="account-identifier" required autoComplete="username" value={formData.identifier} onChange={e => setFormData({ ...formData, identifier: e.target.value })} placeholder="Username or Student ID" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <label htmlFor="login-password">Password</label>
                  <input id="login-password" required type="password" autoComplete="current-password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Password" />
                </div>
              </>
            )}
            {authError && <p role="alert" style={{ color: 'var(--danger, #b42318)', margin: 0 }}>{authError}</p>}
            <button type="submit" className="primary" style={{ padding: '12px', fontSize: '16px', marginTop: '6px' }}>
              {accountMode === 'register' ? 'Create account' : 'Sign in'}
            </button>
            <button type="button" onClick={() => { setAuthError(''); setAccountMode(accountMode === 'register' ? 'login' : 'register'); if (accountMode === 'login') document.getElementById('join-club')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
              {accountMode === 'register' ? 'Already a member? Sign in.' : 'Create account'}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
