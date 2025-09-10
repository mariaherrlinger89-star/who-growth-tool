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
import { fromZ } from "@/lib/zscore";
import { getLms } from "@/lib/lms";
import {
  weeklyThenMonthlyTicks,
  weeklyThenMonthlyLabel,
  DAYS_PER_MONTH,
} from "@/lib/axis";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

/** HTML-Legend-Plugin: zeigt schmale farbige Linien statt Boxen */
const htmlLegendPlugin = {
  id: "htmlLegend",
  afterUpdate(chart: Chart, _args: any, options: { containerID: string }) {
    const container = document.getElementById(options.containerID);
    if (!container) return;

    // Container leeren
    while (container.firstChild) container.firstChild.remove();

    const list = document.createElement("ul");
    list.style.display = "flex";
    list.style.flexWrap = "wrap";
    list.style.listStyle = "none";
    list.style.margin = "0";
    list.style.padding = "0";
    list.style.gap = "16px";

    const items = chart!.options!.plugins!.legend!.labels!.generateLabels!(chart);

    items.forEach((item) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.alignItems = "center";
      li.style.cursor = "pointer";

      // Linien-Swatch
      const swatch = document.createElement("span");
      swatch.style.display = "inline-block";
      swatch.style.width = "28px";
      swatch.style.height = "0px"; // echte Linie
      swatch.style.borderTop = `${(item.lineWidth ?? 2)}px solid ${item.strokeStyle as string}`;
      swatch.style.marginRight = "6px";

      // Label
      const text = document.createElement("span");
      text.style.color = "inherit";
      text.style.fontSize = "14px";
      text.appendChild(document.createTextNode(item.text));

      li.appendChild(swatch);
      li.appendChild(text);

      li.onclick = () => {
        const { type } = chart.config;
        // Toggle Dataset
        if (type === "pie" || type === "doughnut") {
          chart.toggleDataVisibility(item.index);
        } else {
          chart.setDatasetVisibility(item.datasetIndex!, !chart.isDatasetVisible(item.datasetIndex!));
        }
        chart.update();
      };

      list.appendChild(li);
    });

    container.appendChild(list);
  },
};

export default function WhoChart({ sex, rows }: { sex: "girl" | "boy"; rows: Row[] }) {
  const maxAgeDays = Math.max(Math.round(60 * DAYS_PER_MONTH), rows.at(-1)?.ageDays ?? 0);
  const xs = weeklyThenMonthlyTicks(maxAgeDays);

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
    fill: false,
  }));

  const childData = rows.map((r) => ({ x: r.ageDays, y: r.weight_g / 1000 }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: maxAgeDays,
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
          autoSkip: false,
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
    plugins: {
      // eingebaute Canvas-Legende aus
      legend: {
        display: false,
        labels: { generateLabels: (chart: Chart) => Chart.defaults.plugins.legend.labels.generateLabels!(chart) },
      },
      // eigene HTML-Legende
      htmlLegend: { containerID: "legend-who" },
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
      {/* Hier erscheint die HTML-Legende (Linien-Swatches) */}
      <div id="legend-who" className="mb-2 flex flex-wrap items-center gap-4 text-textdark"></div>
      <Line data={data as any} options={options} plugins={[htmlLegendPlugin]} />
    </div>
  );
}
