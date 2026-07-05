import { NextResponse } from "next/server";
import { MODULES } from "@mgcc/shared";

/**
 * Liveness / readiness probe for the standalone server.
 *
 * Returns basic service metadata plus the count of registered platform
 * modules, so a load balancer or container orchestrator can confirm the
 * executable is up and the shared registry loaded correctly.
 */
export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "mgcc-web",
    version: "0.0.1",
    modules: MODULES.length,
    timestamp: new Date().toISOString(),
  });
}
