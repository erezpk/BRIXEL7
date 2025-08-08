
import { Router } from "express";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Facebook OAuth - redirect to Facebook for authorization
router.get("/oauth", requireAuth, (req, res) => {
  const facebookAppId = process.env.FACEBOOK_APP_ID;
  const redirectUri = `${process.env.BASE_URL}/api/ads/facebook/callback`;
  
  if (!facebookAppId) {
    return res.status(500).json({ message: "Facebook App ID not configured" });
  }
  
  const permissions = [
    'ads_read',
    'ads_management', 
    'business_management',
    'leads_retrieval'
  ].join(',');
  
  // Generate secure state parameter
  const state = Buffer.from(JSON.stringify({
    userId: req.user?.id,
    timestamp: Date.now()
  })).toString('base64');
  
  const facebookAuthUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${facebookAppId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${permissions}` +
    `&response_type=code` +
    `&state=${state}` +
    `&auth_type=rerequest`;

  res.redirect(facebookAuthUrl);
});

// Facebook OAuth callback
router.get("/callback", requireAuth, async (req, res) => {
  try {
    const { code, state, error: fbError } = req.query;
    const userId = req.user?.id;

    if (fbError) {
      console.error("Facebook OAuth error:", fbError);
      return res.redirect('/dashboard/settings?error=facebook_denied');
    }

    if (!code || !state) {
      return res.redirect('/dashboard/settings?error=missing_parameters');
    }

    // Verify and decode state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch {
      return res.redirect('/dashboard/settings?error=invalid_state');
    }

    if (stateData.userId !== userId || Date.now() - stateData.timestamp > 600000) { // 10 minutes
      return res.redirect('/dashboard/settings?error=expired_state');
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: `${process.env.BASE_URL}/api/ads/facebook/callback`,
        code: code as string
      })
    });

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return res.redirect('/dashboard/settings?error=token_exchange_failed');
    }

    // Exchange short-lived token for long-lived token
    const longTokenResponse = await fetch('https://graph.facebook.com/v19.0/oauth/access_token?' + new URLSearchParams({
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID!,
      client_secret: process.env.FACEBOOK_APP_SECRET!,
      fb_exchange_token: tokenData.access_token
    }));

    const longTokenData = await longTokenResponse.json();
    const finalToken = longTokenData.access_token || tokenData.access_token;

    // Get user's ad accounts
    const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${finalToken}&fields=id,name,account_status,currency`);
    const accountsData = await accountsResponse.json();

    if (!accountsData.data || accountsData.data.length === 0) {
      return res.redirect('/dashboard/settings?error=no_ad_accounts');
    }

    // TODO: Store in database
    // This should store:
    // - userId
    // - encrypted access_token
    // - ad_account_ids
    // - expires_at (60 days from now)
    // - permissions granted
    
    console.log("Facebook connection successful for user:", userId);
    console.log("Ad accounts found:", accountsData.data.length);
    
    const accountNames = accountsData.data.map((acc: any) => acc.name).join(', ');
    res.redirect(`/dashboard/settings?facebook_connected=true&accounts=${encodeURIComponent(accountNames)}`);

  } catch (error) {
    console.error("Facebook OAuth callback error:", error);
    res.redirect('/dashboard/settings?error=connection_failed');
  }
});

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

// Get campaign data from Marketing API
router.get("/campaigns", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    // TODO: Get access_token from database for this user
    const accessToken = "USER_TOKEN_FROM_DB"; // This should come from encrypted storage

    if (!accessToken) {
      return res.status(401).json({ message: "Facebook account not connected" });
    }

    // Get user's ad accounts
    const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}&fields=id,name`);
    const accountsData = await accountsResponse.json();

    const campaignData = [];

    for (const account of accountsData.data || []) {
      // Get campaigns for this account
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v19.0/${account.id}/campaigns?` +
        `access_token=${accessToken}&` +
        `fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&` +
        `limit=50`
      );
      
      const campaigns = await campaignsResponse.json();

      for (const campaign of campaigns.data || []) {
        // Get insights for each campaign
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v19.0/${campaign.id}/insights?` +
          `access_token=${accessToken}&` +
          `fields=impressions,clicks,spend,cpm,cpc,ctr,reach,frequency&` +
          `date_preset=last_7d`
        );
        
        const insights = await insightsResponse.json();
        const insight = insights.data?.[0] || {};

        campaignData.push({
          accountId: account.id,
          accountName: account.name,
          campaignId: campaign.id,
          campaignName: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          dailyBudget: campaign.daily_budget,
          lifetimeBudget: campaign.lifetime_budget,
          createdTime: campaign.created_time,
          updatedTime: campaign.updated_time,
          insights: {
            impressions: insight.impressions || 0,
            clicks: insight.clicks || 0,
            spend: insight.spend || 0,
            cpm: insight.cpm || 0,
            cpc: insight.cpc || 0,
            ctr: insight.ctr || 0,
            reach: insight.reach || 0,
            frequency: insight.frequency || 0
          }
        });
      }
    }

    res.json({
      success: true,
      campaigns: campaignData,
      totalCampaigns: campaignData.length
    });

  } catch (error) {
    console.error("Error fetching campaign data:", error);
    res.status(500).json({
      message: "שגיאה בטעינת נתוני קמפיינים"
    });
  }
});

// Sync leads from Facebook Lead Ads
router.post("/sync-leads", requireAuth, async (req, res) => {
  try {
    const userId = req.user?.id;
    // TODO: Get access_token from database for this user
    const accessToken = "USER_TOKEN_FROM_DB";

    if (!accessToken) {
      return res.status(401).json({ message: "Facebook account not connected" });
    }

    // Get all ad accounts
    const accountsResponse = await fetch(`https://graph.facebook.com/v19.0/me/adaccounts?access_token=${accessToken}`);
    const accountsData = await accountsResponse.json();

    const leads = [];

    for (const account of accountsData.data || []) {
      // Get lead gen forms for this account
      const formsResponse = await fetch(`https://graph.facebook.com/v19.0/${account.id}/leadgen_forms?access_token=${accessToken}`);
      const formsData = await formsResponse.json();

      for (const form of formsData.data || []) {
        // Get leads for each form
        const leadsResponse = await fetch(`https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${accessToken}`);
        const leadsData = await leadsResponse.json();

        for (const lead of leadsData.data || []) {
          const leadData = {
            id: lead.id,
            formId: form.id,
            formName: form.name || 'Unnamed Form',
            accountId: account.id,
            accountName: account.name,
            createdTime: lead.created_time,
            fieldData: {},
            source: "facebook_lead_ads"
          };

          // Process field data
          for (const field of lead.field_data || []) {
            leadData.fieldData[field.name] = field.values?.[0] || '';
          }

          leads.push(leadData);
        }
      }
    }

    // TODO: Store leads in your database
    
    res.json({
      success: true,
      message: `סונכרנו ${leads.length} לידים מפייסבוק`,
      leads: leads,
      totalLeads: leads.length
    });

  } catch (error) {
    console.error("Error syncing Facebook leads:", error);
    res.status(500).json({
      message: "שגיאה בסנכרון לידים מפייסבוק"
    });
  }
});

export default router;
