/**
 * Lector ligero y nativo de archivos Excel (.xlsx) para navegador sin dependencias externas.
 * Soporta ZIP con Central Directory (incluyendo Data Descriptors de Excel/Google Sheets),
 * sharedStrings.xml (texto plano y rich text), inlineStr, namespaces XML prefijados y celdas dispersas.
 */

interface ZipEntryInfo {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
}

function findEocdOffset(view: DataView): number {
  const minOffset = Math.max(0, view.byteLength - 65557);
  for (let i = view.byteLength - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      return i;
    }
  }
  return -1;
}

function parseZipDirectory(buffer: ArrayBuffer): Map<string, ZipEntryInfo> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');
  const entries = new Map<string, ZipEntryInfo>();

  const eocdOffset = findEocdOffset(view);
  if (eocdOffset < 0) {
    throw new Error('El archivo no es un .xlsx válido (firma ZIP no encontrada).');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  let offset = view.getUint32(eocdOffset + 16, true);

  for (let i = 0; i < totalEntries; i++) {
    if (view.getUint32(offset, true) !== 0x02014b50) break;

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLen = view.getUint16(offset + 28, true);
    const extraLen = view.getUint16(offset + 30, true);
    const commentLen = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);

    const name = decoder
      .decode(bytes.subarray(offset + 46, offset + 46 + fileNameLen))
      .replace(/\\/g, '/');

    entries.set(name.toLowerCase(), {
      name,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLen + extraLen + commentLen;
  }

  return entries;
}

async function inflateRaw(compressed: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error(
      'Tu navegador no soporta descompresión nativa para .xlsx. Actualiza el navegador o usa formato .csv.'
    );
  }

  const copy = new Uint8Array(compressed.byteLength);
  copy.set(compressed);
  const stream = new Blob([copy])
    .stream()
    .pipeThrough(new DecompressionStream('deflate-raw'));
  const decompressedBuffer = await new Response(stream).arrayBuffer();
  return new Uint8Array(decompressedBuffer);
}

async function readZipEntryText(
  buffer: ArrayBuffer,
  entry: ZipEntryInfo
): Promise<string> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== 0x04034b50) {
    throw new Error(`Encabezado ZIP inválido para ${entry.name}`);
  }

  const fileNameLen = view.getUint16(offset + 26, true);
  const extraLen = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLen + extraLen;
  const compressed = bytes.subarray(dataStart, dataStart + entry.compressedSize);

  let rawBytes: Uint8Array;
  if (entry.compressionMethod === 0) {
    rawBytes = compressed;
  } else if (entry.compressionMethod === 8) {
    rawBytes = await inflateRaw(compressed);
  } else {
    throw new Error(`Método de compresión ZIP no soportado (${entry.compressionMethod}).`);
  }

  return new TextDecoder('utf-8').decode(rawBytes);
}

function colRefToIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/gi, '').toUpperCase();
  let col = 0;
  for (let i = 0; i < letters.length; i++) {
    col = col * 26 + (letters.charCodeAt(i) - 64);
  }
  return Math.max(0, col - 1);
}

function parseSharedStrings(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const siNodes = Array.from(doc.getElementsByTagNameNS('*', 'si'));
  return siNodes.map((si) => {
    const tNodes = Array.from(si.getElementsByTagNameNS('*', 't'));
    return tNodes.map((t) => t.textContent || '').join('');
  });
}

function resolveFirstSheetKey(
  entries: Map<string, ZipEntryInfo>,
  workbookXml?: string,
  relsXml?: string
): string {
  if (workbookXml && relsXml) {
    try {
      const wbDoc = new DOMParser().parseFromString(workbookXml, 'application/xml');
      const firstSheet = wbDoc.getElementsByTagNameNS('*', 'sheet')[0];
      const rId =
        firstSheet?.getAttribute('r:id') ||
        firstSheet?.getAttributeNS(
          'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
          'id'
        );

      if (rId) {
        const relsDoc = new DOMParser().parseFromString(relsXml, 'application/xml');
        const rels = Array.from(relsDoc.getElementsByTagNameNS('*', 'Relationship'));
        const match = rels.find((r) => r.getAttribute('Id') === rId);
        const target = match?.getAttribute('Target');
        if (target) {
          const normalized = (
            target.startsWith('/')
              ? target.slice(1)
              : target.toLowerCase().startsWith('xl/')
                ? target
                : `xl/${target.replace(/^\.\//, '')}`
          ).toLowerCase();
          if (entries.has(normalized)) return normalized;
        }
      }
    } catch {
      // Fallback below
    }
  }

  if (entries.has('xl/worksheets/sheet1.xml')) {
    return 'xl/worksheets/sheet1.xml';
  }

  for (const key of entries.keys()) {
    if (/^xl\/worksheets\/sheet\d+\.xml$/i.test(key)) {
      return key;
    }
  }

  throw new Error('No se encontró ninguna hoja de cálculo dentro del archivo .xlsx.');
}

function parseSheetRows(xml: string, sharedStrings: string[]): string[][] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const rowNodes = Array.from(doc.getElementsByTagNameNS('*', 'row'));
  const rows: string[][] = [];

  for (const rowNode of rowNodes) {
    const cells = Array.from(rowNode.getElementsByTagNameNS('*', 'c'));
    const rowValues: string[] = [];

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const ref = cell.getAttribute('r');
      const colIdx = ref ? colRefToIndex(ref) : i;
      const type = cell.getAttribute('t') || '';

      let value = '';
      if (type === 's') {
        const vNode = cell.getElementsByTagNameNS('*', 'v')[0];
        const idx = Number(vNode?.textContent ?? -1);
        value = idx >= 0 && idx < sharedStrings.length ? sharedStrings[idx] : '';
      } else if (type === 'inlineStr') {
        const tNodes = Array.from(cell.getElementsByTagNameNS('*', 't'));
        value = tNodes.map((t) => t.textContent || '').join('');
      } else {
        const vNode = cell.getElementsByTagNameNS('*', 'v')[0];
        value = vNode?.textContent || '';
      }

      while (rowValues.length < colIdx) {
        rowValues.push('');
      }
      rowValues[colIdx] = value.trim();
    }

    if (rowValues.some((v) => v.length > 0)) {
      rows.push(rowValues);
    }
  }

  return rows;
}

export async function readXlsxRows(file: File): Promise<string[][]> {
  const buffer = await file.arrayBuffer();
  const entries = parseZipDirectory(buffer);

  let sharedStrings: string[] = [];
  const sharedEntry = entries.get('xl/sharedstrings.xml');
  if (sharedEntry) {
    const sharedXml = await readZipEntryText(buffer, sharedEntry);
    sharedStrings = parseSharedStrings(sharedXml);
  }

  const wbEntry = entries.get('xl/workbook.xml');
  const relsEntry = entries.get('xl/_rels/workbook.xml.rels');
  const wbXml = wbEntry ? await readZipEntryText(buffer, wbEntry) : undefined;
  const relsXml = relsEntry ? await readZipEntryText(buffer, relsEntry) : undefined;

  const sheetKey = resolveFirstSheetKey(entries, wbXml, relsXml);
  const sheetEntry = entries.get(sheetKey);
  if (!sheetEntry) {
    throw new Error('No se pudo leer la hoja principal del archivo Excel.');
  }

  const sheetXml = await readZipEntryText(buffer, sheetEntry);
  return parseSheetRows(sheetXml, sharedStrings);
}
