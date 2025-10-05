import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Wrench, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Calendar,
  DollarSign,
  User,
  Package,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Laptop,
  MapPin,
  FileText,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  SlidersHorizontal,
  Filter
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
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ExcelExporter, ExcelImporter } from "@/lib/excel"

interface Maintenance {
  id: number
  assetId: string
  maintenanceType: "preventive" | "corrective"
  description: string
  scheduledDate: string
  completedDate: string | null
  cost: number | null
  technicianName: string | null
  partsReplaced: string | null
  createdAt: string
  updatedAt: string
}

interface Asset {
  assetId: string
  modelName: string
  brand: string
  assetType: string
  status: "available" | "assigned" | "maintenance" | "retired"
  locationId: number | null
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

// Status color mapping
const statusColors: Record<string, string> = {
  scheduled: "bg-blue-400",
  in_progress: "bg-yellow-400", 
  completed: "bg-green-400",
  overdue: "bg-red-400"
}

// Maintenance type color mapping
const typeColors: Record<string, string> = {
  preventive: "bg-blue-400",
  corrective: "bg-orange-500"
}

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  const [expandedMaintenanceId, setExpandedMaintenanceId] = useState<number | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: maintenance, isLoading: maintenanceLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  })

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Helper function to get maintenance status
  const getMaintenanceStatus = (maintenance: Maintenance) => {
    if (maintenance.completedDate) return "completed"
    
    const scheduledDate = new Date(maintenance.scheduledDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (scheduledDate < today) return "overdue"
    if (scheduledDate.toDateString() === today.toDateString()) return "in_progress"
    return "scheduled"
  }

  // Get unique asset types for filter
  const assetTypes = Array.from(new Set(assets?.map(a => a.assetType) || []))

  // Filter maintenance records
  const filteredMaintenance = maintenance?.filter(record => {
    const asset = assets?.find(a => a.assetId === record.assetId)
    const location = locations?.find(l => l.id === asset?.locationId)
    const status = getMaintenanceStatus(record)
    
    const matchesSearch = 
      record.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset?.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.technicianName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || status === statusFilter
    const matchesType = typeFilter === "all" || record.maintenanceType === typeFilter
    const matchesLocation = locationFilter === "all" || asset?.locationId?.toString() === locationFilter
    const matchesAssetType = assetTypeFilter === "all" || asset?.assetType === assetTypeFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation && matchesAssetType
  }) || []

  // Count active filters
  const activeFiltersCount = [
    typeFilter !== "all",
    locationFilter !== "all",
    assetTypeFilter !== "all"
  ].filter(Boolean).length

  // Create maintenance mutation
  const createMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceData: any) => {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(maintenanceData),
      })
      if (!response.ok) throw new Error('Failed to create maintenance record')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] })
      toast({ title: "Success", description: "Maintenance scheduled successfully" })
      setIsCreateDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to schedule maintenance", variant: "destructive" })
    }
  })

  // Update maintenance mutation  
  const updateMaintenanceMutation = useMutation({
    mutationFn: async ({ maintenanceId, data }: { maintenanceId: number, data: any }) => {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update maintenance record')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] })
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Maintenance updated successfully" })
      setIsEditDialogOpen(false)
      setIsCompleteDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update maintenance", variant: "destructive" })
    }
  })

  // Delete maintenance mutation
  const deleteMaintenanceMutation = useMutation({
    mutationFn: async (maintenanceId: number) => {
      const response = await fetch(`/api/maintenance/${maintenanceId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete maintenance record')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/maintenance'] })
      toast({ title: "Success", description: "Maintenance record deleted successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete maintenance record", variant: "destructive" })
    }
  })

  // Excel Export Handler
  const handleExport = () => {
    if (!maintenance || !assets || !locations) {
      toast({ title: "Error", description: "Data not loaded yet", variant: "destructive" })
      return
    }
    
    try {
      ExcelExporter.exportMaintenance(maintenance, assets, locations)
      toast({ title: "Success", description: "Maintenance records exported successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to export maintenance records", variant: "destructive" })
    }
  }

  // Excel Import Handler
  const handleImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" })
      return
    }

    setIsImporting(true)

    try {
      const data = await ExcelImporter.parseExcelFile(importFile)
      const { valid, errors } = ExcelImporter.validateMaintenanceData(data)

      if (errors.length > 0) {
        toast({ 
          title: "Validation Errors", 
          description: `${errors.length} errors found. First error: ${errors[0]}`,
          variant: "destructive" 
        })
        setIsImporting(false)
        return
      }

      for (const maintenanceData of valid) {
        await createMaintenanceMutation.mutateAsync(maintenanceData)
      }

      toast({ 
        title: "Success", 
        description: `Successfully imported ${valid.length} maintenance records` 
      })
      setIsImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to import maintenance records", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Helper functions
  const getAssetInfo = (assetId: string) => {
    return assets?.find(asset => asset.assetId === assetId)
  }

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "No location"
    const location = locations?.find(loc => loc.id === locationId)
    return location ? `${location.outletName}, ${location.city}` : "Unknown"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "Not specified"
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount)
  }

  const handleCreateMaintenance = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    
    const maintenanceData = {
      assetId: formData.get('assetId'),
      maintenanceType: formData.get('maintenanceType'),
      description: formData.get('description'),
      scheduledDate: formData.get('scheduledDate'),
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      technicianName: formData.get('technicianName') || null,
      partsReplaced: formData.get('partsReplaced') || null,
    }

    createMaintenanceMutation.mutate(maintenanceData)
  }

  const handleUpdateMaintenance = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedMaintenance) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const maintenanceData = {
      description: formData.get('description'),
      scheduledDate: formData.get('scheduledDate'),
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : null,
      technicianName: formData.get('technicianName') || null,
      partsReplaced: formData.get('partsReplaced') || null,
    }

    updateMaintenanceMutation.mutate({ maintenanceId: selectedMaintenance.id, data: maintenanceData })
  }

  const handleCompleteMaintenance = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedMaintenance) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const maintenanceData = {
      completedDate: new Date().toISOString(),
      cost: formData.get('cost') ? parseFloat(formData.get('cost') as string) : selectedMaintenance.cost,
      technicianName: formData.get('technicianName') || selectedMaintenance.technicianName,
      partsReplaced: formData.get('partsReplaced') || selectedMaintenance.partsReplaced,
    }

    updateMaintenanceMutation.mutate({ maintenanceId: selectedMaintenance.id, data: maintenanceData })
  }

  if (maintenanceLoading) {
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

  const totalCost = maintenance?.reduce((sum, record) => sum + (record.cost || 0), 0) || 0
  const pendingMaintenance = maintenance?.filter(record => !record.completedDate).length || 0
  const overdueMaintenance = maintenance?.filter(record => getMaintenanceStatus(record) === "overdue").length || 0
  const completedMaintenance = maintenance?.filter(record => record.completedDate).length || 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Maintenance</h1>
          <p className="text-white/70">
            Schedule and track asset maintenance across all locations
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-import-excel">
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Maintenance Records from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file to import maintenance records. Download the template for the correct format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Excel File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    data-testid="input-import-file"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => ExcelImporter.downloadMaintenanceTemplate()}
                  data-testid="button-download-template"
                >
                  Download Template
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} data-testid="button-cancel-import">
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importFile || isImporting} data-testid="button-confirm-import">
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Schedule Maintenance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule Maintenance</DialogTitle>
                <DialogDescription>
                  Plan preventive or corrective service with scheduling, cost tracking, and technician assignment
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateMaintenance} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetId">Asset *</Label>
                    <Select name="assetId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {assets?.map(asset => (
                          <SelectItem key={asset.assetId} value={asset.assetId}>
                            {asset.assetId} - {asset.brand} {asset.modelName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenanceType">Type *</Label>
                    <Select name="maintenanceType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="preventive">Preventive</SelectItem>
                        <SelectItem value="corrective">Corrective</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the maintenance work to be performed"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="scheduledDate">Scheduled Date *</Label>
                    <Input
                      id="scheduledDate"
                      name="scheduledDate"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Estimated Cost</Label>
                    <Input
                      id="cost"
                      name="cost"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="technicianName">Technician Name</Label>
                    <Input
                      id="technicianName"
                      name="technicianName"
                      placeholder="John Doe, ABC Services"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partsReplaced">Expected Parts</Label>
                    <Input
                      id="partsReplaced"
                      name="partsReplaced"
                      placeholder="Hard drive, RAM, etc."
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMaintenanceMutation.isPending}>
                    {createMaintenanceMutation.isPending ? "Scheduling..." : "Schedule Maintenance"}
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
            <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{maintenance?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance records
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Not yet completed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{overdueMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search by Asset ID, Brand, Description, Technician..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-12 backdrop-blur-sm border-border/40 focus:border-primary/50 transition-all"
                data-testid="input-search-maintenance"
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
              <SelectTrigger className="w-[140px] backdrop-blur-sm border-border/40" data-testid="select-filter-status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>

            {(typeFilter !== "all" || locationFilter !== "all" || assetTypeFilter !== "all") && (
              <Button
                onClick={() => {
                  setTypeFilter("all")
                  setLocationFilter("all")
                  setAssetTypeFilter("all")
                }}
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
                  Maintenance Type
                </label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-type">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="preventive">Preventive</SelectItem>
                    <SelectItem value="corrective">Corrective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Location
                </label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-location">
                    <SelectValue placeholder="All Locations" />
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

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  Asset Type
                </label>
                <Select value={assetTypeFilter} onValueChange={setAssetTypeFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-asset-type">
                    <SelectValue placeholder="All Asset Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Asset Types</SelectItem>
                    {assetTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredMaintenance.length} of {maintenance?.length || 0} maintenance records
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0 table-container-stable">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Scheduled Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Technician</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenance.flatMap((record) => {
                const asset = getAssetInfo(record.assetId)
                const status = getMaintenanceStatus(record)
                const isExpanded = expandedMaintenanceId === record.id
                const rows = [
                  <TableRow 
                    key={`main-${record.id}`}
                    onClick={() => setExpandedMaintenanceId(isExpanded ? null : record.id)}
                    className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                    data-testid={`row-maintenance-${record.id}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-muted/50 rounded-full group-hover:bg-muted transition-colors">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                        <Laptop className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{record.assetId}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset?.brand} {asset?.modelName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${typeColors[record.maintenanceType]}`}
                        />
                        <span className="capitalize">{record.maintenanceType}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="text-sm truncate">{record.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {getLocationName(asset?.locationId || null)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(record.scheduledDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${statusColors[status]}`}
                        />
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        {record.completedDate && (
                          <div className="text-xs text-muted-foreground">
                            {formatDate(record.completedDate)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatCurrency(record.cost)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {record.technicianName || "Not assigned"}
                      </div>
                    </TableCell>
                  </TableRow>
                ]

                if (isExpanded) {
                  rows.push(
                    <TableRow key={`expanded-${record.id}`} className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={7} className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Service Details</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Maintenance Type</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${typeColors[record.maintenanceType]}`} />
                                  <span className="capitalize">{record.maintenanceType}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                                  <span className="capitalize">{status.replace('_', ' ')}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Description</div>
                                <div className="text-sm mt-1 p-2 bg-muted/30 rounded">
                                  {record.description}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Timeline & Technician</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Scheduled Date</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(record.scheduledDate)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Completed Date</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {record.completedDate ? formatDate(record.completedDate) : 'Not completed'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Technician</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {record.technicianName || 'Not assigned'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Asset & Cost</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Asset ID</div>
                                <div className="text-sm mt-1 font-mono">{record.assetId}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {asset?.brand} {asset?.modelName} ({asset?.assetType})
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Location</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {getLocationName(asset?.locationId || null)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Maintenance Cost</div>
                                <div className="text-sm mt-1 flex items-center gap-2 font-semibold">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(record.cost)}
                                </div>
                              </div>
                              {record.partsReplaced && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Parts Replaced</div>
                                  <div className="text-sm mt-1 p-2 bg-muted/30 rounded">
                                    {record.partsReplaced}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMaintenance(record)
                              setIsViewDialogOpen(true)
                            }}
                            data-testid={`button-view-details-${record.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedMaintenance(record)
                              setIsEditDialogOpen(true)
                            }}
                            data-testid={`button-edit-maintenance-${record.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Maintenance
                          </Button>
                          {!record.completedDate && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedMaintenance(record)
                                setIsCompleteDialogOpen(true)
                              }}
                              data-testid={`button-complete-${record.id}`}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete this maintenance record? This action cannot be undone.`)) {
                                deleteMaintenanceMutation.mutate(record.id)
                              }
                            }}
                            data-testid={`button-delete-maintenance-${record.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Record
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                }

                return rows
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Maintenance Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Maintenance Details</DialogTitle>
            <DialogDescription>
              View service history, cost breakdowns, parts inventory, and technician performance records
            </DialogDescription>
          </DialogHeader>
          {selectedMaintenance && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Asset</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedMaintenance.assetId}
                    <div className="text-xs text-muted-foreground">
                      {getAssetInfo(selectedMaintenance.assetId)?.brand} {getAssetInfo(selectedMaintenance.assetId)?.modelName}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedMaintenance.maintenanceType}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <div className="text-sm p-2 bg-muted rounded">
                  {selectedMaintenance.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Scheduled Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatDate(selectedMaintenance.scheduledDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Completed Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedMaintenance.completedDate ? formatDate(selectedMaintenance.completedDate) : "Not completed"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cost</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatCurrency(selectedMaintenance.cost)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Technician</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedMaintenance.technicianName || "Not assigned"}
                  </div>
                </div>
              </div>

              {selectedMaintenance.partsReplaced && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Parts Replaced</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedMaintenance.partsReplaced}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Maintenance Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Maintenance</DialogTitle>
            <DialogDescription>
              Modify service details, scheduling, cost estimates, and resource allocation for {selectedMaintenance?.assetId}
            </DialogDescription>
          </DialogHeader>
          {selectedMaintenance && (
            <form onSubmit={handleUpdateMaintenance} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  defaultValue={selectedMaintenance.description}
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-scheduledDate">Scheduled Date *</Label>
                  <Input
                    id="edit-scheduledDate"
                    name="scheduledDate"
                    type="date"
                    defaultValue={selectedMaintenance.scheduledDate}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-cost">Cost</Label>
                  <Input
                    id="edit-cost"
                    name="cost"
                    type="number"
                    step="0.01"
                    defaultValue={selectedMaintenance.cost?.toString() || ""}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-technicianName">Technician Name</Label>
                  <Input
                    id="edit-technicianName"
                    name="technicianName"
                    defaultValue={selectedMaintenance.technicianName || ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-partsReplaced">Parts Replaced</Label>
                  <Input
                    id="edit-partsReplaced"
                    name="partsReplaced"
                    defaultValue={selectedMaintenance.partsReplaced || ""}
                  />
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
                <Button type="submit" disabled={updateMaintenanceMutation.isPending}>
                  {updateMaintenanceMutation.isPending ? "Updating..." : "Update Maintenance"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Complete Maintenance Dialog */}
      <Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Complete Maintenance</DialogTitle>
            <DialogDescription>
              Finalize service record with completion date, final costs, and parts replacement documentation for {selectedMaintenance?.assetId}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCompleteMaintenance} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complete-cost">Final Cost</Label>
                <Input
                  id="complete-cost"
                  name="cost"
                  type="number"
                  step="0.01"
                  defaultValue={selectedMaintenance?.cost?.toString() || ""}
                  placeholder="Final maintenance cost"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complete-technicianName">Technician Name</Label>
                <Input
                  id="complete-technicianName"
                  name="technicianName"
                  defaultValue={selectedMaintenance?.technicianName || ""}
                  placeholder="Who performed the work"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complete-partsReplaced">Parts Replaced</Label>
              <Textarea
                id="complete-partsReplaced"
                name="partsReplaced"
                defaultValue={selectedMaintenance?.partsReplaced || ""}
                placeholder="List all parts that were replaced"
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCompleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateMaintenanceMutation.isPending}>
                {updateMaintenanceMutation.isPending ? "Completing..." : "Mark Complete"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}