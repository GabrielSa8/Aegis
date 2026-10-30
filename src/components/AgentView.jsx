import { useState } from 'react';
import ContextManagerModal from './ContextManagerModal';
import MacroManagerModal from './MacroManagerModal';
import RightContextsDock from './navigation/RightContextsDock';
import {
  useAgent,
  AgentHeaderPortal,
  SessionsDrawer,
  TerminalStreamViewport,
  MacroDeck,
  PromptInputBar
} from './agent';

export default function AgentView() {
  const [isRightDockPinned, setIsRightDockPinned] = useState(() => {
    try {
      return localStorage.getItem('aegis_right_dock_pinned') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleRightDockPin = () => {
    setIsRightDockPinned((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('aegis_right_dock_pinned', String(next));
      } catch {}
      return next;
    });
  };

  const {
    contexts,
    selectedContextId,
    activeContext,
    handleSelectContext,
    handleSaveContexts,
    showContextModal,
    setShowContextModal,
    effortMode,
    setEffortMode,
    operatorName,
    prompt,
    setPrompt,
    loading,
    loadingProgress,
    copiedId,
    copyToClipboard,
    expandThoughts,
    setExpandThoughts,
    viewportRef,
    sessions,
    currentSessionId,
    showSessionsDrawer,
    setShowSessionsDrawer,
    selectSession,
    handleNewSession,
    handleDeleteSession,
    messages,
    handlePermissionResponse,
    handleSend,
    clearHistory,
    macros,
    showMacroModal,
    setShowMacroModal,
    handleSaveMacros,
    portalTarget
  } = useAgent();

  return (
    <div className="terminal-stream-container">
      {/* 🧭 Controles de Esfuerzo, Razonamiento, Sesiones y Telemetría en la Barra Superior */}
      <AgentHeaderPortal
        portalTarget={portalTarget}
        effortMode={effortMode}
        onSetEffortMode={setEffortMode}
        expandThoughts={expandThoughts}
        onToggleExpandThoughts={() => setExpandThoughts((prev) => !prev)}
        showSessionsDrawer={showSessionsDrawer}
        onToggleSessionsDrawer={() => setShowSessionsDrawer((prev) => !prev)}
        sessionsCount={sessions.length}
        onClearHistory={clearHistory}
        messages={messages}
      />

      {/* 💬 Central Workspace: Sessions Drawer + Terminal Message Log (Lienzo Borde a Borde) */}
      <div style={{
        display: 'flex',
        flex: 1,
        minHeight: 0,
        gap: '0',
        position: 'relative',
        padding: '0',
        paddingRight: isRightDockPinned ? '60px' : '0',
        transition: 'padding-right 0.25s cubic-bezier(0.34, 1.3, 0.64, 1)'
      }}>
        <SessionsDrawer
          isOpen={showSessionsDrawer}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={selectSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
          onClose={() => setShowSessionsDrawer(false)}
          activeMessagesCount={messages.length}
        />

        <TerminalStreamViewport
          viewportRef={viewportRef}
          messages={messages}
          operatorName={operatorName}
          expandThoughts={expandThoughts}
          copiedId={copiedId}
          onCopy={copyToClipboard}
          onPermissionResponse={handlePermissionResponse}
          loadingProgress={loadingProgress}
        />
      </div>

      {/* 🧭 Dock Derecho Táctico: Perfiles de Contexto de IA */}
      <RightContextsDock
        contexts={contexts}
        selectedContextId={selectedContextId}
        onSelectContext={handleSelectContext}
        onOpenContextModal={() => setShowContextModal(true)}
        isPinned={isRightDockPinned}
        onTogglePin={handleToggleRightDockPin}
      />

      {/* ⚡ Quick Macros Row */}
      <MacroDeck
        macros={macros}
        loading={loading}
        onExecuteMacro={handleSend}
        onOpenMacroModal={() => setShowMacroModal(true)}
      />

      {/* ⌨️ Terminal Command Input Deck */}
      <PromptInputBar
        prompt={prompt}
        onChangePrompt={setPrompt}
        onSubmit={handleSend}
        loading={loading}
        activeContextLabel={activeContext.label}
        effortMode={effortMode}
      />

      {/* ⚙️ Modal Administrador de Contextos */}
      <ContextManagerModal
        isOpen={showContextModal}
        onClose={() => setShowContextModal(false)}
        contexts={contexts}
        onSaveContexts={handleSaveContexts}
        currentContextId={selectedContextId}
        onSelectContext={handleSelectContext}
      />

      {/* ⚡ Modal Administrador de Macros (CRUD) */}
      <MacroManagerModal
        isOpen={showMacroModal}
        onClose={() => setShowMacroModal(false)}
        macros={macros}
        onSaveMacros={handleSaveMacros}
      />
    </div>
  );
}
