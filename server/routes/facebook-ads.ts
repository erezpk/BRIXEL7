
import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Connect Facebook Ads account
router.post("/connect", requireAuth, async (req, res) => {
  try {
    const { accessToken, accountId } = req.body;
    const userId = req.user?.id;

    if (!accessToken || !accountId) {
      return res.status(400).json({
        message: "נדרש access token ו-account ID"
      });
    }

    // Verify the access token with Facebook
    const fbResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`);
    
    if (!fbResponse.ok) {
      return res.status(400).json({
        message: "access token לא תקין"
      });
    }

    const fbData = await fbResponse.json();
    const account = fbData.data?.find((acc: any) => acc.id === `act_${accountId}`);

    if (!account) {
      return res.status(400).json({
        message: "חשבון פרסום לא נמצא"
      });
    }

    // Store the connection in database (implement based on your schema)
    // This is a simplified version
    res.json({
      success: true,
      accountId: account.id,
      accountName: account.name,
      accessToken: accessToken
    });

  } catch (error) {
    console.error("Error connecting Facebook Ads:", error);
    res.status(500).json({
      message: "שגיאה בחיבור לפייסבוק אדס"
    });
  }
});

// Sync leads from Facebook Ads
router.post("/sync", requireAuth, async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userId = req.user?.id;

    if (!accessToken) {
      return res.status(400).json({
        message: "נדרש access token"
      });
    }

    // Get all ad accounts
    const accountsResponse = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}`);
    const accountsData = await accountsResponse.json();

    const leads = [];

    // For each ad account, get leads
    for (const account of accountsData.data || []) {
      const leadsResponse = await fetch(`https://graph.facebook.com/v18.0/${account.id}/leadgen_forms?access_token=${accessToken}`);
      const leadsData = await leadsResponse.json();

      for (const form of leadsData.data || []) {
        const formLeadsResponse = await fetch(`https://graph.facebook.com/v18.0/${form.id}/leads?access_token=${accessToken}`);
        const formLeadsData = await formLeadsResponse.json();

        for (const lead of formLeadsData.data || []) {
          leads.push({
            id: lead.id,
            name: lead.field_data?.find((f: any) => f.name === "full_name")?.values?.[0] || "",
            email: lead.field_data?.find((f: any) => f.name === "email")?.values?.[0] || "",
            phone: lead.field_data?.find((f: any) => f.name === "phone_number")?.values?.[0] || "",
            source: "facebook_ads",
            campaignId: form.id,
            createdAt: lead.created_time
          });
        }
      }
    }

    // Store leads in database (implement based on your schema)
    
    res.json({
      success: true,
      message: `סונכרנו ${leads.length} לידים מפייסבוק אדס`,
      leads: leads
    });

  } catch (error) {
    console.error("Error syncing Facebook leads:", error);
    res.status(500).json({
      message: "שגיאה בסנכרון לידים מפייסבוק"
    });
  }
});

export default router;
