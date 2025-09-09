import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Settings, Play, Webhook, Database, KeyRound, CreditCard, DollarSign, Users, FileText } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAppStore } from "@/store/appStore";
import { useSandbox } from "@/contexts/SandboxContext";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Docs", url: "/docs", icon: FileText },
  { title: "Settings", url: "/settings/profile", icon: Settings },
];

const sandboxItems = [
  // { title: "Overview", url: "/sandbox", icon: Play },
  { title: "API Keys", url: "/sandbox/api-keys", icon: KeyRound },
  { title: "Checkout Sessions", url: "/sandbox/sessions", icon: CreditCard },
  { title: "Subscriptions", url: "/sandbox/subscriptions", icon: Database },
  { title: "Transactions", url: "/sandbox/transactions", icon: DollarSign },
  { title: "Customers", url: "/sandbox/customers", icon: Users },
  { title: "Products", url: "/sandbox/products", icon: Database },
  { title: "Webhooks", url: "/sandbox/webhooks", icon: Webhook },
];

export function AppSidebar() {
  const location = useLocation();
  const { currentUser } = useAppStore();
  const { isSandboxMode } = useSandbox();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="px-3 py-3 text-sm font-semibold text-[#0a164d]">
          Transactlab Sandbox
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Core</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Sandbox Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Sandbox</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sandboxItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink to={item.url} end>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
