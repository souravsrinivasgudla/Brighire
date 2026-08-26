import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'

import { cn } from '../../utils/cn'

export type DropdownOption = {
  value: string
  label: string
  description?: string
  icon?: ReactNode
}

type DropdownProps = {
  label: string
  options: DropdownOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Dropdown({
  label,
  options,
  value,
  onChange,
  placeholder = 'SELECT OPTION',
  className = '',
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className={cn('relative space-y-2', className)}>
      <span id={`${label}-label`} className="cyber-label">
        {label}
      </span>
      <button
        type="button"
        id={`${label}-trigger`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${label}-label`}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full min-h-11 items-center justify-between gap-2 border border-cyber-border bg-cyber-input px-4 py-3 text-left font-mono text-sm text-cyber-fg transition cyber-chamfer-sm cyber-focus',
          'hover:border-cyber-accent',
        )}
      >
        <span className={cn(!selected && 'text-cyber-muted-fg')}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 shrink-0 text-cyber-muted-fg transition', open && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-labelledby={`${label}-label`}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto border border-cyber-border bg-cyber-card py-1 shadow-[var(--box-shadow-neon-sm)] cyber-chamfer-sm cyber-scrollbar"
        >
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left font-mono text-sm transition',
                    isSelected
                      ? 'bg-cyber-accent/10 text-cyber-accent'
                      : 'text-cyber-fg hover:bg-cyber-muted',
                  )}
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                >
                  {option.icon}
                  <span className="flex-1">
                    <span className="block font-medium uppercase tracking-wide">{option.label}</span>
                    {option.description ? (
                      <span className="block text-xs text-cyber-muted-fg">{option.description}</span>
                    ) : null}
                  </span>
                  {isSelected ? (
                    <Check className="h-4 w-4 text-cyber-accent" strokeWidth={1.5} />
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
