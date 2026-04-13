import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Collecte et traitement des données personnelles - Feeling',
  description: 'Comment Feeling collecte et traite vos données personnelles',
}

export default function DonneesPersonnellesPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif font-bold text-4xl mb-2">Collecte et traitement des données personnelles</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2026</p>

        <article className="max-w-none space-y-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:pt-10 [&_h2]:border-t-2 [&_h2]:border-foreground/20 [&>p:first-of-type]:mt-0 [&_p]:leading-relaxed [&_p]:my-4 [&_a]:underline [&_a]:text-primary">
          <p>
            Chez Feeling, on prend la protection de tes données au sérieux. Voici ce qu&apos;on collecte, pourquoi, et comment on les utilise.
          </p>

          <h2>Ce qu&apos;on collecte</h2>
          <p>
            Pour faire fonctionner Feeling, on a besoin de quelques informations sur toi : ton adresse email, ton mot de passe, et les réponses que tu nous donnes lors de l&apos;onboarding (ta personnalité, tes valeurs, tes ambitions). On collecte aussi les offres d&apos;emploi que tu analyses via Feeling.
          </p>

          <h2>Pourquoi on les collecte</h2>
          <p>
            Ces données nous servent uniquement à te proposer une analyse personnalisée et à améliorer ton expérience sur Feeling. On ne les vend pas, on ne les partage pas avec des tiers à des fins commerciales.
          </p>

          <h2>Combien de temps on les garde</h2>
          <p>
            Tes données sont conservées tant que ton compte est actif. Tu peux demander leur suppression à tout moment en nous contactant à <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>.
          </p>

          <h2>Tes droits</h2>
          <p>
            Conformément au RGPD, tu as le droit d&apos;accéder à tes données, de les corriger, de les supprimer ou de t&apos;opposer à leur traitement. Pour exercer ces droits, écris-nous à <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>.
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
