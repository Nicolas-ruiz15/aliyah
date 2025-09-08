'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'he';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Traducciones básicas
const translations = {
  es: {
    // Navegación
    'nav.home': 'Inicio',
    'nav.register': 'Registro',
    'nav.login': 'Iniciar Sesión',
    'nav.dashboard': 'Panel',
    'nav.study': 'Estudiar',
    'nav.news': 'Noticias',
    'nav.admin': 'Administración',
    'nav.logout': 'Cerrar Sesión',
    
    // Formularios
    'form.email': 'Correo electrónico',
    'form.password': 'Contraseña',
    'form.confirm_password': 'Confirmar contraseña',
    'form.first_name': 'Nombre',
    'form.last_name': 'Apellido',
    'form.phone': 'Teléfono',
    'form.submit': 'Enviar',
    'form.cancel': 'Cancelar',
    'form.save': 'Guardar',
    'form.required': 'Campo requerido',
    
    // Registro
    'register.title': 'Registro para Aliá',
    'register.subtitle': 'Comienza tu camino hacia Israel',
    'register.jewish_status': '¿Eres judío?',
    'register.jewish_status.yes': 'Sí',
    'register.jewish_status.no': 'No',
    'register.jewish_status.process': 'En proceso de conversión',
    'register.conversion_rabbi': 'Rabino de conversión',
    'register.conversion_community': 'Comunidad de conversión',
    'register.bet_din': 'Bet Din',
    'register.motivation': 'Motivación para hacer aliá',
    
    // Quiz/Educación
    'quiz.title': 'Educación Halájica',
    'quiz.level': 'Nivel',
    'quiz.start': 'Comenzar',
    'quiz.continue': 'Continuar',
    'quiz.complete': 'Completar',
    'quiz.score': 'Puntuación',
    'quiz.correct': 'Correcto',
    'quiz.incorrect': 'Incorrecto',
    
    // Noticias
    'news.title': 'Noticias de Israel',
    'news.latest': 'Últimas noticias',
    'news.read_more': 'Leer más',
    'news.source': 'Fuente',
    'news.translated': 'Traducido del hebreo',
    
    // Mensajes
    'message.welcome': 'Bienvenido a la Plataforma Aliá',
    'message.success': 'Operación exitosa',
    'message.error': 'Ha ocurrido un error',
    'message.loading': 'Cargando...',
    
    // Footer
    'footer.about': 'Acerca de',
    'footer.contact': 'Contacto',
    'footer.privacy': 'Privacidad',
    'footer.terms': 'Términos',
    'footer.rights': 'Todos los derechos reservados',
  },
  he: {
    // Navegación
    'nav.home': 'בית',
    'nav.register': 'הרשמה',
    'nav.login': 'התחברות',
    'nav.dashboard': 'לוח בקרה',
    'nav.study': 'לימוד',
    'nav.news': 'חדשות',
    'nav.admin': 'ניהול',
    'nav.logout': 'התנתקות',
    
    // Formularios
    'form.email': 'דוא״ל',
    'form.password': 'סיסמה',
    'form.confirm_password': 'אישור סיסמה',
    'form.first_name': 'שם פרטי',
    'form.last_name': 'שם משפחה',
    'form.phone': 'טלפון',
    'form.submit': 'שלח',
    'form.cancel': 'ביטול',
    'form.save': 'שמור',
    'form.required': 'שדה חובה',
    
    // Registro
    'register.title': 'הרשמה לעלייה',
    'register.subtitle': 'התחל את דרכך לישראל',
    'register.jewish_status': 'האם אתה יהודי?',
    'register.jewish_status.yes': 'כן',
    'register.jewish_status.no': 'לא',
    'register.jewish_status.process': 'בתהליך גיור',
    'register.conversion_rabbi': 'רב מגייר',
    'register.conversion_community': 'קהילה מגיירת',
    'register.bet_din': 'בית דין',
    'register.motivation': 'מוטיבציה לעלייה',
    
    // Quiz/Educación
    'quiz.title': 'חינוך הלכתי',
    'quiz.level': 'רמה',
    'quiz.start': 'התחל',
    'quiz.continue': 'המשך',
    'quiz.complete': 'השלם',
    'quiz.score': 'ניקוד',
    'quiz.correct': 'נכון',
    'quiz.incorrect': 'שגוי',
    
    // Noticias
    'news.title': 'חדשות ישראל',
    'news.latest': 'חדשות אחרונות',
    'news.read_more': 'קרא עוד',
    'news.source': 'מקור',
    'news.translated': 'תורגם מעברית',
    
    // Mensajes
    'message.welcome': 'ברוך הבא לפלטפורמת העלייה',
    'message.success': 'פעולה בוצעה בהצלחה',
    'message.error': 'אירעה שגיאה',
    'message.loading': 'טוען...',
    
    // Footer
    'footer.about': 'אודות',
    'footer.contact': 'צור קשר',
    'footer.privacy': 'פרטיות',
    'footer.terms': 'תנאים',
    'footer.rights': 'כל הזכויות שמורות',
  },
};

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('es');

  // Función de traducción
  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    // Reemplazar parámetros si existen
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{${param}}`, value);
      });
    }
    
    return translation;
  };

  // Cambiar idioma y dirección
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    
    // Guardar preferencia en localStorage
    localStorage.setItem('preferred-language', lang);
  };

  // Cargar idioma guardado al inicializar
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage && ['es', 'he'].includes(savedLanguage)) {
      setLanguage(savedLanguage);
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('he')) {
        setLanguage('he');
      }
    }
  }, []);

  const value: LanguageContextType = {
    language,
    setLanguage,
    isRTL: language === 'he',
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      <div className={language === 'he' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

// Hook para usar el contexto de idioma
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage debe usarse dentro de un LanguageProvider');
  }
  return context;
}

// Hook para traducciones
export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}