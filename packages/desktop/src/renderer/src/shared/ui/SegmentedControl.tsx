import type { ReactElement } from 'react'

import { cn } from '../lib/cn'

export type SegmentedControlProps<T extends string> = {
  ariaLabel: string
  items: ReadonlyArray<{ value: T; label: string }>
  selected: T
  onChange: (value: T) => void
}

export function SegmentedControl<T extends string>({
  ariaLabel,
  items,
  selected,
  onChange
}: SegmentedControlProps<T>): ReactElement {
  return (
    <div
      aria-label={ariaLabel}
      className="inline-flex h-8 items-center rounded-[9px] border border-line bg-black/[0.035] p-0.5"
      role="group"
    >
      {items.map((item) => (
        <button
          key={item.value}
          aria-pressed={item.value === selected}
          className={cn(
            'h-6 rounded-[7px] px-3 text-[12px] font-medium transition',
            item.value === selected
              ? 'bg-white text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]'
              : 'text-muted hover:text-ink'
          )}
          onClick={() => onChange(item.value)}
          type="button"
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
