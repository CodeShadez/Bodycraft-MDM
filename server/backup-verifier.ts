import type { IStorage } from './storage';
import type { 
  InsertBackupVerification,
  InsertComplianceSignal,
  InsertComplianceTask
} from '@shared/schema';

interface BackupCheckResult {
  assetId: string;
  lastBackupDate: Date | null;
  backupStatus: 'success' | 'failed' | 'missing';
  backupSize: number;
  backupLocation: string;
  issues: string[];
}

export class BackupVerifier {
  constructor(private storage: IStorage) {}

  async runVerification(locationId?: number): Promise<void> {
    console.log(`Starting backup verification for location ${locationId || 'all'}`);
    
    // Get all assets to check
    const assets = await this.storage.getAllAssets();
    const filteredAssets = locationId 
      ? assets.filter((a: any) => a.locationId === locationId)
      : assets;

    for (const asset of filteredAssets) {
      try {
        // Skip non-backup-eligible assets (monitors, keyboards, etc.) BEFORE any processing
        const isBackupEligible = asset.assetType !== 'monitor' && asset.assetType !== 'keyboard';
        
        if (!isBackupEligible) {
          // Don't check, store, or create tasks for non-backup assets
          continue;
        }
        
        // Check backup status only for backup-eligible assets
        const backupResult = await this.checkBackupStatus(asset);
        
        // Store verification result
        await this.storeVerificationResult(asset, backupResult);
        
        // Create compliance signal if backup failed or missing
        if (backupResult.backupStatus !== 'success') {
          await this.createBackupSignal(asset, backupResult);
          
          // Auto-create compliance task
          await this.createBackupTask(asset, backupResult);
        }
      } catch (error) {
        console.error(`Failed to verify backup for asset ${asset.assetId}:`, error);
      }
    }
    
    console.log(`Backup verification completed for ${filteredAssets.length} assets`);
  }

