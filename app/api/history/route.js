import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = searchParams.get("limit") || 200;
    const service = searchParams.get("service") || "";
    const tier = searchParams.get("tier") || "";

    const apiUrl = process.env.NODE_ENV === "development" 
      ? `http://localhost:3001/api/history/${session.user.id}?limit=${limit}&service=${service}&tier=${tier}`
      : `https://api.primegen.eu/api/history/${session.user.id}?limit=${limit}&service=${service}&tier=${tier}`;

    const res = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": process.env.API_KEY || "PRIMEGEN_MASTER_SECRET_2026"
      }
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
