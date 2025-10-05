import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, or, like, isNull, sql, type SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { 
  type Asset, type InsertAsset,
  type Employee, type InsertEmployee, 
  type Location, type InsertLocation,
  type Department, type InsertDepartment,
  type AssetAssignmentHistory, type InsertAssetAssignmentHistory,
  type AssetMaintenance, type InsertAssetMaintenance,
  type CctvSystem, type InsertCctvSystem,
  type BiometricSystem, type InsertBiometricSystem,
  type Backup, type InsertBackup,
  type User, type InsertUser,
  type CompanySettings, type InsertCompanySettings,
  type AssetType, type InsertAssetType,
  type ApprovalRequest, type InsertApprovalRequest,
  type ApprovalAction, type InsertApprovalAction,
  type Invoice, type InsertInvoice,
  type ComplianceTask, type InsertComplianceTask,
  type ComplianceEvidence, type InsertComplianceEvidence,
  type ComplianceAuditTrail, type InsertComplianceAuditTrail,
  type AssetTransfer, type InsertAssetTransfer,
  type ComplianceSignal, type InsertComplianceSignal,
  type ComplianceRiskScore, type InsertComplianceRiskScore,
  type AutomationRun, type InsertAutomationRun,
  type AiRecommendation, type InsertAiRecommendation,
  type BackupVerification, type InsertBackupVerification,
  type ComplianceAssignmentQueue, type InsertComplianceAssignmentQueue,
  assets, employees, locations, departments, assetAssignmentHistory, assetMaintenance,
  cctvSystems, biometricSystems, backups, users, companySettings, assetTypes,
  approvalRequests, approvalActions, invoices,
  complianceTasks, complianceEvidence, complianceAuditTrail, assetTransfers,
  complianceSignals, complianceRiskScores, automationRuns, aiRecommendations,
  backupVerification, complianceAssignmentQueue
} from "@shared/schema";
import { IStorage } from "./storage";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

export class DatabaseStorage implements IStorage {
  // Assets
  async getAsset(assetId: string): Promise<Asset | undefined> {
    const result = await db.select().from(assets).where(eq(assets.assetId, assetId));
    return result[0];
  }

  async getAllAssets(): Promise<Asset[]> {
    return await db.select().from(assets).orderBy(desc(assets.createdAt));
  }

