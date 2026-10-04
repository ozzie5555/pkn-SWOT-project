import { ArrowUp, User } from 'lucide-react'

import KartuAnggota from '@/components/KartuAnggota'
import Logomark from '@/components/Logomark'
import { Rule } from '@/components/Rule'
import { meta } from '@/data'
import { efek } from '@/lib/efek'

/**
 * Grid anggota: kartu + spotlight + monogram.
 *
 * Bila efek "anggota" dimatikan (`?efek=none`), jatuh ke kartu
 * netral dengan ikon generik — versi asli sebelum efek ditambahkan.
 */
function GridAnggota({ items }) {
  if (!efek.anggota) {
    return (
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
        {items.map((item) => (
          <div
            key={item.id}
            className="border-border/80 bg-card/60 shadow-xs group relative flex items-center gap-4 overflow-hidden rounded-2xl border p-4 backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md sm:p-5"
          >
            {/* Avatar Icon */}
            <div className="border-primary/20 bg-primary/10 text-primary flex size-11 shrink-0 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-105">
              <User className="size-5.5" aria-hidden="true" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-foreground group-hover:text-primary text-sm leading-snug font-semibold transition-colors">
                {item.nama}
              </p>
              <p className="label-mono text-muted-foreground mt-1 text-xs">
                {item.role}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-5">
      {items.map((item, i) => (
        <KartuAnggota
          key={item.id}
          nomor={i + 1}
          nama={item.nama}
          role={item.role}
          delay={(i % 4) * 80}
        />
      ))}
    </div>
  )
}

export default function Footer() {
  const { judulAnggota, deskripsiAnggota, anggota, kredit } = meta.footer

  return (
    <footer id="anggota" className="paper-grain relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
        {/* Identitas & Judul Anggota Kelompok */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Logomark animated={false} className="text-primary size-8" />
              <div className="leading-none">
                <p className="text-sm font-semibold tracking-tight">SWOT IKN</p>
                <p className="label-mono text-muted-foreground mt-1">
                  Nusantara · Kalimantan Timur
                </p>
              </div>
            </div>

            <h2 className="label-mono text-foreground mt-8 text-lg font-semibold tracking-tight sm:text-xl">
              {judulAnggota}
            </h2>
            <p className="text-muted-foreground mt-2 max-w-xl text-sm leading-relaxed text-pretty">
              {deskripsiAnggota}
            </p>
          </div>
        </div>

        <GridAnggota items={anggota} />

        {/* Wordmark besar sebagai penutup */}
        <div aria-hidden="true" className="mt-16 lg:mt-24">
          <span className="text-foreground/[0.06] block text-center text-[15vw] leading-[0.8] font-semibold tracking-tighter select-none sm:text-[13vw]">
            NUSANTARA
          </span>
        </div>

        <Rule className="mt-8" />

        <div className="mt-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="text-muted-foreground text-sm text-pretty">{kredit}</p>
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
      </div>
    </footer>
  )
}
