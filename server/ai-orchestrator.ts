// Import necessary modules
import OpenAI from "openai"; // OpenAI SDK
import type { IStorage } from "./storage"; // Storage interface
import type { // Database insertion types
  InsertComplianceSignal,
  InsertComplianceRiskScore,
  InsertAutomationRun,
  InsertAiRecommendation,
  InsertComplianceTask,
  InsertComplianceAssignmentQueue,
} from "@shared/schema-sqlite";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "", // Use API key from environment variables
});

// Define RiskFactors interface
interface RiskFactors {
  assetAge: number; // Age of the asset
  maintenanceGaps: number; // Number of maintenance gaps
  backupMissing: boolean; // Backup missing flag
  warrantyExpired: boolean; // Warranty expired flag
  complianceViolations: number; // Number of compliance violations
}

// Define AutomationContext interface
interface AutomationContext {
  locationId: number; // Location ID for the automation run
  signals: Awaited<ReturnType<IStorage["getActiveComplianceSignals"]>>; // Compliance signals for the location
  assets: any[]; // List of assets
  employees: any[]; // List of employees
}

// AIOrchestrator class for managing automated compliance processes
export class AIOrchestrator {
  constructor(private storage: IStorage) {}

  // Main function to run the automation process
  async runAutomation(locationId?: number): Promise<void> {
    const runId = await this.startAutomationRun(locationId);

    try {
      // Get context data
      const context = await this.gatherContext(locationId);

      // Step 1: Analyze signals and generate risk scores
      await this.analyzeComplianceSignals(context, runId);

      // Step 2: Generate AI recommendations for remediation
      await this.generateAIRecommendations(context, runId);

      // Step 3: Auto-generate compliance tasks
      await this.autoGenerateTasks(context, runId);

      // Step 4: Optimize task assignments
      await this.optimizeAssignments(context, runId);

      await this.completeAutomationRun(runId, "completed", {
        tasksGenerated: context.signals.length,
        risksDetected: context.signals.length,
      });
    } catch (error) {
      console.error("Automation run failed:", error);
      await this.completeAutomationRun(runId, "failed");
      throw error;
    }
  }

  private async startAutomationRun(locationId?: number): Promise<number> {
    const run: InsertAutomationRun = {
      runType: "manual",
      status: "running",
      startedAt: new Date().toISOString(),
    };

    const result = await this.storage.createAutomationRun(run);
    return result.id;
  }

  private async completeAutomationRun(
    runId: number,
    status: "completed" | "failed",
    stats?: {
      tasksGenerated?: number;
      risksDetected?: number;
      assignmentsCreated?: number;
    },
  ): Promise<void> {
    await this.storage.updateAutomationRun(runId, {
      status,
      completedAt: new Date().toISOString(),
      ...stats,
    });
  }

  private async gatherContext(locationId?: number): Promise<AutomationContext> {
    const signals = await this.storage.getActiveComplianceSignals(
      locationId ? { locationId } : undefined,
    );

    // Get all assets for analysis
    const assets = await this.storage.getAllAssets();
    const employees = await this.storage.getAllEmployees();

    return {
      locationId: locationId || 0,
      signals,
      assets: locationId
        ? assets.filter((a: any) => a.locationId === locationId)
        : assets,
      employees: locationId
        ? employees.filter((e: any) => e.locationId === locationId)
        : employees,
    };
  }

  private async analyzeComplianceSignals(
    context: AutomationContext,
    runId: number,
  ): Promise<void> {
    for (const signal of context.signals) {
      // Calculate risk score based on signal severity and context
      const riskScore = await this.calculateRiskScore(signal, context);

      const riskRecord: InsertComplianceRiskScore = {
        locationId: signal.locationId,
        assetId: signal.assetId || null,
        riskScore: riskScore,
        riskLevel: this.getRiskLevel(riskScore),
        riskFactors: JSON.stringify({
          severity: signal.severity,
          signalType: signal.signalType,
          automationRunId: runId,
        }),
        aiModel: "rule-based-v1",
        confidence: 90,
        calculatedAt: new Date().toISOString(),
      };

      await this.storage.createComplianceRiskScore(riskRecord);
    }
  }

