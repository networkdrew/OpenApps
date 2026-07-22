import { useEffect, useState } from "react";
import { estimateKeyBytes, formatBytes } from "@/lib/storage/storageUsage";
import Icon from "./Icon";

interface StorageUsageIndicatorProps {
  storageKey: string;
  /** Bump this to force a re-read after a save (storage events don't fire in the same tab). */
  refreshToken?: number;
}

/** Shared local-storage usage readout for any app's data controls panel. */
export function StorageUsageIndicator({
  storageKey,
  refreshToken,
}: StorageUsageIndicatorProps) {
  const [bytes, setBytes] = useState(0);

  useEffect(() => {
    setBytes(estimateKeyBytes(storageKey));
  }, [storageKey, refreshToken]);

  return (
    <p className="text-text-muted flex items-center gap-1.5 text-xs">
      <Icon name="database" className="h-3.5 w-3.5" />
      {formatBytes(bytes)} used in this browser
    </p>
  );
}
