"use client";

import { ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const firstControl = dialog.querySelector<HTMLElement>(
      "select, input, textarea, button",
    );
    firstControl?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="relative w-full max-w-md rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
        ref={dialogRef}
        role="dialog"
      >
        <header className="mb-3">
          <h2 className="text-lg font-semibold" id="modal-title">
            {title}
          </h2>
        </header>
        <div>{children}</div>
        {footer ? <footer className="mt-4 flex justify-end gap-2">{footer}</footer> : null}
      </section>
    </div>
  );
}
