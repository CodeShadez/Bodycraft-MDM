import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Shield, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  HardDrive,
  Key,
  Monitor,
  Camera,
  Fingerprint,
  Settings,
  Archive
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
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface ComplianceRecord {
  id: number
  taskName: string
  taskType: "backup" | "security_audit" | "policy_review" | "system_update" | "data_retention" | "access_review"
  description: string
  category: "data_backup" | "security" | "compliance" | "maintenance" | "governance"
  priority: "low" | "medium" | "high" | "critical"
  status: "pending" | "in_progress" | "completed" | "overdue" | "exempted"
  assignedTo: number | null
  assignedToName: string | null
  locationId: number | null
  locationName: string | null
  dueDate: string
  completionDate: string | null
  evidenceFiles: string[] | null
  complianceScore: number | null
  riskLevel: string | null
  regulatoryFramework: string | null
  notes: string | null
  createdBy: number
  createdByName: string | null
  createdAt: string
  updatedAt: string
  isOverdue: boolean
  daysUntilDue: number
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
  pending: "bg-yellow-400",
  completed: "bg-green-400",
  overdue: "bg-red-400",
  exempted: "bg-gray-500"
}

// Type color mapping
const typeColors: Record<string, string> = {
  backup: "bg-blue-400",
  security_audit: "bg-red-400",
  policy_review: "bg-purple-400",
  system_update: "bg-orange-500",
  data_retention: "bg-cyan-500",
  access_review: "bg-pink-500"
}

// Category icons
const categoryIcons: Record<string, any> = {
  data_backup: HardDrive,
  security: Shield,
  compliance: FileText,
  maintenance: Settings,
  governance: Building2
}

