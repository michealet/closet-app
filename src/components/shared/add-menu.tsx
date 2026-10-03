"use client";

import { LayersIcon, PlusIcon, ShirtIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLinkItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ADD_ACTIONS = [
  { href: "/closet/new", label: "Add clothing", icon: ShirtIcon },
  { href: "/outfits/new", label: "Create outfit", icon: LayersIcon },
] as const;

/**
 * "+" menu for Add Clothing and Create Outfit, reachable from every page in
 * two taps (FRD NV-3). `floating` is the round button above the phone tab bar;
 * otherwise it renders as a full-width sidebar button.
 */
export function AddMenu({ floating = false }: { floating?: boolean }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Add"
        className={cn(
          "inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground transition-colors outline-none hover:bg-primary/85 focus-visible:ring-3 focus-visible:ring-ring/50",
          floating
            ? "fixed right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-soft md:hidden"
            : "h-11 w-full rounded-lg text-sm font-medium",
        )}
      >
        <PlusIcon className={floating ? "size-6" : "size-5"} aria-hidden />
        {!floating && "Add"}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side={floating ? "top" : "bottom"}
        align={floating ? "end" : "start"}
        sideOffset={8}
        className="w-52 p-1.5"
      >
        {ADD_ACTIONS.map(({ href, label, icon: Icon }) => (
          <DropdownMenuLinkItem
            key={href}
            render={<Link href={href} />}
            className="h-11 gap-3 px-3 text-base"
          >
            <Icon className="size-5 text-brand" aria-hidden />
            {label}
          </DropdownMenuLinkItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
