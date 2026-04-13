'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeelyMascot } from '@/components/feely-mascot'
import { FeelingLogo } from '@/components/feeling-logo'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, X, Sparkles, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'

const MONTHS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: 51 }, (_, i) => String(CURRENT_YEAR - i))

/** Extrait "MM" depuis "YYYY-MM", "-MM" (partiel) ou "" */
const getMonth = (date: string) => date?.split('-')[1] ?? ''
/** Extrait "YYYY" depuis "YYYY-MM", "YYYY-" (partiel) ou "" */
const getYear = (date: string) => date?.split('-')[0] ?? ''
/**
 * Reconstruit la date depuis year + month.
 * Stocke une valeur partielle ("YYYY-" ou "-MM") si l'un des deux manque,
 * afin que le Select correspondant garde sa sélection en attendant l'autre.
 */
const buildDate = (year: string, month: string) =>
  year || month ? `${year}-${month}` : ''
/** Vérifie qu'une date est complète et valide (YYYY-MM) */
const isValidDate = (date: string) => /^\d{4}-\d{2}$/.test(date)

interface WorkExperience {
  job_title: string
  company_name: string
  location: string
  start_date: string
  end_date: string
  is_current: boolean
  main_tasks: string
}

const emptyExperience = (): WorkExperience => ({
  job_title: '',
  company_name: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  main_tasks: '',
})

interface TechnicalProfileFormProps {
  userId: string
  fromAnalysisId?: string
  initialSkills?: string[]
  initialExperiences?: WorkExperience[]
}