  async createAsset(asset: InsertAsset): Promise<Asset> {
    const result = await db.insert(assets).values({
      ...asset,
      status: asset.status || "available",
      condition: asset.condition || "good",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateAsset(assetId: string, asset: Partial<InsertAsset>): Promise<Asset | undefined> {
    const result = await db.update(assets)
      .set({ 
        ...asset, 
        updatedAt: new Date() 
      })
      .where(eq(assets.assetId, assetId))
      .returning();
    return result[0];
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    const result = await db.delete(assets).where(eq(assets.assetId, assetId));
    return result.rowCount > 0;
  }

  // Employees
  async getEmployee(id: number): Promise<Employee | undefined> {
    const result = await db.select().from(employees).where(eq(employees.id, id));
    return result[0];
  }

  async getAllEmployees(): Promise<Employee[]> {
    return await db.select().from(employees).orderBy(desc(employees.createdAt));
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const result = await db.insert(employees).values({
      ...employee,
      status: employee.status || "active",
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const result = await db.update(employees)
      .set(employee)
      .where(eq(employees.id, id))
      .returning();
    return result[0];
  }

  async deleteEmployee(id: number): Promise<boolean> {
    const result = await db.delete(employees).where(eq(employees.id, id));
    return result.rowCount > 0;
  }

  // Locations
  async getLocation(id: number): Promise<Location | undefined> {
    const result = await db.select().from(locations).where(eq(locations.id, id));
    return result[0];
  }

  async getAllLocations(): Promise<Location[]> {
    return await db.select().from(locations).orderBy(desc(locations.createdAt));
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const result = await db.insert(locations).values({
      ...location,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined> {
    const result = await db.update(locations)
      .set(location)
      .where(eq(locations.id, id))
      .returning();
    return result[0];
  }

  async deleteLocation(id: number): Promise<boolean> {
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  // Departments
  async getDepartment(id: number): Promise<Department | undefined> {
    const result = await db.select().from(departments).where(eq(departments.id, id));
    return result[0];
  }

  async getAllDepartments(): Promise<Department[]> {
    return await db.select().from(departments).orderBy(departments.name);
  }

  async createDepartment(department: InsertDepartment): Promise<Department> {
    const result = await db.insert(departments).values({
      ...department,
      isActive: department.isActive !== undefined ? department.isActive : true,
      isCustom: department.isCustom !== undefined ? department.isCustom : false,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined> {
    const result = await db.update(departments)
      .set(department)
      .where(eq(departments.id, id))
      .returning();
    return result[0];
  }

  async deleteDepartment(id: number): Promise<boolean> {
    const result = await db.delete(departments).where(eq(departments.id, id));
    return result.rowCount > 0;
  }

  // Assignment History
  async getAssignmentHistory(assetId?: string, employeeId?: number): Promise<AssetAssignmentHistory[]> {
    let query = db.select().from(assetAssignmentHistory);
    
    if (assetId && employeeId) {
      query = query.where(and(
        eq(assetAssignmentHistory.assetId, assetId),
        eq(assetAssignmentHistory.employeeId, employeeId)
      ));
    } else if (assetId) {
      query = query.where(eq(assetAssignmentHistory.assetId, assetId));
    } else if (employeeId) {
      query = query.where(eq(assetAssignmentHistory.employeeId, employeeId));
    }
    
    return await query.orderBy(desc(assetAssignmentHistory.createdAt));
  }

  async createAssignment(assignment: InsertAssetAssignmentHistory): Promise<AssetAssignmentHistory> {
    const result = await db.insert(assetAssignmentHistory).values({
      ...assignment,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  // Maintenance
  async getMaintenanceRecords(assetId?: string): Promise<AssetMaintenance[]> {
    let query = db.select().from(assetMaintenance);
    
    if (assetId) {
      query = query.where(eq(assetMaintenance.assetId, assetId));
    }
    
    return await query.orderBy(desc(assetMaintenance.createdAt));
  }

  async createMaintenanceRecord(maintenance: InsertAssetMaintenance): Promise<AssetMaintenance> {
    const result = await db.insert(assetMaintenance).values({
      ...maintenance,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateMaintenanceRecord(id: number, maintenance: Partial<InsertAssetMaintenance>): Promise<AssetMaintenance | undefined> {
    const result = await db.update(assetMaintenance)
      .set(maintenance)
      .where(eq(assetMaintenance.id, id))
      .returning();
    return result[0];
  }

  async deleteMaintenanceRecord(id: number): Promise<boolean> {
    const result = await db.delete(assetMaintenance).where(eq(assetMaintenance.id, id));
    return result.rowCount > 0;
  }

  // CCTV Systems
  async getAllCctvSystems(): Promise<CctvSystem[]> {
    return await db.select().from(cctvSystems).orderBy(desc(cctvSystems.createdAt));
  }

  async createCctvSystem(system: InsertCctvSystem): Promise<CctvSystem> {
    const result = await db.insert(cctvSystems).values({
      ...system,
      status: system.status || "online",
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateCctvSystem(id: number, system: Partial<InsertCctvSystem>): Promise<CctvSystem | undefined> {
    const result = await db.update(cctvSystems)
      .set(system)
      .where(eq(cctvSystems.id, id))
      .returning();
    return result[0];
  }

  async deleteCctvSystem(id: number): Promise<boolean> {
    const result = await db.delete(cctvSystems).where(eq(cctvSystems.id, id));
    return result.rowCount > 0;
  }

  // Biometric Systems
  async getAllBiometricSystems(): Promise<BiometricSystem[]> {
    return await db.select().from(biometricSystems).orderBy(desc(biometricSystems.createdAt));
  }

  async createBiometricSystem(system: InsertBiometricSystem): Promise<BiometricSystem> {
    const result = await db.insert(biometricSystems).values({
      ...system,
      status: system.status || "online",
      employeeCount: system.employeeCount || 0,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateBiometricSystem(id: number, system: Partial<InsertBiometricSystem>): Promise<BiometricSystem | undefined> {
    const result = await db.update(biometricSystems)
      .set(system)
      .where(eq(biometricSystems.id, id))
      .returning();
    return result[0];
  }

  async deleteBiometricSystem(id: number): Promise<boolean> {
    const result = await db.delete(biometricSystems).where(eq(biometricSystems.id, id));
    return result.rowCount > 0;
  }

  // Backups
  async getBackups(assetId?: string): Promise<Backup[]> {
    let query = db.select().from(backups);
    
    if (assetId) {
      query = query.where(eq(backups.assetId, assetId));
    }
    
    return await query.orderBy(desc(backups.createdAt));
  }

  async createBackup(backup: InsertBackup): Promise<Backup> {
    const result = await db.insert(backups).values({
      ...backup,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateBackup(id: number, backup: Partial<InsertBackup>): Promise<Backup | undefined> {
    const result = await db.update(backups)
      .set(backup)
      .where(eq(backups.id, id))
      .returning();
    return result[0];
  }

  async deleteBackup(id: number): Promise<boolean> {
    const result = await db.delete(backups).where(eq(backups.id, id));
    return result.rowCount > 0;
  }

  // Additional methods for user management and settings
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values({
      ...user,
      status: user.status || "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        ...user, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const result = await db.select().from(companySettings).limit(1);
    return result[0];
  }

  async updateCompanySettings(settings: Partial<InsertCompanySettings>): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    
    if (existing) {
      const result = await db.update(companySettings)
        .set({ 
          ...settings, 
          updatedAt: new Date() 
        })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return result[0];
    } else {
      const result = await db.insert(companySettings).values({
        ...settings,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return result[0];
    }
  }

  async getAllAssetTypes(): Promise<AssetType[]> {
    return await db.select().from(assetTypes)
      .where(eq(assetTypes.isActive, true))
      .orderBy(assetTypes.name);
  }

  async createAssetType(assetType: InsertAssetType): Promise<AssetType> {
    const result = await db.insert(assetTypes).values({
      ...assetType,
      isActive: assetType.isActive ?? true,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  // Dashboard statistics methods
  async getDashboardStats() {
    const [totalAssets, assignedAssets, availableAssets, maintenanceAssets] = await Promise.all([
      db.select().from(assets),
      db.select().from(assets).where(eq(assets.status, 'assigned')),
      db.select().from(assets).where(eq(assets.status, 'available')),
      db.select().from(assets).where(eq(assets.status, 'maintenance'))
    ]);

    const [totalEmployees, totalLocations, activeCctvSystems, activeBiometricSystems] = await Promise.all([
      db.select().from(employees).where(eq(employees.status, 'active')),
      db.select().from(locations),
      db.select().from(cctvSystems).where(eq(cctvSystems.status, 'online')),
      db.select().from(biometricSystems).where(eq(biometricSystems.status, 'online'))
    ]);

    return {
      totalAssets: totalAssets.length,
      assignedAssets: assignedAssets.length,
      availableAssets: availableAssets.length,
      maintenanceAssets: maintenanceAssets.length,
      utilizationRate: totalAssets.length > 0 ? Math.round((assignedAssets.length / totalAssets.length) * 100) : 0,
      totalEmployees: totalEmployees.length,
      totalLocations: totalLocations.length,
      activeCctvSystems: activeCctvSystems.length,
      activeBiometricSystems: activeBiometricSystems.length,
      systemHealth: 100 // Calculate based on your criteria
    };
  }

  // Search functionality
  async searchAssets(searchTerm: string): Promise<Asset[]> {
    return await db.select().from(assets)
      .where(or(
        like(assets.assetId, `%${searchTerm}%`),
        like(assets.modelName, `%${searchTerm}%`),
        like(assets.brand, `%${searchTerm}%`),
        like(assets.serviceTag, `%${searchTerm}%`)
      ))
      .orderBy(desc(assets.createdAt));
  }

  async searchEmployees(searchTerm: string): Promise<Employee[]> {
    return await db.select().from(employees)
      .where(or(
        like(employees.employeeCode, `%${searchTerm}%`),
        like(employees.firstName, `%${searchTerm}%`),
        like(employees.lastName, `%${searchTerm}%`),
        like(employees.email, `%${searchTerm}%`)
      ))
      .orderBy(desc(employees.createdAt));
  }

  // Get recent activities for dashboard
  async getRecentActivities(limit: number = 10) {
    return await db.select({
      id: assetAssignmentHistory.id,
      type: 'assignment',
      assetId: assetAssignmentHistory.assetId,
      employeeId: assetAssignmentHistory.employeeId,
      date: assetAssignmentHistory.assignedDate,
      reason: assetAssignmentHistory.assignmentReason,
      createdAt: assetAssignmentHistory.createdAt
    })
    .from(assetAssignmentHistory)
    .where(isNull(assetAssignmentHistory.returnedDate))
    .orderBy(desc(assetAssignmentHistory.createdAt))
    .limit(limit);
  }

  // Approval Requests
  async getApprovalRequest(id: number): Promise<ApprovalRequest | undefined> {
    const result = await db.select().from(approvalRequests).where(eq(approvalRequests.id, id));
    return result[0];
  }

  async getAllApprovalRequests(filters?: { status?: string; requestedBy?: number }): Promise<ApprovalRequest[]> {
    if (!filters || (!filters.status && !filters.requestedBy)) {
      return await db
        .select()
        .from(approvalRequests)
        .orderBy(desc(approvalRequests.requestedAt));
    }
    
    const conditions: SQL<unknown>[] = [];
    if (filters.status) {
      conditions.push(eq(approvalRequests.status, filters.status));
    }
    if (filters.requestedBy) {
      conditions.push(eq(approvalRequests.requestedBy, filters.requestedBy));
    }
    
    return await db
      .select()
      .from(approvalRequests)
      .where(and(...conditions))
      .orderBy(desc(approvalRequests.requestedAt));
  }

  async createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest> {
    const result = await db.insert(approvalRequests).values({
      ...request,
      status: request.status || "pending",
      currentApprovalLevel: request.currentApprovalLevel || 1,
      requiredApprovalLevels: request.requiredApprovalLevels || 1,
      requestedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateApprovalRequest(id: number, request: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined> {
    const result = await db.update(approvalRequests)
      .set({
        ...request,
        updatedAt: new Date(),
      })
      .where(eq(approvalRequests.id, id))
      .returning();
    return result[0];
  }

  // Approval Actions
  async getApprovalActions(requestId: number): Promise<ApprovalAction[]> {
    return await db.select().from(approvalActions)
      .where(eq(approvalActions.requestId, requestId))
      .orderBy(approvalActions.approvalLevel);
  }

  async createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction> {
    const result = await db.insert(approvalActions).values({
      ...action,
      actionAt: new Date(),
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  // Invoices
  async getAllInvoices(): Promise<Invoice[]> {
    return await db.select().from(invoices).orderBy(desc(invoices.invoiceDate));
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const result = await db.select().from(invoices).where(eq(invoices.id, id));
    return result[0];
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const result = await db.insert(invoices).values({
      ...invoice,
      paymentStatus: invoice.paymentStatus || "unpaid",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const result = await db.update(invoices)
      .set({
        ...invoice,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return result[0];
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount > 0;
  }

  // Compliance Management
  async getComplianceTasks(filters?: { status?: string; priority?: string; taskType?: string; locationId?: number; overdueOnly?: boolean }): Promise<any[]> {
    const assignedToUser = alias(users, 'assignedToUser');
    const createdByUser = alias(users, 'createdByUser');
    
    const baseQuery = db.select({
      task: complianceTasks,
      assignedToUser: assignedToUser,
      createdByUser: createdByUser,
      location: locations,
    }).from(complianceTasks)
      .leftJoin(assignedToUser, eq(complianceTasks.assignedTo, assignedToUser.id))
      .leftJoin(createdByUser, eq(complianceTasks.createdBy, createdByUser.id))
      .leftJoin(locations, eq(complianceTasks.locationId, locations.id));

    const conditions: SQL<unknown>[] = [];
    
    if (filters?.status) {
      conditions.push(eq(complianceTasks.status, filters.status));
    }
    
    if (filters?.priority) {
      conditions.push(eq(complianceTasks.priority, filters.priority));
    }
    
    if (filters?.taskType) {
      conditions.push(eq(complianceTasks.taskType, filters.taskType));
    }
    
    if (filters?.locationId) {
      conditions.push(eq(complianceTasks.locationId, filters.locationId));
    }
    
    if (filters?.overdueOnly) {
      // Filter for overdue tasks will be done in the map function after fetching
      conditions.push(eq(complianceTasks.status, 'pending'));
    }

    const results = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(desc(complianceTasks.createdAt))
      : await baseQuery.orderBy(desc(complianceTasks.createdAt));
    
    // Fetch evidence files for all tasks
    const taskIds = results.map((r: any) => r.task.id);
    let evidenceMap: Record<number, string[]> = {};
    
    if (taskIds.length > 0) {
      const evidence = await db.select()
        .from(complianceEvidence)
        .where(eq(complianceEvidence.taskId, taskIds[0])); // Get evidence for first task to check
      
      // Build evidence map for all tasks
      for (const taskId of taskIds) {
        const taskEvidence = await db.select()
          .from(complianceEvidence)
          .where(eq(complianceEvidence.taskId, taskId));
        evidenceMap[taskId] = taskEvidence.map(e => e.fileUrl);
      }
    }
    
    // Compute is_overdue and days_until_due
    return results.map((row: any) => {
      const dueDate = new Date(row.task.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return {
        ...row.task,
        assignedToName: row.assignedToUser ? `${row.assignedToUser.firstName} ${row.assignedToUser.lastName}` : null,
        createdByName: row.createdByUser ? `${row.createdByUser.firstName} ${row.createdByUser.lastName}` : null,
        locationName: row.location?.outletName || null,
        evidenceFiles: evidenceMap[row.task.id] || null,
        isOverdue: row.task.status === 'pending' && diffDays < 0,
        daysUntilDue: diffDays,
      };
    });
  }

  async getComplianceTask(id: number): Promise<any | undefined> {
    const assignedToUser = alias(users, 'assignedToUser');
    const createdByUser = alias(users, 'createdByUser');
    
    const result = await db.select({
      task: complianceTasks,
      assignedToUser: assignedToUser,
      createdByUser: createdByUser,
      location: locations,
    }).from(complianceTasks)
      .leftJoin(assignedToUser, eq(complianceTasks.assignedTo, assignedToUser.id))
      .leftJoin(createdByUser, eq(complianceTasks.createdBy, createdByUser.id))
      .leftJoin(locations, eq(complianceTasks.locationId, locations.id))
      .where(eq(complianceTasks.id, id));
    
    if (result.length === 0) return undefined;
    
    const row = result[0];
    return {
      ...row.task,
      assignedToName: row.assignedToUser ? `${row.assignedToUser.firstName} ${row.assignedToUser.lastName}` : null,
      createdByName: row.createdByUser ? `${row.createdByUser.firstName} ${row.createdByUser.lastName}` : null,
      locationName: row.location?.outletName || null,
    };
  }

  async createComplianceTask(task: InsertComplianceTask): Promise<ComplianceTask> {
    const result = await db.insert(complianceTasks).values({
      ...task,
      priority: task.priority || 'medium',
      status: task.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    return result[0];
  }

  async updateComplianceTask(id: number, task: Partial<InsertComplianceTask>): Promise<ComplianceTask | undefined> {
    const result = await db.update(complianceTasks)
      .set({
        ...task,
        updatedAt: new Date(),
      })
      .where(eq(complianceTasks.id, id))
      .returning();
    return result[0];
  }

  async deleteComplianceTask(id: number): Promise<boolean> {
    const result = await db.delete(complianceTasks).where(eq(complianceTasks.id, id));
    return result.rowCount > 0;
  }

  async getComplianceDashboardStats(locationId?: number): Promise<any> {
    let tasksQuery = db.select().from(complianceTasks);
    
    if (locationId) {
      tasksQuery = tasksQuery.where(eq(complianceTasks.locationId, locationId)) as any;
    }
    
    const tasks = await tasksQuery;
    
    const stats = {
      totalTasks: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => {
        if (t.status !== 'pending') return false;
        const dueDate = new Date(t.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length,
      highRisk: tasks.filter(t => t.riskLevel === 'high' || t.riskLevel === 'critical').length,
      avgComplianceScore: tasks.reduce((sum, t) => sum + (t.complianceScore || 0), 0) / (tasks.length || 1),
      completionRate: tasks.length > 0 ? (tasks.filter(t => t.status === 'completed').length / tasks.length) * 100 : 0,
    };
    
    // Get recent tasks
    const recentTasks = await db.select({
      task: complianceTasks,
      assignedToUser: users,
      location: locations,
    }).from(complianceTasks)
      .leftJoin(users, eq(complianceTasks.assignedTo, users.id))
      .leftJoin(locations, eq(complianceTasks.locationId, locations.id))
      .orderBy(desc(complianceTasks.createdAt))
      .limit(5);
    
    return {
      ...stats,
      recentTasks: recentTasks.map(row => ({
        ...row.task,
        assignedToName: row.assignedToUser ? `${row.assignedToUser.firstName} ${row.assignedToUser.lastName}` : null,
        locationName: row.location?.outletName || null,
      })),
    };
  }

  async uploadComplianceEvidence(evidence: InsertComplianceEvidence): Promise<ComplianceEvidence> {
    const result = await db.insert(complianceEvidence).values({
      ...evidence,
      uploadedAt: new Date(),
      verificationStatus: evidence.verificationStatus || 'pending',
    }).returning();
    return result[0];
  }

  async createComplianceAuditTrail(trail: InsertComplianceAuditTrail): Promise<ComplianceAuditTrail> {
    const result = await db.insert(complianceAuditTrail).values({
      ...trail,
      timestamp: new Date(),
    }).returning();
    return result[0];
  }

  async getComplianceAuditTrail(taskId: number): Promise<any[]> {
    const results = await db.select({
      trail: complianceAuditTrail,
      user: users,
    }).from(complianceAuditTrail)
      .leftJoin(users, eq(complianceAuditTrail.performedBy, users.id))
      .where(eq(complianceAuditTrail.taskId, taskId))
      .orderBy(desc(complianceAuditTrail.timestamp));
    
    return results.map((row: any) => ({
      ...row.trail,
      performedByName: row.user ? `${row.user.firstName} ${row.user.lastName}` : 'Unknown User',
    }));
  }

  // Phase 2: Predictive Analytics
  async getPredictiveMaintenance(locationId: number | null, assetType: string | null, riskLevel: string | null): Promise<any[]> {
    const assignedAssets = await db.select({
      asset: assets,
      location: locations,
    }).from(assets)
      .leftJoin(locations, eq(assets.locationId, locations.id))
      .where(
        and(
          eq(assets.status, 'assigned'),
          locationId ? eq(assets.locationId, locationId) : undefined,
          assetType ? eq(assets.assetType, assetType) : undefined
        )
      );

    const predictions = await Promise.all(assignedAssets.map(async (row: any) => {
      const asset = row.asset;
      const location = row.location;

      // Get maintenance history
      const maintenanceHistory = await db.select()
        .from(assetMaintenance)
        .where(eq(assetMaintenance.assetId, asset.assetId));

      const maintenanceCount = maintenanceHistory.length;
      const totalCost = maintenanceHistory.reduce((sum, m) => sum + (Number(m.cost) || 0), 0);
      const avgMaintenanceCost = maintenanceCount > 0 ? totalCost / maintenanceCount : 0;

      const lastMaintenance = maintenanceHistory.sort((a, b) => 
        new Date(b.completedDate || b.scheduledDate || 0).getTime() - 
        new Date(a.completedDate || a.scheduledDate || 0).getTime()
      )[0];

      const lastMaintenanceDate = lastMaintenance ? (lastMaintenance.completedDate || lastMaintenance.scheduledDate) : null;
      const daysSinceMaintenance = lastMaintenanceDate ? 
        Math.floor((Date.now() - new Date(lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24)) : 
        (asset.purchaseDate ? Math.floor((Date.now() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24)) : 365);

      // Risk model
      let failureRisk = 'low';
      let predictedDaysToFailure = 180;
      let recommendedAction = 'Continue monitoring';
      let estimatedCost = avgMaintenanceCost || 1000;

      if (daysSinceMaintenance > 180 || maintenanceCount > 5) {
        failureRisk = 'high';
        predictedDaysToFailure = 30;
        recommendedAction = 'Schedule immediate preventive maintenance';
        estimatedCost = avgMaintenanceCost * 1.5 || 5000;
      } else if (daysSinceMaintenance > 90 || maintenanceCount > 3) {
        failureRisk = 'medium';
        predictedDaysToFailure = 60;
        recommendedAction = 'Schedule preventive maintenance within 30 days';
        estimatedCost = avgMaintenanceCost * 1.2 || 3000;
      }

      return {
        assetId: asset.assetId,
        modelName: asset.modelName,
        brand: asset.brand,
        assetType: asset.assetType,
        locationName: location?.outletName || 'Unknown',
        purchaseDate: asset.purchaseDate,
        maintenanceCount,
        avgMaintenanceCost: Number(avgMaintenanceCost.toFixed(2)),
        lastMaintenanceDate,
        daysSinceMaintenance,
        failureRisk,
        predictedDaysToFailure,
        recommendedAction,
        estimatedCost: Number(estimatedCost.toFixed(2)),
      };
    }));

    // Filter by risk level if specified
    if (riskLevel) {
      return predictions.filter(p => p.failureRisk === riskLevel);
    }

    return predictions;
  }

  async getUtilizationOptimization(): Promise<any> {
    const allLocations = await db.select().from(locations);
    
    const locationStats = await Promise.all(allLocations.map(async (location) => {
      const totalAssets = await db.select().from(assets).where(eq(assets.locationId, location.id));
      const assignedAssets = totalAssets.filter(a => a.status === 'assigned');
      const availableAssets = totalAssets.filter(a => a.status === 'available');
      const totalEmployees = await db.select().from(employees).where(eq(employees.locationId, location.id));

      const utilizationRate = totalAssets.length > 0 ? Math.round((assignedAssets.length / totalAssets.length) * 100) : 0;
      const assetsPerEmployee = totalEmployees.length > 0 ? Number((assignedAssets.length / totalEmployees.length).toFixed(2)) : 0;
      
      // Calculate efficiency score (combination of utilization and assets per employee)
      const efficiencyScore = Math.round((utilizationRate * 0.7) + (Math.min(assetsPerEmployee * 20, 30)));

      // Generate recommendations
      const recommendations = [];
      if (utilizationRate < 60) {
        recommendations.push({
          priority: 'high',
          action: `Redistribute ${availableAssets.length} unused assets to other locations`,
          expectedGain: `Improve utilization by ${100 - utilizationRate}%`,
        });
      }
      if (assetsPerEmployee < 0.5) {
        recommendations.push({
          priority: 'medium',
          action: 'Consider asset procurement to meet employee needs',
          expectedGain: 'Improve productivity and employee satisfaction',
        });
      }
      if (assetsPerEmployee > 2) {
        recommendations.push({
          priority: 'low',
          action: 'Excess assets detected - consider redistribution',
          expectedGain: 'Optimize asset allocation across locations',
        });
      }

      return {
        locationId: location.id,
        locationName: location.outletName,
        totalAssets: totalAssets.length,
        assignedAssets: assignedAssets.length,
        availableAssets: availableAssets.length,
        totalEmployees: totalEmployees.length,
        utilizationRate,
        assetsPerEmployee,
        efficiencyScore,
        recommendations,
      };
    }));

    return {
      locations: locationStats,
      summary: {
        totalLocations: allLocations.length,
        avgUtilization: Math.round(locationStats.reduce((sum, l) => sum + l.utilizationRate, 0) / locationStats.length),
        avgEfficiencyScore: Math.round(locationStats.reduce((sum, l) => sum + l.efficiencyScore, 0) / locationStats.length),
      },
    };
  }

  async getLocationPerformanceAnalytics(): Promise<any[]> {
    const allLocations = await db.select().from(locations);

    const performance = await Promise.all(allLocations.map(async (location) => {
      const totalAssets = await db.select().from(assets).where(eq(assets.locationId, location.id));
      const activeAssets = totalAssets.filter(a => a.status === 'assigned');
      const allEmployees = await db.select().from(employees).where(eq(employees.locationId, location.id));
      const activeEmployees = allEmployees.filter(e => e.status === 'active');

      const maintenanceRecords = await db.select()
        .from(assetMaintenance)
        .innerJoin(assets, eq(assetMaintenance.assetId, assets.assetId))
        .where(eq(assets.locationId, location.id));

      const totalMaintenance = maintenanceRecords.length;
      const totalMaintenanceCost = maintenanceRecords.reduce((sum, r) => sum + (Number(r.asset_maintenance.cost) || 0), 0);

      const locationComplianceTasks = await db.select()
        .from(complianceTasks)
        .where(eq(complianceTasks.locationId, location.id));

      const completedCompliance = locationComplianceTasks.filter((t: any) => t.status === 'completed').length;
      const avgComplianceScore = locationComplianceTasks.length > 0 ? 
        Math.round(locationComplianceTasks.reduce((sum: number, t: any) => sum + (t.complianceScore || 0), 0) / locationComplianceTasks.length) : 0;

      const utilizationRate = totalAssets.length > 0 ? Math.round((activeAssets.length / totalAssets.length) * 100) : 0;
      const complianceRate = locationComplianceTasks.length > 0 ? Math.round((completedCompliance / locationComplianceTasks.length) * 100) : 0;
      const assetPerEmployee = activeEmployees.length > 0 ? Number((activeAssets.length / activeEmployees.length).toFixed(2)) : 0;
      const avgMaintenanceCost = totalMaintenance > 0 ? Number((totalMaintenanceCost / totalMaintenance).toFixed(2)) : 0;

      // Performance score calculation
      const performanceScore = Math.round(
        (utilizationRate * 0.3) + 
        (complianceRate * 0.3) + 
        (Math.min(assetPerEmployee * 20, 20)) + 
        ((100 - Math.min(avgMaintenanceCost / 100, 30)))
      );

      return {
        locationId: location.id,
        locationName: location.outletName,
        city: location.city,
        state: location.state,
        totalAssets: totalAssets.length,
        activeAssets: activeAssets.length,
        totalEmployees: allEmployees.length,
        activeEmployees: activeEmployees.length,
        totalMaintenance,
        totalMaintenanceCost: Number(totalMaintenanceCost.toFixed(2)),
        totalComplianceTasks: locationComplianceTasks.length,
        completedCompliance,
        avgComplianceScore,
        utilizationRate,
        complianceRate,
        assetPerEmployee,
        avgMaintenanceCost,
        performanceScore,
      };
    }));

    // Add performance rank
    const rankedPerformance = performance
      .sort((a, b) => b.performanceScore - a.performanceScore)
      .map((loc, index) => ({
        ...loc,
        performanceRank: index + 1,
      }));

    return rankedPerformance;
  }

  async createAssetTransfer(transfer: InsertAssetTransfer): Promise<AssetTransfer> {
    const result = await db.insert(assetTransfers).values({
      ...transfer,
      createdAt: new Date(),
    }).returning();
    return result[0];
  }

  async getRealTimeDashboardData(): Promise<any> {
    // Asset stats
    const allAssets = await db.select().from(assets);
    const totalAssets = allAssets.length;
    const assignedAssets = allAssets.filter(a => a.status === 'assigned').length;
    const availableAssets = allAssets.filter(a => a.status === 'available').length;
    const maintenanceAssets = allAssets.filter(a => a.status === 'maintenance').length;
    const retiredAssets = allAssets.filter(a => a.status === 'retired').length;
    const utilizationRate = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

    // Financial stats
    const allInvoices = await db.select().from(invoices);
    const totalInvoices = allInvoices.reduce((sum, inv) => sum + Number(inv.amount), 0);
    const paidInvoices = allInvoices.filter(inv => inv.paymentStatus === 'paid').reduce((sum, inv) => sum + Number(inv.amount), 0);
    const pendingInvoices = allInvoices.filter(inv => inv.paymentStatus === 'unpaid' || inv.paymentStatus === 'partial').reduce((sum, inv) => sum + Number(inv.amount), 0);
    const invoiceCount = allInvoices.length;
    const collectionRate = totalInvoices > 0 ? Math.round((paidInvoices / totalInvoices) * 100) : 0;

    // Maintenance stats
    const allMaintenance = await db.select().from(assetMaintenance);
    const completedMaintenance = allMaintenance.filter(m => m.completedDate).length;
    const scheduledMaintenance = allMaintenance.filter(m => m.scheduledDate && !m.completedDate).length;
    const overdueMaintenance = allMaintenance.filter(m => 
      m.scheduledDate && !m.completedDate && new Date(m.scheduledDate) < new Date()
    ).length;
    const avgMaintenanceCost = allMaintenance.length > 0 ? 
      Number((allMaintenance.reduce((sum, m) => sum + Number(m.cost || 0), 0) / allMaintenance.length).toFixed(2)) : 0;
    const maintenanceCompletionRate = allMaintenance.length > 0 ? Math.round((completedMaintenance / allMaintenance.length) * 100) : 0;

    // Compliance stats
    const allComplianceTasks = await db.select().from(complianceTasks);
    const completedCompliance = allComplianceTasks.filter(t => t.status === 'completed').length;
    const overdueCompliance = allComplianceTasks.filter(t => 
      t.status === 'pending' && new Date(t.dueDate) < new Date()
    ).length;
    const avgComplianceScore = allComplianceTasks.length > 0 ? 
      Math.round(allComplianceTasks.reduce((sum, t) => sum + (t.complianceScore || 0), 0) / allComplianceTasks.length) : 0;
    const complianceCompletionRate = allComplianceTasks.length > 0 ? Math.round((completedCompliance / allComplianceTasks.length) * 100) : 0;

    // Recent activities (simulated - in production, use audit logs)
    const recentActivities = [
      { type: 'asset', entity: 'Asset BFC001 assigned', date: new Date() },
      { type: 'maintenance', entity: 'Maintenance completed for BFC002', date: new Date() },
      { type: 'compliance', entity: 'Compliance task updated', date: new Date() },
    ].slice(0, 10);

    return {
      assets: {
        total: totalAssets,
        assigned: assignedAssets,
        available: availableAssets,
        maintenance: maintenanceAssets,
        retired: retiredAssets,
        utilizationRate,
      },
      financials: {
        totalInvoices: Number(totalInvoices.toFixed(2)),
        paid: Number(paidInvoices.toFixed(2)),
        pending: Number(pendingInvoices.toFixed(2)),
        count: invoiceCount,
        collectionRate,
      },
      maintenance: {
        total: allMaintenance.length,
        completed: completedMaintenance,
        scheduled: scheduledMaintenance,
        overdue: overdueMaintenance,
        avgCost: avgMaintenanceCost,
        completionRate: maintenanceCompletionRate,
      },
      compliance: {
        total: allComplianceTasks.length,
        completed: completedCompliance,
        overdue: overdueCompliance,
        avgScore: avgComplianceScore,
        completionRate: complianceCompletionRate,
      },
      recentActivities,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getDashboardTrends(metric: string, period: string): Promise<any[]> {
    // For demo purposes, generate sample trend data
    // In production, this would query actual historical data
    const now = new Date();
    const dataPoints = period === 'daily' ? 30 : period === 'weekly' ? 12 : 12;
    
    const trends = [];
    for (let i = dataPoints - 1; i >= 0; i--) {
      const date = new Date(now);
      if (period === 'daily') {
        date.setDate(date.getDate() - i);
      } else if (period === 'weekly') {
        date.setDate(date.getDate() - (i * 7));
      } else {
        date.setMonth(date.getMonth() - i);
      }

      let value = 0;
      let additionalData = {};

      if (metric === 'assets') {
        value = Math.floor(Math.random() * 20) + 80; // 80-100
        additionalData = { assigned: Math.floor(value * 0.7), available: Math.floor(value * 0.3) };
      } else if (metric === 'maintenance') {
        value = Math.floor(Math.random() * 10) + 5; // 5-15
        additionalData = { cost: Math.floor(Math.random() * 10000) + 5000 };
      } else if (metric === 'compliance') {
        value = Math.floor(Math.random() * 15) + 10; // 10-25
        additionalData = { avgScore: Math.floor(Math.random() * 30) + 70 };
      }

      trends.push({
        date: date.toISOString().split('T')[0],
        period,
        metric,
        value,
        ...additionalData,
      });
    }

    return trends;
  }

  // ==================== AI COMPLIANCE AUTOMATION METHODS ====================

  async createComplianceSignal(signal: InsertComplianceSignal): Promise<ComplianceSignal> {
    const result = await db.insert(complianceSignals).values(signal).returning();
    return result[0];
  }

  async getActiveComplianceSignals(filters?: { locationId?: number; severity?: string }): Promise<ComplianceSignal[]> {
    const conditions: SQL<unknown>[] = [eq(complianceSignals.status, 'active')];
    
    if (filters?.locationId) {
      conditions.push(eq(complianceSignals.locationId, filters.locationId));
    }
    if (filters?.severity) {
      conditions.push(eq(complianceSignals.severity, filters.severity));
    }
    
    return await db
      .select()
      .from(complianceSignals)
      .where(and(...conditions))
      .orderBy(desc(complianceSignals.detectedAt));
  }

  async resolveComplianceSignal(signalId: number): Promise<ComplianceSignal> {
    const result = await db
      .update(complianceSignals)
      .set({ status: 'resolved', resolvedAt: new Date() })
      .where(eq(complianceSignals.id, signalId))
      .returning();
    return result[0];
  }

  async createComplianceRiskScore(score: InsertComplianceRiskScore): Promise<ComplianceRiskScore> {
    const result = await db.insert(complianceRiskScores).values(score).returning();
    return result[0];
  }

  async getLatestRiskScores(filters?: { locationId?: number; assetId?: string }): Promise<ComplianceRiskScore[]> {
    if (!filters || (!filters.locationId && !filters.assetId)) {
      return await db
        .select()
        .from(complianceRiskScores)
        .orderBy(desc(complianceRiskScores.calculatedAt))
        .limit(100);
    }
    
    const conditions: SQL<unknown>[] = [];
    if (filters.locationId) {
      conditions.push(eq(complianceRiskScores.locationId, filters.locationId));
    }
    if (filters.assetId) {
      conditions.push(eq(complianceRiskScores.assetId, filters.assetId));
    }
    
    return await db
      .select()
      .from(complianceRiskScores)
      .where(and(...conditions))
      .orderBy(desc(complianceRiskScores.calculatedAt))
      .limit(100);
  }

  async createAutomationRun(run: InsertAutomationRun): Promise<AutomationRun> {
    const result = await db.insert(automationRuns).values(run).returning();
    return result[0];
  }

  async updateAutomationRun(id: number, run: Partial<InsertAutomationRun>): Promise<AutomationRun> {
    const result = await db
      .update(automationRuns)
      .set(run)
      .where(eq(automationRuns.id, id))
      .returning();
    return result[0];
  }

  async getAutomationRun(id: number): Promise<AutomationRun | undefined> {
    const result = await db
      .select()
      .from(automationRuns)
      .where(eq(automationRuns.id, id));
    return result[0];
  }

  async getAutomationRuns(limit: number = 10): Promise<AutomationRun[]> {
    return await db
      .select()
      .from(automationRuns)
      .orderBy(desc(automationRuns.startedAt))
      .limit(limit);
  }

  async getAutomationRunSummary(): Promise<{
    totalRuns: number;
    tasksGenerated: number;
    signalsRaised: number;
    recommendationsGenerated: number;
    period: string;
  }> {
    // Get automation runs in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const runs = await db
      .select()
      .from(automationRuns)
      .where(gte(automationRuns.startedAt, thirtyDaysAgo));
    
    const signals = await db
      .select()
      .from(complianceSignals)
      .where(gte(complianceSignals.detectedAt, thirtyDaysAgo));
    
    const recommendations = await db
      .select()
      .from(aiRecommendations)
      .where(gte(aiRecommendations.createdAt, thirtyDaysAgo));
    
    const totalTasksGenerated = runs.reduce((sum, run) => sum + (run.tasksGenerated || 0), 0);

    return {
      totalRuns: runs.length,
      tasksGenerated: totalTasksGenerated,
      signalsRaised: signals.length,
      recommendationsGenerated: recommendations.length,
      period: '30_days',
    };
  }

  async createAiRecommendation(recommendation: InsertAiRecommendation): Promise<AiRecommendation> {
    const result = await db.insert(aiRecommendations).values(recommendation).returning();
    return result[0];
  }

  async getAiRecommendations(filters?: { targetType?: string; status?: string; locationId?: number }): Promise<AiRecommendation[]> {
    if (!filters || (!filters.targetType && !filters.status)) {
      return await db
        .select()
        .from(aiRecommendations)
        .orderBy(desc(aiRecommendations.createdAt))
        .limit(50);
    }
    
    const conditions: SQL<unknown>[] = [];
    if (filters.targetType) {
      conditions.push(eq(aiRecommendations.targetType, filters.targetType));
    }
    if (filters.status) {
      conditions.push(eq(aiRecommendations.status, filters.status));
    }
    
    return await db
      .select()
      .from(aiRecommendations)
      .where(and(...conditions))
      .orderBy(desc(aiRecommendations.createdAt))
      .limit(50);
  }

  async updateAiRecommendation(id: number, recommendation: Partial<InsertAiRecommendation>): Promise<AiRecommendation> {
    const result = await db
      .update(aiRecommendations)
      .set(recommendation)
      .where(eq(aiRecommendations.id, id))
      .returning();
    return result[0];
  }

  async createBackupVerification(verification: InsertBackupVerification): Promise<BackupVerification> {
    const result = await db.insert(backupVerification).values(verification).returning();
    return result[0];
  }

  async getBackupVerifications(filters?: { assetId?: string; status?: string }): Promise<BackupVerification[]> {
    if (!filters || (!filters.assetId && !filters.status)) {
      return await db
        .select()
        .from(backupVerification)
        .orderBy(desc(backupVerification.verifiedAt));
    }
    
    const conditions: SQL<unknown>[] = [];
    if (filters.assetId) {
      conditions.push(eq(backupVerification.assetId, filters.assetId));
    }
    if (filters.status) {
      conditions.push(eq(backupVerification.verificationStatus, filters.status));
    }
    
    return await db
      .select()
      .from(backupVerification)
      .where(and(...conditions))
      .orderBy(desc(backupVerification.verifiedAt));
  }

  async getDueBackupVerifications(): Promise<BackupVerification[]> {
    const now = new Date().toISOString();
    return await db
      .select()
      .from(backupVerification)
      .where(
        and(
          eq(backupVerification.verificationStatus, 'passed'),
          sql`${backupVerification.nextVerificationDue} <= ${now}`
        )
      )
      .orderBy(backupVerification.nextVerificationDue);
  }

  async createComplianceAssignment(assignment: InsertComplianceAssignmentQueue): Promise<ComplianceAssignmentQueue> {
    const result = await db.insert(complianceAssignmentQueue).values(assignment).returning();
    return result[0];
  }

  async getComplianceAssignments(filters?: { userId?: number; status?: string }): Promise<ComplianceAssignmentQueue[]> {
    if (!filters || (!filters.userId && !filters.status)) {
      return await db
        .select()
        .from(complianceAssignmentQueue)
        .orderBy(desc(complianceAssignmentQueue.assignedAt));
    }
    
    const conditions: SQL<unknown>[] = [];
    if (filters.userId) {
      conditions.push(eq(complianceAssignmentQueue.assignedTo, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(complianceAssignmentQueue.status, filters.status));
    }
    
    return await db
      .select()
      .from(complianceAssignmentQueue)
      .where(and(...conditions))
      .orderBy(desc(complianceAssignmentQueue.assignedAt));
  }
}