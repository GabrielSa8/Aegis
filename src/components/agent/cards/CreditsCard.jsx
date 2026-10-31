import React, { memo } from 'react';
import { Coins, ExternalLink, ShieldCheck } from 'lucide-react';

function CreditsCard({ credits = '0 G1' }) {
  return (
    <div
      style={{
        margin: '8px 0',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'rgba(19, 23, 29, 0.75)',
        border: '1px solid var(--border-color)',
        borderLeft: '4px solid #f59e0b',
        backdropFilter: 'blur(14px)',
        padding: '12px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.28)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '4px',
              borderRadius: '5px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Coins size={14} color="#f59e0b" />
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
              Créditos y Facturación del Proveedor
            </span>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Cuenta Google Antigravity
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
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#f59e0b'
          }}
        >
          [ G1 TIER ]
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Créditos G1 Restantes</span>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-high)' }}>
            {credits}
          </span>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            padding: '10px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Cobertura de Modelos</span>
          <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary)' }}>
            Suscripción Activa (5h / Semanal)
          </span>
        </div>
      </div>

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
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ShieldCheck size={11} color="var(--primary)" />
          <span>Tus modelos no descuentan saldo G1 mientras operes dentro de tus cuotas periódicas.</span>
        </span>
        <a
          href="https://antigravity.google/g1-upgrade"
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: '#f59e0b',
            textDecoration: 'none',
            fontWeight: 600
          }}
        >
          <span>Recarga / Upgrade</span>
          <ExternalLink size={10} />
        </a>
      </div>
    </div>
  );
}

export default memo(CreditsCard);
