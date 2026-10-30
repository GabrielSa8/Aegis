import React from 'react';
import { Search, X } from 'lucide-react';
import { useCommandPalette, CommandItemRow } from './command-palette';

export default function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectTab,
  onOpenSettings,
  onThemeChange
}) {
  const {
    query,
    setQuery,
    selectedIndex,
    setSelectedIndex,
    inputRef,
    listRef,
    filtered,
    handleKeyDown
  } = useCommandPalette({
    isOpen,
    onClose,
    onSelectTab,
    onOpenSettings,
    onThemeChange
  });

  if (!isOpen) return null;

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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '0.85rem 1.1rem',
            borderBottom: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.15)'
          }}
        >
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
          <kbd
            style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-color)',
              padding: '2px 5px',
              borderRadius: '4px'
            }}
          >
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
            filtered.map((item, idx) => (
              <CommandItemRow
                key={item.id}
                item={item}
                isSelected={idx === selectedIndex}
                onSelect={() => setSelectedIndex(idx)}
              />
            ))
          )}
        </div>

        {/* 🧭 Footer Hints */}
        <div
          style={{
            padding: '0.5rem 1rem',
            borderTop: '1px solid var(--border-color)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.68rem',
            color: 'var(--text-muted)'
          }}
        >
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
