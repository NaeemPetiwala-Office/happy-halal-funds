import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { translate } from "@/lib/i18n";

/** Calm notice shown while the device is offline; cached data stays readable. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" aria-live="polite" className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-secondary px-4 py-2 text-center text-sm font-medium text-secondary-foreground">
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      {translate("You're offline — showing your last saved data. Changes are paused until you reconnect.")}
    </div>
  );
}
