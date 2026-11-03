import React, { useState, useMemo } from 'react';
import { RefreshCw, PlayCircle, Search, Power, Sparkles } from 'lucide-react';

export default function AutostartCard({
  items,
  loading,
  togglingItemId,
  feedback,
  onRefresh,
  onToggle
}) {
  const [search, setSearch] = useState('');

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    );
  }, [items, search]);

  const enabledCount = useMemo(() => items.filter((i) => i.enabled).length, [items]);

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '6px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Header con métrica y refresco */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircle size={15} style={{ color: 'var(--accent)' }} />
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)', letterSpacing: '0.02em' }}>
              Gestor de Arranque (Autostart)
            </div>
            <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              Aplicaciones de sesión y servicios de usuario systemd
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              fontSize: '0.70rem',
              fontWeight: 700,
              fontFamily: 'monospace',
              background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
              color: 'var(--accent)',
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)'
            }}
          >
            {loading ? 'Cargando...' : `${enabledCount} activos / ${items.length}`}
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refrescar lista de inicio"
            style={{
              background: 'color-mix(in srgb, var(--text-muted) 10%, transparent)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-muted)',
              borderRadius: '4px',
              padding: '4px 6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Banner de feedback */}
      {feedback && (
        <div
          style={{
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '0.70rem',
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Sparkles size={11} style={{ flexShrink: 0 }} />
          <span>{feedback}</span>
        </div>
      )}

      {/* Buscador táctico */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'color-mix(in srgb, var(--bg-card) 60%, var(--border-color) 30%)',
          border: '1px solid color-mix(in srgb, var(--border-color) 50%, transparent)',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <Search size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar servicios o aplicaciones..."
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-high)',
            fontSize: '0.70rem',
            outline: 'none',
            width: '100%'
          }}
        />
      </div>

      {/* Lista de items de arranque */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          maxHeight: '220px',
          overflowY: 'auto'
        }}
      >
        {filteredItems.map((item) => {
          const isToggling = togglingItemId === item.id;
          const isSystemd = item.itemType === 'systemd';

          return (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 10px',
                borderRadius: '4px',
                background: 'color-mix(in srgb, var(--bg-card) 50%, var(--border-color) 25%)',
                border: '1px solid color-mix(in srgb, var(--border-color) 40%, transparent)',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 600,
                      color: item.enabled ? 'var(--text-high)' : 'var(--text-muted)',
                      textDecoration: item.enabled ? 'none' : 'line-through'
                    }}
                  >
                    {item.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontFamily: 'monospace',
                      padding: '1px 4px',
                      borderRadius: '3px',
                      background: isSystemd
                        ? 'color-mix(in srgb, var(--accent) 15%, transparent)'
                        : 'color-mix(in srgb, var(--primary) 15%, transparent)',
                      color: isSystemd ? 'var(--accent)' : 'var(--primary)'
                    }}
                  >
                    {isSystemd ? 'systemd' : 'app'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '0.62rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={item.exec}
                >
                  {item.exec}
                </div>
              </div>

              {/* Botón Switch táctico */}
              <button
                onClick={() => onToggle(item.id, item.itemType, item.enabled)}
                disabled={isToggling}
                style={{
                  background: item.enabled
                    ? 'color-mix(in srgb, var(--primary) 20%, transparent)'
                    : 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
                  border: `1px solid ${item.enabled ? 'var(--primary)' : 'var(--border-color)'}`,
                  color: item.enabled ? 'var(--primary)' : 'var(--text-muted)',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  cursor: isToggling ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0
                }}
              >
                <Power size={10} />
                <span>{isToggling ? '...' : (item.enabled ? 'ON' : 'OFF')}</span>
              </button>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px' }}>
            No se encontraron elementos de inicio coincidentes.
          </div>
        )}
      </div>
    </div>
  );
}
