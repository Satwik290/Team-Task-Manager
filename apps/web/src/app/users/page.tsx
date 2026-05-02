import { requireAdmin } from "@/lib/auth";
import { prisma } from "@repo/db";
import { UserManagement } from "@/components/user-management";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function UsersPage() {
  const admin = await requireAdmin();
  
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serializedUsers = users.map(user => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  }));

  return (
    <main className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/">
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">System Administration</h1>
          </div>
        </div>
        
        <UserManagement 
          users={serializedUsers} 
          currentUserId={admin.id} 
        />
      </div>
    </main>
  );
}
