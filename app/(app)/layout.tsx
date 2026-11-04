import { Suspense } from "react";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSidebar } from "@/components/app-sidebar";
import { DemoBadge } from "@/components/brewing/demo-badge";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function SidebarFallback() {
  return <div className="hidden w-64 shrink-0 md:block" aria-hidden="true" />;
}

function BreadcrumbFallback() {
  return <div className="h-4 w-40 animate-pulse rounded bg-muted" aria-hidden="true" />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Suspense fallback={<SidebarFallback />}>
        <AppSidebar />
      </Suspense>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-4" />
          <Suspense fallback={<BreadcrumbFallback />}>
            <AppBreadcrumbs />
          </Suspense>
          <div className="ml-auto flex items-center gap-2">
            <DemoBadge />
            <ThemeSwitcher />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
