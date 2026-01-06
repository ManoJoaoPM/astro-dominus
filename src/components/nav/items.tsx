import {
  IconChartFunnel,
  IconDashboard,
  IconFlame,
  IconSearch,
  IconShare,
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
      title: "Scraper",
      url: "/dashboard/leads/scraper",
      icon: IconSearch,
    },
    {
      title: "Export",
      url: "/dashboard/leads/export",
      icon: IconShare,
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
      title: "Scraper",
      url: "/dashboard/leads/scraper",
      icon: IconSearch,
    },
    {
      title: "Qualificação",
      url: "/dashboard/leads/qualification",
      icon: IconChartFunnel,
    },
    {
      title: "Export",
      url: "/dashboard/leads/export",
      icon: IconShare,
    },
    {
      title: "Clientes",
      url: "/dashboard/clients",
      icon: IconUsers,
    },
  ]
} as any;