import { useEffect, useRef, useState } from 'react'

import { ArrowDown, ArrowUpRight } from 'lucide-react'

import HeroBackground from '@/components/HeroBackground'
import Logomark from '@/components/Logomark'
import TextReveal from '@/components/TextReveal'
import { Button } from '@/components/ui/button'
import { meta } from '@/data'
import { efek } from '@/lib/efek'

// Sumber angka kunci tetap dari data.js (tidak ada fakta yang di-hardcode).
const sorotan = meta.section.latarBelakang.stats

/**
 * Angka count-up — dari 0 menuju nilai tujuan saat elemen pertama kali
 * terlihat. Format persen (> 57%) dan tahun (2045) tetap ditampilkan
 * utuh: angka murni yang dianimasikan, prefiks/sufiks menyertai sejak
 * frame awal. Tanpa dependensi; rAF + easing cubic-out. Saat
 * prefers-reduced-motion, nilai langsung ditampilkan tanpa animasi.
 */
function AngkaNaik({ teks, className }) {
  const ref = useRef(null)
  const [tampil, setTampil] = useState(teks)

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined

    // Reduced motion atau tanpa IntersectionObserver: state awal sudah
    // teks akhir — tidak ada yang perlu di-set di sini.
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return undefined
    }

    // Pisahkan bagian numerik dari teks (mis. "> 57%" → numerik "57").
    const m = teks.match(/\d+(?:[.,]\d+)?/)
    if (!m) return undefined
    const numerikStr = m[0].replace(',', '.')
    const tujuan = Number(numerikStr)
    if (!Number.isFinite(tujuan)) return undefined
    const desimal = (numerikStr.split('.')[1] ?? '').length
    const terpilih = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const durasi = 1600
    let raf = 0
    let mulai = 0

    const format = (v) => {
      const angka = v.toFixed(desimal).replace('.', ',')
      return teks.replace(numerikStr.replace('.', ','), angka)
    }

    const tick = (ts) => {
      if (!mulai) mulai = ts
      const p = Math.min(1, (ts - mulai) / durasi)
      const eased = 1 - (1 - p) ** 3 // cubic-out
      setTampil(format(tujuan * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
      else setTampil(teks) // frame terakhir: nilai asli persis
    }

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          obs.disconnect()
          if (terpilih) {
            setTampil(teks)
            return
          }
          setTampil(format(0))
          raf = requestAnimationFrame(tick)
        }
      },
      { threshold: 0.4 },
    )
    obs.observe(el)

    return () => {
      obs.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [teks])

  return (
    <span ref={ref} className={className}>
      {tampil}
    </span>
  )
}

/**
 * Hero gambar FULL-BLEED — foto IKN tampil penuh dari tepi ke tepi,
 * TANPA kartu/panel: judul, tombol, dan angka kunci duduk langsung di atas
 * foto.
 *
 * Kunci keterbacaannya adalah scrim ASIMETRIS (pola standar hero gambar):
 * lapisan gelap menebal persis di zona teks (bawah & kiri), sementara langit
 * terang di bagian atas foto dibiarkan jernih — di zona atas itulah baris
 * meta/logo berada, dan teks gelapnya memang butuh latar terang.
 *
 * Lapisan (dari belakang ke depan):
 *   1. <HeroBackground /> — foto IKN penuh
 *   2. scrim vertikal: transparan (atas) → gelap (bawah); varian mobile lebih
 *      tebal karena blok teks memanjang lebih tinggi di layar sempit
 *   3. scrim diagonal kiri (fade via mask ke kanan & atas) — memperkuat zona
 *      teks kiri tanpa menggelapkan gedung di tengah-kanan
 *   4. fade putih tipis tepat di tepi bawah agar menyatu dengan section
 *      putih berikutnya
 *
 * Hasilnya kontras teks putih di zona konten ≥ 4,5:1 (WCAG AA), sementara
 * sebagian besar foto tetap terlihat jelas.
 */
