import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utilidad para combinar clases de Tailwind CSS
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatear fecha para mostrar en español o hebreo
 */
export function formatDate(date: Date | string, locale: 'es' | 'he' = 'es'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return dateObj.toLocaleDateString(locale === 'he' ? 'he-IL' : 'es-ES', options);
}

/**
 * Formatear fecha relativa (hace X tiempo)
 */
export function formatRelativeDate(date: Date | string, locale: 'es' | 'he' = 'es'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const intervals = {
    es: {
      year: ['año', 'años'],
      month: ['mes', 'meses'],
      week: ['semana', 'semanas'],
      day: ['día', 'días'],
      hour: ['hora', 'horas'],
      minute: ['minuto', 'minutos'],
      second: ['segundo', 'segundos'],
    },
    he: {
      year: ['שנה', 'שנים'],
      month: ['חודש', 'חודשים'],
      week: ['שבוע', 'שבועות'],
      day: ['יום', 'ימים'],
      hour: ['שעה', 'שעות'],
      minute: ['דקה', 'דקות'],
      second: ['שנייה', 'שניות'],
    },
  };

  const timeUnits = [
    { name: 'year', seconds: 31536000 },
    { name: 'month', seconds: 2592000 },
    { name: 'week', seconds: 604800 },
    { name: 'day', seconds: 86400 },
    { name: 'hour', seconds: 3600 },
    { name: 'minute', seconds: 60 },
    { name: 'second', seconds: 1 },
  ];

  for (const unit of timeUnits) {
    const interval = Math.floor(diffInSeconds / unit.seconds);
    if (interval >= 1) {
      const unitNames = intervals[locale][unit.name as keyof typeof intervals[typeof locale]];
      const unitName = interval === 1 ? unitNames[0] : unitNames[1];
      
      if (locale === 'he') {
        return `לפני ${interval} ${unitName}`;
      } else {
        return `hace ${interval} ${unitName}`;
      }
    }
  }

  return locale === 'he' ? 'עכשיו' : 'ahora';
}

/**
 * Capitalizar primera letra
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Truncar texto con elipsis
 */
export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.substring(0, length)}...` : str;
}

/**
 * Validar email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validar teléfono (formato internacional)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Formatear número de teléfono
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('972')) {
    // Formato israelí
    return `+972 ${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  } else if (cleaned.length === 10) {
    // Formato genérico
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Generar iniciales de nombre
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || '??';
}

/**
 * Formatear tamaño de archivo
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Convertir string a slug
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
	.replace(/^-+|-+$/g, '');}

/**
 * Generar color aleatorio para avatar
 */
export function generateAvatarColor(name: string): string {
  const colors = [
    '#0033CC', '#0038B8', '#FFD700', '#FF6B35', '#4ECDC4',
    '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
  ];
  
  if (colors.length === 0) return '#0033CC'; // Protección extra
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  const selectedColor = colors[index];
  
  return selectedColor ?? '#0033CC'; // Usar nullish coalescing
}

/**
 * Calcular progreso de quiz en porcentaje
 */
export function calculateQuizProgress(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * Determinar si el quiz fue aprobado
 */
export function isQuizPassed(score: number, requiredScore: number = 80): boolean {
  return score >= requiredScore;
}

/**
 * Formatear puntuación de quiz
 */
export function formatQuizScore(correct: number, total: number): string {
  const percentage = calculateQuizProgress(correct, total);
  return `${correct}/${total} (${percentage}%)`;
}

/**
 * Validar fuerza de contraseña
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) score++;
  else feedback.push('Mínimo 8 caracteres');

  if (/[a-z]/.test(password)) score++;
  else feedback.push('Al menos una letra minúscula');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Al menos una letra mayúscula');

  if (/\d/.test(password)) score++;
  else feedback.push('Al menos un número');

  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  else feedback.push('Al menos un carácter especial');

  const strength = score < 3 ? 'weak' : score < 5 ? 'medium' : 'strong';
  const isValid = score >= 4;

  return { isValid, strength, feedback };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Verificar si es ambiente de desarrollo
 */
export const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Verificar si es ambiente de producción
 */
export const isProduction = process.env.NODE_ENV === 'production';

/**
 * URL base de la aplicación
 */
export const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

/**
 * Constantes de la aplicación
 */
export const APP_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
  QUIZ_PASS_SCORE: 80,
  PAGINATION_LIMIT: 20,
  NEWS_UPDATE_INTERVAL: 3600000, // 1 hora
  SESSION_TIMEOUT: 2592000000, // 30 días
} as const;