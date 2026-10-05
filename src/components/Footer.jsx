import { ArrowUp } from 'lucide-react'

import Logomark from '@/components/Logomark'
import { Rule } from '@/components/Rule'
import { meta } from '@/data'

/**
 * Footer profesional — adaptasi pola "Footer with Navigation Grid"
 * (shadcnui-blocks) + "Large Name Footer" (Spectrum UI), dengan bahasa
 * desain editorial milik halaman ini:
 *
 *   Zona 1: TIGA KOLOM SEJAJAR —
 *           identitas (logo + tagline) | Jelajahi | Sumber & Referensi.
 *           Referensi dibuat grid mini 2 kolom (item ganjil di kolom kiri,
 *           genap di kanan) + judul panjang di-truncate dengan tooltip,
 *           sehingga tingginya tetap sejajar dengan kolom lain.
 *   Zona 2: wordmark besar NUSANTARA dengan sheen halus (reactbits Shiny Text)
 *   Zona 3: bottom bar — kredit kiri, kembali ke atas kanan
 *
 * Semua anchor mengarah ke section yang benar; hover konsisten (muted →
 * foreground); keyboard reachable (semua elemen interaktif adalah <a>).
 */
export default function Footer() {
  const { deskripsi, jelajahi, sumber, kredit } = meta.footer

  // Referensi dibagi ke 2 kolom mini agar 10 item tetap pendek & sejajar:
  // item berindeks ganjil → kolom kiri, genap → kolom kanan.
  const kolomKiri = sumber.items.filter((_, i) => i % 2 === 0)
  const kolomKanan = sumber.items.filter((_, i) => i % 2 === 1)

  return (
    <footer className="paper-grain relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 pt-16 lg:px-10 lg:pt-20">
        {/* ===== Zona 1: identitas | Jelajahi | Sumber — sejajar ===== */}
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Kolom identitas */}
          <div className="lg:col-span-4">
            <div className="flex items-center gap-3">
              <Logomark animated={false} className="text-primary size-8" />
              <div className="leading-none">
                <p className="text-sm font-semibold tracking-tight">SWOT IKN</p>
                <p className="label-mono text-muted-foreground mt-1">
                  Nusantara · Kalimantan Timur
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-6 max-w-sm text-sm leading-relaxed text-pretty">
              {deskripsi}
            </p>
          </div>

          {/* Kolom navigasi */}
          <div className="lg:col-span-3">
            <h2 className="label-mono text-muted-foreground">{jelajahi.judul}</h2>
            <ul className="mt-5 space-y-3">
              {jelajahi.items.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-muted-foreground hover:text-foreground group flex items-baseline gap-2.5 text-sm transition-colors"
                  >
                    <span className="label-mono text-primary/60 group-hover:text-primary text-[0.65rem] tabular-nums transition-colors">
                      {item.nomor}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom sumber & referensi — grid mini 2 kolom, sejajar dengan lainnya */}
          <div className="lg:col-span-5">
            <h2 className="label-mono text-muted-foreground">{sumber.judul}</h2>
            {sumber.catatan ? (
              <p className="text-muted-foreground mt-3 text-xs leading-relaxed text-pretty">
                {sumber.catatan}
              </p>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-x-8">
              {[kolomKiri, kolomKanan].map((kolom, ci) => (
                <ul key={ci} className="space-y-3">
                  {kolom.map((s) => (
                    <li key={s.href}>
                      <a
                        href={s.href}
                        target="_blank"
                        rel="noreferrer"
                        title={s.label}
                        className="text-muted-foreground hover:text-foreground group flex items-baseline gap-2 text-xs leading-snug transition-colors"
                      >
                        <span className="text-primary/50 group-hover:text-primary label-mono shrink-0 text-[0.65rem] tabular-nums transition-colors">
                          {String(sumber.items.indexOf(s) + 1).padStart(2, '0')}
                        </span>
                        <span className="truncate underline decoration-border underline-offset-4 transition-colors group-hover:decoration-current">
                          {s.label}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>

        <Rule className="mt-14" />

        {/* ===== Zona 2: wordmark besar + sheen halus ===== */}
        <div aria-hidden="true" className="mt-10 lg:mt-12">
          <span className="relative block text-center">
            <span className="text-foreground/[0.07] block text-[15vw] leading-[0.8] font-semibold tracking-tighter select-none sm:text-[13vw]">
              NUSANTARA
            </span>
            {/* Sapuan sheen lewat wordmark (diam ~55% waktu, menyapu ~3s)
                — pola reactbits "Shiny Text", senada bahasa shimmer peta */}
            <span className="animate-sheen absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(255,255,255,0.5)_50%,transparent_60%)] bg-[length:250%_100%] bg-no-repeat" />
          </span>
        </div>

        <Rule className="mt-2" />

        {/* ===== Zona 3: bottom bar ===== */}
        <div className="mt-6 flex flex-col items-start justify-between gap-4 pb-10 sm:flex-row sm:items-center lg:pb-12">
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
