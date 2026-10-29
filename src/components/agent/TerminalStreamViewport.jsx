import TerminalMessageEntry from './TerminalMessageEntry';

export default function TerminalStreamViewport({
  viewportRef,
  messages,
  operatorName,
  expandThoughts,
  copiedId,
  onCopy,
  onPermissionResponse,
  loadingProgress
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
        />
      ))}
    </div>
  );
}
