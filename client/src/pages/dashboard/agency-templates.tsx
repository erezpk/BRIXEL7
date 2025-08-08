import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Building, FileText, Upload, Image, Save, ArrowLeft } from "lucide-react";
import { ObjectUploader } from '@/components/ObjectUploader';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

export default function AgencyTemplates() {
  const [, setLocation] = useLocation();
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Agency form state
  const [agencyForm, setAgencyForm] = useState({
    name: "",
    industry: "",
    description: "",
    website: "",
    phone: "",
    email: "",
    address: ""
  });

  // Quote template state
  const [quoteTemplate, setQuoteTemplate] = useState({
    headerText: "הצעת מחיר",
    footerText: "תודה שבחרתם בנו!",
    termsAndConditions: "התשלום יבוצע תוך 30 יום\nהמחירים כוללים מע\"מ",
    bankDetails: "",
    companySlogan: ""
  });

  // Get current agency details
  const { data: agency } = useQuery({
    queryKey: ['/api/agencies/current'],
    queryFn: async () => {
      const response = await fetch('/api/agencies/current', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch agency');
      return response.json();
    }
  });

  // Set agency data when loaded
  useEffect(() => {
    if (agency) {
      setAgencyForm({
        name: agency.name || "",
        industry: agency.industry || "",
        description: agency.description || "",
        website: agency.website || "",
        phone: agency.phone || "",
        email: agency.email || "",
        address: agency.address || ""
      });
      
      if (agency.logo) {
        setAgencyLogo(agency.logo);
      }

      if (agency.quoteTemplate) {
        setQuoteTemplate({
          headerText: agency.quoteTemplate.headerText || "הצעת מחיר",
          footerText: agency.quoteTemplate.footerText || "תודה שבחרתם בנו!",
          termsAndConditions: agency.quoteTemplate.termsAndConditions || "התשלום יבוצע תוך 30 יום\nהמחירים כוללים מע\"מ",
          bankDetails: agency.quoteTemplate.bankDetails || "",
          companySlogan: agency.quoteTemplate.companySlogan || ""
        });
      }
    }
  }, [agency]);

  // Update agency mutation
  const updateAgencyMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("/api/agencies/current", "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "פרטי הסוכנות עודכנו במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בשמירת הגדרות",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  const handleSaveAgency = () => {
    updateAgencyMutation.mutate({
      ...agencyForm,
      logo: agencyLogo,
    });
  };

  const handleSaveQuoteTemplate = () => {
    updateAgencyMutation.mutate({
      quoteTemplate
    });
  };

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          onClick={() => setLocation('/dashboard/settings')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          חזור להגדרות
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">הגדרות סוכנות וטמפלטים</h1>
          <p className="text-muted-foreground">
            נהל את פרטי הסוכנות שלך וערוך טמפלטים להצעות מחיר
          </p>
        </div>
      </div>

      <Tabs defaultValue="agency" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agency" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            פרטי סוכנות
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            טמפלטים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                פרטי הסוכנות
              </CardTitle>
              <CardDescription>
                עדכן את המידע הבסיסי של הסוכנות שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">שם הסוכנות *</Label>
                  <Input
                    id="name"
                    value={agencyForm.name}
                    onChange={(e) => setAgencyForm({ ...agencyForm, name: e.target.value })}
                    placeholder="הכנס את שם הסוכנות"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">תחום עיסוק</Label>
                  <Select
                    value={agencyForm.industry}
                    onValueChange={(value) => setAgencyForm({ ...agencyForm, industry: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="בחר תחום עיסוק" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="digital_marketing">שיווק דיגיטלי</SelectItem>
                      <SelectItem value="web_development">פיתוח אתרים</SelectItem>
                      <SelectItem value="video_production">הפקת וידאו</SelectItem>
                      <SelectItem value="graphic_design">עיצוב גרפי</SelectItem>
                      <SelectItem value="advertising">פרסום</SelectItem>
                      <SelectItem value="consulting">ייעוץ</SelectItem>
                      <SelectItem value="other">אחר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">אתר אינטרנט</Label>
                  <Input
                    id="website"
                    value={agencyForm.website}
                    onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">אימייל</Label>
                  <Input
                    id="email"
                    type="email"
                    value={agencyForm.email}
                    onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                    placeholder="info@agency.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">טלפון</Label>
                  <Input
                    id="phone"
                    value={agencyForm.phone}
                    onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    placeholder="050-1234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">תיאור הסוכנות</Label>
                <Textarea
                  id="description"
                  value={agencyForm.description}
                  onChange={(e) => setAgencyForm({ ...agencyForm, description: e.target.value })}
                  placeholder="תאר את הסוכנות שלך, השירותים שאתם מעניקים והחזון שלכם"
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">כתובת</Label>
                <Textarea
                  id="address"
                  value={agencyForm.address}
                  onChange={(e) => setAgencyForm({ ...agencyForm, address: e.target.value })}
                  placeholder="רחוב הרצל 1, תל אביב"
                  rows={2}
                />
              </div>

              <div className="space-y-4">
                <Label>לוגו הסוכנות</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  {agencyLogo ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <img src={agencyLogo} alt="לוגו סוכנות" className="h-16 w-16 object-contain rounded-md border" />
                        <div>
                          <p className="text-sm font-medium">לוגו הועלה בהצלחה</p>
                          <p className="text-xs text-muted-foreground">ניתן להחליף בהעלאת קובץ חדש</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setAgencyLogo(null)}>
                        הסר
                      </Button>
                    </div>
                  ) : (
                    <ObjectUploader
                      onUpload={(url) => setAgencyLogo(url)}
                      accept="image/*"
                      maxFiles={1}
                    >
                      <div className="text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">העלה לוגו של הסוכנות</p>
                        <p className="text-xs text-gray-400">PNG, JPG עד 2MB</p>
                      </div>
                    </ObjectUploader>
                  )}
                </div>
              </div>

              <Button onClick={handleSaveAgency} disabled={updateAgencyMutation.isPending} className="w-full">
                <Save className="h-4 w-4 me-2" />
                {updateAgencyMutation.isPending ? "שומר..." : "שמור פרטי סוכנות"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                טמפלט הצעות מחיר
              </CardTitle>
              <CardDescription>
                התאם אישית את תצוגת הצעות המחיר שלך
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="headerText">כותרת ראשית</Label>
                  <Input
                    id="headerText"
                    value={quoteTemplate.headerText}
                    onChange={(e) => setQuoteTemplate({ ...quoteTemplate, headerText: e.target.value })}
                    placeholder="הצעת מחיר"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySlogan">סלוגן החברה</Label>
                  <Input
                    id="companySlogan"
                    value={quoteTemplate.companySlogan}
                    onChange={(e) => setQuoteTemplate({ ...quoteTemplate, companySlogan: e.target.value })}
                    placeholder="הסלוגן שלכם"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="footerText">טקסט תחתון</Label>
                <Textarea
                  id="footerText"
                  value={quoteTemplate.footerText}
                  onChange={(e) => setQuoteTemplate({ ...quoteTemplate, footerText: e.target.value })}
                  placeholder="תודה שבחרתם בנו! אנו מצפים לעבוד איתכם"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="termsAndConditions">תנאים והוראות</Label>
                <Textarea
                  id="termsAndConditions"
                  value={quoteTemplate.termsAndConditions}
                  onChange={(e) => setQuoteTemplate({ ...quoteTemplate, termsAndConditions: e.target.value })}
                  placeholder="התשלום יבוצע תוך 30 יום&#10;המחירים כוללים מע&quot;מ&#10;תוקף ההצעה: 30 יום"
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bankDetails">פרטי חשבון בנק</Label>
                <Textarea
                  id="bankDetails"
                  value={quoteTemplate.bankDetails}
                  onChange={(e) => setQuoteTemplate({ ...quoteTemplate, bankDetails: e.target.value })}
                  placeholder="בנק: בנק הפועלים&#10;סניף: 123&#10;חשבון: 456789&#10;ע&quot;ר: 123456789"
                  rows={4}
                />
              </div>

              <Button onClick={handleSaveQuoteTemplate} disabled={updateAgencyMutation.isPending} className="w-full">
                <Save className="h-4 w-4 me-2" />
                {updateAgencyMutation.isPending ? "שומר..." : "שמור טמפלט"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}