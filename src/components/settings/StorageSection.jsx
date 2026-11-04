import { formatBytes } from './settingsHelpers';
import SystemBackupCard from './SystemBackupCard';
import UpdateSettingsCard from './UpdateSettingsCard';
import { Database, FileText, Trash2, FolderGit2 } from 'lucide-react';

export default function StorageSection({ config, setConfig, storageStats, purgeStatus, onPurgeCaches }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Cabecera */}
      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-high)' }}>
          Rutas, Almacenamiento & Respaldo Soberano
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Aegis opera sin intermediarios de nube. Todos los datos, bases SQLite y notas Markdown residen en el sistema local.
        </p>
      </div>

      {/* Métricas de Almacenamiento (100% Ancho Fluido) */}
      {storageStats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '12px'
        }}>
          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Bóveda Obsidian</span>
              <FileText size={14} color="var(--primary)" />
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)' }}>
              {storageStats.vaultNotesCount} notas .md
            </span>
            <span
              style={{ fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}
              title={storageStats.vaultPath}
            >
              {storageStats.vaultPath}
            </span>
          </div>

          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Base de Datos SQLite</span>
              <Database size={14} color="var(--accent)" />
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--accent)' }}>
              {formatBytes(storageStats.dbSizeBytes)}
            </span>
            <span
              style={{ fontSize: '0.64rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}
              title={storageStats.dbPath}
            >
              {storageStats.dbPath}
            </span>
          </div>

          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Caché Temporal</span>
              <Trash2 size={14} color="var(--warning)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--warning)' }}>
                {formatBytes(storageStats.cacheSizeBytes)}
              </span>
              <button
                type="button"
                onClick={onPurgeCaches}
                style={{
                  background: 'color-mix(in srgb, var(--warning) 12%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                  color: 'var(--warning)',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.66rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Purgar Cachés
              </button>
            </div>
            {purgeStatus ? (
              <span style={{ fontSize: '0.64rem', color: 'var(--primary)', fontWeight: 600 }}>
                {purgeStatus}
              </span>
            ) : (
              <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                Buffers temporales y caches de telemetría.
              </span>
            )}
          </div>
        </div>
      )}

      {/* Grid de 2 Columnas Tácticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
        gap: '16px',
        alignItems: 'start'
      }}>
        {/* Columna Izquierda: Ruta Vault + Respaldo 3-2-1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Input de Bóveda Obsidian */}
          <div style={{
            background: 'color-mix(in srgb, var(--bg-card) 60%, transparent)',
            padding: '14px 16px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FolderGit2 size={15} color="var(--primary)" />
              <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Ruta Local de la Bóveda de Obsidian
              </label>
            </div>
            <input
              type="text"
              value={config.vaultPath || ''}
              onChange={(e) => setConfig({ ...config, vaultPath: e.target.value })}
              placeholder="/home/usuario/Documentos/Mi Bóveda"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
            />
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: 0, lineHeight: '1.2' }}>
              Aegis lee y escribe directamente sobre los archivos Markdown de la bóveda sin intermediarios.
            </p>
          </div>

          {/* Respaldo Soberano 3-2-1 */}
          <SystemBackupCard />
        </div>

        {/* Columna Derecha: Auto-Actualizaciones de Sistema (G.1.3) */}
        <div>
          <UpdateSettingsCard />
        </div>
      </div>
    </div>
  );
}
