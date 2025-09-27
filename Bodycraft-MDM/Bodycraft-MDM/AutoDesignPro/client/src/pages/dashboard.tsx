import { useQuery } from "@tanstack/react-query"
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
    <div className="p-6 space-y-6" data-testid="dashboard-page">
      {/* Header with System Health */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="title-dashboard">Dashboard</h1>
          <p className="text-muted-foreground">
            Comprehensive overview of BODYCRAFT IT asset management system across {totalLocations} locations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">System Health</div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{overallSystemHealth}%</div>
              {overallSystemHealth >= 90 ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : overallSystemHealth >= 70 ? (
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-500" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card data-testid="card-total-assets">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Laptop className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-assets">{totalAssets}</div>
            <p className="text-xs text-muted-foreground">
              Worth ₹{(totalAssetValue / 100000).toFixed(1)}L • {totalLocations} locations
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-assigned-assets">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Utilization</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-assigned-assets">{assignmentRate}%</div>
            <p className="text-xs text-muted-foreground">
              {activeAssignments} assigned • {availableAssets} available
            </p>
            <Progress value={assignmentRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-maintenance-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{maintenanceDue}</div>
            <p className="text-xs text-muted-foreground">
              Due • {maintenanceInProgress} in progress • {maintenanceCompleted} completed
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-system-health">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetHealthScore}%</div>
            <p className="text-xs text-muted-foreground">
              Asset reliability • {expiringSoon} warranties expiring
            </p>
            <Progress value={assetHealthScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Integration Systems Overview */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CCTV Systems</CardTitle>
            <Camera className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{cctvActive}/{cctvSystems}</div>
                <p className="text-xs text-muted-foreground">{totalCameras} cameras active</p>
              </div>
              <Badge variant={cctvHealthScore >= 90 ? "default" : "destructive"}>
                {cctvHealthScore}% uptime
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Biometric Systems</CardTitle>
            <Fingerprint className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{biometricActive}/{biometricSystems}</div>
                <p className="text-xs text-muted-foreground">{enrolledUsers} users enrolled</p>
              </div>
              <Badge variant={biometricHealthScore >= 90 ? "default" : "destructive"}>
                {biometricHealthScore}% uptime
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Financial Overview</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-2xl font-bold">₹{(maintenanceCosts / 100000).toFixed(1)}L</div>
                <p className="text-xs text-muted-foreground">Total maintenance spend</p>
              </div>
              <div className="text-xs">
                Avg asset cost: ₹{avgAssetCost.toLocaleString('en-IN')}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Asset Distribution by Type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Distribution by Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetTypeDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded"></div>
                    <span className="text-sm capitalize">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full" 
                        style={{width: `${totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0}%`}}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count as number}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        {/* Asset Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetStatusDistribution).map(([status, count]) => {
              const percentage = totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0
              const statusColors = {
                assigned: "bg-blue-500",
                available: "bg-green-500", 
                maintenance: "bg-yellow-500",
                retired: "bg-red-500"
              }
              const statusColor = statusColors[status as keyof typeof statusColors] || "bg-gray-500"
              
              return (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`${statusColor.replace('bg-', 'border-')} text-xs`}>
                      {count as number}
                    </Badge>
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {percentage.toFixed(1)}%
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assets by Location</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(locationDistribution)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5) // Show top 5 locations
              .map(([location, count]) => (
                <div key={location} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{width: `${totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0}%`}}
                      ></div>
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count as number}</span>
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities and Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentAssignments.length > 0 ? (
              recentAssignments.slice(0, 6).map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="mt-0.5">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">
                      {item.asset?.assetId} assigned to {item.employee?.firstName} {item.employee?.lastName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.asset?.brand} {item.asset?.modelName}</span>
                      <span>•</span>
                      <span>{new Date(item.assignedDate).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">No recent activities</div>
            )}
          </CardContent>
        </Card>

        {/* Asset Condition Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Asset Condition Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(assetConditions)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .map(([condition, count]) => {
                const percentage = totalAssets > 0 ? ((count as number) / totalAssets) * 100 : 0
                const conditionColors = {
                  excellent: "bg-green-500",
                  good: "bg-blue-500",
                  fair: "bg-yellow-500", 
                  poor: "bg-red-500"
                }
                const conditionColor = conditionColors[condition as keyof typeof conditionColors] || "bg-gray-500"
                
                return (
                  <div key={condition} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm capitalize font-medium">{condition}</span>
                      <span className="text-sm text-muted-foreground">
                        {count as number} assets ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`${conditionColor} h-2 rounded-full`} 
                        style={{width: `${percentage}%`}}
                      ></div>
                    </div>
                  </div>
                )
              })}
            
            {expiringSoon > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    {expiringSoon} asset{expiringSoon > 1 ? 's' : ''} warranty expiring within 90 days
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <p className="text-sm text-muted-foreground">Common tasks and management actions</p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Laptop className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Add Asset</div>
                <div className="text-xs text-muted-foreground">Register new equipment</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Users className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Assign Asset</div>
                <div className="text-xs text-muted-foreground">Assign to employee</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Wrench className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">Schedule Maintenance</div>
                <div className="text-xs text-muted-foreground">Preventive service</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Eye className="h-5 w-5" />
              <div className="text-center">
                <div className="font-medium">View Reports</div>
                <div className="text-xs text-muted-foreground">Analytics & insights</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}