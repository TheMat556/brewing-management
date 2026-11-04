"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const segmentLabels: Record<string, string> = {
  dashboard: "Übersicht",
  lager: "Lager",
  bewegungen: "Bewegungen",
  rohstoffe: "Rohstoffe",
  chargen: "Chargen",
  rezepte: "Rezepte",
  sude: "Sude",
  geraete: "Geräte",
  einstellungen: "Einstellungen",
  zugang: "Zugang",
};

function labelFor(segment: string): string {
  return segmentLabels[segment] ?? (/^\d+$/.test(segment) ? "Detail" : segment);
}

export function AppBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || segments[0] === "dashboard") {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Übersicht</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  const crumbs = segments.map((segment, index) => ({
    label: labelFor(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link href="/dashboard">Übersicht</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <Fragment key={crumb.href}>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
