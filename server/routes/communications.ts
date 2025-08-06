import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import { requireAuth } from "../middleware/auth";
import { communications, calendarEvents, users, leads, clients } from "@shared/schema";
import { eq, and, or, desc, sql } from "drizzle-orm";

const router = Router();

// Validation schemas
const createCommunicationSchema = z.object({
  type: z.enum(["phone_call", "email", "whatsapp", "sms", "meeting", "summary"]),
  contactType: z.enum(["lead", "client"]),
  contactId: z.string().uuid(),
  subject: z.string().min(1),
  content: z.string().min(1),
  status: z.enum(["completed", "scheduled", "failed", "cancelled"]).default("completed"),
  scheduledDate: z.string().optional(),
  duration: z.number().min(0).optional(),
  outcome: z.string().optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

const createCalendarEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().optional(),
  type: z.enum(["meeting", "task", "deadline", "reminder"]).default("meeting"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  contactType: z.enum(["lead", "client"]).optional(),
  contactId: z.string().uuid().optional(),
  attendees: z.array(z.string()).default([]),
});

// Get all communications for the agency
router.get("/", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    
    const result = await db
      .select({
        id: communications.id,
        type: communications.type,
        contactType: communications.contactType,
        contactId: communications.contactId,
        contactName: communications.contactName,
        subject: communications.subject,
        content: communications.content,
        status: communications.status,
        scheduledDate: communications.scheduledDate,
        completedDate: communications.completedDate,
        duration: communications.duration,
        outcome: communications.outcome,
        followUpRequired: communications.followUpRequired,
        followUpDate: communications.followUpDate,
        tags: communications.tags,
        createdBy: communications.createdBy,
        createdByName: users.fullName,
        createdAt: communications.createdAt,
        updatedAt: communications.updatedAt,
      })
      .from(communications)
      .leftJoin(users, eq(communications.createdBy, users.id))
      .where(eq(communications.agencyId, user.agencyId!))
      .orderBy(desc(communications.createdAt));

    res.json(result);
  } catch (error) {
    console.error("Error fetching communications:", error);
    res.status(500).json({ error: "שגיאה בטעינת רשומות התקשורת" });
  }
});

// Create new communication
router.post("/", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const validatedData = createCommunicationSchema.parse(req.body);

    // Get contact name for caching
    let contactName = "";
    if (validatedData.contactType === "lead") {
      const lead = await db.select({ name: leads.name })
        .from(leads)
        .where(and(eq(leads.id, validatedData.contactId), eq(leads.agencyId, user.agencyId!)))
        .limit(1);
      contactName = lead[0]?.name || "ליד לא ידוע";
    } else {
      const client = await db.select({ name: clients.name })
        .from(clients)
        .where(and(eq(clients.id, validatedData.contactId), eq(clients.agencyId, user.agencyId!)))
        .limit(1);
      contactName = client[0]?.name || "לקוח לא ידוע";
    }

    const result = await db.insert(communications).values({
      agencyId: user.agencyId!,
      contactName,
      createdBy: user.id,
      completedDate: validatedData.status === "completed" ? new Date() : undefined,
      ...validatedData,
    }).returning();

    res.json(result[0]);
  } catch (error) {
    console.error("Error creating communication:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "נתונים לא תקינים", details: error.errors });
    } else {
      res.status(500).json({ error: "שגיאה ביצירת רשומת התקשורת" });
    }
  }
});

