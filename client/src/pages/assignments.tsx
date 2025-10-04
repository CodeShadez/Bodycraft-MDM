import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Calendar,
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  User,
  Laptop,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Clock,
  Undo,
  Package,
  MapPin,
  AlertTriangle,
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
import { useUser } from "@/hooks/use-user"

interface Assignment {
  assetId: string
  employeeId: number
  assignedDate: string
  returnedDate: string | null
  assignmentReason: string
  returnReason: string | null
  conditionOnAssignment: "excellent" | "good" | "fair" | "poor"
  conditionOnReturn: "excellent" | "good" | "fair" | "poor" | null
  backupDetails: string | null
  createdBy: number
  createdAt: string
  updatedAt: string
}

interface Asset {
  assetId: string
  modelName: string
  brand: string
  assetType: string
  status: "available" | "assigned" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  locationId: number | null
  currentUserId: number | null
}

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  department: string
  designation: string
  status: "active" | "inactive" | "on_leave"
  locationId: number | null
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

export default function AssignmentsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [assetTypeFilter, setAssetTypeFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { data: currentUser } = useUser()

  // Fetch data
  const { data: assignments, isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  })

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Get unique asset types and departments for filters
  const assetTypes = Array.from(new Set(assets?.map(a => a.assetType) || []))
  const departments = Array.from(new Set(employees?.map(e => e.department) || []))

  // Filter assignments
  const filteredAssignments = assignments?.filter(assignment => {
    const asset = assets?.find(a => a.assetId === assignment.assetId)
    const employee = employees?.find(e => e.id === assignment.employeeId)
    
    const matchesSearch = 
      assignment.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee?.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset?.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset?.modelName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const isActive = !assignment.returnedDate
    const isReturned = assignment.returnedDate !== null
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && isActive) ||
      (statusFilter === "returned" && isReturned)
      
    const matchesLocation = locationFilter === "all" || employee?.locationId?.toString() === locationFilter
    const matchesAssetType = assetTypeFilter === "all" || asset?.assetType === assetTypeFilter
    const matchesDepartment = departmentFilter === "all" || employee?.department === departmentFilter
    
    return matchesSearch && matchesStatus && matchesLocation && matchesAssetType && matchesDepartment
  }) || []

  // Count active filters
  const activeFiltersCount = [
    locationFilter !== "all",
    assetTypeFilter !== "all",
    departmentFilter !== "all"
  ].filter(Boolean).length

  // Available assets for assignment (not currently assigned)
  const availableAssets = assets?.filter(asset => 
    asset.status === "available" && 
    !assignments?.some(assignment => 
      assignment.assetId === asset.assetId && !assignment.returnedDate
    )
  ) || []

  // Active employees for assignment
  const activeEmployees = employees?.filter(emp => emp.status === "active") || []

  // Assign asset mutation
  const assignAssetMutation = useMutation({
    mutationFn: async (assignmentData: any) => {
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignmentData),
      })
      if (!response.ok) throw new Error('Failed to assign asset')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] })
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset assigned successfully" })
      setIsAssignDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to assign asset", variant: "destructive" })
    }
  })

  // Return asset mutation
  const returnAssetMutation = useMutation({
    mutationFn: async (returnData: any) => {
      const response = await fetch(`/api/assignments/${returnData.assetId}/${returnData.employeeId}/return`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      })
      if (!response.ok) throw new Error('Failed to return asset')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] })
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset returned successfully" })
      setIsReturnDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to return asset", variant: "destructive" })
    }
  })

  // Delete assignment mutation
  const deleteAssignmentMutation = useMutation({
    mutationFn: async (data: { assetId: string, employeeId: number }) => {
      const response = await fetch(`/api/assignments/${data.assetId}/${data.employeeId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete assignment')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assignments"] })
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] })
      toast({ title: "Success", description: "Assignment deleted successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete assignment", variant: "destructive" })
    }
  })

  // Transfer asset mutation (return + new assignment in one operation)
  const transferAssetMutation = useMutation({
    mutationFn: async (transferData: any) => {
      const response = await fetch(`/api/assignments/${transferData.assetId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      })
      if (!response.ok) throw new Error('Failed to transfer asset')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assignments'] })
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Asset transferred successfully" })
      setIsTransferDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to transfer asset", variant: "destructive" })
    }
  })

  // Helper functions
  const getAssetInfo = (assetId: string) => {
    return assets?.find(asset => asset.assetId === assetId)
  }

  const getEmployeeInfo = (employeeId: number) => {
    return employees?.find(employee => employee.id === employeeId)
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

  const handleAssignAsset = (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!currentUser?.user?.id) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please refresh the page and try again.",
        variant: "destructive",
      })
      return
    }
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const assignmentData = {
      assetId: formData.get('assetId'),
      employeeId: parseInt(formData.get('employeeId') as string),
      assignmentReason: formData.get('assignmentReason'),
      conditionOnAssignment: formData.get('conditionOnAssignment'),
      backupDetails: formData.get('backupDetails') || null,
      createdBy: currentUser.user.id,
    }

    assignAssetMutation.mutate(assignmentData)
  }

  const handleReturnAsset = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAssignment) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const returnData = {
      assetId: selectedAssignment.assetId,
      employeeId: selectedAssignment.employeeId,
      returnReason: formData.get('returnReason'),
      conditionOnReturn: formData.get('conditionOnReturn'),
    }

    returnAssetMutation.mutate(returnData)
  }

  const handleTransferAsset = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedAssignment) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const transferData = {
      assetId: selectedAssignment.assetId,
      fromEmployeeId: selectedAssignment.employeeId,
      toEmployeeId: parseInt(formData.get('toEmployeeId') as string),
      returnReason: formData.get('returnReason'),
      conditionOnReturn: formData.get('conditionOnReturn'),
      newAssignmentReason: formData.get('newAssignmentReason'),
      conditionOnNewAssignment: formData.get('conditionOnNewAssignment'),
    }

    transferAssetMutation.mutate(transferData)
  }

  if (assignmentsLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Assignments</h1>
          <p className="text-white/70">
            Manage asset assignments with complete history preservation
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
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Assign Asset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Assign Asset to Employee</DialogTitle>
                <DialogDescription>
                  Allocate enterprise resources to personnel with full accountability, condition tracking, and audit trail
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAssignAsset} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="assetId">Asset *</Label>
                    <Select name="assetId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableAssets.map(asset => (
                          <SelectItem key={asset.assetId} value={asset.assetId}>
                            {asset.assetId} - {asset.brand} {asset.modelName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="employeeId">Employee *</Label>
                    <Select name="employeeId" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeEmployees.map(employee => (
                          <SelectItem key={employee.id} value={employee.id.toString()}>
                            {employee.firstName} {employee.lastName} ({employee.employeeCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignmentReason">Assignment Reason *</Label>
                  <Select name="assignmentReason" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="New Employee">New Employee</SelectItem>
                      <SelectItem value="Replacement">Replacement</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                      <SelectItem value="Temporary">Temporary</SelectItem>
                      <SelectItem value="Project Requirement">Project Requirement</SelectItem>
                      <SelectItem value="Department Transfer">Department Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="conditionOnAssignment">Condition on Assignment *</Label>
                  <Select name="conditionOnAssignment" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
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
                  <Label htmlFor="backupDetails">Backup Details</Label>
                  <Textarea
                    id="backupDetails"
                    name="backupDetails"
                    placeholder="Previous user data backup information (if applicable)"
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={assignAssetMutation.isPending}>
                    {assignAssetMutation.isPending ? "Assigning..." : "Assign Asset"}
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
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Complete history preserved
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assignments?.filter(a => !a.returnedDate).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently assigned
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned Assets</CardTitle>
            <Undo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assignments?.filter(a => a.returnedDate).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully returned
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Assignment</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{availableAssets.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to assign
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search by Asset ID, Employee Name, Employee Code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-12 backdrop-blur-sm border-border/40 focus:border-primary/50 transition-all"
                data-testid="input-search-assignments"
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
                <SelectItem value="all">All Assignments</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>

            {(locationFilter !== "all" || assetTypeFilter !== "all" || departmentFilter !== "all") && (
              <Button
                onClick={() => {
                  setLocationFilter("all")
                  setAssetTypeFilter("all")
                  setDepartmentFilter("all")
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
                  Department
                </label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-department">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredAssignments.length} of {assignments?.length || 0} assignments
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0 table-container-stable">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Assigned Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.flatMap((assignment, index) => {
                const asset = getAssetInfo(assignment.assetId)
                const employee = getEmployeeInfo(assignment.employeeId)
                const isActive = !assignment.returnedDate
                const assignmentId = `${assignment.assetId}-${assignment.employeeId}-${assignment.assignedDate}`
                const isExpanded = expandedAssignmentId === assignmentId
                const rows = [
                  <TableRow 
                    key={`main-${assignmentId}`}
                    onClick={() => setExpandedAssignmentId(isExpanded ? null : assignmentId)}
                    className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                    data-testid={`row-assignment-${assignmentId}`}
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
                          <div className="font-medium">{assignment.assetId}</div>
                          <div className="text-sm text-muted-foreground">
                            {asset?.brand} {asset?.modelName}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {employee?.firstName} {employee?.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {employee?.employeeCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(assignment.assignedDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-blue-400" />
                            <span>Returned</span>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(assignment.returnedDate!)}
                            </div>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          assignment.conditionOnAssignment === 'excellent' ? 'bg-green-400' :
                          assignment.conditionOnAssignment === 'good' ? 'bg-blue-400' :
                          assignment.conditionOnAssignment === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                        }`} />
                        <span className="capitalize">{assignment.conditionOnAssignment}</span>
                        {assignment.conditionOnReturn && (
                          <>
                            <span className="text-white/70">→</span>
                            <div className={`w-2 h-2 rounded-full ${
                              assignment.conditionOnReturn === 'excellent' ? 'bg-green-400' :
                              assignment.conditionOnReturn === 'good' ? 'bg-blue-400' :
                              assignment.conditionOnReturn === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <span className="capitalize text-sm">{assignment.conditionOnReturn}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getLocationName(employee?.locationId ?? null)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {assignment.assignmentReason}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ]

                if (isExpanded) {
                  rows.push(
                    <TableRow key={`expanded-${assignmentId}`} className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={7} className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Assignment Timeline</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Assigned Date</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(assignment.assignedDate)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Return Date</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Calendar className="h-3 w-3" />
                                  {assignment.returnedDate ? formatDate(assignment.returnedDate) : 'Still Active'}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Assignment Status</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400' : 'bg-blue-400'}`} />
                                  {isActive ? 'Active' : 'Returned'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Asset & Employee</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Asset ID</div>
                                <div className="text-sm mt-1 font-mono">{assignment.assetId}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {asset?.brand} {asset?.modelName} ({asset?.assetType})
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Employee</div>
                                <div className="text-sm mt-1">{employee?.firstName} {employee?.lastName}</div>
                                <div className="text-xs text-muted-foreground font-mono mt-1">
                                  {employee?.employeeCode}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Location</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {getLocationName(employee?.locationId ?? null)}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Condition & Notes</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Condition on Assignment</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${
                                    assignment.conditionOnAssignment === 'excellent' ? 'bg-green-400' :
                                    assignment.conditionOnAssignment === 'good' ? 'bg-blue-400' :
                                    assignment.conditionOnAssignment === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                                  }`} />
                                  <span className="capitalize">{assignment.conditionOnAssignment}</span>
                                </div>
                              </div>
                              {assignment.conditionOnReturn && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Condition on Return</div>
                                  <div className="text-sm mt-1 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                      assignment.conditionOnReturn === 'excellent' ? 'bg-green-400' :
                                      assignment.conditionOnReturn === 'good' ? 'bg-blue-400' :
                                      assignment.conditionOnReturn === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                                    }`} />
                                    <span className="capitalize">{assignment.conditionOnReturn}</span>
                                  </div>
                                </div>
                              )}
                              <div>
                                <div className="text-xs text-muted-foreground">Assignment Reason</div>
                                <div className="text-sm mt-1">{assignment.assignmentReason}</div>
                              </div>
                              {assignment.returnReason && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Return Reason</div>
                                  <div className="text-sm mt-1">{assignment.returnReason}</div>
                                </div>
                              )}
                              {assignment.backupDetails && (
                                <div>
                                  <div className="text-xs text-muted-foreground">Backup Details</div>
                                  <div className="text-sm mt-1 p-2 bg-muted/30 rounded">
                                    {assignment.backupDetails}
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
                              setSelectedAssignment(assignment)
                              setIsViewDialogOpen(true)
                            }}
                            data-testid={`button-view-details-${assignmentId}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Details
                          </Button>
                          {isActive && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAssignment(assignment)
                                  setIsReturnDialogOpen(true)
                                }}
                                data-testid={`button-return-${assignmentId}`}
                              >
                                <Undo className="mr-2 h-4 w-4" />
                                Return Asset
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedAssignment(assignment)
                                  setIsTransferDialogOpen(true)
                                }}
                                data-testid={`button-transfer-${assignmentId}`}
                              >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Transfer Asset
                              </Button>
                            </>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete this assignment record? This action cannot be undone.`)) {
                                deleteAssignmentMutation.mutate({ assetId: assignment.assetId, employeeId: assignment.employeeId })
                              }
                            }}
                            data-testid={`button-delete-assignment-${assignmentId}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Assignment
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

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              View assignment timeline, condition reports, backup records, and complete responsibility chain
            </DialogDescription>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Asset</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAssignment.assetId}
                    <div className="text-xs text-muted-foreground">
                      {getAssetInfo(selectedAssignment.assetId)?.brand} {getAssetInfo(selectedAssignment.assetId)?.modelName}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Employee</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {getEmployeeInfo(selectedAssignment.employeeId)?.firstName} {getEmployeeInfo(selectedAssignment.employeeId)?.lastName}
                    <div className="text-xs text-muted-foreground font-mono">
                      {getEmployeeInfo(selectedAssignment.employeeId)?.employeeCode}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assigned Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatDate(selectedAssignment.assignedDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Return Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAssignment.returnedDate ? formatDate(selectedAssignment.returnedDate) : "Not returned"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assignment Reason</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAssignment.assignmentReason}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Return Reason</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAssignment.returnReason || "Not applicable"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Condition on Assignment</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedAssignment.conditionOnAssignment}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Condition on Return</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedAssignment.conditionOnReturn || "Not applicable"}
                  </div>
                </div>
              </div>

              {selectedAssignment.backupDetails && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Backup Details</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedAssignment.backupDetails}
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

      {/* Return Asset Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Return Asset</DialogTitle>
            <DialogDescription>
              Process asset return with condition assessment and closure documentation for {selectedAssignment?.assetId}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReturnAsset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="returnReason">Return Reason *</Label>
              <Select name="returnReason" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select return reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Employee Left">Employee Left</SelectItem>
                  <SelectItem value="Upgrade">Upgrade</SelectItem>
                  <SelectItem value="Replacement">Replacement</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Department Transfer">Department Transfer</SelectItem>
                  <SelectItem value="Project Ended">Project Ended</SelectItem>
                  <SelectItem value="Retirement">Retirement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="conditionOnReturn">Condition on Return *</Label>
              <Select name="conditionOnReturn" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsReturnDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={returnAssetMutation.isPending}>
                {returnAssetMutation.isPending ? "Processing..." : "Return Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Transfer Asset Dialog */}
      <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfer Asset</DialogTitle>
            <DialogDescription>
              Reassign resource ownership with seamless handover documentation and continuous tracking for {selectedAssignment?.assetId}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleTransferAsset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="toEmployeeId">Transfer to Employee *</Label>
              <Select name="toEmployeeId" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select new assignee" />
                </SelectTrigger>
                <SelectContent>
                  {activeEmployees.filter(emp => emp.id !== selectedAssignment?.employeeId).map(employee => (
                    <SelectItem key={employee.id} value={employee.id.toString()}>
                      {employee.firstName} {employee.lastName} ({employee.employeeCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="returnReason">Return Reason *</Label>
                <Select name="returnReason" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                    <SelectItem value="Department Change">Department Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditionOnReturn">Condition on Return *</Label>
                <Select name="conditionOnReturn" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newAssignmentReason">New Assignment Reason *</Label>
                <Select name="newAssignmentReason" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Transfer">Transfer</SelectItem>
                    <SelectItem value="Replacement">Replacement</SelectItem>
                    <SelectItem value="New Employee">New Employee</SelectItem>
                    <SelectItem value="Department Change">Department Change</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="conditionOnNewAssignment">Condition for New Assignment *</Label>
                <Select name="conditionOnNewAssignment" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Condition" />
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
                onClick={() => setIsTransferDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={transferAssetMutation.isPending}>
                {transferAssetMutation.isPending ? "Processing..." : "Transfer Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}