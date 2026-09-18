import { db } from "@/lib/db";
import { getLogger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = performance.now();

  try {
    await db.$queryRaw`SELECT 1`;
    return Response.json({
      status: "ok",
      database: "connected",
      timestamp: new Date().toISOString(),
      responseTimeMs: Math.round(performance.now() - startedAt),
    });
  } catch (error) {
    getLogger().error({ err: error }, "health check failed");
    return Response.json({
      status: "unavailable",
      database: "disconnected",
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
}
