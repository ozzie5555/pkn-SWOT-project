import { Building2, Scale, Trees } from 'lucide-react'

import PanelLokasi from '@/components/PanelLokasi'
import PetaIndonesia from '@/components/PetaIndonesia'
import Reveal from '@/components/Reveal'
import { Rule } from '@/components/Rule'
import { Section, SectionHeading } from '@/components/Section'
import { latarBelakang, meta } from '@/data'
import { cn } from '@/lib/utils'

// Ikon murni presentasional, dipetakan per urutan (bukan konten/fakta).
const ikon = [Building2, Scale, Trees]

/**
 * Satu alasan sebagai ITEM editorial (tanpa kotak/kartu):
 * nomor mono + ikon penanda di atas, lalu judul + deskripsi di bawah.
 * Di mobile item tersusun ke bawah; di desktop (lg) ketiganya berdampingan
 * kiri–tengah–kanan dan dipisah hairline vertikal oleh `lg:divide-x`.
 *
 * Catatan padding: `first:`/`last:` TIDAK dipakai di sini karena tiap item
 * dibungkus Reveal — di mata Tailwind semuanya anak tunggal, sehingga
 * first/last kena semuanya. Padding tepi diatur lewat `index` dari induk.
 */
function ItemAlasan({ item, index, total }) {
  const Icon = ikon[index] ?? Building2
  const nomor = String(index + 1).padStart(2, '0')

  return (
    <article
      className={cn(
        'group flex flex-col gap-4 py-8 sm:py-10 lg:gap-5 lg:px-8 lg:pt-10 lg:pb-6',
        index === 0 && 'lg:pl-0',
        index === total - 1 && 'lg:pr-0',
      )}
    >
      {/* Nomor urut + ikon penanda */}
      <div className="flex items-center gap-3">
        <span className="label-mono text-accent-ikn tabular-nums">{nomor}</span>
        <span className="text-muted-foreground/60 transition-colors duration-300 group-hover:text-accent-ikn">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
      </div>

      <div>
        <h3 className="text-lg leading-snug tracking-tight text-balance sm:text-xl">
          {item.judul}
        </h3>
        <p className="text-muted-foreground mt-4 max-w-md text-sm leading-relaxed text-pretty sm:text-base">
          {item.deskripsi}
        </p>
      </div>
    </article>
  )
}

export default function LatarBelakang() {
  return (
    <Section id="latar-belakang" className="border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        {/* Jembatan dari hero: hairline editorial pembuka bab */}
        <Rule className="mt-2" />

        {/* Kepala bagian: judul di kiri, lead di kanan */}
        <div className="mt-12 grid items-end gap-8 sm:mt-14 lg:grid-cols-12">
          <SectionHeading
            bab="01"
            eyebrow="Konteks"
            judul={meta.section.latarBelakang.judul}
            className="lg:col-span-7"
          />
          <Reveal className="lg:col-span-5" delay={120}>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              {meta.section.latarBelakang.deskripsi}
            </p>
          </Reveal>
        </div>

        {/* Panel lokasi tipografis: menegaskan letak ibu kota baru */}
        <PanelLokasi className="mt-14 sm:mt-16" />

        {/* Peta Indonesia + titik IKN — menggantikan slider foto lama.
            FULL-BLEED tapi dibatasi max-w-[1600px] supaya di layar raksasa
            tetap proporsional; di laptop umum (1280–1440px) ia lebar penuh. */}
        <div className="mt-20 sm:mt-24">
          <div className="mb-10 flex items-center gap-4">
            <span className="label-mono text-muted-foreground shrink-0 text-sm tracking-widest sm:text-base">
              Letak di Peta
            </span>
            <span aria-hidden="true" className="bg-border h-px flex-1" />
          </div>
          <Reveal>
            <div className="mx-[calc(50%-50vw)] w-screen">
              {/* Cap 1600px + padding tepi agar di layar lebar tak melar kaku */}
              <div className="mx-auto max-w-[1600px] px-4 sm:px-6">
                <PetaIndonesia
                  judul={meta.section.latarBelakang.peta.judul}
                  keterangan={meta.section.latarBelakang.peta.keterangan}
                  fakta={meta.section.latarBelakang.peta.fakta}
                  titik={meta.section.latarBelakang.peta.titik}
                />
              </div>
            </div>
          </Reveal>
        </div>

        {/* Tiga alasan utama — 3 kolom di desktop (kiri-tengah-kanan),
            tersusun ke bawah di mobile; pemisah hairline mengikuti arah grid */}
        <div className="mt-16 lg:mt-20">
          <div className="flex items-center gap-4">
            <span className="label-mono text-muted-foreground shrink-0">
              Tiga Alasan Utama
            </span>
            <span aria-hidden="true" className="bg-border h-px flex-1" />
          </div>

          <div className="divide-border mt-6 grid divide-y lg:mt-8 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            {latarBelakang.map((item, i) => (
              <Reveal key={item.judul} delay={i * 90}>
                <ItemAlasan item={item} index={i} total={latarBelakang.length} />
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </Section>
  )
}
