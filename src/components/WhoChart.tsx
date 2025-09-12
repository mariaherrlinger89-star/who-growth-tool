// src/components/WhoChart.tsx
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  Chart,
  Scale,
} from "chart.js";
import { fromZ } from "../lib/zscore";
import { getLms } from "../lib/lms";

// --- Konstanten (unverändert/ergänzt) ---
const DAYS_PER_MONTH = 30.4375;
const WEEKS_PER_MONTH = DAYS_PER_MONTH / 7;     // ≈ 4.348
const MAX_MONTHS = 6;                            // harte Kappung
const MAX_WEEKS = MAX_MONTHS * WEEKS_PER_MONTH;  // ≈ 26.1

// Hybrid-Aufteilung der X-Achse:
// 0–13 Wochen belegen 60%, Monate 4–6 belegen 40%
const WEEKS_SECTION_MAX = 13;
const MONTHS_START = 4;
const MONTHS_END = 6;
const SHARE_WEEKS = 0.60;               // 60% Breite für Wochen
const SHARE_MONTHS = 1 - SHARE_WEEKS;   // 40% Breite für Monate

// --- Hilfsfunktionen: Mapping in Hybrid-Koordinatenraum [0..1] ---
function toHybridX_fromWeeks(w: number): number {
  if (w <= WEEKS_SECTION_MAX) {
    return (w / WEEKS_SECTION_MAX) * SHARE_WEEKS; // 0 .. 0.60
  }
  // Wochen -> Monate clampen 4..6
  const m = Math.min(Math.max(w / WEEKS_PER_MONTH, MONTHS_START), MONTHS_END);
  return SHARE_WEEKS + ((m - MONTHS_START) / (MONTHS_END - MONTHS_START)) * SHARE_MONTHS; // 0.60 .. 1
}
function toHybridX_fromDays(days: number): number {
  return toHybridX_fromWeeks(days / 7);
}

// Hybrid-Ticks (Positionen in [0..1]) + Labeling
function hybridTickPositions(): number[] {
  const t: number[] = [];
  // Wochen-Ticks: 0..13
  for (let w = 0; w <= WEEKS_SECTION_MAX; w++) t.push(toHybridX_fromWeeks(w));
  // Monats-Ticks: 4,5,6
  for (let m = MONTHS_START; m <= MONTHS_END; m++) {
    const pos = SHARE_WEEKS + ((m - MONTHS_START) / (MONTHS_END - MONTHS_START)) * SHARE_MONTHS;
    t.push(pos);
  }
  return t;
}
function hybridTickLabel(pos: number): string {
  if (pos <= SHARE_WEEKS + 1e-6) {
    const w = Math.round((pos / SHARE_WEEKS) * WEEKS_SECTION_MAX);
    return String(w); // Wochen 0..13
  }
  const m = Math.round(((pos - SHARE_WEEKS) / SHARE_MONTHS) * (MONTHS_END - MONTHS_START) + MONTHS_START);
  return String(m);   // Monate 4..6
}
function gridWidthForHybrid(pos: number): number {
  // Dünnere Linien im Wochenbereich, kräftiger im Monatsbereich
  return pos <= SHARE_WEEKS + 1e-6 ? 0.6 : 1.2;
}

// --- Plugin: setzt Ticks/Domain für die X-Achse hart auf Hybrid 0..1 ---
const enforceCustomXTicks = {
  id: "enforceCustomXTicks",
  afterBuildTicks(chart: Chart, args: { scale: Scale }) {
    const s = args.scale as any;
    if (s?.axis !== "x") return;
    const pos = hybridTickPositions();
    s.ticks = pos.map((v: number) => ({ value: v }));
    s.min = 0;
    s.max = 1; // Hybrid-Domain
  },
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

export default function WhoChart({ sex, rows }: { sex: "girl" | "boy"; rows: Row[] }) {
  // WHO-Referenz wöchentlich bis 6 Monate sampeln (glatte Linien)
  const sampleWeeks = Array.from({ length: Math.floor(MAX_WEEKS) + 1 }, (_, i) => i); // 0..26
  const sampleDays  = sampleWeeks.map((w) => Math.round(w * 7));

  // Farben & breitere Linien für Legende (unverändert)
  const ZS = [-3, -2, -1, 0, 1, 2, 3] as const;
  const color = (z: number) => (z === 0 ? "#2e7d32" : Math.abs(z) === 2 ? "#c62828" : "#212121");
  const baseW = (z: number) => (z === 0 ? 2.25 : Math.abs(z) === 2 ? 1.75 : 1.5);
  const thick = (z: number) => baseW(z) * 1.6; // ~60% dicker

  // WHO-Referenzlinien: X -> Hybrid
  const refDatasets = ZS.map((z) => ({
    label: `Z ${z}`,
    data: sampleDays
      .map((d, i) => {
        const p = getLms(sex, d);
        if (!p) return null;
        const xWeeks = sampleWeeks[i];
        const xHybrid = toHybridX_fromWeeks(xWeeks);
        return { x: xHybrid, y: Number(fromZ(p.L, p.M, p.S, z).toFixed(3)) };
      })
      .filter(Boolean) as { x: number; y: number }[],
    borderColor: color(z),
    borderWidth: thick(z),
    pointRadius: 0,
    tension: 0.02,
    fill: false,
  }));

  // Kinddaten: X -> Hybrid
  const childData = rows.map((r) => ({
    x: toHybridX_fromDays(r.ageDays),
    y: r.weight_g / 1000,
  }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: 1, // Hybrid-Domain 0..1
        grid: {
          color: "rgba(0,0,0,0.06)",
          lineWidth: (ctx: any) => gridWidthForHybrid(ctx.tick.value as number),
        },
        ticks: {
          autoSkip: false, // wir liefern eigene Ticks
          callback: (v: number) => hybridTickLabel(v as number),
          maxRotation: 0,
          minRotation: 0,
        },
        title: { display: true, text: "Alter (0–13 Wochen = 60 %, Monate 4–6 = 40 %)" },
      },
      y: {
        type: "linear",
        min: 2,
        max: 12,
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { stepSize: 1 },
        title: { display: true, text: "Gewicht (kg)" },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          usePointStyle: true,
          pointStyle: "line",
        },
      },
    },
    elements: { line: { spanGaps: true } },
  };

  const data = {
    datasets: [
      ...refDatasets,
      {
        label: "Kind",
        data: childData,
        borderColor: "#75b1e5",
        backgroundColor: "#75b1e5",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: false,
      },
    ],
  };

  return (
    <div className="relative" style={{ height: 560 }}>
      <Line data={data as any} options={options} plugins={[enforceCustomXTicks]} />
    </div>
  );
}
