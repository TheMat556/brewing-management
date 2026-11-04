"use client";

import {
  Beer,
  BookOpen,
  FlaskConical,
  LayoutDashboard,
  Package,
  Settings2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavRecent } from "@/components/nav-projects";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { aktuellerBenutzer } from "@/lib/demo/zugang";

const data = {
  user: {
    name: aktuellerBenutzer.name,
    email: aktuellerBenutzer.email,
    avatar: "",
  },
  navMain: [
    {
      title: "Übersicht",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Lager",
      url: "/lager",
      icon: Package,
      items: [
        { title: "Bestand", url: "/lager" },
        { title: "Bewegungen", url: "/lager/bewegungen" },
        { title: "Rohstoffe", url: "/lager/rohstoffe" },
      ],
    },
    {
      title: "Rezepte",
      url: "/rezepte",
      icon: BookOpen,
    },
    {
      title: "Sude",
      url: "/sude",
      icon: FlaskConical,
    },
    {
      title: "Geräte",
      url: "/geraete",
      icon: Wrench,
    },
  ],
  recent: [
    { name: "Helles 2026", url: "/rezepte/1", icon: BookOpen },
    { name: "Sud 2026-004", url: "/sude/4", icon: FlaskConical },
    { name: "Cascade IPA", url: "/rezepte/3", icon: BookOpen },
  ],
  navSecondary: [
    { title: "Einstellungen", url: "/einstellungen", icon: Settings2 },
    { title: "Zugang", url: "/einstellungen/zugang", icon: ShieldCheck },
  ],
};

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Beer className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Brauerei</span>
                  <span className="truncate text-xs text-muted-foreground">Brewing Management</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavRecent items={data.recent} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
