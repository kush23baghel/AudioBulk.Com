// A pop-up window on the native <dialog> element: Esc closes it, focus stays inside, the page behind is dimmed.
import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ open, onClose, title, hideTitle = false, className = '', children }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // A click on the dimmed area (the dialog element itself, outside the panel) closes it.
      onClick={(e) => e.target === ref.current && onClose()}
      aria-label={title}
      // Let the dialog scroll natively instead of through the page's smooth scroller.
      data-lenis-prevent=""
      className={`m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-paper p-0 text-ink shadow-xl backdrop:bg-ink/40 ${className}`}
    >
      {open && (
        <div className="space-y-5 p-5 sm:p-6">
          {!hideTitle && (
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-display text-xl font-bold">{title}</h2>
              <button type="button" onClick={onClose} className="-m-1 rounded-lg p-1.5 text-muted hover:bg-sand hover:text-ink" aria-label="Close">
                <X size={20} aria-hidden="true" />
              </button>
            </div>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
