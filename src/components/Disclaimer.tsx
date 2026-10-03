export function Disclaimer() {
  return (
    <p className="rounded-2xl border border-accent/40 bg-accent/10 p-3 text-center text-xs text-muted-foreground">
      This is a budgeting aid, not religious or financial advice. Please consult a qualified scholar.
    </p>
  );
}

export function Stat({ label, value, strong, hint }: { label: string; value: string; strong?: boolean | undefined; hint?: string | undefined }) {
  return (
    <div className={`rounded-2xl p-3 ${strong ? "bg-secondary text-secondary-foreground" : "bg-muted"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display tabular-nums ${strong ? "text-xl font-bold" : "font-semibold"}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
