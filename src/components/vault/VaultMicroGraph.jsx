import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Compass, Maximize2, Minimize2 } from 'lucide-react';

/**
 * VaultMicroGraph — Micro-Grafo local interactivo con Pan & Zoom fluido,
 * arrastre directo por ratón, zoom por rueda y modo maximizado.
 */
export function VaultMicroGraph({
  network,
  degreeFilter,
  setDegreeFilter,
  onSelectNote,
  isMaximized,
  onToggleMaximize
}) {
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredNodeId, setHoveredNodeId] = useState(null);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const panStartRef = useRef({ x: 0, y: 0 });
  const didMoveRef = useRef(false);

  const width = isMaximized ? 1100 : 800;
  const height = isMaximized ? 600 : 240;
  const cx = width / 2;
  const cy = height / 2;

  const filteredNodes = useMemo(() => {
    if (!network?.nodes) return [];
    return degreeFilter === 1 ? network.nodes.filter((n) => n.degree <= 1) : network.nodes;
  }, [network?.nodes, degreeFilter]);

  const layout = useMemo(() => {
    const nodePosMap = new Map();
    const d0Nodes = filteredNodes.filter((n) => n.degree === 0);
    const d1Nodes = filteredNodes.filter((n) => n.degree === 1);
    const d2Nodes = filteredNodes.filter((n) => n.degree === 2);

    d0Nodes.forEach((n) => nodePosMap.set(n.id, { ...n, x: cx, y: cy, r: isMaximized ? 18 : 14 }));

    const rx1 = isMaximized ? 260 : 160, ry1 = isMaximized ? 140 : 70;
    const step1 = (Math.PI * 2) / (d1Nodes.length || 1);
    d1Nodes.forEach((n, i) => {
      const angle = i * step1 - Math.PI / 2;
      nodePosMap.set(n.id, { ...n, x: cx + rx1 * Math.cos(angle), y: cy + ry1 * Math.sin(angle), r: isMaximized ? 12 : 9 });
    });

    const rx2 = isMaximized ? 460 : 280, ry2 = isMaximized ? 240 : 95;
    const step2 = (Math.PI * 2) / (d2Nodes.length || 1);
    d2Nodes.forEach((n, i) => {
      const angle = i * step2 - Math.PI / 2 + Math.PI / (d2Nodes.length || 2);
      nodePosMap.set(n.id, { ...n, x: cx + rx2 * Math.cos(angle), y: cy + ry2 * Math.sin(angle), r: isMaximized ? 8 : 5 });
    });

    const validEdges = (network?.edges || [])
      .filter((e) => nodePosMap.has(e.source) && nodePosMap.has(e.target))
      .map((e) => ({ ...e, sourcePos: nodePosMap.get(e.source), targetPos: nodePosMap.get(e.target) }));

    return { nodes: Array.from(nodePosMap.values()), edges: validEdges };
  }, [filteredNodes, network?.edges, cx, cy, isMaximized]);

  // Zoom interactivo no pasivo con rueda de ratón
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.12 : 0.89;
      setZoom((z) => Math.min(Math.max(z * factor, 0.4), 3.5));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Manejo de Pan por arrastre de ratón (Grab & Drag)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    didMoveRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didMoveRef.current = true;
    setPan({ x: panStartRef.current.x + dx, y: panStartRef.current.y + dy });
  };

  const handleMouseUp = () => setIsDragging(false);
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setHoveredNodeId(null); };
  const hoveredNode = useMemo(() => layout.nodes.find((n) => n.id === hoveredNodeId), [layout.nodes, hoveredNodeId]);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: isMaximized ? '100%' : '220px',
        background: 'rgba(0, 0, 0, 0.25)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        userSelect: 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
    >
      {/* Controles Tácticos Superiores */}
      <div
        className="vault-graph-toolbar"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setDegreeFilter((prev) => (prev === 1 ? 2 : 1))}
          className={`vault-graph-btn ${degreeFilter === 2 ? 'is-active' : ''}`}
        >
          <Filter size={11} />
          <span className="vault-graph-btn-label">{degreeFilter === 1 ? '1° Grado' : '1° y 2°'}</span>
        </button>

        <span className="vault-graph-zoom-label">
          {Math.round(zoom * 100)}%
        </span>

        <button onClick={() => setZoom((z) => Math.min(z + 0.2, 3.5))} className="vault-graph-icon-btn" title="Acercar">
          <ZoomIn size={13} />
        </button>
        <button onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))} className="vault-graph-icon-btn" title="Alejar">
          <ZoomOut size={13} />
        </button>
        <button onClick={handleReset} className="vault-graph-icon-btn" title="Centrar">
          <RotateCcw size={13} />
        </button>

        {onToggleMaximize && (
          <button onClick={onToggleMaximize} className="vault-graph-icon-btn is-accent" title={isMaximized ? 'Restaurar' : 'Maximizar'}>
            {isMaximized ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
      </div>

      {hoveredNode && (
        <div className="vault-graph-tooltip">
          <Compass size={12} color="var(--primary)" style={{ flexShrink: 0 }} />
          <strong style={{ color: 'var(--text-high)' }}>{hoveredNode.label}</strong>
          <span style={{ color: 'var(--text-muted)' }}>({hoveredNode.hub})</span>
          <span style={{ color: 'var(--primary)' }}>{hoveredNode.degree === 0 ? 'Activa' : `${hoveredNode.degree}° Grado`}</span>
        </div>
      )}

      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: '100%', display: 'block' }}>
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`} transformOrigin={`${cx}px ${cy}px`}>
          <ellipse cx={cx} cy={cy} rx={isMaximized ? 260 : 160} ry={isMaximized ? 140 : 70} fill="none" stroke="var(--border-color)" strokeDasharray="3 4" opacity="0.35" />
          {degreeFilter === 2 && (
            <ellipse cx={cx} cy={cy} rx={isMaximized ? 460 : 280} ry={isMaximized ? 240 : 95} fill="none" stroke="var(--border-color)" strokeDasharray="2 5" opacity="0.22" />
          )}

          {layout.edges.map((edge, i) => {
            const isHigh = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
            return (
              <line
                key={`edge-${i}`}
                x1={edge.sourcePos.x}
                y1={edge.sourcePos.y}
                x2={edge.targetPos.x}
                y2={edge.targetPos.y}
                stroke={isHigh ? 'var(--primary)' : 'var(--border-color)'}
                strokeWidth={isHigh ? 1.8 : 0.9}
                opacity={isHigh ? 0.9 : 0.45}
                strokeDasharray={edge.direction === 'outgoing' ? 'none' : '3 2'}
              />
            );
          })}

          {layout.nodes.map((node) => {
            const isCenter = node.degree === 0;
            const isHover = hoveredNodeId === node.id;
            const nodeFill = isCenter ? 'var(--primary)' : node.degree === 1 ? 'color-mix(in srgb, var(--primary) 70%, var(--text-high))' : 'var(--text-muted)';
            return (
              <g
                key={`node-${node.id}`}
                onClick={(e) => { e.stopPropagation(); if (!isCenter && !didMoveRef.current) onSelectNote(node.label); }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: isCenter ? 'default' : 'pointer' }}
              >
                {(isCenter || isHover) && <circle cx={node.x} cy={node.y} r={node.r + (isCenter ? 6 : 4)} fill="color-mix(in srgb, var(--primary) 20%, transparent)" />}
                <circle cx={node.x} cy={node.y} r={node.r} fill={nodeFill} stroke="var(--bg-card)" strokeWidth="2" />
                {(isCenter || node.degree === 1 || isHover || isMaximized) && (
                  <text
                    x={node.x}
                    y={node.y + node.r + 11}
                    textAnchor="middle"
                    fill={isCenter ? 'var(--primary)' : isHover ? 'var(--text-high)' : 'var(--text-muted)'}
                    fontSize={isCenter ? '0.74rem' : '0.64rem'}
                    fontWeight={isCenter || isHover ? '700' : '500'}
                    fontFamily="monospace"
                    style={{ pointerEvents: 'none' }}
                  >
                    {node.label.length > 20 ? `${node.label.slice(0, 18)}…` : node.label}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export default VaultMicroGraph;
