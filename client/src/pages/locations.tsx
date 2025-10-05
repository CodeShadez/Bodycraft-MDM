import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  MapPin, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  Upload,
  MoreHorizontal,
  Building2,
  Users,
  Laptop,
  Phone,
  Mail,
  User,
  Package,
  BarChart3,
  Clock,
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
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ExcelExporter, ExcelImporter } from "@/lib/excel"

interface Location {
  id: number
  outletName: string
  city: string
  state: string
  address: string
  managerName: string
  contactDetails: string
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

interface Employee {
  id: number
  employeeCode: string
  firstName: string
  lastName: string
  department: string
  locationId: number | null
  status: "active" | "inactive" | "on_leave"
}

interface Assignment {
  assetId: string
  employeeId: number
  assignedDate: string
  returnedDate: string | null
}

export default function LocationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [stateFilter, setStateFilter] = useState<string>("all")
  const [cityFilter, setCityFilter] = useState<string>("all")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [expandedLocationId, setExpandedLocationId] = useState<number | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Form state for Create Location dialog
  const [createForm, setCreateForm] = useState({
    outletName: '',
    city: '',
    state: '',
    address: '',
    managerName: '',
    contactDetails: ''
  })

  // Form state for Update Location dialog
  const [updateForm, setUpdateForm] = useState({
    outletName: '',
    city: '',
    state: '',
    address: '',
    managerName: '',
    contactDetails: ''
  })
  
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Reset create form when dialog opens
  useEffect(() => {
    if (isCreateDialogOpen) {
      setCreateForm({
        outletName: '',
        city: '',
        state: '',
        address: '',
        managerName: '',
        contactDetails: ''
      })
    }
  }, [isCreateDialogOpen])

  // Populate update form when selectedLocation changes
  useEffect(() => {
    if (selectedLocation && isEditDialogOpen) {
      setUpdateForm({
        outletName: selectedLocation.outletName,
        city: selectedLocation.city,
        state: selectedLocation.state,
        address: selectedLocation.address || '',
        managerName: selectedLocation.managerName || '',
        contactDetails: selectedLocation.contactDetails || ''
      })
    }
  }, [selectedLocation, isEditDialogOpen])

