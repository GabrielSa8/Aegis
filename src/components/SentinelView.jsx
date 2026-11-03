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
    history,
    cleanMessage,
    loading,
    processSearch,
    setProcessSearch,
    processSortMode,
    setProcessSortMode,
    zombieCount,
    autoRefresh,
    setAutoRefresh,
    isPurging,
    powerProfileSwitching,
    handleSetPowerProfile,
    fetchTelemetry,
    handleKillProcess,
    handleCleanMemory,
    statusCfg,
    filteredProcesses,
    maxMemoryMb,
    maxCpuPercent,
    maxIoKbs,
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
        powerProfileSwitching={powerProfileSwitching}
        onSetPowerProfile={handleSetPowerProfile}
      />

      {/* 🚨 Alertas Proactivas */}
      <SystemAlertsBanner alerts={alerts} />

      {/* 📊 Grid de Métricas Principales de Hardware */}
      <HardwareGrid
        telemetry={telemetry}
        thermalState={thermalState}
        history={history}
      />

      {/* 🛡️ Huella de Proceso Aegis & Host Telemetry */}
      <AegisProcessFootprint
        telemetry={telemetry}
        formattedUptime={formattedUptime}
      />

      {/* ⚡ Gestor de Procesos en Tiempo Real (Process Killer Avanzado) */}
      <ProcessManagerSection
        processes={processes}
        filteredProcesses={filteredProcesses}
        maxMemoryMb={maxMemoryMb}
        maxCpuPercent={maxCpuPercent}
        maxIoKbs={maxIoKbs}
        processSearch={processSearch}
        onSearchChange={setProcessSearch}
        processSortMode={processSortMode}
        onSortModeChange={setProcessSortMode}
        zombieCount={zombieCount}
        onKillProcess={handleKillProcess}
      />
    </div>
  );
}
