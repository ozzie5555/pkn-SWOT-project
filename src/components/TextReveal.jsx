import { Fragment } from 'react'

import { cn } from '@/lib/utils'
import { useInView } from '@/lib/use-in-view'

/**
 * Reveal per kata bergaya editorial: setiap kata muncul dari balik topeng
 * (mask) — teks seolah "tercetak" saat masuk viewport.
 *
 * Alasan cocok: efek ini memperkuat tipografi yang sudah jadi tulang
 * punggung halaman (bukan menutupinya), jadi terasa seperti gerak majalah,
 * bukan animasi template.
 *
 * Aksesibilitas:
 * - Teks utuh disediakan untuk pembaca layar lewat <span class="sr-only">.
 * - Span kata-kata visual ditandai aria-hidden agar tidak dibaca ganda.
 * - Otomatis tampil tanpa gerak saat prefers-reduced-motion.
 *
 * Catatan: `teks` harus berupa string biasa (bukan node React), karena
 * dipecah menjadi kata-kata.
 */
export default function TextReveal({
  as: Tag = 'span',
  teks,
  className,
  delay = 0,
  stagger = 55,
  ...props
}) {
  const [ref, inView] = useInView({ threshold: 0.3 })

  const kata = String(teks ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return (
    <Tag ref={ref} className={cn(className)} {...props}>
      {/* Teks utuh untuk screen reader & saat CSS nonaktif */}
      <span className="sr-only">{teks}</span>

      <span aria-hidden="true">
        {kata.map((kataKe, i) => (
          <Fragment key={`${kataKe}-${i}`}>
            {/* Spasi biasa ANTAR topeng (bukan NBSP) agar judul tetap bisa
                turun baris. Spasi sengaja tidak ikut topeng. */}
            {i > 0 ? ' ' : null}
            {/* Topeng: ruang 1 baris per kata. Padding kecil di bawah lalu
                ditarik balik (negative margin) memberi ruang descender
                (g, j, y) agar tidak terpotong oleh overflow-hidden. */}
            <span className="inline-block overflow-hidden pb-[0.14em] align-bottom -mb-[0.14em]">
              <span
                className={cn(
                  'inline-block will-change-transform',
                  'transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none',
                  inView ? 'translate-y-0' : 'translate-y-[115%]',
                )}
                style={{ transitionDelay: `${delay + i * stagger}ms` }}
              >
                {kataKe}
              </span>
            </span>
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
