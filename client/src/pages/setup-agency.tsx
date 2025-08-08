import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowRight, CheckCircle } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

export default function SetupAgency() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isFromGoogle, setIsFromGoogle] = useState(false);
  
  const [formData, setFormData] = useState({
    agencyName: "",
    industry: "",
    website: "",
    phone: ""
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('from') === 'google') {
      setIsFromGoogle(true);
    }
  }, []);

  const setupAgencyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/setup-agency', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה ביצירת הסוכנות');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "הסוכנות נוצרה בהצלחה!",
        description: "ברוכים הבאים למערכת CRM שלכם",
      });
      setLocation("/dashboard");
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה ביצירת הסוכנות",
        description: error?.message || "נסו שוב",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agencyName.trim()) {
      toast({
        title: "שם הסוכנות נדרש",
        description: "אנא הזינו שם לסוכנות",
        variant: "destructive",
      });
      return;
    }

    if (!formData.industry) {
      toast({
        title: "תחום עיסוק נדרש",
        description: "אנא בחרו תחום עיסוק",
        variant: "destructive",
      });
      return;
    }

    setupAgencyMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
            הגדרת הסוכנות שלכם
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300">
            {isFromGoogle 
              ? "כמעט סיימנו! אנא הגדירו את פרטי הסוכנות שלכם"
              : "הגדירו את פרטי הסוכנות שלכם כדי להתחיל"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isFromGoogle && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
              <div className="flex items-center text-green-800 dark:text-green-300">
                <CheckCircle className="h-4 w-4 mr-2" />
                <span className="text-sm">התחברתם בהצלחה עם Google!</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="agencyName" className="text-right block mb-2">
                שם הסוכנות *
              </Label>
              <Input
                id="agencyName"
                type="text"
                value={formData.agencyName}
                onChange={(e) => setFormData(prev => ({ ...prev, agencyName: e.target.value }))}
                className="text-right"
                placeholder="לדוגמה: דיגיטל מדיה פלוס"
                required
              />
            </div>

            <div>
              <Label htmlFor="industry" className="text-right block mb-2">
                תחום עיסוק *
              </Label>
              <Select 
                value={formData.industry} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}
                required
              >
                <SelectTrigger className="text-right">
                  <SelectValue placeholder="בחרו תחום עיסוק" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="digital_marketing">שיווק דיגיטלי</SelectItem>
                  <SelectItem value="web_development">פיתוח אתרים</SelectItem>
                  <SelectItem value="graphic_design">עיצוב גרפי</SelectItem>
                  <SelectItem value="video_production">הפקת וידאו</SelectItem>
                  <SelectItem value="social_media">רשתות חברתיות</SelectItem>
                  <SelectItem value="consulting">ייעוץ עסקי</SelectItem>
                  <SelectItem value="other">אחר</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="website" className="text-right block mb-2">
                אתר אינטרנט
              </Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                className="text-right"
                placeholder="https://www.example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-right block mb-2">
                טלפון
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="text-right"
                placeholder="050-1234567"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={setupAgencyMutation.isPending}
            >
              {setupAgencyMutation.isPending ? "יוצר..." : "צור סוכנות"}
              <ArrowRight className="mr-2 h-4 w-4" />
            </Button>
          </form>

          {isFromGoogle && (
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                לאחר יצירת הסוכנות תוכלו להתחיל לנהל לקוחות ופרויקטים
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}