import { Gamepad2, Cpu, Zap, Sliders } from 'lucide-react';

export default function GamingSection({ config, setConfig }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
          Modo Gaming & Aceleración de Hardware
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Preconfigura las capas de aceleración agnóstica para tus lanzadores de juegos nativos y Wine/Proton.
        </p>
      </div>

      {/* Grid de 2 Columnas Tácticas */}
      <div className="settings-2col-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Card 1: Feral GameMode */}
        <div
          onClick={() => setConfig((prev) => ({ ...prev, enableGamemode: !prev.enableGamemode }))}
          className={`tactical-option-row ${config.enableGamemode ? 'active' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'stretch',
            padding: '14px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={16} color="var(--primary)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Feral GameMode (`gamemoderun`)
              </span>
            </div>
            <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={Boolean(config.enableGamemode)}
                onChange={(e) => setConfig((prev) => ({ ...prev, enableGamemode: e.target.checked }))}
              />
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.25' }}>
            Optimiza el planificador del kernel (SCHED_ISO), gobernador de CPU e I/O de disco al ejecutar cualquier juego desde la pestaña Gaming.
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--bg-main) 50%, transparent)',
            fontSize: '0.66rem',
            color: 'var(--text-muted)'
          }}>
            <Cpu size={12} color="var(--primary)" />
            <span>Prioridad de CPU y Scheduler reactivo automático.</span>
          </div>
        </div>

        {/* Card 2: Gamescope FSR */}
        <div
          onClick={() => setConfig((prev) => ({ ...prev, enableGamescopeFsr: !prev.enableGamescopeFsr }))}
          className={`tactical-option-row ${config.enableGamescopeFsr ? 'active' : ''}`}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            alignItems: 'stretch',
            padding: '14px 16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} color="var(--accent)" />
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-high)' }}>
                Forzar Escalado Gamescope FSR
              </span>
            </div>
            <div className="tactical-switch" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={Boolean(config.enableGamescopeFsr)}
                onChange={(e) => setConfig((prev) => ({ ...prev, enableGamescopeFsr: e.target.checked }))}
              />
            </div>
          </div>

          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.25' }}>
            Renderiza a resolución reducida aplicando AMD FidelityFX Super Resolution de forma transparente (720p 60fps → 1080p).
          </p>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 10px',
            borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--bg-main) 50%, transparent)',
            fontSize: '0.66rem',
            color: 'var(--text-muted)'
          }}>
            <Gamepad2 size={12} color="var(--accent)" />
            <span>Ideal para GPUs integradas con bajo consumo energético.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
