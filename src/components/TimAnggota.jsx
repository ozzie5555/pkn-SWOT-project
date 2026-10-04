import { useState } from 'react'

import Reveal from '@/components/Reveal'
import { Rule } from '@/components/Rule'
import { Section, SectionHeading } from '@/components/Section'
import { meta } from '@/data'
import { inisial } from '@/lib/anggota'
import { efek } from '@/lib/efek'
import { cn } from '@/lib/utils'

/**
 * Section "Tim Penyusun" (bab 05) — adaptasi konsep "Team Showcase"
 * (grid potret staggered + daftar nama interaktif yang tersinkron).
 *
 * Cara kerja sinkron:
 * - Satu state `aktif` (index anggota). Hover/focus pada kartu potret ATAU
 *   baris nama → keduanya menyala bersamaan (potret berwarna penuh, baris
 *   nama beraksen dan bergeser sedikit).
 * - Kartu & baris berupa <button> dengan onFocus/onBlur, sehingga interaksi
 *   tetap bisa ditelusuri lewat keyboard (Tab).
 * - `?efek=none` (flag `anggota` mati) → grid statis: potret selalu berwarna,
 *   tanpa highlight sinkron — halaman kembali minimal.
 *
 * Foto: `foto: null` di data.js → monogram inisial (tanpa request gambar,
 * jadi tidak ada 404). Saat foto disiapkan di public/anggota/, isi field
 * `foto` — bila file gagal dimuat, onError otomatis jatuh ke monogram.
 *
 * Aksesibilitas/performa: img lazy+async dengan width/height eksplisit
 * (anti-CLS); transisi menghormati prefers-reduced-motion.
 */

// Kolase "berantakan yang disengaja": tiap kartu punya preset miring/geser/
// skala deterministik (bukan Math.random — supaya layout stabil saat re-render).
// Kelas translate memakai prefix lg: (mobile cukup miring saja).
//
// ARAH GESER dijaga agar kartu kolom bertetangga TIDAK saling mendekat:
// kol 1 → kiri · kol 2 → kiri · kol 3 → kanan/kiri kecil · kol 4 → kanan.
// (Rotasi ±3° bisa "keluar" ~10px dari kotak kartu, jadi komponen geser
// horizontal dibatasi + gap antar kolom diperlebar.)
const SCATTER = [
  'rotate-[-3deg] scale-100 lg:-translate-x-1 lg:translate-y-2', // Amaris (kol 1)
  'rotate-[2.5deg] scale-[1.05] lg:translate-x-2 lg:-translate-y-2', // Krisna (kol 3)
  'rotate-[-2deg] scale-[0.95] lg:-translate-x-1 lg:translate-y-5', // Lathifa (kol 1)
  'rotate-[3deg] scale-[1.03] lg:translate-x-1 lg:-translate-y-1', // Lukas (kol 3)
  'rotate-[-1.5deg] scale-[1.02] lg:-translate-x-2 lg:-translate-y-3', // Rieva (kol 2)
  'rotate-[2deg] scale-[0.97] lg:translate-x-2 lg:translate-y-4', // Restu (kol 4)
  'rotate-[-2.5deg] scale-[1.04] lg:translate-x-1 lg:translate-y-1', // Satrya (kol 4)
  'rotate-[1.5deg] scale-[0.96] lg:-translate-x-2 lg:translate-y-5', // Theo (kol 2)
]

// Saat kartu aktif (hover/focus): lurus, membesar sedikit, naik, dan di atas
// kartu tetangga (z-20) — jadi fokus pembaca jelas di tengah kolase.
const SCATTER_AKTIF = 'z-20 rotate-0 scale-[1.06] lg:-translate-y-2'

