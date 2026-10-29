import { ShieldCheck } from 'lucide-react';
import { SECTIONS } from './settingsHelpers';

export default function SettingsSidebar({ activeSection, onSelectSection }) {
  return (
    <div style={{
      width: '13.5rem',
      borderRight: '1px solid var(--border-color)',
      background: 'rgba(0,0,0,0.15)',
      padding: '0.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      flexShrink: 0
    }}>
      {SECTIONS.map(sec => {
        const Icon = sec.icon;
        const isActive = activeSection === sec.id;
        return (
          <button
            key={sec.id}
            onClick={() => onSelectSection(sec.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '7px 10px',
              borderRadius: 'var(--radius-sm)',
              background: isActive ? 'var(--primary-glow)' : 'transparent',
              border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
              color: isActive ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: isActive ? 700 : 500,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.12s ease'
            }}
          >
            <Icon size={14} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>{sec.label}</span>
          </button>
        );
      })}

      <div style={{ marginTop: 'auto', padding: '8px 4px', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.64rem' }}>
          <ShieldCheck size={12} color="var(--primary)" />
          <span>Cero Hardcode · 100% Soberano</span>
        </div>
      </div>
    </div>
  );
}
