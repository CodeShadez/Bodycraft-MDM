import dotenv from "dotenv";
dotenv.config();

import { DatabaseStorage } from "./database-storage";
import bcrypt from "bcryptjs";

const storage = new DatabaseStorage();

async function seedMinimalDatabase() {
  console.log("🌱 Starting minimal database seed...");

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

    // 2. Create one location
    console.log("🏢 Creating location...");
    const location = await storage.createLocation({
      outletName: "JP Nagar Outlet",
      city: "Bangalore",
      state: "Karnataka",
      address: "123 JP Nagar, Bangalore",
      managerName: "Rajesh Kumar",
      contactDetails: "+91-9876543210",
    });

    // 3. Create one employee
    console.log("👥 Creating employee...");
    const employee = await storage.createEmployee({
      employeeCode: "BFC2024001",
      firstName: "Rajesh",
      lastName: "Kumar",
      department: "IT",
      designation: "IT Manager",
      email: "rajesh@bodycraft.com",
      phone: "+91-9876543210",
      status: "active",
      locationId: location.id,
    });

    // 4. Create super admin user
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
      employeeId: employee.id,
    });

    console.log("✅ Minimal database seeded successfully!");
    console.log("\n🔑 Super Admin Login:");
    console.log("Username: admin");
    console.log("Password: admin123");
    console.log("Email: admin@bodycraft.com");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

seedMinimalDatabase()
  .then(() => {
    console.log("🎉 Minimal seeding completed!");
  })
  .catch((error) => {
    console.error("💥 Minimal seeding failed:", error);
    throw error;
  });

export { seedMinimalDatabase };
