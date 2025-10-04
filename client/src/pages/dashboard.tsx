import { useQuery } from "@tanstack/react-query"
import { useLocation } from "wouter"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Laptop, 
  Users, 
  MapPin, 
  Wrench, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Camera,
  Fingerprint,
  Shield,
  DollarSign,
  Calendar,
  Activity,
  Server,
  Wifi,
  Database,
  AlertCircle,
  Eye
} from "lucide-react"

// TypeScript interfaces
interface Asset {
  assetId: string
  assetType: string
  brand: string
  modelName: string
  serialNumber: string
  purchaseDate: string
  purchaseCost: number
  warrantyUntil: string | null
  status: "assigned" | "available" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  locationId: number | null
}

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  email: string
  department: string
  position: string
  locationId: number | null
}

interface Assignment {
  id: number
  assetId: string
  employeeId: number
  assignedDate: string
  returnedDate: string | null
  notes: string | null
}

interface Maintenance {
  id: number
  assetId: string
  maintenanceType: "preventive" | "corrective" | "warranty"
  description: string
  scheduledDate: string
  completedDate: string | null
  cost: number | null
  vendor: string | null
  status: "scheduled" | "in_progress" | "completed" | "cancelled"
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
  manager: string | null
  contactEmail: string | null
  contactPhone: string | null
}

