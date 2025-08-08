
-- Facebook Ads Integration Tables
CREATE TABLE IF NOT EXISTS facebook_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  access_token TEXT NOT NULL, -- Should be encrypted
  token_expires_at DATETIME,
  permissions TEXT, -- JSON array of granted permissions
  connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facebook_ad_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id INTEGER NOT NULL,
  facebook_account_id TEXT NOT NULL,
  account_name TEXT,
  currency TEXT DEFAULT 'ILS',
  account_status TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES facebook_integrations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facebook_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_account_id INTEGER NOT NULL,
  facebook_campaign_id TEXT NOT NULL,
  campaign_name TEXT,
  status TEXT,
  objective TEXT,
  daily_budget DECIMAL(10,2),
  lifetime_budget DECIMAL(10,2),
  facebook_created_at DATETIME,
  facebook_updated_at DATETIME,
  last_synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_account_id) REFERENCES facebook_ad_accounts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS facebook_campaign_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  date_start DATE,
  date_stop DATE,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  cpm DECIMAL(10,2) DEFAULT 0,
  cpc DECIMAL(10,2) DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  frequency DECIMAL(5,2) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES facebook_campaigns(id) ON DELETE CASCADE
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_facebook_integrations_user_id ON facebook_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_ad_accounts_integration_id ON facebook_ad_accounts(integration_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaigns_ad_account_id ON facebook_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaign_insights_campaign_id ON facebook_campaign_insights(campaign_id);
CREATE INDEX IF NOT EXISTS idx_facebook_campaign_insights_date ON facebook_campaign_insights(date_start, date_stop);
