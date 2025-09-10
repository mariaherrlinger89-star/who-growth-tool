import { useEffect, useMemo, useState } from "react";
import MeasurementForm, { Measurement } from "./components/MeasurementForm";
import WhoChart from "./components/WhoChart";
import { computeZ } from "./lib/zscore";
import { loadLms } from "./lib/lms";

type Sex = "girl" | "boy";

export default function App() {
  const [sex, setSex] = useState<Sex>("girl");
  const [dob, setDob] = useState<string>("");
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [lmsReady, setLmsReady] = useState<boolean>(false);
  const [note, setNote] = useState<string>("");

  useEffect(() => {
    // LMS-Daten laden (vom Bootstrap erzeugte JSONs)
    loadLms().then(ok => {
      setLmsReady(ok);
      if (!ok) setNote("Hinweis: Fallback-Daten aktiv. Beim nächsten Build werden die WHO-Daten automatisch geladen.");
    });
  }, []);

  const rows = useMemo(() => {
    return measurements
      .filter(m => m.date && m.weight_g > 0)
      .map(m => {
        const ageDays = dob ? Math.max(0, Math.round((new Date(m.date).getTime() - new Date(dob).getTime()) / (1000*60*60*24))) : m.age_days ?? 0;
        const z = computeZ({ sex, ageDays, weightKg: m.weight_g / 1000 });
        return { ...m, ageDays, z };
      })
      .sort((a, b) => a.ageDays - b.ageDays);
  }, [measurements, dob, sex]);

  const status = (() => {
    if (!rows.length) return null;
    const last = rows[rows.length - 1];
    if (last.z === null) return <span className="badge-warn">Keine LMS-Referenz gefunden</span>;
    if (last.z! < -2 || last.z! > 2) return <span className="badge-warn">außerhalb Normbereich (Z={last.z!.toFixed(1)})</span>;
    return <span className="badge-ok">im Normbereich (Z={last.z!.toFixed(1)})</span>;
  })();

  return (
    <div className="min-h-screen bg-cream text-textdark font-inter">
      <header className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary"></div>
          <h1 className="text-xl font-semibold">WHO Gewichtskurven (0–6 Monate) – eazy-mama.de</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 space-y-6">
        {note && (
          <div className="card border border-yellow-200 bg-yellow-50">
            <div className="text-sm">{note}</div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 card">
            <div className="space-y-4">
              <div>
                <label className="label">Geschlecht</label>
                <div className="mt-1 flex gap-2">
                  <button
                    className={`btn-girl ${sex === "girl" ? "" : "bg-pink text-textdark"}`}
                    onClick={() => setSex("girl")}
                  >
                    Mädchen
                  </button>
                  <button
                    className={`btn-boy ${sex === "boy" ? "" : "bg-blue text-textdark"}`}
                    onClick={() => setSex("boy")}
                  >
                    Junge
                  </button>
                </div>
              </div>

              <div>
                <label className="label">Geburtsdatum</label>
                <input className="input mt-1" type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
              </div>

              <MeasurementForm
                measurements={measurements}
                onChange={setMeasurements}
              />

              <div className="text-xs text-textdark/60">
                <p>Hinweis: Z-Score innerhalb −2…+2 = Normbereich. LMS-Quelle: WHO Child Growth Standards (Weight-for-Age).</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Gewichtsentwicklung</h2>
              <div>{status}</div>
            </div>
            <WhoChart sex={sex} rows={rows} />
            <div className="mt-3 text-xs text-center text-textdark/60">
              Interaktives WHO-Tool von <a href="https://www.eazy-mama.de" className="underline">eazy-mama.de</a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
