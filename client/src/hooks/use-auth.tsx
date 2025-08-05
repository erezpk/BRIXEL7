import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { signInWithGoogle } from "@/lib/google-oauth";

interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  agencyId: string | null;
  avatar?: string | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface SignupData {
  email: string;
  password: string;
  fullName: string;
  agencyName: string;
  industry?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (response.status === 401) {
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const result = await response.json();
        return result.user;
      } catch (error) {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/auth/login',
        body: data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'שגיאה בהתחברות');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'תגובה לא תקינה מהשרת');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      const response = await apiRequest({
        method: 'POST',
        url: '/api/auth/signup',
        body: data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'שגיאה ביצירת החשבון');
      }
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        const text = await response.text();
        throw new Error(text || 'תגובה לא תקינה מהשרת');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      return await signInWithGoogle();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest({
        method: 'POST',
        url: '/api/auth/logout'
      });
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  return {
    user,
    isLoading,
    login: loginMutation.mutate,
    loginWithGoogle: googleLoginMutation.mutate,
    signup: signupMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    isGoogleLoginLoading: googleLoginMutation.isPending,
    isSignupLoading: signupMutation.isPending,
    isLogoutLoading: logoutMutation.isPending,
    loginError: loginMutation.error,
    googleLoginError: googleLoginMutation.error,
    signupError: signupMutation.error,
    loginMutation,
    googleLoginMutation,
    signupMutation,
    logoutMutation,
  };
}
