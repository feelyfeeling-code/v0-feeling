import { Footer } from '@/components/footer'

export const metadata = {
  title: 'Mentions légales - Feeling',
}

export default function MentionsLegalesPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="font-serif font-bold text-4xl mb-2">Mentions légales</h1>
        <p className="text-sm text-muted-foreground mb-8">Dernière mise à jour : avril 2026</p>

        <article className="max-w-none space-y-4 [&_h2]:font-bold [&_h2]:text-2xl [&_h2]:mt-12 [&_h2]:pt-10 [&_h2]:border-t-2 [&_h2]:border-foreground/20 [&>h2:first-child]:mt-0 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0 [&_h3]:font-bold [&_h3]:text-lg [&_h3]:mt-6 [&_p]:leading-relaxed [&_p]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_a]:underline [&_a]:text-primary">
          <h2>1. Éditeur du site</h2>
          <p>L&apos;application Feeling est un projet réalisé dans le cadre d&apos;un cursus de master par :</p>
          <ul>
            <li>Responsable du projet : Maëliss Magit</li>
            <li>Établissement : Hetic</li>
            <li>Adresse : 27 Bis Rue du Progrès, 93100 Montreuil</li>
            <li>Contact : <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a></li>
          </ul>
          <p>Ce projet est réalisé à titre pédagogique et non commercial.</p>

          <h2>2. Hébergeur</h2>
          <ul>
            <li>Vercel, Inc.</li>
            <li>440 N Barranca Ave #4133</li>
            <li>Covina, California 91723, États-Unis</li>
            <li>Site web : <a href="https://www.vercel.com" target="_blank" rel="noopener noreferrer">https://www.vercel.com</a></li>
          </ul>

          <h2>3. Propriété intellectuelle</h2>
          <p>
            L&apos;ensemble des contenus présents sur l&apos;application Feeling (textes, graphismes, logos, icônes, images, sons, vidéos, code source) est la propriété exclusive de ses auteurs ou de leurs ayants droit, et est protégé par les lois françaises et internationales relatives à la propriété intellectuelle. Toute reproduction, représentation, modification, publication ou adaptation de tout ou partie des éléments de l&apos;application, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable des auteurs.
          </p>

          <h2>4. Données personnelles</h2>
          <p>
            Le traitement des données personnelles collectées via l&apos;application Feeling est décrit dans notre Politique de Confidentialité, disponible depuis le footer de l&apos;application.
          </p>
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD – Règlement UE 2016/679), vous disposez de droits sur vos données personnelles. Pour les exercer, contactez-nous à : <a href="mailto:feely.feeling@gmail.com">feely.feeling@gmail.com</a>.
          </p>

          <h2>5. Cookies</h2>
          <p>
            L&apos;application Feeling utilise des cookies analytiques pour mesurer l&apos;audience et améliorer l&apos;expérience utilisateur. Pour en savoir plus, consultez notre Politique de Cookies disponible depuis le footer de l&apos;application.
          </p>

          <h2>6. Limitation de responsabilité</h2>
          <p>
            L&apos;application Feeling est un projet étudiant à vocation pédagogique. Les auteurs s&apos;efforcent d&apos;assurer l&apos;exactitude et la mise à jour des informations diffusées, mais ne peuvent garantir l&apos;exhaustivité ou l&apos;absence d&apos;erreurs.
          </p>
          <p>
            Les auteurs déclinent toute responsabilité concernant les dommages directs ou indirects résultant de l&apos;accès ou de l&apos;utilisation de l&apos;application.
          </p>

          <h2>7. Droit applicable</h2>
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, et à défaut de résolution amiable, les tribunaux français seront compétents.
          </p>
        </article>
      </main>
      <Footer />
    </>
  )
}
