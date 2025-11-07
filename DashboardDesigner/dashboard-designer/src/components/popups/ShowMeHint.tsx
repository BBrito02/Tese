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
  };
};

/* ------------ Recommendations (same as you had, trimmed for brevity here) ------------ */

const REQ: Partial<Record<GraphType, ShowSpec>> = {
  /* Scatter plot */
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
    },
  },

  /* Single line (time or discrete dimension on X) */
  Line: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (series)', kind: 'Dimension', optional: true },
      ],
    },
  },

  /* Multiple lines = line + a series dimension */
  MultipleLines: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: { color: [{ label: 'Dimension (series)', kind: 'Dimension' }] },
  },

  /* Area (same inputs as line; series optional) */
  Area: {
    columns: [{ label: 'Date or Dimension (X)', kind: 'Any' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (series)', kind: 'Dimension', optional: true },
      ],
    },
  },

  /* Simple bars (discrete category vs measure) */
  Bars: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (group)', kind: 'Dimension', optional: true },
      ],
    },
  },

  /* Stacked bars (requires a stack/group dimension) */
  PilledBars: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: { color: [{ label: 'Dimension (stack)', kind: 'Dimension' }] },
  },

  /* 100% stacked bars (same as stacked; % is a calc) */
  Pilled100: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: { color: [{ label: 'Dimension (stack)', kind: 'Dimension' }] },
  },

  /* Gantt (task by time; duration on size) */
  Gantt: {
    columns: [{ label: 'Start date/time', kind: 'Date' }],
    rows: [{ label: 'Task', kind: 'Dimension' }],
    marks: {
      size: [{ label: 'Duration', kind: 'Measure' }],
      color: [
        { label: 'Status / Category', kind: 'Dimension', optional: true },
      ],
    },
  },

  /* Dot plot (dimension vs measure; optional color/size) */
  Dots: {
    columns: [{ label: 'Dimension (category)', kind: 'Dimension' }],
    rows: [{ label: 'Measure', kind: 'Measure' }],
    marks: {
      color: [
        { label: 'Dimension (group)', kind: 'Dimension', optional: true },
      ],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
    },
  },

  /* Symbol map (needs geographic field) */
  Map: {
    columns: [{ label: 'Geography', kind: 'Dimension' }],
    rows: [],
    marks: {
      color: [{ label: 'Measure or Dimension', kind: 'Any', optional: true }],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
    },
  },

  /* Filled map (choropleth) */
  ColorMap: {
    columns: [{ label: 'Geography', kind: 'Dimension' }],
    rows: [],
    marks: { color: [{ label: 'Measure (color scale)', kind: 'Measure' }] },
  },

  /* Hexbin/density map (lat/lon + intensity) */
  Hexabin: {
    columns: [{ label: 'Longitude', kind: 'Measure' }],
    rows: [{ label: 'Latitude', kind: 'Measure' }],
    marks: {
      color: [{ label: 'Measure (intensity)', kind: 'Measure' }],
      size: [{ label: 'Count / Measure', kind: 'Measure', optional: true }],
    },
  },

  /* Text (label table) */
  Text: {
    columns: [{ label: 'Dimension (label key)', kind: 'Dimension' }],
    rows: [{ label: 'Measure (value)', kind: 'Measure', optional: true }],
    marks: {
      color: [{ label: 'Measure/Dimension', kind: 'Any', optional: true }],
      size: [{ label: 'Measure (font size)', kind: 'Measure', optional: true }],
    },
  },

  /* Crosstab table */
  Table: {
    columns: [
      { label: 'Column Dimension(s)', kind: 'Dimension', optional: true },
    ],
    rows: [{ label: 'Row Dimension(s)', kind: 'Dimension' }],
    marks: {
      color: [
        { label: 'Measure (cell text/heat)', kind: 'Measure', optional: true },
      ],
    },
  },

  /* Heat map (dim × dim with measure on color; size optional) */
  HeatMap: {
    columns: [{ label: 'Dimension (X)', kind: 'Dimension' }],
    rows: [{ label: 'Dimension (Y)', kind: 'Dimension' }],
    marks: {
      color: [{ label: 'Measure (color)', kind: 'Measure' }],
      size: [{ label: 'Measure (size)', kind: 'Measure', optional: true }],
    },
  },

  /* Clock (radial time-of-day; not native in Tableau Show Me — best-effort) */
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
    },
  },
};

const DEFAULT_SPEC: ShowSpec = {
  columns: [{ label: 'Dimension', kind: 'Dimension' }],
  rows: [{ label: 'Measure', kind: 'Measure' }],
};

/* ------------ Styles for the compact look ------------ */

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
        /* REMOVE minWidth */
        width: 'fit-content', // <-- new
        gap: 6,
        whiteSpace: 'nowrap', // <-- prevents wrapping
      }}
    >
      {kind}
    </span>
  );
}

const VVIcon = (k: 'Color' | 'Size' | 'Shape') => (
  <img
    src={VISUAL_VAR_ICONS[k]}
    alt={k}
    style={{ width: 18, height: 18, objectFit: 'contain', opacity: 0.95 }}
  />
);

/**
 * Build a short, flat list like Tableau's:
 *  - Prefer one Size (if exists), one Color (if exists),
 *  - then one Dimension hint (from rows/columns),
 *  - then optionally Date or Measure if that's the primary axis.
 */
function buildCompact(
  spec: ShowSpec
): Array<{ left: React.ReactNode; kind: PillKind }> {
  const out: Array<{ left: React.ReactNode; kind: PillKind }> = [];

  const first = (xs?: Pill[]) => (xs && xs.length ? xs[0] : undefined);

  // marks first (Size, Color)
  const sizeP = first(spec.marks?.size);
  if (sizeP) out.push({ left: VVIcon('Size'), kind: sizeP.kind });

  const colorP = first(spec.marks?.color);
  if (colorP) out.push({ left: VVIcon('Color'), kind: colorP.kind });

  // try to show one Dimension (rows preferred, else columns)
  const rowP = first(spec.rows);
  const colP = first(spec.columns);

  const preferDim =
    rowP?.kind === 'Dimension'
      ? { left: <GrBladesVertical size={18} />, kind: 'Dimension' as PillKind }
      : colP?.kind === 'Dimension'
      ? {
          left: <GrBladesHorizontal size={18} />,
          kind: 'Dimension' as PillKind,
        }
      : null;

  if (preferDim) out.push(preferDim);

  // if nothing yet, fall back to whichever primary axis exists
  if (out.length === 0 && (rowP || colP)) {
    const p = rowP ?? colP!;
    out.push({
      left: rowP ? (
        <GrBladesVertical size={18} />
      ) : (
        <GrBladesHorizontal size={18} />
      ),
      kind: p.kind,
    });
  }

  // still nothing? add a generic Measure as last resort
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
        {/* lowercase like Tableau */}
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
