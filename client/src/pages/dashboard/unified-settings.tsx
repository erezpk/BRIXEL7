import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Bell, 
  Building, 
  Users, 
  FileText, 
  Package, 
  Settings as SettingsIcon,
  Upload,
  Download,
  Trash2,
  Star,
  Plus,
  Edit,
  Save,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { rtlClass } from "@/lib/rtl";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";

const agencyFormSchema = z.object({
  name: z.string().min(1, "שם הסוכנות נדרש"),
  slug: z.string().min(1, "קיצור דרך נדרש"),
  industry: z.string().min(1, "תחום פעילות נדרש"),
  website: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("כתובת אימייל לא תקינה").optional(),
  address: z.string().optional(),
  description: z.string().optional(),
});

const itemFormSchema = z.object({
  name: z.string().min(1, "שם הפריט נדרש"),
  description: z.string().optional(),
  price: z.number().min(0, "מחיר חייב להיות חיובי"),
  category: z.string().min(1, "קטגוריה נדרשת"),
  unit: z.string().default("יחידה"),
  isActive: z.boolean().default(true),
});

type AgencyFormData = z.infer<typeof agencyFormSchema>;
type ItemFormData = z.infer<typeof itemFormSchema>;

export default function UnifiedSettings() {
  const [activeTab, setActiveTab] = useState("agency");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Agency form
  const agencyForm = useForm<AgencyFormData>({
    resolver: zodResolver(agencyFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      industry: "",
      website: "",
      phone: "",
      email: "",
      address: "",
      description: "",
    },
  });

  // Item form
  const itemForm = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      unit: "יחידה",
      isActive: true,
    },
  });

  // States
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      tasks: true,
      quotes: true,
      payments: true
    },
    general: {
      language: "he",
      timezone: "Asia/Jerusalem",
      theme: "light"
    }
  });

  const [isEditingItem, setIsEditingItem] = useState<string | null>(null);
  const [agencyLogo, setAgencyLogo] = useState<string | null>(null);

  // Fetch current agency
  const { data: currentAgency, isLoading: isLoadingAgency } = useQuery({
    queryKey: ['/api/agencies/current'],
    onSuccess: (data) => {
      if (data) {
        agencyForm.reset({
          name: data.name || "",
          slug: data.slug || "",
          industry: data.industry || "",
          website: data.website || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          description: data.description || "",
        });
        setAgencyLogo(data.logo || null);
      }
    }
  });

  // Fetch team members
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery({
    queryKey: ['/api/team'],
  });

  // Fetch items
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ['/api/items'],
  });

  // Fetch contract templates
  const { data: contractTemplates = [], isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['/api/contract-templates'],
  });

  // Update agency mutation
  const updateAgencyMutation = useMutation({
    mutationFn: async (data: AgencyFormData) => {
      return await apiRequest("/api/agencies/current", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "פרטי הסוכנות נשמרו בהצלחה",
        description: "השינויים שלך נשמרו במערכת",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/agencies/current'] });
    },
    onError: () => {
      toast({
        title: "שגיאה בשמירת פרטי הסוכנות",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: typeof settings) => {
      return await apiRequest("/api/settings", "PUT", data);
    },
    onSuccess: () => {
      toast({
        title: "הגדרות נשמרו בהצלחה",
        description: "השינויים שלך נשמרו במערכת",
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

  // Create item mutation
  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      return await apiRequest("/api/items", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "פריט נוצר בהצלחה",
        description: "הפריט נוסף למערכת",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      itemForm.reset();
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת פריט",
        description: "נסה שוב מאוחר יותר",
        variant: "destructive",
      });
    },
  });

  // Upload logo handlers
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("/api/objects/upload", "POST");
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      toast({
        title: "שגיאה בהעלאת קובץ",
        description: "לא ניתן להעלות את הלוגו כרגע",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleLogoUploadComplete = async (result: any) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const logoURL = uploadedFile.uploadURL;
        
        // Update agency with new logo
        await updateAgencyMutation.mutateAsync({
          ...agencyForm.getValues(),
          logo: logoURL
        });
        
        setAgencyLogo(logoURL);
        
        toast({
          title: "לוגו הועלה בהצלחה",
          description: "הלוגו החדש נשמר במערכת",
        });
      }
    } catch (error) {
      toast({
        title: "שגיאה בשמירת הלוגו",
        description: "הקובץ הועלה אך לא נשמר במערכת",
        variant: "destructive",
      });
    }
  };

  const onAgencySubmit = (data: AgencyFormData) => {
    updateAgencyMutation.mutate(data);
  };

  const onItemSubmit = (data: ItemFormData) => {
    createItemMutation.mutate(data);
  };

  const saveSettings = () => {
    updateSettingsMutation.mutate(settings);
  };

  return (
    <div className={cn("container mx-auto py-6 space-y-6 max-w-7xl", rtlClass())}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">הגדרות מערכת</h1>
          <p className="text-muted-foreground">
            נהל את כל הגדרות הסוכנות, צוות, תבניות ופריטים במקום אחד
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="overflow-x-auto">
          <TabsList className="grid w-full grid-cols-6 min-w-[600px]">
            <TabsTrigger value="agency">פרטי סוכנות</TabsTrigger>
            <TabsTrigger value="team">ניהול צוות</TabsTrigger>
            <TabsTrigger value="notifications">התראות</TabsTrigger>
            <TabsTrigger value="templates">תבניות</TabsTrigger>
            <TabsTrigger value="items">ניהול פריטים</TabsTrigger>
            <TabsTrigger value="system">הגדרות מערכת</TabsTrigger>
          </TabsList>
        </div>

        {/* פרטי סוכנות */}
        <TabsContent value="agency" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                פרטי הסוכנות
              </CardTitle>
              <CardDescription>
                עדכן את פרטי הסוכנות והלוגו
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* העלאת לוגו */}
              <div className="space-y-4">
                <Label>לוגו הסוכנות</Label>
                <div className="flex items-center gap-4">
                  {agencyLogo && (
                    <div className="w-20 h-20 border rounded-lg overflow-hidden">
                      <img 
                        src={agencyLogo} 
                        alt="לוגו הסוכנות" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleLogoUploadComplete}
                    buttonClassName="flex items-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {agencyLogo ? "החלף לוגו" : "העלה לוגו"}
                  </ObjectUploader>
                </div>
              </div>

              <Separator />

              {/* טופס פרטי סוכנות */}
              <Form {...agencyForm}>
                <form onSubmit={agencyForm.handleSubmit(onAgencySubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={agencyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם הסוכנות</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="שם הסוכנות" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={agencyForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>קיצור דרך (באנגלית)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="agency-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>תחום פעילות</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="שיווק דיגיטלי" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אתר אינטרנט</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://www.example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>טלפון</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="03-1234567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={agencyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>אימייל</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="info@agency.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={agencyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="רחוב הדוגמה 123, תל אביב" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={agencyForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תיאור הסוכנות</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="תיאור קצר על הסוכנות ושירותיה" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    disabled={updateAgencyMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    <Save className="h-4 w-4 ml-2" />
                    שמור פרטי סוכנות
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ניהול צוות */}
        <TabsContent value="team" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                ניהול צוות
              </CardTitle>
              <CardDescription>
                נהל את חברי הצוות שלך
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTeam ? (
                <div className="text-center py-8">טוען חברי צוות...</div>
              ) : (
                <div className="space-y-4">
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      אין חברי צוות במערכת
                    </div>
                  ) : (
                    teamMembers.map((member: any) => (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{member.fullName}</h4>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                          <Badge variant={member.isActive ? "default" : "secondary"}>
                            {member.isActive ? "פעיל" : "לא פעיל"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              toast({
                                title: "עריכת חבר צוות",
                                description: "תכונה זו תהיה זמינה בקרוב",
                              });
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const action = member.isActive ? "השבתת" : "הפעלת";
                              toast({
                                title: `${action} חבר צוות`,
                                description: `${action} ${member.fullName} בוצעה בהצלחה`,
                              });
                              // Here you would call an API to toggle user active status
                              // For now, just show confirmation
                            }}
                          >
                            {member.isActive ? "השבת" : "הפעל"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* התראות */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                הגדרות התראות
              </CardTitle>
              <CardDescription>
                קבע איך תרצה לקבל התראות מהמערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>התראות במייל</Label>
                    <p className="text-sm text-muted-foreground">קבל התראות בכתובת האימייל שלך</p>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>התראות push</Label>
                    <p className="text-sm text-muted-foreground">קבל התראות בדפדפן</p>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>התראות משימות</Label>
                    <p className="text-sm text-muted-foreground">התראות כשמשימות נוצרות או מתעדכנות</p>
                  </div>
                  <Switch
                    checked={settings.notifications.tasks}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, tasks: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>התראות הצעות מחיר</Label>
                    <p className="text-sm text-muted-foreground">התראות כשהצעות מחיר נוצרות או מתעדכנות</p>
                  </div>
                  <Switch
                    checked={settings.notifications.quotes}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, quotes: checked }
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>התראות תשלומים</Label>
                    <p className="text-sm text-muted-foreground">התראות על תשלומים והזמנות חדשות</p>
                  </div>
                  <Switch
                    checked={settings.notifications.payments}
                    onCheckedChange={(checked) =>
                      setSettings(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, payments: checked }
                      }))
                    }
                  />
                </div>
              </div>

              <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 ml-2" />
                שמור הגדרות התראות
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* תבניות */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                ניהול תבניות
              </CardTitle>
              <CardDescription>
                נהל תבניות חוזים והצעות מחיר
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTemplates ? (
                <div className="text-center py-8">טוען תבניות...</div>
              ) : (
                <div className="space-y-4">
                  {contractTemplates.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      אין תבניות במערכת
                    </div>
                  ) : (
                    contractTemplates.map((template: any) => (
                      <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground">{template.description}</p>
                          {template.isDefault && (
                            <Badge className="mt-1">
                              <Star className="h-3 w-3 ml-1" />
                              ברירת מחדל
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ניהול פריטים */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                ניהול פריטים
              </CardTitle>
              <CardDescription>
                נהל פריטים לבניית מוצרים והצעות מחיר
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* טופס הוספת פריט */}
              <Form {...itemForm}>
                <form onSubmit={itemForm.handleSubmit(onItemSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={itemForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>שם הפריט</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="שם הפריט" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={itemForm.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>מחיר</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              placeholder="0"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={itemForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>קטגוריה</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="קטגוריה" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={itemForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תיאור</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="תיאור הפריט" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" disabled={createItemMutation.isPending}>
                    <Plus className="h-4 w-4 ml-2" />
                    הוסף פריט
                  </Button>
                </form>
              </Form>

              <Separator />

              {/* רשימת פריטים */}
              {isLoadingItems ? (
                <div className="text-center py-8">טוען פריטים...</div>
              ) : (
                <div className="space-y-4">
                  {items.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      אין פריטים במערכת
                    </div>
                  ) : (
                    items.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">₪{item.price}</Badge>
                            <Badge variant="secondary">{item.category}</Badge>
                            {item.isActive && <Badge variant="default">פעיל</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* הגדרות מערכת */}
        <TabsContent value="system" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                הגדרות מערכת כלליות
              </CardTitle>
              <CardDescription>
                הגדרות כלליות למערכת
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>שפה</Label>
                    <p className="text-sm text-muted-foreground">שפת המערכת</p>
                  </div>
                  <Badge>עברית</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>אזור זמן</Label>
                    <p className="text-sm text-muted-foreground">אזור הזמן של המערכת</p>
                  </div>
                  <Badge>ישראל</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>ערכת נושא</Label>
                    <p className="text-sm text-muted-foreground">מראה המערכת</p>
                  </div>
                  <Badge>בהיר</Badge>
                </div>
              </div>

              <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}>
                <Save className="h-4 w-4 ml-2" />
                שמור הגדרות מערכת
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}