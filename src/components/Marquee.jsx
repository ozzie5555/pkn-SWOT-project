import { cn } from '@/lib/utils'

/**
 * Satu salinan deretan kata. Dipakai dua kali berdampingan agar loop mulus.
 */
function Salinan({ items, tersembunyi }) {
  return (
    <ul
      aria-hidden={tersembunyi || undefined}
      className="flex shrink-0 items-center"
    >
      {items.map((teks, i) => (
        <li key={`${teks}-${i}`} className="flex shrink-0 items-center">
          <span className="label-mono text-muted-foreground px-6">{teks}</span>
          <span aria-hidden="true" className="bg-accent-ikn/50 size-1 rounded-full" />
        </li>
      ))}
    </ul>
  )
}

/**
 * Ticker mono bergaya kepala koran: deretan kata kunci yang berjalan perlahan,
 * diapit hairline di atas-bawah.
 *
 * Dipakai HEMAT — satu bilah tipis tepat di bawah hero. Karena halaman ini
 * seluruhnya diam kecuali reveal, satu strip yang terus bergerak memberi
 * "denyut" tanpa mengubah karakter editorial.
 *
 * Teknis:
 * - Dua salinan isi berdampingan, lintasan digeser -50% lalu diulang →
 *   mulus tanpa jeda.
 * - Lebar tiap salinan = `max-content`, jadi tak peduli panjang teks.
 * - prefers-reduced-motion: animasi dimatikan (via utilitas motion-reduce)
 *   dan bilah tetap tampil sebagai baris statis.
 * - Pemakaian ganda (dua salinan) ditandai aria-hidden; satu versi teks
 *   asli disediakan untuk pembaca layar.
 */
export default function Marquee({ items = [], className, durasi = 46 }) {
  if (!items.length) return null

  return (
    <div className={cn('group border-border relative overflow-hidden border-y', className)}>
      {/* Versi statis untuk screen reader */}
      <span className="sr-only">{items.join(' · ')}</span>

      <div
        aria-hidden="true"
        className="animate-marquee flex w-max group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${durasi}s` }}
      >
        <Salinan items={items} tersembunyi />
        <Salinan items={items} tersembunyi />
      </div>

      {/* Sirip pudar di kedua tepi agar teks muncul/menghilang, bukan terpotong */}
      <div className="from-background pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r to-transparent" />
      <div className="from-background pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l to-transparent" />
    </div>
  )
}
