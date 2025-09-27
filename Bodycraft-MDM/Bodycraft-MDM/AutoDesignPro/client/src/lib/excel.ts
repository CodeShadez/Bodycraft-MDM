import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

// Excel export utility functions
export class ExcelExporter {
  // Export any data array to Excel file
  static exportToExcel(data: any[], filename: string, worksheetName: string = 'Sheet1') {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName)
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    saveAs(blob, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  // Export assets data with proper formatting
  static exportAssets(assets: any[], locations: any[]) {
    const formattedData = assets.map(asset => {
      const location = locations.find(l => l.id === asset.locationId)
      return {
        'Asset ID': asset.assetId,
        'Brand': asset.brand,
        'Model': asset.modelName,
        'Type': asset.assetType,
        'Serial Number': asset.serialNumber || 'N/A',
        'Purchase Date': asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : 'N/A',
        'Purchase Cost': asset.purchaseCost || 'N/A',
        'Warranty Until': asset.warrantyUntil ? new Date(asset.warrantyUntil).toLocaleDateString() : 'N/A',
        'Status': asset.status,
        'Location': location ? `${location.outletName}, ${location.city}` : 'No Location',
        'Condition': asset.condition || 'N/A',
        'Created': new Date(asset.createdAt).toLocaleDateString(),
        'Updated': new Date(asset.updatedAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Assets', 'Assets')
  }

  // Export employees data with proper formatting
  static exportEmployees(employees: any[], locations: any[], assignments: any[], assets: any[]) {
    const formattedData = employees.map(employee => {
      const location = locations.find(l => l.id === employee.locationId)
      const activeAssignment = assignments.find(a => a.employeeId === employee.id && !a.returnedDate)
      const assignedAsset = activeAssignment ? assets.find(a => a.assetId === activeAssignment.assetId) : null
      
      return {
        'Employee Code': employee.employeeCode,
        'First Name': employee.firstName,
        'Last Name': employee.lastName,
        'Department': employee.department,
        'Position': employee.position || 'N/A',
        'Email': employee.email || 'N/A',
        'Phone': employee.phone || 'N/A',
        'Join Date': employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : 'N/A',
        'Status': employee.status,
        'Location': location ? `${location.outletName}, ${location.city}` : 'No Location',
        'Assigned Asset': assignedAsset ? `${assignedAsset.assetId} - ${assignedAsset.brand} ${assignedAsset.modelName}` : 'No Asset',
        'Created': new Date(employee.createdAt).toLocaleDateString(),
        'Updated': new Date(employee.updatedAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Employees', 'Employees')
  }

  // Export assignments data with proper formatting
  static exportAssignments(assignments: any[], employees: any[], assets: any[], locations: any[]) {
    const formattedData = assignments.map(assignment => {
      const employee = employees.find(e => e.id === assignment.employeeId)
      const asset = assets.find(a => a.assetId === assignment.assetId)
      const location = locations.find(l => l.id === asset?.locationId)
      
      return {
        'Asset ID': assignment.assetId,
        'Asset Details': asset ? `${asset.brand} ${asset.modelName}` : 'Unknown Asset',
        'Employee Code': employee?.employeeCode || 'Unknown',
        'Employee Name': employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown Employee',
        'Department': employee?.department || 'N/A',
        'Location': location ? `${location.outletName}, ${location.city}` : 'No Location',
        'Assigned Date': new Date(assignment.assignedDate).toLocaleDateString(),
        'Returned Date': assignment.returnedDate ? new Date(assignment.returnedDate).toLocaleDateString() : 'Still Assigned',
        'Assignment Condition': assignment.assignmentCondition || 'N/A',
        'Return Condition': assignment.returnCondition || 'N/A',
        'Assignment Reason': assignment.assignmentReason || 'N/A',
        'Return Reason': assignment.returnReason || 'N/A',
        'Backup Details': assignment.backupDetails || 'N/A',
        'Status': assignment.returnedDate ? 'Returned' : 'Active',
        'Created': new Date(assignment.createdAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Assignments', 'Assignments')
  }

  // Export locations data with analytics
  static exportLocations(locations: any[], assets: any[], employees: any[], assignments: any[]) {
    const formattedData = locations.map(location => {
      const locationAssets = assets.filter(a => a.locationId === location.id)
      const locationEmployees = employees.filter(e => e.locationId === location.id)
      const activeAssignments = assignments.filter(a => {
        const employee = employees.find(e => e.id === a.employeeId)
        return employee?.locationId === location.id && !a.returnedDate
      })
      
      return {
        'Outlet Name': location.outletName,
        'City': location.city,
        'State': location.state,
        'Address': location.address,
        'Manager Name': location.managerName,
        'Contact Details': location.contactDetails,
        'Total Assets': locationAssets.length,
        'Available Assets': locationAssets.filter(a => a.status === 'available').length,
        'Assigned Assets': locationAssets.filter(a => a.status === 'assigned').length,
        'Maintenance Assets': locationAssets.filter(a => a.status === 'maintenance').length,
        'Total Employees': locationEmployees.length,
        'Active Employees': locationEmployees.filter(e => e.status === 'active').length,
        'Active Assignments': activeAssignments.length,
        'Created': new Date(location.createdAt).toLocaleDateString(),
        'Updated': new Date(location.updatedAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Locations', 'Locations')
  }

  // Export maintenance data with cost analysis
  static exportMaintenance(maintenance: any[], assets: any[], locations: any[]) {
    const formattedData = maintenance.map(record => {
      const asset = assets.find(a => a.assetId === record.assetId)
      const location = locations.find(l => l.id === asset?.locationId)
      
      return {
        'Asset ID': record.assetId,
        'Asset Details': asset ? `${asset.brand} ${asset.modelName}` : 'Unknown Asset',
        'Location': location ? `${location.outletName}, ${location.city}` : 'No Location',
        'Maintenance Type': record.maintenanceType.charAt(0).toUpperCase() + record.maintenanceType.slice(1),
        'Description': record.description,
        'Scheduled Date': new Date(record.scheduledDate).toLocaleDateString(),
        'Completed Date': record.completedDate ? new Date(record.completedDate).toLocaleDateString() : 'Not Completed',
        'Status': record.completedDate ? 'Completed' : 'Pending',
        'Cost': record.cost ? `₹${record.cost.toFixed(2)}` : 'Not Specified',
        'Technician': record.technicianName || 'Not Assigned',
        'Parts Replaced': record.partsReplaced || 'None',
        'Created': new Date(record.createdAt).toLocaleDateString(),
        'Updated': new Date(record.updatedAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Maintenance', 'Maintenance')
  }

  // Export compliance data with audit trail
  static exportCompliance(compliance: any[], assets: any[], locations: any[]) {
    const formattedData = compliance.map(record => {
      const asset = record.assetId ? assets.find(a => a.assetId === record.assetId) : null
      const location = locations.find(l => l.id === record.locationId)
      
      return {
        'Task Type': record.type.replace('_', ' ').charAt(0).toUpperCase() + record.type.replace('_', ' ').slice(1),
        'Category': record.category.replace('_', ' ').charAt(0).toUpperCase() + record.category.replace('_', ' ').slice(1),
        'Title': record.title,
        'Description': record.description,
        'Related Asset': asset ? `${asset.assetId} - ${asset.brand} ${asset.modelName}` : 'N/A',
        'Location': location ? `${location.outletName}, ${location.city}` : 'All Locations',
        'Due Date': new Date(record.dueDate).toLocaleDateString(),
        'Completed Date': record.completedDate ? new Date(record.completedDate).toLocaleDateString() : 'Not Completed',
        'Status': record.status.charAt(0).toUpperCase() + record.status.slice(1),
        'Assigned To': record.assignedTo,
        'Evidence': record.evidenceUrl ? 'Available' : 'Not Provided',
        'Evidence URL': record.evidenceUrl || 'N/A',
        'Compliance Notes': record.complianceNotes || 'None',
        'Created': new Date(record.createdAt).toLocaleDateString(),
        'Updated': new Date(record.updatedAt).toLocaleDateString()
      }
    })
    
    this.exportToExcel(formattedData, 'BODYCRAFT_Compliance', 'Compliance')
  }
}

// Excel import utility functions
export class ExcelImporter {
  // Parse uploaded Excel file
  static async parseExcelFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsBinaryString(file)
    })
  }

  // Validate and transform asset data
  static validateAssetData(data: any[]): { valid: any[], errors: string[] } {
    const valid: any[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2 // +2 because Excel rows start at 1 and we skip header

      // Required fields validation
      if (!row['Asset ID']) {
        errors.push(`Row ${rowNumber}: Asset ID is required`)
        return
      }
      if (!row['Brand']) {
        errors.push(`Row ${rowNumber}: Brand is required`)
        return
      }
      if (!row['Model']) {
        errors.push(`Row ${rowNumber}: Model is required`)
        return
      }
      if (!row['Type']) {
        errors.push(`Row ${rowNumber}: Type is required`)
        return
      }

      // Transform to API format
      const transformedRow = {
        assetId: row['Asset ID'],
        brand: row['Brand'],
        modelName: row['Model'],
        assetType: row['Type'],
        serialNumber: row['Serial Number'] || null,
        purchaseDate: row['Purchase Date'] ? new Date(row['Purchase Date']).toISOString() : null,
        purchaseCost: row['Purchase Cost'] ? parseFloat(row['Purchase Cost']) : null,
        warrantyUntil: row['Warranty Until'] ? new Date(row['Warranty Until']).toISOString() : null,
        status: row['Status'] || 'available',
        condition: row['Condition'] || 'good',
      }

      valid.push(transformedRow)
    })

    return { valid, errors }
  }

  // Validate and transform employee data
  static validateEmployeeData(data: any[]): { valid: any[], errors: string[] } {
    const valid: any[] = []
    const errors: string[] = []

    data.forEach((row, index) => {
      const rowNumber = index + 2

      // Required fields validation
      if (!row['Employee Code']) {
        errors.push(`Row ${rowNumber}: Employee Code is required`)
        return
      }
      if (!row['First Name']) {
        errors.push(`Row ${rowNumber}: First Name is required`)
        return
      }
      if (!row['Last Name']) {
        errors.push(`Row ${rowNumber}: Last Name is required`)
        return
      }
      if (!row['Department']) {
        errors.push(`Row ${rowNumber}: Department is required`)
        return
      }

      // Transform to API format
      const transformedRow = {
        employeeCode: row['Employee Code'],
        firstName: row['First Name'],
        lastName: row['Last Name'],
        department: row['Department'],
        position: row['Position'] || null,
        email: row['Email'] || null,
        phone: row['Phone'] || null,
        joinDate: row['Join Date'] ? new Date(row['Join Date']).toISOString() : null,
        status: row['Status'] || 'active',
      }

      valid.push(transformedRow)
    })

    return { valid, errors }
  }

  // Download template files
  static downloadAssetTemplate() {
    const templateData = [
      {
        'Asset ID': 'BFC001',
        'Brand': 'Lenovo',
        'Model': 'ThinkPad E15',
        'Type': 'laptop',
        'Serial Number': 'SN123456789',
        'Purchase Date': '2024-01-15',
        'Purchase Cost': '45000',
        'Warranty Until': '2027-01-15',
        'Status': 'available',
        'Condition': 'excellent'
      }
    ]
    this.exportToExcel(templateData, 'Asset_Import_Template', 'Assets')
  }

  static downloadEmployeeTemplate() {
    const templateData = [
      {
        'Employee Code': 'BFC2024001',
        'First Name': 'John',
        'Last Name': 'Doe', 
        'Department': 'IT',
        'Position': 'System Administrator',
        'Email': 'john.doe@bodycraft.com',
        'Phone': '+91 9876543210',
        'Join Date': '2024-01-15',
        'Status': 'active'
      }
    ]
    this.exportToExcel(templateData, 'Employee_Import_Template', 'Employees')
  }

  private static exportToExcel(data: any[], filename: string, worksheetName: string) {
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, worksheetName)
    
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    
    saveAs(blob, `${filename}.xlsx`)
  }
}