import http from "node:http";

const TARGET_PORT = parseInt(process.env.TARGET_PORT || "20127", 10);
const LISTEN_PORT = parseInt(process.env.LISTEN_PORT || "20128", 10);

const server = http.createServer((clientReq, clientRes) => {
  const headers = { ...clientReq.headers, host: `127.0.0.1:${TARGET_PORT}` };

  const proxyReq = http.request(
    {
      hostname: "127.0.0.1",
      port: TARGET_PORT,
      path: clientReq.url,
      method: clientReq.method,
      headers,
    },
    (targetRes) => {
      clientRes.writeHead(targetRes.statusCode, targetRes.headers);
      targetRes.pipe(clientRes, { end: true });
    }
  );

  proxyReq.on("error", (err) => {
    clientRes.writeHead(502, { "Content-Type": "application/json" });
    clientRes.end(JSON.stringify({ error: "Nice Router on 20127 unavailable", details: err.message }));
  });

  clientReq.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, "127.0.0.1", () => {
  console.log(`[NiceRouter] Port Bridge listening on http://127.0.0.1:${LISTEN_PORT} -> http://127.0.0.1:${TARGET_PORT}`);
});
