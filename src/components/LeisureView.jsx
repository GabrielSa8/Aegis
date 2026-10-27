import { useState } from 'react';
import { Gamepad2, Dices, Flame, Sparkles, Shield, Swords, Play } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '1.25rem', overflowY: 'auto' }}>
      {/* Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'rgba(17, 24, 39, 0.7)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Gamepad2 color="#ec4899" size={20} />
            Zona de Ocio, Gaming N150 & D&D 5e
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '3px 0 0 0' }}>
            Perfiles de rendimiento para Intel N150 y mesa de rol
          </p>
        </div>
        <button
          onClick={() => setGamemodeActive(!gamemodeActive)}
          style={{
            background: gamemodeActive ? 'rgba(236, 72, 153, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            border: gamemodeActive ? '1px solid #ec4899' : '1px solid rgba(255, 255, 255, 0.1)',
            padding: '6px 14px',
            borderRadius: '8px',
            fontSize: '0.75rem',
            color: gamemodeActive ? '#f472b6' : '#94a3b8',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Flame size={14} />
          <span>GameMode FSR: {gamemodeActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* D&D 5e Dice Roller & Knol */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Dices size={16} color="#ec4899" />
            D&D 5e — Knol de Piedranegra
          </h3>
          {lastRoll && (
            <span style={{ fontSize: '0.85rem', color: '#f472b6', fontWeight: 800, background: 'rgba(236, 72, 153, 0.15)', padding: '2px 10px', borderRadius: '6px' }}>
              d{lastRoll.sides}: {lastRoll.res}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[20, 12, 10, 8, 6, 4].map((sides) => (
            <button
              key={sides}
              onClick={() => rollDice(sides)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '8px 16px',
                borderRadius: '8px',
                color: '#f1f5f9',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              d{sides}
            </button>
          ))}
        </div>
      </div>

      {/* Lightweight Games Roster */}
      <div style={{
        background: 'rgba(17, 24, 39, 0.75)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.25rem'
      }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Gamepad2 size={16} color="#ec4899" />
          Juegos Ligeros Optimizados (N150)
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
          {games.map((g, idx) => (
            <div
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '12px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{g.title}</span>
                  <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(236, 72, 153, 0.15)', color: '#f472b6' }}>
                    {g.type}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>{g.desc}</p>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 600 }}>{g.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
