import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Package, 
  MapPin, 
  Settings, 
  Shield, 
  Database,
  Bell,
  Upload,
  Download,
  Trash2,
  Edit,
  Plus,
  Check,
  X,
  Link as LinkIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";

interface CompanySettings {
  companyName: string;
  logoUrl: string;
  timezone: string;
  dateFormat: string;
  language: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  lastLogin: string | null;
  locationId: number | null;
}

interface AssetType {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const { data: currentUser } = useUser();
  
  // Fetch company settings
  const { data: companySettings, isLoading: loadingCompanySettings } = useQuery<CompanySettings>({
    queryKey: ["/api/settings/company"],
  });

  // Fetch users
  const { data: users, isLoading: loadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: currentUser?.user?.role === 'super_admin' || currentUser?.user?.role === 'admin',
  });

  // Fetch asset types
  const { data: assetTypes, isLoading: loadingAssetTypes } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });

  const [editingCompanySettings, setEditingCompanySettings] = useState<CompanySettings | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
    password: "",
    locationId: null as number | null,
  });
  const [newAssetType, setNewAssetType] = useState({
    name: "",
    description: "",
  });

  // Update company settings mutation
  const updateCompanySettingsMutation = useMutation({
    mutationFn: async (settings: CompanySettings) => {
      return await apiRequest("PATCH", "/api/settings/company", settings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/company"] });
      toast({
        title: "Success",
        description: "Company settings updated successfully",
      });
      setEditingCompanySettings(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update company settings",
        variant: "destructive",
      });
    },
  });

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUser) => {
      return await apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setNewUser({ 
        username: "", 
        email: "", 
        firstName: "", 
        lastName: "", 
        role: "user", 
        password: "",
        locationId: null,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return await apiRequest("PATCH", `/api/users/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  // Create asset type mutation
  const createAssetTypeMutation = useMutation({
    mutationFn: async (assetTypeData: typeof newAssetType) => {
      return await apiRequest("POST", "/api/asset-types", assetTypeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      toast({
        title: "Success",
        description: "Asset type created successfully",
      });
      setNewAssetType({ name: "", description: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create asset type",
        variant: "destructive",
      });
    },
  });

  const handleSaveCompanySettings = () => {
    if (editingCompanySettings) {
      updateCompanySettingsMutation.mutate(editingCompanySettings);
    }
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.firstName || !newUser.lastName || !newUser.password) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast({
        title: "Validation Error",
        description: "Password must be at least 8 characters",
        variant: "destructive",
      });
      return;
    }
    
    createUserMutation.mutate(newUser);
  };

  const handleToggleUserStatus = (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    updateUserMutation.mutate({ id: userId, status: newStatus });
  };

  const handleCreateAssetType = () => {
    if (!newAssetType.name) {
      toast({
        title: "Validation Error",
        description: "Asset type name is required",
        variant: "destructive",
      });
      return;
    }
    
    createAssetTypeMutation.mutate(newAssetType);
  };

  const isSuperAdmin = currentUser?.user?.role === 'super_admin';
  const isAdmin = currentUser?.user?.role === 'admin' || isSuperAdmin;

  return (
    <div className="min-h-screen glass-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="glass-card p-2" />
            <div>
              <h1 className="text-3xl font-bold text-white/90 flex items-center gap-3">
                <Settings className="h-8 w-8 text-purple-400" />
                System Settings
              </h1>
              <p className="text-white/60 mt-1">Manage system configuration and preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="company" className="space-y-6">
          <TabsList className="glass-card">
            <TabsTrigger value="company" data-testid="tab-company">
              <Building2 className="h-4 w-4 mr-2" />
              Company
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="users" data-testid="tab-users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
            )}
            <TabsTrigger value="assets" data-testid="tab-assets">
              <Package className="h-4 w-4 mr-2" />
              Asset Types
            </TabsTrigger>
            <TabsTrigger value="locations" data-testid="tab-locations">
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="security" data-testid="tab-security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Company Settings */}
          <TabsContent value="company" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Building2 className="h-5 w-5 text-purple-400" />
                  Company Information
                </CardTitle>
                <CardDescription className="text-white/60">
                  Update your organization details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {loadingCompanySettings ? (
                  <div className="text-white/60">Loading company settings...</div>
                ) : (
                  <>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="text-white/80">Company Name</Label>
                        <Input
                          id="companyName"
                          value={editingCompanySettings?.companyName || companySettings?.companyName || ""}
                          onChange={(e) => setEditingCompanySettings({
                            ...(editingCompanySettings || companySettings || {} as CompanySettings),
                            companyName: e.target.value
                          })}
                          placeholder="BODYCRAFT"
                          className="glass-input"
                          data-testid="input-company-name"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-white/80">Timezone</Label>
                        <Select
                          value={editingCompanySettings?.timezone || companySettings?.timezone || "Asia/Kolkata"}
                          onValueChange={(value) => setEditingCompanySettings({
                            ...(editingCompanySettings || companySettings || {} as CompanySettings),
                            timezone: value
                          })}
                        >
                          <SelectTrigger className="glass-input" data-testid="select-timezone">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="America/New_York">America/New York (EST)</SelectItem>
                            <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateFormat" className="text-white/80">Date Format</Label>
                        <Select
                          value={editingCompanySettings?.dateFormat || companySettings?.dateFormat || "DD/MM/YYYY"}
                          onValueChange={(value) => setEditingCompanySettings({
                            ...(editingCompanySettings || companySettings || {} as CompanySettings),
                            dateFormat: value
                          })}
                        >
                          <SelectTrigger className="glass-input" data-testid="select-date-format">
                            <SelectValue placeholder="Select date format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                            <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                            <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language" className="text-white/80">Language</Label>
                        <Select
                          value={editingCompanySettings?.language || companySettings?.language || "en"}
                          onValueChange={(value) => setEditingCompanySettings({
                            ...(editingCompanySettings || companySettings || {} as CompanySettings),
                            language: value
                          })}
                        >
                          <SelectTrigger className="glass-input" data-testid="select-language">
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="hi">Hindi</SelectItem>
                            <SelectItem value="ta">Tamil</SelectItem>
                            <SelectItem value="te">Telugu</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button 
                        onClick={handleSaveCompanySettings} 
                        disabled={!editingCompanySettings || updateCompanySettingsMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-blue-500"
                        data-testid="button-save-company-settings"
                      >
                        {updateCompanySettingsMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      {editingCompanySettings && (
                        <Button 
                          variant="outline" 
                          onClick={() => setEditingCompanySettings(null)}
                          data-testid="button-cancel-company-settings"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          {isAdmin && (
            <TabsContent value="users" className="space-y-6">
              <Card className="glass-card border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white/90">
                    <Users className="h-5 w-5 text-purple-400" />
                    User Management
                  </CardTitle>
                  <CardDescription className="text-white/60">
                    Create and manage user accounts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Create New User Form - Super Admin Only */}
                  {isSuperAdmin && (
                    <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
                      <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                        <Plus className="h-5 w-5 text-purple-400" />
                        Create New User
                      </h3>
                      
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="new-username" className="text-white/80">Username *</Label>
                          <Input
                            id="new-username"
                            value={newUser.username}
                            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                            placeholder="Enter username"
                            className="glass-input"
                            data-testid="input-new-username"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-email" className="text-white/80">Email *</Label>
                          <Input
                            id="new-email"
                            type="email"
                            value={newUser.email}
                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                            placeholder="Enter email"
                            className="glass-input"
                            data-testid="input-new-email"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-first-name" className="text-white/80">First Name *</Label>
                          <Input
                            id="new-first-name"
                            value={newUser.firstName}
                            onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                            placeholder="Enter first name"
                            className="glass-input"
                            data-testid="input-new-firstname"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-last-name" className="text-white/80">Last Name *</Label>
                          <Input
                            id="new-last-name"
                            value={newUser.lastName}
                            onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                            placeholder="Enter last name"
                            className="glass-input"
                            data-testid="input-new-lastname"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-role" className="text-white/80">Role *</Label>
                          <Select
                            value={newUser.role}
                            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                          >
                            <SelectTrigger className="glass-input" data-testid="select-new-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="manager">Manager</SelectItem>
                              <SelectItem value="user">User</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="new-password" className="text-white/80">Password * (min 8 characters)</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newUser.password}
                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                            placeholder="Enter password"
                            className="glass-input"
                            data-testid="input-new-password"
                          />
                        </div>
                      </div>

                      <Button 
                        onClick={handleCreateUser} 
                        disabled={createUserMutation.isPending}
                        className="bg-gradient-to-r from-purple-500 to-blue-500"
                        data-testid="button-create-user"
                      >
                        {createUserMutation.isPending ? "Creating..." : "Create User"}
                      </Button>
                    </div>
                  )}

                  {/* Existing Users List */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white/90">Existing Users</h3>
                    
                    {loadingUsers ? (
                      <div className="text-white/60">Loading users...</div>
                    ) : users && users.length > 0 ? (
                      <div className="space-y-3">
                        {users.map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                            data-testid={`user-item-${user.id}`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <h4 className="font-medium text-white/90">{user.firstName} {user.lastName}</h4>
                                <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                                  {user.status}
                                </Badge>
                                <Badge variant="outline">{user.role}</Badge>
                              </div>
                              <div className="text-sm text-white/60 mt-1">
                                {user.email} • @{user.username}
                                {user.lastLogin && ` • Last login: ${new Date(user.lastLogin).toLocaleDateString()}`}
                              </div>
                            </div>
                            
                            {isSuperAdmin && user.id !== currentUser?.user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleToggleUserStatus(user.id, user.status)}
                                disabled={updateUserMutation.isPending}
                                data-testid={`button-toggle-status-${user.id}`}
                              >
                                {user.status === 'active' ? 'Deactivate' : 'Activate'}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-white/60">No users found.</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Asset Types */}
          <TabsContent value="assets" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Package className="h-5 w-5 text-purple-400" />
                  Asset Type Configuration
                </CardTitle>
                <CardDescription className="text-white/60">
                  Define the types of assets tracked in your system
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Create New Asset Type */}
                <div className="p-6 rounded-lg bg-white/5 border border-white/10 space-y-4">
                  <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                    <Plus className="h-5 w-5 text-purple-400" />
                    Add Asset Type
                  </h3>
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="asset-type-name" className="text-white/80">Type Name *</Label>
                      <Input
                        id="asset-type-name"
                        value={newAssetType.name}
                        onChange={(e) => setNewAssetType({ ...newAssetType, name: e.target.value })}
                        placeholder="e.g., Laptop, Desktop"
                        className="glass-input"
                        data-testid="input-asset-type-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="asset-type-description" className="text-white/80">Description</Label>
                      <Input
                        id="asset-type-description"
                        value={newAssetType.description}
                        onChange={(e) => setNewAssetType({ ...newAssetType, description: e.target.value })}
                        placeholder="Brief description of this asset type"
                        className="glass-input"
                        data-testid="input-asset-type-description"
                      />
                    </div>
                  </div>

                  <Button 
                    onClick={handleCreateAssetType}
                    disabled={createAssetTypeMutation.isPending}
                    className="bg-gradient-to-r from-purple-500 to-blue-500"
                    data-testid="button-create-asset-type"
                  >
                    {createAssetTypeMutation.isPending ? "Creating..." : "Add Asset Type"}
                  </Button>
                </div>

                {/* Existing Asset Types */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white/90">Existing Asset Types</h3>
                  
                  {loadingAssetTypes ? (
                    <div className="text-white/60">Loading asset types...</div>
                  ) : assetTypes && assetTypes.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {assetTypes.map((type) => (
                        <div
                          key={type.id}
                          className="p-4 rounded-lg bg-white/5 border border-white/10"
                          data-testid={`asset-type-${type.id}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-white/90">{type.name}</h4>
                            <Badge variant={type.isActive ? 'default' : 'secondary'}>
                              {type.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          {type.description && (
                            <p className="text-sm text-white/60">{type.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60">No asset types found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Locations - Link to Locations Page */}
          <TabsContent value="locations" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <MapPin className="h-5 w-5 text-purple-400" />
                  Location Management
                </CardTitle>
                <CardDescription className="text-white/60">
                  Manage all 32 BODYCRAFT retail outlets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-8 text-center bg-white/5 border border-white/10 rounded-lg">
                  <MapPin className="h-16 w-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white/90 mb-2">
                    Location Configuration
                  </h3>
                  <p className="text-white/60 mb-6">
                    Full location management is available on the dedicated Locations page with advanced features.
                  </p>
                  <Link href="/locations">
                    <Button className="bg-gradient-to-r from-purple-500 to-blue-500" data-testid="button-goto-locations">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Go to Locations Page
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white/90">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Security & Privacy
                </CardTitle>
                <CardDescription className="text-white/60">
                  Configure security policies and system protection
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium text-white/90">Role-Based Access Control (RBAC)</h4>
                      <p className="text-sm text-white/60 mt-1">Location-based data isolation is active</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium text-white/90">Session Timeout</h4>
                      <p className="text-sm text-white/60 mt-1">Auto logout after 480 minutes of inactivity</p>
                    </div>
                    <Badge variant="outline">8 hours</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium text-white/90">Password Policy</h4>
                      <p className="text-sm text-white/60 mt-1">Minimum 8 characters with bcrypt hashing</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium text-white/90">Database Encryption</h4>
                      <p className="text-sm text-white/60 mt-1">PostgreSQL with encrypted connections</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <h4 className="font-medium text-white/90">Approval Workflows</h4>
                      <p className="text-sm text-white/60 mt-1">Multi-level approvals for asset transfers</p>
                    </div>
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="text-sm text-white/60">
                  <p className="font-medium text-white/80 mb-2">Security Features:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Production-ready RBAC with location-based isolation</li>
                    <li>Secure session management with PostgreSQL</li>
                    <li>Password hashing with bcrypt (10 rounds)</li>
                    <li>Defense-in-depth security architecture</li>
                    <li>Complete audit trails for all transactions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
