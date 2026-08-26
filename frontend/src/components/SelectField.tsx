import type { ReactNode, SelectHTMLAttributes } from 'react'

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string
  error?: string
  children: ReactNode
}

export function SelectField({
  label,
  error,
  id,
  className = '',
  children,
  ...props
}: SelectFieldProps) {
  const inputId = id ?? props.name

  return (
    <label className="block space-y-2 text-left" htmlFor={inputId}>
      <span className="cyber-label text-cyber-muted-fg">{label}</span>
      <select
        id={inputId}
        className={`w-full min-h-11 border border-cyber-border bg-cyber-input px-4 py-3 font-mono text-sm text-cyber-accent outline-none transition cyber-chamfer-sm focus:border-cyber-accent focus:shadow-[var(--box-shadow-neon-sm)] ${error ? 'border-cyber-destructive' : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <span className="text-sm text-cyber-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
}
