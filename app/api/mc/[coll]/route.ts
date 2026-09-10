import { NextRequest } from "next/server";
import { listCollection, createInCollection } from "@/lib/mc/server/handler";

interface RouteParams {
  params: Promise<{ coll: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { coll } = await params;
  return listCollection(req, coll);
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const { coll } = await params;
  return createInCollection(req, coll);
}
