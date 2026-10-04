import { useCallback, useEffect, useRef, useState } from 'react'

import { Move, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react'

import {
  IKN_TITIK,
  JAKARTA_TITIK,
  KHATULISTIWA,
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
 * Susunan lapisan (sengaja dua lapis agar berbeda perilaku saat di-zoom):
 * - Lapisan TER-SKALA: hanya polygon provinsi. Ikut membesar saat di-zoom.
 * - Lapisan TETAP-UKURAN: label pulau, nama provinsi, garis khatulistiwa,
 *   penanda titik, dan garis Jakarta→IKN. Koordinatnya diproyeksikan manual
 *   (x·s + tx), jadi tulisannya TIDAK ikut membesar — tetap tajam & terbaca
 *   berapa pun tingkat zoom-nya. (Kalau ikut di-scale, teks jadi raksasa.)
 *
 * Zoom & geser:
 * - Scroll / tombol +/-  : zoom ke arah kursor
 * - Seret (drag)         : geser peta
 * - Klik ganda           : perbesar
 * - Tombol reset         : kembali ke tampilan penuh
 * - Nama provinsi otomatis muncul setelah cukup di-zoom.
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
// Di bawah zoom ini label pulau tampil; di atasnya ia memudar, digantikan
// label provinsi (supaya keduanya tidak saling menumpuk).
const S_PULAU = 2.2

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

export default function PetaIndonesia({ judul, keterangan, fakta = [], titik = [], className }) {
  const [ref, inView] = useInView({ threshold: 0.25 })
  const [hover, setHover] = useState(null)
  const [pilih, setPilih] = useState(null)

  const [lapis, setLapis] = useState({ pulau: true, khatulistiwa: true })
  const toggleLapis = (k) => setLapis((p) => ({ ...p, [k]: !p[k] }))

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

  const reset = () => setView({ s: 1, tx: 0, ty: 0 })

  const semuaTitik = titik
  const info = hover ?? pilih
  const infoPulau = info ? pulauDari(info) : null
  const kaltimTerpilih = pilih === 'Kalimantan Timur' || pilih === 'Kalimantan Utara'
  const bisaGeser = view.s > 1.001

  return (
    <figure ref={ref} className={cn('m-0', className)}>
      <div className="border-border bg-card/40 overflow-hidden rounded-2xl border">
        {/* Kepala panel */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-5 py-3">
          <span className="label-mono text-muted-foreground">
            {judul ?? 'Peta IKN'}
          </span>
          <span
            aria-live="polite"
            className={cn(
              'label-mono min-h-4 text-right transition-opacity',
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
        </div>

        {/* Peta + kontrol zoom */}
        <div className="relative px-3 py-4 sm:px-5 sm:py-6">
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
            </g>

            {/* ===== Lapisan TETAP-UKURAN (koordinat diproyeksikan manual) ===== */}

            {/* Garis khatulistiwa */}
            {lapis.khatulistiwa ? (
              <g
                aria-hidden="true"
                className={cn(
                  'transition-opacity duration-700',
                  inView ? 'opacity-100' : 'opacity-0',
                )}
              >
                <line
                  x1={VX}
                  y1={projY(KHATULISTIWA.y)}
                  x2={VX + VW}
                  y2={projY(KHATULISTIWA.y)}
                  strokeDasharray={`${1 * unit} ${8 * unit}`}
                  className="stroke-muted-foreground/45"
                  strokeWidth={0.7 * unit}
                />
                <text
                  x={VX + 6 * unit}
                  y={projY(KHATULISTIWA.y) - 4 * unit}
                  style={{ fontSize: `${10 * unit}px` }}
                  className="fill-muted-foreground/80 tracking-wide uppercase [paint-order:stroke]"
                  stroke="var(--background)"
                  strokeWidth={2.5 * unit}
                >
                  {KHATULISTIWA.label}
                </text>
              </g>
            ) : null}

            {/* Label pulau */}
            {lapis.pulau ? (
              <g aria-hidden="true">
                {PULAU.map((p) => (
                  <text
                    key={p.nama}
                    x={projX(p.x)}
                    y={projY(p.y)}
                    textAnchor="middle"
                    style={{ fontSize: `${12 * unit}px` }}
                    className={cn(
                      'fill-muted-foreground/70 font-medium tracking-wide uppercase transition-opacity duration-500 [paint-order:stroke]',
                      inView && view.s < S_PULAU ? 'opacity-100' : 'opacity-0',
                    )}
                    stroke="var(--background)"
                    strokeWidth={3 * unit}
                  >
                    {p.nama}
                  </text>
                ))}
              </g>
            ) : null}

            {/* Nama tiap provinsi — tiap label punya ambang zoom sendiri
                (minZoom) agar tidak menumpuk dengan tetangganya. */}
            <g aria-hidden="true" className="transition-opacity duration-300">
              {LABEL_PROVINSI.filter((l) => view.s >= (l.minZoom ?? 1)).map((l) => (
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

            {/* Garis pemindahan Jakarta → IKN */}
            <line
              x1={projX(JAKARTA_TITIK.x)}
              y1={projY(JAKARTA_TITIK.y)}
              x2={projX(IKN_TITIK.x)}
              y2={projY(IKN_TITIK.y)}
              pathLength="1"
              strokeDasharray="1"
              aria-hidden="true"
              className={cn(
                'stroke-accent-ikn/70 transition-[stroke-dashoffset] duration-[1600ms] ease-out motion-reduce:transition-none',
                inView ? '[stroke-dashoffset:0]' : '[stroke-dashoffset:1]',
              )}
              strokeWidth={0.9 * unit}
            />

            {/* Penanda titik lokasi */}
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
                      className="fill-accent-ikn/40 animate-pulse-ring origin-center [transform-box:fill-box] motion-reduce:hidden"
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
                    x={projX(t.x) + (t.utama ? 7 : 5) * unit}
                    y={projY(t.y) + (t.lama ? 9 : -5) * unit}
                    style={{ fontSize: `${13 * unit}px` }}
                    className={cn(
                      'fill-current font-medium [paint-order:stroke]',
                      t.utama ? 'text-accent-ikn' : 'text-muted-foreground',
                    )}
                    stroke="var(--background)"
                    strokeWidth={3 * unit}
                  >
                    {t.singkat ?? t.nama}
                  </text>
                </g>
              ))}
          </svg>

          {/* Kontrol zoom */}
          <div className="border-border bg-background/90 absolute top-6 right-6 flex flex-col overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm sm:top-8 sm:right-8">
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

          {/* Petunjuk zoom (hanya saat belum di-zoom) */}
          <span
            className={cn(
              'label-mono text-muted-foreground pointer-events-none absolute bottom-6 left-6 flex items-center gap-1.5 transition-opacity duration-300 sm:bottom-8 sm:left-8',
              view.s > 1.001 ? 'opacity-0' : 'opacity-100',
            )}
          >
            <Move className="size-3.5" aria-hidden="true" />
            Scroll untuk zoom · seret untuk geser
          </span>
        </div>

        {/* Baris fakta */}
        {fakta.length ? (
          <ul className="border-border/60 grid grid-cols-2 gap-x-6 gap-y-3 border-t px-5 py-4 lg:grid-cols-4">
            {fakta.map((f) => (
              <li key={f.label}>
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

        {/* Daftar titik + toggle lapisan */}
        <div className="border-border/60 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t px-5 py-3">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1.5">
            {semuaTitik.map((t) => (
              <li key={t.nama} className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={cn(
                    'size-2 shrink-0 rounded-full',
                    t.utama ? 'bg-accent-ikn' : t.lama ? 'bg-muted-foreground' : 'bg-foreground/50',
                  )}
                />
                <span className="text-muted-foreground text-xs">
                  <span className="text-foreground font-medium">{t.nama}</span>
                  {' — '}
                  {t.peran}
                </span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-1.5">
            {[
              ['pulau', 'Pulau'],
              ['khatulistiwa', 'Khatulistiwa'],
            ].map(([kunci, label]) => (
              <button
                key={kunci}
                type="button"
                onClick={() => toggleLapis(kunci)}
                aria-pressed={lapis[kunci]}
                className={cn(
                  'label-mono rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                  lapis[kunci]
                    ? 'border-accent-ikn/40 bg-accent-ikn/10 text-accent-ikn'
                    : 'border-border text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {keterangan ? (
        <figcaption className="text-muted-foreground mt-3 text-sm text-pretty">
          {keterangan}
        </figcaption>
      ) : null}
    </figure>
  )
}
