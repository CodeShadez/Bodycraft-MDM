import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Camera, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Monitor,
  HardDrive,
  Wifi,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  Power,
  Shield,
  Video
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

interface CCTVSystem {
  id: number
  systemName: string
  systemType: "nvr" | "dvr" | "ip_camera" | "analog_camera" | "monitoring_station"
  brand: string
  model: string
  serialNumber: string | null
  ipAddress: string | null
  macAddress: string | null
  locationId: number
  installationDate: string
  warrantyUntil: string | null
  status: "active" | "inactive" | "maintenance" | "fault"
  cameraCount: number | null
  storageCapacity: string | null
  recordingQuality: string | null
  remoteAccess: boolean
  maintenanceContract: string | null
  lastMaintenanceDate: string | null
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
  nvr: HardDrive,
  dvr: HardDrive,
  ip_camera: Camera,
  analog_camera: Video,
  monitoring_station: Monitor
}

export default function CCTVPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedSystem, setSelectedSystem] = useState<CCTVSystem | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Mock CCTV data - In real app, this would come from API
  const mockCCTVData: CCTVSystem[] = [
    {
      id: 1,
      systemName: "JP Nagar Store Main NVR",
      systemType: "nvr",
      brand: "Hikvision",
      model: "DS-7616NI-I2/16P",
      serialNumber: "HV123456789",
      ipAddress: "192.168.1.100",
      macAddress: "00:11:22:33:44:55",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2027-01-15",
      status: "active",
      cameraCount: 16,
      storageCapacity: "8TB",
      recordingQuality: "4MP",
      remoteAccess: true,
      maintenanceContract: "SecureTech Solutions",
      lastMaintenanceDate: "2024-01-10",
      notes: "Main surveillance system for store entrance, cash counter, and storage areas",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-10T10:30:00Z"
    },
    {
      id: 2,
      systemName: "Entrance Camera Bank 1",
      systemType: "ip_camera",
      brand: "Dahua",
      model: "IPC-HDBW4231E-AS",
      serialNumber: "DH987654321",
      ipAddress: "192.168.1.101",
      macAddress: "00:11:22:33:44:66",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2026-01-15",
      status: "active",
      cameraCount: 4,
      storageCapacity: null,
      recordingQuality: "2MP",
      remoteAccess: true,
      maintenanceContract: "SecureTech Solutions",
      lastMaintenanceDate: "2024-01-10",
      notes: "Covers main entrance, customer parking, and loading dock",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-10T10:30:00Z"
    },
    {
      id: 3,
      systemName: "Koramangala DVR System", 
      systemType: "dvr",
      brand: "CP Plus",
      model: "CP-UVR-0801E1-CS",
      serialNumber: "CP555666777",
      ipAddress: "192.168.1.150",
      macAddress: "00:11:22:33:44:77",
      locationId: 2,
      installationDate: "2023-12-01",
      warrantyUntil: "2025-12-01",
      status: "maintenance",
      cameraCount: 8,
      storageCapacity: "2TB",
      recordingQuality: "1080p",
      remoteAccess: false,
      maintenanceContract: "Local Security Services",
      lastMaintenanceDate: "2024-01-05",
      notes: "Scheduled for upgrade to IP system. Current analog cameras need replacement",
      createdAt: "2023-12-01T00:00:00Z",
      updatedAt: "2024-01-05T14:20:00Z"
    },
    {
      id: 4,
      systemName: "Store Monitoring Station",
      systemType: "monitoring_station",
      brand: "Samsung",
      model: "SRN-4000-2TB",
      serialNumber: "SM111222333",
      ipAddress: "192.168.1.200",
      macAddress: "00:11:22:33:44:88",
      locationId: 1,
      installationDate: "2024-01-15",
      warrantyUntil: "2027-01-15",
      status: "active",
      cameraCount: null,
      storageCapacity: "2TB",
      recordingQuality: null,
      remoteAccess: true,
      maintenanceContract: "Samsung Care",
      lastMaintenanceDate: null,
      notes: "Central monitoring workstation for security personnel",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z"
    }
  ]

  // Fetch data
  const { data: locations } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Use mock data for CCTV systems
  const cctvSystems = mockCCTVData

  // Filter CCTV systems
  const filteredSystems = cctvSystems?.filter(system => {
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

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800"
      case "inactive": return "bg-gray-100 text-gray-800"
      case "maintenance": return "bg-yellow-100 text-yellow-800"
      case "fault": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getSystemTypeIcon = (type: string) => {
    return systemTypeIcons[type] || Settings
  }

  const getSystemTypeLabel = (type: string) => {
    switch (type) {
      case "nvr": return "Network Video Recorder"
      case "dvr": return "Digital Video Recorder"
      case "ip_camera": return "IP Camera"
      case "analog_camera": return "Analog Camera"
      case "monitoring_station": return "Monitoring Station"
      default: return type.charAt(0).toUpperCase() + type.slice(1)
    }
  }

  // Calculate system metrics
  const totalSystems = cctvSystems.length
  const activeSystems = cctvSystems.filter(s => s.status === "active").length
  const faultySystems = cctvSystems.filter(s => s.status === "fault").length
  const totalCameras = cctvSystems.reduce((sum, s) => sum + (s.cameraCount || 0), 0)
  const systemHealth = totalSystems > 0 ? Math.round((activeSystems / totalSystems) * 100) : 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">CCTV Systems</h1>
          <p className="text-white/70">
            Monitor and manage surveillance systems across all BODYCRAFT locations
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
                Add CCTV System
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add CCTV System</DialogTitle>
                <DialogDescription>
                  Configure new surveillance infrastructure with network settings, capacity details, and security parameters
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="systemName">System Name *</Label>
                    <Input
                      id="systemName"
                      name="systemName"
                      placeholder="Main Store NVR"
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
                        <SelectItem value="nvr">Network Video Recorder</SelectItem>
                        <SelectItem value="dvr">Digital Video Recorder</SelectItem>
                        <SelectItem value="ip_camera">IP Camera</SelectItem>
                        <SelectItem value="analog_camera">Analog Camera</SelectItem>
                        <SelectItem value="monitoring_station">Monitoring Station</SelectItem>
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
                      placeholder="Hikvision, Dahua, CP Plus"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Model *</Label>
                    <Input
                      id="model"
                      name="model"
                      placeholder="DS-7616NI-I2/16P"
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
                      placeholder="HV123456789"
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
                      placeholder="192.168.1.100"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="macAddress">MAC Address</Label>
                    <Input
                      id="macAddress"
                      name="macAddress"
                      placeholder="00:11:22:33:44:55"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="installationDate">Installation Date *</Label>
                    <Input
                      id="installationDate"
                      name="installationDate"
                      type="date"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="warrantyUntil">Warranty Until</Label>
                    <Input
                      id="warrantyUntil"
                      name="warrantyUntil"
                      type="date"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cameraCount">Camera Count</Label>
                    <Input
                      id="cameraCount"
                      name="cameraCount"
                      type="number"
                      placeholder="16"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="storageCapacity">Storage Capacity</Label>
                    <Input
                      id="storageCapacity"
                      name="storageCapacity"
                      placeholder="8TB"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes about the system configuration"
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
                    Add CCTV System
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
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{totalSystems}</div>
            <p className="text-xs text-muted-foreground">
              All surveillance systems
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
              Operational systems
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cameras</CardTitle>
            <Video className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{totalCameras}</div>
            <p className="text-xs text-muted-foreground">
              Across all systems
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{systemHealth}%</div>
            <div className="mt-2">
              <Progress value={systemHealth} className="h-2" />
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
                  <SelectItem value="nvr">NVR Systems</SelectItem>
                  <SelectItem value="dvr">DVR Systems</SelectItem>
                  <SelectItem value="ip_camera">IP Cameras</SelectItem>
                  <SelectItem value="analog_camera">Analog Cameras</SelectItem>
                  <SelectItem value="monitoring_station">Monitoring Stations</SelectItem>
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
            Showing {filteredSystems.length} of {cctvSystems?.length || 0} CCTV systems
          </div>
        </CardContent>
      </Card>

      {/* CCTV Systems Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>System</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Network</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Cameras</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSystems.map((system) => {
                const SystemIcon = getSystemTypeIcon(system.systemType)
                
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
                        {system.ipAddress ? (
                          <div>
                            <div>{system.ipAddress}</div>
                            {system.remoteAccess && (
                              <Badge variant="outline" className="text-xs">
                                <Wifi className="h-2 w-2 mr-1" />
                                Remote
                              </Badge>
                            )}
                          </div>
                        ) : (
                          "No IP configured"
                        )}
                      </div>
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
                      <div className="text-center">
                        {system.cameraCount ? (
                          <div className="flex items-center gap-1">
                            <Camera className="h-3 w-3" />
                            {system.cameraCount}
                          </div>
                        ) : (
                          "N/A"
                        )}
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
            <DialogTitle>CCTV System Details</DialogTitle>
            <DialogDescription>
              View surveillance system specifications, network configuration, storage capacity, and operational status
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
                  <Label className="text-sm font-medium">MAC Address</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.macAddress || "Not specified"}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Camera Count</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.cameraCount || "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Storage</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.storageCapacity || "N/A"}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Recording Quality</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.recordingQuality || "N/A"}
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
                  <Label className="text-sm font-medium">Remote Access</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.remoteAccess ? (
                      <Badge variant="outline" className="text-green-600">
                        <Wifi className="h-3 w-3 mr-1" />
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Disabled
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {selectedSystem.maintenanceContract && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Maintenance Contract</Label>
                  <div className="text-sm p-2 bg-muted rounded">
                    {selectedSystem.maintenanceContract}
                    {selectedSystem.lastMaintenanceDate && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last maintenance: {formatDate(selectedSystem.lastMaintenanceDate)}
                      </div>
                    )}
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