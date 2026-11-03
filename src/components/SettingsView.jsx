import {
  SettingsHeader,
  SettingsSidebar,
  ProfileSection,
  AppearanceSection,
  StorageSection,
  AiBudgetSection,
  DevOpsSection,
  NotificationsSection,
  GamingSection,
  useSettings
} from './settings';

export default function SettingsView({ onClose, currentTheme, onThemeChange, isFullView = false }) {
  const {
    activeSection,
    setActiveSection,
    config,
    setConfig,
    storageStats,
    loading,
    saveStatus,
    purgeStatus,
    newRepoName,
    setNewRepoName,
    newRepoPath,
    setNewRepoPath,
    newRepoRole,
    setNewRepoRole,
    newRepoWarning,
    setNewRepoWarning,
    handleSelectTheme,
    handleScaleChange,
    handleSaveConfig,
    handlePurgeCaches,
    handleAddRepo,
    handleRemoveRepo,
    handleOpenExternal,
    updateProfile,
    updateNotifications,
    updateTokenBudget
  } = useSettings({ onThemeChange });

  const renderActiveSection = () => {
    if (loading) {
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          Cargando parámetros del sistema...
        </div>
      );
    }
    if (!config) return null;

    switch (activeSection) {
      case 'profile':
        return <ProfileSection config={config} updateProfile={updateProfile} />;
      case 'appearance':
        return (
          <AppearanceSection
            config={config}
            currentTheme={currentTheme}
            onSelectTheme={handleSelectTheme}
            onScaleChange={handleScaleChange}
          />
        );
      case 'storage':
        return (
          <StorageSection
            config={config}
            setConfig={setConfig}
            storageStats={storageStats}
            purgeStatus={purgeStatus}
            onPurgeCaches={handlePurgeCaches}
          />
        );
      case 'ai':
        return (
          <AiBudgetSection
            config={config}
            setConfig={setConfig}
            updateTokenBudget={updateTokenBudget}
            onOpenExternal={handleOpenExternal}
          />
        );
      case 'devops':
        return (
          <DevOpsSection
            config={config}
            newRepoName={newRepoName}
            setNewRepoName={setNewRepoName}
            newRepoPath={newRepoPath}
            setNewRepoPath={setNewRepoPath}
            newRepoRole={newRepoRole}
            setNewRepoRole={setNewRepoRole}
            newRepoWarning={newRepoWarning}
            setNewRepoWarning={setNewRepoWarning}
            onAddRepo={handleAddRepo}
            onRemoveRepo={handleRemoveRepo}
          />
        );
      case 'notifications':
        return (
          <NotificationsSection
            config={config}
            setConfig={setConfig}
            updateNotifications={updateNotifications}
          />
        );
      case 'gaming':
        return <GamingSection config={config} setConfig={setConfig} />;
      default:
        return null;
    }
  };

  const content = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      maxWidth: '100%',
      maxHeight: '100%',
      background: 'var(--bg-main)',
      color: 'var(--text-high)',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      <SettingsHeader
        saveStatus={saveStatus}
        onSave={handleSaveConfig}
        onClose={onClose}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        <SettingsSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
        />

        <div style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );

  if (isFullView) {
    return content;
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass" style={{ maxWidth: '920px', width: '92%', height: '88vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  );
}
