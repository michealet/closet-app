import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME, APP_PURPOSE } from "@/lib/app-config";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl">{APP_NAME}</h1>
          </CardTitle>
          <CardDescription>{APP_PURPOSE}</CardDescription>
          <p className="text-sm">Hello, world 👋</p>
        </CardHeader>
        <CardFooter>
          <Link
            href={signedIn ? "/account" : "/login"}
            className={buttonVariants({ size: "lg", className: "w-full" })}
          >
            {signedIn ? "Your account" : "Sign in"}
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
