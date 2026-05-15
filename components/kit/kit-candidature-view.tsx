"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { AuthHeader } from "@/components/auth-header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  Download,
  FileText,
  Mail,
  Loader2,
  Plus,
  Trash2,
  RotateCw,
  X,
  Copy,
  Check,
  ClipboardList,
} from "lucide-react";
import type { CVData } from "@/lib/kit/cv-builder";
import { formatPeriod, migrateLegacySkills } from "@/lib/kit/cv-builder";

// Sécurise un CV reçu d'une source quelconque : initialCv ou réponse API.
// Migre `skills` (3 formats historiques supportés) et normalise `interests`
// vers `string[]`. Évite tout crash si une couche en amont (cache Turbopack,
// SSR stale, réponse en cache) renvoie l'ancien format.
function normalizeCv(cv: CVData | null): CVData | null {
  if (!cv) return cv;
  return {
    ...cv,
    identity: {
      ...cv.identity,
      phone: cv.identity.phone ?? null,
    },
    skills: migrateLegacySkills(cv.skills as unknown),
    interests: Array.isArray(cv.interests) ? cv.interests : [],
    languages: Array.isArray(cv.languages) ? cv.languages : [],
  };
}

interface Analysis {
  id: string;
  jobTitle: string | null;
  companyName: string | null;
  jobLocation: string | null;
}

interface Props {
  analysis: Analysis;
  candidate: { fullName: string; email: string | null };
  initialCv: CVData | null;
  initialCoverLetter: string;
}

