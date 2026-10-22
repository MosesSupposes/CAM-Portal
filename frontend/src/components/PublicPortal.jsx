import React, { useState } from 'react';
import { SIGNS, INITIAL_EVENTS } from '../data/astrologyData';

export default function PublicPortal({ onOpenWheel }) {
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', sign: 'Virgo', interest: '' });

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setJoinSubmitted(true);
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
          {INITIAL_EVENTS.map(ev => (
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
        <h2 style={{ fontSize: '28px', textAlign: 'center' }}>Become a C.A.M. Member</h2>
        <p style={{ color: 'var(--muted)', textAlign: 'center', marginBottom: '20px' }}>
          Connect with fellow students, study charts, and attend observation nights.
        </p>

        {joinSubmitted ? (
          <div style={{
            background: 'var(--house)',
            border: '1px solid var(--accent)',
            borderRadius: '12px',
            padding: '24px',
            textAlign: 'center'
          }}>
            <h3 style={{ color: 'var(--accent)', margin: '0 0 8px' }}>Welcome to Cosmic Astrological Minds! ✦</h3>
            <p style={{ margin: 0, color: 'var(--ink)' }}>
              Thank you, {formData.name}. The officers will verify your student email and introduce you at the next meeting!
            </p>
          </div>
        ) : (
          <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label>Your Name</label>
              <input
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Full name"
              />
            </div>
            <div>
              <label>Student Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@college.edu"
              />
            </div>
            <div>
              <label>Your Sun Sign</label>
              <select
                value={formData.sign}
                onChange={e => setFormData({ ...formData, sign: e.target.value })}
              >
                {SIGNS.map(s => <option key={s.id} value={s.name}>{s.name} ({s.glyph})</option>)}
              </select>
            </div>
            <div>
              <label>What draws you to astrology?</label>
              <textarea
                rows="3"
                value={formData.interest}
                onChange={e => setFormData({ ...formData, interest: e.target.value })}
                placeholder="Share your interest in natal charts, planetary transits, or club events..."
              />
            </div>
            <button type="submit" className="primary" style={{ padding: '12px', fontSize: '16px', marginTop: '6px' }}>
              Submit Membership Request
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
