import {
  useSentinel,
  SentinelHeader,
  SystemAlertsBanner,
  HardwareGrid,
  AegisProcessFootprint,
  ProcessManagerSection
} from './sentinel';

export default function SentinelView() {
  const {
    telemetry,
    alerts,
    processes,
    cleanMessage,
    loading,
    processSearch,
    setProcessSearch,
    autoRefresh,
    setAutoRefresh,
    isPurging,
    fetchTelemetry,
    handleKillProcess,
    handleCleanMemory,
    statusCfg,
    filteredProcesses,
    maxMemoryMb,
    thermalState,
    formattedUptime
  } = useSentinel();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.75rem', overflowY: 'auto' }}>
      {/* 🧭 Barra de Telemetría Host Compacta */}
      <SentinelHeader
        telemetry={telemetry}
        cleanMessage={cleanMessage}
        isPurging={isPurging}
        onCleanMemory={handleCleanMemory}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={() => setAutoRefresh(!autoRefresh)}
        statusCfg={statusCfg}
        loading={loading}
        onRefresh={fetchTelemetry}
      />

      {/* 🚨 Alertas Proactivas */}
      <SystemAlertsBanner alerts={alerts} />

      {/* 📊 Grid de Métricas Principales de Hardware */}
      <HardwareGrid
        telemetry={telemetry}
        thermalState={thermalState}
      />

      {/* 🛡️ Huella de Proceso Aegis & Host Telemetry */}
      <AegisProcessFootprint
        telemetry={telemetry}
        formattedUptime={formattedUptime}
      />

      {/* ⚡ Gestor de Procesos en Tiempo Real */}
      <ProcessManagerSection
        processes={processes}
        filteredProcesses={filteredProcesses}
        maxMemoryMb={maxMemoryMb}
        processSearch={processSearch}
        onSearchChange={setProcessSearch}
        onKillProcess={handleKillProcess}
      />
    </div>
  );
}
