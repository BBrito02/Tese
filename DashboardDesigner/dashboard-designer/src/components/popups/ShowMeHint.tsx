// src/components/popups/ShowMeHint.tsx
import React from 'react';
import type { GraphType } from '../../domain/types';
import { GrBladesHorizontal, GrBladesVertical } from 'react-icons/gr';
import { VISUAL_VAR_ICONS } from '../../domain/icons';

/* ------------ Types ------------ */

type PillKind = 'Measure' | 'Dimension' | 'Date' | 'Any';
type Pill = { label: string; kind: PillKind; optional?: boolean };

type ShowSpec = {
  columns?: Pill[];
  rows?: Pill[];
  marks?: {
    color?: Pill[];
    size?: Pill[];
    shape?: Pill[];
    text?: Pill[];
  };
};

/* ------------ Recommendations ------------ */

const REQ: Partial<Record<GraphType, ShowSpec>> = {
  Dispersion: {
    columns: [{ label: 'Measure (X)', kind: 'Measure' }],
    rows: [{ label: 'Measure (Y)', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (group)', kind: 'Dimension', optional: true },
      ],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
      shape: [
        { label: 'Dimension (shape)', kind: 'Dimension', optional: true },
      ],
      text: [{ label: 'Dimension (label)', kind: 'Dimension', optional: true }], // optional labels
    },
  },

  Line: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (series)', kind: 'Dimension', optional: true },
      ],
      text: [
        { label: 'Dimension/Measure (label)', kind: 'Any', optional: true },
      ],
    },
  },

  MultipleLines: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [{ label: 'Dimension (series)', kind: 'Dimension' }],
      text: [
        { label: 'Dimension/Measure (label)', kind: 'Any', optional: true },
      ],
    },
  },

  Area: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (series)', kind: 'Dimension', optional: true },
      ],
      text: [
        { label: 'Dimension/Measure (label)', kind: 'Any', optional: true },
      ],
    },
  },

  Bars: {
    rows: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    columns: [{ label: 'Measure', kind: 'Measure' }],
    marks: {},
  },

  PilledBars: {
    rows: [],
    columns: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [{ label: 'Dimension (stack)', kind: 'Dimension' }],
    },
  },

  Pilled100: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [{ label: 'Dimension (stack)', kind: 'Dimension' }],
      text: [
        { label: 'Measure (percent label)', kind: 'Measure', optional: true },
      ],
    },
  },

  Gantt: {
    columns: [{ label: 'Start date/time', kind: 'Date' }],
    rows: [{ label: 'Task', kind: 'Dimension' }],
    marks: {
      size: [{ label: 'Duration', kind: 'Measure' }],
      color: [
        { label: 'Status / Category', kind: 'Dimension', optional: true },
      ],
      text: [{ label: 'Task name', kind: 'Dimension', optional: true }],
    },
  },

  Dots: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (group)', kind: 'Dimension', optional: true },
      ],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
      text: [{ label: 'Dimension (label)', kind: 'Dimension', optional: true }],
    },
  },

  Map: {
    columns: [{ label: 'Geography', kind: 'Dimension' }],
    rows: [],
    marks: {
      color: [{ label: 'Measure or Dimension', kind: 'Any', optional: true }],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
      text: [
        { label: 'Label (e.g., name)', kind: 'Dimension', optional: true },
      ],
    },
  },

  ColorMap: {
    columns: [{ label: 'Geography', kind: 'Dimension' }],
    rows: [],
    marks: {
      color: [{ label: 'Measure (color scale)', kind: 'Measure' }],
      text: [{ label: 'Label (optional)', kind: 'Any', optional: true }],
    },
  },

  Hexabin: {
    columns: [{ label: 'Longitude', kind: 'Measure' }],
    rows: [{ label: 'Latitude', kind: 'Measure' }],
    marks: {
      color: [{ label: 'Measure (intensity)', kind: 'Measure' }],
      size: [{ label: 'Count / Measure', kind: 'Measure', optional: true }],
      text: [{ label: 'Label (optional)', kind: 'Any', optional: true }],
    },
  },

  // Crosstab: [T] Measure + [list] Dimension (your screenshot)
  Table: {
    columns: [
      { label: 'Column Dimension(s)', kind: 'Dimension', optional: true },
    ],
    rows: [{ label: 'Row Dimension(s)', kind: 'Dimension' }],
    marks: {
      text: [{ label: 'Measure (cell text)', kind: 'Measure' }], // <-- key requirement
    },
  },

  HeatMap: {
    rows: [{ label: 'Dimension (Y)', kind: 'Dimension' }],
    marks: {
      color: [{ label: 'Measure (color)', kind: 'Measure' }],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
    },
  },

  Clock: {
    columns: [{ label: 'Time (hour/min)', kind: 'Date' }],
    rows: [{ label: 'Measure (value)', kind: 'Measure', optional: true }],
    marks: {
      color: [
        { label: 'Dimension (category)', kind: 'Dimension', optional: true },
      ],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
      shape: [
        { label: 'Dimension (shape)', kind: 'Dimension', optional: true },
      ],
      text: [{ label: 'Label (optional)', kind: 'Any', optional: true }],
    },
  },
};

