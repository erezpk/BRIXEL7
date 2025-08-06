import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, integer, boolean, json, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Agencies (multi-tenant support)
export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: text("industry"), // marketing, design, video, therapy, etc.
  logo: text("logo"), // URL to agency logo
  settings: json("settings").$type<{
    timezone?: string;
    language?: string;
    currency?: string;
  }>().default({}),
  pdfTemplate: text("pdf_template").default("modern"), // PDF template choice
  pdfColor: text("pdf_color").default("#0066cc"), // Primary color for PDF
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // super_admin, agency_admin, team_member, client
  agencyId: uuid("agency_id").references(() => agencies.id),
  phone: text("phone"),
  company: text("company"),
  bio: text("bio"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clients
export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  name: text("name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  industry: text("industry"),
  status: text("status").default("active").notNull(), // active, inactive, pending
  notes: text("notes"),
  customFields: json("custom_fields").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Projects
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type"), // website, mobile-app, web-app, ecommerce, social-media, video-editing, graphic-design, other
  status: text("status").default("planning").notNull(), // planning, in_progress, completed, on_hold, cancelled
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: integer("budget"), // in agorot (Israeli currency cents)
  assignedTo: uuid("assigned_to").references(() => users.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  projectId: uuid("project_id").references(() => projects.id),
  clientId: uuid("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("new").notNull(), // new, in_progress, completed, cancelled
  priority: text("priority").default("medium").notNull(),
  assignedTo: uuid("assigned_to").references(() => users.id),
  dueDate: date("due_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  tags: json("tags").$type<string[]>().default([]),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Comments
export const taskComments = pgTable("task_comments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: uuid("task_id").notNull().references(() => tasks.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client Settings - Individual client configurations
export const clientSettings = pgTable("client_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id).unique(),
  vatPercentage: integer("vat_percentage").default(18).notNull(), // VAT percentage for this client
  currency: text("currency").default("ILS").notNull(), // Currency (ILS, USD, EUR, etc.)
  paymentTerms: integer("payment_terms").default(30).notNull(), // Payment terms in days
  settings: json("settings").$type<{
    timezone?: string;
    invoicePrefix?: string;
    autoReminders?: boolean;
    reminderDays?: number[];
    defaultNotes?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Products and Services
export const products = pgTable("products", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"), // website, design, marketing, video, etc.
  price: integer("price").notNull(), // in agorot
  priceType: text("price_type").default("fixed").notNull(), // fixed, hourly, monthly
  unit: text("unit").default("project").notNull(), // project, hour, month, etc.
  isActive: boolean("is_active").default(true).notNull(),
  predefinedTasks: json("predefined_tasks").$type<{
    id: string;
    title: string;
    description?: string;
    estimatedHours?: number;
    order: number;
  }[]>().default([]),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Quotes/Proposals
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").notNull(), // can reference clients.id or leads.id
  clientType: text("client_type").default("client").notNull(), // 'client' or 'lead'
  quoteNumber: text("quote_number").notNull().unique(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("draft").notNull(), // draft, sent, approved, rejected, expired
  validUntil: date("valid_until"),
  subtotal: integer("subtotal").notNull(), // in agorot
  vatAmount: integer("vat_amount").notNull(),
  totalAmount: integer("total_amount").notNull(),
  items: json("items").$type<{
    id: string;
    productId?: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number; // in agorot
    priceType: 'fixed' | 'hourly' | 'monthly'; // סוג התמחור
    total: number; // in agorot
  }[]>().default([]),
  terms: text("terms"),
  notes: text("notes"),
  sentAt: timestamp("sent_at"),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  viewedAt: timestamp("viewed_at"),
  viewCount: integer("view_count").default(0).notNull(),
  signedAt: timestamp("signed_at"),
  signatureData: json("signature_data").$type<{
    signature?: string; // base64 signature image
    ipAddress?: string;
    userAgent?: string;
    timestamp?: string;
  }>(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Contracts
export const contracts = pgTable("contracts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  projectId: uuid("project_id").references(() => projects.id),
  quoteId: uuid("quote_id").references(() => quotes.id),
  contractNumber: text("contract_number").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").default("draft").notNull(), // draft, sent, signed, active, completed, cancelled
  contractFile: text("contract_file"), // path to uploaded contract file
  signatureFields: json("signature_fields").$type<{
    id: string;
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
    signerRole: string; // client, agency
  }[]>().default([]),
  clientSignature: json("client_signature").$type<{
    signature?: string; // base64 signature image
    signedAt?: string;
    ipAddress?: string;
    userAgent?: string;
  }>(),
  agencySignature: json("agency_signature").$type<{
    signature?: string;
    signedAt?: string;
    signedBy?: string; // user ID
  }>(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  totalValue: integer("total_value"), // in agorot
  paymentSchedule: json("payment_schedule").$type<{
    id: string;
    amount: number; // in agorot
    dueDate: string;
    description?: string;
    status: 'pending' | 'paid' | 'overdue';
  }[]>().default([]),
  terms: text("terms"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Invoices
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  projectId: uuid("project_id").references(() => projects.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  status: text("status").default("draft").notNull(), // draft, sent, paid, overdue, cancelled
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  subtotal: integer("subtotal").notNull(), // in agorot
  vatAmount: integer("vat_amount").notNull(),
  totalAmount: integer("total_amount").notNull(),
  paidAmount: integer("paid_amount").default(0).notNull(),
  items: json("items").$type<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number; // in agorot
    priceType: 'fixed' | 'hourly' | 'monthly'; // סוג התמחור
    total: number; // in agorot
  }[]>().default([]),
  paymentMethod: text("payment_method"), // bank_transfer, credit_card, check, cash
  paymentReference: text("payment_reference"), // transaction ID, check number, etc.
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Payments
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id),
  contractId: uuid("contract_id").references(() => contracts.id),
  projectId: uuid("project_id").references(() => projects.id),
  amount: integer("amount").notNull(), // in agorot
  paymentDate: date("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull(), // bank_transfer, credit_card, check, cash
  reference: text("reference"), // transaction ID, check number, etc.
  status: text("status").default("completed").notNull(), // pending, completed, failed, cancelled
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringSchedule: json("recurring_schedule").$type<{
    frequency: 'monthly' | 'quarterly' | 'yearly';
    nextPaymentDate?: string;
    endDate?: string;
  }>(),
  notes: text("notes"),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Digital Assets
export const digitalAssets = pgTable("digital_assets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // domain, hosting, ssl, email, etc.
  name: text("name").notNull(),
  provider: text("provider"),
  renewalDate: date("renewal_date"),
  cost: integer("cost"), // in agorot
  loginUrl: text("login_url"),
  username: text("username"),
  password: text("password"), // encrypted
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false).notNull(),
  autoRenew: boolean("auto_renew").default(false).notNull(),
  status: text("status").default("active").notNull(), // active, expired, cancelled
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agency Templates
export const agencyTemplates = pgTable("agency_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").references(() => agencies.id),
  name: text("name").notNull(),
  industry: text("industry").notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(false).notNull(),
  template: json("template").$type<{
    clientFields?: any[];
    projectFields?: any[];
    taskFields?: any[];
    workflows?: any[];
  }>().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Card Templates - for drag & drop builder
export const clientCardTemplates = pgTable("client_card_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  name: text("name").notNull(),
  description: text("description"),
  industry: text("industry"), // 'marketing', 'design', 'video', 'therapy', etc.
  fields: json("fields").$type<ClientCardField[]>().default([]),
  isDefault: boolean("is_default").default(false).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads (Facebook Ads & Google Ads Integration)
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id"),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source").notNull(), // facebook_ads, google_ads, manual, website, referral
  campaignId: text("campaign_id"), // campaign ID from ads platform
  campaignName: text("campaign_name"), // campaign name
  adSetId: text("ad_set_id"), // ad set ID (Facebook) or ad group ID (Google)
  adSetName: text("ad_set_name"), // ad set/group name
  status: text("status").default("new").notNull(), // new, contacted, qualified, converted, lost
  priority: text("priority").default("medium").notNull(), // low, medium, high
  budget: integer("budget"), // potential project budget in agorot
  assignedTo: uuid("assigned_to").references(() => users.id),
  notes: text("notes"),
  customFields: json("custom_fields").$type<Record<string, any>>().default({}),
  convertedToClientId: uuid("converted_to_client_id").references(() => clients.id),
  convertedToProjectId: uuid("converted_to_project_id").references(() => projects.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity Log
export const activityLog = pgTable("activity_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // created, updated, deleted, commented, etc.
  entityType: text("entity_type").notNull(), // client, project, task, lead, etc.
  entityId: uuid("entity_id"),
  details: json("details").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment Settings - Agency-level payment configurations
export const paymentSettings = pgTable("payment_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id).unique(),
  provider: text("provider").notNull(), // meshulam, stripe, paypal, etc.
  isEnabled: boolean("is_enabled").default(false).notNull(),
  apiKey: text("api_key"), // Encrypted API key
  secretKey: text("secret_key"), // Encrypted secret key
  webhookSecret: text("webhook_secret"), // Encrypted webhook secret
  settings: json("settings").$type<{
    currency?: string;
    testMode?: boolean;
    autoCapture?: boolean;
    retentionDays?: number;
    defaultDescription?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Client Payment Methods - Stored payment methods for clients
export const clientPaymentMethods = pgTable("client_payment_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  provider: text("provider").notNull(), // meshulam, stripe, etc.
  providerCustomerId: text("provider_customer_id"), // Customer ID in payment provider
  providerPaymentMethodId: text("provider_payment_method_id"), // Payment method ID in provider
  type: text("type").notNull(), // card, bank_transfer, etc.
  cardBrand: text("card_brand"), // visa, mastercard, etc.
  cardLastFour: text("card_last_four"), // Last 4 digits
  cardExpMonth: integer("card_exp_month"),
  cardExpYear: integer("card_exp_year"),
  cardHolderName: text("card_holder_name"),
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Retainers - Recurring payment agreements
export const retainers = pgTable("retainers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").notNull().references(() => clients.id),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  paymentMethodId: uuid("payment_method_id").references(() => clientPaymentMethods.id),
  title: text("title").notNull(),
  description: text("description"),
  amount: integer("amount").notNull(), // Amount in agorot
  currency: text("currency").default("ILS").notNull(),
  frequency: text("frequency").notNull(), // monthly, quarterly, yearly
  startDate: date("start_date").notNull(),
  endDate: date("end_date"), // Optional end date
  status: text("status").default("active").notNull(), // active, paused, cancelled, completed
  nextChargeDate: date("next_charge_date"),
  totalCharges: integer("total_charges").default(0).notNull(),
  failedCharges: integer("failed_charges").default(0).notNull(),
  lastChargeDate: date("last_charge_date"),
  settings: json("settings").$type<{
    autoRenew?: boolean;
    gracePeriodDays?: number;
    maxFailedAttempts?: number;
    emailNotifications?: boolean;
  }>().default({}),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Retainer Transactions - Individual charges for retainers
export const retainerTransactions = pgTable("retainer_transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  retainerId: uuid("retainer_id").notNull().references(() => retainers.id),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  amount: integer("amount").notNull(),
  currency: text("currency").default("ILS").notNull(),
  status: text("status").notNull(), // pending, processing, completed, failed, refunded
  providerTransactionId: text("provider_transaction_id"), // Transaction ID from payment provider
  chargeDate: date("charge_date").notNull(),
  completedAt: timestamp("completed_at"),
  failureReason: text("failure_reason"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// One-time Payments - Individual payment transactions
export const oneTimePayments = pgTable("one_time_payments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  clientId: uuid("client_id").references(() => clients.id),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  invoiceId: uuid("invoice_id").references(() => invoices.id), // Optional link to invoice
  quoteId: uuid("quote_id").references(() => quotes.id), // Optional link to quote
  paymentMethodId: uuid("payment_method_id").references(() => clientPaymentMethods.id),
  amount: integer("amount").notNull(),
  currency: text("currency").default("ILS").notNull(),
  description: text("description"),
  status: text("status").notNull(), // pending, processing, completed, failed, refunded
  providerTransactionId: text("provider_transaction_id"),
  providerPaymentIntentId: text("provider_payment_intent_id"),
  paymentDate: timestamp("payment_date"),
  failureReason: text("failure_reason"),
  refundAmount: integer("refund_amount").default(0),
  refundDate: timestamp("refund_date"),
  metadata: json("metadata").$type<Record<string, any>>().default({}),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Custom field interface for client card builder
export interface ClientCardField {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'status' | 'number' | 'email' | 'phone';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[]; // for select fields
  defaultValue?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}


// Relations
export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  products: many(products),
  projects: many(projects),
  tasks: many(tasks),
  leads: many(leads),
  digitalAssets: many(digitalAssets),
  quotes: many(quotes),
  contracts: many(contracts),
  invoices: many(invoices),
  payments: many(payments),
  templates: many(agencyTemplates),
  clientCardTemplates: many(clientCardTemplates),
  activityLog: many(activityLog),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [users.agencyId],
    references: [agencies.id],
  }),
  assignedProjects: many(projects),
  assignedTasks: many(tasks),
  createdTasks: many(tasks),
  comments: many(taskComments),
  createdTemplates: many(agencyTemplates),
  activityLog: many(activityLog),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [clients.agencyId],
    references: [agencies.id],
  }),
  settings: one(clientSettings, {
    fields: [clients.id],
    references: [clientSettings.clientId],
  }),
  projects: many(projects),
  tasks: many(tasks),
  leads: many(leads),
  digitalAssets: many(digitalAssets),
  quotes: many(quotes),
  contracts: many(contracts),
  invoices: many(invoices),
  payments: many(payments),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [projects.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [projects.clientId],
    references: [clients.id],
  }),
  assignedUser: one(users, {
    fields: [projects.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [projects.createdBy],
    references: [users.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [tasks.agencyId],
    references: [agencies.id],
  }),
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  client: one(clients, {
    fields: [tasks.clientId],
    references: [clients.id],
  }),
  assignedUser: one(users, {
    fields: [tasks.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
  }),
  comments: many(taskComments),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  user: one(users, {
    fields: [taskComments.userId],
    references: [users.id],
  }),
}));

export const digitalAssetsRelations = relations(digitalAssets, ({ one }) => ({
  agency: one(agencies, {
    fields: [digitalAssets.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [digitalAssets.clientId],
    references: [clients.id],
  }),
}));

export const agencyTemplatesRelations = relations(agencyTemplates, ({ one }) => ({
  agency: one(agencies, {
    fields: [agencyTemplates.agencyId],
    references: [agencies.id],
  }),
  createdBy: one(users, {
    fields: [agencyTemplates.createdBy],
    references: [users.id],
  }),
}));

export const clientCardTemplatesRelations = relations(clientCardTemplates, ({ one }) => ({
  agency: one(agencies, {
    fields: [clientCardTemplates.agencyId],
    references: [agencies.id],
  }),
  createdBy: one(users, {
    fields: [clientCardTemplates.createdBy],
    references: [users.id],
  }),
}));

export const leadsRelations = relations(leads, ({ one }) => ({
  agency: one(agencies, {
    fields: [leads.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [leads.clientId],
    references: [clients.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
  convertedToClient: one(clients, {
    fields: [leads.convertedToClientId],
    references: [clients.id],
  }),
  convertedToProject: one(projects, {
    fields: [leads.convertedToProjectId],
    references: [projects.id],
  }),
}));

export const activityLogRelations = relations(activityLog, ({ one }) => ({
  agency: one(agencies, {
    fields: [activityLog.agencyId],
    references: [agencies.id],
  }),
  user: one(users, {
    fields: [activityLog.userId],
    references: [users.id],
  }),
}));

// New Relations
export const clientSettingsRelations = relations(clientSettings, ({ one }) => ({
  client: one(clients, {
    fields: [clientSettings.clientId],
    references: [clients.id],
  }),
}));

export const productsRelations = relations(products, ({ one }) => ({
  agency: one(agencies, {
    fields: [products.agencyId],
    references: [agencies.id],
  }),
  createdBy: one(users, {
    fields: [products.createdBy],
    references: [users.id],
  }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  agency: one(agencies, {
    fields: [quotes.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [quotes.clientId],
    references: [clients.id],
  }),
  createdBy: one(users, {
    fields: [quotes.createdBy],
    references: [users.id],
  }),
}));

export const contractsRelations = relations(contracts, ({ one }) => ({
  agency: one(agencies, {
    fields: [contracts.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [contracts.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [contracts.projectId],
    references: [projects.id],
  }),
  quote: one(quotes, {
    fields: [contracts.quoteId],
    references: [quotes.id],
  }),
  createdBy: one(users, {
    fields: [contracts.createdBy],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  agency: one(agencies, {
    fields: [invoices.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  contract: one(contracts, {
    fields: [invoices.contractId],
    references: [contracts.id],
  }),
  createdBy: one(users, {
    fields: [invoices.createdBy],
    references: [users.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  agency: one(agencies, {
    fields: [payments.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [payments.clientId],
    references: [clients.id],
  }),
  invoice: one(invoices, {
    fields: [payments.invoiceId],
    references: [invoices.id],
  }),
  contract: one(contracts, {
    fields: [payments.contractId],
    references: [contracts.id],
  }),
  project: one(projects, {
    fields: [payments.projectId],
    references: [projects.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertAgencySchema = createInsertSchema(agencies).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("כתובת אימייל לא תקינה"),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים"),
  fullName: z.string().min(2, "השם חייב להכיל לפחות 2 תווים"),
  role: z.enum(["super_admin", "agency_admin", "team_member", "client"]),
  phone: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskCommentSchema = createInsertSchema(taskComments).omit({
  id: true,
  createdAt: true,
});

export const insertDigitalAssetSchema = createInsertSchema(digitalAssets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgencyTemplateSchema = createInsertSchema(agencyTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientCardTemplateSchema = createInsertSchema(clientCardTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export const selectClientCardTemplateSchema = createSelectSchema(clientCardTemplates);

export const insertActivityLogSchema = createInsertSchema(activityLog);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);

// New insert schemas
export const insertClientSettingsSchema = createInsertSchema(clientSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertQuoteSchema = createInsertSchema(quotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Payment related schemas
export const insertPaymentSettingsSchema = createInsertSchema(paymentSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClientPaymentMethodSchema = createInsertSchema(clientPaymentMethods).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRetainerSchema = createInsertSchema(retainers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRetainerTransactionSchema = createInsertSchema(retainerTransactions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOneTimePaymentSchema = createInsertSchema(oneTimePayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;

export type AgencyTemplate = typeof agencyTemplates.$inferSelect;
export type InsertAgencyTemplate = z.infer<typeof insertAgencyTemplateSchema>;

export type ClientCardTemplate = typeof clientCardTemplates.$inferSelect;
export type InsertClientCardTemplate = z.infer<typeof insertClientCardTemplateSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

// New Types
export type ClientSettings = typeof clientSettings.$inferSelect;
export type InsertClientSettings = z.infer<typeof insertClientSettingsSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Quote = typeof quotes.$inferSelect;
export type InsertQuote = z.infer<typeof insertQuoteSchema>;

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

// Payment related types
export type PaymentSettings = typeof paymentSettings.$inferSelect;
export type InsertPaymentSettings = z.infer<typeof insertPaymentSettingsSchema>;

export type ClientPaymentMethod = typeof clientPaymentMethods.$inferSelect;
export type InsertClientPaymentMethod = z.infer<typeof insertClientPaymentMethodSchema>;

export type Retainer = typeof retainers.$inferSelect;
export type InsertRetainer = z.infer<typeof insertRetainerSchema>;

export type RetainerTransaction = typeof retainerTransactions.$inferSelect;
export type InsertRetainerTransaction = z.infer<typeof insertRetainerTransactionSchema>;

export type OneTimePayment = typeof oneTimePayments.$inferSelect;
export type InsertOneTimePayment = z.infer<typeof insertOneTimePaymentSchema>;