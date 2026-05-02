import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
        <h1 className="text-xl font-semibold">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This route is not part of the task manager workspace.
        </p>
        <Button asChild className="mt-5">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>
    </main>
  );
}
