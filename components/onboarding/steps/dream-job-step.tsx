"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { FeelyMascot } from "@/components/feely-mascot";
import { ArrowLeft, Plus, X, HelpCircle, Loader2 } from "lucide-react";
import type { OnboardingData } from "../onboarding-flow";

interface DreamJobStepProps {
  data: OnboardingData["dreamJob"];
  onUpdate: (updates: Partial<OnboardingData["dreamJob"]>) => void;
  onComplete: () => void;
  onPrev: () => void;
  isSubmitting: boolean;
}

const RADIUS_OPTIONS: { value: string; label: string }[] = [
  { value: "10", label: "10 km" },
  { value: "20", label: "20 km" },
  { value: "40", label: "40 km" },
  { value: "50", label: "50 km" },
  { value: "100", label: "100 km" },
  { value: "0", label: "Indifférent" },
];

const SALARY_OPTIONS: { value: string; label: string }[] = [
  { value: "less_30k", label: "Moins de 30k € (brut/an)" },
  { value: "30_35k", label: "30 – 35k €" },
  { value: "35_40k", label: "35 – 40k €" },
  { value: "40_45k", label: "40 – 45k €" },
  { value: "45_50k", label: "45 – 50k €" },
  { value: "50_60k", label: "50 – 60k €" },
  { value: "more_60k", label: "Plus de 60k €" },
  { value: "no_preference", label: "Je découvre, je ne sais pas encore" },
];

const REMOTE_OPTIONS: { value: string; label: string }[] = [
  { value: "full_remote", label: "Full remote" },
  { value: "hybrid", label: "Hybride" },
  { value: "onsite", label: "Présentiel" },
  { value: "flexible", label: "Flexible" },
];

