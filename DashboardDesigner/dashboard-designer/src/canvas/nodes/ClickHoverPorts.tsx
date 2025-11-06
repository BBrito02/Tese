import { Handle, Position } from 'reactflow';

type Props = {
  /** where to place the ports (usually Position.Right) */
  position?: Position;
  /** shared id base so you can distinguish later: 'act' is fine */
  idPrefix?: string;
  /** vertical center in % (50 by default) */
};

/**
 * Renders two small source handles side-by-side (visually stacked),
 * one for click and one for hover. Ids become:
 *   `${idPrefix}:click` and `${idPrefix}:hover`
 */
export default function ClickHoverPorts({
  position = Position.Right,
  idPrefix = 'act',
}: Props) {
  const common = {
    type: 'source' as const,
    position,
    style: { width: 6, height: 6, right: -4 },
  };

  return (
    <>
      {/* Hover (bottom dot) */}
      <Handle
        id={`${idPrefix}:hover`}
        {...common}
        style={{ ...common.style, top: `calc(${50}% - 12px)` }}
        title="Hover"
      />
      {/* Click (top dot) */}
      <Handle
        id={`${idPrefix}:click`}
        {...common}
        style={{ ...common.style, top: `calc(${50}% + 12px)` }}
        title="Click"
      />
    </>
  );
}
