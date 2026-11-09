import React, { useState, useRef, useEffect } from 'react';
import { ArrowUpDown, Lock, Unlock, Check } from 'lucide-react';
import { SORT_OPTIONS } from './gameHelpers';

export default function GamingFilterBar({
  categoryFilter,
  setCategoryFilter,
  sortBy = 'recent',
  onSetSortBy,
  steamCount = 0,
  customCount = 0,
  hiddenCount = 0,
  showHiddenVault = false,
  onToggleVault
}) {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef(null);

  const activeSortObj = SORT_OPTIONS.find((s) => s.id === sortBy) || SORT_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = [
    { id: 'all', label: `Todos (${steamCount + customCount})` },
    { id: 'steam', label: `Steam (${steamCount})` },
    { id: 'web', label: 'Web' },
    { id: 'emu', label: 'Emuladores' },
    ...(showHiddenVault ? [{ id: 'vault', label: `Bóveda (${hiddenCount})` }] : [])
  ];

  return (
    <div
      className="gaming-filter-bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.4rem 0.85rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        flexShrink: 0,
        gap: '10px',
        flexWrap: 'wrap',
        margin: '2px 0'
      }}
    >
      {/* 🏷️ Pastillas de Categorías */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
        {categories.map((cat) => {
          const isActive = categoryFilter === cat.id;
          const isVaultTab = cat.id === 'vault';
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className="gaming-category-tab-btn"
              style={{
                padding: '3px 10px',
                fontSize: '0.7rem',
                background: isActive
                  ? (isVaultTab ? 'color-mix(in srgb, var(--warning) 20%, transparent)' : 'var(--primary-glow)')
                  : 'rgba(0,0,0,0.2)',
                border: `1px solid ${isActive ? (isVaultTab ? 'var(--warning)' : 'var(--primary)') : 'var(--border-color)'}`,
                color: isActive ? (isVaultTab ? 'var(--warning)' : 'var(--primary)') : 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontWeight: isActive ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease'
              }}
            >
              {isVaultTab && <Lock size={11} />}
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🧭 Acciones Secundarias: Ordenamiento & Acceso a Bóveda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* ⇅ Menú Desplegable de Ordenamiento */}
        <div ref={sortRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="gaming-sort-trigger-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              fontSize: '0.7rem',
              height: '28px',
              background: showSortMenu ? 'var(--bg-card-hover)' : 'rgba(0,0,0,0.25)',
              border: `1px solid ${showSortMenu ? 'var(--primary)' : 'var(--border-color)'}`,
              color: 'var(--text-high)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontWeight: 600
            }}
            title="Cambiar orden de visualización de los juegos"
          >
            <ArrowUpDown size={12} color="var(--primary)" />
            <span>{activeSortObj.label}</span>
          </button>

          {showSortMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '4px',
              width: '190px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              padding: '4px',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{
                fontSize: '0.62rem',
                color: 'var(--text-muted)',
                padding: '4px 6px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Ordenar catálogo por
              </div>
              {SORT_OPTIONS.map((opt) => {
                const isSelected = opt.id === sortBy;
                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSetSortBy?.(opt.id);
                      setShowSortMenu(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '0.7rem',
                      background: isSelected ? 'color-mix(in srgb, var(--primary) 12%, transparent)' : 'transparent',
                      border: 'none',
                      borderRadius: 'var(--radius-sm)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-high)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: isSelected ? 700 : 500
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check size={12} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 🔒 Botón de Bóveda (Juegos Ocultos) */}
        <button
          onClick={onToggleVault}
          className="gaming-vault-toggle-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 10px',
            fontSize: '0.7rem',
            height: '28px',
            background: showHiddenVault
              ? 'color-mix(in srgb, var(--warning) 22%, transparent)'
              : 'rgba(0,0,0,0.25)',
            border: `1px solid ${showHiddenVault ? 'var(--warning)' : 'var(--border-color)'}`,
            color: showHiddenVault ? 'var(--warning)' : 'var(--text-muted)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            fontWeight: showHiddenVault ? 700 : 500,
            transition: 'all 0.15s ease'
          }}
          title={showHiddenVault ? 'Bloquear y resguardar Bóveda' : 'Abrir Bóveda de títulos ocultos'}
        >
          {showHiddenVault ? <Unlock size={12} color="var(--warning)" /> : <Lock size={12} />}
          <span>{showHiddenVault ? 'Bóveda Abierta' : `Bóveda (${hiddenCount})`}</span>
        </button>
      </div>
    </div>
  );
}