export default function Hero() {
  return (
    <header
      id="beranda"
      className="relative isolate flex min-h-[88svh] flex-col overflow-hidden lg:min-h-[92svh]"
    >

      {/* Latar full-bleed (foto IKN — panorama 16:9) */}
      <div className="absolute inset-0 -z-10">
        <HeroBackground />

        {/* Scrim vertikal — desktop: atas jernih → bawah gelap. Foto baru
            punya zona hutan gelap di bawah, jadi scrim bisa lebih tipis. */}
        <div className="from-foreground/70 via-foreground/35 to-transparent absolute inset-0 hidden bg-gradient-to-t lg:block" />
        {/* Scrim vertikal — mobile: lebih tebal karena teks memanjang ke atas */}
        <div className="from-foreground/80 via-foreground/55 to-foreground/30 absolute inset-0 bg-gradient-to-t lg:hidden" />

        {/* Scrim diagonal kiri — desktop saja; solid di zona teks lalu memudar
            sebelum menyentuh baris meta di atas */}
        <div
          className="from-foreground/65 to-transparent absolute inset-0 hidden bg-gradient-to-r lg:block"
          style={{
            maskImage:
              'linear-gradient(to top, black 0%, black 55%, transparent 85%)',
            WebkitMaskImage:
              'linear-gradient(to top, black 0%, black 55%, transparent 85%)',
          }}
        />

        {/* Fade putih tipis di tepi bawah agar menyatu dengan section putih */}
        <div className="from-background absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t to-transparent" />
      </div>

      <div className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 lg:px-10">
        {/* Baris meta atas — teks GELAP karena berdiri di atas langit terang.
            Rata KIRI di mobile: justify-between hanya aktif ≥ lg, karena
            saat flex-wrap di layar sempit, justify-between akan mendorong
            baris kedua ("Berkas Analisis") ke tepi kanan dan kedua baris
            terlihat tidak sejajar. */}
        <div className="flex flex-wrap items-center justify-start gap-x-5 gap-y-1 py-4 lg:justify-between">
          <div className="flex items-center gap-3">
            <Logomark animated={false} className="text-foreground size-8" />
            <div className="leading-tight">
              <p className="text-foreground text-sm font-semibold tracking-tight">
                IKN
              </p>
              <p className="label-mono text-foreground/75">
                Nusantara · Kalimantan Timur
              </p>
            </div>
          </div>
          <p className="label-mono text-foreground/75">Berkas Analisis · 2022–2045</p>
        </div>

        {/* Teks utama — di dalam zona scrim gelap, jadi teks PUTIH.
            Naik sedikit (items-start + pt) agar blok teks lebih tinggi
            posisinya, tanpa mengubah layout apa pun di bawahnya. */}
        <div className="flex flex-1 items-start pt-10 pb-16 sm:pt-12 lg:pt-16 lg:pb-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1 text-white backdrop-blur-[2px]">
              <span className="size-1.5 rounded-full bg-white" />
              <span className="label-mono">{meta.labelJelajahi}</span>
            </div>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight text-balance text-white sm:text-5xl lg:text-[3.9rem]">
              Analisis SWOT Ibu Kota{' '}
              {/* "Nusantara" berkilau seperti kaca: gradasi dasar mint→emas,
                  lalu sapuan highlight miring yang berjalan kiri→kanan secara
                  periodik (animate-shimmer, 6 dtk; aman reduced-motion —
                  keyframes dimatikan oleh design system). Clip ke bentuk huruf
                  via background-clip:text; pita highlight transparan sehingga
                  teks tidak pernah hilang, hanya berganti kilau. */}
              <span className="relative inline-block">
                {/* Lapisan 1: warna dasar (tetap terlihat tanpa animasi) */}
                <span
                  aria-hidden="true"
                  className="bg-gradient-to-r from-[oklch(0.87_0.13_150)] to-[oklch(0.86_0.14_90)] bg-clip-text text-transparent"
                >
                  Nusantara
                </span>
                {/* Lapisan 2: kilau kaca — sapuan highlight lewat huruf */}
                <span
                  aria-hidden="true"
                  className="animate-shimmer bg-[linear-gradient(110deg,transparent_35%,rgba(255,255,255,0.55)_50%,transparent_65%)] bg-[length:250%_100%] bg-clip-text text-transparent absolute inset-0"
                >
                  Nusantara
                </span>
                {/* Teks asli untuk screen reader & seleksi */}
                <span className="sr-only">Nusantara</span>
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/95 text-pretty">
              {efek.reveal ? (
                <TextReveal teks={meta.subjudul} delay={180} stagger={34} />
              ) : (
                meta.subjudul
              )}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="group h-12 rounded-full px-6">
                <a href="#swot">
                  {meta.tombolMulai}
                  <ArrowDown
                    className="size-4 transition-transform duration-200 group-hover:translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group h-12 rounded-full border-white/40 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white"
              >
                <a href="#latar-belakang">
                  Baca latar belakang
                  <ArrowUpRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </a>
              </Button>
            </div>

            {/* Baris angka kunci — angkanya count-up dari 0 saat terlihat */}
            <dl className="mt-10 grid max-w-xl grid-cols-3 divide-x divide-white/25 border-t border-white/30 pt-6">
              {sorotan.map((s) => (
                <div key={s.label} className="px-4 first:pl-0">
                  <dt className="text-2xl font-semibold tracking-tight text-white tabular-nums sm:text-3xl">
                    <AngkaNaik teks={s.nilai} />
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-white/85 text-pretty">
                    {s.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </header>
  )
}
