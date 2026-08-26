import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'

const fieldClass =
  'w-full border border-cyber-border bg-cyber-input py-3 pl-8 pr-4 font-mono text-sm text-cyber-accent cyber-chamfer-sm outline-none transition-all duration-200 placeholder:text-cyber-muted-fg focus:border-cyber-accent focus:shadow-[var(--box-shadow-neon-sm)]'

const labelClass = 'cyber-label text-cyber-muted-fg'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, id, className = '', ...props }, ref) {
    const inputId = id ?? props.name

    return (
      <label className="block space-y-2 text-left" htmlFor={inputId}>
        <span className={labelClass}>{label}</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-cyber-accent" aria-hidden="true">&gt;</span>
          <input
            ref={ref}
            id={inputId}
            className={`${fieldClass} ${error ? 'border-cyber-destructive' : ''} ${className}`}
            {...props}
          />
        </div>
        {error ? <span className="text-sm text-cyber-destructive" role="alert">{error}</span> : null}
      </label>
    )
  },
)

type PasswordFieldProps = Omit<TextFieldProps, 'type'>

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, error, id, className = '', ...props }, ref) {
    const [visible, setVisible] = useState(false)
    const inputId = id ?? props.name

    return (
      <label className="block space-y-2 text-left" htmlFor={inputId}>
        <span className={labelClass}>{label}</span>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-cyber-accent" aria-hidden="true">$</span>
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            className={`${fieldClass} pr-12 ${error ? 'border-cyber-destructive' : ''} ${className}`}
            {...props}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center text-cyber-muted-fg hover:text-cyber-accent cyber-focus"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4 cyber-icon" strokeWidth={1.5} /> : <Eye className="h-4 w-4 cyber-icon" strokeWidth={1.5} />}
          </button>
        </div>
        {error ? <span className="text-sm text-cyber-destructive" role="alert">{error}</span> : null}
      </label>
    )
  },
)

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  error?: string
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  function TextAreaField({ label, error, id, className = '', ...props }, ref) {
    const inputId = id ?? props.name

    return (
      <label className="block space-y-2 text-left" htmlFor={inputId}>
        <span className={labelClass}>{label}</span>
        <textarea
          ref={ref}
          id={inputId}
          className={`min-h-28 pl-4 ${fieldClass.replace('pl-8', 'pl-4')} ${error ? 'border-cyber-destructive' : ''} ${className}`}
          {...props}
        />
        {error ? <span className="text-sm text-cyber-destructive" role="alert">{error}</span> : null}
      </label>
    )
  },
)
