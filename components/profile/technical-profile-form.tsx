'use client'

import { useCallback, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeelyMascot } from '@/components/feely-mascot'
import { FeelingLogo } from '@/components/feeling-logo'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Sparkles, ArrowRight, Briefcase } from 'lucide-react'
import { toast } from 'sonner'
import {
  ExperienceCard,
  emptyExperience,
  isValidDate,
  type WorkExperience,
} from './experience-card'

interface LoadedExperience {
  id?: string
  job_title?: string | null
  company_name?: string | null
  location?: string | null
  start_date?: string | null
  end_date?: string | null
  is_current?: boolean | null
  main_tasks?: string | null
}

interface UIExperience extends WorkExperience {
  localId: string
  isNew: boolean
}

/** Convertit "YYYY-MM-DD" (format Postgres) en "YYYY-MM" attendu par les Selects. */
const trimDate = (date: string | null | undefined): string => {
  if (!date) return ''
  const match = date.match(/^(\d{4}-\d{2})/)
  return match ? match[1] : ''
}

const normalizeLoaded = (exp: LoadedExperience): UIExperience => ({
  localId: exp.id ?? (typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36)),
  isNew: false,
  job_title: exp.job_title ?? '',
  company_name: exp.company_name ?? '',
  location: exp.location ?? '',
  start_date: trimDate(exp.start_date),
  end_date: trimDate(exp.end_date),
  is_current: !!exp.is_current,
  main_tasks: exp.main_tasks ?? '',
})

const toPayload = (list: UIExperience[]): WorkExperience[] =>
  list
    .filter(
      (e) =>
        e.job_title.trim() &&
        e.company_name.trim() &&
        isValidDate(e.start_date) &&
        !e.isNew // les brouillons non sauvegardés sont exclus
    )
    .map(({ localId: _localId, isNew: _isNew, ...rest }) => rest)

interface TechnicalProfileFormProps {
  userId: string
  fromAnalysisId?: string
  initialSkills?: string[]
  initialExperiences?: LoadedExperience[]
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
  const [experiences, setExperiences] = useState<UIExperience[]>(() =>
    initialExperiences.map(normalizeLoaded)
  )
  const [isSaving, setIsSaving] = useState(false)

  // Suit les cartes en cours d'édition pour avertir avant la sauvegarde globale
  // (sinon les brouillons locaux des cartes seraient ignorés à la redirection).
  const editingIdsRef = useRef<Set<string>>(new Set())
  const handleEditingChange = useCallback(
    (localId: string, isEditing: boolean) => {
      if (isEditing) editingIdsRef.current.add(localId)
      else editingIdsRef.current.delete(localId)
    },
    []
  )

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

  /** Persiste la liste fournie en base. Retourne true en cas de succès. */
  const persist = async (
    nextExperiences: UIExperience[],
    nextSkills: string[] = skills
  ): Promise<boolean> => {
    const res = await fetch('/api/profile/technical', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        skills: nextSkills,
        experiences: toPayload(nextExperiences),
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || 'Erreur lors de la sauvegarde')
    }
    return true
  }

  const handleAddExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        ...emptyExperience(),
        localId:
          typeof crypto !== 'undefined'
            ? crypto.randomUUID()
            : Math.random().toString(36),
        isNew: true,
      },
    ])
  }

  const handleCancelNew = (localId: string) => {
    setExperiences((prev) => prev.filter((e) => e.localId !== localId))
    editingIdsRef.current.delete(localId)
  }

  const handleSaveExperience = async (
    localId: string,
    updated: WorkExperience
  ) => {
    const next = experiences.map((e) =>
      e.localId === localId ? { ...e, ...updated, isNew: false } : e
    )
    try {
      await persist(next)
      setExperiences(next)
      toast.success('Expérience enregistrée')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.error(message)
      throw error
    }
  }

  const handleDeleteExperience = async (localId: string) => {
    const next = experiences.filter((e) => e.localId !== localId)
    try {
      await persist(next)
      setExperiences(next)
      toast.success('Expérience supprimée')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Une erreur est survenue'
      toast.error(message)
      throw error
    }
  }

  const handleSave = async () => {
    if (editingIdsRef.current.size > 0) {
      toast.warning(
        "Termine d'enregistrer ou d'annuler tes modifications en cours avant de continuer."
      )
      return
    }

    const filledExperiences = toPayload(experiences)

    if (filledExperiences.length === 0 && skills.length === 0) {
      toast.error('Ajoute au moins une compétence ou une expérience.')
      return
    }

    setIsSaving(true)

    try {
      await persist(experiences, skills)

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
          throw new Error(data.error || "Erreur lors de l'analyse")
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
              {experiences.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExperience}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une expérience
                </Button>
              )}
            </div>

            {experiences.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-8 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                  <Briefcase className="w-5 h-5 text-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">Pas encore d&apos;expérience renseignée</p>
                  <p className="text-xs text-muted-foreground">
                    Ajoute ta première expérience pour affiner ton analyse.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddExperience}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une expérience
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp) => {
                  const { localId, isNew, ...data } = exp
                  return (
                    <ExperienceCard
                      key={localId}
                      experience={data}
                      isNew={isNew}
                      onSave={(updated) => handleSaveExperience(localId, updated)}
                      onDelete={() => handleDeleteExperience(localId)}
                      onCancelNew={() => handleCancelNew(localId)}
                      onEditingChange={(isEditing) =>
                        handleEditingChange(localId, isEditing)
                      }
                    />
                  )
                })}
              </div>
            )}
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
