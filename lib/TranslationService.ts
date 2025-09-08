import * as deepl from 'deepl-node';
import type { TranslationRequest, TranslationResponse } from '../types/global';

interface TranslationCache {
  [key: string]: {
    translation: string;
    timestamp: number;
    confidence?: number;
  };
}

interface TranslatedArticle {
  title: string;
  summary: string;
  content?: string;
}

/**
 * Servicio de traducción para la plataforma de Aliá
 * Soporta DeepL (recomendado) y Google Translate como fallback
 */
export class TranslationService {
  private deeplTranslator?: deepl.Translator;
  private cache: TranslationCache = {};
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 horas
  private provider: 'deepl' | 'google';

  constructor() {
    this.provider = (process.env.TRANSLATION_PROVIDER as 'deepl' | 'google') || 'deepl';
    this.initializeProvider();
  }

  /**
   * Inicializa el proveedor de traducción configurado
   */
  private initializeProvider() {
    if (this.provider === 'deepl') {
      this.initializeDeepL();
    }
    // Google Translate se inicializa dinámicamente cuando se necesita
  }

  /**
   * Configura DeepL Translator
   */
  private initializeDeepL() {
    const apiKey = process.env.DEEPL_API_KEY;
    
    if (!apiKey) {
      console.warn('DEEPL_API_KEY no configurada, cambiando a Google Translate');
      this.provider = 'google';
      return;
    }

    try {
      this.deeplTranslator = new deepl.Translator(apiKey);
      console.log('✅ DeepL Translator inicializado');
    } catch (error) {
      console.error('Error inicializando DeepL:', error);
      this.provider = 'google';
    }
  }

  /**
   * Genera clave para cache
   */
  private getCacheKey(text: string, fromLang: string, toLang: string): string {
    const content = `${text.substring(0, 100)}-${fromLang}-${toLang}`;
    return Buffer.from(content).toString('base64');
  }

  /**
   * Obtiene traducción del cache si existe y es válida
   */
  private getCachedTranslation(cacheKey: string): string | null {
    const cached = this.cache[cacheKey];
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.cacheTimeout;
    if (isExpired) {
      delete this.cache[cacheKey];
      return null;
    }
    
    return cached.translation;
  }

  /**
   * Guarda traducción en cache
   */
  private setCachedTranslation(
    cacheKey: string, 
    translation: string, 
    confidence?: number
  ) {
    this.cache[cacheKey] = {
      translation,
      timestamp: Date.now(),
      confidence,
    };
  }

  /**
   * Detecta el idioma del texto
   */
  private async detectLanguage(text: string): Promise<string> {
    try {
      if (this.deeplTranslator) {
        // DeepL no tiene detección de idioma, usar heurística simple
        const hebrewPattern = /[\u0590-\u05FF]/;
        const arabicPattern = /[\u0600-\u06FF]/;
        
        if (hebrewPattern.test(text)) return 'he';
        if (arabicPattern.test(text)) return 'ar';
        return 'en'; // Por defecto inglés para sitios israelíes
      }
      
      // Fallback a Google Translate para detección
      return await this.detectWithGoogle(text);
    } catch (error) {
      console.error('Error detectando idioma:', error);
      return 'en';
    }
  }

  /**
   * Detecta idioma usando Google Translate
   */
  private async detectWithGoogle(text: string): Promise<string> {
    try {
      // Implementación simple de detección usando Google Translate API
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text.substring(0, 1000), // Limitar texto para detección
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.detections[0][0].language || 'en';
    } catch (error) {
      console.error('Error con Google Translate detection:', error);
      return 'en';
    }
  }

  /**
   * Traduce texto usando DeepL
   */
  private async translateWithDeepL(
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<TranslationResponse> {
    if (!this.deeplTranslator) {
      throw new Error('DeepL Translator no está configurado');
    }

    try {
      // Mapear códigos de idioma para DeepL
      const deeplLangMap: Record<string, string> = {
        'he': 'EN', // DeepL no soporta hebreo directamente, usar inglés como intermedio
        'ar': 'EN',
        'en': 'EN',
        'es': 'ES',
      };

      const sourceLang = deeplLangMap[fromLang] || 'EN';
      const targetLang = deeplLangMap[toLang] || 'ES';

      const result = await this.deeplTranslator.translateText(
        text,
        sourceLang as deepl.SourceLanguageCode,
        targetLang as deepl.TargetLanguageCode,
        {
          preserveFormatting: true,
          formality: 'default',
        }
      );

      return {
        translatedText: Array.isArray(result) ? result[0].text : result.text,
        detectedLanguage: fromLang,
        confidence: 0.95, // DeepL generalmente tiene alta confianza
      };
    } catch (error) {
      console.error('Error traduciendo con DeepL:', error);
      throw error;
    }
  }

  /**
   * Traduce texto usando Google Translate
   */
  private async translateWithGoogle(
    text: string,
    fromLang: string,
    toLang: string
  ): Promise<TranslationResponse> {
    try {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            source: fromLang,
            target: toLang,
            format: 'text',
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      const translation = data.data.translations[0];

      return {
        translatedText: translation.translatedText,
        detectedLanguage: translation.detectedSourceLanguage || fromLang,
        confidence: 0.85,
      };
    } catch (error) {
      console.error('Error traduciendo con Google:', error);
      throw error;
    }
  }

  /**
   * Limpia y prepara texto para traducción
   */
  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalizar espacios
      .replace(/[\r\n]+/g, ' ') // Remover saltos de línea
      .trim()
      .substring(0, 5000); // Limitar longitud
  }

