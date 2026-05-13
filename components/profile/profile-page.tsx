'use client'

import { useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FeelingLogo } from '@/components/feeling-logo'
import { Footer } from '@/components/footer'
import {
  ArrowLeft,
  Pencil,
  X,
  Plus,
  Check,
  ChevronRight,
  Trash2,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const EDUCATION_LEVELS = [
  { value: 'bac', label: 'BAC' },
  { value: 'bac+2', label: 'BAC +2' },
  { value: 'bac+3', label: 'BAC +3' },
  { value: 'bac+4', label: 'BAC +4' },
  { value: 'bac+5', label: 'BAC +5' },
  { value: 'bac+8', label: 'BAC +8' },
]

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
const YEARS = Array.from({ length: CURRENT_YEAR - 1970 + 10 }, (_, i) =>
  String(CURRENT_YEAR + 9 - i)
)

const AVAILABLE_TRAITS = [
  { value: 'curious', label: 'Curieux' },
  { value: 'rigorous', label: 'Rigoureux' },
  { value: 'empathetic', label: 'Empathique' },
  { value: 'creative', label: 'Créatif' },
  { value: 'leader', label: 'Leadership' },
  { value: 'autonomous', label: 'Autonome' },
  { value: 'analytical', label: 'Analytique' },
  { value: 'communicator', label: 'Communicant' },
  { value: 'resilient', label: 'Résilient' },
  { value: 'organized', label: 'Organisé' },
  { value: 'collaborative', label: 'Collaboratif' },
  { value: 'adaptable', label: 'Adaptable' },
]

const TEST_TYPES = [
  { value: 'mbti', label: 'MBTI (16 personnalités)' },
  { value: 'disc', label: 'DISC' },
  { value: 'big_five', label: 'Big Five / OCEAN' },
  { value: 'enneagram', label: 'Ennéagramme' },
  { value: 'other', label: 'Autre' },
]

const VALUE_OPTIONS = [
  { value: 'impact_concret', label: 'Avoir un impact concret' },
  { value: 'ambiance_equipe', label: "Bonne ambiance d'équipe" },
  { value: 'horaires_flexibles', label: 'Horaires flexibles' },
  { value: 'apprendre_continu', label: 'Apprendre en continu' },
  { value: 'sens_travail', label: 'Sens du travail' },
  { value: 'evoluer_rapidement', label: 'Évoluer rapidement' },
  { value: 'temps_pour_soi', label: 'Temps pour soi' },
  { value: 'autonomie', label: 'Autonomie' },
  { value: 'travail_equipe', label: 'Travail en équipe' },
  { value: 'initiatives', label: 'Initiatives' },
]

const DEALBREAKER_OPTIONS = [
  { value: 'management_autoritaire', label: 'Management autoritaire' },
  { value: 'pas_evolution', label: "Pas d'évolution" },
  { value: 'mauvaise_ambiance', label: "Mauvaise ambiance" },
  { value: 'travail_repetitif', label: 'Travail répétitif' },
  { value: 'aucune_reconnaissance', label: 'Aucune reconnaissance' },
  { value: 'manque_sens', label: 'Manque de sens' },
  { value: 'forte_pression', label: 'Forte pression' },
  { value: 'pas_feedback', label: 'Pas de feedback' },
  { value: 'pas_flexibilite', label: 'Pas de flexibilité' },
  { value: 'heures_sup', label: 'Heures supplémentaires' },
]

const SITUATION_OPTIONS = [
  { value: 'job_seeking', label: 'En recherche d\'emploi' },
  { value: 'employed', label: 'En poste' },
  { value: 'student', label: 'En études' },
]

const JOB_SEARCH_TYPES = [
  { value: 'cdi', label: 'CDI' },
  { value: 'cdd', label: 'CDD' },
  { value: 'alternance', label: 'Alternance' },
]

const SALARY_OPTIONS = [
  { value: 'less_30k', label: 'Moins de 30k €' },
  { value: '30_40k', label: '30 - 40k €' },
  { value: '40_50k', label: '40 - 50k €' },
  { value: '50_60k', label: '50 - 60k €' },
  { value: '60_80k', label: '60 - 80k €' },
  { value: '80_100k', label: '80 - 100k €' },
  { value: 'more_100k', label: 'Plus de 100k €' },
  { value: 'no_preference', label: 'Pas de préférence' },
]

const REMOTE_OPTIONS = [
  { value: 'full_remote', label: 'Full remote' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'onsite', label: 'Présentiel' },
  { value: 'flexible', label: 'Flexible' },
]

// ─── Helper ───────────────────────────────────────────────────────────────────

const getMonth = (date: string) => date?.split('-')[1] ?? ''
const getYear = (date: string) => date?.split('-')[0] ?? ''
const buildDate = (year: string, month: string) =>
  year || month ? `${year}-${month}` : ''
const isValidDate = (date: string) => /^\d{4}-\d{2}$/.test(date)

function formatMonthYear(date: string | null | undefined): string {
  if (!date) return '—'
  const parts = date.split('-')
  const year = parts[0]
  const month = parts[1]
  if (!year || !month) return date
  const m = MONTHS.find((x) => x.value === month)
  return m ? `${m.label} ${year}` : `${month}/${year}`
}

function labelOf<T extends { value: string; label: string }>(
  list: T[],
  value: string | null | undefined
): string {
  return list.find((x) => x.value === value)?.label ?? value ?? '—'
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  isEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  children,
}: {
  title: string
  icon: React.ReactNode
  isEditing: boolean
  isSaving: boolean
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <span className="text-primary">{icon}</span>
          <h2 className="font-semibold text-base">{title}</h2>
        </div>
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={onEdit} className="gap-1.5 text-muted-foreground">
            <Pencil className="w-3.5 h-3.5" />
            Modifier
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isSaving}>
              Annuler
            </Button>
            <Button size="sm" onClick={onSave} disabled={isSaving} className="gap-1.5">
              {isSaving ? (
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Enregistrer
            </Button>
          </div>
        )}
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  )
}

