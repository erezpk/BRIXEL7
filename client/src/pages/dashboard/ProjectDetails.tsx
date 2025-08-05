
import React from 'react';
import { useParams } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  Clock, 
  DollarSign, 
  FileText, 
  MessageSquare, 
  User,
  Edit,
  Trash2
} from 'lucide-react';

export default function ProjectDetails() {
  const { projectId } = useParams();

  // Mock project data - replace with actual API call
  const project = {
    id: projectId,
    name: "אתר תדמית עבור חברת הייטק",
    description: "פיתוח אתר תדמית מודרני ומותאם לנייד עבור חברת הייטek בתחום הבינה המלאכותית",
    status: "בתהליך",
    client: "חברת AI Solutions",
    startDate: "2024-01-15",
    endDate: "2024-03-15",
    budget: "25,000 ₪",
    progress: 65
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-start">
        <div className="text-right">
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground mt-2">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 ml-2" />
            עריכה
          </Button>
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 ml-2" />
            מחיקה
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סטטוס</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{project.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוח</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.client}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">תקציב</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.budget}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">סקירה כללית</TabsTrigger>
          <TabsTrigger value="tasks">משימות</TabsTrigger>
          <TabsTrigger value="files">קבצים</TabsTrigger>
          <TabsTrigger value="communication">תקשורת</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-right">פרטי הפרויקט</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>תאריך התחלה:</span>
                  <span>{project.startDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>תאריך סיום מתוכנן:</span>
                  <span>{project.endDate}</span>
                </div>
                <div className="flex justify-between">
                  <span>התקדמות:</span>
                  <span>{project.progress}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-right">פעילות אחרונה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="font-medium">עודכן דף הבית</span>
                    <span className="text-muted-foreground block">לפני 2 שעות</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">הועלו תמונות חדשות</span>
                    <span className="text-muted-foreground block">אתמול</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">משימות פרויקט</CardTitle>
              <CardDescription className="text-right">
                רשימת המשימות הפתוחות והמושלמות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">אין משימות להצגה</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">קבצי הפרויקט</CardTitle>
              <CardDescription className="text-right">
                מסמכים וקבצים הקשורים לפרויקט
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">אין קבצים להצגה</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-right">תקשורת עם הלקוח</CardTitle>
              <CardDescription className="text-right">
                הודעות ותכתובות
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground">אין הודעות להצגה</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
