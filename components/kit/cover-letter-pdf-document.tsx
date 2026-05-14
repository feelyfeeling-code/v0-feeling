'use client'

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'

const COLORS = {
  ink: '#15151A',
  body: '#1F1F25',
  muted: '#5F5F66',
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingBottom: 56,
    paddingHorizontal: 64,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: COLORS.body,
    lineHeight: 1.6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 36,
  },
  sender: {
    flex: 1,
  },
  senderName: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    color: COLORS.ink,
    marginBottom: 2,
  },
  senderLine: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 1,
  },
  recipient: {
    alignItems: 'flex-end',
    textAlign: 'right',
    flex: 1,
  },
  recipientCompany: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: COLORS.ink,
    marginBottom: 2,
  },
  recipientLine: {
    fontSize: 10,
    color: COLORS.muted,
    marginBottom: 1,
  },
  dateLine: {
    fontSize: 10,
    color: COLORS.muted,
    marginTop: 6,
  },
  subject: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: COLORS.ink,
    marginBottom: 22,
  },
  paragraph: {
    fontSize: 11,
    color: COLORS.body,
    lineHeight: 1.65,
    marginBottom: 12,
    textAlign: 'justify',
  },
  signature: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    color: COLORS.ink,
    marginTop: 18,
  },
})

interface Props {
  body: string
  candidate: { fullName: string; email: string | null; location: string | null }
  job: { title: string | null; company: string | null; location: string | null }
}

export function CoverLetterPdfDocument({ body, candidate, job }: Props) {
  const cleanBody = body.replace(/—/g, '-').trim()
  const paragraphs = cleanBody
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const dateLocation = candidate.location ? `${candidate.location}, le ${today}` : `Le ${today}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Top : expéditeur (gauche) / destinataire (droite) ────────── */}
        <View style={styles.topRow}>
          <View style={styles.sender}>
            <Text style={styles.senderName}>{candidate.fullName}</Text>
            {candidate.email && <Text style={styles.senderLine}>{candidate.email}</Text>}
            {candidate.location && <Text style={styles.senderLine}>{candidate.location}</Text>}
          </View>
          <View style={styles.recipient}>
            {job.company && <Text style={styles.recipientCompany}>{job.company}</Text>}
            {job.location && <Text style={styles.recipientLine}>{job.location}</Text>}
            <Text style={styles.dateLine}>{dateLocation}</Text>
          </View>
        </View>

        {/* ── Objet ────────────────────────────────────────────────────── */}
        {job.title && (
          <Text style={styles.subject}>
            Objet : Candidature au poste de {job.title}
          </Text>
        )}

        {/* ── Corps généré (inclut salutation + formule de politesse) ── */}
        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.paragraph}>
            {p}
          </Text>
        ))}

        {/* ── Signature (le nom du candidat est ajouté ici, pas dans le corps) ── */}
        <Text style={styles.signature}>{candidate.fullName}</Text>
      </Page>
    </Document>
  )
}
