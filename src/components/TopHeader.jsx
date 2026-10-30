import { useState } from 'react';
import { 
  ShieldCheck,
  Search, 
  Settings,
  Pin,
  PinOff
} from 'lucide-react';

export default function TopHeader({ 
  onOpenSettings,
  onOpenCommandPalette
}) {
  const [isPinned, setIsPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_top_dock_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const togglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis_top_dock_pinned', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <aside className="dynamic-island-trigger">
      {/* 🏝️ Apple Dynamic Island HUD Capsule (44px Proporción Amplia / Tipografía Confortable) */}
      <div 
        className={`dynamic-island-capsule ${isPinned ? 'is-pinned' : ''}`}
        style={{
          width: 'max-content',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          gap: '10px',
          padding: '0 16px',
          background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
          backdropFilter: 'blur(18px)',
          border: '1px solid var(--border-color)',
          borderTop: 'none',
          borderRadius: '0 0 18px 18px',
          userSelect: 'none',
          cursor: isPinned ? 'default' : 'pointer'
        }}
      >
        {/* 🛡️ Brand Logo AEGIS */}
        <div 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '7px', 
            cursor: 'default',
            flexShrink: 0,
            paddingRight: '4px'
          }}
          title="Aegis Master Cockpit"
        >
          <div style={{
            background: 'color-mix(in srgb, var(--primary) 16%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 40%, transparent)',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <ShieldCheck size={14} color="var(--primary)" />
          </div>
          <span style={{ 
            fontSize: '0.82rem', 
            fontWeight: 800, 
            color: 'var(--text-high)', 
            letterSpacing: '0.08em' 
          }}>
            AEGIS
          </span>
        </div>

        {/* Separador */}
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', opacity: 0.6, flexShrink: 0 }} />

        {/* 🧭 Slot Dinámico: Modo de Trabajo, Ver Razonamiento y Métrica Táctica de Tokens */}
        <div 
          id="top-header-slot" 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flexShrink: 0
          }} 
        />

        {/* Separador */}
        <div style={{ width: '1px', height: '18px', background: 'var(--border-color)', opacity: 0.6, flexShrink: 0 }} />

        {/* 📡 Acciones Globales: Búsqueda y Ajustes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Command shortcut (Ctrl + K) */}
          <button 
            onClick={onOpenCommandPalette}
            title="Abrir Paleta de Comandos (Ctrl + K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 9px',
              fontSize: '0.74rem',
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
            <Search size={12} />
            <kbd style={{ fontFamily: 'inherit', color: 'var(--text-high)', fontSize: '0.64rem' }}>Ctrl+K</kbd>
          </button>

          {/* Opciones / Ajustes (Ctrl + ,) */}
          <button
            onClick={onOpenSettings}
            title="Opciones y Ajustes (Ctrl + ,)"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 9px',
              color: 'var(--text-muted)',
              fontSize: '0.74rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.color = 'var(--primary)';
              e.currentTarget.style.borderColor = 'var(--primary)'; 
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.color = 'var(--text-muted)';
              e.currentTarget.style.borderColor = 'var(--border-color)'; 
            }}
          >
            <Settings size={13} />
            <span>Opciones</span>
          </button>

          {/* Fijar / Auto-ocultar (Pin) */}
          <button
            onClick={togglePin}
            title={isPinned ? 'Desfijar cabecera (Auto-ocultar al salir el cursor)' : 'Fijar cabecera superior permanente'}
            style={{
              background: isPinned ? 'color-mix(in srgb, var(--primary) 18%, transparent)' : 'transparent',
              border: `1px solid ${isPinned ? 'var(--primary)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm, 8px)',
              padding: '4px 7px',
              color: isPinned ? 'var(--primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isPinned ? 'var(--primary)' : 'var(--text-muted)'; }}
          >
            {isPinned ? <Pin size={13} /> : <PinOff size={13} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
