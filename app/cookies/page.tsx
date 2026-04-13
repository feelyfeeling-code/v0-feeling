import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Gestion des cookies - Feeling',
}

export default function CookiesPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif font-bold text-4xl mb-2">Gestion des cookies</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2025</p>

        <article className="max-w-none space-y-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:pt-10 [&_h2]:border-t-2 [&_h2]:border-foreground/20 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_a]:underline [&_a]:text-primary">
          <h2>1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p>
            Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) lors de votre visite sur une application web. Il permet de mémoriser des informations relatives à votre navigation.
          </p>

          <h2>2. Cookies utilisés par Feeling</h2>

          <h3>Cookies strictement nécessaires</h3>
          <p>
            Ces cookies sont indispensables au fonctionnement de l&apos;application. Ils ne nécessitent pas votre consentement.
          </p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left font-medium">Nom</th>
                  <th className="border p-3 text-left font-medium">Finalité</th>
                  <th className="border p-3 text-left font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">session_id</td>
                  <td className="border p-3">Maintenir votre session connectée</td>
                  <td className="border p-3">Durée de la session</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">csrf_token</td>
                  <td className="border p-3">Protection contre les attaques CSRF</td>
                  <td className="border p-3">Durée de la session</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3>Cookies analytiques</h3>
          <p>
            Ces cookies nous permettent de mesurer l&apos;audience de l&apos;application et d&apos;améliorer l&apos;expérience utilisateur. Ils sont déposés uniquement avec votre consentement.
          </p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left font-medium">Nom</th>
                  <th className="border p-3 text-left font-medium">Finalité</th>
                  <th className="border p-3 text-left font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">_analytics</td>
                  <td className="border p-3">Mesure du nombre de visiteurs et des pages consultées</td>
                  <td className="border p-3">13 mois</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">_session_analytics</td>
                  <td className="border p-3">Analyse des parcours de navigation (anonymisée)</td>
                  <td className="border p-3">30 minutes</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            Les données analytiques sont traitées de manière anonymisée et ne permettent pas de vous identifier personnellement.
          </p>

          <h2>3. Gestion de votre consentement</h2>
          <p>
            Lors de votre première visite sur Feeling, un bandeau vous informe de l&apos;utilisation des cookies et vous permet de :
          </p>
          <ul>
            <li>Accepter tous les cookies</li>
            <li>Refuser les cookies non essentiels</li>
            <li>Personnaliser vos préférences</li>
          </ul>
          <p>
            Vous pouvez modifier vos choix à tout moment en cliquant sur le lien «&nbsp;Gérer mes cookies&nbsp;» disponible dans le footer de l&apos;application.
          </p>

          <h2>4. Comment supprimer les cookies ?</h2>
          <p>Vous pouvez également gérer les cookies directement depuis les paramètres de votre navigateur :</p>
          <ul>
            <li>Chrome : Paramètres &gt; Confidentialité et sécurité &gt; Cookies</li>
            <li>Firefox : Paramètres &gt; Vie privée et sécurité &gt; Cookies</li>
            <li>Safari : Préférences &gt; Confidentialité &gt; Cookies</li>
            <li>Edge : Paramètres &gt; Confidentialité, recherche et services &gt; Cookies</li>
          </ul>
          <p>
            La désactivation des cookies strictement nécessaires peut altérer le fonctionnement de l&apos;application (impossibilité de rester connecté, etc.).
          </p>

          <h2>5. Contact</h2>
          <p>
            Pour toute question relative à notre utilisation des cookies, contactez-nous à :{' '}
            <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
