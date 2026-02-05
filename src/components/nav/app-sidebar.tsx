"use client"
import { usePathname } from "next/navigation";
import { NavMain } from "@/components/nav/nav-main";
import { NavUser } from "@/components/nav/nav-user";
import { useAuth } from "@/services/auth/session";
import * as React from "react";
import { MENU } from "@/components/nav/items";
import { ENV } from "@/env";
import Image from "next/image";

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
  //const isAdmin = user?.role === "admin" && pathname.includes("/dashboard");
  const role = user?.role;
  const items = MENU[role as "admin" | "operational" | "commercial"] ?? MENU.user;

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5 justify-start"
            >
              <a href="/dashboard" className="hover:bg-transparent">
                <div className="flex items-start justify-start gap-3 px-2">
                  <Image
                    src="/logo-dark.png"
                    alt="Dominus Marketing"
                    width={140}
                    height={36}
                    className="hidden light:block h-7 w-auto"
                    priority
                  />
                  <Image
                    src="/logo-light.png"
                    alt="Dominus Marketing"
                    width={140}
                    height={36}
                    className="block light:hidden h-7 w-auto"
                    priority
                  />
                </div>
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
