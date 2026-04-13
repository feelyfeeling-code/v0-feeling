'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FeelingLogo } from '@/components/feeling-logo'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'
import { toast } from 'sonner'

// Step components
import { WelcomeStep } from './steps/welcome-step'
import { AcademicStep } from './steps/academic-step'
import { SituationStep } from './steps/situation-step'
import { PersonalityStep } from './steps/personality-step'
import { ValuesStep } from './steps/values-step'
import { DreamJobStep } from './steps/dream-job-step'

export interface OnboardingData {
  // Academic profile
  academic: {
    education_level: string
    graduation_date: string
    diploma_name: string
    school_name: string
    field_of_study: string[]
  }
  // Current situation (multi-select)
  situation: {
    situations: string[]
    job_search_types: string[]
  }
  // Personality profile (3 ranked traits + existing test OR 10-question integrated test)
  personality: {
    traits: string[]
    has_taken_test: boolean
    test_type: string
    test_result: string
    test_answers: Record<string, number>
  }
  // Values profile (up to 3 values + up to 3 dealbreakers)
  values: {
    selected_values: string[]
    dealbreakers: string[]
  }
  // Dream job — Le bon job selon toi, c'est quoi ?
  dreamJob: {
    job_titles: string[]
    locations: string[]
    location_radius: number
    industries: string[]
    salary_range: string
    remote_preference: string
  }
}

const initialData: OnboardingData = {
  academic: {
    education_level: '',
    graduation_date: '',
    diploma_name: '',
    school_name: '',
    field_of_study: [],
  },
  situation: {
    situations: [],
    job_search_types: [],
  },
  personality: {
    traits: [],
    has_taken_test: false,
    test_type: '',
    test_result: '',
    test_answers: {},
  },
  values: {
    selected_values: [],
    dealbreakers: [],
  },
  dreamJob: {
    job_titles: [],
    locations: [],
    location_radius: 40,
    industries: [],
    salary_range: '',
    remote_preference: '',
  },
}

interface OnboardingFlowProps {
  userId: string
  firstName: string
}

const TOTAL_STEPS = 6

const STORAGE_KEY = 'feeling_onboarding_state'
// Incrémenter quand la forme de OnboardingData change (invalide l'état local stocké).
const STORAGE_VERSION = 4

interface PersistedState {
  version: typeof STORAGE_VERSION
  userId: string
  currentStep: number
  data: OnboardingData
}

