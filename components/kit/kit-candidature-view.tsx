"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FeelingLogo } from "@/components/feeling-logo";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  ArrowLeft,
  Download,
  FileText,
  Mail,
  Sparkles,
  Loader2,
} from "lucide-react";
import type { CVData } from "@/lib/kit/cv-builder";
import { formatPeriod } from "@/lib/kit/cv-builder";

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
  const router = useRouter();
  const [cv, setCv] = useState<CVData | null>(initialCv);
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

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const handleGenerateCv = async () => {
    setIsGeneratingCv(true);
    const toastId = toast.loading("Génération du CV en cours...");
    try {
      const res = await fetch("/api/kit/init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la génération");
      // L'API a déjà persisté le CV. On évite un auto-save redondant en armant
      // à nouveau le flag skip pour le prochain useEffect déclenché par setCv.
      skipFirstCvSave.current = true;
      setCv(data.cv);
      if (data.coverLetter) {
        skipFirstLetterSave.current = true;
        setCoverLetter(data.coverLetter);
      }
      toast.success("CV généré", { id: toastId });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur", { id: toastId });
    } finally {
      setIsGeneratingCv(false);
    }
  };

  const handleGenerateLetter = async () => {
    setIsGeneratingLetter(true);
    const toastId = toast.loading("Rédaction de la lettre en cours...");
    try {
      const res = await fetch("/api/kit/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId: analysis.id }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Erreur lors de la génération");
      skipFirstLetterSave.current = true;
      setCoverLetter(data.coverLetter);
      toast.success("Lettre générée", { id: toastId });
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
      <header className="sticky top-0 z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <FeelingLogo size="md" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="text-muted-foreground"
          >
            Déconnexion
          </Button>
        </div>
      </header>

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
            <h1 className="text-3xl md:text-4xl font-display font-extrabold">
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
          <section className="rounded-2xl border border-primary/30 bg-primary/5 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
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
                    onClick={handleGenerateCv}
                    disabled={isGeneratingCv}
                    className="h-11"
                  >
                    {isGeneratingCv ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Génération...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Adapter mon CV
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <CVEditor cv={cv} updateCv={updateCv} />
              )}

              {cv && (
                <div className="pt-2 border-t border-primary/20">
                  <Button
                    onClick={handleDownloadCv}
                    disabled={isDownloadingCv}
                    className="w-full h-11 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isDownloadingCv ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger le CV en PDF
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* Cover letter section */}
          <section className="rounded-2xl border border-secondary bg-secondary/30 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-secondary">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
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
                    onClick={handleGenerateLetter}
                    disabled={isGeneratingLetter}
                    className="h-11"
                  >
                    {isGeneratingLetter ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Rédaction...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Preparer ma lettre
                      </>
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
                <div className="pt-2 border-t border-secondary">
                  <Button
                    onClick={handleDownloadLetter}
                    disabled={isDownloadingLetter}
                    className="w-full h-11 bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isDownloadingLetter ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Télécharger la lettre en PDF
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

// ─── CV editor ──────────────────────────────────────────────────────────
function CVEditor({
  cv,
  updateCv,
}: {
  cv: CVData;
  updateCv: (updater: (prev: CVData) => CVData) => void;
}) {
  return (
    <div className="space-y-6">
      {/* Identity */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Identité
        </p>
        <Input
          value={cv.identity.fullName}
          onChange={(e) =>
            updateCv((prev) => ({
              ...prev,
              identity: { ...prev.identity, fullName: e.target.value },
            }))
          }
          placeholder="Nom complet"
          className="bg-background font-bold text-lg"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <Input
            value={cv.identity.email ?? ""}
            onChange={(e) =>
              updateCv((prev) => ({
                ...prev,
                identity: { ...prev.identity, email: e.target.value || null },
              }))
            }
            placeholder="Email"
            className="bg-background"
          />
          <Input
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
            placeholder="Ville"
            className="bg-background"
          />
        </div>
      </div>

      {/* Headline */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Intitulé / objectif
        </p>
        <Input
          value={cv.headline}
          onChange={(e) =>
            updateCv((prev) => ({ ...prev, headline: e.target.value }))
          }
          className="bg-background"
        />
      </div>

      {/* Summary */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Profil
        </p>
        <Textarea
          value={cv.summary}
          onChange={(e) =>
            updateCv((prev) => ({ ...prev, summary: e.target.value }))
          }
          rows={3}
          className="bg-background"
        />
      </div>

      {/* Experiences */}
      {cv.experiences.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Expériences ({cv.experiences.length})
          </p>
          <div className="space-y-3">
            {cv.experiences.map((exp, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background p-3 space-y-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold">{exp.jobTitle}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPeriod(exp.startDate, exp.endDate, exp.isCurrent)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {exp.companyName}
                  {exp.location ? ` · ${exp.location}` : ""}
                </p>
                <Textarea
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
                  rows={3}
                  placeholder="Missions principales..."
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {cv.education.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Formation
          </p>
          <div className="space-y-2">
            {cv.education.map((edu, i) => (
              <div
                key={i}
                className="rounded-lg border border-border bg-background p-3 text-sm"
              >
                <p className="font-bold">{edu.diploma}</p>
                <p className="text-xs text-muted-foreground">
                  {edu.school}
                  {edu.fields?.length ? ` · ${edu.fields.join(", ")}` : ""}
                  {edu.graduationDate
                    ? ` · ${edu.graduationDate.slice(0, 7)}`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hard skills */}
      {(cv.skills.highlighted.length > 0 || cv.skills.others.length > 0) && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Compétences techniques
            <span className="ml-2 font-normal normal-case text-[10px] tracking-normal">
              (en violet : alignées sur l&apos;offre)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {cv.skills.highlighted.map((s, i) => (
              <span
                key={`h-${i}`}
                className="px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-xs font-medium"
              >
                {s}
              </span>
            ))}
            {cv.skills.others.map((s, i) => (
              <span
                key={`o-${i}`}
                className="px-3 py-1 rounded-full bg-muted border border-border text-xs"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Soft skills */}
      {cv.softSkills && cv.softSkills.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Points forts comportementaux
            <span className="ml-2 font-normal normal-case text-[10px] tracking-normal">
              (dérivés de tes traits et valeurs)
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {cv.softSkills.map((s, i) => (
              <span
                key={`s-${i}`}
                className="px-3 py-1 rounded-full bg-secondary/60 border border-secondary text-xs font-medium"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Values */}
      {cv.values.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Valeurs professionnelles
          </p>
          <div className="flex flex-wrap gap-2">
            {cv.values.map((v, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-accent/30 border border-accent text-xs"
              >
                {v}
              </span>
            ))}
          </div>
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
