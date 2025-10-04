import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  User,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Badge as BadgeIcon,
  Building2,
  Laptop,
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
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Status color mapping
const statusColors: Record<string, string> = {
  active: "bg-green-400",
  inactive: "bg-red-400",
  on_leave: "bg-yellow-400",
}

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  department: string
  designation: string
  email: string
  phone: string
  status: "active" | "inactive" | "on_leave"
  locationId: number | null
  createdAt: string
  updatedAt: string
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

interface Asset {
  assetId: string
  modelName: string
  brand: string
  assetType: string
  currentUserId: number | null
}

interface Assignment {
  assetId: string
  employeeId: number
  assignedDate: string
  returnedDate: string | null
}

export default function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [designationFilter, setDesignationFilter] = useState<string>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [expandedEmployeeId, setExpandedEmployeeId] = useState<number | null>(null)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  })

  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  })

  // Get unique departments and designations for filters
  const departments = Array.from(new Set(employees?.map(emp => emp.department) || []))
  const designations = Array.from(new Set(employees?.map(emp => emp.designation) || []))

  // Filter employees
  const filteredEmployees = employees?.filter(employee => {
    const matchesSearch = 
      employee.employeeCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.designation.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || employee.status === statusFilter
    const matchesDepartment = departmentFilter === "all" || employee.department === departmentFilter
    const matchesLocation = locationFilter === "all" || employee.locationId?.toString() === locationFilter
    const matchesDesignation = designationFilter === "all" || employee.designation === designationFilter
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesLocation && matchesDesignation
  }) || []

  // Count active filters
  const activeFiltersCount = [
    departmentFilter !== "all",
    locationFilter !== "all",
    designationFilter !== "all"
  ].filter(Boolean).length

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (employeeData: any) => {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeeData),
      })
      if (!response.ok) throw new Error('Failed to create employee')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] })
      toast({ title: "Success", description: "Employee created successfully" })
      setIsCreateDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create employee", variant: "destructive" })
    }
  })

  // Update employee mutation  
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ employeeId, data }: { employeeId: number, data: any }) => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update employee')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] })
      toast({ title: "Success", description: "Employee updated successfully" })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update employee", variant: "destructive" })
    }
  })

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await fetch(`/api/employees/${employeeId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete employee')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] })
      toast({ title: "Success", description: "Employee deleted successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete employee", variant: "destructive" })
    }
  })

  // Helper functions
  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "No location assigned"
    const location = locations?.find(loc => loc.id === locationId)
    return location ? `${location.outletName}, ${location.city}` : "Unknown location"
  }

  const getEmployeeAssets = (employeeId: number) => {
    const activeAssignments = assignments?.filter(
      assignment => assignment.employeeId === employeeId && !assignment.returnedDate
    ) || []
    
    return activeAssignments.map(assignment => {
      const asset = assets?.find(a => a.assetId === assignment.assetId)
      return asset
    }).filter(Boolean)
  }

  const handleCreateEmployee = (event: React.FormEvent) => {
    event.preventDefault()
    const formData = new FormData(event.target as HTMLFormElement)
    
    const employeeData = {
      employeeCode: formData.get('employeeCode'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      department: formData.get('department'),
      designation: formData.get('designation'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      status: formData.get('status'),
      locationId: formData.get('locationId') ? parseInt(formData.get('locationId') as string) : null,
    }

    createEmployeeMutation.mutate(employeeData)
  }

  const handleUpdateEmployee = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedEmployee) return
    
    const formData = new FormData(event.target as HTMLFormElement)
    
    const employeeData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      department: formData.get('department'),
      designation: formData.get('designation'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      status: formData.get('status'),
      locationId: formData.get('locationId') ? parseInt(formData.get('locationId') as string) : null,
    }

    updateEmployeeMutation.mutate({ employeeId: selectedEmployee.id, data: employeeData })
  }

  if (employeesLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Employees</h1>
          <p className="text-white/70">
            Human resource management and organizational structure oversight
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
                Add Employee
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Employee</DialogTitle>
                <DialogDescription>
                  Onboard new personnel with complete organizational details and department assignment
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEmployee} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeCode">Employee Code *</Label>
                  <Input
                    id="employeeCode"
                    name="employeeCode"
                    placeholder="BFC2024001"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="department">Department *</Label>
                    <Select name="department" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IT">IT</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Operations">Operations</SelectItem>
                        <SelectItem value="Finance">Finance</SelectItem>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Management">Management</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      name="designation"
                      placeholder="Software Engineer, Sales Manager..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john.doe@bodycraft.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="locationId">Location</Label>
                    <Select name="locationId">
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
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" defaultValue="active">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="on_leave">On Leave</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <Button type="submit" disabled={createEmployeeMutation.isPending}>
                    {createEmployeeMutation.isPending ? "Creating..." : "Create Employee"}
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
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{employees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {departments.length} departments
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <BadgeIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {employees?.filter(emp => emp.status === 'active').length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently working
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Assets</CardTitle>
            <Laptop className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {employees?.filter(emp => 
                assignments?.some(assignment => 
                  assignment.employeeId === emp.id && !assignment.returnedDate
                )
              ).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Have assigned assets
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Employees</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search by Name, Employee Code, Email, Department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-12 backdrop-blur-sm border-border/40 focus:border-primary/50 transition-all"
                data-testid="input-search-employees"
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            {(departmentFilter !== "all" || locationFilter !== "all" || designationFilter !== "all") && (
              <Button
                onClick={() => {
                  setDepartmentFilter("all")
                  setLocationFilter("all")
                  setDesignationFilter("all")
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
                  Designation
                </label>
                <Select value={designationFilter} onValueChange={setDesignationFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-designation">
                    <SelectValue placeholder="All Designations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Designations</SelectItem>
                    {designations.map(designation => (
                      <SelectItem key={designation} value={designation}>{designation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredEmployees.length} of {employees?.length || 0} employees
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Assigned Assets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.flatMap((employee) => {
                const employeeAssets = getEmployeeAssets(employee.id)
                const isExpanded = expandedEmployeeId === employee.id
                const rows = [
                  <TableRow 
                    key={`main-${employee.id}`}
                    onClick={() => setExpandedEmployeeId(isExpanded ? null : employee.id)}
                    className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                    data-testid={`row-employee-${employee.id}`}
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
                        <User className="h-8 w-8 p-1.5 bg-muted rounded-full" />
                        <div>
                          <div className="font-medium">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {employee.employeeCode}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <Badge variant="outline">{employee.department}</Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          {employee.designation}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-2 h-2 rounded-full ${statusColors[employee.status]}`}
                        />
                        <span className="capitalize">{employee.status.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getLocationName(employee.locationId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          {employee.email}
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          {employee.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {employeeAssets?.length > 0 ? (
                          employeeAssets.map((asset, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {asset?.assetId}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-muted-foreground">No assets</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ]

                if (isExpanded) {
                  rows.push(
                    <TableRow key={`expanded-${employee.id}`} className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={6} className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Employee Information</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Employee Code</div>
                                <div className="font-mono text-sm mt-1">{employee.employeeCode}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Full Name</div>
                                <div className="text-sm mt-1">{employee.firstName} {employee.lastName}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Department</div>
                                <div className="text-sm mt-1">{employee.department}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Designation</div>
                                <div className="text-sm mt-1">{employee.designation}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Information</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Email Address</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {employee.email}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Phone Number</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {employee.phone}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Location</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  {getLocationName(employee.locationId)}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Status</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full ${statusColors[employee.status]}`} />
                                  <span className="capitalize">{employee.status.replace('_', ' ')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Assigned Assets</h4>
                            <div className="space-y-2">
                              {employeeAssets && employeeAssets.length > 0 ? (
                                employeeAssets.map((asset, index) => (
                                  <div key={index} className="p-3 bg-muted/30 rounded-lg">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Laptop className="h-4 w-4 text-muted-foreground" />
                                      <span className="font-mono text-sm font-medium">{asset?.assetId}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {asset?.brand} {asset?.modelName}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1">
                                      Type: {asset?.assetType}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-sm text-muted-foreground italic p-3 bg-muted/20 rounded-lg">
                                  No assets currently assigned to this employee
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
                              setSelectedEmployee(employee)
                              setIsViewDialogOpen(true)
                            }}
                            data-testid={`button-view-details-${employee.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedEmployee(employee)
                              setIsEditDialogOpen(true)
                            }}
                            data-testid={`button-edit-employee-${employee.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Employee
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

      {/* View Employee Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Details</DialogTitle>
            <DialogDescription>
              View personnel profile, contact information, and resource allocation for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Employee Code</Label>
                  <div className="text-sm p-2 bg-muted rounded font-mono">
                    {selectedEmployee.employeeCode}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Full Name</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Department</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedEmployee.department}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Designation</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedEmployee.designation}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Email</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedEmployee.email}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Phone</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedEmployee.phone}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[selectedEmployee.status]}`} />
                    <span className="capitalize">{selectedEmployee.status.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {getLocationName(selectedEmployee.locationId)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Assigned Assets</Label>
                <div className="p-2 bg-muted rounded">
                  {getEmployeeAssets(selectedEmployee.id)?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {getEmployeeAssets(selectedEmployee.id).map((asset, index) => (
                        <Badge key={index} variant="secondary">
                          {asset?.assetId} ({asset?.brand} {asset?.modelName})
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">No assets assigned</span>
                  )}
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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>
              Modify personnel details, department assignment, and contact information for {selectedEmployee?.firstName} {selectedEmployee?.lastName}
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <form onSubmit={handleUpdateEmployee} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-firstName">First Name *</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    defaultValue={selectedEmployee.firstName}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-lastName">Last Name *</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    defaultValue={selectedEmployee.lastName}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-department">Department *</Label>
                  <Select name="department" defaultValue={selectedEmployee.department} required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Sales">Sales</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Management">Management</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-designation">Designation *</Label>
                  <Input
                    id="edit-designation"
                    name="designation"
                    defaultValue={selectedEmployee.designation}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email Address *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    defaultValue={selectedEmployee.email}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number *</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    defaultValue={selectedEmployee.phone}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-locationId">Location</Label>
                  <Select name="locationId" defaultValue={selectedEmployee.locationId?.toString() || ""}>
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
                  <Label htmlFor="edit-status">Status</Label>
                  <Select name="status" defaultValue={selectedEmployee.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="on_leave">On Leave</SelectItem>
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
                <Button type="submit" disabled={updateEmployeeMutation.isPending}>
                  {updateEmployeeMutation.isPending ? "Updating..." : "Update Employee"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}