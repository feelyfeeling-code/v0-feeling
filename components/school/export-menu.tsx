'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Download, FileText, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import { MEMBER_STATUS_LABELS } from '@/lib/school/labels'

interface Graduate {
  full_name: string
  email: string | null
  program: string | null
  graduation_date: string | null
  status: string
  application_count: number
  pending_coaching: number
  average_score: number | null
}

export function ExportMenu() {
  const [loading, setLoading] = useState(false)

  async function fetchGraduates(): Promise<Graduate[]> {
    const res = await fetch('/api/school/graduates')
    if (!res.ok) throw new Error('fetch failed')
    const json = await res.json()
    return json.graduates ?? []
  }

  async function exportCsv() {
    setLoading(true)
    try {
      const graduates = await fetchGraduates()
      const headers = [
        'Nom',
        'Email',
        'Formation',
        "Date d'obtention",
        'Statut',
        'Candidatures',
        'Demandes coaching',
        'Score moyen',
      ]
      const rows = graduates.map((g) => [
        g.full_name,
        g.email ?? '',
        g.program ?? '',
        g.graduation_date ?? '',
        MEMBER_STATUS_LABELS[g.status] ?? g.status,
        String(g.application_count),
        String(g.pending_coaching),
        g.average_score != null ? String(g.average_score) : '',
      ])
      const csv = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n')
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `diplomes-feeling-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Export CSV téléchargé')
    } catch {
      toast.error("Échec de l'export")
    } finally {
      setLoading(false)
    }
  }

  function exportPdf() {
    // Impression navigateur -> "Enregistrer en PDF"
    toast.info('Utilisez la boîte de dialogue pour enregistrer en PDF')
    window.print()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          <Download className="w-4 h-4" />
          {loading ? 'Export...' : 'Exporter'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCsv}>
          <FileSpreadsheet className="w-4 h-4" />
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportPdf}>
          <FileText className="w-4 h-4" />
          PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
