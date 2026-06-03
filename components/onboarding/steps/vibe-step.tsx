'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, Plus, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { OnboardingData } from '../onboarding-flow'

interface VibeStepProps {
  data: OnboardingData['values']
  onUpdate: (updates: Partial<OnboardingData['values']>) => void
  onNext: () => void
  onPrev: () => void
}

type SubStep = 'environment' | 'values' | 'dealbreakers' | 'work-style'

const ENVIRONMENT_OPTIONS = [
  { value: 'autonomie', label: 'Autonomie' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'cadre_structure', label: 'Cadre structuré' },
  { value: 'creativite', label: 'Créativité' },
  { value: 'challenge', label: 'Challenge' },
  { value: 'stabilite', label: 'Stabilité' },
  { value: 'impact_concret', label: 'Impact concret' },
  { value: 'autre', label: 'Autre' },
]

const VALUE_OPTIONS = [
  { value: 'impact_mission', label: "L'impact de ma mission" },
  { value: 'ambiance_collegues', label: "L'ambiance et les relations avec mes collègues" },
  { value: 'evolution', label: "Les possibilités d'évolution" },
  { value: 'autonomie', label: "L'autonomie dans mon travail" },
  { value: 'valeurs_entreprise', label: "Les valeurs de l'entreprise" },
  { value: 'remuneration', label: 'Une rémunération attractive' },
  { value: 'equilibre_vie', label: "L'équilibre vie pro / vie perso" },
  { value: 'apprentissage', label: "Les opportunités d'apprentissage" },
  { value: 'flexibilite_horaires', label: 'La flexibilité des horaires' },
  { value: 'diversite_missions', label: 'La diversité des missions' },
]

const DEALBREAKER_OPTIONS = [
  { value: 'forte_pression', label: 'Une forte pression sur les résultats' },
  { value: 'pas_feedback', label: 'Peu ou pas de feedback' },
  { value: 'pas_flexibilite', label: 'Aucune flexibilité des horaires' },
  { value: 'management_autoritaire', label: 'Un management trop autoritaire' },
  { value: 'pas_evolution', label: "Pas de perspectives d'évolution" },
  { value: 'mauvaise_ambiance', label: "Une mauvaise ambiance d'équipe" },
  { value: 'heures_sup', label: 'Des heures supplémentaires fréquentes' },
  { value: 'travail_repetitif', label: 'Un travail répétitif et sans variété' },
  { value: 'aucune_reconnaissance', label: 'Aucune reconnaissance du travail' },
  { value: 'manque_sens', label: 'Un manque de sens dans les missions' },
]

const MULTI_PROJECT_OPTIONS = [
  { value: 'oui_stimulant', label: 'Oui, ça me stimule' },
  { value: 'ca_depend', label: 'Ça dépend' },
  { value: 'non_concentration', label: 'Non, je préfère me concentrer' },
]

const MAX_ENVIRONMENT = 2
const MAX_SELECTIONS = 3

