import { createContext, useContext, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { onAuthStateChange } from "@/lib/firebase";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setFirebaseUser(user);
      setIsInitialized(true);
    });

    return unsubscribe;
  }, []);

  const { data: user, isLoading: queryLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    enabled: isInitialized && !!firebaseUser,
    retry: false,
  });

  const isLoading = !isInitialized || (firebaseUser && queryLoading);

  return (
    <AuthContext.Provider value={{
      user: (user as User) || null,
      isLoading,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}