const DEFAULT_SPEC: ShowSpec = {
  columns: [{ label: 'Dimension', kind: 'Dimension' }],
  rows: [{ label: 'Measure', kind: 'Measure' }],
};

/* ------------ Styles (compact) ------------ */

const wrap: React.CSSProperties = { display: 'grid', gap: 6 };
const lead: React.CSSProperties = {
  fontSize: 12,
  color: '#0f172a',
  opacity: 0.9,
};
const line: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '22px auto',
  alignItems: 'center',
  gap: 8,
};

const pillBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const pillColors: Record<PillKind, { bg: string; fg: string; br: string }> = {
  Measure: { bg: '#10b981', fg: '#ffffff', br: '#059669' }, // green
  Dimension: { bg: '#60a5fa', fg: '#ffffff', br: '#3b82f6' }, // blue
  Date: { bg: '#f59e0b', fg: '#ffffff', br: '#d97706' }, // amber
  Any: { bg: '#9ca3af', fg: '#ffffff', br: '#6b7280' }, // gray
};

/* ------------ Helpers ------------ */

function kindPill(kind: PillKind) {
  const c = pillColors[kind];
  return (
    <span
      style={{
        ...pillBase,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.br}`,
        width: 'fit-content',
        gap: 6,
        whiteSpace: 'nowrap',
      }}
    >
      {kind}
    </span>
  );
}

const vvImg = (key: 'Color' | 'Size' | 'Shape' | 'Text') => {
  const src = (VISUAL_VAR_ICONS as any)?.[key];
  if (src) {
    return (
      <img
        src={src}
        alt={key}
        style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.95 }}
      />
    );
  }
  // Fallback tiny "T" for Text if missing
  if (key === 'Text') {
    return (
      <span
        style={{
          width: 18,
          height: 18,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          fontWeight: 900,
          border: '1px solid #e5e7eb',
          borderRadius: 3,
          background: '#fff',
          lineHeight: 1,
        }}
      >
        T
      </span>
    );
  }
  return null;
};

/** Build compact “Show me” line items */
function buildCompact(
  spec: ShowSpec
): Array<{ left: React.ReactNode; kind: PillKind }> {
  const out: Array<{ left: React.ReactNode; kind: PillKind }> = [];
  const first = (xs?: Pill[]) => (xs && xs.length ? xs[0] : undefined);

  // 1) Marks (priority: Size, Color, Text)
  const sizeP = first(spec.marks?.size);
  if (sizeP) out.push({ left: vvImg('Size'), kind: sizeP.kind });

  const colorP = first(spec.marks?.color);
  if (colorP) out.push({ left: vvImg('Color'), kind: colorP.kind });

  const textP = first(spec.marks?.text);
  if (textP) out.push({ left: vvImg('Text'), kind: textP.kind });

  // 2) Always add one axis pill (rows preferred, else columns)
  const rowP = first(spec.rows);
  const colP = first(spec.columns);

  let axis: { left: React.ReactNode; kind: PillKind } | null = null;

  if (rowP) {
    axis = { left: <GrBladesVertical size={18} />, kind: rowP.kind };
  } else if (colP) {
    axis = { left: <GrBladesHorizontal size={18} />, kind: colP.kind };
  }

  if (axis) out.push(axis);

  // 3) Still nothing? fall back
  if (out.length === 0) {
    out.push({ left: <GrBladesVertical size={18} />, kind: 'Measure' });
  }

  return out;
}

/* ------------ Component ------------ */

export function ShowMeHint({ type }: { type: GraphType | undefined }) {
  const spec = (type && REQ[type]) || DEFAULT_SPEC;
  const compact = buildCompact(spec);

  return (
    <div style={wrap}>
      <div style={lead}>
        for {String(type ?? 'this chart').toLowerCase()} use:
      </div>
      {compact.map((rowItem, i) => (
        <div key={i} style={line}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.9,
            }}
          >
            {rowItem.left}
          </div>
          {kindPill(rowItem.kind)}
        </div>
      ))}
    </div>
  );
}
