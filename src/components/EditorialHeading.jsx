import Reveal from '@/components/Reveal'
import TextReveal from '@/components/TextReveal'
import { efek } from '@/lib/efek'
import { cn } from '@/lib/utils'

/**
 * Judul bagian bergaya modern-formal.
 *
 * Rata kiri dengan nomor bab (mono), pil "eyebrow", judul display besar, dan
 * deskripsi pendukung. Dipakai konsisten oleh semua section.
 */
export function EditorialHeading({
  bab,
  eyebrow,
  judul,
  deskripsi,
  className,
  align = 'left',
}) {
  const center = align === 'center'

  return (
    <Reveal
      className={cn(
        'flex flex-col',
        center ? 'items-center text-center' : 'items-start',
        className,
      )}
    >
      <div className={cn('flex items-center gap-3', center && 'justify-center')}>
        {bab ? (
          <span className="border-accent-ikn/25 bg-accent-ikn/[0.07] text-accent-ikn flex size-8 items-center justify-center rounded-lg border font-mono text-xs font-semibold tabular-nums">
            {bab}
          </span>
        ) : null}
        {eyebrow ? (
          <span className="label-mono text-muted-foreground">{eyebrow}</span>
        ) : null}
      </div>

      <h2
        className={cn(
          'mt-5 max-w-3xl text-3xl leading-[1.08] tracking-tight text-balance sm:text-4xl lg:text-[2.9rem]',
          center && 'mx-auto',
        )}
      >
        {efek.reveal && typeof judul === 'string' ? (
          <TextReveal teks={judul} />
        ) : (
          judul
        )}
      </h2>

      {deskripsi ? (
        <p
          className={cn(
            'text-muted-foreground mt-5 max-w-xl text-base text-pretty sm:text-lg',
            center && 'mx-auto',
          )}
        >
          {efek.reveal && typeof deskripsi === 'string' ? (
            <TextReveal teks={deskripsi} delay={120} stagger={38} />
          ) : (
            deskripsi
          )}
        </p>
      ) : null}
    </Reveal>
  )
}

export default EditorialHeading
