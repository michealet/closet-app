import {
  CalendarDaysIcon,
  HeartIcon,
  LayersIcon,
  ShirtIcon,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

/** Home (FRD §4). The sections fill in as features 5, 7 and 8 land (HM-3–HM-5). */
export default async function HomePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", auth?.claims.sub ?? "")
    .maybeSingle();
  const name = profile?.display_name?.trim();

  return (
    <>
      <PageHeader
        title={name ? `Hi, ${name}` : "Welcome"}
        description="What should I wear today?"
      />

      <div className="mb-10 grid grid-cols-2 gap-3 sm:max-w-md">
        <Link
          href="/outfits/new"
          className={buttonVariants({ size: "lg", className: "w-full" })}
        >
          <LayersIcon aria-hidden />
          Create an outfit
        </Link>
        <Link
          href="/closet/new"
          className={buttonVariants({
            size: "lg",
            variant: "secondary",
            className: "w-full",
          })}
        >
          <ShirtIcon aria-hidden />
          Add clothing
        </Link>
      </div>

      <div className="flex flex-col gap-10">
        <HomeSection title="Recent outfits">
          <EmptyState
            icon={LayersIcon}
            title="No outfits yet"
            description="Put a few pieces together and your latest looks will show up here."
          />
        </HomeSection>
        <HomeSection title="Favorite outfits">
          <EmptyState
            icon={HeartIcon}
            title="No favorites yet"
            description="Tap the heart on an outfit to keep it close."
          />
        </HomeSection>
        <HomeSection title="Coming up">
          <EmptyState
            icon={CalendarDaysIcon}
            title="Nothing planned this week"
            description="Plan an outfit for a day or an event and it'll appear here."
          />
        </HomeSection>
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Created by Maya
      </p>
    </>
  );
}

function HomeSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-3 text-xl">{title}</h2>
      {children}
    </section>
  );
}