export function DreamJobStep({
  data,
  onUpdate,
  onComplete,
  onPrev,
  isSubmitting,
}: DreamJobStepProps) {
  const [jobTitleInput, setJobTitleInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [industryInput, setIndustryInput] = useState("");

  // Garde-fous : protège contre un état hydraté corrompu.
  const jobTitlesList = data.job_titles ?? [];
  const locationsList = data.locations ?? [];
  const industriesList = data.industries ?? [];
  const salaryRange = data.salary_range ?? "";
  const remotePref = data.remote_preference ?? "";
  const locationRadius = data.location_radius ?? 40;

  const addJobTitle = () => {
    const value = jobTitleInput.trim();
    if (!value) return;
    if (jobTitlesList.includes(value)) {
      setJobTitleInput("");
      return;
    }
    onUpdate({ job_titles: [...jobTitlesList, value] });
    setJobTitleInput("");
  };

  const removeJobTitle = (value: string) => {
    onUpdate({ job_titles: jobTitlesList.filter((t) => t !== value) });
  };

  const handleJobTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addJobTitle();
    }
  };

  const addLocation = () => {
    const value = locationInput.trim();
    if (!value) return;
    if (locationsList.includes(value)) {
      setLocationInput("");
      return;
    }
    onUpdate({ locations: [...locationsList, value] });
    setLocationInput("");
  };

  const removeLocation = (value: string) => {
    onUpdate({ locations: locationsList.filter((l) => l !== value) });
  };

  const addIndustry = () => {
    const value = industryInput.trim();
    if (!value) return;
    if (industriesList.includes(value)) {
      setIndustryInput("");
      return;
    }
    onUpdate({ industries: [...industriesList, value] });
    setIndustryInput("");
  };

  const removeIndustry = (value: string) => {
    onUpdate({ industries: industriesList.filter((i) => i !== value) });
  };

  const handleLocationKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addLocation();
    }
  };

  const handleIndustryKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addIndustry();
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 relative">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Retour"
        className="absolute left-0 top-8 w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      <div className="text-center mb-10">
        <FeelyMascot variant="purple" size="lg" className="mx-auto mb-4" />
        <h1 className="text-2xl md:text-3xl font-bold">
          Le bon job selon toi, c&apos;est quoi&nbsp;?
        </h1>
      </div>

      <div className="space-y-6">
        {/* Quel poste tu vises ? */}
        <div className="space-y-2">
          <Label htmlFor="job-title-input" className="text-base font-semibold">
            Quel poste tu vises&nbsp;?
          </Label>
          <div className="flex gap-2">
            <Input
              id="job-title-input"
              placeholder="Ex : Product Manager, UX Designer... (Entrée pour valider)"
              value={jobTitleInput}
              onChange={(e) => setJobTitleInput(e.target.value)}
              onKeyDown={handleJobTitleKeyDown}
              onBlur={addJobTitle}
              className="h-12 rounded-full flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addJobTitle}
              aria-label="Ajouter un intitulé de poste"
              className="h-12 w-12 rounded-full flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {jobTitlesList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {jobTitlesList.map((title) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => removeJobTitle(title)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors"
                >
                  {title}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Où tu veux travailler ? + rayon */}
        <div className="space-y-2">
          <Label htmlFor="location-input" className="text-base font-semibold">
            Où tu veux travailler&nbsp;?
          </Label>
          <div className="flex gap-2">
            <Input
              id="location-input"
              placeholder="Ex : Paris, Lyon, remote... (Entrée pour valider)"
              value={locationInput}
              onChange={(e) => setLocationInput(e.target.value)}
              onKeyDown={handleLocationKeyDown}
              onBlur={addLocation}
              className="h-12 rounded-full flex-1 min-w-0"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addLocation}
              aria-label="Ajouter une localisation"
              className="h-12 w-12 rounded-full flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Select
              value={String(locationRadius)}
              onValueChange={(value) =>
                onUpdate({ location_radius: parseInt(value, 10) })
              }
            >
              <SelectTrigger className="w-32 !h-12 rounded-full flex-shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RADIUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {locationsList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {locationsList.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => removeLocation(loc)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors"
                >
                  {loc}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dans quel secteur tu te vois ? */}
        <div className="space-y-2">
          <Label htmlFor="industry-input" className="text-base font-semibold">
            Dans quel secteur tu te vois&nbsp;?
          </Label>
          <div className="flex gap-2">
            <Input
              id="industry-input"
              placeholder="Ex : Tech, Santé, Finance... (Entrée pour valider)"
              value={industryInput}
              onChange={(e) => setIndustryInput(e.target.value)}
              onKeyDown={handleIndustryKeyDown}
              onBlur={addIndustry}
              className="h-12 rounded-full flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={addIndustry}
              aria-label="Ajouter un secteur"
              className="h-12 w-12 rounded-full flex-shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          {industriesList.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {industriesList.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => removeIndustry(sector)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/30 text-sm font-medium hover:bg-primary/50 transition-colors"
                >
                  {sector}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Salaire + Télétravail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="salary-range" className="text-base font-semibold">
              Quel salaire vises-tu&nbsp;?
            </Label>
            <Select
              value={salaryRange}
              onValueChange={(value) => onUpdate({ salary_range: value })}
            >
              <SelectTrigger
                id="salary-range"
                className="w-full !h-12 rounded-full"
              >
                <SelectValue placeholder="Ta fourchette souhaitée" />
              </SelectTrigger>
              <SelectContent>
                {SALARY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="remote-pref"
              className="text-base font-semibold inline-flex items-center gap-2"
            >
              Ton rapport avec télétravail&nbsp;?
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-label="Aide sur les options de télétravail"
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/30 cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  side="top"
                  className="bg-primary text-foreground rounded-2xl px-4 py-3 text-sm shadow-lg [&_svg]:fill-primary [&_svg]:bg-primary"
                >
                  <ul className="space-y-1.5">
                    <li>
                      <span className="font-semibold">Full remote</span> : 100 %
                      à distance
                    </li>
                    <li>
                      <span className="font-semibold">Hybride</span> : mix
                      bureau / maison
                    </li>
                    <li>
                      <span className="font-semibold">Présentiel</span> : 100 %
                      sur site
                    </li>
                    <li>
                      <span className="font-semibold">Flexible</span> : au cas
                      par cas
                    </li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Select
              value={remotePref}
              onValueChange={(value) => onUpdate({ remote_preference: value })}
            >
              <SelectTrigger
                id="remote-pref"
                className="w-full !h-12 rounded-full"
              >
                <SelectValue placeholder="Ex : hybride, full remote..." />
              </SelectTrigger>
              <SelectContent>
                {REMOTE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-10 max-w-md mx-auto">
        <Button
          onClick={onComplete}
          disabled={isSubmitting}
          className="w-full h-14 rounded-full bg-primary text-foreground hover:bg-primary/90 text-base font-bold disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>
    </div>
  );
}
