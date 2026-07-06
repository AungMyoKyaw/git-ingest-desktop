import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

import { cn } from '../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'toolbar'
type ButtonSize = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'native-button-shine bg-accent text-white shadow-[0_10px_26px_rgba(10,132,255,0.22)] hover:bg-accent-strong active:translate-y-px',
  secondary:
    'native-button-shine bg-white/80 text-ink ring-1 ring-line-strong hover:bg-black/[0.055] active:translate-y-px',
  ghost: 'bg-transparent text-muted hover:bg-black/[0.04] hover:text-ink active:translate-y-px',
  toolbar:
    'native-button-shine bg-black/[0.04] text-ink/86 ring-1 ring-line hover:bg-black/[0.055] active:translate-y-px',
  danger: 'bg-danger-soft text-danger-strong ring-1 ring-danger/20 hover:bg-danger-soft active:translate-y-px'
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs',
  md: 'h-9 px-3.5 text-[13px]',
  lg: 'h-10 px-4 text-[13px]'
}

export function Button({
  className,
  variant = 'secondary',
  size = 'md',
  leftIcon,
  rightIcon,
  children,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={cn(
        'inline-flex select-none items-center justify-center gap-2 rounded-[10px] font-medium outline-none transition disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45 focus-visible:ring-2 focus-visible:ring-accent/70',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      type="button"
      {...props}
    >
      {leftIcon}
      {children ? <span>{children}</span> : null}
      {rightIcon}
    </button>
  )
}
