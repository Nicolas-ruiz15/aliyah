import Parser from 'rss-parser';
import { prisma } from '../lib/prisma';
import type { NewsSourceConfig } from '../types/global';

interface ScrapedArticle {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
  author?: string;
  publishedAt: Date;
}

/**
 * Servicio de agregación de noticias israelíes (RSS solamente)
 * Versión simplificada sin scraping para evitar dependencias complejas
 */
export class NewsAggregator {
  private parser: Parser;
  private sources: NewsSourceConfig[];

  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['content:encoded', 'contentEncoded'],
          ['description', 'description'],
        ],
      },
    });

    this.sources = this.getConfiguredSources();
  }

  /**
   * Obtiene las fuentes de noticias configuradas (solo RSS)
   */
  private getConfiguredSources(): NewsSourceConfig[] {
    const defaultSources: NewsSourceConfig[] = [
      {
        name: 'Times of Israel',
        url: 'https://www.timesofisrael.com/feed/',
        type: 'rss',
        enabled: true,
        category: 'general',
      },
      {
        name: 'Jerusalem Post',
        url: 'https://www.jpost.com/rss/rssfeedsarticles.aspx',
        type: 'rss',
        enabled: true,
        category: 'general',
      },
      {
        name: 'Haaretz',
        url: 'https://www.haaretz.com/cmlink/1.268323',
        type: 'rss',
        enabled: true,
        category: 'general',
      },
      {
        name: 'Israel National News',
        url: 'https://www.israelnationalnews.com/News.aspx/rss',
        type: 'rss',
        enabled: true,
        category: 'religious',
      },
    ];

    return defaultSources;
  }

  /**
   * Limpia HTML básico de una cadena
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remover tags HTML
      .replace(/&nbsp;/g, ' ') // Reemplazar entidades HTML
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ') // Normalizar espacios
      .trim();
  }

  /**
   * Procesa un feed RSS
   */
  private async processRSSFeed(source: NewsSourceConfig): Promise<ScrapedArticle[]> {
    try {
      console.log(`Procesando RSS: ${source.name}`);
      
      const feed = await this.parser.parseURL(source.url);
      const articles: ScrapedArticle[] = [];

      for (const item of feed.items) {
        if (!item.title || !item.link) continue;

        // Extraer contenido del item
        let content = (item as any).contentEncoded || 
                     item.content || 
                     item.description || 
                     item.contentSnippet || '';
        
        // Limpiar HTML del contenido
        content = this.stripHtml(content);

        // Extraer imagen si existe
        let imageUrl: string | undefined;
        if (item.enclosure?.type?.startsWith('image/')) {
          imageUrl = item.enclosure.url;
        }

        // Parsear fecha de publicación
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

        articles.push({
          title: item.title,
          content: content.substring(0, 5000), // Limitar contenido
          url: item.link,
          imageUrl,
          author: item.author,
          publishedAt,
        });
      }

      console.log(`${source.name}: ${articles.length} artículos procesados`);
      return articles;
    } catch (error) {
      console.error(`Error procesando RSS ${source.name}:`, error);
      return [];
    }
  }

  /**
   * Traduce un artículo de forma simple (placeholder)
   */
  private async translateArticle(title: string, content: string): Promise<{
    title: string;
    summary: string;
  }> {
    // Placeholder - en la implementación real usarías translationService
    return {
      title: `[Traducido] ${title}`,
      summary: content.substring(0, 300),
    };
  }

  /**
   * Verifica si un artículo ya existe en la base de datos
   */
  private async articleExists(url: string): Promise<boolean> {
    try {
      const existing = await prisma.article.findUnique({
        where: { url },
      });
      return !!existing;
    } catch (error) {
      console.error('Error verificando artículo existente:', error);
      return false;
    }
  }

  /**
   * Guarda artículos en la base de datos
   */
  private async saveArticles(articles: ScrapedArticle[], sourceId: string): Promise<number> {
    let savedCount = 0;

    for (const article of articles) {
      try {
        // Verificar si ya existe
        if (await this.articleExists(article.url)) {
          continue;
        }

        // Traducir título y contenido
        const { title: titleTranslated, summary: summaryTranslated } = 
          await this.translateArticle(article.title, article.content);

        // Crear artículo en la base de datos
        await prisma.article.create({
          data: {
            sourceId,
            title: article.title,
            titleTranslated,
            content: article.content,
            summary: article.content.substring(0, 300),
            summaryTranslated,
            url: article.url,
            imageUrl: article.imageUrl,
            author: article.author,
            publishedAt: article.publishedAt,
            isTranslated: true,
            translatedAt: new Date(),
          },
        });

        savedCount++;
      } catch (error) {
        console.error(`Error guardando artículo ${article.url}:`, error);
      }
    }

    return savedCount;
  }

  /**
   * Actualiza todas las fuentes de noticias RSS
   */
  async updateAllSources(): Promise<{
    totalArticles: number;
    sourceResults: Array<{ name: string; articles: number; success: boolean }>;
  }> {
    console.log('Iniciando actualización de noticias RSS...');
    
    let totalArticles = 0;
    const sourceResults: Array<{ name: string; articles: number; success: boolean }> = [];

    for (const source of this.sources.filter(s => s.enabled && s.type === 'rss')) {
      try {
        // Buscar o crear fuente en la base de datos
        let dbSource = await prisma.newsSource.findUnique({
          where: { name: source.name },
        });

        if (!dbSource) {
          dbSource = await prisma.newsSource.create({
            data: {
              name: source.name,
              url: source.url,
              rssUrl: source.url,
              type: 'RSS',
              isActive: true,
            },
          });
        }

        // Procesar artículos RSS
        const articles = await this.processRSSFeed(source);

        // Guardar artículos
        const savedCount = await this.saveArticles(articles, dbSource.id);
        totalArticles += savedCount;

        // Actualizar última actualización de la fuente
        await prisma.newsSource.update({
          where: { id: dbSource.id },
          data: { lastFetched: new Date() },
        });

        sourceResults.push({
          name: source.name,
          articles: savedCount,
          success: true,
        });

        console.log(`${source.name}: ${savedCount} artículos nuevos`);
      } catch (error) {
        console.error(`Error procesando ${source.name}:`, error);
        sourceResults.push({
          name: source.name,
          articles: 0,
          success: false,
        });
      }
    }

    console.log(`Actualización completa: ${totalArticles} artículos nuevos en total`);
    
    return {
      totalArticles,
      sourceResults,
    };
  }

  /**
   * Obtiene artículos recientes con filtros
   */
  async getRecentArticles(options: {
    limit?: number;
    offset?: number;
    sourceIds?: string[];
    category?: string;
    search?: string;
  } = {}) {
    const {
      limit = 20,
      offset = 0,
      sourceIds,
      search,
    } = options;

    const where: any = {
      isActive: true,
    };

    if (sourceIds?.length) {
      where.sourceId = { in: sourceIds };
    }

    if (search) {
      where.OR = [
        { titleTranslated: { contains: search } },
        { summaryTranslated: { contains: search } },
      ];
    }

    try {
      const articles = await prisma.article.findMany({
        where,
        include: {
          source: true,
        },
        orderBy: {
          publishedAt: 'desc',
        },
        skip: offset,
        take: limit,
      });

      const total = await prisma.article.count({ where });

      return {
        articles,
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error('Error obteniendo artículos:', error);
      return {
        articles: [],
        total: 0,
        hasMore: false,
      };
    }
  }

  /**
   * Verifica el estado de salud del agregador
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Verificar fuentes activas
      const activeSources = await prisma.newsSource.count({
        where: { isActive: true },
      });

      // Verificar artículos recientes
      const recentArticles = await prisma.article.count({
        where: {
          createdAt: { gte: oneHourAgo },
        },
      });

      const status = 
        activeSources > 0 && recentArticles > 0 ? 'healthy' :
        activeSources > 0 ? 'degraded' :
        'unhealthy';

      return {
        status,
        details: {
          activeSources,
          recentArticles,
          lastUpdate: now,
        },
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }
}

// Instancia singleton del agregador de noticias
export const newsAggregator = new NewsAggregator();

export default newsAggregator;