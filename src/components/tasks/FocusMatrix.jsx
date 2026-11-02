import { ConfigurableMatrixQuadrant } from './ConfigurableMatrixQuadrant';

export function FocusMatrix({
  matrixConfig,
  q1Data,
  q2Data,
  q3Data,
  q4Data,
  updateMatrixQuadrant,
  activeHubs,
  availableProjects,
  onToggle,
  onSelectTask
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '0.85rem'
      }}
    >
      <ConfigurableMatrixQuadrant
        quadrantId="q1"
        currentConfig={matrixConfig.q1}
        data={q1Data}
        onConfigChange={(val) => updateMatrixQuadrant('q1', val)}
        activeHubs={activeHubs}
        availableProjects={availableProjects}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
      />
      <ConfigurableMatrixQuadrant
        quadrantId="q2"
        currentConfig={matrixConfig.q2}
        data={q2Data}
        onConfigChange={(val) => updateMatrixQuadrant('q2', val)}
        activeHubs={activeHubs}
        availableProjects={availableProjects}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
      />
      <ConfigurableMatrixQuadrant
        quadrantId="q3"
        currentConfig={matrixConfig.q3}
        data={q3Data}
        onConfigChange={(val) => updateMatrixQuadrant('q3', val)}
        activeHubs={activeHubs}
        availableProjects={availableProjects}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
      />
      <ConfigurableMatrixQuadrant
        quadrantId="q4"
        currentConfig={matrixConfig.q4}
        data={q4Data}
        onConfigChange={(val) => updateMatrixQuadrant('q4', val)}
        activeHubs={activeHubs}
        availableProjects={availableProjects}
        onToggle={onToggle}
        onSelectTask={onSelectTask}
      />
    </div>
  );
}
export default FocusMatrix;
