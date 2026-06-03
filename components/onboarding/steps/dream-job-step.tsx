'use client'

import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, Plus, X } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface DreamJobStepProps {
  data: OnboardingData['dreamJob']
  onUpdate: (updates: Partial<OnboardingData['dreamJob']>) => void
  onNext: () => void
  onPrev: () => void
}

type SubStep = 'vision' | 'details'

const FAST_GROWTH_OPTIONS = [
  { value: 'priorite', label: "Oui, c'est une priorité" },
  { value: 'un_peu', label: "Un peu, mais pas à tout prix" },
  { value: 'non_stabilite', label: "Non, je préfère la stabilité" },
]

const SALARY_OPTIONS = [
  { value: 'less_30k', label: 'Moins de 30k' },
  { value: '30_35k', label: '30k - 35k' },
  { value: '35_40k', label: '35k - 40k' },
  { value: '40_45k', label: '40k - 45k' },
  { value: '45_55k', label: '45k - 55k' },
  { value: '55_70k', label: '55k - 70k' },
  { value: 'more_70k', label: 'Plus de 70k' },
  { value: 'dont_know', label: 'Je ne sais pas encore' },
]

const REMOTE_OPTIONS = [
  { value: 'never', label: 'Jamais' },
  { value: 'occasional', label: 'Occasionnel' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'full_remote', label: 'Full remote' },
  { value: 'no_preference', label: 'Pas de préférence' },
]

export function DreamJobStep({ data, onUpdate, onNext, onPrev }: DreamJobStepProps) {
  const [subStep, setSubStep] = useState<SubStep>('vision')
  const [jobTitleInput, setJobTitleInput] = useState('')
  const [locationInput, setLocationInput] = useState('')
  const [industryInput, setIndustryInput] = useState('')

  const jobTitlesList = data.job_titles ?? []
  const locationsList = data.locations ?? []
  const industriesList = data.industries ?? []

  const addJobTitle = () => {
    const value = jobTitleInput.trim()
    if (!value || jobTitlesList.includes(value)) { setJobTitleInput(''); return }
    onUpdate({ job_titles: [...jobTitlesList, value] })
    setJobTitleInput('')
  }

  const addLocation = () => {
    const value = locationInput.trim()
    if (!value || locationsList.includes(value)) { setLocationInput(''); return }
    onUpdate({ locations: [...locationsList, value] })
    setLocationInput('')
  }

  const addIndustry = () => {
    const value = industryInput.trim()
    if (!value || industriesList.includes(value)) { setIndustryInput(''); return }
    onUpdate({ industries: [...industriesList, value] })
    setIndustryInput('')
  }

  const handleKeyDown = (fn: () => void) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); fn() }
  }

  const canContinueVision = !!data.fast_growth_importance
  const canContinueDetails = jobTitlesList.length > 0 && !!data.salary_range && !!data.remote_preference

  const handlePrev = () => {
    if (subStep === 'details') setSubStep('vision')
    else onPrev()
  }

  const handleNext = () => {
    if (subStep === 'vision') setSubStep('details')
    else onNext()
  }

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

      <div className="text-center mb-8">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <div className="bg-muted/50 rounded-2xl p-4 text-left max-w-md mx-auto">
          <p className="text-sm leading-relaxed">
            Dernière ligne droite. Dis-moi ce que tu vises vraiment.
            Pas ce que tu penses être raisonnable. Ce que tu veux vraiment.
          </p>
        </div>
      </div>

      {/* -------- Vision -------- */}
      {subStep === 'vision' && (
        <div className="space-y-8">
          {/* Dans 2 ans */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Dans 2 ans, tu t&apos;imagines où&nbsp;?
            </Label>
            <Textarea
              placeholder="Décris ta situation idéale en quelques mots"
              value={data.vision_2_years ?? ''}
              onChange={(e) => onUpdate({ vision_2_years: e.target.value })}
              className="rounded-2xl min-h-[100px] resize-none"
            />
          </div>

          {/* Spécialiser vs élargir */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              Tu cherches plutôt à te spécialiser ou à élargir tes compétences&nbsp;?
            </Label>
            <Slider
              min={1}
              max={5}
              step={1}
              value={[data.specialization_vs_broadening ?? 3]}
              onValueChange={([v]) => onUpdate({ specialization_vs_broadening: v })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Me spécialiser</span>
              <span>Élargir mes compétences</span>
            </div>
          </div>

          {/* Évolution rapide */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              L&apos;évolution rapide est importante pour toi&nbsp;?
            </Label>
            <div className="space-y-2">
              {FAST_GROWTH_OPTIONS.map((opt) => {
                const selected = data.fast_growth_importance === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate({ fast_growth_importance: opt.value })}
                    aria-pressed={selected}
                    className={`w-full p-4 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                      selected ? 'border-primary bg-primary/20' : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'}`} />
                      {opt.label}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* -------- Détails du job -------- */}
      {subStep === 'details' && (
        <div className="space-y-6">
          {/* Postes visés */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Quel(s) poste(s) tu vises&nbsp;?
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex : Product Manager, UX Designer..."
                value={jobTitleInput}
                onChange={(e) => setJobTitleInput(e.target.value)}
                onKeyDown={handleKeyDown(addJobTitle)}
                onBlur={addJobTitle}
                className="h-12 rounded-full flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addJobTitle} className="h-12 w-12 rounded-full flex-shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {jobTitlesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {jobTitlesList.map((title) => (
                  <button key={title} type="button" onClick={() => onUpdate({ job_titles: jobTitlesList.filter((t) => t !== title) })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors">
                    {title} <X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secteurs */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Dans quel(s) secteur(s)&nbsp;?
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex : Tech, Santé, Finance..."
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyDown={handleKeyDown(addIndustry)}
                onBlur={addIndustry}
                className="h-12 rounded-full flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addIndustry} className="h-12 w-12 rounded-full flex-shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {industriesList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {industriesList.map((sector) => (
                  <button key={sector} type="button" onClick={() => onUpdate({ industries: industriesList.filter((i) => i !== sector) })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors">
                    {sector} <X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Salaire + Télétravail */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-base font-semibold">Quel salaire tu vises&nbsp;?</Label>
              <Select value={data.salary_range ?? ''} onValueChange={(value) => onUpdate({ salary_range: value })}>
                <SelectTrigger className="w-full !h-12 rounded-full">
                  <SelectValue placeholder="Ta fourchette" />
                </SelectTrigger>
                <SelectContent>
                  {SALARY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-semibold">Tu préfères travailler comment&nbsp;?</Label>
              <Select value={data.remote_preference ?? ''} onValueChange={(value) => onUpdate({ remote_preference: value })}>
                <SelectTrigger className="w-full !h-12 rounded-full">
                  <SelectValue placeholder="Télétravail" />
                </SelectTrigger>
                <SelectContent>
                  {REMOTE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Où tu veux travailler&nbsp;?
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex : Paris, Lyon..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyDown={handleKeyDown(addLocation)}
                onBlur={addLocation}
                className="h-12 rounded-full flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addLocation} className="h-12 w-12 rounded-full flex-shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            {locationsList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {locationsList.map((loc) => (
                  <button key={loc} type="button" onClick={() => onUpdate({ locations: locationsList.filter((l) => l !== loc) })}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors">
                    {loc} <X className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-10">
        <Button
          onClick={handleNext}
          disabled={subStep === 'vision' ? !canContinueVision : !canContinueDetails}
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60"
        >
          Suivant
        </Button>
      </div>
    </div>
  )
}
