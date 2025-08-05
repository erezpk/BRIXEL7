import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamp, integer, boolean, json, date, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Agencies (multi-tenant support)
export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Leads (Facebook Ads & Google Ads Integration)
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  agencyId: uuid("agency_id").notNull().references(() => agencies.id),
  clientId: uuid("client_id").references(() => clients.id),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  source: text("source").notNull(), // facebook_ads, google_ads, manual, website, referral
  sourceId: text("source_id"), // external lead ID from Facebook/Google
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

// Password Reset Tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});


// Relations
export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  projects: many(projects),
  tasks: many(tasks),
  leads: many(leads),
  digitalAssets: many(digitalAssets),
  templates: many(agencyTemplates),
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
  projects: many(projects),
  tasks: many(tasks),
  leads: many(leads),
  digitalAssets: many(digitalAssets),
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

export const insertActivityLogSchema = createInsertSchema(activityLog);
export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens);

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
export type InsertLead = z.infer<typeof insertLeadSchema>;

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = z.infer<typeof insertTaskCommentSchema>;

export type DigitalAsset = typeof digitalAssets.$inferSelect;
export type InsertDigitalAsset = z.infer<typeof insertDigitalAssetSchema>;

export type AgencyTemplate = typeof agencyTemplates.$inferSelect;
export type InsertAgencyTemplate = z.infer<typeof insertAgencyTemplateSchema>;

export type ActivityLog = typeof activityLog.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;