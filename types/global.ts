// Tipos globales para la plataforma de Aliá Judía Ortodoxa Sionista

import { User, UserProfile, QuizTopic, Question, Answer, Article, NewsSource } from '@prisma/client';
import { DefaultSession } from 'next-auth';

// =================================
// TIPOS DE USUARIO Y AUTENTICACIÓN
// =================================

export interface ExtendedUser extends User {
  profile?: UserProfile | null;
}

export interface UserWithProfile extends User {
  profile: UserProfile;
}

export interface RegistrationData {
  // Información básica
  email: string;
  password: string;
  confirmPassword: string;
  
  // Información personal
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  nationality: string;
  address: string;
  
  // Información judía
  jewishStatus: JewishStatus;
  conversionRabbi?: string;
  conversionCommunity?: string;
  betDin?: string;
  
  // Motivación y conocimientos
  motivation: string;
  hebrewLevel: number;
  halajaKnowledge: number;
  israelExperience?: string;
  profession?: string;
  education?: string;
  familyStatus: FamilyStatus;
  
  // Preferencias
  preferredLocation?: string;
  interestedPrograms?: string[];
  
  // Archivos
  documents?: FileList;
  
  // Consentimientos
  acceptsTerms: boolean;
  acceptsPrivacy: boolean;
  acceptsDataProcessing: boolean;
}

export enum JewishStatus {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  BORN_JEWISH = 'BORN_JEWISH',
  CONVERTED_ORTHODOX = 'CONVERTED_ORTHODOX',
  CONVERTED_CONSERVATIVE = 'CONVERTED_CONSERVATIVE',
  CONVERTED_REFORM = 'CONVERTED_REFORM',
  NOT_JEWISH = 'NOT_JEWISH',
  IN_CONVERSION_PROCESS = 'IN_CONVERSION_PROCESS'
}

export enum FamilyStatus {
  SINGLE = 'SINGLE',
  MARRIED = 'MARRIED',
  DIVORCED = 'DIVORCED',
  WIDOWED = 'WIDOWED',
  ENGAGED = 'ENGAGED'
}

export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

// =================================
// TIPOS DE EDUCACIÓN HALÁJICA
// =================================

export interface QuizTopicWithQuestions extends QuizTopic {
  questions: QuestionWithAnswers[];
  _count?: {
    questions: number;
  };
}

export interface QuestionWithAnswers extends Question {
  answers: Answer[];
  userAnswers?: string[];
}

export interface QuizAttemptData {
  topicId: string;
  answers: UserAnswerData[];
}

export interface UserAnswerData {
  questionId: string;
  answerId: string;
  timeSpent?: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: QuizIncorrectAnswer[];
  timeSpent: number;
  passed: boolean;
}

export interface QuizIncorrectAnswer {
  question: Question;
  selectedAnswer: Answer;
  correctAnswer: Answer;
  explanation: string;
}

export interface UserProgress {
  topicId: string;
  topic: QuizTopic;
  isCompleted: boolean;
  bestScore: number;
  attemptsCount: number;
  isUnlocked: boolean;
}

// =================================
// TIPOS DE NOTICIAS
// =================================

export interface ArticleWithSource extends Article {
  source: NewsSource;
}

export interface NewsAggregationResult {
  articles: ArticleWithSource[];
  totalCount: number;
  lastUpdate: Date;
  sources: NewsSource[];
}

export interface NewsFilters {
  sources?: string[];
  categories?: string[];
  dateRange?: {
    from: Date;
    to: Date;
  };
  isTranslated?: boolean;
  isFeatured?: boolean;
  search?: string;
}

export interface TranslationJob {
  id: string;
  articleId: string;
  originalText: string;
  translatedText?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

// =================================
// TIPOS DE ARCHIVOS Y UPLOADS
// =================================

export interface FileUploadData {
  file: File;
  category: FileCategory;
  description?: string;
}

export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  PHOTO = 'PHOTO',
  CERTIFICATE = 'CERTIFICATE',
  OTHER = 'OTHER'
}

