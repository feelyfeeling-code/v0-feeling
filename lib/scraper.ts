export interface JobData {
  title: string
  company: string
  description: string
  location: string
  type: string
  remote: string
  salary?: string
  requirements?: string[]
  benefits?: string[]
  rawHtml?: string
}

/**
 * Scrapes job offer data from various job board URLs.
 *
 * Strategy (in priority order) :
 *   1. JSON-LD JobPosting structured data (schema.org) — le plus fiable,
 *      utilisé par la majorité des sites d'emploi pour le SEO.
 *   2. OpenGraph meta tags (og:title, og:site_name, og:description) — fallback.
 *   3. Regex spécifiques au domaine (LinkedIn, WTTJ, Indeed) — dernier recours.
 *   4. Extraction générique depuis <title> + <h1>.
 */
export async function scrapeJobOffer(url: string): Promise<JobData> {
  const parsedUrl = new URL(url)
  const hostname = parsedUrl.hostname.toLowerCase()

  const response = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`)
  }

  const html = await response.text()

  // --- 1. Tentative JSON-LD JobPosting ---
  const jsonLd = extractJobPostingJsonLd(html)

  // --- 2. Meta OpenGraph ---
  const og = extractOpenGraph(html)

  // --- 3. Parsers spécifiques au domaine (pour extraire la description) ---
  let description = ''
  let type = ''
  let remote = ''
  let location = ''

  if (hostname.includes('linkedin.com')) {
    const linkedin = parseLinkedInDetails(html)
    description = linkedin.description
    location = linkedin.location
  } else if (
    hostname.includes('welcometothejungle') ||
    hostname.includes('wttj')
  ) {
    const wttj = parseWttjDetails(html)
    description = wttj.description
    location = wttj.location
  } else if (hostname.includes('indeed')) {
    const indeed = parseIndeedDetails(html)
    description = indeed.description
    location = indeed.location
  }

  // Fallback description : tout le texte principal de la page
  if (!description) {
    description = extractTextContent(html)
  }

  // --- 4. Assemblage final : priorité JSON-LD > OG > regex ---
  const title =
    jsonLd.title ||
    og.title ||
    extractFromH1OrTitle(html) ||
    'Poste non spécifié'

  const company =
    jsonLd.company ||
    og.siteName ||
    extractCompanyFallback(html) ||
    'Entreprise non spécifiée'

  const finalLocation =
    jsonLd.location || location || extractLocation(html) || 'Non spécifié'

  type = jsonLd.type || extractContractType(html) || 'Non spécifié'
  remote = jsonLd.remote || extractRemoteInfo(html) || 'Non spécifié'

  return {
    title: cleanText(title),
    company: cleanText(company),
    description: description || og.description || '',
    location: cleanText(finalLocation),
    type: cleanText(type),
    remote: cleanText(remote),
    salary: jsonLd.salary,
    rawHtml: html,
  }
}

// --- Extracteurs ---------------------------------------------------------

interface JsonLdJob {
  title: string
  company: string
  location: string
  type: string
  remote: string
  salary?: string
  description?: string
}

/**
 * Parcourt tous les blocs <script type="application/ld+json"> et extrait
 * le premier objet de type "JobPosting" (ou un tableau en contenant).
 */
function extractJobPostingJsonLd(html: string): Partial<JsonLdJob> {
  const scriptRegex =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null

  while ((match = scriptRegex.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(match[1].trim())
      const jobPosting = findJobPosting(parsed)
      if (jobPosting) {
        return normalizeJobPosting(jobPosting)
      }
    } catch {
      // JSON mal formé — on ignore et on passe au suivant
      continue
    }
  }
  return {}
}

function findJobPosting(data: unknown): Record<string, unknown> | null {
  if (!data) return null
  if (Array.isArray(data)) {
    for (const item of data) {
      const found = findJobPosting(item)
      if (found) return found
    }
    return null
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    const type = obj['@type']
    if (
      type === 'JobPosting' ||
      (Array.isArray(type) && type.includes('JobPosting'))
    ) {
      return obj
    }
    // Parcours récursif des champs imbriqués (@graph, itemListElement, etc.)
    if (obj['@graph']) return findJobPosting(obj['@graph'])
    if (obj.itemListElement) return findJobPosting(obj.itemListElement)
  }
  return null
}

function normalizeJobPosting(
  posting: Record<string, unknown>,
): Partial<JsonLdJob> {
  const result: Partial<JsonLdJob> = {}

  // Title
  if (typeof posting.title === 'string') result.title = posting.title

  // Company
  const hiringOrg = posting.hiringOrganization
  if (typeof hiringOrg === 'string') {
    result.company = hiringOrg
  } else if (
    hiringOrg &&
    typeof hiringOrg === 'object' &&
    typeof (hiringOrg as Record<string, unknown>).name === 'string'
  ) {
    result.company = (hiringOrg as Record<string, string>).name
  }

  // Location
  const jobLocation = posting.jobLocation
  if (jobLocation) {
    const locArray = Array.isArray(jobLocation) ? jobLocation : [jobLocation]
    const locStrings: string[] = []
    for (const loc of locArray) {
      if (typeof loc === 'string') {
        locStrings.push(loc)
        continue
      }
      if (loc && typeof loc === 'object') {
        const addr = (loc as Record<string, unknown>).address
        if (typeof addr === 'string') locStrings.push(addr)
        else if (addr && typeof addr === 'object') {
          const a = addr as Record<string, unknown>
          const parts = [a.addressLocality, a.addressRegion, a.addressCountry]
            .filter((p): p is string => typeof p === 'string' && p.length > 0)
          if (parts.length > 0) locStrings.push(parts.join(', '))
        }
      }
    }
    if (locStrings.length > 0) result.location = locStrings.join(' / ')
  }

  // Employment type (CDI, CDD, etc.)
  const empType = posting.employmentType
  if (typeof empType === 'string') {
    result.type = mapEmploymentType(empType)
  } else if (Array.isArray(empType)) {
    result.type = empType
      .filter((t): t is string => typeof t === 'string')
      .map(mapEmploymentType)
      .join(', ')
  }

  // Remote / télétravail
  const jobLocationType = posting.jobLocationType
  if (jobLocationType === 'TELECOMMUTE') {
    result.remote = 'Full remote'
  }

  // Salary
  const baseSalary = posting.baseSalary
  if (baseSalary && typeof baseSalary === 'object') {
    const bs = baseSalary as Record<string, unknown>
    const value = bs.value
    if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>
      const min = v.minValue
      const max = v.maxValue
      const currency = bs.currency || 'EUR'
      if (typeof min === 'number' && typeof max === 'number') {
        result.salary = `${min} - ${max} ${currency}`
      } else if (typeof v.value === 'number') {
        result.salary = `${v.value} ${currency}`
      }
    }
  }

  // Description
  if (typeof posting.description === 'string') {
    result.description = cleanHtml(posting.description)
  }

  return result
}

function mapEmploymentType(raw: string): string {
  const upper = raw.toUpperCase()
  if (upper.includes('FULL_TIME') || upper.includes('FULLTIME')) return 'CDI'
  if (upper.includes('PART_TIME') || upper.includes('PARTTIME'))
    return 'Temps partiel'
  if (upper.includes('CONTRACTOR') || upper.includes('CONTRACT')) return 'CDD'
  if (upper.includes('TEMPORARY') || upper.includes('INTERIM')) return 'Intérim'
  if (upper.includes('INTERN')) return 'Stage'
  return raw
}

interface OgData {
  title?: string
  siteName?: string
  description?: string
}

function extractOpenGraph(html: string): OgData {
  const og: OgData = {}
  const matches = html.matchAll(
    /<meta\s+[^>]*(?:property|name)=["'](og:[a-z_]+)["'][^>]*content=["']([^"']+)["'][^>]*>/gi,
  )
  for (const m of matches) {
    const key = m[1]
    const value = m[2]
    if (key === 'og:title') og.title = value
    else if (key === 'og:site_name') og.siteName = value
    else if (key === 'og:description') og.description = value
  }
  // Inversion de l'ordre des attributs (content avant property)
  if (!og.title) {
    const alt = html.matchAll(
      /<meta\s+[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["'](og:[a-z_]+)["'][^>]*>/gi,
    )
    for (const m of alt) {
      const value = m[1]
      const key = m[2]
      if (key === 'og:title' && !og.title) og.title = value
      else if (key === 'og:site_name' && !og.siteName) og.siteName = value
      else if (key === 'og:description' && !og.description) og.description = value
    }
  }
  return og
}

function extractFromH1OrTitle(html: string): string | null {
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) return cleanHtml(h1[1])
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  if (title) return cleanText(title[1])
  return null
}

function extractCompanyFallback(html: string): string | null {
  // Patterns génériques pour retrouver le nom d'une entreprise
  const patterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /class=["'][^"']*company[-_]?name[^"']*["'][^>]*>([^<]+)</i,
    /<span[^>]*>Entreprise\s*:\s*([^<]+)</i,
    /<a[^>]*href=["']\/companies\/[^"']+["'][^>]*>([^<]+)</i,
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m && m[1]) return cleanText(m[1])
  }
  return null
}

// --- Parsers spécifiques (description + location uniquement) ------------

function parseLinkedInDetails(html: string): { description: string; location: string } {
  const descMatch =
    html.match(
      /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    ) ||
    html.match(
      /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    )
  const locMatch = html.match(
    /<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([^<]+)</i,
  )
  return {
    description: descMatch ? cleanHtml(descMatch[1]) : '',
    location: locMatch ? cleanText(locMatch[1]) : '',
  }
}

function parseWttjDetails(html: string): { description: string; location: string } {
  const descMatch =
    html.match(
      /<div[^>]*data-testid=["']job-section-description["'][^>]*>([\s\S]*?)<\/div>/i,
    ) ||
    html.match(
      /<section[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    )
  const locMatch = html.match(
    /data-testid=["']job-location["'][^>]*>([^<]+)</i,
  )
  return {
    description: descMatch ? cleanHtml(descMatch[1]) : '',
    location: locMatch ? cleanText(locMatch[1]) : '',
  }
}

function parseIndeedDetails(html: string): { description: string; location: string } {
  const descMatch = html.match(
    /<div[^>]*id=["']jobDescriptionText["'][^>]*>([\s\S]*?)<\/div>/i,
  )
  const locMatch =
    html.match(
      /<div[^>]*data-testid=["']inlineHeader-companyLocation["'][^>]*>([^<]+)</i,
    ) ||
    html.match(
      /class="[^"]*companyLocation[^"]*"[^>]*>([^<]+)</i,
    )
  return {
    description: descMatch ? cleanHtml(descMatch[1]) : '',
    location: locMatch ? cleanText(locMatch[1]) : '',
  }
}

// --- Utilitaires ----------------------------------------------------------

function cleanHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

function extractTextContent(html: string): string {
  let cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')

  const mainMatch =
    cleaned.match(/<main[^>]*>([\s\S]*?)<\/main>/i) ||
    cleaned.match(/<article[^>]*>([\s\S]*?)<\/article>/i) ||
    cleaned.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i)

  if (mainMatch) cleaned = mainMatch[1]

  return cleanHtml(cleaned).slice(0, 10000)
}

function extractContractType(html: string): string {
  const patterns = [
    /\b(CDI|CDD|Stage|Alternance|Freelance|Intérim)\b/i,
    /contract[^>]*type[^>]*>([^<]+)</i,
    /type[^>]*de[^>]*contrat[^>]*>([^<]+)</i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return cleanText(match[1] || match[0])
  }
  return ''
}

function extractRemoteInfo(html: string): string {
  const lower = html.toLowerCase()
  if (
    lower.includes('100% télétravail') ||
    lower.includes('full remote') ||
    lower.includes('entièrement à distance')
  )
    return 'Full remote'
  if (
    lower.includes('télétravail partiel') ||
    lower.includes('hybride') ||
    lower.includes('hybrid')
  )
    return 'Hybride'
  if (
    lower.includes('présentiel') ||
    lower.includes('sur site') ||
    lower.includes('on-site')
  )
    return 'Sur site'
  if (lower.includes('télétravail') || lower.includes('remote'))
    return 'Télétravail possible'
  return ''
}

function extractLocation(html: string): string {
  const patterns = [
    /location[^>]*>([^<]+)</i,
    /lieu[^>]*>([^<]+)</i,
    /\b(Paris|Lyon|Marseille|Bordeaux|Toulouse|Nantes|Lille|Nice|Strasbourg|Rennes)[^<]*/i,
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return cleanText(match[1] || match[0])
  }
  return ''
}
