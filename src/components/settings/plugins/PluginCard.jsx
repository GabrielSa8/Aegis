export default function PluginCard({ plugin, isEnabled, onToggle }) {
  const Icon = plugin.icon;

  return (
    <div
      style={{
        background: isEnabled ? 'var(--bg-card)' : 'color-mix(in srgb, var(--bg-card) 40%, transparent)',
        border: isEnabled ? '1px solid var(--border-color)' : '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
        borderRadius: 'var(--radius-md)',
        padding: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        opacity: isEnabled ? 1 : 0.65,
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            padding: '8px',
            borderRadius: 'var(--radius-sm)',
            background: isEnabled ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
            border: isEnabled ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Icon size={18} color={isEnabled ? 'var(--primary)' : 'var(--text-muted)'} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isEnabled ? 'var(--text-high)' : 'var(--text-muted)' }}>
              {plugin.name}
            </div>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                {plugin.category}
              </span>
              <span style={{ fontSize: '0.62rem', color: 'var(--border-color)' }}>•</span>
              <span style={{ fontSize: '0.62rem', color: isEnabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                {plugin.ramImpact}
              </span>
            </div>
          </div>
        </div>

        {/* Switch táctico */}
        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', margin: 0 }}>
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={() => onToggle(plugin.id)}
            style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
          />
          <div style={{
            width: '38px',
            height: '20px',
            borderRadius: '20px',
            background: isEnabled ? 'var(--primary)' : 'rgba(255,255,255,0.1)',
            border: '1px solid var(--border-color)',
            position: 'relative',
            transition: 'background 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isEnabled ? 'var(--bg-main)' : 'var(--text-muted)',
              position: 'absolute',
              top: '2px',
              left: isEnabled ? '20px' : '2px',
              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </label>
      </div>

      <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.35' }}>
        {plugin.description}
      </p>

      {plugin.features && plugin.features.length > 0 && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          paddingTop: '0.4rem',
          borderTop: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)'
        }}>
          {plugin.features.map((feat, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.6rem',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'rgba(255, 255, 255, 0.03)',
                color: 'var(--text-muted)',
                border: '1px solid var(--border-color)'
              }}
            >
              {feat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
