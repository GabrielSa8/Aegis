import React from 'react';
import { formatInline } from './markdownHelpers';

export default function MarkdownTable({ tableLines, onNavigateNote }) {
  if (!tableLines || tableLines.length < 2) return null;

  const parseRow = (row) => row.split('|').slice(1, -1).map((c) => c.trim());
  const headerCells = parseRow(tableLines[0]);
  const isSeparator = /^\|(?:\s*:?-+:?\s*\|)+$/.test(tableLines[1]);
  const dataRows = (isSeparator ? tableLines.slice(2) : tableLines.slice(1)).map(parseRow);

  return (
    <div style={{
      overflowX: 'auto',
      margin: '10px 0',
      borderRadius: 'var(--radius-md, 6px)',
      border: '1px solid var(--border-color, #27272a)'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: '0.8rem',
        background: 'var(--bg-card, #161a19)'
      }}>
        <thead>
          <tr style={{
            background: 'rgba(255, 255, 255, 0.04)',
            borderBottom: '1px solid var(--border-color, #27272a)'
          }}>
            {headerCells.map((cell, ci) => (
              <th
                key={ci}
                style={{
                  padding: '7px 12px',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#34d399',
                  letterSpacing: '0.02em',
                  borderRight: ci < headerCells.length - 1 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none'
                }}
              >
                {formatInline(cell, onNavigateNote)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((r, ri) => (
            <tr
              key={ri}
              style={{
                borderBottom: ri < dataRows.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none',
                background: ri % 2 === 1 ? 'rgba(255, 255, 255, 0.015)' : 'transparent',
                transition: 'background 0.15s ease'
              }}
            >
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  style={{
                    padding: '6px 12px',
                    color: 'var(--text-high)',
                    lineHeight: '1.5',
                    borderRight: ci < r.length - 1 ? '1px solid rgba(255, 255, 255, 0.03)' : 'none'
                  }}
                >
                  {formatInline(cell, onNavigateNote)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
