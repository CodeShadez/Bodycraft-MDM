import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  insertAssetSchema, 
  insertEmployeeSchema, 
  insertLocationSchema,
  insertDepartmentSchema,
  insertAssetAssignmentHistorySchema,
  insertAssetMaintenanceSchema,
  insertCctvSystemSchema,
  insertBiometricSystemSchema,
  insertBackupSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Get user by username
      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid username or password" });
      }

      // Check if user is active
      if (user.status !== "active") {
        return res.status(401).json({ message: "Account is inactive" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLogin: new Date() });

      // Regenerate session ID to prevent session fixation
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ message: "Session error" });
        }
        
        // Create session (store in session)
        req.session.userId = user.id;
        req.session.username = user.username;
        req.session.role = user.role;
        req.session.locationId = user.locationId || null;

        // Return user info (without password hash)
        const { passwordHash, ...userResponse } = user;
        res.json({
          message: "Login successful",
          user: userResponse
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Could not log out" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/session", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.username) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get current user info
      const user = await storage.getUserByUsername(req.session.username);
      if (!user || user.status !== "active") {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Return user info (without password hash)
      const { passwordHash, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Alias for session check (used by frontend auth guard)
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session.userId || !req.session.username) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get current user info
      const user = await storage.getUserByUsername(req.session.username);
      if (!user || user.status !== "active") {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Return user info (without password hash)
      const { passwordHash, ...userResponse } = user;
      res.json({ user: userResponse });
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  };

  // Middleware to check role permissions
  const requireRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.session.role || !roles.includes(req.session.role)) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }
      next();
    };
  };

  // Helper function to filter data by location for location_user role
  const filterByUserLocation = (data: any[], req: any) => {
    // super_admin and admin can see all data
    if (req.session.role === 'super_admin' || req.session.role === 'admin') {
      return data;
    }
    
    // location_user can only see data from their location
    if (req.session.role === 'location_user' && req.session.locationId) {
      return data.filter((item: any) => item.locationId === req.session.locationId);
    }
    
    // Default: return all data (for other roles)
    return data;
  };

  // Helper to check if location_user can access a specific location
  const canAccessLocation = (req: any, locationId: number | null) => {
    // super_admin and admin can access all locations
    if (req.session.role === 'super_admin' || req.session.role === 'admin') {
      return true;
    }
    
    // location_user can only access their own location
    if (req.session.role === 'location_user') {
      return locationId === req.session.locationId;
    }
    
    return true; // Default allow for other roles
  };

  // Assets routes - Protected with authentication
  app.get("/api/assets", requireAuth, async (req, res) => {
    try {
      const assets = await storage.getAllAssets();
      const filteredAssets = filterByUserLocation(assets, req);
      res.json(filteredAssets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assets" });
    }
  });

  app.get("/api/assets/:id", requireAuth, async (req, res) => {
    try {
      const asset = await storage.getAsset(req.params.id);
      if (!asset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      // Check location access
      if (!canAccessLocation(req, asset.locationId)) {
        return res.status(403).json({ error: "Access denied to this asset" });
      }
      
      res.json(asset);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch asset" });
    }
  });

  app.post("/api/assets", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.patch("/api/assets/:id", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      // First check if asset exists and user has access
      const existingAsset = await storage.getAsset(req.params.id);
      if (!existingAsset) {
        return res.status(404).json({ error: "Asset not found" });
      }
      
      if (!canAccessLocation(req, existingAsset.locationId)) {
        return res.status(403).json({ error: "Access denied to this asset" });
      }
      
      const validatedAsset = insertAssetSchema.partial().parse(req.body);
      
      // Prevent location_user from changing locationId
      if (req.session.role === 'location_user' && validatedAsset.locationId && validatedAsset.locationId !== existingAsset.locationId) {
        return res.status(403).json({ error: "Cannot transfer asset to another location" });
      }
      
      const asset = await storage.updateAsset(req.params.id, validatedAsset);
      res.json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid asset data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update asset" });
    }
  });

  app.delete("/api/assets/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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
  app.get("/api/employees", requireAuth, async (req, res) => {
    try {
      const employees = await storage.getAllEmployees();
      const filteredEmployees = filterByUserLocation(employees, req);
      res.json(filteredEmployees);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", requireAuth, async (req, res) => {
    try {
      const employee = await storage.getEmployee(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      if (!canAccessLocation(req, employee.locationId)) {
        return res.status(403).json({ error: "Access denied to this employee" });
      }
      
      res.json(employee);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.patch("/api/employees/:id", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      const existingEmployee = await storage.getEmployee(parseInt(req.params.id));
      if (!existingEmployee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      
      if (!canAccessLocation(req, existingEmployee.locationId)) {
        return res.status(403).json({ error: "Access denied to this employee" });
      }
      
      const validatedEmployee = insertEmployeeSchema.partial().parse(req.body);
      
      // Prevent location_user from changing locationId
      if (req.session.role === 'location_user' && validatedEmployee.locationId && validatedEmployee.locationId !== existingEmployee.locationId) {
        return res.status(403).json({ error: "Cannot transfer employee to another location" });
      }
      
      const employee = await storage.updateEmployee(parseInt(req.params.id), validatedEmployee);
      res.json(employee);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid employee data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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
  app.get("/api/locations", requireAuth, async (req, res) => {
    try {
      const locations = await storage.getAllLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.post("/api/locations", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.patch("/api/locations/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.delete("/api/locations/:id", requireAuth, requireRole(['super_admin']), async (req, res) => {
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

  // Department routes
  app.get("/api/departments", requireAuth, async (req, res) => {
    try {
      const departments = await storage.getAllDepartments();
      res.json(departments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch departments" });
    }
  });

  app.post("/api/departments", requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const validatedDepartment = insertDepartmentSchema.parse({
        ...req.body,
        isCustom: true, // Custom departments created by admin are marked as custom
      });
      const department = await storage.createDepartment(validatedDepartment);
      res.status(201).json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid department data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create department" });
    }
  });

  app.patch("/api/departments/:id", requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const validatedDepartment = insertDepartmentSchema.partial().parse(req.body);
      const department = await storage.updateDepartment(parseInt(req.params.id), validatedDepartment);
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.json(department);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid department data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update department" });
    }
  });

  app.delete("/api/departments/:id", requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      // Only allow deletion of custom departments
      const department = await storage.getDepartment(parseInt(req.params.id));
      if (!department) {
        return res.status(404).json({ error: "Department not found" });
      }
      if (!department.isCustom) {
        return res.status(403).json({ error: "Cannot delete predefined departments" });
      }
      
      const success = await storage.deleteDepartment(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ error: "Department not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete department" });
    }
  });

  // Assignment History routes
  app.get("/api/assignments", requireAuth, async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const employeeId = req.query.employeeId ? parseInt(req.query.employeeId as string) : undefined;
      const assignments = await storage.getAssignmentHistory(assetId, employeeId);
      
      // Filter by location for location_user
      const filteredAssignments = await Promise.all(
        assignments.map(async (assignment) => {
          const asset = await storage.getAsset(assignment.assetId);
          return { assignment, asset };
        })
      );
      
      const accessibleAssignments = filteredAssignments
        .filter(({ asset }) => canAccessLocation(req, asset?.locationId || null))
        .map(({ assignment }) => assignment);
      
      res.json(accessibleAssignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.post("/api/assignments", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      const validatedAssignment = insertAssetAssignmentHistorySchema.parse(req.body);
      
      // Check location access for location_user
      const asset = await storage.getAsset(validatedAssignment.assetId);
      if (!canAccessLocation(req, asset?.locationId || null)) {
        return res.status(403).json({ error: "Access denied to assign this asset" });
      }
      
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
  app.get("/api/maintenance", requireAuth, async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const maintenance = await storage.getMaintenanceRecords(assetId);
      
      // Filter by location for location_user
      const filteredMaintenance = await Promise.all(
        maintenance.map(async (record) => {
          const asset = await storage.getAsset(record.assetId);
          return { record, asset };
        })
      );
      
      const accessibleMaintenance = filteredMaintenance
        .filter(({ asset }) => canAccessLocation(req, asset?.locationId || null))
        .map(({ record }) => record);
      
      res.json(accessibleMaintenance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch maintenance records" });
    }
  });

  app.post("/api/maintenance", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      const validatedMaintenance = insertAssetMaintenanceSchema.parse(req.body);
      
      // Check location access for location_user
      const asset = await storage.getAsset(validatedMaintenance.assetId);
      if (!canAccessLocation(req, asset?.locationId || null)) {
        return res.status(403).json({ error: "Access denied to this asset" });
      }
      
      const maintenance = await storage.createMaintenanceRecord(validatedMaintenance);
      res.status(201).json(maintenance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid maintenance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create maintenance record" });
    }
  });

  app.patch("/api/maintenance/:id", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      // First get all maintenance records to find the one we want to update
      const allMaintenance = await storage.getMaintenanceRecords();
      const existing = allMaintenance.find(m => m.id === parseInt(req.params.id));
      
      if (!existing) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      
      // Check location access BEFORE updating
      const asset = await storage.getAsset(existing.assetId);
      if (!canAccessLocation(req, asset?.locationId || null)) {
        return res.status(403).json({ error: "Access denied to this maintenance record" });
      }
      
      const validatedMaintenance = insertAssetMaintenanceSchema.partial().parse(req.body);
      
      // Prevent location_user from changing assetId (reassigning to different asset/location)
      if (req.session.role === 'location_user' && validatedMaintenance.assetId && validatedMaintenance.assetId !== existing.assetId) {
        return res.status(403).json({ error: "Cannot reassign maintenance record to a different asset" });
      }
      
      const maintenance = await storage.updateMaintenanceRecord(parseInt(req.params.id), validatedMaintenance);
      
      res.json(maintenance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid maintenance data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update maintenance record" });
    }
  });

  app.delete("/api/maintenance/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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
  app.get("/api/cctv", requireAuth, async (req, res) => {
    try {
      const systems = await storage.getAllCctvSystems();
      
      // Filter by location for location_user and mask sensitive data
      const filteredSystems = filterByUserLocation(systems, req);
      const maskedSystems = filteredSystems.map(system => ({
        ...system,
        passwordHash: system.passwordHash ? "********" : null
      }));
      res.json(maskedSystems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch CCTV systems" });
    }
  });

  app.post("/api/cctv", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.patch("/api/cctv/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
      // First get existing CCTV system
      const allSystems = await storage.getAllCctvSystems();
      const existing = allSystems.find(s => s.id === parseInt(req.params.id));
      
      if (!existing) {
        return res.status(404).json({ error: "CCTV system not found" });
      }
      
      // Check location access BEFORE updating
      if (!canAccessLocation(req, existing.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }
      
      const validatedSystem = insertCctvSystemSchema.partial().parse(req.body);
      
      // Prevent changing locationId if location_user (even though only admin can access this route, defense in depth)
      if (req.session.role === 'location_user' && validatedSystem.locationId && validatedSystem.locationId !== existing.locationId) {
        return res.status(403).json({ error: "Cannot transfer CCTV system to another location" });
      }
      
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

  app.delete("/api/cctv/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  // Hikvision Integration routes
  app.get("/api/cctv/:id/snapshot", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const channel = parseInt(req.query.channel as string) || 1;
      const snapshot = await client.getSnapshot(channel);

      res.setHeader('Content-Type', 'image/jpeg');
      res.send(snapshot);
    } catch (error) {
      console.error("Error getting snapshot:", error);
      res.status(500).json({ error: "Failed to get camera snapshot" });
    }
  });

  app.get("/api/cctv/:id/stream-url", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const channel = parseInt(req.query.channel as string) || 1;
      const streamType = (req.query.streamType as 'main' | 'sub') || 'main';

      const rtspUrl = client.getRtspUrl(channel, streamType);
      const httpPreviewUrl = client.getHttpPreviewUrl(channel, streamType);

      res.json({
        rtspUrl,
        httpPreviewUrl,
        channel,
        streamType
      });
    } catch (error) {
      console.error("Error getting stream URL:", error);
      res.status(500).json({ error: "Failed to get stream URL" });
    }
  });

  app.get("/api/cctv/:id/device-info", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const deviceInfo = await client.getDeviceInfo();
      res.json(deviceInfo);
    } catch (error) {
      console.error("Error getting device info:", error);
      res.status(500).json({ error: "Failed to get device information" });
    }
  });

  app.get("/api/cctv/:id/status", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const status = await client.checkCameraStatus();
      
      if (status.online && status.lastOnline) {
        await storage.updateCctvSystem(systemId, {
          status: 'online',
          lastOnline: status.lastOnline
        });
      } else {
        await storage.updateCctvSystem(systemId, {
          status: 'offline'
        });
      }

      res.json(status);
    } catch (error) {
      console.error("Error checking camera status:", error);
      res.status(500).json({ error: "Failed to check camera status" });
    }
  });

  app.post("/api/cctv/:id/recordings/search", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const { startTime, endTime, channel = 1 } = req.body;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const recordings = await client.searchRecordings(
        new Date(startTime),
        new Date(endTime),
        channel
      );

      res.json(recordings);
    } catch (error) {
      console.error("Error searching recordings:", error);
      res.status(500).json({ error: "Failed to search recordings" });
    }
  });

  app.get("/api/cctv/:id/recordings/playback-url", requireAuth, async (req, res) => {
    try {
      const { HikvisionClient } = await import('./hikvision-client');
      const systemId = parseInt(req.params.id);
      const allSystems = await storage.getAllCctvSystems();
      const system = allSystems.find(s => s.id === systemId);

      if (!system) {
        return res.status(404).json({ error: "CCTV system not found" });
      }

      if (!canAccessLocation(req, system.locationId)) {
        return res.status(403).json({ error: "Access denied to this CCTV system" });
      }

      if (!system.ipAddress || !system.username || !system.passwordHash) {
        return res.status(400).json({ error: "CCTV system not configured with credentials" });
      }

      const { startTime, endTime, channel = 1 } = req.query;
      
      if (!startTime || !endTime) {
        return res.status(400).json({ error: "startTime and endTime are required" });
      }

      const client = new HikvisionClient(
        `http://${system.ipAddress}`,
        system.username,
        system.passwordHash
      );

      const playbackUrl = client.getPlaybackUrl(
        new Date(startTime as string),
        new Date(endTime as string),
        parseInt(channel as string)
      );

      res.json({ playbackUrl });
    } catch (error) {
      console.error("Error getting playback URL:", error);
      res.status(500).json({ error: "Failed to get playback URL" });
    }
  });

  // Biometric Systems routes
  app.get("/api/biometric", requireAuth, async (req, res) => {
    try {
      const systems = await storage.getAllBiometricSystems();
      const filteredSystems = filterByUserLocation(systems, req);
      res.json(filteredSystems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch biometric systems" });
    }
  });

  app.post("/api/biometric", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.patch("/api/biometric/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.delete("/api/biometric/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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
  app.get("/api/backups", requireAuth, async (req, res) => {
    try {
      const assetId = req.query.assetId as string;
      const backups = await storage.getBackups(assetId);
      
      // Filter by location for location_user
      const filteredBackups = await Promise.all(
        backups.map(async (backup) => {
          const asset = await storage.getAsset(backup.assetId);
          return { backup, asset };
        })
      );
      
      const accessibleBackups = filteredBackups
        .filter(({ asset }) => canAccessLocation(req, asset?.locationId || null))
        .map(({ backup }) => backup);
      
      res.json(accessibleBackups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", requireAuth, requireRole(['super_admin', 'admin', 'location_user']), async (req, res) => {
    try {
      const validatedBackup = insertBackupSchema.parse(req.body);
      
      // Check location access for location_user
      const asset = await storage.getAsset(validatedBackup.assetId);
      if (!canAccessLocation(req, asset?.locationId || null)) {
        return res.status(403).json({ error: "Access denied to this asset" });
      }
      
      const backup = await storage.createBackup(validatedBackup);
      res.status(201).json(backup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid backup data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.patch("/api/backups/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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

  app.delete("/api/backups/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
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
          data = await storage.getMaintenanceRecords();
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
          data = await storage.getAssignmentHistory();
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
          data = await storage.getBackups();
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

  // Dashboard Stats - Get real-time dashboard statistics
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Dashboard Recent Activities
  app.get("/api/dashboard/activities", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });

  // User Management Routes
  app.get("/api/users", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hashes from response
      const sanitizedUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const validation = z.object({
        username: z.string().min(3),
        email: z.string().email(),
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        password: z.string().min(8),
        role: z.enum(['super_admin', 'admin', 'manager', 'user']),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid user data", errors: validation.error.issues });
      }

      // Check for existing username or email
      const existingUsername = await storage.getUserByUsername(validation.data.username);
      if (existingUsername) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(validation.data.email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      const { password, ...userData } = validation.data;
      const passwordHash = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        ...userData,
        passwordHash,
      });

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = { ...req.body };

      // Only super_admin can change roles and status
      if (updateData.role && req.session.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can change user roles" });
      }

      if (updateData.status && req.session.role !== 'super_admin') {
        return res.status(403).json({ message: "Only super admins can change user status" });
      }

      // Check email uniqueness if being updated
      if (updateData.email) {
        const existingEmail = await storage.getUserByEmail(updateData.email);
        if (existingEmail && existingEmail.id !== id) {
          return res.status(409).json({ message: "Email already exists" });
        }
      }

      // If password is being updated, hash it
      if (updateData.password) {
        updateData.passwordHash = await bcrypt.hash(updateData.password, 10);
        delete updateData.password;
      }

      // Never allow direct passwordHash updates from client
      delete updateData.passwordHash;

      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Company Settings Routes
  app.get("/api/settings/company", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getCompanySettings();
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  app.patch("/api/settings/company", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
      const settings = await storage.updateCompanySettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error updating company settings:", error);
      res.status(500).json({ message: "Failed to update company settings" });
    }
  });

  // Asset Types Routes
  app.get("/api/asset-types", requireAuth, async (req, res) => {
    try {
      const assetTypes = await storage.getAllAssetTypes();
      res.json(assetTypes);
    } catch (error) {
      console.error("Error fetching asset types:", error);
      res.status(500).json({ message: "Failed to fetch asset types" });
    }
  });

  app.post("/api/asset-types", requireAuth, requireRole(['super_admin', 'admin']), async (req, res) => {
    try {
      const validation = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ message: "Invalid asset type data", errors: validation.error.issues });
      }

      const assetType = await storage.createAssetType(validation.data);
      res.status(201).json(assetType);
    } catch (error) {
      console.error("Error creating asset type:", error);
      res.status(500).json({ message: "Failed to create asset type" });
    }
  });

  // Approval Workflow Routes
  app.get("/api/approvals", requireAuth, async (req, res) => {
    try {
      const filters: { status?: string; requestedBy?: number } = {};
      
      if (req.query.status) {
        filters.status = req.query.status as string;
      }
      
      // Location users can only see their own requests or requests they can approve
      if (req.session.role === 'location_user') {
        filters.requestedBy = req.session.userId;
      }
      
      const requests = await storage.getAllApprovalRequests(filters);
      
      // Filter by location for location_user
      const accessibleRequests = await Promise.all(
        requests.map(async (request) => {
          const currentValue = request.currentValue ? JSON.parse(request.currentValue) : {};
          const newValue = JSON.parse(request.newValue);
          
          // Check access based on entity type
          if (request.entityType === 'asset') {
            const asset = await storage.getAsset(request.entityId);
            if (!canAccessLocation(req, asset?.locationId || null)) {
              return null;
            }
          } else if (request.entityType === 'employee') {
            const employee = await storage.getEmployee(parseInt(request.entityId));
            if (!canAccessLocation(req, employee?.locationId || null)) {
              return null;
            }
          }
          
          return request;
        })
      );
      
      res.json(accessibleRequests.filter(r => r !== null));
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      res.status(500).json({ error: "Failed to fetch approval requests" });
    }
  });

  app.post("/api/approvals", requireAuth, requireRole(['location_user', 'admin', 'super_admin']), async (req, res) => {
    try {
      const validation = z.object({
        requestType: z.enum(['asset_transfer', 'asset_assignment', 'employee_transfer']),
        entityType: z.enum(['asset', 'employee']),
        entityId: z.string(),
        currentValue: z.string().optional(),
        newValue: z.string(),
        reason: z.string().optional(),
        requiredApprovalLevels: z.number().min(1).max(3).default(1),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid approval request data", details: validation.error.issues });
      }

      // Verify entity exists and user has access
      const { entityType, entityId } = validation.data;
      if (entityType === 'asset') {
        const asset = await storage.getAsset(entityId);
        if (!asset) {
          return res.status(404).json({ error: "Asset not found" });
        }
        if (!canAccessLocation(req, asset.locationId)) {
          return res.status(403).json({ error: "Access denied to this asset" });
        }
      } else if (entityType === 'employee') {
        const employee = await storage.getEmployee(parseInt(entityId));
        if (!employee) {
          return res.status(404).json({ error: "Employee not found" });
        }
        if (!canAccessLocation(req, employee.locationId)) {
          return res.status(403).json({ error: "Access denied to this employee" });
        }
      }

      const request = await storage.createApprovalRequest({
        ...validation.data,
        requestedBy: req.session.userId!,
      });

      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating approval request:", error);
      res.status(500).json({ error: "Failed to create approval request" });
    }
  });

  app.post("/api/approvals/:id/approve", requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getApprovalRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ error: "Approval request not found" });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ error: "This request has already been processed" });
      }

      const validation = z.object({
        comments: z.string().optional(),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Invalid approval data" });
      }

      // Create approval action
      await storage.createApprovalAction({
        requestId,
        approvalLevel: request.currentApprovalLevel,
        actionBy: req.session.userId!,
        action: 'approved',
        comments: validation.data.comments,
      });

      // Check if all levels are approved
      const newLevel = request.currentApprovalLevel + 1;
      if (newLevel > request.requiredApprovalLevels) {
        // All approvals complete - verify entity still exists then execute the change
        const newValue = JSON.parse(request.newValue);
        
        if (request.requestType === 'asset_transfer' && request.entityType === 'asset') {
          const asset = await storage.getAsset(request.entityId);
          if (!asset) {
            return res.status(404).json({ error: "Asset no longer exists and cannot be transferred" });
          }
          await storage.updateAsset(request.entityId, { locationId: newValue.locationId });
        } else if (request.requestType === 'asset_assignment' && request.entityType === 'asset') {
          const asset = await storage.getAsset(request.entityId);
          if (!asset) {
            return res.status(404).json({ error: "Asset no longer exists and cannot be assigned" });
          }
          const employee = await storage.getEmployee(newValue.employeeId);
          if (!employee) {
            return res.status(404).json({ error: "Employee no longer exists for assignment" });
          }
          
          await storage.updateAsset(request.entityId, { 
            currentUserId: newValue.employeeId,
            status: 'assigned'
          });
          // Create assignment history
          await storage.createAssignment({
            assetId: request.entityId,
            employeeId: newValue.employeeId,
            assignedDate: new Date().toISOString().split('T')[0],
            assignmentReason: request.reason || 'Approved assignment',
          });
        } else if (request.requestType === 'employee_transfer' && request.entityType === 'employee') {
          const employee = await storage.getEmployee(parseInt(request.entityId));
          if (!employee) {
            return res.status(404).json({ error: "Employee no longer exists and cannot be transferred" });
          }
          await storage.updateEmployee(parseInt(request.entityId), { locationId: newValue.locationId });
        }

        await storage.updateApprovalRequest(requestId, {
          status: 'approved',
          completedAt: new Date(),
          completedBy: req.session.userId!,
        });
      } else {
        // Move to next approval level
        await storage.updateApprovalRequest(requestId, {
          currentApprovalLevel: newLevel,
        });
      }

      const updatedRequest = await storage.getApprovalRequest(requestId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error approving request:", error);
      res.status(500).json({ error: "Failed to approve request" });
    }
  });

  app.post("/api/approvals/:id/reject", requireAuth, requireRole(['admin', 'super_admin']), async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const request = await storage.getApprovalRequest(requestId);
      
      if (!request) {
        return res.status(404).json({ error: "Approval request not found" });
      }
      
      if (request.status !== 'pending') {
        return res.status(400).json({ error: "This request has already been processed" });
      }

      const validation = z.object({
        comments: z.string().min(1, "Rejection reason is required"),
      }).safeParse(req.body);

      if (!validation.success) {
        return res.status(400).json({ error: "Rejection reason is required", details: validation.error.issues });
      }

      // Create rejection action
      await storage.createApprovalAction({
        requestId,
        approvalLevel: request.currentApprovalLevel,
        actionBy: req.session.userId!,
        action: 'rejected',
        comments: validation.data.comments,
      });

      // Update request status
      await storage.updateApprovalRequest(requestId, {
        status: 'rejected',
        completedAt: new Date(),
        completedBy: req.session.userId!,
      });

      const updatedRequest = await storage.getApprovalRequest(requestId);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error rejecting request:", error);
      res.status(500).json({ error: "Failed to reject request" });
    }
  });

  app.get("/api/approvals/:id/actions", requireAuth, async (req, res) => {
    try {
      const actions = await storage.getApprovalActions(parseInt(req.params.id));
      res.json(actions);
    } catch (error) {
      console.error("Error fetching approval actions:", error);
      res.status(500).json({ error: "Failed to fetch approval actions" });
    }
  });

  // Sample Data Cleanup Route (for production deployment)
  app.post("/api/cleanup/sample-data", requireAuth, requireRole(['super_admin']), async (req, res) => {
    try {
      const confirmation = req.body.confirmation;
      
      if (confirmation !== "DELETE_ALL_SAMPLE_DATA") {
        return res.status(400).json({ 
          error: "Invalid confirmation", 
          message: "Please provide confirmation: 'DELETE_ALL_SAMPLE_DATA'" 
        });
      }

      console.log("⚠️  Starting sample data cleanup...");
      
      // Get all data counts before deletion
      const beforeCounts = {
        assets: (await storage.getAllAssets()).length,
        employees: (await storage.getAllEmployees()).length,
        locations: (await storage.getAllLocations()).length,
        assignments: (await storage.getAssignmentHistory()).length,
        maintenance: (await storage.getMaintenanceRecords()).length,
        cctv: (await storage.getAllCctvSystems()).length,
        biometric: (await storage.getAllBiometricSystems()).length,
        backups: (await storage.getBackups()).length,
      };

      // Delete all sample data in correct order (respecting foreign keys)
      // 1. Delete backups (references assets)
      const allBackups = await storage.getBackups();
      for (const backup of allBackups) {
        await storage.deleteBackup(backup.id);
      }

      // 2. Delete assignment history (references assets and employees)
      // Note: Assignment history deletion might not be exposed in API, so we'll skip it
      
      // 3. Delete maintenance records (references assets)
      const allMaintenance = await storage.getMaintenanceRecords();
      for (const record of allMaintenance) {
        await storage.deleteMaintenanceRecord(record.id);
      }

      // 4. Delete CCTV systems (references locations)
      const allCctv = await storage.getAllCctvSystems();
      for (const system of allCctv) {
        await storage.deleteCctvSystem(system.id);
      }

      // 5. Delete biometric systems (references locations)
      const allBiometric = await storage.getAllBiometricSystems();
      for (const system of allBiometric) {
        await storage.deleteBiometricSystem(system.id);
      }

      // 6. Delete assets (references employees and locations)
      const allAssets = await storage.getAllAssets();
      for (const asset of allAssets) {
        await storage.deleteAsset(asset.assetId);
      }

      // 7. Delete employees (references locations)
      const allEmployees = await storage.getAllEmployees();
      for (const employee of allEmployees) {
        // Keep admin user's associated employee if exists
        if (employee.email !== 'admin@bodycraft.com') {
          await storage.deleteEmployee(employee.id);
        }
      }

      // 8. Delete locations (but keep one for admin)
      const allLocations = await storage.getAllLocations();
      let keptLocationId = null;
      for (const location of allLocations) {
        if (!keptLocationId) {
          keptLocationId = location.id; // Keep first location for admin
        } else {
          await storage.deleteLocation(location.id);
        }
      }

      const afterCounts = {
        assets: (await storage.getAllAssets()).length,
        employees: (await storage.getAllEmployees()).length,
        locations: (await storage.getAllLocations()).length,
        assignments: 0, // Can't count, no API
        maintenance: (await storage.getMaintenanceRecords()).length,
        cctv: (await storage.getAllCctvSystems()).length,
        biometric: (await storage.getAllBiometricSystems()).length,
        backups: (await storage.getBackups()).length,
      };

      console.log("✅ Sample data cleanup completed!");
      
      res.json({
        success: true,
        message: "Sample data cleanup completed successfully",
        deletedCounts: {
          assets: beforeCounts.assets - afterCounts.assets,
          employees: beforeCounts.employees - afterCounts.employees,
          locations: beforeCounts.locations - afterCounts.locations,
          maintenance: beforeCounts.maintenance - afterCounts.maintenance,
          cctv: beforeCounts.cctv - afterCounts.cctv,
          biometric: beforeCounts.biometric - afterCounts.biometric,
          backups: beforeCounts.backups - afterCounts.backups,
        },
        remainingCounts: afterCounts,
        note: "One location has been kept for admin access. Admin user has been preserved."
      });
    } catch (error) {
      console.error("❌ Error during sample data cleanup:", error);
      res.status(500).json({ error: "Failed to cleanup sample data", details: error instanceof Error ? error.message : String(error) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
