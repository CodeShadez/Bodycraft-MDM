import dotenv from "dotenv";
dotenv.config();

import { DatabaseStorage } from "./database-storage";
import bcrypt from "bcryptjs";

const storage = new DatabaseStorage();

async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Create company settings
    console.log("📝 Creating company settings...");
    await storage.updateCompanySettings({
      companyName: "BODYCRAFT",
      timezone: "Asia/Kolkata",
      dateFormat: "DD/MM/YYYY",
      language: "en",
      sessionTimeout: 480,
      passwordMinLength: 8,
      emailNotificationsEnabled: true,
      maintenanceMode: false,
    });

    // 2. Create asset types
    console.log("🏷️ Creating asset types...");
    const assetTypes = [
      { name: "Laptop", description: "Portable computers for mobile work" },
      { name: "Desktop", description: "Desktop computers for office use" },
      { name: "Monitor", description: "Display screens and monitors" },
      { name: "Mobile", description: "Mobile phones and tablets" },
      { name: "Router", description: "Network routers and switches" },
      { name: "Printer", description: "Printers and scanning devices" },
    ];

    for (const type of assetTypes) {
      await storage.createAssetType(type);
    }

    // 3. Create locations (BODYCRAFT outlets)
    console.log("🏢 Creating outlet locations...");
    const locations = [
      {
        outletName: "JP Nagar",
        city: "Bangalore",
        state: "Karnataka",
        address: "123 JP Nagar Main Road, Bangalore",
        managerName: "Rajesh Kumar",
        contactDetails: "rajesh@bodycraft.com, +91-9876543210",
      },
      {
        outletName: "Koramangala",
        city: "Bangalore",
        state: "Karnataka",
        address: "456 Koramangala Ring Road, Bangalore",
        managerName: "Priya Sharma",
        contactDetails: "priya@bodycraft.com, +91-9876543211",
      },
      {
        outletName: "Indiranagar",
        city: "Bangalore",
        state: "Karnataka",
        address: "789 Indiranagar Main Street, Bangalore",
        managerName: "Amit Singh",
        contactDetails: "amit@bodycraft.com, +91-9876543212",
      },
    ];

    const createdLocations = [];
    for (const location of locations) {
      const created = await storage.createLocation(location);
      createdLocations.push(created);
    }

    // 4. Create employees
    console.log("👥 Creating employees...");
    const employees = [
      {
        employeeCode: "BFC2024001",
        firstName: "Rajesh",
        lastName: "Kumar",
        department: "IT",
        designation: "Manager",
        email: "rajesh@bodycraft.com",
        phone: "+91-9876543210",
        status: "active",
        locationId: createdLocations[0].id,
      },
      {
        employeeCode: "BFC2024002",
        firstName: "Priya",
        lastName: "Sharma",
        department: "Sales",
        designation: "Executive",
        email: "priya@bodycraft.com",
        phone: "+91-9876543211",
        status: "active",
        locationId: createdLocations[1].id,
      },
      {
        employeeCode: "BFC2024003",
        firstName: "Amit",
        lastName: "Singh",
        department: "Operations",
        designation: "Specialist",
        email: "amit@bodycraft.com",
        phone: "+91-9876543212",
        status: "active",
        locationId: createdLocations[2].id,
      },
      {
        employeeCode: "BFC2024004",
        firstName: "Sunita",
        lastName: "Reddy",
        department: "Marketing",
        designation: "Specialist",
        email: "sunita@bodycraft.com",
        phone: "+91-9876543213",
        status: "active",
        locationId: createdLocations[0].id,
      },
    ];

    const createdEmployees = [];
    for (const employee of employees) {
      const created = await storage.createEmployee(employee);
      createdEmployees.push(created);
    }

    // 5. Create super admin user
    console.log("👤 Creating super admin user...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await storage.createUser({
      username: "admin",
      email: "admin@bodycraft.com",
      passwordHash: hashedPassword,
      firstName: "Super",
      lastName: "Admin",
      role: "super_admin",
      status: "active",
      employeeId: createdEmployees[0].id,
    });

    // 6. Create assets
    console.log("💻 Creating assets...");
    const assets = [
      {
        assetId: "BFC001",
        modelName: "ThinkPad E15",
        brand: "Lenovo",
        serviceTag: "LEN001",
        assetType: "Laptop",
        status: "assigned",
        condition: "good",
        purchaseDate: "2024-01-15",
        warrantyExpiry: "2026-01-15",
        locationId: createdLocations[0].id,
        currentUserId: createdEmployees[0].id,
      },
      {
        assetId: "BFC002",
        modelName: "OptiPlex 3080",
        brand: "Dell",
        serviceTag: "DELL002",
        assetType: "Desktop",
        status: "available",
        condition: "excellent",
        purchaseDate: "2024-02-01",
        warrantyExpiry: "2027-02-01",
        locationId: createdLocations[0].id,
        currentUserId: null,
      },
      {
        assetId: "BFC003",
        modelName: "Surface Pro 8",
        brand: "Microsoft",
        serviceTag: "MS003",
        assetType: "Laptop",
        status: "assigned",
        condition: "good",
        purchaseDate: "2024-01-20",
        warrantyExpiry: "2026-01-20",
        locationId: createdLocations[1].id,
        currentUserId: createdEmployees[1].id,
      },
      {
        assetId: "BFC004",
        modelName: "UZ2450",
        brand: "Dell",
        serviceTag: "DELL004",
        assetType: "Monitor",
        status: "available",
        condition: "good",
        purchaseDate: "2024-02-05",
        warrantyExpiry: "2027-02-05",
        locationId: createdLocations[1].id,
        currentUserId: null,
      },
      {
        assetId: "BFC005",
        modelName: "iPhone 14",
        brand: "Apple",
        serviceTag: "APL005",
        assetType: "Mobile",
        status: "assigned",
        condition: "excellent",
        purchaseDate: "2024-01-10",
        warrantyExpiry: "2025-01-10",
        locationId: createdLocations[2].id,
        currentUserId: createdEmployees[2].id,
      },
      {
        assetId: "BFC006",
        modelName: "MacBook Pro 14",
        brand: "Apple",
        serviceTag: "APL006",
        assetType: "Laptop",
        status: "maintenance",
        condition: "fair",
        purchaseDate: "2023-12-15",
        warrantyExpiry: "2025-12-15",
        locationId: createdLocations[2].id,
        currentUserId: null,
      },
      {
        assetId: "BFC007",
        modelName: "ThinkPad X1",
        brand: "Lenovo",
        serviceTag: "LEN007",
        assetType: "Laptop",
        status: "assigned",
        condition: "good",
        purchaseDate: "2024-03-01",
        warrantyExpiry: "2026-03-01",
        locationId: createdLocations[0].id,
        currentUserId: createdEmployees[3].id,
      },
    ];

    for (const asset of assets) {
      await storage.createAsset(asset);
    }

    // 7. Create assignment history
    console.log("📋 Creating assignment history...");
    const assignments = [
      {
        assetId: "BFC001",
        employeeId: createdEmployees[0].id,
        assignedDate: "2024-01-15",
        returnedDate: null,
        assignmentReason: "New employee setup",
        conditionOnAssignment: "good",
        createdBy: createdEmployees[0].id,
      },
      {
        assetId: "BFC003",
        employeeId: createdEmployees[1].id,
        assignedDate: "2024-02-01",
        returnedDate: null,
        assignmentReason: "Department transfer",
        conditionOnAssignment: "good",
        createdBy: createdEmployees[0].id,
      },
      {
        assetId: "BFC005",
        employeeId: createdEmployees[2].id,
        assignedDate: "2024-02-15",
        returnedDate: null,
        assignmentReason: "Business requirement",
        conditionOnAssignment: "excellent",
        createdBy: createdEmployees[0].id,
      },
      {
        assetId: "BFC007",
        employeeId: createdEmployees[3].id,
        assignedDate: "2024-03-01",
        returnedDate: null,
        assignmentReason: "New hire equipment",
        conditionOnAssignment: "good",
        createdBy: createdEmployees[0].id,
      },
    ];

    for (const assignment of assignments) {
      await storage.createAssignment(assignment);
    }

    // 8. Create maintenance records
    console.log("🔧 Creating maintenance records...");
    const maintenanceRecords = [
      {
        assetId: "BFC006",
        maintenanceType: "corrective",
        description: "Screen replacement due to crack",
        scheduledDate: "2024-03-01",
        completedDate: "2024-03-02",
        cost: 15000.0,
        technicianName: "Ravi Tech Services",
        partsReplaced: "LCD Screen",
      },
      {
        assetId: "BFC001",
        maintenanceType: "preventive",
        description: "Regular cleaning and system check",
        scheduledDate: "2024-03-15",
        completedDate: "2024-03-15",
        cost: 500.0,
        technicianName: "Internal IT",
        partsReplaced: null,
      },
      {
        assetId: "BFC002",
        maintenanceType: "upgrade",
        description: "RAM upgrade from 8GB to 16GB",
        scheduledDate: "2024-02-20",
        completedDate: "2024-02-21",
        cost: 3500.0,
        technicianName: "Dell Support",
        partsReplaced: "8GB DDR4 RAM",
      },
    ];

    for (const record of maintenanceRecords) {
      await storage.createMaintenanceRecord(record);
    }

    // 9. Create CCTV systems
    console.log("📹 Creating CCTV systems...");
    const cctvSystems = [
      {
        deviceName: "JP Nagar Entrance Camera",
        ipAddress: "192.168.1.101",
        locationDetails: "Main entrance",
        username: "admin",
        passwordHash: await bcrypt.hash("hikvision123", 10),
        status: "online",
        lastOnline: new Date().toISOString(),
        locationId: createdLocations[0].id,
      },
      {
        deviceName: "JP Nagar DVR System",
        ipAddress: "192.168.1.102",
        locationDetails: "Server room",
        username: "admin",
        passwordHash: await bcrypt.hash("hikvision123", 10),
        status: "online",
        lastOnline: new Date().toISOString(),
        locationId: createdLocations[0].id,
      },
      {
        deviceName: "Koramangala Reception Cam",
        ipAddress: "192.168.2.101",
        locationDetails: "Reception area",
        username: "admin",
        passwordHash: await bcrypt.hash("hikvision123", 10),
        status: "online",
        lastOnline: new Date().toISOString(),
        locationId: createdLocations[1].id,
      },
      {
        deviceName: "Indiranagar Security DVR",
        ipAddress: "192.168.3.101",
        locationDetails: "Security office",
        username: "admin",
        passwordHash: await bcrypt.hash("hikvision123", 10),
        status: "offline",
        lastOnline: null,
        locationId: createdLocations[2].id,
      },
    ];

    for (const system of cctvSystems) {
      await storage.createCctvSystem(system);
    }

    // 10. Create biometric systems
    console.log("👆 Creating biometric systems...");
    const biometricSystems = [
      {
        deviceName: "JP Nagar Attendance",
        deviceModel: "eSSL K30 Pro",
        ipAddress: "192.168.1.201",
        locationDetails: "Main entrance",
        employeeCount: 15,
        lastSyncDate: new Date().toISOString(),
        status: "online",
        locationId: createdLocations[0].id,
      },
      {
        deviceName: "Koramangala Biometric",
        deviceModel: "ZKTeco F18",
        ipAddress: "192.168.2.201",
        locationDetails: "Employee entrance",
        employeeCount: 12,
        lastSyncDate: new Date().toISOString(),
        status: "online",
        locationId: createdLocations[1].id,
      },
      {
        deviceName: "Indiranagar Access Control",
        deviceModel: "Realtime T502",
        ipAddress: "192.168.3.201",
        locationDetails: "Staff entry",
        employeeCount: 18,
        lastSyncDate: new Date().toISOString(),
        status: "error",
        locationId: createdLocations[2].id,
      },
    ];

    for (const system of biometricSystems) {
      await storage.createBiometricSystem(system);
    }

    // 11. Create backup records
    console.log("💾 Creating backup records...");
    const backupRecords = [
      {
        assetId: "BFC001",
        employeeId: createdEmployees[0].id,
        backupDate: new Date("2024-01-14").toISOString(),
        backupSize: "250GB",
        backupType: "full",
        backupLocation: "NAS Server - /backups/users/rajesh",
        performedBy: createdEmployees[0].id,
      },
      {
        assetId: "BFC003",
        employeeId: createdEmployees[1].id,
        backupDate: new Date("2024-01-31").toISOString(),
        backupSize: "180GB",
        backupType: "selective",
        backupLocation: "Cloud Storage - AWS S3",
        performedBy: createdEmployees[0].id,
      },
      {
        assetId: "BFC005",
        employeeId: createdEmployees[2].id,
        backupDate: new Date("2024-02-14").toISOString(),
        backupSize: "128GB",
        backupType: "full",
        backupLocation: "Local Server - /backups/mobile",
        performedBy: createdEmployees[0].id,
      },
    ];

    for (const record of backupRecords) {
      await storage.createBackup(record);
    }

    console.log("✅ Database seeded successfully!");
    console.log("\n🔑 Super Admin Login:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@bodycraft.com");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seed function immediately
seedDatabase()
  .then(() => {
    console.log("🎉 Seeding completed!");
  })
  .catch((error) => {
    console.error("💥 Seeding failed:", error);
    throw error;
  });

export { seedDatabase };
