export type AutosaveState = "idle" | "saving" | "saved" | "error";

interface AutosaveIndicatorProps {
  state: AutosaveState;
  errorMessage?: string;
}

/** Shared autosave status indicator — every local-first app with editable state should surface this instead of saving silently. */
export function AutosaveIndicator({
  state,
  errorMessage,
}: AutosaveIndicatorProps) {
  if (state === "idle") return null;

  const text =
    state === "saving"
      ? "Saving…"
      : state === "saved"
        ? "Saved to this device"
        : (errorMessage ?? "Couldn't save");

  return (
    <p
      role="status"
      aria-live="polite"
      className={`text-xs ${state === "error" ? "text-danger" : "text-text-muted"}`}
    >
      {text}
    </p>
  );
}
