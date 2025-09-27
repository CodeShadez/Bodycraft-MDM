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
  AlertTriangle
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
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

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
    
    return matchesSearch && matchesStatus && matchesLocation
  }) || []

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
    const formData = new FormData(event.target as HTMLFormElement)
    
    const assignmentData = {
      assetId: formData.get('assetId'),
      employeeId: parseInt(formData.get('employeeId') as string),
      assignmentReason: formData.get('assignmentReason'),
      conditionOnAssignment: formData.get('conditionOnAssignment'),
      backupDetails: formData.get('backupDetails') || null,
      createdBy: 1, // TODO: Get from authentication context
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
          <p className="text-muted-foreground">
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
                  Create a new asset assignment with complete tracking
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assignments?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Complete history preserved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.filter(a => !a.returnedDate).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently assigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Returned Assets</CardTitle>
            <Undo className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {assignments?.filter(a => a.returnedDate).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Successfully returned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Assignment</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableAssets.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready to assign
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Assignments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Asset ID, Employee Name, Employee Code..."
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
                  <SelectItem value="all">All Assignments</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
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
            Showing {filteredAssignments.length} of {assignments?.length || 0} assignments
          </div>
        </CardContent>
      </Card>

      {/* Assignments Table */}
      <Card>
        <CardContent className="p-0">
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
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssignments.map((assignment, index) => {
                const asset = getAssetInfo(assignment.assetId)
                const employee = getEmployeeInfo(assignment.employeeId)
                const isActive = !assignment.returnedDate
                
                return (
                  <TableRow key={`${assignment.assetId}-${assignment.employeeId}-${index}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
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
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span>Active</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
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
                          assignment.conditionOnAssignment === 'excellent' ? 'bg-green-500' :
                          assignment.conditionOnAssignment === 'good' ? 'bg-blue-500' :
                          assignment.conditionOnAssignment === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <span className="capitalize">{assignment.conditionOnAssignment}</span>
                        {assignment.conditionOnReturn && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <div className={`w-2 h-2 rounded-full ${
                              assignment.conditionOnReturn === 'excellent' ? 'bg-green-500' :
                              assignment.conditionOnReturn === 'good' ? 'bg-blue-500' :
                              assignment.conditionOnReturn === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                            <span className="capitalize text-sm">{assignment.conditionOnReturn}</span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getLocationName(employee?.locationId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {assignment.assignmentReason}
                      </Badge>
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
                              setSelectedAssignment(assignment)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {isActive && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAssignment(assignment)
                                  setIsReturnDialogOpen(true)
                                }}
                              >
                                <Undo className="mr-2 h-4 w-4" />
                                Return Asset
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedAssignment(assignment)
                                  setIsTransferDialogOpen(true)
                                }}
                              >
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Transfer Asset
                              </DropdownMenuItem>
                            </>
                          )}
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

      {/* View Assignment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assignment Details</DialogTitle>
            <DialogDescription>
              Complete assignment information with history
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
              Record the return of {selectedAssignment?.assetId} from {getEmployeeInfo(selectedAssignment?.employeeId || 0)?.firstName} {getEmployeeInfo(selectedAssignment?.employeeId || 0)?.lastName}
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
              Transfer {selectedAssignment?.assetId} from {getEmployeeInfo(selectedAssignment?.employeeId || 0)?.firstName} {getEmployeeInfo(selectedAssignment?.employeeId || 0)?.lastName} to another employee
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