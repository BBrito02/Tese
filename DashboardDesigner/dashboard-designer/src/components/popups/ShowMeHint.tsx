import React from 'react';
import type { GraphType } from '../../domain/types';
import { GrBladesHorizontal, GrBladesVertical } from 'react-icons/gr';
import { VISUAL_VAR_ICONS } from '../../domain/icons';

/* ------------ Types ------------ */

// "Continuous" = Green (Measures/Axes)
// "Discrete"   = Blue (Headers/Buckets)
type PillKind = 'Continuous' | 'Discrete' | 'Date' | 'Any';

type Pill = {
  label: string;
  kind: PillKind;
  optional?: boolean;
};

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

/* ------------ Recommendations (Audited) ------------ */

const REQ: Partial<Record<GraphType, ShowSpec>> = {
  /* --- XY PLOTS --- */

  Dispersion: {
    // Scatter Plot: Needs two numerical axes to show correlation.
    columns: [{ label: 'Continuous (X)', kind: 'Continuous' }],
    rows: [{ label: 'Continuous (Y)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Group)', kind: 'Discrete', optional: true }],
      size: [
        { label: 'Continuous (Size)', kind: 'Continuous', optional: true },
      ],
    },
  },

  Hexabin: {
    // Density Plot: Needs two numerical coordinates.
    columns: [{ label: 'Continuous (X)', kind: 'Continuous' }],
    rows: [{ label: 'Continuous (Y)', kind: 'Continuous' }],
    marks: {
      color: [
        { label: 'Continuous (Density)', kind: 'Continuous', optional: true },
      ], // Often auto-calculated
    },
  },

  /* --- TIME / TRENDS --- */

  Line: {
    // Line Chart: Needs an ordered X axis (Time or Number) and a Measure.
    columns: [{ label: 'Date or Continuous', kind: 'Date' }],
    rows: [{ label: 'Continuous (Y)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Series)', kind: 'Discrete', optional: true }],
    },
  },

  MultipleLines: {
    // Multi-Line: STRICTLY requires a Date, a Value, and a Splitter (Color).
    columns: [{ label: 'Date or Continuous', kind: 'Date' }],
    rows: [{ label: 'Continuous (Y)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Break by)', kind: 'Discrete' }],
    },
  },

  Area: {
    // Area Chart: Similar to line, implies volume.
    columns: [{ label: 'Date or Continuous', kind: 'Date' }],
    rows: [{ label: 'Continuous (Y)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Stack)', kind: 'Discrete', optional: true }],
    },
  },

  Gantt: {
    // Gantt: Needs Start Time, Categorical Task, and Duration.
    columns: [{ label: 'Date (Start)', kind: 'Date' }],
    rows: [{ label: 'Discrete (Task)', kind: 'Discrete' }],
    marks: {
      size: [{ label: 'Continuous (Duration)', kind: 'Continuous' }],
      color: [{ label: 'Discrete (Status)', kind: 'Discrete', optional: true }],
    },
  },

  Clock: {
    // Radial/Rose: usually Time on circle, Value on radius.
    columns: [{ label: 'Date / Time', kind: 'Date' }],
    rows: [{ label: 'Continuous (Radius)', kind: 'Continuous' }],
    marks: {
      color: [
        { label: 'Discrete (Category)', kind: 'Discrete', optional: true },
      ],
    },
  },

  /* --- CATEGORICAL COMPARISON --- */

  Bars: {
    // Standard Bar: Comparison of categories.
    rows: [{ label: 'Discrete (Category)', kind: 'Discrete' }],
    columns: [{ label: 'Continuous (Length)', kind: 'Continuous' }],
  },

  PilledBars: {
    // Stacked Bar: Needs Category Axis + Stack Group + Length.
    rows: [{ label: 'Discrete (Category)', kind: 'Discrete' }],
    columns: [{ label: 'Continuous (Length)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Stack group)', kind: 'Discrete' }],
    },
  },

  Pilled100: {
    // 100% Stacked: Same as stacked, visualization engine handles normalization.
    rows: [{ label: 'Discrete (Category)', kind: 'Discrete' }],
    columns: [{ label: 'Continuous (Length)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Stack group)', kind: 'Discrete' }],
    },
  },

  Dots: {
    // Cleveland Dot Plot: 1 Categorical, 1 Continuous.
    rows: [{ label: 'Discrete (Category)', kind: 'Discrete' }],
    columns: [{ label: 'Continuous (Position)', kind: 'Continuous' }],
    marks: {
      color: [{ label: 'Discrete (Group)', kind: 'Discrete', optional: true }],
    },
  },

  /* --- GEOSPATIAL --- */

  Map: {
    // Symbol Map: Dots on a map. Needs Geo + optional size/color.
    columns: [{ label: 'Discrete (Geo/Country)', kind: 'Discrete' }],
    rows: [],
    marks: {
      size: [
        { label: 'Continuous (Size)', kind: 'Continuous', optional: true },
      ],
      color: [{ label: 'Any (Color)', kind: 'Any', optional: true }],
    },
  },

  ColorMap: {
    // Choropleth (Filled Map): Needs Geo + Value determines color.
    columns: [{ label: 'Discrete (Geo/Country)', kind: 'Discrete' }],
    rows: [],
    marks: {
      color: [{ label: 'Continuous (Value)', kind: 'Continuous' }],
    },
  },

  /* --- MATRICES --- */

  Table: {
    // Crosstab: Rows + Text. Columns are optional but common.
    rows: [{ label: 'Discrete (Row)', kind: 'Discrete' }],
    columns: [{ label: 'Discrete (Column)', kind: 'Discrete', optional: true }],
    marks: {
      text: [{ label: 'Any (Value)', kind: 'Any' }],
    },
  },

  HeatMap: {
    // Matrix Heatmap: X vs Y density.
    rows: [{ label: 'Discrete (Y)', kind: 'Discrete' }],
    columns: [{ label: 'Discrete (X)', kind: 'Discrete' }],
    marks: {
      color: [{ label: 'Continuous (Intensity)', kind: 'Continuous' }],
    },
  },
};

