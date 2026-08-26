import type { ReactNode } from 'react'

import { TerminalHeader } from './ui/CyberShell'

type AuthCardProps = {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <section className="mx-auto flex min-h-[75vh] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <div className="cyber-terminal">
        <TerminalHeader title="auth.brighire.sys" />
        <div className="p-6 sm:p-8">
          <p className="cyber-label text-cyber-accent">BrightHire AI</p>
          <h1 className="mt-3 cyber-h2 text-2xl sm:text-3xl">{title}</h1>
          <p className="mt-2 font-mono text-sm text-cyber-muted-fg">{description}</p>
          <div className="mt-6">{children}</div>
          {footer ? (
            <div className="mt-5 text-center font-mono text-sm text-cyber-muted-fg">{footer}</div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
