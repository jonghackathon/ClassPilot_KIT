import Link from 'next/link'
import { ArrowRight, ChevronLeft, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

type Tone = 'indigo' | 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'slate'

const toneStyles: Record<
  Tone,
  {
    chip: string
    soft: string
    icon: string
    progress: string
  }
> = {
  indigo: {
    chip: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100',
    soft: 'bg-indigo-50 text-indigo-700',
    icon: 'bg-gradient-to-br from-indigo-600 to-sky-500 text-white',
    progress: 'bg-gradient-to-r from-indigo-600 to-sky-500',
  },
  sky: {
    chip: 'bg-sky-50 text-sky-700 ring-1 ring-sky-100',
    soft: 'bg-sky-50 text-sky-700',
    icon: 'bg-gradient-to-br from-sky-500 to-cyan-500 text-white',
    progress: 'bg-gradient-to-r from-sky-500 to-cyan-500',
  },
  violet: {
    chip: 'bg-violet-50 text-violet-700 ring-1 ring-violet-100',
    soft: 'bg-violet-50 text-violet-700',
    icon: 'bg-gradient-to-br from-violet-600 to-indigo-500 text-white',
    progress: 'bg-gradient-to-r from-violet-600 to-indigo-500',
  },
  emerald: {
    chip: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100',
    soft: 'bg-emerald-50 text-emerald-700',
    icon: 'bg-gradient-to-br from-emerald-500 to-green-500 text-white',
    progress: 'bg-gradient-to-r from-emerald-500 to-green-500',
  },
  amber: {
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-100',
    soft: 'bg-amber-50 text-amber-700',
    icon: 'bg-gradient-to-br from-amber-500 to-orange-500 text-white',
    progress: 'bg-gradient-to-r from-amber-500 to-orange-500',
  },
  rose: {
    chip: 'bg-rose-50 text-rose-700 ring-1 ring-rose-100',
    soft: 'bg-rose-50 text-rose-700',
    icon: 'bg-gradient-to-br from-rose-500 to-red-500 text-white',
    progress: 'bg-gradient-to-r from-rose-500 to-red-500',
  },
  slate: {
    chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200',
    soft: 'bg-slate-100 text-slate-700',
    icon: 'bg-gradient-to-br from-slate-900 to-slate-700 text-white',
    progress: 'bg-gradient-to-r from-slate-700 to-slate-500',
  },
}

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function SurfaceCard({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cx('surface-card rounded-[32px] border border-white/70 p-5 sm:p-6', className)}>
      {children}
    </section>
  )
}

export function PageHero({
  eyebrow,
  title,
  description,
  action,
  backHref,
  backLabel,
}: {
  eyebrow: string
  title: string
  description: string
  action?: ReactNode
  backHref?: string
  backLabel?: string
}) {
  return (
    <div className="space-y-4">
      {backHref && backLabel ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200 transition hover:text-slate-900"
        >
          <ChevronLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-sm font-medium text-indigo-600">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </div>
  )
}

export function ActionButton({
  href,
  label,
  tone = 'indigo',
}: {
  href: string
  label: string
  tone?: Tone
}) {
  return (
    <Link
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition hover:translate-y-[-1px]',
        toneStyles[tone].icon,
      )}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  )
}

export function StatusBadge({
  label,
  tone = 'slate',
}: {
  label: string
  tone?: Tone
}) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold', toneStyles[tone].chip)}>
      {label}
    </span>
  )
}

export function ProgressBar({
  value,
  tone = 'indigo',
  className,
}: {
  value: number
  tone?: Tone
  className?: string
}) {
  return (
    <div className={cx('h-3 overflow-hidden rounded-full bg-slate-100', className)}>
      <div className={cx('h-full rounded-full', toneStyles[tone].progress)} style={{ width: `${value}%` }} />
    </div>
  )
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'indigo',
  href,
}: {
  label: string
  value: string
  detail: string
  icon: LucideIcon
  tone?: Tone
  href?: string
}) {
  const content = (
    <article className="surface-card rounded-[28px] border border-white/70 p-5 transition hover:translate-y-[-1px]">
      <div className={cx('inline-flex rounded-2xl p-3', toneStyles[tone].icon)}>
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-5 text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-500">
        <span>{detail}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
      </div>
    </article>
  )

  return href ? <Link href={href}>{content}</Link> : content
}

export function SectionHeading({
  title,
  subtitle,
  action,
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}
