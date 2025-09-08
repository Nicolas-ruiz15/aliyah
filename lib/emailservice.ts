import nodemailer from 'nodemailer';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { prisma } from '../lib/prisma';
import type { EmailType, EmailSendData } from '../types/global';

interface EmailConfig {
  provider: 'ses' | 'smtp';
  from: string;
  fromName: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

/**
 * Servicio de email para la plataforma de Aliá
 * Soporta Amazon SES y SMTP para máxima flexibilidad
 */
export class EmailService {
  private config: EmailConfig;
  private sesClient?: SESClient;
  private smtpTransporter?: nodemailer.Transporter;

  constructor() {
    this.config = {
      provider: (process.env.EMAIL_PROVIDER as 'ses' | 'smtp') || 'smtp',
      from: process.env.EMAIL_FROM || 'noreply@plataforma-alia.com',
      fromName: process.env.EMAIL_FROM_NAME || 'Plataforma Aliá Sionista',
    };

    this.initializeProvider();
  }

  /**
   * Inicializa el proveedor de email configurado
   */
  private initializeProvider() {
    if (this.config.provider === 'ses') {
      this.initializeSES();
    } else {
      this.initializeSMTP();
    }
  }

  /**
   * Configura Amazon SES
   */
  private initializeSES() {
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      throw new Error('Credenciales de AWS SES no configuradas');
    }

    this.sesClient = new SESClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  /**
   * Configura SMTP
   */
  private initializeSMTP() {
    this.smtpTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Obtiene una plantilla de email de la base de datos
   */
  private async getTemplate(name: string, language: string = 'es'): Promise<EmailTemplate> {
    try {
      const template = await prisma.emailTemplate.findFirst({
        where: {
          name,
          language,
          isActive: true,
        },
      });

      if (!template) {
        throw new Error(`Plantilla ${name} no encontrada para idioma ${language}`);
      }

      return {
        subject: template.subject,
        html: template.content,
        text: template.content.replace(/<[^>]*>/g, ''), // Remover HTML para texto plano
      };
    } catch (error) {
      console.error('Error obteniendo plantilla:', error);
      // Fallback a plantilla básica
      return this.getDefaultTemplate(name);
    }
  }

 /**
   * Plantillas por defecto en caso de error
   */
  private getDefaultTemplate(name: string): EmailTemplate {
    const defaultTemplate: EmailTemplate = {
      subject: 'Bienvenido a Plataforma Aliá | ברוך הבא',
      html: `
        <div dir="ltr" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #0033CC 0%, #0038B8 100%); padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0;">ברוך הבא</h1>
            <h2 style="color: #FFD700; margin: 5px 0;">Bienvenido a Plataforma Aliá</h2>
          </div>
          <div style="padding: 30px 20px;">
            <p style="font-size: 16px; line-height: 1.6;">Shalom {{userName}},</p>
            <p style="font-size: 16px; line-height: 1.6;">
              ¡Baruj Hashem! Te damos la bienvenida a nuestra plataforma de Aliá para judíos ortodoxos sionistas.
            </p>
            <p style="font-size: 16px; line-height: 1.6;">
              Tu camino hacia Eretz Israel comienza aquí. Ahora puedes acceder a:
            </p>
            <ul style="font-size: 16px; line-height: 1.6;">
              <li>Educación halájica interactiva</li>
              <li>Noticias de Israel traducidas al español</li>
              <li>Apoyo personalizado para tu Aliá</li>
              <li>Comunidad de futuros olim</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{dashboardUrl}}" style="background: #0033CC; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Acceder a mi Dashboard
              </a>
            </div>
            <p style="font-size: 14px; color: #666; text-align: center; margin-top: 30px;">
              עם ישראל חי • בית ישראל בארץ ישראל
            </p>
          </div>
        </div>
      `,
      text: 'Bienvenido a Plataforma Aliá. Tu camino hacia Israel comienza aquí.',
    };

    const templates: Record<string, EmailTemplate> = {
      welcome: defaultTemplate,
      verification: {
        subject: 'Verifica tu email | אימות אימייל',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Verifica tu dirección de email</h2>
            <p>Haz clic en el enlace para verificar tu cuenta:</p>
            <a href="{{verificationUrl}}" style="background: #0033CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Verificar Email
            </a>
          </div>
        `,
        text: 'Verifica tu email haciendo clic en: {{verificationUrl}}',
      },
      password_reset: {
        subject: 'Restablecer contraseña | איפוס סיסמה',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Restablecer contraseña</h2>
            <p>Haz clic en el enlace para restablecer tu contraseña:</p>
            <a href="{{resetUrl}}" style="background: #0033CC; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Restablecer Contraseña
            </a>
          </div>
        `,
        text: 'Restablece tu contraseña haciendo clic en: {{resetUrl}}',
      },
      newsletter: {
        subject: 'Newsletter - Plataforma Aliá',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>Newsletter</h2>
            <div>{{content}}</div>
            <p><a href="{{unsubscribeUrl}}">Cancelar suscripción</a></p>
          </div>
        `,
        text: '{{content}} - Cancelar suscripción: {{unsubscribeUrl}}',
      },
    };

    // ✅ Retorna la plantilla específica o el template por defecto
    return templates[name] || defaultTemplate;
  }
  /**
   * Reemplaza variables en la plantilla
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, String(value || ''));
    });

    return result;
  }

  /**
   * Envía email usando Amazon SES
   */
  private async sendWithSES(
    to: string | string[],
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    if (!this.sesClient) {
      throw new Error('Cliente SES no inicializado');
    }

    const recipients = Array.isArray(to) ? to : [to];

    try {
      const command = new SendEmailCommand({
        Source: `${this.config.fromName} <${this.config.from}>`,
        Destination: {
          ToAddresses: recipients,
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: html,
              Charset: 'UTF-8',
            },
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          },
        },
      });

      await this.sesClient.send(command);
      return true;
    } catch (error) {
      console.error('Error enviando email con SES:', error);
      return false;
    }
  }

  /**
   * Envía email usando SMTP
   */
  private async sendWithSMTP(
    to: string | string[],
    subject: string,
    html: string,
    text: string
  ): Promise<boolean> {
    if (!this.smtpTransporter) {
      throw new Error('Transporter SMTP no inicializado');
    }

    try {
      await this.smtpTransporter.sendMail({
        from: `${this.config.fromName} <${this.config.from}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
      });

      return true;
    } catch (error) {
      console.error('Error enviando email con SMTP:', error);
      return false;
    }
  }

