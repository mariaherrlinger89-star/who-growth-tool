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
import type { RefObject } from "react";            // ← NEU: für den Ref-Typ

// --- Konstanten ---
const DAYS_PER_MONTH = 30.4375;
const WEEKS_PER_MONTH = DAYS_PER_MONTH / 7;     // ≈ 4.348
const MAX_MONTHS = 6;                            // harte Kappung
const MAX_WEEKS = MAX_MONTHS * WEEKS_PER_MONTH;  // ≈ 26.1

// --- Tick-Positionen (in Wochen): 0..13 wöchentlich, dann Monats-Ticks 4..6 ---
function weekTickPositions(): number[] {
  const t: number[] = [];
  for (let w = 0; w <= 13; w++) t.push(w);
  for (let m = 4; m <= MAX_MONTHS; m++) t.push(m * WEEKS_PER_MONTH);
  return t;
}

// Label-Regel: 0–13 alle Wochen beschriften, danach Monate 3/4/5/6
function labelForWeekValue(w: number): string {
  if (w <= 13 + 1e-6) return String(Math.round(w));          // 0..13
  return String(Math.round(w / WEEKS_PER_MONTH));            // 3,4,5,6
}

// Grid-Linienstärke: Monatslinien kräftiger, Wochen dünner
function gridWidthForWeekValue(w: number): number {
  const isWeek = w <= 13 + 1e-6 && Math.abs(w - Math.round(w)) < 1e-6;
  const monthFloat = w / WEEKS_PER_MONTH;
  const isMonth = w > 13 + 1e-6 && Math.abs(monthFloat - Math.round(monthFloat)) < 0.03;
  return isMonth ? 1.2 : isWeek ? 0.6 : 0.3;
}

// --- Plugin: setzt Ticks *nach* ChartJS-Berechnung, damit wirklich alle Striche kommen ---
const enforceCustomXTicks = {
  id: "enforceCustomXTicks",
  afterBuildTicks(chart: Chart, args: { scale: Scale }) {
    const s = args.scale as any;
    if (s?.axis !== "x") return;
    const pos = weekTickPositions();
    s.ticks = pos.map((v: number) => ({ value: v }));
    // wichtig: interne caches aktualisieren
    s.min = 0;
    s.max = MAX_WEEKS;
  },
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

// ← NEU: Props erlauben optional einen chartRef
type Props = {
  sex: "girl" | "boy";
  rows: Row[];
  chartRef?: RefObject<any>;
};

export default function WhoChart({ sex, rows, chartRef }: Props) {
  // WHO-Referenz wöchentlich bis 6 Monate sampeln (glatte Linien)
  const sampleWeeks = Array.from({ length: Math.floor(MAX_WEEKS) + 1 }, (_, i) => i); // 0..26
  const sampleDays  = sampleWeeks.map((w) => Math.round(w * 7));

  // Farben & breitere Linien für Legende
  const ZS = [-3, -2, -1, 0, 1, 2, 3] as const;
  const color = (z: number) => (z === 0 ? "#2e7d32" : Math.abs(z) === 2 ? "#c62828" : "#212121");
  const baseW = (z: number) => (z === 0 ? 2.25 : Math.abs(z) === 2 ? 1.75 : 1.5);
  const thick = (z: number) => baseW(z) * 1.6; // ~60% dicker

  const refDatasets = ZS.map((z) => ({
    label: `Z ${z}`,
    data: sampleDays
      .map((d, i) => {
        const p = getLms(sex, d);
        return p ? { x: sampleWeeks[i], y: Number(fromZ(p.L, p.M, p.S, z).toFixed(3)) } : null;
      })
      .filter(Boolean) as { x: number; y: number }[],
    borderColor: color(z),
    borderWidth: thick(z),
    pointRadius: 0,
    tension: 0.02,
    fill: false,
  }));

  // Kinddaten in Wochen
  const childData = rows.map((r) => ({ x: r.ageDays / 7, y: r.weight_g / 1000 }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: MAX_WEEKS, // endet bei 6 Monaten
        grid: {
          color: "rgba(0,0,0,0.06)",
          lineWidth: (ctx: any) => gridWidthForWeekValue(ctx.tick.value as number),
        },
        ticks: {
          autoSkip: false,               // NICHT überspringen – wir setzen die Ticks selbst
          callback: (v: number) => {
            // Bis Woche 13 nur jede 2. Woche anzeigen,
            // danach wieder die Monats-Ticks (4,5,6)
            if (v <= 13 && (v as number) % 2 === 0) return v.toString();
            if (v > 13) return labelForWeekValue(v as number); // Monat 4–6
            return "";
          },
          maxRotation: 0,
          minRotation: 0,
          font: {
            size: 8,           // Schriftgröße der Ticklabels (px)
            family: "Inter, sans-serif",
          },
        },
        title: { display: true, text: "Alter (0–13 Wochen, danach Monate 4–6)" },
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
          usePointStyle: true, // Linie in der Legende statt Box
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
      {/* ← NEU: ref anbinden, damit der Export das Canvas greifen kann */}
      <Line ref={chartRef as any} data={data as any} options={options} plugins={[enforceCustomXTicks]} />
    </div>
  );
}
