import { useCallback, useEffect, useRef, useState } from 'react'

import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

import {
  IKN_TITIK,
  JAKARTA_TITIK,
  KALTIM,
  LABEL_PROVINSI,
  PULAU,
  VIEW_BOX,
  provinsi,
} from '@/lib/peta-data'
import { cn } from '@/lib/utils'
import { useInView } from '@/lib/use-in-view'

/**
 * Peta Indonesia (siluet 34 provinsi) dengan penanda lokasi IKN — bisa di-zoom.
 *
 * Tampilan FULL-BLEED tanpa "card": border/background/header panel dibuang,
 * peta mengisi lebar viewport-nya sendiri. Kontrol & info tampil sebagai
 * lapisan melayang tipis di atas peta.
 *
 * Susunan lapisan (sengaja dua lapis agar berbeda perilaku saat di-zoom):
 * - Lapisan TER-SKALA: hanya polygon provinsi. Ikut membesar saat di-zoom.
 * - Lapisan TETAP-UKURAN: nama pulau/provinsi, penanda titik, garis Jakarta→IKN.
 *   Koordinatnya diproyeksikan manual (x·s + tx), jadi tulisannya TIDAK ikut
 *   membesar — tetap tajam & terbaca berapa pun tingkat zoom-nya.
 *   (Kalau ikut di-scale, teks jadi raksasa.)
 *
 * Zoom & geser:
 * - Scroll / tombol +/-  : zoom ke arah kursor
 * - Seret (drag)         : geser peta
 * - Klik ganda           : perbesar
  * - Tombol reset         : kembali ke tampilan penuh
 * - Nama provinsi otomatis muncul setelah zoom melewati ambang global
 *   (S_LABEL_PROVINSI) ditambah ambang per-provinsi (minZoom).
 *
 * Catatan: peta TIDAK bergerak sendiri (tanpa auto-pan/drift) — posisi selalu
 * stabil; yang bergerak hanya kilau shimmer pada garis batas & garis IKN.
 *
 * Akurasi: koordinat titik diverifikasi lewat georeferensi (lihat catatan di
 * src/lib/peta-data.js). Titik label provinsi dijamin berada di dalam
 * wilayahnya masing-masing.
 */

const VX = 0
const VY = 29
const VW = 793
const VH = 288
const S_MIN = 1
const S_MAX = 6
// Label provinsi baru muncul setelah zoom melewati ambang global ini
// (provinsi dengan `minZoom` lebih tinggi tetap patuh ambangnya masing-masing).
const S_LABEL_PROVINSI = 3.2
// Label pulau memudar sebelum label provinsi menyala (tidak saling tumpuk).
const S_LABEL_PULAU = 2.4

const batasi = (n, min, max) => Math.min(max, Math.max(min, n))

/** Jaga agar peta yang diperbesar selalu menutupi seluruh area viewBox. */
function clampView({ s, tx, ty }) {
  const txMin = VW * (1 - s)
  const tyMin = (VY + VH) * (1 - s)
  return {
    s,
    tx: batasi(tx, txMin, 0),
    ty: batasi(ty, tyMin, VY * (1 - s)),
  }
}

/** Nama pulau dari sebuah nama provinsi (dari pengelompokan di peta-data). */
function pulauDari(namaProv) {
  return PULAU.find((p) => p.provinsi.includes(namaProv))?.nama ?? null
}

