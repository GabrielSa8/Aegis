import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Star, BookOpen, ExternalLink, Save, Check } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function GameReviewTab({ gameId, gameTitle, isSteam, gameStats, onReviewSaved }) {
  const [rating, setRating] = useState(gameStats?.rating || 0);
  const [review, setReview] = useState(gameStats?.review || '');
  const [syncToObsidian, setSyncToObsidian] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (gameStats) {
      setRating(gameStats.rating || 0);
      setReview(gameStats.review || '');
    }
  }, [gameStats]);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await invoke('save_game_review_and_sync', {
        gameId: String(gameId),
        gameTitle,
        isSteam: Boolean(isSteam),
        rating: Number(rating),
        review: review.trim() || null,
        syncToObsidian
      });
      setStatusMsg({ type: 'success', text: res });
      setTimeout(() => setStatusMsg(null), 4000);
      if (onReviewSaved) onReviewSaved();
    } catch (err) {
      setStatusMsg({ type: 'error', text: `Error guardando reseña: ${err}` });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenInVault = () => {
    if (!gameStats?.obsidianNotePath) return;
    window.dispatchEvent(
      new CustomEvent('aegis:open-vault-note', {
        detail: { path: gameStats.obsidianNotePath }
      })
    );
  };

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* ⭐ Calificación Táctica */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={15} color="var(--accent)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
            Puntuación Personal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '2px',
                fontSize: '1.1rem',
                opacity: s <= rating ? 1 : 0.25,
                transition: 'opacity 0.15s ease'
              }}
              title={`${s} estrella${s > 1 ? 's' : ''}`}
            >
              ⭐
            </button>
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 700 }}>
            {rating > 0 ? `${rating}/5` : 'Sin calificar'}
          </span>
        </div>
      </div>

      {/* 📝 Textarea de Reseña e Impresiones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <label style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            Bitácora, Reseña & Notas de Juego
          </label>
          {gameStats?.obsidianNotePath && (
            <button
              type="button"
              onClick={handleOpenInVault}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontSize: '0.66rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ExternalLink size={11} />
              Ver en Bóveda
            </button>
          )}
        </div>

        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Escribe tus impresiones sobre el juego, rendimiento, historia, mecánicas o builds favoritas..."
          rows={6}
          style={{
            width: '100%',
            padding: '8px 10px',
            fontSize: '0.74rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-high)',
            resize: 'vertical',
            lineHeight: 1.45,
            fontFamily: 'inherit'
          }}
        />
      </div>

      {/* 📓 Sincronización con Obsidian */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        background: 'color-mix(in srgb, var(--primary) 6%, transparent)',
        border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
        borderRadius: 'var(--radius-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={13} color="var(--primary)" />
          <span style={{ fontSize: '0.68rem', color: 'var(--text-high)' }}>
            Sincronizar a <code>03 Personal y Ocio/Gaming/</code> en Obsidian
          </span>
        </div>
        <input
          type="checkbox"
          checked={syncToObsidian}
          onChange={(e) => setSyncToObsidian(e.target.checked)}
          style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
        />
      </div>

      {/* Feedback status */}
      {statusMsg && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.68rem',
          fontWeight: 600,
          background: statusMsg.type === 'success'
            ? 'color-mix(in srgb, var(--primary) 15%, transparent)'
            : 'color-mix(in srgb, var(--danger) 15%, transparent)',
          color: statusMsg.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          border: `1px solid ${statusMsg.type === 'success' ? 'var(--primary)' : 'var(--danger)'}`
        }}>
          {statusMsg.text}
        </div>
      )}

      {/* Botón Guardar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
        <TacticalButton
          variant="primary"
          size="sm"
          type="submit"
          icon={saving ? Check : Save}
          disabled={saving}
          style={{ height: '28px' }}
        >
          {saving ? 'Guardando...' : 'Guardar Reseña & Bitácora'}
        </TacticalButton>
      </div>
    </form>
  );
}
