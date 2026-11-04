export default function CoreModuleCard({ module }) {
  const Icon = module.icon;
  return (
    <div
      style={{
        background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
        border: '1px dashed var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start'
      }}
    >
      <div style={{
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--primary-glow)',
        border: '1px solid var(--primary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Icon size={18} color="var(--primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            {module.name}
          </span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: '4px',
            background: 'var(--primary-glow)',
            color: 'var(--primary)',
            border: '1px solid var(--primary)'
          }}>
            NÚCLEO
          </span>
        </div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
          {module.description}
        </p>
      </div>
    </div>
  );
}
