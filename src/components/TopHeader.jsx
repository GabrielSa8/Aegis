import { 
  ShieldCheck, 
  Cpu, 
  Search, 
  Bot, 
  PiggyBank, 
  BookOpen, 
  GitBranch, 
  CheckSquare, 
  Activity, 
  Gamepad2,
  Maximize2,
  Minimize2,
  Settings
} from 'lucide-react';

export default function TopHeader({ 
  coreStatus, 
  activeTab, 
  onSelectTab,
  zenMode,
  onToggleZenMode,
  onOpenSettings,
  onOpenCommandPalette
}) {
  const tabs = [
    { id: 'agent', label: 'Agente', icon: Bot, shortcut: '1' },
    { id: 'finances', label: 'Finanzas', icon: PiggyBank, shortcut: '2' },
    { id: 'vault', label: 'Bóveda', icon: BookOpen, shortcut: '3' },
    { id: 'devops', label: 'DevOps', icon: GitBranch, shortcut: '4' },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare, shortcut: '5' },
    { id: 'sentinel', label: 'Centinela', icon: Activity, shortcut: '6' },
    { id: 'gaming', label: 'Gaming', icon: Gamepad2, shortcut: '7' },
    { id: 'settings', label: 'Sistema', icon: Settings, shortcut: '8' }
  ];

  return (
    <header style={{
      height: '32px',
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border-color)',
      padding: '0 0.85rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      userSelect: 'none',
      flexShrink: 0,
      zIndex: 50,
      gap: '8px'
    }}>
      {/* 🛡️ Brand & Segmented Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: 0 }}>
        {/* Brand Logo */}
        <div 
          onClick={() => onSelectTab('agent')}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            cursor: 'pointer',
            flexShrink: 0 
          }}
          title="Aegis Master Cockpit"
        >
          <div style={{
            background: 'color-mix(in srgb, var(--primary) 12%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 30%, transparent)',
            padding: '2px',
            borderRadius: '5px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={13} color="var(--primary)" />
          </div>
          <span style={{ 
            fontSize: '0.78rem', 
            fontWeight: 800, 
            color: 'var(--text-high)', 
            letterSpacing: '0.06em' 
          }}>
            AEGIS
          </span>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '14px', background: 'var(--border-color)', flexShrink: 0 }} />

        {/* 🎛️ Segmented Navigation Bar (Reemplaza al antiguo Dock) */}
        <nav style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '2px',
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '1px 2px',
          borderRadius: '6px',
          border: '1px solid var(--border-color)',
          overflowX: 'auto'
        }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                title={`${tab.label} (Alt + ${tab.shortcut})`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '2px 7px',
                  borderRadius: '5px',
                  background: isActive ? 'color-mix(in srgb, var(--primary) 14%, transparent)' : 'transparent',
                  border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  transition: 'color 0.15s ease, background 0.15s ease',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-high)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <Icon size={12} color={isActive ? 'var(--primary)' : 'var(--text-muted)'} />
                <span>{tab.label}</span>
                <span style={{ 
                  fontSize: '0.56rem', 
                  opacity: isActive ? 0.9 : 0.4, 
                  fontFamily: 'var(--font-mono)',
                  marginLeft: '1px'
                }}>
                  {tab.shortcut}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* 🧭 Slot Dinámico de Controles Activos de la Vista (ej. Contexto y Esfuerzo de Agente en la misma barra) */}
      <div 
        id="top-header-slot" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          flex: 1, 
          minWidth: 0, 
          overflow: 'hidden',
          padding: '0 4px'
        }} 
      />

      {/* 📡 Telemetría, Búsqueda y Zen Focus Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Core Status Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          background: 'color-mix(in srgb, var(--primary) 8%, transparent)',
          border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.64rem',
          color: 'var(--primary)',
          fontWeight: 600
        }}>
          <span style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: 'var(--primary)',
            boxShadow: '0 0 6px var(--primary)'
          }} />
          <span>{coreStatus ? 'Core Rust' : 'Web'}</span>
        </div>


        {/* Command shortcut */}
        <div 
          onClick={onOpenCommandPalette}
          title="Abrir Paleta de Comandos (Ctrl + K)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '2px 6px',
            fontSize: '0.62rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--accent)';
            e.currentTarget.style.color = 'var(--text-high)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-color)';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Search size={10} />
          <kbd style={{ fontFamily: 'inherit', color: 'var(--text-high)' }}>Ctrl+K</kbd>
        </div>

        {/* Modo Zen (Ocultar Barra / Máxima Claridad) */}
        <button
          onClick={onToggleZenMode}
          title={zenMode ? 'Salir de Modo Zen (Alt + Z)' : 'Modo Zen: Ocultar interfaz para máxima vista (Alt + Z)'}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 6px',
            color: zenMode ? '#34d399' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-high)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = zenMode ? '#34d399' : 'var(--text-muted)'; }}
        >
          {zenMode ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
        </button>

        {/* Ajustes y Configuración (Ctrl + ,) */}
        <button
          onClick={onOpenSettings}
          title="Ajustes y Temas (Ctrl + ,)"
          style={{
            background: 'transparent',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '3px 6px',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'var(--transition)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Settings size={12} />
        </button>
      </div>
    </header>
  );
}
