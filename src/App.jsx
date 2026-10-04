import AnalisisSwot from '@/components/AnalisisSwot'
import DiskusiKomentar from '@/components/DiskusiKomentar'
import Footer from '@/components/Footer'
import Hero from '@/components/Hero'
import LatarBelakang from '@/components/LatarBelakang'
import Marquee from '@/components/Marquee'
import SiteHeader from '@/components/SiteHeader'
import Timeline from '@/components/Timeline'
import TimAnggota from '@/components/TimAnggota'
import { meta } from '@/data'
import { efek } from '@/lib/efek'

export default function App() {
  return (
    <>
      <SiteHeader />
      <Hero />
      {/* Ticker mono: satu bilah tipis tepat di bawah hero. Sengaja hanya
          satu agar tidak terasa seperti template. Bisa dimatikan lewat
          ?efek=none / hapus "marquee" di localStorage. */}
      {efek.marquee ? <Marquee items={meta.marquee} /> : null}
      <main>
        <LatarBelakang />
        <AnalisisSwot />
        <Timeline />
        <DiskusiKomentar />
        <TimAnggota />
      </main>
      <Footer />
    </>
  )
}
