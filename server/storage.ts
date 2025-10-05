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
  type Invoice, type InsertInvoice
} from "@shared/schema";

// BODYCRAFT MDM Storage Interface
export interface IStorage {
  // Assets
  getAsset(assetId: string): Promise<Asset | undefined>;
  getAllAssets(): Promise<Asset[]>;
  createAsset(asset: InsertAsset): Promise<Asset>;
  updateAsset(assetId: string, asset: Partial<InsertAsset>): Promise<Asset | undefined>;
  deleteAsset(assetId: string): Promise<boolean>;
  
  // Employees
  getEmployee(id: number): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee | undefined>;
  deleteEmployee(id: number): Promise<boolean>;
  
  // Locations
  getLocation(id: number): Promise<Location | undefined>;
  getAllLocations(): Promise<Location[]>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, location: Partial<InsertLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // Departments
  getDepartment(id: number): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, department: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: number): Promise<boolean>;
  
  // Assignment History
  getAssignmentHistory(assetId?: string, employeeId?: number): Promise<AssetAssignmentHistory[]>;
  createAssignment(assignment: InsertAssetAssignmentHistory): Promise<AssetAssignmentHistory>;
  
  // Maintenance
  getMaintenanceRecords(assetId?: string): Promise<AssetMaintenance[]>;
  createMaintenanceRecord(maintenance: InsertAssetMaintenance): Promise<AssetMaintenance>;
  updateMaintenanceRecord(id: number, maintenance: Partial<InsertAssetMaintenance>): Promise<AssetMaintenance | undefined>;
  deleteMaintenanceRecord(id: number): Promise<boolean>;
  
  // CCTV Systems
  getAllCctvSystems(): Promise<CctvSystem[]>;
  createCctvSystem(system: InsertCctvSystem): Promise<CctvSystem>;
  updateCctvSystem(id: number, system: Partial<InsertCctvSystem>): Promise<CctvSystem | undefined>;
  deleteCctvSystem(id: number): Promise<boolean>;
  
  // Biometric Systems
  getAllBiometricSystems(): Promise<BiometricSystem[]>;
  createBiometricSystem(system: InsertBiometricSystem): Promise<BiometricSystem>;
  updateBiometricSystem(id: number, system: Partial<InsertBiometricSystem>): Promise<BiometricSystem | undefined>;
  deleteBiometricSystem(id: number): Promise<boolean>;
  
  // Backups
  getBackups(assetId?: string): Promise<Backup[]>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  updateBackup(id: number, backup: Partial<InsertBackup>): Promise<Backup | undefined>;
  deleteBackup(id: number): Promise<boolean>;
  
  // Users (Authentication & Management)
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Company Settings
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: Partial<InsertCompanySettings>): Promise<CompanySettings>;
  
  // Asset Types
  getAllAssetTypes(): Promise<AssetType[]>;
  createAssetType(assetType: InsertAssetType): Promise<AssetType>;
  
  // Approval Requests
  getApprovalRequest(id: number): Promise<ApprovalRequest | undefined>;
  getAllApprovalRequests(filters?: { status?: string; requestedBy?: number }): Promise<ApprovalRequest[]>;
  createApprovalRequest(request: InsertApprovalRequest): Promise<ApprovalRequest>;
  updateApprovalRequest(id: number, request: Partial<InsertApprovalRequest>): Promise<ApprovalRequest | undefined>;
  
  // Approval Actions
  getApprovalActions(requestId: number): Promise<ApprovalAction[]>;
  createApprovalAction(action: InsertApprovalAction): Promise<ApprovalAction>;
  
  // Invoices
  getAllInvoices(): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Dashboard Statistics
  getDashboardStats(): Promise<any>;
  getRecentActivities(limit?: number): Promise<any[]>;
  
  // Compliance Management
  getComplianceTasks(filters?: { status?: string; priority?: string; taskType?: string; locationId?: number; overdueOnly?: boolean }): Promise<any[]>;
  getComplianceTask(id: number): Promise<any | undefined>;
  createComplianceTask(task: any): Promise<any>;
  updateComplianceTask(id: number, task: any): Promise<any | undefined>;
  deleteComplianceTask(id: number): Promise<boolean>;
  getComplianceDashboardStats(locationId?: number): Promise<any>;
  uploadComplianceEvidence(evidence: any): Promise<any>;
  createComplianceAuditTrail(trail: any): Promise<any>;
  getComplianceAuditTrail(taskId: number): Promise<any[]>;
  
  // Phase 2: Advanced Analytics
  getPredictiveMaintenance(locationId: number | null, assetType: string | null, riskLevel: string | null): Promise<any[]>;
  getUtilizationOptimization(): Promise<any>;
  getLocationPerformanceAnalytics(): Promise<any[]>;
  createAssetTransfer(transfer: any): Promise<any>;
  getRealTimeDashboardData(): Promise<any>;
  getDashboardTrends(metric: string, period: string): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private assets: Map<string, Asset>;
  private employees: Map<number, Employee>;
  private locations: Map<number, Location>;
  private assignmentHistory: AssetAssignmentHistory[];
  private maintenance: AssetMaintenance[];
  private cctvSystems: Map<number, CctvSystem>;
  private biometricSystems: Map<number, BiometricSystem>;
  private backups: Backup[];
  
  // Counters for auto-increment IDs
  private nextEmployeeId: number = 1;
  private nextLocationId: number = 1;
  private nextAssignmentId: number = 1;
  private nextMaintenanceId: number = 1;
  private nextCctvId: number = 1;
  private nextBiometricId: number = 1;
  private nextBackupId: number = 1;

  constructor() {
    this.assets = new Map();
    this.employees = new Map();
    this.locations = new Map();
    this.assignmentHistory = [];
    this.maintenance = [];
    this.cctvSystems = new Map();
    this.biometricSystems = new Map();
    this.backups = [];
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  // Assets
  async getAsset(assetId: string): Promise<Asset | undefined> {
    return this.assets.get(assetId);
  }

  async getAllAssets(): Promise<Asset[]> {
    return Array.from(this.assets.values());
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const asset: Asset = {
      ...insertAsset,
      status: insertAsset.status || "available",
      condition: insertAsset.condition || "good",
      serviceTag: insertAsset.serviceTag || null,
      purchaseDate: insertAsset.purchaseDate || null,
      warrantyExpiry: insertAsset.warrantyExpiry || null,
      locationId: insertAsset.locationId || null,
      currentUserId: insertAsset.currentUserId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.assets.set(asset.assetId, asset);
    return asset;
  }

  async updateAsset(assetId: string, updateData: Partial<InsertAsset>): Promise<Asset | undefined> {
    const existing = this.assets.get(assetId);
    if (!existing) return undefined;
    
    // Prevent assetId changes as suggested by architect
    const { assetId: _, ...safeUpdateData } = updateData;
    
    const updated: Asset = {
      ...existing,
      ...safeUpdateData,
      assetId: existing.assetId, // Preserve original asset ID
      createdAt: existing.createdAt, // Preserve creation date
      updatedAt: new Date(),
    };
    this.assets.set(assetId, updated);
    return updated;
  }

  async deleteAsset(assetId: string): Promise<boolean> {
    return this.assets.delete(assetId);
  }

  // Employees
  async getEmployee(id: number): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const employee: Employee = {
      id: this.nextEmployeeId++,
      employeeCode: insertEmployee.employeeCode,
      firstName: insertEmployee.firstName,
      lastName: insertEmployee.lastName,
      department: insertEmployee.department,
      designation: insertEmployee.designation || null,
      email: insertEmployee.email || null,
      phone: insertEmployee.phone || null,
      status: insertEmployee.status || "active",
      locationId: insertEmployee.locationId || null,
      createdAt: new Date(),
    };
    this.employees.set(employee.id, employee);
    return employee;
  }

  async updateEmployee(id: number, updateData: Partial<InsertEmployee>): Promise<Employee | undefined> {
    const existing = this.employees.get(id);
    if (!existing) return undefined;
    
    const updated: Employee = { 
      ...existing, 
      ...updateData,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Preserve creation date
    };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: number): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Locations
  async getLocation(id: number): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values());
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const location: Location = {
      id: this.nextLocationId++,
      outletName: insertLocation.outletName,
      city: insertLocation.city,
      state: insertLocation.state,
      address: insertLocation.address || null,
      managerName: insertLocation.managerName || null,
      contactDetails: insertLocation.contactDetails || null,
      createdAt: new Date(),
    };
    this.locations.set(location.id, location);
    return location;
  }

  async updateLocation(id: number, updateData: Partial<InsertLocation>): Promise<Location | undefined> {
    const existing = this.locations.get(id);
    if (!existing) return undefined;
    
    const updated: Location = { 
      ...existing, 
      ...updateData,
      id: existing.id, // Prevent ID changes
      createdAt: existing.createdAt, // Preserve creation date
    };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: number): Promise<boolean> {
    return this.locations.delete(id);
  }

  // Assignment History
  async getAssignmentHistory(assetId?: string, employeeId?: number): Promise<AssetAssignmentHistory[]> {
    let filtered = this.assignmentHistory;
    
    if (assetId) {
      filtered = filtered.filter(h => h.assetId === assetId);
    }
    
    if (employeeId) {
      filtered = filtered.filter(h => h.employeeId === employeeId);
    }
    
    return filtered;
  }

  async createAssignment(insertAssignment: InsertAssetAssignmentHistory): Promise<AssetAssignmentHistory> {
    const assignment: AssetAssignmentHistory = {
      id: this.nextAssignmentId++,
      assetId: insertAssignment.assetId,
      employeeId: insertAssignment.employeeId,
      assignedDate: insertAssignment.assignedDate,
      returnedDate: insertAssignment.returnedDate || null,
      assignmentReason: insertAssignment.assignmentReason || null,
      returnReason: insertAssignment.returnReason || null,
      conditionOnAssignment: insertAssignment.conditionOnAssignment || null,
      conditionOnReturn: insertAssignment.conditionOnReturn || null,
      backupDetails: insertAssignment.backupDetails || null,
      createdBy: insertAssignment.createdBy || null,
      createdAt: new Date(),
    };
    this.assignmentHistory.push(assignment);
    return assignment;
  }

  // Maintenance
  async getMaintenanceRecords(assetId?: string): Promise<AssetMaintenance[]> {
    if (assetId) {
      return this.maintenance.filter(m => m.assetId === assetId);
    }
    return this.maintenance;
  }

  async createMaintenanceRecord(insertMaintenance: InsertAssetMaintenance): Promise<AssetMaintenance> {
    const maintenance: AssetMaintenance = {
      id: this.nextMaintenanceId++,
      assetId: insertMaintenance.assetId,
      maintenanceType: insertMaintenance.maintenanceType || null,
      description: insertMaintenance.description || null,
      scheduledDate: insertMaintenance.scheduledDate || null,
      completedDate: insertMaintenance.completedDate || null,
      cost: insertMaintenance.cost || null,
      technicianName: insertMaintenance.technicianName || null,
      partsReplaced: insertMaintenance.partsReplaced || null,
      createdAt: new Date(),
    };
    this.maintenance.push(maintenance);
    return maintenance;
  }

  async updateMaintenanceRecord(id: number, updateData: Partial<InsertAssetMaintenance>): Promise<AssetMaintenance | undefined> {
    const index = this.maintenance.findIndex(m => m.id === id);
    if (index === -1) return undefined;
    
    const updated: AssetMaintenance = { ...this.maintenance[index], ...updateData };
    this.maintenance[index] = updated;
    return updated;
  }

  async deleteMaintenanceRecord(id: number): Promise<boolean> {
    const index = this.maintenance.findIndex(m => m.id === id);
    if (index === -1) return false;
    this.maintenance.splice(index, 1);
    return true;
  }

  // CCTV Systems
  async getAllCctvSystems(): Promise<CctvSystem[]> {
    return Array.from(this.cctvSystems.values());
  }

  async createCctvSystem(insertSystem: InsertCctvSystem): Promise<CctvSystem> {
    const system: CctvSystem = {
      id: this.nextCctvId++,
      deviceName: insertSystem.deviceName,
      ipAddress: insertSystem.ipAddress,
      locationDetails: insertSystem.locationDetails || null,
      username: insertSystem.username || null,
      passwordHash: insertSystem.passwordHash || null,
      status: insertSystem.status || "online",
      lastOnline: insertSystem.lastOnline || null,
      locationId: insertSystem.locationId || null,
      createdAt: new Date(),
    };
    this.cctvSystems.set(system.id, system);
    return system;
  }

  async updateCctvSystem(id: number, updateData: Partial<InsertCctvSystem>): Promise<CctvSystem | undefined> {
    const existing = this.cctvSystems.get(id);
    if (!existing) return undefined;
    
    const updated: CctvSystem = { ...existing, ...updateData };
    this.cctvSystems.set(id, updated);
    return updated;
  }

  async deleteCctvSystem(id: number): Promise<boolean> {
    return this.cctvSystems.delete(id);
  }

  // Biometric Systems
  async getAllBiometricSystems(): Promise<BiometricSystem[]> {
    return Array.from(this.biometricSystems.values());
  }

  async createBiometricSystem(insertSystem: InsertBiometricSystem): Promise<BiometricSystem> {
    const system: BiometricSystem = {
      id: this.nextBiometricId++,
      deviceName: insertSystem.deviceName,
      deviceModel: insertSystem.deviceModel || null,
      ipAddress: insertSystem.ipAddress || null,
      locationDetails: insertSystem.locationDetails || null,
      employeeCount: insertSystem.employeeCount ?? 0,  // Fix: Use nullish coalescing to handle 0 properly
      lastSyncDate: insertSystem.lastSyncDate || null,
      status: insertSystem.status || "online",
      locationId: insertSystem.locationId || null,
      createdAt: new Date(),
    };
    this.biometricSystems.set(system.id, system);
    return system;
  }

  async updateBiometricSystem(id: number, updateData: Partial<InsertBiometricSystem>): Promise<BiometricSystem | undefined> {
    const existing = this.biometricSystems.get(id);
    if (!existing) return undefined;
    
    const updated: BiometricSystem = { ...existing, ...updateData };
    this.biometricSystems.set(id, updated);
    return updated;
  }

  async deleteBiometricSystem(id: number): Promise<boolean> {
    return this.biometricSystems.delete(id);
  }

  // Backups
  async getBackups(assetId?: string): Promise<Backup[]> {
    if (assetId) {
      return this.backups.filter(b => b.assetId === assetId);
    }
    return this.backups;
  }

  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const backup: Backup = {
      id: this.nextBackupId++,
      assetId: insertBackup.assetId,
      employeeId: insertBackup.employeeId || null,
      backupDate: insertBackup.backupDate,
      backupSize: insertBackup.backupSize || null,
      backupType: insertBackup.backupType || null,
      backupLocation: insertBackup.backupLocation || null,
      performedBy: insertBackup.performedBy || null,
      createdAt: new Date(),
    };
    this.backups.push(backup);
    return backup;
  }

  async updateBackup(id: number, updateData: Partial<InsertBackup>): Promise<Backup | undefined> {
    const index = this.backups.findIndex(b => b.id === id);
    if (index === -1) return undefined;
    
    const updated: Backup = { ...this.backups[index], ...updateData };
    this.backups[index] = updated;
    return updated;
  }

  async deleteBackup(id: number): Promise<boolean> {
    const index = this.backups.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.backups.splice(index, 1);
    return true;
  }

  private initializeSampleData() {
    // Sample locations
    const locations = [
      { outletName: "JP Nagar", city: "Bangalore", state: "Karnataka", managerName: "Rajesh Kumar", contactDetails: "rajesh@bodycraft.com" },
      { outletName: "Koramangala", city: "Bangalore", state: "Karnataka", managerName: "Priya Sharma", contactDetails: "priya@bodycraft.com" },
      { outletName: "Indiranagar", city: "Bangalore", state: "Karnataka", managerName: "Amit Singh", contactDetails: "amit@bodycraft.com" },
    ];

    locations.forEach(loc => {
      const location: Location = {
        ...loc,
        id: this.nextLocationId++,
        address: null,
        createdAt: new Date(),
      };
      this.locations.set(location.id, location);
    });

    // Sample employees
    const employees = [
      { employeeCode: "BFC2024001", firstName: "Rajesh", lastName: "Kumar", department: "IT", designation: "Manager", email: "rajesh@bodycraft.com", status: "active", locationId: 1 },
      { employeeCode: "BFC2024002", firstName: "Priya", lastName: "Sharma", department: "Sales", designation: "Executive", email: "priya@bodycraft.com", status: "active", locationId: 2 },
      { employeeCode: "BFC2024003", firstName: "Amit", lastName: "Singh", department: "Operations", designation: "Specialist", email: "amit@bodycraft.com", status: "active", locationId: 3 },
      { employeeCode: "BFC2024004", firstName: "Sunita", lastName: "Reddy", department: "Marketing", designation: "Specialist", email: "sunita@bodycraft.com", status: "active", locationId: 1 },
    ];

    employees.forEach(emp => {
      const employee: Employee = {
        ...emp,
        id: this.nextEmployeeId++,
        phone: null,
        createdAt: new Date(),
      };
      this.employees.set(employee.id, employee);
    });

    // Sample assets
    const assets = [
      { assetId: "BFC001", modelName: "ThinkPad E15", brand: "Lenovo", serviceTag: "LEN001", assetType: "Laptop", status: "assigned", condition: "good", locationId: 1, currentUserId: 1 },
      { assetId: "BFC002", modelName: "OptiPlex 3080", brand: "Dell", serviceTag: "DELL002", assetType: "Desktop", status: "available", condition: "excellent", locationId: 1, currentUserId: null },
      { assetId: "BFC003", modelName: "Surface Pro 8", brand: "Microsoft", serviceTag: "MS003", assetType: "Laptop", status: "assigned", condition: "good", locationId: 2, currentUserId: 2 },
      { assetId: "BFC004", modelName: "UZ2450", brand: "Dell", serviceTag: "DELL004", assetType: "Monitor", status: "available", condition: "good", locationId: 2, currentUserId: null },
      { assetId: "BFC005", modelName: "iPhone 14", brand: "Apple", serviceTag: "APL005", assetType: "Mobile", status: "assigned", condition: "excellent", locationId: 3, currentUserId: 3 },
      { assetId: "BFC006", modelName: "MacBook Pro 14", brand: "Apple", serviceTag: "APL006", assetType: "Laptop", status: "maintenance", condition: "fair", locationId: 3, currentUserId: null },
      { assetId: "BFC007", modelName: "ThinkPad X1", brand: "Lenovo", serviceTag: "LEN007", assetType: "Laptop", status: "assigned", condition: "good", locationId: 1, currentUserId: 4 },
    ];

    assets.forEach(asset => {
      const fullAsset: Asset = {
        ...asset,
        purchaseDate: null,
        warrantyExpiry: null,
        serviceTag: asset.serviceTag,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.assets.set(asset.assetId, fullAsset);
    });

    // Sample assignment history
    const assignmentHistory = [
      { assetId: "BFC001", employeeId: 1, assignedDate: "2024-01-15", returnedDate: null, assignmentReason: "New employee setup", createdBy: 1 },
      { assetId: "BFC003", employeeId: 2, assignedDate: "2024-02-01", returnedDate: null, assignmentReason: "Department transfer", createdBy: 1 },
      { assetId: "BFC005", employeeId: 3, assignedDate: "2024-02-15", returnedDate: null, assignmentReason: "Business requirement", createdBy: 1 },
      { assetId: "BFC007", employeeId: 4, assignedDate: "2024-03-01", returnedDate: null, assignmentReason: "New hire equipment", createdBy: 1 },
    ];

    assignmentHistory.forEach(hist => {
      const assignment: AssetAssignmentHistory = {
        ...hist,
        id: this.nextAssignmentId++,
        returnReason: null,
        conditionOnAssignment: null,
        conditionOnReturn: null,
        backupDetails: null,
        createdAt: new Date(),
      };
      this.assignmentHistory.push(assignment);
    });

    // Sample maintenance records
    const maintenanceRecords = [
      { assetId: "BFC006", maintenanceType: "corrective", description: "Screen replacement due to crack", scheduledDate: "2024-03-01", completedDate: "2024-03-02", cost: "15000.00", technicianName: "Ravi Tech Services", partsReplaced: "LCD Screen" },
      { assetId: "BFC001", maintenanceType: "preventive", description: "Regular cleaning and system check", scheduledDate: "2024-03-15", completedDate: "2024-03-15", cost: "500.00", technicianName: "Internal IT", partsReplaced: null },
      { assetId: "BFC002", maintenanceType: "upgrade", description: "RAM upgrade from 8GB to 16GB", scheduledDate: "2024-02-20", completedDate: "2024-02-21", cost: "3500.00", technicianName: "Dell Support", partsReplaced: "8GB DDR4 RAM" },
    ];

    maintenanceRecords.forEach(record => {
      const maintenance: AssetMaintenance = {
        id: this.nextMaintenanceId++,
        assetId: record.assetId,
        maintenanceType: record.maintenanceType,
        description: record.description,
        scheduledDate: record.scheduledDate,
        completedDate: record.completedDate,
        cost: record.cost,
        technicianName: record.technicianName,
        partsReplaced: record.partsReplaced,
        createdAt: new Date(),
      };
      this.maintenance.push(maintenance);
    });

    // Sample CCTV systems
    const cctvSystems = [
      { deviceName: "JP Nagar Entrance Camera", ipAddress: "192.168.1.101", locationDetails: "Main entrance", username: "admin", passwordHash: "hashed_password_1", status: "online", lastOnline: new Date(), locationId: 1 },
      { deviceName: "JP Nagar DVR System", ipAddress: "192.168.1.102", locationDetails: "Server room", username: "admin", passwordHash: "hashed_password_2", status: "online", lastOnline: new Date(), locationId: 1 },
      { deviceName: "Koramangala Reception Cam", ipAddress: "192.168.2.101", locationDetails: "Reception area", username: "admin", passwordHash: "hashed_password_3", status: "online", lastOnline: new Date(), locationId: 2 },
      { deviceName: "Indiranagar Security DVR", ipAddress: "192.168.3.101", locationDetails: "Security office", username: "admin", passwordHash: "hashed_password_4", status: "offline", lastOnline: null, locationId: 3 },
    ];

    cctvSystems.forEach(system => {
      const cctvSystem: CctvSystem = {
        id: this.nextCctvId++,
        deviceName: system.deviceName,
        ipAddress: system.ipAddress,
        locationDetails: system.locationDetails,
        username: system.username,
        passwordHash: system.passwordHash,
        status: system.status,
        lastOnline: system.lastOnline,
        locationId: system.locationId,
        createdAt: new Date(),
      };
      this.cctvSystems.set(cctvSystem.id, cctvSystem);
    });

    // Sample biometric systems
    const biometricSystems = [
      { deviceName: "JP Nagar Attendance", deviceModel: "eSSL K30 Pro", ipAddress: "192.168.1.201", locationDetails: "Main entrance", employeeCount: 15, lastSyncDate: new Date(), status: "online", locationId: 1 },
      { deviceName: "Koramangala Biometric", deviceModel: "ZKTeco F18", ipAddress: "192.168.2.201", locationDetails: "Employee entrance", employeeCount: 12, lastSyncDate: new Date(), status: "online", locationId: 2 },
      { deviceName: "Indiranagar Access Control", deviceModel: "Realtime T502", ipAddress: "192.168.3.201", locationDetails: "Staff entry", employeeCount: 18, lastSyncDate: new Date(), status: "error", locationId: 3 },
    ];

    biometricSystems.forEach(system => {
      const biometricSystem: BiometricSystem = {
        id: this.nextBiometricId++,
        deviceName: system.deviceName,
        deviceModel: system.deviceModel,
        ipAddress: system.ipAddress,
        locationDetails: system.locationDetails,
        employeeCount: system.employeeCount,
        lastSyncDate: system.lastSyncDate,
        status: system.status,
        locationId: system.locationId,
        createdAt: new Date(),
      };
      this.biometricSystems.set(biometricSystem.id, biometricSystem);
    });

    // Sample backup records
    const backupRecords = [
      { assetId: "BFC001", employeeId: 1, backupDate: new Date("2024-01-14"), backupSize: "250GB", backupType: "full", backupLocation: "NAS Server - /backups/users/rajesh", performedBy: 1 },
      { assetId: "BFC003", employeeId: 2, backupDate: new Date("2024-01-31"), backupSize: "180GB", backupType: "selective", backupLocation: "Cloud Storage - AWS S3", performedBy: 1 },
      { assetId: "BFC005", employeeId: 3, backupDate: new Date("2024-02-14"), backupSize: "128GB", backupType: "full", backupLocation: "Local Server - /backups/mobile", performedBy: 1 },
    ];

    backupRecords.forEach(record => {
      const backup: Backup = {
        id: this.nextBackupId++,
        assetId: record.assetId,
        employeeId: record.employeeId,
        backupDate: record.backupDate,
        backupSize: record.backupSize,
        backupType: record.backupType,
        backupLocation: record.backupLocation,
        performedBy: record.performedBy,
        createdAt: new Date(),
      };
      this.backups.push(backup);
    });
  }
}

import { DatabaseStorage } from "./database-storage";

export const storage = new DatabaseStorage();
