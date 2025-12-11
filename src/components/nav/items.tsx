import {
  IconChartFunnel,
  IconDashboard,
  IconFlame,
  IconUsers,
} from "@tabler/icons-react";

export const MENU = {
  operational: [
    {
      title: "Clientes",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
  ],
  commercial: [
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: IconFlame,
    },
    {
      title: "Qualificação",
      url: "/dashboard/leads/qualification",
      icon: IconChartFunnel,
    },
  ],
  admin: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Usuários",
      url: "/dashboard/users",
      icon: IconUsers,
    },
    {
      title: "Leads",
      url: "/dashboard/leads",
      icon: IconFlame,
    },
    {
      title: "Qualificação",
      url: "/dashboard/leads/qualification",
      icon: IconChartFunnel,
    },
    {
      title: "Clientes",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
  ]
} as any;