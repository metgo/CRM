import { NextRequest } from "next/server";
import { getClient, updateClient, deleteClient } from "@/lib/clients/service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return getClient(req, id);
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return updateClient(req, id);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  return deleteClient(req, id);
}