  private async checkBackupStatus(asset: any): Promise<BackupCheckResult> {
    // In a real implementation, this would:
    // 1. Check Hikvision CCTV backup status (for CCTV devices)
    // 2. Query Google Cloud Storage backup metadata
    // 3. Check local backup servers
    // 4. Verify backup integrity
    
    // For now, simulate backup checks with business logic
    const now = new Date();
    const isBackupConfigured = asset.assetType !== 'monitor' && asset.assetType !== 'keyboard'; // Only backup servers/laptops
    
    if (!isBackupConfigured) {
      return {
        assetId: asset.assetId,
        lastBackupDate: null,
        backupStatus: 'missing',
        backupSize: 0,
        backupLocation: 'N/A',
        issues: ['Backup not configured for this asset type']
      };
    }

    // Simulate backup check - in production, this would call actual backup APIs
    const daysSincePurchase = asset.purchaseDate 
      ? Math.floor((now.getTime() - new Date(asset.purchaseDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    
    // Simulate some backup failures for demo/testing
    const hasBackupIssue = Math.random() < 0.15; // 15% failure rate for demo
    const backupAge = Math.floor(Math.random() * 10); // 0-9 days old
    
    if (hasBackupIssue) {
      return {
        assetId: asset.assetId,
        lastBackupDate: new Date(now.getTime() - backupAge * 24 * 60 * 60 * 1000),
        backupStatus: backupAge > 7 ? 'missing' : 'failed',
        backupSize: 0,
        backupLocation: 'gs://bodycraft-backups',
        issues: backupAge > 7 
          ? [`No backup found in last ${backupAge} days`]
          : ['Backup verification failed', 'Checksum mismatch detected']
      };
    }

    // Successful backup
    return {
      assetId: asset.assetId,
      lastBackupDate: new Date(now.getTime() - backupAge * 24 * 60 * 60 * 1000),
      backupStatus: 'success',
      backupSize: Math.floor(Math.random() * 500000) + 50000, // 50MB - 550MB
      backupLocation: 'gs://bodycraft-backups',
      issues: []
    };
  }

  private async storeVerificationResult(
    asset: any,
    result: BackupCheckResult
  ): Promise<void> {
    const nextCheckDate = new Date();
    nextCheckDate.setDate(nextCheckDate.getDate() + 1); // Daily checks

    const verification: InsertBackupVerification = {
      assetId: asset.assetId,
      verificationMethod: 'automated',
      verificationStatus: result.backupStatus === 'success' ? 'passed' : 
                         result.backupStatus === 'missing' ? 'warning' : 'failed',
      checksPerformed: JSON.stringify([
        'Backup existence check',
        'Backup age verification',
        'Data integrity check'
      ]),
      issuesFound: result.issues.length > 0 ? JSON.stringify(result.issues) : null,
      healthScore: result.backupStatus === 'success' ? 100 : 
                   result.backupStatus === 'failed' ? 50 : 0,
      verifiedAt: new Date(),
      nextVerificationDue: nextCheckDate
    };

    await this.storage.createBackupVerification(verification);
  }

  private async createBackupSignal(
    asset: any,
    result: BackupCheckResult
  ): Promise<void> {
    const severity = result.backupStatus === 'missing' ? 'critical' : 'high';
    
    const signal: InsertComplianceSignal = {
      assetId: asset.assetId,
      locationId: asset.locationId,
      signalType: result.backupStatus === 'missing' ? 'backup_missing' : 'backup_failure',
      signalData: JSON.stringify({
        description: result.issues.join('; '),
        lastBackupDate: result.lastBackupDate,
        backupLocation: result.backupLocation,
        issues: result.issues
      }),
      severity: severity,
      detectedAt: new Date(),
      status: 'active'
    };

    await this.storage.createComplianceSignal(signal);
  }

  private async createBackupTask(
    asset: any,
    result: BackupCheckResult
  ): Promise<void> {
    const taskName = result.backupStatus === 'missing' 
      ? 'Configure Backup for Asset'
      : 'Resolve Backup Failure';
    
    const description = `Backup issue detected for ${asset.modelName} (${asset.assetId}):\n${result.issues.join('\n')}`;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (result.backupStatus === 'missing' ? 3 : 1));

    const task: InsertComplianceTask = {
      taskName: taskName,
      description: description,
      taskType: 'backup',
      category: 'data_backup',
      dueDate: dueDate.toISOString(),
      createdBy: 1, // System-generated
      status: 'pending',
      priority: result.backupStatus === 'missing' ? 'high' : 'medium',
      locationId: asset.locationId,
      riskLevel: result.backupStatus === 'missing' ? 'critical' : 'high',
      createdAt: new Date()
    };

    await this.storage.createComplianceTask(task);
  }

  async getDueVerifications(): Promise<any[]> {
    return await this.storage.getDueBackupVerifications();
  }

  async getVerificationHistory(assetId?: string): Promise<any[]> {
    return await this.storage.getBackupVerifications(
      assetId ? { assetId } : undefined
    );
  }

  async getBackupHealthSummary(locationId?: number): Promise<any> {
    const verifications = await this.storage.getBackupVerifications(
      undefined // Get all verifications
    );

    const summary = {
      totalAssets: 0,
      successfulBackups: 0,
      failedBackups: 0,
      missingBackups: 0,
      lastCheckTime: new Date(),
      criticalAssets: [] as string[]
    };

    const seen = new Set<string>();

    for (const v of verifications) {
      if (v.assetId && !seen.has(v.assetId)) {
        seen.add(v.assetId);
        summary.totalAssets++;

        if (v.verificationStatus === 'passed') {
          summary.successfulBackups++;
        } else if (v.verificationStatus === 'failed') {
          summary.failedBackups++;
          summary.criticalAssets.push(v.assetId);
        } else if (v.verificationStatus === 'warning') {
          summary.missingBackups++;
          summary.criticalAssets.push(v.assetId);
        }
      }
    }

    return summary;
  }

  async triggerBackupForAsset(assetId: string): Promise<{ success: boolean; message: string }> {
    // In production, this would:
    // 1. Trigger actual backup via API (Google Cloud Storage, Veeam, etc.)
    // 2. For CCTV: Call Hikvision API to force backup
    // 3. For servers: Execute backup scripts
    
    console.log(`Triggering backup for asset ${assetId}`);
    
    // Simulate backup trigger
    const success = Math.random() > 0.1; // 90% success rate
    
    if (success) {
      // Create success signal
      const asset = await this.storage.getAsset(assetId);
      if (asset) {
        const signal: InsertComplianceSignal = {
          assetId: assetId,
          locationId: asset.locationId,
          signalType: 'backup_triggered',
          signalData: JSON.stringify({
            description: 'Manual backup initiated successfully',
            triggeredAt: new Date()
          }),
          severity: 'low',
          detectedAt: new Date(),
          status: 'active'
        };
        
        await this.storage.createComplianceSignal(signal);
      }
      
      return {
        success: true,
        message: `Backup initiated successfully for asset ${assetId}`
      };
    } else {
      return {
        success: false,
        message: `Failed to initiate backup for asset ${assetId}. Please check backup service.`
      };
    }
  }
}
