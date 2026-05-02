import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function LoadingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-5 py-6">
      <div className="h-16 rounded-lg bg-muted" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="h-4 w-28 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-4 w-36 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </section>
      <div className="h-96 rounded-lg border bg-card" />
    </main>
  );
}
