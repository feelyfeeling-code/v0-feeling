'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MEMBER_STATUS_LABELS } from '@/lib/school/labels'
import { Search } from 'lucide-react'
import { useState, useEffect } from 'react'

const ALL = '__all__'

export function GraduatesFilters({ programs }: { programs: string[] }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') ?? '')

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== ALL) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`)
  }

  // Debounce de la recherche par nom
  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get('search') ?? '') !== search) setParam('search', search)
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un diplômé..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={searchParams.get('program') ?? ALL}
        onValueChange={(v) => setParam('program', v)}
      >
        <SelectTrigger className="md:w-52">
          <SelectValue placeholder="Formation" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes les formations</SelectItem>
          {programs.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('status') ?? ALL}
        onValueChange={(v) => setParam('status', v)}
      >
        <SelectTrigger className="md:w-44">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous les statuts</SelectItem>
          {Object.entries(MEMBER_STATUS_LABELS).map(([k, label]) => (
            <SelectItem key={k} value={k}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={searchParams.get('coaching') ?? ALL}
        onValueChange={(v) => setParam('coaching', v)}
      >
        <SelectTrigger className="md:w-44">
          <SelectValue placeholder="Coaching" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toutes demandes</SelectItem>
          <SelectItem value="pending">À traiter</SelectItem>
          <SelectItem value="none">Aucune</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
