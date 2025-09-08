import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../../lib/prisma';
import { hashPassword, encryptionService } from '../../../../lib/encryption';
import { isValidEmail } from '../../../../lib/utils';

// Schema de validación para registro
const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'Nombre es requerido'),
  lastName: z.string().min(1, 'Apellido es requerido'),
  phone: z.string().optional(),
  birthDate: z.string().optional(),
  nationality: z.string().optional(),
  address: z.string().optional(),
  jewishStatus: z.enum([
    'NOT_SPECIFIED',
    'BORN_JEWISH',
    'CONVERTED_ORTHODOX',
    'CONVERTED_CONSERVATIVE',
    'CONVERTED_REFORM',
    'NOT_JEWISH',
    'IN_CONVERSION_PROCESS'
  ]),
  conversionRabbi: z.string().optional(),
  conversionCommunity: z.string().optional(),
  betDin: z.string().optional(),
  motivation: z.string().optional(),
  hebrewLevel: z.number().min(0).max(10).default(0),
  halajaKnowledge: z.number().min(0).max(10).default(0),
  israelExperience: z.string().optional(),
  profession: z.string().optional(),
  education: z.string().optional(),
  familyStatus: z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED', 'ENGAGED']).default('SINGLE'),
  preferredLocation: z.string().optional(),
  interestedPrograms: z.array(z.string()).optional(),
  acceptsTerms: z.boolean().refine(val => val === true, 'Debes aceptar los términos'),
  acceptsPrivacy: z.boolean().refine(val => val === true, 'Debes aceptar la política de privacidad'),
  acceptsDataProcessing: z.boolean().refine(val => val === true, 'Debes aceptar el procesamiento de datos'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos de entrada
    const validatedData = registerSchema.parse(body);

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email.toLowerCase() }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await hashPassword(validatedData.password);

    // Cifrar datos sensibles
    const encryptedData = await encryptionService.encryptSensitiveUserData({
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      birthDate: validatedData.birthDate,
      nationality: validatedData.nationality,
      address: validatedData.address,
      motivation: validatedData.motivation,
    });

    // Crear usuario y perfil en una transacción
    const result = await prisma.$transaction(async (tx) => {
      // Crear usuario
      const user = await tx.user.create({
        data: {
          email: validatedData.email.toLowerCase(),
          password: hashedPassword,
          role: 'USER',
          status: 'PENDING',
        }
      });

      // Crear perfil
      const profile = await tx.userProfile.create({
        data: {
          userId: user.id,
          ...encryptedData,
          jewishStatus: validatedData.jewishStatus,
          conversionRabbi: validatedData.conversionRabbi,
          conversionCommunity: validatedData.conversionCommunity,
          betDin: validatedData.betDin,
          hebrewLevel: validatedData.hebrewLevel,
          halajaKnowledge: validatedData.halajaKnowledge,
          israelExperience: validatedData.israelExperience,
          profession: validatedData.profession,
          education: validatedData.education,
          familyStatus: validatedData.familyStatus,
          preferredLocation: validatedData.preferredLocation,
          interestedPrograms: validatedData.interestedPrograms,
        }
      });

      return { user, profile };
    });

    // Generar token de verificación de email
    const verificationToken = encryptionService.generateSecureToken();
    
    // Guardar token de verificación (implementar tabla de tokens si es necesario)
    // await prisma.verificationToken.create({...})

    // Enviar email de verificación (implementar EmailService)
    // await emailService.sendVerificationEmail(user.email, verificationToken);

    return NextResponse.json({
      success: true,
      message: 'Usuario registrado exitosamente. Por favor verifica tu email.',
      user: {
        id: result.user.id,
        email: result.user.email,
        status: result.user.status,
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Datos inválidos', 
          details: error.errors 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar disponibilidad de email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { error: 'Email inválido' },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    return NextResponse.json({
      available: !existingUser,
      message: existingUser ? 'Email ya registrado' : 'Email disponible'
    });

  } catch (error) {
    console.error('Error verificando email:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}