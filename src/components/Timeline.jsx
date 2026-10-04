import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Rule } from '@/components/Rule'
import { Section, SectionHeading } from '@/components/Section'
import { meta, timeline } from '@/data'
import { cn } from '@/lib/utils'
import { useInView } from '@/lib/use-in-view'

/**
 * Timeline pembangunan — rel editorial yang "menggambar" saat di-scroll.
 *
 * Tiga efek yang diambil dari referensi (pin + scroll diagonal), tapi ditulis
 * ulang dengan gaya halaman ini — tanpa GSAP, tanpa satuan `vw`, tanpa teks
 * raksasa:
 *
 *  1. REL MENGGAMBAR — jalur tipis terisi aksen sepanjang progres baca.
 *  2. NODE POP — tiap node muncul membesar (pegas lembut), bukan langsung jadi.
 *  3. REVEAL BERTAHAP — nomor/periode/judul/deskripsi menyusul naik.
 *
 * Sengaja ditulis dengan rAF + transform langsung (bukan library animasi),
 * mengikuti pola ScrollProgress.jsx: nilai transform ditulis ke DOM tiap frame
 * sehingga TIDAK memicu render React, dan bundel tetap ringan.
 *
 * Sengaja TIDAK ada penanda status "selesai/berjalan" — semua tahap setara.
 * Penanda "sedang dibaca" hanyalah bantuan baca (tahap terdekat posisi scroll),
 * bukan status proyek.
 *
 * Hormat prefers-reduced-motion: tanpa pegas, rel langsung penuh, node tidak
 * membesar, konten langsung tampil.
 */

/** Ambang progres → indeks tahap yang sedang dibaca. */
function indeksAktif(progres, jumlah) {
  return Math.min(jumlah - 1, Math.max(0, Math.floor(progres * jumlah)))
}

