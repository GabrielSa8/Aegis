import {
  useSentinel,
  useMaintenance,
  useAutostart,
  SentinelHeader,
  SystemAlertsBanner,
  HardwareGrid,
  AegisProcessFootprint,
  ProcessManagerSection,
  MaintenanceSection,
  AutostartCard
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

  const {
    cleanReport,
    scanningDisk,
    purgingTargetId,
    purgingAll,
    purgeFeedback,
    scanDisk,
    purgeTarget,
    purgeAll,
    updatesReport,
    checkingUpdates,
    launchingUpdate,
    copiedCommand,
    checkUpdates,
    copyUpdateCommand,
    launchSystemUpdate
  } = useMaintenance();

  const {
    autostartItems,
    loadingAutostart,
    togglingItemId,
    fetchAutostart,
    toggleAutostart,
    feedback: autostartFeedback
  } = useAutostart();

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

      {/* 🛠️ Mantenimiento del Sistema & Limpiador de Disco (Fase 6.3) */}
      <MaintenanceSection
        cleanReport={cleanReport}
        scanningDisk={scanningDisk}
        purgingTargetId={purgingTargetId}
        purgingAll={purgingAll}
        purgeFeedback={purgeFeedback}
        onScanDisk={scanDisk}
        onPurgeTarget={purgeTarget}
        onPurgeAll={purgeAll}
        updatesReport={updatesReport}
        checkingUpdates={checkingUpdates}
        launchingUpdate={launchingUpdate}
        copiedCommand={copiedCommand}
        onCheckUpdates={checkUpdates}
        onCopyUpdateCommand={copyUpdateCommand}
        onLaunchUpdate={launchSystemUpdate}
      />

      {/* 🚀 Gestor de Arranque (Fase 6.4) */}
      <AutostartCard
        items={autostartItems}
        loading={loadingAutostart}
        togglingItemId={togglingItemId}
        feedback={autostartFeedback}
        onRefresh={fetchAutostart}
        onToggle={toggleAutostart}
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
