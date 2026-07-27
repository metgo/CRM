import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getRepository, Communication } from "@/lib/db";

export async function POST(request: NextRequest) {
  const auth = await getCurrentUser();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { type, to_phone, to_email, subject, body: messageBody, client_id, contact_id } = body;

  if (!messageBody || !client_id) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const INFORU_USERNAME = process.env.INFORU_USERNAME;
  const INFORU_API_KEY = process.env.INFORU_API_KEY;
  const INFORU_SENDER = process.env.INFORU_SENDER_NAME ?? "MetGo";

  let inforuMessageId: string | null = null;
  let status = "logged";

  // Send via INFORU if credentials exist and contact info available
  if (INFORU_USERNAME && INFORU_API_KEY) {
    try {
      if (type === "sms" && to_phone) {
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<InforuXML>
  <User>
    <Username>${INFORU_USERNAME}</Username>
    <ApiKey>${INFORU_API_KEY}</ApiKey>
  </User>
  <Content>
    <Type>sms</Type>
    <SenderName>${INFORU_SENDER}</SenderName>
    <Message>${messageBody.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
  </Content>
  <Recipients>
    <PhoneNumber>${to_phone}</PhoneNumber>
  </Recipients>
</InforuXML>`;

        const response = await fetch(
          "https://api.inforu.co.il/SendMessageXml.ashx",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `InforuXML=${encodeURIComponent(xmlPayload)}`,
          }
        );
        const text = await response.text();
        const match = text.match(/<Id>([^<]+)<\/Id>/);
        inforuMessageId = match?.[1] ?? null;
        status = response.ok ? "sent" : "failed";
      } else if (type === "email" && to_email) {
        const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<InforuXML>
  <User>
    <Username>${INFORU_USERNAME}</Username>
    <ApiKey>${INFORU_API_KEY}</ApiKey>
  </User>
  <Content>
    <Type>email</Type>
    <SenderName>${INFORU_SENDER}</SenderName>
    <Subject>${subject ?? ""}</Subject>
    <Message>${messageBody.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>
  </Content>
  <Recipients>
    <Email>${to_email}</Email>
  </Recipients>
</InforuXML>`;

        const response = await fetch(
          "https://api.inforu.co.il/SendMessageXml.ashx",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `InforuXML=${encodeURIComponent(xmlPayload)}`,
          }
        );
        const text = await response.text();
        const match = text.match(/<Id>([^<]+)<\/Id>/);
        inforuMessageId = match?.[1] ?? null;
        status = response.ok ? "sent" : "failed";
      }
    } catch (err) {
      console.error("INFORU send error:", err);
      status = "failed";
    }
  } else {
    status = "pending";
  }

  // Log communication to database
  const commRepo = await getRepository(Communication);
  const communication = commRepo.create({
    clientId: client_id,
    contactId: contact_id ?? null,
    userId: auth.payload.userId,
    organizationId: auth.payload.organizationId,
    type,
    direction: "outbound",
    subject: subject ?? null,
    body: messageBody,
    status,
    inforuMessageId,
    sentAt: new Date(),
  });

  try {
    await commRepo.save(communication);
  } catch (error) {
    console.error("Failed to save communication:", error);
    return NextResponse.json({ error: "Failed to save communication" }, { status: 500 });
  }

  return NextResponse.json({ success: true, status, inforuMessageId });
}
