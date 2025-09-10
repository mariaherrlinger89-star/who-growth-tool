/** Labeling nach WHO-Optik: 0–13 Wochen, danach Monate. */
export function xTicks(ageDaysMax: number): {value:number; label:string}[] {
  const ticks: {value:number; label:string}[] = [];
  // Wochen (0..13)
  for (let w=0; w<=13; w++) {
    ticks.push({ value: w*7, label: String(w) });
  }
  // Monate (ab 4..60)
  for (let m=4; m<=60; m++) {
    const d = Math.round(m * 30.4375);
    if (d <= ageDaysMax) ticks.push({ value: d, label: String(m) });
  }
  return ticks;
}
