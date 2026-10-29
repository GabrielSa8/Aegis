export default function GamingSection({ config, setConfig }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '720px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Modo Gaming & Aceleración de Hardware
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Preconfigura las capas de aceleración agnóstica para tus lanzadores.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label className={`tactical-option-row ${config.enableGamemode ? 'active' : ''}`}>
          <div style={{ paddingRight: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: config.enableGamemode ? '#fff' : 'var(--text-high)', display: 'block' }}>
              Activar Feral GameMode (`gamemoderun`) por defecto
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Optimiza el planificador del kernel (SCHED_ISO), gobernador de CPU e I/O de disco al ejecutar cualquier juego.
            </span>
          </div>
          <div className="tactical-switch">
            <input
              type="checkbox"
              checked={Boolean(config.enableGamemode)}
              onChange={(e) => setConfig(prev => ({ ...prev, enableGamemode: e.target.checked }))}
            />
          </div>
        </label>

        <label className={`tactical-option-row ${config.enableGamescopeFsr ? 'active' : ''}`}>
          <div style={{ paddingRight: '1rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: config.enableGamescopeFsr ? '#fff' : 'var(--text-high)', display: 'block' }}>
              Forzar escalado Gamescope FSR (720p 60fps → 1080p)
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              Renderiza a resolución interna reducida aplicando AMD FidelityFX Super Resolution de forma transparente.
            </span>
          </div>
          <div className="tactical-switch">
            <input
              type="checkbox"
              checked={Boolean(config.enableGamescopeFsr)}
              onChange={(e) => setConfig(prev => ({ ...prev, enableGamescopeFsr: e.target.checked }))}
            />
          </div>
        </label>
      </div>
    </div>
  );
}
