import React from 'react';
import AiBudgetSection from '../AiBudgetSection';

export function AiHub({ config, setConfig, updateTokenBudget, onOpenExternal }) {
  if (!config) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <AiBudgetSection
        config={config}
        setConfig={setConfig}
        updateTokenBudget={updateTokenBudget}
        onOpenExternal={onOpenExternal}
      />
    </div>
  );
}
export default AiHub;
