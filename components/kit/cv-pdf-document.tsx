'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CVData } from '@/lib/kit/cv-builder'
import { formatPeriod } from '@/lib/kit/cv-builder'

// Palette Feeling — usage discret pour rester lisible recruteur.
const COLORS = {
  primary: '#D4C4FB', // lavande
  secondary: '#FFE8D6', // pêche
  accent: '#A8F0C6', // menthe
  ink: '#15151A',
  body: '#2E2E34',
  muted: '#5F5F66',
  hairline: '#E5E5EA',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 38,
    paddingHorizontal: 42,
    paddingBottom: 32,
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: COLORS.body,
    lineHeight: 1.45,
  },

  // ─── Header ────────────────────────────────────────────────────────────
  header: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottom: `1.5pt solid ${COLORS.ink}`,
  },
  name: {
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  headline: {
    fontSize: 11.5,
    fontFamily: 'Helvetica-Oblique',
    color: COLORS.body,
    marginBottom: 8,
    lineHeight: 1.35,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    fontSize: 9,
    color: COLORS.muted,
  },
  contactItem: {
    fontSize: 9,
    color: COLORS.muted,
  },
  contactSeparator: {
    fontSize: 9,
    color: COLORS.muted,
    marginHorizontal: 7,
  },

  // ─── Sections ──────────────────────────────────────────────────────────
  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionAccentBar: {
    width: 3,
    height: 12,
    backgroundColor: COLORS.primary,
    marginRight: 8,
    borderRadius: 1.5,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
  },

  // ─── Summary ───────────────────────────────────────────────────────────
  summary: {
    fontSize: 10,
    color: COLORS.body,
    lineHeight: 1.55,
  },

  // ─── Experience ────────────────────────────────────────────────────────
  experience: {
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  jobTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 11,
    color: COLORS.ink,
  },
  period: {
    fontSize: 9,
    color: COLORS.muted,
    fontFamily: 'Helvetica',
  },
  company: {
    fontSize: 9.5,
    color: COLORS.body,
    fontFamily: 'Helvetica-Oblique',
    marginBottom: 5,
  },
  bullet: {
    flexDirection: 'row',
    marginBottom: 3,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 10,
    fontSize: 9.5,
    color: COLORS.ink,
    lineHeight: 1.45,
  },
  bulletText: {
    flex: 1,
    fontSize: 9.5,
    color: COLORS.body,
    lineHeight: 1.45,
  },
  bulletAction: {
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
  },
  tasksFallback: {
    fontSize: 9.5,
    color: COLORS.body,
    lineHeight: 1.5,
  },

  // ─── Education ─────────────────────────────────────────────────────────
  educationItem: {
    marginBottom: 6,
  },
  educationTitle: {
    fontSize: 10,
    color: COLORS.ink,
  },
  educationDiploma: {
    fontFamily: 'Helvetica-Bold',
  },
  educationDetail: {
    fontSize: 9,
    color: COLORS.muted,
    marginTop: 1,
  },

  // ─── Compétences (liste plate, pills) ───────────────────────────────────
  pillSkill: {
    backgroundColor: COLORS.primary,
    color: COLORS.ink,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderRadius: 2.5,
    fontSize: 8.5,
    marginRight: 3,
    marginBottom: 3,
    fontFamily: 'Helvetica-Bold',
  },

  // ─── Bottom grid (qualités / valeurs / centres d'intérêt) ───────────────
  bottomGrid: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 4,
  },
  gridColumn: {
    flex: 1,
  },
  gridColumnTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
    paddingBottom: 3,
    borderBottom: `0.75pt solid ${COLORS.hairline}`,
  },
  pillContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillSoft: {
    backgroundColor: COLORS.secondary,
    color: COLORS.ink,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderRadius: 2.5,
    fontSize: 8.5,
    marginRight: 3,
    marginBottom: 3,
  },
  pillValue: {
    backgroundColor: COLORS.accent,
    color: COLORS.ink,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderRadius: 2.5,
    fontSize: 8.5,
    marginRight: 3,
    marginBottom: 3,
  },
  pillInterest: {
    backgroundColor: '#F1F1F4',
    color: COLORS.body,
    paddingTop: 2,
    paddingBottom: 2,
    paddingHorizontal: 6,
    borderRadius: 2.5,
    fontSize: 8.5,
    marginRight: 3,
    marginBottom: 3,
  },
})

function parseBullets(mainTasks: string): string[] {
  return mainTasks
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
}

/**
 * Sépare le premier mot (verbe d'action) du reste de la puce pour le mettre
 * en gras et donner du punch visuel.
 */
function splitActionVerb(bullet: string): { verb: string; rest: string } {
  const trimmed = bullet.trim()
  const spaceIdx = trimmed.indexOf(' ')
  if (spaceIdx === -1) return { verb: trimmed, rest: '' }
  return {
    verb: trimmed.slice(0, spaceIdx),
    rest: trimmed.slice(spaceIdx),
  }
}

