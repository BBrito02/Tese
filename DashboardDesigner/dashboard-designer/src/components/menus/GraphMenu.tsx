import type { KindProps } from './common';
import { TypeField } from './sections';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import type { GraphType } from '../../domain/types';

export default function GraphMenu(p: KindProps) {
  const disabled = p.disabled;
  const gt = (p.node.data as any)?.graphType as GraphType | undefined;
  const GRAPH_TYPES = Object.keys(GRAPH_TYPE_ICONS) as GraphType[];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component type */}
      <TypeField value="Graph" />

      {/* Graph type title */}
      <div style={{ fontWeight: 700, fontSize: 14, marginTop: 8 }}>
        Graph Type
      </div>

      {/* Dropdown with image + label */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        {!disabled ? (
          <>
            {gt && (
              <img
                src={GRAPH_TYPE_ICONS[gt]}
                alt={gt}
                style={{
                  width: 40,
                  height: 40,
                  objectFit: 'contain',
                  borderRadius: 6,
                  background: '#f1f5f9',
                  padding: 4,
                }}
              />
            )}
            <select
              value={gt ?? ''}
              onChange={(e) =>
                p.onChange({ graphType: e.target.value as GraphType })
              }
              style={{
                flex: 1,
                height: 38,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                padding: '0 12px',
                fontWeight: 600,
                background: '#fff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                cursor: 'pointer',
              }}
            >
              <option value="" disabled>
                Select graph type
              </option>
              {GRAPH_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: '#f8fafc',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
            }}
          >
            {gt ? (
              <>
                <img
                  src={GRAPH_TYPE_ICONS[gt]}
                  alt={gt}
                  style={{
                    width: 28,
                    height: 28,
                    objectFit: 'contain',
                    borderRadius: 6,
                    background: '#f1f5f9',
                    padding: 4,
                  }}
                />
                <strong>{gt}</strong>
              </>
            ) : (
              <span style={{ opacity: 0.6 }}>(none)</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
