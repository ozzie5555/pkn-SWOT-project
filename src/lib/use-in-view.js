import { useEffect, useRef, useState } from 'react'

/**
 * Hook kecil: melaporkan apakah sebuah elemen sudah masuk viewport.
 *
 * Dipakai bersama oleh efek-efek gerak (TextReveal, dst) agar
 * semuanya memakai satu sumber logika. Sengaja berbasis IntersectionObserver —
 * tanpa library animasi — supaya bundel tetap ringan seperti sisa projek.
 *
 * Aturan aman:
 * - Bila `prefers-reduced-motion: reduce` aktif, langsung dianggap "terlihat"
 *   sehingga konten tampil tanpa animasi.
 * - Bila IntersectionObserver tidak tersedia, kondisi yang sama berlaku.
 */
function kunciAwal() {
  if (typeof window === 'undefined') return true
  if (typeof IntersectionObserver === 'undefined') return true
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useInView(options) {
  const { threshold = 0.15, rootMargin = '0px 0px -12% 0px', once = true } =
    options ?? {}

  const ref = useRef(null)
  const [inView, setInView] = useState(kunciAwal)

  useEffect(() => {
    // State awal sudah benar bila animasi tidak semestinya berjalan
    // (reduced-motion / tanpa IntersectionObserver) — tak perlu observer.
    if (inView) return undefined

    const el = ref.current
    if (!el) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) observer.disconnect()
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold, rootMargin },
    )

    observer.observe(el)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, rootMargin, once])

  return [ref, inView]
}

export default useInView