// Update communication
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;
    const validatedData = createCommunicationSchema.parse(req.body);

    // Get contact name for caching
    let contactName = "";
    if (validatedData.contactType === "lead") {
      const lead = await db.select({ name: leads.name })
        .from(leads)
        .where(and(eq(leads.id, validatedData.contactId), eq(leads.agencyId, user.agencyId!)))
        .limit(1);
      contactName = lead[0]?.name || "ליד לא ידוע";
    } else {
      const client = await db.select({ name: clients.name })
        .from(clients)
        .where(and(eq(clients.id, validatedData.contactId), eq(clients.agencyId, user.agencyId!)))
        .limit(1);
      contactName = client[0]?.name || "לקוח לא ידוע";
    }

    const result = await db.update(communications)
      .set({
        contactName,
        completedDate: validatedData.status === "completed" ? new Date() : undefined,
        updatedAt: new Date(),
        ...validatedData,
      })
      .where(and(eq(communications.id, id), eq(communications.agencyId, user.agencyId!)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "רשומת התקשורת לא נמצאה" });
    }

    res.json(result[0]);
  } catch (error) {
    console.error("Error updating communication:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "נתונים לא תקינים", details: error.errors });
    } else {
      res.status(500).json({ error: "שגיאה בעדכון רשומת התקשורת" });
    }
  }
});

// Delete communication
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { id } = req.params;

    const result = await db.delete(communications)
      .where(and(eq(communications.id, id), eq(communications.agencyId, user.agencyId!)))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: "רשומת התקשורת לא נמצאה" });
    }

    res.json({ message: "רשומת התקשורת נמחקה בהצלחה" });
  } catch (error) {
    console.error("Error deleting communication:", error);
    res.status(500).json({ error: "שגיאה במחיקת רשומת התקשורת" });
  }
});

// Get communication statistics for reports
router.get("/stats", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const { from, to } = req.query;

    let whereCondition = eq(communications.agencyId, user.agencyId!);
    
    if (from && to) {
      whereCondition = and(
        whereCondition,
        sql`${communications.createdAt} >= ${from}`,
        sql`${communications.createdAt} <= ${to}`
      );
    }

    const stats = await db
      .select({
        type: communications.type,
        status: communications.status,
        createdBy: communications.createdBy,
        createdByName: users.fullName,
        count: sql<number>`count(*)::int`,
        totalDuration: sql<number>`sum(${communications.duration})::int`,
      })
      .from(communications)
      .leftJoin(users, eq(communications.createdBy, users.id))
      .where(whereCondition)
      .groupBy(communications.type, communications.status, communications.createdBy, users.fullName);

    // Also get lead/client breakdown
    const contactStats = await db
      .select({
        contactType: communications.contactType,
        count: sql<number>`count(*)::int`,
      })
      .from(communications)
      .where(whereCondition)
      .groupBy(communications.contactType);

    res.json({
      byType: stats,
      byContact: contactStats,
    });
  } catch (error) {
    console.error("Error fetching communication stats:", error);
    res.status(500).json({ error: "שגיאה בטעינת סטטיסטיקות התקשורת" });
  }
});

// Calendar Events API
router.get("/calendar-events", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    
    const result = await db
      .select({
        id: calendarEvents.id,
        title: calendarEvents.title,
        description: calendarEvents.description,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        location: calendarEvents.location,
        type: calendarEvents.type,
        priority: calendarEvents.priority,
        status: calendarEvents.status,
        contactType: calendarEvents.contactType,
        contactId: calendarEvents.contactId,
        attendees: calendarEvents.attendees,
        createdBy: calendarEvents.createdBy,
        createdByName: users.fullName,
        createdAt: calendarEvents.createdAt,
      })
      .from(calendarEvents)
      .leftJoin(users, eq(calendarEvents.createdBy, users.id))
      .where(eq(calendarEvents.agencyId, user.agencyId!))
      .orderBy(desc(calendarEvents.startTime));

    res.json(result);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ error: "שגיאה בטעינת אירועי היומן" });
  }
});

// Create calendar event
router.post("/calendar-events", requireAuth, async (req, res) => {
  try {
    const { user } = req;
    const validatedData = createCalendarEventSchema.parse(req.body);

    const result = await db.insert(calendarEvents).values({
      agencyId: user.agencyId!,
      createdBy: user.id,
      ...validatedData,
    }).returning();

    res.json(result[0]);
  } catch (error) {
    console.error("Error creating calendar event:", error);
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: "נתונים לא תקינים", details: error.errors });
    } else {
      res.status(500).json({ error: "שגיאה ביצירת אירוע היומן" });
    }
  }
});

export default router;