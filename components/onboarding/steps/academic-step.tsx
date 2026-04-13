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
import { ArrowLeft, Plus, X } from 'lucide-react'
import type { OnboardingData } from '../onboarding-flow'

interface AcademicStepProps {
  data: OnboardingData['academic']
  onUpdate: (updates: Partial<OnboardingData['academic']>) => void
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

export function AcademicStep({ data, onUpdate, onNext, onPrev }: AcademicStepProps) {
  const [fieldInput, setFieldInput] = useState('')

  const addField = () => {
    const value = fieldInput.trim()
    if (!value) return
    if (data.field_of_study.includes(value)) {
      setFieldInput('')
      return
    }
    onUpdate({ field_of_study: [...data.field_of_study, value] })
    setFieldInput('')
  }

  const removeField = (value: string) => {
    onUpdate({
      field_of_study: data.field_of_study.filter((f) => f !== value),
    })
  }

  const handleFieldKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addField()
    }
  }

  // graduation_date est stocké en YYYY-MM-DD
  const graduationYear = data.graduation_date ? data.graduation_date.slice(0, 4) : ''
  const graduationMonthNum = data.graduation_date ? data.graduation_date.slice(5, 7) : ''

  const handleGraduationMonthChange = (month: string) => {
    const year = graduationYear || new Date().getFullYear().toString()
    onUpdate({ graduation_date: `${year}-${month}-01` })
  }
  const handleGraduationYearChange = (year: string) => {
    const month = graduationMonthNum || '01'
    onUpdate({ graduation_date: `${year}-${month}-01` })
  }

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
  const currentYear = new Date().getFullYear()
  const maxYear = 2030
  const years = Array.from({ length: maxYear - (currentYear - 50) + 1 }, (_, i) => String(maxYear - i))

  const canContinue =
    !!data.education_level &&
    !!data.graduation_date &&
    data.diploma_name.trim().length > 0 &&
    data.school_name.trim().length > 0 &&
    data.field_of_study.length > 0

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
          Quel est ton parcours&nbsp;?
          <br />
          Raconte-nous tout&nbsp;!
        </h1>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="education-level">Niveau d&apos;étude :</Label>
            <Select
              value={data.education_level}
              onValueChange={(value) => onUpdate({ education_level: value })}
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
            value={data.diploma_name}
            onChange={(e) => onUpdate({ diploma_name: e.target.value })}
            className="h-12 rounded-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="school-name">Établissement :</Label>
          <Input
            id="school-name"
            placeholder="Université de la Vie"
            value={data.school_name}
            onChange={(e) => onUpdate({ school_name: e.target.value })}
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
          {data.field_of_study.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {data.field_of_study.map((field) => (
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