export function TechnicalProfileForm({
  userId,
  fromAnalysisId,
  initialSkills = [],
  initialExperiences = [],
}: TechnicalProfileFormProps) {
  const router = useRouter()
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [skillInput, setSkillInput] = useState('')
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    initialExperiences.length > 0 ? initialExperiences : [emptyExperience()]
  )
  const [isSaving, setIsSaving] = useState(false)

  const addSkill = () => {
    const trimmed = skillInput.trim()
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed])
    }
    setSkillInput('')
  }

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill()
    }
  }

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill))
  }

  const addExperience = () => {
    setExperiences((prev) => [...prev, emptyExperience()])
  }

  const removeExperience = (index: number) => {
    setExperiences((prev) => prev.filter((_, i) => i !== index))
  }

  const updateExperience = (index: number, updates: Partial<WorkExperience>) => {
    setExperiences((prev) =>
      prev.map((exp, i) => (i === index ? { ...exp, ...updates } : exp))
    )
  }

  const handleSave = async () => {
    // Validate at least one experience has required fields
    const filledExperiences = experiences.filter(
      (e) => e.job_title.trim() && e.company_name.trim() && isValidDate(e.start_date)
    )

    if (filledExperiences.length === 0 && skills.length === 0) {
      toast.error('Ajoute au moins une compétence ou une expérience.')
      return
    }

    setIsSaving(true)

    try {
      // Save technical profile
      const saveResponse = await fetch('/api/profile/technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skills, experiences: filledExperiences }),
      })

      if (!saveResponse.ok) {
        const data = await saveResponse.json()
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }

      // If coming from an analysis, trigger complete re-analysis
      if (fromAnalysisId) {
        const toastId = toast.loading('Analyse complète en cours...')

        const analyzeResponse = await fetch('/api/analyze-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ analysisId: fromAnalysisId, userId }),
        })

        if (!analyzeResponse.ok) {
          const data = await analyzeResponse.json()
          toast.dismiss(toastId)
          throw new Error(data.error || 'Erreur lors de l\'analyse')
        }

        toast.success('Analyse complète prête !', { id: toastId })
        router.push(`/resultats-complets/${fromAnalysisId}`)
      } else {
        toast.success('Profil technique sauvegardé !')
        router.push('/accueil')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error(error instanceof Error ? error.message : 'Une erreur est survenue')
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="md" />
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        {/* Hero */}
        <div className="flex items-start gap-4 mb-8">
          <FeelyMascot variant="purple" size="md" speechBubble="Montre tes skills !" />
          <div>
            <h1 className="text-2xl font-bold mb-1">Ton profil technique</h1>
            <p className="text-muted-foreground text-sm">
              Ajoute tes expériences et compétences pour obtenir une analyse complète de ta compatibilité avec les offres.
            </p>
            {fromAnalysisId && (
              <div className="mt-3 inline-flex items-center gap-2 bg-primary/20 text-primary-foreground/80 text-xs font-medium px-3 py-1.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                On va recalculer ton score avec ces infos
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {/* Skills section */}
          <section>
            <h2 className="font-semibold text-lg mb-4">Compétences techniques</h2>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ex : React, Python, Figma... (Entrée pour valider)"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                  onBlur={addSkill}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addSkill} size="icon">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 bg-primary/20 text-foreground text-sm px-3 py-1 rounded-full"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Experiences section */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Expériences professionnelles</h2>
              <Button type="button" variant="outline" size="sm" onClick={addExperience}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>

            <div className="space-y-4">
              {experiences.map((exp, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4 relative"
                >
                  {experiences.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExperience(index)}
                      className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Poste *</label>
                      <Input
                        placeholder="Ex : Développeur Frontend"
                        value={exp.job_title}
                        onChange={(e) => updateExperience(index, { job_title: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Entreprise *</label>
                      <Input
                        placeholder="Ex : Acme Corp"
                        value={exp.company_name}
                        onChange={(e) => updateExperience(index, { company_name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Lieu</label>
                    <Input
                      placeholder="Ex : Paris, Remote"
                      value={exp.location}
                      onChange={(e) => updateExperience(index, { location: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Date de début *</label>
                      <div className="flex gap-1.5">
                        <Select
                          value={getMonth(exp.start_date)}
                          onValueChange={(m) =>
                            updateExperience(index, { start_date: buildDate(getYear(exp.start_date), m) })
                          }
                        >
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Mois" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={getYear(exp.start_date)}
                          onValueChange={(y) =>
                            updateExperience(index, { start_date: buildDate(y, getMonth(exp.start_date)) })
                          }
                        >
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Année" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Date de fin</label>
                      <div className={cn('flex gap-1.5', exp.is_current && 'opacity-50 pointer-events-none')}>
                        <Select
                          value={getMonth(exp.end_date)}
                          disabled={exp.is_current}
                          onValueChange={(m) =>
                            updateExperience(index, { end_date: buildDate(getYear(exp.end_date), m) })
                          }
                        >
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Mois" />
                          </SelectTrigger>
                          <SelectContent>
                            {MONTHS.map((m) => (
                              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={getYear(exp.end_date)}
                          disabled={exp.is_current}
                          onValueChange={(y) =>
                            updateExperience(index, { end_date: buildDate(y, getMonth(exp.end_date)) })
                          }
                        >
                          <SelectTrigger className="flex-1 h-10">
                            <SelectValue placeholder="Année" />
                          </SelectTrigger>
                          <SelectContent>
                            {YEARS.map((y) => (
                              <SelectItem key={y} value={y}>{y}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={exp.is_current}
                      onChange={(e) =>
                        updateExperience(index, { is_current: e.target.checked, end_date: '' })
                      }
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm">Poste actuel</span>
                  </label>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Missions principales</label>
                    <Textarea
                      placeholder="Décris tes principales responsabilités et réalisations..."
                      value={exp.main_tasks}
                      onChange={(e) => updateExperience(index, { main_tasks: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-14 bg-foreground text-background hover:bg-foreground/90 text-base font-medium"
          >
            {isSaving ? (
              <>
                <Sparkles className="w-5 h-5 mr-2 animate-pulse" />
                {fromAnalysisId ? 'Analyse en cours...' : 'Sauvegarde en cours...'}
              </>
            ) : (
              <>
                {fromAnalysisId ? 'Voir mon analyse complète' : 'Sauvegarder mon profil'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </main>

      <Footer />
    </div>
  )
}
