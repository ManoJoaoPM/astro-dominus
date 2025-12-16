"use client"
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav/nav-main";
import { NavUser } from "@/components/nav/nav-user";
import { useAuth } from "@/services/auth/session";
import * as React from "react";
import { MENU } from "@/components/nav/items";
import { ENV_PUBLIC } from "@/env.public";

import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  Sidebar,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.role === "admin" && pathname.includes("/dashboard");
  const items = isAdmin ? MENU.admin : MENU.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 justify-center"
            >
              <a href="/dashboard">
                <span className="text-base font-semibold">{ENV_PUBLIC.NEXT_PUBLIC_APP_NAME}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-y-hidden">
        <NavMain items={items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
