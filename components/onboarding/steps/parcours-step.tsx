'use client'

import { useState, type KeyboardEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeelyMascot } from '@/components/feely-mascot'
import { ArrowLeft, Plus, X, Briefcase, GraduationCap, Search, Check } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface ParcoursStepProps {
  academicData: OnboardingData['academic']
  situationData: OnboardingData['situation']
  onUpdateAcademic: (updates: Partial<OnboardingData['academic']>) => void
  onUpdateSituation: (updates: Partial<OnboardingData['situation']>) => void
  onNext: () => void
  onPrev: () => void
}

const educationLevels = [
  { value: 'bac', label: 'BAC' },
  { value: 'bac+2', label: 'BAC +2' },
  { value: 'bac+3', label: 'BAC +3' },
  { value: 'bac+4', label: 'BAC +4' },
  { value: 'bac+5', label: 'BAC +5' },
  { value: 'bac+8', label: 'BAC +8' },
]

const months = [
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

type SituationKey = 'job_seeking' | 'employed' | 'student'

const situationCards: { value: SituationKey; label: string; icon: typeof Briefcase }[] = [
  { value: 'job_seeking', label: 'En recherche', icon: Search },
  { value: 'employed', label: 'En poste', icon: Briefcase },
  { value: 'student', label: 'En études', icon: GraduationCap },
]

const contractTypes = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'alternance', label: 'Alternance' },
]

export function ParcoursStep({
  academicData,
  situationData,
  onUpdateAcademic,
  onUpdateSituation,
  onNext,
  onPrev,
}: ParcoursStepProps) {
  const [fieldInput, setFieldInput] = useState('')

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 2030 - (currentYear - 50) + 1 }, (_, i) => String(2030 - i))

  const graduationYear = academicData.graduation_date ? academicData.graduation_date.slice(0, 4) : ''
  const graduationMonthNum = academicData.graduation_date ? academicData.graduation_date.slice(5, 7) : ''

  const handleGraduationMonthChange = (month: string) => {
    const year = graduationYear || new Date().getFullYear().toString()
    onUpdateAcademic({ graduation_date: `${year}-${month}-01` })
  }

  const handleGraduationYearChange = (year: string) => {
    const month = graduationMonthNum || '01'
    onUpdateAcademic({ graduation_date: `${year}-${month}-01` })
  }

  const addField = () => {
    const value = fieldInput.trim()
    if (!value) return
    if (academicData.field_of_study.includes(value)) {
      setFieldInput('')
      return
    }
    onUpdateAcademic({ field_of_study: [...academicData.field_of_study, value] })
    setFieldInput('')
  }

  const removeField = (value: string) => {
    onUpdateAcademic({ field_of_study: academicData.field_of_study.filter((f) => f !== value) })
  }

  const handleFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addField()
    }
  }

  const isSituationSelected = (key: SituationKey) => situationData.situations.includes(key)

  const toggleSituation = (key: SituationKey) => {
    if (isSituationSelected(key)) {
      const nextSituations = situationData.situations.filter((s) => s !== key)
      const nextSearchTypes = key === 'job_seeking' ? [] : situationData.job_search_types
      onUpdateSituation({ situations: nextSituations, job_search_types: nextSearchTypes })
    } else {
      onUpdateSituation({ situations: [...situationData.situations, key] })
    }
  }

  const toggleContract = (value: string) => {
    const already = situationData.job_search_types.includes(value)
    onUpdateSituation({
      job_search_types: already
        ? situationData.job_search_types.filter((t) => t !== value)
        : [...situationData.job_search_types, value],
    })
  }

  const isSearching = isSituationSelected('job_seeking')

  const canContinue =
    !!academicData.education_level &&
    !!academicData.graduation_date &&
    academicData.diploma_name.trim().length > 0 &&
    academicData.school_name.trim().length > 0 &&
    situationData.situations.length > 0 &&
    (!isSearching || situationData.job_search_types.length > 0)

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
          Ton parcours
        </h1>
      </div>

      {/* --- Parcours académique --- */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="education-level">Niveau d&apos;étude :</Label>
            <Select
              value={academicData.education_level}
              onValueChange={(value) => onUpdateAcademic({ education_level: value })}
            >
              <SelectTrigger id="education-level" className="w-full !h-12 rounded-full">
                <SelectValue placeholder="Sélectionner" />
              </SelectTrigger>
              <SelectContent>
                {educationLevels.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date d&apos;obtention :</Label>
            <div className="flex gap-2">
              <Select value={graduationMonthNum} onValueChange={handleGraduationMonthChange}>
                <SelectTrigger className="flex-1 !h-12 rounded-full">
                  <SelectValue placeholder="Mois" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={graduationYear} onValueChange={handleGraduationYearChange}>
                <SelectTrigger className="flex-1 !h-12 rounded-full">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diploma-name">Nom du diplôme :</Label>
          <Input
            id="diploma-name"
            placeholder="Master Feeling Good"
            value={academicData.diploma_name}
            onChange={(e) => onUpdateAcademic({ diploma_name: e.target.value })}
            className="h-12 rounded-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="school-name">Établissement :</Label>
          <Input
            id="school-name"
            placeholder="Université de la Vie"
            value={academicData.school_name}
            onChange={(e) => onUpdateAcademic({ school_name: e.target.value })}
            className="h-12 rounded-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="field-of-study">Domaine(s) d&apos;étude :</Label>
          <div className="flex gap-2">
            <Input
              id="field-of-study"
              placeholder="Ajoute-les un par un (Entrée pour valider)"
              value={fieldInput}
              onChange={(e) => setFieldInput(e.target.value)}
              onKeyDown={handleFieldKeyDown}
              onBlur={addField}
              className="h-12 rounded-full flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addField}
              aria-label="Ajouter un domaine"
              className="h-12 w-12 rounded-full flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {academicData.field_of_study.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {academicData.field_of_study.map((field) => (
                <button
                  key={field}
                  type="button"
                  onClick={() => removeField(field)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/40 text-sm font-medium hover:bg-primary/60 transition-colors"
                >
                  {field}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --- Situation actuelle --- */}
        <div className="pt-4 border-t border-border">
          <p className="text-base font-semibold mb-1">Ta situation actuelle</p>
          <p className="text-sm text-muted-foreground mb-4">Tu peux en sélectionner plusieurs</p>

          <div className="space-y-3">
            {situationCards.map((card) => {
              const Icon = card.icon
              const selected = isSituationSelected(card.value)
              const showSubOptions = card.value === 'job_seeking' && selected

              return (
                <div key={card.value}>
                  <button
                    type="button"
                    onClick={() => toggleSituation(card.value)}
                    aria-pressed={selected}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      selected
                        ? 'border-primary bg-primary/20'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        selected ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1 text-base font-semibold">{card.label}</span>
                    {selected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </button>

                  {showSubOptions && (
                    <div className="mt-2 ml-4 pl-4 border-l-2 border-primary/40">
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Tu cherches quel type de contrat ?
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {contractTypes.map((contract) => {
                          const contractSelected = situationData.job_search_types.includes(contract.value)
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
                              {contractSelected && <Check className="w-3.5 h-3.5" />}
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
        </div>
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
