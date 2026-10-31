import { memo } from 'react';
import TerminalMessageEntry from './TerminalMessageEntry';

function TerminalStreamViewport({
  viewportRef,
  messages,
  operatorName,
  expandThoughts,
  copiedId,
  onCopy,
  onPermissionResponse,
  loadingProgress,
  onSelectModel
}) {
  return (
    <div 
      ref={viewportRef}
      className="terminal-log-viewport"
    >
      {messages.map((m) => (
        <TerminalMessageEntry
          key={m.id}
          message={m}
          operatorName={operatorName}
          expandThoughts={expandThoughts}
          copiedId={copiedId}
          onCopy={onCopy}
          onPermissionResponse={onPermissionResponse}
          loadingProgress={loadingProgress}
          onSelectModel={onSelectModel}
        />
      ))}
    </div>
  );
}

export default memo(TerminalStreamViewport);