  private async calculateRiskScore(
    signal: any,
    context: AutomationContext,
  ): Promise<number> {
    const factors: RiskFactors = {
      assetAge: 0,
      maintenanceGaps: 0,
      backupMissing: signal.signalType === "backup_failure",
      warrantyExpired: signal.signalType === "warranty_expired",
      complianceViolations: context.signals.filter(
        (s) => s.assetId === signal.assetId && s.status === "active",
      ).length,
    };

    // Find asset if assetId exists
    if (signal.assetId) {
      const asset = context.assets.find((a) => a.assetId === signal.assetId);
      if (asset && asset.purchaseDate) {
        const ageInYears =
          (Date.now() - new Date(asset.purchaseDate).getTime()) /
          (365 * 24 * 60 * 60 * 1000);
        factors.assetAge = ageInYears;
      }
    }

    // Base score from severity
    let score =
      signal.severity === "critical"
        ? 80
        : signal.severity === "high"
          ? 60
          : signal.severity === "medium"
            ? 40
            : 20;

    // Adjust based on factors
    if (factors.assetAge > 5) score += 10;
    if (factors.backupMissing) score += 15;
    if (factors.warrantyExpired) score += 10;
    score += Math.min(factors.complianceViolations * 5, 20);

    return Math.min(score, 100);
  }

