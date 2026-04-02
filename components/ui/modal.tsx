"use client";

import { ReactNode, useEffect, useRef } from "react";

type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizeClassNames: Record<NonNullable<ModalProps["size"]>, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  size = "md",
}: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
      <button
        aria-label="Close modal"
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className={`relative my-auto flex w-full min-h-0 max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:max-h-[calc(100vh-3rem)] ${sizeClassNames[size]}`}
        ref={dialogRef}
        role="dialog"
      >
        <header className="mb-3 shrink-0">
          <h2 className="text-lg font-semibold" id="modal-title">
            {title}
          </h2>
        </header>
        <div className="min-h-0 overflow-y-auto pr-1">{children}</div>
        {footer ? <footer className="mt-4 flex shrink-0 justify-end gap-2">{footer}</footer> : null}
      </section>
    </div>
  );
}
