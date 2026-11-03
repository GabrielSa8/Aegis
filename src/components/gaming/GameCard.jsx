import React, { useState, memo } from 'react';
import { Gamepad2, Play } from 'lucide-react';
import { formatPlayDuration } from './gameHelpers';
import GameCardHeaderBadges from './GameCardHeaderBadges';
import GameCardFooterMeta from './GameCardFooterMeta';

const GameCard = memo(function GameCard({
  game,
  isSteam,
  gameStats,
  onLaunch,
  onDelete,
  onOpenDetails
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const coverSrc = isSteam ? game.coverImage : game.bannerUrl;
  const hasCover = Boolean(coverSrc) && !imgFailed;

  const totalSecs = gameStats?.totalPlayTimeSeconds || 0;
  const rating = gameStats?.rating || 0;
  const achUnlocked = gameStats?.achievementsUnlocked ?? game.achievementsUnlocked ?? 0;
  const achTotal = gameStats?.achievementsTotal ?? game.achievementsTotal ?? 0;
  const playtimeStr = formatPlayDuration(totalSecs);

  return (
    <div
      style={{
        position: 'relative',
        aspectRatio: '2 / 3',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
        border: '1px solid var(--border-color)',
        transition: 'transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        willChange: 'transform'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 6px 14px color-mix(in srgb, var(--primary) 15%, transparent)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Portada Full Image si está disponible */}
      {hasCover ? (
        <img
          src={coverSrc}
          alt={game.name || game.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, color-mix(in srgb, var(--primary) 12%, transparent) 0%, color-mix(in srgb, var(--bg-card) 95%, black) 100%)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Gamepad2 size={36} color="var(--text-muted)" style={{ opacity: 0.3 }} />
        </div>
      )}

      {/* Badges Superiores (Tag, Acciones, Contador de Logros) */}
      <GameCardHeaderBadges
        game={game}
        isSteam={isSteam}
        achUnlocked={achUnlocked}
        achTotal={achTotal}
        onDelete={onDelete}
        onOpenDetails={onOpenDetails}
      />

      {/* Degradado Inferior & Título Minimalista */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(to top, color-mix(in srgb, var(--bg-card) 96%, black) 0%, color-mix(in srgb, var(--bg-card) 75%, transparent) 70%, transparent 100%)',
        padding: '12px 10px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* Metadatos Tácticos (Horas + Logros + Rating) */}
        <GameCardFooterMeta
          playtimeStr={playtimeStr}
          achUnlocked={achUnlocked}
          achTotal={achTotal}
          rating={rating}
        />

        <span style={{
          fontSize: '0.8rem',
          fontWeight: 800,
          color: 'var(--text-high)',
          lineHeight: '1.15',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical'
        }}>
          {game.name || game.title}
        </span>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '2px'
        }}>
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
            {isSteam
              ? (game.sizeMb > 1024 ? `${(game.sizeMb / 1024).toFixed(1)} GB` : `${game.sizeMb} MB`)
              : (game.launchType ? game.launchType.toUpperCase() : 'URL')}
          </span>

          <button
            onClick={() => onLaunch(
              isSteam ? `steam:${game.appId}` : game.id,
              isSteam ? null : game.launchType,
              isSteam ? null : game.launchTarget,
              game.name || game.title,
              isSteam
            )}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'var(--primary)',
              color: 'var(--bg-card)',
              padding: '2px 8px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.66rem',
              fontWeight: 800,
              border: 'none',
              cursor: 'pointer',
              transition: 'filter 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            title={`Lanzar ${game.name || game.title}`}
          >
            <Play size={10} fill="currentColor" />
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
});

export default GameCard;
