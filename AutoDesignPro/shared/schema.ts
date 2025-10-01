import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, decimal, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  locationId: integer("location_id").references(() => locations.id),
  currentUserId: integer("current_user_id").references(() => employees.id),
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

// Insert Schemas - Zod schemas for validation
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertAssetAssignmentHistorySchema = createInsertSchema(assetAssignmentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertAssetMaintenanceSchema = createInsertSchema(assetMaintenance).omit({
  id: true,
  createdAt: true,
});

export const insertCctvSystemSchema = createInsertSchema(cctvSystems).omit({
  id: true,
  createdAt: true,
});

export const insertBiometricSystemSchema = createInsertSchema(biometricSystems).omit({
  id: true,
  createdAt: true,
});

export const insertBackupSchema = createInsertSchema(backups).omit({
  id: true,
  createdAt: true,
});

export const insertReportExecutionSchema = createInsertSchema(reportExecutions).omit({
  id: true,
  createdAt: true,
});

// TypeScript Types
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

// Legacy types for compatibility (can be removed once storage.ts is updated)
export type User = Employee;
export type InsertUser = InsertEmployee;