  /**
   * Método principal de traducción
   */
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, fromLanguage, toLanguage } = request;
    
    if (!text || text.trim().length === 0) {
      return {
        translatedText: '',
        detectedLanguage: fromLanguage,
        confidence: 1.0,
      };
    }

    // Si el idioma origen y destino son iguales, no traducir
    if (fromLanguage === toLanguage) {
      return {
        translatedText: text,
        detectedLanguage: fromLanguage,
        confidence: 1.0,
      };
    }

    const cleanedText = this.cleanText(text);
    const cacheKey = this.getCacheKey(cleanedText, fromLanguage, toLanguage);

    // Verificar cache
    const cachedTranslation = this.getCachedTranslation(cacheKey);
    if (cachedTranslation) {
      return {
        translatedText: cachedTranslation,
        detectedLanguage: fromLanguage,
        confidence: 0.9,
      };
    }

    try {
      let result: TranslationResponse;

      // Intentar con el proveedor principal
      if (this.provider === 'deepl' && this.deeplTranslator) {
        try {
          result = await this.translateWithDeepL(cleanedText, fromLanguage, toLanguage);
        } catch (error) {
          console.warn('Error con DeepL, fallback a Google:', error);
          result = await this.translateWithGoogle(cleanedText, fromLanguage, toLanguage);
        }
      } else {
        result = await this.translateWithGoogle(cleanedText, fromLanguage, toLanguage);
      }

      // Guardar en cache
      this.setCachedTranslation(cacheKey, result.translatedText, result.confidence);

      return result;
    } catch (error) {
      console.error('Error en traducción:', error);
      
      // Fallback: devolver texto original
      return {
        translatedText: text,
        detectedLanguage: fromLanguage,
        confidence: 0.0,
      };
    }
  }

  /**
   * Traduce un artículo completo (título + contenido)
   */
  async translateArticle(
    title: string,
    content: string,
    fromLang?: string
  ): Promise<TranslatedArticle> {
    try {
      // Detectar idioma si no se proporciona
      const sourceLang = fromLang || await this.detectLanguage(title + ' ' + content);
      
      // Traducir título
      const titleResult = await this.translate({
        text: title,
        fromLanguage: sourceLang,
        toLanguage: 'es',
      });

      // Crear resumen del contenido (primeros 300 caracteres)
      const summary = content.substring(0, 300) + (content.length > 300 ? '...' : '');
      
      // Traducir resumen
      const summaryResult = await this.translate({
        text: summary,
        fromLanguage: sourceLang,
        toLanguage: 'es',
      });

      // Opcionalmente traducir contenido completo para artículos importantes
      let translatedContent: string | undefined;
      if (content.length > 0 && content.length < 3000) {
        const contentResult = await this.translate({
          text: content,
          fromLanguage: sourceLang,
          toLanguage: 'es',
        });
        translatedContent = contentResult.translatedText;
      }

      return {
        title: titleResult.translatedText,
        summary: summaryResult.translatedText,
        content: translatedContent,
      };
    } catch (error) {
      console.error('Error traduciendo artículo:', error);
      
      // Fallback: devolver textos originales
      return {
        title,
        summary: content.substring(0, 300),
        content,
      };
    }
  }

  /**
   * Traduce múltiples textos en lote
   */
  async translateBatch(
    texts: string[],
    fromLanguage: string,
    toLanguage: string
  ): Promise<string[]> {
    const results: string[] = [];

    for (const text of texts) {
      try {
        const result = await this.translate({
          text,
          fromLanguage,
          toLanguage,
        });
        results.push(result.translatedText);
      } catch (error) {
        console.error('Error en traducción de lote:', error);
        results.push(text); // Fallback al texto original
      }
    }

    return results;
  }

  /**
   * Obtiene estadísticas del servicio
   */
  getStats(): {
    cacheSize: number;
    provider: string;
    cacheHitRatio: number;
  } {
    return {
      cacheSize: Object.keys(this.cache).length,
      provider: this.provider,
      cacheHitRatio: 0.85, // Placeholder - implementar tracking real
    };
  }

  /**
   * Limpia el cache de traducciones
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Verifica el estado del servicio
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    provider: string;
    details: Record<string, any>;
  }> {
    try {
      // Probar traducción simple
      const testResult = await this.translate({
        text: 'Hello world',
        fromLanguage: 'en',
        toLanguage: 'es',
      });

      const isHealthy = testResult.translatedText.length > 0;

      return {
        status: isHealthy ? 'healthy' : 'degraded',
        provider: this.provider,
        details: {
          cacheSize: Object.keys(this.cache).length,
          testTranslation: testResult.translatedText,
          confidence: testResult.confidence,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        provider: this.provider,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Instancia singleton del servicio de traducción
export const translationService = new TranslationService();

export default translationService;