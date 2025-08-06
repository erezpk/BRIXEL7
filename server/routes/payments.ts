import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage";
import { createInsertSchema } from "drizzle-zod";
import { paymentSettings, retainers, oneTimePayments, clientPaymentMethods } from "@shared/schema";
import { createPaymentProvider } from "../payment-providers/factory";

// Simple auth middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ message: "נדרשת התחברות" });
  }
  next();
};

const requireRoles = (roles: string[]) => (req: any, res: any, next: any) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "אין הרשאה" });
  }
  next();
};

const router = Router();

// Validation schemas
const PaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const RetainerSchema = createInsertSchema(retainers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

const OneTimePaymentSchema = createInsertSchema(oneTimePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment Settings Routes
router.get("/payment-settings", requireAuth, async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const settings = await storage.getPaymentSettings(agencyId);
    
    if (!settings) {
      return res.status(404).json({ message: "הגדרות תשלומים לא נמצאו" });
    }

    // Don't send sensitive keys to frontend
    const safeSettings = {
      ...settings,
      apiKey: settings.apiKey ? "***" : "",
      secretKey: settings.secretKey ? "***" : "",
      webhookSecret: settings.webhookSecret ? "***" : "",
    };

    res.json(safeSettings);
  } catch (error) {
    console.error("Error fetching payment settings:", error);
    res.status(500).json({ message: "שגיאה בטעינת הגדרות התשלומים" });
  }
});

router.post("/payment-settings", requireAuth, requireRoles(["admin", "super_admin"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const validatedData = PaymentSettingsSchema.parse({
      ...req.body,
      agencyId,
    });

    const existingSettings = await storage.getPaymentSettings(agencyId);
    
    let settings;
    if (existingSettings) {
      settings = await storage.updatePaymentSettings(agencyId, validatedData);
    } else {
      settings = await storage.createPaymentSettings(validatedData);
    }

    res.json({ message: "הגדרות התשלומים נשמרו בהצלחה", settings: settings.id });
  } catch (error) {
    console.error("Error saving payment settings:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "נתונים לא תקינים", errors: error.errors });
    }
    res.status(500).json({ message: "שגיאה בשמירת הגדרות התשלומים" });
  }
});

router.put("/payment-settings", requireAuth, requireRoles(["admin", "super_admin"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const validatedData = PaymentSettingsSchema.partial().parse(req.body);

    const settings = await storage.updatePaymentSettings(agencyId, validatedData);
    res.json({ message: "הגדרות התשלומים עודכנו בהצלחה", settings: settings.id });
  } catch (error) {
    console.error("Error updating payment settings:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "נתונים לא תקינים", errors: error.errors });
    }
    res.status(500).json({ message: "שגיאה בעדכון הגדרות התשלומים" });
  }
});

// Retainer Routes
router.get("/retainers", requireAuth, async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const retainers = await storage.getRetainersByAgency(agencyId);
    res.json(retainers);
  } catch (error) {
    console.error("Error fetching retainers:", error);
    res.status(500).json({ message: "שגיאה בטעינת הרייטנרים" });
  }
});

router.get("/retainers/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const retainer = await storage.getRetainer(id);
    
    if (!retainer) {
      return res.status(404).json({ message: "רייטנר לא נמצא" });
    }

    // Check if user has access to this retainer
    if (retainer.agencyId !== req.user.agencyId) {
      return res.status(403).json({ message: "אין הרשאה לגשת לרייטנר זה" });
    }

    res.json(retainer);
  } catch (error) {
    console.error("Error fetching retainer:", error);
    res.status(500).json({ message: "שגיאה בטעינת הרייטנר" });
  }
});

router.post("/retainers", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const validatedData = RetainerSchema.parse({
      ...req.body,
      agencyId,
      status: "active",
    });

    const retainer = await storage.createRetainer(validatedData);
    res.status(201).json({ message: "רייטנר נוצר בהצלחה", retainer });
  } catch (error) {
    console.error("Error creating retainer:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "נתונים לא תקינים", errors: error.errors });
    }
    res.status(500).json({ message: "שגיאה ביצירת הרייטנר" });
  }
});

router.put("/retainers/:id", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const { id } = req.params;
    const retainer = await storage.getRetainer(id);
    
    if (!retainer) {
      return res.status(404).json({ message: "רייטנר לא נמצא" });
    }

    if (retainer.agencyId !== req.user.agencyId) {
      return res.status(403).json({ message: "אין הרשאה לעדכן רייטנר זה" });
    }

    const validatedData = RetainerSchema.partial().parse(req.body);
    const updatedRetainer = await storage.updateRetainer(id, validatedData);
    
    res.json({ message: "רייטנר עודכן בהצלחה", retainer: updatedRetainer });
  } catch (error) {
    console.error("Error updating retainer:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "נתונים לא תקינים", errors: error.errors });
    }
    res.status(500).json({ message: "שגיאה בעדכון הרייטנר" });
  }
});

