import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, CreditCard, RefreshCw, CheckCircle, XCircle, Clock, DollarSign, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { PaymentSettings, ClientPaymentMethod, Retainer, OneTimePayment } from "@shared/schema";

// Payment provider options
const PAYMENT_PROVIDERS = [
  { 
    value: "meshulam", 
    label: "משולם",
    description: "ספק תשלומים ישראלי מוביל",
    fees: "2.9% + ₪1.5",
    features: ["כרטיסי אשראי", "תשלומי טוקן", "תשלומים חוזרים"]
  },
  { 
    value: "greeninvoice", 
    label: "חשבונית ירוקה",
    description: "פלטפורמת חשבוניות וחיוב ישראלית",
    fees: "2.5% + ₪1.2",
    features: ["כרטיסי אשראי", "PayPal", "BlueSnap", "Payoneer"]
  },
  { 
    value: "stripe", 
    label: "Stripe",
    description: "פלטפורמת תשלומים גלובלית",
    fees: "2.9% + $0.30",
    features: ["כרטיסי אשראי", "Apple Pay", "Google Pay"]
  },
];

// Schemas for forms
const paymentSettingsSchema = z.object({
  provider: z.string().min(1, "יש לבחור ספק תשלומים"),
  isEnabled: z.boolean(),
  apiKey: z.string().min(1, "מפתח API נדרש"),
  secretKey: z.string().min(1, "מפתח סודי נדרש"),
  webhookSecret: z.string().optional(),
  settings: z.object({
    currency: z.string().default("ILS"),
    testMode: z.boolean().default(true),
    autoCapture: z.boolean().default(true),
    defaultDescription: z.string().optional(),
  }),
});

const retainerSchema = z.object({
  clientId: z.string().min(1, "יש לבחור לקוח"),
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  amount: z.number().min(1, "סכום חייב להיות גדול מ-0"),
  frequency: z.enum(["monthly", "quarterly", "yearly"]),
  startDate: z.string().min(1, "תאריך התחלה נדרש"),
  endDate: z.string().optional(),
  autoRenew: z.boolean().default(true),
  emailNotifications: z.boolean().default(true),
});

