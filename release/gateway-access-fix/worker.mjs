// Recovered gateway candidate: normal application login handles administrator access.
// The saved upstream configuration below is incomplete. Restore the current verified
// SERVICES entries before deployment; never replace live routing with empty upstreams.
const SERVICES = {
  "bible.heavenlykey.org":   { upstream: "", enabled: false, type: "public" },
  "global.heavenlykey.org":  { upstream: "", enabled: false, type: "public" },
  "app.heavenlykey.org":     { upstream: "", enabled: false, type: "public" },
  "radio.heavenlykey.org":   { upstream: "", enabled: false, type: "public" },
  "studio.heavenlykey.org":  { upstream: "", enabled: false, type: "public" },
  "control.heavenlykey.org": { upstream: "", enabled: false, type: "protected" },
  "admin.heavenlykey.org":   { upstream: "", enabled: false, type: "protected" },
};

const GATEWAY_SECRET = "";

function serviceName(host) {
  const parts = host.split(".");
  return parts.length >= 3 ? parts[0] : "service";
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const host = url.hostname;
    const cfg = SERVICES[host];
    if (!cfg) {
      return new Response("Not Found", { status: 404 });
    }
    const name = serviceName(host);
    if (!cfg.enabled || !cfg.upstream) {
      return new Response(
        JSON.stringify({ service: name, status: "pending", message: "The " + name + " service is being configured. Please check back soon." }),
        { status: 502, headers: { "content-type": "application/json", "retry-after": "3600" } }
      );
    }
    let upstreamBase = cfg.upstream;
    while (upstreamBase.endsWith("/")) upstreamBase = upstreamBase.slice(0, -1);
    const proxyUrl = upstreamBase + url.pathname + url.search;
    const reqHeaders = new Headers(request.headers);
    reqHeaders.delete("host");
    reqHeaders.set("x-forwarded-host", url.host);
    reqHeaders.set("x-forwarded-proto", "https");
    const cfIp = request.headers.get("cf-connecting-ip");
    if (cfIp) reqHeaders.set("x-forwarded-for", cfIp);
    if (GATEWAY_SECRET) reqHeaders.set("x-gateway-secret", GATEWAY_SECRET);
    const proxyReq = new Request(proxyUrl, {
      method: request.method,
      headers: reqHeaders,
      body: request.body,
      redirect: "manual",
    });
    let response;
    try {
      response = await fetch(proxyReq);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: "Gateway could not reach the " + name + " service.", service: name }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
    const respHeaders = new Headers(response.headers);
    const location = respHeaders.get("location");
    if (location) {
      try {
        const upstreamOrigin = new URL(cfg.upstream).origin;
        if (location.startsWith("/")) {
          // Relative redirect - already correct
        } else {
          const loc = new URL(location);
          if (loc.origin === upstreamOrigin) {
            respHeaders.set("location", loc.pathname + loc.search + loc.hash);
          }
        }
      } catch (_) {}
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: respHeaders,
    });
  },
};