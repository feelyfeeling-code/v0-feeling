'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { CVData } from '@/lib/kit/cv-builder'
import { formatPeriod } from '@/lib/kit/cv-builder'

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  navy: '#1C3557',       // sidebar background
  navyDark: '#152840',   // sidebar header background
  navyLight: '#2B4F7A',  // sidebar section title accent
  midBlue: '#3E6FA3',    // sidebar tag background
  lightBlue: '#D0DCE8',  // sidebar hairline & right-side hairline
  white: '#FFFFFF',
  ink: '#1A2535',        // right-col heading text
  body: '#2C3E50',       // right-col body text
  muted: '#5D7A8C',      // dates, secondary text
  tagBg: '#EEF3F8',      // right-col interest tag background
}

const SIDEBAR_W = 185   // pts — A4 = 595pt wide
const PAGE_H    = 841   // pts — A4

const styles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: C.body,
    minHeight: PAGE_H,
  },

  // ─── Left column ───────────────────────────────────────────────────────────
  left: {
    width: SIDEBAR_W,
    backgroundColor: C.navy,
    paddingBottom: 32,
  },
  leftHeader: {
    backgroundColor: C.navyDark,
    paddingTop: 32,
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginBottom: 8,
  },
  nameText: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: C.white,
    lineHeight: 1.2,
    marginBottom: 6,
  },

  // Contact items in sidebar
  leftSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  leftSectionTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.lightBlue,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '0.5pt solid #2B4F7A',
  },
  contactItem: {
    fontSize: 8.5,
    color: '#B8CDE0',
    marginBottom: 5,
    lineHeight: 1.3,
  },
  contactLabel: {
    fontSize: 7.5,
    color: '#8AAEC8',
    marginBottom: 1,
  },

  // Left tags (skills, qualities, languages)
  leftTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  leftTag: {
    backgroundColor: C.navyLight,
    color: '#D6E8F5',
    fontSize: 8,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },

  // ─── Right column ──────────────────────────────────────────────────────────
  right: {
    flex: 1,
    backgroundColor: C.white,
    paddingTop: 32,
    paddingHorizontal: 26,
    paddingBottom: 32,
  },
  headline: {
    fontSize: 11,
    fontFamily: 'Helvetica-Oblique',
    color: C.navy,
    marginBottom: 18,
    lineHeight: 1.35,
  },

  section: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  sectionBar: {
    width: 3,
    height: 11,
    backgroundColor: C.navy,
    borderRadius: 1,
    marginRight: 7,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.navy,
    letterSpacing: 0.8,
  },
  sectionDivider: {
    flex: 1,
    height: 0.5,
    backgroundColor: C.lightBlue,
    marginLeft: 8,
  },

  // Summary
  summaryText: {
    fontSize: 9,
    color: C.body,
    lineHeight: 1.55,
  },

  // Experience
  expBlock: {
    marginBottom: 10,
  },
  expHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  expJobTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },
  expPeriod: {
    fontSize: 8,
    color: C.muted,
  },
  expCompany: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Oblique',
    color: C.muted,
    marginBottom: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 2,
  },
  bulletDot: {
    width: 9,
    fontSize: 9,
    color: C.navy,
    lineHeight: 1.5,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    color: C.body,
    lineHeight: 1.5,
  },
  bulletBold: {
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },
  tasksFallback: {
    fontSize: 9,
    color: C.body,
    lineHeight: 1.5,
  },

  // Education
  eduBlock: {
    marginBottom: 7,
  },
  eduTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 1,
  },
  eduDiploma: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },
  eduYear: {
    fontSize: 8,
    color: C.muted,
  },
  eduDetail: {
    fontSize: 8.5,
    color: C.muted,
  },

  // Interest pills (right col)
  interestRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: C.tagBg,
    color: C.body,
    fontSize: 8,
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    borderRadius: 3,
    marginRight: 4,
    marginBottom: 4,
  },
})

// ─── Helpers ────────────────────────────────────────────────────────────────

function parseBullets(mainTasks: string): string[] {
  return mainTasks
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[-•*]\s*/, '').trim())
    .filter(Boolean)
}

