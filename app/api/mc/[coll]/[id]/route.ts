import { NextRequest } from "next/server";
import { getOne, updateOne, deleteOne } from "@/lib/mc/server/handler";

interface RouteParams {
  params: Promise<{ coll: string; id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  return getOne(req, coll, id);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  return updateOne(req, coll, id);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  return deleteOne(req, coll, id);
}
