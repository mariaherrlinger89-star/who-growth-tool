import { useState } from "react";

export type Measurement = {
  date: string;       // ISO yyyy-mm-dd
  weight_g: number;   // Gramm
  age_days?: number;  // optional, falls ohne Geburtsdatum gearbeitet wird
};

export default function MeasurementForm({
  measurements,
  onChange
}: {
  measurements: Measurement[];
  onChange: (rows: Measurement[]) => void;
}) {
  const [local, setLocal] = useState<Measurement[]>(measurements.length ? measurements : [
    { date: "", weight_g: 0 }
  ]);

  function set(idx: number, patch: Partial<Measurement>) {
    const next = local.map((r, i) => i === idx ? { ...r, ...patch } : r);
    setLocal(next);
    onChange(next);
  }
  function add() {
    const next = [...local, { date: "", weight_g: 0 }];
    setLocal(next); onChange(next);
  }
  function remove(idx: number) {
    const next = local.filter((_, i) => i !== idx);
    setLocal(next); onChange(next);
  }

  return (
    <div className="space-y-3">
      {local.map((r, i) => (
        <div key={i} className="grid grid-cols-7 gap-2 items-end">
          <div className="col-span-3">
            <label className="label">Messdatum</label>
            <input className="input mt-1" type="date" value={r.date} onChange={e => set(i, { date: e.target.value })}/>
          </div>
          <div className="col-span-3">
            <label className="label">Gewicht (g)</label>
            <input className="input mt-1" type="number" min={300} max={30000} value={r.weight_g || ""}
                   placeholder="z. B. 4200"
                   onChange={e => set(i, { weight_g: Number(e.target.value) })}/>
          </div>
          <div className="col-span-1">
            <button className="btn-primary w-full" onClick={() => remove(i)}>–</button>
          </div>
        </div>
      ))}
      <button className="btn-primary w-full" onClick={add}>+ Messwert hinzufügen</button>
    </div>
  );
}
