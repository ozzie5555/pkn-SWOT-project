/**
 * src/lib/anggota.js
 * ---------------------------------------------------------------------------
 * Helper kecil untuk tampilan bagian anggota (TimAnggota).
 * ---------------------------------------------------------------------------
 */

// Deteksi semua file gambar di src/assets/anggota/ secara otomatis (Vite import.meta.glob)
const fotoGlob = import.meta.glob('../assets/anggota/*.{jpg,jpeg,png,webp,svg,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  import: 'default',
})

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

/**
 * Ubah nama lengkap → slug nama berkas foto.
 * "Rieva Asancaya Aneela El Daviq" → "rieva-asancaya-aneela-el-daviq"
 */
export function slugNama(nama) {
  return String(nama ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // buang tanda baca
    .replace(/\s+/g, '-') // spasi → strip
    .replace(/-+/g, '-') // strip ganda → satu
    .replace(/^-|-$/g, '') // strip di tepi
}

/**
 * Cari foto anggota dari src/assets/anggota/ berdasarkan slug nama —
 * tanpa path manual. Ekstensi bebas (.jpg/.jpeg/.png/.webp/.svg).
 * Urutan cocok: nama lengkap → dua kata pertama → satu kata pertama (≥4 huruf).
 * Contoh yang semuanya valid: amaris-wursita.jpg · krisna-mandala.jpg · restu.jpg
 * Bila tidak ada yang cocok → `fotoExplicit` (field `foto` di data.js) → null.
 */
export function cariFotoAnggota(nama, fotoExplicit = null) {
  const slug = slugNama(nama)

  if (slug) {
    const kata = slug.split('-')
    const slugDuaKata = kata.slice(0, 2).join('-')
    const slugSatuKata = kata[0]

    for (const path in fotoGlob) {
      const filename = path.split('/').pop()?.toLowerCase() ?? ''
      const nameWithoutExt = filename.substring(0, filename.lastIndexOf('.'))

      if (
        nameWithoutExt === slug ||
        nameWithoutExt === slugDuaKata ||
        (slugSatuKata.length >= 4 && nameWithoutExt === slugSatuKata)
      ) {
        return fotoGlob[path]
      }
    }
  }

  return fotoExplicit
}
