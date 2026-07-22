/** Shared Tailwind class strings so every app island looks consistent. */

export const buttonPrimary =
  "inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-contrast transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondary =
  "inline-flex items-center gap-2 rounded-md border border-border-strong bg-bg-elevated px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-bg-sunken disabled:cursor-not-allowed disabled:opacity-50";

export const buttonGhost =
  "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg-sunken hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

export const buttonDanger =
  "inline-flex items-center gap-2 rounded-md bg-danger px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";

export const iconButton =
  "inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-bg-sunken hover:text-text disabled:cursor-not-allowed disabled:opacity-50";

export const textareaField =
  "w-full rounded-md border border-border-strong bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent";

export const textField =
  "w-full rounded-md border border-border-strong bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-accent";

export const selectField =
  "rounded-md border border-border-strong bg-bg-elevated px-3 py-2 text-sm text-text focus-visible:outline-2 focus-visible:outline-accent";

export const labelText = "text-sm font-medium text-text";

export const badge =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase";

/** Pins an app's own primary toolbar to the top of its scrollable content region — reusable by any workspace app. */
export const stickyToolbar =
  "border-border bg-bg/95 sticky top-0 z-10 border-b px-4 py-3 backdrop-blur sm:px-6";