// ─── Chip display ─────────────────────────────────────────────────────────────

function Chips({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'red' }) {
  if (!items.length) return <span className="text-muted-foreground text-sm">—</span>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className={cn(
            'text-sm px-3 py-1 rounded-full',
            variant === 'red' ? 'bg-destructive/10 text-destructive' : 'bg-primary/20 text-foreground'
          )}
        >
          {item}
        </span>
      ))}
    </div>
  )
}

// ─── Chip input ───────────────────────────────────────────────────────────────

function ChipInput({
  items,
  onChange,
  placeholder,
}: {
  items: string[]
  onChange: (items: string[]) => void
  placeholder: string
}) {
  const [input, setInput] = useState('')

  const add = () => {
    const val = input.trim()
    if (val && !items.includes(val)) onChange([...items, val])
    setInput('')
  }

  const remove = (item: string) => onChange(items.filter((x) => x !== item))

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => remove(item)}
              className="inline-flex items-center gap-1.5 bg-primary/20 text-foreground text-sm px-3 py-1 rounded-full hover:bg-destructive/20 transition-colors"
            >
              {item}
              <X className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Toggle chip picker ───────────────────────────────────────────────────────

function TogglePicker({
  options,
  selected,
  max,
  onChange,
  variant = 'default',
}: {
  options: { value: string; label: string }[]
  selected: string[]
  max: number
  onChange: (v: string[]) => void
  variant?: 'default' | 'red'
}) {
  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((v) => v !== val))
    } else {
      if (selected.length >= max) {
        toast.error(`Maximum ${max} sélection${max > 1 ? 's' : ''}`)
        return
      }
      onChange([...selected, val])
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt.value)
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => toggle(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 pl-3 pr-2.5 py-2 rounded-full border-2 text-sm font-medium transition-all',
              active
                ? variant === 'red'
                  ? 'border-destructive bg-destructive/15 text-destructive'
                  : 'border-primary bg-primary/30'
                : 'border-border bg-background hover:border-primary/50'
            )}
          >
            {opt.label}
            {active ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          </button>
        )
      })}
    </div>
  )
}

// ─── Work experience types ────────────────────────────────────────────────────

interface WorkExperience {
  job_title: string
  company_name: string
  location: string
  start_date: string
  end_date: string
  is_current: boolean
  main_tasks: string
}

const emptyExp = (): WorkExperience => ({
  job_title: '',
  company_name: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  main_tasks: '',
})

// ─── Props ────────────────────────────────────────────────────────────────────

