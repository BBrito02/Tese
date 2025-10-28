import type { KindProps } from './common';
import { TypeField } from './sections';
import { VISUAL_VAR_ICONS } from '../../domain/icons';
import type { VisualVariable } from '../../domain/types';
import { WhiteField } from './common';

export default function VisualVariableMenu(p: KindProps) {
  const vv = (p.node.data as any)?.variable as VisualVariable | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component type */}
      <TypeField value="Visual Variable" />

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
            value={vv ?? '(none)'}
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
          {vv && (
            <img
              src={VISUAL_VAR_ICONS[vv]}
              alt={vv}
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
