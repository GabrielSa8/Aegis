import React, { useState } from 'react';
import { CheckCircle2, Lock, Trash2, Trophy, Award } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function AchievementItemRow({ item, onToggle, onDelete }) {
  const [imgError, setImgError] = useState(false);

  // Normalizar hacia el CDN oficial de Akamai accesible sin bloqueo de proxy
  const resolvedIconUrl = React.useMemo(() => {
    if (!item?.iconUrl) return null;
    return item.iconUrl
      .replace('https://shared.steamstatic.com/community_assets/images/apps/', 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/')
      .replace('https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/', 'https://cdn.akamai.steamstatic.com/steamcommunity/public/images/apps/');
  }, [item?.iconUrl]);

  // Iniciales o monograma para fallback militar
  const getInitials = (name) => {
    if (!name) return 'LG';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  };

  return (
    <div
      className="gaming-achievement-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        background: item.unlocked
          ? 'color-mix(in srgb, var(--primary) 8%, var(--bg-card))'
          : 'color-mix(in srgb, var(--bg-card) 95%, black)',
        border: `1px solid ${item.unlocked ? 'color-mix(in srgb, var(--primary) 35%, transparent)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        gap: '10px',
        transition: 'all 0.15s ease'
      }}
    >
      {/* 🏅 Logo / Medalla Táctica */}
      <div className="gaming-ach-item-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
        {resolvedIconUrl && !imgError ? (
          <div style={{
            position: 'relative',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-sm)',
            overflow: 'hidden',
            background: 'color-mix(in srgb, var(--bg-card) 90%, black)',
            border: `1px solid ${item.unlocked ? 'color-mix(in srgb, var(--primary) 40%, transparent)' : 'var(--border-color)'}`,
            flexShrink: 0
          }}>
            <img
              src={resolvedIconUrl}
              alt={item.name}
              loading="lazy"
              decoding="async"
              onError={() => setImgError(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: item.unlocked ? 1 : 0.5,
                filter: item.unlocked ? 'none' : 'grayscale(70%)'
              }}
            />
          </div>
        ) : (
          <div
            title={item.unlocked ? 'Logro desbloqueado' : 'Logro bloqueado'}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: item.unlocked
                ? 'color-mix(in srgb, var(--primary) 18%, var(--bg-card))'
                : 'color-mix(in srgb, var(--bg-card) 90%, black)',
              border: `1px solid ${item.unlocked ? 'var(--primary)' : 'var(--border-color)'}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              gap: '1px'
            }}
          >
            {item.unlocked ? (
              <Trophy size={16} color="var(--primary)" />
            ) : (
              <Award size={15} color="var(--text-muted)" style={{ opacity: 0.7 }} />
            )}
            <span style={{
              fontSize: '0.48rem',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: item.unlocked ? 'var(--primary)' : 'var(--text-muted)',
              lineHeight: 1
            }}>
              {getInitials(item.name)}
            </span>
          </div>
        )}

        {/* 📝 Título y Descripción */}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{
              fontSize: '0.78rem',
              fontWeight: 700,
              color: item.unlocked ? 'var(--text-high)' : 'var(--text-muted)'
            }}>
              {item.name}
            </span>
            {item.isCustom && (
              <span style={{
                fontSize: '0.56rem',
                padding: '1px 5px',
                borderRadius: 'var(--radius-sm)',
                background: 'color-mix(in srgb, var(--accent) 15%, transparent)',
                color: 'var(--accent)',
                fontWeight: 700
              }}>
                MANUAL
              </span>
            )}
          </div>
          {item.description && (
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {item.description}
            </span>
          )}
        </div>
      </div>

      {/* ⚡ Selector / Toggle Táctico de 1-Clic */}
      <div className="gaming-ach-item-right" style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <button
          onClick={() => onToggle(item)}
          title={item.unlocked ? 'Clic para marcar como bloqueado' : 'Clic para desbloquear'}
          className="gaming-ach-toggle-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 9px',
            fontSize: '0.66rem',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${item.unlocked ? 'var(--primary)' : 'var(--border-color)'}`,
            background: item.unlocked
              ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
              : 'transparent',
            color: item.unlocked ? 'var(--primary)' : 'var(--text-muted)',
            cursor: 'pointer'
          }}
        >
          {item.unlocked ? (
            <>
              <CheckCircle2 size={13} color="var(--primary)" />
              <span className="gaming-ach-status-label">Desbloqueado</span>
            </>
          ) : (
            <>
              <Lock size={12} color="var(--text-muted)" />
              <span className="gaming-ach-status-label">Desbloquear</span>
            </>
          )}
        </button>

        {item.isCustom && (
          <button
            onClick={() => onDelete(item.id)}
            className="gaming-ach-delete-btn"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--danger)',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Eliminar logro personalizado"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
