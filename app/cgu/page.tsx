import { Footer } from '@/components/footer'

export const metadata = {
  title: 'CGU - Feeling',
  description: "Conditions Générales d'Utilisation",
}

export default function CGUPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif font-bold text-4xl mb-2">Conditions Générales d&apos;Utilisation</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2026</p>

        <article className="max-w-none space-y-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:pt-10 [&_h2]:border-t-2 [&_h2]:border-foreground/20 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_a]:underline [&_a]:text-primary">
          <h2>1. Présentation</h2>
          <p>
            Feeling est une application web développée dans le cadre d&apos;un projet de master. Elle permet aux utilisateurs de créer un profil, de renseigner leur parcours professionnel (formations et expériences) ainsi que leurs valeurs personnelles, dans le but de trouver des opportunités professionnelles alignées avec leurs valeurs.
          </p>
          <p>
            L&apos;utilisation de l&apos;application implique l&apos;acceptation pleine et entière des présentes CGU.
          </p>

          <h2>2. Accès à l&apos;application</h2>
          <p>
            L&apos;accès à Feeling est gratuit. L&apos;application est accessible depuis tout navigateur web moderne, sous réserve de disponibilité des serveurs.
          </p>
          <p>
            Les auteurs se réservent le droit de modifier, suspendre ou interrompre l&apos;accès à l&apos;application à tout moment, sans préavis, notamment pour des raisons de maintenance ou d&apos;évolution du projet.
          </p>

          <h2>3. Création de compte</h2>
          <p>
            Pour accéder aux fonctionnalités de l&apos;application, l&apos;utilisateur doit créer un compte en fournissant :
          </p>
          <ul>
            <li>Un nom et prénom</li>
            <li>Une adresse e-mail valide</li>
            <li>Un mot de passe sécurisé</li>
            <li>Sa localisation</li>
            <li>Son parcours professionnel (formations et expériences)</li>
            <li>Ses valeurs personnelles (hors croyances religieuses, opinions politiques ou autres données sensibles au sens du RGPD)</li>
          </ul>
          <p>
            L&apos;utilisateur s&apos;engage à fournir des informations exactes, sincères et à jour. Toute usurpation d&apos;identité ou fourniture de données mensongères pourra entraîner la suppression immédiate du compte. L&apos;utilisateur est seul responsable de la confidentialité de ses identifiants de connexion. Il s&apos;engage à ne pas les partager avec des tiers.
          </p>

          <h2>4. Comportement de l&apos;utilisateur</h2>
          <p>En utilisant Feeling, l&apos;utilisateur s&apos;engage à :</p>
          <ul>
            <li>Ne pas utiliser l&apos;application à des fins illicites ou contraires aux bonnes mœurs</li>
            <li>Ne pas tenter de porter atteinte au bon fonctionnement de l&apos;application (attaques, injections, scraping abusif, etc.)</li>
            <li>Ne pas publier de contenu offensant, discriminatoire, ou portant atteinte aux droits de tiers</li>
            <li>Respecter la vie privée des autres utilisateurs</li>
            <li>Ne pas transmettre de virus ou tout autre programme malveillant</li>
          </ul>

          <h2>5. Propriété intellectuelle</h2>
          <p>
            Tout le contenu de l&apos;application (code, design, textes, structure) est la propriété de ses auteurs et est protégé par le droit de la propriété intellectuelle français.
          </p>
          <p>
            L&apos;utilisateur conserve la propriété des données qu&apos;il renseigne sur son profil mais accorde aux auteurs un droit d&apos;usage dans le cadre exclusif du fonctionnement de l&apos;application.
          </p>

          <h2>6. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est encadré par notre Politique de Confidentialité. Conformément au RGPD, l&apos;utilisateur dispose de droits d&apos;accès, de rectification, de suppression et de portabilité de ses données.
          </p>

          <h2>7. Responsabilité</h2>
          <p>
            Feeling étant un projet étudiant à caractère pédagogique, les auteurs ne peuvent garantir une disponibilité continue de l&apos;application ni l&apos;absence de bugs. L&apos;utilisation se fait donc sous l&apos;entière responsabilité de l&apos;utilisateur.
          </p>
          <p>
            Les auteurs ne sauraient être tenus responsables de tout préjudice direct ou indirect résultant de l&apos;utilisation ou de l&apos;impossibilité d&apos;utiliser l&apos;application.
          </p>

          <h2>8. Modification des CGU</h2>
          <p>
            Les auteurs se réservent le droit de modifier les présentes CGU à tout moment. L&apos;utilisateur sera informé des modifications par une notification lors de sa prochaine connexion. La poursuite de l&apos;utilisation de l&apos;application vaut acceptation des nouvelles CGU.
          </p>

          <h2>9. Droit applicable</h2>
          <p>
            Les présentes CGU sont soumises au droit français. En cas de litige, les parties s&apos;engagent à chercher une solution amiable avant tout recours judiciaire.
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
