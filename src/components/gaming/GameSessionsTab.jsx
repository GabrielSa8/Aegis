import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Clock, Plus, Calendar, RefreshCw } from 'lucide-react';
import TacticalButton from '../ui/TacticalButton';

export default function GameSessionsTab({ gameId, gameTitle, isSteam, onSessionRecorded }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [manualMinutes, setManualMinutes] = useState('30');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoke('get_game_sessions', { gameId: String(gameId) });
      setSessions(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Error cargando sesiones:', err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleLogManual = async (minutesToAdd) => {
    const mins = parseInt(minutesToAdd, 10);
    if (isNaN(mins) || mins <= 0) return;

    try {
      setActionLoading(true);
      const now = new Date();
      const started = new Date(now.getTime() - mins * 60 * 1000);

      await invoke('record_game_session', {
        gameId: String(gameId),
        gameTitle,
        isSteam: Boolean(isSteam),
        durationSeconds: mins * 60,
        startedAt: started.toISOString(),
        endedAt: now.toISOString()
      });

      fetchSessions();
      if (onSessionRecorded) onSessionRecorded();
    } catch (err) {
      alert(`Error registrando tiempo manual: ${err}`);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0 min';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* ⏱️ Registro Manual Rápido */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 85%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={15} color="var(--primary)" />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Añadir Tiempo Manual
            </span>
          </div>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            ¿Jugaste fuera de Aegis o en consola portátil?
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {['15', '30', '60', '120'].map((m) => (
            <button
              key={m}
              onClick={() => handleLogManual(m)}
              disabled={actionLoading}
              style={{
                padding: '3px 10px',
                fontSize: '0.68rem',
                fontWeight: 600,
                background: 'transparent',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-high)',
                cursor: 'pointer'
              }}
            >
              +{m} min
            </button>
          ))}

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <input
              type="number"
              min="1"
              max="1440"
              value={manualMinutes}
              onChange={(e) => setManualMinutes(e.target.value)}
              style={{
                width: '60px',
                height: '24px',
                fontSize: '0.72rem',
                padding: '0 6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-high)'
              }}
            />
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>min</span>
            <TacticalButton
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => handleLogManual(manualMinutes)}
              disabled={actionLoading}
              style={{ height: '24px' }}
            >
              Añadir
            </TacticalButton>
          </div>
        </div>
      </div>

      {/* 📜 Historial de Sesiones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
          Historial de Sesiones Recientes ({sessions.length})
        </span>
        <button
          onClick={fetchSessions}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          title="Refrescar sesiones"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        maxHeight: '260px',
        overflowY: 'auto',
        paddingRight: '4px'
      }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            Cargando historial de partidas...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.74rem',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-sm)'
          }}>
            No se han registrado sesiones para este título aún.
          </div>
        ) : (
          sessions.map((sess) => (
            <div
              key={sess.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-high)', fontWeight: 600 }}>
                  {formatDate(sess.startedAt)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  fontFamily: 'var(--font-mono)'
                }}>
                  {formatDuration(sess.durationSeconds)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
