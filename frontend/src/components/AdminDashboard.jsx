import React, { useState } from 'react';
import { SIGNS, INITIAL_MEMBERS, INITIAL_EVENTS } from '../data/astrologyData';

export default function AdminDashboard() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [filterElement, setFilterElement] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  // New member form state
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'NB',
    sign: 'Virgo',
    role: 'member'
  });

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    location: '',
    type: 'meeting',
    alignment: ''
  });

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!newMember.name) return;
    const added = {
      id: Date.now(),
      name: newMember.name,
      email: newMember.email || '—',
      phone: newMember.phone || '—',
      gender: newMember.gender,
      sign: newMember.sign,
      role: newMember.role,
      status: 'active'
    };
    setMembers([added, ...members]);
    setIsAddMemberOpen(false);
    setNewMember({ name: '', email: '', phone: '', gender: 'NB', sign: 'Virgo', role: 'member' });
  };

  const handleAddEvent = (e) => {
    e.preventDefault();
    if (!newEvent.title) return;
    const added = {
      id: Date.now(),
      ...newEvent
    };
    setEvents([...events, added]);
    setIsAddEventOpen(false);
    setNewEvent({ title: '', date: '', location: '', type: 'meeting', alignment: '' });
  };

  const exportCSV = () => {
    const headers = "Name,Email,Number,Gender,Sign,Role\n";
    const rows = members.map(m => `"${m.name}","${m.email}","${m.phone}","${m.gender}","${m.sign}","${m.role}"`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cam_members_roster_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const filteredMembers = members.filter(m => {
    const signMeta = SIGNS.find(s => s.name.toLowerCase() === m.sign.toLowerCase());
    const matchesElement = filterElement === 'all' || (signMeta && signMeta.element === filterElement);
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.sign.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesElement && matchesSearch;
  });

  // Calculate elemental breakdown
  const elementCounts = { fire: 0, earth: 0, air: 0, water: 0 };
  members.forEach(m => {
    const s = SIGNS.find(x => x.name.toLowerCase() === m.sign.toLowerCase());
    if (s && elementCounts[s.element] !== undefined) {
      elementCounts[s.element]++;
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Top Banner & Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <div className="panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Members
          </span>
          <div style={{ fontSize: '36px', fontWeight: '700', fontFamily: 'var(--display)', color: 'var(--accent)', marginTop: '4px' }}>
            {members.length}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>4 imported from members.csv</span>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Officers & Leads
          </span>
          <div style={{ fontSize: '36px', fontWeight: '700', fontFamily: 'var(--display)', color: 'var(--ink)', marginTop: '4px' }}>
            {members.filter(m => m.role === 'officer').length}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Momo, Cam, Mimi</span>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Club Events
          </span>
          <div style={{ fontSize: '36px', fontWeight: '700', fontFamily: 'var(--display)', color: 'var(--ink)', marginTop: '4px' }}>
            {events.length}
          </div>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Upcoming Gatherings</span>
        </div>

        <div className="panel" style={{ padding: '20px' }}>
          <span style={{ fontSize: '13px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Elemental Synergy
          </span>
          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <span style={{ color: 'var(--fire)', fontWeight: 'bold' }}>🔥 {elementCounts.fire}</span>
            <span style={{ color: 'var(--earth)', fontWeight: 'bold' }}>🌿 {elementCounts.earth}</span>
            <span style={{ color: 'var(--air)', fontWeight: 'bold' }}>💨 {elementCounts.air}</span>
            <span style={{ color: 'var(--water)', fontWeight: 'bold' }}>🌊 {elementCounts.water}</span>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px', display: 'block' }}>Harmonious Balance</span>
        </div>
      </div>

      {/* Roster Controls */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '26px' }}>C.A.M. Club Member Roster</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '15px' }}>
              Admin management, zodiac placements, and contact coordination.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={exportCSV}>
              ⬇ Export CSV
            </button>
            <button type="button" className="primary" onClick={() => setIsAddMemberOpen(true)}>
              + Add Member
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input
            type="text"
            style={{ maxWidth: '280px' }}
            placeholder="Search member, email, or sign..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            style={{ maxWidth: '180px' }}
            value={filterElement}
            onChange={(e) => setFilterElement(e.target.value)}
          >
            <option value="all">All Elements</option>
            <option value="fire">Fire (Aries, Leo, Sag)</option>
            <option value="earth">Earth (Taurus, Virgo, Cap)</option>
            <option value="air">Air (Gemini, Libra, Aqu)</option>
            <option value="water">Water (Cancer, Scorp, Pisc)</option>
          </select>
        </div>

        {/* Member Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member Name</th>
                <th>Zodiac Sign</th>
                <th>Element</th>
                <th>Role</th>
                <th>Gender / Identity</th>
                <th>Contact Info</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map((m) => {
                const s = SIGNS.find(x => x.name.toLowerCase() === m.sign.toLowerCase()) || { glyph: '✦', element: 'earth' };
                return (
                  <tr key={m.id}>
                    <td style={{ fontWeight: '600' }}>{m.name}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--glyph)', fontSize: '18px', marginRight: '6px' }}>{s.glyph}</span>
                      {m.sign}
                    </td>
                    <td>
                      <span className="chip" style={{ '--el': `var(--${s.element})`, padding: '2px 10px', fontSize: '12px' }}>
                        {s.element}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                        fontWeight: 'bold',
                        background: m.role === 'officer' ? 'var(--house-active)' : 'transparent',
                        color: m.role === 'officer' ? 'var(--accent)' : 'inherit',
                        border: '1px solid var(--line)'
                      }}>
                        {m.role}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{m.gender || '—'}</td>
                    <td>
                      <div style={{ fontSize: '13px' }}>{m.email}</div>
                      <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{m.phone}</div>
                    </td>
                    <td>
                      <span style={{ color: 'var(--earth)', fontSize: '13px', fontWeight: '600' }}>● Active</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Events Scheduling Panel */}
      <div className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px' }}>Upcoming Astrological Events & Workshops</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: '14px' }}>
              Stargazing sessions, speaker meetings, and celestial transits.
            </p>
          </div>
          <button type="button" className="primary" onClick={() => setIsAddEventOpen(true)}>
            + Schedule Event
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {events.map((ev) => (
            <div key={ev.id} style={{
              background: 'var(--house)',
              border: '1px solid var(--line)',
              borderRadius: '12px',
              padding: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  color: 'var(--accent)',
                  letterSpacing: '0.05em'
                }}>
                  {ev.type}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{ev.date}</span>
              </div>
              <h3 style={{ margin: 0, fontSize: '18px' }}>{ev.title}</h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)' }}>📍 {ev.location}</p>
              {ev.alignment && (
                <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '4px' }}>
                  🪐 Alignment: {ev.alignment}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Member Modal */}
      {isAddMemberOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 11, 25, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <form onSubmit={handleAddMember} className="panel" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2>Add Club Member</h2>
            <div>
              <label>Full Name</label>
              <input
                required
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                placeholder="e.g. Alex Rivera"
              />
            </div>
            <div>
              <label>Email Address</label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="alex@college.edu"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Phone Number</label>
                <input
                  value={newMember.phone}
                  onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label>Pronouns / Gender</label>
                <input
                  value={newMember.gender}
                  onChange={(e) => setNewMember({ ...newMember, gender: e.target.value })}
                  placeholder="e.g. They/Them, F, M"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Sun Sign</label>
                <select
                  value={newMember.sign}
                  onChange={(e) => setNewMember({ ...newMember, sign: e.target.value })}
                >
                  {SIGNS.map(s => <option key={s.id} value={s.name}>{s.name} ({s.glyph})</option>)}
                </select>
              </div>
              <div>
                <label>Club Role</label>
                <select
                  value={newMember.role}
                  onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                >
                  <option value="member">Active Member</option>
                  <option value="officer">Club Officer</option>
                  <option value="superadmin">President / SuperAdmin</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsAddMemberOpen(false)}>Cancel</button>
              <button type="submit" className="primary">Save Member</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(7, 11, 25, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 100
        }}>
          <form onSubmit={handleAddEvent} className="panel" style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h2>Schedule Astrological Event</h2>
            <div>
              <label>Event Title</label>
              <input
                required
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                placeholder="e.g. Winter Solstice Observation"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label>Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                />
              </div>
              <div>
                <label>Event Type</label>
                <select
                  value={newEvent.type}
                  onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                >
                  <option value="stargazing">Stargazing Night</option>
                  <option value="workshop">Workshop / Lecture</option>
                  <option value="meeting">Club Meeting</option>
                  <option value="social">Social Mixer</option>
                </select>
              </div>
            </div>
            <div>
              <label>Location</label>
              <input
                required
                value={newEvent.location}
                onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                placeholder="Observatory / Room 302"
              />
            </div>
            <div>
              <label>Astrological Transit / Alignment</label>
              <input
                value={newEvent.alignment}
                onChange={(e) => setNewEvent({ ...newEvent, alignment: e.target.value })}
                placeholder="e.g. New Moon in Sagittarius"
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <button type="button" onClick={() => setIsAddEventOpen(false)}>Cancel</button>
              <button type="submit" className="primary">Create Event</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