/** True bila pengguna meminta gerak minimal. */
function gerakMinimal() {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Menghitung progres baca 0–1 untuk sebuah elemen, dan melaporkannya lewat
 * callback. Transform diterapkan langsung ke elemen terisi (ref) agar tidak
 * ada render React per frame; `onAktif` dipanggil hanya saat indeks berubah.
 *
 * Progres 0 saat puncak elemen menyentuh 80% viewport; progres 1 saat dasarnya
 * menyentuh 65% — jadi rel penuh tepat ketika tahap terakhir masuk zona baca.
 */
function useProgresBaca(elRef, refV, refH, jumlah, onAktif) {
  // PENTING: jangan pakai `transform` dari kelas Tailwind untuk elemen ini.
  // Di Tailwind v4, `scale-y-0`/`scale-x-0` menghasilkan properti CSS `scale:`
  // (bukan `transform:`), sehingga akan bertabrakan dengan inline transform
  // yang kita tulis per frame. Jadi nilai awal di-set manual di sini —
  // useLayoutEffect = sebelum paint, supaya tidak ada kedipan.
  useLayoutEffect(() => {
    for (const node of [refV.current, refH.current]) {
      if (node) node.style.transform = node.dataset.sumbu === 'y' ? 'scaleY(0)' : 'scaleX(0)'
    }
  }, [refV, refH])

  useEffect(() => {
    const el = elRef.current
    if (!el) return undefined

    const isiRefs = [refV, refH]
    const kurangi = gerakMinimal()
    let raf = 0
    let target = 0
    let kini = 0
    let aktifLama = -1

    const gambar = (p) => {
      for (const ref of isiRefs) {
        const node = ref.current
        if (node) {
          // Sumbu berbeda per orientasi: vertikal = scaleY, horizontal = scaleX.
          node.style.transform = node.dataset.sumbu === 'y'
            ? `scaleY(${p})`
            : `scaleX(${p})`
        }
      }
    }

    const hitungTarget = () => {
      // Progres = posisi "basis" daftar relatif viewport.
      //   r.top = 80% vh  → basis baru masuk zona baca → 0
      //   r.bottom = 65% vh → basis sudah lewat zona baca → 1
      // Jarak tempuhnya = 0,15·vh + tinggi daftar (bukan 0,8·vh), sehingga rel
      // baru penuh tepat saat dasar daftar sampai — bukan saat puncaknya.
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const pembagi = 0.15 * vh + r.height
      const basis = 0.8 * vh - r.top
      target = pembagi > 0 ? Math.min(1, Math.max(0, basis / pembagi)) : 1
    }

    const lapor = () => {
      const i = indeksAktif(target, jumlah)
      if (i !== aktifLama) {
        aktifLama = i
        onAktif(i)
      }
    }

    const tick = () => {
      raf = 0
      // Easing linear-per-frame (frame ~16ms): gerak menyusul scroll dengan
      // sedikit kelembutan, lalu berhenti tepat di target.
      kini += (target - kini) * 0.2
      if (Math.abs(target - kini) < 0.02) kini = target
      gambar(kini)
      if (kini !== target) raf = requestAnimationFrame(tick)
    }

    const onScroll = () => {
      hitungTarget()
      lapor()
      if (kurangi) {
        // Tanpa kelembutan: langsung pas.
        kini = target
        gambar(kini)
        return
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Gerak minimal: rel langsung penuh, tidak perlu ikut scroll.
    if (kurangi) {
      gambar(1)
      onAktif(0)
      return undefined
    }

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [elRef, refV, refH, jumlah, onAktif])
}

/**
 * Satu tahap. Dipisah jadi komponen agar tiap item punya observer sendiri
 * (hooks tidak boleh dipanggil di dalam loop map).
 */
function Tahap({ tahap, index, aktif }) {
  const [ref, inView] = useInView({ threshold: 0.35 })
  const nomor = String(index + 1).padStart(2, '0')

  return (
    <li
      ref={ref}
      className="relative pl-10 lg:pt-10 lg:pl-0"
      aria-current={aktif ? 'step' : undefined}
    >
      {/* Node: ring netral + titik aksen yang membesar saat masuk. Ring hanya
          berubah warna sebagai penanda "sedang dibaca". */}
      <span
        aria-hidden="true"
        className={cn(
          'bg-background absolute top-1.5 left-0 flex size-4 items-center justify-center rounded-full ring-1 transition-shadow duration-300 lg:top-0',
          aktif
            ? 'ring-accent-ikn/60 shadow-[0_0_0_4px_color-mix(in_oklab,var(--accent-ikn)_12%,transparent)]'
            : 'ring-border',
        )}
      >
        <span
          className={cn(
            // Pegas lembut: sedikit melewat lalu mengendap.
            'bg-accent-ikn size-1.5 rounded-full transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none',
            inView ? 'scale-100' : 'scale-0',
          )}
        />
      </span>

      {/* Isi — menyusul naik setelah node muncul */}
      <div
        className={cn(
          'pt-1 transition-[opacity,transform] duration-[700ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
          inView
            ? 'translate-y-0 opacity-100'
            : 'translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
        )}
        style={{ transitionDelay: `${index * 60}ms` }}
      >
        <span
          aria-hidden="true"
          className={cn(
            'font-display block text-4xl leading-none font-semibold tracking-tight tabular-nums select-none transition-colors duration-500 sm:text-5xl',
            aktif
              ? 'text-[color-mix(in_oklab,var(--accent-ikn)_45%,transparent)]'
              : 'text-[color-mix(in_oklab,var(--accent-ikn)_22%,transparent)]',
          )}
        >
          {nomor}
        </span>

        <span
          className={cn(
            'label-mono mt-2 block tabular-nums transition-colors duration-500',
            aktif ? 'text-accent-ikn' : 'text-muted-foreground',
          )}
        >
          {tahap.periode}
        </span>

        <h3 className="mt-4 text-lg leading-snug font-semibold tracking-tight text-balance">
          {tahap.judul}
        </h3>
        <p className="text-muted-foreground mt-2.5 max-w-md text-sm leading-relaxed text-pretty lg:max-w-none">
          {tahap.deskripsi}
        </p>
      </div>
    </li>
  )
}

export default function Timeline() {
  const { judul, deskripsi } = meta.section.timeline
  const jumlah = timeline.length

  const listRef = useRef(null)
  const isiVRef = useRef(null)
  const isiHRef = useRef(null)
  const [aktif, setAktif] = useState(0)

  useProgresBaca(listRef, isiVRef, isiHRef, jumlah, setAktif)

  return (
    <Section id="timeline" className="border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Rule className="mt-2" />

        {/* Kepala bagian — senada bab 01 & 02 */}
        <div className="mt-12 grid items-end gap-8 sm:mt-14 lg:grid-cols-12">
          <SectionHeading
            bab="03"
            eyebrow="Peta Jalan"
            judul={judul}
            className="lg:col-span-7"
          />
          <div className="lg:col-span-5">
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              {deskripsi}
            </p>
          </div>
        </div>

        {/* Rel + tahapan */}
        <ol
          ref={listRef}
          className="relative mt-16 grid grid-cols-1 gap-y-12 sm:mt-20 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-0"
        >
          {/* Rel: jalur statis (track) + bagian terisi yang "menggambar".
              Dua orientasi memakai skala progres yang sama; hanya sumbu &
              titik asal yang beda. aria-hidden karena murni dekoratif —
              daftar <ol> tetap menyampaikan maknanya. */}
          <div
            aria-hidden="true"
            className="bg-border absolute top-2 bottom-2 left-[7px] w-px overflow-hidden lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto"
          >
            {/* Tanpa kelas scale Tailwind — skala awal di-set via JS (lihat
                useProgresBaca) agar tidak bertabrakan dengan transform inline. */}
            <div
              ref={isiVRef}
              data-sumbu="y"
              className="bg-accent-ikn h-full w-full origin-top lg:hidden"
            />
            <div
              ref={isiHRef}
              data-sumbu="x"
              className="bg-accent-ikn hidden h-full w-full origin-left lg:block"
            />
          </div>

          {timeline.map((tahap, i) => (
            <Tahap
              key={tahap.periode}
              tahap={tahap}
              index={i}
              aktif={i === aktif}
            />
          ))}
        </ol>
      </div>
    </Section>
  )
}
