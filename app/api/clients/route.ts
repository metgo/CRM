import { NextRequest } from "next/server";
import { listClients, createClient } from "@/lib/clients/service";

export async function GET(req: NextRequest) {
  return listClients(req);
}

export async function POST(req: NextRequest) {
  return createClient(req);
}
