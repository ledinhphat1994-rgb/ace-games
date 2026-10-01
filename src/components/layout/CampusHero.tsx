import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
interface CampusHeroProps { title: string; eyebrow?: string; description?: string; children?: ReactNode; className?: string; art?: string }
export function CampusHero({ title, eyebrow, description, children, className, art = '/assets/brand/campus-hero.webp' }: CampusHeroProps) {
  return <section className={cn('campus-hero relative isolate overflow-hidden rounded-2xl bg-surface p-6 sm:p-8', className)}>
    <img src={art} alt="" className="campus-hero-art pointer-events-none absolute inset-0 -z-20 size-full object-cover object-right img-crisp" />
    <div className="campus-hero-shade pointer-events-none absolute inset-0 -z-10" />
    <div className="relative max-w-lg">{eyebrow && <p className="mb-3 text-xs font-semibold tracking-widest text-brand uppercase">{eyebrow}</p>}<h1 className="text-[1.875rem] leading-[1.15] font-bold tracking-tight text-text-primary sm:text-[2.5rem]">{title}</h1>{description && <p className="mt-3 max-w-sm text-sm leading-relaxed text-text-secondary">{description}</p>}{children && <div className="mt-5 flex flex-wrap gap-2">{children}</div>}</div>
  </section>
}
