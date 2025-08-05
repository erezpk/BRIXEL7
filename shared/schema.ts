import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, integer, boolean, json, date, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users (updated for Replit Auth compatibility)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Legacy fields for backward compatibility and additional functionality
  fullName: text("full_name"),
  password: text("password"), // Optional for Replit Auth users
  role: text("role").default("team_member").notNull(), // super_admin, agency_admin, team_member, client
  agencyId: varchar("agency_id").references(() => agencies.id),
  phone: text("phone"),
  company: text("company"),
  bio: text("bio"),
  avatar: text("avatar"), // Use profileImageUrl for Replit Auth
  isActive: boolean("is_active").default(true).notNull(),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agencies (multi-tenant support)
export const agencies = pgTable("agencies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  industry: text("industry"), // marketing, design, video, therapy, etc.
  settings: json("settings").$type<{
    timezone?: string;
    language?: string;
    currency?: string;
  }>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Clients
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
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
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  clientId: varchar("client_id").references(() => clients.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type"), // website, mobile-app, web-app, ecommerce, social-media, video-editing, graphic-design, other
  status: text("status").default("planning").notNull(), // planning, in_progress, completed, on_hold, cancelled
  priority: text("priority").default("medium").notNull(), // low, medium, high, urgent
  startDate: date("start_date"),
  endDate: date("end_date"),
  budget: integer("budget"), // in agorot (Israeli currency cents)
  assignedTo: varchar("assigned_to").references(() => users.id),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tasks
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  projectId: varchar("project_id").references(() => projects.id),
  clientId: varchar("client_id").references(() => clients.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("new").notNull(), // new, in_progress, completed, cancelled
  priority: text("priority").default("medium").notNull(),
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: date("due_date"),
  estimatedHours: integer("estimated_hours"),
  actualHours: integer("actual_hours"),
  tags: json("tags").$type<string[]>().default([]),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Task Comments
export const taskComments = pgTable("task_comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  taskId: varchar("task_id").notNull().references(() => tasks.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Digital Assets
export const digitalAssets = pgTable("digital_assets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  type: text("type").notNull(), // domain, hosting, ssl, email, etc.
  name: text("name").notNull(),
  provider: text("provider"),
  renewalDate: date("renewal_date"),
  cost: integer("cost"), // in agorot
  loginUrl: text("login_url"),
  username: text("username"),
  password: text("password"), // encrypted
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agency Templates
export const agencyTemplates = pgTable("agency_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").references(() => agencies.id),
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
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Activity Log
export const activityLog = pgTable("activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // created, updated, deleted, commented, etc.
  entityType: text("entity_type").notNull(), // client, project, task, etc.
  entityId: varchar("entity_id"),
  details: json("details").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Ad Accounts (Facebook Ads & Google Ads)
export const adAccounts = pgTable("ad_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  platform: text("platform").notNull(), // facebook, google
  accountId: text("account_id").notNull(),
  accountName: text("account_name").notNull(),
  accessToken: text("access_token"), // encrypted
  refreshToken: text("refresh_token"), // encrypted
  isActive: boolean("is_active").default(true).notNull(),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Leads from Ad Platforms
export const leads = pgTable("leads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  clientId: varchar("client_id").notNull().references(() => clients.id),
  adAccountId: varchar("ad_account_id").notNull().references(() => adAccounts.id),
  externalId: text("external_id").notNull(), // Lead ID from ad platform
  platform: text("platform").notNull(), // facebook, google
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  adSetId: text("ad_set_id"),
  adSetName: text("ad_set_name"),
  adId: text("ad_id"),
  adName: text("ad_name"),
  formName: text("form_name"),
  leadData: jsonb("lead_data").$type<{
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: any;
  }>().notNull(),
  status: text("status").default("new").notNull(), // new, contacted, qualified, converted, rejected
  assignedTo: varchar("assigned_to").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Conversations
export const chatConversations = pgTable("chat_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  clientId: varchar("client_id").references(() => clients.id),
  projectId: varchar("project_id").references(() => projects.id),
  title: text("title").notNull(),
  type: text("type").default("support").notNull(), // support, project, general
  status: text("status").default("active").notNull(), // active, closed, archived
  participants: json("participants").$type<string[]>().default([]), // Array of user IDs
  assignedTo: varchar("assigned_to").references(() => users.id),
  lastMessageAt: timestamp("last_message_at"),
  unreadCount: integer("unread_count").default(0).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull().references(() => chatConversations.id),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  messageType: text("message_type").default("text").notNull(), // text, file, image, system
  attachments: json("attachments").$type<{
    filename: string;
    url: string;
    type: string;
    size: number;
  }[]>().default([]),
  readBy: json("read_by").$type<{
    userId: string;
    readAt: string;
  }[]>().default([]),
  isEdited: boolean("is_edited").default(false).notNull(),
  editedAt: timestamp("edited_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team Member Invitations
export const teamInvitations = pgTable("team_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: varchar("agency_id").notNull().references(() => agencies.id),
  email: text("email").notNull(),
  role: text("role").notNull(), // team_member, client
  token: text("token").notNull().unique(),
  invitedBy: varchar("invited_by").notNull().references(() => users.id),
  clientId: varchar("client_id").references(() => clients.id), // For client invitations
  status: text("status").default("pending").notNull(), // pending, accepted, expired
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // chat_message, task_assigned, lead_received, etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data").$type<Record<string, any>>().default({}),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations
export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  projects: many(projects),
  tasks: many(tasks),
  digitalAssets: many(digitalAssets),
  templates: many(agencyTemplates),
  activityLog: many(activityLog),
  adAccounts: many(adAccounts),
  leads: many(leads),
  chatConversations: many(chatConversations),
  teamInvitations: many(teamInvitations),
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
  assignedLeads: many(leads),
  assignedConversations: many(chatConversations),
  sentMessages: many(chatMessages),
  sentInvitations: many(teamInvitations),
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [clients.agencyId],
    references: [agencies.id],
  }),
  projects: many(projects),
  tasks: many(tasks),
  digitalAssets: many(digitalAssets),
  adAccounts: many(adAccounts),
  leads: many(leads),
  chatConversations: many(chatConversations),
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

// New table relations
export const adAccountsRelations = relations(adAccounts, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [adAccounts.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [adAccounts.clientId],
    references: [clients.id],
  }),
  leads: many(leads),
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
  adAccount: one(adAccounts, {
    fields: [leads.adAccountId],
    references: [adAccounts.id],
  }),
  assignedUser: one(users, {
    fields: [leads.assignedTo],
    references: [users.id],
  }),
}));

export const chatConversationsRelations = relations(chatConversations, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [chatConversations.agencyId],
    references: [agencies.id],
  }),
  client: one(clients, {
    fields: [chatConversations.clientId],
    references: [clients.id],
  }),
  project: one(projects, {
    fields: [chatConversations.projectId],
    references: [projects.id],
  }),
  assignedUser: one(users, {
    fields: [chatConversations.assignedTo],
    references: [users.id],
  }),
  createdBy: one(users, {
    fields: [chatConversations.createdBy],
    references: [users.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  conversation: one(chatConversations, {
    fields: [chatMessages.conversationId],
    references: [chatConversations.id],
  }),
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
  }),
}));

export const teamInvitationsRelations = relations(teamInvitations, ({ one }) => ({
  agency: one(agencies, {
    fields: [teamInvitations.agencyId],
    references: [agencies.id],
  }),
  invitedBy: one(users, {
    fields: [teamInvitations.invitedBy],
    references: [users.id],
  }),
  client: one(clients, {
    fields: [teamInvitations.clientId],
    references: [clients.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
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

export const insertActivityLogSchema = createInsertSchema(activityLog);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);

export const insertAdAccountSchema = createInsertSchema(adAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLeadSchema = createInsertSchema(leads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertTeamInvitationSchema = createInsertSchema(teamInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type Agency = typeof agencies.$inferSelect;
export type InsertAgency = z.infer<typeof insertAgencySchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;

export type AgencyTemplate = typeof agencyTemplates.$inferSelect;
export type InsertAgencyTemplate = z.infer<typeof insertAgencyTemplateSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;

export type AdAccount = typeof adAccounts.$inferSelect;
export type InsertAdAccount = z.infer<typeof insertAdAccountSchema>;

export type Lead = typeof leads.$inferSelect;
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = z.infer<typeof insertTeamInvitationSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;