import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertAssetSchema, 
  insertEmployeeSchema, 
  insertLocationSchema,
  insertAssetAssignmentHistorySchema,
  insertAssetMaintenanceSchema,
  insertCctvSystemSchema,
  insertBiometricSystemSchema,
  insertBackupSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Assets routes
  app.get("/api/assets", async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      res.json(assets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:id", async (req, res) => {
    try {
      const asset = await storage.getAssetById(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", async (req, res) => {
    try {
      const validatedAsset = insertAssetSchema.parse(req.body);
      const asset = await storage.createAsset(validatedAsset);
      res.status(201).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid asset data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create asset" });
    }
  });

  app.patch("/api/assets/:id", async (req, res) => {
    try {
      const validatedAsset = insertAssetSchema.partial().parse(req.body);
      const asset = await storage.updateAsset(req.params.id, validatedAsset);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid asset data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", async (req, res) => {
    try {
      const success = await storage.deleteAsset(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Asset not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete asset" });
    }
  });

  // Employees routes
  app.get("/api/employees", async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", async (req, res) => {
    try {
      const validatedEmployee = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedEmployee);
      res.status(201).json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", async (req, res) => {
    try {
      const validatedEmployee = insertEmployeeSchema.partial().parse(req.body);
      const employee = await storage.updateEmployee(parseInt(req.params.id), validatedEmployee);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", async (req, res) => {
    try {
      const success = await storage.deleteEmployee(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  });

  // Locations routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validatedLocation = insertLocationSchema.parse(req.body);
      const location = await storage.createLocation(validatedLocation);
      res.status(201).json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid location data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create location" });
    }
  });

  app.patch("/api/locations/:id", async (req, res) => {
    try {
      const validatedLocation = insertLocationSchema.partial().parse(req.body);
      const location = await storage.updateLocation(parseInt(req.params.id), validatedLocation);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid location data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      const success = await storage.deleteLocation(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // Assignment History routes
  app.get("/api/assignments", async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const assignments = await storage.getAssignmentHistory(assetId, employeeId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", async (req, res) => {
    try {
      const validatedAssignment = insertAssetAssignmentHistorySchema.parse(req.body);
      const assignment = await storage.createAssignment(validatedAssignment);
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid assignment data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const maintenance = await storage.getMaintenanceRecords(assetId);
      res.json(maintenance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maintenance records" });
    }
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const validatedMaintenance = insertAssetMaintenanceSchema.parse(req.body);
      const maintenance = await storage.createMaintenanceRecord(validatedMaintenance);
      res.status(201).json(maintenance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid maintenance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create maintenance record" });
    }
  });

  app.patch("/api/maintenance/:id", async (req, res) => {
    try {
      const validatedMaintenance = insertAssetMaintenanceSchema.partial().parse(req.body);
      const maintenance = await storage.updateMaintenanceRecord(parseInt(req.params.id), validatedMaintenance);
      if (!maintenance) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      res.json(maintenance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid maintenance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update maintenance record" });
    }
  });

  app.delete("/api/maintenance/:id", async (req, res) => {
    try {
      const success = await storage.deleteMaintenanceRecord(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete maintenance record" });
    }
  });

  // CCTV Systems routes
  app.get("/api/cctv", async (req, res) => {
    try {
      const systems = await storage.getAllCctvSystems();
      // Mask sensitive data
      const maskedSystems = systems.map(system => ({
        ...system,
        passwordHash: system.passwordHash ? "********" : null
      }));
      res.json(maskedSystems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CCTV systems" });
    }
  });

  app.post("/api/cctv", async (req, res) => {
    try {
      const validatedSystem = insertCctvSystemSchema.parse(req.body);
      const system = await storage.createCctvSystem(validatedSystem);
      // Mask sensitive data in response
      const maskedSystem = {
        ...system,
        passwordHash: system.passwordHash ? "********" : null
      };
      res.status(201).json(maskedSystem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid CCTV system data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create CCTV system" });
    }
  });

  app.patch("/api/cctv/:id", async (req, res) => {
    try {
      const validatedSystem = insertCctvSystemSchema.partial().parse(req.body);
      const system = await storage.updateCctvSystem(parseInt(req.params.id), validatedSystem);
      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }
      // Mask sensitive data in response
      const maskedSystem = {
        ...system,
        passwordHash: system.passwordHash ? "********" : null
      };
      res.json(maskedSystem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid CCTV system data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update CCTV system" });
    }
  });

  app.delete("/api/cctv/:id", async (req, res) => {
    try {
      const success = await storage.deleteCctvSystem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "CCTV system not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete CCTV system" });
    }
  });

  // Biometric Systems routes
  app.get("/api/biometric", async (req, res) => {
    try {
      const systems = await storage.getAllBiometricSystems();
      res.json(systems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biometric systems" });
    }
  });

  app.post("/api/biometric", async (req, res) => {
    try {
      const validatedSystem = insertBiometricSystemSchema.parse(req.body);
      const system = await storage.createBiometricSystem(validatedSystem);
      res.status(201).json(system);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid biometric system data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create biometric system" });
    }
  });

  app.patch("/api/biometric/:id", async (req, res) => {
    try {
      const validatedSystem = insertBiometricSystemSchema.partial().parse(req.body);
      const system = await storage.updateBiometricSystem(parseInt(req.params.id), validatedSystem);
      if (!system) {
        return res.status(404).json({ error: "Biometric system not found" });
      }
      res.json(system);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid biometric system data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update biometric system" });
    }
  });

  app.delete("/api/biometric/:id", async (req, res) => {
    try {
      const success = await storage.deleteBiometricSystem(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Biometric system not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete biometric system" });
    }
  });

  // Backup routes
  app.get("/api/backups", async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const backups = await storage.getBackups(assetId);
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", async (req, res) => {
    try {
      const validatedBackup = insertBackupSchema.parse(req.body);
      const backup = await storage.createBackup(validatedBackup);
      res.status(201).json(backup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid backup data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.patch("/api/backups/:id", async (req, res) => {
    try {
      const validatedBackup = insertBackupSchema.partial().parse(req.body);
      const backup = await storage.updateBackup(parseInt(req.params.id), validatedBackup);
      if (!backup) {
        return res.status(404).json({ error: "Backup not found" });
      }
      res.json(backup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid backup data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update backup" });
    }
  });

  app.delete("/api/backups/:id", async (req, res) => {
    try {
      const success = await storage.deleteBackup(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Backup not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  // Reports API endpoints
  
  // Get available report templates
  app.get("/api/reports/templates", async (req, res) => {
    try {
      const templates = [
        {
          id: "asset-inventory",
          name: "Asset Inventory Report", 
          description: "Complete inventory of all assets across locations with current status, condition, and assignment details",
          category: "assets",
          fields: ["assetId", "assetType", "brand", "modelName", "serialNumber", "purchaseDate", "purchaseCost", "status", "condition", "locationId"],
          filters: ["location", "assetType", "status", "condition", "purchaseDate"],
          totalRuns: 15,
          lastRun: "2024-01-18"
        },
        {
          id: "maintenance-summary",
          name: "Maintenance Summary Report",
          description: "Comprehensive maintenance activities, costs, and schedules with vendor performance analysis",
          category: "maintenance", 
          fields: ["assetId", "maintenanceType", "description", "scheduledDate", "completedDate", "cost", "vendor", "status"],
          filters: ["maintenanceType", "status", "vendor", "dateRange", "location"],
          totalRuns: 23,
          lastRun: "2024-01-19"
        },
        {
          id: "assignment-history",
          name: "Assignment History Report",
          description: "Historical tracking of asset assignments with employee details and assignment duration analysis",
          category: "assignments",
          fields: ["assetId", "employeeId", "assignedDate", "returnedDate", "notes"],
          filters: ["employee", "department", "location", "dateRange", "assetType"],
          totalRuns: 18,
          lastRun: "2024-01-20"
        },
        {
          id: "location-analytics", 
          name: "Location Analytics Report",
          description: "Multi-location performance analytics with asset distribution, utilization rates, and cost analysis",
          category: "locations",
          fields: ["outletName", "city", "state", "manager", "contactEmail", "contactPhone"],
          filters: ["location", "assetType", "dateRange"],
          totalRuns: 8,
          lastRun: "2024-01-17"
        },
        {
          id: "compliance-audit",
          name: "Compliance Audit Report", 
          description: "Comprehensive compliance status across backup verification, security audits, and policy adherence",
          category: "compliance",
          fields: ["locationId", "backupType", "backupDate", "verificationStatus", "evidenceProvided", "auditResult"],
          filters: ["complianceType", "status", "location", "dateRange"],
          totalRuns: 12,
          lastRun: "2024-01-16"
        }
      ];
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch report templates" });
    }
  });

  // Generate and export report
  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { templateId, filters, format = 'excel' } = req.body;
      
      let data: any[] = [];
      let filename = "";
      let headers: string[] = [];
      
      // Generate report data based on template
      switch (templateId) {
        case "asset-inventory":
          data = await storage.getAllAssets();
          filename = "Asset_Inventory_Report";
          headers = ["Asset ID", "Type", "Brand", "Model", "Serial Number", "Purchase Date", "Cost", "Status", "Condition", "Location"];
          
          // Apply location filter if provided
          if (filters?.location && filters.location !== "all") {
            const locationId = parseInt(filters.location);
            data = data.filter((asset: any) => asset.locationId === locationId);
          }
          
          // Apply asset type filter
          if (filters?.assetType && filters.assetType !== "all") {
            data = data.filter((asset: any) => asset.assetType === filters.assetType);
          }
          
          // Apply status filter
          if (filters?.status && filters.status !== "all") {
            data = data.filter((asset: any) => asset.status === filters.status);
          }
          
          // Transform data for export
          data = data.map((asset: any) => [
            asset.assetId,
            asset.assetType,
            asset.brand,
            asset.modelName,
            asset.serialNumber || "",
            asset.purchaseDate,
            asset.purchaseCost || 0,
            asset.status,
            asset.condition,
            asset.locationId || ""
          ]);
          break;
          
        case "maintenance-summary":
          data = await storage.getAllMaintenance();
          filename = "Maintenance_Summary_Report";
          headers = ["Asset ID", "Type", "Description", "Scheduled Date", "Completed Date", "Cost", "Vendor", "Status"];
          
          // Apply status filter
          if (filters?.status && filters.status !== "all") {
            data = data.filter((maintenance: any) => maintenance.status === filters.status);
          }
          
          // Apply maintenance type filter
          if (filters?.maintenanceType && filters.maintenanceType !== "all") {
            data = data.filter((maintenance: any) => maintenance.maintenanceType === filters.maintenanceType);
          }
          
          // Transform data for export
          data = data.map((maintenance: any) => [
            maintenance.assetId,
            maintenance.maintenanceType,
            maintenance.description,
            maintenance.scheduledDate,
            maintenance.completedDate || "",
            maintenance.cost || 0,
            maintenance.vendor || "",
            maintenance.status
          ]);
          break;
          
        case "assignment-history":
          data = await storage.getAllAssignments();
          filename = "Assignment_History_Report";
          headers = ["Asset ID", "Employee ID", "Assigned Date", "Returned Date", "Notes"];
          
          // Transform data for export
          data = data.map((assignment: any) => [
            assignment.assetId,
            assignment.employeeId,
            assignment.assignedDate,
            assignment.returnedDate || "",
            assignment.notes || ""
          ]);
          break;
          
        case "location-analytics":
          data = await storage.getAllLocations();
          filename = "Location_Analytics_Report";
          headers = ["Outlet Name", "City", "State", "Manager", "Contact Email", "Contact Phone"];
          
          // Transform data for export
          data = data.map((location: any) => [
            location.outletName,
            location.city,
            location.state,
            location.manager || "",
            location.contactEmail || "",
            location.contactPhone || ""
          ]);
          break;
          
        case "compliance-audit":
          data = await storage.getAllBackups();
          filename = "Compliance_Audit_Report";
          headers = ["Location ID", "Backup Type", "Backup Date", "Verification Status", "Evidence", "Audit Result"];
          
          // Transform data for export
          data = data.map((backup: any) => [
            backup.locationId,
            backup.backupType,
            backup.backupDate,
            backup.verificationStatus,
            backup.evidenceProvided ? "Yes" : "No",
            backup.auditResult || ""
          ]);
          break;
          
        default:
          return res.status(400).json({ error: "Invalid template ID" });
      }
      
      // Generate Excel file
      if (format === 'excel') {
        const XLSX = require('xlsx');
        
        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        
        // Generate Excel buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        // Set response headers for file download
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.xlsx"`
        });
        
        return res.send(excelBuffer);
      }
      
      // For CSV format
      if (format === 'csv') {
        const csvData = [headers, ...data].map(row => row.join(',')).join('\n');
        
        res.set({
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.csv"`
        });
        
        return res.send(csvData);
      }
      
      // Default JSON response
      res.json({
        templateId,
        filename,
        headers,
        data,
        rowCount: data.length,
        generatedAt: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  // Get custom reports
  app.get("/api/reports/custom", async (req, res) => {
    try {
      // In a real implementation, this would fetch from database
      // For now, returning mock data with proper structure
      const customReports = [
        {
          id: "custom-1",
          name: "Monthly Laptop Assignment Report",
          description: "Monthly tracking of laptop assignments for JP Nagar location",
          entity: "assignments",
          fields: ["assetId", "employeeName", "assignedDate", "status"],
          filters: { location: "JP Nagar", assetType: "Laptop", dateRange: "monthly" },
          createdDate: "2024-01-15",
          createdBy: "Admin User",
          lastRun: "2024-01-20",
          totalRuns: 5
        }
      ];
      res.json(customReports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch custom reports" });
    }
  });

  // Create custom report
  app.post("/api/reports/custom", async (req, res) => {
    try {
      const { name, description, entity, fields, filters } = req.body;
      
      // Validate required fields
      if (!name || !entity || !fields) {
        return res.status(400).json({ error: "Name, entity, and fields are required" });
      }
      
      const customReport = {
        id: `custom-${Date.now()}`,
        name,
        description: description || "",
        entity,
        fields,
        filters: filters || {},
        createdDate: new Date().toISOString().split('T')[0],
        createdBy: "Admin User", // In real implementation, get from auth
        lastRun: null,
        totalRuns: 0
      };
      
      // In real implementation, save to database
      // await storage.createCustomReport(customReport);
      
      res.status(201).json(customReport);
    } catch (error) {
      res.status(500).json({ error: "Failed to create custom report" });
    }
  });

  // Generate custom report
  app.post("/api/reports/custom/:id/generate", async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'excel' } = req.body;
      
      // In real implementation, fetch custom report config from database
      // For now, handle basic case
      
      let data: any[] = [];
      let filename = "Custom_Report";
      let headers: string[] = [];
      
      // This would fetch the custom report configuration and execute it
      // For demonstration, we'll return assets data
      data = await storage.getAllAssets();
      filename = "Custom_Asset_Report";
      headers = ["Asset ID", "Type", "Brand", "Model", "Status"];
      
      data = data.map((asset: any) => [
        asset.assetId,
        asset.assetType,
        asset.brand,
        asset.modelName,
        asset.status
      ]);
      
      if (format === 'excel') {
        const XLSX = require('xlsx');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
        XLSX.utils.book_append_sheet(wb, ws, 'Report');
        
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        
        res.set({
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}_${new Date().toISOString().split('T')[0]}.xlsx"`
        });
        
        return res.send(excelBuffer);
      }
      
      res.json({ data, rowCount: data.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate custom report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
