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
} from "chart.js";
import { fromZ } from "../lib/zscore";
import { getLms } from "../lib/lms";

// ---- Konstanten: Monate/Wochen ----
const DAYS_PER_MONTH = 30.4375;
const WEEKS_PER_MONTH = DAYS_PER_MONTH / 7; // ≈ 4.348
const MAX_MONTHS = 6;                        // harte Kappung bei 6 Monaten
const MAX_WEEKS = MAX_MONTHS * WEEKS_PER_MONTH; // ≈ 26.09

// ---- Tick-Positionen (in Wochen) ----
// 0..13 wöchentlich, danach Monate 4..6 (in Wochen)
function tickPositionsWeeks(): number[] {
  const ticks: number[] = [];
  for (let w = 0; w <= 13; w++) ticks.push(w); // Wochen 0..13
  for (let m = 4; m <= MAX_MONTHS; m++) ticks.push(m * WEEKS_PER_MONTH);
  return ticks;
}

// Achsenlabels: bis 13 → Wochenzahl, danach → Monatszahl
function labelForWeeks(w: number): string {
  if (w <= 13 + 1e-6) return String(Math.round(w));
  return String(Math.round(w / WEEKS_PER_MONTH));
}

// Grid-Linienstärke: Monatslinien kräftiger, Wochenlinien dünner
function gridLineWidthForWeeks(w: number): number {
  const isWeek = w <= 13 + 1e-6 && Math.abs(w - Math.round(w)) < 1e-6;
  const monthFloat = w / WEEKS_PER_MONTH;
  const isMonth = w > 13 + 1e-6 && Math.abs(monthFloat - Math.round(monthFloat)) < 0.03;
  return isMonth ? 1.2 : isWeek ? 0.6 : 0.3;
}

// ---- Plugin setzt die X-Ticks exakt auf unsere Positionen ----
const customXTicksPlugin = {
  id: "customXTicks",
  beforeBuildTicks(chart: Chart, args: any) {
    const scale = args.scale;
    if (!scale || scale.axis !== "x") return;
    const positions = tickPositionsWeeks();
    args.ticks = positions.map((v) => ({ value: v }));
  },
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

export default function WhoChart({ sex, rows }: { sex: "girl" | "boy"; rows: Row[] }) {
  // WHO-Referenz-Sampling: wöchentlich von 0 bis 6 Monate (glatte Kurven)
  const sampleWeeks: number[] = Array.from({ length: Math.floor(MAX_WEEKS) + 1 }, (_, i) => i); // 0,1,2,...,26
  const sampleDays = sampleWeeks.map((w) => Math.round(w * 7));

  // Z-Linienfarben und Linienbreiten (Legende ca. 60% dicker → wir erhöhen borderWidth gesamt)
  const ZS = [-3, -2, -1, 0, 1, 2, 3] as const;
  const palette = (z: number) => (z === 0 ? "#2e7d32" : Math.abs(z) === 2 ? "#c62828" : "#212121");
  const baseWidth = (z: number) => (z === 0 ? 2.25 : Math.abs(z) === 2 ? 1.75 : 1.5);
  const thicker = (z: number) => baseWidth(z) * 1.6; // ~60% dicker (gilt auch für Legende)

  const refDatasets = ZS.map((z) => ({
    label: `Z ${z}`,
    data: sampleDays
      .map((d, i) => {
        const p = getLms(sex, d);
        return p ? { x: sampleWeeks[i], y: Number(fromZ(p.L, p.M, p.S, z).toFixed(3)) } : null;
      })
      .filter(Boolean) as { x: number; y: number }[],
    borderColor: palette(z),
    borderWidth: thicker(z),
    pointRadius: 0,
    tension: 0.02,
    fill: false,
  }));

  // Kind-Daten: X=Wochen, Y=kg; alles >6 Monate wird automatisch abgeschnitten
  const childData = rows.map((r) => ({ x: r.ageDays / 7, y: r.weight_g / 1000 }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: MAX_WEEKS, // harte Kappung bei 6 Monaten
        grid: {
          color: "rgba(0,0,0,0.06)",
          lineWidth: (ctx: any) => gridLineWidthForWeeks(ctx.tick.value as number),
        },
        ticks: {
          autoSkip: false,
          callback: (val: number) => labelForWeeks(val),
          maxRotation: 0,
          minRotation: 0,
        },
        title: { display: true, text: "Alter (0–13 Wochen, danach Monate 4–6)" },
      },
      y: {
        type: "linear",
        min: 2,
        max: 25,
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { stepSize: 1 },
        title: { display: true, text: "Gewicht (kg)" },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          // Linien statt Boxen in der Legende
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
      <Line data={data as any} options={options} plugins={[customXTicksPlugin]} />
    </div>
  );
}
