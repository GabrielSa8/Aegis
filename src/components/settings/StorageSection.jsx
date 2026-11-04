import { formatBytes } from './settingsHelpers';
import SystemBackupCard from './SystemBackupCard';
import UpdateSettingsCard from './UpdateSettingsCard';

export default function StorageSection({ config, setConfig, storageStats, purgeStatus, onPurgeCaches }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '780px' }}>
      <div>
        <h3 style={{ fontSize: '0.85rem', fontWeight: 800, margin: '0 0 4px 0', color: '#fff' }}>
          Rutas y Almacenamiento Soberano
        </h3>
        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
          Aegis opera sin intermediarios de nube. Todos los datos residen en el sistema local de archivos.
        </p>
      </div>

      {/* Métricas de Almacenamiento */}
      {storageStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Bóveda Obsidian</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--primary)' }}>
              {storageStats.vaultNotesCount} notas .md
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storageStats.vaultPath}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Base de Datos SQLite</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#60a5fa' }}>
              {formatBytes(storageStats.dbSizeBytes)}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {storageStats.dbPath}
            </span>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', display: 'block' }}>Caché Temporal</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fbbf24' }}>
              {formatBytes(storageStats.cacheSizeBytes)}
            </span>
            <button
              onClick={onPurgeCaches}
              style={{
                marginTop: '4px',
                background: 'transparent',
                border: '1px solid var(--border-color)',
                color: 'var(--text-muted)',
                padding: '2px 6px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.64rem',
                cursor: 'pointer'
              }}
            >
              Purgar Cachés
            </button>
          </div>
        </div>
      )}

      {purgeStatus && (
        <span style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
          {purgeStatus}
        </span>
      )}

      {/* Input de Bóveda Obsidian */}
      <div className="form-group">
        <label style={{ fontSize: '0.76rem', fontWeight: 700 }}>
          Ruta Local de la Bóveda de Obsidian
        </label>
        <input
          type="text"
          value={config.vaultPath || ''}
          onChange={(e) => setConfig({ ...config, vaultPath: e.target.value })}
          placeholder="/home/usuario/Documentos/Mi Bóveda"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}
        />
        <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Aegis lee y escribe directamente sobre los archivos Markdown sin sincronizaciones opacas.
        </p>
      </div>

      {/* Respaldo Soberano 3-2-1 */}
      <SystemBackupCard />

      {/* Auto-Actualizaciones de Sistema (G.1.3) */}
      <UpdateSettingsCard />
    </div>
  );
}
