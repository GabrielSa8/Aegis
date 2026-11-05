import React from 'react';
import { Trash2, Info, Trophy } from 'lucide-react';

export default function GameCardHeaderBadges({
  game,
  isSteam,
  achUnlocked,
  achTotal,
  onDelete,
  onOpenDetails
}) {
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
              borderRadius: 'var(--radius-sm)'
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
      </div>

      {/* Badges Superior Derecha: Logros y Plataforma */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
