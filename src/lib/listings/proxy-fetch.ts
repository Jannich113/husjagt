import http from "node:http";

const SOCKET = process.env.LISTINGS_PROXY_SOCKET || "/tmp/listings-proxy.sock";

export function proxyFetch(target: string, html = false): Promise<string | null> {
  const path = `/fetch?url=${encodeURIComponent(target)}${html ? "&html=1" : ""}`;
  return new Promise((resolve) => {
    const req = http.request(
      { socketPath: SOCKET, path, method: "GET", timeout: 25_000 },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(chunk as Buffer));
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            resolve(null);
            return;
          }
          resolve(Buffer.concat(chunks).toString("utf8"));
        });
      },
    );
    req.on("error", () => resolve(null));
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.end();
  });
}
