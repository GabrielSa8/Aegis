import { useGateway } from './useGateway';
import GatewayHeaderCard from './GatewayHeaderCard';
import TelegramCredentialsCard from './TelegramCredentialsCard';
import AuthorizedDeviceCard from './AuthorizedDeviceCard';
import GatewayPermissionsCard from './GatewayPermissionsCard';

export default function TelegramGatewaySection() {
  const {
    loading,
    config,
    status,
    botTokenInput,
    setBotTokenInput,
    testingToken,
    tokenValidationResult,
    statusActionLoading,
    handleTestToken,
    handleToggleDaemon,
    handleUpdateGatewayConfig,
    handleGenerateNewPin,
    handleUnpairChat
  } = useGateway();

  if (loading) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
        Cargando estado del Gateway Remoto...
      </div>
    );
  }

  const gw = config?.telegramGateway || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <GatewayHeaderCard
        status={status}
        statusActionLoading={statusActionLoading}
        onToggleDaemon={handleToggleDaemon}
        hasToken={Boolean(botTokenInput.trim())}
      />

      <TelegramCredentialsCard
        botTokenInput={botTokenInput}
        setBotTokenInput={setBotTokenInput}
        testingToken={testingToken}
        tokenValidationResult={tokenValidationResult}
        onTestToken={handleTestToken}
        onSaveToken={(token) => handleUpdateGatewayConfig({ botToken: token })}
      />

      <AuthorizedDeviceCard
        authorizedChatId={status.authorizedChatId}
        pairingCode={status.pairingCode}
        onGenerateNewPin={handleGenerateNewPin}
        onUnpairChat={handleUnpairChat}
      />

      <GatewayPermissionsCard
        gatewayConfig={gw}
        onUpdateConfig={handleUpdateGatewayConfig}
      />
    </div>
  );
}
