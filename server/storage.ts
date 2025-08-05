import {
  agencies, users, clients, projects, tasks, taskComments, digitalAssets, agencyTemplates, activityLog, passwordResetTokens,
  adAccounts, leads, chatConversations, chatMessages, teamInvitations, notifications,
  type Agency, type InsertAgency,
  type User, type InsertUser, type UpsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  type DigitalAsset, type InsertDigitalAsset,
  type AgencyTemplate, type InsertAgencyTemplate,
  type ActivityLog,
  type AdAccount, type InsertAdAccount,
  type Lead, type InsertLead,
  type ChatConversation, type InsertChatConversation,
  type ChatMessage, type InsertChatMessage,
  type TeamInvitation, type InsertTeamInvitation,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, gte, lte, isNull, or, sql, gt } from "drizzle-orm";
import bcrypt from "bcrypt";
import crypto from 'crypto';

export interface IStorage {
  // Auth (standard CRM auth)
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

  // Replit Auth required methods
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Agencies
  getAgency(id: string): Promise<Agency | undefined>;
  getAgencyById(id: string): Promise<Agency | undefined>;
  getAgencyBySlug(slug: string): Promise<Agency | undefined>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  updateAgency(id: string, agency: Partial<InsertAgency>): Promise<Agency>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUsersByAgency(agencyId: string): Promise<User[]>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;

  // Clients
  getClient(id: string): Promise<Client | undefined>;
  getClientsByAgency(agencyId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;

  // Projects
  getProject(id: string): Promise<Project | undefined>;
  getProjectsByAgency(agencyId: string): Promise<Project[]>;
  getProjectsByClient(clientId: string): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: string, project: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: string): Promise<void>;

  // Tasks
  getTask(id: string): Promise<Task | undefined>;
  getTasksByAgency(agencyId: string, filters?: {
    status?: string;
    assignedTo?: string;
    clientId?: string;
    projectId?: string;
  }): Promise<Task[]>;
  getTasksByProject(projectId: string): Promise<Task[]>;
  getTasksByUser(userId: string): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  // Task Comments
  getTaskComments(taskId: string): Promise<TaskComment[]>;
  createTaskComment(comment: InsertTaskComment): Promise<TaskComment>;

  // Digital Assets
  getDigitalAsset(id: string): Promise<DigitalAsset | undefined>;
  getDigitalAssetsByAgency(agencyId: string): Promise<DigitalAsset[]>;
  getDigitalAssetsByClient(clientId: string): Promise<DigitalAsset[]>;
  createDigitalAsset(asset: InsertDigitalAsset): Promise<DigitalAsset>;
  updateDigitalAsset(id: string, asset: Partial<InsertDigitalAsset>): Promise<DigitalAsset>;
  deleteDigitalAsset(id: string): Promise<void>;

  // Templates
  getAgencyTemplates(agencyId: string): Promise<AgencyTemplate[]>;
  getPublicTemplates(): Promise<AgencyTemplate[]>;
  createAgencyTemplate(template: InsertAgencyTemplate): Promise<AgencyTemplate>;