export function VibeStep({ data, onUpdate, onNext, onPrev }: VibeStepProps) {
  const [subStep, setSubStep] = useState<SubStep>('environment')

  const idealEnvironment = data.ideal_environment ?? []
  const selectedValues = data.selected_values ?? []
  const dealbreakers = data.dealbreakers ?? []

  // --- Environment (3a) ---
  const toggleEnvironment = (value: string) => {
    if (idealEnvironment.includes(value)) {
      onUpdate({ ideal_environment: idealEnvironment.filter((v) => v !== value) })
      return
    }
    if (idealEnvironment.length >= MAX_ENVIRONMENT) {
      toast.error(`Tu as atteint le maximum de ${MAX_ENVIRONMENT}. Retire-en un pour en choisir un autre.`)
      return
    }
    onUpdate({ ideal_environment: [...idealEnvironment, value] })
  }

  // --- Values (3b) ---
  const toggleValue = (value: string) => {
    if (selectedValues.includes(value)) {
      onUpdate({ selected_values: selectedValues.filter((v) => v !== value) })
      return
    }
    if (selectedValues.length >= MAX_SELECTIONS) {
      toast.error(`Tu as atteint le maximum de ${MAX_SELECTIONS}. Retire-en un pour en choisir un autre.`)
      return
    }
    onUpdate({ selected_values: [...selectedValues, value] })
  }

  // --- Dealbreakers (3b suite) ---
  const toggleDealbreaker = (value: string) => {
    if (dealbreakers.includes(value)) {
      onUpdate({ dealbreakers: dealbreakers.filter((d) => d !== value) })
      return
    }
    if (dealbreakers.length >= MAX_SELECTIONS) {
      toast.error(`Tu as atteint le maximum de ${MAX_SELECTIONS}. Retire-en un pour en choisir un autre.`)
      return
    }
    onUpdate({ dealbreakers: [...dealbreakers, value] })
  }

  // --- Navigation ---
  const handlePrev = () => {
    if (subStep === 'environment') onPrev()
    else if (subStep === 'values') setSubStep('environment')
    else if (subStep === 'dealbreakers') setSubStep('values')
    else if (subStep === 'work-style') setSubStep('dealbreakers')
  }

  const handleNext = () => {
    if (subStep === 'environment') setSubStep('values')
    else if (subStep === 'values') setSubStep('dealbreakers')
    else if (subStep === 'dealbreakers') setSubStep('work-style')
    else onNext()
  }

  const canContinue =
    subStep === 'environment' ? idealEnvironment.length > 0 :
    subStep === 'values' ? selectedValues.length > 0 :
    subStep === 'dealbreakers' ? dealbreakers.length > 0 :
    !!data.multi_project_comfort

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={handlePrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {/* Feely message — affiché sur toutes les sous-étapes */}
      <div className="text-center mb-8">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <div className="bg-muted/50 rounded-2xl p-4 text-left max-w-md mx-auto mb-4">
          <p className="text-sm leading-relaxed">
            Oublie le CV une seconde et dis-moi ce qui compte vraiment pour toi au travail&nbsp;!
          </p>
        </div>
      </div>

      {/* -------- 3a — Environnement idéal -------- */}
      {subStep === 'environment' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-1">
              Dans quel type d&apos;environnement tu t&apos;épanouis vraiment&nbsp;?
            </h2>
            <p className="text-sm text-muted-foreground">
              Sélectionne jusqu&apos;à {MAX_ENVIRONMENT} environnements
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ENVIRONMENT_OPTIONS.map((opt) => {
              const selected = idealEnvironment.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleEnvironment(opt.value)}
                  aria-pressed={selected}
                  className={`relative p-4 rounded-2xl border-2 text-sm font-medium transition-all text-left ${
                    selected ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
                  }`}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* -------- 3b — Ce qui compte le plus -------- */}
      {subStep === 'values' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-1">
              Ce qui compte le plus pour toi au travail
            </h2>
            <p className="text-sm text-muted-foreground">
              Sélectionne jusqu&apos;à {MAX_SELECTIONS}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {VALUE_OPTIONS.map((opt) => {
              const selected = selectedValues.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleValue(opt.value)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary bg-primary/30'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected ? <X className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* -------- 3b suite — Ce que tu ne veux pas -------- */}
      {subStep === 'dealbreakers' && (
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-1">
              Ce que tu ne veux absolument pas
            </h2>
            <p className="text-sm text-muted-foreground">
              Sélectionne jusqu&apos;à {MAX_SELECTIONS}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {DEALBREAKER_OPTIONS.map((opt) => {
              const selected = dealbreakers.includes(opt.value)
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleDealbreaker(opt.value)}
                  aria-pressed={selected}
                  className={`inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-full border-2 text-sm font-medium transition-all ${
                    selected
                      ? 'border-primary bg-primary/30'
                      : 'border-border bg-background hover:border-primary/50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {selected ? <X className="w-4 h-4 flex-shrink-0" /> : <Plus className="w-4 h-4 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* -------- 3c — Ta façon de travailler -------- */}
      {subStep === 'work-style' && (
        <div className="space-y-8">
          <h2 className="text-xl font-bold">Ta façon de travailler</h2>

          {/* Slider seul/équipe */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Tu travailles mieux seul(e) ou en équipe&nbsp;?
            </p>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[data.work_solo_team_slider ?? 3]}
              onValueChange={([v]) => onUpdate({ work_solo_team_slider: v })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Seul(e)</span>
              <span>En équipe</span>
            </div>
          </div>

          {/* Slider cadre/autonomie */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Tu as besoin d&apos;un cadre clair ou tu préfères t&apos;organiser seul(e)&nbsp;?
            </p>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[data.work_structure_slider ?? 3]}
              onValueChange={([v]) => onUpdate({ work_structure_slider: v })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cadre structuré</span>
              <span>Pleine autonomie</span>
            </div>
          </div>

          {/* Multi-projets */}
          <div className="space-y-3">
            <p className="text-sm font-semibold">
              Tu es à l&apos;aise avec plusieurs projets en parallèle&nbsp;?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {MULTI_PROJECT_OPTIONS.map((opt) => {
                const selected = data.multi_project_comfort === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate({ multi_project_comfort: opt.value })}
                    aria-pressed={selected}
                    className={`p-3 rounded-2xl border-2 text-sm font-medium text-center transition-all ${
                      selected ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Motivation libre */}
          <div className="space-y-2">
            <p className="text-sm font-semibold">
              Qu&apos;est-ce qui t&apos;a le plus motivé dans tes expériences passées&nbsp;?
            </p>
            <Textarea
              placeholder="Un projet, une mission, une rencontre..."
              value={data.motivation_text ?? ''}
              onChange={(e) => onUpdate({ motivation_text: e.target.value })}
              className="rounded-2xl min-h-[100px] resize-none"
            />
          </div>
        </div>
      )}

      <div className="mt-10">
        <Button
          onClick={handleNext}
          disabled={!canContinue}
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
