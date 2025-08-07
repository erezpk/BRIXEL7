import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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
      try {
        const response = await apiRequest('/api/auth/login', 'POST', data);
        
        // apiRequest already handles error responses, so if we get here, it's successful
        const result = await response.json();
        return result;
      } catch (error: any) {
        // Handle specific error messages from the server
        if (error.message && error.message.includes('401')) {
          throw new Error('אימייל או סיסמה שגויים');
        }
        throw new Error(error.message || 'שגיאה בהתחברות');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupData) => {
      try {
        const response = await apiRequest('/api/auth/signup', 'POST', data);
        
        // apiRequest already handles error responses, so if we get here, it's successful
        const result = await response.json();
        return result;
      } catch (error: any) {
        // Handle specific error messages from the server
        if (error.message && error.message.includes('400')) {
          throw new Error('נתונים לא תקינים או משתמש כבר קיים');
        }
        throw new Error(error.message || 'שגיאה ביצירת החשבון');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: async () => {
      // Redirect to Google OAuth endpoint - this will redirect to Google's auth page
      window.location.href = '/api/auth/google';
      return Promise.resolve();
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('/api/auth/logout', 'POST');
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
