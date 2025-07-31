'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/firebase';

export type UserRole = 'doctor' | 'patient';

export interface User {
  email: string;
  role: UserRole;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const roleMap: Record<string, { role: UserRole; name: string }> = {
  'doctoruser1@gmail.com': { role: 'doctor', name: 'Dr. Smith' },
  'patientuser1@gmail.com': { role: 'patient', name: 'John Doe' },
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Firebase auth state persistence
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email!;
        const mapped = roleMap[email] || { 
          role: email.includes('doctor') ? 'doctor' as const : 'patient' as const, 
          name: email.split('@')[0] 
        };

        if (mapped) {
          setUser({
            email,
            role: mapped.role,
            name: mapped.name,
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  //Firebase login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const emailFromUser = result.user.email!;
      const mapped = roleMap[emailFromUser] || { 
        role: emailFromUser.includes('doctor') ? 'doctor' as const : 'patient' as const, 
        name: emailFromUser.split('@')[0] 
      };

      setUser({
        email: emailFromUser,
        role: mapped.role,
        name: mapped.name,
      });

      setIsLoading(false);
      return { success: true };
    } catch (err: unknown) {
      console.error('Login error:', err);
      setIsLoading(false);
      let errorMessage = 'Login failed. Please check your credentials.';
      
      const firebaseError = err as { code?: string; message?: string };
      if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/user-not-found') {
        errorMessage = 'Invalid email or password';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  //Logout
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};