export default function CompliancePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data from API
  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  const { data: users } = useQuery<any[]>({
    queryKey: ["/api/users"],
  })

  // Fetch compliance tasks from real API
  const { data: compliance, isLoading: isLoadingCompliance } = useQuery<any[]>({
    queryKey: ["/api/compliance/tasks"],
  })

  // Create compliance task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const response = await fetch('/api/compliance/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/tasks'] })
      toast({ title: "Success", description: "Compliance task created successfully" })
      setIsCreateDialogOpen(false)
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create task", 
        variant: "destructive" 
      })
    }
  })

  // Update compliance task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: any }) => {
      const response = await fetch(`/api/compliance/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/tasks'] })
      toast({ title: "Success", description: "Task updated successfully" })
      setIsEditDialogOpen(false)
      setIsCompleteDialogOpen(false)
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update task", 
        variant: "destructive" 
      })
    }
  })

  // Delete compliance task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/compliance/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete task')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/compliance/tasks'] })
      toast({ title: "Success", description: "Task deleted successfully" })
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete task", 
        variant: "destructive" 
      })
    }
  })

  // Helper function to get compliance status
  const getComplianceStatus = (record: ComplianceRecord) => {
    if (record.isOverdue) return "overdue"
    return record.status
  }

  // Filter compliance records
  const filteredCompliance = compliance?.filter(record => {
    const status = record.isOverdue ? 'overdue' : record.status
    
    const matchesSearch = 
      record.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assignedToName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.locationName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || status === statusFilter
    const matchesType = typeFilter === "all" || record.taskType === typeFilter
    const matchesCategory = categoryFilter === "all" || record.category === categoryFilter
    const matchesLocation = locationFilter === "all" || record.locationId?.toString() === locationFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesCategory && matchesLocation
  }) || []

  // Helper functions
  const getAssetInfo = (assetId: string | null) => {
    if (!assetId) return null
    return assets?.find(asset => asset.assetId === assetId)
  }

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "All Locations"
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "pending": return "bg-yellow-100 text-yellow-800" 
      case "overdue": return "bg-red-100 text-red-800"
      case "exempted": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "backup": return HardDrive
      case "security_audit": return Shield
      case "policy_review": return FileText
      case "system_update": return Monitor
      case "data_retention": return Archive
      case "access_review": return Key
      default: return Settings
    }
  }

  // Calculate compliance metrics
  const totalRecords = compliance?.length || 0
  const completedRecords = compliance?.filter(r => r.status === 'completed').length || 0
  const pendingRecords = compliance?.filter(r => r.status === 'pending').length || 0
  const overdueRecords = compliance?.filter(r => r.isOverdue).length || 0
  const complianceRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Backup & Compliance</h1>
          <p className="text-white/70">
            Monitor compliance activities and backup verification across all locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Tasks
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Compliance Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Compliance Task</DialogTitle>
                <DialogDescription>
                  Add a new compliance monitoring task or backup verification
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                const data = {
                  taskName: formData.get('taskName') as string,
                  taskType: formData.get('taskType') as string,
                  category: formData.get('category') as string,
                  description: formData.get('description') as string,
                  priority: formData.get('priority') as string,
                  locationId: parseInt(formData.get('locationId') as string),
                  dueDate: formData.get('dueDate') as string,
                  assignedTo: formData.get('assignedTo') ? parseInt(formData.get('assignedTo') as string) : null,
                }
                createTaskMutation.mutate(data)
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskType">Task Type *</Label>
                    <Select name="taskType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select task type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="backup">Backup Verification</SelectItem>
                        <SelectItem value="security_audit">Security Audit</SelectItem>
                        <SelectItem value="policy_review">Policy Review</SelectItem>
                        <SelectItem value="system_update">System Update</SelectItem>
                        <SelectItem value="data_retention">Data Retention</SelectItem>
                        <SelectItem value="access_review">Access Review</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data_backup">Data Backup</SelectItem>
                        <SelectItem value="security">Security</SelectItem>
                        <SelectItem value="compliance">Compliance</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="governance">Governance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taskName">Task Title *</Label>
                  <Input
                    id="taskName"
                    name="taskName"
                    placeholder="Weekly backup verification"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Detailed description of the compliance task"
                    rows={3}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority *</Label>
                    <Select name="priority" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location *</Label>
                    <Select name="locationId" required>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date *</Label>
                    <Input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo">Assigned To</Label>
                    <Select name="assignedTo">
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassigned</SelectItem>
                        {users?.map(user => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.fullName} ({user.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCreateDialogOpen(false)}
                    disabled={createTaskMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTaskMutation.isPending}>
                    {createTaskMutation.isPending ? "Creating..." : "Create Compliance Task"}
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
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              All compliance tasks
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{completedRecords}</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{overdueRecords}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{complianceRate}%</div>
            <div className="mt-2">
              <Progress value={complianceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Compliance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Title, Description, Asset ID, Assigned Person..."
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
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="exempted">Exempted</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="backup">Backup</SelectItem>
                  <SelectItem value="security_audit">Security Audit</SelectItem>
                  <SelectItem value="policy_review">Policy Review</SelectItem>
                  <SelectItem value="system_update">System Update</SelectItem>
                  <SelectItem value="data_retention">Data Retention</SelectItem>
                  <SelectItem value="access_review">Access Review</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="data_backup">Data Backup</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="governance">Governance</SelectItem>
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
            Showing {filteredCompliance.length} of {compliance?.length || 0} compliance records
          </div>
        </CardContent>
      </Card>

      {/* Compliance Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset/Location</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Evidence</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompliance.map((record) => {
                const status = getComplianceStatus(record)
                const TypeIcon = getTypeIcon(record.taskType)
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{record.taskName}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {record.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${typeColors[record.taskType]}`}
                        />
                        <span className="capitalize">{record.taskType.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {record.locationName || "All Locations"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {formatDate(record.dueDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusBadgeColor(status)}
                      >
                        {status}
                      </Badge>
                      {record.completionDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Completed: {formatDate(record.completionDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.assignedToName || "Unassigned"}
                    </TableCell>
                    <TableCell>
                      {record.evidenceFiles && record.evidenceFiles.length > 0 ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">{record.evidenceFiles.length} file(s)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-400">
                          <XCircle className="h-3 w-3" />
                          <span className="text-xs">No evidence</span>
                        </div>
                      )}
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
                              setSelectedRecord(record)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecord(record)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Task
                          </DropdownMenuItem>
                          {!record.completionDate && (
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedRecord(record)
                                setIsCompleteDialogOpen(true)
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => deleteTaskMutation.mutate(record.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Task
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

      {/* View Record Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compliance Task Details</DialogTitle>
            <DialogDescription>
              Complete information about this compliance task
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Task Type</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedRecord.type.replace('_', ' ')}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <div className="text-sm p-2 bg-muted rounded capitalize">
                    {selectedRecord.category.replace('_', ' ')}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Title</Label>
                <div className="text-sm p-2 bg-muted rounded font-medium">
                  {selectedRecord.title}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Description</Label>
                <div className="text-sm p-2 bg-muted rounded">
                  {selectedRecord.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Due Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatDate(selectedRecord.dueDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    <Badge className={getStatusBadgeColor(getComplianceStatus(selectedRecord))}>
                      {getComplianceStatus(selectedRecord)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Assigned To</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedRecord.assignedTo}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Evidence</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedRecord.evidenceUrl ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {selectedRecord.evidenceUrl}
                      </div>
                    ) : (
                      <div className="text-gray-500">No evidence uploaded</div>
                    )}
                  </div>
                </div>
              </div>

              {selectedRecord.complianceNotes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Compliance Notes</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedRecord.complianceNotes}
                  </div>
                </div>
              )}

              {selectedRecord.assetId && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Related Asset</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedRecord.assetId}
                    {getAssetInfo(selectedRecord.assetId) && (
                      <div className="text-xs text-muted-foreground">
                        {getAssetInfo(selectedRecord.assetId)?.brand} {getAssetInfo(selectedRecord.assetId)?.modelName}
                      </div>
                    )}
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
    </div>
  )
}