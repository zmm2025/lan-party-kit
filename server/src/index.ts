import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import colyseus from "colyseus";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { LobbyRoom } from "./rooms/LobbyRoom.js";

const { Server } = colyseus;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = Number(process.env.PORT ?? 2567);
const app = express();
const clientPath = path.resolve(__dirname, "..", "..", "client");
const vendorPath = path.resolve(__dirname, "..", "node_modules", "colyseus.js", "dist");

app.use("/vendor", express.static(vendorPath));
app.use(express.static(clientPath));
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const gameServer = new Server({
  transport: new WebSocketTransport({ server })
});

gameServer.define("lobby", LobbyRoom);

gameServer.listen(port).then(() => {
  console.log(`Colyseus server listening on http://localhost:${port}`);
});
