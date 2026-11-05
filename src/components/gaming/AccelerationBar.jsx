import React from 'react';
import { Zap } from 'lucide-react';

export default function AccelerationBar({
  useGamescopeFsr,
  onToggleGamescope,
  gamescopeRes,
  onChangeRes,
  useMangohud,
  onToggleMangohud,
  mangohudInstalled
}) {
  return (
    <div className="gaming-acceleration-bar" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '5px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap',
      fontSize: '0.72rem'
    }}>
      <div className="gaming-accel-left" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
        <Zap size={13} color="var(--primary)" />
        <span>Aceleración:</span>
        <span style={{ color: 'var(--text-high)', fontWeight: 600 }}>gamemoderun automático</span>
      </div>

      <div className="gaming-accel-right" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <div className="gaming-accel-group" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label className="gaming-accel-toggle-btn" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            background: useGamescopeFsr ? 'var(--primary-glow)' : 'color-mix(in srgb, var(--bg-card) 95%, black)',
            border: useGamescopeFsr ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: useGamescopeFsr ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            boxShadow: useGamescopeFsr ? '0 0 10px var(--primary-glow)' : 'none'
          }}>
            <input
              type="checkbox"
              checked={useGamescopeFsr}
              onChange={(e) => onToggleGamescope(e.target.checked)}
              style={{ width: '1rem', height: '1rem' }}
            />
            <span>Gamescope FSR</span>
          </label>

          {useGamescopeFsr && (
            <select
              value={gamescopeRes}
              onChange={(e) => onChangeRes(e.target.value)}
              className="gaming-res-select"
              style={{
                background: 'rgba(0,0,0,0.6)',
                color: 'var(--text-high)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.66rem',
                padding: '2px 6px'
              }}
            >
              <option value="540p">540p → 1080p FSR (Rendimiento)</option>
              <option value="720p">720p → 1080p FSR (Equilibrado)</option>
              <option value="1080p">1080p Nativo</option>
            </select>
          )}
        </div>

        {mangohudInstalled && (
          <label className="gaming-accel-toggle-btn" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer',
            background: useMangohud ? 'var(--primary-glow)' : 'color-mix(in srgb, var(--bg-card) 95%, black)',
            border: useMangohud ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: useMangohud ? 'var(--primary)' : 'var(--text-muted)',
            transition: 'all 0.15s ease',
            boxShadow: useMangohud ? '0 0 10px var(--primary-glow)' : 'none'
          }}>
            <input
              type="checkbox"
              checked={useMangohud}
              onChange={(e) => onToggleMangohud(e.target.checked)}
              style={{ width: '1rem', height: '1rem' }}
            />
            <span>MangoHud FPS</span>
          </label>
        )}
      </div>
    </div>
  );
}
