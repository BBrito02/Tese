import type { KindProps } from './common';
import { WhiteField } from './common';
import { NameField, TypeField } from './sections';

export default function PlaceholderMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Name Section */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Type Section */}
      <TypeField value="Placeholder" />

      {/* Description Section */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: 12,
            opacity: 0.8,
            marginBottom: 6,
          }}
        >
          Description
        </label>
        <textarea
          placeholder="Describe this placeholder"
          value={d.description ?? ''}
          onChange={(e) => p.onChange({ description: e.target.value })}
          disabled={disabled}
          rows={4}
          style={{ ...WhiteField, resize: 'vertical' as const }}
        />
      </div>
    </div>
  );
}