export interface UploadedFileWithUser {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  url?: string;
  category: FileCategory;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  user: {
    id: string;
    email: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
  createdAt: Date;
}

// =================================
// TIPOS DE EMAIL Y COMUNICACIÓN
// =================================

export interface EmailTemplateData {
  name: string;
  subject: string;
  content: string;
  type: EmailType;
  language: string;
  variables: Record<string, any>;
}

export enum EmailType {
  WELCOME = 'WELCOME',
  VERIFICATION = 'VERIFICATION',
  NEWSLETTER = 'NEWSLETTER',
  NOTIFICATION = 'NOTIFICATION',
  TRANSACTIONAL = 'TRANSACTIONAL',
  MARKETING = 'MARKETING'
}

export interface EmailSendData {
  to: string | string[];
  templateName: string;
  variables: Record<string, any>;
  language?: string;
}

export interface NewsletterSubscription {
  email: string;
  name?: string;
  language: string;
  preferences?: {
    topics: string[];
    frequency: 'daily' | 'weekly' | 'monthly';
  };
}

// =================================
// TIPOS DE API Y RESPUESTAS
// =================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface SearchParams extends PaginationParams {
  q?: string;
  filters?: Record<string, any>;
}

// =================================
// TIPOS DE CONFIGURACIÓN
// =================================

export interface AppConfig {
  app: {
    name: string;
    version: string;
    environment: 'development' | 'production' | 'test';
  };
  database: {
    url: string;
  };
  auth: {
    secret: string;
    expiresIn: string;
  };
  email: {
    provider: 'ses' | 'smtp';
    from: string;
    fromName: string;
  };
  translation: {
    provider: 'deepl' | 'google';
    apiKey: string;
  };
  news: {
    updateInterval: number;
    sources: NewsSourceConfig[];
  };
  uploads: {
    maxFileSize: number;
    allowedTypes: string[];
    storage: 'local' | 's3';
  };
}

export interface NewsSourceConfig {
  name: string;
  url: string;
  type: 'rss' | 'scrape';
  enabled: boolean;
  category?: string;
}

// =================================
// TIPOS DE FORMULARIOS
// =================================

export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  options?: { value: string; label: string }[];
  conditional?: {
    field: string;
    value: any;
  };
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

// =================================
// TIPOS DE DASHBOARD Y ADMIN
// =================================

export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  completedQuizzes: number;
  publishedArticles: number;
  pendingApplications: number;
  growth: {
    users: number;
    quizzes: number;
    articles: number;
  };
}

export interface AdminFilters {
  role?: UserRole;
  status?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  search?: string;
}

// =================================
// TIPOS DE HOOKS Y ESTADO
// =================================

export interface UseFormStepReturn {
  currentStep: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  totalSteps: number;
  progress: number;
}

export interface UseQuizReturn {
  currentQuestion: number;
  selectedAnswer: string | null;
  timeSpent: number;
  isCompleted: boolean;
  score: number;
  answers: UserAnswerData[];
  nextQuestion: () => void;
  prevQuestion: () => void;
  selectAnswer: (answerId: string) => void;
  submitQuiz: () => Promise<QuizResult>;
  resetQuiz: () => void;
}

// =================================
// TIPOS DE UTILIDADES
// =================================

export interface EncryptedData {
  encrypted: string;
  authTag: string;
  iv: string;
}

export interface TranslationRequest {
  text: string;
  fromLanguage: string;
  toLanguage: string;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  confidence?: number;
}

// =================================
// TIPOS DE EVENTOS
// =================================

export interface UserEvent {
  type: 'registration' | 'login' | 'quiz_completed' | 'profile_updated';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
}

export interface SystemEvent {
  type: 'news_updated' | 'email_sent' | 'file_uploaded' | 'error_occurred';
  data: Record<string, any>;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
}

// =================================
// TIPOS PARA COMPONENTES
// =================================

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (value: any, record: T) => React.ReactNode;
  width?: string | number;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
}

// =================================
// EXTENSIONES DE NEXT-AUTH
// =================================

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      profile?: UserProfile;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    profile?: UserProfile;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: UserRole;
    profile?: UserProfile;
  }
}