import React, { useState, useMemo, memo } from 'react';
import { Sparkles, Search, ExternalLink } from 'lucide-react';

function SkillsCard({ skills = [], rawContent }) {
  const [filter, setFilter] = useState('');

  const filteredSkills = useMemo(() => {
    if (!filter.trim()) return skills.slice(0, 12);
    const q = filter.toLowerCase().trim();
    return skills.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.desc && s.desc.toLowerCase().includes(q))
    );
  }, [skills, filter]);

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--accent, #a855f7)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.28)'
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '5px',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={14} color="#a855f7" />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: 'var(--text-high)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Skills Activas en el Agente
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Herramientas dinámicas vinculadas al contexto activo
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: '0.64rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            padding: '2px 8px',
            borderRadius: '4px',
            background: 'rgba(168, 85, 247, 0.12)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            color: '#a855f7'
          }}
        >
          {skills.length > 0 ? `${skills.length} SKILLS` : 'ACTIVO'}
        </span>
      </div>

      {/* Barra de búsqueda de skills */}
      {skills.length > 6 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '5px',
            padding: '4px 8px'
          }}
        >
          <Search size={12} color="var(--text-muted)" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filtrar skills por nombre o capacidad..."
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-high)',
              fontSize: '0.72rem',
              width: '100%'
            }}
          />
        </div>
      )}

      {/* Grid de Skills */}
      {skills.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '6px' }}>
          {filteredSkills.map((s, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '5px',
                padding: '6px 10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px'
              }}
            >
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono, monospace)',
                  color: 'var(--primary)'
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: '0.66rem',
                  color: 'var(--text-muted)',
                  lineHeight: '1.25',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}
              >
                {s.desc || 'Capacidad técnica registrada.'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <pre
          style={{
            margin: 0,
            padding: '8px',
            borderRadius: '5px',
            background: 'rgba(0, 0, 0, 0.3)',
            fontSize: '0.70rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted)',
            overflowX: 'auto'
          }}
        >
          {rawContent || 'No hay skills cargadas.'}
        </pre>
      )}

      {/* Pie de Página */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          paddingTop: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.64rem',
          color: 'var(--text-muted)'
        }}
      >
        <span>Gestiona y enlaza skills por contexto en la pestaña DevOps.</span>
        <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>/skills</span>
      </div>
    </div>
  );
}

export default memo(SkillsCard);
