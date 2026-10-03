/**
 * src/lib/efek.js
 * ---------------------------------------------------------------------------
 * Flag efek gerak. Tujuannya agar tiap efek bisa dinyalakan/dimatikan
 * SENDIRI-SENDIRI saat membandingkan mana yang layak dipakai.
 *
 * Prioritas nilai:
 *   1. query string  → ?efek=reveal,marquee
 *   2. localStorage  → diatur oleh PanelEfek (mode dev)
 *   3. default       → semua aktif
 *
 * Nilai yang dikenal: reveal, spy, marquee, anggota.
 *   ?efek=semua  / all  → semuanya aktif
 *   ?efek=none   / off  → semuanya mati (halaman kembali minimal)
 *   ?efek=        (kosong) → semuanya mati
 * ---------------------------------------------------------------------------
 */

const KUNCI = 'swot-ikn-efek'
const SEMUA = ['reveal', 'spy', 'marquee', 'anggota']

export const semuaEfek = SEMUA

export const labelEfek = {
  reveal: 'Reveal kata',
  spy: 'Scroll spy nav',
  marquee: 'Marquee ticker',
  anggota: 'Kartu anggota',
}

function baca() {
  if (typeof window === 'undefined') return [...SEMUA]

  let mentah = null
  try {
    mentah = new URLSearchParams(window.location.search).get('efek')
  } catch {
    mentah = null
  }
  if (mentah == null) {
    try {
      mentah = window.localStorage.getItem(KUNCI)
    } catch {
      mentah = null
    }
  }
  if (mentah == null) return [...SEMUA]

  const daftar = mentah
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (!daftar.length || daftar.includes('none') || daftar.includes('off')) return []
  if (daftar.includes('semua') || daftar.includes('all')) return [...SEMUA]

  return SEMUA.filter((e) => daftar.includes(e))
}

const aktif = new Set(baca())

export const efek = Object.fromEntries(SEMUA.map((e) => [e, aktif.has(e)]))

/** Dipakai hanya oleh PanelEfek (mode dev). */
export function simpanEfek(daftar) {
  try {
    window.localStorage.setItem(KUNCI, daftar.join(','))
  } catch {
    /* localStorage bisa diblokir — abaikan, halaman tetap jalan. */
  }
}
