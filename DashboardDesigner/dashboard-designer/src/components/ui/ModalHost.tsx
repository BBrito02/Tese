// src/components/ui/ModalHost.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type ModalSpec = {
  title?: string;
  node: React.ReactNode;
  /** If true (default), clicking the backdrop closes the modal */
  closeOnBackdrop?: boolean;
};

type ModalCtx = {
  openModal: (spec: ModalSpec) => void;
  closeModal: () => void;
  isOpen: boolean;
};

const Ctx = createContext<ModalCtx | null>(null);

export function ModalHost({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<ModalSpec | null>(null);

  const openModal = (spec: ModalSpec) =>
    setModal({ closeOnBackdrop: true, ...spec });

  const closeModal = () => setModal(null);

  // Esc to close
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', onKey);
    // lock scroll while open
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [modal]);

  return (
    <Ctx.Provider value={{ openModal, closeModal, isOpen: !!modal }}>
      {children}
      {modal
        ? createPortal(
            <Backdrop
              onClose={modal.closeOnBackdrop !== false ? closeModal : undefined}
              title={modal.title}
            >
              {modal.node}
            </Backdrop>,
            document.body
          )
        : null}
    </Ctx.Provider>
  );
}

export function useModal() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useModal must be used inside <ModalProvider>');
  return v;
}

/* ---------- UI elements ---------- */

function Backdrop({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  title?: string;
}) {
  // light gray veil that blocks interaction behind it
  const backdrop: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(148,163,184,0.35)', // slate-400 @ ~35%
    backdropFilter: 'blur(1px)',
    zIndex: 1000000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const panel: React.CSSProperties = {
    minWidth: 420,
    maxWidth: '80vw',
    maxHeight: '80vh',
    overflow: 'auto',
    borderRadius: 12,
    background: '#ffffff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
    padding: 16,
  };

  const header: React.CSSProperties = {
    fontWeight: 700,
    fontSize: 16,
    marginBottom: 8,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={backdrop}
      onClick={() => onClose && onClose()}
    >
      <div
        style={panel}
        onClick={(e) => e.stopPropagation()} // ← prevent backdrop close when clicking inside
      >
        {title ? <div style={header}>{title}</div> : null}
        {children}
      </div>
    </div>
  );
}
