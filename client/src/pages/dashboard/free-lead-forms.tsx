import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Eye, 
  Share2, 
  Code, 
  ExternalLink,
  Globe,
  Users,
  Settings,
  BarChart3,
  Mail,
  Phone,
  MessageCircle,
  FileText,
  Calendar,
  Copy,
  CheckCircle
} from "lucide-react";

// אלטרנטיבות חינמיות לאיסוף לידים
const FREE_LEAD_PROVIDERS = [
  {
    name: "Google Forms",
    url: "https://forms.google.com",
    description: "טפסים חינמיים מ-Google",
    features: ["חינם לחלוטין", "קל לשימוש", "השתלבות עם Gmail", "דוחות אוטומטיים"],
    limitations: ["עיצוב מוגבל", "ללא אוטומציה מתקדמת"]
  },
  {
    name: "Microsoft Forms",
    url: "https://forms.microsoft.com",
    description: "טפסים חינמיים מ-Microsoft",
    features: ["חינם עם חשבון Microsoft", "עיצוב יפה", "אנליטיקס מובנה"],
    limitations: ["מוגבל ל-200 תגובות/חודש", "נדרש חשבון Microsoft"]
  },
  {
    name: "Jotform",
    url: "https://www.jotform.com",
    description: "בוני טפסים עם תוכנית חינמית",
    features: ["100 הגשות/חודש", "תבניות מוכנות", "השתלבויות"],
    limitations: ["מוגבל ל-5 טפסים", "לוגו של Jotform"]
  },
  {
    name: "Typeform",
    url: "https://www.typeform.com",
    description: "טפסים אינטראקטיביים ויפים",
    features: ["עיצוב מודרני", "חוויית משתמש מעולה", "לוגיקה של שאלות"],
    limitations: ["מוגבל ל-10 שאלות", "100 תגובות/חודש"]
  },
  {
    name: "Tally",
    url: "https://tally.so",
    description: "טפסים חינמיים ללא הגבלה",
    features: ["טפסים ללא הגבלה", "תגובות ללא הגבלה", "עיצוב מתקדם"],
    limitations: ["תכונות מתקדמות בתשלום"]
  }
];

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "שם הטופס נדרש"),
  title: z.string().min(1, "כותרת נדרשת"),
  description: z.string().optional(),
  fields: z.array(z.object({
    type: z.string(),
    label: z.string(),
    required: z.boolean(),
    options: z.array(z.string()).optional(),
  })),
  redirectUrl: z.string().url().optional().or(z.literal("")),
});

const FIELD_TYPES = [
  { value: "text", label: "טקסט", icon: FileText },
  { value: "email", label: "מייל", icon: Mail },
  { value: "phone", label: "טלפון", icon: Phone },
  { value: "textarea", label: "טקסט ארוך", icon: MessageCircle },
  { value: "select", label: "בחירה", icon: Settings },
  { value: "date", label: "תאריך", icon: Calendar },
];

