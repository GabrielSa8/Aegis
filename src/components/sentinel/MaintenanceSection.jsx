import React from 'react';
import { Sparkles } from 'lucide-react';
import DiskCleanerCard from './DiskCleanerCard';
import SystemUpdatesCard from './SystemUpdatesCard';

export default function MaintenanceSection({
  cleanReport,
  scanningDisk,
  purgingTargetId,
  purgingAll,
  purgeFeedback,
  onScanDisk,
  onPurgeTarget,
  onPurgeAll,
  updatesReport,
  checkingUpdates,
  launchingUpdate,
  copiedCommand,
  onCheckUpdates,
  onCopyUpdateCommand,
  onLaunchUpdate
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Toast o banner de feedback de purga */}
      {purgeFeedback && (
        <div
          style={{
            padding: '6px 12px',
            borderRadius: '4px',
            fontSize: '0.74rem',
            fontWeight: 600,
            background: 'color-mix(in srgb, var(--primary) 15%, transparent)',
            border: '1px solid color-mix(in srgb, var(--primary) 35%, transparent)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <span>{purgeFeedback}</span>
          </div>
        </div>
      )}

      {/* Grid táctico responsive con las dos tarjetas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '0.75rem'
        }}
      >
        <DiskCleanerCard
          cleanReport={cleanReport}
          scanningDisk={scanningDisk}
          purgingTargetId={purgingTargetId}
          purgingAll={purgingAll}
          onScan={onScanDisk}
          onPurgeTarget={onPurgeTarget}
          onPurgeAll={onPurgeAll}
        />

        <SystemUpdatesCard
          updatesReport={updatesReport}
          checkingUpdates={checkingUpdates}
          launchingUpdate={launchingUpdate}
          copiedCommand={copiedCommand}
          onCheckUpdates={onCheckUpdates}
          onCopyCommand={onCopyUpdateCommand}
          onLaunchUpdate={onLaunchUpdate}
        />
      </div>
    </div>
  );
}
