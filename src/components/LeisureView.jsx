import { useState, useEffect, useCallback } from 'react';
import { 
  Gamepad2, 
  Dices, 
  Flame, 
  Sparkles, 
  Shield, 
  Heart, 
  Zap, 
  Play, 
  ExternalLink, 
  RefreshCw,
  Skull,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function LeisureView() {
  const [subTab, setSubTab] = useState('dnd'); // 'dnd' | 'gaming'
  
  // Gaming State
  const [gamingStatus, setGamingStatus] = useState(null);
  const [useGamescopeFsr, setUseGamescopeFsr] = useState(false);
  const [launchMessage, setLaunchMessage] = useState(null);

  // Knol D&D State
  const [knol, setKnol] = useState(null);
  const [diceHistory, setDiceHistory] = useState([]);
  const [diceModifier, setDiceModifier] = useState(0);
  const [rolling, setRolling] = useState(false);

  const fetchGaming = useCallback(async () => {
    try {
      const status = await invoke('get_gaming_status');
      setGamingStatus(status);
    } catch (e) {
      console.error('Error obteniendo estado de gaming:', e);
    }
  }, []);

  const fetchKnol = useCallback(async () => {
    try {
      const sheet = await invoke('get_knol_sheet');
      setKnol(sheet);
    } catch (e) {
      console.error('Error cargando ficha de Knol:', e);
    }
  }, []);

  useEffect(() => {
    fetchGaming();
    fetchKnol();
  }, [fetchGaming, fetchKnol]);

  // Handlers Gaming
  const handleLaunchGame = async (gameId) => {
    try {
      const res = await invoke('launch_game', {
        gameId,
        useGamemode: true,
        useGamescopeFsr
      });
      setLaunchMessage(res);
      setTimeout(() => setLaunchMessage(null), 4000);
      fetchGaming();
    } catch (e) {
      setLaunchMessage(`Error: ${e}`);
      setTimeout(() => setLaunchMessage(null), 4000);
    }
  };

  // Handlers D&D Knol
  const updateHp = async (delta) => {
    if (!knol) return;
    const newHp = Math.max(0, Math.min(knol.maxHp, knol.currentHp + delta));
    const updated = { ...knol, currentHp: newHp };
    setKnol(updated);
    await invoke('update_knol_sheet', { sheet: updated });
  };

  const handleSecondWind = async () => {
    if (!knol || knol.secondWindUsed) return;
    // Segundo aliento: 1d10 + nivel (1)
    const rollRes = await invoke('roll_dice', { dice: 'd10', modifier: knol.level });
    const healAmt = rollRes.total;
    const newHp = Math.min(knol.maxHp, knol.currentHp + healAmt);
    const updated = { ...knol, currentHp: newHp, secondWindUsed: true };
    setKnol(updated);
    await invoke('update_knol_sheet', { sheet: updated });
    setDiceHistory(prev => [rollRes, ...prev.slice(0, 7)]);
  };

  const handleToggleRelentless = async () => {
    if (!knol) return;
    const updated = { ...knol, relentlessEnduranceUsed: !knol.relentlessEnduranceUsed };
    setKnol(updated);
    await invoke('update_knol_sheet', { sheet: updated });
  };

  const handleShortRest = async () => {
    if (!knol) return;
    const updated = { ...knol, secondWindUsed: false };
    setKnol(updated);
    await invoke('update_knol_sheet', { sheet: updated });
  };

  const handleLongRest = async () => {
    if (!knol) return;
    const updated = {
      ...knol,
      currentHp: knol.maxHp,
      secondWindUsed: false,
      relentlessEnduranceUsed: false,
      hitDiceRemaining: 1
    };
    setKnol(updated);
    await invoke('update_knol_sheet', { sheet: updated });
  };

  const handleRollDice = async (dice) => {
    setRolling(true);
    try {
      const res = await invoke('roll_dice', { dice, modifier: diceModifier });
      setDiceHistory(prev => [res, ...prev.slice(0, 9)]);
    } catch (e) {
      console.error(e);
    } finally {
      setRolling(false);
    }
  };

  const gamesCatalog = [
    { id: 'pokerogue', title: 'PokéRogue', type: 'Web Wayland', tag: 'Roguelike', desc: 'Combates por turnos en 200 oleadas procedimentales.' },
    { id: 'emerald_rogue', title: 'Pokémon Emerald Rogue', type: 'GBA / mGBA', tag: 'ROM Hack', desc: 'Esmeralda convertido en roguelite con mapa ramificado.' },
    { id: 'pokeisaac', title: 'PokéIsaac', type: 'Web Roguelike', tag: 'Action RPG', desc: 'Dungeon crawler de salas y jefes en tiempo real.' },
    { id: 'pokesurvivor', title: 'PokéSurvivor', type: 'Web Game', tag: 'Bullet Heaven', desc: 'Hordas masivas de Pokémon con auto-ataque y mejoras.' },
    { id: 'steam', title: 'Steam Client (N150)', type: 'Nativo Linux', tag: 'GameMode', desc: 'Lanzador Steam con inyección automática de renice y gamemoderun.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* 🧭 Barra Táctica de Ocio y Sub-Pestañas */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        {/* Sub-tabs Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setSubTab('dnd')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              background: subTab === 'dnd' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: subTab === 'dnd' ? '1px solid var(--primary)' : '1px solid transparent',
              color: subTab === 'dnd' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.76rem',
              fontWeight: subTab === 'dnd' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Dices size={14} color={subTab === 'dnd' ? '#10b981' : '#9ca3af'} />
            <span>Mesa D&D 5e (Knol)</span>
          </button>

          <button
            onClick={() => setSubTab('gaming')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              background: subTab === 'gaming' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              border: subTab === 'gaming' ? '1px solid var(--primary)' : '1px solid transparent',
              color: subTab === 'gaming' ? 'var(--text-high)' : 'var(--text-muted)',
              fontSize: '0.76rem',
              fontWeight: subTab === 'gaming' ? 700 : 500,
              cursor: 'pointer'
            }}
          >
            <Gamepad2 size={14} color={subTab === 'gaming' ? '#10b981' : '#9ca3af'} />
            <span>Modo Gaming N150</span>
          </button>
        </div>

        {/* GameMode Telemetry Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {launchMessage && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
              {launchMessage}
            </span>
          )}
          <div style={{
            background: gamingStatus?.gamemodeActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--border-color)'}`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            color: gamingStatus?.gamemodeActive ? '#a7f3d0' : 'var(--text-muted)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Flame size={12} color={gamingStatus?.gamemodeActive ? '#10b981' : '#9ca3af'} />
            <span>GameMode: {gamingStatus?.gamemodeActive ? 'ACTIVO' : 'STANDBY'}</span>
          </div>
        </div>
      </div>

      {/* ================= ⚔️ SUB-VISTA 1: MESA D&D 5E KNOL ================= */}
      {subTab === 'dnd' && knol && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Header Knol de Piedranegra */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderLeft: '4px solid #10b981',
            borderRadius: 'var(--radius-lg)',
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>{knol.name}</span>
                <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                  "{knol.title}"
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {knol.race} • {knol.className} Niv. {knol.level}
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                {knol.notes}
              </p>
            </div>

            {/* Descansos Corto / Largo */}
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleShortRest}
                className="btn btn-secondary"
                style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                title="Recupera Segundo Aliento"
              >
                <Clock size={12} />
                <span>Descanso Corto</span>
              </button>
              <button
                onClick={handleLongRest}
                className="btn btn-primary"
                style={{ padding: '4px 8px', fontSize: '0.7rem', height: '26px' }}
                title="Restaura toda la vida y habilidades"
              >
                <RotateCcw size={12} />
                <span>Descanso Largo</span>
              </button>
            </div>
          </div>

          {/* Grid de Combate y HP */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '10px' }}>
            {/* Panel de Vida y Habilidades */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Heart size={16} color="#ef4444" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Puntos de Golpe (HP)</span>
                </div>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: knol.currentHp <= 3 ? '#ef4444' : '#10b981', fontFamily: 'var(--font-mono)' }}>
                  {knol.currentHp} / {knol.maxHp}
                </span>
              </div>

              {/* Barra de Vida */}
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{
                  width: `${Math.min(100, (knol.currentHp / knol.maxHp) * 100)}%`,
                  height: '100%',
                  background: knol.currentHp <= 3 ? '#ef4444' : knol.currentHp <= 7 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Botones de Control de HP */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                <button onClick={() => updateHp(-5)} className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.72rem', color: '#ef4444' }}>-5 HP</button>
                <button onClick={() => updateHp(-1)} className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.72rem', color: '#ef4444' }}>-1 HP</button>
                <button onClick={() => updateHp(1)} className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.72rem', color: '#10b981' }}>+1 HP</button>
                <button onClick={() => updateHp(5)} className="btn btn-secondary" style={{ padding: '4px', fontSize: '0.72rem', color: '#10b981' }}>+5 HP</button>
              </div>

              {/* Rasgos de Guerrero & Semiorco */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Shield size={13} color="#38bdf8" />
                    <span style={{ fontSize: '0.74rem', color: '#fff' }}>Segundo Aliento (1d10+1)</span>
                  </div>
                  <button
                    onClick={handleSecondWind}
                    disabled={knol.secondWindUsed}
                    className="btn btn-secondary"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      opacity: knol.secondWindUsed ? 0.4 : 1,
                      cursor: knol.secondWindUsed ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {knol.secondWindUsed ? 'Agotado' : 'Usar'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Zap size={13} color="#f59e0b" />
                    <span style={{ fontSize: '0.74rem', color: '#fff' }}>Resistencia Incansable</span>
                  </div>
                  <button
                    onClick={handleToggleRelentless}
                    className="btn btn-secondary"
                    style={{
                      padding: '2px 8px',
                      fontSize: '0.68rem',
                      color: knol.relentlessEnduranceUsed ? 'var(--text-muted)' : '#f59e0b'
                    }}
                  >
                    {knol.relentlessEnduranceUsed ? 'Usada' : 'Disponible'}
                  </button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>Inmunidad al Veneno</span>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Activa (Piedranegra)</span>
                </div>
              </div>
            </div>

            {/* Consola de Tirada de Dados */}
            <div style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Dices size={15} color="#10b981" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>Lanzador de Dados D&D 5e</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Modificador:</span>
                  <input
                    type="number"
                    value={diceModifier}
                    onChange={(e) => setDiceModifier(parseInt(e.target.value, 10) || 0)}
                    style={{ width: '45px', padding: '2px 4px', fontSize: '0.75rem', textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Botones de Dados */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {['d20', 'd12', 'd10', 'd8', 'd6', 'd4', 'd100'].map((d) => (
                  <button
                    key={d}
                    onClick={() => handleRollDice(d)}
                    disabled={rolling}
                    className="btn btn-secondary"
                    style={{
                      flex: 1,
                      minWidth: '45px',
                      padding: '6px 4px',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)'
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>

              {/* Historial de Tiradas */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '160px' }}>
                {diceHistory.length > 0 ? (
                  diceHistory.map((h, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        background: h.isCriticalSuccess ? 'rgba(16, 185, 129, 0.15)' : h.isCriticalFail ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${h.isCriticalSuccess ? 'rgba(16, 185, 129, 0.3)' : h.isCriticalFail ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-color)'}`,
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{h.dice}:</span>
                        <span style={{ fontSize: '0.75rem' }}>[{h.rolls.join(', ')}] {h.modifier >= 0 ? `+${h.modifier}` : h.modifier}</span>
                        {h.isCriticalSuccess && <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800 }}>¡CRÍTICO! 🌟</span>}
                        {h.isCriticalFail && <span style={{ fontSize: '0.65rem', color: '#ef4444', fontWeight: 800 }}>PIFIA 💀</span>}
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: h.isCriticalSuccess ? '#10b981' : h.isCriticalFail ? '#ef4444' : '#fff', fontFamily: 'var(--font-mono)' }}>
                        = {h.total}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    Presiona un dado para realizar tiradas con bonificadores en vivo.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Atributos y Estadísticas Clave de Combate */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px'
          }}>
            <h4 style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 8px 0' }}>
              Estadísticas y Puntuaciones de Característica
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '6px' }}>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>🛡️ CLASE ARMADURA</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>{knol.armorClass}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>⚡ INICIATIVA</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>+{knol.initiative}</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>🏃 VELOCIDAD</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>{knol.speedFeet} ft</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>FUE</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.strength} (+2)</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>CON</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.constitution} (+2)</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>DES</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.dexterity} (+1)</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>INT</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.intelligence} (+0)</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>SAB</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.wisdom} (+0)</span>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block' }}>CAR</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{knol.charisma} (-1)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= 🎮 SUB-VISTA 2: MODO GAMING N150 ================= */}
      {subTab === 'gaming' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Panel de Ajustes GameMode & Gamescope FSR */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Flame size={16} color="#10b981" />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                  Aceleración Gráfica Intel UHD (24 EUs)
                </span>
              </div>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                GameMode (`renice -10`, prioridad I/O) y Gamescope (escalado FSR 720p → 1080p).
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.74rem', color: '#fff' }}>
                <input
                  type="checkbox"
                  checked={useGamescopeFsr}
                  onChange={(e) => setUseGamescopeFsr(e.target.checked)}
                />
                <span>Forzar Gamescope FSR (720p 60fps)</span>
              </label>
            </div>
          </div>

          {/* Catálogo de Lanzadores Ligeros */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
            {gamesCatalog.map((game) => (
              <div
                key={game.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>{game.title}</span>
                    <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                      {game.tag}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.73rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.2rem' }}>
                    {game.desc}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{game.type}</span>
                  <button
                    onClick={() => handleLaunchGame(game.id)}
                    className="btn btn-primary"
                    style={{ padding: '4px 10px', fontSize: '0.72rem', height: '26px' }}
                  >
                    <Play size={11} />
                    <span>Lanzar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
