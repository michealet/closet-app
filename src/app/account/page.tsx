import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Account" };

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  // src/proxy.ts already redirects signed-out users; this is defense in depth.
  if (!claims) redirect("/login?next=/account");

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", claims.sub)
    .single();
  if (error) throw new Error("Could not load your profile.");

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>
            <h1 className="text-xl">Account</h1>
          </CardTitle>
          <CardDescription>Signed in as {claims.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm displayName={profile.display_name ?? ""} />
        </CardContent>
        <CardFooter>
          <form action="/auth/signout" method="post" className="w-full">
            <Button
              type="submit"
              variant="outline"
              size="lg"
              className="w-full"
            >
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
