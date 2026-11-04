import { Suspense } from "react";

import { AppBreadcrumbs } from "@/components/app-breadcrumbs";
import { AppSidebar } from "@/components/app-sidebar";
import { DemoBadge } from "@/components/brewing/demo-badge";
import { ClientOnly } from "@/components/client-only";
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
        <ClientOnly fallback={<SidebarFallback />}>
          <AppSidebar />
        </ClientOnly>
      </Suspense>
      <SidebarInset className="min-w-0">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
          <SidebarTrigger className="-ml-1 shrink-0" />
          <Separator
            orientation="vertical"
            className="mr-1 hidden data-[orientation=vertical]:h-4 sm:block"
          />
          <div className="min-w-0 flex-1 overflow-hidden">
            <ClientOnly fallback={<BreadcrumbFallback />}>
              <Suspense fallback={<BreadcrumbFallback />}>
                <AppBreadcrumbs />
              </Suspense>
            </ClientOnly>
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden sm:block">
              <DemoBadge />
            </div>
            <ThemeSwitcher />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-4 p-3 sm:gap-6 sm:p-4 md:p-6 [&>*]:min-w-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
