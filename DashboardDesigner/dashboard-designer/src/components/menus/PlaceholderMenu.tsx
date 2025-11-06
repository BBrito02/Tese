import type { KindProps } from './common';
import {
  DescriptionSection,
  NameField,
  SectionTitle,
  TypeField,
} from './sections';

export default function PlaceholderMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      <SectionTitle>Properties</SectionTitle>

      {/* Name Section */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Type Section */}
      <TypeField value="Placeholder" />

      <SectionTitle>Actions</SectionTitle>

      {/* Description Section */}
      <DescriptionSection
        placeholder="Describe this placeholder"
        value={d.description}
        disabled={disabled}
        onChange={(val) => p.onChange({ description: val })}
      />
    </div>
  );
}
