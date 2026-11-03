import React, { useId } from 'react';

export default function SparklineSvg({
  data = [],
  color = 'var(--primary)',
  height = 32,
  minVal = 0,
  maxVal = null,
  showArea = true
}) {
  const gradientId = useId();

  if (!data || data.length < 2) {
    return (
      <div
        style={{
          height: `${height}px`,
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.65rem',
          color: 'var(--text-muted)'
        }}
      >
        Capturando telemetría...
      </div>
    );
  }

  const effectiveMax = maxVal !== null ? Math.max(...data, maxVal) : Math.max(...data, 1);
  const effectiveMin = minVal !== null ? Math.min(...data, minVal) : Math.min(...data, 0);
  const range = effectiveMax - effectiveMin || 1;

  const w = 100;
  const h = height;
  const paddingY = 4;
  const usableH = h - paddingY * 2;

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * w;
    const clampedVal = Math.min(effectiveMax, Math.max(effectiveMin, val));
    const y = h - paddingY - ((clampedVal - effectiveMin) / range) * usableH;
    return { x, y };
  });

  const linePath = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`, '');
  const areaPath = `${linePath} L ${w},${h} L 0 revolutionary,${h} Z`.replace('revolutionary', '0');

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      style={{
        width: '100%',
        height: `${height}px`,
        overflow: 'hidden',
        display: 'block'
      }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {showArea && (
        <path
          d={areaPath}
          fill={`url(#${gradientId})`}
        />
      )}

      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