export function KitCandidatureView({
  analysis,
  candidate,
  initialCv,
  initialCoverLetter,
}: Props) {
  const [cv, setCv] = useState<CVData | null>(() => normalizeCv(initialCv));
  const [coverLetter, setCoverLetter] = useState<string>(initialCoverLetter);

  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isDownloadingCv, setIsDownloadingCv] = useState(false);
  const [isDownloadingLetter, setIsDownloadingLetter] = useState(false);

  // Auto-save : on persiste les modifications avec un debounce de 1.5s.
  // Le premier rendu (valeur initiale chargée depuis la DB) est ignoré.
  const skipFirstCvSave = useRef(true);
  useEffect(() => {
    if (skipFirstCvSave.current) {
      skipFirstCvSave.current = false;
      return;
    }
    if (!cv) return;
    const t = setTimeout(() => {
      fetch("/api/kit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, cv }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [cv, analysis.id]);

  const skipFirstLetterSave = useRef(true);
  useEffect(() => {
    if (skipFirstLetterSave.current) {
      skipFirstLetterSave.current = false;
      return;
    }
    if (!coverLetter) return;
    const t = setTimeout(() => {
      fetch("/api/kit/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, coverLetter }),
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [coverLetter, analysis.id]);

  const handleGenerateCv = async (forceRegenerate = false) => {
    setIsGeneratingCv(true);
    const toastId = toast.loading(
      forceRegenerate
        ? "Régénération du CV en cours..."
        : "Génération du CV en cours...",
    );
    try {
      const res = await fetch("/api/kit/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, forceRegenerate }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la génération");
      // L'API a déjà persisté le CV. On évite un auto-save redondant en armant
      // à nouveau le flag skip pour le prochain useEffect déclenché par setCv.
      skipFirstCvSave.current = true;
      setCv(normalizeCv(data.cv));
      if (data.coverLetter) {
        skipFirstLetterSave.current = true;
        setCoverLetter(data.coverLetter);
      }
      toast.success(forceRegenerate ? "CV régénéré" : "CV généré", {
        id: toastId,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur", { id: toastId });
    } finally {
      setIsGeneratingCv(false);
    }
  };

  const handleGenerateLetter = async (forceRegenerate = false) => {
    setIsGeneratingLetter(true);
    const toastId = toast.loading(
      forceRegenerate
        ? "Régénération de la lettre en cours..."
        : "Rédaction de la lettre en cours...",
    );
    try {
      const res = await fetch("/api/kit/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id, forceRegenerate }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la génération");
      skipFirstLetterSave.current = true;
      setCoverLetter(data.coverLetter);
      toast.success(forceRegenerate ? "Lettre régénérée" : "Lettre générée", {
        id: toastId,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur", { id: toastId });
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleDownloadCv = async () => {
    if (!cv) return;
    setIsDownloadingCv(true);
    try {
      const [{ pdf }, { CVPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./cv-pdf-document"),
      ]);
      const blob = await pdf(<CVPdfDocument cv={cv} />).toBlob();
      triggerDownload(blob, `CV-${slugify(candidate.fullName)}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setIsDownloadingCv(false);
    }
  };

  const handleDownloadLetter = async () => {
    if (!coverLetter.trim()) return;
    setIsDownloadingLetter(true);
    try {
      const [{ pdf }, { CoverLetterPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./cover-letter-pdf-document"),
      ]);
      const blob = await pdf(
        <CoverLetterPdfDocument
          body={coverLetter}
          candidate={{
            fullName: candidate.fullName,
            email: candidate.email,
            location: cv?.identity.location ?? null,
          }}
          job={{
            title: analysis.jobTitle,
            company: analysis.companyName,
            location: analysis.jobLocation,
          }}
        />,
      ).toBlob();
      triggerDownload(blob, `Lettre-${slugify(candidate.fullName)}.pdf`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur PDF");
    } finally {
      setIsDownloadingLetter(false);
    }
  };

  // CV field updates ─────────────────────────────────────────────────────
  const updateCv = (updater: (prev: CVData) => CVData) => {
    setCv((prev) => (prev ? updater(prev) : prev));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AuthHeader />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
          {/* Retour à l'analyse */}
          <Link
            href={`/resultats-complets/${analysis.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour à l&apos;analyse complète
          </Link>

          {/* Intro */}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold">
              Ton kit de candidature
            </h1>
            <p className="text-muted-foreground">
              CV et lettre de motivation adaptés à l&apos;offre{" "}
              <span className="font-medium text-foreground">
                {analysis.jobTitle ?? "sélectionnée"}
                {analysis.companyName ? ` chez ${analysis.companyName}` : ""}
              </span>
              .
            </p>
          </div>

          {/* CV section */}
          <section className="rounded-2xl border border-primary/30 bg-primary/15 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-primary/30 bg-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                  <FileText className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">CV</h2>
                  <p className="text-xs text-muted-foreground">
                    Généré à partir de ton profil, adapté à l&apos;offre
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {!cv ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Génère ton CV à partir des informations de ton profil
                    (expériences, formations, compétences, valeurs).
                  </p>
                  <Button
                    onClick={() => handleGenerateCv(false)}
                    disabled={isGeneratingCv}
                    className="h-12 rounded-full px-8 min-w-[280px] font-medium"
                  >
                    {isGeneratingCv ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      "Générer mon CV"
                    )}
                  </Button>
                </div>
              ) : (
                <CVEditor cv={cv} updateCv={updateCv} />
              )}

              {cv && (
                <div className="pt-2 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGenerateCv(true)}
                    disabled={isGeneratingCv}
                    className="h-11 w-full"
                  >
                    {isGeneratingCv ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4 mr-2" />
                    )}
                    Régénérer le CV
                  </Button>
                  <Button
                    onClick={handleDownloadCv}
                    disabled={isDownloadingCv}
                    className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isDownloadingCv ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger le CV
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Copy-paste section */}
          {cv && <CopyPasteSection cv={cv} />}

          {/* Cover letter section */}
          <section className="rounded-2xl border border-border bg-muted/40 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border bg-muted/60">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center">
                  <Mail className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Lettre de motivation</h2>
                  <p className="text-xs text-muted-foreground">
                    Rédigée avec Feely, adaptée à l&apos;offre et à ton profil
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {!coverLetter ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Génère ta lettre de motivation adaptée à l&apos;offre en
                    croisant ton profil avec les exigences du poste.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateLetter(false)}
                    disabled={isGeneratingLetter}
                    className="h-12 rounded-full px-8 min-w-[280px] font-medium bg-background"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rédaction...
                      </>
                    ) : (
                      "Générer ma lettre de motivation"
                    )}
                  </Button>
                </div>
              ) : (
                <Textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={18}
                  className="font-serif text-[15px] leading-relaxed bg-background"
                  placeholder="Ta lettre de motivation..."
                />
              )}

              {coverLetter && (
                <div className="pt-2 border-t border-border grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGenerateLetter(true)}
                    disabled={isGeneratingLetter}
                    className="h-11 w-full"
                  >
                    {isGeneratingLetter ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCw className="w-4 h-4 mr-2" />
                    )}
                    Régénérer la lettre
                  </Button>
                  <Button
                    onClick={handleDownloadLetter}
                    disabled={isDownloadingLetter}
                    className="h-11 w-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isDownloadingLetter ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger la lettre
                  </Button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ─── Plain-text CV for copy-paste ───────────────────────────────────────────
function cvToPlainText(cv: CVData): string {
  const lines: string[] = []
  const sep = "─".repeat(50)

  // Header
  lines.push(cv.identity.fullName)
  if (cv.headline) lines.push(cv.headline)
  lines.push("")

  const contact = [
    cv.identity.email,
    cv.identity.phone,
    cv.identity.location,
  ].filter(Boolean)
  if (contact.length) lines.push(contact.join("  ·  "))
  lines.push("")

  // Summary
  if (cv.summary) {
    lines.push(sep)
    lines.push("PROFIL")
    lines.push(sep)
    lines.push(cv.summary)
    lines.push("")
  }

  // Experiences
  if (cv.experiences.length > 0) {
    lines.push(sep)
    lines.push("EXPÉRIENCES PROFESSIONNELLES")
    lines.push(sep)
    for (const exp of cv.experiences) {
      const period = formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)
      const where = exp.location ? `, ${exp.location}` : ""
      lines.push(`${exp.jobTitle}  |  ${exp.companyName}${where}  |  ${period}`)
      if (exp.mainTasks) {
        const bullets = exp.mainTasks
          .split(/\r?\n/)
          .map((l) => l.replace(/^\s*[-•*]\s*/, "").trim())
          .filter(Boolean)
        for (const b of bullets) lines.push(`• ${b}`)
      }
      lines.push("")
    }
  }

  // Education
  if (cv.education.length > 0) {
    lines.push(sep)
    lines.push("FORMATION")
    lines.push(sep)
    for (const edu of cv.education) {
      const year = edu.graduationDate ? edu.graduationDate.slice(0, 7) : ""
      const level = edu.level ? ` (${edu.level})` : ""
      lines.push(`${edu.diploma}${level}  |  ${edu.school}${year ? `  |  ${year}` : ""}`)
      if (edu.fields?.length) lines.push(`Spécialités : ${edu.fields.join(", ")}`)
      lines.push("")
    }
  }

  // Skills
  if (cv.skills?.length) {
    lines.push(sep)
    lines.push("COMPÉTENCES")
    lines.push(sep)
    lines.push(cv.skills.join("  ·  "))
    lines.push("")
  }

  // Soft skills
  if (cv.softSkills?.length) {
    lines.push(`QUALITÉS : ${cv.softSkills.join("  ·  ")}`)
  }

  // Languages
  if (cv.languages?.length) {
    lines.push(`LANGUES : ${cv.languages.join("  ·  ")}`)
  }

  // Interests
  if (cv.interests?.length) {
    lines.push(`CENTRES D'INTÉRÊT : ${cv.interests.join("  ·  ")}`)
  }

  return lines.join("\n")
}

function CopyPasteSection({ cv }: { cv: CVData }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = cvToPlainText(cv)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Impossible de copier")
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-muted/40 overflow-hidden cursor-pointer ">
      {/* Header — always visible, click to toggle */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 bg-muted/60 hover:bg-muted/80 transition-colors text-left"
      >
        <div className="flex items-center gap-3 cursor-pointer ">
          <div className="w-9 h-9 rounded-full bg-background flex items-center justify-center shrink-0 ">
            <ClipboardList className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <h2 className="font-bold text-lg">CV - Version texte à coller</h2>
            <p className="text-xs text-muted-foreground">
              Copie ce texte pour l&apos;utiliser dans un autre éditeur de CV
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 cursor-pointer ${
            open ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {/* Collapsible body */}
      {open && (
        <div className="p-5 border-t border-border space-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="h-10 rounded-full px-4 gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 text-sm font-medium">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span className="text-sm font-medium">Copier</span>
                </>
              )}
            </Button>
          </div>
          <Textarea
            value={text}
            readOnly
            rows={20}
            className="font-mono text-xs leading-relaxed bg-background resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Colle ce contenu dans Canva, Word, Google Docs ou tout autre éditeur de CV.
          </p>
        </div>
      )}
    </section>
  )
}

// ─── CV editor ──────────────────────────────────────────────────────────
//
// Styling guide : on s'aligne sur la grammaire visuelle Feeling utilisée
// dans l'onboarding et les autres formulaires du site :
//   - Inputs       : h-12 rounded-full
//   - Textareas    : rounded-2xl, p-4
//   - Cartes       : rounded-2xl bg-muted/40 (fond doux, pas de bordure dure)
//   - Tag pills    : rounded-full bg-primary/40 (cliquable pour retirer)
//   - Boutons +    : variant="outline" h-12 rounded-full
//   - Icônes supp. : h-10 w-10 rounded-full hover:bg-destructive/10

const EMPTY_EXPERIENCE: CVData["experiences"][number] = {
  jobTitle: "",
  companyName: "",
  location: null,
  startDate: "",
  endDate: null,
  isCurrent: false,
  mainTasks: null,
};

const EMPTY_EDUCATION: CVData["education"][number] = {
  level: "",
  diploma: "",
  school: "",
  fields: [],
  graduationDate: "",
};

// Les <input type="month"> attendent "YYYY-MM". Le CV peut stocker
// "YYYY-MM" ou "YYYY-MM-DD" — on tronque à l'affichage et on garde
// le format court à la sauvegarde.
function toMonthValue(d: string | null | undefined): string {
  if (!d) return "";
  return d.slice(0, 7);
}

const INPUT_PILL = "h-12 rounded-full";
const TEXTAREA_PILL = "rounded-2xl px-4 py-3";
// Bloc de section (Identité, Expériences, Formations…) — fond blanc franc,
// bordure visible et ombre portée pour bien détacher de l'enveloppe lavande.
const SECTION_CARD =
  "rounded-2xl border-2 border-primary/20 bg-background p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)]";
// Sous-bloc dans une section (une expérience, une formation, un domaine).
// Légèrement plus foncé que le fond blanc de la section pour rester lisible.
// `relative` pour permettre au bouton supprimer d'être positionné en haut à droite.
const ITEM_CARD =
  "relative rounded-xl border border-border bg-muted/50 p-4 sm:p-5 space-y-4";
const DELETE_BTN =
  "h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0";

function CVEditor({
  cv,
  updateCv,
}: {
  cv: CVData;
  updateCv: (updater: (prev: CVData) => CVData) => void;
}) {
  const educationTitle = cv.education.length >= 2 ? "Formations" : "Formation";

  return (
    <div className="space-y-5">
      {/* Identity */}
      <section className={SECTION_CARD}>
        <SectionTitle>Identité</SectionTitle>
        <div className="space-y-2">
          <Label htmlFor="cv-fullname">Nom complet</Label>
          <Input
            id="cv-fullname"
            value={cv.identity.fullName}
            onChange={(e) =>
              updateCv((prev) => ({
                ...prev,
                identity: { ...prev.identity, fullName: e.target.value },
              }))
            }
            placeholder="Nom complet"
            className={`${INPUT_PILL} font-medium`}
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cv-email">Email</Label>
            <Input
              id="cv-email"
              type="email"
              value={cv.identity.email ?? ""}
              onChange={(e) =>
                updateCv((prev) => ({
                  ...prev,
                  identity: {
                    ...prev.identity,
                    email: e.target.value || null,
                  },
                }))
              }
              placeholder="prenom@exemple.com"
              className={INPUT_PILL}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cv-phone">Téléphone</Label>
            <Input
              id="cv-phone"
              type="tel"
              value={cv.identity.phone ?? ""}
              onChange={(e) =>
                updateCv((prev) => ({
                  ...prev,
                  identity: {
                    ...prev.identity,
                    phone: e.target.value || null,
                  },
                }))
              }
              placeholder="06 00 00 00 00"
              className={INPUT_PILL}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cv-city">Ville / Adresse courte</Label>
          <Input
            id="cv-city"
            value={cv.identity.location ?? ""}
            onChange={(e) =>
              updateCv((prev) => ({
                ...prev,
                identity: {
                  ...prev.identity,
                  location: e.target.value || null,
                },
              }))
            }
            placeholder="Paris, 75011"
            className={INPUT_PILL}
          />
        </div>
      </section>

      {/* Headline */}
      <section className={SECTION_CARD}>
        <SectionTitle>Intitulé</SectionTitle>
        <Input
          value={cv.headline}
          onChange={(e) =>
            updateCv((prev) => ({ ...prev, headline: e.target.value }))
          }
          placeholder="Product Owner en recherche d'un poste à Paris"
          className={INPUT_PILL}
        />
      </section>

      {/* Summary */}
      <section className={SECTION_CARD}>
        <SectionTitle>Profil</SectionTitle>
        <Textarea
          value={cv.summary}
          onChange={(e) =>
            updateCv((prev) => ({ ...prev, summary: e.target.value }))
          }
          rows={3}
          placeholder="Une phrase ou deux pour te présenter."
          className={TEXTAREA_PILL}
        />
      </section>

      {/* Experiences */}
      <section className={SECTION_CARD}>
        <SectionTitle>
          Expériences
          {cv.experiences.length > 0 ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({cv.experiences.length})
            </span>
          ) : null}
        </SectionTitle>
        <div className="space-y-4">
          {cv.experiences.map((exp, i) => (
            <div key={i} className={ITEM_CARD}>
              <button
                type="button"
                onClick={() =>
                  updateCv((prev) => ({
                    ...prev,
                    experiences: prev.experiences.filter((_, j) => j !== i),
                  }))
                }
                aria-label="Supprimer cette expérience"
                className={`${DELETE_BTN} absolute top-3 right-3 flex items-center justify-center transition-colors`}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Bloc aligné — pr-12 réserve la place du bouton supprimer
                  pour que tous les champs aient la même largeur. */}
              <div className="space-y-4 pr-12">
                <div className="space-y-2">
                  <Label htmlFor={`exp-title-${i}`}>Intitulé du poste</Label>
                  <Input
                    id={`exp-title-${i}`}
                    value={exp.jobTitle}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateCv((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((x, j) =>
                          j === i ? { ...x, jobTitle: v } : x,
                        ),
                      }));
                    }}
                    placeholder="Product Owner"
                    className={`${INPUT_PILL} font-medium`}
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`exp-company-${i}`}>Entreprise</Label>
                    <Input
                      id={`exp-company-${i}`}
                      value={exp.companyName}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((x, j) =>
                            j === i ? { ...x, companyName: v } : x,
                          ),
                        }));
                      }}
                      placeholder="Nom de l'entreprise"
                      className={INPUT_PILL}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`exp-loc-${i}`}>Ville</Label>
                    <Input
                      id={`exp-loc-${i}`}
                      value={exp.location ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((x, j) =>
                            j === i ? { ...x, location: v || null } : x,
                          ),
                        }));
                      }}
                      placeholder="Paris"
                      className={INPUT_PILL}
                    />
                  </div>
                </div>

                {/* Dates */}
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`exp-start-${i}`}>Début</Label>
                    <Input
                      id={`exp-start-${i}`}
                      type="month"
                      value={toMonthValue(exp.startDate)}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((x, j) =>
                            j === i ? { ...x, startDate: v } : x,
                          ),
                        }));
                      }}
                      className={INPUT_PILL}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`exp-end-${i}`}>Fin</Label>
                    <Input
                      id={`exp-end-${i}`}
                      type="month"
                      value={toMonthValue(exp.endDate)}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          experiences: prev.experiences.map((x, j) =>
                            j === i ? { ...x, endDate: v || null } : x,
                          ),
                        }));
                      }}
                      disabled={exp.isCurrent}
                      className={INPUT_PILL}
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exp.isCurrent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      updateCv((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((x, j) =>
                          j === i
                            ? {
                                ...x,
                                isCurrent: checked,
                                endDate: checked ? null : x.endDate,
                              }
                            : x,
                        ),
                      }));
                    }}
                    className="w-4 h-4 rounded accent-primary"
                  />
                  Poste actuel
                </label>

                {exp.startDate && (
                  <p className="text-xs text-muted-foreground italic">
                    {formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor={`exp-tasks-${i}`}>Missions</Label>
                  <Textarea
                    id={`exp-tasks-${i}`}
                    value={exp.mainTasks ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      updateCv((prev) => ({
                        ...prev,
                        experiences: prev.experiences.map((x, j) =>
                          j === i ? { ...x, mainTasks: v || null } : x,
                        ),
                      }));
                    }}
                    rows={4}
                    placeholder="- Mission 1&#10;- Mission 2&#10;- Mission 3"
                    className={TEXTAREA_PILL}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateCv((prev) => ({
              ...prev,
              experiences: [...prev.experiences, { ...EMPTY_EXPERIENCE }],
            }))
          }
          className={`${INPUT_PILL} w-full font-medium`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une expérience
        </Button>
      </section>

      {/* Education */}
      <section className={SECTION_CARD}>
        <SectionTitle>{educationTitle}</SectionTitle>
        <div className="space-y-4">
          {cv.education.map((edu, i) => (
            <div key={i} className={ITEM_CARD}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor={`edu-diploma-${i}`}>Diplôme</Label>
                    <Input
                      id={`edu-diploma-${i}`}
                      value={edu.diploma}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          education: prev.education.map((x, j) =>
                            j === i ? { ...x, diploma: v } : x,
                          ),
                        }));
                      }}
                      placeholder="Master Stratégie Digitale"
                      className={`${INPUT_PILL} font-medium`}
                    />
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor={`edu-school-${i}`}>École</Label>
                      <Input
                        id={`edu-school-${i}`}
                        value={edu.school}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateCv((prev) => ({
                            ...prev,
                            education: prev.education.map((x, j) =>
                              j === i ? { ...x, school: v } : x,
                            ),
                          }));
                        }}
                        placeholder="Nom de l'établissement"
                        className={INPUT_PILL}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-level-${i}`}>Niveau</Label>
                      <Input
                        id={`edu-level-${i}`}
                        value={edu.level}
                        onChange={(e) => {
                          const v = e.target.value;
                          updateCv((prev) => ({
                            ...prev,
                            education: prev.education.map((x, j) =>
                              j === i ? { ...x, level: v } : x,
                            ),
                          }));
                        }}
                        placeholder="Bac +5"
                        className={INPUT_PILL}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edu-fields-${i}`}>Spécialités</Label>
                    <Input
                      id={`edu-fields-${i}`}
                      value={edu.fields?.join(", ") ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          education: prev.education.map((x, j) =>
                            j === i
                              ? {
                                  ...x,
                                  fields: v
                                    .split(",")
                                    .map((f) => f.trim())
                                    .filter(Boolean),
                                }
                              : x,
                          ),
                        }));
                      }}
                      placeholder="Séparées par des virgules"
                      className={INPUT_PILL}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`edu-date-${i}`}>
                      Date d&apos;obtention
                    </Label>
                    <Input
                      id={`edu-date-${i}`}
                      type="month"
                      value={toMonthValue(edu.graduationDate)}
                      onChange={(e) => {
                        const v = e.target.value;
                        updateCv((prev) => ({
                          ...prev,
                          education: prev.education.map((x, j) =>
                            j === i ? { ...x, graduationDate: v } : x,
                          ),
                        }));
                      }}
                      className={INPUT_PILL}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    updateCv((prev) => ({
                      ...prev,
                      education: prev.education.filter((_, j) => j !== i),
                    }))
                  }
                  aria-label="Supprimer cette formation"
                  className={`${DELETE_BTN} flex items-center justify-center transition-colors`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            updateCv((prev) => ({
              ...prev,
              education: [...prev.education, { ...EMPTY_EDUCATION }],
            }))
          }
          className={`${INPUT_PILL} w-full font-medium`}
        >
          <Plus className="w-4 h-4 mr-2" />
          Ajouter une formation
        </Button>
      </section>

      {/* Skills (flat list) — même pattern visuel que Qualités */}
      <section className={SECTION_CARD}>
        <SectionTitle>Compétences</SectionTitle>
        <EditableTagList
          values={cv.skills ?? []}
          onChange={(next) => updateCv((prev) => ({ ...prev, skills: next }))}
          placeholder="Ex : Veille concurrentielle"
          accent="muted"
        />
      </section>

      {/* Qualités (formerly soft skills) */}
      <section className={SECTION_CARD}>
        <div className="space-y-1">
          <SectionTitle>Qualités</SectionTitle>
          <p className="text-xs text-muted-foreground">
            Dérivées de tes traits et valeurs.
          </p>
        </div>
        <EditableTagList
          values={cv.softSkills ?? []}
          onChange={(next) =>
            updateCv((prev) => ({ ...prev, softSkills: next }))
          }
          placeholder="Ex : Esprit d'analyse"
          accent="secondary"
        />
      </section>

      {/* Centres d'intérêt */}
      <section className={SECTION_CARD}>
        <SectionTitle>Centres d&apos;intérêt</SectionTitle>
        <EditableTagList
          values={cv.interests ?? []}
          onChange={(next) =>
            updateCv((prev) => ({ ...prev, interests: next }))
          }
          placeholder="Ex : Photographie, randonnée..."
          accent="muted"
        />
      </section>

      {/* Languages */}
      <section className={SECTION_CARD}>
        <SectionTitle>Langues</SectionTitle>
        <EditableTagList
          values={cv.languages ?? []}
          onChange={(next) =>
            updateCv((prev) => ({ ...prev, languages: next }))
          }
          placeholder="Ex : Français, Anglais"
          accent="accent"
        />
      </section>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-bold text-foreground">{children}</h3>;
}

