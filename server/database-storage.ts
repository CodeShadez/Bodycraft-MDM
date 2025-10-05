import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, or, like, isNull } from "drizzle-orm";
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
  assets, employees, locations, departments, assetAssignmentHistory, assetMaintenance,
  cctvSystems, biometricSystems, backups, users, companySettings, assetTypes,
  approvalRequests, approvalActions, invoices,
  complianceTasks, complianceEvidence, complianceAuditTrail
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
    let query = db.select().from(approvalRequests);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(approvalRequests.status, filters.status));
    }
    if (filters?.requestedBy) {
      conditions.push(eq(approvalRequests.requestedBy, filters.requestedBy));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(approvalRequests.requestedAt));
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
    
    let query = db.select({
      task: complianceTasks,
      assignedToUser: assignedToUser,
      createdByUser: createdByUser,
      location: locations,
    }).from(complianceTasks)
      .leftJoin(assignedToUser, eq(complianceTasks.assignedTo, assignedToUser.id))
      .leftJoin(createdByUser, eq(complianceTasks.createdBy, createdByUser.id))
      .leftJoin(locations, eq(complianceTasks.locationId, locations.id));

    const conditions = [];
    
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

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const results = await query.orderBy(desc(complianceTasks.createdAt));
    
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
    const result = await db.select({
      task: complianceTasks,
      assignedToUser: users,
      createdByUser: users,
      location: locations,
    }).from(complianceTasks)
      .leftJoin(users, eq(complianceTasks.assignedTo, users.id))
      .leftJoin(users, eq(complianceTasks.createdBy, users.id))
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
}