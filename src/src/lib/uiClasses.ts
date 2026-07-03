import { cn } from '@/lib/format'

/** Low-level light/dark tokens — composed into semantic groups below. */
const tone = {
  text: {
    primary: 'text-slate-900 dark:text-slate-100',
    secondary: 'text-slate-600 dark:text-slate-300',
    muted: 'text-slate-500 dark:text-slate-400',
    label: 'text-slate-700 dark:text-slate-200',
    accent: 'text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300',
    accentOnPrimary: 'text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400',
    error: 'text-rose-600 dark:text-rose-400',
    errorBanner: 'text-rose-700 dark:text-rose-300',
  },
  border: {
    default: 'border-slate-200 dark:border-slate-800',
    subtle: 'border-slate-100 dark:border-slate-800',
    dashed: 'border-slate-200 dark:border-slate-700',
    field: 'border-slate-200 dark:border-slate-700',
    fieldError: 'border-rose-300 dark:border-rose-700',
  },
  surface: {
    page: 'bg-slate-50 dark:bg-slate-950',
    elevated: 'bg-white dark:bg-slate-900',
    muted: 'bg-slate-50 dark:bg-slate-900/50',
    hover: 'hover:bg-slate-50 dark:hover:bg-slate-800/50',
    hoverSubtle: 'hover:bg-slate-50 dark:hover:bg-slate-700',
    disabled: 'disabled:bg-slate-50 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500',
    skeleton: 'bg-slate-200/80 dark:bg-slate-700/80',
    errorBanner: 'bg-rose-50 dark:bg-rose-950/50',
  },
  divide: {
    subtle: 'divide-slate-100 dark:divide-slate-800',
  },
  ring: {
    focus: 'focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:border-indigo-400 dark:focus:ring-indigo-900/40',
    focusError:
      'focus:border-rose-500 focus:ring-rose-100 dark:focus:border-rose-400 dark:focus:ring-rose-900/40',
  },
} as const

const layout = {
  rowBetween: 'flex items-start justify-between gap-4',
  rowWrapBetween: 'flex flex-wrap items-start justify-between gap-4',
  inlineCenter: 'inline-flex items-center gap-2',
  inlineCenterTight: 'inline-flex items-center gap-1',
} as const

function title(size: string, extra?: string) {
  return cn(size, 'font-semibold', tone.text.primary, extra)
}

function borderedSurface(border: string, extra?: string) {
  return cn('border', border, tone.surface.elevated, extra)
}

function badgeVariant(bg: string, text: string, ring: string) {
  return cn(bg, text, ring)
}

function linkAccent(layoutClass: string) {
  return cn(layoutClass, 'text-sm font-medium', tone.text.accent)
}

