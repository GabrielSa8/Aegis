import { Timer } from 'lucide-react';

const AUTO_LOCK_OPTIONS = [
  { value: 0, label: 'Desactivado' },
  { value: 5, label: '5 minutos' },
  { value: 15, label: '15 minutos (Recomendado)' },
  { value: 30, label: '30 minutos' },
  { value: 60, label: '1 hora' }
];

export default function AutoLockCard({ autoLockMinutes, onChange, disabled }) {
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md, 12px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: disabled ? 0.6 : 1,
        pointerEvents: disabled ? 'none' : 'auto'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Timer size={18} style={{ color: 'var(--primary)' }} />
        <h4 style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-high)' }}>
          Bloqueo Automático por Inactividad
        </h4>
      </div>

      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        Cierra el Vault y cifra los datos en memoria si no se detecta actividad del usuario en el host.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginTop: '4px' }}>
        {AUTO_LOCK_OPTIONS.map((opt) => {
          const isSelected = autoLockMinutes === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`settings-autolock-btn ${isSelected ? 'active' : ''}`}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: isSelected
                  ? 'color-mix(in srgb, var(--primary) 14%, transparent)'
                  : 'rgba(255, 255, 255, 0.03)',
                border: `1px solid ${
                  isSelected
                    ? 'var(--primary)'
                    : 'var(--border-color)'
                }`,
                color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.78rem',
                fontWeight: isSelected ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'center'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
