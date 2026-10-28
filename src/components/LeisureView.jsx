import { useState } from 'react';
import { Gamepad2, Dices, Flame, Sparkles } from 'lucide-react';

export default function LeisureView() {
  const [lastRoll, setLastRoll] = useState(null);
  const [gamemodeActive, setGamemodeActive] = useState(true);

  const rollDice = (sides) => {
    const res = Math.floor(Math.random() * sides) + 1;
    setLastRoll({ sides, res, timestamp: new Date().toLocaleTimeString() });
  };

  const games = [
    { title: 'PokéRogue', type: 'Web / Roguelike', status: 'Listo para jugar', desc: 'Combates por turnos en 200 oleadas procedimentales' },
    { title: 'PokéIsaac', type: 'Web / Roguelike', status: 'Listo para jugar', desc: 'Dungeon crawler de salas y jefes en tiempo real' },
    { title: 'PokéSurvivor', type: 'Web / Bullet Heaven', status: 'Listo para jugar', desc: 'Hordas masivas de Pokémon con auto-ataque' },
    { title: 'Pokémon Emerald Rogue', type: 'GBA / Emulador', status: 'ROM Hack', desc: 'Esmeralda convertido en roguelite con mapa FTL' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* Barra de Ocio y GameMode Compacta */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 color="#10b981" size={15} />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Zona de Ocio, Gaming N150 & Mesa D&D 5e
          </span>
        </div>
        <button
          onClick={() => setGamemodeActive(!gamemodeActive)}
          style={{
            background: gamemodeActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
            border: gamemodeActive ? '1px solid var(--primary)' : '1px solid var(--border-color)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            color: gamemodeActive ? '#a7f3d0' : 'var(--text-muted)',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontFamily: 'inherit'
          }}
        >
          <Flame size={13} />
          <span>GameMode FSR: {gamemodeActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* D&D 5e Dice Roller & Knol */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
            <Dices size={14} color="#10b981" />
            D&D 5e — Knol de Piedranegra
          </h3>
          {lastRoll && (
            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 800, background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: 'var(--radius-md)' }}>
              d{lastRoll.sides}: {lastRoll.res}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[20, 12, 10, 8, 6, 4].map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice(sides)}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-color)',
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-high)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)'
              }}
            >
              d{sides}
            </button>
          ))}
        </div>
      </div>

      {/* Lightweight Games */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem'
      }}>
        <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Gamepad2 size={14} color="#10b981" />
          Juegos Ligeros (N150)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '8px' }}>
          {games.map((g, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '6px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>{g.title}</span>
                  <span style={{ fontSize: '0.62rem', padding: '1px 5px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.08)', color: '#a7f3d0' }}>
                    {g.type}
                  </span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>{g.desc}</p>
              </div>
              <span style={{ fontSize: '0.68rem', color: '#10b981', fontWeight: 600 }}>{g.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
