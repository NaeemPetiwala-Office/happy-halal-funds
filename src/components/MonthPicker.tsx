const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const sel =
  "h-11 w-full rounded-full border bg-input px-5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** Value format "YYYY-MM". Uses selects so it works in every browser. */
export function MonthPicker({ id, value, onChange }: { id?: string; value: string; onChange: (v: string) => void }) {
  const now = new Date().getFullYear();
  const [y, m] = (value || `${now}-01`).split("-");
  const years = Array.from({ length: 11 }, (_, i) => now - 5 + i);
  return (
    <div className="grid grid-cols-2 gap-2">
      <select id={id} aria-label="Month" className={sel} value={m} onChange={(e) => onChange(`${y}-${e.target.value}`)}>
        {MONTHS.map((n, i) => (
          <option key={n} value={String(i + 1).padStart(2, "0")}>{n}</option>
        ))}
      </select>
      <select aria-label="Year" className={sel} value={y} onChange={(e) => onChange(`${e.target.value}-${m}`)}>
        {years.map((yr) => <option key={yr} value={String(yr)}>{yr}</option>)}
      </select>
    </div>
  );
}
