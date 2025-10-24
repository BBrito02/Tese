import React, { createContext, useContext, useMemo, useState } from 'react';
import Modal from './Modal';
import AddComponentPopup from '../popups/ComponentPopup';
import DataPopup from '../popups/DataPopup';
import type {
  DataItem,
  GraphType,
  NodeKind,
  VisualVariable,
} from '../../domain/types';

type AddableKind = NodeKind | 'GraphType' | 'VisualVariable';

// Accept BOTH single and multiple graph-type results
type AddComponentResult =
  | { kind: NodeKind; title: string; description?: string }
  | { kind: 'GraphType'; graphType: GraphType }
  | { kind: 'GraphType'; graphTypes: GraphType[] }
  | { kind: 'VisualVariable'; variables: VisualVariable[] };

type ModalPayload = { title: string; node: React.ReactNode };

type ModalCtx = {
  openModal: (payload: ModalPayload) => void;
  closeModal: () => void;

  openDataModal: (
    initial: Array<string | DataItem>,
    onSave: (items: DataItem[]) => void,
    title?: string
  ) => void;

  openAddComponentModal: (
    kinds: readonly AddableKind[],
    onSave: (payload: AddComponentResult) => void,
    title?: string
  ) => void;
};

const Ctx = createContext<ModalCtx | null>(null);
export function useModal() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useModal must be used inside <ModalHost>');
  return v;
}

function normalizeData(list: Array<string | DataItem>): DataItem[] {
  return (list ?? []).map((v) =>
    typeof v === 'string' ? { name: v, dtype: 'Other' } : v
  );
}

export default function ModalHost({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<ModalPayload | null>(null);

  const api = useMemo<ModalCtx>(
    () => ({
      openModal: (p) => setPayload(p),
      closeModal: () => setPayload(null),

      openDataModal: (initial, onSave, title = 'Data menu') => {
        const initialData = normalizeData(initial);
        setPayload({
          title,
          node: (
            <DataPopup
              initial={initialData}
              onCancel={() => setPayload(null)}
              onSave={(items) => {
                onSave(items);
                setPayload(null);
              }}
            />
          ),
        });
      },

      openAddComponentModal: (kinds, onSave, title = 'Component Menu') => {
        setPayload({
          title,
          node: (
            <AddComponentPopup
              kinds={Array.from(kinds)}
              onCancel={() => setPayload(null)}
              onSave={(result) => {
                onSave(result as AddComponentResult);
                setPayload(null);
              }}
            />
          ),
        });
      },
    }),
    []
  );

  return (
    <Ctx.Provider value={api}>
      {children}
      {payload && (
        <Modal title={payload.title} onClose={api.closeModal}>
          {payload.node}
        </Modal>
      )}
    </Ctx.Provider>
  );
}
