import zlib from "zlib";

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
}

/**
 * Pure TypeScript OpenXML (.xlsx) Workbook Generator
 * Produces valid, native Microsoft Excel .xlsx files with zero external dependencies.
 */
export function generateExcelBuffer(
  columns: { header: string; width?: number }[],
  data: (string | number | null | undefined)[][],
  sheetName = "Vouchers"
): Buffer {
  function escapeXml(str: unknown): string {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  function colName(n: number): string {
    let s = "";
    while (n >= 0) {
      s = String.fromCharCode((n % 26) + 65) + s;
      n = Math.floor(n / 26) - 1;
    }
    return s;
  }

  const allRows: (string | number | null | undefined)[][] = [
    columns.map((c) => c.header),
    ...data,
  ];

  let sheetXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
  sheetXml += '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">\n';

  // Optional column widths
  if (columns.some((c) => c.width)) {
    sheetXml += "  <cols>\n";
    columns.forEach((col, idx) => {
      const width = col.width || 18;
      sheetXml += `    <col min="${idx + 1}" max="${idx + 1}" width="${width}" customWidth="1"/>\n`;
    });
    sheetXml += "  </cols>\n";
  }

  sheetXml += "  <sheetData>\n";
  allRows.forEach((row, rIdx) => {
    sheetXml += `    <row r="${rIdx + 1}">\n`;
    row.forEach((val, cIdx) => {
      const ref = `${colName(cIdx)}${rIdx + 1}`;
      if (typeof val === "number" && !isNaN(val)) {
        sheetXml += `      <c r="${ref}" t="n"><v>${val}</v></c>\n`;
      } else {
        sheetXml += `      <c r="${ref}" t="inlineStr"><is><t>${escapeXml(val)}</t></is></c>\n`;
      }
    });
    sheetXml += "    </row>\n";
  });
  sheetXml += "  </sheetData>\n</worksheet>";

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">\n' +
    '  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>\n' +
    '  <Default Extension="xml" ContentType="application/xml"/>\n' +
    '  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>\n' +
    '  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>\n' +
    "</Types>";

  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>\n' +
    "</Relationships>";

  const wbRels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">\n' +
    '  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>\n' +
    "</Relationships>";

  const safeSheetName = escapeXml(sheetName.replace(/[\\/?*[\]]/g, "_").slice(0, 31));
  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">\n' +
    `  <sheets><sheet name="${safeSheetName}" sheetId="1" r:id="rId1"/></sheets>\n` +
    "</workbook>";

  const files = [
    { name: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf8") },
    { name: "_rels/.rels", data: Buffer.from(rels, "utf8") },
    { name: "xl/workbook.xml", data: Buffer.from(workbook, "utf8") },
    { name: "xl/_rels/workbook.xml.rels", data: Buffer.from(wbRels, "utf8") },
    { name: "xl/worksheets/sheet1.xml", data: Buffer.from(sheetXml, "utf8") },
  ];

  // CRC32 table
  const crcTable = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crcTable[i] = c;
  }
  function crc32(buf: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  const entries = files.map((f) => {
    const compressed = zlib.deflateRawSync(f.data);
    const useCompressed = compressed.length < f.data.length;
    const body = useCompressed ? compressed : f.data;
    return {
      name: f.name,
      body,
      method: useCompressed ? 8 : 0,
      crc: crc32(f.data),
      size: f.data.length,
      cSize: body.length,
    };
  });

  const localHeaders: Buffer[] = [];
  const cdHeaders: Buffer[] = [];
  let offset = 0;

  for (const e of entries) {
    const nameBuf = Buffer.from(e.name, "utf8");
    const local = Buffer.alloc(30 + nameBuf.length);
    local.writeUInt32LE(0x04034b50, 0); // Local file header signature
    local.writeUInt16LE(20, 4); // version needed
    local.writeUInt16LE(0, 6); // general purpose bit flag
    local.writeUInt16LE(e.method, 8); // compression method
    local.writeUInt16LE(0, 10); // file last mod time
    local.writeUInt16LE(0, 12); // file last mod date
    local.writeUInt32LE(e.crc, 14); // crc-32
    local.writeUInt32LE(e.cSize, 18); // compressed size
    local.writeUInt32LE(e.size, 22); // uncompressed size
    local.writeUInt16LE(nameBuf.length, 26); // file name length
    local.writeUInt16LE(0, 28); // extra field length
    nameBuf.copy(local, 30);

    const cd = Buffer.alloc(46 + nameBuf.length);
    cd.writeUInt32LE(0x02014b50, 0); // Central directory header signature
    cd.writeUInt16LE(20, 4); // version made by
    cd.writeUInt16LE(20, 6); // version needed
    cd.writeUInt16LE(0, 8); // general purpose bit flag
    cd.writeUInt16LE(e.method, 10); // compression method
    cd.writeUInt16LE(0, 12); // file last mod time
    cd.writeUInt16LE(0, 14); // file last mod date
    cd.writeUInt32LE(e.crc, 16); // crc-32
    cd.writeUInt32LE(e.cSize, 20); // compressed size
    cd.writeUInt32LE(e.size, 24); // uncompressed size
    cd.writeUInt16LE(nameBuf.length, 28); // file name length
    cd.writeUInt16LE(0, 30); // extra field length
    cd.writeUInt16LE(0, 32); // file comment length
    cd.writeUInt16LE(0, 34); // disk number start
    cd.writeUInt16LE(0, 36); // internal file attributes
    cd.writeUInt32LE(0, 38); // external file attributes
    cd.writeUInt32LE(offset, 42); // relative offset of local header
    nameBuf.copy(cd, 46);

    localHeaders.push(local, e.body);
    cdHeaders.push(cd);
    offset += local.length + e.body.length;
  }

  const cdSize = cdHeaders.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // End of central dir signature
  eocd.writeUInt16LE(0, 4); // number of this disk
  eocd.writeUInt16LE(0, 6); // disk where central directory starts
  eocd.writeUInt16LE(entries.length, 8); // total number of central dir records on this disk
  eocd.writeUInt16LE(entries.length, 10); // total number of central dir records
  eocd.writeUInt32LE(cdSize, 12); // size of central dir
  eocd.writeUInt32LE(offset, 16); // offset of start of central dir
  eocd.writeUInt16LE(0, 20); // comment length

  return Buffer.concat([...localHeaders, ...cdHeaders, eocd]);
}
