import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  FolderSync, 
  Search, 
  PackageCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  HardDrive,
  Laptop
} from 'lucide-react';

export default function GameSavesTab({ game, isSteam }) {
  const [saveRecord, setSaveRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packaging, setPackaging] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const gameId = isSteam ? `steam:${game.appId}` : (game.id || game.gameId);
  const gameTitle = game.name || game.title || 'Juego';
  const appId = game.appId ? String(game.appId) : null;

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    invoke('get_or_register_game_save', {
      gameId,
      title: gameTitle,
      appId
    })
      .then((record) => {
        if (mounted) {
          setSaveRecord(record);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error cargando metadatos de save:', err);
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [gameId, gameTitle, appId]);

  const handleAutoDetect = async () => {
    try {
      setLoading(true);
      const detected = await invoke('detect_game_save_path', {
        gameId,
        appId
      });

      if (detected) {
        setSaveRecord((prev) => ({ ...prev, savePath: detected }));
        setFeedback({ type: 'success', message: 'Ruta de partida auto-detectada con éxito' });
      } else {
        setFeedback({ type: 'warning', message: 'No se detectó automáticamente. Ingresa la ruta manualmente.' });
      }
    } catch (e) {
      setFeedback({ type: 'error', message: 'Error detectando ruta: ' + e });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!saveRecord) return;
    try {
      setSaving(true);
      await invoke('update_game_save_config', {
        gameId,
        savePath: saveRecord.savePath || '',
        syncEnabled: Boolean(saveRecord.syncEnabled)
      });
      setFeedback({ type: 'success', message: 'Configuración de sincronización guardada' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Error guardando: ' + e });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handlePackageNow = async () => {
    if (!saveRecord || !saveRecord.savePath) return;
    try {
      setPackaging(true);
      const updated = await invoke('package_game_save', { gameId });
      setSaveRecord(updated);
      setFeedback({ type: 'success', message: 'Partida empaquetada y lista para transferir por LAN' });
    } catch (e) {
      setFeedback({ type: 'error', message: 'Error empaquetando partida: ' + e });
    } finally {
      setPackaging(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        Escaneando rutas y metadatos de partida...
      </div>
    );
  }

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatTimestamp = (ts) => {
    if (!ts || ts === 0) return 'Nunca empaquetado';
    return new Date(ts * 1000).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0' }}>
      {/* 🧭 Banner Informativo */}
      <div style={{
        background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <FolderSync size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-high)' }}>
              Sincronización P2P de Partidas Guardadas
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Replicación automática y respaldos atómicos (.bak) entre PC y Laptop vía LAN
            </div>
          </div>
        </div>

        {/* Toggle Sync */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.76rem', color: 'var(--text-high)' }}>
          <input
            type="checkbox"
            checked={saveRecord?.syncEnabled ?? true}
            onChange={(e) => setSaveRecord({ ...saveRecord, syncEnabled: e.target.checked })}
            style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }}
          />
          <span>Replicar por P2P</span>
        </label>
      </div>

      {/* 📁 Ruta de Save Data */}
      <div style={{
        background: 'var(--bg-main)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-high)' }}>
            Ruta del Directorio o Archivo de Guardado (Save Data)
          </label>
          <button
            onClick={handleAutoDetect}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            <Search size={12} />
            Auto-Detectar Ruta
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={saveRecord?.savePath || ''}
            onChange={(e) => setSaveRecord({ ...saveRecord, savePath: e.target.value })}
            placeholder="Ej: ~/.steam/steam/steamapps/common/Game/save o ruta de Proton"
            style={{
              flex: 1,
              background: 'color-mix(in srgb, var(--bg-card) 80%, black)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '0.76rem',
              color: 'var(--text-high)',
              outline: 'none',
              fontFamily: 'monospace'
            }}
          />
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--primary)',
              border: 'none',
              borderRadius: '8px',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.74rem',
              padding: '0 14px',
              cursor: 'pointer'
            }}
          >
            <Save size={13} />
            {saving ? 'Guardando...' : 'Fijar'}
          </button>
        </div>
      </div>

      {/* 📦 Estado del Paquete y Acciones */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        {/* Metadatos */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-high)', fontWeight: 600 }}>
            <HardDrive size={13} color="var(--primary)" />
            <span>Telemetría de la Partida</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Último empaquetado:</span>
            <span style={{ color: 'var(--text-high)', fontWeight: 500 }}>{formatTimestamp(saveRecord?.lastSavedAt)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Tamaño comprimido:</span>
            <span style={{ color: 'var(--text-high)', fontWeight: 500 }}>{formatBytes(saveRecord?.fileSizeBytes)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Origen actual:</span>
            <span style={{ color: 'var(--text-high)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Laptop size={11} />
              {saveRecord?.deviceSource || 'Local'}
            </span>
          </div>
        </div>

        {/* Botón de Empaquetar / Forzar Sincronización */}
        <div style={{
          background: 'color-mix(in srgb, var(--bg-card) 92%, black)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '8px'
        }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Empaqueta la partida actual para que se replique inmediatamente al conectar con tu otro equipo.
          </div>
          <button
            onClick={handlePackageNow}
            disabled={packaging || !saveRecord?.savePath}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '8px',
              background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
              border: '1px solid var(--primary)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '0.75rem',
              cursor: saveRecord?.savePath ? 'pointer' : 'not-allowed',
              opacity: saveRecord?.savePath ? 1 : 0.5
            }}
          >
            <PackageCheck size={14} />
            {packaging ? 'Empaquetando partida...' : 'Empaquetar Save Ahora'}
          </button>
        </div>
      </div>

      {/* Alertas y Feedback */}
      {feedback && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          fontSize: '0.74rem',
          background: feedback.type === 'error' 
            ? 'color-mix(in srgb, var(--danger) 15%, transparent)' 
            : 'color-mix(in srgb, var(--primary) 15%, transparent)',
          color: feedback.type === 'error' ? 'var(--danger)' : 'var(--primary)',
          border: `1px solid ${feedback.type === 'error' ? 'var(--danger)' : 'var(--primary)'}`
        }}>
          {feedback.type === 'error' ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