const DEFAULT_SPEC: ShowSpec = {
  columns: [{ label: 'Discrete', kind: 'Discrete' }],
  rows: [{ label: 'Continuous', kind: 'Continuous' }],
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
  Continuous: { bg: '#10b981', fg: '#ffffff', br: '#059669' }, // Green
  Discrete: { bg: '#3b82f6', fg: '#ffffff', br: '#2563eb' }, // Blue
  Date: { bg: '#f59e0b', fg: '#ffffff', br: '#d97706' }, // Amber
  Any: { bg: '#9ca3af', fg: '#ffffff', br: '#6b7280' }, // Gray
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

  // 2) Axes
  const rowP = first(spec.rows);
  const colP = first(spec.columns);

  // Logic: If we have both, show both. If only one, show it.
  // If it's a map (no rows), show columns (Geo).
  if (colP) {
    // For charts where Column is the main Dimension (like Line/Bar)
    out.push({ left: <GrBladesHorizontal size={18} />, kind: colP.kind });
  }
  if (rowP) {
    out.push({ left: <GrBladesVertical size={18} />, kind: rowP.kind });
  }

  // 3) Fallback
  if (out.length === 0) {
    out.push({ left: <GrBladesVertical size={18} />, kind: 'Continuous' });
  }

  return out;
}

/* ------------ Component ------------ */

export function ShowMeHint({ type }: { type: GraphType | undefined }) {
  // If no type is hovered, we can return null or a placeholder.
  // The parent component handles the "Show me -" title.
  if (!type) return null;

  const spec = REQ[type] || DEFAULT_SPEC;
  const compact = buildCompact(spec);

  return (
    <div style={wrap}>
      <div style={lead}>Minimum requirements:</div>
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
