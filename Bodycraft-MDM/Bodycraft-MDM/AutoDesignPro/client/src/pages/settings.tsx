import { useState } from "react";
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
  X
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState({
    companyName: "BODYCRAFT",
    logoUrl: "",
    timezone: "Asia/Kolkata",
    dateFormat: "DD/MM/YYYY",
    language: "en",
  });

  const [securitySettings, setSecuritySettings] = useState({
    sessionTimeout: 480,
    passwordMinLength: 8,
    emailNotificationsEnabled: true,
    maintenanceMode: false,
  });

  const [users, setUsers] = useState([
    { id: 1, username: "admin", email: "admin@bodycraft.com", role: "super_admin", status: "active", lastLogin: "2024-09-27" },
    { id: 2, username: "rajesh.kumar", email: "rajesh@bodycraft.com", role: "admin", status: "active", lastLogin: "2024-09-26" },
    { id: 3, username: "priya.sharma", email: "priya@bodycraft.com", role: "manager", status: "active", lastLogin: "2024-09-25" },
  ]);

  const [assetTypes, setAssetTypes] = useState([
    { id: 1, name: "Laptop", description: "Portable computers for mobile work", isActive: true },
    { id: 2, name: "Desktop", description: "Desktop computers for office use", isActive: true },
    { id: 3, name: "Monitor", description: "Display screens and monitors", isActive: true },
    { id: 4, name: "Mobile", description: "Mobile phones and tablets", isActive: true },
    { id: 5, name: "Router", description: "Network routers and switches", isActive: true },
    { id: 6, name: "Printer", description: "Printers and scanning devices", isActive: true },
  ]);

  const [locations, setLocations] = useState([
    { 
      id: 1, 
      outletName: "JP Nagar", 
      city: "Bangalore", 
      state: "Karnataka", 
      manager: "Rajesh Kumar", 
      contact: "rajesh@bodycraft.com",
      region: "South"
    },
    { 
      id: 2, 
      outletName: "Koramangala", 
      city: "Bangalore", 
      state: "Karnataka", 
      manager: "Priya Sharma", 
      contact: "priya@bodycraft.com",
      region: "South"
    },
    { 
      id: 3, 
      outletName: "Indiranagar", 
      city: "Bangalore", 
      state: "Karnataka", 
      manager: "Amit Singh", 
      contact: "amit@bodycraft.com",
      region: "South"
    },
  ]);

  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "user",
    password: "",
  });

  const [newAssetType, setNewAssetType] = useState({
    name: "",
    description: "",
  });

  const [newLocation, setNewLocation] = useState({
    outletName: "",
    city: "",
    state: "",
    address: "",
    manager: "",
    contact: "",
    region: "",
  });

  const handleSaveCompanySettings = () => {
    // TODO: Connect to API
    console.log("Saving company settings:", companySettings);
    alert("Company settings saved successfully!");
  };

  const handleSaveSecuritySettings = () => {
    // TODO: Connect to API
    console.log("Saving security settings:", securitySettings);
    alert("Security settings saved successfully!");
  };

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert("Please fill in all required fields");
      return;
    }
    
    const user = {
      id: users.length + 1,
      ...newUser,
      status: "active",
      lastLogin: "Never",
    };
    
    setUsers([...users, user]);
    setNewUser({ username: "", email: "", firstName: "", lastName: "", role: "user", password: "" });
    alert("User created successfully!");
  };

  const handleCreateAssetType = () => {
    if (!newAssetType.name) {
      alert("Asset type name is required");
      return;
    }
    
    const assetType = {
      id: assetTypes.length + 1,
      ...newAssetType,
      isActive: true,
    };
    
    setAssetTypes([...assetTypes, assetType]);
    setNewAssetType({ name: "", description: "" });
    alert("Asset type created successfully!");
  };

  const handleCreateLocation = () => {
    if (!newLocation.outletName || !newLocation.city || !newLocation.state) {
      alert("Please fill in all required fields");
      return;
    }
    
    const location = {
      id: locations.length + 1,
      ...newLocation,
    };
    
    setLocations([...locations, location]);
    setNewLocation({
      outletName: "",
      city: "",
      state: "",
      address: "",
      manager: "",
      contact: "",
      region: "",
    });
    alert("Location created successfully!");
  };

  const toggleUserStatus = (userId: number) => {
    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === "active" ? "inactive" : "active" }
        : user
    ));
  };

  const toggleAssetType = (assetTypeId: number) => {
    setAssetTypes(assetTypes.map(type => 
      type.id === assetTypeId 
        ? { ...type, isActive: !type.isActive }
        : type
    ));
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "super_admin": return "bg-red-500";
      case "admin": return "bg-blue-500";
      case "manager": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">System Settings</h1>
          <p className="text-muted-foreground">Configure your BODYCRAFT MDM system</p>
        </div>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Locations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Backup
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Settings
              </CardTitle>
              <CardDescription>
                Configure your company information and system preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={companySettings.companyName}
                      onChange={(e) => setCompanySettings({...companySettings, companyName: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select 
                      value={companySettings.timezone} 
                      onValueChange={(value) => setCompanySettings({...companySettings, timezone: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">Asia/Kolkata (India)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">America/New_York</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select 
                      value={companySettings.dateFormat} 
                      onValueChange={(value) => setCompanySettings({...companySettings, dateFormat: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="language">System Language</Label>
                    <Select 
                      value={companySettings.language} 
                      onValueChange={(value) => setCompanySettings({...companySettings, language: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="logo">Company Logo</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input type="file" accept="image/*" />
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload your company logo (max 2MB, PNG/JPG)
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveCompanySettings} className="bg-purple-600 hover:bg-purple-700">
                  Save Company Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage user accounts and permissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role.replace("_", " ")}
                        </Badge>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          Last login: {user.lastLogin}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                        >
                          {user.status === "active" ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={newUser.firstName}
                      onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                      placeholder="Enter first name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={newUser.lastName}
                      onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                      placeholder="Enter last name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      placeholder="Enter password"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleCreateUser} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Asset Configuration */}
        <TabsContent value="assets">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Asset Types
                </CardTitle>
                <CardDescription>
                  Configure asset categories and types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assetTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{type.name}</div>
                        <div className="text-sm text-muted-foreground">{type.description}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={type.isActive}
                          onCheckedChange={() => toggleAssetType(type.id)}
                        />
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Asset Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assetTypeName">Asset Type Name *</Label>
                    <Input
                      id="assetTypeName"
                      value={newAssetType.name}
                      onChange={(e) => setNewAssetType({...newAssetType, name: e.target.value})}
                      placeholder="e.g., Laptop, Desktop"
                    />
                  </div>
                  <div>
                    <Label htmlFor="assetTypeDescription">Description</Label>
                    <Textarea
                      id="assetTypeDescription"
                      value={newAssetType.description}
                      onChange={(e) => setNewAssetType({...newAssetType, description: e.target.value})}
                      placeholder="Brief description of this asset type"
                      rows={1}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleCreateAssetType} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Asset Type
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Location Setup */}
        <TabsContent value="locations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  BODYCRAFT Outlets
                </CardTitle>
                <CardDescription>
                  Manage all 32 BODYCRAFT outlet locations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {locations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{location.outletName}</div>
                        <div className="text-sm text-muted-foreground">
                          {location.city}, {location.state} • Manager: {location.manager}
                        </div>
                        <div className="text-sm text-muted-foreground">{location.contact}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{location.region}</Badge>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add New Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="outletName">Outlet Name *</Label>
                    <Input
                      id="outletName"
                      value={newLocation.outletName}
                      onChange={(e) => setNewLocation({...newLocation, outletName: e.target.value})}
                      placeholder="Enter outlet name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={newLocation.city}
                      onChange={(e) => setNewLocation({...newLocation, city: e.target.value})}
                      placeholder="Enter city"
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={newLocation.state}
                      onChange={(e) => setNewLocation({...newLocation, state: e.target.value})}
                      placeholder="Enter state"
                    />
                  </div>
                  <div>
                    <Label htmlFor="region">Region</Label>
                    <Select value={newLocation.region} onValueChange={(value) => setNewLocation({...newLocation, region: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="North">North</SelectItem>
                        <SelectItem value="South">South</SelectItem>
                        <SelectItem value="East">East</SelectItem>
                        <SelectItem value="West">West</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manager">Manager Name</Label>
                    <Input
                      id="manager"
                      value={newLocation.manager}
                      onChange={(e) => setNewLocation({...newLocation, manager: e.target.value})}
                      placeholder="Enter manager name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact">Contact Details</Label>
                    <Input
                      id="contact"
                      value={newLocation.contact}
                      onChange={(e) => setNewLocation({...newLocation, contact: e.target.value})}
                      placeholder="Email or phone"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                      placeholder="Complete address"
                      rows={2}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleCreateLocation} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure email alerts and notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Asset Assignment Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Send email when assets are assigned or returned
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Maintenance Due Reminders</div>
                    <div className="text-sm text-muted-foreground">
                      Alert when asset maintenance is due
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">System Health Alerts</div>
                    <div className="text-sm text-muted-foreground">
                      Notify when CCTV or biometric systems are offline
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Weekly Reports</div>
                    <div className="text-sm text-muted-foreground">
                      Send weekly asset utilization reports
                    </div>
                  </div>
                  <Switch />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Notification Recipients</Label>
                <div className="space-y-2">
                  <Input placeholder="admin@bodycraft.com" />
                  <Input placeholder="manager@bodycraft.com" />
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Recipient
                  </Button>
                </div>
              </div>

              <div className="flex justify-end">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Save Notification Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={securitySettings.sessionTimeout}
                      onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                    />
                    <p className="text-sm text-muted-foreground">
                      Users will be logged out after this period of inactivity
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
                    <Input
                      id="passwordMinLength"
                      type="number"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) => setSecuritySettings({...securitySettings, passwordMinLength: parseInt(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Email Notifications</div>
                      <div className="text-sm text-muted-foreground">
                        Enable system email notifications
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.emailNotificationsEnabled}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, emailNotificationsEnabled: checked})}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Maintenance Mode</div>
                      <div className="text-sm text-muted-foreground">
                        Restrict system access for maintenance
                      </div>
                    </div>
                    <Switch
                      checked={securitySettings.maintenanceMode}
                      onCheckedChange={(checked) => setSecuritySettings({...securitySettings, maintenanceMode: checked})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveSecuritySettings} className="bg-purple-600 hover:bg-purple-700">
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup & Maintenance */}
        <TabsContent value="backup">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Backup & Maintenance
                </CardTitle>
                <CardDescription>
                  Configure system backups and maintenance schedules
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Automatic Backups</Label>
                    <Select defaultValue="daily">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Backup Retention Period</Label>
                    <Select defaultValue="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Log Retention Period</Label>
                    <Select defaultValue="90">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="90">90 days</SelectItem>
                        <SelectItem value="180">180 days</SelectItem>
                        <SelectItem value="365">1 year</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h3 className="font-medium">Manual Actions</h3>
                  <div className="flex gap-2">
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Create Backup Now
                    </Button>
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Logs
                    </Button>
                    <Button variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear Old Logs
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Save Backup Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}