function splitActionVerb(bullet: string): { verb: string; rest: string } {
  const trimmed = bullet.trim()
  const idx = trimmed.indexOf(' ')
  if (idx === -1) return { verb: trimmed, rest: '' }
  return { verb: trimmed.slice(0, idx), rest: trimmed.slice(idx) }
}

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionTitleRow}>
      <View style={styles.sectionBar} />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CVPdfDocument({ cv }: { cv: CVData }) {
  const hasSkills     = Array.isArray(cv.skills) && cv.skills.length > 0
  const hasSoftSkills = Array.isArray(cv.softSkills) && cv.softSkills.length > 0
  const hasLanguages  = Array.isArray(cv.languages) && cv.languages.length > 0
  const hasInterests  = Array.isArray(cv.interests) && cv.interests.length > 0
  const educationTitle = cv.education.length >= 2 ? 'Formations' : 'Formation'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ══ LEFT COLUMN ══════════════════════════════════════════════════ */}
        <View style={styles.left}>

          {/* Name */}
          <View style={styles.leftHeader}>
            <Text style={styles.nameText}>{cv.identity.fullName}</Text>
          </View>

          {/* Contact */}
          <View style={styles.leftSection}>
            <Text style={styles.leftSectionTitle}>CONTACT</Text>
            {cv.identity.email ? (
              <View>
                <Text style={styles.contactLabel}>Email</Text>
                <Text style={styles.contactItem}>{cv.identity.email}</Text>
              </View>
            ) : null}
            {cv.identity.phone ? (
              <View>
                <Text style={styles.contactLabel}>Téléphone</Text>
                <Text style={styles.contactItem}>{cv.identity.phone}</Text>
              </View>
            ) : null}
            {cv.identity.location ? (
              <View>
                <Text style={styles.contactLabel}>Localisation</Text>
                <Text style={styles.contactItem}>{cv.identity.location}</Text>
              </View>
            ) : null}
          </View>

          {/* Skills */}
          {hasSkills && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>COMPÉTENCES</Text>
              <View style={styles.leftTagsRow}>
                {cv.skills.map((s, i) => (
                  <Text key={i} style={styles.leftTag}>{s}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Soft skills */}
          {hasSoftSkills && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>QUALITÉS</Text>
              <View style={styles.leftTagsRow}>
                {cv.softSkills.map((s, i) => (
                  <Text key={i} style={styles.leftTag}>{s}</Text>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {hasLanguages && (
            <View style={styles.leftSection}>
              <Text style={styles.leftSectionTitle}>LANGUES</Text>
              <View style={styles.leftTagsRow}>
                {cv.languages.map((l, i) => (
                  <Text key={i} style={styles.leftTag}>{l}</Text>
                ))}
              </View>
            </View>
          )}

        </View>

        {/* ══ RIGHT COLUMN ═════════════════════════════════════════════════ */}
        <View style={styles.right}>

          {/* Headline */}
          {cv.headline ? (
            <Text style={styles.headline}>{cv.headline}</Text>
          ) : null}

          {/* Summary */}
          {cv.summary ? (
            <View style={styles.section}>
              <SectionHeader title="Profil" />
              <Text style={styles.summaryText}>{cv.summary}</Text>
            </View>
          ) : null}

          {/* Experiences */}
          {cv.experiences.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title="Expériences" />
              {cv.experiences.map((exp, i) => {
                const bullets = exp.mainTasks ? parseBullets(exp.mainTasks) : []
                const useBullets =
                  bullets.length > 1 ||
                  (exp.mainTasks?.includes('\n') ?? false) ||
                  (exp.mainTasks?.startsWith('-') ?? false)

                return (
                  <View key={i} style={styles.expBlock} wrap={false}>
                    <View style={styles.expHeaderRow}>
                      <Text style={styles.expJobTitle}>{exp.jobTitle}</Text>
                      <Text style={styles.expPeriod}>
                        {formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                      </Text>
                    </View>
                    <Text style={styles.expCompany}>
                      {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                    </Text>
                    {exp.mainTasks && useBullets ? (
                      <View>
                        {bullets.map((b, j) => {
                          const { verb, rest } = splitActionVerb(b)
                          return (
                            <View key={j} style={styles.bulletRow}>
                              <Text style={styles.bulletDot}>•</Text>
                              <Text style={styles.bulletText}>
                                <Text style={styles.bulletBold}>{verb}</Text>
                                {rest}
                              </Text>
                            </View>
                          )
                        })}
                      </View>
                    ) : exp.mainTasks ? (
                      <Text style={styles.tasksFallback}>{exp.mainTasks}</Text>
                    ) : null}
                  </View>
                )
              })}
            </View>
          )}

          {/* Education */}
          {cv.education.length > 0 && (
            <View style={styles.section}>
              <SectionHeader title={educationTitle} />
              {cv.education.map((edu, i) => (
                <View key={i} style={styles.eduBlock} wrap={false}>
                  <View style={styles.eduTitleRow}>
                    <Text style={styles.eduDiploma}>
                      {edu.diploma}{edu.level ? ` · ${edu.level}` : ''}
                    </Text>
                    {edu.graduationDate ? (
                      <Text style={styles.eduYear}>
                        {edu.graduationDate.slice(0, 7)}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.eduDetail}>
                    {edu.school}
                    {edu.fields?.length ? ` · ${edu.fields.join(', ')}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Interests */}
          {hasInterests && (
            <View style={styles.section}>
              <SectionHeader title="Centres d'intérêt" />
              <View style={styles.interestRow}>
                {cv.interests.map((it, i) => (
                  <Text key={i} style={styles.interestTag}>{it}</Text>
                ))}
              </View>
            </View>
          )}

        </View>
      </Page>
    </Document>
  )
}
