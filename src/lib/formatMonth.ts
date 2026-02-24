import { format, parse } from "date-fns";

/** Converts "2026-02" to "February 2026" */
export function formatFeeMonth(yyyyMM: string): string {
  if (!yyyyMM || !/^\d{4}-\d{2}$/.test(yyyyMM)) return yyyyMM || "—";
  const date = parse(yyyyMM, "yyyy-MM", new Date());
  return format(date, "MMMM yyyy");
}
