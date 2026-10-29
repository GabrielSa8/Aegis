import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Gamepad2, 
  Flame, 
  Play, 
  RefreshCw,
  Plus,
  Trash2,
  Edit3,
  Dices,
  Heart,
  Shield,
  Coffee,
  Zap,
  Sparkles,
  Clock,
  ExternalLink,
  Eye,
  Check,
  Search,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function LeisureView() {
  const [activeSubView, setActiveSubView] = useState('catalog'); // 'catalog' | 'ttrpg' | 'wellness'
  const [gamingStatus, setGamingStatus] = useState(null);
  const [steamGames, setSteamGames] = useState([]);
  const [customGames, setCustomGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [useGamescopeFsr, setUseGamescopeFsr] = useState(() => {
    return localStorage.getItem('aegis_leisure_gamescope') === 'true';
  });
  const [gamescopeRes, setGamescopeRes] = useState(() => {
    return localStorage.getItem('aegis_leisure_res') || '720p';
  });
  const [useMangohud, setUseMangohud] = useState(() => {
    return localStorage.getItem('aegis_leisure_mangohud') === 'true';
  });
  const [launchMessage, setLaunchMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal para Juego Personalizado
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameFormData, setGameFormData] = useState({
    id: '',
    title: '',
    category: 'Web Roguelike',
    launchType: 'url',
    launchTarget: '',
    description: '',
    bannerUrl: ''
  });

  // Telemetría Gamepad
  const [gamepadInfo, setGamepadInfo] = useState({ connected: false });

  // Estado TTRPG & D&D 5e
  const [characters, setCharacters] = useState([]);
  const [selectedCharId, setSelectedCharId] = useState(null);
  const [showCharModal, setShowCharModal] = useState(false);
  const [showImportVaultModal, setShowImportVaultModal] = useState(false);
  const [vaultCandidateNotes, setVaultCandidateNotes] = useState([]);
  const [diceRollHistory, setDiceRollHistory] = useState([]);
  const [activeRoll, setActiveRoll] = useState(null);
  const [selectedDice, setSelectedDice] = useState('d20');
  const [diceCount, setDiceCount] = useState(1);
  const [diceModifier, setDiceModifier] = useState(0);
  const [rollAdvantage, setRollAdvantage] = useState('normal'); // 'normal' | 'adv' | 'dis'
  const [rollLabel, setRollLabel] = useState('');

  const [charFormData, setCharFormData] = useState({
    id: '',
    name: '',
    characterClass: 'Guerrero',
    level: 1,
    race: 'Humano',
    currentHp: 12,
    maxHp: 12,
    tempHp: 0,
    armorClass: 14,
    initiativeBonus: 1,
    speed: 30,
    proficiencyBonus: 2,
    strScore: 14,
    dexScore: 12,
    conScore: 14,
    intScore: 10,
    wisScore: 12,
    chaScore: 10,
    notes: '',
    vaultNotePath: ''
  });

  // Estado Modo Desconexión / Relax
  const [timerSeconds, setTimerSeconds] = useState(1200); // 20 min default
  const [timerTotal, setTimerTotal] = useState(1200);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // Carga de datos de Gaming y TTRPG
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [status, sGames, cGames, chars, rolls] = await Promise.all([
        invoke('get_gaming_status').catch(() => null),
        invoke('get_installed_steam_games').catch(() => []),
        invoke('sqlite_get_custom_games').catch(() => []),
        invoke('sqlite_get_ttrpg_characters').catch(() => []),
        invoke('sqlite_get_dice_roll_history', { limit: 20 }).catch(() => [])
      ]);

      setGamingStatus(status);
      setSteamGames(Array.isArray(sGames) ? sGames : []);
      setCustomGames(Array.isArray(cGames) ? cGames : []);
      setCharacters(Array.isArray(chars) ? chars : []);
      setDiceRollHistory(Array.isArray(rolls) ? rolls : []);

      if (Array.isArray(chars) && chars.length > 0 && !selectedCharId) {
        setSelectedCharId(chars[0].id);
      }
    } catch (e) {
      console.error('Error cargando ocio y gaming:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCharId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Persistencia de opciones de aceleración
  const handleToggleGamescope = (val) => {
    setUseGamescopeFsr(val);
    localStorage.setItem('aegis_leisure_gamescope', String(val));
  };

  const handleChangeRes = (val) => {
    setGamescopeRes(val);
    localStorage.setItem('aegis_leisure_res', val);
  };

  const handleToggleMangohud = (val) => {
    setUseMangohud(val);
    localStorage.setItem('aegis_leisure_mangohud', String(val));
  };

  // Sonido de notificación síntesis pura Web Audio
  const playChime = useCallback((frequency = 520, duration = 0.25) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Ignorar si audio está restringido
    }
  }, []);

  // Sonido especial para crítico (Natural 20)
  const playCritSound = useCallback(() => {
    playChime(660, 0.15);
    setTimeout(() => playChime(880, 0.35), 120);
  }, [playChime]);

  // Sonido especial para pifia (Natural 1)
  const playFumbleSound = useCallback(() => {
    playChime(220, 0.3);
    setTimeout(() => playChime(160, 0.4), 150);
  }, [playChime]);

  // Polling de gamepad (HTML5 Gamepad API)
  useEffect(() => {
    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      let found = null;
      for (let i = 0; i < gamepads.length; i++) {
        const gp = gamepads[i];
        if (gp && gp.connected) {
          found = gp;
          break;
        }
      }
      if (found) {
        setGamepadInfo({
          connected: true,
          id: found.id,
          buttonsCount: found.buttons.length,
          axesCount: found.axes.length,
          anyPressed: found.buttons.some(b => b.pressed)
        });
      } else {
        setGamepadInfo({ connected: false });
      }
    };

    const interval = setInterval(pollGamepad, 350);
    return () => clearInterval(interval);
  }, []);

  // Timer de desconexión
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            playChime(440, 0.6);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerRunning, playChime]);

  // Lanzar juego universal
  const handleLaunchGame = async (gameId, launchType = null, launchTarget = null) => {
    try {
      const res = await invoke('launch_game', {
        gameId,
        launchType,
        launchTarget,
        useGamemode: true,
        useGamescopeFsr,
        useMangohud,
        gamescopeRes
      });
      setLaunchMessage(res);
      playChime(580, 0.15);
      setTimeout(() => setLaunchMessage(null), 4000);
      fetchData();
    } catch (e) {
      setLaunchMessage(`Error: ${e}`);
      setTimeout(() => setLaunchMessage(null), 4000);
    }
  };

  // Guardar juego personalizado
  const handleSaveCustomGame = async (e) => {
    e.preventDefault();
    if (!gameFormData.title.trim() || !gameFormData.launchTarget.trim()) return;

    try {
      const gameToSave = {
        id: gameFormData.id || `cg_${Date.now()}`,
        title: gameFormData.title.trim(),
        category: gameFormData.category.trim() || 'General',
        launchType: gameFormData.launchType,
        launchTarget: gameFormData.launchTarget.trim(),
        description: gameFormData.description.trim() || null,
        bannerUrl: gameFormData.bannerUrl.trim() || null,
        playTimeMinutes: 0,
        lastPlayed: null,
        createdAt: new Date().toISOString()
      };

      await invoke('sqlite_save_custom_game', { game: gameToSave });
      setShowGameModal(false);
      setGameFormData({
        id: '',
        title: '',
        category: 'Web Roguelike',
        launchType: 'url',
        launchTarget: '',
        description: '',
        bannerUrl: ''
      });
      fetchData();
    } catch (err) {
      alert(`Error guardando juego: ${err}`);
    }
  };

  // Eliminar juego personalizado
  const handleDeleteCustomGame = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar este lanzador del catálogo?')) return;
    try {
      await invoke('sqlite_delete_custom_game', { id });
      fetchData();
    } catch (err) {
      alert(`Error eliminando juego: ${err}`);
    }
  };

  // Tirar Dados D&D 5e
  const rollDice = async (diceTypeOverride = null, modOverride = null, labelOverride = null) => {
    const dice = diceTypeOverride || selectedDice;
    const count = diceTypeOverride ? 1 : Math.max(1, parseInt(diceCount, 10) || 1);
    const sides = parseInt(dice.replace('d', ''), 10) || 20;
    const mod = modOverride !== null ? modOverride : (parseInt(diceModifier, 10) || 0);
    const label = labelOverride || rollLabel || `${count}${dice}`;

    let rolls = [];
    if (dice === 'd20' && rollAdvantage !== 'normal' && !diceTypeOverride) {
      // Ventaja / Desventaja en d20
      const r1 = Math.floor(Math.random() * 20) + 1;
      const r2 = Math.floor(Math.random() * 20) + 1;
      rolls = [r1, r2];
    } else {
      for (let i = 0; i < count; i++) {
        rolls.push(Math.floor(Math.random() * sides) + 1);
      }
    }

    let chosenRollSum = 0;
    if (dice === 'd20' && rollAdvantage === 'adv' && !diceTypeOverride) {
      chosenRollSum = Math.max(...rolls);
    } else if (dice === 'd20' && rollAdvantage === 'dis' && !diceTypeOverride) {
      chosenRollSum = Math.min(...rolls);
    } else {
      chosenRollSum = rolls.reduce((acc, r) => acc + r, 0);
    }

    const total = chosenRollSum + mod;
    const isCritSuccess = sides === 20 && (rolls.includes(20) && (rollAdvantage !== 'dis' || rolls.every(r => r === 20)));
    const isCritFail = sides === 20 && (rolls.includes(1) && (rollAdvantage !== 'adv' || rolls.every(r => r === 1)));

    if (isCritSuccess) playCritSound();
    else if (isCritFail) playFumbleSound();
    else playChime(480, 0.1);

    const rollObj = {
      dice,
      count,
      rolls,
      mod,
      total,
      isCritSuccess,
      isCritFail,
      label,
      advantageMode: rollAdvantage
    };

    setActiveRoll(rollObj);

    // Persistir en SQLite
    try {
      const activeChar = characters.find(c => c.id === selectedCharId);
      await invoke('sqlite_save_dice_roll', {
        roll: {
          id: `roll_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          characterName: activeChar ? activeChar.name : null,
          diceExpression: `${count}${dice}${mod >= 0 ? `+${mod}` : mod}`,
          rollsJson: JSON.stringify(rolls),
          modifier: mod,
          total,
          isCritSuccess,
          isCritFail,
          label: label || 'Tirada Libre',
          createdAt: new Date().toISOString()
        }
      });

      const updatedHistory = await invoke('sqlite_get_dice_roll_history', { limit: 20 });
      setDiceRollHistory(updatedHistory);
    } catch (e) {
      console.warn('Error guardando tirada:', e);
    }
  };

  // Modificador de atributo D&D (Score -> Mod)
  const calcMod = (score) => Math.floor(((score || 10) - 10) / 2);
  const fmtMod = (mod) => (mod >= 0 ? `+${mod}` : `${mod}`);

  // Ajustar HP de personaje actual
  const handleAdjustHp = async (delta) => {
    const cur = characters.find(c => c.id === selectedCharId);
    if (!cur) return;
    const updatedHp = Math.max(0, Math.min(cur.maxHp, cur.currentHp + delta));
    const updatedChar = { ...cur, currentHp: updatedHp };

    try {
      await invoke('sqlite_save_ttrpg_character', { character: updatedChar });
      setCharacters(prev => prev.map(c => c.id === cur.id ? updatedChar : c));
    } catch (err) {
      console.error('Error ajustando HP:', err);
    }
  };

  // Descanso corto (Gastar dado de golpe o recuperar vida)
  const handleShortRest = async () => {
    const cur = characters.find(c => c.id === selectedCharId);
    if (!cur) return;
    const conMod = calcMod(cur.conScore);
    const recovered = Math.max(1, Math.floor(Math.random() * 10) + 1 + conMod);
    const newHp = Math.min(cur.maxHp, cur.currentHp + recovered);
    const updatedChar = { ...cur, currentHp: newHp };

    try {
      await invoke('sqlite_save_ttrpg_character', { character: updatedChar });
      setCharacters(prev => prev.map(c => c.id === cur.id ? updatedChar : c));
      playChime(620, 0.2);
      setActiveRoll({
        dice: 'd10',
        count: 1,
        rolls: [recovered - conMod],
        mod: conMod,
        total: recovered,
        isCritSuccess: false,
        isCritFail: false,
        label: `Descanso Corto (+${recovered} HP)`,
        advantageMode: 'normal'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Descanso largo (Restauración completa)
  const handleLongRest = async () => {
    const cur = characters.find(c => c.id === selectedCharId);
    if (!cur) return;
    const updatedChar = { ...cur, currentHp: cur.maxHp, tempHp: 0 };

    try {
      await invoke('sqlite_save_ttrpg_character', { character: updatedChar });
      setCharacters(prev => prev.map(c => c.id === cur.id ? updatedChar : c));
      playCritSound();
      setLaunchMessage(`✨ ${cur.name} ha completado un Descanso Largo. Puntos de golpe restaurados.`);
      setTimeout(() => setLaunchMessage(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir selector de notas de bóveda para importar personaje
  const handleOpenImportVault = async () => {
    try {
      const notes = await invoke('get_vault_notes');
      // Filtrar notas con tags de rol o en carpetas de ocio/rol
      const filtered = notes.filter(n => {
        const p = (n.path || '').toLowerCase();
        const t = (n.title || '').toLowerCase();
        const tags = (n.tags || []).join(' ').toLowerCase();
        return p.includes('rol') || p.includes('dnd') || tags.includes('dnd5e') || tags.includes('personaje') || t.includes('ficha');
      });
      setVaultCandidateNotes(filtered.length > 0 ? filtered : notes.slice(0, 30));
      setShowImportVaultModal(true);
    } catch (err) {
      alert(`Error leyendo bóveda Obsidian: ${err}`);
    }
  };

  // Importar ficha desde archivo Markdown de Obsidian
  const handleImportNote = async (notePath) => {
    try {
      const content = await invoke('read_vault_note', { path: notePath });
      
      const getFront = (k) => {
        const m = content.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'));
        return m ? m[1].trim() : '';
      };
      const getStat = (name) => {
        const m = content.match(new RegExp(`\\*\\*${name}\\s*\\([A-Z]+\\)\\*\\*\\s*\\|\\s*\\*\\*(\\d+)\\*\\*`));
        return m ? parseInt(m[1], 10) : 10;
      };

      const hpMatch = content.match(/\|\s*\*\*(\d+)\s*HP\*\*/i);
      const acMatch = content.match(/\|\s*\*\*(\d+)\*\*\s*\*\(Sin armadura/i) || content.match(/CA[^\d]*(\d+)/i);
      const titleMatch = content.match(/^#\s*[^\w]*([^\n(]+)/m);

      const parsedName = titleMatch ? titleMatch[1].trim() : (getFront('aliases') || 'Héroe Importado');
      const hp = hpMatch ? parseInt(hpMatch[1], 10) : 12;

      const newChar = {
        id: `char_${Date.now()}`,
        name: parsedName,
        race: getFront('raza') || 'Semiorco',
        characterClass: getFront('clase') || 'Guerrero',
        level: parseInt(getFront('nivel'), 10) || 1,
        currentHp: hp,
        maxHp: hp,
        tempHp: 0,
        armorClass: acMatch ? parseInt(acMatch[1], 10) : 12,
        initiativeBonus: 1,
        speed: 30,
        proficiencyBonus: 2,
        strScore: getStat('Fuerza') || 14,
        conScore: getStat('Constitución') || 14,
        dexScore: getStat('Destreza') || 12,
        wisScore: getStat('Sabiduría') || 10,
        chaScore: getStat('Carisma') || 10,
        intScore: getStat('Inteligencia') || 10,
        notes: `Importado de Bóveda Obsidian: ${notePath}`,
        vaultNotePath: notePath,
        updatedAt: new Date().toISOString()
      };

      await invoke('sqlite_save_ttrpg_character', { character: newChar });
      setShowImportVaultModal(false);
      await fetchData();
      setSelectedCharId(newChar.id);
      playCritSound();
      setLaunchMessage(`✅ Ficha "${newChar.name}" importada exitosamente.`);
      setTimeout(() => setLaunchMessage(null), 4000);
    } catch (err) {
      alert(`Error al importar ficha: ${err}`);
    }
  };

  // Guardar ficha creada/editada manualmente
  const handleSaveCharForm = async (e) => {
    e.preventDefault();
    if (!charFormData.name.trim()) return;

    try {
      const charToSave = {
        id: charFormData.id || `char_${Date.now()}`,
        name: charFormData.name.trim(),
        characterClass: charFormData.characterClass.trim() || 'Aventurero',
        level: parseInt(charFormData.level, 10) || 1,
        race: charFormData.race.trim() || 'Humano',
        currentHp: parseInt(charFormData.currentHp, 10) || 10,
        maxHp: parseInt(charFormData.maxHp, 10) || 10,
        tempHp: parseInt(charFormData.tempHp, 10) || 0,
        armorClass: parseInt(charFormData.armorClass, 10) || 10,
        initiativeBonus: parseInt(charFormData.initiativeBonus, 10) || 0,
        speed: parseInt(charFormData.speed, 10) || 30,
        proficiencyBonus: parseInt(charFormData.proficiencyBonus, 10) || 2,
        strScore: parseInt(charFormData.strScore, 10) || 10,
        dexScore: parseInt(charFormData.dexScore, 10) || 10,
        conScore: parseInt(charFormData.conScore, 10) || 10,
        intScore: parseInt(charFormData.intScore, 10) || 10,
        wisScore: parseInt(charFormData.wisScore, 10) || 10,
        chaScore: parseInt(charFormData.chaScore, 10) || 10,
        notes: charFormData.notes.trim() || null,
        vaultNotePath: charFormData.vaultNotePath.trim() || null,
        updatedAt: new Date().toISOString()
      };

      await invoke('sqlite_save_ttrpg_character', { character: charToSave });
      setShowCharModal(false);
      await fetchData();
      setSelectedCharId(charToSave.id);
    } catch (err) {
      alert(`Error guardando personaje: ${err}`);
    }
  };

  // Eliminar personaje
  const handleDeleteCharacter = async (id, e) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar esta ficha de personaje?')) return;
    try {
      await invoke('sqlite_delete_ttrpg_character', { id });
      fetchData();
    } catch (err) {
      alert(`Error eliminando personaje: ${err}`);
    }
  };

  // Limpiar historial de dados
  const handleClearDiceHistory = async () => {
    try {
      await invoke('sqlite_clear_dice_roll_history');
      setDiceRollHistory([]);
    } catch (err) {
      console.error(err);
    }
  };

  // Filtrado de juegos
  const q = searchQuery.toLowerCase().trim();
  const filteredSteam = steamGames.filter(g => {
    if (categoryFilter !== 'all' && categoryFilter !== 'steam') return false;
    return !q || g.name.toLowerCase().includes(q) || g.appId.includes(q);
  });

  const filteredCustom = customGames.filter(g => {
    if (categoryFilter === 'steam') return false;
    if (categoryFilter === 'web' && g.launchType !== 'url') return false;
    if (categoryFilter === 'emu' && g.launchType !== 'flatpak' && g.launchType !== 'cmd') return false;
    return !q || g.title.toLowerCase().includes(q) || (g.category || '').toLowerCase().includes(q);
  });

  const activeChar = characters.find(c => c.id === selectedCharId) || characters[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.65rem', overflowY: 'auto', paddingRight: '2px' }}>
      
      {/* 🧭 Barra Superior de Ocio & Conmutador de Sub-vistas */}
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
        {/* Pestañas de Navegación Interna */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setActiveSubView('catalog')}
            className={`btn ${activeSubView === 'catalog' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.74rem', padding: '3px 10px', height: '26px' }}
          >
            <Gamepad2 size={13} />
            <span>Videojuegos ({steamGames.length + customGames.length})</span>
          </button>

          <button
            onClick={() => setActiveSubView('ttrpg')}
            className={`btn ${activeSubView === 'ttrpg' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.74rem', padding: '3px 10px', height: '26px' }}
          >
            <Dices size={13} />
            <span>Mesa de Rol & D&D 5e</span>
          </button>

          <button
            onClick={() => setActiveSubView('wellness')}
            className={`btn ${activeSubView === 'wellness' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: '0.74rem', padding: '3px 10px', height: '26px' }}
          >
            <Coffee size={13} />
            <span>Modo Desconexión</span>
          </button>
        </div>

        {/* Telemetría Dinámica de Hardware & Mando */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {launchMessage && (
            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              {launchMessage}
            </span>
          )}

          {/* GPU Driver Dinámico */}
          {gamingStatus?.gpuDriver && (
            <span style={{
              fontSize: '0.66rem',
              color: 'var(--text-muted)',
              background: 'rgba(255,255,255,0.04)',
              padding: '2px 7px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)'
            }}>
              GPU: {gamingStatus.gpuDriver}
            </span>
          )}

          {/* Estado de Gamepad HTML5 */}
          <div style={{
            background: gamepadInfo.connected ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${gamepadInfo.connected ? '#38bdf8' : 'var(--border-color)'}`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            color: gamepadInfo.connected ? '#38bdf8' : 'var(--text-muted)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }} title={gamepadInfo.connected ? `Mando: ${gamepadInfo.id}` : 'Conecta un mando USB o Bluetooth'}>
            <Gamepad2 size={12} color={gamepadInfo.connected ? '#38bdf8' : '#9ca3af'} />
            <span>{gamepadInfo.connected ? 'MANDO ACTIVO' : 'SIN MANDO'}</span>
          </div>

          {/* GameMode Status */}
          <div style={{
            background: gamingStatus?.gamemodeActive ? 'var(--primary-glow)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${gamingStatus?.gamemodeActive ? 'var(--primary)' : 'var(--border-color)'}`,
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.68rem',
            color: gamingStatus?.gamemodeActive ? '#a7f3d0' : 'var(--text-muted)',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}>
            <Flame size={12} color={gamingStatus?.gamemodeActive ? 'var(--primary)' : '#9ca3af'} />
            <span>GameMode: {gamingStatus?.gamemodeActive ? 'ACTIVO' : 'STANDBY'}</span>
          </div>

          <button
            onClick={fetchData}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: '3px' }}
            title="Re-escanear catálogo y telemetría"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎮 SUB-VISTA 1: CATÁLOGO DE VIDEOJUEGOS & LANZADORES                     */}
      {/* ========================================================================= */}
      {activeSubView === 'catalog' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          
          {/* Panel de Aceleración: Gamescope FSR & MangoHud */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={14} color="var(--primary)" />
              <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#fff' }}>
                Perfiles de Aceleración Soberana
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                • Prioridad CPU con `gamemoderun` + renderizado con escalado FSR
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              {/* Selector de Gamescope FSR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.72rem', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={useGamescopeFsr}
                    onChange={(e) => handleToggleGamescope(e.target.checked)}
                  />
                  <span>Forzar Gamescope FSR</span>
                </label>

                {useGamescopeFsr && (
                  <select
                    value={gamescopeRes}
                    onChange={(e) => handleChangeRes(e.target.value)}
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      color: 'var(--text-high)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      padding: '1px 5px'
                    }}
                  >
                    <option value="540p">540p → 1080p (Ultra Rendimiento)</option>
                    <option value="720p">720p → 1080p (Balanceado FSR)</option>
                    <option value="1080p">1080p Nativo</option>
                  </select>
                )}
              </div>

              {/* MangoHud Toggle */}
              {gamingStatus?.mangohudInstalled && (
                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.72rem', color: '#fff' }}>
                  <input
                    type="checkbox"
                    checked={useMangohud}
                    onChange={(e) => handleToggleMangohud(e.target.checked)}
                  />
                  <span>Overlay MangoHud (FPS)</span>
                </label>
              )}
            </div>
          </div>

          {/* Barra de Filtros, Búsqueda y Acciones Rápidas */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {/* Input de Búsqueda */}
            <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '380px' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '7px', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, categoría o AppID..."
                style={{
                  width: '100%',
                  height: '27px',
                  paddingLeft: '26px',
                  paddingRight: '8px',
                  fontSize: '0.74rem',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-high)'
                }}
              />
            </div>

            {/* Categorías de Filtro */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {[
                { id: 'all', label: `Todos (${steamGames.length + customGames.length})` },
                { id: 'steam', label: `Steam (${steamGames.length})` },
                { id: 'web', label: 'Web / Cloud' },
                { id: 'emu', label: 'Emulación & ROMs' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  style={{
                    padding: '2px 8px',
                    fontSize: '0.68rem',
                    background: categoryFilter === cat.id ? 'var(--primary-glow)' : 'var(--bg-card)',
                    border: `1px solid ${categoryFilter === cat.id ? 'var(--primary)' : 'var(--border-color)'}`,
                    color: categoryFilter === cat.id ? '#a7f3d0' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontWeight: categoryFilter === cat.id ? 700 : 500
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={() => {
                  setGameFormData({
                    id: '',
                    title: '',
                    category: 'Web Roguelike',
                    launchType: 'url',
                    launchTarget: '',
                    description: '',
                    bannerUrl: ''
                  });
                  setShowGameModal(true);
                }}
                className="btn btn-primary"
                style={{ padding: '3px 10px', fontSize: '0.72rem', height: '27px' }}
              >
                <Plus size={12} />
                <span>+ Agregar Lanzador</span>
              </button>

              <button
                onClick={() => handleLaunchGame('steam')}
                className="btn btn-secondary"
                style={{ padding: '3px 8px', fontSize: '0.72rem', height: '27px' }}
                title="Abrir la aplicación de Steam"
              >
                Abrir Steam
              </button>
            </div>
          </div>

          {/* Cuadrícula de Juegos: Steam + Lanzadores Personalizados */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '10px'
          }}>
            {/* Lanzadores Personalizados */}
            {filteredCustom.map(game => (
              <div
                key={game.id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {/* Banner de Portada si existe, o cabecera visual */}
                {game.bannerUrl ? (
                  <div style={{ height: '70px', overflow: 'hidden', background: '#111', position: 'relative' }}>
                    <img
                      src={game.bannerUrl}
                      alt={game.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <div style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: 'rgba(0,0,0,0.7)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.62rem',
                      color: 'var(--primary)',
                      fontWeight: 700
                    }}>
                      {game.category}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    padding: '8px 10px 4px 10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontSize: '0.62rem', background: 'var(--primary-glow)', color: 'var(--primary)', padding: '2px 6px', borderRadius: 'var(--radius-sm)', fontWeight: 700 }}>
                      {game.category}
                    </span>
                    <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      {game.launchType}
                    </span>
                  </div>
                )}

                {/* Info del Título */}
                <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', lineHeight: '1.15' }}>
                      {game.title}
                    </span>
                  </div>

                  {game.description && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '2px 0 0 0', lineHeight: '1.15' }}>
                      {game.description}
                    </p>
                  )}

                  <div style={{ marginTop: 'auto', paddingTop: '4px', fontSize: '0.65rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    🎯 {game.launchTarget}
                  </div>
                </div>

                {/* Barra de Acciones */}
                <div style={{
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.18)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <button
                    onClick={(e) => handleDeleteCustomGame(game.id, e)}
                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    title="Eliminar lanzador"
                  >
                    <Trash2 size={12} />
                  </button>

                  <button
                    onClick={() => handleLaunchGame(game.id, game.launchType, game.launchTarget)}
                    className="btn btn-primary"
                    style={{ padding: '3px 12px', fontSize: '0.72rem', height: '24px' }}
                  >
                    <Play size={11} />
                    <span>Lanzar</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Títulos Detectados en Steam */}
            {filteredSteam.map(game => (
              <div
                key={game.appId}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
              >
                {/* Portada Steam CDN Oficial */}
                <div style={{
                  height: '80px',
                  background: 'linear-gradient(135deg, rgba(20,24,30,0.9), rgba(10,12,16,0.9))',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <img
                    src={`https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appId}/header.jpg`}
                    alt={game.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.62rem',
                    color: '#a7f3d0',
                    fontFamily: 'var(--font-mono)'
                  }}>
                    ID {game.appId}
                  </div>
                </div>

                {/* Detalles de Instalación */}
                <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.name}
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                    <span>{game.sizeMb > 1024 ? `${(game.sizeMb / 1024).toFixed(1)} GB` : `${game.sizeMb} MB`}</span>
                    <span>• {game.installDir}</span>
                  </div>
                </div>

                {/* Botón de Ejecución Steam */}
                <div style={{
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.18)',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>Steam Nativo / Proton</span>
                  <button
                    onClick={() => handleLaunchGame(`steam:${game.appId}`)}
                    className="btn btn-primary"
                    style={{ padding: '3px 12px', fontSize: '0.72rem', height: '24px' }}
                  >
                    <Play size={11} />
                    <span>Jugar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredSteam.length === 0 && filteredCustom.length === 0 && !loading && (
            <div style={{
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              background: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)'
            }}>
              No se encontraron títulos que coincidan con la búsqueda o filtro.
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎲 SUB-VISTA 2: D&D 5e & MESA DE ROL SOBERANA                           */}
      {/* ========================================================================= */}
      {activeSubView === 'ttrpg' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '0.75rem', height: '100%', minHeight: 0 }}>
          
          {/* Columna Izquierda: Lanzador de Dados Táctico */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Dices size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>Bandeja de Dados</span>
              </div>
              <button
                onClick={handleClearDiceHistory}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.65rem' }}
                title="Limpiar registro"
              >
                Limpiar
              </button>
            </div>

            {/* Selector de Tipo de Dado */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
              {['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].map(d => (
                <button
                  key={d}
                  onClick={() => setSelectedDice(d)}
                  style={{
                    padding: '6px 2px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    borderRadius: 'var(--radius-sm)',
                    border: `1px solid ${selectedDice === d ? 'var(--primary)' : 'var(--border-color)'}`,
                    background: selectedDice === d ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                    color: selectedDice === d ? '#a7f3d0' : 'var(--text-high)',
                    cursor: 'pointer'
                  }}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Ajuste de Cantidad y Modificador */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <div>
                <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={diceCount}
                  onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{
                    width: '100%',
                    height: '26px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '0.75rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Modificador (+ / -)
                </label>
                <input
                  type="number"
                  value={diceModifier}
                  onChange={(e) => setDiceModifier(parseInt(e.target.value, 10) || 0)}
                  style={{
                    width: '100%',
                    height: '26px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    textAlign: 'center',
                    fontSize: '0.75rem'
                  }}
                />
              </div>
            </div>

            {/* Ventaja / Desventaja (Solo d20) */}
            {selectedDice === 'd20' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                {[
                  { id: 'normal', label: 'Normal' },
                  { id: 'adv', label: 'Ventaja' },
                  { id: 'dis', label: 'Desventaja' }
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setRollAdvantage(mode.id)}
                    style={{
                      padding: '3px 2px',
                      fontSize: '0.66rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1px solid ${rollAdvantage === mode.id ? 'var(--primary)' : 'var(--border-color)'}`,
                      background: rollAdvantage === mode.id ? 'var(--primary-glow)' : 'transparent',
                      color: rollAdvantage === mode.id ? '#a7f3d0' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}

            {/* Botón de Tirada Principal */}
            <button
              onClick={() => rollDice()}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '8px',
                fontSize: '0.82rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <Dices size={15} />
              <span>LANZAR {diceCount}{selectedDice}{diceModifier ? fmtMod(diceModifier) : ''}</span>
            </button>

            {/* Visualización de Resultado de la Última Tirada */}
            {activeRoll && (
              <div style={{
                background: activeRoll.isCritSuccess 
                  ? 'rgba(234, 179, 8, 0.15)' 
                  : activeRoll.isCritFail 
                  ? 'rgba(239, 68, 68, 0.15)' 
                  : 'rgba(255,255,255,0.04)',
                border: `1px solid ${activeRoll.isCritSuccess ? '#eab308' : activeRoll.isCritFail ? '#ef4444' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)',
                padding: '10px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {activeRoll.label || `${activeRoll.count}${activeRoll.dice}`}
                  {activeRoll.advantageMode === 'adv' && ' (Con Ventaja)'}
                  {activeRoll.advantageMode === 'dis' && ' (Con Desventaja)'}
                </div>

                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 900,
                  color: activeRoll.isCritSuccess ? '#facc15' : activeRoll.isCritFail ? '#f87171' : '#fff',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {activeRoll.total}
                </div>

                {activeRoll.isCritSuccess && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#facc15', letterSpacing: '0.04em' }}>
                    🌟 ¡ÉXITO CRÍTICO! (Natural 20)
                  </span>
                )}

                {activeRoll.isCritFail && (
                  <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f87171', letterSpacing: '0.04em' }}>
                    💀 ¡PIFIA CRÍTICA! (Natural 1)
                  </span>
                )}

                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Dados: [{activeRoll.rolls.join(', ')}] {activeRoll.mod ? `${fmtMod(activeRoll.mod)}` : ''}
                </div>
              </div>
            )}

            {/* Historial de Tiradas */}
            <div style={{ flex: 1, minHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Historial de Sesión ({diceRollHistory.length})
              </span>

              {diceRollHistory.map(rec => (
                <div
                  key={rec.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '3px 6px',
                    borderRadius: 'var(--radius-sm)',
                    background: rec.isCritSuccess ? 'rgba(234, 179, 8, 0.08)' : rec.isCritFail ? 'rgba(239, 68, 68, 0.08)' : 'rgba(0,0,0,0.18)',
                    fontSize: '0.68rem',
                    borderLeft: `2px solid ${rec.isCritSuccess ? '#eab308' : rec.isCritFail ? '#ef4444' : 'var(--primary)'}`
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 700, color: '#fff' }}>{rec.label || rec.diceExpression}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontSize: '0.62rem' }}>
                      {rec.characterName ? `(${rec.characterName})` : ''}
                    </span>
                  </div>
                  <span style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: rec.isCritSuccess ? '#facc15' : rec.isCritFail ? '#f87171' : '#fff' }}>
                    {rec.total}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Columna Derecha: Ficha de Personaje Soberana D&D 5e */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            overflowY: 'auto'
          }}>
            {/* Cabecera de Personaje & Acciones */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Selector de Personajes */}
                <select
                  value={selectedCharId || ''}
                  onChange={(e) => setSelectedCharId(e.target.value)}
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '3px 8px',
                    fontSize: '0.78rem',
                    fontWeight: 700
                  }}
                >
                  {characters.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Nvl {c.level} {c.characterClass})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => {
                    setCharFormData({
                      id: '',
                      name: '',
                      characterClass: 'Guerrero',
                      level: 1,
                      race: 'Humano',
                      currentHp: 12,
                      maxHp: 12,
                      tempHp: 0,
                      armorClass: 14,
                      initiativeBonus: 1,
                      speed: 30,
                      proficiencyBonus: 2,
                      strScore: 14,
                      dexScore: 12,
                      conScore: 14,
                      intScore: 10,
                      wisScore: 12,
                      chaScore: 10,
                      notes: '',
                      vaultNotePath: ''
                    });
                    setShowCharModal(true);
                  }}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.68rem', height: '26px' }}
                >
                  <Plus size={11} />
                  <span>+ Nuevo</span>
                </button>

                <button
                  onClick={handleOpenImportVault}
                  className="btn btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '0.68rem', height: '26px' }}
                  title="Importar ficha desde archivo Markdown de Obsidian"
                >
                  <BookOpen size={11} />
                  <span>Importar de Bóveda</span>
                </button>
              </div>

              {activeChar && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => {
                      setCharFormData({ ...activeChar });
                      setShowCharModal(true);
                    }}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.68rem', height: '26px' }}
                  >
                    <Edit3 size={11} />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={(e) => handleDeleteCharacter(activeChar.id, e)}
                    className="btn btn-secondary"
                    style={{ padding: '3px 8px', fontSize: '0.68rem', height: '26px', color: '#ef4444' }}
                    title="Eliminar personaje"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>

            {/* Vista de Ficha Activa */}
            {activeChar ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Título & Resumen de Identidad */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#fff' }}>
                      {activeChar.name}
                    </h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {activeChar.race} • {activeChar.characterClass} Nivel {activeChar.level}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-color)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>COMPETENCIA</div>
                      <div style={{ fontWeight: 800, color: 'var(--primary)' }}>+{activeChar.proficiencyBonus}</div>
                    </div>

                    <div style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid var(--border-color)',
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.68rem',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem' }}>VELOCIDAD</div>
                      <div style={{ fontWeight: 800, color: '#fff' }}>{activeChar.speed} ft</div>
                    </div>
                  </div>
                </div>

                {/* Marcadores de Combate Vital: HP, CA, Iniciativa */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1.4fr 1fr 1fr',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Puntos de Golpe (HP) */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Heart size={12} color="#ef4444" /> Puntos de Golpe
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                        {activeChar.currentHp} / {activeChar.maxHp}
                      </span>
                    </div>

                    {/* Barra Proporcional de HP */}
                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, (activeChar.currentHp / (activeChar.maxHp || 1)) * 100)}%`,
                        background: activeChar.currentHp / activeChar.maxHp > 0.5 ? '#10b981' : activeChar.currentHp / activeChar.maxHp > 0.2 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.3s'
                      }} />
                    </div>

                    {/* Botones de Ajuste Rápido de HP */}
                    <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
                      {[-5, -1, 1, 5].map(delta => (
                        <button
                          key={delta}
                          onClick={() => handleAdjustHp(delta)}
                          style={{
                            flex: 1,
                            padding: '2px 0',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            background: delta < 0 ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)',
                            border: `1px solid ${delta < 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            color: delta < 0 ? '#f87171' : '#34d399',
                            borderRadius: '2px',
                            cursor: 'pointer'
                          }}
                        >
                          {delta > 0 ? `+${delta}` : delta}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clase de Armadura (CA) */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    padding: '4px'
                  }}>
                    <Shield size={16} color="var(--primary)" />
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {activeChar.armorClass}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CLASE ARMADURA</span>
                  </div>

                  {/* Iniciativa */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => rollDice('d20', activeChar.initiativeBonus, `Iniciativa (${activeChar.name})`)}
                  title="Tirar Iniciativa en 1-clic"
                  >
                    <Zap size={16} color="#eab308" />
                    <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {fmtMod(activeChar.initiativeBonus)}
                    </span>
                    <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>INICIATIVA (🎲)</span>
                  </div>
                </div>

                {/* Botones de Descanso */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleShortRest}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                  >
                    <Coffee size={12} />
                    <span>Descanso Corto (Gastar Dado)</span>
                  </button>

                  <button
                    onClick={handleLongRest}
                    className="btn btn-secondary"
                    style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                  >
                    <Sparkles size={12} color="var(--primary)" />
                    <span>Descanso Largo (Restauración)</span>
                  </button>
                </div>

                {/* Cuadrícula de 6 Atributos D&D (1-Click Roll) */}
                <div>
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Atributos Principales (Click para tirar prueba 1d20 + Mod)
                  </span>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', marginTop: '6px' }}>
                    {[
                      { key: 'str', label: 'FUE', score: activeChar.strScore, name: 'Fuerza' },
                      { key: 'dex', label: 'DES', score: activeChar.dexScore, name: 'Destreza' },
                      { key: 'con', label: 'CON', score: activeChar.conScore, name: 'Constitución' },
                      { key: 'int', label: 'INT', score: activeChar.intScore, name: 'Inteligencia' },
                      { key: 'wis', label: 'SAB', score: activeChar.wisScore, name: 'Sabiduría' },
                      { key: 'cha', label: 'CAR', score: activeChar.chaScore, name: 'Carisma' }
                    ].map(attr => {
                      const mod = calcMod(attr.score);
                      return (
                        <div
                          key={attr.key}
                          onClick={() => rollDice('d20', mod, `Prueba de ${attr.name}`)}
                          style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            padding: '6px 2px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s'
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                          title={`Tirar 1d20 ${fmtMod(mod)} (${attr.name})`}
                        >
                          <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)' }}>
                            {attr.label}
                          </div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#fff', margin: '2px 0' }}>
                            {fmtMod(mod)}
                          </div>
                          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {attr.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notas & Vínculo a Obsidian */}
                {activeChar.notes && (
                  <div style={{
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '8px 10px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    lineHeight: '1.3'
                  }}>
                    <span style={{ fontWeight: 700, color: '#fff', display: 'block', marginBottom: '2px' }}>Notas de Campaña / Rasgos:</span>
                    {activeChar.notes}
                  </div>
                )}

                {activeChar.vaultNotePath && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    <BookOpen size={12} color="var(--primary)" />
                    <span>Vinculado a Bóveda: {activeChar.vaultNotePath}</span>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                No hay personajes configurados. Haz clic en `+ Nuevo` o `Importar de Bóveda`.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌿 SUB-VISTA 3: MODO DESCONEXIÓN & BIENESTAR                            */}
      {/* ========================================================================= */}
      {activeSubView === 'wellness' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 380px) 1fr', gap: '0.75rem', height: '100%' }}>
          
          {/* Temporizador de Desconexión / Relax */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Coffee size={18} color="var(--primary)" />
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                Temporizador de Ocio Saludable
              </span>
            </div>

            {/* Display de Tiempo */}
            <div style={{
              fontSize: '3.2rem',
              fontWeight: 900,
              fontFamily: 'var(--font-mono)',
              color: timerRunning ? '#10b981' : '#fff',
              letterSpacing: '0.05em'
            }}>
              {String(Math.floor(timerSeconds / 60)).padStart(2, '0')}:{String(timerSeconds % 60).padStart(2, '0')}
            </div>

            {/* Presets de Tiempo */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { label: '15 min (Pausa)', secs: 900 },
                { label: '20 min (Regla 20-20)', secs: 1200 },
                { label: '45 min (Sesión)', secs: 2700 }
              ].map(p => (
                <button
                  key={p.secs}
                  onClick={() => {
                    setTimerSeconds(p.secs);
                    setTimerTotal(p.secs);
                    setTimerRunning(false);
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.68rem',
                    background: timerTotal === p.secs ? 'var(--primary-glow)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${timerTotal === p.secs ? 'var(--primary)' : 'var(--border-color)'}`,
                    color: timerTotal === p.secs ? '#a7f3d0' : 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Controles de Temporizador */}
            <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '240px' }}>
              <button
                onClick={() => setTimerRunning(!timerRunning)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '6px', fontSize: '0.78rem', justifyContent: 'center' }}
              >
                {timerRunning ? 'Pausar' : 'Iniciar'}
              </button>

              <button
                onClick={() => {
                  setTimerRunning(false);
                  setTimerSeconds(timerTotal);
                }}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              >
                Reiniciar
              </button>
            </div>
          </div>

          {/* Guía de Salud & Enlaces a Bóveda Personal */}
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={16} color="var(--primary)" />
                Protocolo de Salud Ocular (Regla 20-20-20)
              </h3>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '4px 0 0 0', lineHeight: '1.3' }}>
                Cada <strong>20 minutos</strong> de programación o juego continuo, enfoca la vista hacia un objeto distante al menos a <strong>20 pies (6 metros)</strong> durante <strong>20 segundos</strong> completos para relajar los músculos ciliares y evitar fatiga ocular.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <h4 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={14} color="var(--primary)" />
                Backlog Personal & Desconexión en Obsidian
              </h4>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '3px 0 8px 0' }}>
                Documenta impresiones de tus títulos jugados, campañas de rol o lecturas sin telemetría ni distracciones externas.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {[
                  { title: 'Hub Personal y Ocio', path: '03 Personal y Ocio/MOC - Personal y Ocio.md', desc: 'Mapa general de videojuegos, rol y proyectos creativos.' },
                  { title: 'Perfil y Criterios Gamer', path: '03 Personal y Ocio/Gaming/Perfil Gamer y Criterios.md', desc: 'Filosofía de juego, progresión y filtros.' },
                  { title: 'Ficha de Campaña de Rol', path: '03 Personal y Ocio/Rol/', desc: 'Bitácora de aventuras, sesiones y fichas de personajes.' }
                ].map(item => (
                  <div
                    key={item.title}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '8px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{item.title}</div>
                      <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                    </div>
                    <span style={{ fontSize: '0.64rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                      Obsidian
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪟 MODAL: AGREGAR / EDITAR LANZADOR PERSONALIZADO                        */}
      {/* ========================================================================= */}
      {showGameModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '90%',
            maxWidth: '460px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                {gameFormData.id ? 'Editar Lanzador' : 'Agregar Nuevo Lanzador de Juego'}
              </span>
              <button
                onClick={() => setShowGameModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCustomGame} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Título del Juego *
                </label>
                <input
                  type="text"
                  required
                  value={gameFormData.title}
                  onChange={(e) => setGameFormData({ ...gameFormData, title: e.target.value })}
                  placeholder="ej. PokéRogue, RetroArch, Chess..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Tipo de Lanzador
                  </label>
                  <select
                    value={gameFormData.launchType}
                    onChange={(e) => setGameFormData({ ...gameFormData, launchType: e.target.value })}
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '2px 6px',
                      fontSize: '0.72rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  >
                    <option value="url">Navegador Web (URL)</option>
                    <option value="flatpak">Flatpak (App ID)</option>
                    <option value="cmd">Comando Binario / Shell</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Categoría / Etiqueta
                  </label>
                  <input
                    type="text"
                    value={gameFormData.category}
                    onChange={(e) => setGameFormData({ ...gameFormData, category: e.target.value })}
                    placeholder="Roguelike, Emulación..."
                    style={{
                      width: '100%',
                      height: '28px',
                      padding: '4px 8px',
                      fontSize: '0.75rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Destino de Ejecución (URL, ID Flatpak o Comando) *
                </label>
                <input
                  type="text"
                  required
                  value={gameFormData.launchTarget}
                  onChange={(e) => setGameFormData({ ...gameFormData, launchTarget: e.target.value })}
                  placeholder="https://pokerogue.net o io.mgba.mGBA o /usr/bin/..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    fontFamily: 'var(--font-mono)'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  URL de Imagen de Portada (Opcional)
                </label>
                <input
                  type="text"
                  value={gameFormData.bannerUrl}
                  onChange={(e) => setGameFormData({ ...gameFormData, bannerUrl: e.target.value })}
                  placeholder="https://... (JPG/PNG)"
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Descripción Corta
                </label>
                <input
                  type="text"
                  value={gameFormData.description}
                  onChange={(e) => setGameFormData({ ...gameFormData, description: e.target.value })}
                  placeholder="Resumen del juego o modo de juego..."
                  style={{
                    width: '100%',
                    height: '28px',
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowGameModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.75rem' }}
                >
                  Guardar Lanzador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪟 MODAL: CREAR / EDITAR PERSONAJE D&D 5e                               */}
      {/* ========================================================================= */}
      {showCharModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '90%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
                {charFormData.id ? 'Editar Ficha de Personaje D&D 5e' : 'Nuevo Personaje D&D 5e'}
              </span>
              <button
                onClick={() => setShowCharModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCharForm} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Nombre del Personaje *
                  </label>
                  <input
                    type="text"
                    required
                    value={charFormData.name}
                    onChange={(e) => setCharFormData({ ...charFormData, name: e.target.value })}
                    placeholder="ej. Explorador del Norte, Guerrero de Piedra..."
                    style={{
                      width: '100%',
                      height: '26px',
                      padding: '3px 6px',
                      fontSize: '0.74rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Nivel
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={charFormData.level}
                    onChange={(e) => setCharFormData({ ...charFormData, level: parseInt(e.target.value, 10) || 1 })}
                    style={{
                      width: '100%',
                      height: '26px',
                      padding: '3px 6px',
                      fontSize: '0.74rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Clase
                  </label>
                  <input
                    type="text"
                    value={charFormData.characterClass}
                    onChange={(e) => setCharFormData({ ...charFormData, characterClass: e.target.value })}
                    placeholder="Guerrero, Mago, Pícaro..."
                    style={{
                      width: '100%',
                      height: '26px',
                      padding: '3px 6px',
                      fontSize: '0.74rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                    Raza
                  </label>
                  <input
                    type="text"
                    value={charFormData.race}
                    onChange={(e) => setCharFormData({ ...charFormData, race: e.target.value })}
                    placeholder="Semiorco, Humano, Elfo..."
                    style={{
                      width: '100%',
                      height: '26px',
                      padding: '3px 6px',
                      fontSize: '0.74rem',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-sm)',
                      color: '#fff'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block' }}>HP Actual</label>
                  <input
                    type="number"
                    value={charFormData.currentHp}
                    onChange={(e) => setCharFormData({ ...charFormData, currentHp: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', height: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', fontSize: '0.72rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block' }}>HP Máximo</label>
                  <input
                    type="number"
                    value={charFormData.maxHp}
                    onChange={(e) => setCharFormData({ ...charFormData, maxHp: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', height: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', fontSize: '0.72rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block' }}>CA (Armadura)</label>
                  <input
                    type="number"
                    value={charFormData.armorClass}
                    onChange={(e) => setCharFormData({ ...charFormData, armorClass: parseInt(e.target.value, 10) || 10 })}
                    style={{ width: '100%', height: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', fontSize: '0.72rem' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.64rem', color: 'var(--text-muted)', display: 'block' }}>Iniciativa</label>
                  <input
                    type="number"
                    value={charFormData.initiativeBonus}
                    onChange={(e) => setCharFormData({ ...charFormData, initiativeBonus: parseInt(e.target.value, 10) || 0 })}
                    style={{ width: '100%', height: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', fontSize: '0.72rem' }}
                  />
                </div>
              </div>

              {/* Atributos (STR, DEX, CON, INT, WIS, CHA) */}
              <div>
                <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Puntuaciones de Atributo (3 - 20)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px' }}>
                  {[
                    { key: 'strScore', label: 'FUE' },
                    { key: 'dexScore', label: 'DES' },
                    { key: 'conScore', label: 'CON' },
                    { key: 'intScore', label: 'INT' },
                    { key: 'wisScore', label: 'SAB' },
                    { key: 'chaScore', label: 'CAR' }
                  ].map(a => (
                    <div key={a.key} style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{a.label}</span>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={charFormData[a.key]}
                        onChange={(e) => setCharFormData({ ...charFormData, [a.key]: parseInt(e.target.value, 10) || 10 })}
                        style={{ width: '100%', height: '24px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: '#fff', textAlign: 'center', fontSize: '0.72rem' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block', marginBottom: '2px' }}>
                  Notas / Rasgos de Personaje
                </label>
                <textarea
                  rows="2"
                  value={charFormData.notes || ''}
                  onChange={(e) => setCharFormData({ ...charFormData, notes: e.target.value })}
                  placeholder="Inmunidades, armas favoritas, trasfondo..."
                  style={{
                    width: '100%',
                    padding: '4px 6px',
                    fontSize: '0.72rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: '#fff',
                    resize: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowCharModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '4px 12px', fontSize: '0.72rem' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '4px 14px', fontSize: '0.72rem' }}
                >
                  Guardar Personaje
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🪟 MODAL: IMPORTAR FICHA DESDE BÓVEDA OBSIDIAN                            */}
      {/* ========================================================================= */}
      {showImportVaultModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: 'var(--bg-main)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            width: '90%',
            maxWidth: '480px',
            maxHeight: '80vh',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <BookOpen size={15} color="var(--primary)" />
                Importar Personaje desde Bóveda Obsidian
              </span>
              <button
                onClick={() => setShowImportVaultModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              Selecciona cualquier archivo Markdown de rol o ficha de personaje. Aegis parseará atributos, CA y puntos de vida automáticamente.
            </p>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {vaultCandidateNotes.map(n => (
                <div
                  key={n.path}
                  onClick={() => handleImportNote(n.path)}
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#fff' }}>{n.title}</div>
                    <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>{n.path}</div>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--primary)', fontWeight: 700 }}>
                    Importar →
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
