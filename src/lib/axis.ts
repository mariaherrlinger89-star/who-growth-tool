// src/lib/axis.ts

export const DAYS_PER_MONTH = 30.4375;

/** Ticks: 0–13 Wochen in 7-Tage-Schritten, danach monatlich ab Monat 4 */
export function weeklyThenMonthlyTicks(maxAgeDays: number): number[] {
  const minMax = Math.max(maxAgeDays, Math.round(60 * DAYS_PER_MONTH));
  const ticks: number[] = [];
  // Wochen 0..13
  for (let w = 0; w <= 13; w++) ticks.push(w * 7);
  // Monate ab 4..60
  for (let m = 4; ; m++) {
    const d = Math.round(m * DAYS_PER_MONTH);
    if (d > minMax) break;
    ticks.push(d);
  }
  return ticks;
}

/** Beschriftung: bis 13 Wochen → Wochenzahl, danach → Monatszahl */
export function weeklyThenMonthlyLabel(valueDays: number): string {
  if (valueDays <= 13 * 7) return String(Math.round(valueDays / 7)); // Wochen
  return String(Math.round(valueDays / DAYS_PER_MONTH));             // Monate
}
