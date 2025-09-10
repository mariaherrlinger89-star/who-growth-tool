import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler
} from "chart.js";
import { fromZ } from "../lib/zscore";
import { getLms } from "../lib/lms";
import { xTicks } from "../lib/axis";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Row = { date: string; weight_g: number; ageDays: number; z: number|null; };
export default function WhoChart({ sex, rows }: { sex: "girl"|"boy"; rows: Row[] }) {
  // Erzeuge WHO-Referenzkurven
  const maxAge = Math.max(1826, rows.at(-1)?.ageDays ?? 0);
  const ticks = xTicks(maxAge);
  const xs = ticks.map(t => t.value); // in days

  const ZS = [-3, -2, -1, 0, +1, +2, +3] as const;
  const palette = (z:number) => z===0 ? "#2e7d32" : (Math.abs(z)===2 ? "#c62828" : "#212121");
  const width = (z:number) => z===0 ? 2.25 : (Math.abs(z)===2 ? 1.75 : 1.5);

  const refDatasets = ZS.map(z => {
    const data = xs.map(d => {
      const p = getLms(sex, d);
      if (!p) return null;
      return Number(fromZ(p.L, p.M, p.S, z).toFixed(3)); // kg
    });
    return {
      label: `Z ${z}`,
      data,
      borderColor: palette(z),
      borderWidth: width(z),
      pointRadius: 0,
      tension: 0.02
    };
  });

  const childData = rows.map(r => ({ x: r.ageDays, y: r.weight_g/1000 }));

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: "linear",
        min: 0,
        max: Math.max(1826, rows.at(-1)?.ageDays ?? 0),
        grid: {
          color: "rgba(0,0,0,0.06)",
          lineWidth: (ctx:any) => {
            // etwas kräftigere Monatslinien wie WHO-Optik
            const v = ctx.tick.value;
            const isWeek = v <= 91 && v % 7 === 0;
            const isMonth = v > 91 && Math.abs(v/30.4375 - Math.round(v/30.4375)) < 0.02;
            return isMonth ? 1.2 : (isWeek ? 0.6 : 0.3);
          }
        },
        ticks: {
          callback: (value:number) => {
            if (value <= 91) return Math.round(value/7).toString(); // Wochen
            return Math.round(value/30.4375).toString();            // Monate
          }
        },
        title: {
          display: true,
          text: "Alter (Wochen 0–13, danach Monate 4–60)"
        }
      },
      y: {
        type: "linear",
        min: 2,
        max: 25,
        grid: { color: "rgba(0,0,0,0.06)" },
        ticks: { stepSize: 1 },
        title: { display: true, text: "Gewicht (kg)" }
      }
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          filter: (item:any) => [ "-3","-2","0","+2","+3" ].includes(String(item.text).replace("Z ",""))
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx:any) => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} kg`
        }
      }
    },
    elements: {
      line: { spanGaps: true }
    }
  };

  const data = {
    labels: xs,
    datasets: [
      ...refDatasets,
      {
        label: "Kind",
        data: childData,
        parsing: false,
        borderColor: "#75b1e5",
        backgroundColor: "#75b1e5",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  return (
    <div className="relative" style={{height: 520}}>
      <Line data={data as any} options={options} />
      <div className="absolute -top-3 right-0 text-xs text-textdark/60">
        WHO-Linien: Z-Scores (−3, −2, 0, +2, +3)
      </div>
    </div>
  );
}
