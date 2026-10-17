"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/**
 * Warns before leaving the creator with unsaved changes (OC-12): asks first
 * when a link inside the app is tapped, and lets the browser ask on reload or
 * closing the tab.
 */
export function LeaveGuard({ active }: { active: boolean }) {
  const router = useRouter();
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    // Capture runs before Next's Link handler, so the navigation can wait.
    const intercept = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const link = (event.target as Element | null)?.closest("a[href]");
      if (!(link instanceof HTMLAnchorElement) || link.target === "_blank")
        return;
      const url = new URL(link.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search)
        return;
      event.preventDefault();
      event.stopPropagation();
      setHref(url.pathname + url.search);
    };
    window.addEventListener("beforeunload", warn);
    document.addEventListener("click", intercept, true);
    return () => {
      window.removeEventListener("beforeunload", warn);
      document.removeEventListener("click", intercept, true);
    };
  }, [active]);

  return (
    <AlertDialog
      open={href !== null}
      onOpenChange={(open) => !open && setHref(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
          <AlertDialogDescription>
            Your outfit isn&apos;t saved. If you leave now, it will be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel size="lg">Keep editing</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            size="lg"
            onClick={() => {
              if (href) router.push(href);
              setHref(null);
            }}
          >
            Leave
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
