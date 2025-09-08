'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import type { ExtendedUser } from '../../types/global';

interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  hasProfile: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<ExtendedUser | null>(null);

  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isModerator = user?.role === 'MODERATOR' || isAdmin;
  const hasProfile = !!user?.profile;

  // Función para refrescar los datos del usuario
  const refreshUser = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch(`/api/users/${session.user.id}`);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Actualizar usuario cuando cambie la sesión
  useEffect(() => {
    if (session?.user) {
      setUser(session.user as ExtendedUser);
      // Refrescar datos completos del usuario
      refreshUser();
    } else {
      setUser(null);
    }
  }, [session]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    isAdmin,
    isModerator,
    hasProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar el contexto de autenticación
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}

// Hook para requerir autenticación
export function useRequireAuth() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/auth/login';
    }
  }, [auth.isLoading, auth.isAuthenticated]);

  return auth;
}

// Hook para requerir rol de administrador
export function useRequireAdmin() {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && (!auth.isAuthenticated || !auth.isAdmin)) {
      window.location.href = '/unauthorized';
    }
  }, [auth.isLoading, auth.isAuthenticated, auth.isAdmin]);

  return auth;
}

// Hook para verificar permisos
export function usePermissions() {
  const auth = useAuth();

  const canAccessAdmin = auth.isAdmin;
  const canModerate = auth.isModerator;
  const canEditProfile = auth.isAuthenticated;
  const canTakeQuiz = auth.isAuthenticated && auth.hasProfile;
  const canViewNews = true; // Todos pueden ver noticias
  
  const hasPermission = (permission: string): boolean => {
    switch (permission) {
      case 'admin':
        return canAccessAdmin;
      case 'moderate':
        return canModerate;
      case 'edit_profile':
        return canEditProfile;
      case 'take_quiz':
        return canTakeQuiz;
      case 'view_news':
        return canViewNews;
      default:
        return false;
    }
  };

  return {
    canAccessAdmin,
    canModerate,
    canEditProfile,
    canTakeQuiz,
    canViewNews,
    hasPermission,
  };
}