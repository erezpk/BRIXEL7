import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  Edit, 
  Phone, 
  Mail, 
  Building, 
  User,
  Calendar,
  FileText,
  Folder
} from "lucide-react";
import { type Client, type Project } from "@shared/schema";

export default function ClientDetails() {
  const [, params] = useRoute("/dashboard/clients/:id");
  const clientId = params?.id;

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ['/api/clients', clientId],
    enabled: !!clientId,
  });

  const { data: projects, isLoading: projectsLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
    select: (data) => data?.filter(p => p.clientId === clientId) || [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'פעיל';
      case 'inactive':
        return 'לא פעיל';
      case 'pending':
        return 'ממתין';
      default:
        return status;
    }
  };

  if (clientLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">לקוח לא נמצא</h2>
        <p className="text-gray-600">הלקוח שחיפשת לא קיים במערכת</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="client-details">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-reverse space-x-4">
          <Button variant="ghost" size="sm" className="p-2">
            <ArrowRight className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-rubik">
              {client.name}
            </h1>
            <p className="text-gray-600 mt-1">פרטי לקוח</p>
          </div>
        </div>
        <div className="flex items-center space-x-reverse space-x-3">
          <Badge className={getStatusColor(client.status)}>
            {getStatusText(client.status)}
          </Badge>
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 ml-2" />
            ערוך לקוח
          </Button>
        </div>
      </div>

      {/* Client Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">איש קשר</p>
                <p className="font-semibold">{client.contactName || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">אימייל</p>
                <p className="font-semibold">{client.email || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">טלפון</p>
                <p className="font-semibold">{client.phone || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-reverse space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="h-5 w-5 text-orange-600" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">תחום</p>
                <p className="font-semibold">{client.industry || 'לא צוין'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">פרויקטים</TabsTrigger>
          <TabsTrigger value="notes">הערות</TabsTrigger>
          <TabsTrigger value="history">היסטוריה</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Folder className="h-5 w-5" />
                <span>פרויקטים פעילים</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projectsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-reverse space-x-4 p-4 border rounded-lg">
                      <div className="h-12 w-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !projects || projects.length === 0 ? (
                <div className="text-center py-8">
                  <Folder className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין פרויקטים</h3>
                  <p className="text-gray-600 mb-4">טרם נוצרו פרויקטים עבור לקוח זה</p>
                  <Button>
                    צור פרויקט חדש
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-reverse space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Folder className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="text-right">
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-sm text-gray-600">{project.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Badge variant="outline">{project.status}</Badge>
                        <Button variant="ghost" size="sm">
                          צפה בפרויקט
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <FileText className="h-5 w-5" />
                <span>הערות לקוח</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.notes ? (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-800 whitespace-pre-wrap">{client.notes}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">אין הערות</h3>
                  <p className="text-gray-600 mb-4">טרם נוספו הערות עבור לקוח זה</p>
                  <Button variant="outline">
                    הוסף הערה
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-reverse space-x-2">
                <Calendar className="h-5 w-5" />
                <span>היסטוריית פעילות</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">אין פעילות להצגה</h3>
                <p className="text-gray-600">היסטוריית הפעילות של הלקוח תוצג כאן</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}