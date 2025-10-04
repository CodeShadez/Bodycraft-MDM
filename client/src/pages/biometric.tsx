import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Fingerprint, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Monitor,
  Scan,
  Shield,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Power,
  User,
  Users,
  Key
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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface BiometricSystem {
  id: number
  systemName: string
  systemType: "fingerprint_scanner" | "face_recognition" | "iris_scanner" | "palm_scanner" | "access_controller"
  brand: string
  model: string
  serialNumber: string | null
  ipAddress: string | null
  macAddress: string | null
  locationId: number
  installationDate: string
  warrantyUntil: string | null
  status: "active" | "inactive" | "maintenance" | "fault"
  enrolledUsers: number | null
  maxUsers: number | null
  accessLevel: "entry_only" | "full_access" | "restricted"
  integrationSystem: string | null
  firmwareVersion: string | null
  lastSyncDate: string | null
  maintenanceContract: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

// Status color mapping
const statusColors: Record<string, string> = {
  active: "bg-green-400",
  inactive: "bg-gray-500",
  maintenance: "bg-yellow-400",
  fault: "bg-red-400"
}

// System type icons
const systemTypeIcons: Record<string, any> = {
  fingerprint_scanner: Fingerprint,
  face_recognition: Scan,
  iris_scanner: Eye,
  palm_scanner: User,
  access_controller: Key
}

export default function BiometricPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<BiometricSystem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock biometric data - In real app, this would come from API
  const mockBiometricData: BiometricSystem[] = [
    {
      id: 1,
      systemName: "Main Entrance Fingerprint Scanner",
      systemType: "fingerprint_scanner",
      brand: "ZKTeco",
      model: "F18",
      serialNumber: "ZK123456789",
      ipAddress: "192.168.1.110",
      macAddress: "00:11:22:33:44:99",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2027-01-15",
      status: "active",
      enrolledUsers: 85,
      maxUsers: 3000,
      accessLevel: "full_access",
      integrationSystem: "HRMS Integration",
      firmwareVersion: "6.60.5.9",
      lastSyncDate: "2024-01-20T08:00:00Z",
      maintenanceContract: "BiometricTech Solutions",
      notes: "Primary attendance and access control for all employees",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-20T08:30:00Z"
    },
    {
      id: 2,
      systemName: "Manager Cabin Face Recognition",
      systemType: "face_recognition",
      brand: "Hikvision",
      model: "DS-K1T341AMF",
      serialNumber: "HV987654321",
      ipAddress: "192.168.1.111",
      macAddress: "00:11:22:33:44:AA",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2026-01-15",
      status: "active",
      enrolledUsers: 12,
      maxUsers: 500,
      accessLevel: "restricted",
      integrationSystem: "Access Control System",
      firmwareVersion: "2.2.25",
      lastSyncDate: "2024-01-20T06:00:00Z",
      maintenanceContract: "SecureTech Solutions",
      notes: "Restricted access for management and senior staff only",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-20T06:15:00Z"
    },
    {
      id: 3,
      systemName: "Store Exit Fingerprint Reader",
      systemType: "fingerprint_scanner",
      brand: "eSSL",
      model: "X990",
      serialNumber: "ES555666777",
      ipAddress: "192.168.1.112",
      macAddress: "00:11:22:33:44:BB",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2025-01-15",
      status: "maintenance",
      enrolledUsers: 85,
      maxUsers: 2000,
      accessLevel: "entry_only",
      integrationSystem: "Attendance System",
      firmwareVersion: "3.4.1",
      lastSyncDate: "2024-01-18T17:00:00Z",
      maintenanceContract: "Local Tech Services",
      notes: "Exit scanner for attendance tracking. Under maintenance for sensor cleaning",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-18T17:30:00Z"
    },
    {
      id: 4,
      systemName: "Koramangala Access Controller",
      systemType: "access_controller",
      brand: "ZKTeco",
      model: "inBio160",
      serialNumber: "ZK888999000",
      ipAddress: "192.168.2.110",
      macAddress: "00:11:22:33:44:CC",
      locationId: 2,
      installationDate: "2023-12-01",
      warrantyUntil: "2025-12-01",
      status: "active",
      enrolledUsers: 45,
      maxUsers: 30000,
      accessLevel: "full_access",
      integrationSystem: "Door Control + CCTV",
      firmwareVersion: "4.4.8",
      lastSyncDate: "2024-01-19T09:00:00Z",
      maintenanceContract: "ZKTeco Service",
      notes: "Central access control system managing multiple doors and entry points",
      createdAt: "2023-12-01T00:00:00Z",
      updatedAt: "2024-01-19T09:30:00Z"
    },
    {
      id: 5,
      systemName: "Staff Room Palm Scanner",
      systemType: "palm_scanner",
      brand: "Fujitsu",
      model: "PalmSecure-F Pro",
      serialNumber: "FJ111222333",
      ipAddress: "192.168.1.113",
      macAddress: "00:11:22:33:44:DD",
      locationId: 1,
      installationDate: "2024-02-01",
      warrantyUntil: "2027-02-01",
      status: "active",
      enrolledUsers: 25,
      maxUsers: 1000,
      accessLevel: "restricted",
      integrationSystem: "Staff Management System",
      firmwareVersion: "1.2.3",
      lastSyncDate: "2024-01-20T07:30:00Z",
      maintenanceContract: "Fujitsu Support",
      notes: "High-security palm scanner for staff room and sensitive areas access",
      createdAt: "2024-02-01T00:00:00Z",
      updatedAt: "2024-01-20T07:45:00Z"
    }
  ]

  // Fetch data
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Use mock data for biometric systems
  const biometricSystems = mockBiometricData

  // Filter biometric systems
  const filteredSystems = biometricSystems?.filter(system => {
    const location = locations?.find(l => l.id === system.locationId)
    
    const matchesSearch = 
      system.systemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      system.ipAddress?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === "all" || system.status === statusFilter
    const matchesType = typeFilter === "all" || system.systemType === typeFilter
    const matchesLocation = locationFilter === "all" || system.locationId.toString() === locationFilter
    
    return matchesSearch && matchesStatus && matchesType && matchesLocation
  }) || []

  // Helper functions
  const getLocationName = (locationId: number) => {
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "inactive": return "bg-gray-100 text-gray-800"
      case "maintenance": return "bg-yellow-100 text-yellow-800"
      case "fault": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getAccessLevelBadgeColor = (level: string) => {
    switch (level) {
      case "full_access": return "bg-blue-100 text-blue-800"
      case "restricted": return "bg-orange-100 text-orange-800"
      case "entry_only": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSystemTypeIcon = (type: string) => {
    return systemTypeIcons[type] || Settings
  }

  const getSystemTypeLabel = (type: string) => {
    switch (type) {
      case "fingerprint_scanner": return "Fingerprint Scanner"
      case "face_recognition": return "Face Recognition"
      case "iris_scanner": return "Iris Scanner"
      case "palm_scanner": return "Palm Scanner"
      case "access_controller": return "Access Controller"
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case "full_access": return "Full Access"
      case "restricted": return "Restricted"
      case "entry_only": return "Entry Only"
      default: return level.charAt(0).toUpperCase() + level.slice(1)
    }
  }

  // Calculate system metrics
  const totalSystems = biometricSystems.length
  const activeSystems = biometricSystems.filter(s => s.status === "active").length
  const totalEnrolledUsers = biometricSystems.reduce((sum, s) => sum + (s.enrolledUsers || 0), 0)
  const totalCapacity = biometricSystems.reduce((sum, s) => sum + (s.maxUsers || 0), 0)
  const utilizationRate = totalCapacity > 0 ? Math.round((totalEnrolledUsers / totalCapacity) * 100) : 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Biometric Systems</h1>
          <p className="text-white/70">
            Manage access control and attendance systems across all BODYCRAFT locations
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import Systems
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Biometric System
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Biometric System</DialogTitle>
                <DialogDescription>
                  Deploy new biometric authentication infrastructure with access controls and attendance integration
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name *</Label>
                    <Input
                      id="systemName"
                      name="systemName"
                      placeholder="Main Entrance Scanner"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="systemType">System Type *</Label>
                    <Select name="systemType" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fingerprint_scanner">Fingerprint Scanner</SelectItem>
                        <SelectItem value="face_recognition">Face Recognition</SelectItem>
                        <SelectItem value="iris_scanner">Iris Scanner</SelectItem>
                        <SelectItem value="palm_scanner">Palm Scanner</SelectItem>
                        <SelectItem value="access_controller">Access Controller</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Brand *</Label>
                    <Input
                      id="brand"
                      name="brand"
                      placeholder="ZKTeco, Hikvision, eSSL"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="F18, X990, inBio160"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      name="serialNumber"
                      placeholder="ZK123456789"
                    />
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
                    <Label htmlFor="ipAddress">IP Address</Label>
                    <Input
                      id="ipAddress"
                      name="ipAddress"
                      placeholder="192.168.1.110"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxUsers">Max Users Capacity</Label>
                    <Input
                      id="maxUsers"
                      name="maxUsers"
                      type="number"
                      placeholder="3000"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessLevel">Access Level *</Label>
                    <Select name="accessLevel" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_access">Full Access</SelectItem>
                        <SelectItem value="restricted">Restricted</SelectItem>
                        <SelectItem value="entry_only">Entry Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="installationDate">Installation Date *</Label>
                    <Input
                      id="installationDate"
                      name="installationDate"
                      type="date"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="integrationSystem">Integration System</Label>
                  <Input
                    id="integrationSystem"
                    name="integrationSystem"
                    placeholder="HRMS, Access Control, Attendance System"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes about the biometric system"
                    rows={3}
                  />
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
                    Add Biometric System
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
            <CardTitle className="text-sm font-medium">Total Systems</CardTitle>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{totalSystems}</div>
            <p className="text-xs text-muted-foreground">
              Biometric access systems
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Systems</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{activeSystems}</div>
            <p className="text-xs text-muted-foreground">
              Currently operational
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{totalEnrolledUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total user registrations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{utilizationRate}%</div>
            <div className="mt-2">
              <Progress value={utilizationRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by System Name, Brand, Model, Serial Number, IP Address..."
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="fault">Fault</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="fingerprint_scanner">Fingerprint</SelectItem>
                  <SelectItem value="face_recognition">Face Recognition</SelectItem>
                  <SelectItem value="iris_scanner">Iris Scanner</SelectItem>
                  <SelectItem value="palm_scanner">Palm Scanner</SelectItem>
                  <SelectItem value="access_controller">Access Controller</SelectItem>
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
            Showing {filteredSystems.length} of {biometricSystems?.length || 0} biometric systems
          </div>
        </CardContent>
      </Card>

      {/* Biometric Systems Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Access Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSystems.map((system) => {
                const SystemIcon = getSystemTypeIcon(system.systemType)
                const utilizationPercent = system.maxUsers && system.enrolledUsers 
                  ? Math.round((system.enrolledUsers / system.maxUsers) * 100)
                  : 0
                
                return (
                  <TableRow key={system.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <SystemIcon className="h-8 w-8 p-1.5 bg-muted rounded-full" />
                        <div>
                          <div className="font-medium">{system.systemName}</div>
                          <div className="text-sm text-muted-foreground">
                            {system.serialNumber || "No serial number"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getSystemTypeLabel(system.systemType)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{system.brand}</div>
                        <div className="text-sm text-muted-foreground">
                          {system.model}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {getLocationName(system.locationId)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {system.enrolledUsers && system.maxUsers ? (
                          <div>
                            <div className="font-medium">{system.enrolledUsers} / {system.maxUsers}</div>
                            <div className="text-xs text-muted-foreground">
                              {utilizationPercent}% used
                            </div>
                          </div>
                        ) : (
                          "Not specified"
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getAccessLevelBadgeColor(system.accessLevel)}
                      >
                        {getAccessLevelLabel(system.accessLevel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusBadgeColor(system.status)}
                      >
                        {system.status}
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
                              setSelectedSystem(system)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit System
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configure
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove System
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

      {/* View System Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Biometric System Details</DialogTitle>
            <DialogDescription>
              View authentication system specifications, enrolled user count, access permissions, and synchronization status
            </DialogDescription>
          </DialogHeader>
          {selectedSystem && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Name</Label>
                  <div className="text-sm p-2 bg-muted rounded font-medium">
                    {selectedSystem.systemName}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">System Type</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {getSystemTypeLabel(selectedSystem.systemType)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Brand</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.brand}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Model</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.model}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Serial Number</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.serialNumber || "Not specified"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {getLocationName(selectedSystem.locationId)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">IP Address</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.ipAddress || "Not configured"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Access Level</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    <Badge className={getAccessLevelBadgeColor(selectedSystem.accessLevel)}>
                      {getAccessLevelLabel(selectedSystem.accessLevel)}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Enrolled Users</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.enrolledUsers || "0"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Max Capacity</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.maxUsers || "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Utilization</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.maxUsers && selectedSystem.enrolledUsers 
                      ? `${Math.round((selectedSystem.enrolledUsers / selectedSystem.maxUsers) * 100)}%`
                      : "N/A"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Installation Date</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatDate(selectedSystem.installationDate)}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Warranty Until</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.warrantyUntil ? formatDate(selectedSystem.warrantyUntil) : "No warranty"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    <Badge className={getStatusBadgeColor(selectedSystem.status)}>
                      {selectedSystem.status}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Firmware Version</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.firmwareVersion || "Not specified"}
                  </div>
                </div>
              </div>

              {selectedSystem.integrationSystem && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Integration System</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.integrationSystem}
                  </div>
                </div>
              )}

              {selectedSystem.lastSyncDate && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Sync</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {formatDateTime(selectedSystem.lastSyncDate)}
                  </div>
                </div>
              )}

              {selectedSystem.maintenanceContract && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Maintenance Contract</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.maintenanceContract}
                  </div>
                </div>
              )}

              {selectedSystem.notes && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Notes</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.notes}
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