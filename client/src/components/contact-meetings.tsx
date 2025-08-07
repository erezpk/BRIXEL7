import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { MeetingScheduler } from "./meeting-scheduler";

interface ContactMeetingsProps {
  contactType: "lead" | "client";
  contactId: string;
  contactName: string;
}

export function ContactMeetings({ contactType, contactId, contactName }: ContactMeetingsProps) {
  // Fetch Google Calendar events for this contact
  const { data: meetings, isLoading } = useQuery({
    queryKey: ["/api/calendar/events", contactType, contactId],
    queryFn: async () => {
      const response = await fetch(`/api/calendar/events?contactType=${contactType}&contactId=${contactId}`);
      if (!response.ok) throw new Error("Failed to fetch calendar events");
      return response.json();
    },
  });

  // Fetch communications for this contact
  const { data: communications } = useQuery({
    queryKey: ["/api/communications", contactType, contactId],
    queryFn: async () => {
      const response = await fetch(`/api/communications?contactType=${contactType}&contactId=${contactId}`);
      if (!response.ok) throw new Error("Failed to fetch communications");
      return response.json();
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: format(date, "dd/MM/yyyy", { locale: he }),
      time: format(date, "HH:mm", { locale: he }),
      weekday: format(date, "EEEE", { locale: he }),
    };
  };

  const upcomingMeetings = meetings?.filter((meeting: any) => 
    new Date(meeting.startTime) > new Date() && meeting.status === "scheduled"
  ) || [];

  const pastMeetings = meetings?.filter((meeting: any) => 
    new Date(meeting.startTime) <= new Date() || meeting.status === "completed"
  ) || [];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">טוען פגישות...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Schedule New Meeting */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">פגישות</CardTitle>
            <MeetingScheduler
              contactType={contactType}
              contactId={contactId}
              contactName={contactName}
            />
          </div>
        </CardHeader>
      </Card>

      {/* Upcoming Meetings */}
      {upcomingMeetings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              פגישות קרובות ({upcomingMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.map((meeting: any) => {
              const dateTime = formatDateTime(meeting.startTime);
              const isUrgent = new Date(meeting.startTime).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000;
              
              return (
                <div key={meeting.id} className={`p-3 border rounded-lg ${isUrgent ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{meeting.title}</h4>
                        <Badge variant="secondary" className={getStatusColor(meeting.status)}>
                          {meeting.status === "scheduled" ? "מתוכנן" : meeting.status}
                        </Badge>
                        {meeting.priority === "high" && (
                          <AlertCircle className={`h-4 w-4 ${getPriorityColor(meeting.priority)}`} />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{dateTime.weekday}, {dateTime.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{dateTime.time}</span>
                        </div>
                        {meeting.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{meeting.location}</span>
                          </div>
                        )}
                      </div>
                      
                      {meeting.description && (
                        <p className="text-sm text-muted-foreground mt-1">{meeting.description}</p>
                      )}
                    </div>
                    
                    {isUrgent && (
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                        דחוף
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Past Meetings */}
      {pastMeetings.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              פגישות קודמות ({pastMeetings.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastMeetings.slice(0, 3).map((meeting: any) => {
              const dateTime = formatDateTime(meeting.startTime);
              
              return (
                <div key={meeting.id} className="p-2 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium text-sm">{meeting.title}</h5>
                      <p className="text-xs text-muted-foreground">
                        {dateTime.date} בשעה {dateTime.time}
                      </p>
                    </div>
                    <Badge variant="secondary" className={getStatusColor(meeting.status)}>
                      {meeting.status === "completed" ? "הושלם" : meeting.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
            
            {pastMeetings.length > 3 && (
              <div className="text-center">
                <span className="text-xs text-muted-foreground">
                  ועוד {pastMeetings.length - 3} פגישות...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No meetings */}
      {(!meetings || meetings.length === 0) && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>אין פגישות מתוכננות</p>
            <p className="text-sm">קבע פגישה ראשונה עם {contactName}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}