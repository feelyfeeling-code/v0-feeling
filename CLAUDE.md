# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Start development server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
```

No test suite is configured.

## Architecture

**Feeling** is a French job-matching SaaS app. Users complete a personality/values onboarding, then paste a job URL — the app scrapes the listing and uses Claude AI to score compatibility against the user's profile.

### Stack

- **Next.js 16 App Router** with React 19 and TypeScript
- **Supabase** for auth (SSR) and PostgreSQL database
- **Anthropic AI SDK** (`ai` v6) with Zod structured output for job analysis
- **shadcn/ui** (New York style) + Tailwind CSS 4.2 + Lucide icons
- **Recharts** for compatibility score visualization

### Route Structure

| Path | Type | Purpose |
|------|------|---------|
| `/` | Public | Landing page (redirects authed users to `/accueil`) |
| `/connexion`, `/inscription` | Public | Auth forms |
| `/onboarding` | Protected | 5-step wizard (personality → values → dream job → academic) |
| `/accueil` | Protected | Dashboard — paste job URL, trigger analysis |
| `/profil-technique` | Protected | Manage skills & work experience |
| `/resultats/[id]` | Protected | Quick analysis results |
| `/resultats-complets/[id]` | Protected | Full analysis results |
| `/auth/callback` | System | Supabase OAuth exchange |

### API Routes

- `POST /api/analyze` — Quick job analysis (personality + values match)
- `POST /api/analyze-complete` — Full analysis including technical profile
- `POST /api/profile/technical` — Save technical profile (skills + experience)

### Key Directories

- [lib/ai-analysis.ts](lib/ai-analysis.ts) — Claude AI structured analysis using Zod; scores personality/values/skills fit; detects 8 dealbreaker types; caps score at 30/100 if dealbreakers present
- [lib/scraper.ts](lib/scraper.ts) — Job scraper supporting LinkedIn, Welcome to the Jungle, Indeed, and generic HTML pages
- [lib/supabase/](lib/supabase/) — Supabase client setup (browser vs. server/SSR split)
- [middleware.ts](middleware.ts) — Session validation for all protected routes
- [components/onboarding/steps/](components/onboarding/steps/) — 5 onboarding step components
- [components/results/](components/results/) — `results-view.tsx` and `complete-results-view.tsx`

### Database Tables (Supabase)

- `profiles` — user metadata (first_name, onboarding_completed)
- `personality_profiles` — Big Five traits
- `values_profiles` — 10 value dimensions (work-life balance, salary, growth, etc.)
- `dream_jobs` — career preferences (industries, company sizes, remote, salary)
- `technical_profiles` — skills and work experience
- `job_analyses` — analysis results with compatibility scores

### Design System

Tailwind CSS 4.2 with OKLCh color tokens:
- Primary (lavender): `#D4C4FB`
- Secondary (peach): `#FFE8D6`
- Accent (mint): `#A8F0C6`

Fonts: DM Sans (body), Fraunces (headings/serif), Geist Mono (code).

All UI copy is in **French**.

### Notes

- `next.config.mjs` ignores TypeScript errors and disables image optimization — do not rely on build-time type checking to catch errors
- Path alias `@/*` maps to the project root
- Bootstrapped via Vercel v0; Vercel Analytics is active in production
