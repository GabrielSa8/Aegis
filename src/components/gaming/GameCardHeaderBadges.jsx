import React from 'react';
import { Trash2, Info, Trophy, Laptop, Lock, Eye, EyeOff } from 'lucide-react';

export default function GameCardHeaderBadges({
  game,
  isSteam,
  achUnlocked,
  achTotal,
  isHidden = false,
  onToggleHide,
  onDelete,
  onOpenDetails
}) {
  const isInstalled = game.isInstalled ?? true;
  return (
    <div style={{
      position: 'absolute',
      top: '8px',
      left: '8px',
      right: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      zIndex: 3,
      pointerEvents: 'none'
    }}>
      {/* Botones de acción superior izquierda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'auto' }}>
        {!isSteam && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(game.id);
            }}
            className="gaming-badge-btn gaming-badge-delete-btn"
            style={{
              background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
              border: '1px solid var(--border-color)',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '3px 5px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Eliminar este lanzador"
          >
            <Trash2 size={11} />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetails(game, isSteam);
          }}
          className="gaming-badge-btn gaming-badge-info-btn"
          style={{
            background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-high)',
            cursor: 'pointer',
            padding: '3px 5px',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
          title="Ver logros, sesiones y bitácora"
        >
          <Info size={11} color="var(--primary)" />
        </button>

        {onToggleHide && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleHide(game, isSteam);
            }}
            className="gaming-badge-btn gaming-badge-hide-btn"
            style={{
              background: isHidden
                ? 'color-mix(in srgb, var(--warning) 25%, black)'
                : 'color-mix(in srgb, var(--bg-card) 85%, black)',
              border: `1px solid ${isHidden ? 'var(--warning)' : 'var(--border-color)'}`,
              color: isHidden ? 'var(--warning)' : 'var(--text-muted)',
              cursor: 'pointer',
              padding: '3px 5px',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isHidden ? 'Restaurar de la Bóveda' : 'Ocultar en la Bóveda'}
          >
            {isHidden ? <Eye size={11} color="var(--warning)" /> : <EyeOff size={11} />}
          </button>
        )}
      </div>

      {/* Badges Superior Derecha: Bóveda, Logros, Estado Multi-Dispositivo y Plataforma */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {isHidden && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'color-mix(in srgb, var(--warning) 22%, black)',
              border: '1px solid color-mix(in srgb, var(--warning) 60%, transparent)',
              padding: '2px 5px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.58rem',
              fontWeight: 800,
              color: 'var(--warning)'
            }}
            title="Título resguardado en la Bóveda"
          >
            <Lock size={9} />
            <span>BÓVEDA</span>
          </div>
        )}

        {!isInstalled && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: 'color-mix(in srgb, var(--warning) 18%, black)',
              border: '1px solid color-mix(in srgb, var(--warning) 45%, transparent)',
              padding: '2px 5px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.58rem',
              fontWeight: 700,
              color: 'var(--warning)'
            }}
            title={`Instalado en ${game.lastPlayedDevice || 'otro equipo de la flota Aegis'}`}
          >
            <Laptop size={9} />
            <span>{game.lastPlayedDevice ? game.lastPlayedDevice.replace(/^aegis-/, '') : 'Remoto'}</span>
          </div>
        )}

        {achTotal > 0 && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              background: achUnlocked === achTotal
                ? 'color-mix(in srgb, var(--primary) 22%, var(--bg-card))'
                : 'color-mix(in srgb, var(--bg-card) 90%, black)',
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.62rem',
              fontWeight: 800,
              color: achUnlocked === achTotal ? 'var(--primary)' : 'var(--text-high)',
              border: `1px solid ${achUnlocked === achTotal ? 'var(--primary)' : 'var(--border-color)'}`,
              boxShadow: achUnlocked === achTotal ? '0 0 8px var(--primary-glow)' : 'none'
            }}
            title={`${achUnlocked}/${achTotal} logros completados (${Math.round((achUnlocked / achTotal) * 100)}%)`}
          >
            <Trophy size={10} color={achUnlocked > 0 ? 'var(--primary)' : 'var(--text-muted)'} />
            <span>{achUnlocked}/{achTotal}</span>
          </div>
        )}

        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
          padding: '2px 6px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.6rem',
          fontWeight: 700,
          color: isSteam ? 'var(--primary)' : 'var(--accent)',
          border: '1px solid var(--border-color)'
        }}>
          {isSteam ? 'STEAM' : (game.category || 'CUSTOM').toUpperCase()}
        </div>
      </div>
    </div>
  );
}
