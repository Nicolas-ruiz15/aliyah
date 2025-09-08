'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  Home, 
  UserPlus, 
  LogIn, 
  BookOpen, 
  Newspaper, 
  Settings,
  LogOut,
  User,
  ChevronDown,
  Globe
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../components/providers/AuthProvider';
import { useLanguage, useTranslation } from '../../components/providers/LanguageProvider';
import { cn } from '../../lib/utils';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isAuthenticated, isAdmin } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
    setIsProfileOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'es' ? 'he' : 'es');
  };

  const navigationItems = [
    {
      href: '/',
      label: t('nav.home'),
      icon: Home,
      public: true,
    },
    {
      href: '/noticias',
      label: t('nav.news'),
      icon: Newspaper,
      public: true,
    },
    {
      href: '/estudiar',
      label: t('nav.study'),
      icon: BookOpen,
      auth: true,
    },
    {
      href: '/dashboard',
      label: t('nav.dashboard'),
      icon: User,
      auth: true,
    },
    {
      href: '/admin',
      label: t('nav.admin'),
      icon: Settings,
      admin: true,
    },
  ];

  const visibleItems = navigationItems.filter(item => {
    if (item.admin) return isAdmin;
    if (item.auth) return isAuthenticated;
    return item.public || !isAuthenticated;
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-full bg-gradient-israel flex items-center justify-center">
              <span className="text-white font-bold text-sm">עא</span>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">
                Plataforma Aliá
              </h1>
              <p className="text-xs text-gray-600 hebrew">עלייה לישראל</p>
            </div>
          </Link>

          {/* Navegación Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            {visibleItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-2 text-gray-600 hover:text-tekhelet-700 transition-colors"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Controles de la derecha */}
          <div className="flex items-center space-x-4">
            {/* Selector de idioma */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-2"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'es' ? 'עברית' : 'Español'}
              </span>
            </Button>

            {/* Autenticación */}
            {isAuthenticated ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2"
                >
                  <div className="h-8 w-8 rounded-full bg-tekhelet-100 flex items-center justify-center">
                    <span className="text-tekhelet-700 text-sm font-medium">
{user?.profile?.firstNameEncrypted?.[0] || user?.email?.[0]?.toUpperCase()}                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>

                {/* Dropdown de perfil */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
{user?.profile?.firstNameEncrypted || t('nav.dashboard')}                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    
                    <Link
                      href="/dashboard"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="h-4 w-4 mr-2" />
                      {t('nav.dashboard')}
                    </Link>
                    
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button variant="orthodox" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t('nav.register')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Menú móvil */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Menú móvil expandido */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <nav className="space-y-3">
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-tekhelet-700 hover:bg-tekhelet-50 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {!isAuthenticated && (
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <Link href="/auth/login" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <LogIn className="h-4 w-4 mr-2" />
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link href="/auth/register" onClick={() => setIsMenuOpen(false)}>
                    <Button variant="orthodox" size="sm" className="w-full justify-start">
                      <UserPlus className="h-4 w-4 mr-2" />
                      {t('nav.register')}
                    </Button>
                  </Link>
                </div>
              )}

              {isAuthenticated && (
                <div className="pt-3 border-t border-gray-100">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>

      {/* Overlay para cerrar dropdowns */}
      {(isProfileOpen || isMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsProfileOpen(false);
            setIsMenuOpen(false);
          }}
        />
      )}
    </header>
  );
}