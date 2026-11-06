import { useState } from 'react';
import {
  SettingsHeader,
  SettingsSidebar,
  GeneralHub,
  InterfaceHub,
  AiHub,
  SystemHub,
  ShortcutsModal,
  useSettings
} from './settings';
import { useSecurity } from './security/useSecurity';

export default function SettingsView({ onClose, currentTheme, onThemeChange, isFullView = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showShortcuts, setShowShortcuts] = useState(false);
  const security = useSecurity();
  const {
    activeSection,
    setActiveSection,
    config,
    setConfig,
    storageStats,
    loading,
    isDirty,
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
    handleDiscardChanges,
    handleSaveConfig,
    handlePurgeCaches,
    handleAddRepo,
    handleRemoveRepo,
    handleOpenExternal,
    updateProfile,
    updateNotifications,
    updateTokenBudget
  } = useSettings({ onThemeChange });

  const renderActiveHub = () => {
    if (loading) {
      return (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', padding: '2rem', textAlign: 'center' }}>
          Cargando parámetros del sistema...
        </div>
      );
    }
    if (!config) return null;

    switch (activeSection) {
      case 'general':
      case 'profile':
      case 'devops':
        return (
          <GeneralHub
            config={config}
            setConfig={setConfig}
            updateProfile={updateProfile}
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
      case 'interface':
      case 'appearance':
      case 'gaming':
      case 'notifications':
        return (
          <InterfaceHub
            config={config}
            setConfig={setConfig}
            currentTheme={currentTheme}
            onSelectTheme={handleSelectTheme}
            onScaleChange={handleScaleChange}
            updateNotifications={updateNotifications}
          />
        );
      case 'ai':
        return (
          <AiHub
            config={config}
            setConfig={setConfig}
            updateTokenBudget={updateTokenBudget}
            onOpenExternal={handleOpenExternal}
          />
        );
      case 'system':
      case 'storage':
      case 'security':
      case 'plugins':
      case 'p2p':
      case 'gateway':
      default:
        return (
          <SystemHub
            config={config}
            setConfig={setConfig}
            storageStats={storageStats}
            purgeStatus={purgeStatus}
            onPurgeCaches={handlePurgeCaches}
            security={security}
          />
        );
    }
  };

  const content = (
    <div className="settings-view-container" style={{
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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenShortcuts={() => setShowShortcuts(true)}
        isDirty={isDirty}
        onDiscard={handleDiscardChanges}
      />

      <div className="settings-body-layout" style={{ display: 'flex', flex: 1, minHeight: 0, width: '100%', overflow: 'hidden' }}>
        <SettingsSidebar
          activeSection={activeSection}
          onSelectSection={setActiveSection}
          searchQuery={searchQuery}
        />

        <div className="settings-hub-content" style={{
          flex: 1,
          minWidth: 0,
          overflowY: 'auto',
          padding: '20px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          {renderActiveHub()}
        </div>
      </div>

      {/* Modal Táctico de Atajos Maestros */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );

  if (isFullView) {
    return content;
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 2000 }}>
      <div className="modal-content glass" style={{ maxWidth: '1280px', width: '96%', height: '92vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
        {content}
      </div>
    </div>
  );
}