export function CVPdfDocument({ cv }: { cv: CVData }) {
  const contactItems: string[] = []
  if (cv.identity.email) contactItems.push(cv.identity.email)
  if (cv.identity.location) contactItems.push(cv.identity.location)

  const hasSkills = Array.isArray(cv.skills) && cv.skills.length > 0
  const hasSoftSkills = cv.softSkills && cv.softSkills.length > 0
  const hasValues = cv.values && cv.values.length > 0
  const hasInterests = Array.isArray(cv.interests) && cv.interests.length > 0
  const showBottomGrid = hasSoftSkills || hasValues || hasInterests
  const educationTitle = cv.education.length >= 2 ? 'Formations' : 'Formation'

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.name}>{cv.identity.fullName}</Text>
          {cv.headline && <Text style={styles.headline}>{cv.headline}</Text>}
          {contactItems.length > 0 && (
            <View style={styles.contactRow}>
              {contactItems.map((c, i) => (
                <View key={i} style={{ flexDirection: 'row' }}>
                  <Text style={styles.contactItem}>{c}</Text>
                  {i < contactItems.length - 1 && (
                    <Text style={styles.contactSeparator}>·</Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Profil ───────────────────────────────────────────────────── */}
        {cv.summary && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>Profil</Text>
            </View>
            <Text style={styles.summary}>{cv.summary}</Text>
          </View>
        )}

        {/* ── Expériences ─────────────────────────────────────────────── */}
        {cv.experiences.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>Expériences</Text>
            </View>
            {cv.experiences.map((exp, i) => {
              const bullets = exp.mainTasks ? parseBullets(exp.mainTasks) : []
              const useBullets =
                bullets.length > 1 ||
                (exp.mainTasks?.includes('\n') ?? false) ||
                (exp.mainTasks?.startsWith('-') ?? false)

              return (
                <View key={i} style={styles.experience} wrap={false}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.jobTitle}>{exp.jobTitle}</Text>
                    <Text style={styles.period}>
                      {formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                    </Text>
                  </View>
                  <Text style={styles.company}>
                    {exp.companyName}
                    {exp.location ? `, ${exp.location}` : ''}
                  </Text>
                  {exp.mainTasks && useBullets ? (
                    <View>
                      {bullets.map((b, j) => {
                        const { verb, rest } = splitActionVerb(b)
                        return (
                          <View key={j} style={styles.bullet}>
                            <Text style={styles.bulletDot}>•</Text>
                            <Text style={styles.bulletText}>
                              <Text style={styles.bulletAction}>{verb}</Text>
                              {rest}
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                  ) : (
                    exp.mainTasks && (
                      <Text style={styles.tasksFallback}>{exp.mainTasks}</Text>
                    )
                  )}
                </View>
              )
            })}
          </View>
        )}

        {/* ── Formation(s) ────────────────────────────────────────────── */}
        {cv.education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>{educationTitle}</Text>
            </View>
            {cv.education.map((edu, i) => (
              <View key={i} style={styles.educationItem}>
                <Text style={styles.educationTitle}>
                  <Text style={styles.educationDiploma}>{edu.diploma}</Text>
                  {edu.level ? ` · ${edu.level}` : ''}
                </Text>
                <Text style={styles.educationDetail}>
                  {edu.school}
                  {edu.fields?.length ? ` · ${edu.fields.join(', ')}` : ''}
                  {edu.graduationDate ? ` · ${edu.graduationDate.slice(0, 7)}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Compétences (liste plate) ───────────────────────────────── */}
        {hasSkills && (
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.sectionAccentBar} />
              <Text style={styles.sectionTitle}>Compétences</Text>
            </View>
            <View style={styles.pillContainer}>
              {cv.skills.map((s, i) => (
                <Text key={i} style={styles.pillSkill}>
                  {s}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* ── Grille bas : Qualités / Valeurs / Centres d'intérêt ─────── */}
        {showBottomGrid && (
          <View style={styles.bottomGrid}>
            {hasSoftSkills && (
              <View style={styles.gridColumn}>
                <Text style={styles.gridColumnTitle}>Qualités</Text>
                <View style={styles.pillContainer}>
                  {cv.softSkills!.map((s, i) => (
                    <Text key={`s-${i}`} style={styles.pillSoft}>
                      {s}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {hasValues && (
              <View style={styles.gridColumn}>
                <Text style={styles.gridColumnTitle}>Valeurs</Text>
                <View style={styles.pillContainer}>
                  {cv.values.map((v, i) => (
                    <Text key={`v-${i}`} style={styles.pillValue}>
                      {v}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {hasInterests && (
              <View style={styles.gridColumn}>
                <Text style={styles.gridColumnTitle}>Centres d&apos;intérêt</Text>
                <View style={styles.pillContainer}>
                  {cv.interests!.map((it, i) => (
                    <Text key={`i-${i}`} style={styles.pillInterest}>
                      {it}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}
