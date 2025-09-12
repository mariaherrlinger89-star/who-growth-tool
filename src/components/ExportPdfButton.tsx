// src/components/ExportPdfButton.tsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

export default function ExportPdfButton({
  childName,
  sex,
  dob,
  rows,
  chartRef,
}: {
  childName: string;
  sex: "girl" | "boy";
  dob: string;
  rows: Row[];
  chartRef: React.RefObject<ChartJSOrUndefined<"line">>;
}) {
  const onExport = async () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" }); // 595x842 pt
    const margin = 40;
    let y = margin;

    // Titel
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Gewichtsentwicklung (WHO) – eazy-mama.de", margin, y);
    y += 22;

    // Stammdaten
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const meta = [
      `Name: ${childName || "—"}`,
      `Geschlecht: ${sex === "girl" ? "Mädchen" : "Junge"}`,
      `Geburtsdatum: ${dob || "—"}`,
      `Exportdatum: ${new Date().toLocaleDateString()}`,
    ];
    meta.forEach((line) => {
      doc.text(line, margin, y);
      y += 16;
    });
    y += 6;

    // Chart als Bild einfügen
    const chartInstance = chartRef.current;
    const canvas = chartInstance?.canvas as HTMLCanvasElement | undefined;
    if (canvas) {
      const dataUrl = canvas.toDataURL("image/png", 1.0);
      // Breite max. (A4 - 2*margin), Höhe proportional
      const maxW = 595 - margin * 2;
      const scale = maxW / canvas.width;
      const h = canvas.height * scale;
      doc.addImage(dataUrl, "PNG", margin, y, maxW, h);
      y += h + 20;
    } else {
      doc.setTextColor(200, 0, 0);
      doc.text("Hinweis: Chart konnte nicht exportiert werden.", margin, y);
      doc.setTextColor(0, 0, 0);
      y += 20;
    }

    // Messwerte-Tabelle (Datum | Alter (Tage) | Gewicht (kg) | Z-Score)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Messwerte", margin, y);
    y += 16;

    const header = ["Datum", "Alter (Tage)", "Gewicht (kg)", "Z-Score"];
    const colW = [140, 120, 120, 100]; // summiert < (595 - 2*margin)
    const drawRow = (cells: string[], isHeader = false) => {
      let x = margin;
      if (isHeader) doc.setFont("helvetica", "bold");
      else doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      cells.forEach((c, i) => {
        doc.text(String(c), x, y);
        x += colW[i];
      });
      y += 16;
    };

    drawRow(header, true);
    const rowsToPrint = rows.slice().sort((a, b) => a.ageDays - b.ageDays);
    rowsToPrint.forEach((r) => {
      const weightKg = (r.weight_g / 1000).toFixed(2);
      const z = r.z === null ? "—" : r.z.toFixed(2);
      drawRow([r.date, String(r.ageDays), weightKg, z]);
      // Seitenumbruch falls nötig
      if (y > 800) {
        doc.addPage();
        y = margin;
      }
    });

    const fileName = `${childName ? childName.replace(/\s+/g, "_") + "_" : ""}who_gewichtsverlauf.pdf`;
    doc.save(fileName);
  };

  return (
    <button type="button" className="btn-primary" onClick={onExport}>
      Daten als PDF herunterladen
    </button>
  );
}
