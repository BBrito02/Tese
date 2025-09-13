import { useEffect, useState, type JSX } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from '../domain/types';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
};

type KindProps = {
  node: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  disabled: boolean;
};

/* ---------------- UI helpers (no children) ---------------- */

function TagList({
  items,
  onRemove,
}: {
  items: string[];
  onRemove: (idx: number) => void;
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {items.map((v, i) => (
        <span
          key={`${v}-${i}`}
          style={{
            padding: '3px 8px',
            borderRadius: 999,
            background: '#eef2ff',
            border: '1px solid #c7d2fe',
            fontSize: 12,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {v}
          <button
            onClick={() => onRemove(i)}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
            title="remove"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function ListEditor({
  title,
  items,
  onChange,
  disabled,
  placeholder = 'Press Enter to add',
}: {
  title: string;
  items?: string[];
  onChange: (next: string[]) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  const list = items ?? [];
  return (
    <>
      <div style={{ fontWeight: 700, marginTop: 12, marginBottom: 8 }}>
        {title}
      </div>
      <input
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (!v) return;
            onChange([...list, v]);
            (e.target as HTMLInputElement).value = '';
          }
        }}
        style={{ width: '100%' }}
      />
      <TagList
        items={list}
        onRemove={(i) => {
          const next = [...list];
          next.splice(i, 1);
          onChange(next);
        }}
      />
    </>
  );
}

/* ---------------- Base (shared) ---------------- */

function BaseMenu({ node, onChange, disabled }: KindProps) {
  return (
    <>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Properties</div>

      <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 8 }}>
        ID: {node.id}
      </div>

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Kind
      </label>
      <div style={{ marginBottom: 10 }}>{node.data.kind}</div>

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Title
      </label>
      <input
        value={node.data.title ?? ''}
        onChange={(e) => onChange({ title: e.target.value })}
        disabled={disabled}
        style={{ width: '100%', marginBottom: 10 }}
      />

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Description
      </label>
      <textarea
        value={node.data.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value })}
        disabled={disabled}
        rows={3}
        style={{ width: '100%', marginBottom: 10, resize: 'vertical' }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          fontSize: 12,
          marginBottom: 12,
        }}
      >
        <div>Width: {Math.round(node.width ?? 0)}</div>
        <div>Height: {Math.round(node.height ?? 0)}</div>
      </div>
    </>
  );
}

/* ---------------- Per-kind editors ---------------- */

function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Objectives"
        items={d.objectives}
        onChange={(next) => p.onChange({ objectives: next })}
        disabled={p.disabled}
      />
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function VisualizationMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Objectives"
        items={d.objectives}
        onChange={(next) => p.onChange({ objectives: next })}
        disabled={p.disabled}
      />
      <ListEditor
        title="Data (shown at bottom of component)"
        items={d.data}
        onChange={(next) => p.onChange({ data: next })}
        disabled={p.disabled}
        placeholder="Add data id and press Enter"
      />
      <ListEditor
        title="Tooltips (linked tooltip ids)"
        items={d.tooltips}
        onChange={(next) => p.onChange({ tooltips: next })}
        disabled={p.disabled}
        placeholder="Add tooltip id and press Enter"
      />
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function LegendMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Data (shown at bottom of component)"
        items={d.data}
        onChange={(next) => p.onChange({ data: next })}
        disabled={p.disabled}
        placeholder="Add data id and press Enter"
      />
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function TooltipMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Data (shown at bottom of component)"
        items={d.data}
        onChange={(next) => p.onChange({ data: next })}
        disabled={p.disabled}
        placeholder="Add data id and press Enter"
      />
    </>
  );
}

function ButtonMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Button</div>
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function FilterMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Data (shown at bottom of component)"
        items={d.data}
        onChange={(next) => p.onChange({ data: next })}
        disabled={p.disabled}
        placeholder="Add data id and press Enter"
      />
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <ListEditor
        title="Options (dropdown items)"
        items={d.options}
        onChange={(next) => p.onChange({ options: next })}
        disabled={p.disabled}
        placeholder="Type an option and press Enter"
      />
      <ListEditor
        title="Interactions"
        items={d.interactions}
        onChange={(next) => p.onChange({ interactions: next })}
        disabled={p.disabled}
      />
    </>
  );
}

function DataActionMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Data Action</div>
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Action Type
      </label>
      <select
        value={d.actionType ?? ''}
        onChange={(e) =>
          p.onChange({
            actionType: e.target.value as 'Filtering' | 'Highlight',
          })
        }
        disabled={p.disabled}
        style={{
          width: '100%',
          padding: '6px 8px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          marginBottom: 10,
        }}
      >
        <option value="">—</option>
        <option value="Filtering">Filtering</option>
        <option value="Highlight">Highlight</option>
      </select>

      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Target Data Ref
      </label>
      <input
        value={d.targetDataRef ?? ''}
        onChange={(e) => p.onChange({ targetDataRef: e.target.value })}
        disabled={p.disabled}
        style={{ width: '100%' }}
      />
    </>
  );
}

/* ---------------- Registry ---------------- */

const MENUS: Partial<Record<NodeKind, (p: KindProps) => JSX.Element>> = {
  Dashboard: DashboardMenu,
  Visualization: VisualizationMenu,
  Legend: LegendMenu,
  Tooltip: TooltipMenu,
  Button: ButtonMenu,
  Filter: FilterMenu,
  Parameter: ParameterMenu,
  DataAction: DataActionMenu,
  Placeholder: BaseMenu,
};

/* ---------------- Shell ---------------- */

export default function ComponentsMenu({ node, onChange, onDelete }: Props) {
  const [shouldRender, setShouldRender] = useState(!!node);
  const [visible, setVisible] = useState(!!node);
  const [lastNode, setLastNode] = useState<RFNode<NodeData> | undefined>(node);

  useEffect(() => {
    if (node) {
      setLastNode(node);
      setShouldRender(true);
      requestAnimationFrame(() => setVisible(true));
    } else if (shouldRender) {
      setVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node]);

  const handleTransitionEnd: React.TransitionEventHandler<HTMLElement> = (
    e
  ) => {
    if (e.target !== e.currentTarget) return;
    if (!visible) setShouldRender(false);
  };

  if (!shouldRender) return null;

  const panelNode = node ?? lastNode!;
  const disabled = !node;

  const Menu = MENUS[panelNode.data.kind as NodeKind] ?? BaseMenu;

  return (
    <aside
      onTransitionEnd={handleTransitionEnd}
      style={{
        width: 280,
        borderLeft: '1px solid #e5e7eb',
        background: '#fafafa',
        padding: 12,
        height: 'calc(100vh - 14px)',
        marginRight: 7,
        marginTop: 7,
        marginBottom: 7,
        borderRadius: 20,
        overflow: 'auto',
        transition: 'opacity 180ms ease, transform 200ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(8px)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <Menu node={panelNode} onChange={onChange} disabled={disabled} />

      {onDelete && (
        <button
          onClick={onDelete}
          disabled={disabled}
          style={{
            marginTop: 12,
            width: '100%',
            padding: '8px 10px',
            borderRadius: 8,
            border: '1px solid #ef4444',
            color: '#ef4444',
            background: 'white',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          Delete node
        </button>
      )}
    </aside>
  );
}