  /**
   * Registra el envío de email en la base de datos
   */
  private async logEmail(
    to: string,
    templateName: string,
    status: 'SENT' | 'FAILED',
    errorMessage?: string
  ) {
    try {
      await prisma.emailLog.create({
        data: {
          toEmail: to,
          fromEmail: this.config.from,
          subject: templateName,
          status,
          errorMessage,
          sentAt: status === 'SENT' ? new Date() : null,
        },
      });
    } catch (error) {
      console.error('Error registrando email log:', error);
    }
  }

  /**
   * Método principal para enviar emails
   */
  async sendEmail(data: EmailSendData): Promise<boolean> {
    try {
      const recipients = Array.isArray(data.to) ? data.to : [data.to];
      
      for (const recipient of recipients) {
        const template = await this.getTemplate(data.templateName, data.language);
        
        const subject = this.replaceVariables(template.subject, data.variables);
        const html = this.replaceVariables(template.html, data.variables);
        const text = this.replaceVariables(template.text, data.variables);

        let success = false;
        
        if (this.config.provider === 'ses') {
          success = await this.sendWithSES(recipient, subject, html, text);
        } else {
          success = await this.sendWithSMTP(recipient, subject, html, text);
        }

        await this.logEmail(
          recipient,
          data.templateName,
          success ? 'SENT' : 'FAILED',
          success ? undefined : 'Error en envío'
        );

        if (!success) {
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  /**
   * Métodos de conveniencia para tipos específicos de email
   */

  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      templateName: 'welcome',
      variables: {
        userName,
        dashboardUrl: `${process.env.NEXTAUTH_URL}/dashboard`,
      },
    });
  }

  async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      templateName: 'verification',
      variables: {
        verificationUrl: `${process.env.NEXTAUTH_URL}/auth/verify?token=${token}`,
      },
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    return this.sendEmail({
      to: email,
      templateName: 'password_reset',
      variables: {
        resetUrl: `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`,
      },
    });
  }

  async sendNewsletterEmail(emails: string[], content: string): Promise<boolean> {
    return this.sendEmail({
      to: emails,
      templateName: 'newsletter',
      variables: {
        content,
        unsubscribeUrl: `${process.env.NEXTAUTH_URL}/newsletter/unsubscribe`,
      },
    });
  }

  /**
   * Verifica la configuración del servicio
   */
  async testConnection(): Promise<boolean> {
    try {
      if (this.config.provider === 'smtp' && this.smtpTransporter) {
        await this.smtpTransporter.verify();
        return true;
      }
      
      // Para SES, simplemente verificamos que esté configurado
      if (this.config.provider === 'ses' && this.sesClient) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verificando conexión de email:', error);
      return false;
    }
  }
}

// Instancia singleton del servicio de email
export const emailService = new EmailService();

export default emailService;