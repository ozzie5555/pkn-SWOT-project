import { useEffect, useId, useState } from 'react'

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lightbulb,
  Loader2,
  Lock,
  LogOut,
  MessageSquare,
  MessageSquarePlus,
  Radio,
  Reply,
  Send,
  Shield,
  ShieldCheck,
  Trash2,
} from 'lucide-react'

import Reveal from '@/components/Reveal'
import { Rule } from '@/components/Rule'
import { Section, SectionHeading } from '@/components/Section'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { meta } from '@/data'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const PIN_MODERATOR = import.meta.env.VITE_MODERATOR_PIN || '0813'

// Data contoh awal untuk presentasi jika tabel Supabase masih kosong atau belum terhubung
const contohKomentarAwal = [
  {
    id: 'demo-1',
    nama: 'Budi Santoso',
    kategori: 'Pertanyaan',
    pesan:
      'Bagaimana mitigasi konkrit untuk perlindungan satwa endemik di luar kawasan inti IKN?',
    terjawab: true,
    jawaban:
      'Pemerintah mengalokasikan 75% kawasan sebagai koridor hijau dan reforestasi hutan lindung untuk jalur migrasi satwa seperti orangutan dan bekantan.',
    disembunyikan: false,
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'demo-2',
    nama: 'Kelompok 3',
    kategori: 'Pandangan',
    pesan:
      'Konsep Smart Forest City sangat visioner untuk mengurangi beban ekologis Jakarta yang kian padat.',
    terjawab: false,
    jawaban: null,
    disembunyikan: false,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
]

function formatWaktu(waktuStr) {
  try {
    const waktu = new Date(waktuStr)
    const selisihMenit = Math.floor((Date.now() - waktu.getTime()) / (1000 * 60))

    if (selisihMenit < 1) return 'Baru saja'
    if (selisihMenit < 60) return `${selisihMenit} mnt lalu`

    return waktu.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return 'Baru saja'
  }
}

function lencanaKategori(kategori) {
  switch (kategori) {
    case 'Pertanyaan':
      return {
        ikon: HelpCircle,
        kelas:
          'text-swot-opportunities bg-swot-opportunities/10 border-swot-opportunities/20',
      }
    case 'Saran':
      return {
        ikon: Lightbulb,
        kelas: 'text-accent-brass bg-accent-brass/10 border-accent-brass/20',
      }
    default:
      return {
        ikon: MessageSquare,
        kelas: 'text-accent-ikn bg-accent-ikn/10 border-accent-ikn/20',
      }
  }
}

export default function DiskusiKomentar() {
  const { judul, deskripsi, kategoriOpsi } = meta.section.diskusi
  const formId = useId()

  const [komentarList, setKomentarList] = useState([])
  const [loading, setLoading] = useState(true)
  const [kirimLoading, setKirimLoading] = useState(false)
  const [suksesKirim, setSuksesKirim] = useState(false)
  const [filterKategori, setFilterKategori] = useState('Semua')

  // State form pengirim
  const [nama, setNama] = useState('')
  const [kategori, setKategori] = useState(kategoriOpsi[0] || 'Pertanyaan')
  const [pesan, setPesan] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  // State Mode Moderator
  const [isModerator, setIsModerator] = useState(() => {
    if (typeof window === 'undefined') return false
    return sessionStorage.getItem('swot_ikn_moderator') === 'true'
  })
  const [modalPinBuka, setModalPinBuka] = useState(false)
  const [inputPin, setInputPin] = useState('')
  const [errorPin, setErrorPin] = useState('')

  // State Konfirmasi Hapus Komentar
  const [komentarMauDihapus, setKomentarMauDihapus] = useState(null)
  const [hapusLoading, setHapusLoading] = useState(false)

  // State Menjawab / Membalas Pertanyaan
  const [komentarDijawab, setKomentarDijawab] = useState(null)
  const [teksJawaban, setTeksJawaban] = useState('')
  const [simpanJawabLoading, setSimpanJawabLoading] = useState(false)

  // 1. Ambil data awal dan aktifkan Supabase Realtime (INSERT, UPDATE, DELETE)
  useEffect(() => {
    let channel = null

    async function muatKomentar() {
      if (!isSupabaseConfigured || !supabase) {
        setKomentarList(contohKomentarAwal)
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('komentar')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error
        setKomentarList(data || [])
      } catch (err) {
        console.error('Gagal mengambil data komentar:', err)
        setKomentarList(contohKomentarAwal)
      } finally {
        setLoading(false)
      }

      // Langganan pembaruan realtime untuk semua event (INSERT, UPDATE, DELETE)
      channel = supabase
        .channel('komentar-live')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'komentar' },
          (payload) => {
            if (payload.eventType === 'INSERT') {
              setKomentarList((prev) => {
                if (prev.some((k) => k.id === payload.new.id)) return prev
                return [payload.new, ...prev]
              })
            } else if (payload.eventType === 'DELETE') {
              setKomentarList((prev) =>
                prev.filter((k) => k.id !== payload.old.id),
              )
            } else if (payload.eventType === 'UPDATE') {
              setKomentarList((prev) =>
                prev.map((k) => (k.id === payload.new.id ? payload.new : k)),
              )
            }
          },
        )
        .subscribe()
    }

    muatKomentar()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  // 2. Handler kirim komentar audiens
  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')

    if (!nama.trim() || !pesan.trim()) {
      setErrorMsg('Mohon isi nama dan pesan Anda.')
      return
    }

    setKirimLoading(true)

    const dataBaru = {
      nama: nama.trim(),
      kategori,
      pesan: pesan.trim(),
      terjawab: false,
      jawaban: null,
      disembunyikan: false,
    }

    if (!isSupabaseConfigured || !supabase) {
      const itemLokal = {
        ...dataBaru,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      setKomentarList((prev) => [itemLokal, ...prev])
      setPesan('')
      setSuksesKirim(true)
      setKirimLoading(false)
      setTimeout(() => setSuksesKirim(false), 4000)
      return
    }

    try {
      const { data, error } = await supabase
        .from('komentar')
        .insert([dataBaru])
        .select()
        .single()

      if (error) throw error

      if (data) {
        setKomentarList((prev) => {
          if (prev.some((k) => k.id === data.id)) return prev
          return [data, ...prev]
        })
      }

      setPesan('')
      setSuksesKirim(true)
      setTimeout(() => setSuksesKirim(false), 4000)
    } catch (err) {
      console.error('Gagal mengirim komentar:', err)
      setErrorMsg(
        'Gagal mengirim ke Supabase. Pastikan tabel "komentar" sudah memiliki kolom yang sesuai.',
      )
    } finally {
      setKirimLoading(false)
    }
  }

  // 3. Handler Moderator: Login PIN
  const handleVerifikasiPin = (e) => {
    e.preventDefault()
    if (inputPin.trim() === PIN_MODERATOR) {
      setIsModerator(true)
      sessionStorage.setItem('swot_ikn_moderator', 'true')
      setModalPinBuka(false)
      setInputPin('')
      setErrorPin('')
    } else {
      setErrorPin('PIN salah. Silakan coba lagi.')
    }
  }

  // 4. Handler Moderator: Keluar
  const handleKeluarModerator = () => {
    setIsModerator(false)
    sessionStorage.removeItem('swot_ikn_moderator')
  }

  // 5. Handler Moderator: Eksekusi Hapus Komentar setelah konfirmasi
  const handleEksekusiHapus = async () => {
    if (!komentarMauDihapus) return
    const id = komentarMauDihapus.id
    setHapusLoading(true)

    // Optimistic delete di state
    setKomentarList((prev) => prev.filter((k) => k.id !== id))

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.from('komentar').delete().eq('id', id)
        if (error) throw error
      } catch (err) {
        console.error('Gagal menghapus komentar dari Supabase:', err)
      }
    }

    setHapusLoading(false)
    setKomentarMauDihapus(null)
  }

  // 6. Handler Moderator: Toggle Sembunyikan / Tampilkan Komentar
  const handleToggleSembunyikan = async (item) => {
    const statusBaru = !item.disembunyikan

    // Optimistic update di state
    setKomentarList((prev) =>
      prev.map((k) => (k.id === item.id ? { ...k, disembunyikan: statusBaru } : k)),
    )

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('komentar')
          .update({ disembunyikan: statusBaru })
          .eq('id', item.id)
        if (error) throw error
      } catch (err) {
        console.error('Gagal memperbarui status sembunyikan di Supabase:', err)
      }
    }
  }

  // 7. Handler Moderator: Buka Dialog Jawab Pertanyaan
  const handleBukaJawab = (item) => {
    setKomentarDijawab(item)
    setTeksJawaban(item.jawaban || '')
  }

  // 8. Handler Moderator: Simpan Jawaban
  const handleSimpanJawaban = async (e) => {
    e.preventDefault()
    if (!komentarDijawab) return

    setSimpanJawabLoading(true)
    const jawabanRapi = teksJawaban.trim()
    const isAdaJawaban = Boolean(jawabanRapi)

    // Optimistic update di state
    setKomentarList((prev) =>
      prev.map((k) =>
        k.id === komentarDijawab.id
          ? { ...k, jawaban: jawabanRapi || null, terjawab: isAdaJawaban }
          : k,
      ),
    )

    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase
          .from('komentar')
          .update({
            jawaban: jawabanRapi || null,
            terjawab: isAdaJawaban,
          })
          .eq('id', komentarDijawab.id)
        if (error) throw error
      } catch (err) {
        console.error('Gagal menyimpan balasan di Supabase:', err)
      }
    }

    setSimpanJawabLoading(false)
    setKomentarDijawab(null)
    setTeksJawaban('')
  }

  // Filter daftar komentar:
  // - Pengunjung biasa TIDAK melihat komentar yang disembunyikan (disembunyikan: true)
  // - Moderator BISA melihat semuanya (dengan tanda khusus)
  const listTertampil = komentarList.filter((k) => {
    if (!isModerator && k.disembunyikan) return false
    if (filterKategori === 'Semua') return true
    return k.kategori === filterKategori
  })

  return (
    <Section id="diskusi" className="border-b">
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <Rule className="mt-2" />

        {/* Kepala bagian */}
        <div className="mt-12 grid items-end gap-8 sm:mt-14 lg:grid-cols-12">
          <SectionHeading
            bab="04"
            eyebrow="Tanggapan Publik"
            judul={judul}
            className="lg:col-span-7"
          />
          <Reveal className="lg:col-span-5" delay={120}>
            <p className="text-muted-foreground text-lg leading-relaxed text-pretty">
              {deskripsi}
            </p>
          </Reveal>
        </div>

        {/* Banner info jika belum setup .env */}
        {!isSupabaseConfigured && (
          <div className="mt-8 rounded-xl border border-dashed border-accent-brass/40 bg-accent-brass/[0.04] p-4 text-sm text-foreground/80 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-accent-brass" />
              <p>
                <strong className="font-medium text-foreground">Mode Simulasi Lokal:</strong>{' '}
                Kredensial Supabase belum terdeteksi di <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">.env</code>. Komentar saat ini disimpan di sesi lokal.
              </p>
            </div>
            <span className="label-mono text-muted-foreground mt-2 block sm:mt-0">
              Perlu .env untuk cloud
            </span>
          </div>
        )}

        {/* Konten 2 kolom (kiri: form input, kanan: feed komentar) */}
        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Kolom Kiri: Form Input Editorial */}
          <Reveal className="lg:col-span-5" delay={60}>
            <div className="sticky top-24 rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
              <div className="flex items-center justify-between">
                <span className="label-mono text-accent-ikn">Form Tanggapan</span>
                <span className="text-muted-foreground text-xs">Presentasi PPKN</span>
              </div>

              <h3 className="mt-3 text-xl font-semibold tracking-tight">
                Sampaikan Pendapat Anda
              </h3>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed text-pretty">
                Tanggapan Anda akan langsung ditampilkan pada layar presentasi.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Input Nama */}
                <div>
                  <label
                    htmlFor={`${formId}-nama`}
                    className="label-mono text-muted-foreground block"
                  >
                    Nama / Kelompok
                  </label>
                  <input
                    id={`${formId}-nama`}
                    type="text"
                    required
                    placeholder="Contoh: Rian / Kelompok 2"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="mt-2 w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent-ikn focus:ring-1 focus:ring-accent-ikn focus:outline-none"
                  />
                </div>

                {/* Pemilihan Kategori */}
                <div>
                  <label className="label-mono text-muted-foreground block">
                    Kategori Tanggapan
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {kategoriOpsi.map((kat) => {
                      const aktif = kategori === kat
                      return (
                        <button
                          key={kat}
                          type="button"
                          onClick={() => setKategori(kat)}
                          className={cn(
                            'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                            aktif
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground',
                          )}
                        >
                          {kat}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Pesan Komentar */}
                <div>
                  <label
                    htmlFor={`${formId}-pesan`}
                    className="label-mono text-muted-foreground block"
                  >
                    Isi Pertanyaan / Argumen
                  </label>
                  <textarea
                    id={`${formId}-pesan`}
                    required
                    rows={4}
                    placeholder="Tuliskan argumen, masukan, atau pertanyaan terkait materi IKN..."
                    value={pesan}
                    onChange={(e) => setPesan(e.target.value)}
                    className="mt-2 w-full resize-none rounded-lg border bg-background p-3.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent-ikn focus:ring-1 focus:ring-accent-ikn focus:outline-none"
                  />
                </div>

                {errorMsg && (
                  <p className="text-xs text-swot-weaknesses">{errorMsg}</p>
                )}

                {suksesKirim && (
                  <div className="flex items-center gap-2 rounded-lg bg-swot-strengths/10 p-3 text-xs text-swot-strengths">
                    <CheckCircle2 className="size-4 shrink-0" />
                    <span>Tanggapan Anda berhasil dikirim ke layar!</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={kirimLoading}
                  className="w-full rounded-full"
                >
                  {kirimLoading ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Tanggapan
                      <Send className="ml-2 size-4" />
                    </>
                  )}
                </Button>
              </form>
            </div>
          </Reveal>

          {/* Kolom Kanan: Feed Tanggapan (Ledger Style) */}
          <div className="lg:col-span-7">
            {/* Header Feed */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-ikn opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-accent-ikn" />
                </span>
                <span className="label-mono text-foreground font-semibold">
                  Live Feed ({listTertampil.length})
                </span>
                <span className="text-muted-foreground hidden items-center gap-1 text-xs sm:flex">
                  <Radio className="size-3 text-accent-ikn" />
                  Realtime
                </span>
              </div>

              {/* Kontrol Moderator & Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Tombol Moderator */}
                {isModerator ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-swot-strengths/30 bg-swot-strengths/10 px-2.5 py-1 text-xs text-swot-strengths">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">Mode Moderator</span>
                    <button
                      type="button"
                      onClick={handleKeluarModerator}
                      title="Keluar dari mode moderator"
                      className="text-muted-foreground hover:text-foreground ml-1 transition-colors"
                    >
                      <LogOut className="size-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalPinBuka(true)}
                    title="Akses Moderator (Jawab / Sembunyikan / Hapus)"
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
                  >
                    <Lock className="size-3" />
                    <span>Moderator</span>
                  </button>
                )}

                {/* Filter Tabs */}
                <div className="flex items-center gap-1">
                  {['Semua', ...kategoriOpsi].map((kat) => (
                    <button
                      key={kat}
                      type="button"
                      onClick={() => setFilterKategori(kat)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs transition-colors',
                        filterKategori === kat
                          ? 'bg-muted font-medium text-foreground'
                          : 'text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {kat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Komentar */}
            {loading ? (
              <div className="flex items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="mr-2 size-5 animate-spin" />
                <span className="text-sm">Memuat tanggapan...</span>
              </div>
            ) : listTertampil.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <MessageSquare className="size-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm font-medium text-foreground">
                  Belum ada tanggapan untuk kategori ini
                </p>
                <p className="text-muted-foreground mt-1 max-w-xs text-xs">
                  Silakan tuliskan tanggapan pertama melalui formulir di samping.
                </p>
              </div>
            ) : (
              <ol className="divide-y">
                {listTertampil.map((item, index) => {
                  const badge = lencanaKategori(item.kategori)
                  const BadgeIcon = badge.ikon
                  const nomor = String(index + 1).padStart(2, '0')

                  return (
                    <li
                      key={item.id || index}
                      className={cn(
                        'group py-6 transition-colors duration-200',
                        item.disembunyikan &&
                          'border-accent-brass/30 bg-accent-brass/[0.02] -mx-4 rounded-xl border-dashed px-4 opacity-75',
                        item.terjawab && !item.disembunyikan && 'opacity-90',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="label-mono text-muted-foreground/80 tabular-nums">
                            {nomor}
                          </span>
                          <span className="text-base font-semibold tracking-tight text-foreground">
                            {item.nama}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.6875rem] font-medium',
                              badge.kelas,
                            )}
                          >
                            <BadgeIcon className="size-3" />
                            {item.kategori}
                          </span>

                          {/* Status Terjawab */}
                          {item.terjawab && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-swot-strengths/10 px-2 py-0.5 text-[0.6875rem] font-medium text-swot-strengths">
                              <Check className="size-3" />
                              Sudah Ditanggapi
                            </span>
                          )}

                          {/* Status Disembunyikan (Hanya terlihat oleh Moderator) */}
                          {item.disembunyikan && isModerator && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-accent-brass/15 px-2 py-0.5 text-[0.6875rem] font-medium text-accent-brass">
                              <EyeOff className="size-3" />
                              Disembunyikan dari Audiens
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground flex shrink-0 items-center gap-1 font-mono text-[0.6875rem]">
                            <Clock className="size-3" />
                            {formatWaktu(item.created_at)}
                          </span>

                          {/* Aksi Khusus Moderator */}
                          {isModerator && (
                            <div className="flex items-center gap-1 pl-2">
                              {/* Tombol Jawab / Balas */}
                              <button
                                type="button"
                                onClick={() => handleBukaJawab(item)}
                                title={item.jawaban ? 'Edit balasan presenter' : 'Tulis balasan presenter'}
                                className={cn(
                                  'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
                                  item.jawaban
                                    ? 'bg-accent-ikn/15 text-accent-ikn'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                              >
                                <Reply className="size-3.5" />
                                <span className="hidden sm:inline">
                                  {item.jawaban ? 'Edit' : 'Jawab'}
                                </span>
                              </button>

                              {/* Tombol Sembunyikan / Tampilkan */}
                              <button
                                type="button"
                                onClick={() => handleToggleSembunyikan(item)}
                                title={
                                  item.disembunyikan
                                    ? 'Tampilkan kembali komentar ke audiens'
                                    : 'Sembunyikan komentar dari audiens'
                                }
                                className={cn(
                                  'rounded-md p-1.5 transition-colors',
                                  item.disembunyikan
                                    ? 'bg-accent-brass/20 text-accent-brass'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                                )}
                              >
                                {item.disembunyikan ? (
                                  <Eye className="size-3.5" />
                                ) : (
                                  <EyeOff className="size-3.5" />
                                )}
                              </button>

                              {/* Tombol Hapus */}
                              <button
                                type="button"
                                onClick={() => setKomentarMauDihapus(item)}
                                title="Hapus komentar ini permanen"
                                className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-md p-1.5 transition-colors"
                              >
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Isi Pesan Audiens */}
                      <p className="text-foreground/90 mt-3 pl-7 text-sm leading-relaxed text-pretty sm:text-base">
                        {item.pesan}
                      </p>

                      {/* Kotak Balasan Resmi Tim Presenter */}
                      {item.jawaban && (
                        <div className="border-accent-ikn/25 bg-accent-ikn/[0.04] mt-3.5 ml-7 rounded-xl border p-3.5 sm:p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="bg-accent-ikn flex size-4.5 items-center justify-center rounded-full text-white">
                                <Check className="size-2.5" />
                              </span>
                              <span className="label-mono text-accent-ikn font-semibold text-[0.6875rem]">
                                Tanggapan Tim Presenter
                              </span>
                            </div>

                            {isModerator && (
                              <button
                                type="button"
                                onClick={() => handleBukaJawab(item)}
                                className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <p className="text-foreground/90 mt-2 text-sm leading-relaxed whitespace-pre-wrap text-pretty">
                            {item.jawaban}
                          </p>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ol>
            )}
          </div>
        </div>
      </div>

      {/* 1. Modal Masukkan PIN Moderator */}
      <Dialog open={modalPinBuka} onOpenChange={setModalPinBuka}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <div className="bg-primary/10 text-primary mx-auto flex size-12 items-center justify-center rounded-full">
              <Shield className="size-6" />
            </div>
            <DialogTitle className="mt-3 text-center text-lg font-semibold">
              Akses Moderator
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-xs">
              Masukkan PIN untuk mengaktifkan tombol moderasi, jawab pertanyaan, sembunyikan, & hapus komentar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleVerifikasiPin} className="mt-4 space-y-4">
            <div>
              <div className="relative">
                <KeyRound className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoFocus
                  maxLength={10}
                  placeholder="Masukkan PIN"
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  className="bg-background text-foreground focus:border-accent-ikn focus:ring-accent-ikn w-full rounded-lg border py-2 pr-3 pl-9 text-center font-mono text-sm tracking-widest focus:ring-1 focus:outline-none"
                />
              </div>
              {errorPin && (
                <p className="text-swot-weaknesses mt-2 text-center text-xs">
                  {errorPin}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full rounded-full">
              Buka Akses Moderator
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal Konfirmasi Hapus Komentar */}
      <Dialog
        open={Boolean(komentarMauDihapus)}
        onOpenChange={(open) => !open && setKomentarMauDihapus(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="bg-destructive/10 text-destructive mx-auto flex size-12 items-center justify-center rounded-full">
              <AlertTriangle className="size-6" />
            </div>
            <DialogTitle className="mt-3 text-center text-lg font-semibold">
              Hapus Tanggapan?
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-sm">
              Tanggapan dari <strong className="text-foreground">{komentarMauDihapus?.nama}</strong> akan dihapus secara permanen dari layar dan database.
            </DialogDescription>
          </DialogHeader>

          {komentarMauDihapus && (
            <div className="border-border/60 bg-muted/50 text-foreground/85 my-2 line-clamp-3 rounded-xl border p-3.5 text-xs italic">
              "{komentarMauDihapus.pesan}"
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={hapusLoading}
              className="rounded-full"
              onClick={() => setKomentarMauDihapus(null)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={hapusLoading}
              className="rounded-full"
              onClick={handleEksekusiHapus}
            >
              {hapusLoading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                <>
                  <Trash2 className="mr-1.5 size-3.5" />
                  Ya, Hapus
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 3. Modal Tulis / Edit Jawaban Presenter */}
      <Dialog
        open={Boolean(komentarDijawab)}
        onOpenChange={(open) => !open && setKomentarDijawab(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="bg-accent-ikn/10 text-accent-ikn mx-auto flex size-12 items-center justify-center rounded-full">
              <MessageSquarePlus className="size-6" />
            </div>
            <DialogTitle className="mt-3 text-center text-lg font-semibold">
              {komentarDijawab?.jawaban ? 'Edit Tanggapan Presenter' : 'Tanggapi Pertanyaan'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-center text-xs">
              Tuliskan jawaban atau penjelasan resmi dari tim presenter untuk pertanyaan dari{' '}
              <strong className="text-foreground">{komentarDijawab?.nama}</strong>.
            </DialogDescription>
          </DialogHeader>

          {komentarDijawab && (
            <div className="border-border/60 bg-muted/40 my-1 rounded-xl border p-3.5 text-xs">
              <span className="label-mono text-muted-foreground block text-[0.65rem]">
                Pertanyaan:
              </span>
              <p className="text-foreground/90 mt-1 font-medium italic">
                "{komentarDijawab.pesan}"
              </p>
            </div>
          )}

          <form onSubmit={handleSimpanJawaban} className="mt-3 space-y-4">
            <div>
              <label className="label-mono text-muted-foreground block">
                Jawaban Tim Presenter
              </label>
              <textarea
                required
                rows={4}
                autoFocus
                placeholder="Tuliskan argumen atau penjelasan jawaban tim Anda di sini..."
                value={teksJawaban}
                onChange={(e) => setTeksJawaban(e.target.value)}
                className="bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-accent-ikn focus:ring-accent-ikn mt-2 w-full resize-none rounded-lg border p-3.5 text-sm focus:ring-1 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {komentarDijawab?.jawaban ? (
                <button
                  type="button"
                  onClick={() => {
                    setTeksJawaban('')
                  }}
                  className="text-muted-foreground hover:text-destructive text-xs transition-colors"
                >
                  Kosongkan Jawaban
                </button>
              ) : <span />}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  onClick={() => setKomentarDijawab(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={simpanJawabLoading || !teksJawaban.trim()}
                  className="rounded-full"
                >
                  {simpanJawabLoading ? (
                    <>
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="mr-1.5 size-3.5" />
                      Simpan Jawaban
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Section>
  )
}