export function OnboardingFlow({ userId, firstName }: OnboardingFlowProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [data, setData] = useState<OnboardingData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  // Hydrate from localStorage on mount (resume where the user left off).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState
        if (parsed.version === STORAGE_VERSION && parsed.userId === userId) {
          setCurrentStep(parsed.currentStep)
          // Merge profond pour garantir que toutes les sous-clés existent
          // même si une section a été partiellement sauvegardée.
          setData({
            academic: { ...initialData.academic, ...parsed.data.academic },
            situation: { ...initialData.situation, ...parsed.data.situation },
            personality: { ...initialData.personality, ...parsed.data.personality },
            values: { ...initialData.values, ...parsed.data.values },
            dreamJob: { ...initialData.dreamJob, ...parsed.data.dreamJob },
          })
        } else {
          // Ancienne version incompatible : on purge.
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {
      // Ignore storage / parse errors — start fresh.
    }
    setHydrated(true)
  }, [userId])

  // Persist on every change once we've hydrated (avoids overwriting before read).
  useEffect(() => {
    if (!hydrated) return
    try {
      const payload: PersistedState = {
        version: STORAGE_VERSION,
        userId,
        currentStep,
        data,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore quota / serialization errors.
    }
  }, [hydrated, userId, currentStep, data])

  // Welcome page (step 1) is not counted as a "numbered" step.
  // Actual onboarding steps are currentStep >= 2, displayed as 1..TOTAL_STEPS-1.
  const isWelcome = currentStep === 1
  const displayedStep = currentStep - 1
  const displayedTotal = TOTAL_STEPS - 1
  const progress = isWelcome ? 0 : (displayedStep / displayedTotal) * 100

  const updateData = <K extends keyof OnboardingData>(
    section: K,
    updates: Partial<OnboardingData[K]>
  ) => {
    setData((prev) => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsSubmitting(true)

    const supabase = createClient()

    // Helper : exécute un upsert et relance une erreur lisible si ça échoue.
    // Les PostgrestError de Supabase ont des props non énumérables → on les
    // extrait explicitement pour qu'elles apparaissent dans les logs et toasts.
    const runUpsert = async (
      table: string,
      payload: Record<string, unknown>,
    ) => {
      const { error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: 'user_id' })
      if (error) {
        console.error(`[onboarding] upsert ${table} failed`, {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
          payload,
        })
        throw new Error(
          `Échec sauvegarde ${table} : ${error.message}${
            error.hint ? ` (${error.hint})` : ''
          }`,
        )
      }
    }

    try {
      await runUpsert('academic_profiles', {
        user_id: userId,
        ...data.academic,
      })
      await runUpsert('current_situations', {
        user_id: userId,
        ...data.situation,
      })
      await runUpsert('personality_profiles', {
        user_id: userId,
        ...data.personality,
      })
      await runUpsert('values_profiles', {
        user_id: userId,
        ...data.values,
      })
      await runUpsert('dream_jobs', {
        user_id: userId,
        ...data.dreamJob,
      })

      // Mark onboarding as completed. On utilise upsert pour couvrir le cas
      // où la ligne profiles n'aurait pas été créée par le trigger auth
      // (edge case : trigger désactivé, row supprimée manuellement, etc.).
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, onboarding_completed: true },
          { onConflict: 'id' }
        )
        .select('id, onboarding_completed')
        .single()

      if (profileError) {
        console.error('[onboarding] upsert profiles failed', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint,
        })
        throw new Error(
          `Échec finalisation du profil : ${profileError.message}`,
        )
      }

      if (!updatedProfile?.onboarding_completed) {
        throw new Error(
          `Échec finalisation du profil : la ligne profiles (id=${userId}) n'a pas été marquée comme complétée.`,
        )
      }

      // Onboarding terminé : on purge l'état local.
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }

      toast.success('Profil complété !')
      // On force un refresh serveur pour invalider les caches de server
      // components AVANT de naviguer, sinon la page termine peut lire un
      // profil stale et rediriger vers /onboarding.
      router.refresh()
      router.push('/onboarding/termine')
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue. Réessaie.'
      console.error('[onboarding] handleComplete error:', message, error)
      toast.error(message)
      setIsSubmitting(false)
    }
  }

  const handleExit = () => {
    if (confirm('Es-tu sûr de vouloir quitter ? Tes réponses ne seront pas sauvegardées.')) {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header (masqué sur l'écran d'accueil) */}
      {!isWelcome && (
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <FeelingLogo size="md" asLink={false} />

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                Étape {displayedStep}/{displayedTotal}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExit}
                className="text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-1" />
        </header>
      )}

      {/* Content */}
      <main className="flex-1 container mx-auto px-4 py-8">
        {currentStep === 1 && (
          <WelcomeStep 
            firstName={firstName}
            onNext={nextStep}
          />
        )}
        {currentStep === 2 && (
          <AcademicStep
            data={data.academic}
            onUpdate={(updates) => updateData('academic', updates)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 3 && (
          <SituationStep
            data={data.situation}
            onUpdate={(updates) => updateData('situation', updates)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 4 && (
          <PersonalityStep
            data={data.personality}
            onUpdate={(updates) => updateData('personality', updates)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 5 && (
          <ValuesStep
            data={data.values}
            onUpdate={(updates) => updateData('values', updates)}
            onNext={nextStep}
            onPrev={prevStep}
          />
        )}
        {currentStep === 6 && (
          <DreamJobStep
            data={data.dreamJob}
            onUpdate={(updates) => updateData('dreamJob', updates)}
            onComplete={handleComplete}
            onPrev={prevStep}
            isSubmitting={isSubmitting}
          />
        )}
      </main>
    </div>
  )
}
