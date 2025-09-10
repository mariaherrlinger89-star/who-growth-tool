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
} from "chart.js";
import { fromZ } from "@/lib/zscore";
import { getLms } from "@/lib/lms";
import { weeklyThenMonthlyTicks, weeklyThenMonthlyLabel, DAYS_PER_MONTH } from "@/lib/axis";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

export default function WhoChart({ sex, rows }: { sex: "girl" | "boy"; rows: Row[] }) {
  // Max-X: mindestens bis 60 Monate
  const maxAgeDays = Math.max(Math.round(60 * DAYS_PER_MONTH), rows.at(-1)?.ageDays ?? 0);

  // X-Positions: 0–13 Wochen wöchentlich, danach monatlich ab Monat 4
  const xs = weeklyThenMonthlyTicks(maxAgeDays);

  // WHO-Referenzlinien Z = −3…+3 als {x,y}-Punkte
  const ZS = [-3, -2, -1, 0, 1, 2, 3] as const;
  const palette = (z: number) => (z === 0 ? "#2e7d32" : Math.abs(z) === 2 ? "#c62828" : "#212121");
  const width = (z: number) => (z === 0 ? 2.25 : Math.abs(z) === 2 ? 1.75 : 1.5);

  const refDatasets = ZS.map((z) => ({
    label: `Z ${z}`,
    data: xs
      .map((d) => {
        const p = getLms(sex, d);
        return p ? { x: d, y: Number(fromZ(p.L, p.M, p.S, z).toFixed(3)) } : null;
      })
      .filter(Boolean) as { x: number; y: number }[],
    borderColor: palette(z),
    borderWidth: width(z),
    pointRadius: 0,
    tension: 0.02,
  }));

  // Kind-Kurve als {x,y}
  const childData = rows.map((r) => ({ x: r.ageDays, y: r.weight_g / 1000 }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: maxAgeDays,
        // Gitter: Wochen fein, Monate etwas kräftiger
        grid: {
          color: "rgba(0,0,0,0.06)",
          lineWidth: (ctx: any) => {
            const v = ctx.tick.value as number;
            const isWeek = v <= 13 * 7 && v % 7 === 0;
            const monthFloat = v / DAYS_PER_MONTH;
            const isMonth = v > 13 * 7 && Math.abs(monthFloat - Math.round(monthFloat)) < 0.02;
            return isMonth ? 1.2 : isWeek ? 0.6 : 0.3;
          },
        },
        ticks: {
          autoSkip: false, // wir liefern die Ticks selbst
          callback: (val: number) => weeklyThenMonthlyLabel(val),
          maxRotation: 0,
          minRotation: 0,
        },
        title: { display: true, text: "Alter (Wochen 0–13, danach Monate 4–60)" },
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
    plugins: { legend: { display: true } },
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
      },
    ],
  };

  return <div className="relative" style={{ height: 520 }}><Line data={data as any} options={options} /></div>;
}
