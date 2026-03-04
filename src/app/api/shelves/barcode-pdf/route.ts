import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ============================================================
// 本棚バーコードPDF生成 API
// GET /api/shelves/barcode-pdf?id=xxx
// GET /api/shelves/barcode-pdf?all=true (全本棚)
//
// Code128 バーコードを SVG で描画し、それを含む印刷用 HTML を返す
// ============================================================

// Code128B エンコード
function encodeCode128B(text: string): number[] {
  const START_B = 104;
  const STOP = 106;
  const values: number[] = [START_B];

  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    if (charCode < 32 || charCode > 126) {
      values.push(0); // fallback
    } else {
      values.push(charCode - 32);
    }
  }

  // チェックサム計算
  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  checksum = checksum % 103;
  values.push(checksum);
  values.push(STOP);

  return values;
}

// Code128 パターンテーブル
const CODE128_PATTERNS: string[] = [
  "11011001100", "11001101100", "11001100110", "10010011000", "10010001100",
  "10001001100", "10011001000", "10011000100", "10001100100", "11001001000",
  "11001000100", "11000100100", "10110011100", "10011011100", "10011001110",
  "10111001100", "10011101100", "10011100110", "11001110010", "11001011100",
  "11001001110", "11011100100", "11001110100", "11101101110", "11101001100",
  "11100101100", "11100100110", "11101100100", "11100110100", "11100110010",
  "11011011000", "11011000110", "11000110110", "10100011000", "10001011000",
  "10001000110", "10110001000", "10001101000", "10001100010", "11010001000",
  "11000101000", "11000100010", "10110111000", "10110001110", "10001101110",
  "10111011000", "10111000110", "10001110110", "11101110110", "11010001110",
  "11000101110", "11011101000", "11011100010", "11011101110", "11101011000",
  "11101000110", "11100010110", "11101101000", "11101100010", "11100011010",
  "11101111010", "11001000010", "11110001010", "10100110000", "10100001100",
  "10010110000", "10010000110", "10000101100", "10000100110", "10110010000",
  "10110000100", "10011010000", "10011000010", "10000110100", "10000110010",
  "11000010010", "11001010000", "11110111010", "11000010100", "10001111010",
  "10100111100", "10010111100", "10010011110", "10111100100", "10011110100",
  "10011110010", "11110100100", "11110010100", "11110010010", "11011011110",
  "11011110110", "11110110110", "10101111000", "10100011110", "10001011110",
  "10111101000", "10111100010", "11110101000", "11110100010", "10111011110",
  "10111101110", "11101011110", "11110101110",
  "11010000100", "11010010000", "11010011100", "1100011101011",
];

function generateBarcodeSVG(text: string, width: number = 300, height: number = 80): string {
  const values = encodeCode128B(text);
  let binary = "";
  for (const v of values) {
    binary += CODE128_PATTERNS[v] || "";
  }

  const barWidth = width / binary.length;
  let bars = "";
  for (let i = 0; i < binary.length; i++) {
    if (binary[i] === "1") {
      bars += `<rect x="${i * barWidth}" y="0" width="${barWidth}" height="${height}" fill="black"/>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height + 20}" width="${width}" height="${height + 20}">
    ${bars}
    <text x="${width / 2}" y="${height + 16}" text-anchor="middle" font-family="monospace" font-size="12">${text}</text>
  </svg>`;
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const all = request.nextUrl.searchParams.get("all");

  const supabase = await createClient();

  let shelves: { id: string; name: string; location: string; barcode: string }[] = [];

  if (all === "true") {
    const { data, error } = await supabase.from("shelves").select("id, name, location, barcode").order("name");
    if (error || !data) {
      return NextResponse.json({ error: "本棚が見つかりません" }, { status: 404 });
    }
    shelves = data;
  } else if (id) {
    const { data, error } = await supabase.from("shelves").select("id, name, location, barcode").eq("id", id).single();
    if (error || !data) {
      return NextResponse.json({ error: "本棚が見つかりません" }, { status: 404 });
    }
    shelves = [data];
  } else {
    return NextResponse.json({ error: "id または all パラメータが必要です" }, { status: 400 });
  }

  // 印刷用HTMLとしてバーコードを出力
  const barcodeCards = shelves
    .map((shelf) => {
      const svg = generateBarcodeSVG(shelf.barcode, 300, 80);
      return `
        <div class="card">
          <h2>${shelf.name}</h2>
          ${shelf.location ? `<p class="location">${shelf.location}</p>` : ""}
          <div class="barcode">${svg}</div>
          <p class="code">${shelf.barcode}</p>
        </div>
      `;
    })
    .join("\n");

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <title>本棚バーコード</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      padding: 20mm;
      background: white;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15mm;
    }
    .card {
      border: 2px solid #333;
      border-radius: 8px;
      padding: 10mm;
      text-align: center;
      page-break-inside: avoid;
    }
    h2 { font-size: 18px; margin-bottom: 4px; }
    .location { font-size: 13px; color: #666; margin-bottom: 8px; }
    .barcode { margin: 8mm auto; max-width: 80mm; }
    .barcode svg { width: 100%; height: auto; }
    .code { font-family: monospace; font-size: 14px; color: #333; margin-top: 4px; }
    .print-btn {
      position: fixed; top: 10px; right: 10px;
      padding: 8px 20px; background: #2563eb; color: white;
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 14px;
    }
    @media print {
      .print-btn { display: none; }
      body { padding: 10mm; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">印刷する</button>
  <div class="cards">
    ${barcodeCards}
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
