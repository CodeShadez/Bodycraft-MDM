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
  Settings
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
  scheduled: "bg-blue-500",
  in_progress: "bg-yellow-500", 
  completed: "bg-green-500",
  overdue: "bg-red-500"
}

// Maintenance type color mapping
const typeColors: Record<string, string> = {
  preventive: "bg-blue-500",
  corrective: "bg-orange-500"
}

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedMaintenance, setSelectedMaintenance] = useState<Maintenance | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  
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
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation
  }) || []

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
      <div className="p-6 space-y-6">
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">
            Schedule and track asset maintenance across all locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button variant="outline" className="gap-2">
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
                  Create a new maintenance record for an asset
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenance?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance records
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Not yet completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueMaintenance}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
            <p className="text-xs text-muted-foreground">
              All maintenance costs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Maintenance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Asset ID, Brand, Description, Technician..."
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
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="preventive">Preventive</SelectItem>
                  <SelectItem value="corrective">Corrective</SelectItem>
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
            Showing {filteredMaintenance.length} of {maintenance?.length || 0} maintenance records
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Table */}
      <Card>
        <CardContent className="p-0">
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaintenance.map((record) => {
                const asset = getAssetInfo(record.assetId)
                const status = getMaintenanceStatus(record)
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
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
                          {getLocationName(asset?.locationId)}
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
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMaintenance(record)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedMaintenance(record)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Maintenance
                          </DropdownMenuItem>
                          {!record.completedDate && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedMaintenance(record)
                                setIsCompleteDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => deleteMaintenanceMutation.mutate(record.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
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
              Complete maintenance record information
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
              Update maintenance information for {selectedMaintenance?.assetId}
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
              Mark maintenance as completed for {selectedMaintenance?.assetId}
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