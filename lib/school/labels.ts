// Libellés et helpers partagés pour le module École.

export const MEMBER_STATUS_LABELS: Record<string, string> = {
  searching: 'En recherche',
  employed: 'En emploi',
  inactive: 'Inactif',
  studies: "En poursuite d'études",
  break: 'En pause',
}

export const MEMBER_STATUS_STYLES: Record<string, string> = {
  searching: 'bg-info/20 text-info-foreground',
  employed: 'bg-accent/30 text-accent-foreground',
  inactive: 'bg-muted text-muted-foreground',
  studies: 'bg-primary/20 text-primary-foreground',
  break: 'bg-warning/40 text-warning-foreground',
}

export const COACHING_TYPE_LABELS: Record<string, string> = {
  interview_prep: "Préparation d'entretien",
  cv_review: 'Relecture de CV',
  orientation: 'Orientation',
  reassurance: 'Réassurance',
  first_exchange: 'Premier échange',
  other: 'Autre',
}

export const COACHING_STATUS_LABELS: Record<string, string> = {
  pending: 'À traiter',
  assigned: 'Assignée',
  scheduled: 'Planifiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
}

export const COACHING_STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning/40 text-warning-foreground',
  assigned: 'bg-info/20 text-info-foreground',
  scheduled: 'bg-primary/20 text-primary-foreground',
  completed: 'bg-accent/30 text-accent-foreground',
  cancelled: 'bg-muted text-muted-foreground',
}

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  interview: 'Entretien',
  rejected: 'Refusée',
  offer: 'Offre reçue',
  accepted: 'Acceptée',
}

/** "Il y a X jours / semaines / mois" à partir d'une date ISO. */
export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return 'Jamais'
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 'Jamais'
  const diffMs = Date.now() - then
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Il y a 1 jour'
  if (days < 7) return `Il y a ${days} jours`

  const weeks = Math.floor(days / 7)
  if (weeks === 1) return 'Il y a 1 semaine'
  if (weeks < 5) return `Il y a ${weeks} semaines`

  const months = Math.floor(days / 30)
  if (months === 1) return 'Il y a 1 mois'
  return `Il y a ${months} mois`
}

/** true si le diplômé est en recherche mais inactif depuis > 21 jours. */
export function isInactiveAlert(lastActiveAt: string | null | undefined, status: string): boolean {
  if (status !== 'searching' || !lastActiveAt) return false
  const then = new Date(lastActiveAt).getTime()
  if (Number.isNaN(then)) return false
  const days = (Date.now() - then) / (1000 * 60 * 60 * 24)
  return days > 21
}

/** Nombre d'heures écoulées depuis une date ISO. */
export function hoursSince(iso: string | null | undefined): number {
  if (!iso) return 0
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return 0
  return (Date.now() - then) / (1000 * 60 * 60)
}
