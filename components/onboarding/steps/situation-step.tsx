'use client'

import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import {
  ArrowLeft,
  Briefcase,
  GraduationCap,
  Search,
  Check,
} from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface SituationStepProps {
  data: OnboardingData['situation']
  onUpdate: (updates: Partial<OnboardingData['situation']>) => void
  onNext: () => void
  onPrev: () => void
}

type SituationKey = 'job_seeking' | 'employed' | 'student'

const mainCards: {
  value: SituationKey
  label: string
  icon: typeof Briefcase
}[] = [
  { value: 'job_seeking', label: "En recherche d'emploi", icon: Search },
  { value: 'employed', label: 'En poste', icon: Briefcase },
  { value: 'student', label: 'En études', icon: GraduationCap },
]

const contractTypes: { value: string; label: string }[] = [
  { value: 'cdd', label: 'CDD' },
  { value: 'cdi', label: 'CDI' },
]

export function SituationStep({ data, onUpdate, onNext, onPrev }: SituationStepProps) {
  const isSelected = (key: SituationKey) => data.situations.includes(key)

  const toggleMain = (key: SituationKey) => {
    if (isSelected(key)) {
      const nextSituations = data.situations.filter((s) => s !== key)
      // Si on déselectionne "En recherche", on vide aussi les types de contrat
      const nextSearchTypes =
        key === 'job_seeking' ? [] : data.job_search_types
      onUpdate({
        situations: nextSituations,
        job_search_types: nextSearchTypes,
      })
    } else {
      onUpdate({ situations: [...data.situations, key] })
    }
  }

  const toggleContract = (value: string) => {
    const already = data.job_search_types.includes(value)
    onUpdate({
      job_search_types: already
        ? data.job_search_types.filter((t) => t !== value)
        : [...data.job_search_types, value],
    })
  }

  const isSearching = isSelected('job_seeking')
  const canContinue =
    data.situations.length > 0 &&
    (!isSearching || data.job_search_types.length > 0)

  return (
    <div className="max-w-xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-8">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold">
          Quelle est ta situation
          <br />
          actuelle&nbsp;?
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Tu peux en sélectionner plusieurs
        </p>
      </div>

      <div className="space-y-4">
        {mainCards.map((card) => {
          const Icon = card.icon
          const selected = isSelected(card.value)
          const showSubOptions = card.value === 'job_seeking' && selected

          return (
            <div key={card.value}>
              <button
                type="button"
                onClick={() => toggleMain(card.value)}
                aria-pressed={selected}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selected
                    ? 'border-primary bg-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    selected ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="flex-1 text-base font-semibold">
                  {card.label}
                </span>
                {selected && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>

              {showSubOptions && (
                <div className="mt-3 ml-4 pl-4 border-l-2 border-primary/40 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Type(s) de contrat recherché(s) :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contractTypes.map((contract) => {
                      const contractSelected = data.job_search_types.includes(
                        contract.value
                      )
                      return (
                        <button
                          key={contract.value}
                          type="button"
                          onClick={() => toggleContract(contract.value)}
                          aria-pressed={contractSelected}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-sm font-medium transition-all ${
                            contractSelected
                              ? 'border-primary bg-primary/30'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          {contract.label}
                          {contractSelected && (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-10">
        <Button
          onClick={onNext}
          disabled={!canContinue}
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
