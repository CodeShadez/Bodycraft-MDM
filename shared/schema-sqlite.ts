// ==================== COMPLIANCE TASKS & EVIDENCE TABLES ====================

export const complianceTasks = sqliteTable("compliance_tasks", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description"),
  taskType: text("task_type").notNull(),
  status: text("status").notNull().default("pending"),
  priority: text("priority").notNull().default("medium"),
  dueDate: text("due_date"),
  completedAt: text("completed_at"),
  assignedTo: integer("assigned_to").references(() => users.id),
  createdBy: integer("created_by").references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  relatedAssetId: text("related_asset_id").references(() => assets.assetId),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertComplianceTaskSchema = createInsertSchema(complianceTasks);
export type ComplianceTask = typeof complianceTasks.$inferSelect;
export type InsertComplianceTask = z.infer<typeof insertComplianceTaskSchema>;

export const complianceEvidence = sqliteTable("compliance_evidence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => complianceTasks.id),
  evidenceType: text("evidence_type").notNull(),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  uploadedAt: text("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertComplianceEvidenceSchema = createInsertSchema(complianceEvidence);
export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = z.infer<typeof insertComplianceEvidenceSchema>;

export const complianceAuditTrail = sqliteTable("compliance_audit_trail", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull().references(() => complianceTasks.id),
  action: text("action").notNull(),
  performedBy: integer("performed_by").references(() => users.id),
  comments: text("comments"),
  timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
});
export const insertComplianceAuditTrailSchema = createInsertSchema(complianceAuditTrail);
export type ComplianceAuditTrail = typeof complianceAuditTrail.$inferSelect;
export type InsertComplianceAuditTrail = z.infer<typeof insertComplianceAuditTrailSchema>;

export const assetTransfers = sqliteTable("asset_transfers", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id").notNull().references(() => assets.assetId),
  fromLocationId: integer("from_location_id").references(() => locations.id),
  toLocationId: integer("to_location_id").references(() => locations.id),
  transferDate: text("transfer_date").notNull(),
  transferredBy: integer("transferred_by").references(() => users.id),
  receivedBy: integer("received_by").references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertAssetTransferSchema = createInsertSchema(assetTransfers);
export type AssetTransfer = typeof assetTransfers.$inferSelect;
export type InsertAssetTransfer = z.infer<typeof insertAssetTransferSchema>;
// ==================== ADDITIONAL SCHEMAS AND TYPES ====================

// Invoice Table (minimal, for type compatibility)
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceDate: text("invoice_date").notNull(),
  amount: real("amount").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  vendorName: text("vendor_name"),
  relatedAssetId: text("related_asset_id").references(() => assets.assetId),
  relatedMaintenanceId: integer("related_maintenance_id"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  fileSize: text("file_size"),
  paymentStatus: text("payment_status").notNull().default("unpaid"),
  paymentDate: text("payment_date"),
  paymentMethod: text("payment_method"),
  locationId: integer("location_id").references(() => locations.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertInvoiceSchema = createInsertSchema(invoices);
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// ApprovalRequest Table (minimal, for type compatibility)
export const approvalRequests = sqliteTable("approval_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestType: text("request_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  currentValue: text("current_value"),
  newValue: text("new_value").notNull(),
  reason: text("reason"),
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  requestedAt: text("requested_at").default(sql`CURRENT_TIMESTAMP`),
  status: text("status").notNull().default("pending"),
  currentApprovalLevel: integer("current_approval_level").notNull().default(1),
  requiredApprovalLevels: integer("required_approval_levels").notNull().default(1),
  completedAt: text("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests);
export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

// ApprovalAction Table (minimal, for type compatibility)
export const approvalActions = sqliteTable("approval_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  requestId: integer("request_id").notNull().references(() => approvalRequests.id),
  approvalLevel: integer("approval_level").notNull(),
  actionBy: integer("action_by").notNull().references(() => users.id),
  action: text("action").notNull(),
  comments: text("comments"),
  actionAt: text("action_at").default(sql`CURRENT_TIMESTAMP`),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});
export const insertApprovalActionSchema = createInsertSchema(approvalActions);
export type ApprovalAction = typeof approvalActions.$inferSelect;
export type InsertApprovalAction = z.infer<typeof insertApprovalActionSchema>;

// Password Reset Schemas
export const passwordResetSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export const adminPasswordResetSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm the password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
// ==================== AI COMPLIANCE AUTOMATION TABLES ====================

export const complianceSignals = sqliteTable("compliance_signals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id").references(() => assets.assetId),
  locationId: integer("location_id").references(() => locations.id),
  signalType: text("signal_type").notNull(),
  signalData: text("signal_data"),
  severity: text("severity").notNull(),
  detectedAt: text("detected_at").default(sql`CURRENT_TIMESTAMP`),
  resolvedAt: text("resolved_at"),
  status: text("status").notNull().default("active"),
});

export const complianceRiskScores = sqliteTable("compliance_risk_scores", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id").references(() => assets.assetId),
  locationId: integer("location_id").references(() => locations.id),
  riskScore: integer("risk_score").notNull(),
  riskLevel: text("risk_level").notNull(),
  riskFactors: text("risk_factors"),
  aiModel: text("ai_model"),
  confidence: integer("confidence"),
  calculatedAt: text("calculated_at").default(sql`CURRENT_TIMESTAMP`),
  validUntil: text("valid_until"),
});

export const automationRuns = sqliteTable("automation_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runType: text("run_type").notNull(),
  tasksGenerated: integer("tasks_generated").default(0),
  risksDetected: integer("risks_detected").default(0),
  backupsVerified: integer("backups_verified").default(0),
  assignmentsCreated: integer("assignments_created").default(0),
  status: text("status").notNull().default("running"),
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  triggeredBy: integer("triggered_by").references(() => users.id),
  startedAt: text("started_at").default(sql`CURRENT_TIMESTAMP`),
  completedAt: text("completed_at"),
});

export const aiRecommendations = sqliteTable("ai_recommendations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  recommendationType: text("recommendation_type").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionItems: text("action_items"),
  priority: text("priority").notNull().default("medium"),
  estimatedCost: integer("estimated_cost"),
  estimatedImpact: text("estimated_impact"),
  aiModel: text("ai_model"),
  confidence: integer("confidence"),
  status: text("status").notNull().default("pending"),
  implementedBy: integer("implemented_by").references(() => users.id),
  implementedAt: text("implemented_at"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const backupVerification = sqliteTable("backup_verification", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  backupId: integer("backup_id").references(() => backups.id),
  assetId: text("asset_id").references(() => assets.assetId),
  verificationMethod: text("verification_method").notNull(),
  verificationStatus: text("verification_status").notNull(),
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: text("verified_at").default(sql`CURRENT_TIMESTAMP`),
  nextVerificationDue: text("next_verification_due"),
});

export const complianceAssignmentQueue = sqliteTable("compliance_assignment_queue", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  taskId: integer("task_id").notNull(),
  assignmentReason: text("assignment_reason"),
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  workloadScore: integer("workload_score"),
  skillMatch: integer("skill_match"),
  priorityScore: integer("priority_score"),
  automationRunId: integer("automation_run_id").references(() => automationRuns.id),
  assignedAt: text("assigned_at").default(sql`CURRENT_TIMESTAMP`),
  acceptedAt: text("accepted_at"),
  status: text("status").notNull().default("assigned"),
});

// Insert Schemas for automation tables
export const insertComplianceSignalSchema = createInsertSchema(complianceSignals);
export const insertComplianceRiskScoreSchema = createInsertSchema(complianceRiskScores);
export const insertAutomationRunSchema = createInsertSchema(automationRuns);
export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations);
export const insertBackupVerificationSchema = createInsertSchema(backupVerification);
export const insertComplianceAssignmentQueueSchema = createInsertSchema(complianceAssignmentQueue);

// Types
export type ComplianceSignal = typeof complianceSignals.$inferSelect;
export type InsertComplianceSignal = z.infer<typeof insertComplianceSignalSchema>;
export type ComplianceRiskScore = typeof complianceRiskScores.$inferSelect;
export type InsertComplianceRiskScore = z.infer<typeof insertComplianceRiskScoreSchema>;
export type AutomationRun = typeof automationRuns.$inferSelect;
export type InsertAutomationRun = z.infer<typeof insertAutomationRunSchema>;
export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = z.infer<typeof insertAiRecommendationSchema>;
export type BackupVerification = typeof backupVerification.$inferSelect;
export type InsertBackupVerification = z.infer<typeof insertBackupVerificationSchema>;
export type ComplianceAssignmentQueue = typeof complianceAssignmentQueue.$inferSelect;
export type InsertComplianceAssignmentQueue = z.infer<typeof insertComplianceAssignmentQueueSchema>;
import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 0. DEPARTMENTS - Business units including outlets and corporate departments
export const departments = sqliteTable("departments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  type: text("type").notNull(), // outlet, corporate
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isCustom: integer("is_custom", { mode: "boolean" }).notNull().default(false), // true for super admin created departments
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 1. LOCATIONS - 32 BODYCRAFT outlets across India
export const locations = sqliteTable("locations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  outletName: text("outlet_name").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  address: text("address"),
  managerName: text("manager_name"),
  contactDetails: text("contact_details"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 2. EMPLOYEES - Staff members who can be assigned assets
export const employees = sqliteTable("employees", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  employeeCode: text("employee_code").notNull().unique(), // BFC2024001, BFC2024002
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  department: text("department").notNull(), // IT, Sales, Operations, Clinic
  designation: text("designation"),
  email: text("email").unique(),
  phone: text("phone"),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  locationId: integer("location_id").references(() => locations.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 3. ASSETS - Core entity for all IT assets
export const assets = sqliteTable("assets", {
  assetId: text("asset_id").primaryKey(), // BFC001, BFC002, etc.
  modelName: text("model_name").notNull(),
  brand: text("brand").notNull(),
  serviceTag: text("service_tag").unique(),
  assetType: text("asset_type").notNull(), // Laptop, Desktop, Monitor, Mobile
  purchaseDate: text("purchase_date"),
  warrantyExpiry: text("warranty_expiry"),
  status: text("status").notNull().default("available"), // available, assigned, maintenance, retired
  condition: text("condition").notNull().default("good"), // excellent, good, fair, poor

  // Enhanced asset categorization and location tracking
  departmentId: integer("department_id").references(() => departments.id), // Salon, Clinic, Skin & Spa, IT, Marketing, etc.
  physicalLocation: text("physical_location"), // Reception, Front Desk, Room 1, etc.
  floor: text("floor"), // Ground Floor, 1st Floor, 2nd Floor, etc.

  // Ownership and assignment type
  ownershipType: text("ownership_type").notNull().default("company"), // company, rented, personal
  assignmentType: text("assignment_type").notNull().default("person"), // person, outlet

  locationId: integer("location_id").references(() => locations.id),
  currentUserId: integer("current_user_id").references(() => employees.id), // NULL if assigned to outlet
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// 4. ASSET ASSIGNMENT HISTORY - Critical for never losing assignment history
export const assetAssignmentHistory = sqliteTable("asset_assignment_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.assetId),
  employeeId: integer("employee_id")
    .notNull()
    .references(() => employees.id),
  assignedDate: text("assigned_date").notNull(),
  returnedDate: text("returned_date"), // NULL for active assignments
  assignmentReason: text("assignment_reason"),
  returnReason: text("return_reason"),
  conditionOnAssignment: text("condition_on_assignment"),
  conditionOnReturn: text("condition_on_return"),
  backupDetails: text("backup_details"),
  createdBy: integer("created_by").references(() => employees.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 5. ASSET MAINTENANCE - Preventive and corrective maintenance
export const assetMaintenance = sqliteTable("asset_maintenance", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.assetId),
  maintenanceType: text("maintenance_type"), // preventive, corrective, upgrade
  description: text("description"),
  scheduledDate: text("scheduled_date"),
  completedDate: text("completed_date"),
  cost: real("cost"),
  technicianName: text("technician_name"),
  partsReplaced: text("parts_replaced"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 6. CCTV SYSTEMS - Integration with Hikvision devices
export const cctvSystems = sqliteTable("cctv_systems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceName: text("device_name").notNull(),
  ipAddress: text("ip_address").notNull(), // Support IPv6 addresses
  locationDetails: text("location_details"),
  username: text("username"),
  passwordHash: text("password_hash"),
  status: text("status").notNull().default("online"), // online, offline, error
  lastOnline: text("last_online"),
  locationId: integer("location_id").references(() => locations.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 7. BIOMETRIC SYSTEMS - Employee synchronization and attendance
export const biometricSystems = sqliteTable("biometric_systems", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceName: text("device_name").notNull(),
  deviceModel: text("device_model"),
  ipAddress: text("ip_address"),
  locationDetails: text("location_details"),
  employeeCount: integer("employee_count").default(0),
  lastSyncDate: text("last_sync_date"),
  status: text("status").notNull().default("online"),
  locationId: integer("location_id").references(() => locations.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 8. BACKUPS - Data security and compliance tracking
export const backups = sqliteTable("backups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  assetId: text("asset_id")
    .notNull()
    .references(() => assets.assetId),
  employeeId: integer("employee_id").references(() => employees.id),
  backupDate: text("backup_date").notNull(),
  backupSize: text("backup_size"),
  backupType: text("backup_type"), // full, incremental, selective
  backupLocation: text("backup_location"),
  performedBy: integer("performed_by").references(() => employees.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// 9. USERS - Authentication and system access (separate from employees)
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  role: text("role").notNull().default("user"), // super_admin, admin, location_user, user
  locationId: integer("location_id").references(() => locations.id), // For location-specific access (location_user role)
  status: text("status").notNull().default("active"), // active, inactive, locked
  lastLogin: text("last_login"),
  employeeId: integer("employee_id").references(() => employees.id), // Link to employee record if applicable
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// 10. COMPANY SETTINGS - System configuration
export const companySettings = sqliteTable("company_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyName: text("company_name").notNull().default("BODYCRAFT"),
  logoUrl: text("logo_url"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  dateFormat: text("date_format").notNull().default("DD/MM/YYYY"),
  language: text("language").notNull().default("en"),
  sessionTimeout: integer("session_timeout").notNull().default(480), // minutes
  passwordMinLength: integer("password_min_length").notNull().default(8),
  emailNotificationsEnabled: integer("email_notifications_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  maintenanceMode: integer("maintenance_mode", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// 11. ASSET TYPES - Configurable asset categories
export const assetTypes = sqliteTable("asset_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // Laptop, Desktop, Monitor, etc.
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Insert Schemas - Zod schemas for validation
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertLocationSchema = createInsertSchema(locations);
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertAssetSchema = createInsertSchema(assets);
export const insertAssetAssignmentHistorySchema = createInsertSchema(
  assetAssignmentHistory,
);
export const insertAssetMaintenanceSchema =
  createInsertSchema(assetMaintenance);
export const insertCctvSystemSchema = createInsertSchema(cctvSystems);
export const insertBiometricSystemSchema = createInsertSchema(biometricSystems);
export const insertBackupSchema = createInsertSchema(backups);
export const insertUserSchema = createInsertSchema(users);
export const insertCompanySettingsSchema = createInsertSchema(companySettings);
export const insertAssetTypeSchema = createInsertSchema(assetTypes);

// TypeScript Types
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;

export type AssetAssignmentHistory = typeof assetAssignmentHistory.$inferSelect;
export type InsertAssetAssignmentHistory = z.infer<
  typeof insertAssetAssignmentHistorySchema
>;

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = z.infer<
  typeof insertAssetMaintenanceSchema
>;

export type CctvSystem = typeof cctvSystems.$inferSelect;
export type InsertCctvSystem = z.infer<typeof insertCctvSystemSchema>;

export type BiometricSystem = typeof biometricSystems.$inferSelect;
export type InsertBiometricSystem = z.infer<typeof insertBiometricSystemSchema>;

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export type AssetType = typeof assetTypes.$inferSelect;
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;
