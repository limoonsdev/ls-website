import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { serviceId } = body;

    const apiUrl = process.env.NODE_ENV === "development" 
      ? "http://localhost:3001/api/generate" 
      : "https://api.primegen.eu/api/generate";

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.API_KEY || "PRIMEGEN_MASTER_SECRET_2026"
      },
      body: JSON.stringify({ userId: session.user.id, serviceId })
    });

    const data = await res.json();
    return Response.json(data, { status: res.status });
  } catch (err) {
    return Response.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
