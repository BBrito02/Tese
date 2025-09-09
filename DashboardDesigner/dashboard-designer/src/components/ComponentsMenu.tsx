import { useEffect, useState, type JSX } from 'react';
import type { Node as RFNode } from 'reactflow';
import type { NodeData, NodeKind } from '../domain/types';

type Props = {
  node?: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  onDelete?: () => void;
};

const toArr = (s?: string) =>
  (s ?? '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);

type KindProps = {
  node: RFNode<NodeData>;
  onChange: (patch: Partial<NodeData>) => void;
  disabled: boolean;
};

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

function DashboardMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Objectives</div>
      <input
        placeholder="type objective and press Enter"
        disabled={p.disabled}
        onKeyDown={(e) => {
          if (p.disabled) return;
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (!v) return;
            const next = [...(d.objectives ?? []), v];
            p.onChange({ objectives: next });
            (e.target as HTMLInputElement).value = '';
          }
        }}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {[...(d.objectives ?? [])].map((v: string, i: number) => (
          <span
            key={`${v}-${i}`}
            style={{
              padding: '3px 8px',
              borderRadius: 999,
              background: '#eef2ff',
              border: '1px solid #c7d2fe',
              fontSize: 12,
            }}
          >
            {v}{' '}
            <button
              onClick={() => {
                const next = [...(d.objectives ?? [])];
                next.splice(i, 1);
                p.onChange({ objectives: next });
              }}
              disabled={p.disabled}
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
    </>
  );
}

function VisualizationMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Visualization</div>
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Data Ref (node id)
      </label>
      <input
        value={d.dataRef ?? ''}
        onChange={(e) => p.onChange({ dataRef: e.target.value })}
        disabled={p.disabled}
        style={{ width: '100%', marginBottom: 10 }}
      />
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Objectives
      </label>
      <input
        value={(d.objectives ?? []).join(', ')}
        onChange={(e) => p.onChange({ objectives: toArr(e.target.value) })}
        disabled={p.disabled}
        style={{ width: '100%' }}
      />
    </>
  );
}

function ParameterMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Parameter</div>
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Add option
      </label>
      <input
        placeholder="press Enter to add"
        disabled={p.disabled}
        onKeyDown={(e) => {
          if (p.disabled) return;
          if (e.key === 'Enter') {
            const v = (e.target as HTMLInputElement).value.trim();
            if (!v) return;
            const next = [...(d.options ?? []), v];
            p.onChange({ options: next });
            (e.target as HTMLInputElement).value = '';
          }
        }}
        style={{ width: '100%' }}
      />
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
        {[...(d.options ?? [])].map((v: string, i: number) => (
          <span
            key={`${v}-${i}`}
            style={{
              fontSize: 12,
              padding: '3px 8px',
              border: '1px solid #ddd',
              borderRadius: 999,
            }}
          >
            {v}{' '}
            <button
              onClick={() => {
                const next = [...(d.options ?? [])];
                next.splice(i, 1);
                p.onChange({ options: next });
              }}
              disabled={p.disabled}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <label
        style={{ display: 'block', fontSize: 12, opacity: 0.8, marginTop: 10 }}
      >
        Selected
      </label>
      <input
        value={d.selected ?? ''}
        onChange={(e) => p.onChange({ selected: e.target.value })}
        disabled={p.disabled}
        style={{ width: '100%' }}
      />
    </>
  );
}

function FilterMenu(p: KindProps) {
  const d: any = p.node.data;
  return (
    <>
      <BaseMenu {...p} />
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Filter</div>
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Field
      </label>
      <input
        value={d.field ?? ''}
        onChange={(e) => p.onChange({ field: e.target.value })}
        disabled={p.disabled}
        style={{ width: '100%', marginBottom: 10 }}
      />
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Values
      </label>
      <input
        value={(d.values ?? []).join(', ')}
        onChange={(e) => p.onChange({ values: toArr(e.target.value) })}
        disabled={p.disabled}
        style={{ width: '100%' }}
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
      <label style={{ display: 'block', fontSize: 12, opacity: 0.8 }}>
        Label
      </label>
      <input
        value={d.label ?? ''}
        onChange={(e) => p.onChange({ label: e.target.value })}
        disabled={p.disabled}
        style={{ width: '100%' }}
      />
    </>
  );
}

const LegendMenu = BaseMenu;
const TooltipMenu = BaseMenu;
const DataActionMenu = BaseMenu;

const MENUS: Partial<Record<NodeKind, (p: KindProps) => JSX.Element>> = {
  Dashboard: DashboardMenu,
  Visualization: VisualizationMenu,
  Parameter: ParameterMenu,
  Filter: FilterMenu,
  Button: ButtonMenu,
  Legend: LegendMenu,
  Tooltip: TooltipMenu,
  DataAction: DataActionMenu,
};

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
