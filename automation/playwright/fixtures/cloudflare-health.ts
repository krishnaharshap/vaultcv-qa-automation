// Pre-flight check for the known Cloudflare Tunnel 1033 / HTTP 530 issue. Run
// before the real suite so an infra outage is reported distinctly from a
// genuine test failure. RCA: knowledge-base/03_chat_cloudflare_error_1033_analysis.md.

export interface HealthCheckResult {
  healthy: boolean;
  status?: number;
  detail: string;
}

export async function checkCloudflareHealth(baseUrl: string): Promise<HealthCheckResult> {
  try {
    const res = await fetch(baseUrl, { method: "GET", redirect: "manual" });

    // Cloudflare surfaces tunnel-down as HTTP 530 (with a 1033 body code).
    if (res.status === 530) {
      return {
        healthy: false,
        status: res.status,
        detail:
          "Cloudflare Tunnel error (HTTP 530 / 1033) — known open issue. Live-site testing is blocked until the tunnel is restored.",
      };
    }

    // 2xx or a redirect (auth apps commonly 3xx unauthenticated roots) = edge is up.
    const ok = res.ok || (res.status >= 300 && res.status < 400);
    return {
      healthy: ok,
      status: res.status,
      detail: ok ? "Edge reachable" : `Unexpected status ${res.status}`,
    };
  } catch (err) {
    return { healthy: false, detail: `Fetch failed (DNS/network/edge down): ${String(err)}` };
  }
}
