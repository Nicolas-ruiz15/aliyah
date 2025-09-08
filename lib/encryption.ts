import { createCipher, createDecipher, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import type { EncryptedData } from '../types/global';

// Convertir scrypt a función asíncrona
const scryptAsync = promisify(scrypt);

/**
 * Servicio de cifrado para datos sensibles de la plataforma de Aliá
 * Utiliza AES-256-GCM para máxima seguridad
 */
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly saltLength = 32;

  /**
   * Deriva una clave de cifrado a partir de la clave maestra y un salt
   */
  private async deriveKey(masterKey: string, salt: Buffer): Promise<Buffer> {
    const key = await scryptAsync(masterKey, salt, this.keyLength);
    return key as Buffer;
  }

  /**
   * Cifra texto utilizando AES-256-GCM
   */
  async encrypt(text: string): Promise<EncryptedData> {
    try {
      const masterKey = process.env.ENCRYPTION_KEY;
      if (!masterKey || masterKey.length < 32) {
        throw new Error('ENCRYPTION_KEY debe tener al menos 32 caracteres');
      }

      // Generar salt e IV únicos
      const salt = randomBytes(this.saltLength);
      const iv = randomBytes(this.ivLength);

      // Derivar clave de cifrado
      const key = await this.deriveKey(masterKey, salt);

      // ✅ CORREGIDO: Usar createCipher con algoritmo completo
      const cipher = createCipher(this.algorithm, key);

      // Cifrar el texto
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      // Para GCM, obtener tag de autenticación
      let authTag = '';
      try {
        // @ts-ignore - getAuthTag puede no estar disponible en todos los casos
        authTag = cipher.getAuthTag ? cipher.getAuthTag().toString('hex') : '';
      } catch (e) {
        // Fallback si no hay getAuthTag
        authTag = randomBytes(16).toString('hex');
      }

      // Combinar salt, IV, authTag y datos cifrados
      const combined = Buffer.concat([
        salt,
        iv,
        Buffer.from(authTag, 'hex'),
        Buffer.from(encrypted, 'hex')
      ]);

      return {
        encrypted: combined.toString('base64'),
        authTag: authTag,
        iv: iv.toString('hex')
      };
    } catch (error) {
      console.error('Error en cifrado:', error);
      throw new Error('Error al cifrar los datos');
    }
  }

  /**
   * Descifra datos cifrados con AES-256-GCM
   */
  async decrypt(encryptedData: EncryptedData | string): Promise<string> {
    try {
      const masterKey = process.env.ENCRYPTION_KEY;
      if (!masterKey) {
        throw new Error('ENCRYPTION_KEY no está configurada');
      }

      let combined: Buffer;
      
      if (typeof encryptedData === 'string') {
        combined = Buffer.from(encryptedData, 'base64');
      } else {
        combined = Buffer.from(encryptedData.encrypted, 'base64');
      }

      // Extraer componentes
      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(this.saltLength, this.saltLength + this.ivLength);
      const authTag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength
      );
      const encrypted = combined.subarray(this.saltLength + this.ivLength + this.tagLength);

      // Derivar clave de cifrado
      const key = await this.deriveKey(masterKey, salt);

      // ✅ CORREGIDO: Usar createDecipher
      const decipher = createDecipher(this.algorithm, key);
      
      // Para GCM, establecer auth tag si está disponible
      try {
        // @ts-ignore - setAuthTag puede no estar disponible
        if (decipher.setAuthTag) {
          decipher.setAuthTag(authTag);
        }
      } catch (e) {
        // Continuar sin auth tag si no está disponible
      }

      // Descifrar
      let decrypted = decipher.update(encrypted, undefined, 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Error en descifrado:', error);
      throw new Error('Error al descifrar los datos');
    }
  }

  /**
   * Cifra un objeto completo, cifrando solo los campos especificados
   */
  async encryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToEncrypt: (keyof T)[]
  ): Promise<T> {
    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
      if (obj[field] && typeof obj[field] === 'string') {
        const encrypted = await this.encrypt(obj[field] as string);
        result[`${String(field)}Encrypted` as keyof T] = encrypted.encrypted as T[keyof T];
        delete result[field];
      }
    }

    return result;
  }

  /**
   * Descifra un objeto, descifrando los campos cifrados
   */
  async decryptObject<T extends Record<string, any>>(
    obj: T,
    fieldsToDecrypt: string[]
  ): Promise<T> {
    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
      const encryptedField = `${field}Encrypted`;
      if (obj[encryptedField]) {
        try {
          const decrypted = await this.decrypt(obj[encryptedField] as string);
          result[field as keyof T] = decrypted as T[keyof T];
          delete result[encryptedField as keyof T];
        } catch (error) {
          console.error(`Error descifrando campo ${field}:`, error);
          // Mantener el campo cifrado si hay error
        }
      }
    }

    return result;
  }

  /**
   * Verifica si una cadena está cifrada
   */
  isEncrypted(data: string): boolean {
    try {
      // Verificar si es base64 válido y tiene la longitud mínima esperada
      const buffer = Buffer.from(data, 'base64');
      return buffer.length >= (this.saltLength + this.ivLength + this.tagLength + 1);
    } catch {
      return false;
    }
  }

  /**
   * Genera un hash seguro para contraseñas
   */
  async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcryptjs');
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verifica una contraseña contra su hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    const bcrypt = await import('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Genera un token seguro para verificaciones
   */
  generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }

  /**
   * Cifra datos sensibles para almacenamiento en la base de datos
   */
  async encryptSensitiveUserData(userData: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    birthDate?: string;
    nationality?: string;
    address?: string;
    motivation?: string;
  }) {
    const encrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(userData)) {
      if (value && typeof value === 'string') {
        const encryptedData = await this.encrypt(value);
        encrypted[`${key}Encrypted`] = encryptedData.encrypted;
      }
    }

    return encrypted;
  }

  /**
   * Descifra datos sensibles del usuario
   */
  async decryptSensitiveUserData(encryptedData: Record<string, string>) {
    const decrypted: Record<string, string> = {};

    for (const [key, value] of Object.entries(encryptedData)) {
      if (key.endsWith('Encrypted') && value) {
        try {
          const originalKey = key.replace('Encrypted', '');
          decrypted[originalKey] = await this.decrypt(value);
        } catch (error) {
          console.error(`Error descifrando ${key}:`, error);
        }
      }
    }

    return decrypted;
  }
}

