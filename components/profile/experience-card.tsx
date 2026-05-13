'use client'

import { useEffect, useRef, useState } from 'react'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Briefcase, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export const MONTHS = [
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
const MONTH_LABELS: Record<string, string> = Object.fromEntries(
  MONTHS.map((m) => [m.value, m.label])
)
const CURRENT_YEAR = new Date().getFullYear()
export const YEARS = Array.from({ length: 51 }, (_, i) => String(CURRENT_YEAR - i))

const getMonth = (date: string) => date?.split('-')[1] ?? ''
const getYear = (date: string) => date?.split('-')[0] ?? ''
const buildDate = (year: string, month: string) =>
  year || month ? `${year}-${month}` : ''
export const isValidDate = (date: string) => /^\d{4}-\d{2}$/.test(date)

function formatDate(date: string): string {
  if (!isValidDate(date)) return ''
  const [year, month] = date.split('-')
  return `${MONTH_LABELS[month] ?? ''} ${year}`.trim()
}

export interface WorkExperience {
  job_title: string
  company_name: string
  location: string
  start_date: string
  end_date: string
  is_current: boolean
  main_tasks: string
}

export const emptyExperience = (): WorkExperience => ({
  job_title: '',
  company_name: '',
  location: '',
  start_date: '',
  end_date: '',
  is_current: false,
  main_tasks: '',
})

interface ExperienceCardProps {
  experience: WorkExperience
  isNew: boolean
  onSave: (updated: WorkExperience) => Promise<void>
  onDelete: () => Promise<void>
  onCancelNew: () => void
  onEditingChange?: (isEditing: boolean) => void
}

export function ExperienceCard({
  experience,
  isNew,
  onSave,
  onDelete,
  onCancelNew,
  onEditingChange,
}: ExperienceCardProps) {
  const [isEditing, setIsEditing] = useState(isNew)
  const [draft, setDraft] = useState<WorkExperience>(experience)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  // Notifie le parent de l'état d'édition (pour bloquer la sauvegarde globale
  // tant qu'une carte est en cours d'édition). On stocke le callback dans une
  // ref pour ne déclencher l'effet qu'au changement réel d'isEditing.
  const onEditingChangeRef = useRef(onEditingChange)
  useEffect(() => {
    onEditingChangeRef.current = onEditingChange
  })
  useEffect(() => {
    onEditingChangeRef.current?.(isEditing)
    return () => {
      // Au démontage, on s'assure que la carte n'est plus marquée éditée.
      onEditingChangeRef.current?.(false)
    }
  }, [isEditing])

  const update = (updates: Partial<WorkExperience>) => {
    setDraft((d) => ({ ...d, ...updates }))
    if (error) setError(null)
  }

  const startEdit = () => {
    setDraft(experience)
    setError(null)
    setIsEditing(true)
  }

  const cancelEdit = () => {
    if (isNew) {
      onCancelNew()
      return
    }
    setDraft(experience)
    setError(null)
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!draft.job_title.trim()) {
      setError('Le poste est requis.')
      return
    }
    if (!draft.company_name.trim()) {
      setError("Le nom de l'entreprise est requis.")
      return
    }
    if (!isValidDate(draft.start_date)) {
      setError('La date de début est requise (mois et année).')
      return
    }
    if (!draft.is_current && draft.end_date && !isValidDate(draft.end_date)) {
      setError('La date de fin est incomplète.')
      return
    }
    setIsSaving(true)
    try {
      await onSave(draft)
      setIsEditing(false)
    } catch {
      // Erreur déjà notifiée via toast par le parent.
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await onDelete()
    } catch {
      // Erreur déjà notifiée via toast par le parent.
    } finally {
      setIsDeleting(false)
      setConfirmOpen(false)
    }
  }

  if (!isEditing) {
    const startLabel = formatDate(experience.start_date)
    const endLabel = experience.is_current
      ? "Aujourd'hui"
      : formatDate(experience.end_date)
    const dateRange = [startLabel, endLabel].filter(Boolean).join(' — ')

    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center shrink-0">
            <Briefcase className="w-5 h-5 text-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold leading-tight">{experience.job_title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {experience.company_name}
              {experience.location ? ` · ${experience.location}` : ''}
            </p>
            {dateRange && (
              <p className="text-xs text-muted-foreground mt-1">{dateRange}</p>
            )}
          </div>
        </div>

        {experience.main_tasks && (
          <p className="text-sm text-foreground/80 whitespace-pre-line line-clamp-3">
            {experience.main_tasks}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startEdit}
            disabled={isDeleting}
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Modifier
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette expérience ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est définitive. L&apos;expérience «&nbsp;
                {experience.job_title}
                {experience.company_name ? ` chez ${experience.company_name}` : ''}
                &nbsp;» sera supprimée.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDelete()
                }}
                disabled={isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-5 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Poste *</label>
          <Input
            placeholder="Ex : Développeur Frontend"
            value={draft.job_title}
            onChange={(e) => update({ job_title: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Entreprise *</label>
          <Input
            placeholder="Ex : Acme Corp"
            value={draft.company_name}
            onChange={(e) => update({ company_name: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Lieu</label>
        <Input
          placeholder="Ex : Paris, Remote"
          value={draft.location}
          onChange={(e) => update({ location: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date de début *</label>
          <div className="flex gap-1.5">
            <Select
              value={getMonth(draft.start_date)}
              onValueChange={(m) =>
                update({ start_date: buildDate(getYear(draft.start_date), m) })
              }
            >
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={getYear(draft.start_date)}
              onValueChange={(y) =>
                update({ start_date: buildDate(y, getMonth(draft.start_date)) })
              }
            >
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Date de fin</label>
          <div
            className={cn(
              'flex gap-1.5',
              draft.is_current && 'opacity-50 pointer-events-none'
            )}
          >
            <Select
              value={getMonth(draft.end_date)}
              disabled={draft.is_current}
              onValueChange={(m) =>
                update({ end_date: buildDate(getYear(draft.end_date), m) })
              }
            >
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={getYear(draft.end_date)}
              disabled={draft.is_current}
              onValueChange={(y) =>
                update({ end_date: buildDate(y, getMonth(draft.end_date)) })
              }
            >
              <SelectTrigger className="flex-1 h-10">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.is_current}
          onChange={(e) =>
            update({ is_current: e.target.checked, end_date: '' })
          }
          className="w-4 h-4 rounded"
        />
        <span className="text-sm">Poste actuel</span>
      </label>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Missions principales</label>
        <Textarea
          placeholder="Décris tes principales responsabilités et réalisations..."
          value={draft.main_tasks}
          onChange={(e) => update({ main_tasks: e.target.value })}
          rows={3}
          className="resize-none"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={cancelEdit}
          disabled={isSaving}
        >
          Annuler
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-foreground text-background hover:bg-foreground/90"
        >
          {isSaving ? (
            <>
              <Sparkles className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
              Enregistrement...
            </>
          ) : (
            'Enregistrer'
          )}
        </Button>
      </div>
    </div>
  )
}
