import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { 
  FileText, 
  Plus, 
  Search, 
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  TrendingUp,
  Clock,
  Users,
  Laptop,
  MapPin,
  Wrench,
  Building,
  Eye,
  Edit,
  Trash2,
  Play,
  Settings,
  Save
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

// TypeScript interfaces
interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

interface ReportTemplate {
  id: string
  name: string
  description: string
  category: "assets" | "maintenance" | "assignments" | "locations" | "compliance"
  icon: any
  color: string
  fields: string[]
  filters: string[]
  lastRun?: string
  totalRuns: number
}

interface CustomReport {
  id: string
  name: string
  description: string
  entity: "assets" | "employees" | "assignments" | "maintenance" | "locations"
  fields: string[]
  filters: Record<string, any>
  createdDate: string
  createdBy: string
  lastRun?: string
  totalRuns: number
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("templates")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Custom report builder state
  const [reportName, setReportName] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [selectedEntity, setSelectedEntity] = useState("")
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const [reportFilters, setReportFilters] = useState<Record<string, any>>({})
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch locations for filtering
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Fetch report templates from API
  const { data: reportTemplates = [], isLoading: templatesLoading } = useQuery<ReportTemplate[]>({
    queryKey: ["/api/reports/templates"],
  })

  // Fetch custom reports from API
  const { data: customReports = [], isLoading: customReportsLoading } = useQuery<CustomReport[]>({
    queryKey: ["/api/reports/custom"],
  })

  // Helper functions (moved above usage)
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "assets": return Laptop
      case "maintenance": return Wrench
      case "assignments": return Users
      case "locations": return MapPin
      case "compliance": return Building
      default: return FileText
    }
  }

  const getCategoryColorClass = (category: string) => {
    switch (category) {
      case "assets": return "bg-blue-400"
      case "maintenance": return "bg-orange-500"
      case "assignments": return "bg-green-400"
      case "locations": return "bg-purple-400"
      case "compliance": return "bg-red-400"
      default: return "bg-gray-500"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "assets": return "text-blue-600 bg-blue-50"
      case "maintenance": return "text-orange-600 bg-orange-50"
      case "assignments": return "text-green-600 bg-green-50"
      case "locations": return "text-purple-600 bg-purple-50"
      case "compliance": return "text-red-600 bg-red-50"
      default: return "text-gray-600 bg-gray-50"
    }
  }

  // Add icons and colors to templates (using real data from API)
  const enrichedTemplates = reportTemplates.map(template => ({
    ...template,
    icon: getCategoryIcon(template.category),
    color: getCategoryColorClass(template.category)
  }))

  // Entity field mappings for custom report builder
  const entityFields = {
    assets: [
      { id: "assetId", label: "Asset ID", type: "text" },
      { id: "assetType", label: "Asset Type", type: "text" }, 
      { id: "brand", label: "Brand", type: "text" },
      { id: "model", label: "Model", type: "text" },
      { id: "serialNumber", label: "Serial Number", type: "text" },
      { id: "purchaseDate", label: "Purchase Date", type: "date" },
      { id: "purchaseCost", label: "Purchase Cost", type: "number" },
      { id: "warrantyUntil", label: "Warranty Until", type: "date" },
      { id: "status", label: "Status", type: "select" },
      { id: "condition", label: "Condition", type: "select" },
      { id: "location", label: "Location", type: "select" }
    ],
    employees: [
      { id: "employeeCode", label: "Employee Code", type: "text" },
      { id: "firstName", label: "First Name", type: "text" },
      { id: "lastName", label: "Last Name", type: "text" },
      { id: "email", label: "Email", type: "text" },
      { id: "department", label: "Department", type: "select" },
      { id: "position", label: "Position", type: "text" },
      { id: "location", label: "Location", type: "select" }
    ],
    assignments: [
      { id: "assetId", label: "Asset ID", type: "text" },
      { id: "employeeCode", label: "Employee Code", type: "text" },
      { id: "employeeName", label: "Employee Name", type: "text" },
      { id: "assignedDate", label: "Assigned Date", type: "date" },
      { id: "returnedDate", label: "Returned Date", type: "date" },
      { id: "duration", label: "Duration (Days)", type: "number" },
      { id: "notes", label: "Notes", type: "text" }
    ],
    maintenance: [
      { id: "assetId", label: "Asset ID", type: "text" },
      { id: "maintenanceType", label: "Maintenance Type", type: "select" },
      { id: "description", label: "Description", type: "text" },
      { id: "scheduledDate", label: "Scheduled Date", type: "date" },
      { id: "completedDate", label: "Completed Date", type: "date" },
      { id: "cost", label: "Cost", type: "number" },
      { id: "vendor", label: "Vendor", type: "text" },
      { id: "status", label: "Status", type: "select" }
    ],
    locations: [
      { id: "outletName", label: "Outlet Name", type: "text" },
      { id: "city", label: "City", type: "text" },
      { id: "state", label: "State", type: "text" },
      { id: "manager", label: "Manager", type: "text" },
      { id: "contactEmail", label: "Contact Email", type: "text" },
      { id: "contactPhone", label: "Contact Phone", type: "text" }
    ]
  }

  // Handle template report generation
  const handleRunTemplate = async (template: ReportTemplate, format: string = 'excel') => {
    try {
      toast({
        title: "Generating Report",
        description: `Generating ${template.name}...`
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: template.id,
          filters: {},
          format: format
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }

      if (format === 'excel' || format === 'csv') {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const contentDisposition = response.headers.get('Content-Disposition')
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
          : `${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.${format}`
        
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Report Downloaded",
          description: `${template.name} has been downloaded successfully`
        })
      } else {
        // Handle JSON response
        const data = await response.json()
        toast({
          title: "Report Generated",
          description: `Generated ${data.rowCount} records for ${template.name}`
        })
      }
    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle custom report creation
  const handleCreateCustomReport = async () => {
    if (!reportName || !selectedEntity) {
      toast({
        title: "Error", 
        description: "Please fill in required fields",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: reportName,
          description: reportDescription,
          entity: selectedEntity,
          fields: selectedFields,
          filters: reportFilters
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to create custom report: ${response.statusText}`)
      }

      const newReport = await response.json()

      toast({
        title: "Success",
        description: `Custom report "${reportName}" has been created`
      })

      // Reset form
      setReportName("")
      setReportDescription("")
      setSelectedEntity("")
      setSelectedFields([])
      setReportFilters({})
      setIsCreateDialogOpen(false)

      // Refetch custom reports to update the list
      queryClient.invalidateQueries({ queryKey: ["/api/reports/custom"] })

    } catch (error) {
      console.error('Error creating custom report:', error)
      toast({
        title: "Error",
        description: "Failed to create custom report. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Handle custom report generation
  const handleRunCustomReport = async (report: CustomReport, format: string = 'excel') => {
    try {
      toast({
        title: "Generating Report",
        description: `Generating ${report.name}...`
      })

      const response = await fetch(`/api/reports/custom/${report.id}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: format
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate custom report: ${response.statusText}`)
      }

      if (format === 'excel') {
        // Handle file download
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const filename = `${report.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`
        
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        toast({
          title: "Report Downloaded", 
          description: `${report.name} has been downloaded successfully`
        })
      }
    } catch (error) {
      console.error('Error generating custom report:', error)
      toast({
        title: "Error",
        description: "Failed to generate custom report. Please try again.",
        variant: "destructive"
      })
    }
  }

  // Filter enriched templates based on search
  const filteredTemplates = enrichedTemplates.filter(template => 
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filter custom reports based on search
  const filteredCustomReports = customReports.filter(report => 
    report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Reports</h1>
          <p className="text-white/70">
            Generate comprehensive reports and analytics for enterprise master data management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Clock className="h-4 w-4" />
            Scheduled Reports
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Custom Report
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Report</DialogTitle>
                <DialogDescription>
                  Design analytics dashboards with customizable data sources, field selection, and advanced filtering criteria
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Report Basic Info */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reportName">Report Name *</Label>
                    <Input
                      id="reportName"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="Enter report name"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="reportDescription">Description</Label>
                    <Textarea
                      id="reportDescription"
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="Describe what this report will show"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="entity">Data Source *</Label>
                    <Select value={selectedEntity} onValueChange={setSelectedEntity}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assets">Assets</SelectItem>
                        <SelectItem value="employees">Employees</SelectItem>
                        <SelectItem value="assignments">Assignments</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="locations">Locations</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Field Selection */}
                {selectedEntity && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label className="text-base font-medium">Report Fields</Label>
                      <p className="text-sm text-muted-foreground">Select which fields to include in your report</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                      {entityFields[selectedEntity as keyof typeof entityFields]?.map((field) => (
                        <label key={field.id} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedFields.includes(field.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFields([...selectedFields, field.id])
                              } else {
                                setSelectedFields(selectedFields.filter(f => f !== field.id))
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{field.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filters */}
                {selectedEntity && (
                  <div className="space-y-4">
                    <Separator />
                    <div>
                      <Label className="text-base font-medium">Filters</Label>
                      <p className="text-sm text-muted-foreground">Add filters to refine your report data</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Select 
                          value={reportFilters.location || ""} 
                          onValueChange={(value) => setReportFilters({...reportFilters, location: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All locations" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Locations</SelectItem>
                            {locations.map(location => (
                              <SelectItem key={location.id} value={location.id.toString()}>
                                {location.outletName}, {location.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Date Range</Label>
                        <Select 
                          value={reportFilters.dateRange || ""} 
                          onValueChange={(value) => setReportFilters({...reportFilters, dateRange: value})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">All Time</SelectItem>
                            <SelectItem value="last7days">Last 7 Days</SelectItem>
                            <SelectItem value="last30days">Last 30 Days</SelectItem>
                            <SelectItem value="last3months">Last 3 Months</SelectItem>
                            <SelectItem value="last6months">Last 6 Months</SelectItem>
                            <SelectItem value="lastyear">Last Year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCustomReport}>
                  Create Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Report Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{enrichedTemplates.length}</div>
            <p className="text-xs text-muted-foreground">Pre-built reports available</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custom Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{customReports.length}</div>
            <p className="text-xs text-muted-foreground">User-created reports</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reports Run</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {enrichedTemplates.reduce((sum, r) => sum + (r.totalRuns || 0), 0) + 
               customReports.reduce((sum, r) => sum + (r.totalRuns || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Export Formats</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">3</div>
            <p className="text-xs text-muted-foreground">Excel, CSV, PDF</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Report Templates</TabsTrigger>
          <TabsTrigger value="custom">Custom Reports</TabsTrigger>
        </TabsList>

        {/* Report Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const IconComponent = template.icon
              return (
                <Card key={template.id} className="glass-card border-0 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${template.color}`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className={getCategoryColor(template.category)}>
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      {template.description}
                    </p>
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Fields: {template.fields.length}</span>
                      <span>Runs: {template.totalRuns}</span>
                      {template.lastRun && (
                        <span>Last: {new Date(template.lastRun).toLocaleDateString()}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleRunTemplate(template)}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Run Report
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Custom Reports Tab */}
        <TabsContent value="custom" className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Name</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Total Runs</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{report.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {report.entity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(report.createdDate).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      by {report.createdBy}
                    </div>
                  </TableCell>
                  <TableCell>
                    {report.lastRun ? (
                      <div className="text-sm">
                        {new Date(report.lastRun).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-white/70">Never</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {report.totalRuns}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Template Details Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Report Template Details</DialogTitle>
            <DialogDescription>
              {selectedTemplate?.description}
            </DialogDescription>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Category</Label>
                  <Badge variant="outline" className={getCategoryColor(selectedTemplate.category)}>
                    {selectedTemplate.category}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Total Runs</Label>
                  <div className="text-sm">{selectedTemplate.totalRuns}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">Included Fields</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.fields.map(field => (
                    <Badge key={field} variant="secondary" className="text-xs">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Available Filters</Label>
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.filters.map(filter => (
                    <Badge key={filter} variant="outline" className="text-xs">
                      {filter}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && handleRunTemplate(selectedTemplate)}>
              Run Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}