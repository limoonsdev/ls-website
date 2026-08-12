import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const apiUrl = process.env.NODE_ENV === "development" 
      ? `http://localhost:3001/api/tickets/${session.user.id}/${id}`
      : `https://api.primegen.eu/api/tickets/${session.user.id}/${id}`;

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
