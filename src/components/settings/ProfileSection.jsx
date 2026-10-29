import { Check, Keyboard } from 'lucide-react';
import { EMOJI_AVATARS, MASTER_SHORTCUTS, RESPONSE_STYLES } from './settingsHelpers';

export default function ProfileSection({ config, updateProfile }) {
  if (!config) return null;
  const profile = config.profile || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Identidad del Operador & Estilo de Trabajo
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Configura tu perfil soberano y las directrices para la interacción del agente.
        </p>
      </div>

      {/* Selector de Avatar Emoji */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Avatar / Emblema
        </label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {EMOJI_AVATARS.map(emoji => {
            const isSelected = profile.avatarEmoji === emoji;
            return (
              <button
                key={emoji}
                onClick={() => updateProfile({ avatarEmoji: emoji })}
                style={{
                  fontSize: '1.25rem',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                {emoji}
              </button>
            );
          })}
        </div>
      </div>

      {/* Nombre y Rol */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div className="form-group">
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Nombre o Alias</label>
          <input
            type="text"
            value={profile.name || ''}
            onChange={(e) => updateProfile({ name: e.target.value })}
            placeholder="Operador Soberano"
            style={{ fontSize: '0.78rem' }}
          />
        </div>
        <div className="form-group">
          <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>Especialidad / Rol Profesional</label>
          <input
            type="text"
            value={profile.role || ''}
            onChange={(e) => updateProfile({ role: e.target.value })}
            placeholder="Ingeniero de Software"
            style={{ fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* Modo de Comunicación del Agente */}
      <div className="form-group">
        <label style={{ fontSize: '0.74rem', fontWeight: 700 }}>
          Estilo de Respuesta Preferido del Agente IA
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {RESPONSE_STYLES.map(style => {
            const isSelected = (profile.responseStyle || 'caveman') === style.id;
            return (
              <div
                key={style.id}
                onClick={() => updateProfile({ responseStyle: style.id })}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  background: isSelected ? 'var(--primary-glow)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isSelected ? 'var(--primary)' : '#fff' }}>
                    {style.title}
                  </span>
                  {isSelected && <Check size={12} color="var(--primary)" />}
                </div>
                <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.15' }}>
                  {style.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cheat Sheet de Atajos de Teclado */}
      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Keyboard size={14} color="var(--primary)" />
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
            Atajos Maestros de Teclado (Cheat Sheet)
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '6px' }}>
          {MASTER_SHORTCUTS.map(sc => (
            <div
              key={sc.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.7rem'
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>{sc.desc}</span>
              <kbd style={{
                background: 'rgba(255,255,255,0.08)',
                padding: '1px 6px',
                borderRadius: '3px',
                color: 'var(--primary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                fontWeight: 700
              }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
