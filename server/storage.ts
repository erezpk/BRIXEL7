import {
  agencies, users, clients, projects, tasks, leads, taskComments, digitalAssets, agencyTemplates, clientCardTemplates, activityLog, passwordResetTokens,
  clientSettings, products, quotes, contracts, invoices, payments,
  type Agency, type InsertAgency,
  type User, type InsertUser,
  type Client, type InsertClient,
  type ClientSettings, type InsertClientSettings,
  type Product, type InsertProduct,
  type Quote, type InsertQuote,
  type Contract, type InsertContract,
  type Invoice, type InsertInvoice,
  type Payment, type InsertPayment,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type Lead, type InsertLead,
  type TaskComment, type InsertTaskComment,
  type DigitalAsset, type InsertDigitalAsset,
  type AgencyTemplate, type InsertAgencyTemplate,
  type ClientCardTemplate, type InsertClientCardTemplate,
  type ActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, gte, lte, isNull, or, sql, gt } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;

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
  getProjectsByAssignedUser(userId: string): Promise<Project[]>;
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

  // Leads
  getLead(id: string): Promise<Lead | undefined>;
  getLeadsByAgency(agencyId: string, filters?: {
    status?: string;
    source?: string;
    assignedTo?: string;
    clientId?: string;
  }): Promise<Lead[]>;
  getLeadsByClient(clientId: string): Promise<Lead[]>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: string, lead: Partial<InsertLead>): Promise<Lead>;
  deleteLead(id: string): Promise<void>;
  convertLeadToClient(leadId: string, clientData: InsertClient): Promise<{ lead: Lead; client: Client }>;
  syncLeadsFromFacebook(agencyId: string, accessToken: string): Promise<Lead[]>;
  syncLeadsFromGoogle(agencyId: string, accessToken: string): Promise<Lead[]>;

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

  // Client Card Templates
  getClientCardTemplate(id: string): Promise<ClientCardTemplate | undefined>;
  getClientCardTemplatesByAgency(agencyId: string): Promise<ClientCardTemplate[]>;
  createClientCardTemplate(template: InsertClientCardTemplate): Promise<ClientCardTemplate>;
  updateClientCardTemplate(id: string, template: Partial<InsertClientCardTemplate>): Promise<ClientCardTemplate>;
  deleteClientCardTemplate(id: string): Promise<void>;

  // Activity Log
  logActivity(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void>;
  getActivityLog(agencyId: string, limit?: number): Promise<ActivityLog[]>;
  getActivityLogByUser(userId: string, limit?: number): Promise<ActivityLog[]>;

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

  // Client Settings
  getClientSettings(clientId: string): Promise<ClientSettings | undefined>;
  createClientSettings(settings: InsertClientSettings): Promise<ClientSettings>;
  updateClientSettings(clientId: string, settings: Partial<InsertClientSettings>): Promise<ClientSettings>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductsByAgency(agencyId: string): Promise<Product[]>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;

  // Quotes
  getQuote(id: string): Promise<Quote | undefined>;
  getQuotesByAgency(agencyId: string): Promise<Quote[]>;
  getQuotesByClient(clientId: string): Promise<Quote[]>;
  createQuote(quote: InsertQuote): Promise<Quote>;
  updateQuote(id: string, quote: Partial<InsertQuote>): Promise<Quote>;
  deleteQuote(id: string): Promise<void>;

  // Contracts
  getContract(id: string): Promise<Contract | undefined>;
  getContractsByAgency(agencyId: string): Promise<Contract[]>;
  getContractsByClient(clientId: string): Promise<Contract[]>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, contract: Partial<InsertContract>): Promise<Contract>;
  deleteContract(id: string): Promise<void>;

  // Invoices
  getInvoice(id: string): Promise<Invoice | undefined>;
  getInvoicesByAgency(agencyId: string): Promise<Invoice[]>;
  getInvoicesByClient(clientId: string): Promise<Invoice[]>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: string): Promise<void>;

  // Payments
  getPayment(id: string): Promise<Payment | undefined>;
  getPaymentsByAgency(agencyId: string): Promise<Payment[]>;
  getPaymentsByClient(clientId: string): Promise<Payment[]>;
  getPaymentsByInvoice(invoiceId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment>;
  deletePayment(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  constructor(private db: any) {} // Assuming db is injected or available

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.db.query.users.findFirst({
      where: eq(users.email, email),
    });
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

  // Get projects by assigned user
  async getProjectsByAssignedUser(userId: string): Promise<Project[]> {
    const result = await this.db
      .select()
      .from(projects)
      .where(eq(projects.assignedTo, userId))
      .orderBy(desc(projects.createdAt));

    return result;
  }

  // Get activity log by user
  async getActivityLogByUser(userId: string, limit: number = 20): Promise<ActivityLog[]> {
    const result = await this.db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt))
      .limit(limit);

    return result;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await this.db
      .insert(projects)
      .values(insertProject as any)
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

  // Client Card Templates
  async getClientCardTemplate(id: string): Promise<ClientCardTemplate | undefined> {
    return this.db.query.clientCardTemplates.findFirst({
      where: eq(clientCardTemplates.id, id),
    });
  }

  async getClientCardTemplatesByAgency(agencyId: string): Promise<ClientCardTemplate[]> {
    return this.db.query.clientCardTemplates.findMany({
      where: eq(clientCardTemplates.agencyId, agencyId),
      orderBy: [desc(clientCardTemplates.createdAt)],
    });
  }

  async createClientCardTemplate(insertTemplate: InsertClientCardTemplate): Promise<ClientCardTemplate> {
    const [template] = await this.db
      .insert(clientCardTemplates)
      .values(insertTemplate as any)
      .returning();
    return template;
  }

  async updateClientCardTemplate(id: string, updateTemplate: Partial<InsertClientCardTemplate>): Promise<ClientCardTemplate> {
    const [template] = await this.db
      .update(clientCardTemplates)
      .set({ ...updateTemplate, updatedAt: new Date() } as any)
      .where(eq(clientCardTemplates.id, id))
      .returning();
    return template;
  }

  async deleteClientCardTemplate(id: string): Promise<void> {
    await this.db.delete(clientCardTemplates).where(eq(clientCardTemplates.id, id));
  }

  async logActivity(activityData: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
    await this.db.insert(activityLog).values({...activityData, createdAt: new Date()});
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
    await this.db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  // Leads methods
  async getLead(id: string): Promise<Lead | undefined> {
    const [lead] = await this.db.select().from(leads).where(eq(leads.id, id));
    return lead || undefined;
  }

  async getLeadsByAgency(agencyId: string, filters?: {
    status?: string;
    source?: string;
    assignedTo?: string;
    clientId?: string;
  }): Promise<Lead[]> {
    const conditions = [eq(leads.agencyId, agencyId)];

    if (filters?.status) {
      conditions.push(eq(leads.status, filters.status));
    }
    if (filters?.source) {
      conditions.push(eq(leads.source, filters.source));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(leads.assignedTo, filters.assignedTo));
    }
    if (filters?.clientId) {
      conditions.push(eq(leads.clientId, filters.clientId));
    }

    return this.db.select().from(leads).where(and(...conditions)).orderBy(desc(leads.createdAt));
  }

  async getLeadsByClient(clientId: string): Promise<Lead[]> {
    return this.db.select().from(leads).where(eq(leads.clientId, clientId)).orderBy(desc(leads.createdAt));
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const [lead] = await this.db
      .insert(leads)
      .values(insertLead as any)
      .returning();
    return lead;
  }

  async updateLead(id: string, updateLead: Partial<InsertLead>): Promise<Lead> {
    const [lead] = await this.db
      .update(leads)
      .set({ ...updateLead, updatedAt: new Date() })
      .where(eq(leads.id, id))
      .returning();
    return lead;
  }

  async deleteLead(id: string): Promise<void> {
    await this.db.delete(leads).where(eq(leads.id, id));
  }

  async convertLeadToClient(leadId: string, clientData: InsertClient): Promise<{ lead: Lead; client: Client }> {
    const client = await this.createClient(clientData);
    const lead = await this.updateLead(leadId, {
      status: 'converted',
      convertedToClientId: client.id
    });
    return { lead, client };
  }

  async syncLeadsFromFacebook(agencyId: string, accessToken: string): Promise<Lead[]> {
    return [];
  }

  async syncLeadsFromGoogle(agencyId: string, accessToken: string): Promise<Lead[]> {
    return [];
  }

  // Client Settings
  async getClientSettings(clientId: string): Promise<ClientSettings | undefined> {
    const [settings] = await this.db.select().from(clientSettings).where(eq(clientSettings.clientId, clientId));
    return settings || undefined;
  }

  async createClientSettings(insertSettings: InsertClientSettings): Promise<ClientSettings> {
    const [settings] = await this.db
      .insert(clientSettings)
      .values(insertSettings as any)
      .returning();
    return settings;
  }

  async updateClientSettings(clientId: string, updateSettings: Partial<InsertClientSettings>): Promise<ClientSettings> {
    const [settings] = await this.db
      .update(clientSettings)
      .set({ ...updateSettings, updatedAt: new Date() } as any)
      .where(eq(clientSettings.clientId, clientId))
      .returning();
    return settings;
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByAgency(agencyId: string): Promise<Product[]> {
    return await this.db.select().from(products)
      .where(and(eq(products.agencyId, agencyId), eq(products.isActive, true)))
      .orderBy(asc(products.name));
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const [product] = await this.db
      .insert(products)
      .values(insertProduct as any)
      .returning();
    return product;
  }

  async updateProduct(id: string, updateProduct: Partial<InsertProduct>): Promise<Product> {
    const [product] = await this.db
      .update(products)
      .set({ ...updateProduct, updatedAt: new Date() } as any)
      .where(eq(products.id, id))
      .returning();
    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.db.delete(products).where(eq(products.id, id));
  }

  // Quotes
  async getQuote(id: string): Promise<Quote | undefined> {
    const [quote] = await this.db.select().from(quotes).where(eq(quotes.id, id));
    return quote || undefined;
  }

  async getQuotesByAgency(agencyId: string): Promise<Quote[]> {
    try {
      const result = await this.db.select()
        .from(quotes)
        .where(eq(quotes.agencyId, agencyId))
        .orderBy(desc(quotes.createdAt));

      return result;
    } catch (error) {
      console.error('Error in getQuotesByAgency:', error);
      throw error;
    }
  }

  async getQuotesByClient(clientId: string): Promise<Quote[]> {
    return await this.db.select().from(quotes)
      .where(eq(quotes.clientId, clientId))
      .orderBy(desc(quotes.createdAt));
  }

  async createQuote(insertQuote: InsertQuote): Promise<Quote> {
    const [quote] = await this.db
      .insert(quotes)
      .values(insertQuote as any)
      .returning();
    return quote;
  }

  async updateQuote(id: string, updateQuote: Partial<InsertQuote>): Promise<Quote> {
    const [quote] = await this.db
      .update(quotes)
      .set({ ...updateQuote, updatedAt: new Date() } as any)
      .where(eq(quotes.id, id))
      .returning();
    return quote;
  }

  async deleteQuote(id: string): Promise<void> {
    await this.db.delete(quotes).where(eq(quotes.id, id));
  }

  // Contracts
  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await this.db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async getContractsByAgency(agencyId: string): Promise<Contract[]> {
    return await this.db.select().from(contracts)
      .where(eq(contracts.agencyId, agencyId))
      .orderBy(desc(contracts.createdAt));
  }

  async getContractsByClient(clientId: string): Promise<Contract[] {
    return await this.db.select().from(contracts)
      .where(eq(contracts.clientId, clientId))
      .orderBy(desc(contracts.createdAt));
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await this.db
      .insert(contracts)
      .values(insertContract as any)
      .returning();
    return contract;
  }

  async updateContract(id: string, updateContract: Partial<InsertContract>): Promise<Contract> {
    const [contract] = await this.db
      .update(contracts)
      .set({ ...updateContract, updatedAt: new Date() } as any)
      .where(eq(contracts.id, id))
      .returning();
    return contract;
  }

  async deleteContract(id: string): Promise<void> {
    await this.db.delete(contracts).where(eq(contracts.id, id));
  }

  // Invoices
  async getInvoice(id: string): Promise<Invoice | undefined> {
    const [invoice] = await this.db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || undefined;
  }

  async getInvoicesByAgency(agencyId: string): Promise<Invoice[]> {
    return await this.db.select().from(invoices)
      .where(eq(invoices.agencyId, agencyId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoicesByClient(clientId: string): Promise<Invoice[]> {
    return await this.db.select().from(invoices)
      .where(eq(invoices.clientId, clientId))
      .orderBy(desc(invoices.createdAt));
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await this.db
      .insert(invoices)
      .values(insertInvoice as any)
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, updateInvoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [invoice] = await this.db
      .update(invoices)
      .set({ ...updateInvoice, updatedAt: new Date() } as any)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    await this.db.delete(invoices).where(eq(invoices.id, id));
  }

  // Payments
  async getPayment(id: string): Promise<Payment | undefined> {
    const [payment] = await this.db.select().from(payments).where(eq(payments.id, id));
    return payment || undefined;
  }

  async getPaymentsByAgency(agencyId: string): Promise<Payment[]> {
    return await this.db.select().from(payments)
      .where(eq(payments.agencyId, agencyId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return await this.db.select().from(payments)
      .where(eq(payments.clientId, clientId))
      .orderBy(desc(payments.createdAt));
  }

  async getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
    return await this.db.select().from(payments)
      .where(eq(payments.invoiceId, invoiceId))
      .orderBy(desc(payments.createdAt));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await this.db
      .insert(payments)
      .values(insertPayment as any)
      .returning();
    return payment;
  }

  async updatePayment(id: string, updatePayment: Partial<InsertPayment>): Promise<Payment> {
    const [payment] = await this.db
      .update(payments)
      .set({ ...updatePayment, updatedAt: new Date() } as any)
      .where(eq(payments.id, id))
      .returning();
    return payment;
  }

  async deletePayment(id: string): Promise<void> {
    await this.db.delete(payments).where(eq(payments.id, id));
  }
}

export const storage = new DatabaseStorage(db);