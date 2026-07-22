import { useEffect, useRef, type ReactNode } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  side?: "left" | "bottom";
  children: ReactNode;
}

/**
 * Reusable off-canvas overlay: the platform navigation drawer on mobile
 * today, but generic enough for any app that needs a slide-in panel or
 * bottom sheet (filters, inspectors, settings). Closes on Escape or a
 * backdrop click and returns focus to whatever opened it.
 */
export function Drawer({
  open,
  onClose,
  title,
  side = "left",
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (open) {
      openerRef.current = document.activeElement;
      panelRef.current?.focus();
    } else {
      (openerRef.current as HTMLElement | null)?.focus?.();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const panelPosition =
    side === "left"
      ? "inset-y-0 left-0 h-full w-72 max-w-[85vw]"
      : "inset-x-0 bottom-0 max-h-[80vh] w-full rounded-t-xl";

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 bg-black/40"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`border-border bg-bg-elevated absolute flex flex-col gap-1 overflow-y-auto border p-3 shadow-2xl focus:outline-none ${panelPosition} pb-[max(0.75rem,env(safe-area-inset-bottom))]`}
      >
        {children}
      </div>
    </div>
  );
}
