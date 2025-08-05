
import React from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle,
  Globe,
  Server,
  Shield,
  FileText,
  MessageSquare,
  Eye,
  User
} from 'lucide-react';
import { type Project, type DigitalAsset } from '@shared/schema';

interface ProjectWithAssets extends Project {
  assets?: DigitalAsset[];
}

export default function ClientProjectDetails() {
  const { projectId } = useParams();

  // Mock data - in real app this would come from API
  const project: ProjectWithAssets = {
    id: projectId || '1',
    name: 'אתר הזמנות',
    description: 'פיתוח אתר הזמנות למסעדה עם מערכת ניהול מתקדמת',
    status: 'in_progress',
    type: 'website',
    clientId: 'client-1',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-02-01T15:30:00Z',
    createdBy: 'user-1',
    assets: [
      {
        id: '1',
        name: 'example-restaurant.com',
        type: 'domain',
        value: 'example-restaurant.com',
        provider: 'GoDaddy',
        renewalDate: '2024-12-01T00:00:00Z',
        projectId: projectId || '1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        name: 'שרת אחסון',
        type: 'hosting',
        value: 'Premium Hosting Plan',
        provider: 'AWS',
        renewalDate: '2024-06-01T00:00:00Z',
        projectId: projectId || '1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: '3',
        name: 'SSL Certificate',
        type: 'ssl',
        value: 'Wildcard SSL',
        provider: 'Let\'s Encrypt',
        renewalDate: '2024-04-15T00:00:00Z',
        projectId: projectId || '1',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ]
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'planning':
        return 'תכנון';
      case 'in_progress':
        return 'בתהליך';
      case 'completed':
        return 'הושלם';
      default:
        return status;
    }
  };

  const getProgress = (status: string) => {
    switch (status) {
      case 'planning':
        return 15;
      case 'in_progress':
        return 65;
      case 'completed':
        return 100;
      default:
        return 0;
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'domain':
        return Globe;
      case 'hosting':
        return Server;
      case 'ssl':
        return Shield;
      default:
        return FileText;
    }
  };

  const getAssetTypeText = (type: string) => {
    switch (type) {
      case 'domain':
        return 'דומיין';
      case 'hosting':
        return 'אחסון';
      case 'ssl':
        return 'אבטחה';
      default:
        return type;
    }
  };

  const milestones = [
    { 
      id: 1, 
      title: 'תכנון וסקיצות', 
      status: 'completed', 
      description: 'עיצוב ממשק המשתמש ותכנון המערכת',
      date: '2024-01-20'
    },
    { 
      id: 2, 
      title: 'פיתוח עמוד הבית', 
      status: 'completed', 
      description: 'בניית עמוד הבית עם תפריט והצגת המסעדה',
      date: '2024-01-30'
    },
    { 
      id: 3, 
      title: 'מערכת הזמנות', 
      status: 'in_progress', 
      description: 'פיתוח מערכת הזמנות והוספה לעגלה',
      date: '2024-02-10'
    },
    { 
      id: 4, 
      title: 'תשלומים ומשלוחים', 
      status: 'pending', 
      description: 'אינטגרציה עם מערכות תשלום ומשלוחים',
      date: '2024-02-20'
    },
    { 
      id: 5, 
      title: 'בדיקות והשקה', 
      status: 'pending', 
      description: 'בדיקות מקיפות והשקת האתר',
      date: '2024-02-28'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => window.history.back()}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                חזרה
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <p className="text-gray-600 mt-1">{project.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                שלח הודעה
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  התקדמות הפרויקט
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">התקדמות כללית</span>
                    <span className="font-semibold">{getProgress(project.status)}%</span>
                  </div>
                  <Progress value={getProgress(project.status)} className="h-3" />
                  <div className="text-sm text-gray-600">
                    הפרויקט מתקדם בהתאם לתכנון. השלב הנוכחי: {getStatusText(project.status)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  שלבי הפרויקט
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-start gap-4 p-4 rounded-lg border">
                      <div className="relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          milestone.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : milestone.status === 'in_progress'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {milestone.status === 'completed' ? '✓' : index + 1}
                        </div>
                        {index < milestones.length - 1 && (
                          <div className="absolute top-8 left-1/2 w-0.5 h-8 bg-gray-200 transform -translate-x-1/2" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{milestone.title}</h4>
                          <Badge variant={
                            milestone.status === 'completed' ? 'default' :
                            milestone.status === 'in_progress' ? 'secondary' : 'outline'
                          }>
                            {milestone.status === 'completed' ? 'הושלם' :
                             milestone.status === 'in_progress' ? 'בתהליך' : 'ממתין'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(milestone.date).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Digital Assets */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  הנכסים הדיגיטליים שלך
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {project.assets?.map((asset) => {
                    const IconComponent = getAssetIcon(asset.type);
                    const isExpiringSoon = asset.renewalDate && 
                      new Date(asset.renewalDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    
                    return (
                      <div key={asset.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{asset.name}</h4>
                            <Badge variant="outline">{getAssetTypeText(asset.type)}</Badge>
                            {isExpiringSoon && (
                              <Badge variant="destructive" className="text-xs">
                                פג בקרוב
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{asset.value}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>ספק: {asset.provider}</span>
                            {asset.renewalDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                חידוש: {new Date(asset.renewalDate).toLocaleDateString('he-IL')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>פרטי הפרויקט</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">סוג:</span>
                  <span>אתר אינטרנט</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">תאריך התחלה:</span>
                  <span>{new Date(project.createdAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">עדכון אחרון:</span>
                  <span>{new Date(project.updatedAt).toLocaleDateString('he-IL')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">סטטוס:</span>
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusText(project.status)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>פעולות מהירות</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <MessageSquare className="h-4 w-4 ml-2" />
                  שלח הודעה לצוות
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="h-4 w-4 ml-2" />
                  צפה באתר (תצוגה מקדימה)
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 ml-2" />
                  הורד מסמכים
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle>צור קשר</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  יש לך שאלות או הערות? אנחנו כאן לעזור!
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>מנהל הפרויקט: יוסי כהן</span>
                </div>
                <Button className="w-full" variant="default">
                  <MessageSquare className="h-4 w-4 ml-2" />
                  פתח צ'אט
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