export default function Dashboard() {
  const [, setLocation] = useLocation()
  
  // Fetch all data for dashboard statistics
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: employees = [], isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  })

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  })

  const { data: maintenance = [], isLoading: maintenanceLoading } = useQuery<Maintenance[]>({
    queryKey: ["/api/maintenance"],
  })

  const { data: locations = [], isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Mock data for CCTV and Biometric systems (would come from API in real app)
  const cctvSystems = 4 // Total CCTV systems
  const cctvActive = 3 // Active systems
  const biometricSystems = 5 // Total biometric systems
  const biometricActive = 4 // Active systems
  const totalCameras = 28 // Total cameras across all systems
  const enrolledUsers = 252 // Total enrolled users in biometric systems

  // Calculate comprehensive statistics
  const totalAssets = assets.length
  const totalEmployees = employees.length
  const totalLocations = locations.length
  
  // Assignment statistics
  const activeAssignments = assignments.filter(a => !a.returnedDate).length
  const availableAssets = totalAssets - activeAssignments
  const assignmentRate = totalAssets > 0 ? Math.round((activeAssignments / totalAssets) * 100) : 0
  
  // Maintenance statistics  
  const maintenanceDue = maintenance.filter(m => !m.completedDate && m.status !== "cancelled").length
  const maintenanceCompleted = maintenance.filter(m => m.completedDate).length
  const maintenanceInProgress = maintenance.filter(m => !m.completedDate && m.status === "in_progress").length
  
  // Asset condition analysis
  const assetConditions = assets.reduce((acc, asset) => {
    acc[asset.condition] = (acc[asset.condition] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Asset distribution by type
  const assetTypeDistribution = assets.reduce((acc, asset) => {
    acc[asset.assetType] = (acc[asset.assetType] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Asset distribution by status
  const assetStatusDistribution = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Cost analysis
  const totalAssetValue = assets.reduce((sum, asset) => sum + (asset.purchaseCost || 0), 0)
  const avgAssetCost = totalAssets > 0 ? totalAssetValue / totalAssets : 0
  const maintenanceCosts = maintenance.reduce((sum, m) => sum + (m.cost || 0), 0)

  // Location distribution
  const locationDistribution = assets.reduce((acc, asset) => {
    if (asset.locationId) {
      const location = locations.find(l => l.id === asset.locationId)
      if (location) {
        const locationName = `${location.outletName}, ${location.city}`
        acc[locationName] = (acc[locationName] || 0) + 1
      }
    }
    return acc
  }, {} as Record<string, number>)

  // Recent activities (recent assignments with details)
  const recentAssignments = assignments
    .slice(-8)
    .reverse()
    .map(assignment => {
      const asset = assets.find(a => a.assetId === assignment.assetId)
      const employee = employees.find(e => e.id === assignment.employeeId)
      return {
        ...assignment,
        asset,
        employee
      }
    })
    .filter(item => item.asset && item.employee)

  // Warranty analysis
  const currentDate = new Date()
  const expiringSoon = assets.filter(asset => {
    if (!asset.warrantyUntil) return false
    const warrantyDate = new Date(asset.warrantyUntil)
    const daysUntilExpiry = (warrantyDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0
  }).length

  // System health scores
  const assetHealthScore = totalAssets > 0 ? Math.round(((totalAssets - maintenanceDue) / totalAssets) * 100) : 100
  const cctvHealthScore = cctvSystems > 0 ? Math.round((cctvActive / cctvSystems) * 100) : 100
  const biometricHealthScore = biometricSystems > 0 ? Math.round((biometricActive / biometricSystems) * 100) : 100
  const overallSystemHealth = Math.round((assetHealthScore + cctvHealthScore + biometricHealthScore) / 3)

  const isLoading = assetsLoading || employeesLoading || assignmentsLoading || maintenanceLoading || locationsLoading

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/4 mb-6"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in" data-testid="dashboard-page">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white" data-testid="title-dashboard">Dashboard</h1>
          <p className="text-white/70 mt-1">
            Centralized Master Data Management platform for IT asset lifecycle monitoring, resource allocation, and operational analytics.
          </p>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card 
          data-testid="card-total-assets" 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0 animate-slide-up"
          onClick={() => setLocation("/assets")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Total Assets</CardTitle>
            <Laptop className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-total-assets">{totalAssets}</div>
            <p className="text-xs text-white/60">
              Worth ₹{(totalAssetValue / 100000).toFixed(1)}L • {totalLocations} locations
            </p>
          </CardContent>
        </Card>

        <Card 
          data-testid="card-assigned-assets" 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0 animate-slide-up"
          style={{ animationDelay: "0.1s" }}
          onClick={() => setLocation("/assignments")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Asset Utilization</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white" data-testid="text-assigned-assets">{assignmentRate}%</div>
            <p className="text-xs text-white/60">
              {activeAssignments} assigned • {availableAssets} available
            </p>
            <Progress value={assignmentRate} className="mt-2 bg-white/10" />
          </CardContent>
        </Card>

        <Card 
          data-testid="card-maintenance-status" 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0 animate-slide-up"
          style={{ animationDelay: "0.2s" }}
          onClick={() => setLocation("/maintenance")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Maintenance Activities</CardTitle>
            <Wrench className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">{maintenanceDue}</div>
            <p className="text-xs text-white/60">
              Scheduled • {maintenanceInProgress} active • {maintenanceCompleted} completed
            </p>
          </CardContent>
        </Card>

        <Card 
          data-testid="card-warranty-status" 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0 animate-slide-up"
          style={{ animationDelay: "0.3s" }}
          onClick={() => setLocation("/assets")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Warranty Management</CardTitle>
            <Shield className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{expiringSoon}</div>
            <p className="text-xs text-white/60">
              Expiring within 90 days • Active monitoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Systems Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0"
          onClick={() => setLocation("/cctv")}
          data-testid="card-cctv-systems"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">CCTV Systems</CardTitle>
            <Camera className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{cctvActive}/{cctvSystems}</div>
                <p className="text-xs text-white/60">{totalCameras} cameras active</p>
              </div>
              <Badge variant={cctvHealthScore >= 90 ? "default" : "destructive"} className="bg-red-500/80 text-white border-0">
                {cctvHealthScore}% uptime
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0"
          onClick={() => setLocation("/biometric")}
          data-testid="card-biometric-systems"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Biometric Systems</CardTitle>
            <Fingerprint className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">{biometricActive}/{biometricSystems}</div>
                <p className="text-xs text-white/60">{enrolledUsers} users enrolled</p>
              </div>
              <Badge variant={biometricHealthScore >= 90 ? "default" : "destructive"} className="bg-red-500/80 text-white border-0">
                {biometricHealthScore}% uptime
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="glass-card glass-card-hover cursor-pointer transition-all duration-300 border-0"
          onClick={() => setLocation("/reports")}
          data-testid="card-financial-overview"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Financial Overview</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold text-white">₹{(maintenanceCosts / 100000).toFixed(1)}L</div>
                <p className="text-xs text-white/60">Total maintenance spend</p>
              </div>
              <div className="text-xs text-white/50">
                Avg asset cost: ₹{avgAssetCost.toLocaleString('en-IN')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Asset Distribution by Type */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg text-white/90">Asset Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetTypeDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded"></div>
                    <span className="text-sm capitalize text-white/80">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-white/10 rounded-full h-2">
                      <div 
                        className="bg-purple-400 h-2 rounded-full" 
                        style={{width: `${totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0}%`}}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right text-white">{count as number}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Asset Status Overview */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg text-white/90">Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetStatusDistribution).map(([status, count]) => {
              const percentage = totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0
              const statusColors = {
                assigned: "bg-blue-400",
                available: "bg-green-400", 
                maintenance: "bg-yellow-400",
                retired: "bg-red-400"
              }
              const statusColor = statusColors[status as keyof typeof statusColors] || "bg-gray-400"
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${statusColor} text-white border-0 text-xs`}>
                      {count as number}
                    </Badge>
                    <span className="text-sm capitalize text-white/80">{status}</span>
                  </div>
                  <span className="text-sm text-white/60">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Employee Distribution */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg text-white/90">Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/10">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-white/80">Total Personnel</span>
                </div>
                <span className="text-sm font-medium text-white">{totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/10">
                <div className="flex items-center gap-2">
                  <Laptop className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-white/80">Assets Deployed</span>
                </div>
                <span className="text-sm font-medium text-white">{activeAssignments}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/10">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-white/80">Available Inventory</span>
                </div>
                <span className="text-sm font-medium text-white">{availableAssets}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white/90">
              <Clock className="h-5 w-5 text-blue-400" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.length > 0 ? (
              recentAssignments.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/10">
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-white/90">
                      {item.asset?.assetId} assigned to {item.employee?.firstName} {item.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <span>{item.asset?.brand} {item.asset?.modelName}</span>
                      <span>•</span>
                      <span>{new Date(item.assignedDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60">No recent activities</div>
            )}
          </CardContent>
        </Card>

        {/* Asset Condition Analysis */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-white/90">
              <Shield className="h-5 w-5 text-purple-400" />
              Asset Condition Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetConditions)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([condition, count]) => {
                const percentage = totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0
                const conditionColors = {
                  excellent: "bg-green-400",
                  good: "bg-blue-400",
                  fair: "bg-yellow-400", 
                  poor: "bg-red-400"
                }
                const conditionColor = conditionColors[condition as keyof typeof conditionColors] || "bg-gray-400"
                
                return (
                  <div key={condition} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize font-medium text-white/90">{condition}</span>
                      <span className="text-sm text-white/60">
                        {count as number} assets ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div 
                        className={`${conditionColor} h-2 rounded-full`} 
                        style={{width: `${percentage}%`}}
                      ></div>
                    </div>
                  </div>
                )
              })}
            
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg text-white/90">Operational Actions</CardTitle>
          <p className="text-sm text-white/70">Streamlined access to core MDM functions</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 glass-card glass-card-hover border-white/20 text-white"
              onClick={() => setLocation("/assets")}
              data-testid="button-add-asset"
            >
              <Laptop className="h-5 w-5 text-purple-400" />
              <div className="text-center">
                <div className="font-medium">Register Asset</div>
                <div className="text-xs text-white/60">Add new inventory item</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 glass-card glass-card-hover border-white/20 text-white"
              onClick={() => setLocation("/assignments")}
              data-testid="button-assign-asset"
            >
              <Users className="h-5 w-5 text-blue-400" />
              <div className="text-center">
                <div className="font-medium">Deploy Asset</div>
                <div className="text-xs text-white/60">Resource allocation</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 glass-card glass-card-hover border-white/20 text-white"
              onClick={() => setLocation("/maintenance")}
              data-testid="button-schedule-maintenance"
            >
              <Wrench className="h-5 w-5 text-orange-400" />
              <div className="text-center">
                <div className="font-medium">Maintenance Schedule</div>
                <div className="text-xs text-white/60">Service management</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2 glass-card glass-card-hover border-white/20 text-white"
              onClick={() => setLocation("/reports")}
              data-testid="button-view-reports"
            >
              <Eye className="h-5 w-5 text-green-400" />
              <div className="text-center">
                <div className="font-medium">Analytics Portal</div>
                <div className="text-xs text-white/60">Data insights</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}