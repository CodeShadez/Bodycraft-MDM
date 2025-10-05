import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { 
  Shield,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Package,
  Edit,
  Download,
  Filter,
  Clock
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface Asset {
  assetId: string
  modelName: string
  brand: string
  serviceTag: string | null
  assetType: string
  purchaseDate: string | null
  warrantyExpiry: string | null
  status: "available" | "assigned" | "maintenance" | "retired"
  condition: "excellent" | "good" | "fair" | "poor"
  locationId: number | null
  currentUserId: number | null
}

interface Location {
  id: number
  outletName: string
  city: string
  state: string
}

export default function WarrantyPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [warrantyDate, setWarrantyDate] = useState("")

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch data
  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  })

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  })

  // Update warranty mutation
  const updateWarrantyMutation = useMutation({
    mutationFn: async ({ assetId, warrantyExpiry }: { assetId: string, warrantyExpiry: string | null }) => {
      const response = await fetch(`/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ warrantyExpiry }),
        credentials: 'include'
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update warranty')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assets'] })
      toast({ title: "Success", description: "Warranty information updated successfully" })
      setIsEditDialogOpen(false)
      setSelectedAsset(null)
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update warranty", 
        variant: "destructive" 
      })
    }
  })

  // Calculate warranty statistics
  const currentDate = new Date()
  
  const assetsWithWarranty = assets.filter(asset => asset.warrantyExpiry)
  
  const activeWarranties = assetsWithWarranty.filter(asset => {
    const warrantyDate = new Date(asset.warrantyExpiry!)
    return warrantyDate > currentDate
  }).length

  const expiredWarranties = assetsWithWarranty.filter(asset => {
    const warrantyDate = new Date(asset.warrantyExpiry!)
    return warrantyDate <= currentDate
  }).length

  const expiringSoon = assetsWithWarranty.filter(asset => {
    const warrantyDate = new Date(asset.warrantyExpiry!)
    const daysUntilExpiry = (warrantyDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry > 0 && daysUntilExpiry <= 90
  }).length

  const noWarrantyInfo = assets.filter(asset => !asset.warrantyExpiry).length

  // Get warranty status
  const getWarrantyStatus = (warrantyExpiry: string | null) => {
    if (!warrantyExpiry) return { status: 'no-info', label: 'No Information', color: 'bg-gray-400', days: null }
    
    const warrantyDate = new Date(warrantyExpiry)
    const daysUntilExpiry = (warrantyDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    
    if (daysUntilExpiry < 0) {
      return { status: 'expired', label: 'Expired', color: 'bg-red-400', days: Math.abs(Math.floor(daysUntilExpiry)) }
    } else if (daysUntilExpiry <= 30) {
      return { status: 'critical', label: 'Expiring Soon (30 days)', color: 'bg-orange-400', days: Math.floor(daysUntilExpiry) }
    } else if (daysUntilExpiry <= 90) {
      return { status: 'warning', label: 'Expiring Soon (90 days)', color: 'bg-yellow-400', days: Math.floor(daysUntilExpiry) }
    } else {
      return { status: 'active', label: 'Active', color: 'bg-green-400', days: Math.floor(daysUntilExpiry) }
    }
  }

  // Get unique asset types for filter
  const assetTypes = Array.from(new Set(assets.map(asset => asset.assetType)))

  // Filter assets
  const filteredAssets = assets.filter(asset => {
    const warrantyStatus = getWarrantyStatus(asset.warrantyExpiry)
    
    const matchesSearch = 
      asset.assetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && warrantyStatus.status === "active") ||
      (statusFilter === "expiring-soon" && (warrantyStatus.status === "warning" || warrantyStatus.status === "critical")) ||
      (statusFilter === "expired" && warrantyStatus.status === "expired") ||
      (statusFilter === "no-info" && warrantyStatus.status === "no-info")
    
    const matchesType = typeFilter === "all" || asset.assetType === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const handleEditWarranty = (asset: Asset) => {
    setSelectedAsset(asset)
    setWarrantyDate(asset.warrantyExpiry || "")
    setIsEditDialogOpen(true)
  }

  const handleUpdateWarranty = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAsset) return
    
    updateWarrantyMutation.mutate({
      assetId: selectedAsset.assetId,
      warrantyExpiry: warrantyDate || null
    })
  }

  const getLocationName = (locationId: number | null) => {
    if (!locationId) return "Unassigned"
    const location = locations.find(loc => loc.id === locationId)
    return location ? `${location.outletName}, ${location.city}` : "Unknown"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified"
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (isLoading) {
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
      <SidebarTrigger data-testid="button-sidebar-toggle" className="mb-4 text-white/80 hover:text-white hover:bg-white/10 rounded-md" />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-400" />
            Warranty Management
          </h1>
          <p className="text-white/70 mt-1">
            Centralized warranty tracking and lifecycle management for enterprise assets
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Active Warranties</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeWarranties}</div>
            <p className="text-xs text-white/60">Currently under warranty coverage</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Expiring Soon</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-300">{expiringSoon}</div>
            <p className="text-xs text-white/60">Expiring within 90 days</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">Expired</CardTitle>
            <XCircle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-300">{expiredWarranties}</div>
            <p className="text-xs text-white/60">Warranty coverage ended</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white/90">No Information</CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{noWarrantyInfo}</div>
            <p className="text-xs text-white/60">Missing warranty data</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="glass-card p-4 space-y-4 border-0">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
              data-testid="input-search"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Warranty Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="no-info">No Information</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Asset Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {assetTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2 border-white/20 text-white hover:bg-white/10">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Warranty Table */}
      <Card className="glass-card border-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-white/5">
                <TableHead className="text-white/90">Asset ID</TableHead>
                <TableHead className="text-white/90">Details</TableHead>
                <TableHead className="text-white/90">Purchase Date</TableHead>
                <TableHead className="text-white/90">Warranty Expiry</TableHead>
                <TableHead className="text-white/90">Status</TableHead>
                <TableHead className="text-white/90">Days Remaining</TableHead>
                <TableHead className="text-white/90">Location</TableHead>
                <TableHead className="text-white/90 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.map((asset) => {
                const warrantyStatus = getWarrantyStatus(asset.warrantyExpiry)
                
                return (
                  <TableRow key={asset.assetId} className="border-white/10 hover:bg-white/5">
                    <TableCell>
                      <div className="font-mono text-white/90">{asset.assetId}</div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium text-white/90">{asset.brand} {asset.modelName}</div>
                        <div className="text-sm text-white/60">{asset.assetType}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/80">
                        <Calendar className="h-4 w-4 text-white/60" />
                        {formatDate(asset.purchaseDate)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-white/80">
                        <Clock className="h-4 w-4 text-white/60" />
                        {formatDate(asset.warrantyExpiry)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`${warrantyStatus.color} text-white border-0`}
                      >
                        {warrantyStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-white/80">
                        {warrantyStatus.days !== null ? (
                          warrantyStatus.status === 'expired' ? (
                            <span className="text-red-300">-{warrantyStatus.days} days</span>
                          ) : (
                            <span>{warrantyStatus.days} days</span>
                          )
                        ) : (
                          <span className="text-white/50">N/A</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-white/80">{getLocationName(asset.locationId)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditWarranty(asset)}
                        className="text-white/80 hover:text-white hover:bg-white/10"
                        data-testid={`button-edit-${asset.assetId}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {filteredAssets.length === 0 && (
            <div className="p-8 text-center text-white/60">
              No assets found matching your filters
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Warranty Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Warranty Information</DialogTitle>
            <DialogDescription>
              Modify warranty expiry date for {selectedAsset?.assetId}
            </DialogDescription>
          </DialogHeader>
          {selectedAsset && (
            <form onSubmit={handleUpdateWarranty} className="space-y-4">
              <div className="space-y-2">
                <Label>Asset Details</Label>
                <div className="p-3 rounded-lg bg-muted">
                  <div className="font-medium">{selectedAsset.brand} {selectedAsset.modelName}</div>
                  <div className="text-sm text-muted-foreground">{selectedAsset.assetType}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty-date">Warranty Expiry Date</Label>
                <Input
                  id="warranty-date"
                  type="date"
                  value={warrantyDate}
                  onChange={(e) => setWarrantyDate(e.target.value)}
                  data-testid="input-warranty-date"
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to remove warranty information
                </p>
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={updateWarrantyMutation.isPending}
                  data-testid="button-update-warranty"
                >
                  {updateWarrantyMutation.isPending ? "Updating..." : "Update Warranty"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
