/**
 * Score global affiché côté UI : pondération 50% soft (moyenne personnalité +
 * valeurs) + 50% hard (compétences). Plafonné à 30 en cas de dealbreaker.
 *
 * Garder ce calcul aligné avec `complete-results-view.tsx` — l'`overall_score`
 * stocké en base est calculé par l'IA avec une autre pondération (0.35/0.35/0.30)
 * et n'est donc pas adapté à un affichage direct.
 */
export function computeOverallScore(input: {
  personality_score: number
  values_score: number
  skills_score: number | null
  has_dealbreakers: boolean
}): number {
  const hasSkills = input.skills_score !== null
  const softScore = Math.round((input.personality_score + input.values_score) / 2)
  const hardScore = input.skills_score ?? 0
  const rawCombined = hasSkills
    ? Math.round(softScore * 0.5 + hardScore * 0.5)
    : softScore
  return input.has_dealbreakers ? Math.min(rawCombined, 30) : rawCombined
}
