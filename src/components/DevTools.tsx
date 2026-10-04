import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isDevEnvironment, loadTestScenario, resetAllMyData } from "@/lib/dev-tools";

/** Preview/test-only helpers. Renders nothing on the published site. */
export function DevTools() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(isDevEnvironment()), []);
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<null | "reset" | "load">(null);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  if (!show) return null;

  async function run() {
    setBusy(true);
    try {
      if (dialog === "reset") await resetAllMyData(); else await loadTestScenario();
      await qc.refetchQueries({ type: "all" });
      toast.success(dialog === "reset" ? "All your data was deleted." : "Test scenario loaded.");
      setDialog(null);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      setTyped("");
    }
  }

  return (
    <>
      <section className="rounded-3xl border bg-card p-6 shadow-soft">
        <h2 className="text-lg">Developer</h2>
        <p className="mb-4 text-sm text-muted-foreground">Preview only. Replaces your data with the reference test scenario (₹, plan start Aug 2026).</p>
        <Button variant="outline" onClick={() => setDialog("load")}>Load test scenario…</Button>
      </section>
      <section className="rounded-3xl border border-destructive/50 bg-card p-6 shadow-soft">
        <h2 className="text-lg text-destructive">Danger zone</h2>
        <p className="mb-4 text-sm text-muted-foreground">Preview only. Deletes every entry you own. Your account and profile stay.</p>
        <Button variant="destructive" onClick={() => setDialog("reset")}>Reset all my data…</Button>
      </section>
      <AlertDialog open={dialog !== null} onOpenChange={(o) => { if (!o) { setDialog(null); setTyped(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialog === "reset" ? "Reset all your data?" : "Load the test scenario?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialog === "reset"
                ? "This permanently deletes all your categories, goals, accounts, entries and settings. Type RESET to confirm."
                : "This deletes all your current data, then loads the test scenario and sets currency ₹ and plan start August 2026."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {dialog === "reset" && (
            <Input aria-label="Type RESET to confirm" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="RESET" />
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy || (dialog === "reset" && typed !== "RESET")}
              onClick={(e) => { e.preventDefault(); run(); }}
            >
              {busy ? "Working…" : dialog === "reset" ? "Delete everything" : "Load scenario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
