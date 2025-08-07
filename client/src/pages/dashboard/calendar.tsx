import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, ExternalLink, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle } from "@/lib/google-oauth";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  type: 'meeting' | 'task' | 'deadline' | 'reminder';
  priority: 'low' | 'medium' | 'high';
}

const eventTypes = [
  { value: "meeting", label: "פגישה", color: "bg-blue-500" },
  { value: "task", label: "משימה", color: "bg-green-500" },
  { value: "deadline", label: "דדליין", color: "bg-red-500" },
  { value: "reminder", label: "תזכורת", color: "bg-yellow-500" },
];

const priorityOptions = [
  { value: "low", label: "נמוכה", color: "text-green-600" },
  { value: "medium", label: "בינונית", color: "text-yellow-600" },
  { value: "high", label: "גבוהה", color: "text-red-600" },
];

export default function Calendar() {
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleCalendarConnected, setGoogleCalendarConnected] = useState(false);
  const { toast } = useToast();

  // Mock events for now - will be replaced with real data
  const events: CalendarEvent[] = [
    {
      id: "1",
      title: "פגישה עם לקוח חדש",
      description: "ייעוץ ראשוני עבור פרויקט אתר חדש",
      startTime: "2025-01-06T10:00:00Z",
      endTime: "2025-01-06T11:00:00Z",
      location: "משרד הסוכנות",
      attendees: ["john@agency.com", "client@example.com"],
      type: "meeting",
      priority: "high"
    },
    {
      id: "2",
      title: "סיום פרויקט אתר XYZ",
      description: "דדליין לסיום הפיתוח והעלאה לסביבת הייצור",
      startTime: "2025-01-08T23:59:00Z",
      endTime: "2025-01-08T23:59:00Z",
      type: "deadline",
      priority: "high"
    }
  ];

  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  });

  const upcomingEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return eventDate > today && eventDate <= weekFromNow;
  });

  const getEventTypeColor = (type: string) => {
    return eventTypes.find(t => t.value === type)?.color || "bg-gray-500";
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || "text-gray-600";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleGoogleCalendarConnect = async () => {
    setIsConnectingGoogle(true);
    try {
      // Use existing Google authentication system
      const { signInWithGoogle } = await import('@/lib/google-oauth');
      
      // Sign in with Google (same as login page)
      await signInWithGoogle();
      
      // After successful login, request calendar permissions
      const response = await fetch('/api/auth/google-calendar-permissions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setGoogleCalendarConnected(true);
        toast({
          title: "הצלחה!",
          description: "יומן גוגל חובר בהצלחה",
        });
      } else {
        throw new Error('Failed to get calendar permissions');
      }
    } catch (error: any) {
      console.error('Google Calendar connection error:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להתחבר ליומן גוגל כרגע",
        variant: "destructive"
      });
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">יומן ומידע</h1>
          <p className="text-muted-foreground">נהל את הפגישות, המשימות והזמנים שלך</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 ml-2" />
            הגדרות יומן
          </Button>
          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 ml-2" />
                אירוע חדש
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>יצירת אירוע חדש</DialogTitle>
              </DialogHeader>
              <div className="p-4 text-center text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>יצירת אירועים תהיה זמינה בקרוב</p>
                <p className="text-sm mt-2">באפשרותך להתחבר ליומן גוגל בהגדרות המערכת</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">אירועים היום</p>
                <p className="text-2xl font-bold">{todayEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">השבוע הקרוב</p>
                <p className="text-2xl font-bold">{upcomingEvents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Users className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">פגישות לקוח</p>
                <p className="text-2xl font-bold">{events.filter(e => e.type === 'meeting').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Badge className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">דדליינים</p>
                <p className="text-2xl font-bold">{events.filter(e => e.type === 'deadline').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Events */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              אירועים היום
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>אין אירועים מתוכננים היום</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={`w-3 h-3 rounded-full mt-2 ${getEventTypeColor(event.type)}`} />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{event.title}</h4>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className={`${getPriorityColor(event.priority)}`}>
                          {priorityOptions.find(p => p.value === event.priority)?.label}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(event.startTime)} - {formatTime(event.endTime)}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        )}
                        {event.attendees && event.attendees.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {event.attendees.length} משתתפים
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              השבוע הקרוב
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">אין אירועים השבוע</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingEvents.map((event) => (
                  <div key={event.id} className="p-3 border rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm">{event.title}</h4>
                      <Badge variant="secondary" className={`text-xs ${getEventTypeColor(event.type)} text-white`}>
                        {eventTypes.find(t => t.value === event.type)?.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(event.startTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(event.startTime)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Google Calendar Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            חיבור ליומן גוגל
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">סנכרון עם יומן גוגל</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {googleCalendarConnected 
                  ? "יומן גוגל מחובר ומסונכרן"
                  : "חבר את היומן שלך ליומן גוגל לסנכרון אוטומטי של האירועים"
                }
              </p>
            </div>
            {googleCalendarConnected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <ExternalLink className="h-3 w-3 ml-1" />
                מחובר
              </Badge>
            ) : (
              <Button 
                variant="outline" 
                onClick={handleGoogleCalendarConnect}
                disabled={isConnectingGoogle}
              >
                <ExternalLink className="h-4 w-4 ml-2" />
                {isConnectingGoogle ? "מתחבר..." : "התחבר ליומן גוגל"}
              </Button>
            )}
          </div>
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>טיפ:</strong> אחרי החיבור תוכל לראות ולנהל את כל האירועים שלך ממקום אחד,
              לקבל תזכורות אוטומטיות ולסנכרן עם הצוות שלך.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}