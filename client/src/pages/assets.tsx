import { useState, Fragment, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "wouter"
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
  Computer,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Building2,
  FileText
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
  const [location] = useLocation()
  
  // Get URL search params to check for filters
  const urlParams = new URLSearchParams(window.location.search)
  const urlType = urlParams.get('type')
  const urlStatus = urlParams.get('status')
  
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>(urlStatus || "all")
  const [typeFilter, setTypeFilter] = useState<string>(urlType || "all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [conditionFilter, setConditionFilter] = useState<string>("all")
  const [ownershipFilter, setOwnershipFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  
  // Update filters when URL changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const newType = params.get('type')
    const newStatus = params.get('status')
    
    console.log("URL changed - applying filters:", { type: newType, status: newStatus })
    
    if (newStatus) {
      setStatusFilter(newStatus)
    }
    if (newType) {
      setTypeFilter(newType)
    }
  }, [location])
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [expandedAssetId, setExpandedAssetId] = useState<string | null>(null)
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
    const matchesCondition = conditionFilter === "all" || asset.condition === conditionFilter
    const matchesOwnership = ownershipFilter === "all" || asset.ownershipType === ownershipFilter
    const matchesDepartment = departmentFilter === "all" || asset.departmentId?.toString() === departmentFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation && matchesCondition && matchesOwnership && matchesDepartment
  }) || []
  
  // Count active filters
  const activeFiltersCount = [
    statusFilter !== "all" ? 1 : 0,
    typeFilter !== "all" ? 1 : 0,
    locationFilter !== "all" ? 1 : 0,
    conditionFilter !== "all" ? 1 : 0,
    ownershipFilter !== "all" ? 1 : 0,
    departmentFilter !== "all" ? 1 : 0,
    searchTerm !== "" ? 1 : 0
  ].reduce((sum, val) => sum + val, 0)
  
  // Reset all filters
  const resetAllFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setTypeFilter("all")
    setLocationFilter("all")
    setConditionFilter("all")
    setOwnershipFilter("all")
    setDepartmentFilter("all")
  }

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

      {/* Advanced Search & Filters */}
      <Card className="glass-card border-0">
        <CardContent className="p-6 space-y-6">
          {/* Search Bar with Clear */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/60" />
              <Input
                placeholder="Search by Asset ID, Model, Brand, Service Tag, or Location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-12 h-12 text-base bg-background/50 backdrop-blur-sm border-border/40 focus:border-primary/50 transition-all"
                data-testid="input-search-assets"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-clear-search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <Button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              variant="outline"
              className="h-12 gap-2 min-w-[180px] backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all"
              data-testid="button-toggle-advanced-filters"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Advanced Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1 px-2 py-0.5 text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all" data-testid="select-filter-status">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="available">✓ Available</SelectItem>
                <SelectItem value="assigned">👤 Assigned</SelectItem>
                <SelectItem value="maintenance">🔧 Maintenance</SelectItem>
                <SelectItem value="retired">❌ Retired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[160px] backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all" data-testid="select-filter-type">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Type" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {assetTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-[200px] backdrop-blur-sm border-border/40 hover:border-primary/50 transition-all" data-testid="select-filter-location">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Location" />
                </div>
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

            {activeFiltersCount > 0 && (
              <Button
                onClick={resetAllFilters}
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-foreground backdrop-blur-sm"
                data-testid="button-reset-filters"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {/* Advanced Filters Panel */}
          {showAdvancedFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/10 backdrop-blur-sm border border-border/40 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Condition
                </label>
                <Select value={conditionFilter} onValueChange={setConditionFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-condition">
                    <SelectValue placeholder="All Conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="excellent">⭐ Excellent</SelectItem>
                    <SelectItem value="good">👍 Good</SelectItem>
                    <SelectItem value="fair">⚠️ Fair</SelectItem>
                    <SelectItem value="poor">❗ Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Ownership
                </label>
                <Select value={ownershipFilter} onValueChange={setOwnershipFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-ownership">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ownership</SelectItem>
                    <SelectItem value="company">🏢 Company Owned</SelectItem>
                    <SelectItem value="rented">📋 Rented</SelectItem>
                    <SelectItem value="personal">👤 Personal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Department
                </label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-department">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments?.map(dept => (
                      <SelectItem key={dept.id} value={dept.id.toString()}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Results Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-border/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span className="font-medium text-foreground">
                {filteredAssets.length}
              </span>
              <span>of</span>
              <span className="font-medium text-foreground">
                {assets?.length || 0}
              </span>
              <span>assets found</span>
            </div>
            
            {activeFiltersCount > 0 && (
              <div className="flex gap-1">
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setStatusFilter("all")} />
                  </Badge>
                )}
                {typeFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Type: {typeFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setTypeFilter("all")} />
                  </Badge>
                )}
                {locationFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Location: {locations?.find(l => l.id.toString() === locationFilter)?.outletName}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setLocationFilter("all")} />
                  </Badge>
                )}
              </div>
            )}
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
                  <TableHead className="font-semibold text-foreground h-12 px-6">Type</TableHead>
                  <TableHead className="font-semibold text-foreground h-12 px-6">Asset Details</TableHead>
                  <TableHead className="font-semibold text-foreground h-12 px-4">Status</TableHead>
                  <TableHead className="font-semibold text-foreground h-12 px-4">Location</TableHead>
                  <TableHead className="font-semibold text-foreground h-12 px-4">Assigned To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssets.map((asset) => {
                  const isExpanded = expandedAssetId === asset.assetId
                  return (
                    <Fragment key={asset.assetId}>
                      <TableRow 
                        onClick={() => setExpandedAssetId(isExpanded ? null : asset.assetId)}
                        className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                        data-testid={`row-asset-${asset.assetId}`}
                      >
                        {/* Asset Type */}
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0 group-hover:bg-primary/15 transition-colors">
                              {getAssetIcon(asset.assetType)}
                            </div>
                            <span className="text-sm font-medium" data-testid={`badge-type-${asset.assetId}`}>
                              {asset.assetType}
                            </span>
                          </div>
                        </TableCell>

                        {/* Asset Details */}
                        <TableCell className="py-4 px-6">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm text-foreground mb-1" data-testid={`text-asset-id-${asset.assetId}`}>
                                {asset.assetId}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {asset.brand} {asset.modelName}
                              </p>
                            </div>
                            <div className="ml-3 text-muted-foreground flex-shrink-0">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${statusColors[asset.status]}`} />
                            <span className="text-sm font-medium capitalize" data-testid={`text-status-${asset.assetId}`}>
                              {asset.status}
                            </span>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm font-medium truncate" data-testid={`text-location-${asset.assetId}`}>
                              {getLocationName(asset.locationId)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Assigned To */}
                        <TableCell className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm truncate" data-testid={`text-assigned-${asset.assetId}`}>
                              {asset.assignmentType === 'outlet' 
                                ? getLocationName(asset.locationId) 
                                : getEmployeeName(asset.currentUserId)}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <TableRow className="bg-muted/10 border-b-2 border-border/50">
                          <TableCell colSpan={5} className="p-0">
                            <div className="p-8 space-y-6">
                              {/* Complete Details Header */}
                              <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                  {getAssetIcon(asset.assetType)}
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-foreground">{asset.assetId}</h3>
                                  <p className="text-sm text-muted-foreground">{asset.brand} {asset.modelName}</p>
                                </div>
                              </div>

                              {/* Complete Asset Information Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {/* Column 1 - Basic Info */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-foreground mb-3">Basic Information</h4>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Asset Type</Label>
                                    <p className="text-sm font-medium mt-1">{asset.assetType}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Brand</Label>
                                    <p className="text-sm font-medium mt-1">{asset.brand}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Model</Label>
                                    <p className="text-sm font-medium mt-1">{asset.modelName}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Service Tag</Label>
                                    <p className="text-sm font-mono font-medium mt-1">{asset.serviceTag || "—"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Ownership Type</Label>
                                    <p className="text-sm font-medium mt-1">
                                      {asset.ownershipType === 'company' ? 'Company Owned' : 
                                       asset.ownershipType === 'rented' ? 'Rented' : 
                                       asset.ownershipType === 'personal' ? 'Personal' : '—'}
                                    </p>
                                  </div>
                                </div>

                                {/* Column 2 - Status & Location */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-foreground mb-3">Status & Location</h4>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Status</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${statusColors[asset.status]}`} />
                                      <span className="text-sm font-medium capitalize">{asset.status}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Condition</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <div className={`w-2 h-2 rounded-full ${conditionColors[asset.condition]}`} />
                                      <span className="text-sm font-medium capitalize">{asset.condition}</span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Outlet Location</Label>
                                    <p className="text-sm font-medium mt-1">{getLocationName(asset.locationId)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Physical Location</Label>
                                    <p className="text-sm font-medium mt-1">{asset.physicalLocation || "—"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Floor</Label>
                                    <p className="text-sm font-medium mt-1">{asset.floor || "—"}</p>
                                  </div>
                                </div>

                                {/* Column 3 - Assignment & Dates */}
                                <div className="space-y-4">
                                  <h4 className="text-sm font-semibold text-foreground mb-3">Assignment & Timeline</h4>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Department</Label>
                                    <p className="text-sm font-medium mt-1">
                                      {asset.departmentId 
                                        ? departments?.find(d => d.id === asset.departmentId)?.name || "—"
                                        : "—"}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Assignment Type</Label>
                                    <p className="text-sm font-medium mt-1">
                                      {asset.assignmentType === 'person' ? 'Assigned to Person' : 'Assigned to Outlet'}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Assigned To</Label>
                                    <p className="text-sm font-medium mt-1">
                                      {asset.assignmentType === 'outlet' 
                                        ? getLocationName(asset.locationId) 
                                        : getEmployeeName(asset.currentUserId)}
                                    </p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Purchase Date</Label>
                                    <p className="text-sm font-medium mt-1">{asset.purchaseDate || "—"}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Warranty Expiry</Label>
                                    <p className="text-sm font-medium mt-1">{asset.warrantyExpiry || "—"}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex items-center gap-3 pt-6 border-t border-border/50">
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedAsset(asset)
                                    setIsEditDialogOpen(true)
                                  }}
                                  variant="default"
                                  size="sm"
                                  className="gap-2"
                                  data-testid={`button-edit-${asset.assetId}`}
                                >
                                  <Edit className="h-4 w-4" />
                                  Edit Asset
                                </Button>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Are you sure you want to delete asset ${asset.assetId}?`)) {
                                      deleteAssetMutation.mutate(asset.assetId)
                                    }
                                  }}
                                  variant="destructive"
                                  size="sm"
                                  className="gap-2"
                                  data-testid={`button-delete-${asset.assetId}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  Delete Asset
                                </Button>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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