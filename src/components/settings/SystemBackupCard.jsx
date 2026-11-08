import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { formatBytes } from './settingsHelpers';
import TacticalButton from '../ui/TacticalButton';
import ModalWrapper from '../ui/ModalWrapper';
import { Archive, Download, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function SystemBackupCard() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [includeVault, setIncludeVault] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState(null);
  const [restoring, setRestoring] = useState(false);

  const fetchBackups = useCallback(async () => {
    try {
      setLoading(true);
      const res = await invoke('list_system_backups');
      setBackups(Array.isArray(res) ? res : []);
    } catch (e) {
      console.error('Error listando respaldos:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  const handleCreateBackup = async () => {
    try {
      setLoading(true);
      setStatusMsg('Comprimiendo base de datos y configuración...');
      const res = await invoke('create_system_backup', {
        includeVault,
        customOutputDir: null
      });
      setStatusMsg(`Respaldo creado: ${res.fileName} (${formatBytes(res.fileSizeBytes)})`);
      await fetchBackups();
      setTimeout(() => setStatusMsg(null), 4500);
    } catch (e) {
      setStatusMsg(`Error creando respaldo: ${e}`);
      setTimeout(() => setStatusMsg(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!selectedBackupForRestore) return;
    try {
      setRestoring(true);
      const res = await invoke('restore_system_backup', {
        backupPath: selectedBackupForRestore.filePath
      });
      setStatusMsg(res.message);
      setSelectedBackupForRestore(null);
      setTimeout(() => setStatusMsg(null), 6000);
    } catch (e) {
      setStatusMsg(`Error restaurando: ${e}`);
      setTimeout(() => setStatusMsg(null), 6000);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      padding: '14px',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    }}>
      <div className="settings-card-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Archive size={16} color="var(--primary)" />
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-high)' }}>
              Respaldo Integral 3-2-1 (.aegisbackup)
            </span>
          </div>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
            Empaqueta en un archivo comprimido .tar.gz la base SQLite completa, configuración de usuario y bóveda.
          </p>
        </div>

        <TacticalButton
          variant="primary"
          size="sm"
          icon={Download}
          loading={loading}
          onClick={handleCreateBackup}
        >
          Crear Respaldo 3-2-1
        </TacticalButton>
      </div>

      {/* Opción incluir bóveda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.72rem' }}>
        <input
          type="checkbox"
          id="chkIncludeVault"
          checked={includeVault}
          onChange={(e) => setIncludeVault(e.target.checked)}
          style={{ accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <label htmlFor="chkIncludeVault" style={{ cursor: 'pointer', color: 'var(--text-high)' }}>
          Incluir notas Markdown de la Bóveda Obsidian en el archivo (mayor peso de compresión)
        </label>
      </div>

      {statusMsg && (
        <div style={{
          fontSize: '0.72rem',
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(16, 185, 129, 0.1)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <CheckCircle2 size={14} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Lista de respaldos */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Respaldos Locales Detectados ({backups.length})
          </span>
          <TacticalButton
            variant="ghost"
            size="xs"
            icon={RefreshCw}
            onClick={fetchBackups}
          >
            Actualizar
          </TacticalButton>
        </div>

        {backups.length === 0 ? (
          <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '6px 0' }}>
            No hay respaldos locales generados aún. Haz clic en "Crear Respaldo 3-2-1".
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            maxHeight: '180px',
            overflowY: 'auto'
          }}>
            {backups.map(b => (
              <div
                key={b.filePath}
                className="settings-backup-item-row"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 10px',
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.72rem',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '65%' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-high)', display: 'block' }}>
                    {b.fileName}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)' }}>
                    {b.createdAt} · {formatBytes(b.fileSizeBytes)}
                    {b.manifest?.vaultIncluded ? ` · Bóveda (${b.manifest.vaultNotesCount} notas)` : ' · Base + Config'}
                  </span>
                </div>

                <TacticalButton
                  variant="outline"
                  size="xs"
                  onClick={() => setSelectedBackupForRestore(b)}
                >
                  Restaurar
                </TacticalButton>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de restauración */}
      {selectedBackupForRestore && (
        <ModalWrapper
          isOpen={true}
          onClose={() => setSelectedBackupForRestore(null)}
          title="⚠️ Confirmar Restauración de Respaldo"
          maxWidth="520px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{
              display: 'flex',
              gap: '10px',
              padding: '10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: 'var(--danger)',
              fontSize: '0.74rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <div>
                <strong>Atención:</strong> Esta acción sobrescribirá la base de datos de finanzas y la configuración con los datos contenidos en el archivo:
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', marginTop: '4px', color: 'var(--text-high)' }}>
                  {selectedBackupForRestore.fileName}
                </div>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Se creará automáticamente una copia preventiva <code>.bak</code> de tu base de datos actual antes de la extracción.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <TacticalButton
                variant="ghost"
                onClick={() => setSelectedBackupForRestore(null)}
              >
                Cancelar
              </TacticalButton>
              <TacticalButton
                variant="danger"
                loading={restoring}
                onClick={handleConfirmRestore}
              >
                Proceder con Restauración
              </TacticalButton>
            </div>
          </div>
        </ModalWrapper>
      )}
    </div>
  );
}