// Liste éditable d'étiquettes (qualités, compétences, centres d'intérêt).
// Pattern emprunté à l'onboarding : un input avec un bouton "+",
// les éléments validés deviennent des pills cliquables (clic = retire).
// Si `addLabel` est fourni, le bouton montre un libellé textuel à la place
// de l'icône seule.
function EditableTagList({
  values,
  onChange,
  placeholder,
  accent,
  addLabel,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  accent: "secondary" | "muted" | "accent";
  addLabel?: string;
}) {
  const [draft, setDraft] = useState("");

  const accentClass =
    accent === "secondary"
      ? "bg-secondary/60 hover:bg-secondary/80"
      : accent === "accent"
        ? "bg-accent/50 hover:bg-accent/70"
        : "bg-primary/40 hover:bg-primary/60";

  const commit = () => {
    const v = draft.trim();
    if (!v) return;
    if (values.includes(v)) {
      setDraft("");
      return;
    }
    onChange([...values, v]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          onBlur={commit}
          placeholder={placeholder}
          className={`${INPUT_PILL} flex-1`}
        />
        {addLabel ? (
          <Button
            type="button"
            variant="outline"
            onClick={commit}
            className="h-12 rounded-full px-5 shrink-0 font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={commit}
            aria-label="Ajouter"
            className="h-12 w-12 rounded-full shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>
        )}
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {values.map((v, i) => (
            <button
              key={`${v}-${i}`}
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${accentClass}`}
            >
              {v}
              <X className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── helpers ────────────────────────────────────────────────────────────
function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "kit"
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
