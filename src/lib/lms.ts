let girls: Array<{age_days:number;L:number;M:number;S:number}> = [];
let boys:  Array<{age_days:number;L:number;M:number;S:number}> = [];

export async function loadLms(): Promise<boolean> {
  try {
    const [g, b] = await Promise.all([
      import("../data/wfa_girls_lms.json"),
      import("../data/wfa_boys_lms.json")
    ]);
    girls = (g as any).default;
    boys  = (b as any).default;
    return (girls?.length || 0) > 3 && (boys?.length || 0) > 3;
  } catch {
    return false;
  }
}

/** lineare Interpolation zwischen Stützstellen */
function interp(list: typeof girls, ageDays: number) {
  if (!list.length) return null;
  if (ageDays <= list[0].age_days) return list[0];
  if (ageDays >= list[list.length-1].age_days) return list[list.length-1];
  let lo = 0, hi = list.length-1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (list[mid].age_days <= ageDays) lo = mid; else hi = mid;
  }
  const A = list[lo], B = list[hi];
  const t = (ageDays - A.age_days) / (B.age_days - A.age_days);
  return {
    age_days: ageDays,
    L: A.L + (B.L - A.L)*t,
    M: A.M + (B.M - A.M)*t,
    S: A.S + (B.S - A.S)*t
  };
}

export function getLms(sex: "girl"|"boy", ageDays: number) {
  const list = sex === "girl" ? girls : boys;
  return interp(list, Math.max(0, Math.round(ageDays)));
}
