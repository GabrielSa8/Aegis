import { History, ShieldCheck, Download, AlertTriangle, RotateCcw } from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import TacticalButton from '../ui/TacticalButton';

export default function BackupsModal({
  isOpen,
  onClose,
  snapshots,
  onDownloadSnapshot,
  onSelectRestoreSnapshot
}) {
  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Historial de Auto‑Respaldos"
      icon={History}
      maxWidth="550px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          alignItems: 'start', 
          padding: '0.75rem', 
          background: 'rgba(59, 130, 246, 0.1)', 
          border: '1px solid rgba(59, 130, 246, 0.2)', 
          borderRadius: 'var(--radius-md)' 
        }}>
          <ShieldCheck size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: '2px' }} />
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', lineHeight: '1.2rem', margin: 0 }}>
            <strong style={{ color: '#fff' }}>Protección Local Activa:</strong> El almacenamiento persistente está activado. Se guarda un punto de restauración automático diario (últimos 10 días).
          </p>
        </div>

        <div className="snapshots-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {snapshots.length > 0 ? (
            snapshots.map((snap) => (
              <div 
                key={snap.id} 
                className="snapshot-item glass" 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '0.75rem 1rem', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  gap: '10px'
                }}
              >
                <div>
                  <span style={{ fontWeight: '700', fontSize: '0.88rem', color: '#ffffff' }}>
                    Respaldo del {snap.date}
                  </span>
                  <p style={{ fontSize: '0.74rem', color: '#9ca3af', margin: '4px 0 0 0' }}>
                    {snap.transactionsCount} transacciones registradas
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <TacticalButton
                    variant="secondary"
                    size="sm"
                    icon={Download}
                    onClick={() => onDownloadSnapshot(snap)}
                    title="Descargar archivo JSON de esta copia"
                  >
                    Descargar
                  </TacticalButton>
                  <TacticalButton
                    variant="primary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => onSelectRestoreSnapshot(snap.id)}
                    title="Restaurar base de datos a este punto"
                  >
                    Restaurar
                  </TacticalButton>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
              <AlertTriangle size={24} style={{ color: 'var(--warning)', margin: '0 auto 8px auto' }} />
              <p>No hay respaldos automáticos guardados todavía.</p>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
}
