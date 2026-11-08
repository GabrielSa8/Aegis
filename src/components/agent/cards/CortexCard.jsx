import { memo } from 'react';
import { Brain, AlertTriangle } from 'lucide-react';
import CortexProposalRow from './CortexProposalRow';

function CortexCard({ cardData }) {
  const habits = cardData?.topHabits || [];
  const proposals = cardData?.proposals || (cardData?.proposal ? [cardData.proposal] : []);
  const totalEvents = cardData?.totalEvents ?? habits.reduce((a, b) => a + (b.hitCount || 0), 0);
  const totalErrors = cardData?.totalErrors ?? 0;

  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid var(--primary)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '5px',
              borderRadius: '6px',
              background: 'color-mix(in srgb, var(--primary) 14%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
              display: 'flex'
            }}
          >
            <Brain size={14} color="var(--primary)" />
          </div>
          <div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 800,
                color: 'var(--text-high)',
                letterSpacing: '0.02em',
                textTransform: 'uppercase'
              }}
            >
              Hermes Cortex · Núcleo de Meta-Aprendizaje
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Logger silencioso en SQLite (0 tokens) · Compuerta de aprobación del usuario
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {totalErrors > 0 && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.64rem',
                fontFamily: 'var(--font-mono, monospace)',
                padding: '2px 7px',
                borderRadius: '4px',
                border: '1px solid color-mix(in srgb, var(--warning) 40%, transparent)',
                color: 'var(--warning)'
              }}
            >
              <AlertTriangle size={11} /> {totalErrors} fricciones
            </span>
          )}
          <span
            style={{
              fontSize: '0.64rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono, monospace)',
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
              border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
              color: 'var(--primary)'
            }}
          >
            {totalEvents} SEÑALES · 0 TOKENS
          </span>
        </div>
      </div>

      {/* Propuestas de Auto-Evolución */}
      {proposals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Propuestas de Auto-Mejora ({proposals.length})
          </span>
          {proposals.map((p) => (
            <CortexProposalRow key={p.id} prop={p} />
          ))}
        </div>
      )}

      {/* Top Hábitos Detectados */}
      {habits.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Patrones Técnicos Recurrentes
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {habits.map((h) => (
              <div
                key={h.topic}
                title={`Último contexto: ${h.lastContext || 'General'}${h.samplePrompt ? ` · "${h.samplePrompt}"` : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm, 5px)',
                  border: '1px solid var(--border-color)',
                  background: 'color-mix(in srgb, var(--bg-main) 55%, transparent)',
                  fontSize: '0.7rem',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
              >
                <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>{h.topic}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.62rem' }}>{h.category}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>×{h.hitCount}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {habits.length === 0 && proposals.length === 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          Aún no hay suficientes interacciones registradas. Hermes Cortex observa en segundo plano sin consumir tokens.
        </div>
      )}
    </div>
  );
}

export default memo(CortexCard);
