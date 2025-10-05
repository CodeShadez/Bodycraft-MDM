import { Building2, Users, Laptop, MapPin, BarChart3, Cable, Fingerprint, Calendar, Settings, Wrench, Shield, LogOut, DollarSign } from "lucide-react"
import { Link, useLocation } from "wouter"
import { apiRequest, queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Main navigation items for BODYCRAFT MDM System
const navigationItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: BarChart3,
  },
  {
    title: "Assets",
    url: "/assets",
    icon: Laptop,
  },
  {
    title: "Employees",
    url: "/employees", 
    icon: Users,
  },
  {
    title: "Assignments",
    url: "/assignments",
    icon: Calendar,
  },
  {
    title: "Locations",
    url: "/locations",
    icon: MapPin,
  },
  {
    title: "Maintenance",
    url: "/maintenance",
    icon: Wrench,
  },
  {
    title: "Warranty",
    url: "/warranty",
    icon: Shield,
  },
]

// Integration management items
const integrationItems = [
  {
    title: "CCTV Systems",
    url: "/cctv",
    icon: Cable,
  },
  {
    title: "Biometric Systems", 
    url: "/biometric",
    icon: Fingerprint,
  },
]

// Reports and settings
const systemItems = [
  {
    title: "Reports",
    url: "/reports",
    icon: BarChart3,
  },
  {
    title: "Financial Overview",
    url: "/financial",
    icon: DollarSign,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppSidebar() {
  const [location, setLocation] = useLocation()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout")
      
      queryClient.clear()
      
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of the system",
      })
      
      setLocation("/login")
    } catch (error) {
      toast({
        title: "Logout failed",
        description: "An error occurred while logging out",
        variant: "destructive",
      })
    }
  }

  return (
    <Sidebar data-testid="sidebar-main" className="border-0 bg-transparent backdrop-blur-xl">
      <SidebarContent className="bg-transparent backdrop-blur-xl">
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-semibold flex items-center gap-2 text-white/90">
            <Building2 className="h-5 w-5 text-purple-400" />
            <span className="glass-gradient-text">BODYCRAFT</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Integrations</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {integrationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">System</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {systemItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={`link-${item.title.toLowerCase().replace(' ', '-')}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} data-testid="button-logout">
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}