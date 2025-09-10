import { getLms } from "./lms";

/** Z-Score via LMS (für L ≠ 0). Rückgabe null, wenn kein Referenzpunkt gefunden wurde. */
export function computeZ(params: { sex: "girl"|"boy"; ageDays: number; weightKg: number }): number | null {
  const p = getLms(params.sex, params.ageDays);
  if (!p) return null;
  const { L, M, S } = p;
  if (L === 0) return Math.log(params.weightKg / M) / S;
  return ((Math.pow(params.weightKg / M, L) - 1) / (L * S));
}

/** Für die Kurvenerzeugung: aus LMS und Z den Wert X (kg) berechnen. */
export function fromZ(L: number, M: number, S: number, Z: number): number {
  if (L === 0) return M * Math.exp(S * Z);
  return M * Math.pow(1 + L * S * Z, 1 / L);
}
