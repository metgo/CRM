import { NextRequest } from "next/server";
import { listCollection, createInCollection } from "@/lib/mc/server/handler";
import { listTeam, createTeam } from "@/lib/mc/server/team";

interface RouteParams {
  params: Promise<{ coll: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { coll } = await params;
  if (coll === "users") return listTeam();
  return listCollection(req, coll);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { coll } = await params;
  if (coll === "users") return createTeam(req);
  return createInCollection(req, coll);
}