/** Shared Tailwind class groups for consistent light/dark styling. */
export const ui = {
  page: {
    background: tone.surface.page,
  },
  surface: {
    card: cn('rounded-xl shadow-sm', borderedSurface(tone.border.default)),
    cardHeader: cn(layout.rowBetween, 'border-b px-5 py-4', tone.border.subtle),
    header: cn(layout.rowWrapBetween, 'border-b px-8 py-6', borderedSurface(tone.border.default)),
    empty: cn(
      'flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-12 text-center',
      tone.border.dashed,
      tone.surface.muted,
    ),
    borderedList: cn('rounded-lg border', tone.divide.subtle, tone.border.subtle),
    iconAccent:
      'rounded-xl bg-indigo-50 p-3 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400',
  },
  text: {
    pageTitle: title('text-2xl tracking-tight'),
    sectionTitle: title('text-base'),
    subsectionTitle: title('text-sm'),
    cardTitle: title('text-xl'),
    itemTitle: cn('font-medium', tone.text.primary),
    stat: title('text-3xl'),
    primary: tone.text.primary,
    secondary: tone.text.secondary,
    muted: tone.text.muted,
    mutedSm: cn('text-sm', tone.text.muted),
    label: cn('font-medium', tone.text.label),
    detailLabel: cn(
      'text-xs font-medium uppercase tracking-wide',
      tone.text.muted,
    ),
    detailValue: cn('mt-1 text-sm', tone.text.primary),
    error: cn('text-xs', tone.text.error),
    errorBanner: cn('rounded-lg px-3 py-2 text-sm', tone.surface.errorBanner, tone.text.errorBanner),
    checkboxLabel: cn(layout.inlineCenter, 'text-sm', tone.text.label),
  },
  link: {
    item: cn('font-medium', tone.text.primary, tone.text.accentOnPrimary),
    back: cn(layout.inlineCenter, 'text-sm font-medium', tone.text.accentOnPrimary),
    accent: linkAccent(''),
    accentInline: linkAccent(layout.inlineCenterTight),
  },
  border: {
    default: tone.border.default,
    subtle: tone.border.subtle,
  },
  divide: {
    default: tone.divide.subtle,
  },
  table: {
    head: cn(
      'border-b text-xs uppercase tracking-wide',
      tone.border.subtle,
      tone.text.muted,
    ),
    body: tone.divide.subtle,
    row: tone.surface.hover,
    footer: cn('border-t pt-4', tone.border.subtle),
  },
  field: {
    control: cn(
      'rounded-lg border px-3 py-2 outline-none transition',
      tone.border.field,
      tone.surface.elevated,
      tone.text.primary,
      tone.ring.focus,
      tone.surface.disabled,
    ),
    controlError: cn(tone.border.fieldError, tone.ring.focusError),
    checkbox: cn(
      'rounded text-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-400',
      'border-slate-300 dark:border-slate-600 dark:bg-slate-900',
    ),
  },
  button: {
    base: cn(
      layout.inlineCenter,
      'justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed',
    ),
    primary:
      'bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-indigo-300 dark:disabled:bg-indigo-800',
    secondary: cn(
      borderedSurface(tone.border.field),
      'text-slate-700 disabled:bg-slate-100 dark:text-slate-200 dark:disabled:bg-slate-900',
      tone.surface.hoverSubtle,
    ),
    ghost: cn(
      tone.text.secondary,
      'hover:bg-slate-100 disabled:text-slate-400 dark:hover:bg-slate-800 dark:disabled:text-slate-600',
    ),
    danger:
      'bg-rose-600 text-white hover:bg-rose-500 disabled:bg-rose-300 dark:disabled:bg-rose-900',
    toggle: cn(
      layout.inlineCenter,
      'rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
      tone.border.field,
      tone.surface.elevated,
      tone.text.label,
      tone.surface.hoverSubtle,
    ),
    newClient: cn(
      layout.inlineCenter,
      'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500',
    ),
  },
  tabs: {
    bar: cn('flex gap-1 border-b', tone.border.default),
    active: 'border-indigo-600 text-indigo-700 dark:border-indigo-400 dark:text-indigo-300',
    inactive:
      'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200',
    tab: 'border-b-2 px-4 py-3 text-sm font-medium transition-colors',
  },
  badge: {
    default: badgeVariant(
      'bg-indigo-50 dark:bg-indigo-950',
      'text-indigo-700 dark:text-indigo-300',
      'ring-indigo-100 dark:ring-indigo-900',
    ),
    success: badgeVariant(
      'bg-emerald-50 dark:bg-emerald-950',
      'text-emerald-700 dark:text-emerald-300',
      'ring-emerald-100 dark:ring-emerald-900',
    ),
    warning: badgeVariant(
      'bg-amber-50 dark:bg-amber-950',
      'text-amber-700 dark:text-amber-300',
      'ring-amber-100 dark:ring-amber-900',
    ),
    muted: badgeVariant(
      'bg-slate-100 dark:bg-slate-800',
      'text-slate-600 dark:text-slate-300',
      'ring-slate-200 dark:ring-slate-700',
    ),
    base: 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
  },
  feedback: {
    skeleton: cn('animate-pulse rounded-md', tone.surface.skeleton),
    spinner: cn('flex items-center justify-center gap-2 py-8', tone.text.muted),
    spinnerIcon: 'h-5 w-5 animate-spin text-indigo-600 dark:text-indigo-400',
    searchIcon: cn(
      'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
      'text-slate-400 dark:text-slate-500',
    ),
  },
} as const
