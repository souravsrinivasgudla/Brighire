import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '../../utils/cn'

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'glitch' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const variants: Record<ButtonVariant, string> = {
  default:
    'border-2 border-cyber-accent bg-transparent text-cyber-accent cyber-chamfer-sm hover:bg-cyber-accent hover:text-cyber-bg hover:shadow-[var(--box-shadow-neon)]',
  secondary:
    'border-2 border-cyber-accent-secondary bg-transparent text-cyber-accent-secondary cyber-chamfer-sm hover:bg-cyber-accent-secondary hover:text-cyber-bg hover:shadow-[var(--box-shadow-neon-secondary)]',
  outline:
    'border border-cyber-border bg-transparent text-cyber-fg cyber-chamfer-sm hover:border-cyber-accent hover:text-cyber-accent hover:shadow-[var(--box-shadow-neon-sm)]',
  ghost:
    'border-0 bg-transparent text-cyber-muted-fg hover:bg-cyber-accent/10 hover:text-cyber-accent',
  glitch:
    'border-0 bg-cyber-accent text-cyber-bg font-bold cyber-chamfer-sm cyber-glitch-static hover:brightness-110 hover:shadow-[var(--box-shadow-neon-lg)]',
  danger:
    'border-2 border-cyber-destructive bg-transparent text-cyber-destructive cyber-chamfer-sm hover:bg-cyber-destructive hover:text-white',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'min-h-10 px-4 py-2 text-xs',
  md: 'min-h-11 px-6 py-3 text-sm',
  lg: 'min-h-12 px-8 py-3.5 text-base',
}

export function Button({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  loading = false,
  leftIcon,
  rightIcon,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wider transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-ring focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-bg',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current"
          aria-hidden="true"
        />
      ) : (
        leftIcon
      )}
      {children}
      {!loading && rightIcon}
    </button>
  )
}