export default function FreeLeadFormsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Queries
  const { data: forms, isLoading } = useQuery({
    queryKey: ["/api/lead-forms"],
  });

  // Mutations
  const createFormMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/lead-forms", data);
    },
    onSuccess: () => {
      toast({
        title: "טופס נוצר בהצלחה",
        description: "הטופס החדש זמין עכשיו לשימוש",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/lead-forms"] });
    },
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      fields: [
        { type: "text", label: "שם מלא", required: true },
        { type: "email", label: "מייל", required: true },
        { type: "phone", label: "טלפון", required: false },
      ],
      redirectUrl: "",
    },
  });

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
    toast({
      title: "הועתק ללוח",
      description: "הקוד הועתק בהצלחה",
    });
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">איסוף לידים חינמי</h1>
        <p className="text-muted-foreground mt-2">
          בנה טפסים לאיסוף פרטי לקוחות בחינם, ללא עלויות נוספות
        </p>
      </div>

      {/* Free Providers Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-green-600" />
            שירותים חינמיים מומלצים
          </CardTitle>
          <CardDescription>
            פתרונות חינמיים לאיסוף פרטי לקוחות - אלטרנטיבה מעולה לפייפאל
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FREE_LEAD_PROVIDERS.map((provider) => (
              <Card key={provider.name} className="border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{provider.name}</CardTitle>
                    <Badge variant="secondary" className="text-green-600">
                      חינם
                    </Badge>
                  </div>
                  <CardDescription className="text-sm">
                    {provider.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-green-600">יתרונות:</h4>
                    <ul className="text-sm space-y-1">
                      {provider.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-orange-600">מגבלות:</h4>
                    <ul className="text-sm space-y-1">
                      {provider.limitations.map((limitation, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <span className="w-1 h-1 bg-orange-400 rounded-full mt-2 flex-shrink-0" />
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => window.open(provider.url, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 ml-2" />
                    התחל עכשיו
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">💡 טיפ מקצועי</h3>
            <p className="text-blue-800 text-sm">
              כל השירותים האלה מאפשרים לך לאסוף פרטי לקוחות בחינם ולייצא אותם ל-Excel או להתממשק עם ה-CRM שלך. 
              <strong> Google Forms ו-Tally</strong> הם הכי מומלצים למתחילים.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Built-in Form Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            בוני טפסים מובנה
          </CardTitle>
          <CardDescription>
            צור טפסים מותאמים אישית ישירות במערכת ה-CRM
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Builder */}
            <div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full mb-4">
                    <Plus className="w-4 h-4 ml-2" />
                    צור טופס חדש
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl" dir="rtl">
                  <DialogHeader>
                    <DialogTitle>צור טופס איסוף לידים</DialogTitle>
                    <DialogDescription>
                      בנה טופס מותאם אישית לאיסוף פרטי לקוחות
                    </DialogDescription>
                  </DialogHeader>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit((data) => createFormMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם הטופס</FormLabel>
                            <FormControl>
                              <Input placeholder="טופס יצירת קשר" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>כותרת הטופס</FormLabel>
                            <FormControl>
                              <Input placeholder="צור איתנו קשר" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>תיאור (אופציונלי)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="נשמח לשמוע מכם ולתת הצעת מחיר" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="redirectUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>כתובת הפניה לאחר שליחה (אופציונלי)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/thanks" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={createFormMutation.isPending}>
                          {createFormMutation.isPending ? "יוצר..." : "צור טופס"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              {/* Existing Forms */}
              {forms && forms.length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">הטפסים שלי</h3>
                  {forms.map((formItem: any) => (
                    <Card key={formItem.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{formItem.title}</h4>
                          <p className="text-sm text-muted-foreground">{formItem.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {formItem.submissionCount || 0} הגשות
                            </span>
                            <Badge variant={formItem.isActive ? "default" : "secondary"}>
                              {formItem.isActive ? "פעיל" : "לא פעיל"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <BarChart3 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Integration Guide */}
            <div className="space-y-4">
              <h3 className="font-medium">איך להטמיע בקלות</h3>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">🔗 קישור ישיר</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  שתף קישור לטופס ברשתות החברתיות או בחתימת המייל
                </p>
                <div className="flex gap-2">
                  <Input value="https://yourcrm.com/form/abc123" readOnly className="text-sm" />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard("https://yourcrm.com/form/abc123", "link")}>
                    {copiedCode === "link" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">📝 קוד הטמעה</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  הטמע הטופס ישירות באתר שלך
                </p>
                <div className="flex gap-2">
                  <Input 
                    value='<iframe src="https://yourcrm.com/embed/abc123" width="400" height="500"></iframe>' 
                    readOnly 
                    className="text-sm font-mono" 
                  />
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard('<iframe src="https://yourcrm.com/embed/abc123" width="400" height="500"></iframe>', "embed")}>
                    {copiedCode === "embed" ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 bg-green-50 border-green-200">
                <h4 className="font-medium text-green-900 mb-2">✅ יתרונות הפתרון שלנו</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• חינם לחלוטין ללא הגבלות</li>
                  <li>• השתלבות ישירה עם ה-CRM</li>
                  <li>• עיצוב מותאם למותג שלך</li>
                  <li>• אוטומציה וניהול לידים מתקדם</li>
                  <li>• דוחות ואנליטיקס מפורטים</li>
                </ul>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}