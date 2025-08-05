import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChange } from '@/lib/firebase';
import type { User as FirebaseUser } from 'firebase/auth';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  agencyId: string | null;
  avatar?: string | null;
}

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((firebaseUser) => {
      setFirebaseUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    firebaseUser,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}