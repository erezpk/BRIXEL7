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
      // Create calendar event
      const eventResponse = await apiRequest("POST", "/api/communications/calendar-events", {
        title: meetingData.title,
        description: meetingData.description,
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        location: meetingData.location,
        type: "meeting",
        priority: meetingData.priority,
        contactType,
        contactId,
        attendees: [],
      });

      // Also create a communication record
      await apiRequest("POST", "/api/communications", {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/communications/calendar-events"] });
      toast({
        title: "פגישה נקבעה",
        description: `פגישה עם ${contactName} נקבעה בהצלחה`,
      });
      setOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לקבוע פגישה כרגע",
        variant: "destructive",
      });
    },
  });

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
            <Calendar className="h-4 w-4 ml-2" />
            קבע פגישה
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-right">קבע פגישה עם {contactName}</DialogTitle>
        </DialogHeader>
        
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
                <Button
                  variant="outline"
                  className="w-full justify-start text-right font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: he }) : "בחר תאריך"}
                </Button>
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