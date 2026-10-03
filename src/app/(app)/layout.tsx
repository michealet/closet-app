import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AddMenu } from "@/components/shared/add-menu";
import { BottomNav, SideNav } from "@/components/shared/app-nav";
import { createClient } from "@/lib/supabase/server";

/** Shell for every signed-in page: tab bar on phones, sidebar on desktop (FRD §3). */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  // src/proxy.ts already redirects signed-out users; this is defense in depth.
  if (!data?.claims) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <SideNav>
        <AddMenu />
      </SideNav>
      <main className="flex-1 px-4 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:ml-60 md:px-10 md:pt-10 md:pb-10">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>
      <AddMenu floating />
      <BottomNav />
    </div>
  );
}
