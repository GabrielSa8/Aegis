import { useState } from 'react';
import { Wifi, Radio, RefreshCw, CheckCircle2, AlertCircle, Copy, Check, Terminal, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useP2pSync } from './useP2pSync';
import PeerDeviceCard from './PeerDeviceCard';
import LocalDevicePinDeck from './LocalDevicePinDeck';
import PairModal from './PairModal';
import TacticalButton from '../../ui/TacticalButton';
import TacticalBadge from '../../ui/TacticalBadge';

export default function P2pSyncSection() {
  const {
    status,
    loading,
    syncingPeerIp,
    lastSyncResult,
    firewallStatus,
    openFirewallTerminal,
    error,
    toggleSync,
    updateDeviceName,
    generatePin,
    pairDevice,
    replicateWithPeer,
    unpairDevice,
    refreshStatus
  } = useP2pSync();

  const [pairModalPeer, setPairModalPeer] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const isEnabled = status?.enabled ?? false;

  const firewallCmd = 'sudo firewall-cmd --add-port=53317/udp --add-port=53318/tcp --permanent && sudo firewall-cmd --reload';
  const handleCopyCmd = () => {
    navigator.clipboard.writeText(firewallCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* 1. Header con switch principal táctico */}
      <div
        className="settings-card-header-row"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--bg-card) 95%, black)',
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-sm)',
            background: isEnabled ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.03)',
            border: '1px solid ' + (isEnabled ? 'var(--primary)' : 'var(--border-color)'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isEnabled ? 'var(--primary)' : 'var(--text-muted)'
          }}>
            <Radio size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-high)' }}>
                Sincronización P2P (LAN Directa)
              </span>
              <TacticalBadge variant={isEnabled ? 'success' : 'default'} size="sm">
                {isEnabled ? 'ACTIVO' : 'INACTIVO'}
              </TacticalBadge>
            </div>
            <p style={{ margin: '2px 0 0', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Replicación bidireccional cifrada entre PC y Laptop sin nube, servidores centrales ni internet.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {firewallStatus && isEnabled && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TacticalBadge
                variant={firewallStatus.portsOpen ? 'success' : 'warning'}
                size="sm"
                title={firewallStatus.details}
              >
                {firewallStatus.portsOpen ? (
                  <>
                    <ShieldCheck size={11} style={{ marginRight: '4px' }} />
                    PUERTOS OK
                  </>
                ) : (
                  <>
                    <ShieldAlert size={11} style={{ marginRight: '4px' }} />
                    PUERTOS BLOQUEADOS
                  </>
                )}
              </TacticalBadge>
              {!firewallStatus.portsOpen && (
                <TacticalButton
                  variant="ghost"
                  size="sm"
                  onClick={openFirewallTerminal}
                  title="Abrir terminal para autorizar puertos UDP 53317 y TCP 53318 en firewall"
                >
                  <Terminal size={11} style={{ marginRight: '4px' }} />
                  Abrir Puertos
                </TacticalButton>
              )}
            </div>
          )}

          <label className="tactical-switch" style={{ cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={isEnabled}
              disabled={loading}
              onChange={(e) => toggleSync(e.target.checked)}
            />
          </label>
        </div>
      </div>

      {isEnabled && (
        <>
          {/* 2. Tarjeta de Identidad Local & PIN */}
          <LocalDevicePinDeck
            status={status}
            onUpdateName={updateDeviceName}
            onGeneratePin={generatePin}
          />

          {/* 3. Feedback de Última Replicación */}
          {lastSyncResult && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
              border: '1px solid var(--primary)',
              color: 'var(--text-high)',
              fontSize: '0.75rem'
            }}>
              <CheckCircle2 size={16} color="var(--primary)" />
              <span>
                <strong>Sincronización exitosa con {lastSyncResult.peerIp}:</strong> Recibidos {lastSyncResult.itemsReceived} elementos · Enviados {lastSyncResult.itemsSent} elementos ({lastSyncResult.durationMs}ms).
              </span>
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.75rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--danger) 10%, transparent)',
              border: '1px solid var(--danger)',
              color: 'var(--danger)',
              fontSize: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
              {error.includes('firewall') && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)',
                  gap: '0.5rem',
                  marginTop: '2px'
                }}>
                  <code style={{ fontSize: '0.68rem', color: 'var(--text-high)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
                    {firewallCmd}
                  </code>
                  <TacticalButton variant="ghost" size="sm" onClick={handleCopyCmd} title="Copiar comando al portapapeles">
                    {copiedCmd ? <Check size={12} color="var(--primary)" /> : <Copy size={12} />}
                    {copiedCmd ? 'Copiado' : 'Copiar'}
                  </TacticalButton>
                </div>
              )}
            </div>
          )}

          {/* 4. Radar de Dispositivos en la Subred Local */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Wifi size={14} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-high)' }}>
                  DISPOSITIVOS DESCUBIERTOS EN LA LAN ({status?.discoveredPeers?.length || 0})
                </span>
              </div>
              <TacticalButton variant="ghost" size="sm" onClick={refreshStatus}>
                <RefreshCw size={11} style={{ marginRight: '4px' }} />
                Escanear Ahora
              </TacticalButton>
            </div>

            {status?.discoveredPeers?.length === 0 ? (
              <div style={{
                padding: '2rem 1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px dashed var(--border-color)',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Radio size={24} color="var(--text-muted)" style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-high)', fontWeight: 600 }}>
                  Buscando dispositivos Aegis en tu red local...
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  Asegúrate de que la otra PC o laptop esté conectada a la misma red Wi-Fi y tenga la Sincronización P2P activada en Ajustes.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {status.discoveredPeers.map((peer) => {
                  const trustedMatch = status.trustedDevices?.find(d => d.id === peer.id);
                  return (
                    <PeerDeviceCard
                      key={peer.id}
                      peer={peer}
                      isPaired={peer.isPaired || !!trustedMatch}
                      isSyncing={syncingPeerIp === peer.ip}
                      lastSyncedAt={trustedMatch?.lastSyncedAt}
                      onPair={(p) => setPairModalPeer(p)}
                      onSync={(ip, port) => replicateWithPeer(ip, port)}
                      onUnpair={(id) => unpairDevice(id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de Ingreso de PIN */}
      <PairModal
        peer={pairModalPeer}
        isOpen={!!pairModalPeer}
        onClose={() => setPairModalPeer(null)}
        onConfirmPair={pairDevice}
      />
    </div>
  );
}
