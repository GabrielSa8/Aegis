import { Zap } from 'lucide-react';

export default function DeckHeaderToggle({ isEditing, type, onTypeChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Zap size={15} style={{ color: 'var(--accent, var(--primary))' }} />
        <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-high)' }}>
          {isEditing ? 'EDITAR REGISTRO' : 'REGISTRO RÁPIDO'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        <button
          type="button"
          onClick={() => onTypeChange('expense')}
          className="cockpit-type-toggle"
          style={{
            padding: '0.2rem 0.55rem',
            fontSize: '0.72rem',
            fontWeight: type === 'expense' ? 700 : 500,
            borderRadius: 'var(--radius-sm, 6px)',
            cursor: 'pointer',
            border: type === 'expense' 
              ? '1px solid var(--accent-danger, var(--danger))' 
              : '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: type === 'expense' 
              ? 'color-mix(in srgb, var(--accent-danger, var(--danger)) 18%, transparent)' 
              : 'transparent',
            color: type === 'expense' ? 'var(--accent-danger, var(--danger))' : 'var(--text-muted)'
          }}
        >
          Gasto (-)
        </button>
        <button
          type="button"
          onClick={() => onTypeChange('income')}
          className="cockpit-type-toggle"
          style={{
            padding: '0.2rem 0.55rem',
            fontSize: '0.72rem',
            fontWeight: type === 'income' ? 700 : 500,
            borderRadius: 'var(--radius-sm, 6px)',
            cursor: 'pointer',
            border: type === 'income' 
              ? '1px solid var(--accent, var(--primary))' 
              : '1px solid var(--border-color, rgba(255,255,255,0.08))',
            background: type === 'income' 
              ? 'color-mix(in srgb, var(--accent, var(--primary)) 18%, transparent)' 
              : 'transparent',
            color: type === 'income' ? 'var(--accent, var(--primary))' : 'var(--text-muted)'
          }}
        >
          Ingreso (+)
        </button>
      </div>
    </div>
  );
}
