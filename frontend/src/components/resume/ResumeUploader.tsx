import { motion, useReducedMotion } from 'framer-motion'
import { FileUp, Sparkles } from 'lucide-react'
import { useRef, useState, type DragEvent } from 'react'

type ResumeUploaderProps = {
  uploading: boolean
  onUpload: (file: File) => void
}

export function ResumeUploader({ uploading, onUpload }: ResumeUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const reduceMotion = useReducedMotion()

  function handleFiles(files: FileList | null) {
    const file = files?.[0]
    if (file) onUpload(file)
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  return (
    <section className="relative flex min-h-[70vh] items-center justify-center overflow-hidden cyber-card p-6">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-xl text-center"
      >
        <div className="mx-auto mb-8 flex h-28 w-24 items-center justify-center border border-cyber-border bg-cyber-muted cyber-chamfer-sm">
          <FileUp className="h-10 w-10 text-cyber-accent cyber-icon" strokeWidth={1.5} aria-hidden="true" />
        </div>

        <p className="inline-flex items-center gap-2 border border-cyber-accent/30 bg-cyber-accent/10 px-3 py-1 cyber-label text-cyber-accent cyber-chamfer-sm">
          <Sparkles className="h-3.5 w-3.5 cyber-icon" strokeWidth={1.5} />
          Resume Intelligence Lab
        </p>
        <h1 className="cyber-h3 mt-4 text-3xl sm:text-4xl">
          Drop your resume and let AI discover your career potential
        </h1>
        <p className="cyber-body-muted mt-3">
          Supported: PDF · DOCX preview via extraction
        </p>

        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click()
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-8 cursor-pointer border border-dashed px-6 py-12 transition cyber-chamfer-sm cyber-focus ${
            dragging
              ? 'border-cyber-accent bg-cyber-accent/10 shadow-[var(--box-shadow-neon-sm)]'
              : 'border-cyber-border bg-cyber-muted hover:border-cyber-accent/50'
          }`}
          aria-label="Upload resume"
        >
          <p className="text-sm font-semibold text-cyber-fg">
            {uploading ? 'Uploading to the AI lab…' : 'Drag & drop or click to upload'}
          </p>
          <p className="cyber-body-muted mt-2">
            Your document enters the analysis pipeline instantly
          </p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </motion.div>
    </section>
  )
}
