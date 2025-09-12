import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Settings, 
  Webhook, 
  Database, 
  KeyRound, 
  CreditCard, 
  DollarSign, 
  Users, 
  FileText, 
  Package, 
  Link as LinkIcon,
  RotateCcw,
  Shield,
  BarChart3,
  Zap,
  ChevronDown
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useSandbox } from "@/contexts/SandboxContext";
import { useState } from "react";

// Main navigation items
const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Settings", url: "/settings/profile", icon: Settings },
];

// Payment processing section
const paymentItems = [
  { title: "Transactions", url: "/sandbox/transactions", icon: DollarSign },
  { title: "Checkout Sessions", url: "/sandbox/sessions", icon: CreditCard },
];

// Recurring payments section
const recurringItems = [
  { title: "Subscriptions", url: "/sandbox/subscriptions", icon: Database },
  { title: "Customers", url: "/sandbox/customers", icon: Users },
];

// Developer tools section
const developerItems = [
  { title: "API Keys", url: "/sandbox/api-keys", icon: KeyRound },
  { title: "Webhooks", url: "/sandbox/webhooks", icon: Webhook },
  { title: "SDK Setup", url: "/sandbox/sdk-setup", icon: Package },
  { title: "Payment Links", url: "/sandbox/payment-links/new", icon: LinkIcon },
];

// Additional tools
const toolsItems = [
  { title: "Products", url: "/sandbox/products", icon: Package },
  { title: "Documentation", url: "/docs", icon: FileText },
];

export function AppSidebar() {
  const location = useLocation();
  const { isSandboxMode } = useSandbox();
  const isActive = (path: string) => location.pathname === path;

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200">
      <SidebarHeader className="border-b border-gray-200">
        <div className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10">
              <img 
                src="/transactlab/4.png" 
                alt="TransactLab Logo" 
                className="w-6 h-6 object-contain group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:h-7"
              />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <div className="text-sm font-bold text-[#0a164d]">TransactLab</div>
              <div className="text-xs text-gray-500">Sandbox Mode</div>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-9 px-3 rounded-lg hover:bg-gray-100 data-[active=true]:bg-[#0a164d] data-[active=true]:text-white"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Payment Processing */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Payments
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {paymentItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-9 px-3 rounded-lg hover:bg-gray-100 data-[active=true]:bg-[#0a164d] data-[active=true]:text-white"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Recurring Payments */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recurring
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {recurringItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-9 px-3 rounded-lg hover:bg-gray-100 data-[active=true]:bg-[#0a164d] data-[active=true]:text-white"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Developer Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Developer
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {developerItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-9 px-3 rounded-lg hover:bg-gray-100 data-[active=true]:bg-[#0a164d] data-[active=true]:text-white"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {toolsItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={isActive(item.url)}
                    className="h-9 px-3 rounded-lg hover:bg-gray-100 data-[active=true]:bg-[#0a164d] data-[active=true]:text-white"
                  >
                    <NavLink to={item.url} end>
                      <item.icon className="mr-3 h-4 w-4" />
                      <span className="group-data-[collapsible=icon]:hidden font-medium">{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-200 p-4">
        <div className="group-data-[collapsible=icon]:hidden">
          <div className="text-xs text-gray-500 mb-1">Environment</div>
          <div className="text-sm font-medium text-[#0a164d]">Sandbox Mode</div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
