'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { COACHING_TYPE_LABELS, COACHING_STATUS_LABELS } from '@/lib/school/labels'

const ALL = '__all__'

interface Advisor {
  id: string
  full_name: string
}

export function CoachingFilters({ advisors }: { advisors: Advisor[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <Select value={searchParams.get('type') ?? ALL} onValueChange={(v) => setParam('type', v)}>
        <SelectTrigger className="md:w-56">
          <SelectValue placeholder="Type de demande" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les types</SelectItem>
          {Object.entries(COACHING_TYPE_LABELS).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={searchParams.get('status') ?? ALL} onValueChange={(v) => setParam('status', v)}>
        <SelectTrigger className="md:w-44">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les statuts</SelectItem>
          {Object.entries(COACHING_STATUS_LABELS).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('advisor_id') ?? ALL}
        onValueChange={(v) => setParam('advisor_id', v)}
      >
        <SelectTrigger className="md:w-52">
          <SelectValue placeholder="Coach assigné" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les coachs</SelectItem>
          {advisors.map((a) => (
            <SelectItem key={a.id} value={a.id}>
              {a.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
