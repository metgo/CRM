import { NextRequest } from "next/server";
import { getOne, updateOne, deleteOne } from "@/lib/mc/server/handler";
import { getTeamMember, updateTeam, deleteTeam } from "@/lib/mc/server/team";

interface RouteParams {
  params: Promise<{ coll: string; id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  if (coll === "users") return getTeamMember(id);
  return getOne(req, coll, id);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  if (coll === "users") return updateTeam(req, id);
  return updateOne(req, coll, id);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { coll, id } = await params;
  if (coll === "users") return deleteTeam(id);
  return deleteOne(req, coll, id);
}
