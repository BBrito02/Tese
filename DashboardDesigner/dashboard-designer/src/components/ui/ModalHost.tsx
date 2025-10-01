import React, { createContext, useContext, useMemo, useState } from 'react';
import Modal from './Modal';

type ModalPayload = {
  title: string;
  node: React.ReactNode;
};

type ModalCtx = {
  openModal: (payload: ModalPayload) => void;
  closeModal: () => void;
};

const Ctx = createContext<ModalCtx | null>(null);

export function useModal() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useModal must be used inside <ModalHost>');
  return v;
}

export default function ModalHost({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<ModalPayload | null>(null);

  const api = useMemo<ModalCtx>(
    () => ({
      openModal: (p) => setPayload(p),
      closeModal: () => setPayload(null),
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