  private getRiskLevel(score: number): string {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 40) return "medium";
    return "low";
  }

  private async generateAIRecommendations(
    context: AutomationContext,
    runId: number,
  ): Promise<void> {
    for (const signal of context.signals.slice(0, 5)) {
      // Limit to 5 for API costs
      try {
        const recommendation = await this.getAIRecommendation(signal, context);

        const aiRec: InsertAiRecommendation = {
          recommendationType: "remediation",
          targetType: signal.assetId ? "asset" : "location",
          targetId: signal.assetId || signal.locationId?.toString() || "0",
          title: this.generateTaskTitle(signal),
          description: recommendation,
          priority: signal.severity === "critical" ? "high" : "medium",
          confidence: 85,
          status: "pending",
          aiModel: "gpt-4o-mini",
          createdAt: new Date().toISOString(),
        };

        await this.storage.createAiRecommendation(aiRec);
      } catch (error) {
        console.error("Failed to generate AI recommendation:", error);
        // Continue with other signals
      }
    }
  }

  private async getAIRecommendation(
    signal: any,
    context: AutomationContext,
  ): Promise<string> {
    const retryWithBackoff = async (attempt: number = 0): Promise<string> => {
      try {
        const signalData = signal.signalData
          ? JSON.parse(signal.signalData)
          : {};
        const description = signalData.description || "No details available";

        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an IT asset compliance expert for BODYCRAFT, a retail chain with 32 outlets in India. 
              Provide concise, actionable recommendations for compliance issues. Focus on practical steps.`,
            },
            {
              role: "user",
              content: `Compliance Issue Detected:
              Type: ${signal.signalType}
              Severity: ${signal.severity}
              Description: ${description}
              Asset ID: ${signal.assetId || "N/A"}
              Location: Store #${signal.locationId}
              
              Provide a brief remediation plan (2-3 sentences).`,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        });

        return (
          completion.choices[0]?.message?.content ||
          "Unable to generate recommendation"
        );
      } catch (error: any) {
        if (attempt < 3 && (error?.status === 429 || error?.status === 500)) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return retryWithBackoff(attempt + 1);
        }
        throw error;
      }
    };

    return retryWithBackoff();
  }

  private async autoGenerateTasks(
    context: AutomationContext,
    runId: number,
  ): Promise<void> {
    for (const signal of context.signals) {
      const signalData = signal.signalData ? JSON.parse(signal.signalData) : {};
      const description =
        signalData.description || `Automated task for ${signal.signalType}`;

      const task: InsertComplianceTask = {
        taskName: this.generateTaskTitle(signal),
        description:
          description + (signal.assetId ? ` (Asset: ${signal.assetId})` : ""),
        taskType: this.mapCategoryToTaskType(signal.signalType),
        category: signal.signalType,
        dueDate: this.calculateDueDate(signal.severity).toISOString(),
        createdBy: 1, // System user ID
        status: "pending",
        locationId: signal.locationId,
        createdAt: new Date().toISOString(),
      };

      await this.storage.createComplianceTask(task);
    }
  }

  private generateTaskTitle(signal: any): string {
    const titles: Record<string, string> = {
      license_expiring: "Renew Software License",
      warranty_expired: "Review Warranty Coverage",
      backup_failure: "Resolve Backup Issue",
      backup_missing: "Restore Missing Backup",
      security_patch: "Apply Security Updates",
      audit_required: "Complete Compliance Audit",
      maintenance_overdue: "Schedule Overdue Maintenance",
    };

    return titles[signal.signalType] || `Resolve ${signal.signalType}`;
  }

  private mapCategoryToTaskType(signalType: string): string {
    const mapping: Record<string, string> = {
      license_expiring: "license_renewal",
      warranty_expired: "warranty_check",
      backup_failure: "backup",
      backup_missing: "backup",
      security_patch: "security_audit",
      audit_required: "policy_review",
      maintenance_overdue: "system_update",
    };

    return mapping[signalType] || "backup";
  }

  private calculateDueDate(severity: string): Date {
    const now = new Date();
    const days =
      severity === "critical"
        ? 3
        : severity === "high"
          ? 7
          : severity === "medium"
            ? 14
            : 30;

    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private async optimizeAssignments(
    context: AutomationContext,
    runId: number,
  ): Promise<void> {
    // Get pending tasks for this run
    const tasks = await this.storage.getComplianceTasks({
      locationId: context.locationId || undefined,
      status: "pending",
    });

    for (const taskData of tasks.slice(0, 10)) {
      // Limit assignments
      const task = taskData.task;

      // Find best employee based on workload and expertise
      const bestEmployee = this.findOptimalAssignment(
        task,
        context.employees,
        tasks,
      );

      if (bestEmployee) {
        const assignment: InsertComplianceAssignmentQueue = {
          taskId: task.id,
          assignedTo: bestEmployee.id,
          locationId: task.locationId,
          assignedAt: new Date().toISOString(),
          status: "assigned",
          assignmentReason: "AI optimized based on workload",
          workloadScore: 50, // Default score
        };

        await this.storage.createComplianceAssignment(assignment);

        // Update task with assignment
        await this.storage.updateComplianceTask(task.id, {
          assignedTo: bestEmployee.id,
        });
      }
    }
  }

  private findOptimalAssignment(
    task: any,
    employees: any[],
    allTasks: any[],
  ): any {
    // Filter employees by location
    const locationEmployees = employees.filter(
      (e) => e.locationId === task.locationId,
    );

    if (locationEmployees.length === 0) return null;

    // Calculate workload for each employee
    const workloads = locationEmployees.map((emp) => {
      const assignedTasks = allTasks.filter(
        (t) => t.task.assignedTo === emp.id && t.task.status === "pending",
      ).length;

      return {
        employee: emp,
        workload: assignedTasks,
      };
    });

    // Sort by workload (ascending) and return employee with least work
    workloads.sort((a, b) => a.workload - b.workload);
    return workloads[0].employee;
  }

  async getPredictiveAlerts(locationId?: number): Promise<any[]> {
    const assets = await this.storage.getAllAssets();
    const filteredAssets = locationId
      ? assets.filter((a: any) => a.locationId === locationId)
      : assets;

    const alerts: any[] = [];

    for (const asset of filteredAssets) {
      // Check warranty expiration
      if (asset.warrantyExpiry) {
        const daysUntilExpiry = Math.ceil(
          (new Date(asset.warrantyExpiry).getTime() - Date.now()) /
            (24 * 60 * 60 * 1000),
        );

        if (daysUntilExpiry > 0 && daysUntilExpiry <= 30) {
          alerts.push({
            type: "warranty_expiring",
            severity: daysUntilExpiry <= 7 ? "high" : "medium",
            assetId: asset.assetId,
            daysUntil: daysUntilExpiry,
            message: `Warranty expires in ${daysUntilExpiry} days`,
            predictedDate: asset.warrantyExpiry,
          });
        }
      }

      // Check asset age
      if (asset.purchaseDate) {
        const ageInYears =
          (Date.now() - new Date(asset.purchaseDate).getTime()) /
          (365 * 24 * 60 * 60 * 1000);

        if (ageInYears >= 4.5) {
          alerts.push({
            type: "replacement_due",
            severity: ageInYears >= 5 ? "high" : "medium",
            assetId: asset.assetId,
            message: `Asset is ${Math.floor(ageInYears)} years old, consider replacement`,
            predictedDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
          });
        }
      }
    }

    return alerts;
  }

  async getRiskInsights(locationId?: number): Promise<any> {
    const riskScores = await this.storage.getLatestRiskScores(
      locationId ? { locationId } : undefined,
    );

    // Group by location
    const byLocation: Record<number, any> = {};

    for (const score of riskScores) {
      const locId = score.locationId || 0;
      if (!byLocation[locId]) {
        byLocation[locId] = {
          locationId: locId,
          averageRisk: 0,
          criticalCount: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0,
          scores: [],
        };
      }

      byLocation[locId].scores.push(score);

      if (score.riskLevel === "critical") byLocation[locId].criticalCount++;
      else if (score.riskLevel === "high") byLocation[locId].highCount++;
      else if (score.riskLevel === "medium") byLocation[locId].mediumCount++;
      else byLocation[locId].lowCount++;
    }

    // Calculate averages
    Object.values(byLocation).forEach((loc) => {
      const total = loc.scores.reduce(
        (sum: number, s: any) => sum + s.riskScore,
        0,
      );
      loc.averageRisk = loc.scores.length > 0 ? total / loc.scores.length : 0;
    });

    return Object.values(byLocation);
  }
}
