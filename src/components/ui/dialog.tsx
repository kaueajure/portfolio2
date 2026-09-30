"use client";
import { useRef, useEffect, useId, type ReactNode } from "react";
export function Dialog({
  title,
  children,
  onClose,
  busy = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  busy?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const el = ref.current;
    el?.showModal();
    return () => el?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <header className="dialog-head">
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          disabled={busy}
          onClick={onClose}
          aria-label="Fechar"
        >
          ×
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Confirm({
  title,
  onConfirm,
  onClose,
  busy,
  children,
}: {
  title: string;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog title={title} onClose={onClose} busy={busy}>
      <p>Esta ação será aplicada ao registro. Confirme para continuar.</p>
      {children}
      <div className="actions">
        <button disabled={busy} onClick={onClose}>
          Voltar
        </button>
        <button className="primary" disabled={busy} onClick={onConfirm}>
          {busy ? "Processando…" : "Confirmar"}
        </button>
      </div>
    </Dialog>
  );
}
