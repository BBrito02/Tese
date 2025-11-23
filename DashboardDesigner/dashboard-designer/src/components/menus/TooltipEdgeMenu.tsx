// src/components/menus/TooltipEdgeMenu.tsx
import type { Edge as RFEdge } from 'reactflow';
import EdgesMenu from './EdgesMenu';
import { TypeField, SectionTitle } from './sections';
import {
  LuChartColumnDecreasing,
  LuInfo,
  LuMousePointerClick, // Icon for 'Click'
  LuMousePointer2, // Icon for 'Hover'
} from 'react-icons/lu';

type AppEdge = RFEdge<any>;

type Props = {
  edge: AppEdge;
  sourceTitle?: string;
  targetTitle?: string;
  onDelete?: () => void;
};

export default function TooltipEdgeMenu({
  edge,
  sourceTitle,
  targetTitle,
  onDelete,
}: Props) {
  const data = (edge.data || {}) as any;

  // Simple helper to capitalize the first letter
  const capitalize = (s: string) =>
    typeof s === 'string' && s.length > 0
      ? s.charAt(0).toUpperCase() + s.slice(1)
      : s;

  const label = data.label ?? '';

  // Logic for Activation
  const rawActivation = data.activation ?? 'hover';
  const activationLabel = capitalize(rawActivation);

  // Select the icon based on whether it is 'click' or 'hover'
  const ActivationIcon =
    rawActivation.toLowerCase() === 'click'
      ? LuMousePointerClick
      : LuMousePointer2;

  const fromLabel = sourceTitle ?? edge.source;
  const toLabel = targetTitle ?? edge.target;

  const technicalItems: string[] = [`Edge id · ${edge.id}`];
  if (label) technicalItems.push(`Label · ${label}`);

  return (
    <EdgesMenu>
      {/* Title / header */}
      <div style={{ fontWeight: 700, textAlign: 'center' }}>Tooltip Edge</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SectionTitle>Properties</SectionTitle>
        {/* You can also give the Edge Type an icon if you like, usually LuTag or LuInfo */}
        <TypeField value="Tooltip" label="Edge type" icon={LuInfo} />

        <SectionTitle>Connection</SectionTitle>

        {/* Fixed Icon: Visualization */}
        <TypeField
          value={fromLabel}
          label="Source"
          icon={LuChartColumnDecreasing}
        />

        {/* Fixed Icon: Tooltip */}
        <TypeField value={toLabel} label="Target" icon={LuInfo} />

        {/* Dynamic Icon: Click vs Hover */}
        <TypeField
          value={activationLabel}
          label="Activation"
          icon={ActivationIcon}
        />
      </div>

      {onDelete && (
        <div
          style={{
            marginTop: 'auto',
            paddingTop: 12,
          }}
        >
          <button
            type="button"
            onClick={onDelete}
            style={{
              marginTop: 12,
              width: '100%',
              padding: '8px 10px',
              borderRadius: 8,
              border: '1px solid #ef4444',
              color: '#ef4444',
              background: 'white',
              cursor: 'pointer',
            }}
          >
            Delete tooltip edge
          </button>
        </div>
      )}
    </EdgesMenu>
  );
}