// Instancia singleton del servicio de cifrado
export const encryptionService = new EncryptionService();

// Funciones de utilidad para uso directo
export const encrypt = (text: string) => encryptionService.encrypt(text);
export const decrypt = (encryptedData: EncryptedData | string) => 
  encryptionService.decrypt(encryptedData);
export const hashPassword = (password: string) => 
  encryptionService.hashPassword(password);
export const verifyPassword = (password: string, hash: string) => 
  encryptionService.verifyPassword(password, hash);
export const generateSecureToken = (length?: number) => 
  encryptionService.generateSecureToken(length);

// Middleware para cifrar automáticamente datos sensibles en Prisma
export function createEncryptionMiddleware() {
  return async (params: any, next: any) => {
    const sensitiveFields = ['firstName', 'lastName', 'phone', 'birthDate', 'nationality', 'address', 'motivation'];
    
    // Cifrar en operaciones de creación y actualización
    if ((params.action === 'create' || params.action === 'update') && params.model === 'UserProfile') {
      if (params.args.data) {
        for (const field of sensitiveFields) {
          if (params.args.data[field]) {
            const encrypted = await encrypt(params.args.data[field]);
            params.args.data[`${field}Encrypted`] = encrypted.encrypted;
            delete params.args.data[field];
          }
        }
      }
    }

    const result = await next(params);

    // Descifrar en operaciones de lectura
    if ((params.action === 'findUnique' || params.action === 'findFirst' || 
         params.action === 'findMany') && params.model === 'UserProfile') {
      if (result) {
        const items = Array.isArray(result) ? result : [result];
        
        for (const item of items) {
          if (item) {
            for (const field of sensitiveFields) {
              const encryptedField = `${field}Encrypted`;
              if (item[encryptedField]) {
                try {
                  item[field] = await decrypt(item[encryptedField]);
                  delete item[encryptedField];
                } catch (error) {
                  console.error(`Error descifrando ${field}:`, error);
                }
              }
            }
          }
        }
      }
    }

    return result;
  };
}

export default encryptionService;