// 8 potret di 4 kolom (2 per kolom) — tinggi blok jadi ≈ tinggi daftar nama
// di kanan, sehingga keduanya sejajar. Offset awal kolom dibedakan agar
// tepi atas/bawah tetap tak rata (kesan kolase).
//
// PASANGAN sengaja dijodohkan per kolom (tiap kolom = satu pasangan,
// bertumpuk vertikal): Amaris+Lathifa · Rieva+Theo · Krisna+Lukas · Restu+Satrya
// (indeks mengikuti urutan anggota di data.js: 0=Amaris, 1=Krisna, 2=Lathifa,
// 3=Lukas, 4=Rieva, 5=Restu, 6=Satrya, 7=Theo)
const KOLOM = [
  [0, 2], // Amaris + Lathifa
  [4, 7], // Rieva + Theo
  [1, 3], // Krisna + Lukas
  [5, 6], // Restu + Satrya
]
const OFFSET_KOLOM = ['', 'lg:mt-7', 'lg:mt-2', 'lg:mt-9']

export default function TimAnggota() {
  const { eyebrow, judul, deskripsi, anggota } = meta.section.tim
  const interaktif = efek.anggota
  const [aktif, setAktif] = useState(null)

  const nyalakan = (i) => interaktif && setAktif(i)
  const padamkan = () => interaktif && setAktif(null)

  return (
    <Section id="tim" className="border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Rule className="mt-2" />

        {/* Kepala bagian */}
        <div className="mt-12 grid items-end gap-8 sm:mt-14 lg:grid-cols-12">
          <SectionHeading
            bab="05"
            eyebrow={eyebrow}
            judul={judul}
            className="lg:col-span-7"
          />
          <Reveal className="lg:col-span-5" delay={120}>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              {deskripsi}
            </p>
          </Reveal>
        </div>

        {/* Showcase: kolase potret (kiri) + daftar nama (kanan) */}
        <div className="mt-14 grid items-start gap-12 lg:grid-cols-12 lg:gap-14">
          {/* ===== Kolase potret (4 kolom, miring & bergeser acak-deterministik) ===== */}
          <div className="order-1 grid grid-cols-2 gap-x-5 gap-y-8 sm:gap-x-6 lg:order-1 lg:col-span-8 lg:grid-cols-4 lg:gap-x-7">
            {KOLOM.map((indeks, kolom) => (
              <div
                key={kolom}
                className={cn(
                  'flex flex-col gap-7 sm:gap-8',
                  OFFSET_KOLOM[kolom],
                )}
              >
                {indeks.map((i) => {
                  const orang = anggota[i]
                  if (!orang) return null
                  const nyala = aktif === i

                  return (
                    <div
                      key={orang.id}
                      className={cn(
                        'transition-transform duration-300 ease-out motion-reduce:transition-none',
                        // Berantakan saat diam; lurus & di atas saat aktif
                        interaktif && nyala
                          ? SCATTER_AKTIF
                          : SCATTER[i],
                        // Kartu non-aktif agak turun (supaya yang aktif dominan)
                        interaktif && aktif !== null && !nyala && 'opacity-80',
                      )}
                    >
                      <PotretAnggota
                        orang={orang}
                        nyala={nyala}
                        interaktif={interaktif}
                        nomor={i + 1}
                        onAktif={() => nyalakan(i)}
                        onPadam={padamkan}
                        tampilkanNama
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* ===== Daftar nama interaktif ===== */}
          <div className="order-2 lg:order-2 lg:col-span-4">
            <ol className="divide-y border-t">
              {anggota.map((orang, i) => {
                const nyala = aktif === i

                return (
                  <li key={orang.id} className="divide-border/70">
                    <button
                      type="button"
                      onMouseEnter={() => nyalakan(i)}
                      onMouseLeave={padamkan}
                      onFocus={() => nyalakan(i)}
                      onBlur={padamkan}
                      className={cn(
                        'group flex w-full items-baseline justify-between gap-4 py-4 text-left transition-all duration-200 motion-reduce:transition-none',
                        interaktif && nyala
                          ? 'text-accent-ikn translate-x-1'
                          : 'text-foreground',
                      )}
                    >
                      <span className="flex min-w-0 items-baseline gap-4">
                        <span
                          className={cn(
                            'label-mono tabular-nums',
                            interaktif && nyala
                              ? 'text-accent-ikn'
                              : 'text-muted-foreground/70',
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate text-base font-medium tracking-tight sm:text-lg">
                          {orang.nama}
                        </span>
                      </span>

                      <span
                        className={cn(
                          'label-mono shrink-0 text-[0.65rem]',
                          interaktif && nyala
                            ? 'text-accent-ikn'
                            : 'text-muted-foreground',
                        )}
                      >
                        {orang.peran}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  )
}

/**
 * Kartu potret satu anggota — foto asli bila tersedia, monogram bila tidak.
 * `tampilkanNama` hanya dipakai di mobile (desktop: nama ada di daftar kanan).
 * Semua kartu berukuran seragam (rasio potret 2:3) — rasa kolase tetap hadir
 * lewat miring/geser/skala per kartu, bukan dari perbedaan ukuran.
 */
function PotretAnggota({ orang, nyala, interaktif, nomor, onAktif, onPadam, tampilkanNama }) {
  const [gambarGagal, setGambarGagal] = useState(false)
  const pakaiFoto = Boolean(orang.foto) && !gambarGagal
  // Rasio seragam untuk semua kartu
  const rasio = 'aspect-[2/3]'

  return (
    <div className="w-full">
      <button
        type="button"
        onMouseEnter={onAktif}
        onMouseLeave={onPadam}
        onFocus={onAktif}
        onBlur={onPadam}
        className={cn(
          'block w-full cursor-default rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-ikn/60 focus-visible:ring-offset-2',
          interaktif && 'cursor-pointer',
        )}
        aria-label={`${orang.nama} — ${orang.peran}`}
      >
        <span
          className={cn(
            'relative block w-full overflow-hidden rounded-lg border transition-all duration-300 ease-out motion-reduce:transition-none',
            rasio,
            interaktif
              ? nyala
                ? 'border-accent-ikn/50 shadow-md -translate-y-1'
                : 'border-border/60 hover:-translate-y-0.5'
              : 'border-border/60',
          )}
        >
          {pakaiFoto ? (
            <img
              src={orang.foto}
              alt=""
              width={600}
              height={800}
              loading="lazy"
              decoding="async"
              onError={() => setGambarGagal(true)}
              className={cn(
                'absolute inset-0 h-full w-full object-cover transition-[filter,opacity] duration-300 motion-reduce:transition-none',
                interaktif
                  ? nyala
                    ? 'grayscale-0 opacity-100'
                    : 'grayscale opacity-60'
                  : 'opacity-100',
              )}
            />
          ) : (
            // Fallback monogram — inisial di atas latar lembut.
            <span
              className={cn(
                'label-mono absolute inset-0 flex items-center justify-center bg-muted font-mono text-3xl font-semibold tracking-tight transition-[filter,opacity,color] duration-300 sm:text-4xl',
                interaktif
                  ? nyala
                    ? 'bg-accent-ikn/10 text-accent-ikn opacity-100'
                    : 'text-muted-foreground/50 opacity-70'
                  : 'text-muted-foreground/60 opacity-100',
              )}
            >
              {inisial(orang.nama)}
            </span>
          )}

          {/* Nomor urut mono di sudut — detail editorial */}
          <span
            aria-hidden="true"
            className="label-mono absolute top-2.5 left-3 tabular-nums text-[0.65rem]"
            style={{
              color: 'var(--background)',
              textShadow: '0 1px 6px rgb(0 0 0 / 0.45)',
            }}
          >
            {String(nomor).padStart(2, '0')}
          </span>
        </span>
      </button>

      {tampilkanNama && (
        <p
          className={cn(
            'mt-2 text-xs font-medium tracking-tight transition-colors duration-200 sm:text-sm lg:hidden',
            interaktif && nyala
              ? 'text-accent-ikn'
              : 'text-foreground/90',
          )}
        >
          {orang.nama}
        </p>
      )}
    </div>
  )
}