  // Activity Log
  logActivity(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void>;
  getActivityLog(agencyId: string, limit?: number): Promise<ActivityLog[]>;

  // Dashboard Stats
  getDashboardStats(agencyId: string): Promise<{
    activeProjects: number;
    tasksToday: number;
    activeClients: number;
    completedTasksThisMonth: number;
  }>;

  // Password Reset Tokens
  createPasswordResetToken(userId: string, token: string): Promise<void>;
  validatePasswordResetToken(token: string): Promise<string | null>;
  markPasswordResetTokenAsUsed(token: string): Promise<void>;
  updateUserPassword(userId: string, hashedPassword: string): Promise<void>;

  // Google OAuth
  createOrUpdateUserFromGoogle(email: string, name: string, avatar?: string): Promise<User>;

  // Ad Accounts
  getAdAccountsByClient(clientId: string): Promise<AdAccount[]>;
  createAdAccount(adAccount: InsertAdAccount): Promise<AdAccount>;
  updateAdAccount(id: string, adAccount: Partial<InsertAdAccount>): Promise<AdAccount>;

  // Leads
  getLeadsByClient(clientId: string): Promise<Lead[]>;
  getLeadsByAgency(agencyId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;

  // Chat
  getChatConversationsByUser(userId: string): Promise<ChatConversation[]>;
  getChatConversation(id: string): Promise<ChatConversation | undefined>;
  createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation>;
  getChatMessages(conversationId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  markMessagesAsRead(conversationId: string, userId: string): Promise<void>;

  // Team Invitations
  createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation>;
  getTeamInvitation(token: string): Promise<TeamInvitation | undefined>;
  acceptTeamInvitation(token: string): Promise<void>;
  updateTeamInvitation(token: string, status: string): Promise<TeamInvitation>;

  // Notifications
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string): Promise<Notification[]>;
  markNotificationAsRead(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor(private db: any) {} // Assuming db is injected or initialized elsewhere

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = result[0] || null;

    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(insertUser.password);
    const [user] = await this.db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await this.db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  async getAgency(id: string): Promise<Agency | undefined> {
    const [agency] = await this.db.select().from(agencies).where(eq(agencies.id, id));
    return agency || undefined;
  }

  async getAgencyById(id: string): Promise<Agency | undefined> {
    const [agency] = await this.db.select().from(agencies).where(eq(agencies.id, id));
    return agency || undefined;
  }

  async getAgencyBySlug(slug: string): Promise<Agency | undefined> {
    const [agency] = await this.db.select().from(agencies).where(eq(agencies.slug, slug));
    return agency || undefined;
  }

  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const [agency] = await this.db
      .insert(agencies)
      .values(insertAgency as any)
      .returning();
    return agency;
  }

  async updateAgency(id: string, updateAgency: Partial<InsertAgency>): Promise<Agency> {
    const updateData: any = { ...updateAgency, updatedAt: new Date() };

    // Handle settings properly
    if (updateAgency.settings) {
      updateData.settings = updateAgency.settings;
    }

    const [agency] = await this.db
      .update(agencies)
      .set(updateData)
      .where(eq(agencies.id, id))
      .returning();
    return agency;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsersByAgency(agencyId: string): Promise<User[]> {
    return this.db.select().from(users).where(eq(users.agencyId, agencyId)).orderBy(asc(users.fullName));
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await this.db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientsByAgency(agencyId: string): Promise<Client[]> {
    return this.db.select().from(clients).where(eq(clients.agencyId, agencyId)).orderBy(asc(clients.name));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await this.db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updateClient: Partial<InsertClient>): Promise<Client> {
    const [client] = await this.db
      .update(clients)
      .set({ ...updateClient, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await this.db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByAgency(agencyId: string): Promise<Project[]> {
    return this.db.select().from(projects).where(eq(projects.agencyId, agencyId)).orderBy(desc(projects.createdAt));
  }

  async getProjectsByClient(clientId: string): Promise<Project[]>{
    return this.db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, updateProject: Partial<InsertProject>): Promise<Project> {
    const [project] = await this.db
      .update(projects)
      .set({ ...updateProject, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await this.db.delete(projects).where(eq(projects.id, id));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await this.db.select().from(tasks).where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasksByAgency(agencyId: string, filters?: {
    status?: string;
    assignedTo?: string;
    clientId?: string;
    projectId?: string;
  }): Promise<Task[]> {
    const conditions = [eq(tasks.agencyId, agencyId)];

    if (filters?.status) {
      conditions.push(eq(tasks.status, filters.status));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(tasks.assignedTo, filters.assignedTo));
    }
    if (filters?.clientId) {
      conditions.push(eq(tasks.clientId, filters.clientId));
    }
    if (filters?.projectId) {
      conditions.push(eq(tasks.projectId, filters.projectId));
    }

    return this.db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.db.select().from(tasks).where(eq(tasks.projectId, projectId)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return this.db.select().from(tasks).where(eq(tasks.assignedTo, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const [task] = await this.db
      .insert(tasks)
      .values(insertTask as any)
      .returning();
    return task;
  }

  async updateTask(id: string, updateTask: Partial<InsertTask>): Promise<Task> {
    const updateData: any = { ...updateTask, updatedAt: new Date() };

    // Handle tags array properly
    if (updateTask.tags) {
      updateData.tags = Array.isArray(updateTask.tags) ? updateTask.tags : [];
    }

    const [task] = await this.db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await this.db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return this.db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(asc(taskComments.createdAt));
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await this.db
      .insert(taskComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getDigitalAsset(id: string): Promise<DigitalAsset | undefined> {
    const [asset] = await this.db.select().from(digitalAssets).where(eq(digitalAssets.id, id));
    return asset || undefined;
  }

  async getDigitalAssetsByAgency(agencyId: string): Promise<DigitalAsset[]> {
    return this.db.select().from(digitalAssets).where(eq(digitalAssets.agencyId, agencyId)).orderBy(asc(digitalAssets.renewalDate));
  }

  async getDigitalAssetsByClient(clientId: string): Promise<DigitalAsset[]> {
    return this.db.select().from(digitalAssets).where(eq(digitalAssets.clientId, clientId)).orderBy(asc(digitalAssets.renewalDate));
  }

  async createDigitalAsset(insertAsset: InsertDigitalAsset): Promise<DigitalAsset> {
    const [asset] = await this.db
      .insert(digitalAssets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateDigitalAsset(id: string, updateAsset: Partial<InsertDigitalAsset>): Promise<DigitalAsset> {
    const [asset] = await this.db
      .update(digitalAssets)
      .set({ ...updateAsset, updatedAt: new Date() })
      .where(eq(digitalAssets.id, id))
      .returning();
    return asset;
  }

  async deleteDigitalAsset(id: string): Promise<void> {
    await this.db.delete(digitalAssets).where(eq(digitalAssets.id, id));
  }

  async getAgencyTemplates(agencyId: string): Promise<AgencyTemplate[]> {
    return this.db.select().from(agencyTemplates).where(eq(agencyTemplates.agencyId, agencyId)).orderBy(desc(agencyTemplates.createdAt));
  }

  async getPublicTemplates(): Promise<AgencyTemplate[]> {
    return this.db.select().from(agencyTemplates).where(eq(agencyTemplates.isPublic, true)).orderBy(desc(agencyTemplates.createdAt));
  }

  async createAgencyTemplate(insertTemplate: InsertAgencyTemplate): Promise<AgencyTemplate> {
    const [template] = await this.db
      .insert(agencyTemplates)
      .values(insertTemplate as any)
      .returning();
    return template;
  }

  async logActivity(activityData: any): Promise<void> {
    await this.db.insert(activityLog).values(activityData);
  }

  async getActivityLog(agencyId: string, limit: number = 50): Promise<ActivityLog[]> {
    return this.db.select().from(activityLog)
      .where(eq(activityLog.agencyId, agencyId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);
  }

  async getDashboardStats(agencyId: string): Promise<{
    activeProjects: number;
    tasksToday: number;
    activeClients: number;
    completedTasksThisMonth: number;
  }> {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [activeProjectsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.agencyId, agencyId), eq(projects.status, 'active')));

    const [tasksTodayResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.agencyId, agencyId),
        eq(tasks.dueDate, today.toISOString().split('T')[0])
      ));

    const [activeClientsResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(eq(clients.agencyId, agencyId), eq(clients.status, 'active')));

    const [completedTasksResult] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.agencyId, agencyId),
        eq(tasks.status, 'completed'),
        gte(tasks.updatedAt, startOfMonth)
      ));

    return {
      activeProjects: activeProjectsResult?.count || 0,
      tasksToday: tasksTodayResult?.count || 0,
      activeClients: activeClientsResult?.count || 0,
      completedTasksThisMonth: completedTasksResult?.count || 0,
    };
  }

  // Password reset tokens
  async createPasswordResetToken(userId: string, token: string): Promise<void> {
    // Delete any existing tokens for this user
    await this.db.delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));

    // Create new token (expires in 24 hours)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.db.insert(passwordResetTokens)
      .values({
        userId,
        token,
        expiresAt,
        used: false
      });
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    const [tokenRecord] = await this.db.select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        eq(passwordResetTokens.used, false),
        gt(passwordResetTokens.expiresAt, new Date())
      ));

    return tokenRecord ? tokenRecord.userId : null;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<void> {
    const [user] = await this.db.update(users).set({ password: hashedPassword }).where(eq(users.id, userId)).returning();
    return;
  }

  async createOrUpdateUserFromGoogle(email: string, name: string, avatar?: string): Promise<User> {
    // Check if user exists
    let user = await this.getUserByEmail(email);

    if (user) {
      // Update existing user
      const [updated] = await this.db.update(users)
        .set({
          fullName: name,
          avatar: avatar,
          lastLogin: new Date(),
          updatedAt: new Date()
        })
        .where(eq(users.email, email))
        .returning();
      return updated;
    } else {
      // Create new user
      const [created] = await this.db.insert(users).values({
        email,
        fullName: name,
        role: 'client', // Default role for Google sign-in users
        isActive: true,
        avatar: avatar,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();
      return created;
    }
  }

  async createUserWithPassword(email: string, fullName: string, password: string, role: string = 'client') {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    const [user] = await db.insert(users).values({
      email,
      fullName,
      password: hashedPassword,
      role,
      isActive: true,
      createdAt: new Date(),
    }).returning();

    return user;
  }

  // Ad Accounts
  async getAdAccountsByClient(clientId: string): Promise<AdAccount[]> {
    return this.db.query.adAccounts.findMany({
      where: eq(adAccounts.clientId, clientId),
      orderBy: [desc(adAccounts.createdAt)]
    });
  }

  async createAdAccount(adAccount: InsertAdAccount): Promise<AdAccount> {
    const [created] = await this.db.insert(adAccounts).values([adAccount]).returning();
    return created;
  }

  async updateAdAccount(id: string, adAccount: Partial<InsertAdAccount>): Promise<AdAccount> {
    const [updated] = await this.db.update(adAccounts)
      .set(adAccount)
      .where(eq(adAccounts.id, id))
      .returning();
    return updated;
  }

  // Leads
  async getLeadsByClient(clientId: string): Promise<Lead[]> {
    return this.db.query.leads.findMany({
      where: eq(leads.clientId, clientId),
      orderBy: [desc(leads.createdAt)]
    });
  }

  async getLeadsByAgency(agencyId: string): Promise<Lead[]>{
    return this.db.query.leads.findMany({
      where: eq(leads.agencyId, agencyId),
      orderBy: [desc(leads.createdAt)]
    });
  }

  async createLead(lead: InsertLead): Promise<Lead> {
    const [created] = await this.db.insert(leads).values([lead]).returning();
    return created;
  }

  async updateLead(id: string, leadData: Partial<InsertLead>): Promise<Lead> {
    const [updated] = await this.db.update(leads)
      .set(leadData)
      .where(eq(leads.id, id))
      .returning();
    return updated;
  }

  // Chat
  async getChatConversationsByUser(userId: string): Promise<ChatConversation[]> {
    return this.db.query.chatConversations.findMany({
      where: or(
        eq(chatConversations.createdBy, userId),
        eq(chatConversations.assignedTo, userId),
        sql`${chatConversations.participants} @> ${JSON.stringify([userId])}`
      ),
      orderBy: [desc(chatConversations.lastMessageAt)]
    });
  }

  async getChatConversation(id: string): Promise<ChatConversation | undefined> {
    return this.db.query.chatConversations.findFirst({
      where: eq(chatConversations.id, id)
    });
  }

  async createChatConversation(conversation: InsertChatConversation): Promise<ChatConversation> {
    const [created] = await this.db.insert(chatConversations).values([conversation]).returning();
    return created;
  }

  async getChatMessages(conversationId: string): Promise<ChatMessage[]> {
    return this.db.query.chatMessages.findMany({
      where: eq(chatMessages.conversationId, conversationId),
      orderBy: [asc(chatMessages.createdAt)]
    });
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await this.db.insert(chatMessages).values([message]).returning();

    // Update conversation's last message timestamp
    await this.db.update(chatConversations)
      .set({
        lastMessageAt: new Date(),
        unreadCount: sql`${chatConversations.unreadCount} + 1`
      })
      .where(eq(chatConversations.id, message.conversationId));

    return created;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    // Reset unread count for the conversation
    await this.db.update(chatConversations)
      .set({ unreadCount: 0 })
      .where(eq(chatConversations.id, conversationId));
  }

  // Team Invitations
  async createTeamInvitation(invitation: InsertTeamInvitation): Promise<TeamInvitation> {
    const [created] = await this.db.insert(teamInvitations).values([invitation]).returning();
    return created;
  }

  async getTeamInvitation(token: string): Promise<TeamInvitation | undefined> {
    return this.db.query.teamInvitations.findFirst({
      where: and(
        eq(teamInvitations.token, token),
        eq(teamInvitations.status, 'pending'),
        gt(teamInvitations.expiresAt, new Date())
      )
    });
  }

  async acceptTeamInvitation(token: string): Promise<void> {
    await this.db.update(teamInvitations)
      .set({
        status: 'accepted',
        acceptedAt: new Date()
      })
      .where(eq(teamInvitations.token, token));
  }

  async updateTeamInvitation(token: string, status: string): Promise<TeamInvitation> {
    const [updated] = await this.db.update(teamInvitations)
      .set({ status, updatedAt: new Date() })
      .where(eq(teamInvitations.token, token))
      .returning();
    return updated;
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [created] = await this.db.insert(notifications).values([notification]).returning();
    return created;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit: 50
    });
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await this.db.update(notifications)
      .set({
        isRead: true,
        readAt: new Date()
      })
      .where(eq(notifications.id, id));
  }
}

export const storage = new DatabaseStorage(db);