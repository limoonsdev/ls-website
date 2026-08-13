import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { decryptPayload, encryptPayload } from "@/lib/crypto";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    const encryptedBody = await req.text();
    let payload;
    try {
      payload = decryptPayload(encryptedBody);
    } catch (e) {
      return new Response("Bad Request: Invalid Payload", { status: 400 });
    }

    const { targetUrl, method, body } = payload;
    if (!targetUrl) return new Response("Bad Request: Missing Target", { status: 400 });

    if (!targetUrl.startsWith('/api-bot/')) {
       return new Response("Forbidden Target", { status: 403 });
    }

    const cleanPath = targetUrl.replace('/api-bot/', '/api/');
    
    const apiUrl = process.env.NODE_ENV === "development" 
      ? `http://localhost:3001${cleanPath}` 
      : `https://api.primegen.eu${cleanPath}`;

    const headers = {
      "Content-Type": "application/json",
      "x-api-key": process.env.API_KEY || "PRIMEGEN_MASTER_SECRET_2026",
      "x-user-id": session.user.id
    };

    const options = {
      method: method || 'GET',
      headers
    };

    if (body && (method !== 'GET' && method !== 'HEAD')) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }

    const botRes = await fetch(apiUrl, options);
    
    let botData;
    const contentType = botRes.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      botData = await botRes.json();
    } else {
      botData = await botRes.text();
    }

    const encryptedOutput = encryptPayload(botData);
    
    return new Response(encryptedOutput, {
      status: botRes.status,
      headers: { "Content-Type": "text/plain" }
    });
  } catch (err) {
    console.error("Proxy Error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