interface ProfilePageProps {
  userId: string
  profile: { first_name: string | null; last_name: string | null; email: string | null } | null
  situation: { situations: string[]; job_search_types: string[] } | null
  academic: {
    education_level: string | null
    graduation_date: string | null
    diploma_name: string | null
    school_name: string | null
    field_of_study: string[]
  } | null
  personality: {
    traits: string[]
    has_taken_test: boolean
    test_type: string | null
    test_result: string | null
    test_answers: Record<string, number>
  } | null
  values: { selected_values: string[]; dealbreakers: string[] } | null
  dreamJob: {
    job_titles: string[]
    locations: string[]
    location_radius: number
    industries: string[]
    salary_range: string | null
    remote_preference: string | null
  } | null
  skills: string[]
  experiences: WorkExperience[]
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ProfilePage({
  userId,
  profile,
  situation,
  academic,
  personality,
  values,
  dreamJob,
  skills: initialSkills,
  experiences: initialExperiences,
}: ProfilePageProps) {
  const router = useRouter()

  // ── Info section state ──
  const [editInfo, setEditInfo] = useState(false)
  const [savingInfo, setSavingInfo] = useState(false)
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')

  // ── Situation section state ──
  const [editSit, setEditSit] = useState(false)
  const [savingSit, setSavingSit] = useState(false)
  const [situations, setSituations] = useState<string[]>(situation?.situations ?? [])
  const [jobSearchTypes, setJobSearchTypes] = useState<string[]>(situation?.job_search_types ?? [])

  // ── Academic section state ──
  const [editAcad, setEditAcad] = useState(false)
  const [savingAcad, setSavingAcad] = useState(false)
  const [educationLevel, setEducationLevel] = useState(academic?.education_level ?? '')
  const [graduationDate, setGraduationDate] = useState(academic?.graduation_date ?? '')
  const [diplomaName, setDiplomaName] = useState(academic?.diploma_name ?? '')
  const [schoolName, setSchoolName] = useState(academic?.school_name ?? '')
  const [fieldOfStudy, setFieldOfStudy] = useState<string[]>(academic?.field_of_study ?? [])

  // ── Personality section state ──
  const [editPerso, setEditPerso] = useState(false)
  const [savingPerso, setSavingPerso] = useState(false)
  const [traits, setTraits] = useState<string[]>(personality?.traits ?? [])
  const [hasTakenTest, setHasTakenTest] = useState(personality?.has_taken_test ?? false)
  const [testType, setTestType] = useState(personality?.test_type ?? '')
  const [testResult, setTestResult] = useState(personality?.test_result ?? '')

  // ── Values section state ──
  const [editVal, setEditVal] = useState(false)
  const [savingVal, setSavingVal] = useState(false)
  const [selectedValues, setSelectedValues] = useState<string[]>(values?.selected_values ?? [])
  const [dealbreakers, setDealbreakers] = useState<string[]>(values?.dealbreakers ?? [])

  // ── Dream job section state ──
  const [editDream, setEditDream] = useState(false)
  const [savingDream, setSavingDream] = useState(false)
  const [jobTitles, setJobTitles] = useState<string[]>(dreamJob?.job_titles ?? [])
  const [dreamLocations, setDreamLocations] = useState<string[]>(dreamJob?.locations ?? [])
  const [industries, setIndustries] = useState<string[]>(dreamJob?.industries ?? [])
  const [salaryRange, setSalaryRange] = useState(dreamJob?.salary_range ?? '')
  const [remotePreference, setRemotePreference] = useState(dreamJob?.remote_preference ?? '')

  // ── Technical section state ──
  const [editTech, setEditTech] = useState(false)
  const [savingTech, setSavingTech] = useState(false)
  const [skills, setSkills] = useState<string[]>(initialSkills)
  const [skillInput, setSkillInput] = useState('')
  const [experiences, setExperiences] = useState<WorkExperience[]>(
    initialExperiences.length > 0 ? initialExperiences : []
  )

  // ─── Save helpers ─────────────────────────────────────────────────────────

  const save = async (
    url: string,
    body: Record<string, unknown>,
    setSaving: (v: boolean) => void,
    setEdit: (v: boolean) => void
  ) => {
    setSaving(true)
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success('Sauvegardé !')
      setEdit(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveInfo = () =>
    save('/api/profile/info', { first_name: firstName, last_name: lastName }, setSavingInfo, setEditInfo)

  const handleSaveSit = () =>
    save('/api/profile/situation', { situations, job_search_types: jobSearchTypes }, setSavingSit, setEditSit)

  const handleSaveAcad = () =>
    save(
      '/api/profile/academic',
      { education_level: educationLevel, graduation_date: graduationDate, diploma_name: diplomaName, school_name: schoolName, field_of_study: fieldOfStudy },
      setSavingAcad,
      setEditAcad
    )

  const handleSavePerso = () =>
    save(
      '/api/profile/personality',
      { traits, has_taken_test: hasTakenTest, test_type: testType, test_result: testResult, test_answers: personality?.test_answers ?? {} },
      setSavingPerso,
      setEditPerso
    )

  const handleSaveVal = () =>
    save('/api/profile/values', { selected_values: selectedValues, dealbreakers }, setSavingVal, setEditVal)

  const handleSaveDream = () =>
    save(
      '/api/profile/dream-job',
      { job_titles: jobTitles, locations: dreamLocations, industries, salary_range: salaryRange, remote_preference: remotePreference, location_radius: dreamJob?.location_radius ?? 0 },
      setSavingDream,
      setEditDream
    )

  const handleSaveTech = async () => {
    const filledExp = experiences.filter(
      (e) => e.job_title.trim() && e.company_name.trim() && isValidDate(e.start_date)
    )
    setSavingTech(true)
    try {
      const res = await fetch('/api/profile/technical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skills, experiences: filledExp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast.success('Profil technique sauvegardé !')
      setEditTech(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setSavingTech(false)
    }
  }

  const handleSignOut = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  // ─── Experience helpers ───────────────────────────────────────────────────

  const addExp = () => setExperiences((prev) => [...prev, emptyExp()])
  const removeExp = (i: number) => setExperiences((prev) => prev.filter((_, idx) => idx !== i))
  const updateExp = (i: number, updates: Partial<WorkExperience>) =>
    setExperiences((prev) => prev.map((e, idx) => (idx === i ? { ...e, ...updates } : e)))

  // ─── Skill helpers ────────────────────────────────────────────────────────

  const addSkill = () => {
    const val = skillInput.trim()
    if (val && !skills.includes(val)) setSkills((prev) => [...prev, val])
    setSkillInput('')
  }

  // ─── Graduation date helpers ──────────────────────────────────────────────

  const gradMonth = graduationDate ? graduationDate.slice(5, 7) : ''
  const gradYear = graduationDate ? graduationDate.slice(0, 4) : ''

  const setGradMonth = (m: string) => {
    const y = gradYear || CURRENT_YEAR.toString()
    setGraduationDate(`${y}-${m}-01`)
  }
  const setGradYear = (y: string) => {
    const m = gradMonth || '01'
    setGraduationDate(`${y}-${m}-01`)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const traitLabel = (v: string) => AVAILABLE_TRAITS.find((t) => t.value === v)?.label ?? v

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/accueil">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <FeelingLogo size="md" />
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
            Déconnexion
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Mon profil</h1>
          <p className="text-muted-foreground text-sm">
            Mets à jour tes informations pour affiner les analyses.
          </p>
        </div>

        <div className="space-y-4">
          {/* ── 1. Infos générales ── */}
          <Section
            title="Informations générales"
            icon={<span className="text-lg">👤</span>}
            isEditing={editInfo}
            isSaving={savingInfo}
            onEdit={() => setEditInfo(true)}
            onCancel={() => { setFirstName(profile?.first_name ?? ''); setLastName(profile?.last_name ?? ''); setEditInfo(false) }}
            onSave={handleSaveInfo}
          >
            {!editInfo ? (
              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Prénom : </span>{profile?.first_name || '—'}</p>
                <p><span className="text-muted-foreground">Nom : </span>{profile?.last_name || '—'}</p>
                <p><span className="text-muted-foreground">Email : </span>{profile?.email || '—'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Prénom</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Prénom" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nom</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Nom" />
                </div>
              </div>
            )}
          </Section>

          {/* ── 2. Situation actuelle ── */}
          <Section
            title="Situation actuelle"
            icon={<span className="text-lg">📍</span>}
            isEditing={editSit}
            isSaving={savingSit}
            onEdit={() => setEditSit(true)}
            onCancel={() => { setSituations(situation?.situations ?? []); setJobSearchTypes(situation?.job_search_types ?? []); setEditSit(false) }}
            onSave={handleSaveSit}
          >
            {!editSit ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1.5">Situation :</span>
                  <Chips items={situations.map((s) => labelOf(SITUATION_OPTIONS, s))} />
                </div>
                {jobSearchTypes.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1.5">Types de contrat :</span>
                    <Chips items={jobSearchTypes.map((t) => labelOf(JOB_SEARCH_TYPES, t))} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Situation</p>
                  <TogglePicker options={SITUATION_OPTIONS} selected={situations} max={3} onChange={setSituations} />
                </div>
                {situations.includes('job_seeking') && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Types de contrat recherchés</p>
                    <TogglePicker options={JOB_SEARCH_TYPES} selected={jobSearchTypes} max={3} onChange={setJobSearchTypes} />
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── 3. Formation académique ── */}
          <Section
            title="Formation académique"
            icon={<span className="text-lg">🎓</span>}
            isEditing={editAcad}
            isSaving={savingAcad}
            onEdit={() => setEditAcad(true)}
            onCancel={() => {
              setEducationLevel(academic?.education_level ?? '')
              setGraduationDate(academic?.graduation_date ?? '')
              setDiplomaName(academic?.diploma_name ?? '')
              setSchoolName(academic?.school_name ?? '')
              setFieldOfStudy(academic?.field_of_study ?? [])
              setEditAcad(false)
            }}
            onSave={handleSaveAcad}
          >
            {!editAcad ? (
              <div className="space-y-1.5 text-sm">
                <p><span className="text-muted-foreground">Niveau : </span>{labelOf(EDUCATION_LEVELS, academic?.education_level)}</p>
                <p><span className="text-muted-foreground">Diplôme : </span>{academic?.diploma_name || '—'}</p>
                <p><span className="text-muted-foreground">Établissement : </span>{academic?.school_name || '—'}</p>
                <p><span className="text-muted-foreground">Obtenu en : </span>{formatMonthYear(academic?.graduation_date)}</p>
                {academic?.field_of_study?.length ? (
                  <div>
                    <span className="text-muted-foreground">Domaines : </span>
                    <Chips items={academic.field_of_study} />
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Niveau d'étude</label>
                    <Select value={educationLevel} onValueChange={setEducationLevel}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date d'obtention</label>
                    <div className="flex gap-1.5">
                      <Select value={gradMonth} onValueChange={setGradMonth}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Mois" /></SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={gradYear} onValueChange={setGradYear}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Année" /></SelectTrigger>
                        <SelectContent>
                          {YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nom du diplôme</label>
                  <Input value={diplomaName} onChange={(e) => setDiplomaName(e.target.value)} placeholder="Ex : Master en marketing" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Établissement</label>
                  <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Ex : Université Paris-Dauphine" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Domaines d'étude</label>
                  <ChipInput items={fieldOfStudy} onChange={setFieldOfStudy} placeholder="Ex : Informatique (Entrée pour valider)" />
                </div>
              </div>
            )}
          </Section>

          {/* ── 4. Personnalité ── */}
          <Section
            title="Personnalité"
            icon={<span className="text-lg">🧠</span>}
            isEditing={editPerso}
            isSaving={savingPerso}
            onEdit={() => setEditPerso(true)}
            onCancel={() => {
              setTraits(personality?.traits ?? [])
              setHasTakenTest(personality?.has_taken_test ?? false)
              setTestType(personality?.test_type ?? '')
              setTestResult(personality?.test_result ?? '')
              setEditPerso(false)
            }}
            onSave={handleSavePerso}
          >
            {!editPerso ? (
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1.5">Traits dominants :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {traits.length > 0
                      ? traits.map((t, i) => (
                          <span key={t} className="inline-flex items-center gap-1.5 bg-primary/20 text-foreground text-sm px-3 py-1 rounded-full">
                            <span className="text-xs text-muted-foreground font-mono">{['50%', '30%', '20%'][i]}</span>
                            {traitLabel(t)}
                          </span>
                        ))
                      : <span className="text-muted-foreground">—</span>}
                  </div>
                </div>
                {personality?.has_taken_test && (
                  <div>
                    <span className="text-muted-foreground">Test : </span>
                    {labelOf(TEST_TYPES, personality.test_type)} — {personality.test_result || '—'}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Traits dominants (max 3, ordre = poids)</p>
                  <TogglePicker options={AVAILABLE_TRAITS} selected={traits} max={3} onChange={setTraits} />
                  {traits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {traits.map((t, i) => (
                        <span key={t} className="inline-flex items-center gap-1 bg-primary/20 text-sm px-3 py-1 rounded-full">
                          <span className="text-xs text-muted-foreground font-mono">{['50%', '30%', '20%'][i]}</span>
                          {traitLabel(t)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasTakenTest}
                    onChange={(e) => setHasTakenTest(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">J'ai déjà passé un test de personnalité</span>
                </label>
                {hasTakenTest && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Type de test</label>
                      <Select value={testType} onValueChange={setTestType}>
                        <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                        <SelectContent>
                          {TEST_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Résultat</label>
                      <Input value={testResult} onChange={(e) => setTestResult(e.target.value)} placeholder="Ex : INFJ, Promoteur..." />
                    </div>
                  </div>
                )}
              </div>
            )}
          </Section>

          {/* ── 5. Valeurs & Rédhibitoires ── */}
          <Section
            title="Valeurs & Rédhibitoires"
            icon={<span className="text-lg">💎</span>}
            isEditing={editVal}
            isSaving={savingVal}
            onEdit={() => setEditVal(true)}
            onCancel={() => {
              setSelectedValues(values?.selected_values ?? [])
              setDealbreakers(values?.dealbreakers ?? [])
              setEditVal(false)
            }}
            onSave={handleSaveVal}
          >
            {!editVal ? (
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm block mb-1.5">Ce qui compte :</span>
                  <Chips items={selectedValues.map((v) => labelOf(VALUE_OPTIONS, v))} />
                </div>
                <div>
                  <span className="text-muted-foreground text-sm block mb-1.5">Rédhibitoires :</span>
                  <Chips items={dealbreakers.map((d) => labelOf(DEALBREAKER_OPTIONS, d))} variant="red" />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Ce qui compte pour toi (max 3)</p>
                  <TogglePicker options={VALUE_OPTIONS} selected={selectedValues} max={3} onChange={setSelectedValues} />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Rédhibitoires (max 3)</p>
                  <TogglePicker options={DEALBREAKER_OPTIONS} selected={dealbreakers} max={3} onChange={setDealbreakers} variant="red" />
                </div>
              </div>
            )}
          </Section>

          {/* ── 6. Poste idéal ── */}
          <Section
            title="Poste idéal"
            icon={<span className="text-lg">🎯</span>}
            isEditing={editDream}
            isSaving={savingDream}
            onEdit={() => setEditDream(true)}
            onCancel={() => {
              setJobTitles(dreamJob?.job_titles ?? [])
              setDreamLocations(dreamJob?.locations ?? [])
              setIndustries(dreamJob?.industries ?? [])
              setSalaryRange(dreamJob?.salary_range ?? '')
              setRemotePreference(dreamJob?.remote_preference ?? '')
              setEditDream(false)
            }}
            onSave={handleSaveDream}
          >
            {!editDream ? (
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground block mb-1.5">Postes visés :</span>
                  <Chips items={jobTitles} />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <p><span className="text-muted-foreground">Salaire : </span>{labelOf(SALARY_OPTIONS, dreamJob?.salary_range)}</p>
                  <p><span className="text-muted-foreground">Télétravail : </span>{labelOf(REMOTE_OPTIONS, dreamJob?.remote_preference)}</p>
                </div>
                {dreamLocations.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1.5">Villes :</span>
                    <Chips items={dreamLocations} />
                  </div>
                )}
                {industries.length > 0 && (
                  <div>
                    <span className="text-muted-foreground block mb-1.5">Secteurs :</span>
                    <Chips items={industries} />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Postes visés</label>
                  <ChipInput items={jobTitles} onChange={setJobTitles} placeholder="Ex : Product Manager" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Salaire souhaité</label>
                    <Select value={salaryRange} onValueChange={setSalaryRange}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {SALARY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Télétravail</label>
                    <Select value={remotePreference} onValueChange={setRemotePreference}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {REMOTE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Villes</label>
                  <ChipInput items={dreamLocations} onChange={setDreamLocations} placeholder="Ex : Paris, Lyon..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Secteurs d'activité</label>
                  <ChipInput items={industries} onChange={setIndustries} placeholder="Ex : Tech, Finance..." />
                </div>
              </div>
            )}
          </Section>

          {/* ── 7. Profil technique ── */}
          <Section
            title="Profil technique"
            icon={<span className="text-lg">💼</span>}
            isEditing={editTech}
            isSaving={savingTech}
            onEdit={() => setEditTech(true)}
            onCancel={() => {
              setSkills(initialSkills)
              setSkillInput('')
              setExperiences(initialExperiences.length > 0 ? initialExperiences : [])
              setEditTech(false)
            }}
            onSave={handleSaveTech}
          >
            {!editTech ? (
              <div className="space-y-3">
                <div>
                  <span className="text-muted-foreground text-sm block mb-1.5">Compétences :</span>
                  <Chips items={skills} />
                </div>
                {experiences.length > 0 && (
                  <div>
                    <span className="text-muted-foreground text-sm block mb-2">Expériences :</span>
                    <div className="space-y-2">
                      {experiences.map((exp, i) => (
                        <div key={i} className="text-sm border border-border rounded-xl px-3 py-2">
                          <p className="font-medium">{exp.job_title || '—'} — {exp.company_name || '—'}</p>
                          <p className="text-muted-foreground text-xs">
                            {formatMonthYear(exp.start_date)} → {exp.is_current ? 'Présent' : formatMonthYear(exp.end_date)}
                            {exp.location ? ` · ${exp.location}` : ''}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5">
                {/* Skills */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Compétences techniques</p>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                      onBlur={addSkill}
                      placeholder="Ex : React, Python... (Entrée pour valider)"
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="icon" onClick={addSkill}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {skills.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setSkills((prev) => prev.filter((x) => x !== s))}
                          className="inline-flex items-center gap-1.5 bg-primary/20 text-sm px-3 py-1 rounded-full hover:bg-destructive/20 transition-colors"
                        >
                          {s} <X className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Experiences */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Expériences professionnelles</p>
                    <Button type="button" variant="outline" size="sm" onClick={addExp}>
                      <Plus className="w-3.5 h-3.5 mr-1" />Ajouter
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {experiences.map((exp, i) => (
                      <div key={i} className="rounded-xl border border-border bg-muted/20 p-4 space-y-3 relative">
                        {experiences.length > 0 && (
                          <button
                            type="button"
                            onClick={() => removeExp(i)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Poste *</label>
                            <Input value={exp.job_title} onChange={(e) => updateExp(i, { job_title: e.target.value })} placeholder="Développeur Frontend" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Entreprise *</label>
                            <Input value={exp.company_name} onChange={(e) => updateExp(i, { company_name: e.target.value })} placeholder="Acme Corp" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Lieu</label>
                          <Input value={exp.location} onChange={(e) => updateExp(i, { location: e.target.value })} placeholder="Paris, Remote..." />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Début *</label>
                            <div className="flex gap-1">
                              <Select value={getMonth(exp.start_date)} onValueChange={(m) => updateExp(i, { start_date: buildDate(getYear(exp.start_date), m) })}>
                                <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Mois" /></SelectTrigger>
                                <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={getYear(exp.start_date)} onValueChange={(y) => updateExp(i, { start_date: buildDate(y, getMonth(exp.start_date)) })}>
                                <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Année" /></SelectTrigger>
                                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className={cn('space-y-1', exp.is_current && 'opacity-50 pointer-events-none')}>
                            <label className="text-xs text-muted-foreground">Fin</label>
                            <div className="flex gap-1">
                              <Select value={getMonth(exp.end_date)} disabled={exp.is_current} onValueChange={(m) => updateExp(i, { end_date: buildDate(getYear(exp.end_date), m) })}>
                                <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Mois" /></SelectTrigger>
                                <SelectContent>{MONTHS.map((m) => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                              </Select>
                              <Select value={getYear(exp.end_date)} disabled={exp.is_current} onValueChange={(y) => updateExp(i, { end_date: buildDate(y, getMonth(exp.end_date)) })}>
                                <SelectTrigger className="flex-1 h-9"><SelectValue placeholder="Année" /></SelectTrigger>
                                <SelectContent>{YEARS.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input type="checkbox" checked={exp.is_current} onChange={(e) => updateExp(i, { is_current: e.target.checked, end_date: '' })} className="w-4 h-4 rounded" />
                          Poste actuel
                        </label>
                        <div className="space-y-1">
                          <label className="text-xs text-muted-foreground">Missions principales</label>
                          <Textarea value={exp.main_tasks} onChange={(e) => updateExp(i, { main_tasks: e.target.value })} placeholder="Responsabilités et réalisations..." rows={2} className="resize-none" />
                        </div>
                      </div>
                    ))}
                    {experiences.length === 0 && (
                      <button type="button" onClick={addExp} className="w-full border border-dashed border-border rounded-xl py-6 text-sm text-muted-foreground hover:border-primary/50 transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Ajouter une expérience
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