export default function PetaIndonesia({ keterangan, fakta = [], titik = [], className }) {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const [hover, setHover] = useState(null)
  const [pilih, setPilih] = useState(null)
  // Petunjuk zoom hanya tampil sampai interaksi pertama.
  const [pernahInteraksi, setPernahInteraksi] = useState(false)

  const [view, setView] = useState({ s: 1, tx: 0, ty: 0 })
  const [seret, setSeret] = useState(false)
  const svgRef = useRef(null)
  const dragRef = useRef(null)

  // Lebar kontainer (css px) — dipakai untuk menjaga ukuran TEKS & PENANDA
  // tetap konstan di layar. Tanpa ini, di layar sempit teks jadi sangat kecil
  // (karena 1 satuan viewBox < 1 css px).
  const [cssW, setCssW] = useState(VW)
  useEffect(() => {
    const el = svgRef.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) setCssW(w)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // Satuan viewBox per 1 css px.
  const unit = VW / (cssW || VW)

  // Proyeksi koordinat peta → koordinat layar-svg (manual, tanpa ikut scale).
  const projX = (x) => x * view.s + view.tx
  const projY = (y) => y * view.s + view.ty

  /** Ubah posisi kursor (client px) → koordinat viewBox. */
  const keViewBox = useCallback((clientX, clientY) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect?.width) return { x: 0, y: 0 }
    return {
      x: VX + ((clientX - rect.left) / rect.width) * VW,
      y: VY + ((clientY - rect.top) / rect.height) * VH,
    }
  }, [])

  // --- Zoom (fokus ke titik tertentu; default: tengah peta) ---
  const zoomKe = useCallback((faktor, fokus) => {
    setPernahInteraksi(true)
    setView((lama) => {
      const s1 = batasi(lama.s * faktor, S_MIN, S_MAX)
      if (s1 === lama.s) return lama
      const c = fokus ?? { x: VX + VW / 2, y: VY + VH / 2 }
      // Titik peta di bawah kursor: p = (c - t) / s. Setelah zoom, jaga c tetap.
      const px = (c.x - lama.tx) / lama.s
      const py = (c.y - lama.ty) / lama.s
      return clampView({ s: s1, tx: c.x - px * s1, ty: c.y - py * s1 })
    })
  }, [])

  // Zoom dengan roda mouse. React memasang onWheel sebagai listener PASSIVE,
  // sehingga preventDefault() di sana tidak diizinkan (halaman ikut ter-scroll).
  // Karena itu kita pasang listener native dengan { passive: false }.
  useEffect(() => {
    const el = svgRef.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      zoomKe(e.deltaY < 0 ? 1.18 : 1 / 1.18, keViewBox(e.clientX, e.clientY))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomKe, keViewBox])

  const onPointerDown = (e) => {
    if (e.button != null && e.button !== 0) return
    setPernahInteraksi(true)
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect?.width) return
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      tx: view.tx,
      ty: view.ty,
      // client px → viewBox unit
      kx: VW / rect.width,
      ky: VH / rect.height,
      // `pindah` = penanda apakah gerakan ini benar-benar menyeret peta.
      // Dipakai agar klik biasa tetap memilih provinsi, tapi klik yang
      // ujungnya adalah seret TIDAK dianggap memilih (menghindari salah pilih).
      pindah: false,
    }
    setSeret(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  const onPointerMove = (e) => {
    const d = dragRef.current
    if (!d) return
    const dx = e.clientX - d.x
    const dy = e.clientY - d.y
    if (Math.hypot(dx, dy) > 3) d.pindah = true
    setView((lama) =>
      clampView({ s: lama.s, tx: d.tx + dx * d.kx, ty: d.ty + dy * d.ky }),
    )
  }

  const onPointerUp = (e) => {
    // PENTING: jangan langsung null-kan di sini — onClick (yang menyala
    // SESUDAH pointerup) masih perlu tahu apakah tadi menyeret. Kita bersihkan
    // di setTimeout(0), setelah onClick selesai.
    setSeret(false)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    setTimeout(() => {
      dragRef.current = null
    }, 0)
  }

  const reset = () => {
    setView({ s: 1, tx: 0, ty: 0 })
  }

  const semuaTitik = titik
  const info = hover ?? pilih
  const infoPulau = info ? pulauDari(info) : null
  const kaltimTerpilih = pilih === 'Kalimantan Timur' || pilih === 'Kalimantan Utara'
  const bisaGeser = view.s > 1.001

  return (
    <figure ref={ref} className={cn('m-0', className)}>
      {/* ===== Peta (kiri) + fakta (kanan) =====
          lg: peta mengambil ruang utama, fakta jadi kolom vertikal di samping
          (angka besar + label, dipisah hairline). Mobile: peta dulu, fakta
          pindah ke bawah sebagai grid 2 kolom. */}
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Kolom fakta — kanan (lg) / bawah peta (mobile), hanya jika ada */}
        {fakta.length ? (
        <ul className="order-2 grid grid-cols-2 gap-x-6 gap-y-4 lg:order-2 lg:w-48 lg:shrink-0 lg:grid-cols-1 lg:gap-y-0 lg:divide-y lg:divide-border/60">
            {fakta.map((f) => (
              <li key={f.label} className="lg:py-3.5 lg:first:pt-0">
                <span className="text-foreground block font-mono text-lg font-semibold tabular-nums">
                  {f.nilai}
                </span>
                <span className="label-mono text-muted-foreground mt-0.5 block text-xs">
                  {f.label}
                </span>
              </li>
            ))}
        </ul>
        ) : null}

        {/* Peta — kiri (lg), ambil sisa lebar */}
        <div className="order-1 min-w-0 flex-1 lg:order-1">
            <div className="relative">
              <svg
                ref={svgRef}
                viewBox={VIEW_BOX}
                role="img"
                aria-label="Peta Indonesia dengan penanda lokasi Ibu Kota Nusantara di Kalimantan Timur. Gunakan tombol zoom untuk memperbesar."
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onDoubleClick={(e) => zoomKe(1.6, keViewBox(e.clientX, e.clientY))}
                className={cn(
                  'h-auto w-full overscroll-contain select-none',
                  // Saat belum di-zoom tak ada yang perlu digeser, jadi sentuhan
                  // dibiarkan men-scroll halaman. Setelah di-zoom, sentuhan dipakai
                  // untuk menggeser peta.
                  bisaGeser ? 'touch-none' : 'touch-pan-y',
                  bisaGeser ? (seret ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default',
                )}
              >
          <g>
            {/* ===== Lapisan TER-SKALA: hanya polygon provinsi ===== */}
            <g transform={`translate(${view.tx} ${view.ty}) scale(${view.s})`}>
              {provinsi.map((prov) => {
                const kaltim = prov.name === 'Kalimantan Timur'
                const terpilih = pilih === prov.name
                return (
                  <path
                    key={prov.id}
                    d={prov.d}
                    onPointerEnter={() => !seret && setHover(prov.name)}
                    onPointerLeave={() => setHover(null)}
                    onClick={() => {
                      // Abaikan klik yang ujungnya adalah seret peta.
                      if (dragRef.current?.pindah) return
                      setPilih((p) => (p === prov.name ? null : prov.name))
                    }}
                    className={cn(
                      'cursor-pointer transition-colors duration-200',
                      kaltim || terpilih
                        ? 'fill-accent-ikn/20 stroke-accent-ikn/50'
                        : 'fill-muted stroke-border hover:fill-accent-ikn/15',
                    )}
                    strokeWidth={(terpilih ? 1 : 0.6) / view.s}
                  />
                )
              })}

              {/* ===== Garis batas "hidup" (efek 21st.dev / reactbits) =====
                  Dua lapisan di atas polygon — tanpa pointer event agar
                  hover/klik provinsi tetap jalan normal. */}
              <g aria-hidden="true" className="pointer-events-none">
                {/* 1) Draw-in: keliling pulau menggambar diri (sekali) saat peta
                    masuk viewport — pakai pathLength=1 agar dash animasi seragam
                    untuk path pendek & panjang. Delay naik per provinsi (barat→timur). */}
                {provinsi.map((p, i) => (
                  <path
                    key={`dam-${p.id}`}
                    d={p.d}
                    pathLength="1"
                    strokeDasharray="1"
                    className={cn(
                      'fill-none [stroke-dashoffset:1] transition-[stroke-dashoffset] duration-[2600ms] ease-out motion-reduce:transition-none',
                      inView && '[stroke-dashoffset:0]',
                      p.name === KALTIM ? 'stroke-accent-ikn/80' : 'stroke-foreground/30',
                    )}
                    strokeWidth={(p.name === KALTIM ? 1 : 0.5) / view.s}
                    style={{ transitionDelay: `${i * 180}ms` }}
                  />
                ))}

                {/* 2) Ambient shimmer: sapuan terang berjalan keliling garis
                    pantai, loop pelan. Tiap provinsi beda delay & arah jalan
                    (reverse) supaya terasa organik, bukan robotik. */}
                {provinsi.map((p, i) => (
                  <path
                    key={`shim-${p.id}`}
                    d={p.d}
                    pathLength="1"
                    fill="none"
                    strokeDasharray={`${0.06} ${0.94}`}
                    className={cn(
                      'shimmer-pulau motion-reduce:hidden',
                      p.name === KALTIM ? 'shimmer-kaltim' : '',
                    )}
                    strokeWidth={(p.name === KALTIM ? 1.1 : 0.7) / view.s}
                    style={{
                      animationDelay: `${(i % 7) * 0.9}s`,
                      animationDirection: i % 2 ? 'reverse' : 'normal',
                    }}
                  />
                ))}
              </g>
            </g>

            {/* ===== Lapisan TETAP-UKURAN (koordinat diproyeksikan manual) ===== */}

            {/* Label pulau — subtle & melebar; memudar saat mulai di-zoom agar
                tidak berebut perhatian dengan label provinsi. */}
            <g aria-hidden="true">
              {PULAU.map((p) => (
                <text
                  key={p.nama}
                  x={projX(p.x)}
                  y={projY(p.y)}
                  textAnchor="middle"
                  style={{ fontSize: `${11 * unit}px` }}
                  className={cn(
                    'fill-muted-foreground/45 font-medium tracking-[0.3em] uppercase transition-opacity duration-500 [paint-order:stroke]',
                    view.s < S_LABEL_PULAU ? 'opacity-100' : 'opacity-0',
                  )}
                  stroke="var(--background)"
                  strokeWidth={3 * unit}
                >
                  {p.nama}
                </text>
              ))}
            </g>

            {/* Nama tiap provinsi — muncul setelah zoom melewati ambang global
                (S_LABEL_PROVINSI); tiap label punya ambang tambahan sendiri
                (minZoom) agar tidak menumpuk dengan tetangganya. */}
            <g aria-hidden="true" className="transition-opacity duration-300">
              {LABEL_PROVINSI.filter(
                (l) => view.s >= S_LABEL_PROVINSI && view.s >= (l.minZoom ?? 1),
              ).map((l) => (
                <text
                  key={l.name}
                  x={projX(l.x)}
                  y={projY(l.y)}
                  textAnchor="middle"
                  style={{ fontSize: `${10 * unit}px` }}
                  className={cn(
                    'font-medium [paint-order:stroke]',
                    pilih === l.name ? 'fill-accent-ikn' : 'fill-foreground/80',
                  )}
                  stroke="var(--background)"
                  strokeWidth={2.8 * unit}
                >
                  {l.name}
                </text>
              ))}
            </g>

            {/* Garis pemindahan Jakarta → IKN (menggambar diri saat masuk view) */}
            <line
              x1={projX(JAKARTA_TITIK.x)}
              y1={projY(JAKARTA_TITIK.y)}
              x2={projX(IKN_TITIK.x)}
              y2={projY(IKN_TITIK.y)}
              pathLength="1"
              strokeDasharray="1"
              aria-hidden="true"
              className={cn(
                'stroke-accent-ikn/45 transition-[stroke-dashoffset] duration-[1600ms] ease-out motion-reduce:transition-none',
                inView ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:1]',
              )}
              strokeWidth={0.65 * unit}
            />

            {/* Shimmer: segmen terang pendek menyapu sepanjang garis di atas.
                pathLength=1 → dashoffset dari 1 ke -1 memindahkan dash dari
                ujung ke ujung. Kontras rendah; disembunyikan untuk reduced-motion. */}
            <line
              x1={projX(JAKARTA_TITIK.x)}
              y1={projY(JAKARTA_TITIK.y)}
              x2={projX(IKN_TITIK.x)}
              y2={projY(IKN_TITIK.y)}
              pathLength="1"
              strokeDasharray={`${0.12 * unit} ${1}`}
              aria-hidden="true"
              className="animate-garis-shimmer motion-reduce:hidden stroke-background/90"
              strokeWidth={1.15 * unit}
              strokeLinecap="round"
            />

            {/* Penanda titik lokasi + label langsung di peta */}
            {semuaTitik
              .filter((t) => t.diPeta !== false)
              .map((t, i) => (
                <g
                  key={t.nama}
                  aria-hidden="true"
                  className={cn(
                    'pointer-events-none transition-opacity duration-500',
                    inView ? 'opacity-100' : 'opacity-0',
                  )}
                  style={{ transitionDelay: `${600 + i * 160}ms` }}
                >
                  {t.utama ? (
                    <circle
                      cx={projX(t.x)}
                      cy={projY(t.y)}
                      r={4 * unit}
                      className="fill-accent-ikn/25"
                    />
                  ) : null}

                  <circle
                    cx={projX(t.x)}
                    cy={projY(t.y)}
                    r={(t.utama ? 3.4 : 2) * unit}
                    className={cn(
                      t.utama
                        ? 'fill-accent-ikn stroke-background'
                        : t.lama
                          ? 'fill-muted-foreground stroke-background'
                          : 'fill-foreground/70 stroke-background',
                    )}
                    strokeWidth={1 * unit}
                  />

                  <text
                    x={projX(t.x) + (t.utama ? 8 : 6) * unit}
                    y={projY(t.y) + (t.lama ? 10 : -6) * unit}
                    style={{ fontSize: `${12 * unit}px` }}
                    className={cn(
                      'fill-current font-medium [paint-order:stroke]',
                      t.utama ? 'text-accent-ikn' : 'text-muted-foreground',
                    )}
                    stroke="var(--background)"
                    strokeWidth={3 * unit}
                  >
                    {t.singkat ?? t.nama}
                    {/* keterangan peran kecil di bawah nama */}
                    <tspan
                      x={projX(t.x) + (t.utama ? 8 : 6) * unit}
                      dy={`${13 * unit}px`}
                      style={{ fontSize: `${9.5 * unit}px` }}
                      className="fill-muted-foreground font-normal"
                    >
                      {t.peran}
                    </tspan>
                  </text>
                </g>
              ))}
              </g>
            </svg>

            {/* Readout provinsi (hover/pilih) — chip melayang, menggantikan bar header */}
        <span
          aria-live="polite"
          className={cn(
            'label-mono bg-background/80 border-border/60 pointer-events-none absolute top-4 left-4 rounded-full border px-3 py-1.5 backdrop-blur-sm transition-opacity duration-300 sm:top-6 sm:left-6',
            info ? 'opacity-100' : 'opacity-0',
          )}
        >
          {info ? (
            <span className={cn(kaltimTerpilih ? 'text-accent-ikn' : 'text-foreground')}>
              {info}
              {infoPulau ? ` · ${infoPulau}` : ''}
            </span>
          ) : (
            '\u00A0'
          )}
        </span>

        {/* Kontrol zoom */}
        <div className="border-border bg-background/90 absolute top-4 right-4 flex flex-col overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm sm:top-6 sm:right-6">
          <button
            type="button"
            onClick={() => zoomKe(1.4)}
            disabled={view.s >= S_MAX - 0.001}
            aria-label="Perbesar peta"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center transition-colors disabled:opacity-35"
          >
            <ZoomIn className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => zoomKe(1 / 1.4)}
            disabled={view.s <= S_MIN + 0.001}
            aria-label="Perkecil peta"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center border-t border-border/60 transition-colors disabled:opacity-35"
          >
            <ZoomOut className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={view.s <= S_MIN + 0.001}
            aria-label="Kembalikan tampilan peta"
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-9 items-center justify-center border-t border-border/60 transition-colors disabled:opacity-35"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
          </button>
        </div>

        {/* Petunjuk zoom — hilang setelah interaksi pertama */}
        <span
          className={cn(
            'label-mono text-muted-foreground bg-background/80 border-border/60 pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur-sm transition-opacity duration-300 sm:bottom-6 sm:left-6',
            pernahInteraksi ? 'opacity-0' : 'opacity-100',
          )}
        >
          <Move className="size-3.5" aria-hidden="true" />
          Scroll untuk zoom · seret untuk geser
        </span>
            </div>
        </div>
      </div>

      {keterangan ? (
        <figcaption className="text-muted-foreground mt-4 text-sm text-pretty">
          {keterangan}
        </figcaption>
      ) : null}
    </figure>
  )
}
