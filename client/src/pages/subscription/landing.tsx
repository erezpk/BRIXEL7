import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Check, 
  Crown, 
  Zap, 
  Shield, 
  Users, 
  Building, 
  ChartBar,
  CreditCard,
  Globe,
  Star
} from "lucide-react";

// Purchase form schema
const purchaseSchema = z.object({
  planId: z.string().min(1, "יש לבחור תוכנית"),
  customerEmail: z.string().email("כתובת מייל לא תקינה"),
  customerName: z.string().min(2, "שם מלא נדרש"),
  agencyName: z.string().min(2, "שם הסוכנות נדרש"),
});

export default function SubscriptionLanding() {
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch subscription plans
  const { data: plans, isLoading } = useQuery({
    queryKey: ["/api/subscriptions/plans"],
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/subscriptions/purchase", data);
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        toast({
          title: "שגיאה",
          description: data.error || "שגיאה ביצירת קישור התשלום",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה ביצירת הזמנה",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      planId: "",
      customerEmail: "",
      customerName: "",
      agencyName: "",
    },
  });

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    form.setValue("planId", planId);
    setIsDialogOpen(true);
  };

  const onSubmit = (data: any) => {
    purchaseMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            AgencyCRM
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            מערכת CRM מתקדמת לסוכנויות דיגיטליות
          </p>
          <div className="mt-6 flex justify-center space-x-reverse space-x-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Shield className="w-4 h-4 mr-1" />
              אבטחה מתקדמת
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Globe className="w-4 h-4 mr-1" />
              תמיכה בעברית
            </Badge>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Zap className="w-4 h-4 mr-1" />
              ביצועים גבוהים
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {plans?.map((plan: any) => (
            <Card 
              key={plan.id} 
              className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                plan.isPopular ? 'ring-2 ring-blue-500 scale-105' : ''
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-medium">
                  הכי פופולרי
                  <Star className="inline-block w-4 h-4 mr-1" />
                </div>
              )}
              
              <CardHeader className={plan.isPopular ? 'pt-12' : ''}>
                <CardTitle className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    {plan.id === 'starter' && <Users className="w-6 h-6 text-green-500" />}
                    {plan.id === 'professional' && <Building className="w-6 h-6 text-blue-500" />}
                    {plan.id === 'enterprise' && <Crown className="w-6 h-6 text-purple-500" />}
                  </div>
                  {plan.nameHe}
                </CardTitle>
                <CardDescription className="text-center">
                  {plan.descriptionHe}
                </CardDescription>
                <div className="text-center mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    ₪{plan.price / 100}
                  </span>
                  <span className="text-base text-gray-500 mr-2">/חודש</span>
                </div>
              </CardHeader>

              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center">
                      <Check className="w-5 h-5 text-green-500 ml-3 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  className={`w-full ${
                    plan.isPopular 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={purchaseMutation.isPending}
                >
                  {plan.isPopular ? (
                    <>
                      <Crown className="w-4 h-4 ml-2" />
                      התחל עכשיו
                    </>
                  ) : (
                    'בחר תוכנית'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            למה לבחור ב-AgencyCRM?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">ניהול לקוחות מתקדם</h3>
              <p className="text-gray-600 text-sm">
                מעקב אחר לידים, לקוחות ופרויקטים במקום אחד
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">מערכת תשלומים מובנית</h3>
              <p className="text-gray-600 text-sm">
                התממשקות עם ספקי סליקה ישראליים ובינלאומיים
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <ChartBar className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">דוחות ואנליטיקה</h3>
              <p className="text-gray-600 text-sm">
                תובנות עמוקות על הביצועים והרווחיות
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">אבטחה מתקדמת</h3>
              <p className="text-gray-600 text-sm">
                הגנה מלאה על נתוני הלקוחות והעסק
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>השלמת הרכישה</DialogTitle>
            <DialogDescription>
              אנא מלאו את הפרטים להשלמת הרכישה
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="agencyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם הסוכנות</FormLabel>
                    <FormControl>
                      <Input placeholder="סוכנות הדיגיטל שלי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מלא</FormLabel>
                    <FormControl>
                      <Input placeholder="ישראל ישראלי" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>כתובת מייל</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="israel@agency.co.il" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={purchaseMutation.isPending}
                >
                  {purchaseMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
                  ) : (
                    <CreditCard className="w-4 h-4 ml-2" />
                  )}
                  המשך לתשלום
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  ביטול
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}