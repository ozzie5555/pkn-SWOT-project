/**
 * src/lib/anggota.js
 * ---------------------------------------------------------------------------
 * Helper kecil untuk tampilan bagian anggota (TimAnggota).
 * ---------------------------------------------------------------------------
 */

/** Ambil 1–2 huruf pertama tiap kata sebagai monogram (mis. "AW", "KMP"). */
export function inisial(nama) {
  return String(nama ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((kata) => kata[0]?.toUpperCase() ?? '')
    .join('')
}
