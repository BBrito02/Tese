import type { KindProps } from './common';
import { TypeField } from './sections';
import { GRAPH_TYPE_ICONS } from '../../domain/icons';
import type { GraphType } from '../../domain/types';
import { WhiteField } from './common';

export default function GraphMenu(p: KindProps) {
  const gt = (p.node.data as any)?.graphType as GraphType | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component type */}
      <TypeField value="Graph" />

      {/* Graph type title */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Graph type
        </label>
        {/* Read-only field with inline icon */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            value={gt ?? '(none)'}
            readOnly
            disabled
            style={{
              ...WhiteField,
              width: '100%',
              paddingRight: 40,
              color: '#0f172a',
              opacity: 1,
              fontWeight: 600,
            }}
          />
          {gt && (
            <img
              src={GRAPH_TYPE_ICONS[gt]}
              alt={gt}
              style={{
                position: 'absolute',
                right: 8,
                width: 26,
                height: 26,
                objectFit: 'contain',
                borderRadius: 6,
                background: '#f8fafc',
                padding: 4,
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
