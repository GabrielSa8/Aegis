import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  Bot, 
  DollarSign, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2, 
  Palette, 
  Settings, 
  Zap, 
  CornerDownLeft, 
  FileText,
  Minimize2,
  Trash2,
  X
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectTab,
  onToggleZenMode,
  onOpenSettings,
  onThemeChange
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [vaultNotes, setVaultNotes] = useState([]);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Cargar notas de Obsidian para búsqueda en omnibar
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);

      invoke('get_vault_notes')
        .then((notes) => setVaultNotes(notes.slice(0, 30)))
        .catch(() => setVaultNotes([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Lista base de comandos del sistema
  const baseCommands = [
    // 🧭 Navegación
    { id: 'nav-agent', title: 'Ir a Agente IA', category: 'Navegación', icon: Bot, shortcut: 'Alt + 1', action: () => { onSelectTab('agent'); onClose(); } },
    { id: 'nav-finances', title: 'Ir a Vida & Finanzas (Timeline)', category: 'Navegación', icon: DollarSign, shortcut: 'Alt + 2', action: () => { onSelectTab('finances'); onClose(); } },
    { id: 'nav-vault', title: 'Ir a Bóveda Obsidian', category: 'Navegación', icon: BookOpen, shortcut: 'Alt + 3', action: () => { onSelectTab('vault'); onClose(); } },
    { id: 'nav-devops', title: 'Ir a DevOps & Flota Git', category: 'Navegación', icon: GitBranch, shortcut: 'Alt + 4', action: () => { onSelectTab('devops'); onClose(); } },
    { id: 'nav-tasks', title: 'Ir a Tareas de Bóveda', category: 'Navegación', icon: CheckSquare, shortcut: 'Alt + 5', action: () => { onSelectTab('tasks'); onClose(); } },
    { id: 'nav-sentinel', title: 'Ir a Centinela & Telemetría Host', category: 'Navegación', icon: Activity, shortcut: 'Alt + 6', action: () => { onSelectTab('sentinel'); onClose(); } },
    { id: 'nav-gaming', title: 'Ir a Gaming Cockpit & Aceleración', category: 'Navegación', icon: Gamepad2, shortcut: 'Alt + 7', action: () => { onSelectTab('gaming'); onClose(); } },
    { id: 'nav-settings', title: 'Ir a Sistema & Configuración Soberana', category: 'Navegación', icon: Settings, shortcut: 'Alt + 8', action: () => { onSelectTab('settings'); onClose(); } },

    // ⚡ Acciones Tácticas
    { id: 'act-zen', title: 'Alternar Modo Zen (Pantalla Completa)', category: 'Acciones', icon: Minimize2, shortcut: 'Alt + Z', action: () => { onToggleZenMode(); onClose(); } },
    { id: 'act-settings', title: 'Abrir Ajustes Globales & Flota', category: 'Acciones', icon: Settings, shortcut: 'Ctrl + ,', action: () => { onOpenSettings(); onClose(); } },
    { 
      id: 'act-purge', 
      title: 'Purgar Memoria RAM & Compactar ZRAM', 
      category: 'Acciones', 
      icon: Zap, 
      action: () => { 
        invoke('clean_system_memory').then(() => alert('Memoria purgada y ZRAM compactada con éxito.')).catch(e => alert(e)); 
        onClose(); 
      } 
    },
    { 
      id: 'act-steam', 
      title: 'Lanzar Steam con GameMode', 
      category: 'Acciones', 
      icon: Gamepad2, 
      action: () => { 
        invoke('launch_game', { target: 'steam' }); 
        onClose(); 
      } 
    },

    // 🎨 Temas Visuales
    { id: 'theme-nordic', title: 'Tema: Nordic Slate & Moss (Predeterminado)', category: 'Temas', icon: Palette, action: () => { onThemeChange('nordic-moss'); onClose(); } },
    { id: 'theme-tokyo', title: 'Tema: Tokyo Night (Indigo Cyberpunk)', category: 'Temas', icon: Palette, action: () => { onThemeChange('tokyo-night'); onClose(); } },
    { id: 'theme-oled', title: 'Tema: OLED Pure Black (100% Negro & Láser Verde)', category: 'Temas', icon: Palette, action: () => { onThemeChange('oled-black'); onClose(); } },
    { id: 'theme-amber', title: 'Tema: Amber Terminal (Hacker Ámbar Monocromo)', category: 'Temas', icon: Palette, action: () => { onThemeChange('amber-terminal'); onClose(); } },
    { id: 'theme-dracula', title: 'Tema: Dracula Dark (Púrpura & Magenta)', category: 'Temas', icon: Palette, action: () => { onThemeChange('dracula'); onClose(); } },
  ];

  // Comandos de notas de Obsidian
  const noteCommands = vaultNotes.map((n) => ({
    id: 'note-' + n.path,
    title: `Nota: ${n.title}`,
    category: `Bóveda · ${n.hub}`,
    icon: FileText,
    action: () => {
      onSelectTab('vault');
      onClose();
    }
  }));

  const allItems = [...baseCommands, ...noteCommands];

  const filtered = allItems.filter((item) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
  });

  // Manejo de teclado (Flecha arriba/abajo, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filtered.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % (filtered.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          width: '90%',
          maxWidth: '580px',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.65), 0 0 1px 1px var(--border-color)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '75vh',
          animation: 'fadeIn 0.15s ease'
        }}
      >
        {/* 🔍 Search Input Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '0.85rem 1.1rem',
          borderBottom: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Escribe un comando, vista, nota de Obsidian o acción..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-high)',
              fontSize: '0.92rem',
              fontFamily: 'inherit'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px'
              }}
            >
              <X size={14} />
            </button>
          )}
          <kbd style={{
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '2px 5px',
            borderRadius: '4px'
          }}>
            ESC
          </kbd>
        </div>

        {/* 📋 Results List */}
        <div 
          ref={listRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.4rem'
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              No se encontraron comandos ni notas para "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  onClick={() => item.action()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.55rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
                    border: isSelected ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid transparent',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease',
                    marginBottom: '2px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: isSelected ? '#10b981' : 'var(--text-muted)'
                    }}>
                      <Icon size={14} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        fontWeight: isSelected ? 700 : 500,
                        color: isSelected ? 'var(--text-high)' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {item.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.7 }}>
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {item.shortcut && (
                      <kbd style={{
                        fontSize: '0.62rem',
                        color: 'var(--text-muted)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-color)',
                        padding: '1px 5px',
                        borderRadius: '3px'
                      }}>
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && (
                      <CornerDownLeft size={12} color="#10b981" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 🧭 Footer Hints */}
        <div style={{
          padding: '0.5rem 1rem',
          borderTop: '1px solid var(--border-color)',
          background: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span><kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '2px' }}>↑↓</kbd> navegar</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '2px' }}>↵</kbd> ejecutar</span>
            <span><kbd style={{ background: 'rgba(255,255,255,0.06)', padding: '1px 4px', borderRadius: '2px' }}>esc</kbd> cerrar</span>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Aegis Command Center</span>
        </div>
      </div>
    </div>
  );
}
