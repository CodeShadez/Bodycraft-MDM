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

interface ComplianceRecord {
  id: number
  type: "backup" | "security_audit" | "policy_review" | "system_update" | "data_retention" | "access_review"
  category: "data_backup" | "security" | "compliance" | "maintenance" | "governance"
  title: string
  description: string
  assetId: string | null
  locationId: number | null
  dueDate: string
  completedDate: string | null
  status: "pending" | "completed" | "overdue" | "exempted"
  assignedTo: string
  evidenceUrl: string | null
  complianceNotes: string | null
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
  pending: "bg-yellow-500",
  completed: "bg-green-500",
  overdue: "bg-red-500",
  exempted: "bg-gray-500"
}

// Type color mapping
const typeColors: Record<string, string> = {
  backup: "bg-blue-500",
  security_audit: "bg-red-500",
  policy_review: "bg-purple-500",
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

  // Mock compliance data - In real app, this would come from API
  const mockComplianceData: ComplianceRecord[] = [
    {
      id: 1,
      type: "backup",
      category: "data_backup",
      title: "Weekly System Backup Verification",
      description: "Verify that all critical systems have been backed up and backups are recoverable",
      assetId: "BFC001",
      locationId: 1,
      dueDate: "2024-01-15",
      completedDate: "2024-01-14",
      status: "completed",
      assignedTo: "Rajesh Kumar",
      evidenceUrl: "backup_verification_20240114.pdf",
      complianceNotes: "All backups verified successfully. Test restore completed for critical files.",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-14T10:30:00Z"
    },
    {
      id: 2,
      type: "security_audit",
      category: "security",
      title: "Quarterly Access Review",
      description: "Review and validate user access permissions across all systems",
      assetId: null,
      locationId: 1,
      dueDate: "2024-01-20",
      completedDate: null,
      status: "pending",
      assignedTo: "Priya Singh",
      evidenceUrl: null,
      complianceNotes: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: 3,
      type: "policy_review",
      category: "governance",
      title: "IT Security Policy Annual Review",
      description: "Annual review and update of IT security policies and procedures",
      assetId: null,
      locationId: 2,
      dueDate: "2024-01-10",
      completedDate: null,
      status: "overdue",
      assignedTo: "Admin Team",
      evidenceUrl: null,
      complianceNotes: "Policy review delayed due to management changes",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    },
    {
      id: 4,
      type: "system_update",
      category: "maintenance",
      title: "Critical Security Patches",
      description: "Install latest security patches on all Windows systems",
      assetId: "BFC003",
      locationId: 2,
      dueDate: "2024-01-18",
      completedDate: "2024-01-17",
      status: "completed",
      assignedTo: "IT Support",
      evidenceUrl: "patch_report_20240117.xlsx",
      complianceNotes: "Security patches applied to 15 systems. Reboot completed successfully.",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-17T16:45:00Z"
    },
    {
      id: 5,
      type: "data_retention",
      category: "compliance",
      title: "Data Retention Policy Compliance",
      description: "Ensure old backup data is archived according to retention policy",
      assetId: "BFC006",
      locationId: 1,
      dueDate: "2024-01-25",
      completedDate: null,
      status: "pending",
      assignedTo: "Data Manager",
      evidenceUrl: null,
      complianceNotes: null,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  ]

  // Fetch data
  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Use mock data for compliance records
  const compliance = mockComplianceData

  // Helper function to get compliance status
  const getComplianceStatus = (record: ComplianceRecord) => {
    if (record.status === "exempted") return "exempted"
    if (record.completedDate) return "completed"
    
    const dueDate = new Date(record.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (dueDate < today) return "overdue"
    return "pending"
  }

  // Filter compliance records
  const filteredCompliance = compliance?.filter(record => {
    const asset = assets?.find(a => a.assetId === record.assetId)
    const location = locations?.find(l => l.id === record.locationId)
    const status = getComplianceStatus(record)
    
    const matchesSearch = 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.assetId?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || status === statusFilter
    const matchesType = typeFilter === "all" || record.type === typeFilter
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
  const totalRecords = compliance.length
  const completedRecords = compliance.filter(r => r.completedDate).length
  const pendingRecords = compliance.filter(r => !r.completedDate && getComplianceStatus(r) === "pending").length
  const overdueRecords = compliance.filter(r => getComplianceStatus(r) === "overdue").length
  const complianceRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Backup & Compliance</h1>
          <p className="text-muted-foreground">
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
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Task Type *</Label>
                    <Select name="type" required>
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
                  <Label htmlFor="title">Task Title *</Label>
                  <Input
                    id="title"
                    name="title"
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
                    <Label htmlFor="assetId">Related Asset (Optional)</Label>
                    <Select name="assetId">
                      <SelectTrigger>
                        <SelectValue placeholder="Select asset" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No specific asset</SelectItem>
                        {assets?.map(asset => (
                          <SelectItem key={asset.assetId} value={asset.assetId}>
                            {asset.assetId} - {asset.brand} {asset.modelName}
                          </SelectItem>
                        ))}
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
                    <Label htmlFor="assignedTo">Assigned To *</Label>
                    <Input
                      id="assignedTo"
                      name="assignedTo"
                      placeholder="John Doe / IT Team"
                      required
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
                  <Button type="submit">
                    Create Compliance Task
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
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecords}</div>
            <p className="text-xs text-muted-foreground">
              All compliance tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRecords}</div>
            <p className="text-xs text-muted-foreground">
              Tasks completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueRecords}</div>
            <p className="text-xs text-muted-foreground">
              Past due date
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceRate}%</div>
            <div className="mt-2">
              <Progress value={complianceRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
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
      <Card>
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
                const asset = getAssetInfo(record.assetId)
                const status = getComplianceStatus(record)
                const TypeIcon = getTypeIcon(record.type)
                
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <TypeIcon className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{record.title}</div>
                          <div className="text-sm text-muted-foreground truncate max-w-xs">
                            {record.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${typeColors[record.type]}`}
                        />
                        <span className="capitalize">{record.type.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {asset ? (
                          <>
                            <div className="font-medium">{record.assetId}</div>
                            <div className="text-sm text-muted-foreground">
                              {asset.brand} {asset.modelName}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {getLocationName(record.locationId)}
                          </div>
                        )}
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
                      {record.completedDate && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Completed: {formatDate(record.completedDate)}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {record.assignedTo}
                    </TableCell>
                    <TableCell>
                      {record.evidenceUrl ? (
                        <div className="flex items-center gap-1 text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          <span className="text-xs">Evidence</span>
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
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Task
                          </DropdownMenuItem>
                          {!record.completedDate && (
                            <DropdownMenuItem>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Mark Complete
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
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