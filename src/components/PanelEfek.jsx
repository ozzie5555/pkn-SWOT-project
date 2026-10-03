import { useState } from 'react'

import { Check, SlidersHorizontal, X } from 'lucide-react'

import { efek, labelEfek, semuaEfek, simpanEfek } from '@/lib/efek'
import { cn } from '@/lib/utils'

/**
 * Panel pembanding efek — HANYA muncul saat `npm run dev` (mode pengembangan).
 *
 * Menyalakan/mematikan tiap efek lalu memuat ulang halaman, supaya bisa
 * dibandingkan "dengan vs tanpa" secara cepat. Di build produksi komponen ini
 * tidak pernah dipasang.
 */
export default function PanelEfek() {
  if (!import.meta.env.DEV) return null
  return <Panel />
}

function Panel() {
  const [buka, setBuka] = useState(false)
  const [aktif, setAktif] = useState(() => semuaEfek.filter((e) => efek[e]))

  const toggle = (nama) => {
    const berikut = aktif.includes(nama)
      ? aktif.filter((e) => e !== nama)
      : [...aktif, nama]
    setAktif(berikut)
    simpanEfek(berikut)
    window.location.reload()
  }

  if (!buka) {
    return (
      <button
        type="button"
        onClick={() => setBuka(true)}
        className="bg-foreground text-background fixed right-4 bottom-4 z-50 flex size-11 items-center justify-center rounded-full shadow-lg print:hidden"
        aria-label="Buka panel pembanding efek"
      >
        <SlidersHorizontal className="size-5" aria-hidden="true" />
      </button>
    )
  }

  return (
    <div className="border-border bg-background fixed right-4 bottom-4 z-50 w-60 rounded-xl border p-3 shadow-lg print:hidden">
      <div className="flex items-center justify-between">
        <p className="label-mono text-muted-foreground">Bandingkan efek</p>
        <button
          type="button"
          onClick={() => setBuka(false)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Tutup panel"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      <ul className="mt-2 space-y-1">
        {semuaEfek.map((nama) => {
          const nyala = aktif.includes(nama)
          return (
            <li key={nama}>
              <button
                type="button"
                onClick={() => toggle(nama)}
                aria-pressed={nyala}
                className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm"
              >
                <span
                  className={cn(
                    'flex size-4 items-center justify-center rounded border',
                    nyala
                      ? 'border-accent-ikn bg-accent-ikn text-white'
                      : 'border-border',
                  )}
                >
                  {nyala ? (
                    <Check className="size-3" strokeWidth={3} aria-hidden="true" />
                  ) : null}
                </span>
                {labelEfek[nama] ?? nama}
              </button>
            </li>
          )
        })}
      </ul>

      <p className="label-mono text-muted-foreground mt-2 border-t pt-2">
        Muat ulang otomatis · dev only
      </p>
    </div>
  )
}
