import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (userData: any) => Promise<void>;
  logout: () => void;
  isLoginLoading: boolean;
  loginError: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Regular login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setLoginError(null);
    },
    onError: (error: Error) => {
      setLoginError(error.message);
    },
  });

  // Google login mutation
  const googleLoginMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google login failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      setLoginError(null);
    },
    onError: (error: Error) => {
      setLoginError(error.message);
    },
  });

  const login = async (email: string, password: string) => {
    setLoginError(null);
    return loginMutation.mutateAsync({ email, password });
  };

  const loginWithGoogle = async (userData: any) => {
    setLoginError(null);
    return googleLoginMutation.mutateAsync(userData);
  };

  const logout = () => {
    setUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithGoogle,
        logout,
        isLoginLoading: loginMutation.isPending || googleLoginMutation.isPending,
        loginError,
      }}
    >
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