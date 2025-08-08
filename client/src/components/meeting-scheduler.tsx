import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface MeetingSchedulerProps {
  contactType: "lead" | "client";
  contactId: string;
  contactName: string;
  trigger?: React.ReactNode;
}

export function MeetingScheduler({ contactType, contactId, contactName, trigger }: MeetingSchedulerProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [priority, setPriority] = useState("medium");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMeetingMutation = useMutation({
    mutationFn: async (meetingData: any) => {
      // Check if user is connected to Google Calendar
      try {
        // Create Google Calendar event using real API
        const eventResponse = await apiRequest("/api/calendar/events", "POST", {
          title: meetingData.title,
          description: `פגישה עם ${contactName}\n\n${meetingData.description || ''}\n\nמיקום: ${meetingData.location || 'לא צוין'}`,
          startTime: meetingData.startTime,
          endTime: meetingData.endTime,
          contactType,
          contactId,
          contactName,
        });

        // Also create a communication record for tracking
        await apiRequest("/api/communications", "POST", {
          type: "meeting",
          contactType,
          contactId,
          subject: meetingData.title,
          content: meetingData.description || "פגישה מתוכננת",
          status: "scheduled",
          scheduledDate: meetingData.startTime,
          duration: meetingData.duration,
        });

        return eventResponse;
      } catch (error: any) {
        if (error.message?.includes('לא מחובר ליומן גוגל') || error.status === 400) {
          // User not connected to Google Calendar, show connection option
          throw new Error('CALENDAR_NOT_CONNECTED');
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      toast({
        title: "פגישה נקבעה ביומן גוגל",
        description: `פגישה עם ${contactName} נוספה ליומן Google Calendar שלך`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      console.error("Meeting creation error:", error);
      
      if (error.message === 'CALENDAR_NOT_CONNECTED') {
        toast({
          title: "נדרש חיבור ליומן Google",
          description: "כדי לקבוע פגישות, עליך לחבר את המערכת ליומן Google שלך",
          variant: "destructive",
        });
        
        // Trigger Google Calendar connection
        handleGoogleCalendarConnect();
        return;
      }
      
      toast({
        title: "שגיאה ביצירת פגישה",
        description: error.message || "לא ניתן היה ליצור את הפגישה ביומן",
        variant: "destructive",
      });
    },
  });

  // Google Calendar connection handler
  const handleGoogleCalendarConnect = async () => {
    try {
      // Check if user is already authenticated with Google
      const authResponse = await fetch('/api/auth/me', { credentials: 'include' });
      const authData = await authResponse.json();
      
      if (!authData.user?.googleCalendarConnected) {
        // Redirect to Google OAuth for calendar permissions
        window.location.href = '/api/auth/google';
        return;
      }
      
      // If already connected, just show success
      toast({
        title: "יומן Google מחובר",
        description: "אתה כבר מחובר ליומן Google",
      });
    } catch (error) {
      console.error('Google Calendar connection error:', error);
      toast({
        title: "שגיאה בחיבור",
        description: "לא ניתן היה להתחבר ליומן Google",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setDate(undefined);
    setTime("");
    setDuration("60");
    setTitle("");
    setDescription("");
    setLocation("");
    setPriority("medium");
  };

  const handleScheduleMeeting = () => {
    if (!date || !time || !title) {
      toast({
        title: "שגיאה",
        description: "יש למלא את כל השדות החובה",
        variant: "destructive",
      });
      return;
    }

    const [hours, minutes] = time.split(":");
    const startDateTime = new Date(date);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(duration));

    createMeetingMutation.mutate({
      title,
      description,
      location,
      priority,
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      duration: parseInt(duration),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <CalendarIcon className="h-4 w-4 ml-2" />
            קבע פגישה
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[75vh] overflow-y-auto" aria-describedby="meeting-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-right">קבע פגישה עם {contactName}</DialogTitle>
        </DialogHeader>
        <div id="meeting-dialog-description" className="sr-only">טופס לקביעת פגישה חדשה עם הליד או הלקוח</div>
        
        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">כותרת הפגישה *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="נושא הפגישה"
              className="text-right"
            />
          </div>

          {/* Date */}
          <div>
            <Label>תאריך *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <div
                  className="flex h-10 w-full cursor-pointer items-center justify-start rounded-md border border-input bg-background px-3 py-2 text-sm text-right font-normal ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  tabIndex={0}
                  role="button"
                  aria-label="בחר תאריך"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: he }) : "בחר תאריך"}
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time and Duration */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="time">שעה *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="duration">משך (דקות)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 דקות</SelectItem>
                  <SelectItem value="60">60 דקות</SelectItem>
                  <SelectItem value="90">90 דקות</SelectItem>
                  <SelectItem value="120">120 דקות</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">מיקום</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="כתובת או קישור לפגישה וירטואלית"
              className="text-right"
            />
          </div>

          {/* Priority */}
          <div>
            <Label>עדיפות</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">נמוכה</SelectItem>
                <SelectItem value="medium">בינונית</SelectItem>
                <SelectItem value="high">גבוהה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">הערות</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטים נוספים על הפגישה"
              className="text-right"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              ביטול
            </Button>
            <Button 
              onClick={handleScheduleMeeting}
              disabled={createMeetingMutation.isPending}
            >
              <Plus className="h-4 w-4 ml-2" />
              {createMeetingMutation.isPending ? "שומר..." : "קבע פגישה"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}