export default function PaymentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");
  const [isRetainerDialogOpen, setIsRetainerDialogOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);

  // Queries
  const { data: paymentSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["/api/payments/payment-settings"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: retainers, isLoading: retainersLoading } = useQuery({
    queryKey: ["/api/payments/retainers"],
  });

  const { data: oneTimePayments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["/api/payments/one-time-payments"],
  });

  // Mutations
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const method = paymentSettings ? "PUT" : "POST";
      return apiRequest(method, "/api/payments/payment-settings", data);
    },
    onSuccess: () => {
      toast({
        title: "הצלחה",
        description: "הגדרות התשלומים נשמרו בהצלחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/payment-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה בשמירת הגדרות התשלומים",
        variant: "destructive",
      });
    },
  });

  const createRetainerMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/payments/retainers", {
        ...data,
        amount: Math.round(data.amount * 100), // Convert to agorot
      });
    },
    onSuccess: () => {
      toast({
        title: "רייטנר נוצר בהצלחה",
        description: "הרייטנר החדש נוסף למערכת",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments/retainers"] });
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה ביצירת הרייטנר",
        variant: "destructive",
      });
    },
  });

  const createPaymentLinkMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string; clientId?: string }) => {
      return apiRequest("POST", "/api/payments/payment-link", {
        ...data,
        amount: Math.round(data.amount * 100), // Convert to agorot
      });
    },
    onSuccess: (data) => {
      if (data.success && data.paymentUrl) {
        window.open(data.paymentUrl, '_blank');
        toast({
          title: "קישור תשלום נוצר",
          description: "הקישור נפתח בחלון חדש",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: error.message || "שגיאה ביצירת קישור התשלום",
        variant: "destructive",
      });
    },
  });

  // Forms
  const settingsForm = useForm({
    resolver: zodResolver(paymentSettingsSchema),
    defaultValues: {
      provider: "meshulam",
      isEnabled: false,
      apiKey: "",
      secretKey: "",
      webhookSecret: "",
      currency: "ILS",
      testMode: true,
      autoCapture: true,
      defaultDescription: "",
      ...(paymentSettings || {}),
    },
  });

  const retainerForm = useForm({
    resolver: zodResolver(retainerSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      amount: 0,
      frequency: "monthly" as const,
      startDate: "",
      endDate: "",
      autoRenew: true,
      emailNotifications: true,
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
    }).format(amount / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: "default" as const, label: "פעיל", icon: CheckCircle },
      paused: { variant: "secondary" as const, label: "מושהה", icon: Clock },
      cancelled: { variant: "destructive" as const, label: "בוטל", icon: XCircle },
      pending: { variant: "outline" as const, label: "ממתין", icon: Clock },
      completed: { variant: "outline" as const, label: "הושלם", icon: CheckCircle },
      failed: { variant: "destructive" as const, label: "נכשל", icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ניהול תשלומים</h1>
          <p className="text-muted-foreground mt-2">
            ניהול הגדרות תשלומים, כרטיסי אשראי, ורייטנרים
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="settings">הגדרות</TabsTrigger>
          <TabsTrigger value="retainers">רייטנרים</TabsTrigger>
          <TabsTrigger value="payments">תשלומים</TabsTrigger>
          <TabsTrigger value="reports">דוחות</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                הגדרות ספק התשלומים
              </CardTitle>
              <CardDescription>
                חיבור לחברת הסליקה לעיבוד תשלומים
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...settingsForm}>
                <form onSubmit={settingsForm.handleSubmit((data) => saveSettingsMutation.mutate(data))} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={settingsForm.control}
                      name="provider"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ספק תשלומים</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר ספק תשלומים" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="meshulam">משולם</SelectItem>
                              <SelectItem value="greeninvoice">חשבונית ירוקה</SelectItem>
                              <SelectItem value="manual">ללא סליקה (ניהול ידני)</SelectItem>
                              <SelectItem value="tranzila">טרנזילה</SelectItem>
                              <SelectItem value="cardcom">קארדקום</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מטבע</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר מטבע" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ILS">שקל ישראלי (₪)</SelectItem>
                              <SelectItem value="USD">דולר אמריקאי ($)</SelectItem>
                              <SelectItem value="EUR">יורו (€)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מפתח API</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="הכנס מפתח API" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="secretKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מפתח סודי</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="הכנס מפתח סודי" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="webhookSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Webhook Secret (אופציונלי)</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="הכנס webhook secret" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="defaultDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תיאור ברירת מחדל</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="תשלום עבור שירותי הסוכנות" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col space-y-4">
                    <FormField
                      control={settingsForm.control}
                      name="testMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">מצב בדיקה</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              הפעל לבדיקות, כבה לעבודה בפועל
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="autoCapture"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">חיוב אוטומטי</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              חייב מיידית לאחר אישור הכרטיס
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={settingsForm.control}
                      name="isEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">הפעל מערכת תשלומים</FormLabel>
                            <div className="text-sm text-muted-foreground">
                              אפשר עיבוד תשלומים במערכת
                            </div>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={saveSettingsMutation.isPending}>
                    {saveSettingsMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                    שמור הגדרות
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retainers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">רייטנרים</h2>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  רייטנר חדש
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader>
                  <DialogTitle>יצירת רייטנר חדש</DialogTitle>
                  <DialogDescription>
                    הגדר חיוב חוזר עבור לקוח
                  </DialogDescription>
                </DialogHeader>
                <Form {...retainerForm}>
                  <form onSubmit={retainerForm.handleSubmit((data) => createRetainerMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={retainerForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>לקוח</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר לקוח" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(clients as any[] || []).map((client: any) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="frequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>תדירות</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="בחר תדירות" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="monthly">חודשי</SelectItem>
                                <SelectItem value="quarterly">רבעוני</SelectItem>
                                <SelectItem value="yearly">שנתי</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>כותרת</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="רייטנר חודשי" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="amount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>סכום (באגורות)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="500000" 
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>תאריך התחלה</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>תאריך סיום (אופציונלי)</FormLabel>
                            <FormControl>
                              <Input {...field} type="date" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={retainerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תיאור</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="תיאור הרייטנר..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col space-y-4">
                      <FormField
                        control={retainerForm.control}
                        name="autoRenew"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">חידוש אוטומטי</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                חדש את הרייטנר אוטומטית
                              </div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={retainerForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">התראות אימייל</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                שלח התראות על תשלומים
                              </div>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-2 space-x-reverse">
                      <DialogTrigger asChild>
                        <Button variant="outline">ביטול</Button>
                      </DialogTrigger>
                      <Button type="submit" disabled={createRetainerMutation.isPending}>
                        {createRetainerMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        צור רייטנר
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {retainersLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : (retainers as any[] || []).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">אין רייטנרים עדיין</p>
                  <p className="text-sm text-muted-foreground mt-2">צור רייטנר חדש כדי להתחיל</p>
                </CardContent>
              </Card>
            ) : (
              (retainers as any[] || []).map((retainer: any) => (
                <Card key={retainer.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{retainer.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {retainer.client?.name}
                        </div>
                        {retainer.description && (
                          <p className="text-sm text-muted-foreground">{retainer.description}</p>
                        )}
                      </div>
                      <div className="text-left space-y-2">
                        {getStatusBadge(retainer.status)}
                        <div className="text-2xl font-bold">
                          {formatCurrency(retainer.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {retainer.frequency === 'monthly' ? 'חודשי' : 
                           retainer.frequency === 'quarterly' ? 'רבעוני' : 'שנתי'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <h2 className="text-2xl font-bold">תשלומים חד פעמיים</h2>
          
          <div className="grid gap-4">
            {paymentsLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                </CardContent>
              </Card>
            ) : (oneTimePayments as any[] || []).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-32 text-center">
                  <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">אין תשלומים עדיין</p>
                </CardContent>
              </Card>
            ) : (
              (oneTimePayments as any[] || []).map((payment: any) => (
                <Card key={payment.id}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{payment.description || "תשלום"}</h3>
                          {getStatusBadge(payment.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          {payment.client?.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                      <div className="text-left">
                        <div className="text-2xl font-bold">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.currency}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <h2 className="text-2xl font-bold">דוחות תשלומים</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  הכנסות החודש
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">₪0</div>
                <p className="text-sm text-muted-foreground">
                  מתשלומים מוצלחים
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  רייטנרים פעילים
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(retainers as any[] || []).filter((r: any) => r.status === 'active').length || 0}</div>
                <p className="text-sm text-muted-foreground">
                  חיובים חוזרים
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  תשלומים השבוע
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">
                  עסקאות מוצלחות
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}