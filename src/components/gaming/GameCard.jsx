import { useState, memo } from 'react';
import { Gamepad2, Play, Trash2 } from 'lucide-react';

/**
 * Componente Memoizado de Tarjeta de Juego (Zero re-renders innecesarios)
 */
const GameCard = memo(function GameCard({ game, isSteam, onLaunch, onDelete }) {
  const [imgFailed, setImgFailed] = useState(false);
  const coverSrc = isSteam ? game.coverImage : game.bannerUrl;
  const hasCover = Boolean(coverSrc) && !imgFailed;

  return (
    <div
      onClick={() => onLaunch(isSteam ? `steam:${game.appId}` : game.id, isSteam ? null : game.launchType, isSteam ? null : game.launchTarget)}
      style={{
        position: 'relative',
        aspectRatio: '2 / 3',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        background: 'linear-gradient(145deg, #161c19, #0c100e)',
        border: '1px solid var(--border-color)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        willChange: 'transform'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.borderColor = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--border-color)';
      }}
      title={`Lanzar ${game.name || game.title}`}
    >
      {/* Portada Full Image si está disponible */}
      {hasCover ? (
        <img
          src={coverSrc}
          alt={game.name || game.title}
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />
      ) : (
        /* Tarjeta Estilizada Minimalista cuando no hay portada local */
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at center, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0.5) 100%)',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Gamepad2 size={36} color="rgba(255,255,255,0.15)" />
        </div>
      )}

      {/* Tag de Categoría / Tipo en Esquina Superior */}
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '8px',
        background: 'rgba(10, 14, 12, 0.88)',
        padding: '2px 6px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.6rem',
        fontWeight: 700,
        color: isSteam ? '#a7f3d0' : 'var(--primary)',
        border: '1px solid rgba(255,255,255,0.08)',
        zIndex: 2,
        pointerEvents: 'none'
      }}>
        {isSteam ? 'STEAM' : (game.category || 'CUSTOM').toUpperCase()}
      </div>

      {/* Botón Eliminar para juegos personalizados */}
      {!isSteam && onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(game.id);
          }}
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            background: 'rgba(10, 14, 12, 0.88)',
            border: 'none',
            color: '#ef4444',
            cursor: 'pointer',
            padding: '3px 5px',
            borderRadius: 'var(--radius-sm)',
            zIndex: 3
          }}
          title="Eliminar este lanzador"
        >
          <Trash2 size={11} />
        </button>
      )}

      {/* Degradado Inferior & Título Minimalista */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        background: 'linear-gradient(to top, rgba(8,12,10,0.96) 0%, rgba(8,12,10,0.7) 65%, transparent 100%)',
        padding: '12px 10px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 800,
          color: '#fff',
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

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'var(--primary)',
            color: '#052e16',
            padding: '2px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.66rem',
            fontWeight: 800
          }}>
            <Play size={10} fill="#052e16" />
            <span>Jugar</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default GameCard;
