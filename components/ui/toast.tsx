type ToastProps = {
  open: boolean;
  message: string;
  onClose?: () => void;
};

export function Toast({ open, message, onClose }: ToastProps) {
  if (!open) return null;

  return (
    <div className="fixed right-4 top-4 z-[60]">
      <div
        aria-live="polite"
        className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 shadow-lg"
        role="status"
      >
        <span>{message}</span>
        {onClose ? (
          <button
            aria-label="Close toast"
            className="rounded px-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400"
            onClick={onClose}
            type="button"
          >
            x
          </button>
        ) : null}
      </div>
    </div>
  );
}
