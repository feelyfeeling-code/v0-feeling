'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import type { OnboardingData } from '../onboarding-flow'

interface ValuesStepProps {
  data: OnboardingData['values']
  onUpdate: (updates: Partial<OnboardingData['values']>) => void
  onNext: () => void
  onPrev: () => void
}

const MAX_SELECTIONS = 3

const VALUE_OPTIONS: { value: string; label: string }[] = [
  { value: 'impact_concret', label: 'Avoir un impact concret' },
  { value: 'ambiance_equipe', label: "Avoir une bonne ambiance d'équipe" },
  { value: 'horaires_flexibles', label: 'Avoir des horaires flexibles' },
  { value: 'apprendre_continu', label: 'Apprendre en continu' },
  { value: 'sens_travail', label: 'Donner du sens à son travail' },
  { value: 'evoluer_rapidement', label: 'Évoluer rapidement' },
  { value: 'temps_pour_soi', label: 'Garder du temps pour soi' },
  { value: 'autonomie', label: 'Travailler en autonomie' },
  { value: 'travail_equipe', label: 'Travailler en équipe' },
  { value: 'initiatives', label: 'Prendre des initiatives' },
]

const DEALBREAKER_OPTIONS: { value: string; label: string }[] = [
  { value: 'management_autoritaire', label: 'Un management trop autoritaire' },
  { value: 'pas_evolution', label: "Pas de perspectives d'évolution" },
  { value: 'mauvaise_ambiance', label: "Une mauvaise ambiance d'équipe" },
  { value: 'travail_repetitif', label: 'Un travail répétitif et sans variété' },
  { value: 'aucune_reconnaissance', label: 'Aucune reconnaissance du travail' },
  { value: 'manque_sens', label: 'Un manque de sens dans les missions' },
  { value: 'forte_pression', label: 'Une forte pression sur les résultats' },
  { value: 'pas_feedback', label: 'Peu ou pas de feedback' },
  { value: 'pas_flexibilite', label: 'Aucune flexibilité des horaires' },
  { value: 'heures_sup', label: 'Des heures supplémentaires fréquentes' },
]

type SubStep = 'values' | 'dealbreakers'

export function ValuesStep({ data, onUpdate, onNext, onPrev }: ValuesStepProps) {
  const [subStep, setSubStep] = useState<SubStep>('values')

  // Garde-fou : si l'état hydraté depuis localStorage est corrompu, on retombe
  // sur des tableaux vides plutôt que de crasher sur .includes().
  const selectedValues = data.selected_values ?? []
  const dealbreakersList = data.dealbreakers ?? []

  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onUpdate({
        selected_values: selectedValues.filter((v) => v !== value),
      })
      return
    }
    if (selectedValues.length >= MAX_SELECTIONS) {
      toast.error(
        `Tu as atteint le maximum de ${MAX_SELECTIONS} valeurs. Retire-en une pour en choisir une autre.`
      )
      return
    }
    onUpdate({ selected_values: [...selectedValues, value] })
  }

  const toggleDealbreaker = (value: string) => {
    if (dealbreakersList.includes(value)) {
      onUpdate({
        dealbreakers: dealbreakersList.filter((d) => d !== value),
      })
      return
    }
    if (dealbreakersList.length >= MAX_SELECTIONS) {
      toast.error(
        `Tu as atteint le maximum de ${MAX_SELECTIONS} critères rédhibitoires. Retire-en un pour en choisir un autre.`
      )
      return
    }
    onUpdate({ dealbreakers: [...dealbreakersList, value] })
  }

  const handlePrev = () => {
    if (subStep === 'dealbreakers') {
      setSubStep('values')
    } else {
      onPrev()
    }
  }

  const handleNext = () => {
    if (subStep === 'values') {
      setSubStep('dealbreakers')
    } else {
      onNext()
    }
  }

  const isValuesStep = subStep === 'values'
  const options = isValuesStep ? VALUE_OPTIONS : DEALBREAKER_OPTIONS
  const selected = isValuesStep ? selectedValues : dealbreakersList
  const toggle = isValuesStep ? toggleValue : toggleDealbreaker
  const title = isValuesStep
    ? 'Ce qui compte le plus pour toi :'
    : 'Ce qui est rédhibitoire pour toi :'
  const subtitle = isValuesStep
    ? `Sélectionne jusqu'à ${MAX_SELECTIONS} valeurs`
    : `Sélectionne jusqu'à ${MAX_SELECTIONS} valeurs`

  return (
    <div className="max-w-3xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-6">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground italic mt-2">{subtitle}</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => toggle(option.value)}
              aria-pressed={isSelected}
              className={`inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                isSelected
                  ? 'border-primary bg-primary/30'
                  : 'border-border bg-background hover:border-primary/50'
              }`}
            >
              <span>{option.label}</span>
              {isSelected ? (
                <X className="w-4 h-4 flex-shrink-0" />
              ) : (
                <Plus className="w-4 h-4 flex-shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      <div className="max-w-md mx-auto">
        <Button
          onClick={handleNext}
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
