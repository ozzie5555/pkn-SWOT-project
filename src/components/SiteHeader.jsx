import { useEffect, useState } from 'react'

import Logomark from '@/components/Logomark'
import ScrollProgress from '@/components/ScrollProgress'
import { Button } from '@/components/ui/button'
import { meta } from '@/data'
import { efek } from '@/lib/efek'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '#latar-belakang', label: 'Latar Belakang', nomor: '01' },
  { href: '#swot', label: 'SWOT', nomor: '02' },
  { href: '#timeline', label: 'Timeline', nomor: '03' },
  { href: '#diskusi', label: 'Diskusi', nomor: '04' },
]

// Daftar href stabil (konstanta modul) supaya effect scroll spy tidak
// berlangganan ulang setiap render.
const navHrefs = navItems.map((i) => i.href)

/**
 * Melacak section mana yang sedang aktif (paling dekat dengan puncak viewport).
 *
 * Logika: pada tiap scroll, cari section terakhir yang tepi atasnya sudah
 * melewati garis acuan (header + sedikit). Pendekatan "yang terakhir lewat"
 * ini lebih tenang daripada IntersectionObserver untuk navigasi — tidak
 * berkedip saat dua section sama-sama terlihat, dan selalu ada satu pilihan.
 */
function useSectionAktif(hrefs) {
  const [aktif, setAktif] = useState(hrefs[0] ?? null)

  useEffect(() => {
    let raf = 0

    const hitung = () => {
      raf = 0
      const garis = window.scrollY + 140 // tinggi header + margin
      let terpilih = hrefs[0] ?? null
      for (const href of hrefs) {
        const el = document.querySelector(href)
        if (el && el.getBoundingClientRect().top + window.scrollY <= garis) {
          terpilih = href
        }
      }
      // Bila sudah menyentuh dasar halaman, pastikan item terakhir aktif.
      const doc = document.documentElement
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) {
        terpilih = hrefs[hrefs.length - 1] ?? terpilih
      }
      setAktif(terpilih)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(hitung)
    }

    hitung()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [hrefs])

  return aktif
}

export default function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const aktif = useSectionAktif(navHrefs)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-300',
        scrolled
          ? 'bg-background/80 supports-[backdrop-filter]:bg-background/65 border-border shadow-[0_8px_30px_-24px_color-mix(in_oklab,var(--foreground)_45%,transparent)] backdrop-blur-md'
          : 'border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3 lg:px-10">
        <a
          href="#beranda"
          className="group flex items-center gap-2.5 whitespace-nowrap"
        >
          <Logomark animated={false} className="text-primary size-7" />
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">
              SWOT IKN
            </span>
            <span className="label-mono text-muted-foreground mt-0.5">
              Berkas Analisis
            </span>
          </span>
        </a>

        <nav aria-label="Navigasi bagian">
          <ul className="flex items-center gap-1 sm:gap-2">
            {navItems.map((item) => {
              const iniAktif = efek.spy && aktif === item.href
              return (
                <li key={item.href}>
                  <a
                    href={item.href}
                    aria-label={item.label}
                    aria-current={iniAktif ? 'true' : undefined}
                    className={cn(
                      'group inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-sm transition-colors sm:px-3',
                      iniAktif
                        ? 'bg-accent-ikn/10 text-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                    )}
                  >
                    <span
                      className={cn(
                        'label-mono transition-colors',
                        iniAktif
                          ? 'text-accent-ikn'
                          : 'text-muted-foreground group-hover:text-accent-ikn',
                      )}
                    >
                      {item.nomor}
                    </span>
                    <span className="hidden md:inline">{item.label}</span>
                  </a>
                </li>
              )
            })}
            <li className="ml-1 hidden sm:block">
              <Button asChild size="sm" className="rounded-full">
                <a href="#swot">{meta.tombolMulai}</a>
              </Button>
            </li>
          </ul>
        </nav>
      </div>

      <ScrollProgress />
    </div>
  )
}
