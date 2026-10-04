import { ArrowUp } from 'lucide-react'

import Logomark from '@/components/Logomark'
import { Rule } from '@/components/Rule'
import { meta } from '@/data'

/**
 * Footer ringkas — satu baris atas yang sejajar (identitas kiri,
 * "Kembali ke atas" kanan), lalu wordmark penutup yang langsung mengikuti,
 * dan kredit sebagai baris tipis paling bawah.
 *
 * Daftar anggota kini ditampilkan di section "Tim Penyusun" (TimAnggota,
 * bab 05), bukan lagi di footer.
 */
export default function Footer() {
  const { kredit } = meta.footer

  return (
    <footer className="paper-grain relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-16 pb-10 lg:px-10 lg:pt-20 lg:pb-12">
        {/* Baris atas: identitas + kembali ke atas — sejajar dalam satu baris */}
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
          <div className="flex items-center gap-3">
            <Logomark animated={false} className="text-primary size-8" />
            <div className="leading-none">
              <p className="text-sm font-semibold tracking-tight">SWOT IKN</p>
              <p className="label-mono text-muted-foreground mt-1">
                Nusantara · Kalimantan Timur
              </p>
            </div>
          </div>

          <a
            href="#beranda"
            className="text-muted-foreground hover:text-foreground group inline-flex shrink-0 items-center gap-2 text-sm transition-colors"
          >
            Kembali ke atas
            <ArrowUp
              className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5"
              aria-hidden="true"
            />
          </a>
        </div>

        <Rule className="mt-10" />

        {/* Wordmark penutup — langsung mengikuti baris identitas, bukan
            "jatuh" jauh di bawah dengan gap besar seperti sebelumnya */}
        <div aria-hidden="true" className="mt-10 lg:mt-14">
          <span className="text-foreground/[0.06] block text-center text-[15vw] leading-[0.8] font-semibold tracking-tighter select-none sm:text-[13vw]">
            NUSANTARA
          </span>
        </div>

        <Rule className="mt-8" />

        {/* Kredit — baris penutup tipis */}
        <p className="text-muted-foreground mt-6 text-sm text-pretty">{kredit}</p>
      </div>
    </footer>
  )
}
