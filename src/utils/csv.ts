// src/utils/csv.ts
function guardCsvText(s: string) {
  return s === '' ? '' : /^[=+\-@]/.test(s) ? `'${s}` : s
}
function csvEscape(s: string) {
  const needs = /[",\n]/.test(s)
  const body = s.replace(/"/g, '""')
  return needs ? `"${body}"` : body
}

export function toCSVWithColumns<T extends Record<string, any>>(
  rows: T[],
  headers: string[],
  textColumns: string[] = []
): string {
  const heads = headers.filter(h => h !== 'id')
  const textSet = new Set(textColumns.map(s => s.toLowerCase()))
  const lines = [heads.join(',')]

  for (const r of rows) {
    const vals = heads.map(h => {
      const raw = (r as any)[h]
      const s = raw == null ? '' : String(raw)
      const guarded = textSet.has(h.toLowerCase()) ? guardCsvText(s) : s
      return csvEscape(guarded)
    })
    lines.push(vals.join(','))
  }
  return lines.join('\n')
}

// Consolidated toCSV function
export function toCSV(list: any[]): string {
  return JSON.stringify(list); // 暫時回傳 JSON 字串作為 CSV 替代
}
