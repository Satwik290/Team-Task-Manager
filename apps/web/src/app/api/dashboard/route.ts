import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/queries";

export async function GET() {
  try {
    const user = await requireUser();
    const dashboard = await getDashboardData(user);
    return NextResponse.json(dashboard);
  } catch (error) {
    return jsonError(error);
  }
}
