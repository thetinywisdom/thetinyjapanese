import { useEffect } from "react";
import { toast } from "sonner";
import { importLegacyDomains } from "./legacyDomains";

/** Copy progress saved on older domains into this browser's local storage. */
export function LegacyImport() {
  useEffect(() => {
    let cancelled = false;
    void importLegacyDomains().then((recovered) => {
      if (cancelled || !recovered) return;
      toast("Welcome back — we restored the progress from your earlier visits.");
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}
