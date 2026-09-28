import { APP_NAME, APP_PURPOSE } from "@/lib/app-config";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            <h1 className="text-2xl">{APP_NAME}</h1>
          </CardTitle>
          <CardDescription>{APP_PURPOSE}</CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
