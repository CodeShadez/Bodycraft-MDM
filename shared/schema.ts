import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 0. DEPARTMENTS - Business units including outlets and corporate departments
export const departments = pgTable("departments", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  type: varchar("type", { length: 50 }).notNull(), // outlet, corporate
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  isCustom: boolean("is_custom").notNull().default(false), // true for super admin created departments
  createdAt: timestamp("created_at").defaultNow(),
});

// 1. LOCATIONS - 32 BODYCRAFT outlets across India
export const locations = pgTable("locations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  outletName: varchar("outlet_name", { length: 255 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 100 }).notNull(),
  address: text("address"),
  managerName: varchar("manager_name", { length: 255 }),
  contactDetails: varchar("contact_details", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// 2. EMPLOYEES - Staff members who can be assigned assets
export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  employeeCode: varchar("employee_code", { length: 50 }).notNull().unique(), // BFC2024001, BFC2024002
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  department: varchar("department", { length: 100 }).notNull(), // IT, Sales, Operations, Clinic
  designation: varchar("designation", { length: 100 }),
  email: varchar("email", { length: 255 }).unique(),
  phone: varchar("phone", { length: 20 }),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, terminated
  locationId: integer("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 3. ASSETS - Core entity for all IT assets
export const assets = pgTable("assets", {
  assetId: varchar("asset_id", { length: 20 }).primaryKey(), // BFC001, BFC002, etc.
  modelName: varchar("model_name", { length: 255 }).notNull(),
  brand: varchar("brand", { length: 100 }).notNull(),
  serviceTag: varchar("service_tag", { length: 100 }).unique(),
  assetType: varchar("asset_type", { length: 50 }).notNull(), // Laptop, Desktop, Monitor, Mobile
  purchaseDate: date("purchase_date"),
  warrantyExpiry: date("warranty_expiry"),
  status: varchar("status", { length: 20 }).notNull().default("available"), // available, assigned, maintenance, retired
  condition: varchar("condition", { length: 20 }).notNull().default("good"), // excellent, good, fair, poor
  
  // Enhanced asset categorization and location tracking
  departmentId: integer("department_id").references(() => departments.id), // Salon, Clinic, Skin & Spa, IT, Marketing, etc.
  physicalLocation: varchar("physical_location", { length: 255 }), // Reception, Front Desk, Room 1, etc.
  floor: varchar("floor", { length: 50 }), // Ground Floor, 1st Floor, 2nd Floor, etc.
  
  // Ownership and assignment type
  ownershipType: varchar("ownership_type", { length: 20 }).notNull().default("company"), // company, rented, personal
  assignmentType: varchar("assignment_type", { length: 20 }).notNull().default("person"), // person, outlet
  
  locationId: integer("location_id").references(() => locations.id),
  currentUserId: integer("current_user_id").references(() => employees.id), // NULL if assigned to outlet
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 4. ASSET ASSIGNMENT HISTORY - Critical for never losing assignment history
export const assetAssignmentHistory = pgTable("asset_assignment_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).notNull().references(() => assets.assetId),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  assignedDate: date("assigned_date").notNull(),
  returnedDate: date("returned_date"), // NULL for active assignments
  assignmentReason: text("assignment_reason"),
  returnReason: text("return_reason"),
  conditionOnAssignment: varchar("condition_on_assignment", { length: 20 }),
  conditionOnReturn: varchar("condition_on_return", { length: 20 }),
  backupDetails: text("backup_details"),
  createdBy: integer("created_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 5. ASSET MAINTENANCE - Preventive and corrective maintenance
export const assetMaintenance = pgTable("asset_maintenance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).notNull().references(() => assets.assetId),
  maintenanceType: varchar("maintenance_type", { length: 50 }), // preventive, corrective, upgrade
  description: text("description"),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  cost: decimal("cost", { precision: 10, scale: 2 }),
  technicianName: varchar("technician_name", { length: 255 }),
  partsReplaced: text("parts_replaced"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 6. CCTV SYSTEMS - Integration with Hikvision devices
export const cctvSystems = pgTable("cctv_systems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  ipAddress: varchar("ip_address", { length: 45 }).notNull(), // Support IPv6 addresses
  locationDetails: text("location_details"),
  username: varchar("username", { length: 100 }),
  passwordHash: varchar("password_hash", { length: 255 }),
  status: varchar("status", { length: 20 }).notNull().default("online"), // online, offline, error
  lastOnline: timestamp("last_online"),
  locationId: integer("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 7. BIOMETRIC SYSTEMS - Employee synchronization and attendance
export const biometricSystems = pgTable("biometric_systems", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  deviceName: varchar("device_name", { length: 255 }).notNull(),
  deviceModel: varchar("device_model", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  locationDetails: text("location_details"),
  employeeCount: integer("employee_count").default(0),
  lastSyncDate: timestamp("last_sync_date"),
  status: varchar("status", { length: 20 }).notNull().default("online"),
  locationId: integer("location_id").references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 8. BACKUPS - Data security and compliance tracking
export const backups = pgTable("backups", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).notNull().references(() => assets.assetId),
  employeeId: integer("employee_id").references(() => employees.id),
  backupDate: timestamp("backup_date").notNull(),
  backupSize: varchar("backup_size", { length: 50 }),
  backupType: varchar("backup_type", { length: 50 }), // full, incremental, selective
  backupLocation: text("backup_location"),
  performedBy: integer("performed_by").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// 9. REPORT EXECUTIONS - Track when reports are generated for real statistics
export const reportExecutions = pgTable("report_executions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  templateId: varchar("template_id", { length: 100 }).notNull(), // asset-inventory, maintenance-summary, etc.
  reportName: varchar("report_name", { length: 255 }).notNull(),
  format: varchar("format", { length: 20 }).notNull(), // excel, csv, pdf
  filters: text("filters"), // JSON string of applied filters
  recordCount: integer("record_count"), // Number of records in generated report
  fileSize: varchar("file_size", { length: 50 }), // Generated file size
  executionTime: integer("execution_time_ms"), // Time taken to generate in milliseconds
  executedBy: integer("executed_by").references(() => employees.id), // Who ran the report
  locationId: integer("location_id").references(() => locations.id), // Location context if applicable
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, failed, cancelled
  errorMessage: text("error_message"), // If status is failed
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas - Zod schemas for validation (fields excluded via Drizzle, not Zod)
export const insertDepartmentSchema = createInsertSchema(departments);
export const insertLocationSchema = createInsertSchema(locations);
export const insertEmployeeSchema = createInsertSchema(employees);
export const insertAssetSchema = createInsertSchema(assets);
export const insertAssetAssignmentHistorySchema = createInsertSchema(assetAssignmentHistory);
export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance);
export const insertCctvSystemSchema = createInsertSchema(cctvSystems);
export const insertBiometricSystemSchema = createInsertSchema(biometricSystems);
export const insertBackupSchema = createInsertSchema(backups);
export const insertReportExecutionSchema = createInsertSchema(reportExecutions);

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
export type InsertAssetAssignmentHistory = z.infer<typeof insertAssetAssignmentHistorySchema>;

export type AssetMaintenance = typeof assetMaintenance.$inferSelect;
export type InsertAssetMaintenance = z.infer<typeof insertAssetMaintenanceSchema>;

export type CctvSystem = typeof cctvSystems.$inferSelect;
export type InsertCctvSystem = z.infer<typeof insertCctvSystemSchema>;

export type BiometricSystem = typeof biometricSystems.$inferSelect;
export type InsertBiometricSystem = z.infer<typeof insertBiometricSystemSchema>;

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;

export type ReportExecution = typeof reportExecutions.$inferSelect;
export type InsertReportExecution = z.infer<typeof insertReportExecutionSchema>;

// USER AUTHENTICATION AND SETTINGS TABLES

// 10. USERS - Authentication and system access (separate from employees)
export const users = pgTable("users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("user"), // super_admin, admin, location_user, user
  locationId: integer("location_id").references(() => locations.id), // For location-specific access (location_user role)
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, inactive, locked
  lastLogin: timestamp("last_login"),
  employeeId: integer("employee_id").references(() => employees.id), // Link to employee record if applicable
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 11. USER SESSIONS - Track active user sessions
export const userSessions = pgTable("user_sessions", {
  id: varchar("id", { length: 255 }).primaryKey(), // Session ID
  userId: integer("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// 12. COMPANY SETTINGS - System configuration
export const companySettings = pgTable("company_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyName: varchar("company_name", { length: 255 }).notNull().default("BODYCRAFT"),
  logoUrl: varchar("logo_url", { length: 500 }),
  timezone: varchar("timezone", { length: 100 }).notNull().default("Asia/Kolkata"),
  dateFormat: varchar("date_format", { length: 20 }).notNull().default("DD/MM/YYYY"),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  sessionTimeout: integer("session_timeout").notNull().default(480), // minutes
  passwordMinLength: integer("password_min_length").notNull().default(8),
  emailNotificationsEnabled: boolean("email_notifications_enabled").notNull().default(true),
  maintenanceMode: boolean("maintenance_mode").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 13. ASSET TYPES - Configurable asset categories
export const assetTypes = pgTable("asset_types", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 100 }).notNull().unique(), // Laptop, Desktop, Monitor, etc.
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// 14. APPROVAL REQUESTS - Multi-level approval system for asset transfers and assignments
export const approvalRequests = pgTable("approval_requests", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestType: varchar("request_type", { length: 50 }).notNull(), // asset_transfer, asset_assignment, employee_transfer
  entityType: varchar("entity_type", { length: 50 }).notNull(), // asset, employee
  entityId: varchar("entity_id", { length: 50 }).notNull(), // assetId or employeeId
  
  // Current and new values (JSON for flexibility)
  currentValue: text("current_value"), // JSON: { locationId: 1, employeeId: null }
  newValue: text("new_value").notNull(), // JSON: { locationId: 2, employeeId: 5 }
  
  reason: text("reason"), // Why this change is needed
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected, cancelled
  currentApprovalLevel: integer("current_approval_level").notNull().default(1), // Track multi-level progress
  requiredApprovalLevels: integer("required_approval_levels").notNull().default(1), // How many levels needed
  
  completedAt: timestamp("completed_at"),
  completedBy: integer("completed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 15. APPROVAL ACTIONS - Track each approval/rejection action
export const approvalActions = pgTable("approval_actions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  requestId: integer("request_id").notNull().references(() => approvalRequests.id),
  approvalLevel: integer("approval_level").notNull(), // 1, 2, 3 for multi-level approvals
  
  actionBy: integer("action_by").notNull().references(() => users.id),
  action: varchar("action", { length: 20 }).notNull(), // approved, rejected
  comments: text("comments"),
  
  actionAt: timestamp("action_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schemas for new tables
export const insertUserSchema = createInsertSchema(users);
export const insertUserSessionSchema = createInsertSchema(userSessions);
export const insertCompanySettingsSchema = createInsertSchema(companySettings);
export const insertAssetTypeSchema = createInsertSchema(assetTypes);
export const insertApprovalRequestSchema = createInsertSchema(approvalRequests);
export const insertApprovalActionSchema = createInsertSchema(approvalActions);

// TypeScript Types for new tables
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;

export type CompanySettings = typeof companySettings.$inferSelect;
export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;

export type AssetType = typeof assetTypes.$inferSelect;
export type InsertAssetType = z.infer<typeof insertAssetTypeSchema>;

export type ApprovalRequest = typeof approvalRequests.$inferSelect;
export type InsertApprovalRequest = z.infer<typeof insertApprovalRequestSchema>;

export type ApprovalAction = typeof approvalActions.$inferSelect;
export type InsertApprovalAction = z.infer<typeof insertApprovalActionSchema>;

// 16. INVOICES - Financial tracking for all expenses and purchases
export const invoices = pgTable("invoices", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  invoiceNumber: varchar("invoice_number", { length: 100 }).notNull().unique(),
  invoiceDate: date("invoice_date").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  
  category: varchar("category", { length: 50 }).notNull(), // repair, asset_purchase, maintenance, expense, other
  description: text("description").notNull(),
  vendorName: varchar("vendor_name", { length: 255 }),
  
  // Optional relationships
  relatedAssetId: varchar("related_asset_id", { length: 20 }).references(() => assets.assetId),
  relatedMaintenanceId: integer("related_maintenance_id").references(() => assetMaintenance.id),
  
  // File upload
  fileUrl: text("file_url"), // Path to uploaded invoice document
  fileName: varchar("file_name", { length: 255 }), // Original file name
  fileSize: varchar("file_size", { length: 50 }), // File size for display
  
  // Payment tracking
  paymentStatus: varchar("payment_status", { length: 20 }).notNull().default("unpaid"), // paid, unpaid, partial, overdue
  paymentDate: date("payment_date"),
  paymentMethod: varchar("payment_method", { length: 50 }), // bank_transfer, cash, card, cheque
  
  locationId: integer("location_id").references(() => locations.id),
  uploadedBy: integer("uploaded_by").references(() => users.id),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Insert Schema
export const insertInvoiceSchema = createInsertSchema(invoices);

// TypeScript Types
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

// 17. COMPLIANCE TASKS - Compliance and regulatory tracking
export const complianceTasks = pgTable("compliance_tasks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  taskType: varchar("task_type", { length: 50 }).notNull(), // backup, security_audit, policy_review, system_update, data_retention, access_review
  description: text("description"),
  category: varchar("category", { length: 50 }).notNull(), // data_backup, security, compliance, maintenance, governance
  priority: varchar("priority", { length: 20 }).notNull().default("medium"), // low, medium, high, critical
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, in_progress, completed, overdue, exempted
  
  assignedTo: integer("assigned_to").references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  
  dueDate: date("due_date").notNull(),
  completionDate: date("completion_date"),
  
  evidenceFiles: text("evidence_files").array(), // Array of file URLs
  complianceScore: integer("compliance_score"), // 0-100
  riskLevel: varchar("risk_level", { length: 20 }), // low, medium, high, critical
  regulatoryFramework: varchar("regulatory_framework", { length: 100 }), // GDPR, ISO27001, etc.
  notes: text("notes"),
  
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 18. COMPLIANCE EVIDENCE - File evidence for compliance tasks
export const complianceEvidence = pgTable("compliance_evidence", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => complianceTasks.id, { onDelete: "cascade" }),
  
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileType: varchar("file_type", { length: 50 }), // pdf, xlsx, jpg, png, etc.
  fileSize: varchar("file_size", { length: 50 }), // "2.5 MB"
  
  uploadedBy: integer("uploaded_by").notNull().references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  verificationStatus: varchar("verification_status", { length: 20 }).default("pending"), // pending, verified, rejected
});

// 19. COMPLIANCE AUDIT TRAIL - Complete audit log for compliance actions
export const complianceAuditTrail = pgTable("compliance_audit_trail", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").references(() => complianceTasks.id, { onDelete: "cascade" }),
  
  action: text("action").notNull(), // created, updated, deleted, evidence_uploaded, status_changed, etc.
  performedBy: integer("performed_by").notNull().references(() => users.id),
  
  oldValues: text("old_values"), // JSONB stored as text
  newValues: text("new_values"), // JSONB stored as text
  
  timestamp: timestamp("timestamp").defaultNow(),
  ipAddress: varchar("ip_address", { length: 45 }), // Support IPv6
  userAgent: text("user_agent"),
});

// Insert Schemas for compliance tables
export const insertComplianceTaskSchema = createInsertSchema(complianceTasks);
export const insertComplianceEvidenceSchema = createInsertSchema(complianceEvidence);
export const insertComplianceAuditTrailSchema = createInsertSchema(complianceAuditTrail);

// TypeScript Types for compliance tables
export type ComplianceTask = typeof complianceTasks.$inferSelect;
export type InsertComplianceTask = z.infer<typeof insertComplianceTaskSchema>;

export type ComplianceEvidence = typeof complianceEvidence.$inferSelect;
export type InsertComplianceEvidence = z.infer<typeof insertComplianceEvidenceSchema>;

export type ComplianceAuditTrail = typeof complianceAuditTrail.$inferSelect;
export type InsertComplianceAuditTrail = z.infer<typeof insertComplianceAuditTrailSchema>;

// 20. ASSET TRANSFERS - Track asset transfers between locations
export const assetTransfers = pgTable("asset_transfers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).notNull().references(() => assets.assetId),
  
  fromLocationId: integer("from_location_id").notNull().references(() => locations.id),
  toLocationId: integer("to_location_id").notNull().references(() => locations.id),
  
  transferReason: text("transfer_reason"),
  transferDate: date("transfer_date").notNull(),
  
  requestedBy: integer("requested_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  
  status: varchar("status", { length: 20 }).notNull().default("completed"), // completed, pending, cancelled
  approvalRequestId: integer("approval_request_id").references(() => approvalRequests.id),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert Schema
export const insertAssetTransferSchema = createInsertSchema(assetTransfers);

// TypeScript Types
export type AssetTransfer = typeof assetTransfers.$inferSelect;
export type InsertAssetTransfer = z.infer<typeof insertAssetTransferSchema>;

// Password Reset Schema (Self-service)
export const passwordResetSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// Admin Password Reset Schema (For admins resetting other users' passwords)
export const adminPasswordResetSchema = z.object({
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm the password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

// ==================== AI COMPLIANCE AUTOMATION TABLES ====================

// 21. COMPLIANCE SIGNALS - Asset telemetry snapshots for AI analysis
export const complianceSignals = pgTable("compliance_signals", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).references(() => assets.assetId),
  locationId: integer("location_id").references(() => locations.id),
  
  signalType: varchar("signal_type", { length: 50 }).notNull(), // backup_missing, maintenance_overdue, license_expiring, etc.
  signalData: text("signal_data"), // JSON string with signal details
  severity: varchar("severity", { length: 20 }).notNull(), // low, medium, high, critical
  
  detectedAt: timestamp("detected_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  status: varchar("status", { length: 20 }).notNull().default("active"), // active, resolved, ignored
});

// 22. COMPLIANCE RISK SCORES - AI-calculated risk scores per asset/location
export const complianceRiskScores = pgTable("compliance_risk_scores", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  assetId: varchar("asset_id", { length: 20 }).references(() => assets.assetId),
  locationId: integer("location_id").references(() => locations.id),
  
  riskScore: integer("risk_score").notNull(), // 0-100
  riskLevel: varchar("risk_level", { length: 20 }).notNull(), // low, medium, high, critical
  riskFactors: text("risk_factors"), // JSON array of contributing factors
  
  aiModel: varchar("ai_model", { length: 100 }), // Model used for scoring
  confidence: integer("confidence"), // 0-100 confidence level
  
  calculatedAt: timestamp("calculated_at").defaultNow(),
  validUntil: timestamp("valid_until"),
});

// 23. AUTOMATION RUNS - Tracks AI orchestrator executions
export const automationRuns = pgTable("automation_runs", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  runType: varchar("run_type", { length: 50 }).notNull(), // nightly_batch, real_time_trigger, manual
  
  tasksGenerated: integer("tasks_generated").default(0),
  risksDetected: integer("risks_detected").default(0),
  backupsVerified: integer("backups_verified").default(0),
  assignmentsCreated: integer("assignments_created").default(0),
  
  status: varchar("status", { length: 20 }).notNull().default("running"), // running, completed, failed, partial
  errorMessage: text("error_message"),
  executionTimeMs: integer("execution_time_ms"),
  
  triggeredBy: integer("triggered_by").references(() => users.id),
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// 24. AI RECOMMENDATIONS - Intelligent remediation suggestions
export const aiRecommendations = pgTable("ai_recommendations", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  targetType: varchar("target_type", { length: 50 }).notNull(), // asset, location, compliance_task
  targetId: varchar("target_id", { length: 50 }).notNull(),
  
  recommendationType: varchar("recommendation_type", { length: 50 }).notNull(), // maintenance, backup, security, upgrade
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  actionItems: text("action_items"), // JSON array of specific actions
  
  priority: varchar("priority", { length: 20 }).notNull().default("medium"),
  estimatedCost: integer("estimated_cost"),
  estimatedImpact: varchar("estimated_impact", { length: 50 }), // high, medium, low
  
  aiModel: varchar("ai_model", { length: 100 }),
  confidence: integer("confidence"), // 0-100
  
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, accepted, rejected, implemented
  implementedBy: integer("implemented_by").references(() => users.id),
  implementedAt: timestamp("implemented_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// 25. BACKUP VERIFICATION - Automated backup health checks
export const backupVerification = pgTable("backup_verification", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  backupId: integer("backup_id").references(() => backups.id),
  assetId: varchar("asset_id", { length: 20 }).references(() => assets.assetId),
  
  verificationMethod: varchar("verification_method", { length: 50 }).notNull(), // automated, manual
  verificationStatus: varchar("verification_status", { length: 20 }).notNull(), // passed, failed, warning
  
  checksPerformed: text("checks_performed"), // JSON array of checks
  issuesFound: text("issues_found"), // JSON array of issues
  healthScore: integer("health_score"), // 0-100
  
  complianceTaskId: integer("compliance_task_id").references(() => complianceTasks.id), // Auto-generated task if failed
  
  verifiedBy: integer("verified_by").references(() => users.id),
  verifiedAt: timestamp("verified_at").defaultNow(),
  nextVerificationDue: timestamp("next_verification_due"),
});

// 26. COMPLIANCE ASSIGNMENT QUEUE - History of automated assignments
export const complianceAssignmentQueue = pgTable("compliance_assignment_queue", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  taskId: integer("task_id").notNull().references(() => complianceTasks.id, { onDelete: "cascade" }),
  
  assignmentReason: text("assignment_reason"), // AI reasoning for assignment
  assignedTo: integer("assigned_to").notNull().references(() => users.id),
  locationId: integer("location_id").references(() => locations.id),
  
  workloadScore: integer("workload_score"), // User's current workload
  skillMatch: integer("skill_match"), // 0-100 match to task requirements
  priorityScore: integer("priority_score"),
  
  automationRunId: integer("automation_run_id").references(() => automationRuns.id),
  
  assignedAt: timestamp("assigned_at").defaultNow(),
  acceptedAt: timestamp("accepted_at"),
  status: varchar("status", { length: 20 }).notNull().default("assigned"), // assigned, accepted, rejected, reassigned
});

// Insert Schemas for automation tables
export const insertComplianceSignalSchema = createInsertSchema(complianceSignals);
export const insertComplianceRiskScoreSchema = createInsertSchema(complianceRiskScores);
export const insertAutomationRunSchema = createInsertSchema(automationRuns);
export const insertAiRecommendationSchema = createInsertSchema(aiRecommendations);
export const insertBackupVerificationSchema = createInsertSchema(backupVerification);
export const insertComplianceAssignmentQueueSchema = createInsertSchema(complianceAssignmentQueue);

// TypeScript Types for automation tables
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
