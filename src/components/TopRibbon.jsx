import { ShieldCheck, Cpu, GitBranch, Search, Terminal } from 'lucide-react';

export default function TopRibbon({ coreStatus, activeTab }) {
  const tabTitles = {
    agent: 'Sala de Operaciones del Agente',
    finances: 'Gestión Financiera & Presupuesto',
    vault: 'Bóveda de Conocimiento (BrainIA)',
    devops: 'Radar DevOps & Flota Git',
    tasks: 'Agenda & Bandeja Unificada',
    sentinel: 'Centinela de Host (Intel N150)',
    leisure: 'Zona de Ocio & Mesa de Rol'
  };

  return (
    <header style={{
      height: '42px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 1.25rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Left: Brand & Active View Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={16} color="#10b981" />
          </div>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-high)', letterSpacing: '0.04em' }}>
            AEGIS
          </span>
        </div>

        <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-high)' }}>
            {tabTitles[activeTab]}
          </span>
        </div>
      </div>

      {/* Right: Telemetry & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Core Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          padding: '3px 8px',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.68rem',
          color: '#34d399',
          fontWeight: 600
        }}>
          <Cpu size={12} />
          <span>{coreStatus || 'Core Online'}</span>
        </div>

        {/* N150 Spec */}
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Intel N150 · Fedora 43
        </span>

        {/* Command shortcut */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '2px 6px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)'
        }}>
          <Search size={11} />
          <kbd style={{ fontFamily: 'inherit', color: 'var(--text-high)' }}>Ctrl+K</kbd>
        </div>
      </div>
    </header>
  );
}
