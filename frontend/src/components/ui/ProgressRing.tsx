import { cn } from '../../utils/cn'

type ProgressRingProps = {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  label?: string
  sublabel?: string
  className?: string
}

export function ProgressRing({
  value,
  max = 100,
  size = 120,
  strokeWidth = 6,
  label,
  sublabel,
  className = '',
}: ProgressRingProps) {
  const normalized = Math.min(Math.max(value, 0), max)
  const percent = (normalized / max) * 100
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div
      className={cn('inline-flex flex-col items-center', className)}
      role="progressbar"
      aria-valuenow={normalized}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#2a2a3a"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#00ff88"
            strokeWidth={strokeWidth}
            strokeLinecap="square"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-700"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.6))' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-display text-2xl font-bold text-cyber-accent">
            {Math.round(percent)}%
          </span>
          {sublabel ? (
            <span className="mt-1 font-label text-[9px] uppercase tracking-widest text-cyber-muted-fg">
              {sublabel}
            </span>
          ) : null}
        </div>
      </div>
      {label ? (
        <p className="mt-3 text-center font-mono text-sm text-cyber-fg">{label}</p>
      ) : null}
    </div>
  )
}
