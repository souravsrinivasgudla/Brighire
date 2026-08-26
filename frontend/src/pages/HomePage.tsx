import { AICoach } from '../components/landing/AICoach'
import { CareerDNA } from '../components/landing/CareerDNA'
import { FinalCTA } from '../components/landing/FinalCTA'
import { Footer } from '../components/landing/Footer'
import { HeroAI } from '../components/landing/HeroAI'
import { JobMatchingEngine } from '../components/landing/JobMatchingEngine'
import { Navbar } from '../components/landing/Navbar'
import { ResumeScanner } from '../components/landing/ResumeScanner'

export function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroAI />
        <ResumeScanner />
        <CareerDNA />
        <JobMatchingEngine />
        <AICoach />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
