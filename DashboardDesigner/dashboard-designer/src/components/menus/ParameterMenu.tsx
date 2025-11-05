import type { KindProps } from './common';
import { NameField, TypeField, ListSection, OptionsSection } from './sections';
import type { Interaction } from '../../domain/types';

export default function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  const disabled = p.disabled;

  const options: string[] = d.options ?? [];

  // store is Interaction[], ListSection wants strings -> format them
  const interactions: Interaction[] = Array.isArray(d.interactions)
    ? (d.interactions as Interaction[])
    : [];
  const interactionLabels: string[] = interactions.map((ix) => {
    const tgtCount = Array.isArray(ix.targets) ? ix.targets.length : 0;
    return `${ix.name} · ${ix.trigger}/${ix.result} · ${tgtCount} target${
      tgtCount === 1 ? '' : 's'
    }`;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>MENU</div>

      {/* Component name */}
      <NameField
        value={d.title ?? ''}
        onChange={(val) => p.onChange({ title: val })}
        disabled={disabled}
      />

      {/* Component type */}
      <TypeField value="Parameter" />

      {/* Options (reusable section) */}
      <OptionsSection
        title="Options"
        placeholder="Enter option"
        addTooltip="Add option"
        items={options}
        disabled={disabled}
        onChange={(next) => p.onChange({ options: next })}
      />

      {/* Interaction list (hook up later with a popup or action) */}
      <ListSection
        title="Interaction list"
        items={interactionLabels}
        // onAdd={() => {
        //   window.dispatchEvent(
        //     new CustomEvent('designer:open-interactions', {
        //       detail: { nodeId: p.node.id },
        //     })
        //   );
        // }}
        onAdd={() => {}}
        addTooltip="Add interaction"
        disabled={disabled}
      />
    </div>
  );
}
