'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Instagram,
  Heart,
  ExternalLink
} from 'lucide-react';
import { useTranslation } from '../../components/providers/LanguageProvider';

export function Footer() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/', label: t('nav.home') },
    { href: '/noticias', label: t('nav.news') },
    { href: '/auth/register', label: t('nav.register') },
    { href: '/auth/login', label: t('nav.login') },
  ];

  const legalLinks = [
    { href: '/privacidad', label: t('footer.privacy') },
    { href: '/terminos', label: t('footer.terms') },
    { href: '/contacto', label: t('footer.contact') },
    { href: '/acerca', label: t('footer.about') },
  ];

  const israeliResources = [
    {
      name: 'Ministerio de Aliá',
      href: 'https://www.gov.il/he/departments/ministry_of_aliyah_and_integration',
      hebrew: 'משרד העלייה והקליטה'
    },
    {
      name: 'Agencia Judía',
      href: 'https://www.jewishagency.org',
      hebrew: 'הסוכנות היהודית'
    },
    {
      name: 'Nefesh B\'Nefesh',
      href: 'https://www.nbnisrael.com',
      hebrew: 'נפש בנפש'
    },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-tekhelet-900 text-white">
      <div className="container mx-auto px-4">
        {/* Contenido principal del footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Información de la plataforma */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center">
                <span className="text-gray-900 font-bold">עא</span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Plataforma Aliá</h3>
                <p className="text-sm text-gray-300 hebrew">עלייה לישראל</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Tu camino hacia la aliá comienza aquí. Plataforma integral para judíos ortodoxos 
              sionistas que buscan hacer realidad su sueño de vivir en la Tierra de Israel.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Enlaces rápidos */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold-accent-400">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Recursos israelíes */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold-accent-400">Recursos Oficiales</h4>
            <ul className="space-y-2">
              {israeliResources.map((resource) => (
                <li key={resource.href}>
                  <a 
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-300 hover:text-white transition-colors text-sm flex items-center group"
                  >
                    <span className="block">
                      {resource.name}
                      <span className="block text-xs hebrew text-gray-400">
                        {resource.hebrew}
                      </span>
                    </span>
                    <ExternalLink className="h-3 w-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Información de contacto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gold-accent-400">Contacto</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Mail className="h-4 w-4 text-gold-accent-400" />
                <a 
                  href="mailto:info@plataforma-alia.com"
                  className="hover:text-white transition-colors"
                >
                  info@plataforma-alia.com
                </a>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-300">
                <Phone className="h-4 w-4 text-gold-accent-400" />
                <a 
                  href="tel:+972-XX-XXX-XXXX"
                  className="hover:text-white transition-colors"
                >
                  +972-XX-XXX-XXXX
                </a>
              </div>
              <div className="flex items-start space-x-3 text-sm text-gray-300">
                <MapPin className="h-4 w-4 text-gold-accent-400 mt-0.5" />
                <div>
                  <p>Jerusalem, Israel</p>
                  <p className="hebrew text-xs text-gray-400">ירושלים, ישראל</p>
                </div>
              </div>
            </div>

            {/* Newsletter signup */}
            <div className="mt-6">
              <h5 className="text-sm font-medium mb-2">Recibe noticias de Israel</h5>
              <form className="flex space-x-2">
                <input
                  type="email"
                  placeholder="Tu email"
                  className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-accent-400 text-white placeholder-gray-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-gold text-gray-900 text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Suscribir
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Separador */}
        <div className="border-t border-gray-700"></div>

        {/* Footer inferior */}
        <div className="py-6 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start space-x-6 text-sm text-gray-400">
            {legalLinks.map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>© {currentYear} Plataforma Aliá.</span>
            <span>{t('footer.rights')}</span>
            <Heart className="h-4 w-4 text-red-500" />
            <span>עם ישראל חי</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="pb-4 text-center">
          <p className="text-xs text-gray-500">
            Esta plataforma no es un servicio oficial del Estado de Israel. 
            Para información oficial, consulte los sitios web gubernamentales correspondientes.
          </p>
        </div>
      </div>
    </footer>
  );
}