router.delete("/retainers/:id", requireAuth, requireRoles(["admin", "super_admin"]), async (req, res) => {
  try {
    const { id } = req.params;
    const retainer = await storage.getRetainer(id);
    
    if (!retainer) {
      return res.status(404).json({ message: "רייטנר לא נמצא" });
    }

    if (retainer.agencyId !== req.user.agencyId) {
      return res.status(403).json({ message: "אין הרשאה למחוק רייטנר זה" });
    }

    await storage.deleteRetainer(id);
    res.json({ message: "רייטנר נמחק בהצלחה" });
  } catch (error) {
    console.error("Error deleting retainer:", error);
    res.status(500).json({ message: "שגיאה במחיקת הרייטנר" });
  }
});

// One-time Payments Routes
router.get("/one-time-payments", requireAuth, async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const payments = await storage.getOneTimePaymentsByAgency(agencyId);
    res.json(payments);
  } catch (error) {
    console.error("Error fetching one-time payments:", error);
    res.status(500).json({ message: "שגיאה בטעינת התשלומים" });
  }
});

router.post("/one-time-payments", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const validatedData = OneTimePaymentSchema.parse({
      ...req.body,
      agencyId,
      status: "pending",
    });

    const payment = await storage.createOneTimePayment(validatedData);
    res.status(201).json({ message: "תשלום נוצר בהצלחה", payment });
  } catch (error) {
    console.error("Error creating one-time payment:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: "נתונים לא תקינים", errors: error.errors });
    }
    res.status(500).json({ message: "שגיאה ביצירת התשלום" });
  }
});

// Meshulam Integration Routes
router.post("/payment-link", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const paymentSettings = await storage.getPaymentSettings(agencyId);
    
    if (!paymentSettings || !paymentSettings.isEnabled) {
      return res.status(400).json({ message: "מערכת התשלומים לא מופעלת" });
    }

    const { amount, description, clientId } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "סכום לא תקין" });
    }

    // Create payment provider instance
    const provider = createPaymentProvider(paymentSettings.provider, {
      apiKey: paymentSettings.apiKey,
      secretKey: paymentSettings.secretKey,
      testMode: paymentSettings.settings?.testMode || false,
      currency: paymentSettings.settings?.currency || "ILS",
      ...paymentSettings.settings
    });

    const result = await provider.createPaymentLink({
      amount,
      currency: paymentSettings.settings?.currency || "ILS",
      description: description || paymentSettings.settings?.defaultDescription || "תשלום",
      clientId,
      successUrl: `${req.protocol}://${req.get('host')}/payment-success`,
      cancelUrl: `${req.protocol}://${req.get('host')}/payment-cancel`,
      callbackUrl: `${req.protocol}://${req.get('host')}/api/payments/callback`,
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating payment link:", error);
    res.status(500).json({ message: "שגיאה ביצירת קישור התשלום" });
  }
});

router.post("/meshulam/token", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const paymentSettings = await storage.getPaymentSettings(agencyId);
    
    if (!paymentSettings || !paymentSettings.isEnabled) {
      return res.status(400).json({ message: "מערכת התשלומים לא מופעלת" });
    }

    const meshulam = new MeshulamService({
      userId: paymentSettings.apiKey,
      apiKey: paymentSettings.secretKey,
      pageCode: paymentSettings.pageCode || "default",
      testMode: paymentSettings.testMode,
    });

    const { amount, description, maxPayments } = req.body;
    
    const result = await meshulam.createPaymentToken({
      sum: amount,
      currency: paymentSettings.currency || "ILS",
      description: description || "שמירת כרטיס אשראי",
      maxPayments: maxPayments || 36,
    });

    res.json(result);
  } catch (error) {
    console.error("Error creating Meshulam token:", error);
    res.status(500).json({ message: "שגיאה ביצירת טוקן התשלום" });
  }
});

router.post("/meshulam/charge-token", requireAuth, requireRoles(["admin", "super_admin", "team_member"]), async (req, res) => {
  try {
    const agencyId = req.user.agencyId;
    const paymentSettings = await storage.getPaymentSettings(agencyId);
    
    if (!paymentSettings || !paymentSettings.isEnabled) {
      return res.status(400).json({ message: "מערכת התשלומים לא מופעלת" });
    }

    const meshulam = new MeshulamService({
      userId: paymentSettings.apiKey,
      apiKey: paymentSettings.secretKey,
      pageCode: paymentSettings.pageCode || "default",
      testMode: paymentSettings.testMode,
    });

    const { token, amount, description } = req.body;
    
    if (!token || !amount || amount <= 0) {
      return res.status(400).json({ message: "נתונים חסרים או לא תקינים" });
    }

    const result = await meshulam.chargeWithToken(token, amount, description);
    res.json(result);
  } catch (error) {
    console.error("Error charging Meshulam token:", error);
    res.status(500).json({ message: "שגיאה בחיוב הטוקן" });
  }
});

router.post("/callback", async (req, res) => {
  try {
    const callbackData = req.body;
    console.log("Payment callback received:", callbackData);
    
    // TODO: Process the callback and update payment status
    // 1. Verify callback signature
    // 2. Parse callback data
    // 3. Update payment/retainer status in database
    // 4. Send confirmation emails if needed
    
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing payment callback:", error);
    res.status(500).json({ message: "שגיאה בעיבוד ה-callback" });
  }
});

export default router;