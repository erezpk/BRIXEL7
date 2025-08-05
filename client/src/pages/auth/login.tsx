import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function Login() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (!isLoading && user) {
      setLocation("/dashboard");
    }
  }, [user, isLoading, setLocation]);

  const handleReplitLogin = () => {
    window.location.href = '/api/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-blue-50 to-white p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900 font-rubik">
            כניסה למערכת CRM
          </CardTitle>
          <CardDescription>
            התחבר כדי לגשת למערכת ניהול הלקוחות שלך
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Button 
            onClick={handleReplitLogin}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            size="lg"
          >
            <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 9 5.16-.74 9-4.45 9-10V7l-10-5z"/>
            </svg>
            התחבר עם Replit
          </Button>
          
          <div className="text-center text-sm text-gray-600">
            <p>
              התחברות מאובטחת דרך Replit 
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}