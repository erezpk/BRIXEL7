import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { 
  BarChart3, 
  Users, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar, 
  TrendingUp, 
  Clock,
  Download,
  Filter,
  User,
  Building2
} from "lucide-react";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";

export default function ReportsPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  // Fetch communication statistics
  const { data: commStats, isLoading: commLoading } = useQuery({
    queryKey: ["/api/communications/stats", date],
    queryFn: () => {
      const params = new URLSearchParams();
      if (date?.from) params.append("from", date.from.toISOString());
      if (date?.to) params.append("to", date.to.toISOString());
      return fetch(`/api/communications/stats?${params}`).then(r => r.json());
    },
  });

  // Mock team performance data (to be replaced with real data)
  const teamPerformance = [
    { name: "דניאל כהן", calls: 45, emails: 23, meetings: 12, total: 80 },
    { name: "רונית לוי", calls: 38, emails: 31, meetings: 8, total: 77 },
    { name: "משה אברהם", calls: 29, emails: 19, meetings: 15, total: 63 },
    { name: "שרה פרץ", calls: 25, emails: 27, meetings: 6, total: 58 },
  ];

  const communicationTypeIcons: Record<string, any> = {
    phone_call: Phone,
    email: Mail,
    whatsapp: MessageCircle,
    sms: MessageCircle,
    meeting: Calendar,
    summary: BarChart3,
  };

  const getCommunicationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      phone_call: "שיחות טלפון",
      email: "אימיילים",
      whatsapp: "וואטסאפ",
      sms: "SMS",
      meeting: "פגישות",
      summary: "סיכומים",
    };
    return labels[type] || type;
  };

  const exportData = () => {
    // Implementation for exporting reports
    console.log("Exporting data...");
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">דוחות וסטטיסטיקות</h1>
          <p className="text-muted-foreground">מעקב אחר ביצועי הצוות ופעילות תקשורת</p>
        </div>

        <div className="flex items-center gap-2">
          <DatePickerWithRange date={date} setDate={setDate} />
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 ml-2" />
            ייצוא נתונים
          </Button>
        </div>
      </div>

      <Tabs defaultValue="communication" className="w-full">
        <TabsList>
          <TabsTrigger value="communication">תקשורת</TabsTrigger>
          <TabsTrigger value="team">ביצועי צוות</TabsTrigger>
          <TabsTrigger value="clients">לקוחות ולידים</TabsTrigger>
        </TabsList>

        <TabsContent value="communication" className="space-y-6">
          {/* Communication Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">שיחות</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byType?.filter((s: any) => s.type === 'phone_call').reduce((sum: number, s: any) => sum + s.count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">אימיילים</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byType?.filter((s: any) => s.type === 'email').reduce((sum: number, s: any) => sum + s.count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">פגישות</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byType?.filter((s: any) => s.type === 'meeting').reduce((sum: number, s: any) => sum + s.count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">הודעות</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byType?.filter((s: any) => ['whatsapp', 'sms'].includes(s.type)).reduce((sum: number, s: any) => sum + s.count, 0) || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication by Type */}
          <Card>
            <CardHeader>
              <CardTitle>פירוט לפי סוג תקשורת</CardTitle>
              <CardDescription>התפלגות פעילות התקשורת</CardDescription>
            </CardHeader>
            <CardContent>
              {commLoading ? (
                <div className="text-center py-8">טוען נתונים...</div>
              ) : (
                <div className="space-y-4">
                  {commStats?.byType?.map((item: any) => {
                    const Icon = communicationTypeIcons[item.type] || MessageCircle;
                    return (
                      <div key={`${item.type}-${item.createdBy}`} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <h4 className="font-medium">{getCommunicationTypeLabel(item.type)}</h4>
                            <p className="text-sm text-muted-foreground">על ידי: {item.createdByName}</p>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className="font-bold">{item.count}</p>
                          {item.totalDuration && (
                            <p className="text-sm text-muted-foreground">{item.totalDuration} דקות</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lead vs Client Communication */}
          <Card>
            <CardHeader>
              <CardTitle>תקשורת לפי סוג איש קשר</CardTitle>
              <CardDescription>התפלגות בין לידים ולקוחות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {commStats?.byContact?.map((item: any) => (
                  <div key={item.contactType} className="p-4 border rounded-lg text-center">
                    <h3 className="font-semibold text-lg">{item.contactType === 'lead' ? 'לידים' : 'לקוחות'}</h3>
                    <p className="text-3xl font-bold text-blue-600">{item.count}</p>
                    <p className="text-sm text-muted-foreground">תקשרויות</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-6">
          {/* Team Performance */}
          <Card>
            <CardHeader>
              <CardTitle>ביצועי חברי הצוות</CardTitle>
              <CardDescription>מעקב אחר פעילות חברי הצוות בתקופה שנבחרה</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamPerformance.map((member, index) => (
                  <div key={member.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-medium">{member.name}</h4>
                        <p className="text-sm text-muted-foreground">חבר צוות</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-blue-600">{member.calls}</p>
                        <p className="text-muted-foreground">שיחות</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{member.emails}</p>
                        <p className="text-muted-foreground">אימיילים</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-purple-600">{member.meetings}</p>
                        <p className="text-muted-foreground">פגישות</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-lg">{member.total}</p>
                        <p className="text-muted-foreground">סה״כ</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Team Ranking */}
          <Card>
            <CardHeader>
              <CardTitle>דירוג חברי הצוות</CardTitle>
              <CardDescription>המובילים בפעילות תקשורת</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teamPerformance
                  .sort((a, b) => b.total - a.total)
                  .map((member, index) => (
                    <div key={member.name} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-600' : 'bg-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.total} פעילויות</p>
                      </div>
                      {index < 3 && (
                        <TrendingUp className={`h-5 w-5 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 'text-amber-600'
                        }`} />
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          {/* Client Communication Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">לידים פעילים</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byContact?.find((s: any) => s.contactType === 'lead')?.count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">לקוחות פעילים</p>
                    <p className="text-2xl font-bold">
                      {commStats?.byContact?.find((s: any) => s.contactType === 'client')?.count || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Clock className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">זמן תגובה ממוצע</p>
                    <p className="text-2xl font-bold">2.5 שעות</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Communication Insights */}
          <Card>
            <CardHeader>
              <CardTitle>תובנות תקשורת</CardTitle>
              <CardDescription>ניתוח דפוסי תקשורת ומגמות</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900">💡 תובנה מרכזית</h4>
                  <p className="text-blue-800 mt-1">
                    הפעילות הגבוהה ביותר היא ביום שלישי בין השעות 10:00-12:00. 
                    כדאי לתכנן פגישות חשובות בזמנים אלו.
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-green-900">📈 מגמה חיובית</h4>
                  <p className="text-green-800 mt-1">
                    עלייה של 23% בפגישות עם לקוחות לעומת החודש הקודם. 
                    המגמה מעידה על שיפור ביחסי הלקוחות.
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-semibold text-orange-900">⚠️ נקודה לשיפור</h4>
                  <p className="text-orange-800 mt-1">
                    זמן התגובה לאימיילים גדל ל-4.2 שעות. 
                    כדאי לשפר את זמני המענה לשיפור חווית הלקוח.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}