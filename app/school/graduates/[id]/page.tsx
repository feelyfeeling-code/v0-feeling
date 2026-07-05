import { createClient } from '@/lib/supabase/server'
import { requireAdvisor } from '@/lib/auth/requireAdvisor'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  MEMBER_STATUS_LABELS,
  MEMBER_STATUS_STYLES,
  COACHING_TYPE_LABELS,
  COACHING_STATUS_LABELS,
  COACHING_STATUS_STYLES,
  APPLICATION_STATUS_LABELS,
  timeAgo,
} from '@/lib/school/labels'
import { cn } from '@/lib/utils'
import {
  ArrowLeft,
  Clock,
  Send,
  CalendarCheck,
  Target,
} from 'lucide-react'

export const metadata = { title: 'Fiche diplômé - Espace École' }

export default async function GraduateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const advisor = await requireAdvisor(supabase)
  if (!advisor) redirect('/dashboard')

  const { data: member } = await supabase
    .from('school_members')
    .select('user_id, status, program, graduation_year, last_active_at, created_at')
    .eq('user_id', id)
    .eq('school_id', advisor.schoolId)
    .maybeSingle()

  if (!member) notFound()

  const [
    profileRes,
    academicRes,
    experiencesRes,
    skillsRes,
    personalityRes,
    valuesRes,
    dreamRes,
    applicationsRes,
    coachingRes,
    analysesRes,
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase.from('academic_profiles').select('*').eq('user_id', id).maybeSingle(),
    supabase
      .from('work_experiences')
      .select('*')
      .eq('user_id', id)
      .order('start_date', { ascending: false }),
    supabase.from('technical_skills').select('skills').eq('user_id', id).maybeSingle(),
    supabase.from('personality_profiles').select('traits').eq('user_id', id).maybeSingle(),
    supabase.from('values_profiles').select('selected_values, dealbreakers').eq('user_id', id).maybeSingle(),
    supabase.from('dream_jobs').select('*').eq('user_id', id).maybeSingle(),
    supabase
      .from('applications')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('coaching_requests')
      .select('*, school_advisors ( full_name )')
      .eq('user_id', id)
      .eq('school_id', advisor.schoolId)
      .order('created_at', { ascending: false }),
    supabase
      .from('job_analyses')
      .select('overall_score')
      .eq('user_id', id),
  ])

  const profile = profileRes.data
  const academic = academicRes.data
  const experiences = experiencesRes.data ?? []
  const skills = (skillsRes.data?.skills ?? []) as string[]
  const traits = (personalityRes.data?.traits ?? []) as string[]
  const selectedValues = (valuesRes.data?.selected_values ?? []) as string[]
  const dream = dreamRes.data
  const applications = applicationsRes.data ?? []
  const coachingRequests = coachingRes.data ?? []
  const analyses = analysesRes.data ?? []

  const scores = analyses
    .map((a) => a.overall_score)
    .filter((s): s is number => typeof s === 'number')
  const avgScore =
    scores.length > 0 ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null
  const interviewCount = applications.filter((a) => a.status === 'interview').length

  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim() ||
    profile?.email ||
    'Diplômé'

  const activity = [
    { label: 'Dernière connexion', value: timeAgo(member.last_active_at), icon: Clock },
    { label: 'Candidatures', value: String(applications.length), icon: Send },
    { label: 'Entretiens obtenus', value: String(interviewCount), icon: CalendarCheck },
    { label: "Score moyen d'adéquation", value: avgScore != null ? `${avgScore}` : '—', icon: Target },
  ]

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/school/graduates"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux diplômés
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold text-balance">{fullName}</h1>
          <p className="text-muted-foreground mt-1">
            {member.program || academic?.diploma_name || 'Formation non renseignée'}
          </p>
        </div>
        <span
          className={cn(
            'inline-flex px-3 py-1 rounded-full text-sm font-medium',
            MEMBER_STATUS_STYLES[member.status] ?? 'bg-muted text-muted-foreground',
          )}
        >
          {MEMBER_STATUS_LABELS[member.status] ?? member.status}
        </span>
      </div>

      {/* Activité de recherche */}
      <section>
        <h2 className="font-display text-lg font-semibold mb-3">Activité de recherche</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {activity.map((a) => (
            <Card key={a.label} className="p-4">
              <a.icon className="w-5 h-5 text-muted-foreground" />
              <p className="mt-3 text-2xl font-bold">{a.value}</p>
              <p className="text-xs text-muted-foreground">{a.label}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Profil complet */}
      <section className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Parcours académique</h3>
          {academic ? (
            <ul className="space-y-1 text-sm">
              <li>
                <span className="text-muted-foreground">Diplôme : </span>
                {academic.diploma_name}
              </li>
              <li>
                <span className="text-muted-foreground">École : </span>
                {academic.school_name}
              </li>
              <li>
                <span className="text-muted-foreground">Niveau : </span>
                {academic.education_level}
              </li>
              {member.graduation_year && (
                <li>
                  <span className="text-muted-foreground">Promotion : </span>
                  {member.graduation_year}
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Non renseigné</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Projet professionnel</h3>
          {dream && (dream.job_titles?.length || dream.locations?.length) ? (
            <ul className="space-y-1 text-sm">
              {dream.job_titles?.length > 0 && (
                <li>
                  <span className="text-muted-foreground">Postes visés : </span>
                  {dream.job_titles.join(', ')}
                </li>
              )}
              {dream.locations?.length > 0 && (
                <li>
                  <span className="text-muted-foreground">Localisations : </span>
                  {dream.locations.join(', ')}
                </li>
              )}
              {dream.industries?.length > 0 && (
                <li>
                  <span className="text-muted-foreground">Secteurs : </span>
                  {dream.industries.join(', ')}
                </li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Non renseigné</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Compétences techniques</h3>
          {skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="px-2.5 py-1 rounded-full text-xs bg-muted">
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Non renseigné</p>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-3">Traits & valeurs</h3>
          <div className="space-y-2 text-sm">
            {traits.length > 0 && (
              <p>
                <span className="text-muted-foreground">Traits : </span>
                {traits.join(', ')}
              </p>
            )}
            {selectedValues.length > 0 && (
              <p>
                <span className="text-muted-foreground">Valeurs : </span>
                {selectedValues.join(', ')}
              </p>
            )}
            {traits.length === 0 && selectedValues.length === 0 && (
              <p className="text-muted-foreground">Non renseigné</p>
            )}
          </div>
        </Card>
      </section>

      {experiences.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Expériences professionnelles</h3>
          <ul className="space-y-3">
            {experiences.map((e) => (
              <li key={e.id} className="text-sm border-l-2 border-border pl-3">
                <p className="font-medium">
                  {e.job_title} · {e.company_name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {e.start_date}
                  {e.is_current ? " → aujourd'hui" : e.end_date ? ` → ${e.end_date}` : ''}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Candidatures */}
      {applications.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-3">Candidatures</h3>
          <ul className="divide-y divide-border">
            {applications.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="font-medium">{a.job_title}</span>
                  <span className="text-muted-foreground"> · {a.company_name}</span>
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {APPLICATION_STATUS_LABELS[a.status] ?? a.status}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Historique des rendez-vous / demandes de coaching */}
      <Card className="p-5">
        <h3 className="font-semibold mb-3">Historique des rendez-vous</h3>
        {coachingRequests.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande de coaching pour ce diplômé.</p>
        ) : (
          <ul className="space-y-3">
            {coachingRequests.map((c) => (
              <li key={c.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">
                    {COACHING_TYPE_LABELS[c.type] ?? c.type}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {timeAgo(c.created_at)}
                    {(c.school_advisors as { full_name?: string } | null)?.full_name
                      ? ` · ${(c.school_advisors as { full_name?: string }).full_name}`
                      : ''}
                  </p>
                </div>
                <span
                  className={cn(
                    'inline-flex px-2.5 py-1 rounded-full text-xs font-medium shrink-0',
                    COACHING_STATUS_STYLES[c.status] ?? 'bg-muted text-muted-foreground',
                  )}
                >
                  {COACHING_STATUS_LABELS[c.status] ?? c.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/school/coaching">Voir toutes les demandes</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
