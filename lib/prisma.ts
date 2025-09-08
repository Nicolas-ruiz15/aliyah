import { PrismaClient } from '@prisma/client';

// Configuración del cliente Prisma para MariaDB
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración optimizada para producción en Plesk
export const prisma =
  globalForPrisma.prisma ??
 new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Evitar múltiples instancias en desarrollo
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Función para verificar conexión a la base de datos
export async function connectToDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a MariaDB exitosamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MariaDB:', error);
    return false;
  }
}

// Función para desconectar de la base de datos
export async function disconnectFromDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de MariaDB exitosamente');
  } catch (error) {
    console.error('❌ Error desconectando de MariaDB:', error);
  }
}

// Función para verificar el estado de la base de datos
export async function checkDatabaseHealth() {
  try {
    // Ejecutar una consulta simple para verificar conectividad
    await prisma.$queryRaw`SELECT 1 as test`;
    
    // Verificar que las tablas principales existan
    const userCount = await prisma.user.count();
    const topicCount = await prisma.quizTopic.count();
    const sourceCount = await prisma.newsSource.count();
    
    return {
      status: 'healthy',
      users: userCount,
      topics: topicCount,
      sources: sourceCount,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Database health check failed:', error);
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

// Función para ejecutar migraciones en producción
export async function runMigrations() {
  try {
    console.log('🚀 Ejecutando migraciones de base de datos...');
    
    // En Plesk, las migraciones se ejecutan via Prisma CLI
    // Esta función es principalmente para logging y verificación
    const health = await checkDatabaseHealth();
    
    if (health.status === 'healthy') {
      console.log('✅ Base de datos inicializada correctamente');
      return true;
    } else {
      console.error('❌ Error en la inicialización de la base de datos');
      return false;
    }
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    return false;
  }
}

// Middleware para logging de consultas en desarrollo
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    const before = Date.now();
    const result = await next(params);
    const after = Date.now();
    
    console.log(`Query ${params.model}.${params.action} took ${after - before}ms`);
    return result;
  });
}

// Tipos auxiliares para el cliente Prisma
export type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

// Hook de limpieza para cerrar conexiones al finalizar el proceso
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await disconnectFromDatabase();
  });
  
  process.on('SIGTERM', async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });
  
  process.on('SIGINT', async () => {
    await disconnectFromDatabase();
    process.exit(0);
  });
}

export default prisma;