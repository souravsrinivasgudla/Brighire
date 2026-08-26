import { Link } from 'react-router-dom'

type BrandLogoProps = {
  to?: string
  className?: string
}

export function BrandLogo({ to = '/', className = '' }: BrandLogoProps) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center overflow-visible cyber-focus rounded-sm px-1 ${className}`}
    >
      <span className="font-display text-lg font-black uppercase tracking-widest text-cyber-fg">
        BRIGHT<span className="cyber-text-accent">HIRE</span>
        <span className="cyber-text-tertiary">_AI</span>
      </span>
    </Link>
  )
}
