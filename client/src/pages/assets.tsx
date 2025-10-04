import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Laptop, 
  Monitor, 
  Smartphone, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Package,
  MapPin,
  User,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Computer
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ExcelExporter, ExcelImporter } from "@/lib/excel"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Asset type icons mapping
const assetTypeIcons: Record<string, any> = {
  Laptop: Laptop,
  Desktop: Computer,
  Monitor: Monitor,
  Mobile: Smartphone,
  Tablet: Smartphone,
  Router: Package,
  Switch: Package,
  Printer: Package,
  UPS: Package,
  default: Package
}

// Status color mapping
const statusColors: Record<string, string> = {
  available: "bg-green-400",
  assigned: "bg-blue-400", 
  maintenance: "bg-yellow-400",
  retired: "bg-red-400"
}

// Condition color mapping
const conditionColors: Record<string, string> = {
  excellent: "bg-green-400",
  good: "bg-blue-400",
  fair: "bg-yellow-400", 
  poor: "bg-red-400"
}

interface Asset {
  assetId: string
  modelName: string
  brand: string
  serviceTag: string | null
  assetType: string
  purchaseDate: string | null
  warrantyExpiry: string | null
  status: "available" | "assigned" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  locationId: number | null
  departmentId: number | null
  physicalLocation: string | null
  floor: string | null
  ownershipType: "company" | "rented" | "personal"
  assignmentType: "person" | "outlet"
  currentUserId: number | null
  createdAt: string
  updatedAt: string
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  department: string
}

