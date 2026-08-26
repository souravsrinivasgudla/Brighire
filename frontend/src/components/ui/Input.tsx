import { forwardRef, useState, type InputHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'

import { cn } from '../../utils/cn'

const inputClass =
  'w-full border border-cyber-border bg-cyber-input py-3 pl-8 pr-4 font-mono text-sm text-cyber-accent cyber-chamfer-sm outline-none transition-all duration-200 placeholder:text-cyber-muted-fg focus:border-cyber-accent focus:shadow-[var(--box-shadow-neon-sm)]'

const labelClass = 'cyber-label text-cyber-muted-fg'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
  prefix?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, prefix = '>', id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <label className="block space-y-2 text-left" htmlFor={inputId}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-cyber-accent"
          aria-hidden="true"
        >
          {prefix}
        </span>
        <input
          ref={ref}
          id={inputId}
          className={cn(inputClass, error && 'border-cyber-destructive', className)}
          aria-invalid={error ? true : undefined}
          {...props}
        />
      </div>
      {hint && !error ? <span className="text-xs text-cyber-muted-fg">{hint}</span> : null}
      {error ? (
        <span className="text-sm text-cyber-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, id, className = '', ...props },
  ref,
) {
  const inputId = id ?? props.name

  return (
    <label className="block space-y-2 text-left" htmlFor={inputId}>
      <span className={labelClass}>{label}</span>
      <textarea
        ref={ref}
        id={inputId}
        className={cn(
          'min-h-28 pl-4',
          inputClass.replace('pl-8', 'pl-4'),
          error && 'border-cyber-destructive',
          className,
        )}
        {...props}
      />
      {error ? (
        <span className="text-sm text-cyber-destructive" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  )
})

type PasswordInputProps = Omit<InputProps, 'type' | 'prefix'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, error, id, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? props.name

    return (
      <label className="block space-y-2 text-left" htmlFor={inputId}>
        <span className={labelClass}>{label}</span>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-cyber-accent"
            aria-hidden="true"
          >
            $
          </span>
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={cn(inputClass, 'pr-12', error && 'border-cyber-destructive', className)}
            {...props}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center text-cyber-muted-fg transition hover:text-cyber-accent cyber-focus"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? (
              <EyeOff className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
            ) : (
              <Eye className="h-4 w-4 cyber-icon" strokeWidth={1.5} />
            )}
          </button>
        </div>
        {error ? (
          <span className="text-sm text-cyber-destructive" role="alert">
            {error}
          </span>
        ) : null}
      </label>
    )
  },
)
