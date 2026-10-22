import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SIGNS, HOUSES } from '../data/astrologyData';

export default function ZodiacWheel() {
  const svgRef = useRef(null);
  const audioCtxRef = useRef(null);
  const [activeHouse, setActiveHouse] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [personName, setPersonName] = useState('Momo');
  const [reflections, setReflections] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('cam_wheel_reflections')) || {};
    } catch {
      return {};
    }
  });

  // Synthesize soft astral chime on house select
  const playChime = (freq = 440) => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContext();
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.03, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.65);
    } catch {
      // Audio not permitted or supported
    }
  };

  const handleHouseChange = (idx) => {
    const nextIdx = (idx + 12) % 12;
    setActiveHouse(nextIdx);
    const targetRot = nextIdx * 30;
    setRotation(targetRot);
    playChime(350 + nextIdx * 25);
  };

  const handleNoteChange = (text) => {
    const updated = { ...reflections, [activeHouse]: text };
    setReflections(updated);
    try {
      localStorage.setItem('cam_wheel_reflections', JSON.stringify(updated));
    } catch {}
  };

  // Build the wheel arcs via D3
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const CX = 320, CY = 320, CORE_R = 128;
    const g = svg.select('#wheelG');
    g.selectAll('*').remove();

    const signArc = d3.arc().innerRadius(206).outerRadius(300).padAngle(0.008).padRadius(250);
    const houseArc = d3.arc().innerRadius(CORE_R + 2).outerRadius(202).padAngle(0.01).padRadius(165);
    const rad = (deg) => (deg * Math.PI) / 180;

    // Outer Zodiac Segments
    const zodiac = g.selectAll('g.zseg')
      .data(d3.range(12))
      .join('g')
      .attr('class', 'zseg')
      .style('--el', (i) => `var(--${SIGNS[i].element})`);

    zodiac.append('path')
      .attr('d', (i) => signArc({ startAngle: rad(-(i * 30 + 30)), endAngle: rad(-(i * 30)) }))
      .attr('fill', (i) => `var(--${SIGNS[i].element})`)
      .attr('fill-opacity', 0.2)
      .style('cursor', 'pointer')
      .on('click', (_, i) => handleHouseChange(i));

    zodiac.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'var(--ink)')
      .attr('font-size', '28px')
      .attr('font-family', 'var(--glyph)')
      .attr('transform', (i) => {
        const a = rad(-(i * 30 + 15));
        return `translate(${268 * Math.sin(a)}, ${-268 * Math.cos(a)})`;
      })
      .text((i) => SIGNS[i].glyph);

    zodiac.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'var(--ink)')
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('font-family', 'var(--display)')
      .attr('transform', (i) => {
        const a = rad(-(i * 30 + 15));
        return `translate(${234 * Math.sin(a)}, ${-234 * Math.cos(a)})`;
      })
      .text((i) => SIGNS[i].name);

    // Inner House Segments
    const housesG = g.selectAll('g.hseg')
      .data(d3.range(12))
      .join('g')
      .attr('class', 'hseg');

    housesG.append('path')
      .attr('d', (i) => houseArc({ startAngle: rad(-(i * 30 + 30)), endAngle: rad(-(i * 30)) }))
      .attr('fill', (i) => (i === activeHouse ? 'var(--house-active)' : 'var(--house)'))
      .attr('stroke', 'var(--line)')
      .style('cursor', 'pointer')
      .on('click', (_, i) => handleHouseChange(i));

    housesG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', (i) => (i === activeHouse ? 'var(--accent)' : 'var(--ink)'))
      .attr('font-size', '22px')
      .attr('font-weight', '700')
      .attr('font-family', 'var(--display)')
      .attr('transform', (i) => {
        const a = rad(-(i * 30 + 15));
        return `translate(${175 * Math.sin(a)}, ${-175 * Math.cos(a)})`;
      })
      .text((i) => i + 1);

    housesG.append('text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'var(--muted)')
      .attr('font-size', '11px')
      .attr('font-family', 'var(--display)')
      .attr('transform', (i) => {
        const a = rad(-(i * 30 + 15));
        return `translate(${150 * Math.sin(a)}, ${-150 * Math.cos(a)})`;
      })
      .text((i) => HOUSES[i].short);
  }, [activeHouse]);

  const currentHouse = HOUSES[activeHouse];
  const currentSign = SIGNS[activeHouse];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '36px', alignItems: 'center' }}>
      {/* SVG Interactive Wheel */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
        <svg
          ref={svgRef}
          viewBox="0 0 640 640"
          style={{ width: '100%', maxWidth: '520px', height: 'auto', userSelect: 'none' }}
        >
          {/* Wheel rotating group */}
          <g
            id="wheelG"
            transform={`translate(320, 320) rotate(${rotation})`}
            style={{ transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
          />

          {/* Fixed Central Disc */}
          <g transform="translate(320, 320)">
            <circle r="128" fill="var(--panel)" stroke="var(--line)" strokeWidth="3" />
            <text
              y="-10"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="72px"
              fontFamily="var(--glyph)"
              fill="var(--ink)"
            >
              {currentSign.glyph}
            </text>
            <text className="core-sparkle" x="-64" y="-40">✦</text>
            <text
              y="52"
              textAnchor="middle"
              fontSize="14px"
              fontWeight="600"
              fontFamily="var(--display)"
              fill="var(--muted)"
            >
              {currentSign.name} Rising
            </text>
          </g>

          {/* Top Marker Pointer */}
          <path d="M320 24 L308 2 L332 2 Z" fill="var(--accent)" />
        </svg>

        <p style={{ fontSize: '14px', color: 'var(--muted)', textAlign: 'center', margin: 0 }}>
          Click any house or sign segment on the wheel to align and reflect.
        </p>
      </div>

      {/* House Inspector & Astrological Notes */}
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div className="chip" style={{ '--el': `var(--${currentSign.element})` }}>
            <span className="g">{currentSign.glyph}</span>
            <span>{currentSign.name} · {currentSign.element.toUpperCase()}</span>
          </div>
          <span style={{ fontSize: '14px', color: 'var(--muted)' }}>
            House {activeHouse + 1} of 12
          </span>
        </div>

        <div>
          <h2 style={{ display: 'flex', alignItems: 'baseline', gap: '12px', fontSize: '28px', margin: '4px 0' }}>
            <span style={{ color: 'var(--accent)', fontSize: '1.4em', fontWeight: '700' }}>{activeHouse + 1}</span>
            <span>{currentHouse.title}</span>
          </h2>
          <p style={{ color: 'var(--muted)', margin: '4px 0 12px' }}>{currentHouse.about}</p>
        </div>

        <blockquote style={{
          margin: '8px 0',
          padding: '8px 0 8px 16px',
          borderLeft: '3px solid var(--accent)',
          fontStyle: 'italic',
          color: 'var(--ink)'
        }}>
          "{currentHouse.ask}"
        </blockquote>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--display)', fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>
            Personal Reflection for House {activeHouse + 1}
          </label>
          <textarea
            rows="3"
            value={reflections[activeHouse] || ''}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder={`Reflect on ${currentHouse.short.toLowerCase()} and your ${currentSign.name} placements...`}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
          <button type="button" onClick={() => handleHouseChange(activeHouse - 1)}>
            ← Previous House
          </button>
          <button type="button" className="primary" onClick={() => handleHouseChange(activeHouse + 1)}>
            Next House →
          </button>
        </div>
      </div>
    </div>
  );
}
