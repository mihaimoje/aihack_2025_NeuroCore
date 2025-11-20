import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  BarChart3,
  Activity,
  Settings,
  UsersRound,
  UserCircle,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

export const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { user } = useAuth();
  const collapsed = state === "collapsed";

  const adminItems = [
    { title: "Admin Dashboard", url: "/admin", icon: LayoutDashboard },
    { title: "User Management", url: "/admin/users", icon: UsersRound },
  ];

  const managerItems = [
    { title: "Dashboard", url: "/manager", icon: LayoutDashboard },
    { title: "Team Management", url: "/team", icon: Users },
    { title: "Projects", url: "/projects", icon: FolderKanban },
    { title: "Tasks", url: "/tasks", icon: CheckSquare },
    { title: "Insights", url: "/insights", icon: BarChart3 },
  ];

  const userItems = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "My Tasks", url: "/my-tasks", icon: CheckSquare },
    { title: "Projects", url: "/projects", icon: FolderKanban },
    { title: "Burnout", url: "/burnout", icon: Activity },
  ];

  const items = user?.role === "superadmin"
    ? adminItems
    : user?.role === "manager"
      ? managerItems
      : userItems;

  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4">
          <h1 className={`font-bold text-xl text-primary ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "TM" : "TeamManager"}
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "text-center" : ""}>
            {collapsed ? "Nav" : "Navigation"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
                      activeClassName="bg-primary text-primary-foreground font-medium"
                    >
                      <item.icon className={`h-5 w-5 ${collapsed ? "" : "flex-shrink-0"}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/profile"
                    className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
                    activeClassName="bg-primary text-primary-foreground font-medium"
                  >
                    <UserCircle className={`h-5 w-5 ${collapsed ? "" : "flex-shrink-0"}`} />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}
                    activeClassName="bg-primary text-primary-foreground font-medium"
                  >
                    <Settings className={`h-5 w-5 ${collapsed ? "" : "flex-shrink-0"}`} />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};