export default function AssetsPage() {
  // Get URL search params to check for filters
  const urlParams = new URLSearchParams(window.location.search)
  const urlType = urlParams.get('type')
  const urlStatus = urlParams.get('status')
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || "all")
  const [typeFilter, setTypeFilter] = useState<string>(urlType || "all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  
  // Form state for create dialog
  const [newAsset, setNewAsset] = useState({
    assetId: '',
    assetType: '',
    brand: '',
    modelName: '',
    serviceTag: '',
    locationId: '',
    departmentId: '',
    physicalLocation: '',
    floor: '',
    ownershipType: 'company',
    assignmentType: 'person',
    purchaseDate: '',
    warrantyExpiry: '',
    status: 'available',
    condition: 'good'
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: assets, isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  const { data: departments } = useQuery<any[]>({
    queryKey: ["/api/departments"],
  })

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  })

  // Get unique asset types for filter
  const assetTypes = Array.from(new Set(assets?.map(asset => asset.assetType) || []))

  // Filter assets
  const filteredAssets = assets?.filter(asset => {
    const matchesSearch = 
      asset.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.serviceTag?.toLowerCase().includes(searchTerm.toLowerCase()) || false)
    
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter
    const matchesType = typeFilter === "all" || asset.assetType === typeFilter
    const matchesLocation = locationFilter === "all" || asset.locationId?.toString() === locationFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation
  }) || []

  // Create asset mutation
  const createAssetMutation = useMutation({
    mutationFn: async (assetData: any) => {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assetData),
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create asset')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset created successfully" })
      resetNewAssetForm()
      setIsCreateDialogOpen(false)
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message || "Failed to create asset", variant: "destructive" })
    }
  })

  // Update asset mutation  
  const updateAssetMutation = useMutation({
    mutationFn: async ({ assetId, data }: { assetId: string, data: any }) => {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update asset')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset updated successfully" })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update asset", variant: "destructive" })
    }
  })

  // Delete asset mutation
  const deleteAssetMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete asset')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset deleted successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete asset", variant: "destructive" })
    }
  })

  // Helper functions
  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "No location"
    const location = locations?.find(loc => loc.id === locationId)
    return location ? `${location.outletName}, ${location.city}` : "Unknown location"
  }

  const getEmployeeName = (employeeId: number | null) => {
    if (!employeeId) return "Unassigned"
    const employee = employees?.find(emp => emp.id === employeeId)
    return employee ? `${employee.firstName} ${employee.lastName}` : "Unknown employee"
  }

  const getAssetIcon = (assetType: string) => {
    const IconComponent = assetTypeIcons[assetType] || assetTypeIcons.default
    return <IconComponent className="h-4 w-4" />
  }

  const handleCreateAsset = (event: React.FormEvent) => {
    event.preventDefault()
    
    // Validate required fields
    if (!newAsset.assetId?.trim() || !newAsset.assetType?.trim() || !newAsset.brand?.trim() || !newAsset.modelName?.trim()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill in all required fields (Asset ID, Asset Type, Brand, Model Name)", 
        variant: "destructive" 
      })
      return
    }
    
    const assetData = {
      assetId: newAsset.assetId.trim(),
      modelName: newAsset.modelName.trim(),
      brand: newAsset.brand.trim(),
      serviceTag: newAsset.serviceTag?.trim() || null,
      assetType: newAsset.assetType,
      purchaseDate: newAsset.purchaseDate || null,
      warrantyExpiry: newAsset.warrantyExpiry || null,
      status: newAsset.status,
      condition: newAsset.condition,
      locationId: newAsset.locationId ? parseInt(newAsset.locationId) : null,
      departmentId: newAsset.departmentId ? parseInt(newAsset.departmentId) : null,
      physicalLocation: newAsset.physicalLocation?.trim() || null,
      floor: newAsset.floor?.trim() || null,
      ownershipType: newAsset.ownershipType,
      assignmentType: newAsset.assignmentType,
    }

    createAssetMutation.mutate(assetData)
  }
  
  const resetNewAssetForm = () => {
    setNewAsset({
      assetId: '',
      assetType: '',
      brand: '',
      modelName: '',
      serviceTag: '',
      locationId: '',
      departmentId: '',
      physicalLocation: '',
      floor: '',
      ownershipType: 'company',
      assignmentType: 'person',
      purchaseDate: '',
      warrantyExpiry: '',
      status: 'available',
      condition: 'good'
    })
  }

  const handleUpdateAsset = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAsset) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const assetData = {
      modelName: formData.get('modelName'),
      brand: formData.get('brand'),
      serviceTag: formData.get('serviceTag') || null,
      assetType: formData.get('assetType'),
      purchaseDate: formData.get('purchaseDate') || null,
      warrantyExpiry: formData.get('warrantyExpiry') || null,
      status: formData.get('status'),
      condition: formData.get('condition'),
      locationId: formData.get('locationId') ? parseInt(formData.get('locationId') as string) : null,
      departmentId: formData.get('departmentId') ? parseInt(formData.get('departmentId') as string) : null,
      physicalLocation: formData.get('physicalLocation') || null,
      floor: formData.get('floor') || null,
      ownershipType: formData.get('ownershipType'),
      assignmentType: formData.get('assignmentType'),
    }

    updateAssetMutation.mutate({ assetId: selectedAsset.assetId, data: assetData })
  }

  // Excel Export Handler
  const handleExportAssets = () => {
    if (!filteredAssets || !locations) {
      toast({ title: "Error", description: "No data available to export", variant: "destructive" })
      return
    }
    
    ExcelExporter.exportAssets(filteredAssets, locations)
    toast({ title: "Success", description: `Exported ${filteredAssets.length} assets to Excel` })
  }

  // Excel Import Handler
  const handleImportAssets = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Please select a file to import", variant: "destructive" })
      return
    }

    setIsImporting(true)
    setImportErrors([])

    try {
      // Parse Excel file
      const data = await ExcelImporter.parseExcelFile(importFile)
      
      if (data.length === 0) {
        toast({ title: "Error", description: "The Excel file is empty", variant: "destructive" })
        setIsImporting(false)
        return
      }

      // Validate data
      const { valid, errors } = ExcelImporter.validateAssetData(data)
      
      if (errors.length > 0) {
        setImportErrors(errors)
        setIsImporting(false)
        return
      }

      // Import valid assets
      let successCount = 0
      let errorCount = 0
      
      for (const assetData of valid) {
        try {
          const response = await fetch('/api/assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(assetData),
          })
          
          if (response.ok) {
            successCount++
          } else {
            errorCount++
            const errorData = await response.json()
            setImportErrors(prev => [...prev, `Asset ${assetData.assetId}: ${errorData.message || 'Import failed'}`])
          }
        } catch (error) {
          errorCount++
          setImportErrors(prev => [...prev, `Asset ${assetData.assetId}: Network error`])
        }
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })

      if (successCount > 0) {
        toast({ 
          title: "Import Complete", 
          description: `Successfully imported ${successCount} assets${errorCount > 0 ? `, ${errorCount} failed` : ''}` 
        })
        
        if (errorCount === 0) {
          setIsImportDialogOpen(false)
          setImportFile(null)
        }
      } else {
        toast({ title: "Import Failed", description: "No assets were imported", variant: "destructive" })
      }

    } catch (error) {
      toast({ title: "Error", description: "Failed to parse Excel file", variant: "destructive" })
      setImportErrors(['Failed to parse Excel file. Please ensure it\'s a valid Excel file.'])
    } finally {
      setIsImporting(false)
    }
  }

  if (assetsLoading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Assets</h1>
          <p className="text-white/70">
            Comprehensive inventory management and lifecycle tracking for enterprise resources
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Assets from Excel</DialogTitle>
                <DialogDescription>
                  Bulk import enterprise resources using standardized Excel templates for efficient data onboarding
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => ExcelImporter.downloadAssetTemplate()}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="excel-file">Excel File *</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setImportFile(file)
                        setImportErrors([])
                      }
                    }}
                  />
                </div>
                
                {importErrors.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-red-600">Import Errors:</Label>
                    <div className="bg-red-50 p-3 rounded max-h-32 overflow-y-auto">
                      {importErrors.map((error, index) => (
                        <div key={index} className="text-sm text-red-600">• {error}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsImportDialogOpen(false)
                    setImportFile(null)
                    setImportErrors([])
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleImportAssets}
                  disabled={!importFile || isImporting}
                >
                  {isImporting ? "Importing..." : "Import Assets"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={handleExportAssets}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Asset</DialogTitle>
                <DialogDescription>
                  Add enterprise resources with complete lifecycle tracking and warranty information
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAsset} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetId">Asset ID *</Label>
                    <Input
                      id="assetId"
                      placeholder="BFC001"
                      required
                      value={newAsset.assetId}
                      onChange={(e) => setNewAsset({...newAsset, assetId: e.target.value})}
                      data-testid="input-asset-id"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assetType">Asset Type *</Label>
                    <Select 
                      value={newAsset.assetType} 
                      onValueChange={(value) => setNewAsset({...newAsset, assetType: value})}
                      required
                    >
                      <SelectTrigger data-testid="select-asset-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Laptop">Laptop</SelectItem>
                        <SelectItem value="Desktop">Desktop</SelectItem>
                        <SelectItem value="Monitor">Monitor</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Tablet">Tablet</SelectItem>
                        <SelectItem value="Router">Router</SelectItem>
                        <SelectItem value="Switch">Switch</SelectItem>
                        <SelectItem value="Printer">Printer</SelectItem>
                        <SelectItem value="UPS">UPS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      placeholder="Dell, HP, Lenovo..."
                      required
                      value={newAsset.brand}
                      onChange={(e) => setNewAsset({...newAsset, brand: e.target.value})}
                      data-testid="input-brand"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="modelName">Model Name *</Label>
                    <Input
                      id="modelName"
                      placeholder="ThinkPad E15, OptiPlex 3080..."
                      required
                      value={newAsset.modelName}
                      onChange={(e) => setNewAsset({...newAsset, modelName: e.target.value})}
                      data-testid="input-model-name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceTag">Service Tag</Label>
                    <Input
                      id="serviceTag"
                      placeholder="Manufacturer service tag"
                      value={newAsset.serviceTag}
                      onChange={(e) => setNewAsset({...newAsset, serviceTag: e.target.value})}
                      data-testid="input-service-tag"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location</Label>
                    <Select 
                      value={newAsset.locationId} 
                      onValueChange={(value) => setNewAsset({...newAsset, locationId: value})}
                    >
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations?.map(location => (
                          <SelectItem key={location.id} value={location.id.toString()}>
                            {location.outletName}, {location.city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="departmentId">Department</Label>
                    <Select 
                      value={newAsset.departmentId} 
                      onValueChange={(value) => setNewAsset({...newAsset, departmentId: value})}
                    >
                      <SelectTrigger data-testid="select-department">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments?.filter(d => d.isActive).map(dept => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name} ({dept.type})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="physicalLocation">Physical Location</Label>
                    <Input
                      id="physicalLocation"
                      placeholder="Reception, Front Desk, Room 1..."
                      value={newAsset.physicalLocation}
                      onChange={(e) => setNewAsset({...newAsset, physicalLocation: e.target.value})}
                      data-testid="input-physical-location"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floor">Floor</Label>
                    <Input
                      id="floor"
                      placeholder="Ground Floor, 1st Floor..."
                      value={newAsset.floor}
                      onChange={(e) => setNewAsset({...newAsset, floor: e.target.value})}
                      data-testid="input-floor"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownershipType">Ownership Type</Label>
                    <Select 
                      value={newAsset.ownershipType} 
                      onValueChange={(value) => setNewAsset({...newAsset, ownershipType: value})}
                    >
                      <SelectTrigger data-testid="select-ownership-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="company">Company Owned</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="personal">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignmentType">Assignment Type</Label>
                    <Select 
                      value={newAsset.assignmentType} 
                      onValueChange={(value) => setNewAsset({...newAsset, assignmentType: value})}
                    >
                      <SelectTrigger data-testid="select-assignment-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="person">Assigned to Person</SelectItem>
                        <SelectItem value="outlet">Assigned to Outlet</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={newAsset.purchaseDate}
                      onChange={(e) => setNewAsset({...newAsset, purchaseDate: e.target.value})}
                      data-testid="input-purchase-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyExpiry">Warranty Expiry</Label>
                    <Input
                      id="warrantyExpiry"
                      type="date"
                      value={newAsset.warrantyExpiry}
                      onChange={(e) => setNewAsset({...newAsset, warrantyExpiry: e.target.value})}
                      data-testid="input-warranty-expiry"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newAsset.status} 
                      onValueChange={(value) => setNewAsset({...newAsset, status: value})}
                    >
                      <SelectTrigger data-testid="select-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition">Condition</Label>
                    <Select 
                      value={newAsset.condition} 
                      onValueChange={(value) => setNewAsset({...newAsset, condition: value})}
                    >
                      <SelectTrigger data-testid="select-condition">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      resetNewAssetForm()
                      setIsCreateDialogOpen(false)
                    }}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={
                      createAssetMutation.isPending || 
                      !newAsset.assetId?.trim() || 
                      !newAsset.assetType?.trim() || 
                      !newAsset.brand?.trim() || 
                      !newAsset.modelName?.trim()
                    }
                    data-testid="button-submit-create"
                  >
                    {createAssetMutation.isPending ? "Creating..." : "Create Asset"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{assets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {locations?.length || 0} locations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assets?.filter(a => a.status === 'available').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Ready for assignment
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assets?.filter(a => a.status === 'assigned').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assets?.filter(a => a.status === 'maintenance').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Under service
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Assets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Asset ID, Model, Brand, or Service Tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="retired">Retired</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {assetTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations?.map(location => (
                    <SelectItem key={location.id} value={location.id.toString()}>
                      {location.outletName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredAssets.length} of {assets?.length || 0} assets
          </div>
        </CardContent>
      </Card>

      {/* Assets Table */}
      <Card className="glass-card border-0">
        <CardContent className="p-6">
          <div className="rounded-lg border border-border/40 overflow-hidden bg-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-2 border-border/60">
                  <TableHead className="font-semibold text-foreground h-14 w-[280px] px-6">Asset Information</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[140px] px-4">Department</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[140px] px-4">Status</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[200px] px-4">Location</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[180px] px-4">Assignment</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[130px] px-4">Ownership</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[130px] px-4">Service Tag</TableHead>
                  <TableHead className="font-semibold text-foreground h-14 w-[70px] text-center px-2">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => (
                  <TableRow 
                    key={asset.assetId}
                    className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group"
                    data-testid={`row-asset-${asset.assetId}`}
                  >
                    {/* Asset Information - ID, Type, Brand, Model */}
                    <TableCell className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                          {getAssetIcon(asset.assetType)}
                        </div>
                        <div className="min-w-0 flex-1 space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-base text-foreground leading-none" data-testid={`text-asset-id-${asset.assetId}`}>
                              {asset.assetId}
                            </span>
                            <Badge variant="outline" className="text-xs font-medium px-2 py-0.5" data-testid={`badge-type-${asset.assetId}`}>
                              {asset.assetType}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground leading-tight truncate">
                            {asset.brand} {asset.modelName}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Department */}
                    <TableCell className="py-5 px-4">
                      <span className="text-sm font-medium text-foreground leading-relaxed" data-testid={`text-department-${asset.assetId}`}>
                        {asset.departmentId 
                          ? departments?.find(d => d.id === asset.departmentId)?.name || "—"
                          : "—"}
                      </span>
                    </TableCell>

                    {/* Status & Condition */}
                    <TableCell className="py-5 px-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColors[asset.status]}`} />
                          <span className="text-sm font-medium capitalize leading-none" data-testid={`text-status-${asset.assetId}`}>
                            {asset.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${conditionColors[asset.condition]}`} />
                          <span className="text-sm text-muted-foreground capitalize leading-none" data-testid={`text-condition-${asset.assetId}`}>
                            {asset.condition}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell className="py-5 px-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm font-medium text-foreground leading-tight truncate" data-testid={`text-location-${asset.assetId}`}>
                            {getLocationName(asset.locationId)}
                          </span>
                        </div>
                        {(asset.physicalLocation || asset.floor) && (
                          <p className="text-xs text-muted-foreground leading-relaxed pl-6 truncate">
                            {asset.physicalLocation && <span>{asset.physicalLocation}</span>}
                            {asset.physicalLocation && asset.floor && <span className="mx-1.5">•</span>}
                            {asset.floor && <span>{asset.floor}</span>}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Assignment */}
                    <TableCell className="py-5 px-4">
                      <div className="space-y-2">
                        <Badge 
                          variant="outline" 
                          className="text-xs font-medium px-2.5 py-0.5"
                          data-testid={`badge-assignment-${asset.assetId}`}
                        >
                          {asset.assignmentType === 'person' ? 'Person' : 'Outlet'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-muted-foreground leading-tight truncate" data-testid={`text-assigned-${asset.assetId}`}>
                            {asset.assignmentType === 'outlet' 
                              ? getLocationName(asset.locationId) 
                              : getEmployeeName(asset.currentUserId)}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Ownership */}
                    <TableCell className="py-5 px-4">
                      <Badge 
                        variant={asset.ownershipType === 'company' ? 'default' : 'secondary'} 
                        className="text-xs font-medium px-2.5 py-1"
                        data-testid={`badge-ownership-${asset.assetId}`}
                      >
                        {asset.ownershipType === 'company' ? 'Company' : 
                         asset.ownershipType === 'rented' ? 'Rented' : 
                         asset.ownershipType === 'personal' ? 'Personal' : '—'}
                      </Badge>
                    </TableCell>

                    {/* Service Tag */}
                    <TableCell className="py-5 px-4">
                      <span className="text-sm font-mono text-muted-foreground leading-relaxed" data-testid={`text-service-tag-${asset.assetId}`}>
                        {asset.serviceTag || "—"}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-5 px-2 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0 hover:bg-primary/10"
                            data-testid={`button-actions-${asset.assetId}`}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAsset(asset)
                              setIsViewDialogOpen(true)
                            }}
                            data-testid={`menu-view-${asset.assetId}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedAsset(asset)
                              setIsEditDialogOpen(true)
                            }}
                            data-testid={`menu-edit-${asset.assetId}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Asset
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteAssetMutation.mutate(asset.assetId)}
                            className="text-red-600 focus:text-red-600"
                            data-testid={`menu-delete-${asset.assetId}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Asset
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* View Asset Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset Details</DialogTitle>
            <DialogDescription>
              View comprehensive specifications, status history, and assignment records for {selectedAsset?.assetId}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Asset ID</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.assetId}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                    {getAssetIcon(selectedAsset.assetType)}
                    {selectedAsset.assetType}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Brand</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.brand}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Model</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.modelName}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[selectedAsset.status]}`} />
                    <span className="capitalize">{selectedAsset.status}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Condition</Label>
                  <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${conditionColors[selectedAsset.condition]}`} />
                    <span className="capitalize">{selectedAsset.condition}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <div className="text-sm p-2 bg-muted rounded">
                  {getLocationName(selectedAsset.locationId)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <div className="text-sm p-2 bg-muted rounded">
                  {selectedAsset.departmentId 
                    ? departments?.find(d => d.id === selectedAsset.departmentId)?.name || "Unknown department"
                    : "Not assigned"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Physical Location</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.physicalLocation || "Not specified"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Floor</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.floor || "Not specified"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Ownership Type</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedAsset.ownershipType === 'company' ? 'Company Owned' : 
                     selectedAsset.ownershipType === 'rented' ? 'Rented' : 
                     selectedAsset.ownershipType === 'personal' ? 'Personal' : 
                     selectedAsset.ownershipType || 'Not specified'}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assignment Type</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.assignmentType === 'person' ? 'Assigned to Person' : 
                     selectedAsset.assignmentType === 'outlet' ? 'Assigned to Outlet' : 
                     selectedAsset.assignmentType || 'Not specified'}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned To</Label>
                <div className="text-sm p-2 bg-muted rounded">
                  {selectedAsset.assignmentType === 'outlet' 
                    ? `${getLocationName(selectedAsset.locationId)} (Outlet)` 
                    : getEmployeeName(selectedAsset.currentUserId)}
                </div>
              </div>

              {selectedAsset.serviceTag && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Service Tag</Label>
                  <div className="text-sm p-2 bg-muted rounded font-mono">
                    {selectedAsset.serviceTag}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Purchase Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.purchaseDate || "Not specified"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warranty Expiry</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAsset.warrantyExpiry || "Not specified"}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Asset Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
            <DialogDescription>
              Modify specifications, status, warranty details, and location assignment for {selectedAsset?.assetId}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <form onSubmit={handleUpdateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-assetType">Asset Type *</Label>
                  <Select name="assetType" defaultValue={selectedAsset.assetType} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Laptop">Laptop</SelectItem>
                      <SelectItem value="Desktop">Desktop</SelectItem>
                      <SelectItem value="Monitor">Monitor</SelectItem>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Router">Router</SelectItem>
                      <SelectItem value="Switch">Switch</SelectItem>
                      <SelectItem value="Printer">Printer</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-brand">Brand *</Label>
                  <Input
                    id="edit-brand"
                    name="brand"
                    defaultValue={selectedAsset.brand}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-modelName">Model Name *</Label>
                  <Input
                    id="edit-modelName"
                    name="modelName"
                    defaultValue={selectedAsset.modelName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-serviceTag">Service Tag</Label>
                  <Input
                    id="edit-serviceTag"
                    name="serviceTag"
                    defaultValue={selectedAsset.serviceTag || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-locationId">Location</Label>
                  <Select name="locationId" defaultValue={selectedAsset.locationId?.toString() || ""}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map(location => (
                        <SelectItem key={location.id} value={location.id.toString()}>
                          {location.outletName}, {location.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-purchaseDate">Purchase Date</Label>
                  <Input
                    id="edit-purchaseDate"
                    name="purchaseDate"
                    type="date"
                    defaultValue={selectedAsset.purchaseDate || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-warrantyExpiry">Warranty Expiry</Label>
                  <Input
                    id="edit-warrantyExpiry"
                    name="warrantyExpiry"
                    type="date"
                    defaultValue={selectedAsset.warrantyExpiry || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedAsset.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="retired">Retired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-condition">Condition</Label>
                <Select name="condition" defaultValue={selectedAsset.condition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-departmentId">Department</Label>
                <Select name="departmentId" defaultValue={selectedAsset.departmentId?.toString() || ""}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.filter(d => d.isActive).map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name} ({dept.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-physicalLocation">Physical Location</Label>
                  <Input
                    id="edit-physicalLocation"
                    name="physicalLocation"
                    placeholder="Reception, Front Desk, Room 1..."
                    defaultValue={selectedAsset.physicalLocation || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-floor">Floor</Label>
                  <Input
                    id="edit-floor"
                    name="floor"
                    placeholder="Ground Floor, 1st Floor..."
                    defaultValue={selectedAsset.floor || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-ownershipType">Ownership Type</Label>
                  <Select name="ownershipType" defaultValue={selectedAsset.ownershipType || "company"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="company">Company Owned</SelectItem>
                      <SelectItem value="rented">Rented</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-assignmentType">Assignment Type</Label>
                  <Select name="assignmentType" defaultValue={selectedAsset.assignmentType || "person"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="person">Assigned to Person</SelectItem>
                      <SelectItem value="outlet">Assigned to Outlet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAssetMutation.isPending}>
                  {updateAssetMutation.isPending ? "Updating..." : "Update Asset"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}