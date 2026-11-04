"use client";

import { type ReactNode, useEffect, useState } from "react";

/**
 * Renders children only after the first client mount. Use this for UI that
 * depends on `usePathname()` when the shell is prerendered behind Suspense.
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? children : fallback;
}
