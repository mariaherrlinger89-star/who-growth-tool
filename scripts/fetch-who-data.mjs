/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import * as XLSX from "xlsx";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUT_DIR = path.join(__dirname, "..", "src", "data");
const OUT_G = path.join(OUT_DIR, "wfa_girls_lms.json");
const OUT_B = path.join(OUT_DIR, "wfa_boys_lms.json");

const SOURCES = {
  girlsWeeks: "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa_girls_0-to-13-weeks_zscores.xlsx",
  girlsYears: "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa_girls_0-to-5-years_zscores.xlsx",
  boysWeeks:  "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa_boys_0-to-13-weeks_zscores.xlsx",
  boysYears:  "https://cdn.who.int/media/docs/default-source/child-growth/child-growth-standards/indicators/weight-for-age/wfa_boys_0-to-5-years_zscores.xlsx"
};

const FALLBACK = (sex) => [
  { age_days: 0,   L: sex==="girl"?0.3809:0.3487,  M: sex==="girl"?3.2322:3.3464,  S: sex==="girl"?0.14171:0.14602 },
  { age_days: 30,  L: sex==="girl"?0.1714:0.2297,  M: sex==="girl"?4.1873:4.4709,  S: sex==="girl"?0.13724:0.13395 },
  { age_days: 91,  L: sex==="girl"?0.0402:0.1738,  M: sex==="girl"?5.8458:6.3762,  S: sex==="girl"?0.12619:0.11727 },
  { age_days: 1826,L: sex==="girl"?-0.3518:-0.1506, M: sex==="girl"?18.2193:18.3366, S: sex==="girl"?0.14821:0.13517 }
];

async function downloadXlsx(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download fehlgeschlagen ${url} -> ${res.status}`);
  const array = new Uint8Array(await res.arrayBuffer());
  return XLSX.read(array, { type: "array" });
}

function sheetToWeeksLMS(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map(r => ({
    age_days: Math.round((r.Week ?? r.week ?? 0) * 7),
    L: Number(r.L), M: Number(r.M), S: Number(r.S)
  })).filter(r => Number.isFinite(r.age_days) && Number.isFinite(r.M));
}

function sheetToMonthsLMS(wb) {
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  return rows.map(r => ({
    age_days: Math.round((r.Month ?? r.month ?? 0) * 30.4375),
    L: Number(r.L), M: Number(r.M), S: Number(r.S)
  })).filter(r => Number.isFinite(r.age_days) && Number.isFinite(r.M));
}

function merge(a, b) {
  const map = new Map();
  [...a, ...b].forEach(r => { if (!map.has(r.age_days)) map.set(r.age_days, r); });
  return [...map.values()]
    .sort((x,y) => x.age_days - y.age_days)
    .filter(r => r.age_days >= 0 && r.age_days <= Math.round(60*30.4375));
}

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  try {
    const [gw, gy, bw, by] = await Promise.all([
      downloadXlsx(SOURCES.girlsWeeks),
      downloadXlsx(SOURCES.girlsYears),
      downloadXlsx(SOURCES.boysWeeks),
      downloadXlsx(SOURCES.boysYears)
    ]);
    const girls = merge(sheetToWeeksLMS(gw), sheetToMonthsLMS(gy));
    const boys  = merge(sheetToWeeksLMS(bw), sheetToMonthsLMS(by));
    fs.writeFileSync(OUT_G, JSON.stringify(girls), "utf8");
    fs.writeFileSync(OUT_B, JSON.stringify(boys), "utf8");
    console.log(`WHO LMS geschrieben: g=${girls.length}, b=${boys.length}`);
  } catch (e) {
    console.warn("WHO-Download fehlgeschlagen, schreibe Fallback:", e.message);
    fs.writeFileSync(OUT_G, JSON.stringify(FALLBACK("girl")), "utf8");
    fs.writeFileSync(OUT_B, JSON.stringify(FALLBACK("boy")), "utf8");
  }
})();
