import { 
  agencies, users, clients, projects, tasks, taskComments, digitalAssets, agencyTemplates, activityLog,
  type Agency, type InsertAgency,
  type User, type InsertUser,
  type Client, type InsertClient,
  type Project, type InsertProject,
  type Task, type InsertTask,
  type TaskComment, type InsertTaskComment,
  type DigitalAsset, type InsertDigitalAsset,
  type AgencyTemplate, type InsertAgencyTemplate,
  type ActivityLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, like, gte, lte, isNull, or, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Auth
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validatePassword(password: string, hash: string): Promise<boolean>;
  hashPassword(password: string): Promise<string>;
  
  // Agencies
  getAgency(id: string): Promise<Agency | undefined>;
  getAgencyBySlug(slug: string): Promise<Agency | undefined>;
  createAgency(agency: InsertAgency): Promise<Agency>;
  updateAgency(id: string, agency: Partial<InsertAgency>): Promise<Agency>;
  
  // Users
  getUser(id: string): Promise<User | undefined>;
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
}

export class DatabaseStorage implements IStorage {
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await this.hashPassword(insertUser.password);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async getAgency(id: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.id, id));
    return agency || undefined;
  }

  async getAgencyBySlug(slug: string): Promise<Agency | undefined> {
    const [agency] = await db.select().from(agencies).where(eq(agencies.slug, slug));
    return agency || undefined;
  }

  async createAgency(insertAgency: InsertAgency): Promise<Agency> {
    const agencyData = {
      ...insertAgency,
      settings: insertAgency.settings || {}
    };
    
    const [agency] = await db
      .insert(agencies)
      .values(agencyData)
      .returning();
    return agency;
  }

  async updateAgency(id: string, updateAgency: Partial<InsertAgency>): Promise<Agency> {
    const updateData: any = { ...updateAgency, updatedAt: new Date() };
    
    // Handle settings properly
    if (updateAgency.settings) {
      updateData.settings = updateAgency.settings;
    }
    
    const [agency] = await db
      .update(agencies)
      .set(updateData)
      .where(eq(agencies.id, id))
      .returning();
    return agency;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUsersByAgency(agencyId: string): Promise<User[]> {
    return db.select().from(users).where(eq(users.agencyId, agencyId)).orderBy(asc(users.fullName));
  }

  async updateUser(id: string, updateUser: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updateUser, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getClientsByAgency(agencyId: string): Promise<Client[]> {
    return db.select().from(clients).where(eq(clients.agencyId, agencyId)).orderBy(asc(clients.name));
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: string, updateClient: Partial<InsertClient>): Promise<Client> {
    const [client] = await db
      .update(clients)
      .set({ ...updateClient, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: string): Promise<void> {
    await db.delete(clients).where(eq(clients.id, id));
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async getProjectsByAgency(agencyId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.agencyId, agencyId)).orderBy(desc(projects.createdAt));
  }

  async getProjectsByClient(clientId: string): Promise<Project[]> {
    return db.select().from(projects).where(eq(projects.clientId, clientId)).orderBy(desc(projects.createdAt));
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const [project] = await db
      .insert(projects)
      .values(insertProject)
      .returning();
    return project;
  }

  async updateProject(id: string, updateProject: Partial<InsertProject>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({ ...updateProject, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  async getTask(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
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
    
    return db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.createdAt));
  }

  async getTasksByUser(userId: string): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.assignedTo, userId)).orderBy(desc(tasks.createdAt));
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const taskData = {
      ...insertTask,
      tags: insertTask.tags || []
    };
    
    const [task] = await db
      .insert(tasks)
      .values(taskData)
      .returning();
    return task;
  }

  async updateTask(id: string, updateTask: Partial<InsertTask>): Promise<Task> {
    const updateData: any = { ...updateTask, updatedAt: new Date() };
    
    // Handle tags array properly
    if (updateTask.tags) {
      updateData.tags = Array.isArray(updateTask.tags) ? updateTask.tags : [];
    }
    
    const [task] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  async getTaskComments(taskId: string): Promise<TaskComment[]> {
    return db.select().from(taskComments).where(eq(taskComments.taskId, taskId)).orderBy(asc(taskComments.createdAt));
  }

  async createTaskComment(insertComment: InsertTaskComment): Promise<TaskComment> {
    const [comment] = await db
      .insert(taskComments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async getDigitalAsset(id: string): Promise<DigitalAsset | undefined> {
    const [asset] = await db.select().from(digitalAssets).where(eq(digitalAssets.id, id));
    return asset || undefined;
  }

  async getDigitalAssetsByAgency(agencyId: string): Promise<DigitalAsset[]> {
    return db.select().from(digitalAssets).where(eq(digitalAssets.agencyId, agencyId)).orderBy(asc(digitalAssets.renewalDate));
  }

  async getDigitalAssetsByClient(clientId: string): Promise<DigitalAsset[]> {
    return db.select().from(digitalAssets).where(eq(digitalAssets.clientId, clientId)).orderBy(asc(digitalAssets.renewalDate));
  }

  async createDigitalAsset(insertAsset: InsertDigitalAsset): Promise<DigitalAsset> {
    const [asset] = await db
      .insert(digitalAssets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async updateDigitalAsset(id: string, updateAsset: Partial<InsertDigitalAsset>): Promise<DigitalAsset> {
    const [asset] = await db
      .update(digitalAssets)
      .set({ ...updateAsset, updatedAt: new Date() })
      .where(eq(digitalAssets.id, id))
      .returning();
    return asset;
  }

  async deleteDigitalAsset(id: string): Promise<void> {
    await db.delete(digitalAssets).where(eq(digitalAssets.id, id));
  }

  async getAgencyTemplates(agencyId: string): Promise<AgencyTemplate[]> {
    return db.select().from(agencyTemplates).where(eq(agencyTemplates.agencyId, agencyId)).orderBy(desc(agencyTemplates.createdAt));
  }

  async getPublicTemplates(): Promise<AgencyTemplate[]> {
    return db.select().from(agencyTemplates).where(eq(agencyTemplates.isPublic, true)).orderBy(desc(agencyTemplates.createdAt));
  }

  async createAgencyTemplate(insertTemplate: InsertAgencyTemplate): Promise<AgencyTemplate> {
    const templateData = {
      ...insertTemplate,
      template: {
        clientFields: insertTemplate.template?.clientFields || [],
        projectFields: insertTemplate.template?.projectFields || [],
        taskFields: insertTemplate.template?.taskFields || [],
        workflows: insertTemplate.template?.workflows || []
      }
    };
    
    const [template] = await db
      .insert(agencyTemplates)
      .values(templateData)
      .returning();
    return template;
  }

  async logActivity(log: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(activityLog).values(log);
  }

  async getActivityLog(agencyId: string, limit: number = 50): Promise<ActivityLog[]> {
    return db.select().from(activityLog)
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
    
    const [activeProjectsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(projects)
      .where(and(eq(projects.agencyId, agencyId), eq(projects.status, 'active')));

    const [tasksTodayResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(tasks)
      .where(and(
        eq(tasks.agencyId, agencyId),
        eq(tasks.dueDate, today.toISOString().split('T')[0])
      ));

    const [activeClientsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(and(eq(clients.agencyId, agencyId), eq(clients.status, 'active')));

    const [completedTasksResult] = await db
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
}

export const storage = new DatabaseStorage();
