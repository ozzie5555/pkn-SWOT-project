import { useRef, useState } from 'react'

import { inisial } from '@/lib/anggota'
import { cn } from '@/lib/utils'
import { useInView } from '@/lib/use-in-view'

/**
 * Kartu anggota dengan "spotlight" yang mengikuti kursor + reveal bertahap.
 *
 * Kenapa begini (bukan kartu SaaS generic):
 * - Aksennya tetap tipografis: monogram inisial (bukan foto stok), nomor urut
 *   mono, nama display. Tidak menambah "warna" asing ke halaman.
 * - Spotlight memakai warna aksen IKN yang sudah ada, hanya sebagai sorot
 *   lembut di tepi kartu — bukan glow neon.
 * - Reveal memakai IntersectionObserver yang sama dengan Reveal/TextReveal,
 *   jadi terasa satu keluarga.
 *
 * Aksesibilitas / performa:
 * - Posisi spotlight disimpan di CSS custom property (`--x`, `--y`) lewat
 *   ref, BUKAN state, supaya pointermove tidak memicu re-render React.
 * - prefers-reduced-motion: reveal instan (via useInView) & tilt dimatikan.
 */
export default function KartuAnggota({ nomor, nama, role, delay = 0 }) {
  const [ref, inView] = useInView({ threshold: 0.2 })
  const kartuRef = useRef(null)
  const [sorot, setSorot] = useState(false)

  const onPointerMove = (e) => {
    const el = kartuRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--y', `${e.clientY - rect.top}px`)
  }

  return (
    <div
      ref={ref}
      className={cn(
        'group relative',
        'transition-[opacity,transform] duration-[750ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
        inView
          ? 'translate-y-0 opacity-100'
          : 'translate-y-5 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100',
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div
        ref={kartuRef}
        onPointerMove={onPointerMove}
        onPointerEnter={() => setSorot(true)}
        onPointerLeave={() => setSorot(false)}
        className="border-border/80 bg-card/60 shadow-xs relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 backdrop-blur-xs transition-[border-color,box-shadow,transform] duration-300 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:p-5"
      >
        {/* Lapisan spotlight (ikut kursor). Hanya terlihat saat hover. */}
        <span
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 transition-opacity duration-300',
            sorot ? 'opacity-100' : 'opacity-0',
          )}
          style={{
            background:
              'radial-gradient(220px circle at var(--x, 50%) var(--y, 50%), color-mix(in oklab, var(--accent-ikn) 16%, transparent), transparent 65%)',
          }}
        />

        {/* Monogram inisial — aksen tipografis, bukan foto. */}
        <div className="border-primary/20 bg-primary/10 text-primary relative flex size-11 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-semibold tracking-tight transition-transform duration-300 group-hover:scale-105">
          {inisial(nama)}
        </div>

        <div className="relative min-w-0 flex-1">
          <p className="text-foreground group-hover:text-primary text-sm leading-snug font-semibold transition-colors">
            {nama}
          </p>
          <p className="label-mono text-muted-foreground mt-1 text-xs">{role}</p>
        </div>

        {/* Nomor urut mono di sudut — detail editorial. */}
        <span
          aria-hidden="true"
          className="label-mono text-muted-foreground/60 absolute top-3 right-4 tabular-nums"
        >
          {String(nomor).padStart(2, '0')}
        </span>
      </div>
    </div>
  )
}
