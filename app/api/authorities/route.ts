import { NextRequest } from "next/server";
import { listClients, createClient } from "@/lib/clients/service";

const AUTHORITY_TYPE = "authority";

export async function GET(req: NextRequest) {
  return listClients(req, AUTHORITY_TYPE);
}

export async function POST(req: NextRequest) {
  return createClient(req, AUTHORITY_TYPE);
}
