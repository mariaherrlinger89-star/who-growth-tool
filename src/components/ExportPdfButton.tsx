// src/components/ExportPdfButton.tsx
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import type { ChartJSOrUndefined } from "react-chartjs-2/dist/types";

// 👇 Importiere dein Bild aus src
import myLogo from "../eazy mama logo pimk.png";

type Row = { date: string; weight_g: number; ageDays: number; z: number | null };

const BRAND_PINK = "#ff6392";

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
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();

    const margin = 40;
    let y = margin;

    // ===== Logo oben rechts (importiertes Bild) =====
    try {
      const logo = new Image();
      logo.src = myLogo; // direkt aus dem Import
      await new Promise<void>((resolve) => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
      });
      if (logo.width && logo.height) {
        const logoW = 90;
        const logoH = (logo.height * logoW) / logo.width;
        const logoX = pageW - margin - logoW;
        doc.addImage(logo, "PNG", logoX, y, logoW, logoH);
      }
    } catch {
      // Logo optional
    }

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

    // Messwerte-Tabelle
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Messwerte", margin, y);
    y += 16;

    const header = ["Datum", "Alter (Tage)", "Gewicht (kg)", "Z-Score"];
    const colW = [140, 120, 120, 100];
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
      if (y > 800) {
        drawFooter(doc, pageW, pageH, margin);
        doc.addPage();
        y = margin;
      }
    });

    drawFooter(doc, pageW, pageH, margin);

    const fileName = `${childName ? childName.replace(/\s+/g, "_") + "_" : ""}who_gewichtsverlauf.pdf`;
    doc.save(fileName);
  };

  return (
    <button type="button" className="btn-primary" onClick={onExport}>
      Daten als PDF herunterladen
    </button>
  );
}

// Footer mit Linie und Kontaktinfos
function drawFooter(doc: jsPDF, pageW: number, pageH: number, margin: number) {
  const lineY = pageH - margin - 28;
  const textY = lineY + 18;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.8);
  doc.line(margin, lineY, pageW - margin, lineY);

  doc.setTextColor(BRAND_PINK);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  const footerTex
