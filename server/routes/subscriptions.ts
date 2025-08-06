import { Router } from "express";
import { subscriptionService, SUBSCRIPTION_PLANS } from "../subscription-service";

const router = Router();

// Public routes - no auth required for subscription purchase

// Get available subscription plans
router.get("/plans", async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json(plans);
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ message: "שגיאה בטעינת תוכניות המנוי" });
  }
});

// Create payment link for subscription
router.post("/purchase", async (req, res) => {
  try {
    const { planId, customerEmail, customerName, agencyName } = req.body;

    if (!planId || !customerEmail || !customerName || !agencyName) {
      return res.status(400).json({ 
        message: "נתונים חסרים - נדרש planId, customerEmail, customerName, agencyName" 
      });
    }

    const result = await subscriptionService.createSubscriptionPaymentLink(
      planId,
      customerEmail,
      customerName,
      agencyName
    );

    res.json(result);
  } catch (error) {
    console.error("Error creating subscription payment link:", error);
    res.status(500).json({ message: "שגיאה ביצירת קישור רכישת המנוי" });
  }
});

// Handle subscription payment callback
router.post("/callback", async (req, res) => {
  try {
    const result = await subscriptionService.processSubscriptionCallback(req.body);
    
    if (result.success) {
      console.log(`New subscription created for agency: ${result.agencyId}`);
      res.status(200).send("OK");
    } else {
      console.warn("Subscription callback failed:", req.body);
      res.status(400).send("FAILED");
    }
  } catch (error) {
    console.error("Error processing subscription callback:", error);
    res.status(500).send("ERROR");
  }
});

// Get subscription status (requires agency context)
router.get("/status/:agencyId", async (req, res) => {
  try {
    const { agencyId } = req.params;
    const status = await subscriptionService.checkSubscriptionStatus(agencyId);
    res.json(status);
  } catch (error) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({ message: "שגיאה בבדיקת סטטוס המנוי" });
  }
});

export default router;