  // Fetch data
  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  const { data: assets } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  })

  const { data: assignments } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  })

  // Get unique states and cities for filter
  const states = Array.from(new Set(locations?.map(loc => loc.state) || []))
  const cities = Array.from(new Set(locations?.map(loc => loc.city) || []))

  // Filter locations
  const filteredLocations = locations?.filter(location => {
    const matchesSearch = 
      location.outletName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.address.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesState = stateFilter === "all" || location.state === stateFilter
    const matchesCity = cityFilter === "all" || location.city === cityFilter
    
    return matchesSearch && matchesState && matchesCity
  }) || []

  // Count active filters
  const activeFiltersCount = [
    stateFilter !== "all",
    cityFilter !== "all"
  ].filter(Boolean).length

  // Create location mutation
  const createLocationMutation = useMutation({
    mutationFn: async (locationData: any) => {
      const response = await fetch('/api/locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(locationData),
      })
      if (!response.ok) throw new Error('Failed to create location')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] })
      toast({ title: "Success", description: "Location created successfully" })
      setIsCreateDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create location", variant: "destructive" })
    }
  })

  // Update location mutation  
  const updateLocationMutation = useMutation({
    mutationFn: async ({ locationId, data }: { locationId: number, data: any }) => {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update location')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] })
      toast({ title: "Success", description: "Location updated successfully" })
      setIsEditDialogOpen(false)
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update location", variant: "destructive" })
    }
  })

  // Delete location mutation
  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: number) => {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete location')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/locations'] })
      toast({ title: "Success", description: "Location deleted successfully" })
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete location", variant: "destructive" })
    }
  })

  // Excel Export Handler
  const handleExport = () => {
    if (!locations || !assets || !employees || !assignments) {
      toast({ title: "Error", description: "Data not loaded yet", variant: "destructive" })
      return
    }
    
    try {
      ExcelExporter.exportLocations(locations, assets, employees, assignments)
      toast({ title: "Success", description: "Locations exported successfully" })
    } catch (error) {
      toast({ title: "Error", description: "Failed to export locations", variant: "destructive" })
    }
  }

  // Excel Import Handler
  const handleImport = async () => {
    if (!importFile) {
      toast({ title: "Error", description: "Please select a file", variant: "destructive" })
      return
    }

    setIsImporting(true)

    try {
      const data = await ExcelImporter.parseExcelFile(importFile)
      const { valid, errors } = ExcelImporter.validateLocationData(data)

      if (errors.length > 0) {
        toast({ 
          title: "Validation Errors", 
          description: `${errors.length} errors found. First error: ${errors[0]}`,
          variant: "destructive" 
        })
        setIsImporting(false)
        return
      }

      for (const locationData of valid) {
        await createLocationMutation.mutateAsync(locationData)
      }

      toast({ 
        title: "Success", 
        description: `Successfully imported ${valid.length} locations` 
      })
      setIsImportDialogOpen(false)
      setImportFile(null)
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to import locations", 
        variant: "destructive" 
      })
    } finally {
      setIsImporting(false)
    }
  }

  // Helper functions
  const getLocationAssets = (locationId: number) => {
    return assets?.filter(asset => asset.locationId === locationId) || []
  }

  const getLocationEmployees = (locationId: number) => {
    return employees?.filter(employee => employee.locationId === locationId) || []
  }

  const getActiveAssignments = (locationId: number) => {
    const locationEmployees = getLocationEmployees(locationId)
    const employeeIds = locationEmployees.map(emp => emp.id)
    return assignments?.filter(assignment => 
      employeeIds.includes(assignment.employeeId) && !assignment.returnedDate
    ) || []
  }

  const getAssetTypeDistribution = (locationId: number) => {
    const locationAssets = getLocationAssets(locationId)
    const distribution: Record<string, number> = {}
    locationAssets.forEach(asset => {
      distribution[asset.assetType] = (distribution[asset.assetType] || 0) + 1
    })
    return distribution
  }

  const handleCreateLocation = (event: React.FormEvent) => {
    event.preventDefault()

    // Validate required fields
    if (!createForm.outletName?.trim() || !createForm.city?.trim() || !createForm.state) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Outlet Name, City, State)",
        variant: "destructive",
      })
      return
    }
    
    const locationData = {
      outletName: createForm.outletName.trim(),
      city: createForm.city.trim(),
      state: createForm.state,
      address: createForm.address?.trim() || null,
      managerName: createForm.managerName?.trim() || null,
      contactDetails: createForm.contactDetails?.trim() || null,
    }

    createLocationMutation.mutate(locationData)
  }

  const handleUpdateLocation = (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedLocation) return

    // Validate required fields
    if (!updateForm.outletName?.trim() || !updateForm.city?.trim() || !updateForm.state) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields (Outlet Name, City, State)",
        variant: "destructive",
      })
      return
    }
    
    const locationData = {
      outletName: updateForm.outletName.trim(),
      city: updateForm.city.trim(),
      state: updateForm.state,
      address: updateForm.address?.trim() || null,
      managerName: updateForm.managerName?.trim() || null,
      contactDetails: updateForm.contactDetails?.trim() || null,
    }

    updateLocationMutation.mutate({ locationId: selectedLocation.id, data: locationData })
  }

  if (locationsLoading) {
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Locations</h1>
          <p className="text-white/70">
            Organizational site management with regional analytics and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="button-import-excel">
                <Upload className="h-4 w-4" />
                Import Excel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Locations from Excel</DialogTitle>
                <DialogDescription>
                  Upload an Excel file to import locations. Download the template for the correct format.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-file">Excel File</Label>
                  <Input
                    id="import-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    data-testid="input-import-file"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => ExcelImporter.downloadLocationTemplate()}
                  data-testid="button-download-template"
                >
                  Download Template
                </Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} data-testid="button-cancel-import">
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={!importFile || isImporting} data-testid="button-confirm-import">
                  {isImporting ? "Importing..." : "Import"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2" onClick={handleExport} data-testid="button-export">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Location</DialogTitle>
                <DialogDescription>
                  Establish new outlet with geographic details, contact information, and operational parameters
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="outletName">Outlet Name *</Label>
                    <Input
                      id="outletName"
                      value={createForm.outletName}
                      onChange={(e) => setCreateForm({ ...createForm, outletName: e.target.value })}
                      placeholder="JP Nagar Outlet"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={createForm.city}
                      onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                      placeholder="Bangalore"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={createForm.state} onValueChange={(value) => setCreateForm({ ...createForm, state: value })} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Karnataka">Karnataka</SelectItem>
                      <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="Telangana">Telangana</SelectItem>
                      <SelectItem value="Kerala">Kerala</SelectItem>
                      <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="Gujarat">Gujarat</SelectItem>
                      <SelectItem value="Delhi">Delhi</SelectItem>
                      <SelectItem value="Punjab">Punjab</SelectItem>
                      <SelectItem value="Haryana">Haryana</SelectItem>
                      <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Complete Address *</Label>
                  <Input
                    id="address"
                    value={createForm.address}
                    onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                    placeholder="123 Main Street, JP Nagar, Bangalore"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="managerName">Manager Name *</Label>
                    <Input
                      id="managerName"
                      value={createForm.managerName}
                      onChange={(e) => setCreateForm({ ...createForm, managerName: e.target.value })}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactDetails">Contact Details *</Label>
                    <Input
                      id="contactDetails"
                      value={createForm.contactDetails}
                      onChange={(e) => setCreateForm({ ...createForm, contactDetails: e.target.value })}
                      placeholder="+91 9876543210, manager@bodycraft.com"
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
                  <Button type="submit" disabled={createLocationMutation.isPending}>
                    {createLocationMutation.isPending ? "Creating..." : "Create Location"}
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
            <CardTitle className="text-sm font-medium">Total Outlets</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{locations?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {states.length} states
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{assets?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Distributed across locations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">{employees?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Working across locations
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Assignments</CardTitle>
            <Laptop className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white/90">
              {assignments?.filter(a => !a.returnedDate).length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter Locations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                placeholder="Search by Outlet Name, City, Manager Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 pl-12 pr-12 backdrop-blur-sm border-border/40 focus:border-primary/50 transition-all"
                data-testid="input-search-locations"
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

          {/* Quick Filters - No quick filter for locations */}
          <div className="flex flex-wrap gap-2">
            {(stateFilter !== "all" || cityFilter !== "all") && (
              <Button
                onClick={() => {
                  setStateFilter("all")
                  setCityFilter("all")
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-muted/10 backdrop-blur-sm border border-border/40 animate-fade-in">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  State
                </label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-state">
                    <SelectValue placeholder="All States" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All States</SelectItem>
                    {states.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  City
                </label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="backdrop-blur-sm border-border/40" data-testid="select-filter-city">
                    <SelectValue placeholder="All Cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            Showing {filteredLocations.length} of {locations?.length || 0} locations
          </div>
        </CardContent>
      </Card>

      {/* Locations Table */}
      <Card className="glass-card border-0 glass-card border-0">
        <CardContent className="p-0 table-container-stable">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Assets</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Active Assignments</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.flatMap((location) => {
                const locationAssets = getLocationAssets(location.id)
                const locationEmployees = getLocationEmployees(location.id)
                const activeAssignments = getActiveAssignments(location.id)
                const isExpanded = expandedLocationId === location.id
                const rows = [
                  <TableRow 
                    key={`main-${location.id}`}
                    onClick={() => setExpandedLocationId(isExpanded ? null : location.id)}
                    className="hover:bg-muted/20 transition-all duration-150 border-b border-border/30 group cursor-pointer"
                    data-testid={`row-location-${location.id}`}
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
                        <Building2 className="h-8 w-8 p-1.5 bg-muted rounded-full" />
                        <div>
                          <div className="font-medium">{location.outletName}</div>
                          <div className="text-sm text-muted-foreground">
                            {location.city}, {location.state}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {location.managerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          {locationAssets.length} Total
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {locationAssets.filter(a => a.status === 'available').length} Available
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit">
                          {locationEmployees.length} Total
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {locationEmployees.filter(e => e.status === 'active').length} Active
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400" />
                        <span>{activeAssignments.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {location.contactDetails}
                      </div>
                    </TableCell>
                  </TableRow>
                ]

                if (isExpanded) {
                  rows.push(
                    <TableRow key={`expanded-${location.id}`} className="bg-muted/10 hover:bg-muted/10">
                      <TableCell colSpan={6} className="p-6">
                        <div className="grid grid-cols-3 gap-6">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Location Details</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Outlet Name</div>
                                <div className="text-sm mt-1 font-medium">{location.outletName}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Address</div>
                                <div className="text-sm mt-1">{location.address}</div>
                                <div className="text-sm mt-1">{location.city}, {location.state}</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Manager</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {location.managerName}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Contact Details</div>
                                <div className="text-sm mt-1">{location.contactDetails}</div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Asset Inventory</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Total Assets</div>
                                <div className="text-2xl font-bold mt-1">{locationAssets.length}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Available</span>
                                  <span className="font-medium">{locationAssets.filter(a => a.status === 'available').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Assigned</span>
                                  <span className="font-medium">{locationAssets.filter(a => a.status === 'assigned').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Maintenance</span>
                                  <span className="font-medium">{locationAssets.filter(a => a.status === 'maintenance').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Retired</span>
                                  <span className="font-medium">{locationAssets.filter(a => a.status === 'retired').length}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Personnel & Activity</h4>
                            <div className="space-y-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Total Employees</div>
                                <div className="text-2xl font-bold mt-1">{locationEmployees.length}</div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Active</span>
                                  <span className="font-medium">{locationEmployees.filter(e => e.status === 'active').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">On Leave</span>
                                  <span className="font-medium">{locationEmployees.filter(e => e.status === 'on_leave').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Inactive</span>
                                  <span className="font-medium">{locationEmployees.filter(e => e.status === 'inactive').length}</span>
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Active Assignments</div>
                                <div className="text-sm mt-1 flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-400" />
                                  <span className="font-medium">{activeAssignments.length}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-6 pt-4 border-t border-border/50">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLocation(location)
                              setIsViewDialogOpen(true)
                            }}
                            data-testid={`button-view-details-${location.id}`}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Full Analytics
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedLocation(location)
                              setIsEditDialogOpen(true)
                            }}
                            data-testid={`button-edit-location-${location.id}`}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Location
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (window.confirm(`Are you sure you want to delete ${location.outletName}? This action cannot be undone.`)) {
                                deleteLocationMutation.mutate(location.id)
                              }
                            }}
                            data-testid={`button-delete-location-${location.id}`}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Location
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

      {/* View Location Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Location Analytics - {selectedLocation?.outletName}</DialogTitle>
            <DialogDescription>
              Real-time performance metrics, resource allocation, and operational insights with detailed breakdowns
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Location Details</Label>
                  <div className="text-sm p-3 bg-muted rounded">
                    <div className="font-medium">{selectedLocation.outletName}</div>
                    <div>{selectedLocation.city}, {selectedLocation.state}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {selectedLocation.address}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Management</Label>
                  <div className="text-sm p-3 bg-muted rounded">
                    <div className="font-medium">{selectedLocation.managerName}</div>
                    <div className="text-xs text-muted-foreground">
                      {selectedLocation.contactDetails}
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="glass-card border-0 glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-lg font-bold">
                          {getLocationAssets(selectedLocation.id).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Assets</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-500" />
                      <div>
                        <div className="text-lg font-bold">
                          {getLocationEmployees(selectedLocation.id).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Employees</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Laptop className="h-4 w-4 text-purple-500" />
                      <div>
                        <div className="text-lg font-bold">
                          {getActiveAssignments(selectedLocation.id).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Active</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-card border-0 glass-card border-0">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <div>
                        <div className="text-lg font-bold">
                          {getLocationAssets(selectedLocation.id).filter(a => a.status === 'available').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Available</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Asset Type Distribution */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Asset Distribution by Type</Label>
                <div className="space-y-2">
                  {Object.entries(getAssetTypeDistribution(selectedLocation.id)).map(([type, count]) => {
                    const total = getLocationAssets(selectedLocation.id).length
                    const percentage = total > 0 ? (count / total) * 100 : 0
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="text-sm">{type}</div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                        <div className="flex items-center gap-2 w-32">
                          <Progress value={percentage} className="h-2" />
                          <div className="text-xs text-muted-foreground w-10">
                            {percentage.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
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

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Modify outlet details, management contacts, and regional configuration for {selectedLocation?.outletName}
            </DialogDescription>
          </DialogHeader>
          {selectedLocation && (
            <form onSubmit={handleUpdateLocation} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-outletName">Outlet Name *</Label>
                  <Input
                    id="edit-outletName"
                    value={updateForm.outletName}
                    onChange={(e) => setUpdateForm({ ...updateForm, outletName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-city">City *</Label>
                  <Input
                    id="edit-city"
                    value={updateForm.city}
                    onChange={(e) => setUpdateForm({ ...updateForm, city: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-state">State *</Label>
                <Select value={updateForm.state} onValueChange={(value) => setUpdateForm({ ...updateForm, state: value })} required>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Karnataka">Karnataka</SelectItem>
                    <SelectItem value="Tamil Nadu">Tamil Nadu</SelectItem>
                    <SelectItem value="Andhra Pradesh">Andhra Pradesh</SelectItem>
                    <SelectItem value="Telangana">Telangana</SelectItem>
                    <SelectItem value="Kerala">Kerala</SelectItem>
                    <SelectItem value="Maharashtra">Maharashtra</SelectItem>
                    <SelectItem value="Gujarat">Gujarat</SelectItem>
                    <SelectItem value="Delhi">Delhi</SelectItem>
                    <SelectItem value="Punjab">Punjab</SelectItem>
                    <SelectItem value="Haryana">Haryana</SelectItem>
                    <SelectItem value="Uttar Pradesh">Uttar Pradesh</SelectItem>
                    <SelectItem value="Rajasthan">Rajasthan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-address">Complete Address *</Label>
                <Input
                  id="edit-address"
                  value={updateForm.address}
                  onChange={(e) => setUpdateForm({ ...updateForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-managerName">Manager Name *</Label>
                  <Input
                    id="edit-managerName"
                    value={updateForm.managerName}
                    onChange={(e) => setUpdateForm({ ...updateForm, managerName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-contactDetails">Contact Details *</Label>
                  <Input
                    id="edit-contactDetails"
                    value={updateForm.contactDetails}
                    onChange={(e) => setUpdateForm({ ...updateForm, contactDetails: e.target.value })}
                    required
                  />
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
                <Button type="submit" disabled={updateLocationMutation.isPending}>
                  {updateLocationMutation.isPending ? "Updating..." : "Update Location"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}