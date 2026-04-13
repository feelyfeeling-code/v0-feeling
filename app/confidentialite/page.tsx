import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Politique de confidentialité - Feeling',
}

export default function ConfidentialitePage() {
  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif font-bold text-4xl mb-2">Politique de confidentialité</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2026</p>

        <article className="max-w-none space-y-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:pt-10 [&_h2]:border-t-2 [&_h2]:border-foreground/20 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_a]:underline [&_a]:text-primary">
          <h2>1. Introduction</h2>
          <p>
            La présente Politique de Confidentialité décrit la manière dont l&apos;application Feeling collecte, utilise et protège les données personnelles de ses utilisateurs, conformément au Règlement Général sur la Protection des Données (RGPD – Règlement UE 2016/679) et à la loi française Informatique et Libertés.
          </p>
          <p>
            Responsable du traitement : Charrieau Louna,{' '}
            <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>
          </p>

          <h2>2. Données collectées</h2>
          <p>Dans le cadre de l&apos;utilisation de Feeling, les données personnelles suivantes sont collectées :</p>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left font-medium">Catégorie</th>
                  <th className="border p-3 text-left font-medium">Données</th>
                  <th className="border p-3 text-left font-medium">Base légale</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Identité</td>
                  <td className="border p-3">Nom, Prénom</td>
                  <td className="border p-3">Exécution du contrat (compte utilisateur)</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Contact</td>
                  <td className="border p-3">Adresse e-mail</td>
                  <td className="border p-3">Exécution du contrat</td>
                </tr>
                <tr>
                  <td className="border p-3">Sécurité</td>
                  <td className="border p-3">Mot de passe (chiffré)</td>
                  <td className="border p-3">Consentement</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Localisation</td>
                  <td className="border p-3">Ville / région</td>
                  <td className="border p-3">Consentement</td>
                </tr>
                <tr>
                  <td className="border p-3">Parcours</td>
                  <td className="border p-3">Formations, expériences professionnelles</td>
                  <td className="border p-3">Consentement</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Valeurs</td>
                  <td className="border p-3">Valeurs personnelles déclarées (hors données sensibles)</td>
                  <td className="border p-3">Consentement</td>
                </tr>
                <tr>
                  <td className="border p-3">Technique</td>
                  <td className="border p-3">Cookies analytiques (navigation, pages visitées)</td>
                  <td className="border p-3">Consentement</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            <em>Note : Feeling ne collecte aucune donnée dite «&nbsp;sensible&nbsp;» au sens du RGPD (origines ethniques, opinions politiques, convictions religieuses, données de santé, etc.).</em>
          </p>

          <h2>3. Finalités du traitement</h2>
          <p>Les données collectées sont utilisées pour :</p>
          <ul>
            <li>Créer et gérer votre compte utilisateur</li>
            <li>Personnaliser votre expérience sur l&apos;application</li>
            <li>Permettre les fonctionnalités de mise en relation ou de recommandation basées sur le profil</li>
            <li>Analyser l&apos;utilisation de l&apos;application (statistiques anonymisées via cookies)</li>
            <li>Assurer la sécurité et le bon fonctionnement de l&apos;application</li>
            <li>Communiquer avec vous en cas de besoin (support, notifications liées au compte)</li>
          </ul>

          <h2>4. Durée de conservation</h2>

          <div className="not-prose my-6 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="border p-3 text-left font-medium">Donnée</th>
                  <th className="border p-3 text-left font-medium">Durée de conservation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3">Données de compte</td>
                  <td className="border p-3">Jusqu&apos;à la suppression du compte, puis 30 jours</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Données de profil (parcours, valeurs)</td>
                  <td className="border p-3">Durée de vie du compte</td>
                </tr>
                <tr>
                  <td className="border p-3">Logs techniques</td>
                  <td className="border p-3">12 mois maximum</td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="border p-3">Données analytiques (cookies)</td>
                  <td className="border p-3">13 mois maximum</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>5. Destinataires des données</h2>
          <p>
            Les données personnelles collectées ne sont pas vendues ni transmises à des tiers à des fins commerciales. Elles peuvent être accessibles aux prestataires techniques suivants, dans le strict cadre de leurs missions :
          </p>
          <ul>
            <li>
              Vercel, Inc. 440 N Barranca Ave #4133 Covina, California 91723, États-Unis — Site web :{' '}
              <a href="https://www.vercel.com" target="_blank" rel="noopener noreferrer">https://www.vercel.com</a>
            </li>
          </ul>
          <p>
            Ce prestataire agit en qualité de sous-traitant et est soumis à des obligations de confidentialité.
            L&apos;application est hébergée par Vercel, dont les serveurs sont basés en France. Ce transfert est encadré par les mécanismes appropriés prévus par le RGPD (clauses contractuelles types, Privacy Framework).
          </p>

          <h2>6. Sécurité des données</h2>
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles adaptées pour protéger vos données contre tout accès non autorisé, perte ou altération. Les mots de passe sont stockés sous forme chiffrée (hachage) et ne sont jamais lisibles en clair.
          </p>

          <h2>7. Vos droits</h2>
          <p>Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :</p>
          <ul>
            <li>Droit d&apos;accès : obtenir une copie de vos données</li>
            <li>Droit de rectification : corriger vos données inexactes</li>
            <li>Droit à l&apos;effacement : demander la suppression de vos données</li>
            <li>Droit à la portabilité : recevoir vos données dans un format structuré</li>
            <li>Droit d&apos;opposition : vous opposer à certains traitements</li>
            <li>Droit de retrait du consentement : à tout moment, pour les traitements basés sur le consentement</li>
          </ul>
          <p>
            Pour exercer ces droits, contactez-nous à :{' '}
            <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>
          </p>
          <p>
            Vous disposez également du droit d&apos;introduire une réclamation auprès de la CNIL (Commission Nationale de l&apos;Informatique et des Libertés) :{' '}
            <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer">www.cnil.fr</a>
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
