import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";
import { Logo } from "./logo";
import { InstagramIcon, FacebookIcon, LinkedinIcon } from "./social-icons";

const quickLinks = [
  { href: "/", label: "Accueil" },
  { href: "/repas", label: "Nos repas" },
  { href: "/comment-ca-marche", label: "Comment ça marche ?" },
  { href: "/a-propos", label: "À propos" },
  { href: "/entreprises", label: "Entreprises" },
  { href: "/contact", label: "Contact" },
];

const infoLinks = [
  { href: "/a-propos", label: "À propos de nous" },
  { href: "/faq", label: "FAQ" },
  { href: "/conditions-generales", label: "Conditions générales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer className="bg-cream-soft pt-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 pb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Logo />
            <p className="mt-4 max-w-[220px] text-sm text-muted">
              Des repas sains, livrés chaque jour au bureau à Tanger.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {[InstagramIcon, FacebookIcon, LinkedinIcon].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label="Réseau social"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-green-800 text-white transition-colors hover:bg-green-700"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-green-950">Liens rapides</h3>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-green-800">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-green-950">Informations</h3>
            <ul className="flex flex-col gap-2.5">
              {infoLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-muted transition-colors hover:text-green-800">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-bold text-green-950">Contact</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2.5 text-sm text-muted">
                <Phone className="h-4 w-4 shrink-0 text-green-700" />
                +212 6 12 34 56 78
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted">
                <Mail className="h-4 w-4 shrink-0 text-green-700" />
                contact@greenbox.ma
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted">
                <MapPin className="h-4 w-4 shrink-0 text-green-700" />
                Tanger, Maroc
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-line py-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} GreenBox. Tous droits réservés.</p>
          <p>Fait avec soin à Tanger</p>
        </div>
      </div>
    </footer>
  );
}
